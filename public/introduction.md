# Toolmd MCP introduction

You are an AI agent integrating Toolmd as a remote MCP server.

## Connection

- Transport: MCP Streamable HTTP
- Endpoint: `https://toolmd-mcp.22120199.workers.dev/mcp`
- Local installation: not required
- Local Node.js/npm environment: not required

Register this server in the MCP host using the host's remote HTTP configuration:

```json
{
  "mcpServers": {
    "toolmd": {
      "url": "https://toolmd-mcp.22120199.workers.dev/mcp"
    }
  }
}
```

## Verify the connection

After registering the server, call `toolmd_catalog`. The call must return the
available Toolmd tools. Do not fall back to
`npm install`, `npm link`, `toolmd mcp`, or any local process.

## Available tools

Use Toolmd for Markdown rendering and statistics, Markdown-to-PDF conversion,
JSON formatting and validation, JSON and text diffing, YAML/JSON/CSV conversion,
Markdown tables, regular expressions, Base64, case conversion, slugs, UUIDs,
and passwords.

For PDF output, call `toolmd_md2pdf` with `markdown`, and optionally `filename`,
`format` (`a4`, `letter`, or `legal`) and `landscape`. The tool returns
`filename`, `mimeType`, `bytes`, and a Base64-encoded `base64` field in
`structuredContent`. Decode that field to save or forward the PDF file.

The PDF tool accepts Markdown up to 30 MB. It renders the document remotely, so
the user does not need a local browser, Node.js, npm package, or PDF binary.

Prefer the tool's `structuredContent` when passing results to later agent steps.
Call the most specific tool for the user's request and report real MCP errors.
