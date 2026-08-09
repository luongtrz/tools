import { TOOL_REGISTRY } from "../src/toolRegistry";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const SITE = "https://toolmd.pages.dev";
const here = dirname(fileURLToPath(import.meta.url));

function urlEntry(loc: string, lastmod: string): string {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${loc === `${SITE}/` ? "1.0" : "0.8"}</priority>
  </url>`;
}

const lastmod = new Date().toISOString().slice(0, 10);
const entries: string[] = [];

entries.push(
  urlEntry(`${SITE}/`, lastmod),
);

for (const tool of TOOL_REGISTRY) {
  const path = `/${tool.slug}/`;
  entries.push(urlEntry(`${SITE}${path}`, lastmod));
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>
${entries.join("\n")}
</urlset>
`;

writeFileSync(resolve(here, "..", "public", "sitemap.xml"), xml, "utf8");
console.log(
  `Wrote ${entries.length} URLs to public/sitemap.xml (lastmod=${lastmod})`,
);
