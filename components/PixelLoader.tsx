export function PixelLoader({ label = "LADEN..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <div className="pixel-loader-ball" aria-hidden="true">⚽</div>
      <span className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>
        {label}
      </span>
    </div>
  )
}
