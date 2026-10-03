const TONE_STYLES = {
  neutral: "bg-slate-100 text-slate-700",
  critical: "bg-red-100 text-red-700",
  supportive: "bg-blue-100 text-blue-700",
  alarmist: "bg-orange-100 text-orange-700",
};

export default function OutletCard({ framing }) {
  const toneClass = TONE_STYLES[framing.tone] ?? TONE_STYLES.neutral;

  return (
    <div className="rounded-xl border border-slate-200 p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{framing.outlet}</h3>
        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${toneClass}`}>
          {framing.tone}
        </span>
      </div>

      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Emphasis</p>
        <p className="text-sm text-slate-700 mt-1">{framing.emphasis}</p>
      </div>

      {framing.notable_word_choices?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Notable word choices
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {framing.notable_word_choices.map((w, i) => (
              <span key={i} className="text-xs bg-slate-100 text-slate-700 rounded px-2 py-0.5">
                “{w}”
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Leaves out</p>
        <p className="text-sm text-slate-700 mt-1">{framing.what_it_leaves_out}</p>
      </div>
    </div>
  );
}
