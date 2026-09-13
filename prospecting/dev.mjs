import { spawn } from "node:child_process";
try {
  process.loadEnvFile(".env.prospecting.local");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", ...process.argv.slice(2)],
  { stdio: "inherit", env: process.env, windowsHide: true },
);
child.on("exit", (code) => {
  process.exitCode = code || 0;
});
process.on("SIGTERM", () => child.kill("SIGTERM"));
