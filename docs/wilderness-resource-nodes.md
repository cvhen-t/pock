# 野外资源块 — 土壤 / 矿石 / 树木 / 湖泊

> 配置：`web/public/data/cards/deck_wilderness.json`  
> 机制：复用 `spawn_timer` + `WorkSiteSystem`（幸存者叠上后定时产出进手牌）

---

## 总览

| 野外块 id | 名称 | 牌形 | 产出卡 | 间隔 | 采尽上限 | 用途 |
|-----------|------|------|--------|------|----------|------|
| `wild_soil_mound` | 沃土丘 | wide | `soil_clump` 土块 | 14s | 12 | 配方 `recipe_blight_plot_soil` → 污壤 |
| `wild_ore_vein` | 矿脉 | standard | `scrap` 零件 | 12s | 10 | 防御/本营修复 |
| `wild_tree_grove` | 枯木林 | standard | `wood_plank` 木板 | 9s | 14 | 栅栏/路障配方（待接） |
| `wild_lake` | 荒原湖泊 | wide | `water_dirty` 浑水 | 11s | 12 | 未来净化 → 顶栏净水 |

与营地内 **废料堆（10s / 无限）** 对比：野外矿脉更慢且有采尽，避免无限刷零件。

---

## 操作

1. 将 **幸存者** 叠在野外块上（与锈蚀灌木相同，`worksite` 标签）。
2. 产出进入 **手牌栏** → 拖到主牌桌使用或叠放。
3. 达到 `maxOutputs` 后节点 **变灰、停止产出**，Toast「×× 已采尽」；幸存者仍在堆上，可拖走。

---

## 污壤来源（土壤线）

| 方式 | 配置 |
|------|------|
| 沃土丘 | 采 `soil_clump` ×3 + 幸存者 → `recipe_blight_plot_soil`（配方 UI 未接） |
| 旧配方 | 幸存者 + 零件 ×2 → `recipe_blight_plot` |

开局仍赠送 1 块 **污壤** + 种子（`spawnStarterBoard`）；可持续污壤靠野外土壤块。

---

## 开局摆位

`GameScene.spawnStarterBoard` 在四外侧放置四块野外资源（相对本营 spread 坐标）。

---

## 标签约定

- `wild_node`：所有野外块共有，便于筛选。
- `wild_soil` / `wild_ore` / `wild_tree` / `wild_water`：子类型，供未来地图生成/事件引用。

---

## 数值示例（单块采满）

| 块 | 总产出时间（约） | 总张数 |
|----|------------------|--------|
| 沃土丘 | 14×12 ≈ 168s | 12 土块 |
| 矿脉 | 12×10 = 120s | 10 零件 |
| 枯木林 | 9×14 = 126s | 14 木板 |
| 湖泊 | 11×12 = 132s | 12 浑水 |

---

## 自检

- [x] 卡牌仅在 JSON 定义，无 `cardId` 硬编码分支
- [x] 效果模块 `spawn_timer`（含 `maxOutputs`）
- [ ] 浑水净化、木板配方、顶栏收水 — 待后续系统
