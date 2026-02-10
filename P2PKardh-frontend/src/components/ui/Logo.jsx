import React from "react";

export default function Logo({ className = "", size = 28 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="HandUp logo"
    >
      <circle cx="16" cy="16" r="16" fill="#059669" />
      <path
        d="M16 6c-1.1 0-2 .9-2 2v8h-1.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5H14v1c0 2.76 2.24 5 5 5s5-2.24 5-5v-4c0-1.1-.9-2-2-2s-2 .9-2 2v1h-1v-3c0-1.1-.9-2-2-2s-2 .9-2 2v1h-1V8c0-1.1-.9-2-2-2z"
        fill="white"
        opacity="0.95"
      />
    </svg>
  );
}
