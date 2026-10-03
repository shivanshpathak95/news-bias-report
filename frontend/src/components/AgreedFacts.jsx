export default function AgreedFacts({ facts }) {
  if (!facts?.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold text-slate-900 mb-3">Agreed facts</h2>
      <ul className="space-y-3">
        {facts.map((f, i) => (
          <li key={i} className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-slate-800">{f.fact}</p>
            <p className="mt-2 text-xs text-emerald-700">
              Reported by: {f.supporting_outlets.join(", ")}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
