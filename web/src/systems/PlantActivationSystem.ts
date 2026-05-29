import Phaser from 'phaser';

import GameCard from '../objects/GameCard';
import type { CardStack, CardStackSystem } from './CardStackSystem';

const DORMANT_ALPHA = 0.72;

interface PlantActivationEffect {
  type: 'plant_activation';
  consumeCardId?: string;
  toast?: string;
}

export class PlantActivationSystem {
  private readonly activated = new Set<GameCard>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly stacks: CardStackSystem,
  ) {
    scene.registry.set('plantActivation', this);
    scene.events.on('stack-changed', (stack: CardStack) => this.onStackChanged(stack));
    scene.events.on('card-spawned', (card: GameCard) => this.onCardSpawned(card));
    scene.events.on('mutant-growth-complete', ({ card }: { card: GameCard }) =>
      this.onCardSpawned(card),
    );
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.registry.remove('plantActivation');
    });

    for (const child of scene.children.list) {
      if (child instanceof GameCard) this.onCardSpawned(child);
    }
  }

  isActivated(plant: GameCard): boolean {
    return this.activated.has(plant);
  }

  canStackActivator(plant: GameCard): boolean {
    if (this.isActivated(plant)) return false;
    return plant.definition.effects?.some((e) => e.type === 'plant_activation') ?? false;
  }

  needsActivation(plant: GameCard): boolean {
    return plant.definition.effects?.some((e) => e.type === 'defense_turret' && e.requiresActivation) ?? false;
  }

  private onCardSpawned(card: GameCard): void {
    if (!this.needsActivation(card) || this.isActivated(card)) return;
    card.setAlpha(DORMANT_ALPHA);
  }

  private onStackChanged(stack: CardStack): void {
    if (this.isActivated(stack.base)) return;

    const effect = stack.base.definition.effects?.find(
      (e) => e.type === 'plant_activation',
    ) as PlantActivationEffect | undefined;
    if (!effect) return;

    const consumeId = effect.consumeCardId ?? '';
    if (!consumeId) return;

    const activator = stack.members.find((m) => m.definition.id === consumeId);
    if (!activator) return;

    if (!this.stacks.removeCardFromPlay(activator)) return;
    activator.destroy();
    stack.members = stack.members.filter((m) => m !== activator);

    this.activated.add(stack.base);
    stack.base.setAlpha(1);

    this.scene.events.emit('plant-activated', {
      card: stack.base,
      plantId: stack.base.definition.id,
    });
    this.scene.events.emit(
      'drag-toast',
      effect.toast ?? '植物已激活',
    );
    this.stacks.layoutStack(stack);
    this.scene.events.emit('stack-changed', stack);
  }
}
