import React from "react";

const icons = {
  Medical: (
    <path d="M12 4v4m0 0v4m0-4h4m-4 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  "Medical & Health": (
    <path d="M12 4v4m0 0v4m0-4h4m-4 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  Education: (
    <path d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m4.5-3.5L21 14v4.5" />
  ),
  "Education & Training": (
    <path d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m4.5-3.5L21 14v4.5" />
  ),
  Housing: (
    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0V15a1 1 0 011-1h2a1 1 0 011 1v3" />
  ),
  "Housing & Rent": (
    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0V15a1 1 0 011-1h2a1 1 0 011 1v3" />
  ),
  Employment: (
    <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0h2a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h2" />
  ),
  "Employment & Business": (
    <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0h2a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h2" />
  ),
  Emergency: (
    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
  ),
  "Emergency & Crisis": (
    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
  ),
  Essentials: (
    <path d="M3 3h18v18H3V3zm4 4v4m0 0v4m4-8v8m4-8v4" />
  ),
  "Essential Living": (
    <path d="M3 3h18v18H3V3zm4 4v4m0 0v4m4-8v8m4-8v4" />
  ),
  "Essential Living Costs": (
    <path d="M3 3h18v18H3V3zm4 4v4m0 0v4m4-8v8m4-8v4" />
  ),
  "Family Support": (
    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  ),
  Family: (
    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  ),
  Other: (
    <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
};

export default function CategoryIcon({ category, className = "w-5 h-5" }) {
  const icon = icons[category] || icons.Other;
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icon}
    </svg>
  );
}
