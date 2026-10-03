import Groq from "groq-sdk";
import { TOOL_DEFINITIONS, dispatchTool } from "./tools.js";
import { ANALYSIS_JSON_SCHEMA } from "./outputSchema.js";
import { SYSTEM_PROMPT } from "./prompts.js";
import { logToolCall, logToolResult, logInfo } from "./logger.js";

const MAX_TOOL_CALLS = Number(process.env.TOOL_CALL_BUDGET) || 10;
const MAX_SOURCES = Number(process.env.MAX_SOURCES) || 6;

function getClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set");
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

function parseToolArguments(raw) {
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

// Groq's API errors nest the useful message inside error.error.message; fall
// back to err.message for anything else (network errors, etc.).
function describeApiError(err) {
  return err?.error?.error?.message || err?.message || String(err);
}

/**
 * Runs the search -> fetch -> analyze agent loop for a topic.
 * `onProgress`, if given, is called with small status events so a caller
 * (API route / UI) can show "Searching…", "Reading Reuters…", etc.
 */
export async function runAgent(topic, { onProgress } = {}) {
  const client = getClient();
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Research this news topic and gather diverse coverage: "${topic}"`,
    },
  ];

  let toolCallCount = 0;
  let fetchedArticleCount = 0;
  let stopGathering = false;

  while (toolCallCount < MAX_TOOL_CALLS && !stopGathering) {
    let completion;
    try {
      completion = await client.chat.completions.create({
        model,
        messages,
        tools: TOOL_DEFINITIONS,
        tool_choice: "auto",
      });
    } catch (err) {
      throw new Error(`Gathering step failed: ${describeApiError(err)}`);
    }

    const message = completion.choices[0].message;
    messages.push(message);

    const toolCalls = message.tool_calls ?? [];
    if (toolCalls.length === 0) {
      break; // Agent decided it has enough sources.
    }

    for (const toolCall of toolCalls) {
      const name = toolCall.function.name;
      const input = parseToolArguments(toolCall.function.arguments);

      if (stopGathering) {
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({ info: "enough sources already gathered, stopping" }),
        });
        continue;
      }

      if (toolCallCount >= MAX_TOOL_CALLS) {
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({ error: "tool call budget exhausted" }),
        });
        continue;
      }

      toolCallCount += 1;
      logToolCall(name, input);
      onProgress?.({ type: "tool_call", tool: name, input, count: toolCallCount });

      const result = await dispatchTool(name, input);
      logToolResult(name, result);
      onProgress?.({ type: "tool_result", tool: name, result, count: toolCallCount });

      if (name === "fetch_article" && !result?.error) {
        fetchedArticleCount += 1;
        if (fetchedArticleCount >= MAX_SOURCES) {
          stopGathering = true;
        }
      }

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }
  }

  logInfo(`Gathering complete after ${toolCallCount} tool call(s), ${fetchedArticleCount} article(s) fetched.`);

  if (fetchedArticleCount === 0) {
    throw new Error(
      `No articles could be gathered for "${topic}". Try a more specific, real news topic ` +
        "with recent multi-outlet coverage, or check the tool-call logs above for search/fetch errors."
    );
  }

  onProgress?.({ type: "analyzing" });

  let finalCompletion;
  try {
    finalCompletion = await client.chat.completions.create({
      model,
      messages: [
        ...messages,
        {
          role: "user",
          content:
            "Based only on the articles you've fetched above, produce the final structured bias comparison now.",
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "news_bias_analysis",
          strict: true,
          schema: ANALYSIS_JSON_SCHEMA,
        },
      },
    });
  } catch (err) {
    const reason = describeApiError(err);
    if (err?.status === 413 || /too large|rate_limit/i.test(reason)) {
      throw new Error(
        `The gathered sources were too large for this model's rate limit (${reason}). ` +
          "Try lowering ARTICLE_MAX_WORDS or MAX_SOURCES in backend/.env, or use a model/tier with a higher token budget."
      );
    }
    throw new Error(`Analysis step failed: ${reason}`);
  }

  const content = finalCompletion.choices[0].message.content;
  if (!content) {
    throw new Error("final response did not contain the analysis JSON");
  }

  return JSON.parse(content);
}
