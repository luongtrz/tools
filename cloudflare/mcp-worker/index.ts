import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createToolmdServer } from "../../mcp/create-server";
import { renderMarkdownToPdf } from "../../mcp/pdf";

interface Env {
  BROWSER: BrowserRun;
}

const MCP_PATHS = new Set(["/mcp", "/mcp/"]);
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return jsonResponse({
        status: "ok",
        service: "toolmd-mcp",
      });
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
