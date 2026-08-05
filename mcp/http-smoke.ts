import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const endpoint = process.env.TOOLMD_MCP_URL || "https://toolmd-mcp.22120199.workers.dev/mcp";
const transport = new StreamableHTTPClientTransport(new URL(endpoint));
const client = new Client({ name: "toolmd-http-smoke", version: "1.0.0" });

await client.connect(transport);
const tools = await client.listTools();
if (tools.tools.length !== 18) {
  throw new Error(`Expected 18 MCP tools, received ${tools.tools.length}.`);
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

const jwt = await client.callTool({
  name: "toolmd_jwt_decode",
  arguments: {
    token: "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ0b29sbWQifQ.",
  },
});
if (jwt.isError) {
  throw new Error("toolmd_jwt_decode returned an MCP error.");
}

const encodedUrl = await client.callTool({
  name: "toolmd_url_codec",
  arguments: { operation: "encode", value: "hello world" },
});
if (encodedUrl.isError) {
  throw new Error("toolmd_url_codec returned an MCP error.");
}

const pdf = await client.callTool({
  name: "toolmd_md2pdf",
  arguments: {
    markdown: "# PDF smoke test\n\nXin chào từ toolmd.",
    filename: "smoke-test.pdf",
    format: "a4",
  },
});
const pdfResult = pdf.structuredContent as { base64?: unknown; mimeType?: unknown; bytes?: unknown } | undefined;
const pdfText = pdf.content?.filter((item) => item.type === "text").map((item) => item.text).join(" ") || "";
if (pdf.isError || pdfResult?.mimeType !== "application/pdf" || typeof pdfResult.base64 !== "string" || !pdfResult.base64.startsWith("JVBERi0") || typeof pdfResult.bytes !== "number" || pdfText.includes("JVBERi0")) {
  throw new Error("toolmd_md2pdf did not return a PDF payload.");
}

console.log(JSON.stringify({ endpoint, toolCount: tools.tools.length, catalog: "ok", jsonFormat: "ok", jwt: "ok", urlCodec: "ok", md2pdf: `${pdfResult.bytes} bytes` }));
await transport.close();
