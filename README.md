# 2026 Korean Local Elections — Forecast (private research)

A poll + fundamentals forecast of every metropolitan mayor/governor race in the **2026-06-03** Korean local election — predicting **vote share, vote counts, win probability, 90% intervals, and scenario odds**, empirically calibrated against a 2022 backtest and self-scored after the result. Built over six versions. It also carries an LLM-persona experiment that we keep around precisely because it *failed* — an honest negative result. Internal research, kept private.

![national forecast v6](docs/national.gif)

> ⚠️ **Private / election law.** 공직선거법 제108조 bans publishing election forecasts during the blackout (2026-05-28 → 06-03 18:00). This repo is private; nothing is published until polls close.
> **Structural note:** 광주 + 전남 merged into **전남광주통합특별시** → one race (민형배 vs 이정현), so **16 광역단체장** (verify vs 선관위).

---

## Contents
1. [TL;DR](#tldr--v6-forecast) · 2. [Why two experiments](#the-two-experiments) · 3. [Version history](#version-history) · 4. [Full forecast (16)](#v6-forecast--all-16) · 5. [Seat distribution](#seat-distribution--scenarios) · 6. [Calibration (2022 backtest)](#empirical-calibration--2022-backtest) · 7. [Scoring](#predicted-share--post-election-scoring) · 8. [Methodology deep-dive](#methodology-deep-dive) · 9. [The LLM experiment](#the-llm-experiment-in-detail) · 10. [Glossary](#glossary) · 11. [What could go wrong](#what-could-still-go-wrong) · 12. [Roadmap](#roadmap-v7-ideas) · 13. [Limitations](#honest-limitations)

---

## TL;DR — v6 forecast

- **민주(여당) median 13 / 16 seats** (90% range 9–15); 국힘 holds **대구·경북**. `P(민주 ≥ 12) = 70%`, `P(민주 과반) = 96%`.
- **Tipping point: 울산** (50.4%, 민주 53%). Other tossups lean 민주: 부산·경남·충북·서울.
- **National two-party vote ≈ 민주 1,213만 (58.7%) vs 국힘 852만 (41.3%).**
- **Empirically calibrated:** the 2022 final phone polls were ~unbiased (MAE 2.2pt, σ 2.6), so method correction and σ are set from that backtest, not by hand.

## The two experiments

| | what | verdict |
|---|---|---|
| **Poll + fundamentals** (`national.mjs`) | 538-style: fundamentals ⊕ method-normalized polls → correlated Monte Carlo | **the credible model** (this README) |
| **LLM-persona electorate** (`forecast.mjs`, Seoul) | thousands of synthetic voters polled across multiple LLMs | **failed** — leaned 오세훈 while every poll had 정원오 ahead. Kept as the honest negative result |

> The headline lesson across both: **polls are the signal; the model's job is to de-bias, weight, and quantify uncertainty around them — not to invent a cleverer signal.**

## Version history

| ver | change | lesson |
|---|---|---|
| v1 | naive 3-LLM "voter" average | mode collapse → unusable |
| v2 | cap + hand-tuned −3 영남 correction | the correction was a guess |
| v3 | 538-style fundamentals (logit-swing) ⊕ polls | 2022 경기 (polls 국힘+8, 민주 won) → bias isn't one-way |
| v4 | poll-backed every competitive region | 울산/강원 flipped 민주 once polled |
| v5 | method (ARS/phone) normalization · house-effect · shrinkage · clustered correlated errors · multiparty · share + counts | ARS vs phone swings a race 10–20pt — the biggest hidden bias |
| **v6** | **2022 backtest calibration · scenario odds · 90% intervals · sensitivity · upset-risk · decisive-vote margins** | **the 2022 phone polls were ~unbiased (MAE 2.2)** → anchor method/σ on data; ARS understates 민주 |

## v6 forecast — all 16

예측D = 예측 민주 양자 득표율 · 90%구간 = 양자 득표율 구간 · 득표수 = 만 표 · 확률 = 민주 승리확률. 정렬 = 확률순.

| 지역 | 매치업 | 예측D | 90%구간 | 민주(만) | 국힘(만) | 표차 | 확률 | 당선 |
|---|---|--:|:--:|--:|--:|--:|--:|:--:|
| 전남광주 | 민형배 vs 이정현 | 89.8% | 82~97 | 120 | 14 | +106 | 98% | 🔵 |
| 전북 | 이원택 vs 김관영(무) | 87.8% | 80~95 | 62 | 9 | +54 | 98% | 🔵 |
| 제주 | 위성곤 vs 문성유 | 71.0% | 64~78 | 19 | 8 | +11 | 98% | 🔵 |
| 경기 | 추미애 vs 양향자 | 62.7% | 52~73 | 331 | 197 | +134 | 98% | 🔵 |
| 대전 | 허태정 vs 이장우 | 57.6% | 50~65 | 33 | 24 | +9 | 95% | 🔵 |
| 인천 | 박찬대 vs 유정복 | 57.5% | 50~65 | 69 | 51 | +18 | 95% | 🔵 |
| 세종 | 우상호 vs 김진태 | 56.7% | 49~64 | 8 | 6 | +2 | 93% | 🔵 |
| 강원 | 민주 vs 김진태 | 56.3% | 49~64 | 35 | 27 | +8 | 92% | 🔵 |
| 충남 | 박수현 vs 김태흠 | 58.7% | 46~71 | 49 | 35 | +15 | 87% | 🔵 |
| 서울 | 정원오 vs 오세훈 | 54.1% | 44~64 | 210 | 178 | +31 | 75% | 🔵 |
| 충북 | 신용한 vs 김영환 | 52.6% | 45~60 | 33 | 30 | +3 | 72% | 🔵 |
| 부산 | 전재수 vs 박형준 | 53.0% | 44~62 | 73 | 65 | +8 | 71% | 🔵 |
| 경남 | 김경수 vs 박완수 | 53.0% | 42~64 | 69 | 62 | +8 | 67% | 🔵 |
| 울산 | 김상욱 vs 김두겸 | 50.4% | 43~58 | 22 | 22 | +0 | 53% | 🔵 |
| 대구 | 김부겸 vs 추경호 | 47.4% | 36~59 | 45 | 50 | −5 | 35% | 🔴 |
| 경북 | 오중기 vs 국힘 | 30.3% | 23~38 | 32 | 73 | −41 | 2% | 🔴 |

### 클러스터 요약 (상관 군집)

| 클러스터 | 지역 | 종합 |
|---|---|---|
| 수도권 | 서울·인천·경기 | 민주 강세 (경기 압도) |
| 충청 | 대전·세종·충북·충남 | 민주 우세, 충북·충남 경합 |
| 영남 | 부산·울산·경남 | **민주 약우세로 이동** (역사적 보수 텃밭) |
| 대경 | 대구·경북 | 국힘 (대구는 김부겸으로 경합화) |
| 호남 | 전남광주·전북 | 민주 압도 |
| 강원/제주 | 강원·제주 | 민주 우세 |

## Seat distribution · scenarios

![seat distribution](docs/seats.gif)

| | |
|---|---|
| 의석 중앙값 | **13 / 16** (90% 9~15) |
| P(민주 ≥ 12) | 70% |
| P(민주 ≥ 10) | 92% |
| P(민주 과반, ≥9) | 96% |
| P(국힘 ≥ 5) | 30% |
| P(경합 5곳 싹쓸이) | 25% |
| 결정표 (경합 뒤집는 표) | 울산 0.2만 · 대구 2.5만 |
| 업셋 리스크 (비경합 약한순) | 경남 67% · 부산 71% · 충북 72% |
| 민감도 (민주 우세 수) | 기준 14 · 방식보정無 14 · 스윙± 13~14 |

## Empirical calibration — 2022 backtest

![2022 backtest](docs/backtest.gif)

The 2022 **final phone polls** (지상파 3사, 5/23–25) vs the actual 2022 result, 5 regions:

| | bias | MAE | σ | 당선적중 | Brier |
|---|--:|--:|--:|--:|--:|
| 2022 phone polls | **−0.1pt** | **2.2pt** | 2.6 | 4/5 | 0.137 |

Phone polls were essentially **unbiased**; the one miss (대전: polls D-lead → 국힘 won by ~4pt) sizes the tail. So v6 sets **σ_local ≈ 2.8** and treats phone as the accurate anchor, **pulling ARS up toward phone (+5pt 민주 two-way)** instead of guessing. ⚠️ If a *2026* shy-conservative effect is bigger than 2022's, phone overstates 민주 — that risk lives in the D-lean tossups.

## Predicted share + post-election scoring

The model commits a predicted two-way share + win prob for every region (`forecast-national.json`). After polls close, fill `data/results-2026-actual.json` and `node score.mjs` grades it: **vote-share MAE, winner accuracy (X/16), Brier** (0.25 = no-skill). That number is the model's honest report card — and the real test of whether it clears ~90% winner accuracy.

## Methodology deep-dive

1. **Fundamentals (structural lean).** Each region's 2022 two-way 민주 share `f` is swung to the 2026 environment on the **logit scale**: `fund = invlogit(logit(f) + 0.32)` (≈ +8pt at a 50/50 region, less at the extremes — so 호남/경북 barely move while swing regions move most).
2. **Method normalization.** Each poll is tagged phone / ARS / mix. ARS systematically shows tighter races (샤이보수 / high-engagement respondents); phone shows bigger 여당 leads and — per the 2022 backtest — was the *accurate* one. So polls are normalized toward the phone basis (`ARS +5`, `mix +2`, `phone 0` two-way 민주).
3. **Multi-poll aggregation.** A region's polls are averaged after normalization; their raw spread is recorded as a method/house-disagreement signal.
4. **Hierarchical shrinkage.** Poll weight scales with poll count: `0.75` (≥2 polls), `0.58` (1 poll), `0` (none → fundamentals only). Strongholds with no polls ride fundamentals.
5. **Clustered correlated Monte Carlo (50k).** Each draw adds a shared **national** error, a per-**cluster** error (수도권/충청/영남/대경/호남/강원/제주), and a **local** error: `σ² = σ_nat² + σ_clu² + σ_loc²` with `σ_nat=σ_clu=2.5`, `σ_loc=2.8` (+ inflation where polls disagree, e.g. 충남 ±16). Clustering means a regional miss moves a whole bloc together — giving realistic seat-distribution tails instead of falsely tight ones.
6. **Vote counts.** `예측득표율 × (선거인수 × 투표율 0.52 × 양당 0.90)`.
7. **Multiparty flags.** 울산 (진보 김종훈 splits the anti-PPP vote), 전북 (민주 vs 무소속 김관영, not 국힘).

## The LLM experiment in detail

`forecast.mjs` builds a detailed synthetic Seoul electorate (district × age × gender × housing × occupation × income), asks each persona — across **claude-haiku, claude-sonnet, gpt-4o-mini** — for a vote + turnout, poststratifies, calibrates each model against a 2022 backtest, and blends with polls. The result:

- claude-haiku said 오세훈 ~100%, claude-sonnet ~73%, gpt-4o-mini ~65% 정원오 — **wild disagreement**.
- Even calibrated, the ensemble leaned 오세훈, while **every real poll had 정원오 +4 to +13**.
- Conclusion: the models carry an incumbent/conservative prior that contradicts the actual 2026 dynamics. **The LLM electorate adds noise and bias, not information beyond polls.** It is kept as a documented negative result, not used in the headline forecast.

## Glossary

- **양자(two-way)** — 민주 vs 국힘 share excluding others (`D/(D+P)`); 50% = tie.
- **예측D / finalD** — blended predicted two-way 민주 share (headline metric).
- **펀더멘털(fundamentals)** — structural lean from 2022, before polls.
- **스윙(swing)** — the 2022→2026 shift applied on the logit scale.
- **방식보정(method correction)** — ARS↔phone house-effect normalization.
- **클러스터(cluster)** — region group whose polling errors are correlated.
- **dwin** — Monte-Carlo probability 민주 wins the region.
- **Brier** — mean squared error of probabilities (0 perfect, 0.25 = no-skill coin-flip).

## What could still go wrong

- **Shy-conservative > 2022** → phone overstates 민주 → 부산·경남·서울·충북 (all D 51–54%) flip together; 민주 falls toward the 9-seat floor.
- **Turnout surge / 단일화** in 울산 (진보 김종훈) → splits or consolidates the anti-PPP vote.
- **전북** 무소속 김관영 beating the 민주 candidate (still non-국힘, so the D-vs-P seat call holds).
- **Correlated national miss** — the single biggest tail risk; that's why the cluster + national error terms exist.

## Roadmap (v7 ideas)

- **Ensemble with prediction markets / 오마이뉴스×STI** (markets beat models in 2024; hook is stubbed, needs their numbers).
- **Pollster-level house effects** (not just method) + LV/RV adjustment.
- **Turnout model** by region/age (currently flat 52%).
- **MRP** for sub-regional + cross-checking polls.
- **Final-week re-run** as fresh polls land (accuracy rises near election day).

## Run

```bash
node national.mjs       # forecast + analytics -> forecast-national.json, forecast-meta.json
node dist.mjs           # seat-distribution histogram + scenarios + vote bar
node backtest-2022.mjs  # calibration: 2022 phone polls vs actual
node score.mjs          # after 06-03: grade vs data/results-2026-actual.json
vhs docs/*.tape         # regenerate the GIFs
# Seoul LLM experiment: ANTHROPIC_API_KEY=.. OPENAI_API_KEY=.. node personas.mjs 800 && node forecast.mjs ...
```

## Files

- **National model:** `national.mjs` · `dist.mjs` · `data/national-2026.json` (16 regions, polls[]+method, clusters) · `data/results-2022.json` (fundamentals) · `data/voters-2026.json` · `forecast-national.json` / `forecast-meta.json` (output)
- **Calibration / scoring:** `backtest-2022.mjs` · `data/polls-2022-final.json` · `score.mjs` · `data/results-2026-actual.json` (fill after 06-03)
- **LLM experiment:** `forecast.mjs` · `personas.mjs` · `calibration.json` · `data/seoul-demographics.json` · `data/polls-2026.json`
- **Misc:** `seal.mjs` (unused) · `docs/*.tape` + `docs/*.gif` · `prediction*.json` git-ignored

## Honest limitations

- **No model guarantees ≥90%.** Winner accuracy ~90% (14–15/16) is plausible *because the data leans clearly*, not by cleverness; 2–3 genuine tossups are irreducible coin-flips, and a correlated polling miss can flip them together.
- **Phone-anchor risk** (above) — the D-lean tossups are the fragile calls.
- **충남** widest uncertainty (±16 method spread). **울산** hinges on 단일화; **전북** is vs 무소속.
- Fundamentals, swing, σ, eligible-voter/turnout numbers are estimates/approximate — verify vs 선관위/NESDC. Knowledge cutoff Jan 2026; facts via web.

## Validation

The real test is **2026-06-03**: fill the actuals, run `score.mjs`, read the MAE / winner accuracy / Brier. That is the model's honest report card.
