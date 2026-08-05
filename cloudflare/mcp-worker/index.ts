import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createToolmdServer } from "../../mcp/create-server";
import {
  MAX_MARKDOWN_BYTES,
  normalizePdfFilename,
  renderMarkdownToPdf,
  renderMarkdownToPdfBinary,
  type PdfFormat,
  type PdfRenderInput,
} from "../../mcp/pdf";

interface Env {
  BROWSER: BrowserRun;
}

const MCP_PATHS = new Set(["/mcp", "/mcp/"]);
const PDF_PATH = "/pdf";
const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
  "access-control-allow-headers": "Content-Type, Accept, MCP-Protocol-Version, MCP-Session-Id, Last-Event-ID",
  "access-control-expose-headers": "MCP-Session-Id, Last-Event-ID",
};

function jsonResponse(body: Record<string, unknown>, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "content-type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  Object.entries(CORS_HEADERS).forEach(([name, value]) => headers.set(name, value));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function handleMcp(request: Request, env: Env): Promise<Response> {
  const server = createToolmdServer({
    renderPdf: (input) => renderMarkdownToPdf(env.BROWSER, input),
  });
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);
  return withCors(await transport.handleRequest(request));
}

function parsePdfInput(body: unknown): PdfRenderInput {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be a JSON object.");
  }

  const input = body as Record<string, unknown>;
  if (typeof input.markdown !== "string") {
    throw new Error("The markdown field is required and must be a string.");
  }
  if (new TextEncoder().encode(input.markdown).byteLength > MAX_MARKDOWN_BYTES) {
    throw new Error("Markdown source must be 45 MB or smaller.");
  }

  const format = input.format === undefined ? "a4" : input.format;
  if (format !== "a4" && format !== "a5" && format !== "letter" && format !== "legal") {
    throw new Error("format must be one of: a4, a5, letter, legal.");
  }

  const landscape = input.landscape === undefined ? false : input.landscape;
  if (typeof landscape !== "boolean") {
    throw new Error("landscape must be a boolean.");
  }

  const margins = input.margins === undefined ? "18" : input.margins;
  if (margins !== "10" && margins !== "18" && margins !== "25") {
    throw new Error("margins must be one of: 10, 18, 25.");
  }

  if (input.filename !== undefined && (typeof input.filename !== "string" || input.filename.length > 96)) {
    throw new Error("filename must be a string up to 96 characters.");
  }

  return {
    markdown: input.markdown,
    filename: input.filename as string | undefined,
    format: format as PdfFormat,
    landscape,
    margins,
  };
}

async function handlePdf(request: Request, env: Env): Promise<Response> {
  let input: PdfRenderInput;
  try {
    input = parsePdfInput(await request.json());
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Invalid PDF request." },
      400,
    );
  }

  try {
    const pdf = await renderMarkdownToPdfBinary(env.BROWSER, input);
    return new Response(pdf.data.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "cache-control": "no-store",
        "content-disposition": `attachment; filename="${normalizePdfFilename(pdf.filename)}"`,
        "content-length": String(pdf.bytes),
        "content-type": pdf.mimeType,
      },
    });
  } catch (error) {
    console.error("toolmd PDF request failed:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "PDF rendering failed." },
      502,
    );
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return jsonResponse({
        status: "ok",
        service: "toolmd-mcp",
      });
    }

    if (url.pathname === PDF_PATH) {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
      }
      if (request.method !== "POST") {
        return jsonResponse({ error: "The PDF endpoint only accepts POST requests." }, 405, {
          allow: "POST, OPTIONS",
        });
      }
      return handlePdf(request, env);
    }

    if (!MCP_PATHS.has(url.pathname)) {
      return jsonResponse({ error: "Not found" }, 404);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
      return await handleMcp(request, env);
    } catch (error) {
      console.error("toolmd MCP request failed:", error);
      return jsonResponse({ error: "MCP request failed." }, 500);
    }
  },
};
