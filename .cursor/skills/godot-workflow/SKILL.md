---
name: godot-workflow
description: Godot 4 game development workflow with GDScript patterns, signals, scenes, state machines, resources, and optimization. Use when the user mentions Godot, GDScript, Godot 4, scene tree, signals, tilemap, or building 2D/3D games in Godot.
---

# Godot Workflow (Godot 4)

## Philosophy

- **Nodes for everything** — compose behavior; avoid deep inheritance
- **Signals** for loose coupling between scenes
- **Resources** (`.tres`) for data; keep logic in nodes
- **Typed GDScript** — use static types and `@export` for inspector-driven design

## Project workflow

1. **Design scenes first** — one responsibility per scene (Player, Enemy, Level, UI)
2. **Autoloads sparingly** — `GameManager`, `EventBus`, `SaveManager` only when truly global
3. **Input Map** — define actions in Project Settings; never hardcode keys in gameplay code
4. **Iterate in editor** — run scene (F6) before full game (F5)

## Scene tree conventions

| Node type | Naming |
|-----------|--------|
| Scenes / nodes | `PascalCase` |
| Functions / variables | `snake_case` |
| Constants | `UPPER_SNAKE` |
| Signals | past tense or event name: `health_changed`, `died` |

## Core patterns

### Signals (decoupling)

```gdscript
signal item_collected(item_id: StringName, amount: int)

func _on_area_entered(area: Area2D) -> void:
    if area.is_in_group("pickups"):
        item_collected.emit(area.get_item_id(), 1)
```

### State machine (gameplay states)

Use a `StateMachine` parent with `State` children; disable processing on inactive states. See [resources/implementation-playbook.md](resources/implementation-playbook.md).

### Resources (data-driven)

```gdscript
class_name WeaponData
extends Resource

@export var name: StringName
@export var damage: int
@export var projectile_scene: PackedScene
```

Duplicate resources at runtime when mutating stats (`duplicate()`).

### Object pooling

Pool bullets, particles, and damage numbers — avoid `instantiate()`/`queue_free()` every frame in shooters.

## Performance checklist

- Cache `@onready` node references
- Disable `_process` when off-screen or inactive
- Use `StringName` for dictionary keys hit every frame
- Profile with Godot Profiler before micro-optimizing

## Audio sync (rhythm games)

Use `AudioServer.get_playback_position()` + `AudioServer.get_time_since_last_mix()` — **not** `Time.get_ticks_msec()` for beat-synced gameplay.

## MCP / live editor (optional)

For AI-driven editor control, add MCP when needed:

- [Dreamer568/godot-mcp](https://github.com/Dreamer568/godot-mcp) — WebSocket bridge in Godot 4 editor
- [Aesthetic-Engine/godot-runtime-bridge](https://github.com/Aesthetic-Engine/godot-runtime-bridge) — run game + observe from agent

## Additional resources

- Detailed patterns: [resources/implementation-playbook.md](resources/implementation-playbook.md)
- Extended skill library: [thedivergentai/gd-agentic-skills](https://github.com/thedivergentai/gd-agentic-skills)

## Source

Based on [sickn33/antigravity-awesome-skills `godot-gdscript-patterns`](https://github.com/sickn33/antigravity-awesome-skills) and [omer-metin/skills-for-antigravity `godot-development`](https://github.com/omer-metin/skills-for-antigravity).
