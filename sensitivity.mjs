// sensitivity.mjs — tornado: how the 민주 seat call moves as each lever is perturbed.
// Re-runs the deterministic seat call (finalD>50) under one-at-a-time parameter shifts.
// node sensitivity.mjs
import { readFileSync } from "node:fs";
const base = (p) => new URL(`./${p}`, import.meta.url);
const nat = JSON.parse(readFileSync(base("data/national-2026.json")));
const fund = JSON.parse(readFileSync(base("data/results-2022.json")));
const C = { B:"\x1b[36m", R:"\x1b[31m", Y:"\x1b[33m", G:"\x1b[32m", D:"\x1b[2m", b:"\x1b[1m", X:"\x1b[0m" };
const logit=(p)=>Math.log(p/(1-p)), inv=(x)=>1/(1+Math.exp(-x));
const tw=(D,P)=>100*D/(D+P);
const fund2022=(r)=> r==="전남광주" ? (fund.regions["광주"].d_twoway+fund.regions["전남"].d_twoway)/2 : fund.regions[r]?.d_twoway;

// recompute the deterministic 민주 seat count (finalD>50) under overrides
function seats({swing=0.32, ars=5, mix=2, w2=0.75, w1=0.58, bias=0}={}) {
  const ADJ={phone:0, ars, mix, unknown:0};
  let c=0;
  for (const r of nat.regions) {
    const f=fund2022(r.region);
    const fundD = f==null?null:inv(logit(f/100)+swing)*100;
    let pollD=null, n=(r.polls||[]).length;
    if (n){ const norm=r.polls.map(p=>tw(p.D,p.P)+(ADJ[p.m]??0)); pollD=norm.reduce((a,b)=>a+b,0)/n; }
    const wPoll = n>=2?w2:n===1?w1:0;
    let finalD = pollD!=null&&fundD!=null ? wPoll*pollD+(1-wPoll)*fundD : pollD??fundD;
    finalD += bias;
    if (finalD>50) c++;
  }
  return c;
}

const baseSeats = seats();
const levers = [
  {name:"전국 폴편향",       lo:{bias:-3}, hi:{bias:+3}, loL:"−3pt", hiL:"+3pt"},
  {name:"스윙 s",            lo:{swing:0.17}, hi:{swing:0.47}, loL:"0.17", hiL:"0.47"},
  {name:"ARS 보정 δ",        lo:{ars:0}, hi:{ars:10}, loL:"+0", hiL:"+10"},
  {name:"폴 가중 w(≥2)",     lo:{w2:0.6}, hi:{w2:0.9}, loL:"0.60", hiL:"0.90"},
  {name:"방식보정 OFF",      lo:{ars:0,mix:0}, hi:{}, loL:"무보정", hiL:"기준"},
];

console.log(`\n${C.b}민감도 토네이도 — 레버별 민주 우세지역 수 변화${C.X} ${C.D}(기준 ${baseSeats}석, deterministic finalD>50)${C.X}\n`);
const rows = levers.map(L=>{ const lo=seats(L.lo), hi=seats(L.hi); return {...L, lo, hi, span:Math.abs(hi-lo)}; });
rows.sort((a,b)=>b.span-a.span);
const SC=14, W=44; // axis center at baseSeats; map seats→col
const colAt=(s)=>Math.round((s-(baseSeats-7))/14*W);
console.log(`${C.D}     ${baseSeats-7}석            ${baseSeats}석(기준)            ${baseSeats+7}석${C.X}`);
console.log(`${C.D}     └──────────────────┼──────────────────┘${C.X}`);
for (const r of rows) {
  const a=Math.max(0,Math.min(W,colAt(r.lo))), b=Math.max(0,Math.min(W,colAt(r.hi))), mid=colAt(baseSeats);
  let bar="";
  for(let i=0;i<=W;i++){
    if(i===Math.min(a,b)) bar += `${C.R}▐${C.X}`;
    else if(i===Math.max(a,b)) bar += `${C.B}▌${C.X}`;
    else if(i>Math.min(a,b)&&i<Math.max(a,b)) bar += `${C.Y}█${C.X}`;
    else if(i===mid) bar += `${C.D}┊${C.X}`;
    else bar += " ";
  }
  console.log(`${r.name.padEnd(11)} ${bar} ${C.R}${String(r.lo).padStart(2)}${C.X}↔${C.B}${String(r.hi).padStart(2)}${C.X} ${C.D}(${r.loL}↔${r.hiL})${C.X}`);
}
console.log(`\n${C.D}▐ 하한값  █ 변동폭  ▌ 상한값  ┊ 기준 ${baseSeats}석. 위에서부터 영향 큰 레버.${C.X}`);
console.log(`${C.Y}전국 폴편향이 압도적 — 즉 가장 큰 리스크는 모델 내부가 아니라 여론조사 자체의 상관 오차.${C.X}\n`);
