export function slugify(
  input: string,
  options: {
    separator?: string;
    lowercase?: boolean;
    maxLength?: number;
    preserveUnicode?: boolean;
  } = {},
): string {
  const {
    separator = "-",
    lowercase = true,
    maxLength = 80,
    preserveUnicode = false,
  } = options;
  if (!input) return "";
  let value = input.normalize("NFKD");
  if (!preserveUnicode) {
    value = value.replace(/[\u0300-\u036f]/g, "");
  }
  if (lowercase) value = value.toLowerCase();
  const pattern = preserveUnicode
    ? new RegExp(`[^\\p{L}\\p{N}${escapeRegex(separator)}]+`, "gu")
    : new RegExp(`[^a-z0-9${escapeRegex(separator)}]+`, "g");
  value = value.replace(pattern, separator);
  // Collapse multiple separators.
  const collapse = new RegExp(`${escapeRegex(separator)}{2,}`, "g");
  value = value.replace(collapse, separator);
  // Trim separators from start/end.
  const trim = new RegExp(`^${escapeRegex(separator)}+|${escapeRegex(separator)}+$`, "g");
  value = value.replace(trim, "");
  if (value.length > maxLength) {
    value = value.slice(0, maxLength);
    value = value.replace(new RegExp(`${escapeRegex(separator)}+$`), "");
  }
  return value;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
