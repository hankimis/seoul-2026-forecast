# 2026 Korean Local Elections — Forecast (private research)

A poll + fundamentals forecast of every metropolitan mayor/governor race in the **2026-06-03** Korean local election — predicted **vote share, vote counts, win probability, 90% intervals, scenario odds**, all empirically calibrated against a 2022 backtest and self-scored after the result. Built over six versions; also includes an LLM-persona experiment that taught us what *not* to do. Internal research, kept private.

![national forecast v6](docs/national.gif)

> ⚠️ **Private / election law.** 공직선거법 제108조 bans publishing election forecasts during the blackout (2026-05-28 → 06-03 18:00). Private repo, nothing published until polls close.
> **Note:** 광주 + 전남 merged into **전남광주통합특별시** → one race (민형배 vs 이정현); **16 광역단체장** (verify vs 선관위).

## TL;DR — v6 forecast

- **민주(여당) median 13 / 16 seats** (90% range 9–15); 국힘 holds **대구·경북**. `P(민주 ≥ 12) = 70%`.
- **Tipping point: 울산** (50.4%, 민주 53%). Other tossups lean 민주: 부산·경남·충북·서울.
- **Empirically calibrated**: the 2022 final phone polls were ~unbiased (MAE 2.2pt, σ 2.6) — so method correction and σ are set from that backtest, not by hand.
- 538-style: fundamentals (2022 result, logit-swung) ⊕ method-normalized poll aggregate → clustered correlated Monte Carlo.

## The two experiments

- **Poll + fundamentals model (`national.mjs`)** — the credible one (this README).
- **LLM-persona electorate (`forecast.mjs`, Seoul)** — even calibrated, the LLM leaned 오세훈 while every poll had 정원오 ahead. *Does the LLM beat polls? No — it adds noise/bias.* Kept as the honest negative result.

### Version history

| ver | change | lesson |
|---|---|---|
| v1 | naive 3-LLM "voter" average | mode collapse → unusable |
| v2 | cap + hand-tuned −3 영남 correction | the correction was a guess |
| v3 | 538-style fundamentals (logit-swing) ⊕ polls | 2022 경기 (polls 국힘+8, 민주 won) → bias isn't one-way |
| v4 | poll-backed every competitive region | 울산/강원 flipped 민주 once polled |
| v5 | method (ARS/phone) normalization · house-effect · shrinkage · clustered correlated errors · multiparty · predicted share + counts | ARS vs phone swings a race 10–20pt — the biggest hidden bias |
| **v6** | **2022 backtest calibration · scenario odds · 90% intervals · sensitivity · upset-risk · decisive-vote margins** | **the 2022 phone polls were ~unbiased (MAE 2.2)** → anchor method/σ on data; ARS understates 민주, pull it toward phone |

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

| 종합 | |
|---|---|
| 예상 민주 의석 | **중앙값 13 / 16** (90% 9~15) |
| 시나리오 | P(민주≥12)=**70%** · P(민주≥10)=91% · P(국힘≥5)=30% · P(경합5 싹쓸이)=25% |
| 티핑포인트 | **울산** (50.4%, 민주 53%) |
| 결정표(경합 뒤집는 표) | 울산 0.2만 · 대구 2.5만 |
| 업셋 리스크(비경합 중 약한순) | 경남 67% · 부산 71% · 충북 72% |
| 전국 양당 득표 | 민주 ≈ **1,213만** vs 국힘 ≈ **852만** |
| 민감도(민주 우세 수) | 기준 14 · 방식보정無 14 · 스윙± 13~14 |

## Empirical calibration — 2022 backtest (`backtest-2022.mjs`)

The 2022 **final phone polls** (지상파 3사 5/23–25) vs the actual 2022 result, across 5 regions:

| | bias | MAE | σ | 당선적중 | Brier |
|---|--:|--:|--:|--:|--:|
| 2022 phone polls | **−0.1pt** | **2.2pt** | 2.6 | 4/5 | 0.137 |

→ phone polls were essentially **unbiased**; the one miss (대전, polls D-lead → 국힘 won by ~4pt) sizes the tail. v6 therefore sets **σ_local ≈ 2.8** and treats phone as the accurate anchor, **pulling ARS up toward phone (+5pt 민주 two-way)** rather than guessing. ⚠️ Caveat: a *2026* shy-conservative effect larger than 2022's would mean phone overstates 민주 — that risk lives in the D-lean tossups (부산·경남·서울).

## Predicted share + post-election scoring (`score.mjs`)

The model commits a predicted two-way share + win prob for every region (`forecast-national.json`). After polls close, fill `data/results-2026-actual.json` and `node score.mjs` grades it: **vote-share MAE, winner accuracy (X/16), Brier** (0.25 = no-skill). That number is the model's honest report card — and the real test of whether it clears ~90% winner accuracy.

## Method (`national.mjs`, v6)

Method (ARS/phone) normalization → multi-poll house-effect aggregation → hierarchical shrinkage (poll-count-weighted vs fundamentals) → fundamentals = 2022 two-way logit-swung to 2026 → clustered correlated Monte Carlo (수도권/충청/영남/대경/호남/강원/제주) with σ inflated where polls disagree (충남 ±16). Multiparty flags: 울산(진보 김종훈 split), 전북(민주 vs 무소속 김관영). All knobs (method ±, σ, swing) are calibrated to the 2022 backtest.

## Run

```bash
node national.mjs       # forecast + analytics -> forecast-national.json
node backtest-2022.mjs  # calibration: 2022 phone polls vs actual
node score.mjs          # after 06-03: grade vs data/results-2026-actual.json
# Seoul LLM experiment: ANTHROPIC_API_KEY=.. OPENAI_API_KEY=.. node personas.mjs 800 && node forecast.mjs ...
vhs docs/demo.tape      # regenerate docs/national.gif
```

## Files

- `national.mjs` · `data/national-2026.json` (16 regions, polls[]+method, clusters) · `data/results-2022.json` (fundamentals) · `data/voters-2026.json` (선거인수) · `forecast-national.json` (output)
- `backtest-2022.mjs` · `data/polls-2022-final.json` (2022 final polls) · `score.mjs` · `data/results-2026-actual.json` (fill after 06-03)
- `forecast.mjs` · `personas.mjs` · `calibration.json` · `data/seoul-demographics.json` · `data/polls-2026.json` · `seal.mjs` (unused) · `prediction*.json` git-ignored

## Honest limitations

- **No model guarantees ≥90%.** Winner accuracy ~90% (14–15/16) is plausible *because the data leans clearly*, not by cleverness; the 2–3 genuine tossups are irreducible coin-flips, and a correlated polling miss can flip them together (the 9-seat floor of the 90% range).
- **Phone-anchor risk:** calibration says trust phone (2022), but if 2026's shy-conservative effect is bigger, phone overstates 민주 → the D-lean tossups (부산·경남·서울) are the fragile calls.
- **충남** widest uncertainty (±16 method spread). **울산** hinges on 진보 단일화; **전북** is vs 무소속.
- Fundamentals, swing, σ, eligible-voter/turnout numbers are estimates/approximate; verify vs 선관위/NESDC. Knowledge cutoff Jan 2026.

## Validation

The real test is **2026-06-03**: fill the actuals, run `score.mjs`, read the MAE / winner accuracy / Brier. That is the model's honest report card.
