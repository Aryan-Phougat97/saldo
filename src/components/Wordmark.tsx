import { memo } from "react";

function Wordmark({ className = "text-base" }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-tight ${className}`} role="img" aria-label="Saldo">
      <span aria-hidden="true">
        sald<span className="text-[var(--color-accent)]">o</span>
      </span>
    </span>
  );
}

// Static brand mark — memo keeps header re-renders from re-rendering it.
export default memo(Wordmark);
