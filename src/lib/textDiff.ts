export type DiffMode = "line" | "word" | "char";

export interface DiffRow {
  type: "added" | "removed" | "unchanged";
  text: string;
  left?: string;
  right?: string;
}

export function computeDiff(
  left: string,
  right: string,
  mode: DiffMode = "line",
  options: { ignoreCase?: boolean; ignoreWhitespace?: boolean } = {},
): DiffRow[] {
  if (mode === "line") {
    return diffByLine(left, right, options);
  }
  if (mode === "word") {
    return diffByToken(left, right, /\s+|[^\s\w]+/g, options);
  }
  return diffByToken(left, right, "", options);
}

function diffByLine(
  left: string,
  right: string,
  options: { ignoreCase?: boolean; ignoreWhitespace?: boolean },
): DiffRow[] {
  const leftLines = left.split(/\r?\n/);
  const rightLines = right.split(/\r?\n/);
  const lcs = lcsTable(leftLines, rightLines, (a, b) =>
    compareTokens(a, b, options),
  );
  return backtrack(lcs, leftLines, rightLines, (a, b) =>
    compareTokens(a, b, options),
  );
}

function diffByToken(
  left: string,
  right: string,
  splitter: string | RegExp,
  options: { ignoreCase?: boolean; ignoreWhitespace?: boolean },
): DiffRow[] {
  const leftTokens = splitter ? left.split(splitter) : Array.from(left);
  const rightTokens = splitter ? right.split(splitter) : Array.from(right);
  const lcs = lcsTable(leftTokens, rightTokens, (a, b) =>
    compareTokens(a, b, options),
  );
  const rows = backtrack(lcs, leftTokens, rightTokens, (a, b) =>
    compareTokens(a, b, options),
  );
  return rows.map((row) => {
    if (row.type === "unchanged") return row;
    return { ...row, text: row.text };
  });
}

function compareTokens(
  a: string,
  b: string,
  options: { ignoreCase?: boolean; ignoreWhitespace?: boolean },
): boolean {
  let left = a;
  let right = b;
  if (options.ignoreWhitespace) {
    left = left.replace(/\s+/g, " ").trim();
    right = right.replace(/\s+/g, " ").trim();
  }
  if (options.ignoreCase) {
    left = left.toLowerCase();
    right = right.toLowerCase();
  }
  return left === right;
}

function lcsTable<T>(
  left: T[],
  right: T[],
  eq: (a: T, b: T) => boolean,
): number[][] {
  const table: number[][] = Array.from({ length: left.length + 1 }, () =>
    new Array(right.length + 1).fill(0),
  );
  for (let i = left.length - 1; i >= 0; i -= 1) {
    for (let j = right.length - 1; j >= 0; j -= 1) {
      table[i][j] = eq(left[i], right[j])
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  return table;
}

function backtrack<T>(
  table: number[][],
  left: T[],
  right: T[],
  eq: (a: T, b: T) => boolean,
): DiffRow[] {
  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (eq(left[i], right[j])) {
      rows.push({ type: "unchanged", text: String(left[i]) });
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      rows.push({ type: "removed", text: String(left[i]) });
      i += 1;
    } else {
      rows.push({ type: "added", text: String(right[j]) });
      j += 1;
    }
  }
  while (i < left.length) {
    rows.push({ type: "removed", text: String(left[i]) });
    i += 1;
  }
  while (j < right.length) {
    rows.push({ type: "added", text: String(right[j]) });
    j += 1;
  }
  return rows;
}
