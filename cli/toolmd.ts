import { readFile } from "node:fs/promises";
import {
  base64,
  catalog,
  convertCase,
  convertCsvJson,
  convertYamlJson,
  createPassword,
  createUuid,
  diffJson,
  diffText,
  formatJson,
  formatMarkdownTable,
  generateMarkdownTable,
  markdownRender,
  markdownStats,
  slugify,
  testRegex,
  validateJson,
} from "../mcp/toolkit";

const args = process.argv.slice(2);
const command = args[0];

function option(name: string): string | undefined {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
}

function required(name: string): string {
  const value = option(name);
  if (!value) throw new Error(`Missing required option --${name}`);
  return value;
}

async function input(): Promise<string> {
  const file = option("file");
  if (file) return readFile(file, "utf8");
  return required("text");
}

function print(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function help(): void {
  process.stdout.write(`toolmd CLI\n\nCommands:\n  catalog\n  markdown-render --text <markdown>\n  markdown-stats --text <markdown>\n  json-format --text <json>\n  json-validate --text <json>\n  json-diff --first <json> --second <json>\n  data-convert --format <yaml-to-json|json-to-yaml|csv-to-json|json-to-csv> --text <data>\n  markdown-table --operation <generate|format> [--headers <csv>] [--rows <n>] [--text <table>]\n  text-diff --first <text> --second <text>\n  regex-test --pattern <regex> --flags <flags> --text <text>\n  base64 --operation <encode|decode> --text <value>\n  case --mode <upper|lower|title|camel|snake|kebab> --text <value>\n  slug --text <title>\n  uuid --count <n>\n  password --length <n> --symbols <true|false>\n\nUse --file <path> instead of --text for commands that accept one text input.\n`);
}

async function main(): Promise<void> {
  switch (command) {
    case "catalog":
      print({ tools: catalog() });
      return;
    case "markdown-render":
      print(markdownRender(await input()));
      return;
    case "markdown-stats":
      print(markdownStats(await input()));
      return;
    case "json-format":
      print(formatJson(await input()));
      return;
    case "json-validate":
      print(validateJson(await input()));
      return;
    case "json-diff":
      print(diffJson(required("first"), required("second")));
      return;
    case "data-convert": {
      const format = required("format") as "yaml-to-json" | "json-to-yaml" | "csv-to-json" | "json-to-csv";
      print(format.includes("yaml") ? convertYamlJson(await input(), format as "yaml-to-json" | "json-to-yaml") : convertCsvJson(await input(), format as "csv-to-json" | "json-to-csv"));
      return;
    }
    case "markdown-table": {
      const operation = required("operation");
      print({ result: operation === "generate" ? generateMarkdownTable(option("headers") || "Column 1,Column 2", Number(option("rows") || 3)) : formatMarkdownTable(await input()) });
      return;
    }
    case "text-diff":
      print({ rows: diffText(required("first"), required("second")) });
      return;
    case "regex-test":
      print(testRegex(required("pattern"), option("flags") || "g", await input()));
      return;
    case "base64":
      print(base64(await input(), required("operation") as "encode" | "decode"));
      return;
    case "case":
      print({ value: convertCase(await input(), required("mode") as "upper" | "lower" | "title" | "camel" | "snake" | "kebab") });
      return;
    case "slug":
      print({ slug: slugify(await input()) });
      return;
    case "uuid":
      print({ values: Array.from({ length: Math.max(1, Math.min(50, Number(option("count") || 1))) }, createUuid) });
      return;
    case "password":
      print({ password: createPassword(Number(option("length") || 20), option("symbols") !== "false") });
      return;
    default:
      help();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
