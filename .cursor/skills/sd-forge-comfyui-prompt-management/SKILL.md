---
name: sd-forge-comfyui-prompt-management
description: Manages prompts and workflows for Stable Diffusion WebUI Forge and ComfyUI — txt2img, img2img, LoRA, ControlNet, workflow JSON, and shared model folders. Use when the user mentions Forge, Stable Diffusion WebUI, ComfyUI, ComfyUI workflow, prompt management, SDXL, FLUX, or local image generation pipelines.
---

# Stable Diffusion Forge + ComfyUI Prompt Management

## Tool roles

| Tool | Best for |
|------|----------|
| **SD WebUI Forge** | Fast iteration, single-prompt txt2img/img2img, extensions, A1111-style UI |
| **ComfyUI** | Node graphs, video/audio/3D pipelines, reproducible multi-step workflows |

Both can **share model storage** (symlinks or shared `models/` roots) to avoid duplicate downloads.

## Prompt management (Forge / A1111 style)

### Positive prompt structure

```
[subject], [style], [lighting], [composition], [quality tokens]
```

### Negative prompt (always include for SD 1.5 / SDXL)

```
lowres, bad anatomy, bad hands, text, watermark, blurry, jpeg artifacts
```

### Parameters cheat sheet

| Param | SD 1.5 | SDXL | Notes |
|-------|--------|------|-------|
| Steps | 20–30 draft, 30–50 final | 20–40 | More ≠ always better |
| CFG | 7–12 | 5–8 | Too high = burnt |
| Sampler | DPM++ 2M Karras | same family | Match checkpoint docs |
| Resolution | native training res | 1024² base | Use hires fix if needed |

### Forge-specific

- Forge optimizes VRAM and speed on top of A1111 — same prompt fields
- Document **checkpoint + VAE + LoRA** names in project `prompts/` folder as versioned `.txt` or JSON

## Prompt management (ComfyUI)

ComfyUI uses **workflow JSON**, not a single prompt box. Manage prompts as:

1. **Widget values** on `CLIPTextEncode` (or equivalent) nodes
2. **Named workflow files** in repo: `workflows/txt2img_flux.json`
3. **Parameter schema** when using CLI skills — map `prompt`, `negative`, `seed`, `width`, `height`

### Workflow generation rules

- Use **LiteGraph UI format** (`nodes`, `links`, `version: 0.4`)
- Include top-level **`models` array** with HuggingFace URLs for auto-download on import
- Every workflow needs an output node (`SaveImage`, `PreviewImage`, etc.)
- Validate required inputs against node definitions before delivery

### Agent CLI (when installed)

```bash
comfyui-skill server status --json
comfyui-skill list --json
comfyui-skill run local/txt2img --args '{"prompt":"..."}' --json
```

Install: [HuangYuChuh/ComfyUI_Skill_CLI](https://github.com/HuangYuChuh/ComfyUI_Skill_CLI) or [MieMieeeee/comfyui-agent-skill](https://github.com/MieMieeeee/comfyui-agent-skill).

## Shared asset layout (Forge + ComfyUI)

```
sd-shared-models/
  checkpoints/
  loras/
  vae/
  controlnet/
sd-shared-output/
```

Point Forge `models` and ComfyUI `extra_model_paths.yaml` at the same roots.

## Workflow selection

| Task | ComfyUI template family |
|------|-------------------------|
| txt2img | SD1.5 / SDXL / FLUX / SD3 |
| img2img | IPAdapter, inpaint |
| txt2vid / img2vid | Wan, HunyuanVideo, LTXV |
| upscale | ESRGAN, Ultimate SD upscale |
| audio | Stable Audio nodes |

Official template index: [Comfy-Org/workflow_templates](https://github.com/Comfy-Org/workflow_templates/tree/main/templates).

## Version control for prompts

Store in git:

```
prompts/
  characters/
    hero_v3.txt          # positive + negative + notes
  environments/
  workflows/
    flux_hero_sheet.json
```

Each file header:

```
# checkpoint: flux1-dev.safetensors
# last tuned: 2026-05-28
# intent: game character turnaround, neutral lighting
```

## Full ComfyUI workflow skill

When GitHub works:

```bash
git clone https://github.com/twwch/comfyui-workflow-skill.git .cursor/skills/comfyui-workflow
```

## Sources

- [twwch/comfyui-workflow-skill](https://github.com/twwch/comfyui-workflow-skill)
- [lllyasviel/stable-diffusion-webui-forge](https://github.com/lllyasviel/stable-diffusion-webui-forge)
- [ComfyUI_Skill_CLI](https://github.com/HuangYuChuh/ComfyUI_Skill_CLI)
