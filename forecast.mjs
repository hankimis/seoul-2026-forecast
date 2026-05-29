// Elicit a vote + turnout from each persona via LLM(s), aggregate to a turnout-
// weighted vote share. Writes prediction.json (git-ignored: never published pre-reveal).
//
//   ANTHROPIC_API_KEY=.. OPENAI_API_KEY=.. node forecast.mjs --candidates data/candidates-2026.json --year 2026 [--backtest]
//
// Cross-provider Claude-led ensemble (no fal). --backtest frames the question
// pre-election present tense. Resumes from prediction.raw.json (only retries gaps).
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith("--") ? [a.slice(2), arr[i + 1]?.startsWith("--") || arr[i + 1] === undefined ? true : arr[i + 1]] : []).filter(Boolean));
const ANT = process.env.ANTHROPIC_API_KEY, OAI = process.env.OPENAI_API_KEY;
const year = args.year || "2026";
const backtest = !!args.backtest;
const candFile = args.candidates || "data/candidates-2026.json";

const cand = JSON.parse(readFileSync(new URL(`./${candFile}`, import.meta.url)));
const candidates = cand.candidates.map((c) => c.name).filter((n) => !n.startsWith("_"));
if (candidates.length < 2) { console.error("Need >=2 verified candidates in", candFile); process.exit(1); }
if (!existsSync(new URL("./personas.json", import.meta.url))) { console.error("Run: node personas.mjs first"); process.exit(1); }
const personas = JSON.parse(readFileSync(new URL("./personas.json", import.meta.url)));

function parse(text) { const m = text?.match(/\{[\s\S]*\}/); try { return JSON.parse(m[0]); } catch { return null; } }
async function withTimeout(fn, ms) { const c = new AbortController(); const t = setTimeout(() => c.abort(), ms); try { return await fn(c.signal); } finally { clearTimeout(t); } }

async function askOpenAI(text, signal) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OAI}` },
    body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.8, max_tokens: 60, messages: [{ role: "user", content: text }] }) });
  if (!r.ok) throw new Error(`openai ${r.status}`);
  return parse((await r.json()).choices?.[0]?.message?.content);
}
function askClaude(model) {
  return async (text, signal) => {
    const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", signal,
      headers: { "content-type": "application/json", "x-api-key": ANT, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 60, messages: [{ role: "user", content: text }] }) });
    if (!r.ok) throw new Error(`anthropic ${model} ${r.status}`);
    return parse((await r.json()).content?.[0]?.text);
  };
}

// Claude-led, cross-provider for bias contrast. Anthropic ids per the current API.
const MODELS = [
  ANT ? { id: "claude-haiku-4.5", run: askClaude("claude-haiku-4-5-20251001") } : null,
  ANT ? { id: "claude-sonnet-4.6", run: askClaude("claude-sonnet-4-6") } : null,
  OAI ? { id: "gpt-4o-mini", run: askOpenAI } : null,
].filter(Boolean);
if (!MODELS.length) { console.error("Set ANTHROPIC_API_KEY and/or OPENAI_API_KEY"); process.exit(1); }

const tense = backtest ? `It is May ${year}, before the election. Answer only from what such a person would have thought then, no hindsight.` : `The election is in days. Answer as this person would today.`;
function prompt(p) {
  // Condition on demographics only (district name + age + gender). We deliberately
  // do NOT state the district's past vote lean: doing so leaks the answer and the
  // model just parrots it. Let the model use its own knowledge of the demographic.
  return `You simulate a Seoul voter. Profile: ${p.age} ${p.gender}, lives in ${p.district}. ` +
    `${tense} Candidates for the ${year} Seoul mayor election: ${candidates.join(", ")}. ` +
    `As this specific person, who would you most likely vote for, and how likely are you to actually vote (0..1)? ` +
    `Reply ONLY JSON: {"vote":"<one candidate name or 'undecided'>","turnout":<0..1>,"confidence":<0..1>}`;
}

const cacheFile = new URL("./prediction.raw.json", import.meta.url);
const prior = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile)) : {};
async function pool(items, n, fn) { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; await fn(items[k]); } })); }

const tasks = [];
for (const m of MODELS) for (const p of personas) { const key = `${m.id}|${p.id}`; if (!prior[key]) tasks.push({ m, p, key }); }
console.log(`${MODELS.map((m) => m.id).join(", ")} x ${personas.length} personas. reuse ${Object.keys(prior).length}, run ${tasks.length}.`);
let done = 0;
await pool(tasks, 6, async ({ m, p, key }) => {
  try { const r = await withTimeout((s) => m.run(prompt(p), s), 40_000); if (r?.vote) prior[key] = { vote: r.vote, turnout: r.turnout, model: m.id }; }
  catch { /* skip */ }
  if (++done % 150 === 0) { writeFileSync(cacheFile, JSON.stringify(prior)); process.stdout.write(`  ${done}/${tasks.length}\n`); }
});
writeFileSync(cacheFile, JSON.stringify(prior));

function tally(rows) {
  const v = Object.fromEntries(candidates.map((c) => [c, 0])); let wsum = 0, undec = 0;
  for (const r of rows) {
    const name = candidates.find((c) => (r.vote || "").includes(c));
    const w = typeof r.turnout === "number" ? Math.max(0, Math.min(1, r.turnout)) : 0.6;
    if (name) { v[name] += w; wsum += w; } else undec += w;
  }
  return { share: Object.fromEntries(candidates.map((c) => [c, wsum ? +(100 * v[c] / wsum).toFixed(2) : 0])), undecided: +(100 * undec / (wsum + undec || 1)).toFixed(1), n: rows.length };
}
const rowsAll = Object.values(prior);
const pooled = tally(rowsAll);
const byModel = Object.fromEntries(MODELS.map((m) => [m.id, tally(rowsAll.filter((r) => r.model === m.id))]));
const prediction = {
  election: cand.election, year, generated_utc: new Date().toISOString(),
  candidates, n_personas: personas.length, models: MODELS.map((m) => m.id),
  pooled_share: pooled.share, undecided_pct: pooled.undecided, by_model: byModel,
  predicted_winner: candidates.slice().sort((a, b) => pooled.share[b] - pooled.share[a])[0],
  caveats: ["LLM partisan bias likely (calibrate vs pre-blackout polls)", "demographics/districts are approximate priors", backtest ? "BACKTEST: result may be memorized" : "LIVE forecast — sealed, not published until polls close"],
};
writeFileSync(new URL("./prediction.json", import.meta.url), JSON.stringify(prediction, null, 2));
console.log("\n=== prediction ===");
console.log("pooled:", pooled.share, "undecided", pooled.undecided + "%", "-> winner:", prediction.predicted_winner);
for (const m of MODELS) console.log(`  ${m.id}:`, byModel[m.id].share);
console.log("\nWrote prediction.json. Pre-register: node seal.mjs seal prediction.json");
