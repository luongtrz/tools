import { TOOL_REGISTRY, getTool, type ToolDefinition } from "@/toolRegistry";
import { categoryLabel, localizedTool, type Language } from "@/i18n";

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
      ? "toolmd — bộ công cụ Markdown, PDF và developer chạy trong trình duyệt"
      : "toolmd — focused Markdown, PDF and developer tools that run in your browser",
    description: isVi
      ? "toolmd là bộ sưu tập 30 công cụ miễn phí chạy hoàn toàn trong trình duyệt: Markdown sang PDF / Word / PPTX, PDF sang ảnh, ảnh sang PDF, JSON, YAML, CSV, regex, Base64, mã hóa URL, JWT, slug, UUID, mật khẩu, QR code và MCP cho AI. Không cần đăng ký, không upload file."
      : "toolmd is a collection of 30 free, browser-only tools for Markdown to PDF / Word / PPTX, PDF to image, images to PDF, JSON / YAML / CSV formatting, regex testing, Base64, URL encoding, JWT decoding, slug / UUID / password generation, QR codes, color picking and an MCP server for AI agents. No sign-up, no uploads.",
    canonical: `${SITE_BASE}/`,
    ogType: "website",
    keywords: keywordsFor(),
    ogImage: DEFAULT_OG_IMAGE,
  };
}

export function toolSeo(slug: string, language: Language): SeoMeta {
  const tool = getTool(slug);
  if (!tool) return homeSeo(language);
  const localized = localizedTool(tool, language);
  const isVi = language === "vi";
  const base = homeSeo(language);
  return {
    title: isVi
      ? `${localized.title} — toolmd`
      : `${localized.title} — free online ${localized.title.toLowerCase()} | toolmd`,
    description: isVi
      ? `${localized.description} Chạy trực tiếp trong trình duyệt, miễn phí, không cần đăng ký.`
      : `${localized.description} Runs entirely in your browser, free, no sign-up required.`,
    canonical: `${SITE_BASE}/${slug}/`,
    ogType: "article",
    keywords: keywordsFor(slug),
    ogImage: DEFAULT_OG_IMAGE,
  };
  void base;
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
