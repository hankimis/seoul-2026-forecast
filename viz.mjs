// viz.mjs — per-region win-probability + 90% two-way interval chart (for docs/probs.gif).
// Pure read of forecast-national.json; no recompute. node viz.mjs
import { readFileSync } from "node:fs";
const base = (p) => new URL(`./${p}`, import.meta.url);
const rows = JSON.parse(readFileSync(base("forecast-national.json")));
const C = { B:"\x1b[36m", R:"\x1b[31m", Y:"\x1b[33m", G:"\x1b[32m", D:"\x1b[2m", b:"\x1b[1m", X:"\x1b[0m" };

rows.sort((a,b)=>b.dwin-a.dwin);
console.log(`\n${C.b}2026 광역단체장 — 지역별 민주 승리확률 & 양자 90% 구간${C.X} ${C.D}(v8, 50k MC)${C.X}\n`);
console.log(`${C.D}        0%        25%        50%        75%       100%   양자D[90%구간]   확률${C.X}`);
console.log(`${C.D}        └─────────┴─────────┼─────────┴─────────┘${C.X}`);

const W = 40;                       // bar width in chars (0..100%)
const pos = (x)=>Math.max(0,Math.min(W,Math.round(x/100*W)));
for (const r of rows) {
  const p = Math.round(r.dwin*100);
  const col = r.dwin>=0.5 ? C.B : C.R;
  const lab = Math.max(r.dwin,1-r.dwin) >= 0.85 ? "안정" : Math.max(r.dwin,1-r.dwin) >= 0.65 ? "우세" : "경합";
  // interval bar from ci90 lo..hi on the two-way axis, with a marker at finalD and a 50% gridline
  const lo = pos(r.ci90[0]), hi = pos(r.ci90[1]), mid = pos(r.predicted_twoway_D), tie = pos(50);
  let bar = "";
  for (let i=0;i<=W;i++){
    if (i===mid) bar += `${col}●${C.X}`;
    else if (i===tie) bar += `${C.Y}│${C.X}`;
    else if (i>=lo && i<=hi) bar += `${col}━${C.X}`;
    else bar += `${C.D}·${C.X}`;
  }
  const tag = lab==="경합" ? C.Y : col;
  console.log(`${r.region.padEnd(5)} ${bar} ${col}${String(r.predicted_twoway_D.toFixed(1)).padStart(5)}%[${r.ci90[0].toFixed(0)}~${r.ci90[1].toFixed(0)}]${C.X} ${col}${String(p).padStart(3)}%${C.X} ${tag}${lab}${C.X}`);
}
console.log(`\n${C.D}● 중심추정(예측D)  ━ 90% 구간  ${C.Y}│${C.X}${C.D} 50% 동률선  ·  점선=구간 밖${C.X}`);
console.log(`${C.B}■ 민주 우세${C.X}  ${C.R}■ 국힘 우세${C.X}  ${C.Y}■ 경합(<65%)${C.X}\n`);
