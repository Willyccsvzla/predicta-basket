import fs from "node:fs";
import { createServer } from "vite";

const metrics = JSON.parse(fs.readFileSync("src/data/metrics.json", "utf8"));
const season = JSON.parse(fs.readFileSync("src/data/season-2027.json", "utf8"));
const games = JSON.parse(fs.readFileSync("src/data/games-2025.json", "utf8"));
const ids = new Set(season.map((g) => g.id));
const failures = [];
if (games.length !== 1230) failures.push("games");
if (metrics.metrics.n !== 1230 || metrics.metrics.acc !== 68.37 || metrics.metrics.brier !== 0.2074) failures.push("metrics");
if (metrics.metrics.correct !== 841) failures.push("correct");
if (season.length !== 1200 || ids.size !== 1200) failures.push("season");
if (season.some((g) => String(g.id).startsWith("SANDBOX"))) failures.push("sandbox in calendar");
const counts = {};
for (const g of season) {
  counts[g.aa] = (counts[g.aa] || 0) + 1;
  counts[g.ha] = (counts[g.ha] || 0) + 1;
}
if (Object.keys(counts).length !== 30 || Object.values(counts).some((n) => n !== 80)) failures.push("team counts");

const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
const mod = await server.ssrLoadModule("/src/lib/predicta/sandbox.ts");
const report = mod.executeSandbox();
await server.close();
const flags = Object.entries(report).filter(([, v]) => v === false);
if (flags.length) failures.push(`sandbox ${flags.map(([k]) => k).join(",")}`);
if (report.realPredictions !== 0 || report.secondFreeze !== "REJECTED_ALREADY_FROZEN") failures.push("counters");
console.log(JSON.stringify({ failures, report }, null, 2));
if (failures.length) process.exit(1);
