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

Use Toolmd for Markdown rendering and statistics, JSON formatting and
validation, JSON and text diffing, YAML/JSON/CSV conversion, Markdown tables,
regular expressions, Base64, case conversion, slugs, UUIDs, and passwords.

Prefer the tool's `structuredContent` when passing results to later agent steps.
Call the most specific tool for the user's request and report real MCP errors.
