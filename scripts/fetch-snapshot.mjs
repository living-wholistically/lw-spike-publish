// SPIKE: read the requested release from private R2 with a read-only credential, and verify its content hash.
import { createHash } from "node:crypto"; import { writeFileSync } from "node:fs"; import { getObject } from "./r2.mjs";
const BUCKET = "lw-spike-private";
const req = JSON.parse((await getObject(BUCKET, "requested.json")).toString("utf8"));
if (!/^[0-9a-f]{64}$/.test(req.snapshot ?? "")) throw new Error("requested.json has no valid snapshot id");
const bytes = await getObject(BUCKET, `snapshots/${req.snapshot}.json`);
const actual = createHash("sha256").update(bytes).digest("hex");
if (actual !== req.snapshot) { console.error(`::error::snapshot hash mismatch (id ${req.snapshot.slice(0, 12)}, content ${actual.slice(0, 12)})`); process.exit(1); }
writeFileSync("snapshot.json", bytes); writeFileSync("snapshot.id", req.snapshot);
console.log(`snapshot ${req.snapshot.slice(0, 12)} verified (seq ${req.seq})`);
