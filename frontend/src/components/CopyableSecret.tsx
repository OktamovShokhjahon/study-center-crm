"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyableSecret({
  value,
  className = "",
}: {
  value: string | null | undefined;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const display = value ?? "—";

  async function copy() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <span className={`inline-flex items-center gap-2 font-mono text-sm ${className}`}>
      <span className="truncate">{display}</span>
      {value ? (
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-lg p-1.5 text-[var(--accent)] transition hover:bg-[var(--accent-muted)]"
          title="Copy"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        </button>
      ) : null}
    </span>
  );
}
