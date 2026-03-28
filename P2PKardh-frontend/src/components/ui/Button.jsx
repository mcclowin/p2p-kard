import React from "react";

const base =
  "inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2";

const sizes = {
  sm: "rounded-xl px-4 py-2 text-sm",
  md: "rounded-xl px-6 py-3 text-base",
  lg: "rounded-2xl px-8 py-4 text-lg",
};

const variants = {
  primary:
    "text-white bg-emerald-700 hover:bg-emerald-800 shadow-[0_4px_14px_rgba(5,150,105,0.25)] hover:shadow-[0_6px_20px_rgba(5,150,105,0.35)]",
  secondary:
    "text-white bg-amber-700 hover:bg-amber-800 shadow-[0_4px_14px_rgba(180,132,26,0.2)]",
  outline:
    "border-2 border-emerald-700/20 bg-white text-emerald-800 hover:bg-emerald-50 hover:border-emerald-700/40",
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100/80",
  warm:
    "text-white bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-800 hover:to-emerald-700 shadow-[0_4px_14px_rgba(5,150,105,0.3)]",
};

export default function Button({ variant = "primary", size = "md", className = "", ...props }) {
  const v = variants[variant] ?? variants.primary;
  const s = sizes[size] ?? sizes.md;
  return <button className={`${base} ${s} ${v} ${className}`} {...props} />;
}
