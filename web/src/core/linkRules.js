const ROLE_PRIORITY = [
    'logistics_collect',
    'auto_relay',
    'logistics_sorter',
    'logistics_depot',
    'logistics_facility',
    'shop',
    'warehouse',
];
export function getLogisticsRole(tags = []) {
    for (const role of ROLE_PRIORITY) {
        if (tags.includes(role))
            return role;
    }
    return null;
}
export function parseLinkRules(raw) {
    const connections = raw?.connections ?? [];
    return connections.map((c) => {
        const row = c;
        return {
            from: String(row.from),
            to: String(row.to),
            maxOut: Number(row.maxOut ?? 1),
            maxIn: Number(row.maxIn ?? 1),
            priority: Number(row.priority ?? 0),
        };
    });
}
export function edgeStyleKey(fromRole, toRole) {
    return `${fromRole}→${toRole}`;
}
