import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { join } from "node:path";

const client = new Client({ name: "toolmd-smoke-client", version: "1.0.0" });
const transport = new StdioClientTransport({
  command: process.env.TOOLMD_MCP_COMMAND || join(process.cwd(), "bin/toolmd.mjs"),
  args: ["mcp"],
  cwd: process.cwd(),
  stderr: "inherit",
});

await client.connect(transport);
const tools = await client.listTools();
const jsonResponse = await client.callTool({
  name: "toolmd_json_format",
  arguments: { json: '{"name":"toolmd","ready":true}' },
});
const markdownResponse = await client.callTool({
  name: "toolmd_markdown_render",
  arguments: { markdown: "# Hello\n\n**ready**" },
});
const slugResponse = await client.callTool({
  name: "toolmd_slug",
  arguments: { value: "Markdown, ready to print!" },
});

const toolNames = new Set(tools.tools.map((tool) => tool.name));
for (const required of ["toolmd_catalog", "toolmd_json_format", "toolmd_markdown_render", "toolmd_slug"]) {
  if (!toolNames.has(required)) throw new Error(`MCP tool missing: ${required}`);
}

process.stdout.write(`${JSON.stringify({ toolCount: tools.tools.length, jsonResponse, markdownResponse, slugResponse }, null, 2)}\n`);
await client.close();
