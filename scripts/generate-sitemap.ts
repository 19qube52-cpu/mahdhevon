import { calculators } from "../src/data/calculators"
import { categories } from "../src/data/categories"
import { countries } from "../src/data/countries"
import { getAllSalarySlugs } from "../src/data/salary-pages"
import { writeFileSync } from "fs"

const BASE_URL = "https://chasav.li"
const today = new Date().toISOString().split("T")[0]

const countryEntries = Object.values(countries)

function hreflangTags(path: string): string {
  const il = `    <xhtml:link rel="alternate" hreflang="he-il" href="${BASE_URL}${path}" />`
  const others = countryEntries
    .filter((c) => c.code !== "IL")
    .map((c) => `    <xhtml:link rel="alternate" hreflang="${c.language}-${c.code.toLowerCase()}" href="${BASE_URL}/${c.language}/${c.code.toLowerCase()}${path}" />`)
  const xdefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${path}" />`
  return [il, ...others, xdefault].join("\n")
}

function countryPath(code: string, lang: string): string {
  return code === "IL" ? "" : `/${lang}/${code.toLowerCase()}`
}

function generateSitemap(): void {
  const urls: string[] = []

  // Homepage for each country
  for (const country of countryEntries) {
    const path = countryPath(country.code, country.language)
    urls.push(`  <url>
    <loc>${BASE_URL}${path}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <lastmod>${today}</lastmod>
${hreflangTags("/")}
  </url>`)
  }

  // Calculator pages for each country
  for (const calc of calculators) {
    for (const country of countryEntries) {
      const path = countryPath(country.code, country.language)
      const priority = calc.priority ?? 0.8
      const calcPath = `${path}/calculators/${calc.slug}`
      urls.push(`  <url>
    <loc>${BASE_URL}${calcPath}</loc>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
    <lastmod>${today}</lastmod>
${hreflangTags(`/calculators/${calc.slug}`)}
  </url>`)
    }
  }

  // Category pages (Israel only — categories are Hebrew)
  for (const cat of categories) {
    urls.push(`  <url>
    <loc>${BASE_URL}/categories/${cat.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <lastmod>${today}</lastmod>
  </url>`)
  }

  // Special pages (no AI pages anymore)
  for (const path of ["/fun", "/embed-directory"]) {
    urls.push(`  <url>
    <loc>${BASE_URL}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <lastmod>${today}</lastmod>
  </url>`)
  }

  // Embed pages for each calculator
  for (const calc of calculators) {
    urls.push(`  <url>
    <loc>${BASE_URL}/embed/${calc.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
    <lastmod>${today}</lastmod>
  </url>`)
  }

  // Pre-calculated salary pages (long-tail SEO)
  for (const slug of getAllSalarySlugs()) {
    urls.push(`  <url>
    <loc>${BASE_URL}/salary/${slug}</loc>
    <changefreq>yearly</changefreq>
    <priority>0.6</priority>
    <lastmod>${today}</lastmod>
  </url>`)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`

  writeFileSync("public/sitemap.xml", xml)
  console.log(`Generated sitemap with ${urls.length} URLs`)
}

generateSitemap()
