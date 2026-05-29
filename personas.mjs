// Build a stratified synthetic electorate from demographic shares.
// Personas are demographic composites grounded in public distributions, NOT real
// named individuals. Output: personas.json
//   node personas.mjs [N]   (default 1000)
import { readFileSync, writeFileSync } from "node:fs";

const N = Number(process.argv[2]) || 1000;
const demo = JSON.parse(readFileSync(new URL("./data/seoul-demographics.json", import.meta.url)));
const strata = demo.strata_by_age_gender;
const total = strata.reduce((s, x) => s + x.share, 0);

const personas = [];
let id = 0;
for (const s of strata) {
  const count = Math.round((s.share / total) * N);
  for (let i = 0; i < count; i++) {
    personas.push({ id: id++, age: s.age, gender: s.gender, lean: s.lean, weight: 1 / count * (s.share / total) });
  }
}
writeFileSync(new URL("./personas.json", import.meta.url), JSON.stringify(personas, null, 0));
console.log(`Wrote ${personas.length} personas across ${strata.length} strata (target N=${N}).`);
