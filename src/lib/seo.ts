import { TOOL_REGISTRY, getTool, type ToolDefinition } from "@/toolRegistry";
import { type Language } from "@/i18n";
import { getToolSeoContent } from "@/lib/seoContent";

const SITE_NAME = "toolmd";
const SITE_BASE = "https://toolmd.pages.dev";
const SITE_TWITTER = "@toolmd";
const DEFAULT_OG_IMAGE = `${SITE_BASE}/og-default.svg`;

export interface SeoMeta {
  title: string;
  description: string;
  canonical: string;
  ogType: "website" | "article";
  keywords: string[];
  ogImage?: string;
}

const KEYWORDS_BY_CATEGORY: Record<string, string[]> = {
  Document: [
    "markdown to pdf",
    "markdown to word",
    "markdown to pptx",
    "pdf to word",
    "merge pdf",
    "split pdf",
    "compress pdf",
    "docx",
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

function keywordsFor(slug?: string): string[] {
  if (!slug) {
    return [
      "markdown to pdf",
      "json formatter",
      "base64 encoder",
      "regex tester",
      "qr code generator",
      "uuid generator",
      "password generator",
      "color picker",
      "mcp",
      "browser tools",
    ];
  }
  const tool = getTool(slug);
  if (!tool) return [];
  const set = new Set<string>([tool.slug, tool.title.toLowerCase()]);
  for (const key of KEYWORDS_BY_CATEGORY[tool.category] ?? []) {
    set.add(key);
  }
  return Array.from(set);
}

export function homeSeo(language: Language): SeoMeta {
  const isVi = language === "vi";
  return {
    title: isVi
      ? "toolmd — công cụ Markdown, PDF và developer miễn phí online"
      : "toolmd — focused Markdown, PDF and developer tools that run in your browser",
    description: isVi
      ? `toolmd là bộ sưu tập ${TOOL_REGISTRY.length} công cụ miễn phí chạy hoàn toàn trong trình duyệt: Markdown, PDF, JSON, YAML, CSV, regex, Base64, JWT, slug, UUID, mật khẩu, QR code và MCP cho AI. Không cần đăng ký, không upload file.`
      : `toolmd is a collection of ${TOOL_REGISTRY.length} free browser tools for Markdown, PDF, JSON, YAML, CSV, regex, Base64, JWT, slug, UUID, passwords, QR codes and MCP for AI agents. No sign-up or uploads.`,
    canonical: `${SITE_BASE}/`,
    ogType: "website",
    keywords: keywordsFor(),
    ogImage: DEFAULT_OG_IMAGE,
  };
}

export function toolSeo(slug: string, language: Language): SeoMeta {
  const tool = getTool(slug);
  if (!tool) return homeSeo(language);
  const content = getToolSeoContent(tool, language);
  return {
    title: content.pageTitle,
    description: content.description,
    canonical: `${SITE_BASE}/${slug}/`,
    ogType: "website",
    keywords: Array.from(new Set([...content.keywords, ...keywordsFor(slug)])),
    ogImage: DEFAULT_OG_IMAGE,
  };
}

export function listAllSlugs(): string[] {
  return TOOL_REGISTRY.map((tool: ToolDefinition) => tool.slug);
}

export const SEO_SITE = {
  name: SITE_NAME,
  base: SITE_BASE,
  twitter: SITE_TWITTER,
  defaultOgImage: DEFAULT_OG_IMAGE,
};

export function categoryKeywords(category: string): string[] {
  return KEYWORDS_BY_CATEGORY[category] ?? [];
}
