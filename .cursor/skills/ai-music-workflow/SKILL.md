---
name: ai-music-workflow
description: AI music production workflow using MusicGen, Suno, ElevenLabs, Bark, and AudioCraft for text-to-music, stems, TTS, and game BGM loops. Use when the user mentions AI music, text to music, MusicGen, Suno prompts, game soundtrack, or adaptive music.
---

# AI Music Workflow

## Pipeline overview

```
Intent → Tool pick → Prompt/plan → Generate → QC → Normalize → Deliver (WAV/OGG + metadata)
```

## Tool routing

| Need | Tool | Notes |
|------|------|-------|
| **Instrumental BGM / stems** | MusicGen (AudioCraft), Replicate APIs | Good for loops; specify BPM, key, genre |
| **Full songs with vocals** | Suno | Lyric + style prompt; prosody matters |
| **TTS / voiceover** | ElevenLabs, OpenAI TTS, Edge TTS | Not music — route separately |
| **Short motifs** | MusicGen melody conditioning | 15–30s drafts |

## Prompt structure (text-to-music)

Include:

1. **Genre / reference** — chiptune, orchestral, synthwave
2. **Tempo** — `120 BPM`, `slow 80 BPM`
3. **Mood** — tense, hopeful, melancholic
4. **Instrumentation** — drums, bass, pads only (no vocals)
5. **Structure** — intro 4 bars, loopable 32 bars
6. **Technical** — seamless loop, no fade-out, game-ready

Example:

```
Upbeat 16-bit RPG town theme, 110 BPM, major key, square lead + soft drums, loopable 30 seconds, no vocals, consistent energy, game soundtrack
```

## Suno / lyric workflows

1. **Concept** — theme, POV, emotional arc
2. **Lyrics** — verse/chorus; mark pronunciation quirks
3. **Style line** — genre, vocal gender, production era
4. **Mastering targets** — streaming loudness vs in-game (-14 LUFS vs hotter SFX mix)

Use quality gates: rhyme scan, cliché pass, duration fit.

## Game integration

| State | Music response |
|-------|----------------|
| Menu | Calm loop, low intensity |
| Exploration | Ambient layer |
| Combat | Crossfade to high energy |
| Victory / defeat | 2–4s stinger then return |

Techniques: crossfade, stem layers (add percussion layer at high threat), horizontal segments.

## Post-processing checklist

- [ ] Trim silence; loop points aligned to bar
- [ ] Normalize to project loudness target
- [ ] Export OGG for Godot/Phaser web builds; WAV for editing
- [ ] Document BPM and key in filename: `battle_128bpm_Cm.ogg`

## Ethics / rights

- Confirm license for commercial ship (model ToS, Suno plan, stock stems)
- No voice cloning without consent

## Upgrade path

Full album pipeline: [bitwize-music-studio/claude-ai-music-skills](https://github.com/bitwize-music-studio/claude-ai-music-skills)

When GitHub works:

```bash
git clone --depth 1 https://github.com/omer-metin/skills-for-antigravity.git _tmp
cp -r _tmp/skills/ai-music-audio .cursor/skills/ai-music-audio-upstream
```

## Source

Based on [omer-metin/skills-for-antigravity `ai-music-audio`](https://github.com/omer-metin/skills-for-antigravity).
