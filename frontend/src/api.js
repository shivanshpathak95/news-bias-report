const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * POSTs a topic to /api/analyze and streams back Server-Sent Events.
 * Calls onStatus(message) for progress updates, then resolves with the
 * final analysis object (or rejects with an Error on an "error" event).
 */
export async function runAnalysis(topic, { onStatus, signal } = {}) {
  const response = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
    signal,
  });

  if (!response.ok || !response.body) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const chunk of events) {
      const lines = chunk.split("\n");
      let eventName = "message";
      let data = "";
      for (const line of lines) {
        if (line.startsWith("event:")) eventName = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (!data) continue;

      const parsed = JSON.parse(data);
      if (eventName === "status") {
        onStatus?.(parsed.message);
      } else if (eventName === "result") {
        return parsed;
      } else if (eventName === "error") {
        throw new Error(parsed.message || "Analysis failed");
      }
    }
  }

  throw new Error("Stream ended without a result");
}
