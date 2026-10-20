export function Logo({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="Draftroom">
      <rect width="32" height="32" rx="7" fill="#0f110e" />
      <path
        d="M10 7 H19 L23 11 V25 Q23 26 22 26 H10 Q9 26 9 25 V8 Q9 7 10 7 Z"
        fill="#d4f36b"
      />
      <path d="M19 7 L19 11 L23 11 Z" fill="#b8e635" />
      <rect x="12" y="16" width="8" height="1.6" rx="0.8" fill="#0f110e" opacity="0.85" />
      <rect x="12" y="19.5" width="5" height="1.6" rx="0.8" fill="#0f110e" opacity="0.7" />
    </svg>
  );
}
