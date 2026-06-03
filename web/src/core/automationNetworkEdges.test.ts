import { describe, expect, it } from 'vitest';

import { parseLinkRules } from './linkRules';
import type { LogisticsDevice } from './sortHandRules';
import {
  buildProximityEdges,
  buildProximityEdgesStable,
  diffAutomationEdges,
} from './automationNetworkEdges';

const LINK_RULES = parseLinkRules({
  connections: [
    { from: 'logistics_collect', to: 'auto_relay', maxOut: 1, maxIn: 1, priority: 10 },
    { from: 'auto_relay', to: 'logistics_sorter', maxOut: 4, maxIn: 1, priority: 8 },
    { from: 'logistics_sorter', to: 'logistics_facility', maxOut: 1, maxIn: 1, priority: 6 },
    { from: 'logistics_sorter', to: 'warehouse', maxOut: 1, maxIn: 4, priority: 6 },
    { from: 'logistics_depot', to: 'logistics_facility', maxOut: 2, maxIn: 2, priority: 4 },
    { from: 'warehouse', to: 'auto_relay', maxOut: 1, maxIn: 2, priority: 7 },
    { from: 'logistics_facility', to: 'auto_relay', maxOut: 1, maxIn: 1, priority: 7 },
  ],
});

const RADIUS = 220;

function mockDevice(
  id: string,
  role: string,
  x: number,
  y: number,
  sortMode?: string,
): LogisticsDevice {
  const data = new Map<string, unknown>();
  if (sortMode) data.set('sortMode', sortMode);
  return {
    id,
    role,
    tags: [role],
    card: {
      x,
      y,
      getData: (key: string) => data.get(key),
      setData: (key: string, value: unknown) => data.set(key, value),
    } as unknown as LogisticsDevice['card'],
  };
}

function edgeKeys(edges: { from: { id: string }; to: { id: string } }[]): string[] {
  return edges.map((e) => `${e.from.id}→${e.to.id}`).sort();
}

describe('buildProximityEdgesStable', () => {
  it('保留 incumbent：无 mover 时收集器 A 已占传送器，B 更近也不抢', () => {
    const relay = mockDevice('relay', 'auto_relay', 100, 0);
    const colA = mockDevice('colA', 'logistics_collect', 20, 0);
    const colB = mockDevice('colB', 'logistics_collect', 180, 0);
    const devices = [colA, colB, relay];

    const prev = buildProximityEdgesStable(devices, LINK_RULES, RADIUS, {
      prevEdges: [],
    });
    expect(edgeKeys(prev)).toEqual(['colA→relay']);

    const next = buildProximityEdgesStable(devices, LINK_RULES, RADIUS, {
      prevEdges: prev,
    });
    expect(edgeKeys(next)).toEqual(['colA→relay']);
  });

  it('mover 更近时可抢占传送器入边', () => {
    const relay = mockDevice('relay', 'auto_relay', 100, 0);
    const colA = mockDevice('colA', 'logistics_collect', 0, 0);
    const colB = mockDevice('colB', 'logistics_collect', 200, 0);
    const devices = [colA, colB, relay];

    const prev = buildProximityEdgesStable(
      [colA, mockDevice('colB', 'logistics_collect', 300, 0), relay],
      LINK_RULES,
      RADIUS,
    );
    expect(edgeKeys(prev)).toEqual(['colA→relay']);

    const next = buildProximityEdgesStable(devices, LINK_RULES, RADIUS, {
      prevEdges: prev,
      moverIds: new Set(['colB']),
      dragPositions: new Map([['colB', { x: 70, y: 0 }]]),
    });
    expect(edgeKeys(next)).toEqual(['colB→relay']);
  });

  it('两个传送器争一个分拣手：非 mover 不能抢 incumbent', () => {
    const sorter = mockDevice('sorter', 'logistics_sorter', 200, 0);
    const relayA = mockDevice('relayA', 'auto_relay', 0, 0);
    const relayB = mockDevice('relayB', 'auto_relay', 50, 0);
    const devices = [relayA, relayB, sorter];

    const prev = buildProximityEdgesStable(devices, LINK_RULES, RADIUS);
    expect(edgeKeys(prev)).toEqual(['relayA→sorter']);

    const next = buildProximityEdgesStable(devices, LINK_RULES, RADIUS, {
      prevEdges: prev,
    });
    expect(edgeKeys(next)).toEqual(['relayA→sorter']);
  });

  it('mover 传送器更近时可抢占分拣手入边', () => {
    const sorter = mockDevice('sorter', 'logistics_sorter', 100, 0);
    const relayA = mockDevice('relayA', 'auto_relay', 0, 0);
    const relayB = mockDevice('relayB', 'auto_relay', 80, 0);
    const devices = [relayA, relayB, sorter];

    const prev = buildProximityEdgesStable(
      [relayA, mockDevice('relayB', 'auto_relay', 300, 0), sorter],
      LINK_RULES,
      RADIUS,
    );
    expect(edgeKeys(prev)).toEqual(['relayA→sorter']);

    const next = buildProximityEdgesStable(devices, LINK_RULES, RADIUS, {
      prevEdges: prev,
      moverIds: new Set(['relayB']),
      dragPositions: new Map([['relayB', { x: 60, y: 0 }]]),
    });
    expect(edgeKeys(next)).toEqual(['relayB→sorter']);
  });

  it('mover 拖出 linkRadius 后断开连边', () => {
    const relay = mockDevice('relay', 'auto_relay', 100, 0);
    const col = mockDevice('col', 'logistics_collect', 50, 0);
    const prev = buildProximityEdgesStable([col, relay], LINK_RULES, RADIUS);
    expect(edgeKeys(prev)).toEqual(['col→relay']);

    const next = buildProximityEdgesStable([col, relay], LINK_RULES, RADIUS, {
      prevEdges: prev,
      moverIds: new Set(['col']),
      dragPositions: new Map([['col', { x: 500, y: 0 }]]),
    });
    expect(edgeKeys(next)).toEqual([]);
  });

  it('分拣手为 mover 时可切换更近的工房下游', () => {
    const sorter = mockDevice('sorter', 'logistics_sorter', 0, 0);
    const facA = mockDevice('facA', 'logistics_facility', 40, 0);
    const facB = mockDevice('facB', 'logistics_facility', 100, 0);
    const devices = [sorter, facA, facB];

    const prev = buildProximityEdgesStable(devices, LINK_RULES, RADIUS);
    expect(edgeKeys(prev)).toEqual(['sorter→facA']);

    const next = buildProximityEdgesStable(devices, LINK_RULES, RADIUS, {
      prevEdges: prev,
      moverIds: new Set(['sorter']),
      dragPositions: new Map([['sorter', { x: 75, y: 0 }]]),
    });
    expect(edgeKeys(next)).toEqual(['sorter→facB']);
  });

  it('储物棚与工房相邻时不建立直连边', () => {
    const warehouse = mockDevice('wh', 'warehouse', 0, 0);
    const facility = mockDevice('fac', 'logistics_facility', 50, 0);
    const edges = buildProximityEdgesStable([warehouse, facility], LINK_RULES, RADIUS);
    expect(edgeKeys(edges)).toEqual([]);
  });

  it('多个分拣手可同时连同一储物棚', () => {
    const warehouse = mockDevice('wh', 'warehouse', 100, 0);
    const sorterA = mockDevice('sorterA', 'logistics_sorter', 70, -30, 'store');
    const sorterB = mockDevice('sorterB', 'logistics_sorter', 70, 30, 'store');
    const edges = buildProximityEdgesStable([sorterA, sorterB, warehouse], LINK_RULES, RADIUS);
    expect(edgeKeys(edges).sort()).toEqual(['sorterA→wh', 'sorterB→wh']);
  });

  it('存仓分拣手优先连储物棚而非更近的工房', () => {
    const sorter = mockDevice('sorter', 'logistics_sorter', 0, 0, 'store');
    const facility = mockDevice('fac', 'logistics_facility', 30, 0);
    const warehouse = mockDevice('wh', 'warehouse', 80, 0);
    const edges = buildProximityEdgesStable([sorter, facility, warehouse], LINK_RULES, RADIUS);
    expect(edgeKeys(edges)).toEqual(['sorter→wh']);
  });
});

describe('diffAutomationEdges', () => {
  it('正确识别新增与移除', () => {
    const relay = mockDevice('relay', 'auto_relay', 100, 0);
    const colA = mockDevice('colA', 'logistics_collect', 0, 0);
    const colB = mockDevice('colB', 'logistics_collect', 70, 0);

    const prev = buildProximityEdgesStable([colA, relay], LINK_RULES, RADIUS);
    const next = buildProximityEdgesStable([colB, relay], LINK_RULES, RADIUS, {
      prevEdges: prev,
      moverIds: new Set(['colB']),
    });

    const { added, removed } = diffAutomationEdges(prev, next);
    expect(edgeKeys(removed)).toEqual(['colA→relay']);
    expect(edgeKeys(added)).toEqual(['colB→relay']);
  });
});

describe('预览与结算一致性', () => {
  it('同一 opts 下 stable 与 simulate 结果一致', () => {
    const relay = mockDevice('relay', 'auto_relay', 100, 0);
    const col = mockDevice('col', 'logistics_collect', 0, 0);
    const sorter = mockDevice('sorter', 'logistics_sorter', 180, 0);
    const fac = mockDevice('fac', 'logistics_facility', 200, 50);
    const devices = [col, relay, sorter, fac];

    const prev = buildProximityEdgesStable(devices, LINK_RULES, RADIUS);
    const opts = {
      prevEdges: prev,
      moverIds: new Set(['col']),
      dragPositions: new Map([['col', { x: 60, y: 0 }]]),
    };

    const preview = buildProximityEdgesStable(devices, LINK_RULES, RADIUS, opts);
    const settle = buildProximityEdgesStable(devices, LINK_RULES, RADIUS, opts);
    expect(edgeKeys(preview)).toEqual(edgeKeys(settle));
  });
});

describe('buildProximityEdges (greedy baseline)', () => {
  it('无 prev 时更近的收集器会抢到传送器', () => {
    const relay = mockDevice('relay', 'auto_relay', 100, 0);
    const colA = mockDevice('colA', 'logistics_collect', 0, 0);
    const colB = mockDevice('colB', 'logistics_collect', 180, 0);
    const edges = buildProximityEdges([colB, colA, relay], LINK_RULES, RADIUS);
    expect(edgeKeys(edges)).toEqual(['colB→relay']);
  });
});
