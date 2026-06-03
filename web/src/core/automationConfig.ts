export interface AutomationConfig {
  linkRadius: number;
  collectorPickupRadius: number;
  tickSeconds: number;
  linkTransitSeconds: number;
  /** @deprecated 使用 maxPacketsPerRelay */
  maxPacketsPerChain: number;
  maxPacketsPerRelay: number;
  maxPullPerTick: number;
  /** 每 relay 每 tick 最多注入包裹数 */
  maxInjectPerRelayPerTick: number;
  /** 入站优先级（高在前） */
  sourceInjectPriority: string[];
  /** 阻塞包裹超过该 tick 数后丢弃 */
  packetBlockedPurgeTicks: number;
}

export const REGISTRY_AUTOMATION_CONFIG = 'automationConfig';

const DEFAULT_SOURCE_PRIORITY = [
  'logistics_facility',
  'warehouse',
  'logistics_depot',
  'logistics_collect',
];

export function parseAutomationConfig(raw: Record<string, unknown> | undefined): AutomationConfig {
  const maxPackets =
    Number(raw?.maxPacketsPerRelay ?? raw?.maxPacketsPerChain ?? 6) || 6;
  const priorityRaw = raw?.sourceInjectPriority;
  const sourceInjectPriority = Array.isArray(priorityRaw)
    ? priorityRaw.map(String)
    : DEFAULT_SOURCE_PRIORITY;

  return {
    linkRadius: Number(raw?.linkRadius ?? 220),
    collectorPickupRadius: Number(raw?.collectorPickupRadius ?? 182),
    tickSeconds: Number(raw?.tickSeconds ?? 1.2),
    linkTransitSeconds: Number(raw?.linkTransitSeconds ?? 1.5),
    maxPacketsPerChain: maxPackets,
    maxPacketsPerRelay: maxPackets,
    maxPullPerTick: Number(raw?.maxPullPerTick ?? 1),
    maxInjectPerRelayPerTick: Number(raw?.maxInjectPerRelayPerTick ?? 1),
    sourceInjectPriority,
    packetBlockedPurgeTicks: Number(raw?.packetBlockedPurgeTicks ?? 12),
  };
}
