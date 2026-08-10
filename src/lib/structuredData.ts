import { TOOL_REGISTRY, getTool, type ToolDefinition } from "@/toolRegistry";
import { categoryLabel, localizedTool, type Language } from "@/i18n";
import { SEO_SITE } from "@/lib/seo";
import { getToolSeoContent } from "@/lib/seoContent";

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

function websiteSchema(language: Language): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE,
    inLanguage: language === "vi" ? "vi-VN" : "en-US",
    description:
      language === "vi"
        ? `${TOOL_REGISTRY.length} công cụ miễn phí chạy trong trình duyệt: Markdown, PDF, JSON, YAML, CSV, regex, Base64, JWT, slug, UUID, mật khẩu, QR code và MCP cho AI.`
        : `${TOOL_REGISTRY.length} free browser tools for Markdown, PDF, JSON, YAML, CSV, regex, Base64, JWT, slug, UUID, passwords, QR codes and MCP for AI agents.`,
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
  const content = getToolSeoContent(tool, language);
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: content.h1,
    url: `${SITE}/${tool.slug}/`,
    applicationCategory: CATEGORY_TO_APPLICATION_CATEGORY[tool.category] ??
      "UtilitiesApplication",
    operatingSystem: "Any (browser-based)",
    description: content.description,
    image: `${SITE}/og-default.svg`,
    inLanguage: language === "vi" ? "vi-VN" : "en-US",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    keywords: content.keywords.join(", "),
    applicationSuite: SITE_NAME,
    browserRequirements:
      "Requires a modern browser with JavaScript enabled. No installation.",
    featureList: content.benefits,
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
