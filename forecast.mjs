// LLM-persona forecast, done properly: distribution elicitation (no hard-choice
// mode collapse), poststratified aggregation, model calibration from a backtest,
// blended with a recency/sample-weighted poll aggregate, and a Monte-Carlo win
// probability. Writes prediction.json (git-ignored).
//
//   node forecast.mjs --candidates data/elections/2022-seoul-mayor.json --year 2022 --backtest --actualA 59.05
//   node forecast.mjs --candidates data/candidates-2026.json --year 2026 --polls data/polls-2026.json
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith("--") ? [a.slice(2), arr[i + 1]?.startsWith("--") || arr[i + 1] === undefined ? true : arr[i + 1]] : []).filter(Boolean));
const ANT = process.env.ANTHROPIC_API_KEY, OAI = process.env.OPENAI_API_KEY;
const year = args.year || "2026";
const backtest = !!args.backtest;
const candFile = args.candidates || "data/candidates-2026.json";
const base = (p) => new URL(`./${p}`, import.meta.url);

const cand = JSON.parse(readFileSync(base(candFile)));
const names = cand.candidates.map((c) => c.name).filter((n) => !n.startsWith("_"));
if (names.length < 2) { console.error("need 2 candidates"); process.exit(1); }
const [A, B] = names; // A = candidates[0], B = candidates[1]
if (!existsSync(base("personas.json"))) { console.error("run: node personas.mjs <N>"); process.exit(1); }
const personas = JSON.parse(readFileSync(base("personas.json")));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function parse(t) { const m = t?.match(/\{[\s\S]*\}/); try { return JSON.parse(m[0]); } catch { return null; } }
async function fetchRetry(url, opt, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), 45_000);
    try {
      const r = await fetch(url, { ...opt, signal: c.signal }); clearTimeout(t);
      if (r.status === 429 || r.status === 529 || r.status >= 500) { await sleep(800 * (i + 1) + Math.floor(Math.random() * 400)); continue; }
      return r;
    } catch (e) { clearTimeout(t); if (i === tries - 1) throw e; await sleep(600 * (i + 1)); }
  }
  throw new Error("retries exhausted");
}
async function askOpenAI(text) {
  const r = await fetchRetry("https://api.openai.com/v1/chat/completions", { method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OAI}` },
    body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.7, max_tokens: 50, messages: [{ role: "user", content: text }] }) });
  if (!r.ok) throw new Error(`openai ${r.status}`);
  return parse((await r.json()).choices?.[0]?.message?.content);
}
function askClaude(model) {
  return async (text) => {
    const r = await fetchRetry("https://api.anthropic.com/v1/messages", { method: "POST",
      headers: { "content-type": "application/json", "x-api-key": ANT, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 50, messages: [{ role: "user", content: text }] }) });
    if (!r.ok) throw new Error(`anthropic ${model} ${r.status}`);
    return parse((await r.json()).content?.[0]?.text);
  };
}
const MODELS = [
  ANT ? { id: "claude-haiku-4.5", run: askClaude("claude-haiku-4-5-20251001") } : null,
  ANT ? { id: "claude-sonnet-4.6", run: askClaude("claude-sonnet-4-6") } : null,
  OAI ? { id: "gpt-4o-mini", run: askOpenAI } : null,
].filter(Boolean);
if (!MODELS.length) { console.error("set ANTHROPIC_API_KEY and/or OPENAI_API_KEY"); process.exit(1); }

const tense = backtest ? `It is May ${year}, before the election; answer from what such a person thought then, no hindsight.` : `The election is now; answer as this person today.`;
function prompt(p) {
  return `You simulate one Seoul voter. Profile: ${p.age} ${p.gender}, ${p.district}, housing ${p.housing}, ${p.occupation}, income ${p.income}. ` +
    `${tense} Two candidates: A = ${A}, B = ${B}. ` +
    `Estimate THIS person's probability of voting for each (they need not sum to 1; the remainder is undecided), and their turnout likelihood. ` +
    `Reply ONLY JSON: {"pA":0..1,"pB":0..1,"turnout":0..1}`;
}

const cacheFile = base("prediction.raw.json");
const prior = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile)) : {};
async function pool(items, n, fn) { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) await fn(items[i++]); })); }

const tasks = [];
for (const m of MODELS) for (const p of personas) { const k = `${m.id}|${p.id}`; if (!prior[k]) tasks.push({ m, p, k }); }
console.log(`${MODELS.map((m) => m.id).join(", ")} x ${personas.length}. reuse ${Object.keys(prior).length}, run ${tasks.length}.`);
let done = 0;
await pool(tasks, 5, async ({ m, p, k }) => {
  try { const r = await m.run(prompt(p)); if (r && (typeof r.pA === "number" || typeof r.pB === "number")) prior[k] = { pA: +r.pA || 0, pB: +r.pB || 0, t: typeof r.turnout === "number" ? Math.max(0, Math.min(1, r.turnout)) : 0.6, model: m.id }; }
  catch { /* skip */ }
  if (++done % 200 === 0) { writeFileSync(cacheFile, JSON.stringify(prior)); process.stdout.write(`  ${done}/${tasks.length}\n`); }
});
writeFileSync(cacheFile, JSON.stringify(prior));

// Poststratified two-way share of B per model (personas sampled proportional to
// population => simple turnout-weighted mean is the poststratified estimate).
function shareB(rows) {
  let b = 0, ab = 0;
  for (const r of rows) { const a = r.pA * r.t, bb = r.pB * r.t; b += bb; ab += a + bb; }
  return ab ? +(100 * b / ab).toFixed(2) : null;
}
const rowsAll = Object.values(prior);
const byModel = Object.fromEntries(MODELS.map((m) => [m.id, { shareB: shareB(rowsAll.filter((r) => r.model === m.id)), n: rowsAll.filter((r) => r.model === m.id).length }]));

if (backtest) {
  // Calibrate: actualA given via --actualA; B = 100 - A two-way. weight = 1/(err+2).
  const actualA = +args.actualA; const actualB = 100 - actualA;
  const cal = {};
  for (const m of MODELS) { const sB = byModel[m.id].shareB; const err = sB == null ? 50 : Math.abs(sB - actualB); cal[m.id] = { shareB_pred: sB, errVsActual: +err.toFixed(2), rawWeight: +(1 / (err + 2)).toFixed(4) }; }
  const z = Object.values(cal).reduce((s, x) => s + x.rawWeight, 0);
  for (const k in cal) cal[k].weight = +(cal[k].rawWeight / z).toFixed(3);
  writeFileSync(base("calibration.json"), JSON.stringify({ year, actualB, models: cal }, null, 2));
  console.log(`\n=== backtest ${year} (actual B=${actualB.toFixed(1)}) ===`);
  for (const m of MODELS) console.log(`  ${m.id}: predB ${cal[m.id].shareB_pred}  err ${cal[m.id].errVsActual}  weight ${cal[m.id].weight}`);
  console.log("wrote calibration.json");
  process.exit(0);
}

// ---- LIVE: calibrated sim + poll anchor + Monte Carlo ----
const cal = existsSync(base("calibration.json")) ? JSON.parse(readFileSync(base("calibration.json"))).models : null;
const wOf = (id) => cal?.[id]?.weight ?? 1 / MODELS.length;
const simB = MODELS.reduce((s, m) => s + (byModel[m.id].shareB ?? 0) * wOf(m.id), 0) / MODELS.reduce((s, m) => s + (byModel[m.id].shareB == null ? 0 : wOf(m.id)), 0);

let pollB = null, pollSpread = null, pollDetail = [];
if (args.polls && existsSync(base(args.polls))) {
  const pd = JSON.parse(readFileSync(base(args.polls)));
  const maxEnd = Math.max(...pd.polls.map((p) => Date.parse(p.end)));
  let wsum = 0, vsum = 0; const tw = [];
  for (const p of pd.polls) {
    const twoway = 100 * p[B] / (p[A] + p[B]); tw.push(twoway);
    const days = (maxEnd - Date.parse(p.end)) / 86400000;
    const w = Math.exp(-Math.LN2 * days / 14) * Math.sqrt(p.n || 800);
    wsum += w; vsum += w * twoway; pollDetail.push({ pollster: p.pollster, twoway: +twoway.toFixed(1), w: +w.toFixed(1) });
  }
  pollB = vsum / wsum;
  const mean = tw.reduce((a, b) => a + b, 0) / tw.length;
  pollSpread = Math.sqrt(tw.reduce((s, x) => s + (x - mean) ** 2, 0) / tw.length);
}

// Blend: polls dominate near election (538-style). If no polls, sim only.
const wPoll = pollB == null ? 0 : 0.75;
const finalB = pollB == null ? simB : wPoll * pollB + (1 - wPoll) * simB;

// Monte Carlo: poll/forecast error ~ Normal(0, sigma). sigma from historical
// two-way polling error (~3pt) + between-poll spread + sim-vs-poll gap.
const sigma = Math.sqrt(3 ** 2 + (pollSpread ?? 3) ** 2 + (pollB != null ? ((simB - pollB) / 4) ** 2 : 9));
let winB = 0; const SIM = 50000; const draws = [];
for (let i = 0; i < SIM; i++) {
  // Box-Muller
  const z = Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
  const d = finalB + z * sigma; draws.push(d); if (d > 50) winB++;
}
draws.sort((a, b) => a - b);
const pct = (q) => +draws[Math.floor(q * SIM)].toFixed(1);

const prediction = {
  election: cand.election, year, generated_utc: new Date().toISOString(), candidates: { A, B }, n_personas: personas.length,
  poll_anchor_twoway_B: pollB == null ? null : +pollB.toFixed(2), poll_spread: pollSpread == null ? null : +pollSpread.toFixed(2), polls: pollDetail,
  sim_calibrated_twoway_B: +simB.toFixed(2), sim_by_model: byModel, model_weights: Object.fromEntries(MODELS.map((m) => [m.id, +wOf(m.id).toFixed(3)])),
  blend_weight_poll: wPoll, final_twoway_B: +finalB.toFixed(2), sigma: +sigma.toFixed(2),
  win_prob_B: +(100 * winB / SIM).toFixed(1), interval90_B: [pct(0.05), pct(0.95)],
  note: `B=${B}. final two-way ${finalB.toFixed(1)}% for ${B}; win prob ${(100 * winB / SIM).toFixed(0)}%. polls dominate (w=${wPoll}); LLM-sim calibrated by 2022 backtest.`,
};
writeFileSync(base("prediction.json"), JSON.stringify(prediction, null, 2));
console.log(`\n=== LIVE ${year} forecast (two-way, B=${B}) ===`);
console.log(`poll anchor: ${B} ${pollB?.toFixed(1)}%  | sim(calibrated): ${simB.toFixed(1)}%  | blend(wPoll=${wPoll}): ${finalB.toFixed(1)}%`);
console.log(`sim by model:`, Object.fromEntries(MODELS.map((m) => [m.id, byModel[m.id].shareB])), "weights:", Object.fromEntries(MODELS.map((m) => [m.id, +wOf(m.id).toFixed(2)])));
console.log(`=> ${B} two-way ${finalB.toFixed(1)}%  win prob ${(100 * winB / SIM).toFixed(0)}%  90% CI [${pct(0.05)}, ${pct(0.95)}]`);
console.log("wrote prediction.json (private)");
