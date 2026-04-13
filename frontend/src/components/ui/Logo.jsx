import React from "react";

export default function Logo({ className = "", size = 36 }) {
  return (
    <img
      className={`rounded-lg ${className}`}
      src="/logo.png"
      alt="HandUp"
      width={size}
      height={size}
    />
  );
}
