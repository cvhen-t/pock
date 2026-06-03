import { describe, expect, it } from 'vitest';
import { isAutomationEdgeActive, isSourceRelayPathActive, sortHandHasMatchingDownstream, } from './automationPath';
import { setSortMode } from './sortHandRules';
function mockCard(x = 0, y = 0) {
    const data = {};
    return {
        x,
        y,
        setData(k, v) {
            data[k] = v;
            return this;
        },
        getData(k) {
            return data[k];
        },
        definition: { name: 'mock', tags: [] },
    };
}
function mockDevice(id, role, card) {
    return { id, role, tags: [role], card };
}
function edge(from, to, fromRole, toRole) {
    return { from, to, fromRole, toRole };
}
describe('automationPath', () => {
    it('储物棚→传送→分拣(卖出)→商店 路径有效', () => {
        const wh = mockDevice('wh', 'warehouse', mockCard(0, 0));
        const relay = mockDevice('relay', 'auto_relay', mockCard(100, 0));
        const sorterCard = mockCard(200, 0);
        setSortMode(sorterCard, 'sell');
        const sorter = mockDevice('sorter', 'logistics_sorter', sorterCard);
        const shop = mockDevice('shop', 'shop', mockCard(300, 0));
        const graph = {
            devices: [wh, relay, sorter, shop],
            edges: [
                edge(wh, relay, 'warehouse', 'auto_relay'),
                edge(relay, sorter, 'auto_relay', 'logistics_sorter'),
                edge(sorter, shop, 'logistics_sorter', 'shop'),
            ],
            relaySortHands: new Map([[relay.card, [sorter.card]]]),
            builtAt: 0,
        };
        expect(isSourceRelayPathActive(graph, wh)).toBe(true);
        expect(sortHandHasMatchingDownstream(graph, sorter.card)).toBe(true);
        expect(isAutomationEdgeActive(graph, graph.edges[0])).toBe(true);
    });
    it('分拣模式与下游不匹配时路径无效', () => {
        const wh = mockDevice('wh', 'warehouse', mockCard(0, 0));
        const relay = mockDevice('relay', 'auto_relay', mockCard(100, 0));
        const sorterCard = mockCard(200, 0);
        setSortMode(sorterCard, 'feed');
        const sorter = mockDevice('sorter', 'logistics_sorter', sorterCard);
        const shop = mockDevice('shop', 'shop', mockCard(300, 0));
        const graph = {
            devices: [wh, relay, sorter, shop],
            edges: [
                edge(wh, relay, 'warehouse', 'auto_relay'),
                edge(relay, sorter, 'auto_relay', 'logistics_sorter'),
                edge(sorter, shop, 'logistics_sorter', 'shop'),
            ],
            relaySortHands: new Map(),
            builtAt: 0,
        };
        expect(isSourceRelayPathActive(graph, wh)).toBe(false);
    });
});
