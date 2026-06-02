import Phaser from 'phaser';

import GameCard from '../objects/GameCard';

import { dataStore } from '../core/DataStore';

import { parseAutomationConfig, REGISTRY_AUTOMATION_CONFIG } from '../core/automationConfig';

import {

  buildAutomationGraph,

  findDevice,

  findSortHandsViaGraph,

  getLinkedDepotForSortHand,

  getLinkedFacilityForSortHand,

  getRelayForFacility,

  getSortHandDownstream,

  isActiveCollectorChain,

  isActiveFacilityRelayChain,

  loadLinkRulesFromRegistry,

  REGISTRY_AUTOMATION_GRAPH,

} from '../core/automationNetwork';

import {

  deliverPacketToDepot,

  deliverToCraftStation,

  deliverToPlayerWarehouse,

  stationNeedsCard,

} from '../core/automationDelivery';

import {

  getModeTargetRole,

  getSortFilterCardId,

  getSortHandWeight,

  getSortMode,

  packetMatchesSortHand,

  rotateWeightedTier,

  sortWeightsDescending,

} from '../core/sortHandRules';

import { pullFromAutoDepot } from '../core/storageInventory';

import type { CardStackSystem } from './CardStackSystem';

import type { CardSpawner } from '../core/CardSpawner';

import type { CardDragSystem } from './CardDragSystem';

import type { ShopCatalog } from '../core/ShopCatalog';

import type { ResourceSnapshot } from '../ui/TopHud';



const LOOT_DATA_KEY = 'lootDrop';



interface LogisticsPacket {

  cardId: string;

  qty: number;

  hopTimer: number;

  atRelay: GameCard;

  blocked?: boolean;

}



interface LogisticsChain {

  collectorCard: GameCard;

  relayCard: GameCard;

  packets: LogisticsPacket[];

}



interface FacilityRelayChain {

  facilityCard: GameCard;

  relayCard: GameCard;

  packets: LogisticsPacket[];

}



export interface CraftOutputPayload {

  facility: GameCard;

  outputs: { cardId: string; qty: number }[];

  absorbed: boolean;

}



export class AutomationSystem {

  private readonly rules;

  private readonly config;

  private chains: LogisticsChain[] = [];

  private facilityChains: FacilityRelayChain[] = [];

  private rebuildQueued = false;

  /** relayId + weight → round-robin cursor */
  private readonly relayWeightCursors = new Map<string, number>();

  private readonly tickEvent: Phaser.Time.TimerEvent;



  constructor(

    private readonly scene: Phaser.Scene,

    private readonly stacks: CardStackSystem,

    private readonly spawner: CardSpawner,

    private readonly drag: CardDragSystem,

    private readonly shopCatalog: ShopCatalog,

    private readonly resources: ResourceSnapshot,

  ) {

    this.config = parseAutomationConfig(scene.registry.get(REGISTRY_AUTOMATION_CONFIG));

    this.rules = loadLinkRulesFromRegistry(scene);



    scene.events.on('stack-changed', () => this.scheduleRebuild());

    scene.events.on('card-spawned', () => this.scheduleRebuild());

    scene.events.on('card-removed', () => this.scheduleRebuild());

    scene.events.on('card-rotated', () => this.scheduleRebuild());

    scene.events.on('craft-output', (payload: CraftOutputPayload) => this.onCraftOutput(payload));



    this.tickEvent = scene.time.addEvent({

      delay: this.config.tickSeconds * 1000,

      loop: true,

      callback: () => this.tick(),

    });



    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.tickEvent.remove());

    this.rebuildChains();

  }



  private scheduleRebuild(): void {

    if (this.rebuildQueued) return;

    this.rebuildQueued = true;

    this.scene.events.once(Phaser.Scenes.Events.POST_UPDATE, () => {

      this.rebuildQueued = false;

      this.rebuildChains();

    });

  }



  private getDayIndex(): number {

    return (this.scene.registry.get('dayIndex') as number) ?? 1;

  }



  private rebuildChains(): void {

    const graph = buildAutomationGraph(this.scene, this.config, this.rules);

    this.scene.registry.set(REGISTRY_AUTOMATION_GRAPH, graph);

    this.scene.events.emit('automation-graph-updated', graph);



    const collectors = graph.devices.filter((d) => d.role === 'logistics_collect');

    const nextChains: LogisticsChain[] = [];

    for (const col of collectors) {

      if (!isActiveCollectorChain(graph, col)) continue;

      const relayEdge = graph.edges.find((e) => e.from.id === col.id);

      const relay = relayEdge?.to;

      if (!relay) continue;

      const existing = this.chains.find((c) => c.collectorCard === col.card);

      nextChains.push({

        collectorCard: col.card,

        relayCard: relay.card,

        packets:

          existing?.packets.map((p) => ({

            ...p,

            atRelay: p.atRelay ?? relay.card,

          })) ?? [],

      });

    }

    this.chains = nextChains;



    const nextFacilityChains: FacilityRelayChain[] = [];

    for (const dev of graph.devices.filter((d) => d.role === 'logistics_facility')) {

      if (!isActiveFacilityRelayChain(graph, dev)) continue;

      const relay = graph.edges.find(

        (e) => e.from.id === dev.id && e.toRole === 'auto_relay',

      )?.to;

      if (!relay) continue;

      const existing = this.facilityChains.find((c) => c.facilityCard === dev.card);

      nextFacilityChains.push({

        facilityCard: dev.card,

        relayCard: relay.card,

        packets:

          existing?.packets.map((p) => ({

            ...p,

            atRelay: p.atRelay ?? relay.card,

          })) ?? [],

      });

    }

    this.facilityChains = nextFacilityChains;

  }



  private onCraftOutput(payload: CraftOutputPayload): void {

    const graph = this.scene.registry.get(REGISTRY_AUTOMATION_GRAPH) as

      | import('../core/automationNetwork').AutomationGraph

      | undefined;

    if (!graph) return;



    const relay = getRelayForFacility(graph, payload.facility);

    if (!relay) return;



    const facDev = findDevice(graph, payload.facility);

    if (!facDev || !isActiveFacilityRelayChain(graph, facDev)) return;



    let chain = this.facilityChains.find(

      (c) => c.facilityCard === payload.facility && c.relayCard === relay,

    );

    if (!chain) {

      chain = { facilityCard: payload.facility, relayCard: relay, packets: [] };

      this.facilityChains.push(chain);

    }



    let queued = 0;

    for (const out of payload.outputs) {

      if (chain.packets.length + queued >= this.config.maxPacketsPerChain) break;

      chain.packets.push({

        cardId: out.cardId,

        qty: out.qty,

        hopTimer: 0,

        atRelay: relay,

      });

      queued += 1;

    }

    if (queued > 0) payload.absorbed = true;

  }



  private tick(): void {

    this.rebuildChains();

    const graph = this.scene.registry.get(REGISTRY_AUTOMATION_GRAPH);

    if (!graph) return;



    for (const chain of this.chains) {

      this.runCollector(chain);

      chain.packets = this.advanceRelayPackets(chain.packets, graph);

      this.runBuyTick(chain, graph);

      this.runDepotFeed(chain, graph);

    }



    for (const fChain of this.facilityChains) {

      fChain.packets = this.advanceRelayPackets(fChain.packets, graph);

    }

  }



  private getCollectorRadius(collectorCard: GameCard): number {

    const effect = collectorCard.definition.effects?.find((e) => e.type === 'auto_collector');

    return Number((effect as { pickupRadius?: number } | undefined)?.pickupRadius) ||

      this.config.collectorPickupRadius;

  }



  private runCollector(chain: LogisticsChain): void {

    if (chain.packets.length >= this.config.maxPacketsPerChain) return;

    const radius = this.getCollectorRadius(chain.collectorCard);

    const { x: cx, y: cy } = chain.collectorCard;

    let best: GameCard | null = null;

    let bestDist = radius;



    for (const obj of this.scene.children.list) {

      if (!(obj instanceof GameCard) || obj === chain.collectorCard) continue;

      const tags = obj.definition.tags ?? [];

      if (obj.getData(LOOT_DATA_KEY) !== true && !tags.includes('resource')) continue;

      if (obj.stackId) {

        const stack = this.stacks.getStackAt(obj);

        if (stack && stack.base !== obj) continue;

      }

      const d = Phaser.Math.Distance.Between(cx, cy, obj.x, obj.y);

      if (d < bestDist) {

        bestDist = d;

        best = obj;

      }

    }

    if (!best) return;



    const cardId = best.definition.id;

    const qty = best.quantity;

    this.stacks.removeCardFromPlay(best);

    best.destroy();

    chain.packets.push({ cardId, qty: 1, hopTimer: 0, atRelay: chain.relayCard });

    if (qty > 1) this.spawner.spawn(cardId, best.x, best.y, qty - 1);

  }



  private advanceRelayPackets(

    packets: LogisticsPacket[],

    graph: import('../core/automationNetwork').AutomationGraph,

  ): LogisticsPacket[] {

    const dt = this.config.tickSeconds;

    const transit = this.config.linkTransitSeconds;

    const remaining: LogisticsPacket[] = [];



    for (const packet of packets) {

      if (packet.blocked) {

        remaining.push(packet);

        continue;

      }

      packet.hopTimer -= dt;

      if (packet.hopTimer > 0) {

        remaining.push(packet);

        continue;

      }



      const dispatch = this.dispatchFromRelay(packet, graph, transit);

      if (dispatch === 'delivered') {

        continue;

      }

      if (dispatch === 'forwarded') {

        remaining.push(packet);

        continue;

      }



      packet.hopTimer = transit;

      remaining.push(packet);

    }



    return remaining;

  }



  private weightCursorKey(relayId: string, weight: number): string {
    return `${relayId}:w${weight}`;
  }

  private getWeightCursor(relayId: string, weight: number): number {
    return this.relayWeightCursors.get(this.weightCursorKey(relayId, weight)) ?? 0;
  }

  private advanceWeightCursor(relayId: string, weight: number): void {
    const key = this.weightCursorKey(relayId, weight);
    this.relayWeightCursors.set(key, (this.relayWeightCursors.get(key) ?? 0) + 1);
  }

  private sortHandsOnRelay(

    graph: import('../core/automationNetwork').AutomationGraph,

    relayCard: GameCard,

  ): GameCard[] {

    const relayDev = findDevice(graph, relayCard);

    if (!relayDev) return [];

    return findSortHandsViaGraph(graph.edges, relayDev);

  }

  private forSortHandsByWeight(
    relayId: string,
    sortHands: GameCard[],
    tryHand: (sortHand: GameCard) => boolean,
  ): boolean {
    const weighted = sortHands.map((sortHand, index) => ({
      sortHand,
      weight: getSortHandWeight(sortHand),
      index,
    }));
    for (const weight of sortWeightsDescending(weighted.map((w) => w.weight))) {
      const tier = weighted
        .filter((w) => w.weight === weight)
        .sort((a, b) => a.index - b.index)
        .map((w) => w.sortHand);
      const order = rotateWeightedTier(tier, this.getWeightCursor(relayId, weight));
      for (const sortHand of order) {
        if (tryHand(sortHand)) {
          this.advanceWeightCursor(relayId, weight);
          return true;
        }
      }
    }
    return false;
  }

  private dispatchFromRelay(

    packet: LogisticsPacket,

    graph: import('../core/automationNetwork').AutomationGraph,

    _transit: number,

  ): 'delivered' | 'forwarded' | 'blocked' {

    const relayDev = findDevice(graph, packet.atRelay);

    if (!relayDev) {

      packet.blocked = true;

      return 'blocked';

    }



    const sorterEdges = graph.edges.filter(

      (e) => e.from.id === relayDev.id && e.toRole === 'logistics_sorter',

    );

    const eligible: { sortHand: GameCard; index: number }[] = [];

    sorterEdges.forEach((sorterEdge, index) => {
      const sortHand = sorterEdge.to.card;
      if (!packetMatchesSortHand(packet, sortHand)) return;
      const mode = getSortMode(sortHand);
      const targetRole = getModeTargetRole(mode);
      const target = getSortHandDownstream(graph, sortHand, targetRole);
      if (!target) return;
      eligible.push({ sortHand, index });
    });

    if (eligible.length === 0) {
      packet.blocked = true;
      return 'blocked';
    }

    const delivered = this.forSortHandsByWeight(
      relayDev.id,
      eligible.map((e) => e.sortHand),
      (sortHand) => {
        const mode = getSortMode(sortHand);
        const target = getSortHandDownstream(graph, sortHand, getModeTargetRole(mode));
        if (!target) return false;
        return this.deliverFromSortHand(packet, mode, target, sortHand, graph);
      },
    );

    if (delivered) return 'delivered';

    packet.blocked = true;

    return 'blocked';

  }



  private deliverFromSortHand(

    packet: LogisticsPacket,

    mode: import('../core/sortHandRules').SortModeId,

    target: GameCard,

    sortHand: GameCard,

    graph: import('../core/automationNetwork').AutomationGraph,

  ): boolean {

    const ctx = { stacks: this.stacks, spawner: this.spawner, drag: this.drag };



    if (mode === 'sell') {

      const def = dataStore.getCard(packet.cardId);

      const caps = this.shopCatalog.resolveSellCaps(packet.cardId, def?.tags ?? []);

      if (caps <= 0) return false;

      this.resources.caps += caps * packet.qty;

      this.scene.events.emit('automation-sold', { cardId: packet.cardId, caps });

      return true;

    }

    if (mode === 'store') {

      return deliverToPlayerWarehouse(

        this.stacks,

        this.spawner,

        this.drag,

        target,

        packet.cardId,

        packet.qty,

      );

    }

    if (mode === 'feed') {

      const depot = getLinkedDepotForSortHand(graph, sortHand);

      if (depot && target === depot) {

        return deliverPacketToDepot(ctx, depot, packet);

      }

      return deliverToCraftStation(

        this.stacks,

        this.spawner,

        this.drag,

        target,

        packet.cardId,

        packet.qty,

      );

    }

    return false;

  }



  private runBuyTick(

    chain: LogisticsChain,

    graph: import('../core/automationNetwork').AutomationGraph,

  ): void {

    const relayDev = findDevice(graph, chain.relayCard);

    if (!relayDev) return;

    const buyHands = this.sortHandsOnRelay(graph, chain.relayCard).filter(

      (sh) => getSortMode(sh) === 'buy',

    );

    this.forSortHandsByWeight(relayDev.id, buyHands, (sortHand) => {
      const shop = getSortHandDownstream(graph, sortHand, 'shop');
      if (!shop) return false;

      const filterId = getSortFilterCardId(sortHand);
      const listings = filterId
        ? this.shopCatalog.getBuyListings().filter((l) => l.cardId === filterId)
        : this.shopCatalog.getBuyListings().slice(0, 1);
      const listing = listings[0];
      if (!listing) return false;

      const cost = listing.costCaps ?? 0;
      if (this.resources.caps < cost) return false;

      this.resources.caps -= cost;
      this.spawner.spawn(listing.cardId, shop.x, shop.y + 40, listing.count ?? 1);
      this.scene.events.emit('automation-bought', { cardId: listing.cardId, cost });
      const name = dataStore.getCard(listing.cardId)?.name ?? listing.cardId;
      this.scene.events.emit('drag-toast', `自动购入：${name}`);
      return true;
    });

  }



  /** 分拣手 → 仓储 → 工房 缓冲供料 */

  private runDepotFeed(

    chain: LogisticsChain,

    graph: import('../core/automationNetwork').AutomationGraph,

  ): void {

    const relayDev = findDevice(graph, chain.relayCard);

    if (!relayDev) return;

    const feedHands = this.sortHandsOnRelay(graph, chain.relayCard).filter(

      (sh) => getSortMode(sh) === 'feed',

    );

    this.forSortHandsByWeight(relayDev.id, feedHands, (sortHand) => {
      const filterId = getSortFilterCardId(sortHand);
      if (!filterId) return false;

      const depot = getLinkedDepotForSortHand(graph, sortHand);
      const facility = getLinkedFacilityForSortHand(graph, sortHand);
      if (!depot || !facility) return false;

      const depotFeedsFacility = graph.edges.some(
        (e) => e.from.card === depot && e.to.card === facility && e.toRole === 'logistics_facility',
      );
      if (!depotFeedsFacility) return false;

      const recipes = dataStore.getRecipes().filter((r) => r.stationId);
      if (!stationNeedsCard(facility, filterId, recipes, this.getDayIndex())) return false;
      if (!pullFromAutoDepot(this.stacks, depot, filterId, 1)) return false;

      deliverToCraftStation(this.stacks, this.spawner, this.drag, facility, filterId, 1);
      return true;
    });

  }

}

