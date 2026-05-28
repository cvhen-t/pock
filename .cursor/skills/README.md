# Project Agent Skills

Installed for **pock** (`F:\cc\pock`). Cursor loads skills from `.cursor/skills/` automatically.

| Skill folder | Display name | Source |
|--------------|--------------|--------|
| `ui-ux-pro-max` | UI UX Pro Max | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) via `npx uipro-cli init --ai cursor` |
| `midjourney` | Midjourney | Adapted from [nidhinjs/prompt-master](https://github.com/nidhinjs/prompt-master) |
| `phaser-game-dev` | Phaser Game Dev | [Yakoub-ai/phaser4-gamedev](https://github.com/Yakoub-ai/phaser4-gamedev) |
| `godot-workflow` | Godot Workflow | [godot-gdscript-patterns](https://github.com/sickn33/antigravity-awesome-skills) |
| `comfyui` | ComfyUI 官方引擎 | [Comfy-Org/ComfyUI](https://github.com/Comfy-Org/ComfyUI) + Agent 工作流 |
| `sd-forge-comfyui-prompt-management` | Stable Diffusion Forge + ComfyUI | [twwch/comfyui-workflow-skill](https://github.com/twwch/comfyui-workflow-skill) + Forge docs |
| `game-balance-narrative-event` | Game Balance + Narrative Events | Community patterns |
| `ai-music-workflow` | AI Music Workflow | [omer-metin/skills-for-antigravity](https://github.com/omer-metin/skills-for-antigravity) |
| `ai-sound-effect-workflow` | AI Sound Effect Workflow | antigravity `game-audio` + Woosh |

## Usage

Restart Cursor (or start a new Agent chat). Mention the task, e.g.:

- "用 Godot Workflow 设计一个平台跳跃场景"
- "用 ui-ux-pro-max 做一个 SaaS 落地页"
- `@midjourney` 风格的概念图 prompt

## Upgrade when GitHub is reachable

```powershell
cd F:\cc\pock

# UI UX Pro Max
npx uipro-cli init --ai cursor

# Full Phaser skill pack
npx skills add Yakoub-ai/phaser4-gamedev --agent cursor -y

# ComfyUI 本体（应用，非 skill）
git clone --depth 1 https://github.com/Comfy-Org/ComfyUI.git tools/ComfyUI

# ComfyUI Agent CLI 技能包（可选，含 config 模板）
git clone https://github.com/HuangYuChuh/ComfyUI_Skills_OpenClaw.git .cursor/skills/comfyui-cli-pack
pip install -U comfyui-skill-cli

# ComfyUI workflow skill (templates + node registry)
git clone https://github.com/twwch/comfyui-workflow-skill.git .cursor/skills/comfyui-workflow

# Optional: 1400+ skills bundle
npx antigravity-awesome-skills --cursor
```

## Note

Some skills were written locally because `git clone` to GitHub timed out from this machine. Content matches upstream intent; run the upgrade commands above for full templates and reference files.
