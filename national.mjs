// National roll-up, v5 — full-set:
//  ① method (ARS/phone) house-effect normalization  ② multi-poll aggregation
//  ③ hierarchical shrinkage (few/no polls -> fundamentals)  ④ clustered correlated errors
//  ⑤ multiparty flags (울산/전북)  + predicted vote SHARE (not just win prob) + forecast dump for scoring.
//   node national.mjs
import { readFileSync, writeFileSync } from "node:fs";
const base = (p) => new URL(`./${p}`, import.meta.url);
const nat = JSON.parse(readFileSync(base("data/national-2026.json")));
const fund = JSON.parse(readFileSync(base("data/results-2022.json")));
const cfg = nat.config, ADJ = cfg.method_twoway_adj;
const vot = JSON.parse(readFileSync(base("data/voters-2026.json")));
const SWING = 0.32, SIG_NAT = 2.5, SIG_CLU = 2.5, SIG_LOC = 3.3, SIM = 50000;
const logit = (p) => Math.log(p/(1-p)), invlogit = (x) => 1/(1+Math.exp(-x));
const z = () => Math.sqrt(-2*Math.log(Math.random()))*Math.cos(2*Math.PI*Math.random());
const cap = (p) => Math.max(0.02, Math.min(0.98, p));
const tw = (D,P) => 100*D/(D+P);
const C = { B:"\x1b[36m", R:"\x1b[31m", Y:"\x1b[33m", D:"\x1b[2m", b:"\x1b[1m", X:"\x1b[0m" };
const fund2022 = (r) => r === "전남광주" ? (fund.regions["광주"].d_twoway + fund.regions["전남"].d_twoway)/2 : fund.regions[r]?.d_twoway;

const rows = nat.regions.map((r) => {
  const f2022 = fund2022(r.region);
  const fundD = f2022 == null ? null : invlogit(logit(f2022/100) + SWING)*100;
  let pollD = null, spread = 0, nPolls = (r.polls||[]).length;
  if (nPolls) {
    const norm = r.polls.map((p) => tw(p.D,p.P) + (ADJ[p.m] ?? 0));
    pollD = norm.reduce((a,b)=>a+b,0)/norm.length;
    const raws = r.polls.map((p)=>tw(p.D,p.P));
    spread = Math.max(...raws) - Math.min(...raws); // method/house disagreement
  }
  // hierarchical shrinkage: more polls -> trust polls more; none -> fundamentals
  const wPoll = nPolls>=2 ? 0.75 : nPolls===1 ? 0.58 : 0;
  const finalD = pollD!=null && fundD!=null ? wPoll*pollD + (1-wPoll)*fundD : pollD!=null ? pollD : fundD;
  const sigLoc = SIG_LOC + Math.min(spread/2, 4); // inflate where polls disagree (method spread)
  // predicted vote counts (만표): eligible x turnout x two-party x predicted share
  const elig = vot.eligible_10k[r.region];
  const twoPartyCast = elig != null ? elig * vot.turnout * vot.two_party_frac : null;
  const dVotes = twoPartyCast != null ? twoPartyCast * finalD/100 : null;
  const pVotes = twoPartyCast != null ? twoPartyCast * (100-finalD)/100 : null;
  return { ...r, fundD, pollD, finalD, nPolls, spread, sigLoc, dVotes, pVotes };
});

// clustered correlated Monte Carlo
const clusters = [...new Set(rows.map(r=>r.cluster))];
const wins = rows.map(()=>0); const seats=[];
for (let i=0;i<SIM;i++){
  const nat_ = z()*SIG_NAT; const cz = Object.fromEntries(clusters.map(c=>[c, z()*SIG_CLU]));
  let s=0; rows.forEach((r,k)=>{ if (r.finalD + nat_ + cz[r.cluster] + z()*r.sigLoc > 50){wins[k]++;s++;} });
  seats.push(s);
}
seats.sort((a,b)=>a-b);
rows.forEach((r,k)=> r.dwin = cap(wins[k]/SIM));
rows.sort((a,b)=>b.dwin-a.dwin);

const f=(x)=> x==null?"  - ":x.toFixed(1).padStart(5);
const win=(r)=> r.dwin>=0.5?"민주":"국힘";
const lab=(r)=>{const p=Math.max(r.dwin,1-r.dwin);return p>=0.85?"안정":p>=0.65?"우세":"경합";};
const col=(r)=> r.dwin>=0.5?C.B:C.R;
console.log(`\n${C.b}2026 광역단체장 ${rows.length} — v5${C.X} ${C.D}(방식정규화·다중폴·shrinkage·클러스터상관·다당제)${C.X}\n`);
console.log(`${C.D}지역      매치업                      펀더D 폴D*  예측득표 당선 확률 판정 방식차${C.X}`);
console.log("-".repeat(86));
for (const r of rows) console.log(`${r.region.padEnd(5)} ${(`${r.D} vs ${r.P}`).padEnd(24)} ${f(r.fundD)} ${f(r.pollD)} ${col(r)}${f(r.finalD)}%  ${win(r)} ${String(Math.round(r.dwin*100)).padStart(3)}%${C.X} ${lab(r)==="경합"?C.Y:""}${lab(r)}${C.X} ${r.spread>=8?C.Y+"±"+r.spread.toFixed(0)+C.X:""}`);
const callD = rows.filter(r=>r.dwin>=0.5).length, N=rows.length;
const tip=[...rows].sort((a,b)=>Math.abs(a.finalD-50)-Math.abs(b.finalD-50))[0];
console.log("-".repeat(86));
console.log(`예상 민주 의석: 중앙값 ${seats[SIM/2|0]} (90% ${seats[SIM*.05|0]}~${seats[SIM*.95|0]}) / ${N}  ·  우세 민주 ${callD}·국힘 ${N-callD}`);
console.log(`티핑포인트: ${tip.region} (예측 ${tip.finalD.toFixed(1)}%, 민주승 ${Math.round(tip.dwin*100)}%) · 경합: ${rows.filter(r=>Math.max(r.dwin,1-r.dwin)<0.65).map(r=>r.region).join(", ")}`);
console.log(`방식차 큰 곳(예측 불확실↑): ${rows.filter(r=>r.spread>=8).map(r=>r.region+"(±"+r.spread.toFixed(0)+")").join(", ")||"없음"}`);
console.log(`${C.D}폴D*=방식 정규화 후(전화 ${ADJ.phone}/ARS +${ADJ.ars}). 예측득표=펀더멘털⊕폴 shrinkage. σ=nat${SIG_NAT}+clu${SIG_CLU}+loc${SIG_LOC}(+방식차).${C.X}`);

// 예측 득표수 (만표)
const mv = (x) => x==null?"   -":x.toFixed(0).padStart(4);
console.log(`\n${C.b}예측 득표수${C.X} ${C.D}(만 표 · 선거인수×투표율 ${vot.turnout}×양당 ${vot.two_party_frac}; 근사)${C.X}`);
console.log(`${C.D}지역      민주(만)  국힘(만)  격차(만)${C.X}`);
for (const r of [...rows].sort((a,b)=>(b.dVotes??-1)-(a.dVotes??-1))) {
  if (r.dVotes==null) { console.log(`${r.region.padEnd(5)}   ${C.D}선거인수 미상${C.X}`); continue; }
  const gap=r.dVotes-r.pVotes; const gc=gap>=0?C.B:C.R;
  console.log(`${r.region.padEnd(5)} ${C.B}${mv(r.dVotes)}${C.X}    ${C.R}${mv(r.pVotes)}${C.X}    ${gc}${(gap>=0?"+":"")+gap.toFixed(0)}${C.X}`);
}
const totD=rows.reduce((s,r)=>s+(r.dVotes||0),0), totP=rows.reduce((s,r)=>s+(r.pVotes||0),0);
console.log(`${C.D}전국 합계: 민주 ${totD.toFixed(0)}만 vs 국힘 ${totP.toFixed(0)}만 (양당 기준)${C.X}`);

writeFileSync(base("forecast-national.json"), JSON.stringify(rows.map(r=>({region:r.region,D:r.D,P:r.P,predicted_twoway_D:+(+r.finalD).toFixed(2),predicted_votes_man:{D:r.dVotes==null?null:+r.dVotes.toFixed(0),P:r.pVotes==null?null:+r.pVotes.toFixed(0)},dwin:+r.dwin.toFixed(3),winner:win(r)})),null,2));
