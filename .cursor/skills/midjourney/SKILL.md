---
name: midjourney
description: Writes production-ready Midjourney prompts with comma-separated descriptors, aspect ratio, version, style, and --no negatives. Use when the user mentions Midjourney, MJ prompts, image generation in Discord, --ar, --v, --style raw, or game/UI concept art for Midjourney.
---

# Midjourney Prompt Workflow

## Output contract

Deliver **one copyable prompt block** plus a one-line note: target (Midjourney), aspect ratio, and version if not default.

Do not output long theory unless asked.

## Prompt structure

Use **comma-separated descriptors**, not prose paragraphs.

Order:

1. **Subject** — who/what, action, key props
2. **Medium / style** — illustration, photo, pixel art, isometric, etc.
3. **Environment** — location, era, weather
4. **Lighting** — golden hour, rim light, studio, neon
5. **Composition** — close-up, wide shot, rule of thirds, centered
6. **Mood** — tense, cozy, epic, minimal
7. **Parameters** — always at the end

## Parameters (append at end)

| Flag | When to use | Examples |
|------|-------------|----------|
| `--ar` | Layout | `--ar 16:9`, `--ar 1:1`, `--ar 9:16` |
| `--v` | Model version | `--v 6`, `--v 6.1` (match user's subscription) |
| `--style raw` | Less default beautification | product shots, technical art |
| `--stylize` | Artistic interpretation | `--stylize 100`–`750` |
| `--chaos` | Variation | `--chaos 20` for exploration |
| `--no` | Negative elements | `--no text, watermark, blurry` |
| `--seed` | Reproducibility | when user needs consistent iterations |

## Templates

**Game asset / UI mock**

```
[isometric game shop interior], [cozy warm lighting], [hand-painted stylized], [clean readable shapes], [no characters in foreground], --ar 16:9 --v 6 --style raw --no text, logo, watermark
```

**Character concept**

```
[full body character design sheet], [fantasy ranger], [leather armor], [forest background soft blur], [turnaround friendly pose], [concept art], --ar 3:2 --v 6 --no duplicate limbs, extra fingers
```

**Environment matte**

```
[cinematic wide establishing shot], [ruined city at dusk], [volumetric fog], [muted teal orange palette], [film still], --ar 21:9 --v 6 --stylize 200
```

## Iteration workflow

1. Draft with core subject + style + `--ar`
2. Add `--no` for recurring failures (text, hands, blur)
3. Vary with `--seed` or subtle descriptor changes
4. For variations, suggest `V1–V4` or `Upscale` in Discord — do not pretend to run Midjourney from the IDE

## Hard rules

- Midjourney has **no official public API** in most setups; prompts are for Discord or approved wrappers only
- Never promise automation against ToS unless user provides their own approved integration
- Prefer `--no text` for UI and game screenshots unless text is explicitly requested

## Source

Adapted from [nidhinjs/prompt-master](https://github.com/nidhinjs/prompt-master) Midjourney routing. For full multi-tool prompt mastery, install that repo into `.cursor/skills/` when GitHub is reachable.
