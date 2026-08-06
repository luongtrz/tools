import { TOOL_REGISTRY } from "../src/toolRegistry";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const SITE = "https://toolmd.pages.dev";
const here = dirname(fileURLToPath(import.meta.url));

function urlEntry(loc: string, lastmod: string, alternates: string[]): string {
  const altEntries = alternates
    .map(
      (alt) =>
        `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}" />`,
    )
    .join("\n");
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${loc === `${SITE}/` ? "1.0" : "0.8"}</priority>
${altEntries}
  </url>`;
}

const lastmod = new Date().toISOString().slice(0, 10);
const entries: string[] = [];

entries.push(
  urlEntry(`${SITE}/`, lastmod, [
    { hreflang: "vi", href: `${SITE}/vi/` },
    { hreflang: "en", href: `${SITE}/en/` },
    { hreflang: "x-default", href: `${SITE}/` },
  ]),
);

for (const tool of TOOL_REGISTRY) {
  const path = `/${tool.slug}/`;
  entries.push(
    urlEntry(`${SITE}${path}`, lastmod, [
      { hreflang: "vi", href: `${SITE}/vi${path}` },
      { hreflang: "en", href: `${SITE}/en${path}` },
      { hreflang: "x-default", href: `${SITE}${path}` },
    ]),
  );
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${entries.join("\n")}
</urlset>
`;

writeFileSync(resolve(here, "..", "public", "sitemap.xml"), xml, "utf8");
console.log(
  `Wrote ${entries.length} URLs to public/sitemap.xml (lastmod=${lastmod})`,
);
