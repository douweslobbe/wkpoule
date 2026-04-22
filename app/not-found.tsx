import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center pitch-bg p-4">
      <div className="text-center max-w-sm">
        <div className="font-pixel mb-2" style={{ fontSize: "48px", color: "#FF6200", lineHeight: 1 }}>
          404
        </div>
        <p className="font-pixel mb-2" style={{ fontSize: "9px", color: "#FFD700" }}>PAGINA NIET GEVONDEN</p>
        <p className="font-pixel mb-8" style={{ fontSize: "7px", color: "#555577" }}>
          DEZE PAGINA BESTAAT NIET OF IS VERPLAATST
        </p>
        <Link
          href="/dashboard"
          className="pixel-btn px-5 py-2.5 font-pixel"
          style={{ background: "#FF6200", color: "white", fontSize: "8px" }}
        >
          ◄ TERUG NAAR DASHBOARD
        </Link>
      </div>
    </div>
  )
}
