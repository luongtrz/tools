export function detectFormat(
  name: string,
  text: string,
): "json" | "yaml" | "csv" | "tsv" | "markdown" | "html" | "text" {
  const lower = name.toLowerCase();
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".yaml") || lower.endsWith(".yml")) return "yaml";
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".tsv")) return "tsv";
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "markdown";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html";
  const trimmed = text.trim();
  if (!trimmed) return "text";
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch {
      /* not json */
    }
  }
  if (/^\s*[{]?\s*"?\w+"?\s*:\s*[\w\-"']/m.test(trimmed)) {
    return "yaml";
  }
  if (trimmed.split("\n", 2).every((line) => /[,\t;]/.test(line))) {
    return "csv";
  }
  if (/<\/?[a-z][\s\S]*?>/i.test(trimmed)) return "html";
  return "text";
}

export function formatExtension(format: string): string {
  return format === "tsv" ? "tsv" : format;
}
