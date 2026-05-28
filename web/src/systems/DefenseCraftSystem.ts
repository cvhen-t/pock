import Phaser from 'phaser';

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
    this.tryBaseRepair(stack);
    this.tryBarbedRoll(stack);
  }

  private tryBaseRepair(stack: CardStack): void {
    const healed = this.baseCamp.tryRepairFromStack(stack, (card) =>
      this.stacks.removeCardFromPlay(card),
    );
    if (healed) {
      this.scene.events.emit('stack-changed', stack);
    }
  }

  private tryBarbedRoll(stack: CardStack): void {
    const baseTags = stack.base.definition.tags ?? [];
    if (!baseTags.includes('barrier')) return;

    const roll = stack.members.find((m) => m.definition.id === 'barbed_roll');
    if (!roll) return;

    if (!this.stacks.removeCardFromPlay(roll)) return;
    roll.destroy();
    stack.members = stack.members.filter((m) => m !== roll);

    this.barriers.healBarrier(stack.base, 4);
    this.scene.events.emit('drag-toast', '铁丝网加固：路障 +4 耐久');
    this.scene.events.emit('stack-changed', stack);
  }
}
