---
name: comfyui
description: Install, run, and automate ComfyUI (Comfy-Org/ComfyUI) — node workflows, API queue, ComfyUI-Manager, models paths, and workflow JSON. Use when the user mentions ComfyUI, comfyanonymous, node graph, txt2img workflow, local SD/FLUX generation, or Comfy API.
---

# ComfyUI（官方引擎 + Agent 工作流）

> 上游仓库：[Comfy-Org/ComfyUI](https://github.com/Comfy-Org/ComfyUI)（原 `comfyanonymous/ComfyUI` 已迁移至此）。

本技能指导 **安装 ComfyUI 本体**、**启动服务**、**工作流 JSON** 与 **HTTP API**。可选安装 `comfyui-skill-cli` 供 Agent 通过命令行执行已注册工作流。

## 与本项目（卡牌生存）的约定

生成游戏美术资源时：

- 每张图必须有 **sidecar prompt**（`*.prompt.json` 或 `docs/art-style-prompt.md` 一致风格）
- 工作流 JSON 放在 `assets/workflows/comfyui/`，禁止在代码里硬编码节点 ID

---

## 1. 安装 ComfyUI（Windows 推荐顺序）

### 方式 A：便携版（最简单）

1. 打开 [ComfyUI Releases](https://github.com/Comfy-Org/ComfyUI/releases) 或官网 [comfy.org](https://www.comfy.org/)
2. 下载 **Windows Portable（NVIDIA）** 并解压到 `tools/ComfyUI-portable/`（或任意路径）
3. 模型放入 `ComfyUI/models/checkpoints/` 等子目录（见官方 README）
4. 运行包内启动脚本

### 方式 B：comfy-cli

```powershell
pip install comfy-cli
comfy install
```

安装路径由 CLI 提示；完成后用 `comfy run` 或进入安装目录执行 `python main.py`。

### 方式 C：Git 克隆（本仓库）

```powershell
cd F:\cc\pock
git clone --depth 1 https://github.com/Comfy-Org/ComfyUI.git tools/ComfyUI
cd tools\ComfyUI
pip install -r requirements.txt
python main.py
```

可选启用管理器：

```powershell
pip install -r manager_requirements.txt
python main.py --enable-manager
```

### 模型路径共享

复制 `extra_model_paths.yaml.example` → `extra_model_paths.yaml`，与 SD Forge / 其他 UI 共用 `models/` 目录。

---

## 2. 启动与快捷键

```powershell
cd tools\ComfyUI   # 或你的安装目录
python main.py
# 高质量预览（可选）: python main.py --preview-method auto
```

| 快捷键 | 作用 |
|--------|------|
| Ctrl+Enter | 排队执行当前图 |
| Ctrl+S / Ctrl+O | 保存 / 加载工作流 JSON |
| 拖拽 PNG/WebP | 从图片恢复工作流（含 seed） |

默认地址：`http://127.0.0.1:8188`

---

## 3. 目录结构（Agent 需知）

| 路径 | 用途 |
|------|------|
| `models/checkpoints/` | 主模型 ckpt/safetensors |
| `models/vae/` | VAE |
| `models/loras/` | LoRA |
| `models/embeddings/` | 文本反演 |
| `input/` | 输入图 |
| `output/` | 生成结果 |
| `custom_nodes/` | 自定义节点 |

工作流导出：**Save (API Format)** 用于脚本；完整 UI 格式用于编辑器导入。

---

## 4. HTTP API（程序化出图）

ComfyUI 运行后，Agent 可调用 REST API（默认 `8188`）：

1. `POST /prompt` — 提交 API 格式 workflow + `client_id`
2. `GET /history/{prompt_id}` — 取结果
3. `GET /view?filename=...` — 下载图片

`script_examples/` 内有 Python 示例；也可参考仓库 `openapi.yaml`。

**原则**：业务层只传 `prompt` / `seed` / `width` 等参数；完整 graph 来自版本化的 JSON 文件。

---

## 5. 工作流与 Prompt

- **节点图**：用 ComfyUI 编辑器搭建或从 [workflow_templates](https://github.com/Comfy-Org/workflow_templates) 导入
- **Prompt 语法**：`(keyword:1.2)` 加权；`{a|b|c}` 通配；`embedding:name.pt` 用于 embedding
- **导出**：保存到 `assets/workflows/comfyui/<name>.json`，并在同目录写 `<name>.prompt.json`

---

## 6. 可选：Agent CLI（工作流技能化）

若已安装 `comfyui-skill-cli`，在 **技能目录** 或项目根执行：

```bash
comfyui-skill --json server status
comfyui-skill --json list
comfyui-skill --json run local/txt2img --args '{"prompt":"..."}' --json
```

安装：

```bash
pip install -U comfyui-skill-cli
```

完整 Agent 流程见本目录 [references/agent-cli.md](references/agent-cli.md)（来自 [ComfyUI_Skills_OpenClaw](https://github.com/HuangYuChuh/ComfyUI_Skills_OpenClaw)）。

---

## 7. 故障排查

| 现象 | 处理 |
|------|------|
| Torch 无 CUDA | 重装带 CUDA 的 PyTorch（见官方 README NVIDIA 一节） |
| 缺模型 | 按节点报错下载到对应 `models/` 子目录 |
| 自定义节点报错 | `python main.py --enable-manager` → Manager 安装依赖 |
| 8188 无法访问 | 确认 `main.py` 已启动、防火墙放行 |

---

## 相关技能

- `.cursor/skills/sd-forge-comfyui-prompt-management/` — Forge + ComfyUI 提示词与工作流管理
- `.cursor/skills/midjourney/` — 仅 Discord MJ 时使用
