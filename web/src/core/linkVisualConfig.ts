export interface LinkVisualConfig {
  edgeStyles: Record<string, { color?: string; width?: number }>;
  activeEdgeColor: string;
  inactiveEdgeColor: string;
  previewEdgeColor: string;
  inactiveAlpha: number;
  previewAlpha: number;
  endpointColor: string;
  blockedColor: string;
  packetDotSize: number;
  arrowSize: number;
  roleLabels: Record<string, string>;
}

export const REGISTRY_LINK_VISUAL = 'linkVisualConfig';

export function parseLinkVisual(raw: Record<string, unknown> | undefined): LinkVisualConfig {
  return {
    edgeStyles: (raw?.edgeStyles as LinkVisualConfig['edgeStyles']) ?? {},
    activeEdgeColor: String(raw?.activeEdgeColor ?? '#8a9a7a'),
    inactiveEdgeColor: String(raw?.inactiveEdgeColor ?? '#5a5850'),
    previewEdgeColor: String(raw?.previewEdgeColor ?? '#5a8ac8'),
    inactiveAlpha: Number(raw?.inactiveAlpha ?? 0.35),
    previewAlpha: Number(raw?.previewAlpha ?? 0.55),
    endpointColor: String(raw?.endpointColor ?? '#c8a050'),
    blockedColor: String(raw?.blockedColor ?? '#b04040'),
    packetDotSize: Number(raw?.packetDotSize ?? 5),
    arrowSize: Number(raw?.arrowSize ?? 6),
    roleLabels: (raw?.roleLabels as Record<string, string>) ?? {},
  };
}

export function hexToNumber(hex: string | number): number {
  if (typeof hex === 'number') return hex;
  return parseInt(String(hex).replace('#', ''), 16);
}
