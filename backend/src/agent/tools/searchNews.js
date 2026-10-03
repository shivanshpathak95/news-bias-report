import { tavily } from "@tavily/core";

let client;
function getClient() {
  if (!client) {
    if (!process.env.TAVILY_API_KEY) {
      throw new Error("TAVILY_API_KEY is not set");
    }
    client = tavily({ apiKey: process.env.TAVILY_API_KEY });
  }
  return client;
}

// A few outlets whose hostnames don't read as a clean name on their own.
const OUTLET_NAME_OVERRIDES = {
  "nytimes.com": "The New York Times",
  "wsj.com": "The Wall Street Journal",
  "bbc.com": "BBC",
  "bbc.co.uk": "BBC",
  "apnews.com": "Associated Press",
  "reuters.com": "Reuters",
  "npr.org": "NPR",
  "foxnews.com": "Fox News",
  "cnn.com": "CNN",
  "theguardian.com": "The Guardian",
  "aljazeera.com": "Al Jazeera",
  "washingtonpost.com": "The Washington Post",
  "breitbart.com": "Breitbart",
  "thehill.com": "The Hill",
  "politico.com": "Politico",
  "axios.com": "Axios",
};

export function outletFromUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (OUTLET_NAME_OVERRIDES[host]) return OUTLET_NAME_OVERRIDES[host];
    const base = host.split(".").slice(0, -1).join(".") || host;
    return base
      .split(/[-.]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  } catch {
    return "Unknown outlet";
  }
}

export async function searchNews({ query }) {
  const response = await getClient().search(query, {
    topic: "news",
    searchDepth: "basic",
    maxResults: 8,
  });

  return {
    results: response.results.map((r) => ({
      title: r.title,
      url: r.url,
      outlet: outletFromUrl(r.url),
      published_date: r.publishedDate ?? null,
    })),
  };
}
