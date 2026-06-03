import type { BuildEdgeOptions } from './automationNetworkEdges';
import { getLogisticsRole } from './linkRules';
import type GameCard from '../objects/GameCard';

export function logisticsDeviceId(card: GameCard): string {
  return card.stackId ?? `solo_${card.x}_${card.y}`;
}

/** 拖拽中的物流设备 → stable 建图 opts */
export function buildLogisticsDragOptions(cards: GameCard[]): BuildEdgeOptions | undefined {
  const moverIds = new Set<string>();
  const dragPositions = new Map<string, { x: number; y: number }>();

  for (const card of cards) {
    if (!getLogisticsRole(card.definition.tags ?? [])) continue;
    const id = logisticsDeviceId(card);
    moverIds.add(id);
    dragPositions.set(id, { x: card.x, y: card.y });
  }

  if (moverIds.size === 0) return undefined;
  return { moverIds, dragPositions };
}
