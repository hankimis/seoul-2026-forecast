// Build: typst compile paper.typ paper.pdf
// Figures: paper/figs/*.png (extracted from the model's terminal output)

#set document(title: "Forecasting the 2026 Korean Local Elections", author: "Han Kim")
#set page(
  paper: "a4",
  margin: (x: 2.2cm, y: 2.4cm),
  numbering: "1",
  footer: context [
    #set text(8pt, fill: luma(120))
    #grid(columns: (1fr, 1fr),
      align(left)[IOV Labs · pre-registered forecast],
      align(right)[#counter(page).display("1 / 1", both: true)])
  ],
)
#set text(font: ("Libertinus Serif", "AppleMyungjo"), size: 10pt, lang: "en")
#set par(justify: true, leading: 0.62em)
#show heading: set block(above: 1.2em, below: 0.7em)
#set heading(numbering: "1.1")
#show heading.where(level: 1): it => block[
  #set text(13pt, weight: "bold")
  #it
]
#set math.equation(numbering: "(1)")

// ---- title block ----
#align(center)[
  #text(17pt, weight: "bold")[
    Forecasting the 2026 Korean Local Elections:\
    A Reproducible Polls-plus-Fundamentals Model\
    with a Pre-registered Validation Protocol
  ]
  #v(6pt)
  #text(11pt)[Han Kim]
  #v(2pt)
  #text(9pt, fill: luma(90))[IOV Labs (아이오브연구소) · #link("mailto:hankim.masion@gmail.com")[hankim.masion\@gmail.com]]
  #v(2pt)
  #text(9pt, fill: luma(90))[Version 1.0 (pre-registration) · compiled #datetime.today().display("[year]-[month]-[day]")]
  #v(4pt)
  #box(stroke: 0.5pt + rgb("#c0392b"), inset: (x: 8pt, y: 3pt), radius: 3pt)[
    #text(8pt, fill: rgb("#c0392b"))[SEALED until 2026-06-03 18:00 (공직선거법 §108) — predictions committed before the outcome]
  ]
]

#v(8pt)

// ---- abstract ----
#block(fill: luma(245), inset: 12pt, radius: 4pt, width: 100%)[
  #text(9.5pt)[
    *Abstract.* We forecast the 16 metropolitan-executive (광역단체장) races of South Korea's 9th nationwide local election (3 June 2026) by combining a structural _fundamentals_ estimate — each region's 2022 two-way vote swung to the 2026 environment on the logit scale — with _method-normalized poll aggregates_, fused by poll-count-weighted hierarchical shrinkage. Outcome uncertainty is propagated through a 50,000-draw correlated Monte Carlo with a three-level error budget (national $plus.o$ cluster $plus.o$ local) and heavy-tailed (normal-mixture $approx$ Student-$t$) innovations, so that a single nationwide polling miss moves correlated blocs together. The pipeline is seeded and fully reproducible. The central estimate is *민주 (Democratic Party) 12 of 16 seats* (90% credible range 8–15), with five genuine toss-ups (서울, 부산, 경남, 충북, 울산). The error model is calibrated on the 2022 final phone polls (bias $-0.1$ pt, MAE $2.2$ pt, $sigma approx 2.6$), and the dominant failure mode — a _correlated_ poll bias — is quantified by an explicit $plus.minus 4$ pt scenario sweep ($-3$ pt $arrow.r$ 11 seats). A parallel silicon-sampling experiment (an LLM-persona electorate) is reported as a *negative result*. The model is pre-registered: the forecast is sealed before the result, and a fixed scoring script grades it after polls close.

    #text(8.5pt)[*Keywords:* election forecasting · poll aggregation · hierarchical shrinkage · correlated Monte Carlo · heavy-tailed errors · calibration · Brier score · silicon sampling · reproducibility · pre-registration]
  ]
]

#v(6pt)

= Introduction

A forecast is not a prophecy; it is a structured, falsifiable statement of uncertainty about a future that will happen exactly once. This paper documents such a statement for the 2026 Korean local elections, made with two commitments that distinguish it from a routine poll average: every parameter is traced to an empirical backtest or flagged as a prior, and the entire pipeline is deterministic, so there is exactly one forecast to defend, chosen before the outcome.

The model belongs to the "polls-plus-fundamentals" family popularized by US forecasters @silver538 @economist2020: structural history supplies a prior, current polls update it, and a correlated simulation turns the result into a distribution over seats rather than a point guess. We adapt this skeleton to a data-sparse, bipolar, multi-region contest, and we add an explicit treatment of the single largest hidden bias in Korean polling — the gap between live-interview (전화면접) and automated-response (ARS) survey modes.

We also report a failure. A silicon-sampling experiment that simulated a synthetic electorate with large language models is retained precisely because it _did not work_: it reproduced a training-data prior rather than the present poll signal. Keeping disconfirming results is the methodological stance of this work.

= Data

#figure(
  table(
    columns: (auto, 1fr, auto),
    align: (left, left, left),
    stroke: 0.4pt + luma(200),
    inset: 5pt,
    table.header([*Source*], [*Content*], [*Caveat*]),
    [Polls], [16 regions, method-tagged head-to-heads (전화면접 / ARS / mixed)], [press / NESDC summaries; approximate],
    [Fundamentals], [2022 metropolitan two-way share by region], [recalled; verify vs NEC],
    [Electorate], [eligible voters (선거인수), turnout prior, two-party fraction $beta$], [turnout is a prior until nowcast],
    [Turnout nowcast], [early-vote (사전투표) turnout + early share + 2018/2022 history], [placeholder until 2 June],
    [Backtest], [2022 final phone polls, 5 regions], [$n = 5$; phone-only],
  ),
  caption: [Input data and provenance. All poll and fundamentals figures are entered from public reporting and flagged approximate; the contribution is the machinery, which is only as good as the numbers fed in.],
) <tab-data>

The unit of analysis is the region (광역시·도). Korea's 9th local election follows a structural change relevant here: 광주 and 전남 are treated as a merged race (전남광주), giving *16* metropolitan executives rather than 17. Each poll is tagged by survey mode because mode is the dominant source of disagreement (Section 4.2).

= Methods

== Generative model

For region $r$ with 2022 two-way Democratic share $f_r$ (percent), polls ${(D_j, P_j, m_j)}_(j=1)^(n_r)$ tagged by mode $m_j$, eligible voters $E_r$, and cluster $c(r)$:

*Fundamentals (logit-swing).* Swinging on the log-odds scale keeps estimates in $(0, 100)$ and moves competitive regions more than strongholds:
$ phi_r = 100 dot sigma(op("logit")(f_r \/ 100) + s), quad s = 0.32, quad sigma(x) = 1 \/ (1 + e^(-x)). $

*Method-normalized poll mean.* Each poll's two-way share $p_j = 100 D_j \/ (D_j + P_j)$ is shifted to the phone basis by a house-effect offset $delta(m)$, then averaged:
$ pi_r = 1/n_r sum_(j=1)^(n_r) (p_j + delta(m_j)), quad delta = {"phone": 0, " ARS": +5, " mix": +2}. $

*Hierarchical blend.* Poll weight rises with the number of polls; unpolled regions ride fundamentals:
$ mu_r = w_(n_r) pi_r + (1 - w_(n_r)) phi_r, quad w_n = cases(0.75 & n >= 2, 0.58 & n = 1, 0 & n = 0). $

*Correlated, heavy-tailed Monte Carlo.* For draw $i = 1 dots N$ ($N = 50{,}000$), the realized share decomposes into a shared national shock, a per-cluster shock, and a local shock:
$ d_r^((i)) = mu_r + epsilon_"nat"^((i)) + epsilon_(c(r))^((i)) + epsilon_(op("loc"),r)^((i)). $
Each $epsilon$ is drawn from a two-component normal mixture (a variance-inflating heavy tail $approx$ Student-$t$):
$ epsilon ~ cases(cal(N)(0, sigma^2) & "w.p. " 0.88, cal(N)(0, (2.4 sigma)^2) & "w.p. " 0.12) quad arrow.r.double quad "Var"(epsilon) = 1.571 sigma^2, $
with $sigma_"nat" = sigma_"clu" = 2.5$ and $sigma_(op("loc"),r) = 2.8 + min("spread"_r \/ 2, 4) + kappa(n_r)$, where $kappa(0)=1.6, kappa(1)=0.7, kappa(>=2)=0$. The win probability and seat count are Monte-Carlo estimates:
$ hat(p)_r = 1/N sum_i bb(1)[d_r^((i)) > 50], quad S^((i)) = sum_(r=1)^(16) bb(1)[d_r^((i)) > 50]. $

*Vote counts and turnout nowcast.* With two-party fraction $beta = 0.90$ and turnout $t$, region totals are $V_r = E_r t_r beta$ and $V_r^D = V_r mu_r \/ 100$. Turnout is nowcast from early voting and rescaled so the eligible-weighted mean matches it: $hat(t)_"nat" = "early turnout" \/ "early share"$.

== Calibrated parameters

Every constant is traced to the 2022 backtest or flagged as a prior (Table @tab-params). There is no free hand-tuning beyond what the backtest licenses.

#figure(
  table(
    columns: (auto, auto, 1fr),
    align: (left, center, left),
    stroke: 0.4pt + luma(200),
    inset: 5pt,
    table.header([*Symbol*], [*Value*], [*Justification*]),
    [$s$ (swing)], [0.32], [national two-way matches the 2026 poll environment; $approx +8$ pt at a 50/50 region],
    [$delta_"ARS"$], [$+5$], [2022 backtest: phone $approx$ unbiased, ARS understated 민주],
    [$w$ ($n>=2$ / $1$)], [0.75 / 0.58], [hierarchical shrinkage toward fundamentals],
    [$sigma_"nat", sigma_"clu"$], [2.5, 2.5], [2022 $sigma approx 2.6$ split across the error hierarchy],
    [$sigma_"loc"$ (base)], [2.8], [2022 local MAE 2.2 $arrow.r sigma approx 2.8$],
    [mixture $(p, k)$], [(0.12, 2.4)], [inflates variance $times 1.571$; tail mass $approx$ Student-$t$],
    [seed], [20260603], [election date; guarantees reproducibility],
    [$N$], [50,000], [MC std-error on any $hat(p) <= 0.5 \/ sqrt(N) approx 0.22$ pp],
    [$beta$], [0.90], [$approx 10%$ to third-party / independents],
  ),
  caption: [Calibrated parameters.],
) <tab-params>

= Results

== Headline forecast

The central estimate is *민주 12 of 16 seats* (90% range 8–15); 국힘 (People Power Party) holds 대구 and 경북. Five races are genuine toss-ups. Figure @fig-map shows the tile-grid map; Table @tab-forecast lists every race; Figure @fig-probs shows the per-region intervals.

#figure(image("figs/map.png", width: 86%), caption: [Tile-grid map of the 16 races (roughly geographic, not true borders). Colour = leading party, shade = confidence, number = Democratic win probability.]) <fig-map>

#figure(
  table(
    columns: (auto, auto, auto, auto, auto, auto, auto),
    align: (left, right, right, right, center, right, center),
    stroke: 0.4pt + luma(200),
    inset: 4pt,
    table.header([*Region*], [*민주%*], [*국힘%*], [*two-way D*], [*90% CI*], [*P(D)*], [*win*]),
    [전남광주], [80.8], [9.2], [89.8], [81–99], [98%], [🔵],
    [전북], [79.1], [10.9], [87.9], [79–97], [98%], [🔵],
    [제주], [63.9], [26.1], [71.0], [63–79], [98%], [🔵],
    [경기], [56.4], [33.6], [62.7], [52–73], [95%], [🔵],
    [대전], [51.8], [38.2], [57.6], [49–66], [90%], [🔵],
    [인천], [51.7], [38.3], [57.5], [49–66], [90%], [🔵],
    [세종], [51.0], [39.0], [56.7], [49–65], [87%], [🔵],
    [강원], [50.7], [39.3], [56.3], [48–65], [86%], [🔵],
    [충남], [52.8], [37.2], [58.7], [46–71], [84%], [🔵],
    [서울], [48.6], [41.4], [54.1], [44–64], [73%], [🔵],
    [부산], [47.7], [42.3], [53.0], [44–62], [68%], [🔵],
    [충북], [47.3], [42.7], [52.6], [44–61], [68%], [🔵],
    [경남], [47.7], [42.3], [53.0], [42–64], [65%], [🔵],
    [울산], [45.3], [44.7], [50.4], [42–59], [53%], [🔵],
    [대구], [42.6], [47.4], [47.4], [36–59], [37%], [🔴],
    [경북], [27.3], [62.7], [30.3], [21–40], [2%], [🔴],
  ),
  caption: [Full forecast, sorted by Democratic win probability. National two-party vote $approx$ 1{,}221 vs 856 (만 votes), i.e. 58.8% vs 41.2%.],
) <tab-forecast>

#grid(columns: (1fr, 1fr), gutter: 8pt,
  [#figure(image("figs/probs.png", width: 100%), caption: [Per-region win probability and 90% two-way interval.]) <fig-probs>],
  [#figure(image("figs/seats.png", width: 100%), caption: [Seat distribution and scenario odds (50k draws).]) <fig-seats>],
)

The seat distribution is right-skewed with fat tails: P(민주 $>= 12$) = 64%, P($>= 10$) = 87%, P(국힘 $>= 5$) = 36%, P(sweep of all 5 toss-ups) = 21%.

== Method bias: the largest hidden variable

The same region, polled at the same time by different modes, can differ by up to 16 pt in two-way share (충남; Figure @fig-method). ARS overstates closeness (a shy-conservative / high-engagement artefact); in the 2022 backtest the accurate mode was live phone. The model therefore normalizes ARS toward the phone basis by $+5$ pt. If a 2026 shy-conservative effect exceeds 2022's, phone overstates 민주, and the D-leaning toss-ups move together — the dominant risk (Section 6).

#figure(image("figs/method.png", width: 82%), caption: [ARS vs phone two-way Democratic share, regions with both modes.]) <fig-method>

== Calibration

#figure(
  table(
    columns: 6, align: center, stroke: 0.4pt + luma(200), inset: 5pt,
    table.header([], [*bias*], [*MAE*], [*$sigma$*], [*winner*], [*Brier*]),
    [2022 phone polls], [$-0.1$ pt], [2.2 pt], [2.6], [4 / 5], [0.137],
  ),
  caption: [Backtest of the 2022 final phone polls vs the realized result. Phone was essentially unbiased; the single miss (대전) sizes the tail and sets $sigma_"loc" approx 2.8$.],
) <tab-backtest>

== Robustness and sensitivity

Perturbing one parameter at a time and re-counting Democratic-leading regions (Figure @fig-tornado), the forecast is _insensitive to its own tuning_ and _sensitive to the data_: a correlated national poll bias ($-3 arrow.r +3$ pt) moves the seat count 11 $arrow.l.r$ 15, dwarfing the swing prior, poll weight, and mode-correction levers. This is the correct failure profile — the forecast is essentially "the polls, de-biased," so the real risk is a collectively wrong polling industry, not a mis-set knob.

#figure(image("figs/tornado.png", width: 86%), caption: [Sensitivity tornado: Democratic-leading region count under one-at-a-time lever perturbations.]) <fig-tornado>

#figure(
  table(
    columns: 7, align: center, stroke: 0.4pt + luma(200), inset: 4pt,
    table.header([*national bias*], [$-4$], [$-3$], [$-2$], [$0$], [$+2$], [$+4$]),
    [Democratic seats], [10], [11], [13], [14], [14], [15],
  ),
  caption: [Systematic poll-bias scenario sweep (uniform shift in national two-way D). A 3–4 pt pro-국힘 miss pulls 민주 to 10–11 seats.],
) <tab-bias>

= The silicon-sampling experiment (negative result)

Following the silicon-sampling literature @argyle2023, a synthetic Seoul electorate (district $times$ age $times$ gender $times$ housing $times$ occupation $times$ income) was simulated across three LLMs (claude-haiku, claude-sonnet, gpt-4o-mini), poststratified, calibrated on a 2022 backtest, and blended with polls. The models disagreed wildly (haiku $approx$ 100% 오세훈, sonnet $approx$ 73% 정원오, gpt $approx$ 65% 정원오), and even after calibration the ensemble leaned 오세훈 while every real poll had 정원오 ahead by 4–13 pt. The conclusion: for a contested, forward-looking race the LLM electorate reproduces a stale training prior rather than the current signal. An LLM's fluency about the world is memory, not measurement. The result is retained, unused in the headline forecast, as a documented negative finding.

= Discussion: limitations and assumptions

The central estimate may be Democratic-biased: several knobs (ARS$arrow.r$phone pull, swing, turnout) push 민주-ward, and if every nudge errs in the same direction the median itself overstates 민주 — the $-3$ pt column ($arrow.r$ 11 seats) is the honest downside. The full pipeline is not yet validated out-of-sample: the 2022 backtest validates the _poll part_ only ($n = 5$); a full-model backtest awaits clean 2018+2022 fundamentals and is _not fabricated_ here. Multiparty frames are approximate (울산 is modeled two-way despite a 3-way split; 전북 is 민주 vs an independent, counted on the non-국힘 side). All poll and fundamentals inputs are approximate and should be replaced with verified NEC/NESDC values before any number is treated as authoritative. The natural extension for sparse and sub-regional estimation is multilevel regression and poststratification @park2004, which requires microdata not available here.

= Pre-registration and validation protocol

This document is *version 1.0*, compiled and sealed before the outcome. The validation is mechanical and fixed in advance:

#table(
  columns: (auto, 1fr), align: (left, left), stroke: 0.4pt + luma(200), inset: 5pt,
  table.header([*Date*], [*Action*]),
  [2026-06-02], [Fill the official early-vote (사전투표) turnout; re-run the turnout nowcast and the final forecast (version 1.1). The point predictions of Table @tab-forecast are *not* re-tuned; only turnout-dependent totals update.],
  [2026-06-03 18:00], [Polls close. Fill the realized winners and shares; run the pre-committed scoring script. Report winner accuracy (of 16), vote-share MAE, total-votes error, and the realized Brier score against the $plus.minus 3%$ target (version 2.0).],
)

The Brier score @brier1950 will be read through its standard decomposition into uncertainty, resolution, and reliability @murphy1973 (Appendix); reliability (calibration) is the term this model is built to control. A forecast that cannot be plainly wrong, in public, by a measurable amount, is not a forecast.

#block(fill: luma(245), inset: 10pt, radius: 4pt, width: 100%)[
  *Results (to be completed 2026-06-03).* _Winner accuracy: — / 16. Vote-share MAE: — pt. Total-votes error: — %. Brier: —. Verdict: —._
]

= Reproducibility

All randomness flows through one seeded generator (mulberry32, seed 20260603); re-running the model on the checked-in data yields bit-identical output. Every input is a versioned JSON snapshot, and every table cell is recomputable by hand (a full 서울 worked example is given in the repository). Code, data, figures, and this paper's source are in the project repository (private until polls close).

#set text(8.5pt)
#bibliography("refs.bib", title: [References], style: "ieee")

#text(8pt, fill: luma(110))[
  *Appendix — Brier decomposition.* $"BS" = overline(y)(1 - overline(y)) - 1/n sum_k n_k (overline(y)_k - overline(y))^2 + 1/n sum_k n_k (p_k - overline(y)_k)^2$ (uncertainty $-$ resolution $+$ reliability; Murphy 1973), where $k$ indexes probability bins. *Heavy-tail variance.* The mixture has $"Var"(epsilon) = (0.88 + 0.12 dot 2.4^2) sigma^2 = 1.571 sigma^2$, so the effective sd is $approx 1.253 sigma$ with kurtosis $> 3$. *MC standard error.* $"SE"(hat(p)) = sqrt(p(1-p)\/N) <= 0.5\/sqrt(N) approx 0.22$ pp at $N = 50{,}000$.
]
