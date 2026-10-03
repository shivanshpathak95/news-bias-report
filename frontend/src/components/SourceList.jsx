export default function SourceList({ sources }) {
  if (!sources?.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold text-slate-900 mb-3">Sources</h2>
      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
        {sources.map((s, i) => (
          <li key={i} className="p-4">
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-900 font-medium hover:underline"
            >
              {s.headline}
            </a>
            <p className="text-xs text-slate-500 mt-1">
              {s.outlet} · {s.date}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
