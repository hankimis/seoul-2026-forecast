// method-viz.mjs — ARS vs phone two-way divergence per region (for docs/method.gif).
// Illustrates the single biggest hidden bias the model corrects. node method-viz.mjs
import { readFileSync } from "node:fs";
const base = (p) => new URL(`./${p}`, import.meta.url);
const nat = JSON.parse(readFileSync(base("data/national-2026.json")));
const ADJ = nat.config.method_twoway_adj;
const C = { B:"\x1b[36m", R:"\x1b[31m", Y:"\x1b[33m", G:"\x1b[32m", D:"\x1b[2m", b:"\x1b[1m", X:"\x1b[0m" };
const tw = (p)=>100*p.D/(p.D+p.P);
const mean = (a)=>a.reduce((s,x)=>s+x,0)/a.length;

// regions with BOTH phone and ars polls → the cleanest method-gap evidence
const rows = [];
for (const r of nat.regions) {
  if (!r.polls) continue;
  const ph = r.polls.filter(p=>p.m==="phone").map(tw);
  const ar = r.polls.filter(p=>p.m==="ars").map(tw);
  if (ph.length && ar.length) rows.push({ region:r.region, phone:mean(ph), ars:mean(ar) });
}
rows.sort((a,b)=>(b.phone-b.ars)-(a.phone-a.ars));

console.log(`\n${C.b}방식 편향: 전화면접(phone) vs 자동응답(ARS) — 양자 민주%${C.X} ${C.D}(같은 지역, 같은 시기, 다른 방식)${C.X}\n`);
console.log(`${C.D}        40        45        50        55        60        65        70${C.X}`);
const lo = 38, hi = 70, W = 60;
const pos = (x)=>Math.max(0,Math.min(W,Math.round((x-lo)/(hi-lo)*W)));
for (const r of rows) {
  const a = pos(r.ars), p = pos(r.phone), tie = pos(50);
  let bar = "";
  for (let i=0;i<=W;i++){
    if (i===a && i===p) bar += `${C.Y}◆${C.X}`;
    else if (i===a) bar += `${C.R}▲${C.X}`;       // ARS (tighter, 샤이보수)
    else if (i===p) bar += `${C.B}●${C.X}`;       // phone (bigger D lead, ~accurate in 2022)
    else if (i===tie) bar += `${C.Y}┊${C.X}`;     // 50% gridline always visible
    else if (i>Math.min(a,p) && i<Math.max(a,p)) bar += `${C.D}─${C.X}`;
    else bar += " ";
  }
  const gap = r.phone - r.ars;
  console.log(`${r.region.padEnd(4)} ${bar} ${C.D}격차${C.X} ${gap>=8?C.R:C.Y}${gap.toFixed(1)}pt${C.X}`);
}
console.log(`\n${C.B}● phone${C.X} ${C.D}(전화면접 — 2022 백테스트상 ~무편향, 모델의 기준)${C.X}`);
console.log(`${C.R}▲ ARS${C.X} ${C.D}(자동응답 — 접전 과대, 샤이보수/고관여 응답 편중)${C.X}`);
console.log(`${C.Y}┊${C.X} ${C.D}50% 동률선   →  모델은 ARS를 phone 쪽으로 +${ADJ.ars}pt 보정한다${C.X}\n`);
