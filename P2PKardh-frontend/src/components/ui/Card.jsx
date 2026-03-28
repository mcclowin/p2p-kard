import React from "react";

export default function Card({ title, subtitle, children, footer, className = "" }) {
  return (
    <div className={`rounded-2xl border border-[var(--color-border)] bg-white p-6 sm:p-8 shadow-[var(--shadow-md)] ${className}`}>
      {(title || subtitle) && (
        <div className="mb-5">
          {title && <h2 className="text-xl font-semibold tracking-tight font-heading">{title}</h2>}
          {subtitle && <div className="mt-2 text-base text-[var(--color-text-muted)]">{subtitle}</div>}
        </div>
      )}
      <div>{children}</div>
      {footer && <div className="mt-6 border-t border-[var(--color-border-light)] pt-6">{footer}</div>}
    </div>
  );
}
