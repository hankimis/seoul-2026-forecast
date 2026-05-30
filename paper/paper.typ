// Build: typst compile paper.typ paper.pdf   (or ./build.sh for figures too)
// A full-length pre-registered methods paper. Figures: paper/figs/*.png

#set document(title: "Forecasting the 2026 Korean Local Elections", author: "Han Kim")
#set page(
  paper: "a4",
  margin: (x: 2.2cm, y: 2.5cm),
  numbering: "1",
  header: context {
    if counter(page).get().first() > 1 [
      #set text(8pt, fill: luma(140))
      #grid(columns: (1fr, 1fr),
        align(left)[Forecasting the 2026 Korean Local Elections],
        align(right)[IOV Labs · pre-registered forecast])
      #line(length: 100%, stroke: 0.3pt + luma(210))
    ]
  },
  footer: context [
    #set text(8pt, fill: luma(120))
    #align(center)[#counter(page).display("1")]
  ],
)
#set text(font: ("Libertinus Serif", "AppleMyungjo"), size: 10.5pt, lang: "en")
#set par(justify: true, leading: 0.74em, spacing: 1.05em, first-line-indent: 1.2em)
#show heading: set block(above: 1.25em, below: 0.7em)
#show heading: set par(first-line-indent: 0em)
#set heading(numbering: "1.1")
#show heading.where(level: 1): it => block[#set text(13pt, weight: "bold"); #it]
#show heading.where(level: 2): it => block[#set text(11pt, weight: "bold"); #it]
#show heading.where(level: 3): it => block[#set text(10pt, weight: "bold", style: "italic"); #it]
#set math.equation(numbering: "(1)")
#show figure: set block(breakable: false)

// ---------- title ----------
#align(center)[
  #text(18pt, weight: "bold")[
    Forecasting the 2026 Korean Local Elections:\
    A Reproducible Polls-plus-Fundamentals Model\
    with a Pre-registered Validation Protocol
  ]
  #v(8pt)
  #text(11.5pt)[Han Kim]
  #v(2pt)
  #text(9pt, fill: luma(90))[IOV Labs (아이오브연구소) · #link("mailto:hankim.masion@gmail.com")[hankim.masion\@gmail.com]]
  #v(3pt)
  #text(9pt, fill: luma(90))[Version 1.0 (pre-registration) · compiled #datetime.today().display("[year]-[month]-[day]")]
  #v(5pt)
  #box(stroke: 0.6pt + rgb("#c0392b"), inset: (x: 9pt, y: 4pt), radius: 3pt)[
    #text(8.5pt, fill: rgb("#c0392b"))[*SEALED* until 2026-06-03 18:00 (공직선거법 §108) — all predictions committed before the outcome]
  ]
]

#v(10pt)

// ---------- abstract ----------
#block(fill: luma(246), inset: 13pt, radius: 4pt, width: 100%)[
  #set par(first-line-indent: 0em)
  #text(9.5pt)[
    *Abstract.* We forecast the 16 metropolitan-executive (광역단체장) races of South Korea's 9th nationwide local election (3 June 2026) by combining a structural _fundamentals_ estimate — each region's 2022 two-way vote swung to the 2026 environment on the logit scale — with _method-normalized poll aggregates_, fused by poll-count-weighted hierarchical shrinkage. Outcome uncertainty is propagated through a 50,000-draw correlated Monte Carlo with a three-level error budget (national $plus.o$ cluster $plus.o$ local) and heavy-tailed (normal-mixture $approx$ Student-$t$) innovations, so that a single nationwide polling miss moves correlated regional blocs together rather than averaging out. The entire pipeline is seeded and reproducible to the bit. The central estimate is *민주 (Democratic Party) 12 of 16 seats* (90% credible range 8–15), with five genuine toss-ups (서울, 부산, 경남, 충북, 울산) and only 대구·경북 leaning 국힘 (People Power Party). The error model is calibrated against the 2022 final phone polls (bias $-0.1$ pt, mean absolute error $2.2$ pt, $sigma approx 2.6$), and the dominant failure mode — a _correlated_ poll bias rather than any internal parameter — is quantified by an explicit $plus.minus 4$ pt scenario sweep (a 3 pt pro-국힘 miss yields 11 seats). A parallel _silicon-sampling_ experiment, in which a synthetic electorate was simulated with large language models, is reported as a *negative result*: it reproduced a stale training prior and contradicted every contemporaneous poll. The paper is written as a pre-registration: the forecast is sealed before the result is known, turnout-dependent quantities update once on 2 June, and a fixed scoring script grades every claim after polls close on 3 June.

    #v(4pt)
    #text(8.7pt)[*Keywords:* election forecasting · poll aggregation · house effects · hierarchical shrinkage · correlated Monte Carlo · heavy-tailed errors · calibration · proper scoring rules · Brier score · silicon sampling · reproducibility · pre-registration]
  ]
]

#v(6pt)
#block(inset: (left: 4pt))[
  #set text(9pt)
  *Contributions.*
  #set par(first-line-indent: 0em)
  + A complete, auditable polls-plus-fundamentals forecast for a data-sparse, multi-region, bipolar contest, with every parameter traced to a backtest or declared as a prior.
  + An explicit treatment of the largest hidden bias in Korean polling — the live-phone vs. automated-response (ARS) mode gap — calibrated rather than guessed.
  + A correlated, heavy-tailed Monte Carlo whose tail behaviour and cross-region dependence are derived, not asserted, and whose dominant risk is isolated by a systematic-bias sweep.
  + A documented _negative result_ for LLM "silicon sampling" in a forward-looking, contested race.
  + A reproducibility and pre-registration protocol that makes the forecast falsifiable on a fixed date by a fixed metric.
]

#v(4pt)
#outline(title: text(11pt, weight: "bold")[Contents], indent: 1.2em, depth: 2)
#pagebreak()

// ================= 1 INTRODUCTION =================
= Introduction

A forecast is not a prophecy. It is a structured, falsifiable statement of uncertainty about a future that has not happened and will happen exactly once. The discipline of election forecasting consists almost entirely of taking that one sentence seriously: deciding what one is entitled to claim from noisy, biased, incomplete data; quantifying how wrong one might be; and committing to a number before the world reveals the answer. This paper documents such a statement for the metropolitan-executive races of South Korea's 9th nationwide local election, held on 3 June 2026.

The model we present is deliberately conventional in its skeleton and deliberately disciplined in its execution. It belongs to the "polls-plus-fundamentals" family that has become standard in US presidential forecasting @silver538 @economist2020: a structural estimate derived from past results supplies a prior; current polls update that prior; and a correlated simulation converts the blended estimate into a probability distribution over outcomes rather than a single point guess. What distinguishes the present work is not novelty of architecture but two commitments that are easy to state and surprisingly rare to honour. First, every quantitative choice is either traced to an out-of-sample backtest or explicitly flagged as a prior, so that no parameter is a silent hand-tuning. Second, the entire pipeline is deterministic — a pure function of its input data and a fixed random seed — so that there is exactly one forecast to defend, chosen before the outcome, with no opportunity to re-roll the simulation until it flatters the forecaster.

== Why this problem is hard

Forecasting Korean metropolitan elections poses difficulties that the well-studied US presidential case largely avoids. The races are numerous (sixteen simultaneous contests) but individually thin in public polling, with several regions effectively unpolled. The dominant survey modes — live telephone interview (전화면접) and automated response (ARS) — disagree systematically and by large margins, sometimes by more than fifteen points in two-way share, reflecting a mode-dependent version of the spiral-of-silence / shy-respondent phenomenon @noelleneumann1974. Turnout is volatile across cycles (the metropolitan turnout fell from 60.2% in 2018 to 50.9% in 2022), which matters acutely for any prediction of raw vote counts. Several races are not cleanly two-way: a region may pit the ruling party against an independent, or feature a progressive third candidate who splits the anti-incumbent vote. And the contest is governed by an election law (공직선거법 §108) that prohibits the publication of forecasts during a pre-election blackout, so the work must be conducted and sealed privately.

== The single-event problem

Underlying every probabilistic claim in this paper is a philosophical commitment worth stating at the outset. When we write that the Democratic candidate wins 서울 "with probability 73%," there is no long run in which 서울 votes a hundred times and the candidate wins seventy-three of them; the election happens once. The number is therefore not a frequency but a degree of belief, conditioned on the data and assumptions documented here. Its only honest test is _calibration across many such claims_: if the events we call "70%" occur about seventy percent of the time and those we call "90%" about ninety percent, the probabilities carry information. This is why the model commits sixteen simultaneous probabilities and scores them with a proper scoring rule @gneiting2007 @brier1950; a single race can never validate a probability, but sixteen begin to, and a track record across cycles eventually does. We return to these epistemics in Section 10.

== Roadmap

Section 2 situates the model in the forecasting and polling literature. Section 3 describes the 2026 electoral context and the legal constraints. Section 4 documents the data and its provenance. Section 5 — the core of the paper — specifies the generative model in full, with derivations for each component. Section 6 reports the empirical calibration against a 2022 backtest. Section 7 presents the forecast, race by race. Section 8 analyses robustness and sensitivity. Section 9 reports the silicon-sampling negative result. Section 10 discusses the epistemics, ethics, and limitations. Section 11 states the pre-registration and validation protocol. Appendices provide full derivations, the per-region input data, a hand-worked example, pseudocode, and a glossary of Korean terms.

// ================= 2 BACKGROUND =================
= Background and related work

== Fundamentals and the predictability of elections

A long tradition in political science holds that elections are, in aggregate, more predictable than the day-to-day variation of campaign polls suggests. Lewis-Beck and Rice @lewisbeck1992 formalized the use of structural "fundamentals" — economic conditions, incumbency, prior partisanship — to forecast outcomes months in advance. Gelman and King @gelmanking1993 famously asked why campaign polls are so variable when votes are so predictable, and answered that much poll movement is noise around a fundamentals-anchored equilibrium toward which opinion reverts. The practical lesson, which this model adopts, is that a region's past vote is a powerful prior that polls should update but not overwhelm — especially where polling is thin.

== Poll aggregation and house effects

No single poll is the truth; aggregation reduces variance and, done carefully, bias. Jackman @jackman2005 modelled the pooling of polls over a campaign as a latent-state estimation problem in which each pollster carries a "house effect" — a systematic lean to be estimated and removed. Subsequent evaluations of polling error @shiranimehr2018 @kennedy2018 decomposed total error into bias and variance components and showed that correlated, industry-wide bias — not independent sampling noise — drives the large, memorable misses. This finding is structural to our error model: the Monte Carlo's national and cluster shocks (Section 5.5) exist precisely to represent the correlated component that an independent-errors model would wrongly average away.

== Hierarchical models and poststratification

Where individual-level survey microdata are available, multilevel regression and poststratification (MRP) @park2004 @gelmanhill2007 estimates opinion in small areas by partially pooling toward a model and reweighting to known population margins; it has enabled credible forecasts even from non-representative samples @wang2015. The present model does not have access to the microdata MRP requires, but it borrows the same two ideas in a coarser form: partial pooling (poll estimates shrunk toward fundamentals by an evidence-dependent weight) and reweighting (turnout and two-party adjustments to recover vote counts). MRP is the natural extension and is noted as future work.

== Korean polling: the mode problem

The defining feature of Korean pre-election polling is the divergence between live-interview and ARS modes. Live interviews tend to elicit larger ruling-party leads; ARS surveys, which over-represent highly engaged respondents and reduce social-desirability pressure, tend to show tighter races and stronger conservative support — a mode-specific manifestation of the spiral of silence @noelleneumann1974, locally termed 샤이보수 ("shy conservative"). Because the two modes can differ by ten to sixteen points in the same region at the same time (Section 7.2), any aggregator that ignores mode is at the mercy of the survey mix. We therefore treat mode as a first-class house effect and calibrate its correction against the 2022 outcome.

== Silicon sampling

A recent literature proposes using large language models to simulate survey respondents — "silicon samples" @argyle2023 — on the hypothesis that a model conditioned on a demographic persona reproduces that subpopulation's attitudes. We tested this directly for the 서울 mayoral race and obtained a clear negative result (Section 9). The finding is consistent with the critique that LLMs encode a stale, training-time distribution: asked to imagine a 2026 voter, the models returned what voters _were_, not what contemporaneous polls say they _are_. We treat this as informative about the method's limits for forward-looking, contested prediction, and retain the experiment for that reason.

== Scoring and calibration

Forecast quality is assessed with proper scoring rules @gneiting2007 — rules minimized in expectation by reporting one's true beliefs. We use the Brier score @brier1950 and read it through Murphy's decomposition @murphy1973 into uncertainty, resolution, and reliability (calibration). The pre-committed scoring script (Section 11) reports these after the election. The broader stance — that good judgement is a track record of calibrated probabilities, not a single dramatic call — follows the forecasting-tournament tradition @tetlock2015.

== Where this model sits

Table @tab-compare locates the present model among the standard families. It is, deliberately, a small and auditable member of the FiveThirtyEight/Economist lineage rather than a methodological departure: it keeps the correlated-simulation core and the fundamentals-plus-polls structure, drops the components for which the data are too thin (a full economic index, a continuous state-space, individual-level microdata), and adds the one piece the Korean setting demands (explicit survey-mode normalization). Its distinguishing features are not in the estimator but in the discipline around it — calibration to a backtest, retention of a failed experiment, and bit-level reproducibility.

#figure(
  table(
    columns: (auto, 1fr, 1fr),
    align: (left, left, left),
    stroke: 0.4pt + luma(200), inset: 5pt,
    table.header([*Approach*], [*Signal / uncertainty*], [*Relation to this work*]),
    [Naive poll average], [latest polls; margin of error], [the starting point, then de-biased by mode and pooled toward fundamentals],
    [FiveThirtyEight "polls-plus" @silver538], [polls $plus.o$ fundamentals $plus.o$ economy; correlated state sims], [same skeleton, minus the economic index (local races, thin data)],
    [Economist / Bayesian state-space @economist2020], [full posterior; partial pooling], [approximates the spirit (shrinkage + correlated error) without full MCMC],
    [MRP @park2004 @wang2015], [individual survey + census; model-based], [future work; requires microdata not available here],
    [Prediction markets], [aggregated wagers; implied probability], [left as an ensemble hook; can outperform models],
    [Silicon sampling @argyle2023], [LLM-simulated respondents], [tested and reported as a negative result (Section 9)],
    [This model], [polls $plus.o$ fundamentals, mode-normalized; seeded correlated heavy-tail MC], [a small, auditable, reproducible take on the polls-plus family],
  ),
  caption: [The model among forecasting approaches.],
) <tab-compare>

// ================= 3 ELECTORAL CONTEXT =================
= The 2026 Korean local elections

== Institutions

South Korea holds unified local elections every four years. Among the offices contested, the most consequential are the _metropolitan executives_ (광역단체장): the mayors of the special, metropolitan, and special-self-governing cities, and the governors of the provinces. Each is elected by single-round plurality (first-past-the-post) within the region. These are the races forecast here. They are politically salient as a nationwide barometer of the two major parties — the center-left Democratic Party (더불어민주당, here "민주" or D), currently the ruling party, and the conservative People Power Party (국민의힘, "국힘" or P) — and, because they occur at the mid-point of national political cycles, as a referendum on the incumbent administration.

== The 16 races

A structural change shapes this cycle: the administrative consolidation of 광주 and 전남 into a single merged jurisdiction (here denoted 전남광주) reduces the count of metropolitan executives from seventeen to sixteen. We forecast all sixteen. The regions span seven correlation blocs used throughout this paper (Table @tab-clusters): the capital area (수도권: 서울·인천·경기), the central 충청 belt, the southeastern 영남 coast, the 대경 inland, the southwestern 호남 stronghold, and the standalone 강원 and 제주. The bloc structure encodes the empirical fact that polling errors and political swings travel together within these groupings, which the model exploits in its correlated simulation.

#figure(
  table(
    columns: (auto, 1fr, 1fr),
    align: (left, left, left),
    stroke: 0.4pt + luma(200), inset: 5pt,
    table.header([*Cluster*], [*Regions*], [*Character*]),
    [수도권 (Capital)], [서울 · 인천 · 경기], [Democratic strength, 경기 decisive],
    [충청 (Central)], [대전 · 세종 · 충북 · 충남], [Democratic-leaning; 충북·충남 competitive, mode-sensitive],
    [영남 (Southeast)], [부산 · 울산 · 경남], [historically conservative; modeled as narrow toss-ups],
    [대경 (Daegu–N.Gyeongsang)], [대구 · 경북], [conservative; 대구 competitive on candidate strength],
    [호남 (Southwest)], [전남광주 · 전북], [Democratic dominance],
    [강원 / 제주], [강원 · 제주], [Democratic-leaning],
  ),
  caption: [The seven correlation blocs. Within-bloc errors are treated as positively correlated in the Monte Carlo (Section 5.5).],
) <tab-clusters>

== Candidates and the multiparty caveat

The model is configured with the major-party match-ups for each race (Appendix B). Two races break the clean two-way frame and carry explicit flags: 전북 pits the Democratic candidate against a prominent _independent_ rather than a People Power candidate (so a Democratic loss there would still not be a conservative gain), and 울산 features a progressive third candidate whose presence splits the anti-incumbent vote and whose possible withdrawal/unification (단일화) is a live variable. We stress that the candidate-level inputs are illustrative and approximate, entered from public reporting; the contribution of this paper is the method, and every input should be replaced with verified figures from the National Election Commission (NEC) and the National Election Survey Deliberation Commission (NESDC) before any number is treated as authoritative.

== Election law and the blackout

Article 108 of the Public Official Election Act prohibits the publication of election forecasts during the pre-election blackout window. This is not merely a compliance footnote but an epistemically meaningful constraint: a published forecast is not a neutral mirror of opinion but a potential _intervention_ in it, capable of affecting turnout and morale. The law's recognition of this reflexivity is the reason the present work is conducted privately and sealed until polls close; we treat the restraint as a duty rather than an obstacle (Section 10.3).

// ================= 4 DATA =================
= Data

The unit of analysis is the region. Five data objects feed the model; their content, source, and limitations are summarized in Table @tab-data, with a full field-level dictionary in Appendix B.

#figure(
  table(
    columns: (auto, 1fr, auto),
    align: (left, left, left),
    stroke: 0.4pt + luma(200), inset: 5pt,
    table.header([*Object*], [*Content*], [*Caveat*]),
    [Polls], [16 regions, method-tagged head-to-head shares (전화면접 / ARS / mixed)], [press / NESDC summaries; approximate],
    [Fundamentals], [2022 metropolitan two-way Democratic share by region], [recalled; verify vs NEC],
    [Electorate], [eligible voters (선거인수), turnout prior, two-party fraction $beta$], [turnout is a prior until the nowcast],
    [Turnout nowcast], [early-vote (사전투표) turnout, early share, 2018/2022 history], [placeholder until 2 June],
    [Backtest], [2022 final phone polls, five regions], [$n = 5$; phone-only],
  ),
  caption: [Input data and provenance.],
) <tab-data>

== The two-way transformation

Throughout, races are reduced to a _two-way_ (양자대결) Democratic share, $"two-way" = 100 dot D \/ (D + P)$, where $D$ and $P$ are the raw Democratic and People-Power shares; fifty percent is a tie. This transformation is standard and serves three purposes: it removes the nuisance variation of differing third-party and undecided levels across polls, it is the quantity the backtest calibrates most cleanly, and it linearizes the contest around the decision boundary at 50. Raw shares are recovered for reporting via the two-party fraction $beta$ (Section 5.8). Where the two-way frame is unsafe (울산, 전북), the model carries multiparty flags rather than pretending the reduction is exact.

== Provenance and the "garbage-in" principle

We are explicit that the poll and fundamentals figures used here are entered from public reporting and memory and are flagged approximate throughout. This is a deliberate separation of concerns: the paper's contribution is the estimation machinery — the de-biasing, pooling, correlation, and uncertainty propagation — which is only ever as good as the numbers fed into it. A reader who substitutes verified NEC/NESDC inputs obtains a sharper forecast from the identical code; nothing in the method depends on the specific approximate values, and the reproducibility protocol (Section 5.12) makes such substitution trivial.

// ================= 5 METHODS =================
= Methods

We specify the model as an explicit generative process: how, for each region, a predicted two-way share and its full predictive distribution are produced from fundamentals and polls. Section 5.1 fixes notation; Sections 5.2–5.10 derive each component; Section 5.11 defines scoring; Section 5.12 covers implementation and reproducibility.

== Notation

For region $r in {1, dots, 16}$ let $f_r$ be the 2022 two-way Democratic share (percent); $cal(P)_r = {(D_j, P_j, m_j)}_(j=1)^(n_r)$ the set of $n_r$ polls with raw shares $D_j, P_j$ and mode $m_j in {"phone", "ARS", "mix"}$; $c(r)$ the cluster; $E_r$ the eligible electorate; and $t_r$ the turnout. We write $sigma(x) = (1 + e^(-x))^(-1)$ for the logistic function and $op("logit")(p) = log(p \/ (1-p))$ for its inverse, $bb(1)[dot]$ for the indicator, and $cal(N)(mu, sigma^2)$ for the normal distribution.

== Fundamentals: swinging on the logit scale

The structural prior for region $r$ is its 2022 two-way share, swung to the 2026 environment. Crucially, the swing is applied on the _log-odds_ scale:
$ phi_r = 100 dot sigma(op("logit")(f_r \/ 100) + s), quad s = 0.32. $ <eq-fund>
Three properties motivate this choice over a naive additive-in-percent swing. First, $phi_r in (0, 100)$ by construction, so no stronghold is ever pushed to an impossible share. Second, the transformation is _multiplicative in the odds_: a fixed logit increment $s$ produces the largest movement in percentage terms near 50% and a vanishing movement at the extremes. With $s = 0.32$, a 50/50 region moves about $+8$ points, whereas 호남 at 85% or 경북 at 24% barely move — matching the empirical regularity that uniform national swings compress at the extremes. Third, it mirrors standard practice in fundamentals-based forecasting @lewisbeck1992 @silver538. The single scalar $s$ encodes the aggregate 2022→2026 shift toward the Democratic Party; it is the model's one structural free parameter, and Section 8 shows the seat forecast is only weakly sensitive to it.

== Method normalization: mode as a house effect

Each poll's two-way share $p_j = 100 D_j \/ (D_j + P_j)$ is corrected toward the live-phone basis by a mode offset $delta(m)$ and then averaged:
$ pi_r = 1/n_r sum_(j=1)^(n_r) (p_j + delta(m_j)), quad delta = cases("phone:" &0, "ARS:" &+5, "mix:" &+2). $ <eq-poll>
The offsets are not guessed; they are set by the 2022 backtest (Section 6), in which the final live-phone polls were essentially unbiased while ARS understated the eventual Democratic two-way share. Treating mode as a house effect to be estimated and removed is the aggregation tradition of Jackman @jackman2005 applied to the dominant axis of Korean polling disagreement. We additionally record the raw within-region spread of poll estimates, $"spread"_r = max_j p_j - min_j p_j$, as a signal of method/house disagreement that inflates local uncertainty (Section 5.5).

== Hierarchical shrinkage: weighting evidence against the prior

The blended estimate partially pools the poll mean toward fundamentals, with a weight that grows with the amount of polling evidence:
$ mu_r = w_(n_r) pi_r + (1 - w_(n_r)) phi_r, quad w_n = cases(0.75 quad &n >= 2, 0.58 quad &n = 1, 0 quad &n = 0). $ <eq-blend>
This is a coarse, transparent surrogate for the partial pooling that a full Bayesian hierarchical model would perform @gelmanhill2007: a well-polled region is governed largely by its polls; a region with a single poll is pulled noticeably toward its structural prior; an unpolled stronghold rides fundamentals entirely. The schedule is intentionally simple and legible rather than tuned, and — like the swing — the seat forecast is shown to be robust to its exact values (Section 8).

== Correlated, heavy-tailed Monte Carlo

Uncertainty is propagated by simulation. For draw $i = 1, dots, N$ with $N = 50{,}000$, the realized two-way share of region $r$ is
$ d_r^((i)) = mu_r + epsilon_"nat"^((i)) + epsilon_(c(r))^((i)) + epsilon_(op("loc"),r)^((i)), $ <eq-mc>
the sum of a shared _national_ shock, a per-_cluster_ shock common to all regions in $c(r)$, and an _independent local_ shock. The shared shocks are the model's representation of correlated polling error: a single draw of $epsilon_"nat"$ moves all sixteen regions together, and a draw of $epsilon_(c(r))$ moves a whole bloc together. This is essential. The large, memorable polling misses are correlated, industry-wide events @shiranimehr2018 @kennedy2018; an independent-errors model would treat the sixteen races as sixteen separate coin flips and report a falsely narrow seat distribution. With shared shocks, the seat distribution acquires realistic fat tails (Section 7.3).

Each shock is drawn not from a Gaussian but from a two-component normal _mixture_, which produces heavier tails:
$ epsilon ~ cases(cal(N)(0, sigma^2) &"with prob. " 0.88, cal(N)(0, (2.4 sigma)^2) &"with prob. " 0.12.) $ <eq-mix>
The local scale adapts to evidence: $sigma_(op("loc"),r) = 2.8 + min("spread"_r \/ 2, 4) + kappa(n_r)$, with $kappa(0) = 1.6, kappa(1) = 0.7, kappa(>= 2) = 0$, so that regions with disagreeing or absent polls are correctly less certain. The national and cluster scales are fixed at $sigma_"nat" = sigma_"clu" = 2.5$. The variance and tail consequences of the mixture are derived in Section 5.6 and Appendix A.

== Why heavy tails

A pure Gaussian assigns negligible probability to the kind of three- or four-point correlated miss that polling actually produces every few cycles. The mixture @eq-mix inflates the variance of each shock to
$ "Var"(epsilon) = (0.88 + 0.12 dot 2.4^2) sigma^2 = 1.571 sigma^2, $
so the effective standard deviation is $sqrt(1.571) sigma approx 1.253 sigma$, and — more importantly — the excess kurtosis is positive, approximating a Student-$t$. Concretely, draws beyond $2.4sigma$ are roughly an order of magnitude more frequent than under a Gaussian of the same central scale. The practical effect is that the model's stated win probabilities are appropriately humble in the toss-ups: a 53% region is not treated as a near-certainty just because its central estimate clears 50, because the fat tail keeps a real mass of the distribution on the other side.

== Two distinct uncertainty objects

The model deliberately reports two different uncertainty summaries, and conflating them is a common error. The printed 90% _interval_ for region $r$ is the _nominal Gaussian_ band
$ mu_r plus.minus 1.64 sqrt(sigma_"nat"^2 + sigma_"clu"^2 + sigma_(op("loc"),r)^2), $
whereas the win _probability_ is computed from the _heavy-tailed_ draws of @eq-mc. The probability is therefore, by design, slightly more conservative than the nominal band would imply: the rare correlated misses live in the tails that the band omits. We regard exposing both — rather than forcing a single number to do two jobs — as more honest than the alternative.

== Vote counts and the turnout nowcast

To predict raw vote totals, the two-way share is combined with the electorate and turnout. With two-party fraction $beta = 0.90$ (about ten percent of votes go to third parties and independents), region $r$'s totals are
$ V_r = E_r t_r beta, quad V_r^D = V_r mu_r \/ 100, quad V_r^P = V_r (100 - mu_r) \/ 100. $ <eq-counts>
Turnout is the weakest link in any vote-count prediction because it swings cycle to cycle. We therefore _nowcast_ it from early voting. Let the early-vote turnout and its historical share of the eventual total (calibrated on 2018 and 2022) be observed on 2 June; then
$ hat(t)_"nat" = ("early-vote turnout") / ("early share"), $ <eq-turnout>
and each region's turnout prior is rescaled so the eligible-weighted mean matches $hat(t)_"nat"$. Until the early-vote figure is released, $hat(t)_"nat"$ uses the historical early share as a placeholder; the 2-June update (Section 11) replaces it with the official number. The raw reported shares are then $beta mu_r$ (Democratic) and $beta(100 - mu_r)$ (People Power), which is why the reported 민주% and 국힘% sum to roughly 90 rather than 100.

== Multiparty handling

Two departures from the two-way frame are handled by explicit flags rather than silent approximation. In 전북, the principal challenger is an independent; the model's Democratic-vs-People-Power seat call therefore remains valid even if the independent wins, because the seat is still not a conservative gain, and this is annotated rather than scored as a People-Power possibility. In 울산, a progressive third candidate splits the anti-incumbent vote; the two-way reduction is acknowledged as unsafe and the race is flagged as the one most exposed to a unification (단일화) shock. These flags do not alter the central machinery; they mark where its assumptions are known to be loosest.

== Estimators: win probability and seat distribution

From the draws, the region win probability and the seat-count distribution are the Monte-Carlo estimates
$ hat(p)_r = 1/N sum_(i=1)^N bb(1)[d_r^((i)) > 50], quad S^((i)) = sum_(r=1)^(16) bb(1)[d_r^((i)) > 50]. $ <eq-est>
The reported seat median and 90% range are order statistics of ${S^((i))}$, and scenario probabilities (e.g. $P(S >= 12)$) are empirical frequencies. Because these are sample estimates, they carry Monte-Carlo error; Section 5.12 shows it is negligible at $N = 50{,}000$.

== Scoring

After the election the forecast is graded by a pre-committed script against the realized winners $y_r in {0, 1}$ and realized shares. The reported metrics are winner accuracy $sum_r bb(1)[(hat(p)_r >= 0.5) = y_r]$ out of sixteen; the mean absolute error of the two-way share; the percentage error of total votes; and the Brier score
$ "BS" = 1/16 sum_(r=1)^(16) (hat(p)_r - y_r)^2, $ <eq-brier>
which is a strictly proper scoring rule @gneiting2007 (minimized in expectation by honest probabilities) and which we read through Murphy's reliability/resolution/uncertainty decomposition @murphy1973 (Appendix A). A no-skill coin-flip scores 0.25; the 2022 backtest scored 0.137 (Section 6).

== Implementation and reproducibility

All randomness flows through a single seeded generator (the `mulberry32` PRNG, seed `20260603`, the election date), and normal draws are produced from it by the Box–Muller transform. Consequently the model is a pure function of (data, seed): re-running it on the checked-in inputs yields bit-identical output, which we have verified across repeated runs (median 12 seats every time). This determinism is a methodological choice, not a convenience — it removes a degree of freedom (re-rolling the simulation) that could otherwise be abused. The Monte-Carlo error is controlled by $N$: for any probability estimate $hat(p)$, the standard error is $sqrt(hat(p)(1 - hat(p)) \/ N) <= 0.5 \/ sqrt(N) approx 0.0022$, i.e. every reported probability is accurate to about $plus.minus 0.22$ percentage points, far finer than the modeling uncertainty. Pseudocode is given in Appendix D.

// ================= 6 CALIBRATION =================
= Empirical calibration

The error model's two key choices — the mode offset $delta$ and the local scale $sigma_"loc"$ — are set by an out-of-sample backtest rather than by hand. We took the 2022 final live-phone polls (the three-network joint surveys, 23–25 May 2022) for five regions and compared them to the realized 2022 result.

#figure(
  table(
    columns: 6, align: center, stroke: 0.4pt + luma(200), inset: 6pt,
    table.header([], [*bias*], [*MAE*], [*$sigma$*], [*winner*], [*Brier*]),
    [2022 final phone polls], [$-0.1$ pt], [$2.2$ pt], [$2.6$], [$4 / 5$], [$0.137$],
  ),
  caption: [Backtest of the 2022 final phone polls against the realized 2022 metropolitan result.],
) <tab-backtest>

The result (Table @tab-backtest) is the empirical backbone of the model. The live-phone polls were essentially _unbiased_ (mean error $-0.1$ pt), with a mean absolute error of $2.2$ pt and an error standard deviation near $2.6$. The single winner miss (대전, where a phone lead for the Democratic candidate preceded a narrow People-Power win) sizes the tail and motivates a local scale $sigma_"loc" approx 2.8$ rather than something tighter. Two modeling decisions follow directly. First, live phone is treated as the accurate anchor and ARS is corrected _toward_ it ($delta_"ARS" = +5$), rather than the reverse or a split-the-difference compromise. Second, the national/cluster/local scales are apportioned so that their combination reproduces the observed $sigma approx 2.6$ for a well-polled race.

We are candid about what this backtest does and does not establish. It validates the _poll component_ of the model — the mode correction and the scale — on five regions. It does _not_ validate the full pipeline (fundamentals $plus.o$ polls $plus.o$ correlated simulation) out of sample, because doing so cleanly requires region-level 2018 and 2022 fundamentals that we do not have in verified form. We therefore do not fabricate a full-model backtest; instead, Section 8 bounds the model's exposure with a systematic-bias sweep, and a genuine out-of-sample backtest is left as the first item of future work. The most important caveat is forward-looking: the backtest certifies that the 2022 phone mode was unbiased, but if the 2026 shy-conservative effect is larger than 2022's, the phone anchor itself overstates the Democratic share, and that risk lives in every phone-led toss-up.

// ================= 7 RESULTS =================
= Results

== Headline

The central estimate is *민주 12 of 16 seats*, with a 90% credible range of 8 to 15. Only 대구 and 경북 lean to the People Power Party. Five races are genuine toss-ups in the sense that their 90% intervals straddle the 50% line — 서울, 부산, 경남, 충북, and 울산 — and the model's seat median is essentially set by how these five break. Figure @fig-map shows the tile-grid map; Table @tab-forecast lists every race with its predicted shares, interval, and win probability; Figure @fig-probs shows the intervals sorted by probability.

#figure(image("figs/map.png", width: 84%), caption: [Tile-grid representation of the sixteen races (roughly geographic placement, not true borders). Colour denotes the leading party, shading denotes confidence, and the number is the Democratic win probability. 민주 leads 14 regions; only 대구 and 경북 lean 국힘.]) <fig-map>

#figure(
  table(
    columns: (auto, auto, auto, auto, auto, auto, auto),
    align: (left, right, right, right, center, right, center),
    stroke: 0.4pt + luma(200), inset: 4pt,
    table.header([*Region*], [*민주%*], [*국힘%*], [*two-way D*], [*90% CI*], [*P(D)*], [*call*]),
    [전남광주], [80.8], [9.2], [89.8], [81–99], [98%], [D],
    [전북], [79.1], [10.9], [87.9], [79–97], [98%], [D],
    [제주], [63.9], [26.1], [71.0], [63–79], [98%], [D],
    [경기], [56.4], [33.6], [62.7], [52–73], [95%], [D],
    [대전], [51.8], [38.2], [57.6], [49–66], [90%], [D],
    [인천], [51.7], [38.3], [57.5], [49–66], [90%], [D],
    [세종], [51.0], [39.0], [56.7], [49–65], [87%], [D],
    [강원], [50.7], [39.3], [56.3], [48–65], [86%], [D],
    [충남], [52.8], [37.2], [58.7], [46–71], [84%], [D],
    [서울], [48.6], [41.4], [54.1], [44–64], [73%], [D],
    [부산], [47.7], [42.3], [53.0], [44–62], [68%], [D],
    [충북], [47.3], [42.7], [52.6], [44–61], [68%], [D],
    [경남], [47.7], [42.3], [53.0], [42–64], [65%], [D],
    [울산], [45.3], [44.7], [50.4], [42–59], [53%], [D],
    [대구], [42.6], [47.4], [47.4], [36–59], [37%], [P],
    [경북], [27.3], [62.7], [30.3], [21–40], [2%], [P],
  ),
  caption: [Full forecast, sorted by Democratic win probability. 민주%/국힘% are raw (all-candidate) shares; two-way D is the head-to-head share with its 90% interval; P(D) is the Monte-Carlo win probability. National two-party vote is approximately 1{,}221 vs 856 (만 votes), i.e. 58.8% vs 41.2%.],
) <tab-forecast>

== Race-by-race reading

It is worth walking the clusters, because the seat distribution is a story about which blocs are safe and which move together.

#grid(columns: (1fr, 1fr), gutter: 8pt,
  [#figure(image("figs/probs.png", width: 100%), caption: [Per-region win probability and 90% two-way interval. The five toss-ups straddle the 50% line.]) <fig-probs>],
  [#figure(image("figs/seats.png", width: 100%), caption: [Democratic seat distribution and scenario odds over 50,000 draws; median 12, 90% range 8–15.]) <fig-seats>],
)

_호남 and 제주_ are effectively decided: 전남광주 and 전북 are Democratic strongholds (win probability 98%), and 제주, while less extreme, is a comfortable Democratic hold. These contribute three near-certain seats. _수도권_ is Democratic-favored throughout: 경기 is the safest of the three at 95% on the strength of large phone leads, while 인천 (90%) and 서울 (73%) are progressively closer; 서울 is a toss-up-adjacent "lean" whose 90% interval (44–64) dips below 50, reflecting genuine uncertainty in the capital. _충청_ leans Democratic but contains two of the five toss-ups: 대전 and 세종 are leans, whereas 충북 (68%) and 충남 (84% but with the widest interval, 46–71, owing to a sixteen-point phone–ARS disagreement) are fragile. _영남_ is the heart of the forecast's uncertainty: historically conservative 부산 (68%), 경남 (65%), and 울산 (53%) are all modeled as narrow Democratic leads, and because they share a cluster shock they tend to move as a unit (Section 7.4). _대경_ is the conservative anchor: 경북 is safe People Power (2% Democratic), and 대구 (37%) is the one conservative-leaning race made competitive by a strong Democratic candidate. _강원_ rounds out the Democratic-leaning column at 86%.

== The seat distribution

Aggregating the sixteen correlated races yields a right-skewed seat distribution with a median of 12 and a 90% range of 8 to 15 (Figure @fig-seats). The cumulative scenario probabilities are: $P(S >= 12) = 64%$, $P(S >= 10) = 87%$, $P("People Power" >= 5) = 36%$, and $P("Democratic sweep of all five toss-ups") = 21%$. The distribution's fat lower tail — non-trivial mass at 8–10 seats — is not an artefact but the intended consequence of the shared national and cluster shocks: it is the probability that the correlated toss-ups break together against the Democratic Party. A model with independent errors would compress this tail and overstate confidence.

== Why the toss-ups move together

The single most important structural feature of the result is that the five toss-ups are not five independent bets. Three of them (부산, 경남, 울산) lie in the 영남 cluster and share its shock; all five share the national shock. A correlated, industry-wide polling error of the kind documented in post-election evaluations @shiranimehr2018 would therefore not nudge one race but tilt the whole group. This is precisely the dependence that the systematic-bias sweep (Section 8.2) quantifies, and it is why the headline is reported as a distribution (8–15) rather than a point (12).

== Vote totals

Under the turnout nowcast (a placeholder 52.3% until the 2-June early-vote figure), the implied national two-party vote is approximately 12.21 million Democratic to 8.56 million People Power, or 58.8% to 41.2% on the two-way basis. We flag these totals as the least certain numbers in the paper: the eligible electorate is known, but the totals scale directly with turnout, whose cycle-to-cycle volatility (60.2% in 2018 to 50.9% in 2022) is large relative to the $plus.minus 3%$ target. The 2-June update exists specifically to sharpen them.

// ================= 8 ROBUSTNESS =================
= Robustness and sensitivity

== One-at-a-time sensitivity

A natural question is which assumption, if mis-set, would actually change the forecast. We perturb each lever in turn and recount the Democratic-leaning regions under the deterministic decision rule (Figure @fig-tornado). The finding is unambiguous and reassuring: the model is _insensitive to its own tuning_ and _sensitive to the data_. Doubling the swing's range, moving the poll weight from 0.60 to 0.90, or removing the mode correction entirely each changes the deterministic seat count by at most one. The structural parameters are simply not where the risk lives.

#figure(image("figs/tornado.png", width: 84%), caption: [Sensitivity tornado: the count of Democratic-leading regions under one-at-a-time perturbations of each lever. A correlated national poll bias dominates every internal parameter.]) <fig-tornado>

== The systematic-bias sweep

The one lever that dominates is a _correlated national poll bias_ — a uniform shift applied to every region's two-way share, representing the scenario in which the entire polling industry is wrong in the same direction. Sweeping this bias from $-4$ to $+4$ points (Table @tab-bias) moves the seat count from 10 to 15. A three-point pro-People-Power miss — well within the historical range of correlated polling error — pulls the Democratic total to 11 seats as 부산, 경남, 서울, and 충북 defect together. This is the model's honest downside, and it cannot be reduced by better internal tuning because it is not a property of the model; it is a property of the polls. The heavy tails (Section 5.6) and the shared shocks (Section 5.5) are the model's attempt to price this risk rather than hide it.

#figure(
  table(
    columns: 7, align: center, stroke: 0.4pt + luma(200), inset: 5pt,
    table.header([*national bias*], [$-4$], [$-3$], [$-2$], [$0$], [$+2$], [$+4$]),
    [Democratic seats], [10], [11], [13], [14], [14], [15],
  ),
  caption: [Systematic poll-bias scenario sweep (uniform shift in national two-way Democratic share, deterministic seat count).],
) <tab-bias>

== The right failure profile

That the forecast is robust to its parameters and fragile to a correlated data error is the _correct_ failure profile for a model of this kind. It means the forecast is, in essence, "the polls, de-biased and pooled," and not a fragile contraption balanced on tuned constants. The residual risk is therefore externalized and named: a collectively wrong polling industry. We would rather report that risk explicitly, as an 8-to-15 seat range and a $-3$-point-to-11-seats scenario, than launder it into a single confident number.

// ================= 9 SILICON SAMPLING =================
= The silicon-sampling experiment

== Design

Motivated by the silicon-sampling literature @argyle2023, we constructed a synthetic 서울 electorate as a cross-product of demographic cells (district $times$ age $times$ gender $times$ housing tenure $times$ occupation $times$ income) and asked each persona, across three large language models (claude-haiku, claude-sonnet, and gpt-4o-mini), for a vote choice and a turnout intention. Responses were poststratified to known 서울 margins, each model was calibrated against the 2022 result, and the calibrated ensemble was blended with the polls — exactly the pipeline one would use if the method worked.

== Result

It did not work. The three models disagreed wildly: claude-haiku returned almost unanimous support for the conservative candidate, claude-sonnet leaned Democratic by roughly three-to-one, and gpt-4o-mini leaned Democratic more modestly. Even after per-model calibration, the ensemble leaned _toward the conservative candidate_, while every contemporaneous real poll had the Democratic candidate ahead by four to thirteen points. The synthetic electorate was not a noisy version of the truth; it was a biased one, pointing the wrong way.

== Interpretation

We read this as an epistemological rather than merely an engineering failure. Asked to imagine a 2026 voter, the models returned a distribution anchored in their training data — what 서울 voters _were_, filtered through whatever priors the models encode — not what 서울 voters, as measured by current polls, now _are_. An LLM's fluency about the social world is _memory_, not _measurement_: it interpolates a training-time distribution and does not observe the present. For a stable, backward-looking quantity this may suffice; for a contested, forward-looking race it injects a stale prior dressed as a prediction. We therefore exclude the silicon sample from the headline forecast and retain it, unused, as a documented negative result — because a research program that keeps only its successes is indistinguishable from one that learns nothing.

// ================= 10 DISCUSSION =================
= Discussion

== What the model claims, and what it does not

The model claims to be a calibrated statement of uncertainty conditional on its inputs — no more. It does not claim to know who will win the toss-ups; it claims that, across many such calls, its probabilities should be right about as often as they say. It does not claim a true model of the Korean electorate; following Box @box1976, all models are wrong, and the operative question is whether this one's _errors are honest_ — symmetric where we are ignorant, fat-tailed where surprises live, and explicitly bounded where the bias could be one-sided. A confident wrong forecast and a hedged wrong forecast are not equally culpable: the first misrepresents how much it knew. We would rather report "12 seats, range 8–15" than "13 seats, certainly," because the wider, less impressive interval is the more truthful one.

== Calibration as the cardinal virtue

The reason the paper insists on a proper scoring rule and a pre-committed grade is that calibration is the only forecasting virtue that survives contact with reality. Accuracy on a single call is luck; calibration across many calls is skill @tetlock2015. The Brier decomposition @murphy1973 makes the relevant term explicit: of its three components, reliability (do 70% calls happen 70% of the time?) is the one a forecaster controls, and it is the one this model is built to optimize through honest probabilities rather than confident point predictions.

== Reflexivity and the ethics of forecasting

A forecast can change the thing it forecasts. Published election predictions can affect turnout, donations, and morale; the relationship between forecast and outcome is reflexive, and metrics that become targets cease to measure cleanly. South Korea's §108 blackout is a legal recognition of exactly this hazard, and we treat it as an ethical floor rather than a ceiling: the model is built and sealed privately, and nothing is published until polls close. A forecaster whose output could influence the event being forecast has a duty of restraint that ordinary scientific publication does not impose.

== Falsifiability

Finally, the entire apparatus is arranged so the model can be _wrong in public, by a measurable amount, on a fixed date_. The sealed predictions, the pre-committed scoring script, and the $plus.minus 3%$ target exist so that 3 June can disconfirm the forecast. A claim that cannot fail conveys no information; a forecast one cannot lose is not a forecast. This is the sense in which the work aspires to be science rather than commentary.

// ================= 11 LIMITATIONS =================
= Limitations and threats to validity

We collect the model's load-bearing assumptions, each with a risk rating and the consequence if it fails (Table @tab-ledger). Three deserve emphasis. The _phone-anchor assumption_ (high risk): the model trusts that the live-phone mode is unbiased, as it was in 2022; if the 2026 shy-conservative effect is larger, the Democratic share is overstated in every phone-led toss-up, and the realized seat count drifts toward the lower tail. The _input-quality assumption_ (high risk): the poll and fundamentals figures are approximate, and no amount of machinery repairs bad inputs. The _center-bias possibility_ (medium): several adjustments push in the Democratic direction, and if they all err together the median itself is too high — the $-3$-point column ($arrow.r$ 11 seats) is the honest expression of this. Beyond these, the full pipeline is not yet validated out of sample (Section 6), the turnout-dependent vote totals are the least certain numbers, and two races (울산, 전북) strain the two-way frame.

#figure(
  table(
    columns: (1.7fr, auto, 2fr),
    align: (left, center, left),
    stroke: 0.4pt + luma(200), inset: 5pt,
    table.header([*Assumption*], [*Risk*], [*Consequence if wrong*]),
    [Uniform national logit swing $s = 0.32$], [Med], [regions over/under-corrected vs a region-specific swing],
    [Single reference cycle (2022) for fundamentals], [Med], [one atypical year contaminates every structural prior],
    [Live-phone mode is the unbiased anchor], [*High*], [2026 shy-conservative $>$ 2022 $arrow.r$ Democratic share overstated everywhere],
    [Constant ARS offset $delta = +5$], [Med], [true house effect varies by region and pollster],
    [Flat turnout (nowcast) and $beta = 0.90$], [Med], [vote-count totals drift; $plus.minus 3%$ target at risk],
    [Gaussian nominal band vs heavy-tailed prob], [Low], [printed interval narrower than the win probability implies (by design)],
    [전북 independent counted as non-conservative], [Low], [seat call holds even if the independent wins],
    [울산 modeled two-way (ignores 3-way split)], [Med], [a progressive split or unification could flip the realized winner],
    [Approximate poll/fundamentals inputs], [*High*], [garbage-in: the machinery is only as good as its numbers],
  ),
  caption: [Assumptions ledger.],
) <tab-ledger>

// ================= 12 PRE-REGISTRATION =================
= Pre-registration and validation protocol

This document is version 1.0, compiled and sealed before the outcome. The validation is mechanical and fixed in advance, in three stages (Table @tab-protocol). Crucially, the point predictions of Table @tab-forecast are committed now and are _not_ re-tuned on 2 June; only turnout-dependent quantities update. On 3 June the realized result is entered and the pre-committed scoring script grades every claim.

#figure(
  table(
    columns: (auto, 1fr),
    align: (left, left), stroke: 0.4pt + luma(200), inset: 6pt,
    table.header([*Date / version*], [*Action*]),
    [2026-06-02 (v1.1)], [Enter the official early-vote (사전투표) turnout; re-run the nowcast @eq-turnout and the final forecast. Turnout-dependent totals update; the win probabilities and two-way shares of Table @tab-forecast are not re-tuned.],
    [2026-06-03 18:00 (v2.0)], [Polls close. Enter realized winners and shares; run the scoring script. Report winner accuracy (/16), two-way MAE, total-votes error, and the realized Brier @eq-brier against the $plus.minus 3%$ target. Drop the SEALED status; write the verdict.],
  ),
  caption: [The pre-registration timeline.],
) <tab-protocol>

#block(fill: luma(246), inset: 11pt, radius: 4pt, width: 100%)[
  #set par(first-line-indent: 0em)
  *Results (to be completed 2026-06-03).* #h(4pt) _Winner accuracy: — / 16.  Two-way share MAE: — pt.  Total-votes error: — %.  Brier score: — (no-skill 0.25; 2022 backtest 0.137).  Verdict: —._
]

// ================= 12.5 FUTURE WORK =================
= Future work

Several extensions would sharpen the model without altering its philosophy. The most important is a genuine _out-of-sample full-pipeline backtest_: with verified region-level fundamentals for 2018 and 2022, one could swing the 2018 baseline forward, blend it with the 2022 final polls, and score the full machinery — not merely its poll component — against the 2022 result, closing the validation gap acknowledged in Section 6. Second, the mode correction is currently a single constant; _pollster-level house effects_ estimated jointly across regions, in the manner of Jackman @jackman2005, would replace the coarse ARS offset with a learned per-house, per-mode adjustment, and a likely-voter screen would refine the turnout treatment. Third, where the model now uses a flat regional turnout, a _turnout model_ by region and age — ideally feeding a small _multilevel regression and poststratification_ layer @park2004 @gelmanhill2007 — would both improve the vote-count totals and enable sub-regional (구·군) estimates. Fourth, the stubbed ensemble hook should be connected to _prediction markets_ and expert panels, blending model and market in the proportions their respective track records justify. Finally, a _final-week re-run_ as fresh polls land would exploit the empirical fact that forecast accuracy rises sharply near election day; the present version deliberately freezes earlier, to honour the pre-registration, and treats the late polls as part of the post-hoc analysis rather than the sealed forecast.

// ================= 13 CONCLUSION =================
= Conclusion

We have presented a complete, reproducible, pre-registered forecast of the sixteen metropolitan-executive races of the 2026 Korean local elections. The model is an unglamorous member of the polls-plus-fundamentals family, and that is the point: its contribution is discipline rather than novelty — every parameter traced to a backtest or declared a prior, the dominant risk (correlated polling bias) isolated and quantified rather than hidden, a failed experiment (silicon sampling) retained rather than buried, and the whole pipeline seeded so there is one forecast to defend. The central estimate is 민주 12 of 16 seats with a 90% range of 8 to 15, contingent above all on whether the live-phone polls carry the same modest bias they did in 2022. On 3 June this claim becomes checkable, in public, by a fixed metric. The model's value is not that it is certain to be right — no model can promise that — but that it is honestly calibrated about how uncertain the election is, and that it has made that uncertainty cheap to verify.

#v(8pt)
#line(length: 100%, stroke: 0.4pt + luma(200))
#text(8.5pt)[*Data and code availability.* All code, versioned input data, figures, and the source of this paper are in the project repository, kept private until polls close on 2026-06-03 per §108. The forecast is a pure function of the checked-in data and the fixed seed and is reproducible with a single command.]

#text(8.5pt)[*Acknowledgements.* This is internal research of IOV Labs (아이오브연구소). The author thanks the open-source authors of Typst and `vhs`, used to typeset this paper and render its figures.]

#v(4pt)
#set text(8.6pt)
#bibliography("refs.bib", title: [References], style: "ieee")

// ================= APPENDICES =================
#pagebreak()
#counter(heading).update(0)
#set heading(numbering: "A.1")
#show heading.where(level: 1): it => block[#set text(12pt, weight: "bold"); Appendix #counter(heading).display("A") — #it.body]

= Mathematical derivations

#set text(9.5pt)

*A.1 Heavy-tail variance and kurtosis.* Let $epsilon$ be the two-component mixture of @eq-mix: $epsilon ~ cal(N)(0, sigma^2)$ with probability $1 - q$ and $epsilon ~ cal(N)(0, (k sigma)^2)$ with probability $q$, where $q = 0.12$ and $k = 2.4$. By the law of total variance, since both components have mean zero,
$ "Var"(epsilon) = (1 - q) sigma^2 + q k^2 sigma^2 = (1 + q(k^2 - 1)) sigma^2 = (1 + 0.12 dot 4.76) sigma^2 = 1.571 sigma^2, $
so the effective standard deviation is $sqrt(1.571) sigma approx 1.253 sigma$. The fourth moment of a zero-mean normal with variance $v$ is $3 v^2$, so
$ EE[epsilon^4] = 3 sigma^4 ((1 - q) + q k^4) = 3 sigma^4 (0.88 + 0.12 dot 33.18) = 3 sigma^4 dot 4.86, $
and the kurtosis is $EE[epsilon^4] \/ "Var"(epsilon)^2 = 3 dot 4.86 \/ 1.571^2 approx 5.9 > 3$. The mixture is thus leptokurtic, with tails heavier than the Gaussian of equal variance — the desired Student-$t$-like behaviour.

*A.2 Monte-Carlo standard error.* For $hat(p) = N^(-1) sum_i bb(1)[dot]$, the summands are Bernoulli($p$), so $"Var"(hat(p)) = p(1-p)\/N$ and $"SE"(hat(p)) = sqrt(p(1-p)\/N) <= 1\/(2 sqrt(N))$. At $N = 50{,}000$ this bound is $approx 0.00224$, i.e. $plus.minus 0.22$ percentage points, dominated by every other source of uncertainty in the model.

*A.3 Brier decomposition.* Grouping the $n = 16$ forecasts into bins $k$ by predicted probability, with $n_k$ forecasts in bin $k$, mean prediction $p_k$, observed frequency $overline(y)_k$, and overall base rate $overline(y)$, Murphy's decomposition @murphy1973 is
$ "BS" = underbrace(overline(y)(1 - overline(y)), "uncertainty") - underbrace(1/n sum_k n_k (overline(y)_k - overline(y))^2, "resolution") + underbrace(1/n sum_k n_k (p_k - overline(y)_k)^2, "reliability"). $
Uncertainty is a property of the event, not the forecast; resolution rewards separating high- from low-probability events; reliability (calibration) penalizes probabilities that do not match observed frequencies and is the term the model is built to minimize.

*A.4 The logit swing at the extremes.* Differentiating @eq-fund, $d phi \/ d s = 100 sigma'(op("logit")(f\/100) + s) = 100 sigma(dot)(1 - sigma(dot))$, which is maximized at $sigma = 0.5$ (a 50/50 region) and vanishes as $sigma arrow.r 0$ or $1$. Hence a fixed logit swing moves competitive regions most and strongholds least, quantifying the compression claimed in Section 5.2.

= Per-region input data

#set text(8.6pt)
The configured inputs (illustrative and approximate; verify against NEC/NESDC). Fundamentals $f_r$ are the 2022 two-way Democratic share; polls are raw $D \/ P$ by mode. 전남광주 fundamentals are the mean of the former 광주 and 전남.

#table(
  columns: (auto, auto, auto, 1fr),
  align: (left, left, right, left),
  stroke: 0.4pt + luma(200), inset: 4pt,
  table.header([*Region*], [*Cluster*], [*$f_r$*], [*Polls (mode $D$/$P$)*]),
  [서울], [수도권], [39.9], [ARS 48.8/41.4; phone 46/35; phone 41/37],
  [부산], [영남], [33.6], [phone 48/34; phone 46/37],
  [대구], [대경], [19.0], [phone 44/35; ARS 40/41],
  [인천], [수도권], [46.3], [phone 49/33],
  [대전], [충청], [48.8], [phone 51.4/37],
  [세종], [충청], [47.1], [phone 51.2/37.3],
  [경기], [수도권], [50.1], [phone 50.8/31.5; phone 54/27],
  [강원], [강원], [45.9], [mix 45.8/35.8],
  [충북], [충청], [41.8], [mix 45.4/40.8],
  [충남], [충청], [46.1], [phone 44/23; ARS 43.5/43.9],
  [전북], [호남], [84.0], [no polls (safe-D; vs independent 김관영)],
  [전남광주], [호남], [86.5], [no polls (safe-D)],
  [경북], [대경], [24.0], [no polls (safe-P)],
  [경남], [영남], [36.9], [phone 44/34; ARS 43.5/43.2],
  [울산], [영남], [40.1], [phone 37/34 (progressive 3rd candidate)],
  [제주], [제주], [56.6], [phone 63/20],
)

= Worked example: 서울 end to end

#set text(9.5pt)
Every number in the 서울 row of Table @tab-forecast, derived by hand.

*Inputs.* $f_"서울" = 39.9$; polls ARS 48.8/41.4, phone 46/35, phone 41/37.

*Fundamentals.* $phi = 100 sigma(op("logit")(0.399) + 0.32) = 100 sigma(-0.410 + 0.32) = 100 sigma(-0.090) = 47.76$.

*Polls.* Two-way shares $54.1, 56.8, 52.6$; after mode offsets ($+5$ for ARS, $0$ for phone) the adjusted values are $59.1, 56.8, 52.6$, with mean $pi = 56.15$.

*Blend.* With $n = 3 >= 2$, $w = 0.75$: $mu = 0.75 dot 56.15 + 0.25 dot 47.76 = 54.05$, the reported two-way share.

*Interval.* Nominal $sigma = sqrt(2.5^2 + 2.5^2 + 2.8^2) = 4.51$, so the 90% band is $54.05 plus.minus 1.64 dot 4.51 = [46.7, 61.5]$ (reported as 44–64 after the heavy-tail-aware rounding). The band straddles 50, so 서울 is a "lean," and the Monte-Carlo win probability is 73%, not a near-certainty.

*Counts.* Electorate $approx 8.30$ million $times$ turnout $0.535 times beta = 0.90 arrow.r approx 4.44$ million two-party votes, split $approx 2.16$ million Democratic to $approx 1.83$ million People Power.

= Algorithm

#set text(9pt)
```
Input:  fundamentals f[r], polls P[r], electorate E[r], turnout t[r],
        cluster c[r]; constants s, delta[], w[], sigma_nat, sigma_clu,
        sigma_loc(), beta; seed; N
seed RNG (mulberry32, 20260603)
for each region r:
    phi   = 100 * sigmoid(logit(f[r]/100) + s)        # fundamentals
    pi    = mean over polls j of (twoway(P[r][j]) + delta[mode_j])
    mu[r] = w(n_r) * pi + (1 - w(n_r)) * phi           # blended share
    sloc[r] = 2.8 + min(spread_r/2, 4) + kappa(n_r)
for i in 1..N:                                          # correlated MC
    e_nat = mix_normal(sigma_nat)
    for each cluster k: e_clu[k] = mix_normal(sigma_clu)
    for each region r:
        d = mu[r] + e_nat + e_clu[c[r]] + mix_normal(sloc[r])
        win[r] += (d > 50);  seats_i += (d > 50)
    record seats_i
p_hat[r]   = win[r] / N                                 # win probability
seat_dist  = histogram(seats_i)                         # median, 90% range
counts[r]  = E[r] * t[r] * beta * mu[r]/100             # vote totals
```
where `mix_normal(sigma)` returns a Box–Muller normal whose scale is `sigma` with probability 0.88 and `2.4*sigma` with probability 0.12.

= Glossary of Korean terms

#set text(9pt)
#table(
  columns: (auto, 1fr), align: (left, left), stroke: 0.4pt + luma(200), inset: 4pt,
  table.header([*Term*], [*Meaning*]),
  [광역단체장], [metropolitan executive: mayor of a metropolitan city or provincial governor (the offices forecast here)],
  [더불어민주당 (민주, D)], [Democratic Party; currently the ruling party (여당); center-left],
  [국민의힘 (국힘, P)], [People Power Party; the main conservative opposition],
  [전화면접 / ARS], [live telephone interview vs. automated-response (robocall) survey modes],
  [샤이보수], ["shy conservative": conservatives under-reporting to live interviewers; inflates apparent Democratic leads],
  [양자대결], [two-way race: Democratic vs. People Power, dropping minor candidates],
  [사전투표], [early voting (the two-day advance vote); basis of the turnout nowcast],
  [단일화], [candidate unification: same-bloc candidates merging to avoid splitting the vote (a 울산 variable)],
  [선거인수], [size of the eligible electorate],
  [공직선거법 §108], [Public Official Election Act, Article 108: bans publishing forecasts during the pre-election blackout],
)
