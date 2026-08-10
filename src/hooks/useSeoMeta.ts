import { useEffect } from "react";
import { useI18n, type Language } from "@/i18n";
import { SEO_SITE, homeSeo, toolSeo, type SeoMeta } from "@/lib/seo";
import {
  homeStructuredData,
  toolStructuredData,
} from "@/lib/structuredData";

function setMeta(name: string, content: string, attr: "name" | "property" = "name"): void {
  if (typeof document === "undefined") return;
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${name}"]`,
  );
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setCanonical(href: string): void {
  if (typeof document === "undefined") return;
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

function clearStructuredData(): void {
  if (typeof document === "undefined") return;
  const nodes = document.head.querySelectorAll('script[data-seo="jsonld"]');
  nodes.forEach((node) => node.remove());
}

function setStructuredData(schemas: Record<string, unknown>[]): void {
  if (typeof document === "undefined") return;
  clearStructuredData();
  for (const schema of schemas) {
    const script = document.createElement("script");
    script.setAttribute("type", "application/ld+json");
    script.setAttribute("data-seo", "jsonld");
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }
}

function applySeo(meta: SeoMeta, language: Language, slug?: string): void {
  document.title = meta.title;
  setMeta("description", meta.description);
  setMeta("keywords", meta.keywords.join(", "));
  setCanonical(meta.canonical);
  setMeta("og:title", meta.title, "property");
  setMeta("og:description", meta.description, "property");
  setMeta("og:type", meta.ogType, "property");
  setMeta("og:url", meta.canonical, "property");
  setMeta("og:site_name", SEO_SITE.name, "property");
  setMeta("og:locale", language === "vi" ? "vi_VN" : "en_US", "property");
  if (meta.ogImage) {
    setMeta("og:image", meta.ogImage, "property");
    setMeta("og:image:alt", meta.title, "property");
  }
  setMeta("twitter:card", "summary_large_image");
  setMeta("twitter:title", meta.title);
  setMeta("twitter:description", meta.description);
  if (meta.ogImage) {
    setMeta("twitter:image", meta.ogImage);
  }
  setMeta("twitter:site", SEO_SITE.twitter);

  const structured = slug
    ? toolStructuredData(slug, language)
    : homeStructuredData(language);
  setStructuredData(structured.schemas);
}

export function useSeoMeta(slug?: string): void {
  const { language } = useI18n();
  const meta = slug ? toolSeo(slug, language) : homeSeo(language);
  useEffect(() => {
    applySeo(meta, language, slug);
  }, [meta, language, slug]);
}
