// SPIKE: validates the snapshot with the schema in THIS (main) code, then builds the static assets.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const snap = JSON.parse(readFileSync("snapshot.json", "utf8")), id = readFileSync("snapshot.id", "utf8").trim();
if (snap.schema !== 1 || typeof snap.title !== "string" || snap.title.length < 1 || snap.title.length > 40 || !Number.isInteger(snap.price_cents) || snap.price_cents < 500 || snap.price_cents > 200000) {
  console.error("::error::snapshot failed validation"); process.exit(1);
}
mkdirSync("public", { recursive: true });
const commit = process.env.GITHUB_SHA;
// spike-only fault hook: simulates a bad build that publishes the wrong release id (to test post-deploy verification + rollback)
const releaseId = snap.__spike_break_release_id ? "0".repeat(64) : id;
writeFileSync("public/release.json", JSON.stringify({ commit, release_id: releaseId, run_id: process.env.GITHUB_RUN_ID, built_at: new Date().toISOString() }) + "\n");
writeFileSync("public/index.html", `<!doctype html><title>${snap.title.replace(/[<>&]/g, "")}</title><h1>${snap.title.replace(/[<>&]/g, "")}</h1><p>${(snap.price_cents / 100).toFixed(2)} USD</p>\n`);
console.log("built release", releaseId.slice(0, 12), "from commit", commit.slice(0, 7));
