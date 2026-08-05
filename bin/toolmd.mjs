#!/usr/bin/env node

import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const tsx = join(packageRoot, "node_modules", "tsx", "dist", "cli.mjs");
const requestedMode = process.argv[2] === "mcp" ? "mcp" : "cli";
const entrypoint = join(packageRoot, requestedMode === "mcp" ? "mcp/server.ts" : "cli/toolmd.ts");
const forwardedArgs = requestedMode === "mcp" ? process.argv.slice(3) : process.argv.slice(2);

const child = spawn(process.execPath, [tsx, entrypoint, ...forwardedArgs], {
  cwd: packageRoot,
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
