import type { CardIconKind } from './cardIconKinds';

/** Minimal 2D API shared by Phaser.Graphics and node-canvas. */
export interface IconDrawCtx {
  fillStyle(color: number, alpha?: number): void;
  strokeStyle(color: number, width: number, alpha?: number): void;
  fillCircle(x: number, y: number, r: number): void;
  strokeCircle(x: number, y: number, r: number): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  fillRoundedRect(x: number, y: number, w: number, h: number, r: number): void;
  fillEllipse(x: number, y: number, rw: number, rh: number): void;
  strokeEllipse(x: number, y: number, rw: number, rh: number): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  fillTriangle(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void;
  strokeRoundedRect(x: number, y: number, w: number, h: number, r: number): void;
}

/** No-op: icons use transparent background (see cardIconOutline for white edge). */
export function drawIconFrame(_ctx: IconDrawCtx, _size: number): void {}

export function drawIconKind(ctx: IconDrawCtx, kind: CardIconKind, size: number): void {
  const cx = size / 2;
  const cy = size / 2;
  const s = size / 56;
  switch (kind) {
    case 'survivor':
      drawSurvivor(ctx, cx, cy, s);
      break;
    case 'bush':
      drawBush(ctx, cx, cy, s);
      break;
    case 'berry':
      drawBerry(ctx, cx, cy, s);
      break;
    case 'scrap_pile':
      drawScrapPile(ctx, cx, cy, s);
      break;
    case 'scrap':
      drawScrap(ctx, cx, cy, s);
      break;
    case 'scrap_bundle':
      drawScrapBundle(ctx, cx, cy, s);
      break;
    case 'rust_shard':
      drawRustShard(ctx, cx, cy, s);
      break;
    case 'base_camp':
      drawBaseCamp(ctx, cx, cy, s);
      break;
    case 'trader_post':
      drawTrader(ctx, cx, cy, s);
      break;
    case 'shop':
      drawShop(ctx, cx, cy, s);
      break;
    case 'blight_plot':
    case 'farmland':
    case 'bunker_sheet':
      drawSoilPlot(ctx, cx, cy, s, kind === 'farmland' ? 0x4a5a38 : 0x3a4a32);
      break;
    case 'soil_clump':
      drawSoilClump(ctx, cx, cy, s);
      break;
    case 'seed':
      drawSeed(ctx, cx, cy, s);
      break;
    case 'plant_thornvine':
      drawPlantThorn(ctx, cx, cy, s);
      break;
    case 'plant_sporegun':
      drawPlantSpore(ctx, cx, cy, s);
      break;
    case 'plant_snare_root':
      drawPlantSnare(ctx, cx, cy, s);
      break;
    case 'plant_acid_bloom':
      drawPlantAcid(ctx, cx, cy, s);
      break;
    case 'plant_weed':
      drawWeed(ctx, cx, cy, s);
      break;
    case 'water_dirty':
      drawWater(ctx, cx, cy, s, false);
      break;
    case 'water_clean':
      drawWater(ctx, cx, cy, s, true);
      break;
    case 'canned':
      drawCan(ctx, cx, cy, s);
      break;
    case 'caps':
      drawCaps(ctx, cx, cy, s);
      break;
    case 'wood_plank':
      drawPlank(ctx, cx, cy, s);
      break;
    case 'timber':
      drawTimber(ctx, cx, cy, s);
      break;
    case 'plant_fiber':
      drawFiber(ctx, cx, cy, s);
      break;
    case 'stone':
      drawStone(ctx, cx, cy, s);
      break;
    case 'mushroom_cap':
      drawMushroomCap(ctx, cx, cy, s);
      break;
    case 'reed_stalk':
      drawReedStalk(ctx, cx, cy, s);
      break;
    case 'tar':
      drawTar(ctx, cx, cy, s);
      break;
    case 'glass':
      drawGlass(ctx, cx, cy, s);
      break;
    case 'charcoal':
      drawCharcoal(ctx, cx, cy, s);
      break;
    case 'rope':
      drawRope(ctx, cx, cy, s);
      break;
    case 'compost':
      drawCompost(ctx, cx, cy, s);
      break;
    case 'resin':
      drawResin(ctx, cx, cy, s);
      break;
    case 'plank_bundle':
      drawPlankBundle(ctx, cx, cy, s);
      break;
    case 'salt':
      drawSalt(ctx, cx, cy, s);
      break;
    case 'hide':
      drawHide(ctx, cx, cy, s);
      break;
    case 'brick':
      drawBrick(ctx, cx, cy, s);
      break;
    case 'nail_box':
      drawNailBox(ctx, cx, cy, s);
      break;
    case 'iron_ingot':
      drawIngot(ctx, cx, cy, s);
      break;
    case 'wire_spool':
      drawWireSpool(ctx, cx, cy, s);
      break;
    case 'iron_plate':
      drawIronPlate(ctx, cx, cy, s);
      break;
    case 'canvas':
      drawCanvas(ctx, cx, cy, s);
      break;
    case 'fertilizer':
      drawFertilizer(ctx, cx, cy, s);
      break;
    case 'acid_vial':
      drawAcidVial(ctx, cx, cy, s);
      break;
    case 'fuel':
      drawFuel(ctx, cx, cy, s);
      break;
    case 'blueprint':
      drawBlueprint(ctx, cx, cy, s);
      break;
    case 'flour':
      drawFlour(ctx, cx, cy, s);
      break;
    case 'bread':
      drawBread(ctx, cx, cy, s);
      break;
    case 'egg':
      drawEgg(ctx, cx, cy, s);
      break;
    case 'cheese':
      drawCheese(ctx, cx, cy, s);
      break;
    case 'meat':
      drawMeat(ctx, cx, cy, s);
      break;
    case 'soup':
      drawSoup(ctx, cx, cy, s);
      break;
    case 'feed_bag':
      drawFeedBag(ctx, cx, cy, s);
      break;
    case 'bone':
      drawBone(ctx, cx, cy, s);
      break;
    case 'pellet':
      drawPellet(ctx, cx, cy, s);
      break;
    case 'crop_wheat':
      drawCropWheat(ctx, cx, cy, s);
      break;
    case 'crop_sun':
      drawCropSun(ctx, cx, cy, s);
      break;
    case 'crop_cactus':
      drawCropCactus(ctx, cx, cy, s);
      break;
    case 'chick':
      drawChick(ctx, cx, cy, s);
      break;
    case 'hen':
      drawHen(ctx, cx, cy, s);
      break;
    case 'goat':
      drawGoat(ctx, cx, cy, s);
      break;
    case 'milk':
      drawMilk(ctx, cx, cy, s);
      break;
    case 'rabbit':
      drawRabbit(ctx, cx, cy, s);
      break;
    case 'pig':
      drawPig(ctx, cx, cy, s);
      break;
    case 'beetle':
      drawBeetle(ctx, cx, cy, s);
      break;
    case 'lard':
      drawLard(ctx, cx, cy, s);
      break;
    case 'feather':
      drawFeather(ctx, cx, cy, s);
      break;
    case 'hound':
      drawHound(ctx, cx, cy, s);
      break;
    case 'watch_dog':
      drawWatchDog(ctx, cx, cy, s);
      break;
    case 'pup':
      drawPup(ctx, cx, cy, s);
      break;
    case 'fence':
      drawFence(ctx, cx, cy, s);
      break;
    case 'wall':
      drawWall(ctx, cx, cy, s);
      break;
    case 'wire_trap':
      drawWireTrap(ctx, cx, cy, s);
      break;
    case 'coop':
      drawCoop(ctx, cx, cy, s);
      break;
    case 'pen_goat':
      drawPenGoat(ctx, cx, cy, s);
      break;
    case 'pen_rabbit':
      drawPenRabbit(ctx, cx, cy, s);
      break;
    case 'pen_pig':
      drawPenPig(ctx, cx, cy, s);
      break;
    case 'kennel':
      drawKennel(ctx, cx, cy, s);
      break;
    case 'insect_crate':
      drawInsectCrate(ctx, cx, cy, s);
      break;
    case 'mushroom_bed':
      drawMushroomBed(ctx, cx, cy, s);
      break;
    case 'reed_patch':
      drawReedPatch(ctx, cx, cy, s);
      break;
    case 'blade':
      drawBlade(ctx, cx, cy, s);
      break;
    case 'bow':
      drawBow(ctx, cx, cy, s);
      break;
    case 'molotov':
      drawMolotov(ctx, cx, cy, s);
      break;
    case 'wild_soil':
      drawWildSoil(ctx, cx, cy, s);
      break;
    case 'wild_ore':
      drawWildOre(ctx, cx, cy, s);
      break;
    case 'wild_tree':
      drawWildTree(ctx, cx, cy, s);
      break;
    case 'wild_lake':
      drawWildLake(ctx, cx, cy, s);
      break;
    case 'wild_beach':
      drawWildBeach(ctx, cx, cy, s);
      break;
    case 'wild_marsh':
      drawWildMarsh(ctx, cx, cy, s);
      break;
    case 'facility_workshop':
      drawFacility(ctx, cx, cy, s, 'workshop');
      break;
    case 'facility_smelter':
      drawFacility(ctx, cx, cy, s, 'smelter');
      break;
    case 'facility_kitchen':
      drawFacility(ctx, cx, cy, s, 'kitchen');
      break;
    case 'facility_design':
      drawFacility(ctx, cx, cy, s, 'design');
      break;
    case 'facility_greenhouse':
      drawFacility(ctx, cx, cy, s, 'greenhouse');
      break;
    case 'facility_well':
      drawFacility(ctx, cx, cy, s, 'well');
      break;
    case 'facility_warehouse':
      drawFacility(ctx, cx, cy, s, 'warehouse');
      break;
    default:
      drawGeneric(ctx, cx, cy, s);
      break;
  }
}

function drawSurvivor(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x8b7355, 1);
  ctx.fillCircle(cx, cy - 10 * s, 8 * s);
  ctx.fillStyle(0x5c4a3a, 1);
  ctx.fillRoundedRect(cx - 10 * s, cy - 2 * s, 20 * s, 18 * s, 3 * s);
  ctx.fillStyle(0x4a4038, 1);
  ctx.fillRect(cx - 12 * s, cy + 8 * s, 7 * s, 14 * s);
  ctx.fillRect(cx + 5 * s, cy + 8 * s, 7 * s, 14 * s);
}

function drawBush(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x4a5c38, 1);
  ctx.fillCircle(cx - 9 * s, cy + 2 * s, 10 * s);
  ctx.fillCircle(cx + 9 * s, cy + 2 * s, 10 * s);
  ctx.fillCircle(cx, cy - 7 * s, 11 * s);
  ctx.fillStyle(0x6a5040, 0.9);
  ctx.fillCircle(cx + 5 * s, cy + 5 * s, 6 * s);
  ctx.fillStyle(0x3a3228, 1);
  ctx.fillRect(cx - 2 * s, cy + 10 * s, 4 * s, 12 * s);
}

function drawBerry(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x5c4038, 1);
  ctx.fillCircle(cx - 8 * s, cy + 2 * s, 6 * s);
  ctx.fillCircle(cx + 7 * s, cy, 6 * s);
  ctx.fillCircle(cx, cy - 6 * s, 6 * s);
  ctx.fillStyle(0x6a4a38, 0.85);
  ctx.fillCircle(cx - 2 * s, cy + 7 * s, 5 * s);
  ctx.fillStyle(0x3a4a2e, 1);
  ctx.fillRect(cx - 1 * s, cy + 10 * s, 3 * s, 8 * s);
}

function drawScrapPile(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x5a5550, 1);
  ctx.fillRoundedRect(cx - 14 * s, cy + 4 * s, 28 * s, 10 * s, 2 * s);
  ctx.fillStyle(0x6a6058, 1);
  ctx.fillRect(cx - 10 * s, cy - 5 * s, 12 * s, 12 * s);
  ctx.fillRect(cx + 2 * s, cy - 10 * s, 10 * s, 16 * s);
  ctx.fillStyle(0x8b6914, 0.95);
  ctx.fillCircle(cx + 7 * s, cy - 2 * s, 4 * s);
}

function drawScrap(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.strokeStyle(0x7a7068, 3 * s, 1);
  ctx.strokeCircle(cx, cy, 11 * s);
  ctx.line(cx - 7 * s, cy - 7 * s, cx + 7 * s, cy + 7 * s);
  ctx.fillStyle(0x8b7355, 1);
  ctx.fillRect(cx + 9 * s, cy - 3 * s, 8 * s, 5 * s);
}

function drawScrapBundle(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  drawScrapPile(ctx, cx, cy - 4 * s, s * 0.85);
  ctx.strokeStyle(0x5c4a32, 2 * s, 1);
  ctx.line(cx - 12 * s, cy + 12 * s, cx + 12 * s, cy + 12 * s);
}

function drawRustShard(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x8b5038, 1);
  ctx.fillTriangle(cx, cy - 12 * s, cx - 10 * s, cy + 10 * s, cx + 8 * s, cy + 8 * s);
  ctx.fillStyle(0x6a4030, 0.9);
  ctx.fillTriangle(cx + 4 * s, cy - 6 * s, cx + 12 * s, cy + 12 * s, cx - 2 * s, cy + 6 * s);
}

function drawBaseCamp(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x4a4038, 1);
  ctx.fillRoundedRect(cx - 15 * s, cy - 8 * s, 30 * s, 20 * s, 3 * s);
  ctx.fillStyle(0x5c4a3a, 1);
  ctx.fillTriangle(cx, cy - 18 * s, cx - 20 * s, cy - 6 * s, cx + 20 * s, cy - 6 * s);
  ctx.fillStyle(0x8b6914, 0.95);
  ctx.fillRect(cx - 5 * s, cy + 2 * s, 10 * s, 12 * s);
}

function drawTrader(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x5c4a38, 1);
  ctx.fillRoundedRect(cx - 17 * s, cy - 4 * s, 34 * s, 18 * s, 3 * s);
  ctx.fillStyle(0x8b6914, 1);
  ctx.fillTriangle(cx, cy - 20 * s, cx - 22 * s, cy - 4 * s, cx + 22 * s, cy - 4 * s);
  ctx.fillStyle(0xc9b896, 1);
  ctx.fillCircle(cx, cy - 10 * s, 5 * s);
}

function drawShop(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  drawTrader(ctx, cx, cy, s);
  ctx.fillStyle(0x8b6914, 1);
  ctx.fillRect(cx - 8 * s, cy + 6 * s, 16 * s, 3 * s);
}

function drawSoilPlot(ctx: IconDrawCtx, cx: number, cy: number, s: number, tint: number): void {
  ctx.fillStyle(tint, 1);
  ctx.fillRoundedRect(cx - 16 * s, cy - 6 * s, 32 * s, 20 * s, 4 * s);
  ctx.fillStyle(0x2e2820, 0.55);
  ctx.fillCircle(cx - 7 * s, cy + 2 * s, 3 * s);
  ctx.fillCircle(cx + 6 * s, cy + 4 * s, 2.5 * s);
  ctx.fillStyle(0x4a4038, 0.65);
  ctx.fillRect(cx - 14 * s, cy + 10 * s, 28 * s, 5 * s);
}

function drawSoilClump(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x5a4a38, 1);
  ctx.fillCircle(cx - 6 * s, cy + 2 * s, 7 * s);
  ctx.fillCircle(cx + 7 * s, cy, 6 * s);
  ctx.fillCircle(cx, cy - 5 * s, 6 * s);
}

function drawSeed(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x5c4a32, 1);
  ctx.fillEllipse(cx, cy + 5 * s, 6 * s, 9 * s);
  ctx.fillStyle(0x3a4a2e, 1);
  ctx.fillTriangle(cx, cy - 14 * s, cx - 7 * s, cy + 2 * s, cx + 7 * s, cy + 2 * s);
  ctx.line(cx, cy - 12 * s, cx, cy + 2 * s);
}

function drawPlantThorn(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x3a3228, 1);
  ctx.fillRect(cx - 2 * s, cy + 8 * s, 4 * s, 14 * s);
  ctx.strokeStyle(0x3a5c32, 2.5 * s, 1);
  ctx.line(cx, cy + 8 * s, cx - 12 * s, cy - 10 * s);
  ctx.line(cx, cy + 8 * s, cx + 12 * s, cy - 10 * s);
  ctx.fillStyle(0x5c4038, 1);
  ctx.fillCircle(cx - 12 * s, cy - 10 * s, 4 * s);
  ctx.fillCircle(cx + 12 * s, cy - 10 * s, 4 * s);
}

function drawPlantSpore(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x3a4a32, 1);
  ctx.fillCircle(cx, cy + 4 * s, 12 * s);
  ctx.fillStyle(0x5a6a48, 0.85);
  ctx.fillCircle(cx - 10 * s, cy - 8 * s, 5 * s);
  ctx.fillCircle(cx + 10 * s, cy - 6 * s, 6 * s);
  ctx.fillCircle(cx, cy - 12 * s, 5 * s);
}

function drawPlantSnare(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x4a4030, 1);
  ctx.fillEllipse(cx, cy + 8 * s, 14 * s, 6 * s);
  ctx.strokeStyle(0x5a6a40, 2 * s, 1);
  for (let i = -2; i <= 2; i++) {
    ctx.line(cx + i * 5 * s, cy - 10 * s, cx + i * 3 * s, cy + 10 * s);
  }
}

function drawPlantAcid(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x4a5a38, 1);
  ctx.fillCircle(cx, cy, 11 * s);
  ctx.fillStyle(0x6a7a48, 0.75);
  ctx.fillCircle(cx - 8 * s, cy - 6 * s, 6 * s);
  ctx.fillStyle(0x5a6a40, 0.9);
  ctx.fillEllipse(cx, cy + 10 * s, 10 * s, 4 * s);
}

function drawWeed(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x4a5038, 1);
  ctx.fillCircle(cx - 7 * s, cy + 4 * s, 7 * s);
  ctx.fillCircle(cx + 8 * s, cy + 2 * s, 6 * s);
  ctx.fillStyle(0x3a4230, 1);
  ctx.fillRect(cx - 1.5 * s, cy + 8 * s, 3 * s, 12 * s);
}

function drawWater(ctx: IconDrawCtx, cx: number, cy: number, s: number, clean: boolean): void {
  ctx.fillStyle(clean ? 0x4a5a5c : 0x3a4548, 1);
  ctx.fillRoundedRect(cx - 9 * s, cy - 12 * s, 18 * s, 24 * s, 3 * s);
  ctx.fillStyle(clean ? 0x6a8a8c : 0x4a5058, 0.65);
  ctx.fillEllipse(cx, cy - 2 * s, 11 * s, 9 * s);
}

function drawCan(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x5c4a38, 1);
  ctx.fillRoundedRect(cx - 8 * s, cy - 12 * s, 16 * s, 24 * s, 2 * s);
  ctx.fillStyle(0x8b7355, 0.85);
  ctx.fillRect(cx - 6 * s, cy - 4 * s, 12 * s, 5 * s);
}

function drawCaps(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x8b6914, 1);
  ctx.fillCircle(cx - 7 * s, cy, 7 * s);
  ctx.fillCircle(cx + 7 * s, cy, 7 * s);
  ctx.fillCircle(cx, cy - 5 * s, 6 * s);
}

function drawPlank(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x6a5a40, 1);
  ctx.fillRect(cx - 14 * s, cy - 5 * s, 28 * s, 7 * s);
  ctx.fillRect(cx - 12 * s, cy + 5 * s, 24 * s, 6 * s);
}

function drawTimber(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x5a4a32, 1);
  ctx.fillRoundedRect(cx - 6 * s, cy - 14 * s, 12 * s, 28 * s, 2 * s);
  ctx.fillStyle(0x4a3a28, 0.8);
  ctx.fillCircle(cx, cy - 14 * s, 6 * s);
}

function drawFiber(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.strokeStyle(0x6a5a48, 2 * s, 1);
  for (let i = -2; i <= 2; i++) {
    ctx.line(cx + i * 4 * s, cy - 12 * s, cx + i * 6 * s, cy + 12 * s);
  }
}

function drawStone(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x5a5550, 1);
  ctx.fillEllipse(cx - 6 * s, cy + 2 * s, 10 * s, 8 * s);
  ctx.fillEllipse(cx + 7 * s, cy + 4 * s, 8 * s, 7 * s);
  ctx.fillStyle(0x4a4848, 1);
  ctx.fillEllipse(cx, cy - 4 * s, 9 * s, 7 * s);
}

function drawMushroomCap(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x6a5048, 1);
  ctx.fillEllipse(cx, cy - 4 * s, 16 * s, 10 * s);
  ctx.fillStyle(0x8b7068, 0.5);
  ctx.fillCircle(cx - 6 * s, cy - 6 * s, 3 * s);
  ctx.fillStyle(0x5a4a40, 1);
  ctx.fillRect(cx - 3 * s, cy + 2 * s, 6 * s, 12 * s);
}

function drawReedStalk(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.strokeStyle(0x5a6a48, 2 * s, 1);
  for (let i = -2; i <= 2; i++) {
    ctx.line(cx + i * 5 * s, cy + 12 * s, cx + i * 3 * s, cy - 14 * s);
  }
  ctx.fillStyle(0x6a7a50, 0.8);
  ctx.fillEllipse(cx, cy - 12 * s, 8 * s, 4 * s);
}

function drawTar(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x2a2420, 1);
  ctx.fillEllipse(cx, cy + 4 * s, 14 * s, 10 * s);
  ctx.fillStyle(0x1a1814, 0.9);
  ctx.fillCircle(cx, cy - 4 * s, 8 * s);
}

function drawGlass(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x6a7a78, 0.55);
  ctx.fillTriangle(cx, cy - 12 * s, cx - 10 * s, cy + 10 * s, cx + 10 * s, cy + 10 * s);
  ctx.strokeStyle(0x8a9a98, 1.5 * s, 0.7);
  ctx.line(cx - 8 * s, cy + 4 * s, cx + 6 * s, cy - 6 * s);
}

function drawCharcoal(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x2a2620, 1);
  ctx.fillRoundedRect(cx - 12 * s, cy - 4 * s, 24 * s, 14 * s, 3 * s);
  ctx.fillStyle(0x1a1814, 0.8);
  ctx.fillCircle(cx - 5 * s, cy + 2 * s, 4 * s);
  ctx.fillCircle(cx + 6 * s, cy, 3 * s);
}

function drawRope(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.strokeStyle(0x6a5a40, 2.5 * s, 1);
  for (let i = 0; i < 3; i++) {
    ctx.strokeEllipse(cx - 4 * s + i * 4 * s, cy, 5 * s, 10 * s);
  }
}

function drawCompost(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x3a3228, 1);
  ctx.fillRoundedRect(cx - 12 * s, cy - 2 * s, 24 * s, 14 * s, 3 * s);
  ctx.fillStyle(0x4a5a32, 0.6);
  ctx.fillCircle(cx - 4 * s, cy - 4 * s, 4 * s);
  ctx.fillCircle(cx + 5 * s, cy - 2 * s, 3 * s);
}

function drawResin(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x6a5030, 1);
  ctx.fillRoundedRect(cx - 6 * s, cy + 2 * s, 12 * s, 14 * s, 2 * s);
  ctx.fillStyle(0x8b7038, 0.85);
  ctx.fillEllipse(cx, cy - 6 * s, 10 * s, 12 * s);
}

function drawPlankBundle(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  drawPlank(ctx, cx, cy - 4 * s, s);
  ctx.strokeStyle(0x5c4a32, 2 * s, 1);
  ctx.line(cx - 14 * s, cy + 10 * s, cx + 14 * s, cy + 10 * s);
}

function drawSalt(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x8a8478, 0.9);
  ctx.fillRoundedRect(cx - 10 * s, cy - 6 * s, 20 * s, 14 * s, 2 * s);
  ctx.fillStyle(0xc9c4b8, 0.5);
  ctx.fillCircle(cx - 4 * s, cy, 3 * s);
  ctx.fillCircle(cx + 5 * s, cy + 2 * s, 2 * s);
}

function drawHide(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x6a5a48, 1);
  ctx.fillEllipse(cx, cy, 18 * s, 14 * s);
  ctx.strokeStyle(0x4a4038, 1.5 * s, 0.8);
  ctx.line(cx - 8 * s, cy - 4 * s, cx + 8 * s, cy + 4 * s);
}

function drawBrick(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x7a5a48, 1);
  ctx.fillRect(cx - 14 * s, cy - 4 * s, 12 * s, 8 * s);
  ctx.fillRect(cx, cy - 4 * s, 14 * s, 8 * s);
  ctx.fillRect(cx - 10 * s, cy + 6 * s, 20 * s, 8 * s);
}

function drawNailBox(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x5c4a38, 1);
  ctx.fillRoundedRect(cx - 12 * s, cy - 8 * s, 24 * s, 18 * s, 2 * s);
  ctx.fillStyle(0x7a7068, 1);
  ctx.fillRect(cx - 2 * s, cy - 12 * s, 4 * s, 10 * s);
  ctx.fillRect(cx + 6 * s, cy - 10 * s, 4 * s, 8 * s);
}

function drawIngot(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x6a6560, 1);
  ctx.fillRoundedRect(cx - 12 * s, cy - 6 * s, 24 * s, 12 * s, 2 * s);
  ctx.fillStyle(0x8a8580, 0.5);
  ctx.fillRect(cx - 8 * s, cy - 2 * s, 16 * s, 3 * s);
}

function drawWireSpool(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x5c4a38, 1);
  ctx.fillCircle(cx, cy, 10 * s);
  ctx.fillStyle(0x1a1814, 0.9);
  ctx.fillCircle(cx, cy, 4 * s);
  ctx.strokeStyle(0x7a7068, 2 * s, 1);
  ctx.strokeEllipse(cx, cy, 10 * s, 10 * s);
}

function drawIronPlate(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x5a5550, 1);
  ctx.fillRoundedRect(cx - 14 * s, cy - 10 * s, 28 * s, 20 * s, 2 * s);
  ctx.fillStyle(0x7a7570, 0.4);
  ctx.fillRect(cx - 10 * s, cy - 6 * s, 8 * s, 12 * s);
}

function drawCanvas(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x8a8478, 1);
  ctx.fillRoundedRect(cx - 14 * s, cy - 10 * s, 28 * s, 20 * s, 2 * s);
  ctx.strokeStyle(0x5c5348, 1.5 * s, 0.7);
  ctx.line(cx - 10 * s, cy - 6 * s, cx + 8 * s, cy + 6 * s);
}

function drawFertilizer(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  drawFeedBag(ctx, cx, cy, s);
  ctx.fillStyle(0x4a5a32, 0.8);
  ctx.fillCircle(cx + 8 * s, cy - 8 * s, 4 * s);
}

function drawAcidVial(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x5a6a40, 0.85);
  ctx.fillRoundedRect(cx - 5 * s, cy + 0, 10 * s, 14 * s, 2 * s);
  ctx.fillStyle(0x6a7a48, 1);
  ctx.fillCircle(cx, cy - 8 * s, 6 * s);
}

function drawFuel(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x5c4a38, 1);
  ctx.fillRoundedRect(cx - 10 * s, cy - 4 * s, 20 * s, 18 * s, 2 * s);
  ctx.fillStyle(0x8b6914, 0.9);
  ctx.fillRect(cx - 6 * s, cy - 10 * s, 12 * s, 6 * s);
}

function drawBlueprint(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0xc9b896, 0.9);
  ctx.fillRoundedRect(cx - 12 * s, cy - 14 * s, 24 * s, 28 * s, 2 * s);
  ctx.strokeStyle(0x5c5348, 1.5 * s, 0.8);
  ctx.line(cx - 6 * s, cy - 6 * s, cx + 6 * s, cy - 6 * s);
  ctx.line(cx - 6 * s, cy + 4 * s, cx + 4 * s, cy + 4 * s);
}

function drawFlour(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x8a8478, 1);
  ctx.fillRoundedRect(cx - 10 * s, cy - 6 * s, 20 * s, 14 * s, 2 * s);
  ctx.fillStyle(0xc9c4b8, 0.7);
  ctx.fillEllipse(cx, cy - 2 * s, 8 * s, 4 * s);
}

function drawBread(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x8b7355, 1);
  ctx.fillEllipse(cx, cy, 16 * s, 10 * s);
  ctx.fillStyle(0x6a5a48, 0.6);
  ctx.fillEllipse(cx - 4 * s, cy - 2 * s, 6 * s, 4 * s);
}

function drawEgg(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0xc9c4b8, 1);
  ctx.fillEllipse(cx, cy, 10 * s, 14 * s);
  ctx.fillStyle(0x8a8478, 0.5);
  ctx.fillEllipse(cx + 2 * s, cy - 2 * s, 4 * s, 6 * s);
}

function drawCheese(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0xc9a86a, 1);
  ctx.fillTriangle(cx - 12 * s, cy + 8 * s, cx + 12 * s, cy + 8 * s, cx, cy - 10 * s);
  ctx.fillStyle(0x8b7355, 0.4);
  ctx.fillCircle(cx - 2 * s, cy, 3 * s);
}

function drawMeat(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x6a4040, 1);
  ctx.fillEllipse(cx, cy, 16 * s, 12 * s);
  ctx.fillStyle(0x8b5050, 0.7);
  ctx.fillEllipse(cx - 4 * s, cy - 2 * s, 6 * s, 5 * s);
}

function drawSoup(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x5c4a38, 1);
  ctx.fillEllipse(cx, cy + 4 * s, 16 * s, 10 * s);
  ctx.fillStyle(0x6a5a40, 0.85);
  ctx.fillEllipse(cx, cy, 12 * s, 6 * s);
  ctx.fillStyle(0x4a5a32, 0.8);
  ctx.fillCircle(cx - 4 * s, cy - 2 * s, 4 * s);
}

function drawFeedBag(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x5a4a32, 1);
  ctx.fillRoundedRect(cx - 11 * s, cy - 6 * s, 22 * s, 16 * s, 2 * s);
  ctx.fillStyle(0x4a4030, 0.85);
  ctx.fillCircle(cx, cy - 11 * s, 6 * s);
}

function drawBone(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0xc9c4b8, 1);
  ctx.fillEllipse(cx - 8 * s, cy, 6 * s, 4 * s);
  ctx.fillEllipse(cx + 8 * s, cy, 6 * s, 4 * s);
  ctx.fillRect(cx - 6 * s, cy - 2 * s, 12 * s, 4 * s);
}

function drawPellet(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x5a4a38, 1);
  for (let i = -1; i <= 1; i++) {
    ctx.fillCircle(cx + i * 8 * s, cy + (i % 2) * 4 * s, 5 * s);
  }
}

function drawCropWheat(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.strokeStyle(0x8b7355, 2 * s, 1);
  ctx.line(cx, cy + 12 * s, cx, cy - 12 * s);
  ctx.fillStyle(0xc9a86a, 1);
  ctx.fillEllipse(cx, cy - 12 * s, 8 * s, 5 * s);
}

function drawCropSun(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x8b7355, 1);
  ctx.fillCircle(cx, cy - 4 * s, 10 * s);
  ctx.fillStyle(0x6a5a40, 0.8);
  ctx.fillRect(cx - 2 * s, cy + 4 * s, 4 * s, 12 * s);
}

function drawCropCactus(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x4a5a38, 1);
  ctx.fillRoundedRect(cx - 4 * s, cy - 10 * s, 8 * s, 22 * s, 3 * s);
  ctx.fillRoundedRect(cx - 12 * s, cy, 8 * s, 8 * s, 2 * s);
  ctx.fillRoundedRect(cx + 6 * s, cy - 4 * s, 8 * s, 8 * s, 2 * s);
}

function drawChick(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0xc9a86a, 1);
  ctx.fillCircle(cx, cy + 2 * s, 8 * s);
  ctx.fillCircle(cx + 6 * s, cy - 4 * s, 5 * s);
}

function drawHen(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  drawChick(ctx, cx, cy, s * 1.15);
  ctx.fillStyle(0x8b5038, 1);
  ctx.fillTriangle(cx + 10 * s, cy - 6 * s, cx + 16 * s, cy - 4 * s, cx + 10 * s, cy);
}

function drawGoat(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x8a8478, 1);
  ctx.fillEllipse(cx, cy + 4 * s, 18 * s, 10 * s);
  ctx.fillCircle(cx + 10 * s, cy - 6 * s, 6 * s);
}

function drawMilk(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  drawWater(ctx, cx, cy, s, true);
  ctx.fillStyle(0xc9c4b8, 0.5);
  ctx.fillEllipse(cx, cy - 2 * s, 6 * s, 4 * s);
}

function drawRabbit(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x8a8478, 1);
  ctx.fillEllipse(cx, cy + 4 * s, 14 * s, 10 * s);
  ctx.fillEllipse(cx - 6 * s, cy - 12 * s, 4 * s, 10 * s);
  ctx.fillEllipse(cx + 6 * s, cy - 12 * s, 4 * s, 10 * s);
}

function drawPig(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x7a5a58, 1);
  ctx.fillEllipse(cx, cy + 2 * s, 20 * s, 12 * s);
  ctx.fillCircle(cx + 10 * s, cy - 4 * s, 6 * s);
}

function drawBeetle(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x4a4038, 1);
  ctx.fillEllipse(cx, cy, 16 * s, 10 * s);
  ctx.fillStyle(0x8b6914, 0.8);
  ctx.fillCircle(cx - 8 * s, cy - 2 * s, 3 * s);
  ctx.fillCircle(cx + 8 * s, cy - 2 * s, 3 * s);
}

function drawLard(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  drawCan(ctx, cx, cy, s);
  ctx.fillStyle(0xc9c4b8, 0.6);
  ctx.fillRect(cx - 4 * s, cy - 2 * s, 8 * s, 4 * s);
}

function drawFeather(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x8a8478, 0.9);
  ctx.fillEllipse(cx, cy, 6 * s, 18 * s);
  ctx.strokeStyle(0x5c5348, 1.5 * s, 0.8);
  ctx.line(cx, cy - 12 * s, cx, cy + 12 * s);
}

function drawHound(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x5a4040, 1);
  ctx.fillEllipse(cx, cy + 4 * s, 24 * s, 12 * s);
  ctx.fillCircle(cx + 11 * s, cy - 6 * s, 8 * s);
  ctx.fillStyle(0x8a3030, 0.95);
  ctx.fillCircle(cx + 13 * s, cy - 7 * s, 3 * s);
}

function drawWatchDog(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  drawHound(ctx, cx, cy, s * 0.9);
  ctx.strokeStyle(0x6a5f52, 2 * s, 0.9);
  ctx.line(cx - 14 * s, cy + 10 * s, cx + 14 * s, cy + 10 * s);
}

function drawPup(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  drawHound(ctx, cx, cy, s * 0.75);
}

function drawFence(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.strokeStyle(0x6a6560, 3 * s, 1);
  for (let i = -2; i <= 2; i++) {
    ctx.line(cx + i * 6 * s, cy - 14 * s, cx + i * 6 * s, cy + 14 * s);
  }
  ctx.line(cx - 12 * s, cy - 8 * s, cx + 12 * s, cy - 8 * s);
  ctx.line(cx - 12 * s, cy + 8 * s, cx + 12 * s, cy + 8 * s);
}

function drawWall(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x5a5040, 1);
  ctx.fillRoundedRect(cx - 17 * s, cy - 6 * s, 34 * s, 14 * s, 2 * s);
  ctx.fillStyle(0x4a4540, 1);
  ctx.fillRect(cx - 15 * s, cy - 2 * s, 9 * s, 9 * s);
  ctx.fillRect(cx - 2 * s, cy - 2 * s, 9 * s, 9 * s);
  ctx.fillRect(cx + 11 * s, cy - 2 * s, 7 * s, 9 * s);
}

function drawWireTrap(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.strokeStyle(0x7a7068, 2 * s, 1);
  for (let i = 0; i < 4; i++) {
    ctx.strokeEllipse(cx - 8 * s + i * 5 * s, cy, 3 * s, 9 * s);
  }
}

function drawCoop(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x5a4a32, 1);
  ctx.fillRoundedRect(cx - 15 * s, cy - 4 * s, 30 * s, 16 * s, 2 * s);
  ctx.fillStyle(0x4a4030, 1);
  ctx.fillTriangle(cx, cy - 16 * s, cx - 18 * s, cy - 4 * s, cx + 18 * s, cy - 4 * s);
}

function drawPenGoat(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  drawFence(ctx, cx, cy, s * 0.85);
  drawGoat(ctx, cx, cy + 4 * s, s * 0.55);
}

function drawPenRabbit(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  drawFence(ctx, cx, cy, s * 0.85);
  drawRabbit(ctx, cx, cy + 6 * s, s * 0.55);
}

function drawPenPig(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  drawFence(ctx, cx, cy, s * 0.85);
  drawPig(ctx, cx, cy + 6 * s, s * 0.5);
}

function drawKennel(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  drawCoop(ctx, cx, cy, s);
  ctx.fillStyle(0x5a4040, 0.9);
  ctx.fillCircle(cx, cy + 6 * s, 5 * s);
}

function drawInsectCrate(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x5c4a38, 1);
  ctx.fillRoundedRect(cx - 14 * s, cy - 6 * s, 28 * s, 16 * s, 2 * s);
  drawBeetle(ctx, cx, cy - 2 * s, s * 0.6);
}

function drawMushroomBed(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  drawSoilPlot(ctx, cx, cy + 4 * s, s, 0x3a4a32);
  drawMushroomCap(ctx, cx - 8 * s, cy - 8 * s, s * 0.7);
  drawMushroomCap(ctx, cx + 8 * s, cy - 6 * s, s * 0.65);
}

function drawReedPatch(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  drawSoilPlot(ctx, cx, cy + 6 * s, s, 0x3a4a32);
  drawReedStalk(ctx, cx, cy - 4 * s, s);
}

function drawBlade(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x7a7068, 1);
  ctx.fillTriangle(cx + 5 * s, cy - 14 * s, cx + 12 * s, cy + 12 * s, cx - 2 * s, cy + 10 * s);
  ctx.fillStyle(0x5c4a3a, 1);
  ctx.fillRect(cx - 10 * s, cy + 4 * s, 7 * s, 14 * s);
}

function drawBow(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.strokeStyle(0x6a6058, 2.5 * s, 1);
  ctx.strokeEllipse(cx, cy, 15 * s, 20 * s);
  ctx.line(cx - 11 * s, cy, cx + 11 * s, cy);
}

function drawMolotov(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x6a5040, 1);
  ctx.fillRect(cx - 5 * s, cy + 2 * s, 10 * s, 14 * s);
  ctx.fillStyle(0x8a4030, 0.95);
  ctx.fillCircle(cx, cy - 7 * s, 8 * s);
}

function drawWildSoil(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  drawSoilPlot(ctx, cx, cy, s, 0x5a4a38);
  ctx.fillStyle(0x4a6a38, 0.55);
  ctx.fillCircle(cx - 11 * s, cy - 5 * s, 5 * s);
}

function drawWildOre(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x4a4848, 1);
  ctx.fillTriangle(cx - 16 * s, cy + 10 * s, cx, cy - 14 * s, cx + 16 * s, cy + 10 * s);
  ctx.fillStyle(0x8b7355, 0.95);
  ctx.fillCircle(cx + 5 * s, cy - 2 * s, 4 * s);
  ctx.fillCircle(cx - 7 * s, cy + 2 * s, 3 * s);
}

function drawWildTree(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x4a4030, 1);
  ctx.fillRect(cx - 2 * s, cy + 2 * s, 5 * s, 16 * s);
  ctx.strokeStyle(0x5a4a32, 2.5 * s, 1);
  ctx.line(cx - 12 * s, cy - 2 * s, cx - 8 * s, cy - 14 * s);
  ctx.line(cx, cy + 2 * s, cx, cy - 16 * s);
  ctx.line(cx + 12 * s, cy, cx + 8 * s, cy - 12 * s);
}

function drawWildLake(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x3a4548, 1);
  ctx.fillEllipse(cx, cy + 2 * s, 28 * s, 14 * s);
  ctx.fillStyle(0x4a5a5c, 0.55);
  ctx.fillEllipse(cx - 5 * s, cy, 14 * s, 7 * s);
}

function drawWildBeach(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x6a5a48, 1);
  ctx.fillEllipse(cx, cy + 6 * s, 26 * s, 10 * s);
  ctx.fillStyle(0x4a5058, 0.7);
  ctx.fillEllipse(cx, cy - 2 * s, 18 * s, 8 * s);
}

function drawWildMarsh(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  drawWildLake(ctx, cx, cy, s);
  drawReedStalk(ctx, cx, cy - 6 * s, s * 0.8);
}

function drawFacility(
  ctx: IconDrawCtx,
  cx: number,
  cy: number,
  s: number,
  kind: string,
): void {
  ctx.fillStyle(0x4a4038, 1);
  ctx.fillRoundedRect(cx - 16 * s, cy - 6 * s, 32 * s, 18 * s, 3 * s);
  ctx.fillStyle(0x5c4a3a, 1);
  ctx.fillTriangle(cx, cy - 16 * s, cx - 18 * s, cy - 4 * s, cx + 18 * s, cy - 4 * s);
  const accent: Record<string, number> = {
    workshop: 0x8b6914,
    smelter: 0x8a4030,
    kitchen: 0xc9a86a,
    design: 0xc9b896,
    greenhouse: 0x4a5a38,
    well: 0x4a5a5c,
    warehouse: 0x6a6560,
  };
  ctx.fillStyle(accent[kind] ?? 0x8b6914, 1);
  if (kind === 'well') {
    ctx.fillCircle(cx, cy + 4 * s, 6 * s);
  } else if (kind === 'smelter') {
    ctx.fillRect(cx - 4 * s, cy - 14 * s, 8 * s, 8 * s);
  } else if (kind === 'design') {
    ctx.fillRect(cx - 8 * s, cy, 16 * s, 2 * s);
    ctx.fillRect(cx - 2 * s, cy - 6 * s, 4 * s, 12 * s);
  } else {
    ctx.fillRect(cx - 6 * s, cy + 2 * s, 12 * s, 8 * s);
  }
}

function drawGeneric(ctx: IconDrawCtx, cx: number, cy: number, s: number): void {
  ctx.fillStyle(0x8b7355, 1);
  ctx.fillCircle(cx, cy, 9 * s);
  ctx.strokeStyle(0x5c5348, 2 * s, 0.8);
  ctx.strokeCircle(cx, cy, 9 * s);
}
