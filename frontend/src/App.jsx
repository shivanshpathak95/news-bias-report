import { useState } from "react";
import SearchBox from "./components/SearchBox.jsx";
import LoadingProgress from "./components/LoadingProgress.jsx";
import AgreedFacts from "./components/AgreedFacts.jsx";
import DisputedClaims from "./components/DisputedClaims.jsx";
import OutletCard from "./components/OutletCard.jsx";
import SourceList from "./components/SourceList.jsx";
import { runAnalysis } from "./api.js";

export default function App() {
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [messages, setMessages] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [lastTopic, setLastTopic] = useState("");

  async function handleSearch(topic) {
    setStatus("loading");
    setLastTopic(topic);
    setMessages([`Searching for coverage of "${topic}"…`]);
    setAnalysis(null);
    setError(null);

    try {
      const result = await runAnalysis(topic, {
        onStatus: (message) => setMessages((prev) => [...prev, message]),
      });
      setAnalysis(result);
      setStatus("done");
    } catch (err) {
      setError(err.message || "Something went wrong");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900">News Bias Comparer</h1>
          <p className="text-slate-500 mt-1">
            See how different outlets cover the same story — what they agree on, and
            where they diverge.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <SearchBox onSearch={handleSearch} disabled={status === "loading"} />

        {status === "loading" && <LoadingProgress messages={messages} />}

        {status === "error" && (
          <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => handleSearch(lastTopic)}
              className="mt-3 text-sm font-medium text-red-700 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {status === "done" && analysis && (
          <div className="mt-10 space-y-12">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold text-slate-900">{analysis.topic}</h2>
                <button
                  onClick={() => setStatus("idle")}
                  className="shrink-0 text-sm font-medium text-slate-500 hover:text-slate-900"
                >
                  New search
                </button>
              </div>
              <p className="mt-2 text-slate-700 leading-relaxed">{analysis.summary}</p>
            </div>

            <AgreedFacts facts={analysis.agreed_facts} />
            <DisputedClaims claims={analysis.disputed_or_unique_claims} />

            {analysis.framing_by_outlet?.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  Framing by outlet
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysis.framing_by_outlet.map((f, i) => (
                    <OutletCard key={i} framing={f} />
                  ))}
                </div>
              </section>
            )}

            <SourceList sources={analysis.sources} />

            {analysis.caveats?.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-3">Caveats</h2>
                <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                  {analysis.caveats.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
