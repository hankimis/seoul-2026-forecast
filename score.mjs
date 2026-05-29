// Grade the forecast once results are in (target: within ±3%). Reads
// forecast-national.json + data/results-2026-actual.json (total_man, D_pct, P_pct).
// Reports: vote-share MAE, total-votes %error, two-way error, winner accuracy,
// Brier, and how many regions land within ±3.  node score.mjs  (after 06-03)
import { readFileSync } from "node:fs";
const base = (p) => new URL(`./${p}`, import.meta.url);
const fc = JSON.parse(readFileSync(base("forecast-national.json")));
const act = JSON.parse(readFileSync(base("data/results-2026-actual.json"))).regions;
const TOL = 3;

const rows = fc.map((r) => {
  const a = act[r.region]; if (!a || a.D_pct == null) return null;
  const twoActual = 100 * a.D_pct / (a.D_pct + a.P_pct);
  const shareErrD = Math.abs(r.raw_share_pct.D - a.D_pct);
  const shareErrP = Math.abs(r.raw_share_pct.P - a.P_pct);
  const twoErr = Math.abs(r.predicted_twoway_D - twoActual);
  const totErrPct = (a.total_man && r.total_votes_man) ? 100 * Math.abs(r.total_votes_man - a.total_man) / a.total_man : null;
  const dWon = twoActual > 50, winnerHit = (r.winner === "민주") === dWon;
  const brier = (r.dwin - (dWon ? 1 : 0)) ** 2;
  return { region: r.region, predD: r.raw_share_pct.D, actD: a.D_pct, predP: r.raw_share_pct.P, actP: a.P_pct,
           shareErr: +Math.max(shareErrD, shareErrP).toFixed(1), twoErr: +twoErr.toFixed(1),
           totErrPct: totErrPct == null ? null : +totErrPct.toFixed(1), winnerHit, brier: +brier.toFixed(3) };
}).filter(Boolean);

if (!rows.length) { console.log("결과 미입력. 6/3 후 data/results-2026-actual.json(total_man, D_pct, P_pct) 채우면 채점됩니다."); process.exit(0); }
console.log("\n채점: 예측 vs 실제 (목표 ±3%)\n");
console.log("지역      민주%(예측/실제)  국힘%(예측/실제)  득표율오차  총투표오차  당선");
console.log("-".repeat(76));
for (const s of rows) console.log(`${s.region.padEnd(5)} ${String(s.predD).padStart(5)}/${String(s.actD).padEnd(5)}  ${String(s.predP).padStart(5)}/${String(s.actP).padEnd(5)}  ${(String(s.shareErr)+"pt").padStart(7)}${s.shareErr<=TOL?" ✓":" ✗"}  ${s.totErrPct==null?"   -":((s.totErrPct+"%").padStart(6)+(s.totErrPct<=TOL?" ✓":" ✗"))}  ${s.winnerHit?"O":"X"}`);
const mae = rows.reduce((a,s)=>a+s.shareErr,0)/rows.length;
const twoMae = rows.reduce((a,s)=>a+s.twoErr,0)/rows.length;
const tots = rows.filter(s=>s.totErrPct!=null);
const totMae = tots.length ? tots.reduce((a,s)=>a+s.totErrPct,0)/tots.length : null;
const hit = rows.filter(s=>s.winnerHit).length, brier = rows.reduce((a,s)=>a+s.brier,0)/rows.length;
const within3 = rows.filter(s=>s.shareErr<=TOL).length, totWithin3 = tots.filter(s=>s.totErrPct<=TOL).length;
console.log("-".repeat(76));
console.log(`득표율 MAE ${mae.toFixed(2)}pt (±3 이내 ${within3}/${rows.length}) · 양자 MAE ${twoMae.toFixed(2)}pt · 총투표 MAE ${totMae==null?"-":totMae.toFixed(1)+"%"} (±3 이내 ${totWithin3}/${tots.length})`);
console.log(`당선 적중 ${hit}/${rows.length} (${Math.round(100*hit/rows.length)}%) · Brier ${brier.toFixed(4)} (무지=0.25)`);
