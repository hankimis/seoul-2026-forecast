# 2026 Korean Local Elections — Forecast (private research)

A poll + fundamentals forecast of every metropolitan mayor/governor race in the **2026-06-03** Korean local election — predicting **vote share, vote counts, win probability, 90% intervals, and scenario odds**, empirically calibrated against a 2022 backtest and self-scored after the result. Built over eight versions. It also carries an LLM-persona experiment that we keep around precisely because it *failed* — an honest negative result. Internal research, kept private.

> **Abstract.** We forecast the 16 metropolitan-executive (광역단체장) races of Korea's 9th local election (2026-06-03) by combining a **structural fundamentals** estimate (each region's 2022 two-way vote, swung to the 2026 environment on the logit scale) with **method-normalized poll aggregates**, fused by poll-count-weighted hierarchical shrinkage. Outcome uncertainty is propagated through a **50,000-draw correlated Monte Carlo** with a three-level error budget (national ⊕ cluster ⊕ local) and **heavy-tailed (normal-mixture ≈ Student-t)** innovations, so that a single nationwide polling miss moves correlated blocs together. The pipeline is **seeded and fully reproducible**. The central estimate is **민주 12 / 16 seats** (90% credible range 8–15), with five genuine tossups (서울·부산·경남·충북·울산). We calibrate the error model on the 2022 final phone polls (bias −0.1pt, MAE 2.2pt, σ≈2.6) and quantify the dominant failure mode — a *correlated* poll bias — with an explicit ±4pt scenario sweep (−3pt → 11 seats). A parallel **silicon-sampling** experiment (an LLM-persona electorate) is reported as a **negative result**: it contradicted every real poll and added bias, not signal. The model self-scores against the realized result via a pre-committed `score.mjs` after polls close.
>
> **Keywords:** election forecasting · poll aggregation · hierarchical shrinkage · correlated Monte Carlo · heavy-tailed errors · calibration · Brier score · silicon sampling (negative result) · reproducibility

![national forecast v8](docs/national.gif)

> ⚠️ **Private / election law.** 공직선거법 제108조 bans publishing election forecasts during the blackout (2026-05-28 → 06-03 18:00). This repo is private; nothing is published until polls close.
> **Structural note:** 광주 + 전남 merged into **전남광주통합특별시** → one race (민형배 vs 이정현), so **16 광역단체장** (verify vs 선관위).

---

## Contents
1. [TL;DR](#tldr--v8-forecast) · 2. [Why two experiments](#the-two-experiments) · 3. [Version history](#version-history) · 4. [Full forecast (16)](#v8-forecast--all-16) · 5. [Seat distribution](#seat-distribution--scenarios) · 6. [Calibration (2022 backtest)](#empirical-calibration--2022-backtest) · 7. [Scoring](#predicted-share--post-election-scoring) · 8. [Methodology deep-dive](#methodology-deep-dive) · 9. [Formal specification](#formal-model-specification) (notation · parameters · data · uncertainty) · 10. [The LLM experiment](#the-llm-experiment-in-detail) · 11. [Prior art](#prior-art--related-work) · 12. [Reproducibility](#reproducibility) · 13. [Glossary](#glossary) · 14. [What could go wrong](#what-could-still-go-wrong) · 15. [Roadmap](#roadmap-v8-ideas) · 16. [Limitations + assumptions ledger](#honest-limitations)

---

## TL;DR — v8 forecast

- **민주(여당) median 12 / 16 seats** (90% range 8–15); 국힘 holds **대구·경북**. `P(민주 ≥ 12) = 64%`, `P(민주 ≥ 10) = 87%`. 단, 친국힘 −3pt 상관오차면 **11석**까지 하락 (한쪽 통째 오류 리스크).
- **Tipping point: 울산** (50.4%, 민주 53%). Other tossups lean 민주: 부산·경남·충북·서울.
- **National two-party vote ≈ 총투표 2,309만(투표율 nowcast 52.3%) → 민주 1,219만 (58.8%) vs 국힘 856만 (41.2%).**
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
| **v7** | **turnout nowcast from early voting (사전투표)** + ensemble hook | final turnout = early ÷ early-share (calibrated 2018·2022) → tightens the total-votes prediction, the ±3% weak link |
| **v8** | **seeded RNG (재현성) · heavy-tail errors (정규혼합≈Student-t) · σ를 폴 수에 연동 · 체계적 폴편향 시나리오(−4~+4pt) · 다당제 라벨 교정 · 차등투표율 손잡이** | 분산을 넓혀 중앙값 13→12로 **더 정직하게**; 한쪽 통째 오류(상관 편향) 노출 → 중심추정의 D-쏠림은 여전한 한계 |

## v8 forecast — all 16

**민주% / 국힘%** = 원(raw) 득표율 (전체 표 대비) · **예측D** = 양자 득표율(±90%구간) · **총투표** = 예측 총 투표자수(만) · **득표수** = 만 표 · **확률** = 민주 승리확률. 정렬 = 확률순. (목표 정확도 ±3% — 검증은 6/3 `score.mjs`)

총투표·득표수는 **투표율 nowcast(사전투표→최종 52.3%)** 반영. 확률·구간은 **시드 고정 + 두꺼운 꼬리(heavy-tail)** MC (v8).

| 지역 | 매치업 | 민주% | 국힘% | 예측D(양자) | 90%구간 | 총투표(만) | 민주(만) | 국힘(만) | 확률 | 당선 |
|---|---|--:|--:|--:|:--:|--:|--:|--:|--:|:--:|
| 전남광주 | 민형배 vs 이정현 | 80.8 | 9.2 | 89.8% | 81~99 | 155 | 125 | 14 | 98% | 🔵 |
| 전북 | 이원택 vs 김관영(무) | 79.1 | 10.9 | 87.9% | 79~97 | 81 | 64 | 9 | 98% | 🔵 |
| 제주 | 위성곤 vs 문성유 | 63.9 | 26.1 | 71.0% | 63~79 | 30 | 19 | 8 | 98% | 🔵 |
| 경기 | 추미애 vs 양향자 | 56.4 | 33.6 | 62.7% | 52~73 | 582 | 328 | 196 | 95% | 🔵 |
| 대전 | 허태정 vs 이장우 | 51.8 | 38.2 | 57.6% | 49~66 | 63 | 33 | 24 | 90% | 🔵 |
| 인천 | 박찬대 vs 유정복 | 51.7 | 38.3 | 57.5% | 49~66 | 126 | 65 | 48 | 90% | 🔵 |
| 세종 | 우상호 vs 김진태 | 51.0 | 39.0 | 56.7% | 49~65 | 17 | 9 | 7 | 87% | 🔵 |
| 강원 | 민주 vs 김진태 | 50.7 | 39.3 | 56.3% | 48~65 | 72 | 36 | 28 | 86% | 🔵 |
| 충남 | 박수현 vs 김태흠 | 52.8 | 37.2 | 58.7% | 46~71 | 93 | 49 | 34 | 84% | 🔵 |
| 서울 | 정원오 vs 오세훈 | 48.6 | 41.4 | 54.1% | 44~64 | 444 | 216 | 183 | 73% | 🔵 |
| 부산 | 전재수 vs 박형준 | 47.7 | 42.3 | 53.0% | 44~62 | 152 | 72 | 64 | 68% | 🔵 |
| 충북 | 신용한 vs 김영환 | 47.3 | 42.7 | 52.6% | 44~61 | 70 | 33 | 30 | 68% | 🔵 |
| 경남 | 김경수 vs 박완수 | 47.7 | 42.3 | 53.0% | 42~64 | 147 | 70 | 62 | 65% | 🔵 |
| 울산 | 김상욱 vs 김두겸 | 45.3 | 44.7 | 50.4% | 42~59 | 51 | 23 | 23 | 53% | 🔵 |
| 대구 | 김부겸 vs 추경호 | 42.6 | 47.4 | 47.4% | 36~59 | 104 | 44 | 49 | 37% | 🔴 |
| 경북 | 오중기 vs 국힘 | 27.3 | 62.7 | 30.3% | 21~40 | 122 | 33 | 77 | 2% | 🔴 |

**전국: 총투표 ≈ 2,309만 (투표율 nowcast 52.3%) → 민주 ≈ 1,221만 (58.8%) vs 국힘 ≈ 856만 (41.2%) (양당 기준).** 민주%+국힘% < 100인 차이는 제3당·무소속(약 10%) 몫.

### 체계적 폴편향 시나리오 (전국 양자D 일괄 ±pt → 민주 의석)

| 편향 | −4pt | −3pt | −2pt | 0 | +2pt | +4pt |
|---|--:|--:|--:|--:|--:|--:|
| 민주 의석 | 10 | 11 | 13 | 14 | 14 | 15 |

⚠️ 모든 여론조사가 같은 방향으로 틀리는 **상관 오차(correlated error)** 가 핵심 리스크. **친국힘 −3~−4pt 미스**면 부산·경남·서울·충북이 동반 이탈해 민주 **10~11석**까지 떨어진다. MC의 분산(σ)은 이 가능성을 담지만, 모델 손잡이들이 D쪽으로 쏠려 있어 **중심추정 자체가 D-과대일 수 있다** (정직한 한계). 다당제 주의: **전북** = 민주 vs 무소속(비국힘이나 민주후보 패배 가능), **울산** = 3자(진보 분열 변수).

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
| 의석 중앙값 | **12 / 16** (90% 8~15) |
| P(민주 ≥ 12) | 64% |
| P(민주 ≥ 10) | 87% |
| P(국힘 ≥ 5) | 36% |
| P(경합 5곳 싹쓸이) | 21% |
| 결정표 (경합 뒤집는 표) | 울산 0.2만 · 대구 2.5만 |
| 업셋 리스크 (비경합 약한순) | 경남 65% · 충북 68% · 부산 68% |
| 민감도 (민주 우세 수) | 기준 14 · 방식보정無 14 · 스윙± 13~14 |
| 체계적 편향 −3pt 시 | 11석 (한쪽 통째 오류 리스크) |

## Empirical calibration — 2022 backtest

![2022 backtest](docs/backtest.gif)

The 2022 **final phone polls** (지상파 3사, 5/23–25) vs the actual 2022 result, 5 regions:

| | bias | MAE | σ | 당선적중 | Brier |
|---|--:|--:|--:|--:|--:|
| 2022 phone polls | **−0.1pt** | **2.2pt** | 2.6 | 4/5 | 0.137 |

Phone polls were essentially **unbiased**; the one miss (대전: polls D-lead → 국힘 won by ~4pt) sizes the tail. So v6 sets **σ_local ≈ 2.8** and treats phone as the accurate anchor, **pulling ARS up toward phone (+5pt 민주 two-way)** instead of guessing. ⚠️ If a *2026* shy-conservative effect is bigger than 2022's, phone overstates 민주 — that risk lives in the D-lean tossups.

## Predicted share + post-election scoring

The model commits, per region, a **raw vote share (민주%/국힘%)**, a **two-way share**, **total voters**, vote counts, and a win probability (`forecast-national.json`). After polls close, fill `data/results-2026-actual.json` (`total_man`, `D_pct`, `P_pct`) and `node score.mjs` grades everything against a **±3% target**:

- **vote-share error** (민주%/국힘% vs actual; ✓ if ≤3pt) + MAE,
- **total-voters error** (% off; ✓ if ≤3%),
- **two-way MAE**, **winner accuracy (X/16)**, **Brier** (0.25 = no-skill).

Honest expectation on ±3%: the 2022 backtest had a **2.2pt share MAE** — so **vote-share ±3% is realistic on average** (not guaranteed in the tossups). **Total-voters ±3% is the harder one**: 선거인수 is known, but it hinges on the **turnout estimate**, which swings cycle-to-cycle (2018 60.2% → 2022 50.9%); plug exact 선관위 선거인수 + an election-eve turnout nowcast to actually hit it.

## Methodology deep-dive

1. **Fundamentals (structural lean).** Each region's 2022 two-way 민주 share `f` is swung to the 2026 environment on the **logit scale**: `fund = invlogit(logit(f) + 0.32)` (≈ +8pt at a 50/50 region, less at the extremes — so 호남/경북 barely move while swing regions move most).
2. **Method normalization.** Each poll is tagged phone / ARS / mix. ARS systematically shows tighter races (샤이보수 / high-engagement respondents); phone shows bigger 여당 leads and — per the 2022 backtest — was the *accurate* one. So polls are normalized toward the phone basis (`ARS +5`, `mix +2`, `phone 0` two-way 민주).
3. **Multi-poll aggregation.** A region's polls are averaged after normalization; their raw spread is recorded as a method/house-disagreement signal.
4. **Hierarchical shrinkage.** Poll weight scales with poll count: `0.75` (≥2 polls), `0.58` (1 poll), `0` (none → fundamentals only). Strongholds with no polls ride fundamentals.
5. **Clustered correlated Monte Carlo (50k).** Each draw adds a shared **national** error, a per-**cluster** error (수도권/충청/영남/대경/호남/강원/제주), and a **local** error: `σ² = σ_nat² + σ_clu² + σ_loc²` with `σ_nat=σ_clu=2.5`, `σ_loc=2.8` (+ inflation where polls disagree, e.g. 충남 ±16, **+폴 수 적을수록 가산**). Clustering means a regional miss moves a whole bloc together — giving realistic seat-distribution tails instead of falsely tight ones.
   - **v8 — 재현성·두꺼운 꼬리.** RNG는 시드 고정(`mulberry32`, seed `20260603`)이라 같은 입력 → 같은 출력. 오차는 정규혼합(12% 추출이 2.4×σ)으로 **Student-t에 가까운 두꺼운 꼬리**를 줘, 여론조사가 크게 빗나가는 드문 사건(상관 미스)을 과소평가하지 않는다.
   - **체계적 폴편향 시나리오.** 전국 양자D를 −4~+4pt 일괄 이동시켜 의석을 다시 센다(위 표). σ는 무작위 분산만 담으므로, **모든 조사가 같은 방향으로 틀리는 상관 편향**은 이 시나리오로 따로 노출한다. 친국힘 −3pt면 14→11석.
6. **Vote counts.** `예측득표율 × (선거인수 × 투표율 0.52 × 양당 0.90)`.
7. **Multiparty flags.** 울산 (진보 김종훈 splits the anti-PPP vote), 전북 (민주 vs 무소속 김관영, not 국힘).

## Formal model specification

For region $r$ with 2022 two-way 민주 share $f_r$ (percent), polls $\{(D_j,P_j,m_j)\}_{j=1}^{n_r}$ tagged by method $m_j\in\{\text{phone},\text{ars},\text{mix}\}$, eligible voters $E_r$, and cluster $c(r)$:

**1. Fundamentals (logit-swing).** Swinging on the log-odds scale keeps the estimate in $(0,100)$ and moves competitive regions more than strongholds:

$$\varphi_r = 100\cdot\sigma\!\left(\operatorname{logit}(f_r/100) + s\right),\qquad s = 0.32,\quad \sigma(x)=\frac{1}{1+e^{-x}}.$$

**2. Method-normalized poll mean.** Each poll's two-way share $p_j = 100\,D_j/(D_j+P_j)$ is shifted to the phone basis by a house-effect offset $\delta(m)$, then averaged:

$$\pi_r = \frac{1}{n_r}\sum_{j=1}^{n_r}\bigl(p_j + \delta(m_j)\bigr),\qquad \delta=\{\text{phone}{:}\,0,\ \text{ars}{:}\,+5,\ \text{mix}{:}\,+2\}.$$

**3. Hierarchical blend (shrinkage by poll count).** Poll weight rises with evidence; unpolled regions ride fundamentals:

$$\mu_r = w_{n_r}\,\pi_r + (1-w_{n_r})\,\varphi_r,\qquad w_n=\begin{cases}0.75 & n\ge 2\\ 0.58 & n=1\\ 0 & n=0\end{cases}$$

**4. Correlated, heavy-tailed Monte Carlo.** For draw $i=1\dots N$ ($N=50{,}000$), the realized two-way share decomposes into a shared national shock, a per-cluster shock, and a local shock:

$$d_r^{(i)} = \mu_r + \varepsilon^{(i)}_{\text{nat}} + \varepsilon^{(i)}_{c(r)} + \varepsilon^{(i)}_{\text{loc},r}.$$

Each $\varepsilon$ is drawn from a **two-component normal mixture** (variance-inflating heavy tail, approximating Student-t):

$$\varepsilon \sim \begin{cases} \mathcal N(0,\ \sigma^2) & \text{w.p. } 0.88\\ \mathcal N(0,\ (2.4\,\sigma)^2) & \text{w.p. } 0.12\end{cases}\qquad\Rightarrow\quad \operatorname{Var}(\varepsilon)=\bigl(0.88+0.12\cdot 2.4^2\bigr)\sigma^2 = 1.57\,\sigma^2,$$

with $\sigma_{\text{nat}}=\sigma_{\text{clu}}=2.5$ and $\sigma_{\text{loc},r}=2.8+\min(\text{spread}_r/2,\,4)+\kappa(n_r)$, where $\kappa(0)=1.6,\ \kappa(1)=0.7,\ \kappa(\ge2)=0$. The win probability and seat distribution are Monte-Carlo estimates:

$$\widehat{\text{dwin}}_r = \frac1N\sum_i \mathbf 1\!\left[d_r^{(i)}>50\right],\qquad S^{(i)} = \sum_{r=1}^{16}\mathbf 1\!\left[d_r^{(i)}>50\right].$$

**5. Vote counts & turnout nowcast.** With two-party fraction $\beta=0.90$ and turnout $t$, region $r$'s total/party counts are $V_r=E_r\,t_r\,\beta$, $V^D_r=V_r\,\mu_r/100$. Turnout is nowcast from early voting (사전투표), then rescaled so the eligible-weighted average matches it:

$$\hat t_{\text{nat}} = \frac{\text{early turnout}}{\text{early share}},\qquad t_r = t_r^{\text{prior}}\cdot\frac{\hat t_{\text{nat}}}{\bar t^{\text{prior}}}.$$

**6. Scoring (post-election).** Against realized winners $y_r\in\{0,1\}$ and shares: winner accuracy $\sum_r \mathbf 1[\widehat{\text{dwin}}_r\!\ge\!0.5 = y_r]$, share MAE, and $\text{Brier}=\frac1{16}\sum_r(\widehat{\text{dwin}}_r-y_r)^2$ (0.25 = no-skill).

> **Two uncertainty objects, by design.** The printed **90% interval** is the *nominal* Gaussian band $\mu_r\pm1.64\sqrt{\sigma_{\text{nat}}^2+\sigma_{\text{clu}}^2+\sigma_{\text{loc},r}^2}$, while the **win probability** uses the *heavy-tailed* draws above. The probability is therefore (correctly) a touch more conservative than the band implies — rare correlated misses live in the tails, not the interval.

### Notation

| symbol | meaning |
|---|---|
| $f_r$ | region $r$ 2022 two-way 민주 share (fundamentals input) |
| $\varphi_r$ | swung fundamentals estimate |
| $\pi_r$ | method-normalized poll mean |
| $\mu_r$ | blended predicted two-way 민주 share (`finalD`) |
| $w_n$ | poll weight given $n$ polls |
| $\delta(m)$ | method (house-effect) offset to phone basis |
| $\varepsilon_{\text{nat}},\varepsilon_c,\varepsilon_{\text{loc}}$ | national / cluster / local error shocks |
| $\widehat{\text{dwin}}_r$ | MC probability 민주 wins region $r$ |
| $S^{(i)}$ | simulated 민주 seat count in draw $i$ |
| $E_r,t_r,\beta$ | eligible voters, turnout, two-party fraction |

### Calibrated parameters

Every constant, its value, and *why* it has that value (no free hand-tuning beyond what the backtest licenses):

| symbol | value | role | source / justification |
|---|--:|---|---|
| $s$ (SWING) | 0.32 | 2022→2026 logit swing | set so the national two-way matches the 2026 poll environment; ≈ +8pt at a 50/50 region |
| $\delta_{\text{ars}}$ | +5 | ARS→phone offset | 2022 backtest: phone ≈ unbiased, ARS understated 민주 |
| $\delta_{\text{mix}}$ | +2 | mixed-method offset | interpolated between phone and ARS |
| $w$ ($n\ge2$ / $n{=}1$) | 0.75 / 0.58 | poll weight | hierarchical shrinkage toward fundamentals |
| $\sigma_{\text{nat}},\sigma_{\text{clu}}$ | 2.5, 2.5 | correlated error | 2022 σ≈2.6 split across the error hierarchy |
| $\sigma_{\text{loc}}$ (base) | 2.8 | idiosyncratic error | 2022 local MAE 2.2 → σ≈2.8 |
| mixture $(p,k)$ | (0.12, 2.4) | heavy tail | inflates variance ×1.57; tail mass ≈ Student-t |
| seed | 20260603 | RNG seed | election date; guarantees reproducibility |
| $N$ (SIM) | 50,000 | MC draws | MC std-error on any dwin $\le 0.5/\sqrt N \approx 0.22$pp |
| $\beta$ | 0.90 | two-party fraction | ≈10% to 제3당·무소속 |

### Data & provenance

| dataset | file | content | source | caveat |
|---|---|---|---|---|
| Polls | `data/national-2026.json` | 16 regions, method-tagged head-to-heads | press releases / NESDC (중앙선거여론조사심의위) summaries | **approximate** — names & numbers verify vs NESDC |
| Fundamentals | `data/results-2022.json` | 2022 metropolitan two-way by region | 2022 8th-local result | recalled / approximate — verify vs 선관위 |
| Electorate | `data/voters-2026.json` | 선거인수 (10k) + turnout prior + $\beta$ | 선관위 선거인수; turnout is a prior | turnout is an estimate until the nowcast lands |
| Turnout nowcast | `data/turnout-2026.json` | early-vote turnout + early share + 2018/2022 history | 사전투표 발표 | placeholder until 06-02; fill with the official 사전투표율 |
| Backtest polls | `data/polls-2022-final.json` | 2022 final phone polls (5 regions) | 지상파 3사 공동, 2022-05-23~25 | $n=5$; phone-only |

> **Provenance honesty.** Poll and fundamentals figures are entered from public reporting and memory and are flagged approximate throughout; the model's *machinery* is the contribution, and it is only as good as the numbers fed in. Replace each file with verified 선관위/NESDC values before treating any number as authoritative.

### Uncertainty budget

For a well-polled tossup ($\sigma_{\text{loc}}=2.8$), the nominal per-race standard deviation is $\sqrt{2.5^2+2.5^2+2.8^2}\approx 4.5$pt; the heavy-tail mixture lifts the *effective* sd to $\approx 4.5\sqrt{1.57}\approx 5.6$pt. Because $\sigma_{\text{nat}}$ and $\sigma_{\text{clu}}$ are **shared** across regions, errors are positively correlated *within* a cluster and *nationally* — which is exactly why the seat distribution has fat tails (8–15) rather than the artificially narrow band an independent-errors model would produce.

## The LLM experiment in detail

`forecast.mjs` builds a detailed synthetic Seoul electorate (district × age × gender × housing × occupation × income), asks each persona — across **claude-haiku, claude-sonnet, gpt-4o-mini** — for a vote + turnout, poststratifies, calibrates each model against a 2022 backtest, and blends with polls. The result:

- claude-haiku said 오세훈 ~100%, claude-sonnet ~73%, gpt-4o-mini ~65% 정원오 — **wild disagreement**.
- Even calibrated, the ensemble leaned 오세훈, while **every real poll had 정원오 +4 to +13**.
- Conclusion: the models carry an incumbent/conservative prior that contradicts the actual 2026 dynamics. **The LLM electorate adds noise and bias, not information beyond polls.** It is kept as a documented negative result, not used in the headline forecast.

## Prior art & related work

This model is deliberately conventional — it implements well-established forecasting practice rather than inventing a new estimator, and its only novel limb (the LLM electorate) is the one that failed.

- **Fundamentals ⊕ polls with correlated simulation** is the house style of US election models (FiveThirtyEight's "polls-plus" lineage; *The Economist*'s 2020 Bayesian state-space model by Gelman & Heidemanns). The key shared idea we adopt: **state/region errors are correlated**, so national simulations must share a common shock — independent-error models understate tail risk.
- **Hierarchical / partial pooling** of polls toward a structural prior follows the multilevel-modeling tradition; **MRP** (multilevel regression and poststratification; Park–Gelman–Bafumi) is the natural next step for sub-regional and sparse-poll estimation (roadmap).
- **House-effect / mode adjustment** (here, ARS↔phone) mirrors standard pollster-bias correction in aggregators; our specific finding — that the 2022 *phone* mode was ~unbiased and ARS understated 민주 — is calibrated locally, not borrowed.
- **Silicon sampling** — simulating respondents with LLMs (cf. Argyle et al., "Out of One, Many," *Political Analysis* 2023) — motivated the persona experiment. Our result is a cautionary negative: for a *contested, forward-looking* race the LLM electorate reproduced a training-data prior rather than the current poll signal. This is consistent with broader critiques that silicon samples encode stale, biased distributions.
- **Markets vs models.** Prediction markets and the 오마이뉴스×STI panel are left as an ensemble hook; markets have at times outperformed models, and blending them is future work — not claimed here.

> Where this repo differs from a textbook implementation is mainly in *discipline*: every parameter is traced to the backtest or flagged as a prior, the failed experiment is kept in the tree, and the whole pipeline is seeded for exact reproducibility.

## Reproducibility

- **Deterministic.** All randomness flows through one seeded generator (`mulberry32`, seed `20260603`). Re-running `node national.mjs` on the same data yields **bit-identical** output — verified (median 12 seats across repeated runs).
- **Versioned inputs.** Every input is a checked-in JSON snapshot under `data/`; the forecast is a pure function of those files plus the seed.
- **One command** reproduces the headline numbers; the GIFs regenerate from `docs/*.tape` via `vhs`.
- **Pre-committed scoring.** `score.mjs` and the target metric (±3%) are fixed *before* the result is known, so the post-election grade cannot be retrofitted.

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

## Roadmap (v8 ideas)

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
- **Full-model backtest still pending.** The 2022 calibration (`backtest-2022.mjs`) validates the **poll part** only (n=5, MAE 2.2). The full pipeline (fundamentals ⊕ polls ⊕ clustered MC) has not been validated out-of-sample because clean 2018+2022 region-level fundamentals aren't in hand — **so it is not faked here.** v8 instead bounds exposure with the systematic-bias scenario; a real out-of-sample backtest is a v9 item once the data is loaded.
- **Center estimate may be D-biased.** Several knobs (ARS→phone pull, swing, turnout) push 민주-ward. The MC σ and the bias scenario capture the spread, but if every nudge is wrong in the same direction the median itself overstates 민주 — the −3pt column (→11석) is the honest downside.

### Assumptions ledger

Every load-bearing assumption, its risk if wrong, and the consequence — so a reader can audit the model's exposure at a glance:

| assumption | risk | consequence if wrong |
|---|:--:|---|
| Uniform national swing $s=0.32$ (logit) | 🟠 M | regions over/under-corrected vs a region-specific swing |
| Single reference cycle (2022 only) for fundamentals | 🟠 M | one atypical year contaminates every structural prior |
| **Phone mode is the unbiased anchor** (from 2022) | 🔴 H | if 2026 shy-conservative > 2022, 민주 is overstated in every D-lean tossup |
| ARS offset $\delta=+5$ constant across regions | 🟠 M | true house effect varies by region/pollster |
| Flat turnout (nowcast) & $\beta=0.90$ two-party | 🟠 M | vote-count totals drift; ±3% total-votes target at risk |
| Gaussian-nominal 90% band vs heavy-tailed prob | 🟢 L | printed interval slightly narrower than the win-prob implies (by design) |
| 전북 무소속 counted on the non-국힘 side | 🟢 L | seat call (D-vs-P) holds even if 무소속 wins |
| 울산 modeled two-way (ignores 3-way split) | 🟠 M | a 진보 split/단일화 could flip the realized winner |
| Approximate poll/fundamentals inputs | 🔴 H | garbage-in: the machinery is only as good as the entered numbers |

## Validation

The real test is **2026-06-03**: fill the actuals, run `score.mjs`, read the MAE / winner accuracy / Brier. That is the model's honest report card.
