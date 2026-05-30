// map-viz.mjs — tile-grid "map" of the 16 races (NYT-style), colored by lean + confidence.
// Not true geography (honest: no fake borders) — a roughly geographic tile layout. node map-viz.mjs
import { readFileSync } from "node:fs";
const base = (p) => new URL(`./${p}`, import.meta.url);
const rows = JSON.parse(readFileSync(base("forecast-national.json")));
const P = {}; for (const r of rows) P[r.region] = r;
const X = "\x1b[0m", B = "\x1b[1m", D = "\x1b[2m";

// 2-char abbreviations (전남광주 → 전남) so every tile is the same display width
const ab = { 전남광주:"전남" };
const abbr = (r)=> ab[r] || r;

// roughly geographic grid: [row, col]. 수도권 NW, 강원 NE, 충청 center, 호남 SW, 영남/대경 SE, 제주 S.
const pos = {
  서울:[0,3], 인천:[0,2], 경기:[0,4], 강원:[0,6],
  충남:[1,2], 세종:[1,3], 충북:[1,4], 경북:[1,6],
  전북:[2,1], 대전:[2,3], 대구:[2,6],
  전남광주:[3,1], 경남:[3,4], 부산:[3,5], 울산:[3,6],
  제주:[4,1],
};
const maxRow = 4, maxCol = 6;
const TW = 8; // inner display width (abbr 4 cells + space + prob 3)

// color: 민주 blue / 국힘 red; bold when 안정(>=85%)
function tint(r){
  const win = r.dwin>=0.5;
  const conf = Math.max(r.dwin, 1-r.dwin);
  const c = win ? 36 : 31;                 // cyan/red foreground
  const style = conf>=0.85 ? `${B}\x1b[${c}m` : conf>=0.65 ? `\x1b[${c}m` : `\x1b[${c==36?94:91}m`;
  return style;
}
function tile(region, line){
  const r = P[region];
  if (!r) return " ".repeat(TW+2);
  const col = tint(r);
  if (line===0) return `${col}┌${"─".repeat(TW)}┐${X}`;
  if (line===2) return `${col}└${"─".repeat(TW)}┘${X}`;
  const pp = (String(Math.round(r.dwin*100)).padStart(2))+"%";   // dwin = 민주 확률
  const body = `${abbr(region)} ${pp}`;                          // 4 + 1 + 3 = 8 cells
  return `${col}│${body}│${X}`;
}
// reverse lookup: which region sits at (row,col)
const at = {}; for (const [reg,[rr,cc]] of Object.entries(pos)) at[`${rr},${cc}`] = reg;

console.log(`\n${B}2026 광역단체장 — 권역 타일맵${X} ${D}(색=우세 정당·확률, 숫자=민주 승리확률)${X}\n`);
for (let r=0;r<=maxRow;r++){
  const lines = ["","",""];
  for (let c=0;c<=maxCol;c++){
    const reg = at[`${r},${c}`];
    for (let l=0;l<3;l++) lines[l] += (reg ? tile(reg,l) : " ".repeat(TW+2)) + " ";
  }
  for (const ln of lines) console.log("  "+ln.replace(/\s+$/,""));
  console.log("");
}
const callD = rows.filter(r=>r.dwin>=0.5).length;
console.log(`  ${B}\x1b[36m■ 민주 ${callD}${X}   \x1b[31m■ 국힘 ${16-callD}${X}   ${D}진한색=안정(≥85%)·중간=우세·옅은색=경합(<65%)${X}`);
console.log(`  ${D}수도권 좌상 · 강원 우상 · 충청 중앙 · 호남 좌하 · 영남/대경 우하 · 제주 최하단 (실제 지리 근사)${X}\n`);
