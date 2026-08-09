export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  customSymbols: string;
  excludeAmbiguous: boolean;
}

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.<>/?";
const AMBIGUOUS = new Set("I1lO0oB8S5G6Z2");

export function buildCharset(options: PasswordOptions): string {
  const parts: string[] = [];
  if (options.uppercase) parts.push(UPPER);
  if (options.lowercase) parts.push(LOWER);
  if (options.numbers) parts.push(DIGITS);
  if (options.symbols) {
    const custom = options.customSymbols.replace(/\s/g, "");
    parts.push(custom || SYMBOLS);
  }
  let charset = parts.join("");
  if (options.excludeAmbiguous) {
    charset = charset.split("").filter((ch) => !AMBIGUOUS.has(ch)).join("");
  }
  return charset;
}

export function generatePassword(options: PasswordOptions): {
  password: string;
  entropy: number;
  classes: number;
} {
  const charset = buildCharset(options);
  if (!charset) {
    return { password: "", entropy: 0, classes: 0 };
  }
  const length = Math.max(1, Math.min(128, Math.floor(options.length)));
  const out: string[] = [];
  const random = getCryptoRandom();
  for (let i = 0; i < length; i += 1) {
    out.push(charset[Math.floor(random() * charset.length)]);
  }
  // Guarantee at least one character from each enabled class.
  const classesList = classesListFor(options, charset);
  for (let i = 0; i < Math.min(classesList.length, length); i += 1) {
    out[i] = classesList[i][Math.floor(random() * classesList[i].length)];
  }
  const password = shuffle(out, random).join("");
  const entropy = Math.log2(charset.length) * length;
  return { password, entropy, classes: classesList.length };
}

function classesListFor(options: PasswordOptions, charset: string): string[] {
  const out: string[] = [];
  const add = (source: string) => {
    const filtered = filterCharset(source, charset);
    if (filtered) out.push(filtered);
  };
  if (options.uppercase) add(UPPER);
  if (options.lowercase) add(LOWER);
  if (options.numbers) add(DIGITS);
  if (options.symbols) {
    const custom = options.customSymbols.replace(/\s/g, "") || SYMBOLS;
    add(custom);
  }
  return out;
}

function filterCharset(source: string, charset: string): string {
  return source.split("").filter((ch) => charset.includes(ch)).join("");
}

function getCryptoRandom(): () => number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    return () => {
      crypto.getRandomValues(buf);
      return buf[0] / 0x100000000;
    };
  }
  return Math.random;
}

function shuffle<T>(array: T[], random: () => number): T[] {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function passwordStrengthLabel(entropy: number): {
  label: string;
  tone: "weak" | "fair" | "good" | "strong";
} {
  if (entropy < 40) return { label: "Weak", tone: "weak" };
  if (entropy < 60) return { label: "Fair", tone: "fair" };
  if (entropy < 90) return { label: "Good", tone: "good" };
  return { label: "Strong", tone: "strong" };
}
