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
const discovered = await client.listTools();
const requiredTools = [
  "toolmd_catalog",
  "toolmd_markdown_render",
  "toolmd_markdown_stats",
  "toolmd_json_format",
  "toolmd_json_validate",
  "toolmd_json_diff",
  "toolmd_data_convert",
  "toolmd_markdown_table",
  "toolmd_text_diff",
  "toolmd_regex_test",
  "toolmd_base64",
  "toolmd_case_convert",
  "toolmd_slug",
  "toolmd_uuid",
  "toolmd_password",
];

const toolNames = new Set(discovered.tools.map((tool) => tool.name));
for (const required of requiredTools) {
  if (!toolNames.has(required)) throw new Error(`MCP tool missing: ${required}`);
}

async function call(name: string, args: Record<string, unknown>) {
  const response = await client.callTool({ name, arguments: args });
  if (response.isError) throw new Error(`MCP tool failed: ${name}`);
  return response;
}

const responses = {
  catalog: await call("toolmd_catalog", {}),
  markdown: await call("toolmd_markdown_render", { markdown: "# Hello\n\n**ready**" }),
  stats: await call("toolmd_markdown_stats", { markdown: "# Hello\n\n**ready**" }),
  json: await call("toolmd_json_format", { json: '{"name":"toolmd","ready":true}' }),
  jsonValidate: await call("toolmd_json_validate", { json: '{"ready":true}' }),
  jsonDiff: await call("toolmd_json_diff", { first: '{"ready":false}', second: '{"ready":true}' }),
  yaml: await call("toolmd_data_convert", { format: "yaml-to-json", value: "ready: true" }),
  csv: await call("toolmd_data_convert", { format: "csv-to-json", value: "name,status\ntoolmd,ready" }),
  table: await call("toolmd_markdown_table", { operation: "generate", headers: "Name,Status", rows: 2 }),
  textDiff: await call("toolmd_text_diff", { original: "one\ntwo", changed: "one\nthree" }),
  regex: await call("toolmd_regex_test", { pattern: "toolmd", flags: "g", text: "toolmd ready" }),
  base64: await call("toolmd_base64", { operation: "encode", value: "Xin chào" }),
  case: await call("toolmd_case_convert", { value: "A focused tool", mode: "kebab" }),
  slug: await call("toolmd_slug", { value: "Markdown, ready to print!" }),
  uuid: await call("toolmd_uuid", { count: 2 }),
  password: await call("toolmd_password", { length: 20, symbols: true }),
};

process.stdout.write(`${JSON.stringify({ toolCount: discovered.tools.length, calledTools: Object.keys(responses), sampleResponses: { json: responses.json, markdown: responses.markdown, slug: responses.slug } }, null, 2)}\n`);
await client.close();
