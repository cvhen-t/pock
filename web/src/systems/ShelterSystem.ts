import Phaser from 'phaser';

import type { CardStack, CardStackSystem } from './CardStackSystem';
interface ShelterEffect {
  type: 'shelter';
  damageReduction?: number;
  chargesPerDay?: number;
}

/**
 * Survivors on shelter cards reduce base camp damage.
 */
export class ShelterSystem {
  private chargesLeft = 0;

  private maxChargesPerDay = 2;

  private reduction = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly stacks: CardStackSystem,
  ) {
    scene.events.on('stack-changed', () => this.refresh());
    scene.events.on('day-end', () => {
      if (this.maxChargesPerDay > 0) this.chargesLeft = this.maxChargesPerDay;
    });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {});
    this.refresh();
  }

  resetCharges(): void {
    this.chargesLeft = this.maxChargesPerDay;
  }

  /** Multiplier applied to base damage (e.g. 0.5 = half). */
  getBaseDamageMultiplier(): number {
    if (!this.isShelterActive() || this.chargesLeft <= 0) return 1;
    return 1 - this.reduction;
  }

  consumeCharge(): void {
    if (this.chargesLeft > 0) this.chargesLeft -= 1;
  }

  private isShelterActive(): boolean {
    for (const stack of this.stacks.getAllStacks()) {
      if (!this.stackHasShelter(stack)) continue;
      const pile = [stack.base, ...stack.members];
      if (pile.some((c) => (c.definition.tags ?? []).includes('survivor'))) {
        return true;
      }
    }
    return false;
  }

  private stackHasShelter(stack: CardStack): boolean {
    const tags = stack.base.definition.tags ?? [];
    if (tags.includes('shelter')) {
      const effect = stack.base.definition.effects?.find((e) => e.type === 'shelter') as
        | ShelterEffect
        | undefined;
      this.reduction = Phaser.Math.Clamp(effect?.damageReduction ?? 0.5, 0, 0.9);
      this.maxChargesPerDay =
        effect?.chargesPerDay ?? (effect as { chargesPerMoon?: number })?.chargesPerMoon ?? 2;
      return true;
    }
    return false;
  }

  private refresh(): void {
    this.isShelterActive();
  }
}
