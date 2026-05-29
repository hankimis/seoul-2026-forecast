// National roll-up, v3 — 538-style: fundamentals (2022 result swung to the 2026
// environment on the LOGIT scale, so strongholds move less) blended with the poll
// aggregate, then a correlated-error Monte Carlo. Replaces v2's hand-tuned -3
// conservative correction (the 2022 data showed poll bias is NOT one-directional:
// 경기 2022 polls had PPP +7~8 but D won). Uncertainty is the main lever instead.
//   node national.mjs
import { readFileSync } from "node:fs";
const base = (p) => new URL(`./${p}`, import.meta.url);
const nat = JSON.parse(readFileSync(base("data/national-2026.json")));
const fund = JSON.parse(readFileSync(base("data/results-2022.json")));
const seoulPolls = JSON.parse(readFileSync(base("data/polls-2026.json")));

const SWING_LOGIT = 0.32;       // ~ +8pt at a 50/50 region; dampened at extremes
const W_POLL = 0.7;             // polls dominate where available (else fundamentals only)
const SIG_LOCAL = 3.5, SIG_NAT = 3.5; // local idiosyncratic + shared national error
const SIM = 50000;
const logit = (p) => Math.log(p / (1 - p)), invlogit = (x) => 1 / (1 + Math.exp(-x));
const z = () => Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
const cap = (p) => Math.max(0.03, Math.min(0.97, p));
const twoway = (D, P) => 100 * D / (D + P);

// Seoul poll = recency/sample-weighted aggregate of its multiple polls (the ① upgrade)
function seoulPollTwoway() {
  const maxEnd = Math.max(...seoulPolls.polls.map((p) => Date.parse(p.end)));
  let w = 0, v = 0;
  for (const p of seoulPolls.polls) { const days = (maxEnd - Date.parse(p.end)) / 86400000; const ww = Math.exp(-Math.LN2 * days / 14) * Math.sqrt(p.n || 800); w += ww; v += ww * twoway(p["정원오"], p["오세훈"]); }
  return v / w;
}

const rows = nat.regions.map((r) => {
  const f2022 = fund.regions[r.region]?.d_twoway;
  const fundD = f2022 == null ? null : invlogit(logit(f2022 / 100) + SWING_LOGIT) * 100;
  let pollD = null;
  if (r.region === "서울") pollD = seoulPollTwoway();
  else if (r.poll) pollD = twoway(r.poll.D, r.poll.P);
  const finalD = pollD != null && fundD != null ? W_POLL * pollD + (1 - W_POLL) * fundD
    : pollD != null ? pollD : fundD;
  return { region: r.region, D: r.D, P: r.P, fundD, pollD, finalD, hasPoll: pollD != null };
});

// Correlated Monte Carlo: shared national swing each draw.
const wins = rows.map(() => 0); const seats = [];
for (let i = 0; i < SIM; i++) {
  const ns = z() * SIG_NAT; let s = 0;
  rows.forEach((r, k) => { if (r.finalD + ns + z() * SIG_LOCAL > 50) { wins[k]++; s++; } });
  seats.push(s);
}
seats.sort((a, b) => a - b);
rows.forEach((r, k) => { r.dwin = cap(wins[k] / SIM); });
rows.sort((a, b) => b.dwin - a.dwin);

const f = (x) => x == null ? "  - " : (x.toFixed(1)).padStart(5);
const win = (r) => r.dwin >= 0.5 ? "민주" : "국힘";
const lab = (r) => { const p = Math.max(r.dwin, 1 - r.dwin); return p >= 0.85 ? "안정" : p >= 0.65 ? "우세" : "경합"; };
console.log("\n2026 광역단체장 17 — v4 (펀더멘털 2022+스윙 ⊕ 폴, 상관오차)\n");
console.log("지역  매치업                    펀더D  폴D   최종D  당선  확률  판정  폴?");
console.log("-".repeat(82));
for (const r of rows) console.log(`${r.region.padEnd(3)} ${(`${r.D} vs ${r.P}`).padEnd(23)} ${f(r.fundD)} ${f(r.pollD)} ${f(r.finalD)}  ${win(r).padEnd(4)} ${String(Math.round(r.dwin*100)).padStart(3)}%  ${lab(r).padEnd(4)} ${r.hasPoll?"폴":"펀"}`);
const callD = rows.filter((r) => r.dwin >= 0.5).length;
// tipping point = region nearest 50% final (pivotal seat)
const tip = [...rows].sort((a, b) => Math.abs(a.finalD - 50) - Math.abs(b.finalD - 50))[0];
console.log("-".repeat(82));
console.log(`예상 민주 의석: 중앙값 ${seats[SIM/2|0]} (90% ${seats[SIM*0.05|0]}~${seats[SIM*0.95|0]}) / 17  ·  우세카운트 민주 ${callD}·국힘 ${17-callD}`);
console.log(`티핑포인트(승부처): ${tip.region} (최종D ${tip.finalD.toFixed(1)}%, 민주승 ${Math.round(tip.dwin*100)}%)`);
console.log(`경합(판정=경합): ${rows.filter((r)=>Math.max(r.dwin,1-r.dwin)<0.65).map((r)=>r.region).join(", ")}`);
console.log(`방법: 펀더멘털=2022 양자D를 로짓+${SWING_LOGIT}(≈+8pt center) 스윙 / 폴 가중 ${W_POLL} / σ local ${SIG_LOCAL}+nat ${SIG_NAT}. 하드 보수보정 폐기.`);
console.log(`데이터: 폴 ${rows.filter(r=>r.hasPoll).length}곳(서울은 5개 집계)·펀더멘털전용 ${rows.filter(r=>!r.hasPoll).length}곳. 2022 펀더멘털·일부 폴은 근사(검증요).`);
