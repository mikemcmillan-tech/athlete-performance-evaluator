# BENCHMARK_NOTES.md

Single source of truth for every benchmark, threshold, modifier, and assumption used by the APE scoring system. Read this before changing any number in `BENCH`, `POS_GROUPS`, or `POSITION_MAP`.

**Status legend:**
- ✅ **Defensible** — anchored to research, coaching consensus, or combine data.
- ⚠️ **Educated guess** — directionally right, magnitudes pulled from experience. Needs real-data validation.
- ❌ **Placeholder** — known to be off; in here so we don't forget it exists.

---

## 1. Tier benchmarks (`BENCH` in `index.html` line ~997)

Universal "general athlete" thresholds keyed by tier. The four tiers represent training-population averages, not combine elite. Array layout: `[unused_floor, avg_max, solid_max, strong_max, elite_max]`.

### 1.1 Vertical Jump (in) — higher better
| Tier | Avg | Solid | Strong | Elite |
|---|---|---|---|---|
| Youth (U14) | 14 | 18 | 22 | 26 | ⚠️ |
| HS | 18 | 23 | 27 | 31 | ⚠️ — verify against local New Athlete data |
| College | 22 | 26 | 30 | 34 | ✅ — broadly aligns with NFL/Combine averages |
| Pro/Elite | 26 | 30 | 34 | 38 | ⚠️ — Pro elite ≥38" is high; could be 36 |

### 1.2 Broad Jump (ft) — higher better
| Tier | Avg | Solid | Strong | Elite |
|---|---|---|---|---|
| Youth | 5.0 | 5.7 | 6.4 | 7.1 | ⚠️ |
| HS | 6.0 | 6.8 | 7.5 | 8.2 | ⚠️ |
| College | 7.0 | 7.8 | 8.5 | 9.2 | ✅ |
| Pro | 8.5 | 9.2 | 9.9 | 10.6 | ⚠️ |

### 1.3 5–10 Fly (s) — lower better
| Tier | Avg | Solid | Strong | Elite |
|---|---|---|---|---|
| Youth | 1.42 | 1.33 | 1.25 | 1.17 | ⚠️ |
| HS | 1.42→1.38 | 1.28 | 1.20 | 1.12 | ⚠️ — band intentionally widened |
| College | 1.55→1.46 | 1.34 | 1.22 | 1.10 | ⚠️ — widened to reflect training population |
| Pro | 1.20 | 1.14 | 1.08 | 1.02 | ❌ — **Pro Avg=1.20 is faster than College Elite=1.10. Pro band too tight, needs review.** |

### 1.4 10–10 Fly (s) — lower better
| Tier | Avg | Solid | Strong | Elite |
|---|---|---|---|---|
| Youth | 1.35 | 1.27 | 1.19 | 1.11 | ⚠️ |
| HS | 1.35→1.30 | 1.20 | 1.13 | 1.05 | ⚠️ |
| College | 1.45→1.36 | 1.25 | 1.13 | 1.03 | ⚠️ |
| Pro | 1.10 | 1.04 | 0.98 | 0.92 | ❌ — same issue as 5-10 fly Pro band |

### 1.5 GPS Max Velocity (mph) — higher better
| Tier | Avg | Solid | Strong | Elite |
|---|---|---|---|---|
| Youth | 15.0 | 16.5 | 17.5 | 18.5 | ❌ — **18.5 mph elite for U14 is unrealistic, likely 17.0–17.5** |
| HS | 16.5 | 18.0 | 19.0 | 20.5 | ⚠️ |
| College | 17.5 | 19.5 | 21.0 | 22.5 | ✅ |
| Pro | 18.5 | 20.0 | 21.5 | 23.0 | ⚠️ |

### 1.6 RSI — fixed scale, NOT tier-benchmarked
- ≥3.0 → Score 5 (World class)
- ≥2.5 → Score 4 (High)
- ≥2.0 → Score 3 (Well established)
- ≥1.5 → Score 2 (Moderate)
- <1.5 → Score 1 (Low)

✅ Defensible. RSI is a nervous-system / stiffness property; population-relative scaling adds noise. Source: McMahon, Lloyd, Comyns reactive strength reviews.

---

## 2. APE Score weighting (`getAPEScore` in `index.html` line ~1166)

Weighted average of metric scores (1–5), scaled to 0–100. Weights:

| Metric | Key | Weight | Rationale |
|---|---|---|---|
| Vertical Power | vp | 1.2 | ⚠️ |
| Horizontal Power | hp | 1.2 | ⚠️ |
| Reactive Strength | rs | 1.0 | ⚠️ — RSI is foundational; weighted least in v1, may need to rise |
| Acceleration | ac | 1.5 | ✅ — speed is a primary athletic outcome |
| Max Velocity | mv | 1.5 | ✅ |
| GPS Max Vel | gv (alias gps) | 1.3 | ⚠️ — same domain as mv, slight discount to avoid double-count |
| Force Transfer | ft | 1.3 | ⚠️ — derived metric; weight feels high but flag for review |

---

## 3. Position groups (`POS_GROUPS` — to be added)

Multiplier/offset structure applied on top of `BENCH[tier]` to produce position-adjusted thresholds.

### 3.1 Football
| Group | Positions (canonical) | f5/f10 off | gps off | vj/bj mult | useBwPower | Status |
|---|---|---|---|---|---|---|
| skill | WR, DB, CB, S, RB | −0.05 | +0.5 | 1.05 | false | ⚠️ |
| bigSkill | LB, TE, QB, FB | 0 | 0 | 1.00 | false | ✅ — baseline |
| line | OL, OT, OG, C, DL, DT, DE, NT | +0.12 | −1.5 | 1.00 | **true** | ⚠️ |

**Rationale:**
- Skill: small + fast expected. Stricter sprint thresholds (negative offset = stricter, since lower=better). Stricter jumps (multiplier >1 raises required height). Slightly higher GPS expected.
- Big Skill: serves as the population the universal `BENCH` was calibrated for. Zero modifiers.
- Line: speed not the priority; power output is. Lenient sprint, lenient GPS, **bodyweight-relative power scoring on jumps** (see §4).

### 3.2 Basketball
| Group | Positions | f5/f10 off | gps off | vj/bj mult | useBwPower | Status |
|---|---|---|---|---|---|---|
| guard | PG, SG | −0.03 | +0.3 | 1.05 | false | ⚠️ |
| wing | SF, F | 0 | 0 | 1.00 | false | ✅ baseline |
| big | PF, C | +0.06 | −0.8 | 0.95 | **true** | ⚠️ |

### 3.3 Soccer
| Group | Positions | f5/f10 off | gps off | vj/bj mult | useBwPower | Status |
|---|---|---|---|---|---|---|
| forward | ST, W, CF | −0.03 | +0.3 | 1.00 | false | ⚠️ |
| midfielder | CM, AM, DM | 0 | 0 | 1.00 | false | ✅ baseline |
| defender | CB, FB | +0.02 | 0 | 1.00 | false | ⚠️ |
| keeper | GK | +0.10 | −2.0 | 1.05 | false | ⚠️ |

### 3.4 Combat (boxing, MMA, BJJ, kickboxing)
- All weight classes: `f5_off = +0.20` (sprint not central to combat performance), `gps_off = −2.0`, `vj/bj mult = 1.00`, `useBwPower = true`.
- APE weights override: `ac = 0.8, mv = 0.8, gv = 0.7, vp = 1.4, hp = 1.4, rs = 1.4, ft = 1.3`. ⚠️ Mike to confirm.

### 3.5 Default ("general")
- All offsets 0, mults 1.00, useBwPower false. Used when sport/position can't be resolved.

---

## 4. Bodyweight-relative power (when `useBwPower = true` AND bodyweight provided)

**Power proxy formula (jumps only):**
- Vertical: `power_vj = VJ_in × BW_lb / 100`
- Horizontal: `power_bj = BJ_ft × BW_lb / 50`

Simple multiplicative; not Sayers formula. Trades biomechanical precision for transparency.

**Power thresholds (College tier, Line group example):** ⚠️ all guesses, need validation
| Metric | Avg | Solid | Strong | Elite |
|---|---|---|---|---|
| power_vj | 60 | 75 | 90 | 100 |
| power_bj | 40 | 50 | 60 | 70 |

**Final score logic:**
```
raw_vj_score      = scv(VJ, BENCH[tier].vj, false)
adj_vj_score_thresh = scv(VJ, applyMult(BENCH[tier].vj, group.vj_mult), false)
power_vj_score    = group.useBwPower && bw ? scv(VJ × bw / 100, POWER[tier][group].vj, false) : null
adjusted_vj       = max(adj_vj_score_thresh, power_vj_score)
```

This guarantees:
- Light Skill positions (`useBwPower=false`) score on airtime alone — rule 7.
- Heavy Line positions can earn a high score via raw power even with low airtime — rule 6.
- Elite Lineman with both high airtime AND high power gets credit for both (max takes the higher).

---

## 5. Position string normalization (`POSITION_MAP` — to be added)

Free-text position field is normalized via lookup. Sample mappings (case-insensitive, trim whitespace):

```
{
  // football
  "wr": "football.skill", "wide receiver": "football.skill",
  "db": "football.skill", "cb": "football.skill", "cornerback": "football.skill",
  "s": "football.skill", "safety": "football.skill",
  "rb": "football.skill", "running back": "football.skill", "halfback": "football.skill",
  "lb": "football.bigSkill", "linebacker": "football.bigSkill",
  "te": "football.bigSkill", "tight end": "football.bigSkill",
  "qb": "football.bigSkill", "quarterback": "football.bigSkill",
  "fb": "football.bigSkill", "fullback": "football.bigSkill",
  "ol": "football.line", "offensive line": "football.line", "tackle": "football.line",
  "ot": "football.line", "og": "football.line", "guard": "football.line",  // ⚠️ "guard" collides with basketball PG
  "c": "football.line",  // ⚠️ "c" collides with basketball center
  "dl": "football.line", "defensive line": "football.line",
  "dt": "football.line", "de": "football.line", "nt": "football.line",
  // basketball — sport must be checked first to disambiguate
  "pg": "basketball.guard", "sg": "basketball.guard",
  "sf": "basketball.wing", "f": "basketball.wing",
  "pf": "basketball.big", "center": "basketball.big",
  // soccer
  "st": "soccer.forward", "striker": "soccer.forward",
  "w": "soccer.forward", "winger": "soccer.forward",
  "cm": "soccer.midfielder", "am": "soccer.midfielder", "dm": "soccer.midfielder",
  "cb": "soccer.defender",  // ⚠️ collides with football CB — sport disambiguates
  "fb": "soccer.defender",  // ⚠️ collides with football FB — sport disambiguates
  "gk": "soccer.keeper", "goalkeeper": "soccer.keeper", "goalie": "soccer.keeper"
}
```

**Disambiguation rule:** `resolvePosGroup(sport, position)` checks `sport.toLowerCase()` first, narrows the lookup namespace to that sport, then resolves position. Collisions (CB, FB, C, G) only matter across sports.

**Unmatched positions:** fall back to `<sport>.general` if it exists, else global `general`. Log unmatched positions to console so we grow the map over time.

---

## 6. Things explicitly NOT in v1 (defer to v2)

- Height-based adjustment. ⚠️ Mike asked for height to influence scoring. Position group already implicitly captures height (DBs are short, OL are tall). Direct height factor adds noise; revisit after we see real data.
- Age curves within a tier (a 12yo vs a 14yo at "Youth"). Defer.
- Training-age-adjusted RSI bands. Defer — RSI is largely innate.
- Sayers peak power formula. Defer — `VJ × BW / 100` is good enough.
- Multi-sport athletes (athlete plays 2 sports). Defer; use primary sport.
- Conditioning-specific metrics (HR recovery, lactate). Out of current scope.

---

## 7. Validation roadmap

Once the model ships, capture **real testing data** from your roster (New Athlete + your 1-on-1s) into a CSV column for each metric. After ~30 athletes per group, recompute thresholds from the actual distribution:
- Avg = 40th–60th percentile midpoint
- Solid = 60th–80th
- Strong = 80th–95th
- Elite = ≥95th

The current `BENCH` numbers are starting points; replace with empirical bands when sample size allows. Position-group offsets recalibrate the same way.

---

## 8. Change log

| Date | Change | Rationale |
|---|---|---|
| 2026-05-03 | Initial draft | Establish baseline doc to make every future scoring change traceable. |
