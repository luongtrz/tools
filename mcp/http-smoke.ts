import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const endpoint = process.env.TOOLMD_MCP_URL || "https://toolmd-mcp.22120199.workers.dev/mcp";
const token = process.env.MCP_AUTH_TOKEN;

if (!token) {
  throw new Error("MCP_AUTH_TOKEN is required for the remote MCP smoke test.");
}

const transport = new StreamableHTTPClientTransport(new URL(endpoint), {
  requestInit: {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
});
const client = new Client({ name: "toolmd-http-smoke", version: "1.0.0" });

await client.connect(transport);
const tools = await client.listTools();
if (tools.tools.length !== 15) {
  throw new Error(`Expected 15 MCP tools, received ${tools.tools.length}.`);
}

const catalog = await client.callTool({ name: "toolmd_catalog", arguments: {} });
if (catalog.isError) {
  throw new Error("toolmd_catalog returned an MCP error.");
}

const formatted = await client.callTool({
  name: "toolmd_json_format",
  arguments: { json: '{"name":"toolmd","ready":true}' },
});
if (formatted.isError) {
  throw new Error("toolmd_json_format returned an MCP error.");
}

console.log(JSON.stringify({ endpoint, toolCount: tools.tools.length, catalog: "ok", jsonFormat: "ok" }));
await transport.close();
