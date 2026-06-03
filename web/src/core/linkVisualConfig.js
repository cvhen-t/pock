const DEFAULT_LINK_HINTS = {
    willConnect: '松手后将连接{target}',
    willDisconnect: '将断开：{from}→{to}',
    slotTaken: '{target}已被{occupant}占用',
    tooFar: '靠近{target}还差{distance}px',
    inRangeConnect: '范围内可连接{target}，松手即可',
};
export const REGISTRY_LINK_VISUAL = 'linkVisualConfig';
export function parseLinkVisual(raw) {
    const hints = raw?.linkHints ?? {};
    return {
        edgeStyles: raw?.edgeStyles ?? {},
        activeEdgeColor: String(raw?.activeEdgeColor ?? '#8a9a7a'),
        inactiveEdgeColor: String(raw?.inactiveEdgeColor ?? '#5a5850'),
        previewEdgeColor: String(raw?.previewEdgeColor ?? '#5a8ac8'),
        breakEdgeColor: String(raw?.breakEdgeColor ?? '#b04040'),
        inactiveAlpha: Number(raw?.inactiveAlpha ?? 0.35),
        previewAlpha: Number(raw?.previewAlpha ?? 0.55),
        breakAlpha: Number(raw?.breakAlpha ?? 0.75),
        blockedCandidateAlpha: Number(raw?.blockedCandidateAlpha ?? 0.4),
        endpointColor: String(raw?.endpointColor ?? '#c8a050'),
        blockedColor: String(raw?.blockedColor ?? '#b04040'),
        packetDotSize: Number(raw?.packetDotSize ?? 5),
        arrowSize: Number(raw?.arrowSize ?? 6),
        dashLength: Number(raw?.dashLength ?? 8),
        dashGap: Number(raw?.dashGap ?? 6),
        roleLabels: raw?.roleLabels ?? {},
        linkHints: {
            willConnect: hints.willConnect ?? DEFAULT_LINK_HINTS.willConnect,
            willDisconnect: hints.willDisconnect ?? DEFAULT_LINK_HINTS.willDisconnect,
            slotTaken: hints.slotTaken ?? DEFAULT_LINK_HINTS.slotTaken,
            tooFar: hints.tooFar ?? DEFAULT_LINK_HINTS.tooFar,
            inRangeConnect: hints.inRangeConnect ?? DEFAULT_LINK_HINTS.inRangeConnect,
        },
    };
}
/** 替换 `{key}` 占位符 */
export function formatLinkHint(template, vars) {
    let out = template;
    for (const [key, value] of Object.entries(vars)) {
        out = out.replaceAll(`{${key}}`, value);
    }
    return out;
}
export function hexToNumber(hex) {
    if (typeof hex === 'number')
        return hex;
    return parseInt(String(hex).replace('#', ''), 16);
}
