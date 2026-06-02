import { drawGround, drawSandbags, drawWastelandShelter, drawWoodenWalls, iconK } from './cardIconStyle';
/** No-op: icons use transparent background (see cardIconOutline for white edge). */
export function drawIconFrame(_ctx, _size) { }
export function drawIconKind(ctx, kind, size) {
    const cx = size / 2;
    const cy = size / 2;
    const k = iconK(size);
    drawGround(ctx, cx, cy, k);
    switch (kind) {
        case 'survivor':
            drawSurvivor(ctx, cx, cy, k);
            break;
        case 'bush':
            drawBush(ctx, cx, cy, k);
            break;
        case 'berry':
            drawBerry(ctx, cx, cy, k);
            break;
        case 'scrap_pile':
            drawScrapPile(ctx, cx, cy, k);
            break;
        case 'scrap':
            drawScrap(ctx, cx, cy, k);
            break;
        case 'scrap_bundle':
            drawScrapBundle(ctx, cx, cy, k);
            break;
        case 'rust_shard':
            drawRustShard(ctx, cx, cy, k);
            break;
        case 'base_camp':
            drawBaseCamp(ctx, cx, cy, k);
            break;
        case 'trader_post':
            drawTrader(ctx, cx, cy, k);
            break;
        case 'shop':
            drawShop(ctx, cx, cy, k);
            break;
        case 'blight_plot':
        case 'farmland':
        case 'bunker_sheet':
            drawSoilPlot(ctx, cx, cy, k, kind === 'farmland' ? 0x4a5a38 : 0x3a4a32);
            break;
        case 'soil_clump':
            drawSoilClump(ctx, cx, cy, k);
            break;
        case 'seed':
            drawSeed(ctx, cx, cy, k);
            break;
        case 'plant_thornvine':
            drawPlantThorn(ctx, cx, cy, k);
            break;
        case 'plant_sporegun':
            drawPlantSpore(ctx, cx, cy, k);
            break;
        case 'plant_snare_root':
            drawPlantSnare(ctx, cx, cy, k);
            break;
        case 'plant_acid_bloom':
            drawPlantAcid(ctx, cx, cy, k);
            break;
        case 'plant_weed':
            drawWeed(ctx, cx, cy, k);
            break;
        case 'water_dirty':
            drawWater(ctx, cx, cy, k, false);
            break;
        case 'water_clean':
            drawWater(ctx, cx, cy, k, true);
            break;
        case 'canned':
            drawCan(ctx, cx, cy, k);
            break;
        case 'caps':
            drawCaps(ctx, cx, cy, k);
            break;
        case 'wood_plank':
            drawPlank(ctx, cx, cy, k);
            break;
        case 'timber':
            drawTimber(ctx, cx, cy, k);
            break;
        case 'plant_fiber':
            drawFiber(ctx, cx, cy, k);
            break;
        case 'stone':
            drawStone(ctx, cx, cy, k);
            break;
        case 'mushroom_cap':
            drawMushroomCap(ctx, cx, cy, k);
            break;
        case 'reed_stalk':
            drawReedStalk(ctx, cx, cy, k);
            break;
        case 'tar':
            drawTar(ctx, cx, cy, k);
            break;
        case 'glass':
            drawGlass(ctx, cx, cy, k);
            break;
        case 'charcoal':
            drawCharcoal(ctx, cx, cy, k);
            break;
        case 'rope':
            drawRope(ctx, cx, cy, k);
            break;
        case 'compost':
            drawCompost(ctx, cx, cy, k);
            break;
        case 'resin':
            drawResin(ctx, cx, cy, k);
            break;
        case 'plank_bundle':
            drawPlankBundle(ctx, cx, cy, k);
            break;
        case 'salt':
            drawSalt(ctx, cx, cy, k);
            break;
        case 'hide':
            drawHide(ctx, cx, cy, k);
            break;
        case 'brick':
            drawBrick(ctx, cx, cy, k);
            break;
        case 'nail_box':
            drawNailBox(ctx, cx, cy, k);
            break;
        case 'iron_ingot':
            drawIngot(ctx, cx, cy, k);
            break;
        case 'wire_spool':
            drawWireSpool(ctx, cx, cy, k);
            break;
        case 'iron_plate':
            drawIronPlate(ctx, cx, cy, k);
            break;
        case 'canvas':
            drawCanvas(ctx, cx, cy, k);
            break;
        case 'fertilizer':
            drawFertilizer(ctx, cx, cy, k);
            break;
        case 'acid_vial':
            drawAcidVial(ctx, cx, cy, k);
            break;
        case 'fuel':
            drawFuel(ctx, cx, cy, k);
            break;
        case 'blueprint':
            drawBlueprint(ctx, cx, cy, k);
            break;
        case 'flour':
            drawFlour(ctx, cx, cy, k);
            break;
        case 'bread':
            drawBread(ctx, cx, cy, k);
            break;
        case 'egg':
            drawEgg(ctx, cx, cy, k);
            break;
        case 'cheese':
            drawCheese(ctx, cx, cy, k);
            break;
        case 'meat':
            drawMeat(ctx, cx, cy, k);
            break;
        case 'soup':
            drawSoup(ctx, cx, cy, k);
            break;
        case 'feed_bag':
            drawFeedBag(ctx, cx, cy, k);
            break;
        case 'bone':
            drawBone(ctx, cx, cy, k);
            break;
        case 'pellet':
            drawPellet(ctx, cx, cy, k);
            break;
        case 'crop_wheat':
            drawCropWheat(ctx, cx, cy, k);
            break;
        case 'crop_sun':
            drawCropSun(ctx, cx, cy, k);
            break;
        case 'crop_cactus':
            drawCropCactus(ctx, cx, cy, k);
            break;
        case 'chick':
            drawChick(ctx, cx, cy, k);
            break;
        case 'hen':
            drawHen(ctx, cx, cy, k);
            break;
        case 'goat':
            drawGoat(ctx, cx, cy, k);
            break;
        case 'milk':
            drawMilk(ctx, cx, cy, k);
            break;
        case 'rabbit':
            drawRabbit(ctx, cx, cy, k);
            break;
        case 'pig':
            drawPig(ctx, cx, cy, k);
            break;
        case 'beetle':
            drawBeetle(ctx, cx, cy, k);
            break;
        case 'lard':
            drawLard(ctx, cx, cy, k);
            break;
        case 'feather':
            drawFeather(ctx, cx, cy, k);
            break;
        case 'hound':
            drawHound(ctx, cx, cy, k);
            break;
        case 'watch_dog':
            drawWatchDog(ctx, cx, cy, k);
            break;
        case 'pup':
            drawPup(ctx, cx, cy, k);
            break;
        case 'fence':
            drawFence(ctx, cx, cy, k);
            break;
        case 'wall':
            drawWall(ctx, cx, cy, k);
            break;
        case 'wire_trap':
            drawWireTrap(ctx, cx, cy, k);
            break;
        case 'coop':
            drawCoop(ctx, cx, cy, k);
            break;
        case 'pen_goat':
            drawPenGoat(ctx, cx, cy, k);
            break;
        case 'pen_rabbit':
            drawPenRabbit(ctx, cx, cy, k);
            break;
        case 'pen_pig':
            drawPenPig(ctx, cx, cy, k);
            break;
        case 'kennel':
            drawKennel(ctx, cx, cy, k);
            break;
        case 'insect_crate':
            drawInsectCrate(ctx, cx, cy, k);
            break;
        case 'mushroom_bed':
            drawMushroomBed(ctx, cx, cy, k);
            break;
        case 'reed_patch':
            drawReedPatch(ctx, cx, cy, k);
            break;
        case 'blade':
            drawBlade(ctx, cx, cy, k);
            break;
        case 'bow':
            drawBow(ctx, cx, cy, k);
            break;
        case 'molotov':
            drawMolotov(ctx, cx, cy, k);
            break;
        case 'wild_soil':
            drawWildSoil(ctx, cx, cy, k);
            break;
        case 'wild_ore':
            drawWildOre(ctx, cx, cy, k);
            break;
        case 'wild_tree':
            drawWildTree(ctx, cx, cy, k);
            break;
        case 'wild_lake':
            drawWildLake(ctx, cx, cy, k);
            break;
        case 'wild_beach':
            drawWildBeach(ctx, cx, cy, k);
            break;
        case 'wild_marsh':
            drawWildMarsh(ctx, cx, cy, k);
            break;
        case 'facility_workshop':
            drawFacility(ctx, cx, cy, k, 'workshop');
            break;
        case 'facility_smelter':
            drawFacility(ctx, cx, cy, k, 'smelter');
            break;
        case 'facility_kitchen':
            drawFacility(ctx, cx, cy, k, 'kitchen');
            break;
        case 'facility_design':
            drawFacility(ctx, cx, cy, k, 'design');
            break;
        case 'facility_greenhouse':
            drawFacility(ctx, cx, cy, k, 'greenhouse');
            break;
        case 'facility_well':
            drawFacility(ctx, cx, cy, k, 'well');
            break;
        case 'facility_warehouse':
            drawFacility(ctx, cx, cy, k, 'warehouse');
            break;
        default:
            drawGeneric(ctx, cx, cy, k);
            break;
    }
}
function drawSurvivor(ctx, cx, cy, k) {
    ctx.fillStyle(0x8b7355, 1);
    ctx.fillCircle(cx, cy - 12 * k, 9 * k);
    ctx.fillStyle(0x5c4a3a, 1);
    ctx.fillRoundedRect(cx - 11 * k, cy - 3 * k, 22 * k, 20 * k, 3 * k);
    ctx.fillStyle(0x4a4038, 1);
    ctx.fillRect(cx - 13 * k, cy + 10 * k, 8 * k, 15 * k);
    ctx.fillRect(cx + 5 * k, cy + 10 * k, 8 * k, 15 * k);
    ctx.fillStyle(0x6a6560, 1);
    ctx.fillRect(cx + 12 * k, cy - 2 * k, 3 * k, 14 * k);
    ctx.strokeStyle(0x5c5348, 1.2 * k, 0.9);
    ctx.line(cx + 13 * k, cy - 8 * k, cx + 13 * k, cy + 12 * k);
}
function drawBush(ctx, cx, cy, k) {
    ctx.fillStyle(0x4a5c38, 1);
    ctx.fillCircle(cx - 9 * k, cy + 2 * k, 10 * k);
    ctx.fillCircle(cx + 9 * k, cy + 2 * k, 10 * k);
    ctx.fillCircle(cx, cy - 7 * k, 11 * k);
    ctx.fillStyle(0x6a5040, 0.9);
    ctx.fillCircle(cx + 5 * k, cy + 5 * k, 6 * k);
    ctx.fillStyle(0x3a3228, 1);
    ctx.fillRect(cx - 2 * k, cy + 10 * k, 4 * k, 12 * k);
}
function drawBerry(ctx, cx, cy, k) {
    ctx.fillStyle(0x5c4038, 1);
    ctx.fillCircle(cx - 8 * k, cy + 2 * k, 6 * k);
    ctx.fillCircle(cx + 7 * k, cy, 6 * k);
    ctx.fillCircle(cx, cy - 6 * k, 6 * k);
    ctx.fillStyle(0x6a4a38, 0.85);
    ctx.fillCircle(cx - 2 * k, cy + 7 * k, 5 * k);
    ctx.fillStyle(0x3a4a2e, 1);
    ctx.fillRect(cx - 1 * k, cy + 10 * k, 3 * k, 8 * k);
}
function drawScrapPile(ctx, cx, cy, k) {
    ctx.fillStyle(0x5a5550, 1);
    ctx.fillRoundedRect(cx - 14 * k, cy + 4 * k, 28 * k, 10 * k, 2 * k);
    ctx.fillStyle(0x6a6058, 1);
    ctx.fillRect(cx - 10 * k, cy - 5 * k, 12 * k, 12 * k);
    ctx.fillRect(cx + 2 * k, cy - 10 * k, 10 * k, 16 * k);
    ctx.fillStyle(0x8b6914, 0.95);
    ctx.fillCircle(cx + 7 * k, cy - 2 * k, 4 * k);
}
function drawScrap(ctx, cx, cy, k) {
    ctx.strokeStyle(0x7a7068, 3 * k, 1);
    ctx.strokeCircle(cx, cy, 11 * k);
    ctx.line(cx - 7 * k, cy - 7 * k, cx + 7 * k, cy + 7 * k);
    ctx.fillStyle(0x8b7355, 1);
    ctx.fillRect(cx + 9 * k, cy - 3 * k, 8 * k, 5 * k);
}
function drawScrapBundle(ctx, cx, cy, k) {
    drawScrapPile(ctx, cx, cy - 4 * k, k * 0.85);
    ctx.strokeStyle(0x5c4a32, 2 * k, 1);
    ctx.line(cx - 12 * k, cy + 12 * k, cx + 12 * k, cy + 12 * k);
}
function drawRustShard(ctx, cx, cy, k) {
    ctx.fillStyle(0x8b5038, 1);
    ctx.fillTriangle(cx, cy - 12 * k, cx - 10 * k, cy + 10 * k, cx + 8 * k, cy + 8 * k);
    ctx.fillStyle(0x6a4030, 0.9);
    ctx.fillTriangle(cx + 4 * k, cy - 6 * k, cx + 12 * k, cy + 12 * k, cx - 2 * k, cy + 6 * k);
}
/** 避难所大本营 — 顶视铁皮棚 + 沙袋 + 指挥旗 */
function drawBaseCamp(ctx, cx, cy, k) {
    drawWastelandShelter(ctx, cx, cy, k, { sandbags: true, flag: true, door: true, patch: true });
}
/** 流浪商人 — 条纹遮阳棚 + 货架 */
function drawTrader(ctx, cx, cy, k) {
    drawWoodenWalls(ctx, cx, cy, k, 30, 18);
    ctx.fillStyle(0x8b6914, 1);
    ctx.fillTriangle(cx, cy - 22 * k, cx - 26 * k, cy - 3 * k, cx + 26 * k, cy - 3 * k);
    ctx.fillStyle(0xc9a030, 1);
    ctx.fillTriangle(cx, cy - 20 * k, cx - 10 * k, cy - 8 * k, cx + 10 * k, cy - 8 * k);
    ctx.strokeStyle(0x5c4a32, 1.4 * k, 0.85);
    for (let i = -2; i <= 2; i++) {
        ctx.line(cx + i * 8 * k, cy - 18 * k, cx + i * 10 * k, cy - 4 * k);
    }
    ctx.fillStyle(0x6a5a48, 1);
    ctx.fillRect(cx - 12 * k, cy + 4 * k, 24 * k, 8 * k);
    ctx.fillStyle(0xc9b896, 1);
    ctx.fillCircle(cx, cy + 2 * k, 4 * k);
}
function drawShop(ctx, cx, cy, k) {
    drawTrader(ctx, cx, cy, k);
    ctx.fillStyle(0x8b6914, 1);
    ctx.fillRect(cx - 10 * k, cy + 12 * k, 20 * k, 3 * k);
}
function drawSoilPlot(ctx, cx, cy, k, tint) {
    ctx.fillStyle(tint, 1);
    ctx.fillRoundedRect(cx - 16 * k, cy - 6 * k, 32 * k, 20 * k, 4 * k);
    ctx.fillStyle(0x2e2820, 0.55);
    ctx.fillCircle(cx - 7 * k, cy + 2 * k, 3 * k);
    ctx.fillCircle(cx + 6 * k, cy + 4 * k, 2.5 * k);
    ctx.fillStyle(0x4a4038, 0.65);
    ctx.fillRect(cx - 14 * k, cy + 10 * k, 28 * k, 5 * k);
}
function drawSoilClump(ctx, cx, cy, k) {
    ctx.fillStyle(0x5a4a38, 1);
    ctx.fillCircle(cx - 6 * k, cy + 2 * k, 7 * k);
    ctx.fillCircle(cx + 7 * k, cy, 6 * k);
    ctx.fillCircle(cx, cy - 5 * k, 6 * k);
}
function drawSeed(ctx, cx, cy, k) {
    ctx.fillStyle(0x5c4a32, 1);
    ctx.fillEllipse(cx, cy + 5 * k, 6 * k, 9 * k);
    ctx.fillStyle(0x3a4a2e, 1);
    ctx.fillTriangle(cx, cy - 14 * k, cx - 7 * k, cy + 2 * k, cx + 7 * k, cy + 2 * k);
    ctx.line(cx, cy - 12 * k, cx, cy + 2 * k);
}
function drawPlantThorn(ctx, cx, cy, k) {
    ctx.fillStyle(0x3a3228, 1);
    ctx.fillRect(cx - 2 * k, cy + 8 * k, 4 * k, 14 * k);
    ctx.strokeStyle(0x3a5c32, 2.5 * k, 1);
    ctx.line(cx, cy + 8 * k, cx - 12 * k, cy - 10 * k);
    ctx.line(cx, cy + 8 * k, cx + 12 * k, cy - 10 * k);
    ctx.fillStyle(0x5c4038, 1);
    ctx.fillCircle(cx - 12 * k, cy - 10 * k, 4 * k);
    ctx.fillCircle(cx + 12 * k, cy - 10 * k, 4 * k);
}
function drawPlantSpore(ctx, cx, cy, k) {
    ctx.fillStyle(0x3a4a32, 1);
    ctx.fillCircle(cx, cy + 4 * k, 12 * k);
    ctx.fillStyle(0x5a6a48, 0.85);
    ctx.fillCircle(cx - 10 * k, cy - 8 * k, 5 * k);
    ctx.fillCircle(cx + 10 * k, cy - 6 * k, 6 * k);
    ctx.fillCircle(cx, cy - 12 * k, 5 * k);
}
function drawPlantSnare(ctx, cx, cy, k) {
    ctx.fillStyle(0x4a4030, 1);
    ctx.fillEllipse(cx, cy + 8 * k, 14 * k, 6 * k);
    ctx.strokeStyle(0x5a6a40, 2 * k, 1);
    for (let i = -2; i <= 2; i++) {
        ctx.line(cx + i * 5 * k, cy - 10 * k, cx + i * 3 * k, cy + 10 * k);
    }
}
function drawPlantAcid(ctx, cx, cy, k) {
    ctx.fillStyle(0x4a5a38, 1);
    ctx.fillCircle(cx, cy, 11 * k);
    ctx.fillStyle(0x6a7a48, 0.75);
    ctx.fillCircle(cx - 8 * k, cy - 6 * k, 6 * k);
    ctx.fillStyle(0x5a6a40, 0.9);
    ctx.fillEllipse(cx, cy + 10 * k, 10 * k, 4 * k);
}
function drawWeed(ctx, cx, cy, k) {
    ctx.fillStyle(0x4a5038, 1);
    ctx.fillCircle(cx - 7 * k, cy + 4 * k, 7 * k);
    ctx.fillCircle(cx + 8 * k, cy + 2 * k, 6 * k);
    ctx.fillStyle(0x3a4230, 1);
    ctx.fillRect(cx - 1.5 * k, cy + 8 * k, 3 * k, 12 * k);
}
function drawWater(ctx, cx, cy, k, clean) {
    ctx.fillStyle(clean ? 0x4a5a5c : 0x3a4548, 1);
    ctx.fillRoundedRect(cx - 9 * k, cy - 12 * k, 18 * k, 24 * k, 3 * k);
    ctx.fillStyle(clean ? 0x6a8a8c : 0x4a5058, 0.65);
    ctx.fillEllipse(cx, cy - 2 * k, 11 * k, 9 * k);
}
function drawCan(ctx, cx, cy, k) {
    ctx.fillStyle(0x5c4a38, 1);
    ctx.fillRoundedRect(cx - 8 * k, cy - 12 * k, 16 * k, 24 * k, 2 * k);
    ctx.fillStyle(0x8b7355, 0.85);
    ctx.fillRect(cx - 6 * k, cy - 4 * k, 12 * k, 5 * k);
}
function drawCaps(ctx, cx, cy, k) {
    ctx.fillStyle(0x8b6914, 1);
    ctx.fillCircle(cx - 7 * k, cy, 7 * k);
    ctx.fillCircle(cx + 7 * k, cy, 7 * k);
    ctx.fillCircle(cx, cy - 5 * k, 6 * k);
}
function drawPlank(ctx, cx, cy, k) {
    ctx.fillStyle(0x6a5a40, 1);
    ctx.fillRect(cx - 14 * k, cy - 5 * k, 28 * k, 7 * k);
    ctx.fillRect(cx - 12 * k, cy + 5 * k, 24 * k, 6 * k);
}
function drawTimber(ctx, cx, cy, k) {
    ctx.fillStyle(0x5a4a32, 1);
    ctx.fillRoundedRect(cx - 6 * k, cy - 14 * k, 12 * k, 28 * k, 2 * k);
    ctx.fillStyle(0x4a3a28, 0.8);
    ctx.fillCircle(cx, cy - 14 * k, 6 * k);
}
function drawFiber(ctx, cx, cy, k) {
    ctx.strokeStyle(0x6a5a48, 2 * k, 1);
    for (let i = -2; i <= 2; i++) {
        ctx.line(cx + i * 4 * k, cy - 12 * k, cx + i * 6 * k, cy + 12 * k);
    }
}
function drawStone(ctx, cx, cy, k) {
    ctx.fillStyle(0x5a5550, 1);
    ctx.fillEllipse(cx - 6 * k, cy + 2 * k, 10 * k, 8 * k);
    ctx.fillEllipse(cx + 7 * k, cy + 4 * k, 8 * k, 7 * k);
    ctx.fillStyle(0x4a4848, 1);
    ctx.fillEllipse(cx, cy - 4 * k, 9 * k, 7 * k);
}
function drawMushroomCap(ctx, cx, cy, k) {
    ctx.fillStyle(0x6a5048, 1);
    ctx.fillEllipse(cx, cy - 4 * k, 16 * k, 10 * k);
    ctx.fillStyle(0x8b7068, 0.5);
    ctx.fillCircle(cx - 6 * k, cy - 6 * k, 3 * k);
    ctx.fillStyle(0x5a4a40, 1);
    ctx.fillRect(cx - 3 * k, cy + 2 * k, 6 * k, 12 * k);
}
function drawReedStalk(ctx, cx, cy, k) {
    ctx.strokeStyle(0x5a6a48, 2 * k, 1);
    for (let i = -2; i <= 2; i++) {
        ctx.line(cx + i * 5 * k, cy + 12 * k, cx + i * 3 * k, cy - 14 * k);
    }
    ctx.fillStyle(0x6a7a50, 0.8);
    ctx.fillEllipse(cx, cy - 12 * k, 8 * k, 4 * k);
}
function drawTar(ctx, cx, cy, k) {
    ctx.fillStyle(0x2a2420, 1);
    ctx.fillEllipse(cx, cy + 4 * k, 14 * k, 10 * k);
    ctx.fillStyle(0x1a1814, 0.9);
    ctx.fillCircle(cx, cy - 4 * k, 8 * k);
}
function drawGlass(ctx, cx, cy, k) {
    ctx.fillStyle(0x6a7a78, 0.55);
    ctx.fillTriangle(cx, cy - 12 * k, cx - 10 * k, cy + 10 * k, cx + 10 * k, cy + 10 * k);
    ctx.strokeStyle(0x8a9a98, 1.5 * k, 0.7);
    ctx.line(cx - 8 * k, cy + 4 * k, cx + 6 * k, cy - 6 * k);
}
function drawCharcoal(ctx, cx, cy, k) {
    ctx.fillStyle(0x2a2620, 1);
    ctx.fillRoundedRect(cx - 12 * k, cy - 4 * k, 24 * k, 14 * k, 3 * k);
    ctx.fillStyle(0x1a1814, 0.8);
    ctx.fillCircle(cx - 5 * k, cy + 2 * k, 4 * k);
    ctx.fillCircle(cx + 6 * k, cy, 3 * k);
}
function drawRope(ctx, cx, cy, k) {
    ctx.strokeStyle(0x6a5a40, 2.5 * k, 1);
    for (let i = 0; i < 3; i++) {
        ctx.strokeEllipse(cx - 4 * k + i * 4 * k, cy, 5 * k, 10 * k);
    }
}
function drawCompost(ctx, cx, cy, k) {
    ctx.fillStyle(0x3a3228, 1);
    ctx.fillRoundedRect(cx - 12 * k, cy - 2 * k, 24 * k, 14 * k, 3 * k);
    ctx.fillStyle(0x4a5a32, 0.6);
    ctx.fillCircle(cx - 4 * k, cy - 4 * k, 4 * k);
    ctx.fillCircle(cx + 5 * k, cy - 2 * k, 3 * k);
}
function drawResin(ctx, cx, cy, k) {
    ctx.fillStyle(0x6a5030, 1);
    ctx.fillRoundedRect(cx - 6 * k, cy + 2 * k, 12 * k, 14 * k, 2 * k);
    ctx.fillStyle(0x8b7038, 0.85);
    ctx.fillEllipse(cx, cy - 6 * k, 10 * k, 12 * k);
}
function drawPlankBundle(ctx, cx, cy, k) {
    drawPlank(ctx, cx, cy - 4 * k, k);
    ctx.strokeStyle(0x5c4a32, 2 * k, 1);
    ctx.line(cx - 14 * k, cy + 10 * k, cx + 14 * k, cy + 10 * k);
}
function drawSalt(ctx, cx, cy, k) {
    ctx.fillStyle(0x8a8478, 0.9);
    ctx.fillRoundedRect(cx - 10 * k, cy - 6 * k, 20 * k, 14 * k, 2 * k);
    ctx.fillStyle(0xc9c4b8, 0.5);
    ctx.fillCircle(cx - 4 * k, cy, 3 * k);
    ctx.fillCircle(cx + 5 * k, cy + 2 * k, 2 * k);
}
function drawHide(ctx, cx, cy, k) {
    ctx.fillStyle(0x6a5a48, 1);
    ctx.fillEllipse(cx, cy, 18 * k, 14 * k);
    ctx.strokeStyle(0x4a4038, 1.5 * k, 0.8);
    ctx.line(cx - 8 * k, cy - 4 * k, cx + 8 * k, cy + 4 * k);
}
function drawBrick(ctx, cx, cy, k) {
    ctx.fillStyle(0x7a5a48, 1);
    ctx.fillRect(cx - 14 * k, cy - 4 * k, 12 * k, 8 * k);
    ctx.fillRect(cx, cy - 4 * k, 14 * k, 8 * k);
    ctx.fillRect(cx - 10 * k, cy + 6 * k, 20 * k, 8 * k);
}
function drawNailBox(ctx, cx, cy, k) {
    ctx.fillStyle(0x5c4a38, 1);
    ctx.fillRoundedRect(cx - 12 * k, cy - 8 * k, 24 * k, 18 * k, 2 * k);
    ctx.fillStyle(0x7a7068, 1);
    ctx.fillRect(cx - 2 * k, cy - 12 * k, 4 * k, 10 * k);
    ctx.fillRect(cx + 6 * k, cy - 10 * k, 4 * k, 8 * k);
}
function drawIngot(ctx, cx, cy, k) {
    ctx.fillStyle(0x6a6560, 1);
    ctx.fillRoundedRect(cx - 12 * k, cy - 6 * k, 24 * k, 12 * k, 2 * k);
    ctx.fillStyle(0x8a8580, 0.5);
    ctx.fillRect(cx - 8 * k, cy - 2 * k, 16 * k, 3 * k);
}
function drawWireSpool(ctx, cx, cy, k) {
    ctx.fillStyle(0x5c4a38, 1);
    ctx.fillCircle(cx, cy, 10 * k);
    ctx.fillStyle(0x1a1814, 0.9);
    ctx.fillCircle(cx, cy, 4 * k);
    ctx.strokeStyle(0x7a7068, 2 * k, 1);
    ctx.strokeEllipse(cx, cy, 10 * k, 10 * k);
}
function drawIronPlate(ctx, cx, cy, k) {
    ctx.fillStyle(0x5a5550, 1);
    ctx.fillRoundedRect(cx - 14 * k, cy - 10 * k, 28 * k, 20 * k, 2 * k);
    ctx.fillStyle(0x7a7570, 0.4);
    ctx.fillRect(cx - 10 * k, cy - 6 * k, 8 * k, 12 * k);
}
function drawCanvas(ctx, cx, cy, k) {
    ctx.fillStyle(0x8a8478, 1);
    ctx.fillRoundedRect(cx - 14 * k, cy - 10 * k, 28 * k, 20 * k, 2 * k);
    ctx.strokeStyle(0x5c5348, 1.5 * k, 0.7);
    ctx.line(cx - 10 * k, cy - 6 * k, cx + 8 * k, cy + 6 * k);
}
function drawFertilizer(ctx, cx, cy, k) {
    drawFeedBag(ctx, cx, cy, k);
    ctx.fillStyle(0x4a5a32, 0.8);
    ctx.fillCircle(cx + 8 * k, cy - 8 * k, 4 * k);
}
function drawAcidVial(ctx, cx, cy, k) {
    ctx.fillStyle(0x5a6a40, 0.85);
    ctx.fillRoundedRect(cx - 5 * k, cy + 0, 10 * k, 14 * k, 2 * k);
    ctx.fillStyle(0x6a7a48, 1);
    ctx.fillCircle(cx, cy - 8 * k, 6 * k);
}
function drawFuel(ctx, cx, cy, k) {
    ctx.fillStyle(0x5c4a38, 1);
    ctx.fillRoundedRect(cx - 10 * k, cy - 4 * k, 20 * k, 18 * k, 2 * k);
    ctx.fillStyle(0x8b6914, 0.9);
    ctx.fillRect(cx - 6 * k, cy - 10 * k, 12 * k, 6 * k);
}
function drawBlueprint(ctx, cx, cy, k) {
    ctx.fillStyle(0xc9b896, 0.9);
    ctx.fillRoundedRect(cx - 12 * k, cy - 14 * k, 24 * k, 28 * k, 2 * k);
    ctx.strokeStyle(0x5c5348, 1.5 * k, 0.8);
    ctx.line(cx - 6 * k, cy - 6 * k, cx + 6 * k, cy - 6 * k);
    ctx.line(cx - 6 * k, cy + 4 * k, cx + 4 * k, cy + 4 * k);
}
function drawFlour(ctx, cx, cy, k) {
    ctx.fillStyle(0x8a8478, 1);
    ctx.fillRoundedRect(cx - 10 * k, cy - 6 * k, 20 * k, 14 * k, 2 * k);
    ctx.fillStyle(0xc9c4b8, 0.7);
    ctx.fillEllipse(cx, cy - 2 * k, 8 * k, 4 * k);
}
function drawBread(ctx, cx, cy, k) {
    ctx.fillStyle(0x8b7355, 1);
    ctx.fillEllipse(cx, cy, 16 * k, 10 * k);
    ctx.fillStyle(0x6a5a48, 0.6);
    ctx.fillEllipse(cx - 4 * k, cy - 2 * k, 6 * k, 4 * k);
}
function drawEgg(ctx, cx, cy, k) {
    ctx.fillStyle(0xc9c4b8, 1);
    ctx.fillEllipse(cx, cy, 10 * k, 14 * k);
    ctx.fillStyle(0x8a8478, 0.5);
    ctx.fillEllipse(cx + 2 * k, cy - 2 * k, 4 * k, 6 * k);
}
function drawCheese(ctx, cx, cy, k) {
    ctx.fillStyle(0xc9a86a, 1);
    ctx.fillTriangle(cx - 12 * k, cy + 8 * k, cx + 12 * k, cy + 8 * k, cx, cy - 10 * k);
    ctx.fillStyle(0x8b7355, 0.4);
    ctx.fillCircle(cx - 2 * k, cy, 3 * k);
}
function drawMeat(ctx, cx, cy, k) {
    ctx.fillStyle(0x6a4040, 1);
    ctx.fillEllipse(cx, cy, 16 * k, 12 * k);
    ctx.fillStyle(0x8b5050, 0.7);
    ctx.fillEllipse(cx - 4 * k, cy - 2 * k, 6 * k, 5 * k);
}
function drawSoup(ctx, cx, cy, k) {
    ctx.fillStyle(0x5c4a38, 1);
    ctx.fillEllipse(cx, cy + 4 * k, 16 * k, 10 * k);
    ctx.fillStyle(0x6a5a40, 0.85);
    ctx.fillEllipse(cx, cy, 12 * k, 6 * k);
    ctx.fillStyle(0x4a5a32, 0.8);
    ctx.fillCircle(cx - 4 * k, cy - 2 * k, 4 * k);
}
function drawFeedBag(ctx, cx, cy, k) {
    ctx.fillStyle(0x5a4a32, 1);
    ctx.fillRoundedRect(cx - 11 * k, cy - 6 * k, 22 * k, 16 * k, 2 * k);
    ctx.fillStyle(0x4a4030, 0.85);
    ctx.fillCircle(cx, cy - 11 * k, 6 * k);
}
function drawBone(ctx, cx, cy, k) {
    ctx.fillStyle(0xc9c4b8, 1);
    ctx.fillEllipse(cx - 8 * k, cy, 6 * k, 4 * k);
    ctx.fillEllipse(cx + 8 * k, cy, 6 * k, 4 * k);
    ctx.fillRect(cx - 6 * k, cy - 2 * k, 12 * k, 4 * k);
}
function drawPellet(ctx, cx, cy, k) {
    ctx.fillStyle(0x5a4a38, 1);
    for (let i = -1; i <= 1; i++) {
        ctx.fillCircle(cx + i * 8 * k, cy + (i % 2) * 4 * k, 5 * k);
    }
}
function drawCropWheat(ctx, cx, cy, k) {
    ctx.strokeStyle(0x8b7355, 2 * k, 1);
    ctx.line(cx, cy + 12 * k, cx, cy - 12 * k);
    ctx.fillStyle(0xc9a86a, 1);
    ctx.fillEllipse(cx, cy - 12 * k, 8 * k, 5 * k);
}
function drawCropSun(ctx, cx, cy, k) {
    ctx.fillStyle(0x8b7355, 1);
    ctx.fillCircle(cx, cy - 4 * k, 10 * k);
    ctx.fillStyle(0x6a5a40, 0.8);
    ctx.fillRect(cx - 2 * k, cy + 4 * k, 4 * k, 12 * k);
}
function drawCropCactus(ctx, cx, cy, k) {
    ctx.fillStyle(0x4a5a38, 1);
    ctx.fillRoundedRect(cx - 4 * k, cy - 10 * k, 8 * k, 22 * k, 3 * k);
    ctx.fillRoundedRect(cx - 12 * k, cy, 8 * k, 8 * k, 2 * k);
    ctx.fillRoundedRect(cx + 6 * k, cy - 4 * k, 8 * k, 8 * k, 2 * k);
}
function drawChick(ctx, cx, cy, k) {
    ctx.fillStyle(0xc9a86a, 1);
    ctx.fillCircle(cx, cy + 2 * k, 8 * k);
    ctx.fillCircle(cx + 6 * k, cy - 4 * k, 5 * k);
}
function drawHen(ctx, cx, cy, k) {
    drawChick(ctx, cx, cy, k * 1.15);
    ctx.fillStyle(0x8b5038, 1);
    ctx.fillTriangle(cx + 10 * k, cy - 6 * k, cx + 16 * k, cy - 4 * k, cx + 10 * k, cy);
}
function drawGoat(ctx, cx, cy, k) {
    ctx.fillStyle(0x8a8478, 1);
    ctx.fillEllipse(cx, cy + 4 * k, 18 * k, 10 * k);
    ctx.fillCircle(cx + 10 * k, cy - 6 * k, 6 * k);
}
function drawMilk(ctx, cx, cy, k) {
    drawWater(ctx, cx, cy, k, true);
    ctx.fillStyle(0xc9c4b8, 0.5);
    ctx.fillEllipse(cx, cy - 2 * k, 6 * k, 4 * k);
}
function drawRabbit(ctx, cx, cy, k) {
    ctx.fillStyle(0x8a8478, 1);
    ctx.fillEllipse(cx, cy + 4 * k, 14 * k, 10 * k);
    ctx.fillEllipse(cx - 6 * k, cy - 12 * k, 4 * k, 10 * k);
    ctx.fillEllipse(cx + 6 * k, cy - 12 * k, 4 * k, 10 * k);
}
function drawPig(ctx, cx, cy, k) {
    ctx.fillStyle(0x7a5a58, 1);
    ctx.fillEllipse(cx, cy + 2 * k, 20 * k, 12 * k);
    ctx.fillCircle(cx + 10 * k, cy - 4 * k, 6 * k);
}
function drawBeetle(ctx, cx, cy, k) {
    ctx.fillStyle(0x4a4038, 1);
    ctx.fillEllipse(cx, cy, 16 * k, 10 * k);
    ctx.fillStyle(0x8b6914, 0.8);
    ctx.fillCircle(cx - 8 * k, cy - 2 * k, 3 * k);
    ctx.fillCircle(cx + 8 * k, cy - 2 * k, 3 * k);
}
function drawLard(ctx, cx, cy, k) {
    drawCan(ctx, cx, cy, k);
    ctx.fillStyle(0xc9c4b8, 0.6);
    ctx.fillRect(cx - 4 * k, cy - 2 * k, 8 * k, 4 * k);
}
function drawFeather(ctx, cx, cy, k) {
    ctx.fillStyle(0x8a8478, 0.9);
    ctx.fillEllipse(cx, cy, 6 * k, 18 * k);
    ctx.strokeStyle(0x5c5348, 1.5 * k, 0.8);
    ctx.line(cx, cy - 12 * k, cx, cy + 12 * k);
}
function drawHound(ctx, cx, cy, k) {
    ctx.fillStyle(0x5a4040, 1);
    ctx.fillEllipse(cx, cy + 4 * k, 24 * k, 12 * k);
    ctx.fillCircle(cx + 11 * k, cy - 6 * k, 8 * k);
    ctx.fillStyle(0x8a3030, 0.95);
    ctx.fillCircle(cx + 13 * k, cy - 7 * k, 3 * k);
}
function drawWatchDog(ctx, cx, cy, k) {
    drawHound(ctx, cx, cy, k * 0.9);
    ctx.strokeStyle(0x6a5f52, 2 * k, 0.9);
    ctx.line(cx - 14 * k, cy + 10 * k, cx + 14 * k, cy + 10 * k);
}
function drawPup(ctx, cx, cy, k) {
    drawHound(ctx, cx, cy, k * 0.75);
}
function drawFence(ctx, cx, cy, k) {
    ctx.strokeStyle(0x6a6560, 3 * k, 1);
    for (let i = -2; i <= 2; i++) {
        ctx.line(cx + i * 6 * k, cy - 14 * k, cx + i * 6 * k, cy + 14 * k);
    }
    ctx.line(cx - 12 * k, cy - 8 * k, cx + 12 * k, cy - 8 * k);
    ctx.line(cx - 12 * k, cy + 8 * k, cx + 12 * k, cy + 8 * k);
}
function drawWall(ctx, cx, cy, k) {
    drawSandbags(ctx, cx, cy - 2 * k, k, 18);
    ctx.fillStyle(0x5a5040, 1);
    ctx.fillRoundedRect(cx - 18 * k, cy - 4 * k, 36 * k, 16 * k, 2 * k);
    ctx.fillStyle(0x4a4540, 1);
    for (let col = 0; col < 3; col++) {
        ctx.fillRect(cx - 15 * k + col * 10 * k, cy - 1 * k, 8 * k, 10 * k);
    }
    ctx.strokeStyle(0x3a3530, 1.2 * k, 0.9);
    ctx.line(cx - 16 * k, cy + 10 * k, cx + 16 * k, cy + 10 * k);
}
function drawWireTrap(ctx, cx, cy, k) {
    ctx.strokeStyle(0x7a7068, 2 * k, 1);
    for (let i = 0; i < 4; i++) {
        ctx.strokeEllipse(cx - 8 * k + i * 5 * k, cy, 3 * k, 9 * k);
    }
}
function drawCoop(ctx, cx, cy, k) {
    drawWastelandShelter(ctx, cx, cy, k, { sandbags: false, flag: false, door: true, patch: false });
    ctx.fillStyle(0xc9a86a, 1);
    ctx.fillCircle(cx - 8 * k, cy + 8 * k, 3 * k);
    ctx.fillCircle(cx + 6 * k, cy + 10 * k, 2.5 * k);
}
function drawPenGoat(ctx, cx, cy, k) {
    drawFence(ctx, cx, cy, k * 0.85);
    drawGoat(ctx, cx, cy + 4 * k, k * 0.55);
}
function drawPenRabbit(ctx, cx, cy, k) {
    drawFence(ctx, cx, cy, k * 0.85);
    drawRabbit(ctx, cx, cy + 6 * k, k * 0.55);
}
function drawPenPig(ctx, cx, cy, k) {
    drawFence(ctx, cx, cy, k * 0.85);
    drawPig(ctx, cx, cy + 6 * k, k * 0.5);
}
function drawKennel(ctx, cx, cy, k) {
    drawCoop(ctx, cx, cy, k);
    ctx.fillStyle(0x5a4040, 0.9);
    ctx.fillCircle(cx, cy + 6 * k, 5 * k);
}
function drawInsectCrate(ctx, cx, cy, k) {
    ctx.fillStyle(0x5c4a38, 1);
    ctx.fillRoundedRect(cx - 14 * k, cy - 6 * k, 28 * k, 16 * k, 2 * k);
    drawBeetle(ctx, cx, cy - 2 * k, k * 0.6);
}
function drawMushroomBed(ctx, cx, cy, k) {
    drawSoilPlot(ctx, cx, cy + 4 * k, k, 0x3a4a32);
    drawMushroomCap(ctx, cx - 8 * k, cy - 8 * k, k * 0.7);
    drawMushroomCap(ctx, cx + 8 * k, cy - 6 * k, k * 0.65);
}
function drawReedPatch(ctx, cx, cy, k) {
    drawSoilPlot(ctx, cx, cy + 6 * k, k, 0x3a4a32);
    drawReedStalk(ctx, cx, cy - 4 * k, k);
}
function drawBlade(ctx, cx, cy, k) {
    ctx.fillStyle(0x7a7068, 1);
    ctx.fillTriangle(cx + 5 * k, cy - 14 * k, cx + 12 * k, cy + 12 * k, cx - 2 * k, cy + 10 * k);
    ctx.fillStyle(0x5c4a3a, 1);
    ctx.fillRect(cx - 10 * k, cy + 4 * k, 7 * k, 14 * k);
}
function drawBow(ctx, cx, cy, k) {
    ctx.strokeStyle(0x6a6058, 2.5 * k, 1);
    ctx.strokeEllipse(cx, cy, 15 * k, 20 * k);
    ctx.line(cx - 11 * k, cy, cx + 11 * k, cy);
}
function drawMolotov(ctx, cx, cy, k) {
    ctx.fillStyle(0x6a5040, 1);
    ctx.fillRect(cx - 5 * k, cy + 2 * k, 10 * k, 14 * k);
    ctx.fillStyle(0x8a4030, 0.95);
    ctx.fillCircle(cx, cy - 7 * k, 8 * k);
}
function drawWildSoil(ctx, cx, cy, k) {
    drawSoilPlot(ctx, cx, cy, k, 0x5a4a38);
    ctx.fillStyle(0x4a6a38, 0.55);
    ctx.fillCircle(cx - 11 * k, cy - 5 * k, 5 * k);
}
function drawWildOre(ctx, cx, cy, k) {
    ctx.fillStyle(0x4a4848, 1);
    ctx.fillTriangle(cx - 16 * k, cy + 10 * k, cx, cy - 14 * k, cx + 16 * k, cy + 10 * k);
    ctx.fillStyle(0x8b7355, 0.95);
    ctx.fillCircle(cx + 5 * k, cy - 2 * k, 4 * k);
    ctx.fillCircle(cx - 7 * k, cy + 2 * k, 3 * k);
}
function drawWildTree(ctx, cx, cy, k) {
    ctx.fillStyle(0x4a4030, 1);
    ctx.fillRect(cx - 2 * k, cy + 2 * k, 5 * k, 16 * k);
    ctx.strokeStyle(0x5a4a32, 2.5 * k, 1);
    ctx.line(cx - 12 * k, cy - 2 * k, cx - 8 * k, cy - 14 * k);
    ctx.line(cx, cy + 2 * k, cx, cy - 16 * k);
    ctx.line(cx + 12 * k, cy, cx + 8 * k, cy - 12 * k);
}
function drawWildLake(ctx, cx, cy, k) {
    ctx.fillStyle(0x3a4548, 1);
    ctx.fillEllipse(cx, cy + 2 * k, 28 * k, 14 * k);
    ctx.fillStyle(0x4a5a5c, 0.55);
    ctx.fillEllipse(cx - 5 * k, cy, 14 * k, 7 * k);
}
function drawWildBeach(ctx, cx, cy, k) {
    ctx.fillStyle(0x6a5a48, 1);
    ctx.fillEllipse(cx, cy + 6 * k, 26 * k, 10 * k);
    ctx.fillStyle(0x4a5058, 0.7);
    ctx.fillEllipse(cx, cy - 2 * k, 18 * k, 8 * k);
}
function drawWildMarsh(ctx, cx, cy, k) {
    drawWildLake(ctx, cx, cy, k);
    drawReedStalk(ctx, cx, cy - 6 * k, k * 0.8);
}
function drawFacility(ctx, cx, cy, k, kind) {
    drawWastelandShelter(ctx, cx, cy, k, { sandbags: false, flag: false, door: kind !== 'well', patch: true });
    const accent = {
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
        ctx.fillStyle(0x4a5a5c, 1);
        ctx.fillCircle(cx, cy + 5 * k, 8 * k);
        ctx.fillStyle(0x6a8a8c, 0.7);
        ctx.fillCircle(cx, cy + 5 * k, 5 * k);
    }
    else if (kind === 'smelter') {
        ctx.fillStyle(0x8a4030, 1);
        ctx.fillRect(cx - 4 * k, cy - 18 * k, 8 * k, 10 * k);
        ctx.fillStyle(0x6a3020, 0.8);
        ctx.fillCircle(cx, cy - 20 * k, 4 * k);
    }
    else if (kind === 'greenhouse') {
        ctx.fillStyle(0x5a7a48, 0.75);
        ctx.fillRect(cx - 14 * k, cy - 14 * k, 28 * k, 8 * k);
    }
    else if (kind === 'design') {
        ctx.strokeStyle(0xc9b896, 1.5 * k, 1);
        ctx.line(cx - 8 * k, cy + 2 * k, cx + 8 * k, cy + 2 * k);
        ctx.line(cx, cy - 6 * k, cx, cy + 10 * k);
    }
    else if (kind === 'warehouse') {
        ctx.fillRect(cx - 10 * k, cy + 2 * k, 20 * k, 10 * k);
        ctx.strokeStyle(0x5c5348, 1.2 * k, 0.8);
        ctx.line(cx - 8 * k, cy + 5 * k, cx + 8 * k, cy + 5 * k);
    }
    else {
        ctx.fillRect(cx - 8 * k, cy + 2 * k, 16 * k, 8 * k);
    }
}
function drawGeneric(ctx, cx, cy, k) {
    ctx.fillStyle(0x6a5a48, 1);
    ctx.fillRoundedRect(cx - 10 * k, cy - 8 * k, 20 * k, 16 * k, 3 * k);
    ctx.fillStyle(0x8b7355, 1);
    ctx.fillCircle(cx, cy, 7 * k);
    ctx.strokeStyle(0xc9c4b8, 1.5 * k, 0.6);
    ctx.line(cx - 5 * k, cy - 3 * k, cx + 5 * k, cy + 3 * k);
}
