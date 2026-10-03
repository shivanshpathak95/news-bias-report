import { searchNews } from "./tools/searchNews.js";
import { fetchArticle } from "./tools/fetchArticle.js";

export const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "search_news",
      description:
        "Search recent news coverage for a topic and return matching articles with their outlet, title, URL, and publish date. Call this multiple times with different phrasings to surface outlets across the political spectrum, regions, and wire services.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Search phrase, e.g. 'EU carbon tariff reaction' or 'EU carbon tariff criticism'",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_article",
      description:
        "Fetch a news article by URL and return its cleaned body text (ads/nav stripped, truncated to ~4000 words). Returns an error if the page is blocked, paywalled, or unreachable so you can pick a different source.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "Full article URL, as returned by search_news",
          },
        },
        required: ["url"],
        additionalProperties: false,
      },
    },
  },
];

const HANDLERS = {
  search_news: searchNews,
  fetch_article: fetchArticle,
};

export async function dispatchTool(name, input) {
  const handler = HANDLERS[name];
  if (!handler) {
    return { error: `unknown tool: ${name}` };
  }
  try {
    return await handler(input);
  } catch (err) {
    return { error: err.message ?? String(err) };
  }
}
