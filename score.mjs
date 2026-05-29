// Grade the forecast once results are in. Reads forecast-national.json (predicted
// two-way D + win prob) and data/results-2026-actual.json (actual two-way). Reports
// vote-share MAE, winner accuracy, and Brier score. Run after 06-03.
//   node score.mjs
import { readFileSync } from "node:fs";
const base = (p) => new URL(`./${p}`, import.meta.url);
const fc = JSON.parse(readFileSync(base("forecast-national.json")));
const act = JSON.parse(readFileSync(base("data/results-2026-actual.json"))).regions;
const tw = (D,P) => 100*D/(D+P);

const scored = fc.map((r) => {
  const a = act[r.region]; if (!a || a.D == null) return null;
  const actualD = tw(a.D, a.P);
  const err = Math.abs(r.predicted_twoway_D - actualD);
  const dWon = actualD > 50;
  const winnerHit = (r.winner === "민주") === dWon;
  const brier = (r.dwin - (dWon ? 1 : 0)) ** 2;
  return { region: r.region, pred: r.predicted_twoway_D, actual: +actualD.toFixed(1), err: +err.toFixed(1), dwin: r.dwin, dWon, winnerHit, brier: +brier.toFixed(3) };
}).filter(Boolean);

if (!scored.length) { console.log("결과 미입력. 6/3 18시 후 data/results-2026-actual.json 채우면 채점됩니다."); process.exit(0); }
console.log("\n채점: 예측 vs 실제 (양자 민주 득표율)\n");
console.log("지역      예측D  실제D  오차  민주승확률  당선적중");
console.log("-".repeat(58));
for (const s of scored) console.log(`${s.region.padEnd(5)} ${String(s.pred).padStart(6)} ${String(s.actual).padStart(6)} ${String(s.err).padStart(5)}  ${String(Math.round(s.dwin*100)).padStart(8)}%  ${s.winnerHit?"O":"X"}`);
const mae = scored.reduce((a,s)=>a+s.err,0)/scored.length;
const hit = scored.filter(s=>s.winnerHit).length;
const brier = scored.reduce((a,s)=>a+s.brier,0)/scored.length;
console.log("-".repeat(58));
console.log(`득표율 MAE: ${mae.toFixed(2)}pt · 당선 적중: ${hit}/${scored.length} · Brier: ${brier.toFixed(4)} (낮을수록 좋음, 무지=0.25)`);
