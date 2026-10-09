// SPIKE: tiny SigV4 helper for Cloudflare R2's S3 API (query-string presign), Node only. Credentials come from environment variables.
import { createHmac, createHash } from "node:crypto";
const hex = (b) => b.toString("hex");
const hmac = (k, d) => createHmac("sha256", k).update(d).digest();
const enc = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
export function presign(method, bucket, key, { expires = 120 } = {}) {
  const { R2_ACCESS_KEY_ID: ak, R2_SECRET_ACCESS_KEY: sk, CF_ACCOUNT_ID: acct } = process.env;
  if (!ak || !sk || !acct) throw new Error("missing R2 credentials in environment");
  const host = `${acct}.r2.cloudflarestorage.com`, region = "auto";
  const t = new Date().toISOString().replace(/[:-]|\.\d{3}/g, ""), date = t.slice(0, 8), scope = `${date}/${region}/s3/aws4_request`;
  const q = { "X-Amz-Algorithm": "AWS4-HMAC-SHA256", "X-Amz-Credential": `${ak}/${scope}`, "X-Amz-Date": t, "X-Amz-Expires": String(expires), "X-Amz-SignedHeaders": "host" };
  const cq = Object.keys(q).sort().map((k) => `${enc(k)}=${enc(q[k])}`).join("&");
  const path = `/${bucket}/${key.split("/").map(enc).join("/")}`;
  const canonical = [method, path, cq, `host:${host}`, "", "host", "UNSIGNED-PAYLOAD"].join("\n");
  const sts = ["AWS4-HMAC-SHA256", t, scope, hex(createHash("sha256").update(canonical).digest())].join("\n");
  let k = hmac(`AWS4${sk}`, date); for (const p of [region, "s3", "aws4_request"]) k = hmac(k, p);
  return `https://${host}${path}?${cq}&X-Amz-Signature=${hex(hmac(k, sts))}`;
}
export async function getObject(bucket, key) {
  const r = await fetch(presign("GET", bucket, key));
  if (!r.ok) throw new Error(`GET ${key}: HTTP ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}
