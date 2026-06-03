import { dataStore } from './DataStore';
import { getLinkedDepotForSortHand, getSortHandDownstream, } from './automationNetwork';
import { getWarehouseInventory, isWarehouseStorable } from './storageInventory';
export const SORT_FILTER_KEY = 'sortFilterCardId';
export const SORT_MODE_KEY = 'sortMode';
export const SORT_WEIGHT_KEY = 'sortHandWeight';
export const SORT_WEIGHT_MIN = 1;
export const SORT_WEIGHT_MAX = 9;
export const SORT_WEIGHT_DEFAULT = 1;
export const SORT_MODES = [
    { id: 'sell', label: '卖出', targetRole: 'shop' },
    { id: 'buy', label: '买入', targetRole: 'shop' },
    { id: 'store', label: '存入仓库', targetRole: 'warehouse' },
    { id: 'feed', label: '供料设施', targetRole: 'logistics_facility' },
];
export function getSortMode(card) {
    return card.getData(SORT_MODE_KEY) ?? 'feed';
}
export function setSortMode(card, mode) {
    card.setData(SORT_MODE_KEY, mode);
}
export function getSortFilterCardId(card) {
    return card.getData(SORT_FILTER_KEY) ?? null;
}
export function setSortFilterCardId(card, cardId) {
    card.setData(SORT_FILTER_KEY, cardId);
}
export function clearSortFilterCardId(card) {
    card.setData(SORT_FILTER_KEY, null);
}
export function getModeTargetRole(mode) {
    return SORT_MODES.find((m) => m.id === mode)?.targetRole ?? 'logistics_facility';
}
export function clampSortHandWeight(weight) {
    return Math.min(SORT_WEIGHT_MAX, Math.max(SORT_WEIGHT_MIN, Math.round(weight)));
}
export function getSortHandWeight(card) {
    const v = card.getData(SORT_WEIGHT_KEY);
    if (v == null || !Number.isFinite(v))
        return SORT_WEIGHT_DEFAULT;
    return clampSortHandWeight(v);
}
export function setSortHandWeight(card, weight) {
    card.setData(SORT_WEIGHT_KEY, clampSortHandWeight(weight));
}
/** 同权重 tier 内按 cursor 轮询起点旋转 */
export function rotateWeightedTier(tier, cursor) {
    if (tier.length === 0)
        return [];
    const start = ((cursor % tier.length) + tier.length) % tier.length;
    return [...tier.slice(start), ...tier.slice(0, start)];
}
export function sortWeightsDescending(weights) {
    return [...new Set(weights)].sort((a, b) => b - a);
}
export function packetMatchesSortHand(packet, sortHand) {
    const filterId = getSortFilterCardId(sortHand);
    if (!filterId)
        return true;
    return packet.cardId === filterId;
}
export function listBuyCandidates(shopCatalog, filterCardId) {
    const listings = shopCatalog.getBuyListings();
    if (filterCardId)
        return listings.filter((l) => l.cardId === filterCardId);
    return listings.slice(0, 12);
}
export function listSellableCardIds(shopCatalog, allCards) {
    const ids = new Set();
    for (const c of allCards) {
        const caps = shopCatalog.resolveSellCaps(c.id, c.tags ?? []);
        if (caps > 0)
            ids.add(c.id);
    }
    return [...ids].sort((a, b) => {
        const da = dataStore.getCard(a);
        const db = dataStore.getCard(b);
        return (da?.name ?? a).localeCompare(db?.name ?? b, 'zh');
    });
}
/** 储物棚可接受的卡牌 id（供分拣手「存入仓库」筛选） */
export function listStorableCardIds(allCards) {
    return allCards
        .filter((c) => isWarehouseStorable(c.tags ?? []))
        .map((c) => c.id)
        .sort((a, b) => {
        const da = dataStore.getCard(a);
        const db = dataStore.getCard(b);
        return (da?.name ?? a).localeCompare(db?.name ?? b, 'zh');
    });
}
function linkedFacilityFromGraph(graph, sortHand) {
    const edge = graph.edges.find((e) => e.from.card === sortHand && e.toRole === 'logistics_facility');
    return edge?.to.card ?? null;
}
/** 列出已连接工房的可用配方（供料模式） */
export function listFeedRecipesForSortHand(sortHand, graph, recipes, dayIndex) {
    const facility = linkedFacilityFromGraph(graph, sortHand);
    if (!facility)
        return [];
    const effect = facility.definition.effects?.find((e) => e.type === 'craft_station');
    const stationId = effect?.stationId;
    if (!stationId)
        return [];
    return recipes.filter((r) => {
        if (r.stationId !== stationId)
            return false;
        if (r.dayMin != null && dayIndex < r.dayMin)
            return false;
        return r.inputs?.some((i) => i.cardId);
    });
}
export function firstInputCardId(recipe) {
    const input = recipe.inputs?.find((i) => i.cardId);
    return input?.cardId ?? null;
}
export function formatRecipeInputs(recipe) {
    const parts = (recipe.inputs ?? [])
        .filter((i) => i.cardId)
        .map((i) => {
        const def = dataStore.getCard(i.cardId);
        const name = def?.name ?? i.cardId;
        return i.count > 1 ? `${name}×${i.count}` : name;
    });
    return parts.join('+');
}
/** 根据连线推导可用分拣模式 */
export function deriveAvailableModes(graph, sortHand) {
    if (!graph)
        return [];
    const modes = [];
    if (getSortHandDownstream(graph, sortHand, 'logistics_facility'))
        modes.push('feed');
    if (getSortHandDownstream(graph, sortHand, 'shop')) {
        modes.push('sell', 'buy');
    }
    if (getSortHandDownstream(graph, sortHand, 'warehouse'))
        modes.push('store');
    return modes;
}
export function resolveDefaultSortMode(available, current) {
    if (available.length === 0)
        return current;
    if (available.includes(current))
        return current;
    return available[0];
}
export function getDownstreamTargetName(graph, sortHand, mode) {
    if (!graph)
        return null;
    const role = getModeTargetRole(mode);
    return getSortHandDownstream(graph, sortHand, role)?.definition.name ?? null;
}
export function formatSortHandSummary(card, graph) {
    const mode = getSortMode(card);
    const modeLabel = SORT_MODES.find((m) => m.id === mode)?.label ?? mode;
    const filterId = getSortFilterCardId(card);
    const filterName = filterId ? (dataStore.getCard(filterId)?.name ?? filterId) : '全部';
    const targetName = getDownstreamTargetName(graph, card, mode);
    if (!targetName)
        return `${modeLabel} · 待连接`;
    return `${modeLabel} · ${filterName} → ${targetName}`;
}
export function buildStoreGridEntries(sortHand, graph, stacks, allCards, showAllStorable) {
    const entries = [
        {
            key: '__all__',
            cardId: null,
            title: '全部',
            subtitle: '接受任意可存物品',
            filterCardId: null,
        },
    ];
    const seen = new Set();
    const depot = graph ? getLinkedDepotForSortHand(graph, sortHand) : null;
    if (depot) {
        const stack = stacks.getStackAt(depot);
        if (stack) {
            for (const e of getWarehouseInventory(stack)) {
                if (seen.has(e.cardId))
                    continue;
                seen.add(e.cardId);
                const def = dataStore.getCard(e.cardId);
                entries.push({
                    key: e.cardId,
                    cardId: e.cardId,
                    title: def?.name ?? e.cardId,
                    subtitle: e.qty > 1 ? `仓储 ×${e.qty}` : '仓储有货',
                    filterCardId: e.cardId,
                });
            }
        }
    }
    if (showAllStorable || entries.length <= 1) {
        for (const id of listStorableCardIds(allCards)) {
            if (seen.has(id))
                continue;
            seen.add(id);
            const def = dataStore.getCard(id);
            entries.push({
                key: id,
                cardId: id,
                title: def?.name ?? id,
                subtitle: '仅存入此物',
                filterCardId: id,
            });
            if (entries.length >= 25)
                break;
        }
    }
    return entries;
}
