// Visualize the seat-count probability distribution + scenario ladder + national
// vote split, from forecast-meta.json (written by national.mjs).  node dist.mjs
import { readFileSync } from "node:fs";
const m = JSON.parse(readFileSync(new URL("./forecast-meta.json", import.meta.url)));
const C = {B:"\x1b[36m",R:"\x1b[31m",Y:"\x1b[33m",G:"\x1b[32m",D:"\x1b[2m",b:"\x1b[1m",X:"\x1b[0m"};
const max = Math.max(...m.seat_pct);

console.log(`\n${C.b}민주 광역단체장 의석 확률분포${C.X} ${C.D}(${m.total}석 중 · 5만회 시뮬)${C.X}\n`);
m.seat_pct.forEach((pct, k) => {
  if (pct < 0.3 && (k < m.p90[0]-1 || k > m.p90[1]+1)) return;
  const bar = "█".repeat(Math.round(pct/max*44));
  const inCI = k >= m.p90[0] && k <= m.p90[1];
  const cc = k === m.median ? C.G : inCI ? C.B : C.D;
  const tag = k === m.median ? " ← 중앙값" : "";
  console.log(`${String(k).padStart(2)}석 ${cc}${bar.padEnd(44)} ${pct.toFixed(1).padStart(4)}%${C.X}${C.G}${tag}${C.X}`);
});
console.log(`${C.D}   ${"·".repeat(44)} (■=90% 구간 ${m.p90[0]}~${m.p90[1]}석)${C.X}`);

console.log(`\n${C.b}시나리오 확률 (민주 의석)${C.X}`);
const ladder = [["민주 ≥ 9", null],["민주 ≥ 10", m.scenarios.ge10],["민주 ≥ 12", m.scenarios.ge12],["국힘 ≥ 5", m.scenarios.kop_ge5],["경합 5곳 싹쓸이", m.scenarios.sweep5]];
const cum = (k)=> m.seat_pct.slice(k).reduce((a,b)=>a+b,0);
for (const [label, v] of ladder) {
  const val = v ?? +cum(9).toFixed(0);
  const bar = "▓".repeat(Math.round(val/100*30));
  console.log(`${label.padEnd(14)} ${C.B}${bar.padEnd(30)}${C.X} ${String(Math.round(val)).padStart(3)}%`);
}

console.log(`\n${C.b}전국 양당 예측 득표 (만 표)${C.X}`);
const tot = m.votes_man.D + m.votes_man.P, dlen = Math.round(m.votes_man.D/tot*48);
console.log(`민주 ${C.B}${"█".repeat(dlen)}${C.X}${C.R}${"█".repeat(48-dlen)}${C.X} 국힘`);
console.log(`     ${C.B}${m.votes_man.D}만 (${(100*m.votes_man.D/tot).toFixed(1)}%)${C.X}  vs  ${C.R}${m.votes_man.P}만 (${(100*m.votes_man.P/tot).toFixed(1)}%)${C.X}`);
console.log(`\n${C.D}민주 중앙값 ${m.median}석 · 90% ${m.p90[0]}~${m.p90[1]}석 · P(민주 과반 9석↑)=${cum(9).toFixed(0)}%${C.X}`);
