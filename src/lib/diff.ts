export type DiffRow = {
  type: "added" | "removed" | "same";
  text: string;
};

function splitLines(value: string): string[] {
  return value ? value.split(/\r?\n/) : [];
}

function positionalDiff(left: string[], right: string[]): DiffRow[] {
  const rows: DiffRow[] = [];
  const total = Math.max(left.length, right.length);
  for (let index = 0; index < total; index += 1) {
    if (left[index] === right[index]) {
      if (left[index] !== undefined) rows.push({ type: "same", text: left[index] });
      continue;
    }
    if (left[index] !== undefined) rows.push({ type: "removed", text: left[index] });
    if (right[index] !== undefined) rows.push({ type: "added", text: right[index] });
  }
  return rows;
}

export function diffLines(leftValue: string, rightValue: string): DiffRow[] {
  const left = splitLines(leftValue);
  const right = splitLines(rightValue);
  if (!left.length && !right.length) return [];

  // Keep very large pastes responsive while using an accurate LCS diff for normal tool use.
  if (left.length * right.length > 250_000) return positionalDiff(left, right);

  const lcs = Array.from({ length: left.length + 1 }, () =>
    Array<number>(right.length + 1).fill(0),
  );
  for (let leftIndex = left.length - 1; leftIndex >= 0; leftIndex -= 1) {
    for (let rightIndex = right.length - 1; rightIndex >= 0; rightIndex -= 1) {
      lcs[leftIndex][rightIndex] =
        left[leftIndex] === right[rightIndex]
          ? lcs[leftIndex + 1][rightIndex + 1] + 1
          : Math.max(lcs[leftIndex + 1][rightIndex], lcs[leftIndex][rightIndex + 1]);
    }
  }

  const rows: DiffRow[] = [];
  let leftIndex = 0;
  let rightIndex = 0;
  while (leftIndex < left.length || rightIndex < right.length) {
    if (
      leftIndex < left.length &&
      rightIndex < right.length &&
      left[leftIndex] === right[rightIndex]
    ) {
      rows.push({ type: "same", text: left[leftIndex] });
      leftIndex += 1;
      rightIndex += 1;
    } else if (
      leftIndex < left.length &&
      (rightIndex >= right.length ||
        lcs[leftIndex + 1][rightIndex] >= lcs[leftIndex][rightIndex + 1])
    ) {
      rows.push({ type: "removed", text: left[leftIndex] });
      leftIndex += 1;
    } else {
      rows.push({ type: "added", text: right[rightIndex] });
      rightIndex += 1;
    }
  }
  return rows;
}
