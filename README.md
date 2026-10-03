# News Bias Comparer

Enter a news topic; an LLM agent (served via [Groq](https://groq.com), using direct tool
use — no agent framework) searches multiple outlets, reads the articles, and produces a
structured comparison of what's agreed on versus what's disputed or outlet-specific, plus a
per-outlet framing breakdown.

## How it works

1. **Agent loop** (`backend/src/agent`) — the model is given two tools:
   - `search_news(query)` — searches recent news via [Tavily](https://tavily.com), returns title/url/outlet/date.
   - `fetch_article(url)` — fetches the page, strips boilerplate with Readability, truncates to ~4000 words, or returns an error (paywalled/blocked/non-article) so the agent can pick another source.

   The agent runs several differently-phrased searches to find 5–8 articles from different
   outlets, reads them, and stops after at most 12 tool calls. A final call uses Groq's
   `response_format: { type: "json_schema" }` (structured output) to produce the analysis in
   the exact shape the UI expects — no fragile text-parsing.

2. **API** (`backend/server.js`) — `POST /api/analyze { topic }` runs the agent loop and
   streams progress as Server-Sent Events (`status` events like "Reading Reuters…"), ending
   with a `result` event containing the full analysis, or an `error` event on failure.

3. **UI** (`frontend/`) — a search box, live progress feed, and a results page: neutral
   summary, agreed facts, disputed/unique claims, a framing card per outlet, and a source list.

Every tool call and its result is logged to stderr for debugging.

## Project structure

```
backend/
  src/agent/
    tools/searchNews.js    # Tavily wrapper
    tools/fetchArticle.js  # fetch + Readability extraction
    tools.js                # tool definitions + dispatch
    outputSchema.js          # JSON schema for the final analysis
    prompts.js                # system prompt
    logger.js
    index.js                  # the manual tool-use loop
  cli.js                       # Stage 1: run the agent from the command line
  server.js                     # Stage 2: Express API (SSE)
frontend/
  src/
    api.js                      # SSE client
    components/
    App.jsx
```

## Setup

### Prerequisites
- Node.js 18+
- A [Groq API key](https://console.groq.com/keys)
- A [Tavily API key](https://app.tavily.com/) (free tier is enough to try this)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env and fill in GROQ_API_KEY and TAVILY_API_KEY
```

Run it as a CLI (prints the final JSON to stdout, progress/logs to stderr):

```bash
node cli.js "a real news topic"
```

Or run the API server:

```bash
node server.js   # listens on http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # defaults to http://localhost:3001, change if needed
npm run dev             # http://localhost:5173
```

With both running, open the frontend URL, enter a topic, and watch it search, read sources,
and render the comparison.

## Environment variables

**`backend/.env`**
| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Required. Your Groq API key. |
| `GROQ_MODEL` | Model used for the agent and analysis. Defaults to `openai/gpt-oss-120b`. |
| `TAVILY_API_KEY` | Required. Your Tavily API key. |
| `PORT` | Port for the Express API. Defaults to `3001`. |

**`frontend/.env`**
| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API. Defaults to `http://localhost:3001`. |

## Known limitations

- Outlet names are derived from the article's domain, not a curated database — unusual
  domains may show up with an imperfect display name.
- `search_news` relies on Tavily's news index; very recent or very niche stories may return
  few results, which the agent will note in `caveats`.
- Paywalled articles are skipped (reported as a tool error) rather than worked around.
- No persistence — each search is a fresh agent run with no caching between requests.
