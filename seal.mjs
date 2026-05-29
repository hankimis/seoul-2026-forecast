// Sealed pre-registration tool.
// A prediction is generated privately, then only its SHA-256 hash is published
// (a hash reveals nothing about the contents, so it does not "공표" a forecast).
// After polls close, the prediction is revealed and anyone can verify it matches.
//
//   node seal.mjs seal <prediction.json>            -> writes SEALED.txt (hash + UTC stamp)
//   node seal.mjs verify <prediction.json> SEALED.txt
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const [cmd, file, sealFile] = process.argv.slice(2);
const sha = (buf) => createHash("sha256").update(buf).digest("hex");

if (cmd === "seal" && file) {
  const buf = readFileSync(file);
  const hash = sha(buf);
  const stamp = new Date().toISOString(); // when run; for a trustless stamp also OpenTimestamp this hash
  const out =
    `SEALED PREDICTION COMMITMENT\n` +
    `file: ${file}\n` +
    `sha256: ${hash}\n` +
    `sealed_at_utc: ${stamp}\n` +
    `note: contents withheld until polls close (KR election-law blackout). Verify after reveal.\n`;
  writeFileSync("SEALED.txt", out);
  console.log(out);
  console.log("Next: commit SEALED.txt publicly and OpenTimestamp the hash. Keep the prediction file private until reveal.");
} else if (cmd === "verify" && file && sealFile) {
  const buf = readFileSync(file);
  const hash = sha(buf);
  const sealed = readFileSync(sealFile, "utf8");
  const m = sealed.match(/sha256:\s*([0-9a-f]{64})/);
  const ok = m && m[1] === hash;
  console.log(`computed: ${hash}`);
  console.log(`sealed:   ${m ? m[1] : "(not found)"}`);
  console.log(ok ? "MATCH — the revealed prediction is the one that was sealed." : "MISMATCH — does not match the commitment.");
  process.exit(ok ? 0 : 1);
} else {
  console.log("usage:\n  node seal.mjs seal <prediction.json>\n  node seal.mjs verify <prediction.json> SEALED.txt");
  process.exit(1);
}
