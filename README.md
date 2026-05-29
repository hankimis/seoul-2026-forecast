# 2026 Korean Local Elections — Forecast (private research)

A poll + fundamentals forecast of every metropolitan mayor/governor race in the **2026-06-03** Korean local election, with **predicted vote share, win probability, and a post-election scorer**. Built up over five versions; also includes an LLM-persona experiment that taught us what *not* to do. Internal research, kept private.

![national forecast v5](docs/national.gif)

> ⚠️ **Private / election law.** 공직선거법 제108조 bans publishing election forecasts during the blackout (2026-05-28 → 06-03 18:00). Private repo, nothing published until polls close.
> **Note:** 광주 + 전남 merged into **전남광주통합특별시** → one race (민형배 vs 이정현), so **16 광역단체장** (verify vs 선관위).

## TL;DR — v5 forecast

- **민주(여당) median 11 / 16 seats** (90% range 7–14). 국힘 holds only **대구·경북**, leads **울산**.
- **Tipping point: 부산** (predicted 50.8% two-way, 민주 55%). Tossups: 서울·충북·경남·부산·울산 — all 51–52% D.
- **충남** carries the widest uncertainty (±16 method spread: phone 박수현 +21 vs ARS dead heat).
- 538-style: each region's predicted share = its 2022 fundamentals (logit-swung to 2026) blended with a **method-normalized, house-effect-adjusted poll aggregate**, then a **clustered correlated Monte Carlo** for win probabilities.

## The two experiments

- **Poll + fundamentals model (`national.mjs`)** — the credible one (this README).
- **LLM-persona electorate (`forecast.mjs`, Seoul)** — even calibrated, the LLM sim leaned 오세훈 while every real poll had 정원오 ahead. *Does the LLM beat polls? No — it adds noise/bias.* Kept as the honest negative result.

### Version history

| ver | change | lesson |
|---|---|---|
| v1 | naive average of 3 LLM "voters" | mode collapse, rate-limit imbalance → unusable |
| v2 | cap + hand-tuned −3 영남 correction | the correction was a guess |
| v3 | **538-style fundamentals (2022 logit-swing) ⊕ polls** | 2022 경기 (polls 국힘+8, 민주 won) → poll bias isn't one-directional; regularize with fundamentals, not a nudge |
| v4 | poll-backed every competitive region | 울산/강원 flipped 민주 once polled |
| **v5** | **method (ARS/phone) normalization · multi-poll house-effect · hierarchical shrinkage · clustered correlated errors · multiparty · predicted share + scorer** | **ARS vs phone swings a race 10–20pt** (경남 phone +10 vs ARS +0.3) — the single biggest hidden bias; normalize it and widen σ where polls disagree |

## v5 forecast — all 16 (정리표)

지역당 한 줄: 예측 민주 득표율 · 예상 득표수(만) · 표차 · 민주 승리확률 · 당선. 정렬 = 승리확률순. (모델 내부값 `펀더D`/`폴D*`는 GIF·`forecast-national.json` 참조.)

| 지역 | 매치업 | 예측 민주% | 민주(만) | 국힘(만) | 표차(만) | 승리확률 | 당선 |
|---|---|--:|--:|--:|--:|--:|:--:|
| 전남광주 | 민형배 vs 이정현 | 89.8% | 120 | 14 | +106 | 98% | 🔵 민주 |
| 전북 | 이원택 vs 김관영(무소속) | 87.8% | 62 | 9 | +54 | 98% | 🔵 민주 |
| 제주 | 위성곤 vs 문성유 | 69.3% | 18 | 8 | +10 | 98% | 🔵 민주 |
| 경기 | 추미애 vs 양향자 | 60.4% | 319 | 209 | +110 | 94% | 🔵 민주 |
| 대전 | 허태정 vs 이장우 | 55.8% | 32 | 25 | +7 | 89% | 🔵 민주 |
| 인천 | 박찬대 vs 유정복 | 55.7% | 66 | 53 | +14 | 88% | 🔵 민주 |
| 강원 | 민주 vs 김진태 | 55.2% | 34 | 28 | +6 | 86% | 🔵 민주 |
| 세종 | 우상호 vs 김진태 | 54.9% | 8 | 7 | +1 | 85% | 🔵 민주 |
| 충남 | 박수현 vs 김태흠 | 56.8% | 48 | 36 | +11 | 80% | 🔵 민주 |
| 서울 | 정원오 vs 오세훈 | 52.1% | 202 | 186 | +16 | 63% | 🔵 민주 |
| 충북 | 신용한 vs 김영환 | 51.4% | 32 | 31 | **+2** | 62% | 🔵 민주 |
| 경남 | 김경수 vs 박완수 | 51.1% | 67 | 64 | **+3** | 56% | 🔵 민주 |
| 부산 | 전재수 vs 박형준 | 50.8% | 70 | 68 | **+2** | 55% | 🔵 민주 |
| 울산 | 김상욱 vs 김두겸 | 48.6% | 22 | 23 | **−1** | 39% | 🔴 국힘 |
| 대구 | 김부겸 vs 추경호 | 45.5% | 44 | 52 | −9 | 27% | 🔴 국힘 |
| 경북 | 오중기 vs 국힘 | 30.3% | 32 | 73 | −41 | 2% | 🔴 국힘 |

| 종합 | |
|---|---|
| 예상 민주 의석 | **중앙값 11 / 16** (90% 범위 7~14) |
| 우세 카운트 | 민주 13 · 국힘 3 (울산·대구·경북) |
| 티핑포인트 | **부산** (50.8%, 민주 55%) |
| 초경합(표차 ≤3만) | 부산 +2 · 경남 +3 · 충북 +2 · 울산 −1 |
| 최대 불확실 | 충남 (방식차 ±16: 전화 +21 vs ARS 접전) |
| 전국 양당 득표 | 민주 ≈ **1,178만** vs 국힘 ≈ **886만** |

## Predicted share + post-election scoring (`score.mjs`)

The model commits a **predicted two-way 민주 vote share** for every region (the `예측득표` column, also dumped to `forecast-national.json`). After polls close, fill `data/results-2026-actual.json` and run `node score.mjs` to grade it:

- **vote-share MAE** (how many points off, per region),
- **winner accuracy** (X / 16),
- **Brier score** (probability calibration; 0.25 = no-skill baseline).

This turns the forecast into a falsifiable, self-scoring claim — the real demonstration of the model's skill.

## Method (`national.mjs`, v5)

1. **Method normalization** — each poll tagged phone / ARS; ARS shows tighter (샤이보수), phone shows bigger 여당 leads. Normalize toward neutral (phone −3, ARS +3 two-way; gap estimated from 경남's dual-method polls).
2. **Multi-poll aggregation + house effect** — average method-normalized two-way across a region's polls; track the spread.
3. **Hierarchical shrinkage** — poll weight scales with poll count (0.75 if ≥2, 0.58 if 1, else fundamentals-only). Strongholds (호남·경북) ride fundamentals.
4. **Fundamentals** — 2022 two-way 민주 swung to 2026 on the logit scale (strongholds move less).
5. **Clustered correlated Monte Carlo** — shared national + per-cluster (수도권/충청/영남/대경/호남/강원/제주) + local errors; σ inflated where polls disagree (충남 ±16 → wider).
6. **Multiparty flags** — 울산 (진보 김종훈 split) and 전북 (민주 vs 무소속 김관영, not 국힘).

## Run

```bash
node national.mjs    # poll+fundamentals forecast (no API cost) -> prints table, writes forecast-national.json
node score.mjs       # after 06-03: grade vs data/results-2026-actual.json (MAE / winner / Brier)
# Seoul LLM experiment: ANTHROPIC_API_KEY=.. OPENAI_API_KEY=.. node personas.mjs 800 && node forecast.mjs ...
vhs docs/demo.tape   # regenerate docs/national.gif
```

## Files

- `national.mjs` · `data/national-2026.json` (16 regions, polls[]+method, clusters) · `data/results-2022.json` (fundamentals) · `data/voters-2026.json` (선거인수/투표율) · `forecast-national.json` (output)
- `score.mjs` · `data/results-2026-actual.json` (fill after 06-03)
- `forecast.mjs` · `personas.mjs` · `calibration.json` · `data/seoul-demographics.json` · `data/polls-2026.json`
- `seal.mjs` (unused); `prediction*.json` git-ignored.

## Honest limitations

- **Method spread is the dominant uncertainty** — 충남 phone (+21) vs ARS (dead heat) differ by 16pt two-way; the experts themselves disagree which is "truer". Where polls split, the model widens σ rather than pretending precision.
- **광주+전남 merger** into 전남광주통합특별시 needs confirmation against 선관위 (treated as one 호남 race here).
- **울산** hinges on 진보(김종훈) 단일화; **전북** is 민주 vs 무소속, not vs 국힘.
- Method gap (±3), swing (+8pt), shrinkage weights, σ are **estimates**; 2022 fundamentals and several 2026 polls are approximate (verify vs 선관위/NESDC). Knowledge cutoff Jan 2026; facts via web.
- The five tossups all sit at D 50–52% — one systematic polling miss flips them together (the 7-seat floor of the 90% range).

## Validation

The real test is **2026-06-03**: fill the actuals, run `score.mjs`, and see the vote-share MAE / winner accuracy / Brier. That number is the model's honest report card.
