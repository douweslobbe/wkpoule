import Link from "next/link"
import { ACHIEVEMENT_DEFS } from "@/lib/achievements"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pixel-card overflow-hidden mb-5">
      <div className="px-5 py-3" style={{ background: "#0a3d1f", borderBottom: "3px solid #000" }}>
        <h2 className="font-pixel text-white" style={{ fontSize: "9px" }}>{title}</h2>
      </div>
      <div className="p-5 space-y-3" style={{ color: "var(--c-text-2)", fontSize: "9px", lineHeight: "2" }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3" style={{ borderBottom: "1px solid var(--c-border)", paddingBottom: "4px" }}>
      <span style={{ color: "var(--c-text-2)", minWidth: "220px" }}>{label}</span>
      <span className="font-pixel" style={{ color: "#FFD700", fontSize: "9px" }}>{value}</span>
    </div>
  )
}

export default function FaqPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link href="/dashboard" className="font-pixel" style={{ fontSize: "7px", color: "#7070a0" }}>
          ◄ DASHBOARD
        </Link>
        <h1 className="font-pixel text-white" style={{ fontSize: "10px" }}>SPELREGELS & FAQ</h1>
      </div>

      {/* === HET SPEL === */}
      <Section title="⚽ HET SPEL">
        <p>
          Voorspel de uitslag van elke WK 2026-wedstrijd, beantwoord bonusvragen en kies de kampioen.
          Wie de meeste punten scoort in jouw pool wint.
        </p>
        <p>
          Je kunt in meerdere pools deelnemen. <span style={{ color: "#FFD700" }}>Wedstrijd&shy;voorspellingen
          gelden voor al je pools tegelijk</span> — je hoeft ze maar één keer in te vullen.
          Bonusvragen en de kampioen&shy;keuze zijn wél per pool apart.
        </p>
      </Section>

      {/* === WEDSTRIJDEN === */}
      <Section title="🎯 WEDSTRIJDEN VOORSPELLEN">
        <p>
          Vul voor elke WK-wedstrijd de verwachte thuisscore en uitscore in.
          Je kunt een voorspelling aanpassen tot <span style={{ color: "#FF6200" }}>30 minuten voor aftrap</span>.
        </p>

        <p className="font-pixel" style={{ fontSize: "8px", color: "#FFD700" }}>GROEPSFASE — MAX 7 PUNTEN</p>
        <Row label="Juiste uitslag (W/G/V)"        value="+3 pt" />
        <Row label="Juiste thuisscore"              value="+1 pt" />
        <Row label="Juiste uitscore"                value="+1 pt" />
        <Row label="Exact goed (alles klopt)"       value="+2 bonus = 7 pt" />

        <p className="font-pixel mt-4" style={{ fontSize: "8px", color: "#FFD700" }}>KNOCK-OUTFASE — BASISPUNTEN PER RONDE</p>
        <Row label="Ronde van 32"       value="4 pt per team dat doorgaat" />
        <Row label="Achtste finale"     value="6 pt per team" />
        <Row label="Kwartfinale"        value="8 pt per team" />
        <Row label="Halve finale"       value="10 pt per team" />
        <Row label="Derde-plaatswedstr." value="10 pt per team" />
        <Row label="Finale"             value="12 pt per team" />

        <p style={{ color: "var(--c-text-2)", fontSize: "9px" }}>
          Per knock-outwedstrijd kun je punten verdienen voor zowel het thuis- als uitteam dat doorgaat.
          Bovenop de basispunten tellen:
        </p>
        <Row label="Juiste uitslag (W/G/V)"                    value="+3 pt" />
        <Row label="Juiste thuisscore"                          value="+1 pt" />
        <Row label="Juiste uitscore"                            value="+1 pt" />
        <Row label="Beide teams + uitslag + exact — alles goed" value="+4 bonus" />
      </Section>

      {/* === BONUSVRAGEN === */}
      <Section title="🏆 BONUSVRAGEN">
        <p>
          Elke pool heeft eigen bonusvragen. De <span style={{ color: "#FF6200" }}>deadline
          is de start van het toernooi</span> (11 juni 2026, 22:00). Daarna zijn antwoorden vergrendeld.
        </p>
        <p className="font-pixel" style={{ fontSize: "8px", color: "#FFD700" }}>SOORTEN VRAGEN</p>
        <Row label="Schatting"  value="Top 3 dichtst bij het goede antwoord = 7 pt" />
        <Row label="Stelling"   value="Goed of fout = 7 pt" />
        <Row label="Open vraag" value="Admin bepaalt correct antwoord = 7 pt" />
        <p>
          Bij schattingsvragen worden <span style={{ color: "#FFD700" }}>gelijke derde plaatsen</span> ook
          beloond — iedereen die even dichtbij zit als de derde plek krijgt 7 punten.
        </p>
      </Section>

      {/* === LUCKY SHOT === */}
      <Section title="★ LUCKY SHOT — DE JOKER">
        <p>
          Op een wedstrijd kun je een <span style={{ color: "#FFD700" }}>joker</span> inzetten.
          Punten op die wedstrijd <span style={{ color: "#FFD700" }}>tellen dubbel</span>.
        </p>
        <p className="font-pixel" style={{ fontSize: "8px", color: "#FFD700" }}>HOEVEEL JOKERS PER FASE</p>
        <Row label="Poulefase"        value="3 jokers" />
        <Row label="Ronde van 32"     value="1 joker" />
        <Row label="Ronde van 16"     value="1 joker" />
        <Row label="Kwartfinale"      value="1 joker" />
        <Row label="Halve finale en verder" value="Geen jokers — daar staat al genoeg op het spel" />
        <p>
          De joker zet je aan via de gele knop onder je voorspelling. Je kunt hem
          weer uitzetten tot 30 minuten voor aftrap. Kies dus zorgvuldig:
          alleen de wedstrijden waarvan je het meest overtuigd bent.
        </p>
        <p>
          Op de ranglijst zie je naast de naam van iedere speler een ★-badge met het
          aantal jokers dat al ingezet is. Zo zie je in één oogopslag of iemand zijn
          jokers nog op de plank heeft liggen.
        </p>
      </Section>

      <Section title="🥇 KAMPIOEN KIEZEN">
        <p>
          Kies vóór het toernooi welk land het WK 2026 wint. Als je goed zit:
          <span style={{ color: "#FFD700" }}> 15 punten</span>.
        </p>
        <p>
          De deadline is gelijk aan die van de bonusvragen: <span style={{ color: "#FF6200" }}>11 juni 2026, 22:00</span>.
          De kampioensvraag is per pool apart — je kunt in elke pool een andere keuze maken.
        </p>
      </Section>

      {/* === POOL === */}
      <Section title="👥 DE POOL">
        <p>
          Maak een eigen pool aan of doe mee via een <span style={{ color: "#FFD700" }}>uitnodigings&shy;code</span>.
          Deel de code met vrienden en familie zodat zij kunnen meedoen.
        </p>
        <Row label="Beheerder (admin)" value="Kan bonusvragen toevoegen en antwoorden invoeren" />
        <Row label="Lid (member)"      value="Kan alles bekijken en voorspellingen invullen" />
        <p>
          De eerste persoon die een pool aanmaakt wordt automatisch beheerder.
          Er kan meer dan één beheerder zijn.
        </p>
      </Section>

      {/* === PROGNOSE === */}
      <Section title="📈 DE PROGNOSE">
        <p>
          De prognose (het ~getal naast de score) is een schatting van je eindscore op basis van je
          huidige tempo:
        </p>
        <p style={{ color: "#9999cc" }}>
          <span style={{ color: "#4499ff" }}>Prognose</span> = (huidige wedstrijd&shy;punten ÷ gespeelde wedstrijden)
          × 104 + bonus&shy;punten + kampioen&shy;punten
        </p>
        <p>
          Het <span style={{ color: "var(--c-text-2)" }}>/maximale</span> getal laat zien hoeveel je nog maximaal kunt halen
          als alles meezit (alle openstaande bonus&shy;vragen + kampioen correct + huidig wedstrijd&shy;tempo).
        </p>
      </Section>

      {/* === LIVE === */}
      <Section title="🔴 LIVE WEDSTRIJDEN">
        <p>
          Zodra een wedstrijd begint verschijnt het{" "}
          <span className="pixel-live" style={{ animationPlayState: "paused", opacity: 1 }}>● LIVE</span>
          {" "}label. De score wordt bijgewerkt tijdens de wedstrijd.
          Voorspellingen zijn op dat moment al vergrendeld.
        </p>
      </Section>

      {/* === ACHIEVEMENTS === */}
      <Section title="🏅 ACHIEVEMENTS">
        <p>
          Tijdens het toernooi verdien je automatisch <span style={{ color: "#FFD700" }}>achievements</span> —
          kleine pixel-emoji&apos;s die naast je naam verschijnen op de ranglijst, in het prikbord en
          overal waar je naam staat. Ze leveren geen extra punten op, maar wel pure eer.
        </p>
        <p className="font-pixel" style={{ fontSize: "8px", color: "#FFD700" }}>WAT JE KUNT VERDIENEN</p>
        {Object.entries(ACHIEVEMENT_DEFS).map(([key, def]) => (
          <div key={key} className="flex items-baseline gap-3" style={{ borderBottom: "1px solid var(--c-border)", paddingBottom: "4px" }}>
            <span style={{ minWidth: "32px", fontSize: "16px", lineHeight: 1 }}>{def.emoji}</span>
            <span style={{ color: "var(--c-text-2)", minWidth: "140px" }}>{def.label}</span>
            <span className="font-pixel" style={{ color: "#FFD700", fontSize: "9px" }}>{def.description}</span>
          </div>
        ))}
        <p>
          Achievements worden automatisch toegekend bij het verwerken van uitslagen. De
          🤖 Pool-bot post een melding op het prikbord wanneer iemand er een verdient.
        </p>
      </Section>

      {/* === POOL-BOT === */}
      <Section title="🤖 DE POOL-BOT">
        <p>
          De Pool-bot is een automatische assistent die in het prikbord meldingen plaatst
          bij belangrijke gebeurtenissen, zodat de pool levendig blijft zonder dat iemand
          iets hoeft te typen.
        </p>
        <Row label="🚨 Leiderswissel"     value="Wanneer iemand de eerste plaats overneemt" />
        <Row label="🏅 Achievement"        value="Wanneer iemand een nieuwe badge verdient" />
        <Row label="📊 Dagoverzicht"       value="Na een speeldag — uitslagen + topscorer" />
        <p style={{ color: "var(--c-text-3)", fontSize: "8px" }}>
          Pool-bot berichten herken je aan de gouden zijbalk en de 🤖 POOL-BOT naam.
        </p>
      </Section>

      {/* === EASTER EGG === */}
      <Section title="🎮 ZIJN ER EASTER EGGS?">
        <p>
          Misschien wel. Misschien niet. Een echte gamer kent de magische volgorde
          uit zijn hoofd:
        </p>
        <p className="font-pixel text-center" style={{ fontSize: "10px", color: "#FFD700", letterSpacing: "4px", lineHeight: 2 }}>
          ↑ ↑ ↓ ↓ ← → ← → B A
        </p>
        <p style={{ color: "var(--c-text-3)", fontSize: "8px" }}>
          Maar er zijn ook andere geheime woorden die je gewoon kunt typen op een
          willekeurige plek (niet in een invoerveld)... <span style={{ color: "#FFD700" }}>HUP</span> is
          patriottisch. <span style={{ color: "#FFD700" }}>GOAL</span> doet iets dramatisch.
          De rest? Ontdek zelf maar.
        </p>
        <p style={{ color: "var(--c-text-4)", fontSize: "7px" }}>
          Geluid aanzetten? Gebruik de ♫ knop in de header. Zonder geluid
          mis je de helft van de fun.
        </p>
      </Section>

      {/* === FOOTER === */}
      <div className="text-center py-4">
        <Link href="/dashboard" className="font-pixel" style={{ fontSize: "7px", color: "#7070a0" }}>
          ◄ TERUG NAAR DASHBOARD
        </Link>
      </div>
    </div>
  )
}
