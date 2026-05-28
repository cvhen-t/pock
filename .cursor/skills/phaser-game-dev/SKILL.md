---
name: phaser-game-dev
description: Plans and implements Phaser 4 (v4.0.0-rc.7) browser games with TypeScript, Vite, scene architecture, Arcade/Matter physics, tilemaps, and asset validation. Use when the user mentions Phaser, Phaser 4, phaser game dev, 2D web game, scene flow, or npm create @phaserjs/game.
---

# Phaser Game Dev (Phaser 4)

## When to use

- Greenfield Phaser 4 + TypeScript + Vite games
- Scene graph and module layout before coding
- Physics (Arcade / Matter), tilemaps, input, UI in Phaser
- Brownfield architecture review of an existing Phaser project

## Quick scaffold

```bash
npm create @phaserjs/game@latest
# Choose TypeScript + Vite; installs phaser@beta (Phaser 4)
cd my-game && npm install && npm run dev
```

Manual: `npm install phaser@beta` (not `phaser` — that is Phaser 3).

## Architecture workflow

1. Read `docs/GDD.md` if present; else confirm genre, core loop, platform, physics mode
2. Inspect `src/main.ts`, `src/scenes/`, `src/objects/` for brownfield work
3. Propose **one** architecture with scene graph, registry keys, asset plan, phased milestones
4. Output typed `Phaser.Types.Core.GameConfig` for greenfield projects
5. Flag Phaser 3 APIs removed in Phaser 4 early

## Scene flow (default)

```
Boot → Preloader → MainMenu → Game → (Pause overlay) → GameOver
```

- **Boot**: minimal config, scale mode
- **Preloader**: load manifest; progress bar
- **Game**: gameplay systems only; no menu logic mixed in

## Project layout

```
src/
  main.ts
  scenes/
    BootScene.ts
    PreloaderScene.ts
    GameScene.ts
  objects/          # Player, enemies, bullets
  systems/          # pools, spawners, audio
  config/           # constants, registry keys
public/assets/      # images, audio, tilemaps (Vite: use public/, not imports)
```

## TypeScript essentials

`tsconfig.json` must include:

```json
"typeRoots": ["./node_modules/phaser/types"],
"types": ["Phaser"]
```

Assets in Vite: place under `public/assets/` and reference as `'assets/foo.png'` (server root).

## Implementation patterns

| System | Pattern |
|--------|---------|
| Bullets / particles | Object pooling |
| Scene transitions | `scene.start` + data payload |
| Global state | `registry` or small singleton module |
| UI | Dedicated UI scene or `DOMElement` / Rex plugins if approved |
| Tilemaps | Tiled JSON + collision layer name convention |

## Common mistakes

| Issue | Fix |
|-------|-----|
| Black screen | Check console 404s; asset path under `public/` |
| `Phaser` types missing | Fix `typeRoots` / `types` in tsconfig |
| Wrong Phaser major | `phaser@beta` for v4 |
| Physics drift | Use fixed timestep; avoid scaling collision bodies per frame |

## Full skill pack (optional upgrade)

When GitHub is available, install the complete portable pack:

```bash
npx skills add Yakoub-ai/phaser4-gamedev --agent cursor -y
```

Includes `phaser-init`, `phaser-architect`, `phaser-coder`, `phaser-input`, and more.

## Source

Based on [Yakoub-ai/phaser4-gamedev](https://github.com/Yakoub-ai/phaser4-gamedev) (`phaser-architect`, `phaser-init`).
