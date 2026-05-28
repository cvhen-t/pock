# ComfyUI Agent CLI（comfyui-skill-cli）

来源：[HuangYuChuh/ComfyUI_Skills_OpenClaw](https://github.com/HuangYuChuh/ComfyUI_Skills_OpenClaw)

## 安装

```bash
pip install -U comfyui-skill-cli
```

## 必须在项目根执行

CLI 读取当前目录的 `config.json` 与 `data/`。若 `list` 为空，先 `cd` 到配置了 ComfyUI 的项目根。

## 执行流程

1. `comfyui-skill --json server status`
2. `comfyui-skill --json list`
3. `comfyui-skill --json deps check <server>/<workflow>`
4. `comfyui-skill --json run <id> --args '{"prompt":"..."}'`

## 导入工作流

```bash
comfyui-skill --json workflow import path/to/workflow.json
```

导入后生成 `schema.json`，Agent 只使用业务参数名（`prompt`, `seed`），不暴露节点 ID。
