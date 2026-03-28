import React from "react";

export default function Input({ label, hint, error, className = "", ...props }) {
  return (
    <label className="block">
      {label && <div className="mb-2 text-sm font-semibold text-[var(--color-text)]">{label}</div>}
      <input
        className={`w-full rounded-xl border px-4 py-3 text-base bg-white
        outline-none transition-all duration-200 placeholder:text-[var(--color-text-subtle)]
        focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 ${
          error ? "border-red-300" : "border-[var(--color-border)]"
        } ${className}`}
        {...props}
      />
      {hint && !error && <div className="mt-2 text-sm text-[var(--color-text-muted)]">{hint}</div>}
      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
    </label>
  );
}
