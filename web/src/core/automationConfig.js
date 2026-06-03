export const REGISTRY_AUTOMATION_CONFIG = 'automationConfig';
const DEFAULT_SOURCE_PRIORITY = [
    'logistics_facility',
    'warehouse',
    'logistics_depot',
    'logistics_collect',
];
export function parseAutomationConfig(raw) {
    const maxPackets = Number(raw?.maxPacketsPerRelay ?? raw?.maxPacketsPerChain ?? 6) || 6;
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
