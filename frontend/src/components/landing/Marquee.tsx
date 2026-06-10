/** Infinite horizontal marquee of pill items (CSS-driven, smooth). */
export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items]; // duplicate for seamless loop
  return (
    <div className="marquee-mask relative w-full overflow-hidden py-2">
      <div className="flex w-max animate-marquee gap-3">
        {row.map((item, i) => (
          <span
            key={i}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-fg-muted"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
