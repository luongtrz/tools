export type WordCountMode = "raw" | "prose";

export interface WordCountResult {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  lines: number;
  paragraphs: number;
  headings: number;
  codeBlocks: number;
  readingMinutes: number;
  wpm: number;
}

export function countWords(
  input: string,
  mode: WordCountMode = "raw",
  wpm = 220,
): WordCountResult {
  const trimmed = input ?? "";
  if (!trimmed) {
    return {
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      lines: 0,
      paragraphs: 0,
      headings: 0,
      codeBlocks: 0,
      readingMinutes: 0,
      wpm,
    };
  }
  const lines = trimmed.split(/\r?\n/).length;
  const paragraphs = trimmed
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean).length;
  const headingMatches = trimmed.match(/^#{1,6}\s+\S.*$/gm) ?? [];
  const codeBlockMatches = trimmed.match(/```[\s\S]*?```/g) ?? [];
  const characters = Array.from(trimmed).length;
  const charactersNoSpaces = Array.from(
    trimmed.replace(/\s+/g, ""),
  ).length;
  let prose = trimmed;
  if (mode === "prose") {
    prose = prose
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]+`/g, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/^[#>\-\*\+]+\s*/gm, "")
      .replace(/[*_~`]+/g, "");
  }
  const words = prose.trim() ? prose.trim().split(/\s+/).length : 0;
  const readingMinutes = words ? Math.ceil(words / Math.max(1, wpm)) : 0;
  return {
    words,
    characters,
    charactersNoSpaces,
    lines,
    paragraphs,
    headings: headingMatches.length,
    codeBlocks: codeBlockMatches.length,
    readingMinutes,
    wpm,
  };
}

export const WPM_PRESETS = [150, 200, 220, 250, 300];
