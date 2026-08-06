export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface RegexFlagInfo {
  flag: string;
  description: string;
}

export const REGEX_FLAGS: RegexFlagInfo[] = [
  { flag: "g", description: "Global match" },
  { flag: "i", description: "Case insensitive" },
  { flag: "m", description: "Multiline" },
  { flag: "s", description: "Dot matches newlines" },
  { flag: "u", description: "Unicode" },
  { flag: "y", description: "Sticky" },
];

export interface RegexMatchInfo {
  match: string;
  index: number;
  end: number;
  groups: { name?: string; value: string; index: number }[];
  namedGroups: Record<string, string>;
}

export type RegexEvalResult =
  | { ok: true; matches: RegexMatchInfo[]; error: null }
  | { ok: false; matches: []; error: { message: string; line?: number; column?: number } };

export function evaluateRegex(
  source: string,
  flags: string,
  input: string,
): RegexEvalResult {
  if (!source) return { ok: true, matches: [], error: null };
  try {
    const regex = new RegExp(source, flags);
    const matches: RegexMatchInfo[] = [];
    if (flags.includes("g")) {
      let match: RegExpExecArray | null;
      while ((match = regex.exec(input)) !== null) {
        if (match[0] === "" && regex.lastIndex === match.index) {
          regex.lastIndex += 1;
          continue;
        }
        matches.push(buildMatchInfo(match));
        if (regex.lastIndex === match.index) regex.lastIndex += 1;
      }
    } else {
      const match = regex.exec(input);
      if (match) matches.push(buildMatchInfo(match));
    }
    return { ok: true, matches, error: null };
  } catch (error) {
    return { ok: false, matches: [], error: { message: (error as Error).message } };
  }
}

function buildMatchInfo(match: RegExpExecArray): RegexMatchInfo {
  const groups: { name?: string; value: string; index: number }[] = [];
  for (let i = 1; i < match.length; i += 1) {
    groups.push({ value: match[i] ?? "", index: i });
  }
  const namedGroups: Record<string, string> = {};
  if (match.groups) {
    for (const [name, value] of Object.entries(match.groups)) {
      if (typeof value === "string") namedGroups[name] = value;
    }
  }
  return {
    match: match[0],
    index: match.index,
    end: match.index + match[0].length,
    groups,
    namedGroups,
  };
}
