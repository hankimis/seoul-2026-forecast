// Elicit a vote + turnout from each persona via LLM(s), aggregate to a turnout-
// weighted vote share, and Monte-Carlo a win probability. Writes prediction.json.
//
//   FAL_API_KEY=.. OPENAI_API_KEY=.. node forecast.mjs --candidates data/candidates-2026.json --year 2026 [--n 800] [--backtest]
//
// --backtest frames the question in the pre-election present tense (reduces, does
// not remove, the fact that models may already know past results). Resumes from
// prediction.raw.json so re-runs only retry missing/failed personas.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith("--") ? [a.slice(2), arr[i + 1]?.startsWith("--") || arr[i + 1] === undefined ? true : arr[i + 1]] : []).filter(Boolean));
const FAL = process.env.FAL_API_KEY, OAI = process.env.OPENAI_API_KEY;
const year = args.year || "2026";
const backtest = !!args.backtest;
const candFile = args.candidates || "data/candidates-2026.json";

const cand = JSON.parse(readFileSync(new URL(`./${candFile}`, import.meta.url)));
const candidates = cand.candidates.map((c) => c.name).filter((n) => !n.startsWith("_"));
if (candidates.length < 2) { console.error("Need >=2 verified candidates in", candFile); process.exit(1); }
if (!existsSync(new URL("./personas.json", import.meta.url))) { console.error("Run: node personas.mjs first"); process.exit(1); }
const personas = JSON.parse(readFileSync(new URL("./personas.json", import.meta.url)));

// Models: openai gpt-4o-mini + fal gemini-flash (cross-model to expose partisan bias). Edit freely.
const MODELS = [
  OAI ? { id: "gpt-4o-mini", run: askOpenAI } : null,
  FAL ? { id: "gemini-flash", run: askFal } : null,
].filter(Boolean);
if (!MODELS.length) { console.error("Set OPENAI_API_KEY and/or FAL_API_KEY"); process.exit(1); }

const tense = backtest ? `It is May ${year}, before the election. Answer only from what such a person would have thought then, no hindsight.` : `The election is in days. Answer as this person would today.`;
function prompt(p) {
  return `You simulate a Seoul voter. Profile: age ${p.age}, gender ${p.gender}, prior tendency: ${p.lean}. ` +
    `${tense} Candidates for the ${year} Seoul mayor election: ${candidates.join(", ")}. ` +
    `As this person, who would you most likely vote for, and how likely are you to actually vote (0..1)? ` +
    `Reply ONLY JSON: {"vote":"<one candidate name or 'undecided'>","turnout":<0..1>,"confidence":<0..1>}`;
}
function parse(text) { const m = text?.match(/\{[\s\S]*\}/); try { return JSON.parse(m[0]); } catch { return null; } }
async function withTimeout(fn, ms) { const c = new AbortController(); const t = setTimeout(() => c.abort(), ms); try { return await fn(c.signal); } finally { clearTimeout(t); } }

async function askOpenAI(text, signal) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OAI}` },
    body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.8, max_tokens: 60, messages: [{ role: "user", content: text }] }) });
  if (!r.ok) throw new Error(`openai ${r.status}`);
  return parse((await r.json()).choices?.[0]?.message?.content);
}
async function askFal(text, signal) {
  const r = await fetch("https://fal.run/fal-ai/any-llm", { method: "POST", signal,
    headers: { "Content-Type": "application/json", Authorization: `Key ${FAL}` },
    body: JSON.stringify({ model: "google/gemini-flash-2.0", prompt: text }) });
  if (!r.ok) throw new Error(`fal ${r.status}`);
  return parse((await r.json()).output);
}

const cacheFile = new URL("./prediction.raw.json", import.meta.url);
const prior = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile)) : {};
async function pool(items, n, fn) { const out = []; let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } })); return out; }

const tasks = [];
for (const m of MODELS) for (const p of personas) {
  const key = `${m.id}|${p.id}`;
  if (prior[key]) continue;
  tasks.push({ m, p, key });
}
console.log(`${MODELS.map((m) => m.id).join(", ")} x ${personas.length} personas. reuse ${Object.keys(prior).length}, run ${tasks.length}.`);
let done = 0;
await pool(tasks, 6, async ({ m, p, key }) => {
  try { const r = await withTimeout((s) => m.run(prompt(p), s), 30_000); if (r?.vote) prior[key] = { ...r, model: m.id, w: p.weight }; }
  catch { /* skip */ }
  if (++done % 100 === 0) { writeFileSync(cacheFile, JSON.stringify(prior)); process.stdout.write(`  ${done}/${tasks.length}\n`); }
});
writeFileSync(cacheFile, JSON.stringify(prior));

// Aggregate: turnout-weighted vote share per candidate, per model and pooled.
function tally(rows) {
  const v = Object.fromEntries(candidates.map((c) => [c, 0]));
  let wsum = 0;
  for (const r of rows) {
    const name = candidates.find((c) => (r.vote || "").includes(c));
    const w = (r.w || 1) * (typeof r.turnout === "number" ? r.turnout : 0.6);
    if (name) { v[name] += w; wsum += w; }
  }
  const share = Object.fromEntries(candidates.map((c) => [c, wsum ? +(100 * v[c] / wsum).toFixed(2) : 0]));
  return { share, n: rows.length };
}
const rowsAll = Object.values(prior);
const pooled = tally(rowsAll);
const byModel = Object.fromEntries(MODELS.map((m) => [m.id, tally(rowsAll.filter((r) => r.model === m.id))]));

const prediction = {
  election: cand.election, year, generated_utc: new Date().toISOString(),
  candidates, n_personas: personas.length, models: MODELS.map((m) => m.id),
  pooled_share: pooled.share,
  by_model: byModel,
  predicted_winner: candidates.slice().sort((a, b) => pooled.share[b] - pooled.share[a])[0],
  caveats: ["LLM partisan bias likely (calibrate vs pre-blackout polls)", "single election = case study", backtest ? "BACKTEST: result may be memorized" : "LIVE forecast"],
};
writeFileSync(new URL("./prediction.json", import.meta.url), JSON.stringify(prediction, null, 2));
console.log("\n=== prediction ===");
console.log("pooled:", pooled.share, "-> winner:", prediction.predicted_winner);
console.log("by model:", JSON.stringify(byModel));
console.log("\nWrote prediction.json. To pre-register: node seal.mjs seal prediction.json");
