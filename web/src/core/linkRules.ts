export interface LinkConnectionRule {
  from: string;
  to: string;
  maxOut: number;
  maxIn: number;
  priority: number;
}

const ROLE_PRIORITY = [
  'logistics_collect',
  'auto_relay',
  'logistics_sorter',
  'logistics_depot',
  'logistics_facility',
  'shop',
  'warehouse',
];

export function getLogisticsRole(tags: string[] = []): string | null {
  for (const role of ROLE_PRIORITY) {
    if (tags.includes(role)) return role;
  }
  if (tags.includes('craft_station')) return 'logistics_facility';
  return null;
}

export function parseLinkRules(raw: { connections?: unknown[] } | undefined): LinkConnectionRule[] {
  const connections = raw?.connections ?? [];
  return connections.map((c) => {
    const row = c as Record<string, unknown>;
    return {
      from: String(row.from),
      to: String(row.to),
      maxOut: Number(row.maxOut ?? 1),
      maxIn: Number(row.maxIn ?? 1),
      priority: Number(row.priority ?? 0),
    };
  });
}

export function edgeStyleKey(fromRole: string, toRole: string): string {
  return `${fromRole}→${toRole}`;
}
