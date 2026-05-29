# 2026 Korean Local Elections — Forecast (private research)

Forecasting all 17 metropolitan mayor/governor races of the **2026-06-03** Korean local election, two ways: a poll + fundamentals model (the one that works) and an LLM-persona electorate simulation (the experiment that taught us what *doesn't*). Internal research, kept private.

![national forecast v4](docs/national.gif)

> ⚠️ **Private / election law.** Korea's 공직선거법 제108조 bans publishing any election forecast during the blackout (2026-05-28 → 06-03 18:00). This repo stays private; nothing here is published until after polls close.

## TL;DR — national v4 forecast

- **민주(여당) median 13 / 17 seats** (90% range 8–16); **국힘** safe only in **대구·경북**.
- Everything else leans 민주, but **five tossups sit at D 51–52% two-way**: 충북·경남·부산·충남·울산.
- **Tipping point: 울산** (final 50.9%, D 57%). A ~3pt systematic poll miss toward 국힘 flips the whole tossup cluster → seats fall to ~8.
- Big picture: a ruling-party (민주, post-2025 presidential win) wave; even 부산·경남 lean 민주 on the polls.

## Two experiments, and what we learned

**A. Poll + fundamentals model (`national.mjs`) — the credible one.**
538-style: each region's **fundamentals** = its 2022 two-way 민주 share swung to the 2026 environment **on the logit scale** (so strongholds move less), **blended 0.7 / 0.3 with the poll aggregate**, then a **correlated-national-swing Monte Carlo** (50k draws) for win probabilities, capped 3–97%.

**B. LLM-persona electorate (`forecast.mjs`, Seoul only) — the cautionary tale.**
A detailed synthetic electorate (district × age × gender × housing × job × income) is asked, across multiple LLMs, for vote + turnout; poststratified, calibrated against a 2022 backtest, blended with polls. **Finding: even calibrated, the LLM sim leaned 오세훈 while every real poll had 정원오 ahead.** The models carry an incumbent/conservative prior that contradicts reality. *Does the LLM add information beyond polls? Here, no — it adds noise and bias.* That negative result is the honest contribution.

### Version history (how the model earned trust)

| ver | change | lesson |
|---|---|---|
| v1 | naive average of 3 LLMs | mode collapse (haiku 100%), rate-limit n-imbalance → unusable |
| v2 | cap + hand-tuned −3 영남 correction + correlated swing | better, but the correction was a guess |
| v3 | **538-style fundamentals (2022 logit-swing) ⊕ polls**; dropped the hand-tuned correction | 2022 경기 (polls had 국힘 +8, 민주 won) proved poll bias is **not one-directional** → regularize with fundamentals + wide σ, not a one-way nudge |
| v4 | **poll-backed every competitive region** (강원·울산·제주 added) | only 호남3 + 경북 remain fundamentals-only (lopsided, accurate). 울산 flipped to 민주-lean once its poll was in |

## National v4 — all 17

민주(파랑) median 13, 국힘(빨강) 대구·경북. 경합(노랑): 충북·경남·부산·충남·울산. See the GIF for the live table; values in `data/national-2026.json` (+ `node national.mjs`).

Safe 민주: 광주·전남·전북·제주·경기·인천·대전·세종·강원 · Lean 민주: 서울 · Tossup-민주: 충북·경남·부산·충남·울산 · 국힘: 대구·경북.

## Run

```bash
node national.mjs            # national poll+fundamentals model (no API cost)

# Seoul LLM-persona experiment (needs keys; costs a few $):
ANTHROPIC_API_KEY=.. OPENAI_API_KEY=.. node personas.mjs 800
ANTHROPIC_API_KEY=.. OPENAI_API_KEY=.. node forecast.mjs --candidates data/candidates-2026.json --year 2026 --polls data/polls-2026.json
# calibrate first on 2022:  node forecast.mjs --candidates data/elections/2022-seoul-mayor.json --year 2022 --backtest --actualA 59.05
docs/demo.tape               # vhs docs/demo.tape -> docs/national.gif
```

## Files

- `national.mjs` · `data/national-2026.json` (17 regions, polls/tier) · `data/results-2022.json` (fundamentals) · `data/polls-2026.json` (Seoul 5-poll aggregate)
- `forecast.mjs` · `personas.mjs` · `data/seoul-demographics.json` · `calibration.json` (2022 model weights)
- `seal.mjs` (sealed pre-registration tool — unused now that we publish nothing)
- `prediction*.json` are git-ignored.

## Honest limitations

- **The five tossups are all D 51–52%** — within one normal polling miss of flipping together. The 90% seat range (8–16) reflects this; don't read the median 13 as safe.
- **Fundamentals, swing (+8pt), blend (0.7), σ (3.5+3.5) are estimates**; 2022 region results and some 2026 polls are approximate (verify vs 선관위/NESDC).
- **울산** hinges on the 진보(김종훈) 단일화/분열; **전북** is 민주 vs 무소속(김관영), not vs 국힘; non-Seoul regions mostly use a single poll, not an aggregate.
- Korea facts gathered via web (model knowledge cutoff Jan 2026).
- The LLM-persona pipeline is kept for the methodological comparison; it is **not** the basis of the headline forecast.

## Validation

The real test is the **2026-06-03 result**: score v1–v4 and poll-only against all 17 to confirm which method (and which σ/swing/blend) was right.
