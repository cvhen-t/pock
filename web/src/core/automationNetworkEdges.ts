import type { LinkConnectionRule } from './linkRules';
import { SORT_MODE_KEY, type LogisticsDevice, type SortModeId } from './sortHandRules';

/** 分拣手下游候选角色（与 sortHandRules.SORT_MODES 一致，避免循环依赖） */
function downstreamRolesForSortMode(mode: SortModeId): string[] {
  switch (mode) {
    case 'sell':
    case 'buy':
      return ['shop'];
    case 'store':
      return ['warehouse'];
    case 'feed':
      return ['logistics_facility', 'logistics_depot'];
    default:
      return ['logistics_facility', 'logistics_depot'];
  }
}

function getDeviceSortMode(device: LogisticsDevice): SortModeId {
  const mode = device.card.getData(SORT_MODE_KEY) as SortModeId | undefined;
  if (mode === 'sell' || mode === 'buy' || mode === 'store' || mode === 'feed') return mode;
  return 'feed';
}

export interface AutomationEdgeLite {
  from: LogisticsDevice;
  to: LogisticsDevice;
  fromRole: string;
  toRole: string;
}

export interface BuildEdgeOptions {
  /** 上一帧连边，用于 incumbent 锁定 */
  prevEdges?: AutomationEdgeLite[];
  /** 本次拖拽/放置中的设备 id */
  moverIds?: Set<string>;
  /** 拖拽中的临时坐标（覆盖 card.x/y） */
  dragPositions?: Map<string, { x: number; y: number }>;
}

export interface EdgeDiff {
  added: AutomationEdgeLite[];
  removed: AutomationEdgeLite[];
}

function devicePos(device: LogisticsDevice, opts?: BuildEdgeOptions): { x: number; y: number } {
  const drag = opts?.dragPositions?.get(device.id);
  if (drag) return drag;
  return { x: device.card.x, y: device.card.y };
}

export function deviceDist(
  a: LogisticsDevice,
  b: LogisticsDevice,
  opts?: BuildEdgeOptions,
): number {
  const pa = devicePos(a, opts);
  const pb = devicePos(b, opts);
  return Math.hypot(pa.x - pb.x, pa.y - pb.y);
}

function edgePairKey(fromId: string, toId: string): string {
  return `${fromId}→${toId}`;
}

function findRule(
  rules: LinkConnectionRule[],
  fromRole: string,
  toRole: string,
): LinkConnectionRule | undefined {
  return rules.find((r) => r.from === fromRole && r.to === toRole);
}

function hasSorterDownstream(edges: AutomationEdgeLite[], sorterId: string): boolean {
  return edges.some((e) => e.from.id === sorterId && e.fromRole === 'logistics_sorter');
}

function countOut(edges: AutomationEdgeLite[], fromId: string, toRole: string): number {
  return edges.filter((e) => e.from.id === fromId && e.toRole === toRole).length;
}

function countIn(edges: AutomationEdgeLite[], toId: string, fromRole: string): number {
  return edges.filter((e) => e.to.id === toId && e.fromRole === fromRole).length;
}

function sorterInTaken(edges: AutomationEdgeLite[], sorterId: string): boolean {
  return edges.some((e) => e.to.id === sorterId && e.toRole === 'logistics_sorter');
}

function removeEdgeAt(
  edges: AutomationEdgeLite[],
  index: number,
): AutomationEdgeLite {
  const [removed] = edges.splice(index, 1);
  return removed;
}

/** 为 mover 腾出 to 端 maxIn 槽位：移除同角色入边中距离更远的 incumbent */
function preemptInboundSlot(
  edges: AutomationEdgeLite[],
  from: LogisticsDevice,
  to: LogisticsDevice,
  rule: LinkConnectionRule,
  opts?: BuildEdgeOptions,
): boolean {
  const incoming = edges.filter(
    (e) => e.to.id === to.id && e.fromRole === rule.from && e.toRole === rule.to,
  );
  if (incoming.length === 0) return true;

  const newDist = deviceDist(from, to, opts);
  let removed = false;
  for (const e of [...incoming].sort(
    (a, b) => deviceDist(b.from, to, opts) - deviceDist(a.from, to, opts),
  )) {
    const incDist = deviceDist(e.from, to, opts);
    if (newDist < incDist) {
      removeEdgeAt(edges, edges.indexOf(e));
      removed = true;
    }
  }
  if (!removed) return false;

  if (to.role === 'logistics_sorter' && !sorterInTaken(edges, to.id)) {
    // sorter slot freed
  }
  return countIn(edges, to.id, rule.from) < rule.maxIn;
}

/** 为 mover 腾出 from 端 maxOut 槽位 */
function preemptOutboundSlot(
  edges: AutomationEdgeLite[],
  from: LogisticsDevice,
  to: LogisticsDevice,
  rule: LinkConnectionRule,
  opts?: BuildEdgeOptions,
): boolean {
  const outgoing = edges
    .map((e, i) => ({ e, i }))
    .filter(
      ({ e }) =>
        e.from.id === from.id && e.fromRole === rule.from && e.toRole === rule.to,
    );
  if (outgoing.length === 0) return true;

  const newDist = deviceDist(from, to, opts);
  let removed = false;
  for (const { e } of [...outgoing].sort(
    (a, b) => deviceDist(from, b.e.to, opts) - deviceDist(from, a.e.to, opts),
  )) {
    const incDist = deviceDist(from, e.to, opts);
    if (newDist < incDist) {
      const idx = edges.indexOf(e);
      if (idx >= 0) removeEdgeAt(edges, idx);
      removed = true;
    }
  }
  return removed && countOut(edges, from.id, rule.to) < rule.maxOut;
}

function tryAddEdge(
  edges: AutomationEdgeLite[],
  from: LogisticsDevice,
  to: LogisticsDevice,
  rule: LinkConnectionRule,
): boolean {
  if (edges.some((e) => e.from.id === from.id && e.to.id === to.id)) return false;

  const out = countOut(edges, from.id, rule.to);
  const inn = countIn(edges, to.id, rule.from);
  if (out >= rule.maxOut || inn >= rule.maxIn) return false;

  if (to.role === 'logistics_sorter' && sorterInTaken(edges, to.id)) return false;

  edges.push({
    from,
    to,
    fromRole: rule.from,
    toRole: rule.to,
  });
  return true;
}

function tryAddEdgeAsMover(
  edges: AutomationEdgeLite[],
  from: LogisticsDevice,
  to: LogisticsDevice,
  rule: LinkConnectionRule,
  linkRadius: number,
  opts?: BuildEdgeOptions,
): boolean {
  if (edges.some((e) => e.from.id === from.id && e.to.id === to.id)) return false;
  if (deviceDist(from, to, opts) > linkRadius) return false;

  let out = countOut(edges, from.id, rule.to);
  let inn = countIn(edges, to.id, rule.from);

  if (inn >= rule.maxIn) {
    if (!preemptInboundSlot(edges, from, to, rule, opts)) return false;
    inn = countIn(edges, to.id, rule.from);
  }

  if (out >= rule.maxOut) {
    if (!preemptOutboundSlot(edges, from, to, rule, opts)) return false;
    out = countOut(edges, from.id, rule.to);
  }

  if (to.role === 'logistics_sorter' && sorterInTaken(edges, to.id)) {
    const incoming = edges.filter(
      (e) => e.to.id === to.id && e.toRole === 'logistics_sorter',
    );
    const newDist = deviceDist(from, to, opts);
    const farthest = incoming.reduce((best, e) => {
      const d = deviceDist(e.from, to, opts);
      return !best || d > deviceDist(best.from, to, opts) ? e : best;
    }, null as AutomationEdgeLite | null);
    if (farthest && newDist < deviceDist(farthest.from, to, opts)) {
      const idx = edges.indexOf(farthest);
      if (idx >= 0) removeEdgeAt(edges, idx);
    } else if (sorterInTaken(edges, to.id)) {
      return false;
    }
  }

  return tryAddEdge(edges, from, to, rule);
}

function lockPrevEdges(
  edges: AutomationEdgeLite[],
  devices: LogisticsDevice[],
  rules: LinkConnectionRule[],
  linkRadius: number,
  prevEdges: AutomationEdgeLite[],
  opts?: BuildEdgeOptions,
): void {
  const byId = new Map(devices.map((d) => [d.id, d]));

  for (const prev of prevEdges) {
    const from = byId.get(prev.from.id);
    const to = byId.get(prev.to.id);
    if (!from || !to) continue;

    const rule = findRule(rules, prev.fromRole, prev.toRole);
    if (!rule) continue;
    if (from.role !== prev.fromRole || to.role !== prev.toRole) continue;
    if (deviceDist(from, to, opts) > linkRadius) continue;
    if (edges.some((e) => edgePairKey(e.from.id, e.to.id) === edgePairKey(from.id, to.id))) {
      continue;
    }

    const out = countOut(edges, from.id, rule.to);
    const inn = countIn(edges, to.id, rule.from);
    if (out >= rule.maxOut || inn >= rule.maxIn) continue;
    if (to.role === 'logistics_sorter' && sorterInTaken(edges, to.id)) continue;

    tryAddEdge(edges, from, to, rule);
  }
}

function attachSorterDownstreams(
  devices: LogisticsDevice[],
  edges: AutomationEdgeLite[],
  rules: LinkConnectionRule[],
  linkRadius: number,
  moverIds?: Set<string>,
  opts?: BuildEdgeOptions,
): void {
  const downRules = rules.filter((r) => r.from === 'logistics_sorter');

  for (const sorter of devices.filter((d) => d.role === 'logistics_sorter')) {
    const existing = edges.find(
      (e) => e.from.id === sorter.id && e.fromRole === 'logistics_sorter',
    );

    const allowedRoles = new Set(downstreamRolesForSortMode(getDeviceSortMode(sorter)));
    let best: { to: LogisticsDevice; rule: LinkConnectionRule; d: number } | null = null;
    for (const rule of downRules) {
      if (!allowedRoles.has(rule.to)) continue;
      for (const to of devices.filter((d) => d.role === rule.to)) {
        if (to.card === sorter.card) continue;
        const d = deviceDist(sorter, to, opts);
        if (d > linkRadius) continue;
        if (!best || d < best.d) best = { to, rule, d };
      }
    }

    if (!best) continue;

    if (existing) {
      const isMover = moverIds?.has(sorter.id) ?? false;
      if (!isMover) continue;
      const curDist = deviceDist(sorter, existing.to, opts);
      if (best.d >= curDist && best.to.id === existing.to.id) continue;
      const idx = edges.indexOf(existing);
      if (idx >= 0) removeEdgeAt(edges, idx);
    } else if (hasSorterDownstream(edges, sorter.id)) {
      continue;
    }

    const inn = countIn(edges, best.to.id, best.rule.from);
    if (inn >= best.rule.maxIn) continue;

    tryAddEdge(edges, sorter, best.to, best.rule);
  }
}

/** 全量最近邻贪心（无 incumbent 锁定） */
export function buildProximityEdges(
  devices: LogisticsDevice[],
  rules: LinkConnectionRule[],
  linkRadius: number,
  opts?: BuildEdgeOptions,
): AutomationEdgeLite[] {
  const edges: AutomationEdgeLite[] = [];
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    if (rule.from === 'logistics_sorter') continue;

    const fromList = devices.filter((d) => d.role === rule.from);
    const toList = devices.filter((d) => d.role === rule.to);

    for (const from of fromList) {
      const candidates = toList
        .filter((to) => to.card !== from.card)
        .map((to) => ({ to, d: deviceDist(from, to, opts) }))
        .filter((x) => x.d <= linkRadius)
        .sort((a, b) => a.d - b.d || a.to.id.localeCompare(b.to.id));

      for (const { to } of candidates) {
        const isMover = opts?.moverIds?.has(from.id) ?? false;
        if (isMover) {
          tryAddEdgeAsMover(edges, from, to, rule, linkRadius, opts);
        } else {
          tryAddEdge(edges, from, to, rule);
        }
      }
    }
  }

  attachSorterDownstreams(devices, edges, rules, linkRadius, opts?.moverIds, opts);
  return edges;
}

/**
 * 稳定建图：先锁定仍有效的既有边，再填充；仅 mover 可抢占已满 slot。
 */
export function buildProximityEdgesStable(
  devices: LogisticsDevice[],
  rules: LinkConnectionRule[],
  linkRadius: number,
  opts?: BuildEdgeOptions,
): AutomationEdgeLite[] {
  const edges: AutomationEdgeLite[] = [];
  const prev = opts?.prevEdges ?? [];
  const moverIds = opts?.moverIds ?? new Set<string>();

  if (prev.length > 0) {
    lockPrevEdges(edges, devices, rules, linkRadius, prev, opts);
  }

  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    if (rule.from === 'logistics_sorter') continue;

    const fromList = devices
      .filter((d) => d.role === rule.from)
      .sort((a, b) => a.id.localeCompare(b.id));

    const toList = devices.filter((d) => d.role === rule.to);

    for (const from of fromList) {
      const candidates = toList
        .filter((to) => to.card !== from.card)
        .map((to) => ({ to, d: deviceDist(from, to, opts) }))
        .filter((x) => x.d <= linkRadius)
        .sort((a, b) => a.d - b.d || a.to.id.localeCompare(b.to.id));

      for (const { to } of candidates) {
        const isMover = moverIds.has(from.id);
        if (isMover) {
          tryAddEdgeAsMover(edges, from, to, rule, linkRadius, opts);
        } else {
          tryAddEdge(edges, from, to, rule);
        }
      }
    }
  }

  attachSorterDownstreams(devices, edges, rules, linkRadius, moverIds, opts);
  return edges;
}

export function diffAutomationEdges(
  prev: AutomationEdgeLite[],
  next: AutomationEdgeLite[],
): EdgeDiff {
  const key = (e: AutomationEdgeLite) => edgePairKey(e.from.id, e.to.id);
  const prevKeys = new Set(prev.map(key));
  const nextKeys = new Set(next.map(key));
  return {
    added: next.filter((e) => !prevKeys.has(key(e))),
    removed: prev.filter((e) => !nextKeys.has(key(e))),
  };
}
