export interface AutomationConfig {
  linkRadius: number;
  collectorPickupRadius: number;
  tickSeconds: number;
  linkTransitSeconds: number;
  maxPacketsPerChain: number;
  maxPullPerTick: number;
}

export const REGISTRY_AUTOMATION_CONFIG = 'automationConfig';

export function parseAutomationConfig(raw: Record<string, unknown> | undefined): AutomationConfig {
  return {
    linkRadius: Number(raw?.linkRadius ?? 220),
    collectorPickupRadius: Number(raw?.collectorPickupRadius ?? 182),
    tickSeconds: Number(raw?.tickSeconds ?? 1.2),
    linkTransitSeconds: Number(raw?.linkTransitSeconds ?? 1.5),
    maxPacketsPerChain: Number(raw?.maxPacketsPerChain ?? 6),
    maxPullPerTick: Number(raw?.maxPullPerTick ?? 1),
  };
}
