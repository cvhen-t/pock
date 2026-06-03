import Phaser from 'phaser';
import GameCard from '../objects/GameCard';
import { dataStore } from '../core/DataStore';
import { parseAutomationConfig, REGISTRY_AUTOMATION_CONFIG } from '../core/automationConfig';
import { canRelayDispatchPacket, isSourceRelayPathActive, listSourcesOnRelay, } from '../core/automationPath';
import { buildAutomationGraph, findDevice, findSortHandsViaGraph, getLinkedDepotForSortHand, getLinkedFacilityForSortHand, getRelayForFacility, getSortHandDownstream, getWarehousesLinkedToFacility, loadLinkRulesFromRegistry, REGISTRY_AUTOMATION_GRAPH, } from '../core/automationNetwork';
import { deliverPacketToDepot, deliverToCraftStation, deliverToPlayerWarehouse, stationNeedsCard, } from '../core/automationDelivery';
import { getModeTargetRole, getSortFilterCardId, getSortHandWeight, getSortMode, packetMatchesSortHand, rotateWeightedTier, sortWeightsDescending, } from '../core/sortHandRules';
import { getWarehouseInventory, isAutoDepotCard, pullFromAutoDepot, pullFromWarehouse, } from '../core/storageInventory';
const LOOT_DATA_KEY = 'lootDrop';
export class AutomationSystem {
    scene;
    stacks;
    spawner;
    drag;
    shopCatalog;
    resources;
    rules;
    config;
    relayBuses = [];
    rebuildQueued = false;
    relayWeightCursors = new Map();
    tickEvent;
    constructor(scene, stacks, spawner, drag, shopCatalog, resources) {
        this.scene = scene;
        this.stacks = stacks;
        this.spawner = spawner;
        this.drag = drag;
        this.shopCatalog = shopCatalog;
        this.resources = resources;
        this.config = parseAutomationConfig(scene.registry.get(REGISTRY_AUTOMATION_CONFIG));
        this.rules = loadLinkRulesFromRegistry(scene);
        scene.events.on('stack-changed', () => this.scheduleRebuild());
        scene.events.on('card-spawned', () => this.scheduleRebuild());
        scene.events.on('card-removed', () => this.scheduleRebuild());
        scene.events.on('card-rotated', () => this.scheduleRebuild());
        scene.events.on('card-drag-end', () => this.scheduleRebuild());
        scene.events.on('automation-graph-refresh-request', () => {
            if (this.drag.getLogisticsDragContext())
                this.rebuildChains();
        });
        scene.events.on('craft-output', (payload) => this.onCraftOutput(payload));
        this.tickEvent = scene.time.addEvent({
            delay: this.config.tickSeconds * 1000,
            loop: true,
            callback: () => this.tick(),
        });
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.tickEvent.remove());
        this.rebuildChains();
    }
    scheduleRebuild() {
        if (this.rebuildQueued)
            return;
        this.rebuildQueued = true;
        this.scene.events.once(Phaser.Scenes.Events.POST_UPDATE, () => {
            this.rebuildQueued = false;
            this.rebuildChains();
        });
    }
    getDayIndex() {
        return this.scene.registry.get('dayIndex') ?? 1;
    }
    rebuildChains() {
        const dragOpts = this.drag.getLogisticsDragContext();
        const graph = buildAutomationGraph(this.scene, this.config, this.rules, dragOpts);
        this.scene.registry.set(REGISTRY_AUTOMATION_GRAPH, graph);
        this.scene.events.emit('automation-graph-updated', graph);
        const nextBuses = [];
        for (const relayDev of graph.devices.filter((d) => d.role === 'auto_relay')) {
            const sortHands = findSortHandsViaGraph(graph.edges, relayDev);
            const hasSources = listSourcesOnRelay(graph, relayDev).length > 0;
            if (sortHands.length === 0 && !hasSources)
                continue;
            const existing = this.relayBuses.find((b) => b.relayCard === relayDev.card);
            nextBuses.push({
                relayCard: relayDev.card,
                relayId: relayDev.id,
                packets: existing?.packets.map((p) => ({
                    ...p,
                    atRelay: p.atRelay ?? relayDev.card,
                })) ?? [],
            });
        }
        this.relayBuses = nextBuses;
    }
    findBusForRelay(relayCard) {
        return this.relayBuses.find((b) => b.relayCard === relayCard);
    }
    onCraftOutput(payload) {
        this.rebuildChains();
        const graph = this.scene.registry.get(REGISTRY_AUTOMATION_GRAPH);
        if (!graph)
            return;
        const relay = getRelayForFacility(graph, payload.facility);
        if (!relay)
            return;
        const facDev = findDevice(graph, payload.facility);
        if (!facDev || !isSourceRelayPathActive(graph, facDev))
            return;
        let bus = this.findBusForRelay(relay);
        if (!bus) {
            const relayDev = findDevice(graph, relay);
            if (!relayDev)
                return;
            bus = { relayCard: relay, relayId: relayDev.id, packets: [] };
            this.relayBuses.push(bus);
        }
        let queued = 0;
        for (const out of payload.outputs) {
            if (bus.packets.length + queued >= this.config.maxPacketsPerRelay)
                break;
            if (!canRelayDispatchPacket(graph, relay, out.cardId))
                continue;
            bus.packets.push({
                cardId: out.cardId,
                qty: out.qty,
                hopTimer: 0,
                atRelay: relay,
            });
            queued += 1;
        }
        if (queued > 0)
            payload.absorbed = true;
    }
    tick() {
        this.rebuildChains();
        const graph = this.scene.registry.get(REGISTRY_AUTOMATION_GRAPH);
        if (!graph)
            return;
        for (const bus of this.relayBuses) {
            this.runRelayInjections(bus, graph);
            bus.packets = this.advanceRelayPackets(bus.packets, graph);
            this.runBuyTick(bus, graph);
            this.runStorageFeed(bus, graph);
        }
    }
    runRelayInjections(bus, graph) {
        if (bus.packets.length >= this.config.maxPacketsPerRelay)
            return;
        const relayDev = findDevice(graph, bus.relayCard);
        if (!relayDev)
            return;
        let injected = 0;
        for (const role of this.config.sourceInjectPriority) {
            if (injected >= this.config.maxInjectPerRelayPerTick)
                break;
            if (role === 'logistics_collect' && this.tryInjectCollectors(bus, graph, relayDev)) {
                injected += 1;
            }
            else if (role === 'warehouse' && this.tryInjectFromStorages(bus, graph, relayDev, 'warehouse')) {
                injected += 1;
            }
            else if (role === 'logistics_depot' &&
                this.tryInjectFromStorages(bus, graph, relayDev, 'logistics_depot')) {
                injected += 1;
            }
        }
    }
    tryInjectCollectors(bus, graph, relayDev) {
        const collectors = listSourcesOnRelay(graph, relayDev).filter((s) => s.role === 'logistics_collect');
        for (const col of collectors) {
            if (!isSourceRelayPathActive(graph, col))
                continue;
            if (this.runCollectorPickup(col.card, bus))
                return true;
        }
        return false;
    }
    tryInjectFromStorages(bus, graph, relayDev, role) {
        const sources = listSourcesOnRelay(graph, relayDev).filter((s) => s.role === role);
        for (const src of sources) {
            if (!isSourceRelayPathActive(graph, src))
                continue;
            const stack = this.stacks.getStackAt(src.card);
            if (!stack)
                continue;
            const inventory = getWarehouseInventory(stack);
            if (this.tryPushStorageOutbound(bus, graph, relayDev, src.card, inventory)) {
                return true;
            }
        }
        return false;
    }
    tryPushStorageOutbound(bus, graph, _relayDev, storageCard, inventory) {
        const modes = ['sell', 'store', 'feed'];
        const recipes = dataStore.getRecipes().filter((r) => r.stationId);
        for (const mode of modes) {
            const hands = this.sortHandsOnRelay(graph, bus.relayCard).filter((sh) => getSortMode(sh) === mode);
            const pushed = this.forSortHandsByWeight(bus.relayId, hands, (sortHand) => {
                const filterId = getSortFilterCardId(sortHand);
                if (mode === 'sell') {
                    const shop = getSortHandDownstream(graph, sortHand, 'shop');
                    if (!shop)
                        return false;
                    const candidates = this.storageCandidates(inventory, filterId).filter((cardId) => {
                        const def = dataStore.getCard(cardId);
                        return this.shopCatalog.resolveSellCaps(cardId, def?.tags ?? []) > 0;
                    });
                    const cardId = candidates[0];
                    if (!cardId)
                        return false;
                    this.pushPacket(bus, cardId, storageCard);
                    return true;
                }
                if (mode === 'store') {
                    const wh = getSortHandDownstream(graph, sortHand, 'warehouse');
                    if (!wh)
                        return false;
                    const cardId = this.storageCandidates(inventory, filterId)[0];
                    if (!cardId)
                        return false;
                    this.pushPacket(bus, cardId, storageCard);
                    return true;
                }
                const facility = getLinkedFacilityForSortHand(graph, sortHand);
                const depot = getLinkedDepotForSortHand(graph, sortHand);
                const target = facility ?? depot;
                if (!target)
                    return false;
                if (facility) {
                    const cardId = this.storageCandidates(inventory, filterId).find((id) => stationNeedsCard(facility, id, recipes, this.getDayIndex()));
                    if (!cardId)
                        return false;
                    this.pushPacket(bus, cardId, storageCard);
                    return true;
                }
                const cardId = this.storageCandidates(inventory, filterId)[0];
                if (!cardId)
                    return false;
                this.pushPacket(bus, cardId, storageCard);
                return true;
            });
            if (pushed)
                return true;
        }
        return false;
    }
    storageCandidates(inventory, filterId) {
        const stocked = inventory.filter((e) => e.qty > 0);
        if (filterId) {
            const one = stocked.find((e) => e.cardId === filterId);
            return one ? [one.cardId] : [];
        }
        return stocked.map((e) => e.cardId);
    }
    pushPacket(bus, cardId, sourceStorage) {
        bus.packets.push({
            cardId,
            qty: 1,
            hopTimer: 0,
            atRelay: bus.relayCard,
            sourceStorage,
        });
    }
    pullFromSourceStorage(storage, cardId, qty) {
        if (isAutoDepotCard(storage)) {
            return pullFromAutoDepot(this.stacks, storage, cardId, qty);
        }
        return pullFromWarehouse(this.stacks, storage, cardId, qty) > 0;
    }
    getCollectorRadius(collectorCard) {
        const effect = collectorCard.definition.effects?.find((e) => e.type === 'auto_collector');
        return (Number(effect?.pickupRadius) ||
            this.config.collectorPickupRadius);
    }
    runCollectorPickup(collectorCard, bus) {
        if (bus.packets.length >= this.config.maxPacketsPerRelay)
            return false;
        const radius = this.getCollectorRadius(collectorCard);
        const { x: cx, y: cy } = collectorCard;
        let best = null;
        let bestDist = radius;
        for (const obj of this.scene.children.list) {
            if (!(obj instanceof GameCard) || obj === collectorCard)
                continue;
            const tags = obj.definition.tags ?? [];
            if (obj.getData(LOOT_DATA_KEY) !== true && !tags.includes('resource'))
                continue;
            if (obj.stackId) {
                const stack = this.stacks.getStackAt(obj);
                if (stack && stack.base !== obj)
                    continue;
            }
            const d = Phaser.Math.Distance.Between(cx, cy, obj.x, obj.y);
            if (d < bestDist) {
                bestDist = d;
                best = obj;
            }
        }
        if (!best)
            return false;
        const cardId = best.definition.id;
        const qty = best.quantity;
        this.stacks.removeCardFromPlay(best);
        best.destroy();
        this.pushPacket(bus, cardId);
        if (qty > 1)
            this.spawner.spawn(cardId, best.x, best.y, qty - 1);
        return true;
    }
    advanceRelayPackets(packets, graph) {
        const dt = this.config.tickSeconds;
        const transit = this.config.linkTransitSeconds;
        const remaining = [];
        for (const packet of packets) {
            if (packet.blocked) {
                packet.blockedTicks = (packet.blockedTicks ?? 0) + 1;
                if (packet.blockedTicks >= this.config.packetBlockedPurgeTicks) {
                    continue;
                }
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
    weightCursorKey(relayId, weight) {
        return `${relayId}:w${weight}`;
    }
    getWeightCursor(relayId, weight) {
        return this.relayWeightCursors.get(this.weightCursorKey(relayId, weight)) ?? 0;
    }
    advanceWeightCursor(relayId, weight) {
        const key = this.weightCursorKey(relayId, weight);
        this.relayWeightCursors.set(key, (this.relayWeightCursors.get(key) ?? 0) + 1);
    }
    sortHandsOnRelay(graph, relayCard) {
        const relayDev = findDevice(graph, relayCard);
        if (!relayDev)
            return [];
        return findSortHandsViaGraph(graph.edges, relayDev);
    }
    forSortHandsByWeight(relayId, sortHands, tryHand) {
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
    dispatchFromRelay(packet, graph, _transit) {
        const relayDev = findDevice(graph, packet.atRelay);
        if (!relayDev) {
            packet.blocked = true;
            return 'blocked';
        }
        const sorterEdges = graph.edges.filter((e) => e.from.id === relayDev.id && e.toRole === 'logistics_sorter');
        const eligible = [];
        sorterEdges.forEach((sorterEdge) => {
            const sortHand = sorterEdge.to.card;
            if (!packetMatchesSortHand(packet, sortHand))
                return;
            const mode = getSortMode(sortHand);
            const targetRole = getModeTargetRole(mode);
            let target = getSortHandDownstream(graph, sortHand, targetRole);
            if (mode === 'feed' && !target) {
                target =
                    getSortHandDownstream(graph, sortHand, 'logistics_depot') ??
                        getSortHandDownstream(graph, sortHand, 'logistics_facility');
            }
            if (!target)
                return;
            eligible.push(sortHand);
        });
        if (eligible.length === 0) {
            packet.blocked = true;
            return 'blocked';
        }
        const delivered = this.forSortHandsByWeight(relayDev.id, eligible, (sortHand) => {
            const mode = getSortMode(sortHand);
            let target = getSortHandDownstream(graph, sortHand, getModeTargetRole(mode));
            if (mode === 'feed' && !target) {
                target =
                    getSortHandDownstream(graph, sortHand, 'logistics_depot') ??
                        getSortHandDownstream(graph, sortHand, 'logistics_facility');
            }
            if (!target)
                return false;
            return this.deliverFromSortHand(packet, mode, target, sortHand, graph);
        });
        if (delivered)
            return 'delivered';
        packet.blocked = true;
        return 'blocked';
    }
    deliverFromSortHand(packet, mode, target, sortHand, graph) {
        const ctx = { stacks: this.stacks, spawner: this.spawner, drag: this.drag };
        if (mode === 'sell') {
            if (packet.sourceStorage) {
                if (!this.pullFromSourceStorage(packet.sourceStorage, packet.cardId, packet.qty)) {
                    return false;
                }
            }
            const def = dataStore.getCard(packet.cardId);
            const caps = this.shopCatalog.resolveSellCaps(packet.cardId, def?.tags ?? []);
            if (caps <= 0)
                return false;
            this.resources.caps += caps * packet.qty;
            this.scene.events.emit('automation-sold', { cardId: packet.cardId, caps });
            return true;
        }
        if (mode === 'store') {
            if (packet.sourceStorage) {
                if (!this.pullFromSourceStorage(packet.sourceStorage, packet.cardId, packet.qty)) {
                    return false;
                }
            }
            return deliverToPlayerWarehouse(this.stacks, this.spawner, this.drag, target, packet.cardId, packet.qty);
        }
        if (mode === 'feed') {
            const depot = getLinkedDepotForSortHand(graph, sortHand);
            if (depot && target === depot) {
                if (packet.sourceStorage) {
                    if (!this.pullFromSourceStorage(packet.sourceStorage, packet.cardId, packet.qty)) {
                        return false;
                    }
                }
                return deliverPacketToDepot(ctx, depot, packet);
            }
            if (packet.sourceStorage) {
                const recipes = dataStore.getRecipes().filter((r) => r.stationId);
                if (!stationNeedsCard(target, packet.cardId, recipes, this.getDayIndex())) {
                    return false;
                }
                if (!this.pullFromSourceStorage(packet.sourceStorage, packet.cardId, packet.qty)) {
                    return false;
                }
                return deliverToCraftStation(this.stacks, this.spawner, this.drag, target, packet.cardId, packet.qty);
            }
            return deliverToCraftStation(this.stacks, this.spawner, this.drag, target, packet.cardId, packet.qty);
        }
        return false;
    }
    runBuyTick(bus, graph) {
        const relayDev = findDevice(graph, bus.relayCard);
        if (!relayDev)
            return;
        const buyHands = this.sortHandsOnRelay(graph, bus.relayCard).filter((sh) => getSortMode(sh) === 'buy');
        this.forSortHandsByWeight(bus.relayId, buyHands, (sortHand) => {
            const shop = getSortHandDownstream(graph, sortHand, 'shop');
            if (!shop)
                return false;
            const filterId = getSortFilterCardId(sortHand);
            const listings = filterId
                ? this.shopCatalog.getBuyListings().filter((l) => l.cardId === filterId)
                : this.shopCatalog.getBuyListings().slice(0, 1);
            const listing = listings[0];
            if (!listing)
                return false;
            const cost = listing.costCaps ?? 0;
            if (this.resources.caps < cost)
                return false;
            this.resources.caps -= cost;
            this.spawner.spawn(listing.cardId, shop.x, shop.y + 40, listing.count ?? 1);
            this.scene.events.emit('automation-bought', { cardId: listing.cardId, cost });
            const name = dataStore.getCard(listing.cardId)?.name ?? listing.cardId;
            this.scene.events.emit('drag-toast', `自动购入：${name}`);
            return true;
        });
    }
    runStorageFeed(bus, graph) {
        const relayDev = findDevice(graph, bus.relayCard);
        if (!relayDev)
            return;
        const feedHands = this.sortHandsOnRelay(graph, bus.relayCard).filter((sh) => getSortMode(sh) === 'feed');
        const recipes = dataStore.getRecipes().filter((r) => r.stationId);
        let pulls = 0;
        this.forSortHandsByWeight(bus.relayId, feedHands, (sortHand) => {
            if (pulls >= this.config.maxPullPerTick)
                return false;
            const filterId = getSortFilterCardId(sortHand);
            if (!filterId)
                return false;
            const facility = getLinkedFacilityForSortHand(graph, sortHand);
            if (!facility)
                return false;
            if (!stationNeedsCard(facility, filterId, recipes, this.getDayIndex()))
                return false;
            const depot = getLinkedDepotForSortHand(graph, sortHand);
            const depotFeedsFacility = depot &&
                graph.edges.some((e) => e.from.card === depot && e.to.card === facility && e.toRole === 'logistics_facility');
            if (depotFeedsFacility) {
                if (!pullFromAutoDepot(this.stacks, depot, filterId, 1))
                    return false;
                deliverToCraftStation(this.stacks, this.spawner, this.drag, facility, filterId, 1);
                pulls += 1;
                return true;
            }
            for (const warehouse of getWarehousesLinkedToFacility(graph, facility)) {
                if (!pullFromWarehouse(this.stacks, warehouse, filterId, 1))
                    continue;
                deliverToCraftStation(this.stacks, this.spawner, this.drag, facility, filterId, 1);
                pulls += 1;
                return true;
            }
            return false;
        });
    }
}
