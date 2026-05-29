# 商店 · 怪物掉落

> 配置：`data/shop/shop.json`

---

## 商店界面

- **无全屏遮罩**，打开后仍可操作主牌桌
- **可拖动**：按住标题栏移动窗口
- **分类筛选**：资源 / 武器 / 防御 / 种植 / 设施 / 畜牧（`categories` + `buyListings[].category`）
- **单卡直购**，无卡包随机

### 操作

| 动作 | 做法 |
|------|------|
| 购买 | 切换分类 → 将商品 **拖出面板外松手**；商品多时可 **滚轮滚动** |
| 出售 | 卡牌拖到 **场上摊位建筑** |
| 关闭 | 右上角 × |

---

## 配置示例

```json
{
  "categories": [{ "id": "resource", "name": "资源" }],
  "buyListings": [
    { "id": "buy_scrap", "category": "resource", "cardId": "scrap", "costCaps": 2 }
  ]
}
```

---

## 怪物掉落

见 `data/invasion/drops.json`。
