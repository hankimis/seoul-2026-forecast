// Build a detailed synthetic electorate. Each persona samples a district (by
// population weight), an age x gender cell (by share), then housing / occupation /
// income conditioned on age. Personas are demographic composites grounded in public
// distributions, NOT real named individuals. Output: personas.json
//   node personas.mjs [N]   (default 1000)
import { readFileSync, writeFileSync } from "node:fs";

const N = Number(process.argv[2]) || 1000;
const demo = JSON.parse(readFileSync(new URL("./data/seoul-demographics.json", import.meta.url)));

function sampler(items, key) {
  const total = items.reduce((s, x) => s + x[key], 0);
  return () => { let r = Math.random() * total; for (const it of items) { r -= it[key]; if (r <= 0) return it; } return items[items.length - 1]; };
}
function pick(dist) { let r = Math.random(); for (const [v, p] of dist) { r -= p; if (r <= 0) return v; } return dist[dist.length - 1][0]; }

const pickDistrict = sampler(demo.districts, "weight");
const pickCell = sampler(demo.age_gender_shares, "share");

// Conditional attribute distributions by age band (approximate Seoul; replace w/ KOSIS).
const HOUSING = {
  "18-29": [["월세", 0.5], ["전세", 0.3], ["부모와 거주", 0.15], ["자가", 0.05]],
  "30-39": [["전세", 0.4], ["월세", 0.3], ["자가", 0.3]],
  "40-49": [["자가", 0.5], ["전세", 0.3], ["월세", 0.2]],
  "50-59": [["자가", 0.6], ["전세", 0.25], ["월세", 0.15]],
  "60+":   [["자가", 0.65], ["전세", 0.2], ["월세", 0.15]],
};
const OCC = {
  "18-29": [["학생", 0.35], ["사무직", 0.35], ["서비스직", 0.2], ["무직/구직", 0.1]],
  "30-39": [["사무직", 0.45], ["전문직", 0.2], ["자영업", 0.15], ["서비스직", 0.2]],
  "40-49": [["사무직", 0.35], ["자영업", 0.25], ["전문직", 0.2], ["주부", 0.2]],
  "50-59": [["자영업", 0.3], ["사무직", 0.25], ["주부", 0.2], ["생산/기능직", 0.25]],
  "60+":   [["은퇴/무직", 0.55], ["자영업", 0.2], ["주부", 0.25]],
};
const INCOME = {
  "18-29": [["하", 0.5], ["중", 0.4], ["상", 0.1]],
  "30-39": [["중", 0.5], ["하", 0.25], ["상", 0.25]],
  "40-49": [["중", 0.45], ["상", 0.3], ["하", 0.25]],
  "50-59": [["중", 0.4], ["상", 0.3], ["하", 0.3]],
  "60+":   [["하", 0.45], ["중", 0.4], ["상", 0.15]],
};

const personas = [];
for (let i = 0; i < N; i++) {
  const d = pickDistrict(), c = pickCell();
  personas.push({
    id: i, district: d.name, age: c.age, gender: c.gender,
    housing: pick(HOUSING[c.age]), occupation: pick(OCC[c.age]), income: pick(INCOME[c.age]),
  });
}
writeFileSync(new URL("./personas.json", import.meta.url), JSON.stringify(personas, null, 0));
const byD = {}; for (const p of personas) byD[p.district] = (byD[p.district] || 0) + 1;
console.log(`Wrote ${personas.length} detailed personas (district x age x gender x housing x occupation x income).`);
console.log("top districts:", Object.entries(byD).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k}:${v}`).join(" "));
