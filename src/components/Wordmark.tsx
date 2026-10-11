export default function Wordmark({ className = "text-base" }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-tight ${className}`} role="img" aria-label="Saldo">
      <span aria-hidden="true">
        sald<span className="text-[var(--color-accent)]">o</span>
      </span>
    </span>
  );
}
