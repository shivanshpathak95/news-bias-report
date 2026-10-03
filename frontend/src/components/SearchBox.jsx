import { useState } from "react";

export default function SearchBox({ onSearch, disabled }) {
  const [value, setValue] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const topic = value.trim();
    if (topic) onSearch(topic);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter a news topic, e.g. 'EU carbon tariff'"
        disabled={disabled}
        className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-base
                   focus:outline-none focus:ring-2 focus:ring-slate-900
                   disabled:bg-slate-100 disabled:text-slate-400"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="rounded-lg bg-slate-900 px-6 py-3 text-white font-medium
                   hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed
                   transition-colors"
      >
        Compare coverage
      </button>
    </form>
  );
}
