import { TOOL_REGISTRY, getTool, type ToolDefinition } from "@/toolRegistry";
import { categoryLabel, localizedTool, type Language } from "@/i18n";
import { SEO_SITE } from "@/lib/seo";

const SITE = SEO_SITE.base;
const SITE_NAME = SEO_SITE.name;

const CATEGORY_TO_APPLICATION_CATEGORY: Record<string, string> = {
  Document: "UtilitiesApplication",
  Markdown: "UtilitiesApplication",
  "Developer data": "DeveloperApplication",
  "Text utility": "UtilitiesApplication",
  "Quick tools": "UtilitiesApplication",
  Integration: "DeveloperApplication",
};

const KEYWORDS_BY_CATEGORY: Record<string, string[]> = {
  Document: [
    "markdown to pdf",
    "markdown to word",
    "markdown to pptx",
    "merge pdf",
    "split pdf",
    "compress pdf",
    "docx",
    "pdf",
    "document",
  ],
  Markdown: [
    "markdown editor",
    "markdown table",
    "word counter",
    "html to markdown",
  ],
  "Developer data": [
    "json formatter",
    "json validator",
    "json diff",
    "yaml to json",
    "csv to json",
  ],
  "Text utility": [
    "text diff",
    "regex tester",
    "base64 encoder",
    "case converter",
    "slug generator",
    "url encoder",
  ],
  "Quick tools": [
    "qr code generator",
    "uuid generator",
    "password generator",
    "color picker",
  ],
  Integration: ["mcp server", "mcp tools", "ai integration"],
};

function websiteSchema(language: Language): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE,
    inLanguage: language === "vi" ? "vi-VN" : "en-US",
    description:
      language === "vi"
        ? "Bộ sưu tập 28 công cụ miễn phí chạy trong trình duyệt: Markdown sang PDF / Word / PPTX, JSON, YAML, CSV, regex, Base64, JWT, mã hóa URL, slug, UUID, mật khẩu, QR code và MCP cho AI."
        : "28 free browser-only tools for Markdown to PDF / Word / PPTX, JSON / YAML / CSV formatting, regex, Base64, JWT, slug / UUID / password, QR codes, color picking and an MCP server for AI agents.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

function organizationSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE,
    logo: `${SITE}/favicon.svg`,
    sameAs: ["https://github.com/luongtrz/tools"],
  };
}

function softwareApplicationSchema(
  tool: ToolDefinition,
  language: Language,
): Record<string, unknown> {
  const localized = localizedTool(tool, language);
  const description =
    language === "vi"
      ? `${localized.description} Chạy trực tiếp trong trình duyệt, miễn phí, không cần đăng ký.`
      : `${localized.description} Runs entirely in your browser, free, no sign-up required.`;
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: localized.title,
    url: `${SITE}/${tool.slug}/`,
    applicationCategory: CATEGORY_TO_APPLICATION_CATEGORY[tool.category] ??
      "UtilitiesApplication",
    operatingSystem: "Any (browser-based)",
    description,
    inLanguage: language === "vi" ? "vi-VN" : "en-US",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    keywords: (KEYWORDS_BY_CATEGORY[tool.category] ?? []).join(", "),
    applicationSuite: SITE_NAME,
    browserRequirements:
      "Requires a modern browser with JavaScript enabled. No installation.",
    featureList: [
      "Runs entirely in the browser",
      "No file upload, no sign-up",
      "Free to use",
      language === "vi" ? "Hỗ trợ tiếng Việt và tiếng Anh" : "Vietnamese and English support",
    ],
  };
}

function itemListSchema(language: Language): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: TOOL_REGISTRY.length,
    itemListElement: TOOL_REGISTRY.map((tool, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE}/${tool.slug}/`,
      name: localizedTool(tool, language).title,
    })),
  };
}

function breadcrumbSchema(
  tool: ToolDefinition,
  language: Language,
): Record<string, unknown> {
  const localized = localizedTool(tool, language);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: SITE_NAME,
        item: SITE,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryLabel(tool.category, language),
        item: `${SITE}/?category=${encodeURIComponent(tool.category)}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: localized.title,
        item: `${SITE}/${tool.slug}/`,
      },
    ],
  };
}

export interface StructuredDataSet {
  schemas: Record<string, unknown>[];
}

export function homeStructuredData(language: Language): StructuredDataSet {
  return {
    schemas: [websiteSchema(language), organizationSchema(), itemListSchema(language)],
  };
}

export function toolStructuredData(
  slug: string,
  language: Language,
): StructuredDataSet {
  const tool = getTool(slug);
  if (!tool) return homeStructuredData(language);
  return {
    schemas: [
      softwareApplicationSchema(tool, language),
      breadcrumbSchema(tool, language),
    ],
  };
}
