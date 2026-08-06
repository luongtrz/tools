const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";

export function tokenizeWords(input: string): string[] {
  if (!input) return [];
  const tokens: string[] = [];
  const re =
    /[A-Z]+(?=[A-Z][a-z])|[A-Z]?[a-z]+|[A-Z]+|[0-9]+|[ぁ-ゟ゠-ヿ]+|[\u4e00-\u9fff]+/g;
  const matches = input.match(re) ?? [];
  for (const match of matches) {
    tokens.push(match);
  }
  return tokens;
}

export function toKebab(input: string): string {
  return tokenizeWords(input).map((t) => t.toLowerCase()).join("-");
}

export function toSnake(input: string): string {
  return tokenizeWords(input).map((t) => t.toLowerCase()).join("_");
}

export function toConstant(input: string): string {
  return tokenizeWords(input).map((t) => t.toUpperCase()).join("_");
}

export function toCamel(input: string): string {
  const tokens = tokenizeWords(input).map((t) => t.toLowerCase());
  return tokens
    .map((token, index) =>
      index === 0
        ? token
        : token.charAt(0).toUpperCase() + token.slice(1),
    )
    .join("");
}

export function toPascal(input: string): string {
  return tokenizeWords(input)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join("");
}

export function toDot(input: string): string {
  return tokenizeWords(input).map((t) => t.toLowerCase()).join(".");
}

export function toTitle(input: string): string {
  const stopWords = new Set([
    "a", "an", "and", "as", "at", "but", "by", "for", "in", "nor", "of",
    "on", "or", "the", "to", "with",
  ]);
  const tokens = tokenizeWords(input).map((t) => t.toLowerCase());
  return tokens
    .map((token, index) => {
      if (index > 0 && index < tokens.length - 1 && stopWords.has(token)) {
        return token;
      }
      return token.charAt(0).toUpperCase() + token.slice(1);
    })
    .join(" ");
}

export function toSentence(input: string): string {
  const sentence = tokenizeWords(input).map((t) => t.toLowerCase()).join(" ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

export function toUpper(input: string): string {
  return input.toUpperCase();
}

export function toLower(input: string): string {
  return input.toLowerCase();
}

export const UPPER_CHARS = UPPER;
export const LOWER_CHARS = LOWER;
export const DIGIT_CHARS = DIGITS;

export interface CaseVariant {
  id: string;
  label: string;
  value: string;
}

export function listCaseVariants(input: string): CaseVariant[] {
  if (!input) return [];
  return [
    { id: "lower", label: "lowercase", value: toLower(input) },
    { id: "upper", label: "UPPERCASE", value: toUpper(input) },
    { id: "title", label: "Title Case", value: toTitle(input) },
    { id: "sentence", label: "Sentence case", value: toSentence(input) },
    { id: "camel", label: "camelCase", value: toCamel(input) },
    { id: "pascal", label: "PascalCase", value: toPascal(input) },
    { id: "snake", label: "snake_case", value: toSnake(input) },
    { id: "constant", label: "CONSTANT_CASE", value: toConstant(input) },
    { id: "kebab", label: "kebab-case", value: toKebab(input) },
    { id: "dot", label: "dot.case", value: toDot(input) },
  ];
}
