import Link from "next/link"

export default function ForgotPasswordPage() {
  return (
    <div className="pixel-card p-6">
      <h2 className="font-pixel text-center mb-6" style={{ fontSize: "10px", color: "#FFD700" }}>
        WACHTWOORD VERGETEN
      </h2>

      <div className="mb-5 p-4 font-pixel" style={{
        background: "#0d1a10",
        border: "2px solid #1a5c28",
        fontSize: "8px",
        color: "#9999cc",
        lineHeight: "2",
      }}>
        <p className="mb-3">
          Wachtwoorden kunnen alleen worden gereset door de <span style={{ color: "#FFD700" }}>beheerder van jouw poule</span>.
        </p>
        <p>
          Neem contact op met de persoon die de poule heeft aangemaakt en vraag hem of haar om
          jouw wachtwoord te resetten via het beheerderspaneel.
        </p>
      </div>

      <p className="text-center font-pixel" style={{ fontSize: "7px", color: "#555577" }}>
        <Link href="/login" className="font-bold hover:underline" style={{ color: "#FF6200" }}>
          ◄ TERUG NAAR INLOGGEN
        </Link>
      </p>
    </div>
  )
}
