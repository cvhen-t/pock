import Phaser from 'phaser';

import { consumeCardQuantity } from '../core/cardQuantity';
import type { CardStack, CardStackSystem } from './CardStackSystem';
import type { BarrierSystem } from './BarrierSystem';
import type { BaseCampSystem } from './BaseCampSystem';
/**
 * Stack-triggered defense interactions: repair base, reinforce barriers.
 */
export class DefenseCraftSystem {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly stacks: CardStackSystem,
    private readonly baseCamp: BaseCampSystem,
    private readonly barriers: BarrierSystem,
  ) {
    scene.events.on('stack-changed', (stack: CardStack) => this.onStackChanged(stack));
  }

  private onStackChanged(stack: CardStack): void {
    this.tryBaseSupply(stack);
    this.tryBaseRepair(stack);
    this.tryBarbedRoll(stack);
  }

  private tryBaseSupply(stack: CardStack): void {
    const delta = this.baseCamp.trySupplyFromStack(stack, this.stacks);
    if (delta.food <= 0 && delta.water <= 0) return;
    this.scene.events.emit('base-supply-deposited', delta);
    this.scene.events.emit('stack-changed', stack);
  }

  private tryBaseRepair(stack: CardStack): void {
    const healed = this.baseCamp.tryRepairFromStack(stack, this.stacks);
    if (healed) {
      this.scene.events.emit('stack-changed', stack);
    }
  }

  private tryBarbedRoll(stack: CardStack): void {
    const baseTags = stack.base.definition.tags ?? [];
    if (!baseTags.includes('barrier')) return;

    const roll = stack.members.find((m) => m.definition.id === 'barbed_roll');
    if (!roll) return;

    consumeCardQuantity(roll, 1, this.stacks);
    stack.members = stack.members.filter((m) => m.active);

    this.barriers.healBarrier(stack.base, 4);
    this.scene.events.emit('drag-toast', '铁丝网加固：路障 +4 耐久');
    this.scene.events.emit('stack-changed', stack);
  }
}
