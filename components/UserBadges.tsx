import { ACHIEVEMENT_DEFS } from "@/lib/achievements"

type AchievementLite = { type: string; detail?: string | null }

export function UserBadges({
  achievements = [],
  jokerCount = 0,
  size = "sm",
  max = 5,
}: {
  achievements?: AchievementLite[]
  jokerCount?: number
  size?: "xs" | "sm" | "md"
  max?: number
}) {
  if (achievements.length === 0 && jokerCount === 0) return null

  const emojiSize = size === "xs" ? "9px" : size === "md" ? "13px" : "11px"
  const jokerSize = size === "xs" ? "6px" : "7px"

  return (
    <span className="inline-flex items-center gap-1 align-middle">
      {jokerCount > 0 && (
        <span
          className="font-pixel"
          title={`${jokerCount} joker${jokerCount === 1 ? "" : "s"} ingezet (Lucky Shot)`}
          style={{
            fontSize: jokerSize,
            background: "#FFD700",
            color: "#000",
            padding: "1px 3px",
            border: "1px solid #000",
            lineHeight: 1,
          }}
        >
          ★{jokerCount}
        </span>
      )}
      {achievements.slice(0, max).map((a, i) => {
        const def = ACHIEVEMENT_DEFS[a.type]
        if (!def) return null
        return (
          <span
            key={i}
            title={`${def.label} — ${def.description}${a.detail ? ` (${a.detail})` : ""}`}
            style={{ fontSize: emojiSize, lineHeight: 1, cursor: "help" }}
          >
            {def.emoji}
          </span>
        )
      })}
    </span>
  )
}
