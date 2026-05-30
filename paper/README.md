# Paper — English preprint

A pre-registered research-paper rendering of the forecast, built with [Typst](https://typst.app).

- **`paper.typ`** — source · **`refs.bib`** — references · **`figs/`** — static figures (extracted from the model's GIFs) · **`paper.pdf`** — output.

## Build

```bash
typst compile paper.typ paper.pdf      # source only
./build.sh                             # full: refresh model → re-render GIFs → extract figs → compile
```

Requires `typst` (`brew install typst`); `build.sh` additionally uses `node`, `vhs`, `ffmpeg`. Korean glyphs render via the `AppleMyungjo` fallback set in `paper.typ`.

## Update schedule (pre-registration → validation)

The paper is versioned so the prediction is sealed *before* the outcome and graded *after*:

| version | when | change |
|---|---|---|
| **1.0** | now | pre-registration: forecast + methods committed, results blank, `SEALED` badge |
| **1.1** | 2026-06-02 | fill official early-vote (사전투표) turnout → re-run nowcast → turnout-dependent totals update. **Point predictions are NOT re-tuned.** |
| **2.0** | 2026-06-03 18:00 | polls close → fill `data/results-2026-actual.json` → `node score.mjs` → paste winner accuracy / MAE / total-votes error / Brier into the results block; bump version, drop the `SEALED` badge, write the verdict. |

To update: edit the version line and the `Results (to be completed …)` block in `paper.typ`, then `./build.sh`.
