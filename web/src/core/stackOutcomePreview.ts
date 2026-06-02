import { dataStore } from './DataStore';
import { getCardQuantity, isQuantityMergePair } from './cardQuantity';
import { previewFacilityRecipe } from './recipeMatch';
import type GameCard from '../objects/GameCard';
import type { CardDefinition } from '../types/gameData';
import { isWarehouseStorable } from './storageInventory';
import type { CardStackSystem } from '../systems/CardStackSystem';
import { getCraftStationId } from '../systems/CraftStationSystem';
import { getRanchPenEffect } from '../systems/RanchSystem';

export interface StackDropPreview {
  primary: string;
  secondary?: string;
}

interface SpawnTimerEffect {
  type: 'spawn_timer';
  outputCardId?: string;
  intervalSeconds?: number;
}

interface PlantMutantEffect {
  type: 'plant_mutant';
  growthSeconds?: number;
}

interface ShelterEffect {
  type: 'shelter';
  damageReduction?: number;
}

interface BaseCoreEffect {
  type: 'base_core';
  healPerScrap?: number;
}

/** Human-readable outcome when dropping `dragged` onto `target`. */
export function describeStackDrop(
  stacks: CardStackSystem,
  dragged: GameCard,
  target: GameCard,
): StackDropPreview | null {
  if (!stacks.wouldAcceptStack(dragged, target)) return null;

  const targetStack = stacks.resolveStackForCard(target);
  const base = targetStack.base;
  const baseTags = base.definition.tags ?? [];
  const dragTags = dragged.definition.tags ?? [];
  const dragId = dragged.definition.id;

  if (isQuantityMergePair(dragged, target)) {
    const total = dragged.quantity + target.quantity;
    return { primary: `合并 ×${total}`, secondary: target.definition.name };
  }

  if (dragId === 'scrap' && baseTags.includes('base')) {
    const heal = getBaseCoreEffect(base.definition)?.healPerScrap ?? 2;
    return { primary: `本营 +${heal} 耐久`, secondary: '消耗零件' };
  }

  if (dragTags.includes('food') && baseTags.includes('base')) {
    const qty = getCardQuantity(dragged);
    return {
      primary: qty > 1 ? `食物 +${qty}` : '食物 +1',
      secondary: '存入大本营',
    };
  }

  if (dragTags.includes('water') && baseTags.includes('base')) {
    const qty = getCardQuantity(dragged);
    return {
      primary: qty > 1 ? `净水 +${qty}` : '净水 +1',
      secondary: '存入大本营',
    };
  }

  if (dragId === 'barbed_roll' && baseTags.includes('barrier')) {
    return { primary: '路障 +4 耐久', secondary: '消耗铁丝网卷' };
  }

  if (dragTags.includes('survivor') && baseTags.includes('worksite')) {
    const effect = getSpawnEffect(base.definition);
    if (effect?.outputCardId) {
      const outName =
        dataStore.getCard(effect.outputCardId)?.name ?? effect.outputCardId;
      const interval = effect.intervalSeconds;
      return {
        primary: `产出：${outName}`,
        secondary: interval ? `每 ${interval} 秒` : undefined,
      };
    }
    return { primary: '开始劳作' };
  }

  if (dragTags.includes('mutant_seed') && baseTags.includes('blight_plot')) {
    const effect = getPlantEffect(base.definition);
    const sec = effect?.growthSeconds;
    return {
      primary: '种植生长',
      secondary: sec ? `约 ${sec} 秒后变异植物` : '变异植物',
    };
  }

  if (
    dragTags.includes('seed') &&
    !dragTags.includes('mutant_seed') &&
    baseTags.includes('farmland')
  ) {
    const effect = getPlantEffect(base.definition);
    const sec = effect?.growthSeconds;
    return {
      primary: '播种生长',
      secondary: sec ? `约 ${sec} 秒后收成` : '作物收成',
    };
  }

  const stationId = getCraftStationId(base.definition);
  if (stationId && baseTags.includes('craft_station')) {
    const members = [...targetStack.members, dragged];
    const currentDay = 1;
    const recipe = previewFacilityRecipe(
      stationId,
      members,
      dataStore.getRecipes(),
      currentDay,
    );
    if (recipe) {
      const outName =
        recipe.output.cardId === '_same_seed'
          ? '同种种子'
          : (dataStore.getCard(recipe.output.cardId)?.name ?? recipe.output.cardId);
      const sec = recipe.workSeconds ?? 8;
      return {
        primary: `合成：${outName}`,
        secondary: `${sec} 秒`,
      };
    }
    return { primary: '投入材料' };
  }

  if (baseTags.includes('ranch')) {
    const pen = getRanchPenEffect(base.definition);
    if (dragTags.includes('feed')) {
      const sec = pen?.produce?.intervalSeconds;
      return {
        primary: '补充饲料',
        secondary: sec ? `周期产出约 ${sec} 秒` : undefined,
      };
    }
    if (dragTags.includes('animal')) {
      return { primary: '放入畜栏', secondary: '需搭配饲料产出' };
    }
  }

  if (baseTags.includes('warehouse')) {
    if (!isWarehouseStorable(dragTags)) return null;
    return { primary: '暂存物品' };
  }

  if (dragTags.includes('survivor') && baseTags.includes('shelter')) {
    const effect = getShelterEffect(base.definition);
    const pct = Math.round((effect?.damageReduction ?? 0.5) * 100);
    return { primary: `本营受伤 -${pct}%`, secondary: '掩体庇护' };
  }

  if (dragTags.includes('survivor') && baseTags.includes('base')) {
    return { primary: '驻守本营' };
  }

  if (dragTags.includes('weapon')) {
    const pile: GameCard[] = [targetStack.base, ...targetStack.members];
    if (pile.some((c) => (c.definition.tags ?? []).includes('survivor'))) {
      return { primary: '装备武器' };
    }
  }

  return null;
}

function getSpawnEffect(def: CardDefinition): SpawnTimerEffect | undefined {
  return def.effects?.find((e) => e.type === 'spawn_timer') as SpawnTimerEffect | undefined;
}

function getPlantEffect(def: CardDefinition): PlantMutantEffect | undefined {
  return def.effects?.find((e) => e.type === 'plant_mutant') as PlantMutantEffect | undefined;
}

function getShelterEffect(def: CardDefinition): ShelterEffect | undefined {
  return def.effects?.find((e) => e.type === 'shelter') as ShelterEffect | undefined;
}

function getBaseCoreEffect(def: CardDefinition): BaseCoreEffect | undefined {
  return def.effects?.find((e) => e.type === 'base_core') as BaseCoreEffect | undefined;
}
