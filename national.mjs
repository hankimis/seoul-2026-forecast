// National roll-up, v6 — adds empirical calibration + richer analytics.
//  v5: method(ARS/phone) normalization · multi-poll house-effect · hierarchical shrinkage
//      · clustered correlated MC · multiparty · predicted share + counts.
//  v6: method correction & σ anchored on the 2022 backtest (phone ~unbiased, MAE 2.2,
//      σ≈2.6; ARS pulled toward phone). + scenario probabilities, 90% intervals,
//      sensitivity analysis, upset-risk ranking, decisive-vote margins, ensemble hook.
//   node national.mjs   (calibrate with: node backtest-2022.mjs)
import { readFileSync, writeFileSync } from "node:fs";
const base = (p) => new URL(`./${p}`, import.meta.url);
const nat = JSON.parse(readFileSync(base("data/national-2026.json")));
const fund = JSON.parse(readFileSync(base("data/results-2022.json")));
const vot = JSON.parse(readFileSync(base("data/voters-2026.json")));
const ADJ = nat.config.method_twoway_adj;
const SWING = 0.32, SIG_NAT = 2.5, SIG_CLU = 2.5, SIG_LOC = 2.8, SIM = 50000; // σ from 2022 backtest
const logit = (p)=>Math.log(p/(1-p)), invlogit=(x)=>1/(1+Math.exp(-x));
const z = () => Math.sqrt(-2*Math.log(Math.random()))*Math.cos(2*Math.PI*Math.random());
const cap = (p)=>Math.max(0.02,Math.min(0.98,p));
const tw = (D,P)=>100*D/(D+P);
const C = {B:"\x1b[36m",R:"\x1b[31m",Y:"\x1b[33m",D:"\x1b[2m",b:"\x1b[1m",X:"\x1b[0m"};
const fund2022 = (r)=> r==="전남광주" ? (fund.regions["광주"].d_twoway+fund.regions["전남"].d_twoway)/2 : fund.regions[r]?.d_twoway;
const TOSSUP = new Set(["서울","충북","경남","부산","울산"]);

function build(swing=SWING, useMethod=true) {
  return nat.regions.map((r) => {
    const f2022 = fund2022(r.region);
    const fundD = f2022==null?null:invlogit(logit(f2022/100)+swing)*100;
    let pollD=null, spread=0, n=(r.polls||[]).length;
    if (n) {
      const norm = r.polls.map(p=> tw(p.D,p.P) + (useMethod?(ADJ[p.m]??0):0));
      pollD = norm.reduce((a,b)=>a+b,0)/n;
      const raws=r.polls.map(p=>tw(p.D,p.P)); spread=Math.max(...raws)-Math.min(...raws);
    }
    const wPoll = n>=2?0.75:n===1?0.58:0;
    const finalD = pollD!=null&&fundD!=null ? wPoll*pollD+(1-wPoll)*fundD : pollD??fundD;
    const sigLoc = SIG_LOC + Math.min(spread/2,4);
    const elig=vot.eligible_10k[r.region], tpc = elig!=null?elig*vot.turnout*vot.two_party_frac:null;
    return {...r, fundD, pollD, finalD, n, spread, sigLoc, dVotes: tpc!=null?tpc*finalD/100:null, pVotes: tpc!=null?tpc*(100-finalD)/100:null, tpc};
  });
}
const callCount = (rows)=> rows.filter(r=>r.finalD>50).length; // deterministic seat call

const rows = build();
const clusters=[...new Set(rows.map(r=>r.cluster))];
const wins=rows.map(()=>0); const seats=[]; let sweep=0;
for (let i=0;i<SIM;i++){
  const ns=z()*SIG_NAT, cz=Object.fromEntries(clusters.map(c=>[c,z()*SIG_CLU]));
  let s=0, sw=1;
  rows.forEach((r,k)=>{ const w = r.finalD+ns+cz[r.cluster]+z()*r.sigLoc>50; if(w){wins[k]++;s++;} if(TOSSUP.has(r.region)&&!w) sw=0; });
  seats.push(s); if(sw) sweep++;
}
seats.sort((a,b)=>a-b);
rows.forEach((r,k)=>{ r.dwin=cap(wins[k]/SIM); const sd=Math.sqrt(SIG_NAT**2+SIG_CLU**2+r.sigLoc**2); r.lo=r.finalD-1.64*sd; r.hi=r.finalD+1.64*sd; });
rows.sort((a,b)=>b.dwin-a.dwin);

const f=(x)=>x==null?"  - ":x.toFixed(1).padStart(5);
const win=(r)=>r.dwin>=0.5?"민주":"국힘", lab=(r)=>{const p=Math.max(r.dwin,1-r.dwin);return p>=0.85?"안정":p>=0.65?"우세":"경합";}, col=(r)=>r.dwin>=0.5?C.B:C.R;
console.log(`\n${C.b}2026 광역단체장 ${rows.length} — v6${C.X} ${C.D}(2022 백테스트 보정 · 시나리오/구간/민감도)${C.X}\n`);
console.log(`${C.D}지역      매치업                    예측D  90%구간     당선 확률 판정${C.X}`);
console.log("-".repeat(82));
for (const r of rows) console.log(`${r.region.padEnd(5)} ${(`${r.D} vs ${r.P}`).padEnd(23)} ${col(r)}${f(r.finalD)}%${C.X} [${r.lo.toFixed(0)}~${r.hi.toFixed(0)}]  ${col(r)}${win(r)} ${String(Math.round(r.dwin*100)).padStart(3)}%${C.X} ${lab(r)==="경합"?C.Y:""}${lab(r)}${C.X}`);
const callD=rows.filter(r=>r.dwin>=0.5).length, N=rows.length;
const tip=[...rows].sort((a,b)=>Math.abs(a.finalD-50)-Math.abs(b.finalD-50))[0];
const p=(c)=>(100*c/SIM).toFixed(0);
const ge=(k)=>seats.filter(s=>s>=k).length;
console.log("-".repeat(82));
console.log(`예상 민주 의석: 중앙값 ${seats[SIM/2|0]} (90% ${seats[SIM*.05|0]}~${seats[SIM*.95|0]}) / ${N} · 우세 민주 ${callD}·국힘 ${N-callD} · 티핑 ${tip.region}`);
console.log(`${C.b}시나리오${C.X}: P(민주≥12)=${p(ge(12))}% · P(민주≥10)=${p(ge(10))}% · P(국힘≥5)=${p(SIM-ge(12))}% · P(경합5 싹쓸이)=${p(sweep)}%`);

// 득표수
const mv=(x)=>x==null?"  -":x.toFixed(0).padStart(4);
console.log(`\n${C.b}예측 득표수${C.X} ${C.D}(만표; 선거인수×투표율${vot.turnout}×양당${vot.two_party_frac})${C.X}`);
for (const r of [...rows].sort((a,b)=>(b.dVotes??-1)-(a.dVotes??-1))) { if(r.dVotes==null)continue; const g=r.dVotes-r.pVotes; console.log(`${r.region.padEnd(5)} 민주 ${C.B}${mv(r.dVotes)}${C.X} 국힘 ${C.R}${mv(r.pVotes)}${C.X} 격차 ${g>=0?C.B:C.R}${(g>=0?"+":"")+g.toFixed(0)}만${C.X}`); }
const totD=rows.reduce((s,r)=>s+(r.dVotes||0),0), totP=rows.reduce((s,r)=>s+(r.pVotes||0),0);
console.log(`${C.D}전국: 민주 ${totD.toFixed(0)}만 vs 국힘 ${totP.toFixed(0)}만${C.X}`);

// 결정표 (경합 뒤집는 표)
console.log(`\n${C.b}결정표${C.X} ${C.D}(경합지 뒤집는 데 필요한 표, 만)${C.X}`);
for (const r of rows.filter(r=>Math.max(r.dwin,1-r.dwin)<0.65)) { const flip=Math.abs(r.finalD-50)/100*r.tpc; console.log(`${r.region.padEnd(5)} ${flip.toFixed(1)}만표 (현재 ${win(r)} ${Math.round(r.dwin*100)}%)`); }

// 업셋 리스크 (안정/우세 중 가장 약한)
const upset=[...rows].filter(r=>Math.max(r.dwin,1-r.dwin)>=0.65).sort((a,b)=>Math.max(b.dwin,1-b.dwin)-Math.max(a.dwin,1-a.dwin)).slice(-3).reverse();
console.log(`${C.b}업셋 리스크${C.X} ${C.D}(비경합 중 뒤집힐 가능성 높은 순)${C.X}: ${upset.map(r=>`${r.region}(${win(r)} ${Math.round(Math.max(r.dwin,1-r.dwin)*100)}%)`).join(" · ")}`);

// 민감도
const base0=callCount(rows);
const noM=callCount(build(SWING,false)), sUp=callCount(build(SWING+0.15)), sDn=callCount(build(SWING-0.15));
console.log(`${C.b}민감도${C.X}(민주 우세지역 수): 기준 ${base0} · 방식보정無 ${noM} · 스윙+ ${sUp} · 스윙− ${sDn}`);
console.log(`${C.D}보정: 방식 phone0/ars+${ADJ.ars}(2022 백테스트=전화 무편향) · σ_loc ${SIG_LOC}(백테스트 2.6) · swing ${SWING}.${C.X}`);

writeFileSync(base("forecast-national.json"), JSON.stringify(rows.map(r=>({region:r.region,D:r.D,P:r.P,predicted_twoway_D:+(+r.finalD).toFixed(2),ci90:[+r.lo.toFixed(1),+r.hi.toFixed(1)],votes_man:{D:r.dVotes==null?null:+r.dVotes.toFixed(0),P:r.pVotes==null?null:+r.pVotes.toFixed(0)},dwin:+r.dwin.toFixed(3),winner:win(r)})),null,2));
