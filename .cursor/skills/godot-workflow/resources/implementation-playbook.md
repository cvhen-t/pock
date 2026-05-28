# Godot 4 GDScript — Implementation Playbook

Condensed reference. Full upstream: `godot-gdscript-patterns/resources/implementation-playbook.md` in [antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills).

## State machine (minimal)

`StateMachine` registers child `State` nodes, enables only `current_state`, routes `_process`, `_physics_process`, `_unhandled_input`. States call `state_machine.transition_to("Move", msg)`.

## Autoload patterns

- **GameManager**: score, pause, game over signals
- **EventBus**: global signals (player_died, level_completed) — avoid turning into god object
- **SaveManager**: encrypted JSON in `user://`

## Components

`HealthComponent`, `HitboxComponent`, `HurtboxComponent` on parent bodies — damage via signals, not direct parent calls from unrelated scenes.

## Scene manager

Async `ResourceLoader.load_threaded_request` for large levels; optional transition `CanvasLayer`.

## Pooling

`ObjectPool` with `on_spawn` / `on_despawn` / `returned_to_pool` on pooled instances.

## Don'ts

- `get_node()` in hot loops
- Mutating shared `.tres` resources at runtime without `duplicate()`
- Tight scene-to-scene node paths (`get_node("/root/...")`) — use signals or groups
