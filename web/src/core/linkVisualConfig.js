export const REGISTRY_LINK_VISUAL = 'linkVisualConfig';
export function parseLinkVisual(raw) {
    return {
        edgeStyles: raw?.edgeStyles ?? {},
        activeEdgeColor: String(raw?.activeEdgeColor ?? '#8a9a7a'),
        inactiveEdgeColor: String(raw?.inactiveEdgeColor ?? '#5a5850'),
        previewEdgeColor: String(raw?.previewEdgeColor ?? '#5a8ac8'),
        inactiveAlpha: Number(raw?.inactiveAlpha ?? 0.35),
        previewAlpha: Number(raw?.previewAlpha ?? 0.55),
        endpointColor: String(raw?.endpointColor ?? '#c8a050'),
        blockedColor: String(raw?.blockedColor ?? '#b04040'),
        packetDotSize: Number(raw?.packetDotSize ?? 5),
        arrowSize: Number(raw?.arrowSize ?? 6),
        roleLabels: raw?.roleLabels ?? {},
    };
}
export function hexToNumber(hex) {
    if (typeof hex === 'number')
        return hex;
    return parseInt(String(hex).replace('#', ''), 16);
}
