import "dotenv/config";
import { runAgent } from "./src/agent/index.js";

const topic = process.argv.slice(2).join(" ").trim();

if (!topic) {
  console.error('Usage: node cli.js "<news topic>"');
  process.exit(1);
}

try {
  const analysis = await runAgent(topic, {
    onProgress: (event) => {
      if (event.type === "tool_call") {
        console.error(`[progress] (${event.count}) calling ${event.tool}...`);
      } else if (event.type === "analyzing") {
        console.error("[progress] gathering done, analyzing...");
      }
    },
  });

  console.log(JSON.stringify(analysis, null, 2));
} catch (err) {
  console.error("Agent run failed:", err);
  process.exit(1);
}
