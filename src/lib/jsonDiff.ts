export interface JsonDiffEntry {
  path: string;
  type: "added" | "removed" | "changed" | "unchanged";
  before?: unknown;
  after?: unknown;
}

export interface JsonDiffOptions {
  ignoreArrayOrder?: boolean;
}

export function diffJsonValues(
  before: unknown,
  after: unknown,
  options: JsonDiffOptions = {},
): JsonDiffEntry[] {
  const entries: JsonDiffEntry[] = [];
  walk(before, after, "$", entries, options);
  return entries;
}

function walk(
  before: unknown,
  after: unknown,
  path: string,
  entries: JsonDiffEntry[],
  options: JsonDiffOptions,
): void {
  if (deepEqual(before, after)) {
    entries.push({ path, type: "unchanged", before, after });
    return;
  }
  if (isPlainObject(before) && isPlainObject(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const key of keys) {
      walk(
        (before as Record<string, unknown>)[key],
        (after as Record<string, unknown>)[key],
        `${path}.${key}`,
        entries,
        options,
      );
    }
    return;
  }
  if (Array.isArray(before) && Array.isArray(after)) {
    if (options.ignoreArrayOrder) {
      const beforeSet = new Set(before.map(stableKey));
      const afterSet = new Set(after.map(stableKey));
      for (const value of before) {
        const key = stableKey(value);
        if (!afterSet.has(key)) {
          entries.push({ path: `${path}[]`, type: "removed", before: value });
        } else {
          entries.push({
            path: `${path}[]`,
            type: "unchanged",
            before: value,
            after: value,
          });
        }
        beforeSet.delete(key);
      }
      for (const value of after) {
        if (!beforeSet.has(stableKey(value))) {
          entries.push({ path: `${path}[]`, type: "added", after: value });
        }
      }
      return;
    }
    const max = Math.max(before.length, after.length);
    for (let i = 0; i < max; i += 1) {
      walk(before[i], after[i], `${path}[${i}]`, entries, options);
    }
    return;
  }
  if (before === undefined) {
    entries.push({ path, type: "added", after });
    return;
  }
  if (after === undefined) {
    entries.push({ path, type: "removed", before });
    return;
  }
  entries.push({ path, type: "changed", before, after });
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((value, index) => deepEqual(value, b[index]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) return false;
    return keys.every((key) => deepEqual(a[key], b[key]));
  }
  return false;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function stableKey(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
