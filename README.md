# Seoul 2026 — LLM Persona Electorate Forecast (sealed)

Can an LLM-simulated electorate forecast a real election? This is a **pre-registered, sealed** forecast of the **2026 Seoul mayoral election (2026-06-03)** using a synthetic electorate of demographically grounded voter personas, scored against the actual result after polls close.

> ⚠️ **Korean election law (공직선거법 제108조).** From **6 days before the election (2026-05-28) until polls close (06-03 18:00)**, publishing any poll or simulation that predicts a winner — explicitly including "모의투표/인기투표" — is **illegal** (criminal penalty). Therefore: **no prediction is published during the blackout.** We publish only a SHA-256 **commitment hash** (which reveals nothing) and the methodology, then **reveal the forecast after 18:00 on 06-03**. This repo stays **private** until reveal; `prediction*.json` is git-ignored so a forecast can never be pushed by accident.

## Design

One mechanism, two phases:

- **Phase A — backtest (legal anytime).** Run the exact pipeline on past Korean elections with known results (2022 Seoul mayor, 2024 Seoul districts) to validate and calibrate. Caveat: models may have memorized past results, so this tests the pipeline + bias, not clean prediction.
- **Phase B — live sealed forecast.** Generate the 2026 forecast privately, seal its hash before 06-03, reveal and compare after polls close. This is the uncontaminated test (no model can know the outcome).

## Ethics & guardrails

- Personas are **demographic composites from public distributions**, never impersonations of identifiable real people; we do not deepfake or simulate named individuals (including the candidates).
- **No voter-facing output, no targeting, no campaigning.** Pure post-hoc forecast.
- Calibration uses only polls published **on or before 2025-05-27** (pre-blackout).
- Everything (data, prompts, code) is reproducible and disclosed after reveal.

## Method

1. `personas.mjs` builds a stratified synthetic electorate from `data/seoul-demographics.json` (age × gender shares; districts to be added from official data).
2. `forecast.mjs` asks each persona, across multiple LLMs, for a vote + turnout likelihood, then aggregates a **turnout-weighted vote share** and a cross-model comparison (to expose the known LLM partisan bias).
3. `seal.mjs` hashes the prediction into a public commitment; the prediction itself stays private until reveal.

## Run

```bash
node personas.mjs 800                 # build the electorate
# backtest (known result; leakage caveat applies):
OPENAI_API_KEY=.. FAL_API_KEY=.. node forecast.mjs --candidates data/elections/2022-seoul-mayor.json --year 2022 --backtest
# live (after filling data/candidates-2026.json from the official NEC registration):
OPENAI_API_KEY=.. FAL_API_KEY=.. node forecast.mjs --candidates data/candidates-2026.json --year 2026
node seal.mjs seal prediction.json    # publish SEALED.txt's hash; keep prediction.json private until 06-03 18:00
```

## Honest limits

- A single election is **n=1**, a case study, not proof. Phase A backtests are the methodological core.
- LLM **partisan bias** is well documented; raw and calibrated numbers are both reported.
- **Turnout modeling** is the largest error source.
- Demographic and result data in `data/` are **approximate placeholders** until replaced with official KOSIS / 선관위 figures.

## Status

Pipeline, sealing tool, and protocol are in place. Live forecast is generated and sealed before 06-03; revealed and scored after. Part of IOV LABS research, methodology only is public-safe; the live forecast is withheld per the blackout.
