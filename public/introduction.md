# Toolmd MCP introduction

You are an AI agent integrating Toolmd as a remote MCP server.

## Connection

- Transport: MCP Streamable HTTP
- Endpoint: `https://toolmd-mcp.22120199.workers.dev/mcp`
- Authentication: `Authorization: Bearer <MCP_AUTH_TOKEN>`
- Local installation: not required
- Local Node.js/npm environment: not required

Register this server in the MCP host using the host's remote HTTP configuration:

```json
{
  "mcpServers": {
    "toolmd": {
      "url": "https://toolmd-mcp.22120199.workers.dev/mcp",
      "headers": {
        "Authorization": "Bearer <MCP_AUTH_TOKEN>"
      }
    }
  }
}
```

Use the existing `MCP_AUTH_TOKEN` from the host's secret store, environment, or
provided integration context. Never print, commit, or expose the token. If no
credential is available, report that authentication is required instead of
guessing one.

## Verify the connection

After registering the server, call `toolmd_catalog`. The call must return the
available Toolmd tools. If the server returns `401`, fix the Bearer token. If it
returns `503`, the Worker secret is not configured. Do not fall back to
`npm install`, `npm link`, `toolmd mcp`, or any local process.

## Available tools

Use Toolmd for Markdown rendering and statistics, JSON formatting and
validation, JSON and text diffing, YAML/JSON/CSV conversion, Markdown tables,
regular expressions, Base64, case conversion, slugs, UUIDs, and passwords.

Prefer the tool's `structuredContent` when passing results to later agent steps.
Call the most specific tool for the user's request and report real MCP errors.
