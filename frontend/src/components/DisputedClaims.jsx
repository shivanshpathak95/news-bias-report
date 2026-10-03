export default function DisputedClaims({ claims }) {
  if (!claims?.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold text-slate-900 mb-3">
        Disputed or unique claims
      </h2>
      <ul className="space-y-3">
        {claims.map((c, i) => (
          <li key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-slate-800">{c.claim}</p>
            <div className="mt-2 flex flex-col sm:flex-row sm:gap-6 text-xs">
              <p className="text-amber-700">
                Reported by: {c.outlets_making_it.join(", ") || "—"}
              </p>
              {c.outlets_not_mentioning_it?.length > 0 && (
                <p className="text-slate-500">
                  Not mentioned by: {c.outlets_not_mentioning_it.join(", ")}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
