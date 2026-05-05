# APE Benchmark Notes

Internal documentation for coaches, contributors, and future validators.
Not shown in the UI — reference only.

---

## 1. Current Benchmark Assumptions

Benchmarks live in `BENCH` (index.html) and are keyed by athlete tier:
`youth`, `hs`, `college`, `pro`.

Each metric uses a 5-point threshold array:
```
[unused_floor, avg_max, solid_max, strong_max, elite_max]
```
Scores 1–5 map to: Below Avg → Average → Solid → Strong → Elite.

Sprint metrics use `lb:true` (lower is better). Jump/GPS use higher-is-better.

### Source assumptions

| Metric | Source basis | Confidence |
|--------|-------------|------------|
| VJ (HS) | Combine data + training-population distributions | Medium |
| VJ (College) | D1 combine + NSCA reference ranges | Medium-High |
| Broad Jump | Proportional to VJ with horizontal power adjustment | Medium |
| RSI | Fixed scale (not tier-benchmarked) — Morin & Samozino reference | High |
| 5-10 Fly (HS) | Laser-timed training populations, not FAT | Medium |
| 5-10 Fly (College) | Intentionally widened avg band (1.34–1.46s) to reflect real distributions | Medium-High |
| 10-10 Fly | Proportional to 5-10 fly with max velocity adjustment | Medium |
| GPS Speed | Sport-aggregated; varies significantly by sport and position | Low-Medium |

### Flagged benchmarks (need external validation)

- **Youth VJ floor (14 in)**: May be too low for athletic programs; could be appropriate for general youth. Validate against age-specific PE/combine data.
- **Pro VJ Elite (38 in)**: Aggressive — represents top NFL combine performers. Verify against real program data.
- **GPS Speed (all tiers)**: Widest uncertainty. GPS numbers vary heavily by sport, position, and device (Catapult vs. GPSports vs. STATSports). Consider making GPS sport-specific.
- **5-10 Fly (Youth)**: Limited validated data in this range. Current thresholds are extrapolated from HS bands. Flag any youth athlete who scores Elite here for manual review.
- **10-10 Fly (Pro)**: Elite threshold (≤0.92s) is combine-level. Confirm this is appropriate for training populations.

---

## 2. SPORT_CTX — Position Context System

`SPORT_CTX` is an array of position profile objects used to:
1. Show a "Position Profile" callout on the eval results page
2. Show a "Position Profile" section on the printed client report
3. Drive priority metric highlighting in the companion card (Commit 3)

### Schema
```js
{
  keys: ['wr', 'wide receiver', 'receiver'],  // position strings to match
  sport: 'football',                          // REQUIRED for sport-gated matching (Commit 3 fix)
  pri: ['ac', 'mv'],                          // priority metric keys for this position
  gate: 'ac',                                 // the single metric this position "lives or dies by"
  note: 'WR: Speed is the position...'        // coach-facing context note
}
```

### Matching logic (fixed in Commit 3)

**Problem (original):** `getSportCtx` concatenated `position + sport` into a single string and
searched all entries with `indexOf`. This caused cross-sport false matches:
- Basketball "guard" matched football OL entry (`keys: ['ol','guard','tackle',...]`)
- Soccer "forward" matched basketball SF entry
- "center" matched both OL and basketball center depending on entry order

**Fix (Commit 3):** Sport-gated matching. `getSportCtx(sport, pos)` now:
1. Determines `sportTag` from the `sport` argument (`/football/`, `/basketball/`, etc.)
2. Skips any SPORT_CTX entry where `sc.sport !== sportTag` (when sport is known)
3. Falls back to full-string match only when sport is unknown/blank

This means position-only input still works for unambiguous positions (e.g., "goalkeeper"),
but sport context prevents cross-sport collision.

### Covered sports and positions

| Sport | Positions |
|-------|-----------|
| Football | WR, DB/CB/S, RB, TE, LB, QB, OL/OT/OG, DL/DE/Edge |
| Soccer | Forward/Winger, Midfielder, Defender/CB, Goalkeeper |
| Basketball | PG, SG, SF, PF, Center |
| Track & Field | Sprinter, Jumper, Thrower |
| Baseball/Softball | OF, IF/SS, Pitcher, Catcher |

### Not yet covered (future additions)

- Volleyball (OH, MB, S, L, RS)
- Lacrosse (Attack, Midfield, Defense, Goalie)
- Rugby (props vs. backs differ dramatically)
- Swimming / water sports (different metric relevance entirely)

---

## 3. POS_GROUPS — Position Group Layer (Commit 3)

`POS_GROUPS` defines 6 athletic archetypes with position-specific metric weights.
These weights are applied in `computeAdjustedScores()` to produce a
**position-adjusted APE score** that runs alongside the raw APE.

> The raw APE score is never modified. The adjusted score is additive only.

### Group definitions

| Group | Label | Primary quality | Weight emphasis |
|-------|-------|----------------|-----------------|
| `SPEED_SKILL` | Speed-Skill | Speed is the position | ac×1.8, mv×1.8 |
| `POWER_SPEED` | Power-Speed | Power and speed equally | ac×1.5, vp×1.5, hp×1.4 |
| `POWER_DOM` | Power | Power is the job | vp×1.8, hp×1.8 |
| `REACTIVE` | Reactive | Reactive strength + quickness | rs×1.8, ac×1.6 |
| `ENDURANCE_SPD` | Endurance-Speed | Repeated sprint + GPS | gps×1.8, mv×1.5, rs×1.4 |
| `GENERAL` | General | Balanced profile | All weights ~1.1–1.3 |

### Weight rationale

Weights are multiplied against the raw 1–5 metric score before computing the weighted APE.
The formula mirrors `getAPEScore()` but substitutes position weights for the universal weights.

**Universal weights (current):** `{vp:1.2, hp:1.2, rs:1.0, ac:1.5, mv:1.5, gv:1.3, ft:1.3}`
**Position weights:** Override per-group. Unspecified metrics fall back to 1.0.

### POSITION_MAP — sport+position → POS_GROUP key

```
football:
  wr, db, cb, safety          → SPEED_SKILL
  rb, te, lb, de, edge        → POWER_SPEED
  qb                          → REACTIVE
  ol, ot, og, center, dt      → POWER_DOM

soccer:
  forward, winger, striker    → SPEED_SKILL
  midfielder                  → ENDURANCE_SPD
  defender, cb, fullback      → REACTIVE
  goalkeeper                  → REACTIVE

basketball:
  pg                          → REACTIVE
  sg                          → SPEED_SKILL
  sf                          → POWER_SPEED
  pf                          → POWER_DOM
  center                      → POWER_DOM

track:
  sprinter                    → SPEED_SKILL
  jumper                      → POWER_SPEED
  thrower                     → POWER_DOM

baseball:
  outfield                    → SPEED_SKILL
  shortstop, infield          → REACTIVE
  pitcher                     → POWER_DOM
  catcher                     → REACTIVE
```

### Coexistence with SPORT_CTX

`SPORT_CTX` and `POS_GROUPS` / `POSITION_MAP` serve different purposes and coexist:

| | SPORT_CTX | POS_GROUPS / POSITION_MAP |
|--|-----------|--------------------------|
| **Purpose** | Qualitative context note + priority highlights | Quantitative score adjustment |
| **Output** | Text callout on results + report | Adjusted APE score + companion card |
| **UI location** | Results page callout, report section | Companion card below Performance Scores |
| **Driven by** | Position keyword match | Sport-first → position group resolution |

---

## 4. Height / Weight / Sport / Position Influence Notes

### Bodyweight
Currently stored but **not used in scoring**. Potential uses:
- Relative strength normalization (force per unit mass)
- Sled load recommendations (10–20% BW for acceleration work)
- Weight class tracking for combat sports
- Future: flag athletes where BW gain/loss correlates with APE change

### Height
Currently stored but **not used in scoring**. Potential uses:
- Sport-specific reach/wingspan estimation (basketball, volleyball)
- Position fit analysis (e.g., OL minimum height thresholds)
- Normalization for vertical jump (jump-reach vs. raw VJ)

### Sport influence on GPS benchmarks
GPS speed varies significantly across sports. A 20 mph GPS read means something
very different in soccer (common for forwards) vs. American football (rare for OL).
GPS benchmarks should eventually be sport-specific rather than tier-only.
Current GPS thresholds are most accurate for soccer and football skill positions.

### Position influence on benchmark relevance
Some metrics are near-irrelevant for certain positions:
- GPS speed for OL is nearly meaningless — they rarely reach top speed in open field
- RSI for pure power positions (OL, throwers) matters less than for reactive positions
- VJ for distance runners / soccer midfielders matters differently than for jump athletes

The `POS_GROUPS` weight system partially addresses this by down-weighting
less-relevant metrics. Full position-specific benchmark tables would require
sufficient data volume per sport/position to validate.

---

## 5. Validation Roadmap

Priority order for external benchmark validation:

1. **5-10 Fly and 10-10 Fly** — most frequently used; highest coaching impact
2. **VJ by position** — OL 24" Solid is very different than DB 24" Solid
3. **GPS speed by sport** — currently too blended
4. **Youth benchmarks** — least validated; extrapolated from HS data
5. **Pro-level thresholds** — should reflect NFL/NBA/MLS combine data, not training populations

To validate: export athlete data (leaderboard export) and compare score distributions
against known athlete populations. Flag if >40% of a population scores Solid or above
on a given metric — threshold may be too low.
