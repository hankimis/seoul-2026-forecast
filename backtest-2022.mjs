// Backtest: 2022 FINAL phone polls vs the actual 2022 result. Measures the
// poll's signed bias, MAE, winner accuracy, and Brier -> empirically calibrates
// the method correction and σ used by national.mjs.  node backtest-2022.mjs
import { readFileSync } from "node:fs";
const base = (p) => new URL(`./${p}`, import.meta.url);
const pj = JSON.parse(readFileSync(base("data/polls-2022-final.json")));
const fund = JSON.parse(readFileSync(base("data/results-2022.json"))).regions;
const tw = (D, P) => 100 * D / (D + P);
const logistic = (x, s) => 1 / (1 + Math.exp(-x / s));

const rows = Object.entries(pj.polls).map(([r, p]) => {
  const pollD = tw(p.D, p.P), actualD = fund[r].d_twoway;
  const err = pollD - actualD;                       // signed (poll minus actual)
  const dwin = logistic(pollD - 50, 3);              // win prob from poll margin (σ=3)
  const dWon = actualD > 50, predD = pollD > 50;
  return { r, pollD: +pollD.toFixed(1), actualD, err: +err.toFixed(1), dwin: +dwin.toFixed(2), hit: predD === dWon, brier: +((dwin - (dWon ? 1 : 0)) ** 2).toFixed(3) };
});
const n = rows.length;
const bias = rows.reduce((s, x) => s + x.err, 0) / n;
const mae = rows.reduce((s, x) => s + Math.abs(x.err), 0) / n;
const sd = Math.sqrt(rows.reduce((s, x) => s + (x.err - bias) ** 2, 0) / n);
const hit = rows.filter((x) => x.hit).length, brier = rows.reduce((s, x) => s + x.brier, 0) / n;

console.log(`\n2022 backtest — final phone polls vs actual (n=${n})\n`);
console.log("지역  폴D   실제D  오차  민주승확률  적중");
console.log("-".repeat(46));
for (const x of rows) console.log(`${x.r.padEnd(4)} ${String(x.pollD).padStart(5)} ${String(x.actualD).padStart(5)} ${String(x.err).padStart(5)}  ${String(Math.round(x.dwin*100)).padStart(8)}%  ${x.hit?"O":"X"}`);
console.log("-".repeat(46));
console.log(`평균편향 ${bias.toFixed(2)}pt · MAE ${mae.toFixed(2)}pt · 표준편차 ${sd.toFixed(2)} · 당선적중 ${hit}/${n} · Brier ${brier.toFixed(3)}`);
console.log(`=> 전화조사는 사실상 무편향(${bias.toFixed(1)}), MAE~${mae.toFixed(1)}pt → σ_local≈${(sd*1.0).toFixed(1)} 권장. ARS는 전화 기준으로 D쪽 보정.`);
