export default function LoadingProgress({ messages }) {
  return (
    <div className="w-full max-w-xl mx-auto mt-8 space-y-2" aria-live="polite">
      <div className="flex items-center gap-2 text-slate-600">
        <span className="h-2 w-2 rounded-full bg-slate-900 animate-pulse" />
        <span className="font-medium">
          {messages[messages.length - 1] ?? "Working…"}
        </span>
      </div>
      <ul className="text-sm text-slate-400 space-y-1 pl-4">
        {messages.slice(0, -1).slice(-6).map((m, i) => (
          <li key={i} className="truncate">{m}</li>
        ))}
      </ul>
    </div>
  );
}
