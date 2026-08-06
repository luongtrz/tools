export function generateUUID(count: number): string[] {
  const list: string[] = [];
  for (let i = 0; i < count; i += 1) {
    list.push(singleUUID());
  }
  return list;
}

function singleUUID(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  // Fallback: use crypto.getRandomValues
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    return formatUUID(bytes);
  }
  // Last resort
  const bytes = new Array(16)
    .fill(0)
    .map(() => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return formatUUID(bytes);
}

function formatUUID(bytes: Uint8Array | number[]): string {
  const hex: string[] = [];
  for (let i = 0; i < 16; i += 1) {
    hex.push((bytes[i] ?? 0).toString(16).padStart(2, "0"));
  }
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
    .slice(6, 8)
    .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

export type UuidFormat = "lines" | "json" | "csv" | "sql";

export function formatUuidList(
  list: string[],
  format: UuidFormat,
): string {
  switch (format) {
    case "lines":
      return list.join("\n");
    case "json":
      return JSON.stringify(list, null, 2);
    case "csv":
      return ["uuid", ...list].join("\n");
    case "sql": {
      if (!list.length) return "";
      const literal = list.map((id) => `'${id.replace(/'/g, "''")}'`).join(", ");
      return `(${literal})`;
    }
    default:
      return list.join("\n");
  }
}
