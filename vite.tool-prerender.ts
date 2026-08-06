import type { Plugin } from "vite";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SITE = "https://toolmd.pages.dev";

interface ToolSeo {
  title: string;
  description: string;
  slug: string;
  category: string;
}

const TOOLS: ToolSeo[] = [
  { slug: "md2pdf", category: "Document", title: "Markdown to PDF — free online converter | toolmd", description: "Write Markdown, preview it and download a clean PDF directly from the browser. No upload, no sign-up." },
  { slug: "md2word", category: "Document", title: "Markdown to Word (DOC/DOCX) — free online converter | toolmd", description: "Convert Markdown to editable DOC or DOCX. Runs in the browser, free, no sign-up required." },
  { slug: "md2pptx", category: "Document", title: "Markdown to PowerPoint (PPTX) — free online converter | toolmd", description: "Turn Markdown sections into a PPTX slide deck. Pick the aspect ratio and download in one click." },
  { slug: "merge-pdf", category: "Document", title: "Merge PDF files — free online tool | toolmd", description: "Combine multiple PDF files into a single document, in the order you choose. Free, no upload." },
  { slug: "split-pdf", category: "Document", title: "Split PDF by pages — free online tool | toolmd", description: "Pick the pages you need (1, 3-5, all, odd, even) and download a new PDF in your browser." },
  { slug: "compress-pdf", category: "Document", title: "Compress a PDF — free online tool | toolmd", description: "Optimize a PDF by re-saving it with object streams. See the before/after size before downloading." },
  { slug: "markdown-editor", category: "Markdown", title: "Markdown editor with live preview — toolmd", description: "A focused Markdown editor with a side-by-side live preview, local autosave and a .md import/export." },
  { slug: "markdown-table-generator", category: "Markdown", title: "Markdown table generator — toolmd", description: "Generate a clean Markdown table from a list of headers and a row count. Editable grid, copy-paste ready." },
  { slug: "markdown-table-formatter", category: "Markdown", title: "Markdown table formatter — toolmd", description: "Format and align pipe tables in your clipboard, fix escaped pipes and pick left/center/right per column." },
  { slug: "markdown-word-counter", category: "Markdown", title: "Markdown word and reading-time counter — toolmd", description: "Count words, characters, paragraphs, headings and code blocks in your Markdown. Pick a reading speed in WPM." },
  { slug: "html-to-markdown", category: "Markdown", title: "HTML to Markdown converter — toolmd", description: "Convert HTML (including tables, images, h4-h6, ordered lists) to clean Markdown. Surfaces a warning for unsupported tags." },
  { slug: "jwt-decoder", category: "Developer data", title: "JWT decoder — toolmd", description: "Decode a JWT header, payload and signature locally. Surfaces iat / nbf / exp / iss / aud / sub / jti and clock skew." },
  { slug: "json-formatter", category: "Developer data", title: "JSON formatter / beautifier — toolmd", description: "Format, minify and validate JSON in your browser. Line/column error highlight, 2/4/tab indent, file import." },
  { slug: "json-validator", category: "Developer data", title: "JSON validator — toolmd", description: "Validate JSON syntax locally. Real-time line/column error and copy/download the normalized result." },
  { slug: "json-diff", category: "Developer data", title: "JSON diff — toolmd", description: "Semantic JSON diff with JSONPath-style changed paths, ignore-order option and swap A/B." },
  { slug: "yaml-json", category: "Developer data", title: "YAML ↔ JSON converter — toolmd", description: "Convert between YAML and JSON in either direction. Auto-detects the input format and supports file import." },
  { slug: "csv-json", category: "Developer data", title: "CSV ↔ JSON converter — toolmd", description: "Convert between CSV and JSON. Auto-detects comma/tab/semicolon delimiters, shows a table preview and warns on duplicate headers." },
  { slug: "text-diff", category: "Text utility", title: "Text diff — toolmd", description: "Compare two texts by line, word or character. Ignore case or whitespace, swap, clear and download the diff." },
  { slug: "regex-tester", category: "Text utility", title: "Regex tester — toolmd", description: "Test a regular expression with flag checkboxes (g/i/m/s/u/y), match indices, numbered and named capture groups." },
  { slug: "base64", category: "Text utility", title: "Base64 encoder / decoder — toolmd", description: "Encode or decode Base64 in standard, Base64URL padded or unpadded variants. Unicode safe." },
  { slug: "case-converter", category: "Text utility", title: "Case converter — toolmd", description: "Convert text between lower, UPPER, Title, Sentence, camel, Pascal, snake, CONSTANT, kebab and dot.case in one click." },
  { slug: "slug-generator", category: "Text utility", title: "Slug generator — toolmd", description: "Turn any title into a clean URL slug. Choose separator, max length and Unicode-preserve mode." },
  { slug: "url-codec", category: "Text utility", title: "URL encode / decode — toolmd", description: "Encode or decode URL components, full URLs or application/x-www-form-urlencoded. Query-parameter table builder." },
  { slug: "qr-generator", category: "Quick tools", title: "QR code generator — toolmd", description: "Generate a QR code from text or a URL. Wi-Fi, vCard, Email, SMS and Phone presets, PNG and SVG export." },
  { slug: "uuid-generator", category: "Quick tools", title: "UUID v4 generator — toolmd", description: "Generate up to 200 UUID v4 values. Output as lines, JSON array, CSV or SQL IN list, copy or download." },
  { slug: "password-generator", category: "Quick tools", title: "Secure password generator — toolmd", description: "Generate a strong random password (4-128 chars). Toggle upper/lower/numbers/symbols, set a custom symbol set, see entropy bits." },
  { slug: "color-picker", category: "Quick tools", title: "Color picker (HEX / RGB / HSL / alpha) — toolmd", description: "Pick a color, see HEX / RGB / HSL / alpha, check WCAG contrast against light and dark backgrounds." },
  { slug: "mcp", category: "Integration", title: "toolmd MCP for AI agents — toolmd", description: "Connect an AI host to toolmd's MCP server (Streamable HTTP, 18 tools) for Markdown, JSON, regex, Base64, JWT, UUID and more." },
];

function renderToolHtml(
  title: string,
  description: string,
  slug: string,
  language: "vi" | "en",
  category: string,
  assetTags: string[],
): string {
  const ogImage = `${SITE}/og-default.svg`;
  const canonical = `${SITE}/${slug}/`;
  const pathSlug = `/${slug}/`;
  const base = SITE;
  const safeTitle = title.replace(/</g, "&lt;");
  const safeDescription = description.replace(/</g, "&lt;");
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: title.split(" — ")[0] ?? title,
      url: canonical,
      applicationCategory:
        category === "Developer data" || category === "Integration"
          ? "DeveloperApplication"
          : "UtilitiesApplication",
      operatingSystem: "Any (browser-based)",
      description: safeDescription,
      inLanguage: language === "vi" ? "vi-VN" : "en-US",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      applicationSuite: "toolmd",
      browserRequirements:
        "Requires a modern browser with JavaScript enabled. No installation.",
      featureList: [
        "Runs entirely in the browser",
        "No file upload, no sign-up",
        "Free to use",
        "Vietnamese and English support",
      ],
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
          name: title.split(" — ")[0] ?? title,
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
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${canonical}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="alternate" hreflang="vi" href="${base}/vi${pathSlug}" />
    <link rel="alternate" hreflang="en" href="${base}/en${pathSlug}" />
    <link rel="alternate" hreflang="x-default" href="${canonical}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:site_name" content="toolmd" />
    <meta property="og:locale" content="${language === "vi" ? "vi_VN" : "en_US"}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${ogImage}" />
    <script type="application/ld+json" data-seo="jsonld">${JSON.stringify(jsonLd[0])}</script>
    <script type="application/ld+json" data-seo="jsonld">${JSON.stringify(jsonLd[1])}</script>
${assetTags.map((tag) => `    ${tag}`).join("\n")}
  </head>
  <body>
    <div id="root"></div>
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

      for (const tool of TOOLS) {
        const html = renderToolHtml(
          tool.title,
          tool.description,
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
