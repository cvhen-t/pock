import Phaser from 'phaser';

import type { CardStack, CardStackSystem } from './CardStackSystem';
import { consumeCardQuantity, getCardQuantity } from '../core/cardQuantity';
import { CardHpBar } from '../ui/CardHpBar';
import GameCard from '../objects/GameCard';

export interface BaseCoreEffect {
  type: 'base_core';
  hp?: number;
  contactDamage?: number;
  contactCooldownSec?: number;
  healPerScrap?: number;
  dayRegen?: number;
}

/**
 * Single homestead card — enemies path here; HP 0 triggers game over.
 */
export class BaseCampSystem {
  private card: GameCard | null = null;

  private hp = 0;

  private maxHp = 0;

  private contactDamage = 1;

  private contactCooldownMs = 2000;

  private healPerScrap = 2;

  private dayRegen = 2;

  private hpBar?: CardHpBar;

  private destroyed = false;

  private damageMultiplier = 1;

  constructor(private readonly scene: Phaser.Scene) {
    scene.events.on('card-spawned', (c: GameCard) => this.tryRegister(c));
    scene.events.on('day-end', () => this.onDayEnd());
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());

    for (const child of scene.children.list) {
      if (child instanceof GameCard) this.tryRegister(child);
    }
  }

  destroy(): void {
    this.hpBar?.destroy();
    this.card = null;
  }

  tryRegister(card: GameCard): void {
    if (this.card || this.destroyed) return;
    const tags = card.definition.tags ?? [];
    if (!tags.includes('base')) return;

    const effect = card.definition.effects?.find((e) => e.type === 'base_core') as
      | BaseCoreEffect
      | undefined;

    this.card = card;
    this.maxHp = effect?.hp ?? 30;
    this.hp = this.maxHp;
    this.contactDamage = effect?.contactDamage ?? 1;
    this.contactCooldownMs = (effect?.contactCooldownSec ?? 2) * 1000;
    this.healPerScrap = effect?.healPerScrap ?? 2;
    this.dayRegen = effect?.dayRegen ?? (effect as { moonRegen?: number })?.moonRegen ?? 2;
    this.hpBar = new CardHpBar(card, this.scene);
    this.refreshHpBar();
    this.scene.events.emit('base-registered', this.card);
  }

  setDamageMultiplier(mult: number): void {
    this.damageMultiplier = Phaser.Math.Clamp(mult, 0.1, 1);
  }

  get isActive(): boolean {
    return this.card !== null && !this.destroyed && this.hp > 0;
  }

  getCard(): GameCard | null {
    return this.card;
  }

  getPosition(): { x: number; y: number } | null {
    if (!this.card?.active) return null;
    return { x: this.card.x, y: this.card.y };
  }

  getContactRadius(): number {
    if (!this.card) return 40;
    return Math.max(this.card.cardWidth, this.card.cardHeight) * 0.45;
  }

  getContactDamage(): number {
    return this.contactDamage;
  }

  getContactCooldownMs(): number {
    return this.contactCooldownMs;
  }

  getHp(): { hp: number; maxHp: number } {
    return { hp: this.hp, maxHp: this.maxHp };
  }

  damage(amount: number): void {
    if (!this.isActive || !this.card) return;

    const applied = Math.max(1, Math.round(amount * this.damageMultiplier));
    this.hp = Math.max(0, this.hp - applied);
    this.refreshHpBar();
    this.pulseDamage();

    this.scene.events.emit('base-hp-changed', { hp: this.hp, maxHp: this.maxHp, damage: applied });

    if (this.hp <= 0) {
      this.destroyed = true;
      this.scene.events.emit('base-destroyed', this.card);
    }
  }

  heal(amount: number): boolean {
    if (!this.card || this.destroyed) return false;
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    if (this.hp === before) return false;
    this.refreshHpBar();
    this.scene.events.emit('base-hp-changed', { hp: this.hp, maxHp: this.maxHp });
    return true;
  }

  /** Consume scrap stacked on base to repair. */
  tryRepairFromStack(stack: CardStack, stacks: CardStackSystem): boolean {
    if (!this.card || stack.base !== this.card) return false;

    const scrap = stack.members.find((m) => m.definition.id === 'scrap');
    if (!scrap) return false;

    consumeCardQuantity(scrap, 1, stacks);
    stack.members = stack.members.filter((m) => m.active);
    const healed = this.heal(this.healPerScrap);
    if (healed) {
      this.scene.events.emit('base-repaired', { amount: this.healPerScrap });
    }
    return healed;
  }

  /** Deposit food / clean water cards stacked on base into HUD supplies. */
  trySupplyFromStack(
    stack: CardStack,
    stacks: CardStackSystem,
  ): { food: number; water: number } {
    const empty = { food: 0, water: 0 };
    if (!this.card || stack.base !== this.card) return empty;

    let food = 0;
    let water = 0;
    const consumed: GameCard[] = [];

    for (const member of stack.members) {
      const tags = member.definition.tags ?? [];
      const qty = getCardQuantity(member);
      if (tags.includes('food')) {
        food += qty;
        consumed.push(member);
      } else if (tags.includes('water')) {
        water += qty;
        consumed.push(member);
      }
    }

    if (consumed.length === 0) return empty;

    for (const card of consumed) {
      consumeCardQuantity(card, getCardQuantity(card), stacks);
    }
    stack.members = stack.members.filter((m) => m.active);

    return { food, water };
  }

  private onDayEnd(): void {
    if (!this.isActive) return;
    if (this.dayRegen > 0) {
      this.heal(this.dayRegen);
      this.scene.events.emit('base-day-regen', { amount: this.dayRegen });
    }
  }

  private refreshHpBar(): void {
    if (!this.hpBar) return;
    const ratio = this.maxHp > 0 ? this.hp / this.maxHp : 0;
    const color = ratio > 0.5 ? 0x8b6914 : ratio > 0.25 ? 0x8b5a3a : 0x8b3a3a;
    this.hpBar.setRatio(ratio, color);
  }

  private pulseDamage(): void {
    if (!this.card) return;
    this.scene.tweens.add({
      targets: this.card,
      scale: 1.04,
      duration: 80,
      yoyo: true,
    });
  }
}
