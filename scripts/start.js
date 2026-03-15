#!/usr/bin/env node
/**
 * Start Next.js on 0.0.0.0 and PORT so Railway/proxy can reach the app.
 */
const { spawn } = require("child_process");

const port = process.env.PORT || "3000";
console.error("[compd] Starting Next.js on 0.0.0.0:%s (PORT=%s)", port, process.env.PORT || "(default)");
const child = spawn(
  "npx",
  ["next", "start", "--hostname", "0.0.0.0", "-p", port],
  { stdio: "inherit", env: process.env }
);
child.on("exit", (code) => process.exit(code ?? 0));
