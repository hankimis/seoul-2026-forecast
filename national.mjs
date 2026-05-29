// National roll-up, v2 (bias-corrected, uncertainty-widened, correlated swing).
// Fixes from the self-audit:
//  - sigma 3.2 -> 4.5 (two-way) to capture systematic + correlated polling error
//  - win prob capped to [5%, 95%] (no 100% certainties)
//  - conservative-region adjustment: 영남(부산·대구·울산·경남)·경북·강원 D two-way -3.0pt,
//    충청(충북·충남) -1.0pt (documented Korean poll underestimate of conservatives / 샤이보수)
//  - national correlated swing: each Monte-Carlo draw shares a common D-swing term,
//    so the SEAT total has realistic (wide) uncertainty, not artificially tight.
//   node national.mjs
import { readFileSync } from "node:fs";
const d = JSON.parse(readFileSync(new URL("./data/national-2026.json", import.meta.url)));
const SIM = 50000, SIG_LOCAL = 3.2, SIG_NATIONAL = 3.0; // local idiosyncratic + shared national error
const CONS = { 부산: 3, 대구: 3, 울산: 3, 경남: 3, 경북: 3, 강원: 3, 충북: 1, 충남: 1 }; // D two-way penalty
const z = () => Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
const cap = (p) => Math.max(0.05, Math.min(0.95, p));

// adjusted two-way D for poll regions; tier regions keep a nominal mean two-way from tier_dwin
const tierMeanTwo = { safe_D: 62, lean_D: 55, tossup_D: 51.5, tossup_P: 48, lean_P: 45, safe_P: 36 };
const rows = d.regions.map((r) => {
  let twD;
  // conservative correction applies to RAW polls only; tiers already encode partisanship.
  if (r.poll) twD = 100 * r.poll.D / (r.poll.D + r.poll.P) - (CONS[r.region] || 0);
  else twD = tierMeanTwo[r.tier] ?? 50;
  return { ...r, twD: +twD.toFixed(1), basis: r.poll ? "poll" : "tier:" + r.tier };
});

// Monte Carlo with a shared national swing each draw (correlated error)
const wins = rows.map(() => 0);
let dSeats = [];
for (let i = 0; i < SIM; i++) {
  const nat = z() * SIG_NATIONAL; // common swing this election
  let s = 0;
  rows.forEach((r, k) => { const draw = r.twD + nat + z() * SIG_LOCAL; if (draw > 50) { wins[k]++; s++; } });
  dSeats.push(s);
}
dSeats.sort((a, b) => a - b);
rows.forEach((r, k) => { r.dwin = cap(wins[k] / SIM); });
rows.sort((a, b) => b.dwin - a.dwin);

const win = (r) => r.dwin >= 0.5 ? "민주" : "국힘";
const lab = (r) => { const p = Math.max(r.dwin, 1 - r.dwin); return p >= 0.85 ? "안정" : p >= 0.65 ? "우세" : "경합"; };
const f = (x) => x == null ? "  -  " : (x + "%").padStart(5);
console.log("\n2026 광역단체장 17 — v2 (보정·보수 조정·상관오차)\n");
console.log("지역  매치업                     양자D*  당선예측  D승리   판정  근거");
console.log("-".repeat(78));
for (const r of rows) {
  console.log(`${r.region.padEnd(3)} ${(`${r.D} vs ${r.P}`).padEnd(24)} ${f(r.twD)}  ${win(r).padEnd(4)}  ${String(Math.round(r.dwin*100)).padStart(3)}%  ${lab(r).padEnd(4)} ${r.basis}`);
}
const callD = rows.filter((r) => r.dwin >= 0.5).length;
console.log("-".repeat(78));
console.log(`예상 민주 의석 중앙값 ${dSeats[Math.floor(SIM*0.5)]} (90% 범위 ${dSeats[Math.floor(SIM*0.05)]}~${dSeats[Math.floor(SIM*0.95)]}) / 17  ·  현재 우세 카운트: 민주 ${callD}·국힘 ${17-callD}`);
console.log("경합(판정=경합):", rows.filter((r)=>Math.max(r.dwin,1-r.dwin)<0.65).map((r)=>r.region).join(", "));
console.log("* 양자D는 보수지역 보정(영남·강원 -3, 충청 -1) 반영치. 폴 11곳 실측·6곳 분류.");
