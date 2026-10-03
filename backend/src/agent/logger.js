function timestamp() {
  return new Date().toISOString();
}

function truncateForLog(value, max = 500) {
  const str = typeof value === "string" ? value : JSON.stringify(value);
  if (!str) return str;
  return str.length > max ? `${str.slice(0, max)}… (${str.length} chars total)` : str;
}

export function logToolCall(name, input) {
  console.error(`[${timestamp()}] → tool_call ${name} ${truncateForLog(input)}`);
}

export function logToolResult(name, result) {
  console.error(`[${timestamp()}] ← tool_result ${name} ${truncateForLog(result)}`);
}

export function logInfo(message) {
  console.error(`[${timestamp()}] ${message}`);
}

export function logError(message, err) {
  console.error(`[${timestamp()}] ERROR: ${message}`, err?.message ?? err);
}
