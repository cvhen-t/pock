---
name: ai-sound-effect-workflow
description: AI and procedural sound effect workflow for games — text-to-SFX (AudioGen, Bark), Foley layering, ComfyUI Woosh, Web Audio, mix hierarchy, and 3D spatial rules. Use when the user mentions sound effects, SFX, Foley, AI audio, AudioGen, game audio, or Woosh ComfyUI.
---

# AI Sound Effect Workflow

## Categories (mix hierarchy)

| Category | Behavior | Relative level |
|----------|----------|----------------|
| **Voice** | Highest priority | 0 dB ref |
| **Player SFX** | Critical feedback | -3 to -6 dB |
| **Enemy SFX** | Directional awareness | -6 to -9 dB |
| **Music** | Ducks under voice | -6 to -12 dB |
| **Ambient** | Bed | -12 to -18 dB |

When voice plays: duck music/ambient **6–9 dB**.

## SFX design — layering

| Layer | Role | Example (gunshot) |
|-------|------|---------------------|
| Attack | Transient | click |
| Body | Main energy | boom |
| Tail | Room/decay | reverb |
| Sweetener | Unique detail | shell casing |

## AI generation routing

| Duration | Tool | Prompt tips |
|----------|------|-------------|
| &lt; 10s one-shots | AudioGen (Replicate), Meta models | Specific material + environment |
| Voice-ish stingers | Bark | `[laughs]`, `[sighs]` in text |
| Video-synced SFX | ComfyUI **Woosh** (Sony) | Text2Audio or Video2Audio nodes |
| UI bleeps | Web Audio / Tone.js | Parameterized synthesis — see ui-sound-design skill |

### Prompt formula (text-to-SFX)

```
[source action], [surface/material], [environment], [distance], [quality]
```

Good: `footsteps on wooden floor in empty hallway, medium pace, close mic`  
Bad: `walking sound`

Constraints:

- Be specific about material and space
- Specify duration (e.g. 2s, 5s max for AudioGen)
- Generate **3–5 variations** per sound; pick best in DAW

### ComfyUI Woosh (video-sync)

1. Install [ComfyUI-Woosh](https://github.com/Saganaki22/ComfyUI-Woosh) nodes
2. **DFlow/DVFlow** for low VRAM (4 steps, CFG 1.0)
3. Match text conditioning to model family (Flow vs DFlow)
4. **~100 frames ≈ 1s** at 48 kHz for timing alignment

## Game implementation

| Sound | 3D? | Reason |
|-------|-----|--------|
| Player footsteps | Optional subtle | Always readable |
| Enemy footsteps | Yes | Spatial awareness |
| Gunfire | Yes | Combat readability |
| UI clicks | No | Non-diegetic |
| Music | No | Mood |

**Variations**: never play identical sample repeatedly — rotate 3–5 assets with slight pitch/volume randomization.

## Delivery checklist

- [ ] Format: OGG (web/mobile), WAV (source)
- [ ] Normalize per category; no clipping
- [ ] Name: `footstep_wood_01.ogg`
- [ ] Map to game events in data (`events.json` or Godot/Phaser audio keys)

## Procedural fallback (no AI)

FFmpeg / synthesis for placeholders during prototyping — replace with AI finals before ship.

## Sources

- [sickn33/antigravity-awesome-skills `game-audio`](https://github.com/sickn33/antigravity-awesome-skills)
- [ComfyUI Woosh workflow](https://github.com/Saganaki22/ComfyUI-Woosh)
- [dannyjpwilliams/ui-sound-design-skill](https://github.com/dannyjpwilliams/ui-sound-design-skill) for Web Audio UI SFX
