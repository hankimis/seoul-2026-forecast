// Build a synthetic electorate: each persona samples a district (by population
// weight) and an age x gender cell (by share). Personas are demographic composites
// grounded in public distributions, NOT real named individuals. Output: personas.json
//   node personas.mjs [N]   (default 1000)
import { readFileSync, writeFileSync } from "node:fs";

const N = Number(process.argv[2]) || 1000;
const demo = JSON.parse(readFileSync(new URL("./data/seoul-demographics.json", import.meta.url)));

function sampler(items, key) {
  const total = items.reduce((s, x) => s + x[key], 0);
  return () => { let r = Math.random() * total; for (const it of items) { r -= it[key]; if (r <= 0) return it; } return items[items.length - 1]; };
}
const pickDistrict = sampler(demo.districts, "weight");
const pickCell = sampler(demo.age_gender_shares, "share");

const personas = [];
for (let i = 0; i < N; i++) {
  const d = pickDistrict(), c = pickCell();
  personas.push({ id: i, district: d.name, lean: d.lean2022, age: c.age, gender: c.gender });
}
writeFileSync(new URL("./personas.json", import.meta.url), JSON.stringify(personas, null, 0));
const byD = {}; for (const p of personas) byD[p.district] = (byD[p.district] || 0) + 1;
console.log(`Wrote ${personas.length} personas across ${demo.districts.length} districts x ${demo.age_gender_shares.length} age-gender cells.`);
console.log("top districts:", Object.entries(byD).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k}:${v}`).join(" "));
