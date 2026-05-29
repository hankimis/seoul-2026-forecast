// National roll-up for the 17 metropolitan races. Poll regions: two-way D share
// + Monte-Carlo win prob (sigma = historical two-way polling error ~3.2pt).
// Classified regions: nominal D-win prob by tier. Prints a table + seat tally.
//   node national.mjs
import { readFileSync } from "node:fs";
const d = JSON.parse(readFileSync(new URL("./data/national-2026.json", import.meta.url)));
const SIM = 50000, SIGMA = 3.2;
const z = () => Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());

function winFromPoll(p) {
  const tw = 100 * p.D / (p.D + p.P); // two-way D
  let w = 0; for (let i = 0; i < SIM; i++) if (tw + z() * SIGMA > 50) w++;
  return { twD: +tw.toFixed(1), dwin: +(w / SIM).toFixed(2) };
}

const rows = d.regions.map((r) => {
  if (r.poll) { const { twD, dwin } = winFromPoll(r.poll); return { ...r, twD, dwin, basis: "poll" }; }
  return { ...r, twD: null, dwin: d.tier_dwin[r.tier] ?? 0.5, basis: "tier:" + r.tier };
});
rows.sort((a, b) => b.dwin - a.dwin);

const f = (x) => x == null ? "  -  " : (x + "%").padStart(5);
console.log("\n2026 광역단체장 17 — 폴 앵커 예측 (D=민주, P=국힘)\n");
console.log("지역   매치업                     양자D   D승리확률  근거");
console.log("-".repeat(74));
for (const r of rows) {
  const match = `${r.D} vs ${r.P}`.padEnd(24);
  const bar = "■".repeat(Math.round(r.dwin * 10)).padEnd(10, "·");
  console.log(`${r.region.padEnd(4)} ${match} ${f(r.twD)}  ${String(Math.round(r.dwin * 100)).padStart(3)}% ${bar} ${r.basis}`);
}
const expD = rows.reduce((s, r) => s + r.dwin, 0);
const callD = rows.filter((r) => r.dwin >= 0.5).length;
const tossup = rows.filter((r) => r.dwin > 0.4 && r.dwin < 0.6).length;
console.log("-".repeat(74));
console.log(`예상 민주 의석(확률합): ${expD.toFixed(1)} / 17   ·   우세지역 카운트(>50%): 민주 ${callD}, 국힘 ${17 - callD}   ·   초경합(40~60%): ${tossup}곳`);
console.log("\n경합지(40~60%):", rows.filter((r) => r.dwin > 0.4 && r.dwin < 0.6).map((r) => r.region).join(", "));
console.log("주의: 폴 11곳은 실측, 6곳은 성향+2026 여당파동 분류(라벨 tier). 부산 '샤이보수', 울산 단일화 변수 등 미반영.");
