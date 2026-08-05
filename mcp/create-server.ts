import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  base64,
  catalog,
  convertCase,
  convertCsvJson,
  convertYamlJson,
  createPassword,
  createUuid,
  decodeJwt,
  diffJson,
  diffText,
  formatJson,
  formatMarkdownTable,
  generateMarkdownTable,
  markdownRender,
  markdownStats,
  slugify,
  testRegex,
  urlCodec,
  validateJson,
} from "./toolkit";
import { MAX_MARKDOWN_BYTES } from "./pdf";
import type { PdfRenderInput, PdfRenderOutput } from "./pdf";

function result(value: unknown) {
  const payload = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  const structured = typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : { result: value };
  return {
    content: [{ type: "text" as const, text: payload }],
    structuredContent: structured,
  };
}

function pdfResult(value: PdfRenderOutput) {
  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({ filename: value.filename, mimeType: value.mimeType, bytes: value.bytes }, null, 2),
    }],
    structuredContent: value as unknown as Record<string, unknown>,
  };
}

export interface ToolmdServerOptions {
  renderPdf?: (input: PdfRenderInput) => Promise<PdfRenderOutput>;
}

export function createToolmdServer(options: ToolmdServerOptions = {}): McpServer {
  const server = new McpServer({
    name: "toolmd",
    version: "1.0.0",
  });

  server.registerTool(
    "toolmd_catalog",
    {
      title: "Toolmd catalog",
      description: "List all tools available in the toolmd web application with descriptions and URLs.",
    },
    async () => result({ tools: catalog() }),
  );

  server.registerTool(
    "toolmd_markdown_render",
    {
      title: "Render Markdown",
      description: "Render Markdown into the same HTML preview format used by toolmd and return document statistics.",
      inputSchema: { markdown: z.string().describe("Markdown source") },
    },
    async ({ markdown }) => result(markdownRender(markdown)),
  );

  server.registerTool(
    "toolmd_md2pdf",
    {
      title: "Convert Markdown to PDF",
      description: "Render Markdown into a downloadable PDF and return the file as Base64.",
      inputSchema: {
        markdown: z.string().refine(
          (value) => new TextEncoder().encode(value).byteLength <= MAX_MARKDOWN_BYTES,
          { message: "Markdown source must be 45 MB or smaller." },
        ).describe("Markdown source, up to 45 MB"),
        filename: z.string().max(96).optional().describe("Output filename, with or without .pdf"),
        format: z.enum(["a4", "letter", "legal"]).default("a4"),
        landscape: z.boolean().default(false),
      },
    },
    async ({ markdown, filename, format, landscape }) => {
      if (!options.renderPdf) {
        return {
          ...result({ valid: false, error: "PDF rendering is not configured on this MCP host." }),
          isError: true,
        };
      }
      try {
        return pdfResult(await options.renderPdf({ markdown, filename, format, landscape }));
      } catch (error) {
        return {
          ...result({ valid: false, error: error instanceof Error ? error.message : "PDF rendering failed." }),
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "toolmd_markdown_stats",
    {
      title: "Analyze Markdown",
      description: "Count words, characters, lines, and estimated reading time for Markdown text.",
      inputSchema: { markdown: z.string().describe("Markdown source") },
    },
    async ({ markdown }) => result(markdownStats(markdown)),
  );

  server.registerTool(
    "toolmd_json_format",
    {
      title: "Format JSON",
      description: "Validate and pretty-print JSON locally.",
      inputSchema: { json: z.string().describe("JSON source") },
    },
    async ({ json }) => result(formatJson(json)),
  );

  server.registerTool(
    "toolmd_json_validate",
    {
      title: "Validate JSON",
      description: "Check JSON syntax and return a useful validation message.",
      inputSchema: { json: z.string().describe("JSON source") },
    },
    async ({ json }) => result(validateJson(json)),
  );

  server.registerTool(
    "toolmd_json_diff",
    {
      title: "Compare JSON",
      description: "Compare two JSON values and return a line-oriented diff.",
      inputSchema: {
        first: z.string().describe("First JSON value"),
        second: z.string().describe("Second JSON value"),
      },
    },
    async ({ first, second }) => result(diffJson(first, second)),
  );

  server.registerTool(
    "toolmd_data_convert",
    {
      title: "Convert structured data",
      description: "Convert YAML to JSON, JSON to YAML, CSV to JSON, or JSON to CSV.",
      inputSchema: {
        format: z.enum(["yaml-to-json", "json-to-yaml", "csv-to-json", "json-to-csv"]),
        value: z.string().describe("Input data"),
      },
    },
    async ({ format, value }) => result(format.includes("yaml") ? convertYamlJson(value, format as "yaml-to-json" | "json-to-yaml") : convertCsvJson(value, format as "csv-to-json" | "json-to-csv")),
  );

  server.registerTool(
    "toolmd_markdown_table",
    {
      title: "Work with Markdown tables",
      description: "Generate a Markdown table from headers or align an existing Markdown table.",
      inputSchema: {
        operation: z.enum(["generate", "format"]),
        headers: z.string().optional().describe("Comma-separated headers for generation"),
        rows: z.number().int().min(1).max(30).optional().describe("Number of generated rows"),
        markdown: z.string().optional().describe("Existing Markdown table for formatting"),
      },
    },
    async ({ operation, headers, rows, markdown }) => result({
      result: operation === "generate"
        ? generateMarkdownTable(headers || "Column 1,Column 2", rows || 3)
        : formatMarkdownTable(markdown || ""),
    }),
  );

  server.registerTool(
    "toolmd_text_diff",
    {
      title: "Compare text",
      description: "Compare two text values line by line and classify added, removed, and unchanged lines.",
      inputSchema: {
        original: z.string(),
        changed: z.string(),
      },
    },
    async ({ original, changed }) => result({ rows: diffText(original, changed) }),
  );

  server.registerTool(
    "toolmd_regex_test",
    {
      title: "Test regular expression",
      description: "Run a JavaScript regular expression against text and return matches or a syntax error.",
      inputSchema: {
        pattern: z.string(),
        flags: z.string().default("g"),
        text: z.string(),
      },
    },
    async ({ pattern, flags, text }) => result(testRegex(pattern, flags, text)),
  );

  server.registerTool(
    "toolmd_base64",
    {
      title: "Encode or decode Base64",
      description: "Encode Unicode text to Base64 or decode Base64 back to Unicode text.",
      inputSchema: {
        operation: z.enum(["encode", "decode"]),
        value: z.string(),
      },
    },
    async ({ operation, value }) => result(base64(value, operation)),
  );

  server.registerTool(
    "toolmd_case_convert",
    {
      title: "Convert text case",
      description: "Convert text to upper, lower, title, camel, snake, or kebab case.",
      inputSchema: {
        value: z.string(),
        mode: z.enum(["upper", "lower", "title", "camel", "snake", "kebab"]),
      },
    },
    async ({ value, mode }) => result({ value: convertCase(value, mode) }),
  );

  server.registerTool(
    "toolmd_url_codec",
    {
      title: "Encode or decode URL components",
      description: "Encode or decode URL components locally without making a network request.",
      inputSchema: {
        operation: z.enum(["encode", "decode"]),
        value: z.string(),
      },
    },
    async ({ operation, value }) => result(urlCodec(value, operation)),
  );

  server.registerTool(
    "toolmd_jwt_decode",
    {
      title: "Decode JWT",
      description: "Decode a JWT header and payload locally. This does not verify the signature.",
      inputSchema: { token: z.string() },
    },
    async ({ token }) => result(decodeJwt(token)),
  );

  server.registerTool(
    "toolmd_slug",
    {
      title: "Generate URL slug",
      description: "Create a lowercase, accent-free URL slug from a title.",
      inputSchema: { value: z.string() },
    },
    async ({ value }) => result({ slug: slugify(value) }),
  );

  server.registerTool(
    "toolmd_uuid",
    {
      title: "Generate UUID",
      description: "Generate cryptographically random UUID v4 values.",
      inputSchema: { count: z.number().int().min(1).max(50).default(1) },
    },
    async ({ count }) => result({ values: Array.from({ length: count }, createUuid) }),
  );

  server.registerTool(
    "toolmd_password",
    {
      title: "Generate password",
      description: "Generate a cryptographically random password with optional symbols.",
      inputSchema: {
        length: z.number().int().min(8).max(128).default(20),
        symbols: z.boolean().default(true),
      },
    },
    async ({ length, symbols }) => result({ password: createPassword(length, symbols) }),
  );

  return server;
}
