import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { outletFromUrl } from "./searchNews.js";

// Kept small by default because free-tier Groq accounts have a modest
// tokens-per-minute budget shared by the whole (ever-growing) conversation.
// Raise ARTICLE_MAX_WORDS in .env if your account has more headroom.
const MAX_WORDS = Number(process.env.ARTICLE_MAX_WORDS) || 350;
const FETCH_TIMEOUT_MS = 15000;

function truncateWords(text, maxWords) {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return { text: text.trim(), truncated: false, word_count: words.length };
  }
  return {
    text: words.slice(0, maxWords).join(" "),
    truncated: true,
    word_count: maxWords,
  };
}

export async function fetchArticle({ url }) {
  let response;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        // A generic bot-labeled UA gets blanket-blocked by many news sites'
        // WAFs even for a single, one-off fetch of a public page. A plain
        // browser UA avoids that false-positive blocking (this is not
        // bypassing paywalls or auth — genuinely paywalled/blocked pages
        // still fail below and the agent just picks another source).
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    clearTimeout(timer);
  } catch (err) {
    return { error: `fetch failed: ${err.message}` };
  }

  if (!response.ok) {
    return { error: `fetch failed with status ${response.status}` };
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    return { error: `unsupported content-type: ${contentType || "unknown"}` };
  }

  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const article = new Readability(dom.window.document).parse();

  if (!article || !article.textContent || article.textContent.trim().length < 200) {
    return { error: "could not extract article content (likely paywalled or non-article page)" };
  }

  const { text, truncated, word_count } = truncateWords(article.textContent, MAX_WORDS);

  return {
    url,
    outlet: outletFromUrl(url),
    title: article.title ?? null,
    text,
    word_count,
    truncated,
  };
}
