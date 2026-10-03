import "dotenv/config";
import express from "express";
import cors from "cors";
import { runAgent } from "./src/agent/index.js";
import { logError, logInfo } from "./src/agent/logger.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Streams progress events over SSE, then a final "result" (or "error") event.
app.post("/api/analyze", async (req, res) => {
  const topic = (req.body?.topic ?? "").trim();

  if (!topic) {
    res.status(400).json({ error: "topic is required" });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  send("status", { message: `Searching for coverage of "${topic}"…` });

  try {
    const analysis = await runAgent(topic, {
      onProgress: (event) => {
        if (event.type === "tool_call" && event.tool === "search_news") {
          send("status", { message: `Searching: "${event.input.query}"…` });
        } else if (event.type === "tool_call" && event.tool === "fetch_article") {
          send("status", { message: `Reading ${event.input.url}…` });
        } else if (event.type === "tool_result" && event.tool === "fetch_article") {
          if (event.result?.error) {
            send("status", { message: `Skipped a source: ${event.result.error}` });
          } else {
            send("status", { message: `Read ${event.result.outlet}` });
          }
        } else if (event.type === "analyzing") {
          send("status", { message: "Comparing framing across outlets…" });
        }
      },
    });

    send("result", analysis);
  } catch (err) {
    logError("agent run failed", err);
    send("error", { message: err.message ?? "Agent run failed" });
  } finally {
    res.end();
  }
});

app.use((err, _req, res, _next) => {
  logError("unhandled error", err);
  res.status(500).json({ error: "internal server error" });
});

app.listen(PORT, () => {
  logInfo(`News Bias Comparer API listening on http://localhost:${PORT}`);
});
