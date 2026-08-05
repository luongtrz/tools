import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createToolmdServer } from "../../mcp/create-server";

interface Env {
  MCP_AUTH_TOKEN: string;
}

const MCP_PATHS = new Set(["/mcp", "/mcp/"]);
const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
  "access-control-allow-headers": "Authorization, Content-Type, Accept, MCP-Protocol-Version, MCP-Session-Id, Last-Event-ID",
  "access-control-expose-headers": "MCP-Session-Id, Last-Event-ID, WWW-Authenticate",
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

async function sameToken(left: string, right: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [leftDigest, rightDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const leftBytes = new Uint8Array(leftDigest);
  const rightBytes = new Uint8Array(rightDigest);
  let difference = leftBytes.length ^ rightBytes.length;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }
  return difference === 0;
}

async function isAuthorized(request: Request, configuredToken: string | undefined): Promise<boolean> {
  if (!configuredToken) return false;
  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return false;
  const suppliedToken = authorization.slice("Bearer ".length).trim();
  return suppliedToken.length > 0 && sameToken(suppliedToken, configuredToken.trim());
}

async function handleMcp(request: Request, env: Env): Promise<Response> {
  if (!env.MCP_AUTH_TOKEN?.trim()) {
    return jsonResponse({ error: "MCP_AUTH_TOKEN is not configured." }, 503);
  }

  if (!(await isAuthorized(request, env.MCP_AUTH_TOKEN))) {
    return jsonResponse(
      { error: "Missing or invalid Bearer token." },
      401,
      { "www-authenticate": 'Bearer realm="toolmd-mcp"' },
    );
  }

  const server = createToolmdServer();
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
      return jsonResponse({ status: "ok", service: "toolmd-mcp" });
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
