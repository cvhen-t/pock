# 卡组设计 — 资源 / 攻击 / 防御

> 配置目录：`web/public/data/cards/` · 牌形由 `shape` 字段驱动，代码见 `cardLayout.ts`  
> 战斗分工（入侵/攻击/防御）：[invasion-attack-defense.md](invasion-attack-defense.md)

---

## 牌形规范（尺寸随内容）

| shape | 宽×高 | 用途 | 示例 |
|-------|-------|------|------|
| `standard` | 72×90 | 单位、工具、常规建筑 | 幸存者、砍刀 |
| `compact` | 60×68 | 消耗品、小资源、种子 | 浆果、零件、筹码 |
| `slim` | 44×118 | **细长** — 线性防御/陷阱 | **铁栅栏**、木板路障、绊索 |
| `wide` | 108×56 | **横向** — 占地屏障、场地 | 沙袋墙、鸡舍、废铁门 |
| `tile` | 88×88 | 方形占地 | 污壤、铁皮掩体 |

叠放间距 `stackSnap` 随牌形略调，避免细长牌与宽牌叠在一起时穿模。

---

## 野外卡组 `deck_wilderness`（4 张）

| id | 名称 | shape | 产出 | 说明 |
|----|------|-------|------|------|
| wild_soil_mound | 沃土丘 | wide | 土块 | 采尽 12 次，见 [wilderness-resource-nodes.md](wilderness-resource-nodes.md) |
| wild_ore_vein | 矿脉 | standard | 零件 | 采尽 10 次 |
| wild_tree_grove | 枯木林 | standard | 木板 | 采尽 14 次 |
| wild_lake | 荒原湖泊 | wide | 浑水 | 采尽 12 次 |

资源卡组新增 **`soil_clump` 土块**（compact，`soil` 标签）。

---

## 资源卡组 `deck_resource`（13 张）

| id | 名称 | shape | 标签 | 说明 |
|----|------|-------|------|------|
| survivor | 幸存者 | standard | survivor, unit | 工作核心 |
| rust_bush | 锈蚀灌木 | standard | worksite, resource_node | 产浆果 |
| scrap_pile | 废料堆 | standard | worksite, resource_node | 产零件 |
| berry_mutant | 变异浆果 | compact | resource, food | 点击收集 |
| scrap | 零件 | compact | resource, material | 建造材料 |
| water_dirty | 浑水 | compact | resource, water_raw | 需净化 |
| water_clean | 净水 | compact | resource, water | 月相消耗 |
| canned_food | 应急罐头 | compact | resource, food | 稳定食物 |
| iron_wheat_seed | 铁根麦种 | compact | seed, farm | 普农 |
| feed_bag | 饲料袋 | compact | resource, feed | 养殖 |
| wood_plank | 木板 | compact | resource, material | 防御配方 |
| caps | 筹码 | compact | resource, currency | 买卡包 |

---

## 攻击卡组 `deck_attack`（10 张）

| id | 名称 | shape | 标签 | 说明 |
|----|------|-------|------|------|
| rusty_machete | 生锈砍刀 | standard | weapon, melee | 叠在幸存者上 +攻 |
| scrap_bow | 废料弩 | standard | weapon, ranged | 远程 |
| molotov | 燃烧瓶 | compact | weapon, consumable | 一次性高伤 |
| seed_thornvine | 变异种子·刺藤 | compact | mutant_seed, farm | 种污壤 |
| seed_spore | 变异种子·孢菇 | compact | mutant_seed, farm | 远程植物 |
| plant_thornvine | 锈刺藤 | slim | attack_plant | 近程防御植物，**竖长** |
| plant_sporegun | 孢子弹匣菇 | standard | attack_plant | 中程射击 |
| watch_dog | 看门犬 | standard | unit, guard | 移动护卫 |
| trap_wire | 绊索 | slim | trap | 细长，第一次接触伤害 |
| mutant_hound | 变异犬 | standard | enemy | 入侵单位（系统刷） |

---

## 防御卡组 `deck_defense`（10 张）

| id | 名称 | shape | 标签 | 说明 |
|----|------|-------|------|------|
| fence_iron | 铁栅栏 | **slim** | defense, barrier | **细长挡线**，减敌人移速 |
| barricade_wood | 木板路障 | **slim** | defense, barrier | 廉价障碍，有耐久 |
| sandbag_wall | 沙袋墙 | **wide** | defense, wall | 横向掩体，挡远程 |
| blight_plot | 污壤 | tile | blight_plot, building | 种变异种子 |
| chicken_coop | 鸡舍 | wide | building, ranch | 养殖占位 |
| spike_strip | 地刺带 | wide | defense, trap | 横向，踩上受伤 |
| bunker_sheet | 铁皮掩体 | tile | defense, shelter | 幸存者躲入减伤 |
| gate_scrap | 废铁门 | wide | defense, gate | 可开关通路 |
| barbed_roll | 铁丝网卷 | compact | defense, consumable | 铺开变成 slim 栅栏 |
| plant_weed | 杂草 | compact | plant | 劣变生长结果 |

---

## 卡组与卡包（后续）

| 卡包 id | 主题 | 主要来源牌组 |
|---------|------|----------------|
| pack_resource | 温饱材料 | deck_resource |
| pack_attack | 武器种子 | deck_attack |
| pack_defense | 栅栏掩体 | deck_defense |

权重与数量在 `data/packs/` 配置，不写死在代码中。

---

## 配方示例（防御）

- 2×零件 + 1×木板 → `fence_iron`（slim）
- 1×幸存者 + 2×木板 + 1×零件 → `barricade_wood`（slim）
- 3×零件 + 2×木板 → `sandbag_wall`（wide）

---

## 自检

- [ ] 每张卡有唯一 `id` 与 `deck` 字段
- [ ] 栅栏/路障/绊索必须为 `slim`
- [ ] 墙/门/刺带为 `wide`
- [ ] 污壤/掩体为 `tile`
- [ ] 效果仅通过 `effects[]` 模块，无硬编码 id
