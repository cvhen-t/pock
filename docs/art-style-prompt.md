# 游戏美术统一风格

> 所有 AI 出图（Midjourney、ComfyUI、SD Forge 等）与人工约稿均须遵循本文档。  
> 每张资产须附带 sidecar：`同名.prompt.json`（见文末格式）。

---

## 世界观

废土末日生存风格。

文明崩塌后的荒野世界，资源稀缺，工业设施废弃，整体压抑、孤独、生存感强。

---

## 主视觉风格

- 半写实插画
- 暗黑废土
- 低饱和度
- 手绘质感
- 轻微脏污感
- 材质老旧
- 禁止高科技未来感
- 禁止二次元萌系
- 禁止高饱和颜色

---

## 色调

**主色：**

- 灰色
- 土黄
- 暗绿
- 铁锈红
- 深棕

**避免：**

- 荧光色
- 纯蓝
- 纯粉
- 高亮彩色

---

## 光影

- 阴天环境
- 柔和自然光
- 禁止强烈霓虹
- 禁止赛博朋克灯光

---

## 卡牌插图规则

- 单物体居中
- 统一顶部视角
- 背景简单
- 边缘清晰
- 保持卡牌可读性

---

## 风格参考插图

以下示例已按本文档生成，出图时应对齐其色调、质感与构图。每张图配有 `*.prompt.json` sidecar。

| 类型 | 参考图 | 说明 |
|------|--------|------|
| 卡牌物品 | ![卡牌物品参考](art-style/references/card-item-canteen.png) | 顶视、单物体、背景极简 |
| 角色 | ![角色参考](art-style/references/character-survivor.png) | 幸存者、破旧功能装 |
| 怪物 | ![怪物参考](art-style/references/monster-irradiated-wolf.png) | 轻度变异、无克苏鲁 |
| 建筑 | ![建筑参考](art-style/references/building-scrap-shelter.png) | 铁皮木拼、临时避难所 |

**资产目录规范**

```
docs/art-style/references/     # 风格参考（本文档用，勿直接进游戏包体）
web/public/assets/cards/       # 正式卡牌插图（512×512 推荐）
web/public/assets/scenes/      # 游戏场景背景（如 wasteland_board.png）
web/public/assets/characters/
web/public/assets/monsters/
web/public/assets/buildings/
```

| 用途 | 推荐尺寸 | 比例 |
|------|----------|------|
| 卡牌插图 | 512×512 | 1:1 |
| 角色立绘 | 512×768 | 2:3 |
| 怪物 | 640×480 | 4:3 |
| 建筑/场景 | 960×540 | 16:9 |
| UI 图标 | 128×128 | 1:1 |

正式资源命名：`{category}/{cardId}.png` + `{cardId}.prompt.json`，并在 `starter.json` 中通过 `artKey` 引用纹理键。

---

## 建筑风格

- 铁皮
- 木头
- 废旧工业
- 拼装感
- 临时避难所风格

---

## 角色风格

- 幸存者风格
- 衣服破旧
- 功能性优先
- 禁止时尚感

---

## 怪物风格

- 轻度变异
- 动物与辐射结合
- 不走克苏鲁触手路线

---

## UI 风格

- 简洁
- 废土工业 UI
- 旧仪表盘风格
- 金属纹理
- 避免科幻 HUD

---

## Prompt 基础模板（英文，置于每条 prompt 前部）

```
post-apocalyptic survival card game illustration,
dark muted colors,
hand-painted texture,
rusty worn materials,
semi-realistic,
top-down item card art,
simple background,
consistent lighting
```

### 按类型追加片段

| 类型 | 追加英文关键词 |
|------|----------------|
| 卡牌物品 | `single object centered, top-down view, clear silhouette, minimal background`（对齐参考：`art-style/references/card-item-canteen.png`） |
| 建筑/场景 | `scrap metal, wood planks, improvised shelter, abandoned industrial` |
| 角色 | `wasteland survivor, worn functional clothing, no fashion` |
| 怪物 | `mild mutation, irradiated animal, no tentacles, no eldritch horror` |
| UI 素材 | `wasteland industrial UI, old gauge dashboard, metal texture, not sci-fi HUD` |

---

## 统一 Negative Prompt（英文）

生成时必须附带（可按工具删减）：

```
neon lights, cyberpunk, sci-fi futuristic, high saturation, fluorescent colors,
pure blue, pure pink, bright colorful, anime, chibi, cute moe,
clean shiny metal, fashion model, luxury, tentacles, eldritch, cosmic horror,
strong rim light, hologram, laser, spaceship, clean lab
```

---

## Sidecar 格式（`*.prompt.json`）

与图片同目录，例如 `assets/cards/wood_axe.png` → `assets/cards/wood_axe.prompt.json`：

```json
{
  "styleDoc": "docs/art-style-prompt.md",
  "assetType": "card_item",
  "positive": "post-apocalyptic survival card game illustration, dark muted colors, hand-painted texture, rusty worn materials, semi-realistic, top-down item card art, simple background, consistent lighting, rusty axe, single object centered",
  "negative": "neon lights, cyberpunk, sci-fi futuristic, high saturation, anime, chibi, tentacles, eldritch",
  "aspectRatio": "1:1",
  "tool": "comfyui",
  "workflow": "assets/workflows/comfyui/card_item.json",
  "seed": null,
  "notes": "可选：迭代说明"
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `styleDoc` | 是 | 固定引用本文档路径 |
| `assetType` | 是 | `card_item` \| `character` \| `monster` \| `building` \| `ui` |
| `positive` | 是 | 完整正向 prompt（含基础模板 + 主体描述） |
| `negative` | 是 | 完整负向 prompt |
| `aspectRatio` | 是 | 卡牌物品建议 `1:1` |
| `tool` | 否 | `comfyui` \| `midjourney` \| `forge` 等 |
| `workflow` | 否 | ComfyUI 工作流路径 |
| `seed` | 否 | 复现用 |

---

## 自检清单（出图前）

- [ ] 正向 prompt 以「基础模板」开头
- [ ] 已附统一 negative
- [ ] 色调在主色范围内，无禁止色
- [ ] 卡牌类：单物体、顶视、背景简单
- [ ] 已写 sidecar JSON，且 `styleDoc` 指向本文档
