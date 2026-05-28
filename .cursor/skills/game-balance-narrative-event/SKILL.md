---
name: game-balance-narrative-event
description: Designs game economy, difficulty curves, progression, loot tables, and seed-based narrative event systems with minor/major choices at day or block transitions. Use when the user mentions game balance, narrative events, roguelike events, economy tuning, XP curves, or choice-driven story beats.
---

# Game Balance + Narrative Event Workflow

## Part A — Game balance

### When to apply

- In-game economy (currencies, sinks, faucets)
- Difficulty curves, enemy scaling, power progression
- Loot tables, drop rates, reward schedules
- Playtest feedback → numeric tuning

### Economy framework

| Concept | Question |
|---------|----------|
| **Faucets** | Where does currency/power enter? |
| **Sinks** | Where is it removed? |
| **Inflation** | Does surplus break late game? |
| **Exchange** | Are conversion rates exploitable? |

Target: players feel **rewarded but not saturated** (flow state).

### Difficulty curve

- Plot player power vs content difficulty over time
- Introduce one new mechanic per segment; spike difficulty after teaching
- Use playtest metrics: death rate, time-to-clear, resource leftover %

### Loot tables

Document as rows:

| Item | Weight | Tier gate | Notes |
|------|--------|-----------|-------|
| Health potion | 40 | 1+ | always useful sink |

Validate: expected value per run, pity timers, duplicate handling.

### Deliverables

1. Spreadsheet or markdown table of key knobs
2. Before/after hypothesis for each change
3. Playtest checklist (3–5 sessions minimum for balance claims)

---

## Part B — Narrative event system

### Event types

| Type | UX | Gameplay impact |
|------|-----|-----------------|
| **Minor** | Interstitial notification | Flavor or small stat nudge |
| **Major** | Choice screen (2–4 options) | Meaningful tradeoffs |

### Timing hooks

Fire at controlled transitions:

- `blockStart` / `dayStart` / `dayEnd`
- After boss, before shop, on map enter

Avoid mid-combat unless designed for interruption.

### Data model

```typescript
interface EventDefinition {
  id: string;
  tier: 0 | 1 | 2;           // 0 flavor, 1 standalone, 2 arc
  type: "minor" | "major";
  timing: "blockStart" | "dayStart" | "dayEnd";
  requirements?: { flags?: string[]; minTier?: number };
  choices?: { id: string; effects: EventEffects }[];
}
```

### Selection algorithm

1. Derive **progression tier** from run history (wins, deaths, meta unlocks)
2. **Seed** RNG for reproducible debug: `hash(runSeed + day + phase)`
3. Filter pool by tier, timing, flags, cooldowns
4. Weighted pick; no repeat until pool exhausted or cooldown elapsed

### Flags and consequences

- Set flags on choice: `met_merchant`, `debt_to_guild`
- Gate future events: require `flags.includes("debt_to_guild")`
- Recap text keyed by `(eventId, choiceId)` for run summary

### Persistence

- Store `activeEventId`, `eventFlags[]`, `seenEventIds[]` in save/run state
- Optional: DevTools panel — active event, timers, flag dump

### Content authoring

- **Tier 0**: atmosphere, no balance swing (first run safe)
- **Tier 1**: single-stat tradeoffs (+momentum / -gold)
- **Tier 2**: multi-step arcs spanning days

### Testing

- Unit tests: selection respects tier, flags, cooldowns
- Simulation: 1000 seeds → distribution of events per tier
- Playtest: choices feel fair, not false choices

## Combined workflow (balance + narrative)

1. Define core loop resources (gold, HP, morale)
2. Map **events** to sinks/faucets explicitly (event choice A: -gold +relic)
3. Simulate 10-run economy with event weights enabled
4. Tune event effects before enemy DPS curves

## Sources

- Balance patterns: [game-balancing](https://www.absolutelyskilled.pro/skill/game-balancing) skill ecosystem
- Narrative events: [aviraccoon/skill-issue](https://github.com/aviraccoon/skill-issue) narrative event commit patterns
