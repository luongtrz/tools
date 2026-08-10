import type { Plugin } from "vite";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { TOOL_REGISTRY, getTool } from "./src/toolRegistry.ts";
import { getToolSeoContent } from "./src/lib/seoContent.ts";

const SITE = "https://toolmd.pages.dev";

function renderToolHtml(
  slug: string,
  language: "vi" | "en",
  category: string,
  assetTags: string[],
): string {
  const tool = getTool(slug);
  if (!tool) throw new Error(`tool-prerender: unknown tool ${slug}`);
  const seo = getToolSeoContent(tool, language);
  const ogImage = `${SITE}/og-default.svg`;
  const canonical = `${SITE}/${slug}/`;
  const safe = (value: string) =>
    value.replace(/[&<>"']/g, (character) => {
      const entities: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return entities[character];
    });
  const safeTitle = safe(seo.pageTitle);
  const safeDescription = safe(seo.description);
  const safeH1 = safe(seo.h1);
  const safeIntro = safe(seo.intro);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: seo.h1,
      url: canonical,
      applicationCategory:
        category === "Developer data" || category === "Integration"
          ? "DeveloperApplication"
          : "UtilitiesApplication",
      operatingSystem: "Any (browser-based)",
      description: seo.description,
      inLanguage: language === "vi" ? "vi-VN" : "en-US",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      applicationSuite: "toolmd",
      browserRequirements:
        "Requires a modern browser with JavaScript enabled. No installation.",
      image: ogImage,
      featureList: seo.benefits,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "toolmd", item: SITE },
        {
          "@type": "ListItem",
          position: 2,
          name: category,
          item: `${SITE}/?category=${encodeURIComponent(category)}`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: seo.h1,
          item: canonical,
        },
      ],
    },
  ];
  return `<!doctype html>
<html lang="${language}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#F2633D" />
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}" />
    <meta name="keywords" content="${safe(seo.keywords.join(", "))}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta name="author" content="toolmd" />
    <link rel="canonical" href="${canonical}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:alt" content="${safe(seo.h1)}" />
    <meta property="og:image:type" content="image/svg+xml" />
    <meta property="og:site_name" content="toolmd" />
    <meta property="og:locale" content="${language === "vi" ? "vi_VN" : "en_US"}" />
    <meta property="og:locale:alternate" content="${language === "vi" ? "en_US" : "vi_VN"}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${ogImage}" />
    <meta name="twitter:site" content="@toolmd" />
    <script type="application/ld+json" data-seo="jsonld">${JSON.stringify(jsonLd[0])}</script>
    <script type="application/ld+json" data-seo="jsonld">${JSON.stringify(jsonLd[1])}</script>
${assetTags.map((tag) => `    ${tag}`).join("\n")}
  </head>
  <body>
    <div id="root">
      <main>
        <article>
          <p>${safe(category)}</p>
          <h1>${safeH1}</h1>
          <p>${safeDescription}</p>
          <p>${safeIntro}</p>
          <h2>${language === "vi" ? `Cách dùng ${safeH1}` : `How to use ${safeH1}`}</h2>
          <ol>
${seo.steps.map((step) => `            <li>${safe(step)}</li>`).join("\n")}
          </ol>
          <h2>${language === "vi" ? "Điểm nổi bật" : "Key features"}</h2>
          <ul>
${seo.benefits.map((benefit) => `            <li>${safe(benefit)}</li>`).join("\n")}
          </ul>
          <h2>${language === "vi" ? "Lưu ý" : "Good to know"}</h2>
          <p>${safe(seo.limitation)}</p>
          <nav aria-label="${language === "vi" ? "Công cụ liên quan" : "Related tools"}">
            <a href="${SITE}/">${language === "vi" ? "Xem tất cả công cụ" : "View all toolmd tools"}</a>
${seo.relatedSlugs.map((relatedSlug) => `            <a href="${SITE}/${relatedSlug}/">${safe(getTool(relatedSlug)?.title ?? relatedSlug)}</a>`).join("\n")}
          </nav>
        </article>
      </main>
    </div>
  </body>
</html>
`;
}

function toolPrerenderPlugin(): Plugin {
  return {
    name: "tool-prerender",
    apply: "build",
    writeBundle(options) {
      const outDir = options.dir ?? "dist";
      const indexHtmlSource = readFileSync(join(outDir, "index.html"), "utf-8");
      // Reuse the exact <script type="module">/<link modulepreload|stylesheet>
      // tags Vite generated for the real entry point, so the prerendered
      // shell always loads the same JS/CSS graph without hand-tracking chunks.
      const assetTags = indexHtmlSource
        .split("\n")
        .map((line) => line.trim())
        .filter(
          (line) =>
            line.startsWith('<script type="module"') ||
            line.startsWith('<link rel="modulepreload"') ||
            line.startsWith('<link rel="stylesheet"'),
        );
      if (assetTags.length === 0) {
        throw new Error("tool-prerender: found no asset tags in index.html");
      }

      for (const tool of TOOL_REGISTRY) {
        const html = renderToolHtml(
          tool.slug,
          "en",
          tool.category,
          assetTags,
        );
        const toolDir = join(outDir, tool.slug);
        mkdirSync(toolDir, { recursive: true });
        writeFileSync(join(toolDir, "index.html"), html);
      }
    },
  };
}

export { toolPrerenderPlugin };
