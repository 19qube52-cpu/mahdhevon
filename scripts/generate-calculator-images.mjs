#!/usr/bin/env node
import { createHash } from "node:crypto"
import { mkdir, readFile, writeFile, access } from "node:fs/promises"
import path from "node:path"

const execute = process.argv.includes("--execute")
const force = process.argv.includes("--force")
const model = process.env.XAI_IMAGE_MODEL || "grok-imagine-image-2.0"
const key = process.env.XAI_API_KEY
if (!key) throw new Error("XAI_API_KEY is not set")
const source = await readFile("src/data/calculators.ts", "utf8")
const calculators = [...source.matchAll(/\n\s*id: "([^"]+)",\n\s*slug: "([^"]+)",\n\s*title: "([^"]+)",[\s\S]*?\n\s*description: "([^"\n]*(?:\\.[^"\n]*)*)",/g)]
  .map((m) => ({ id: m[1], slug: m[2], title: m[3].replace(/\\"/g, '"'), description: m[4].replace(/\\"/g, '"') }))
if (!calculators.some((item) => item.slug === "vat-calculator")) calculators.push({ id: "vat-calculator", slug: "vat-calculator", title: "מחשבון מעמ", description: "חישוב מחיר כולל וללא מס ערך מוסף בישראל" })
if (!calculators.length) throw new Error("No calculators found")
if (!execute) {
  console.log(JSON.stringify({ mode: "dry-run", model, count: calculators.length, slugs: calculators.map((c) => c.slug) }, null, 2))
  process.exit(0)
}

await mkdir("public/assets/calculators", { recursive: true })
const manifestPath = "public/assets/calculators/manifest.json"
let existing = {}
try { existing = JSON.parse(await readFile(manifestPath, "utf8")) } catch {}
const manifest = { ...existing, generatedAt: new Date().toISOString(), provider: "xAI", model, assets: { ...(existing.assets || {}) } }

async function generate(calculator) {
  const output = path.join("public/assets/calculators", `${calculator.slug}.jpg`)
  if (!force) {
    try { await access(output); return { slug: calculator.slug, status: "skipped" } } catch {}
  }
  const prompt = `Create a premium cinematic editorial hero image for an Israeli financial calculator about: ${calculator.title}. Concept: ${calculator.description}. Wide 16:9 composition, sophisticated modern Israeli visual language, deep navy and electric blue with warm gold accents, dramatic volumetric light, elegant realistic 3D objects and subtle data-inspired geometry, high-end fintech campaign, clean focal point, generous negative space, impressive but trustworthy. Absolutely no words, no letters, no Hebrew, no numbers, no logos, no watermarks, no UI screenshot.`
  const response = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    signal: AbortSignal.timeout(180000),
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt }),
  })
  const json = await response.json()
  if (!response.ok) throw new Error(`${calculator.slug}: xAI ${response.status} ${JSON.stringify(json)}`)
  const url = json.data?.[0]?.url
  if (!url) throw new Error(`${calculator.slug}: missing image URL`)
  const imageResponse = await fetch(url, { signal: AbortSignal.timeout(120000) })
  if (!imageResponse.ok) throw new Error(`${calculator.slug}: download ${imageResponse.status}`)
  const mime = imageResponse.headers.get("content-type") || ""
  if (!mime.startsWith("image/")) throw new Error(`${calculator.slug}: invalid MIME ${mime}`)
  const bytes = Buffer.from(await imageResponse.arrayBuffer())
  if (bytes.length > 15 * 1024 * 1024) throw new Error(`${calculator.slug}: image exceeds 15 MB`)
  const checksum = createHash("sha256").update(bytes).digest("hex")
  await writeFile(output, bytes)
  manifest.assets[calculator.slug] = {
    path: `/assets/calculators/${calculator.slug}.jpg`,
    provider: "xAI", model, prompt, mime, bytes: bytes.length, sha256: checksum,
    requestId: response.headers.get("x-request-id") || null,
    costInUsdTicks: json.usage?.cost_in_usd_ticks ?? null,
    state: "draft", generatedAt: new Date().toISOString(),
  }
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n")
  return { slug: calculator.slug, status: "ready", bytes: bytes.length, costInUsdTicks: json.usage?.cost_in_usd_ticks ?? null }
}

const results = []
for (const calculator of calculators) {
  const result = await generate(calculator)
  results.push(result)
  console.log(JSON.stringify(result))
}
console.log(JSON.stringify({ complete: true, count: results.length, manifest: manifestPath }))
