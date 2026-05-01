import Link from "next/link"
import { ACHIEVEMENT_DEFS } from "@/lib/achievements"
import { FaqTabs, FaqSection } from "./FaqTabs"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Spelregels & FAQ — WK Pool 2026" }

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3" style={{ borderBottom: "1px solid var(--c-border)", paddingBottom: "4px" }}>
      <span style={{ color: "var(--c-text-2)", minWidth: "220px" }}>{label}</span>
      <span className="font-pixel" style={{ color: "#FFD700", fontSize: "9px" }}>{value}</span>
    </div>
  )
}

function H({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-pixel mt-3" style={{ fontSize: "8px", color: "#FFD700" }}>
      {children}
    </p>
  )
}

export default function FaqPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Link href="/dashboard" className="font-pixel" style={{ fontSize: "7px", color: "#7070a0" }}>
          ◄ DASHBOARD
        </Link>
        <h1 className="font-pixel text-white" style={{ fontSize: "10px" }}>SPELREGELS & FAQ</h1>
      </div>

      <FaqTabs>

        {/* ═══════════════════════════════════════════════
            TAB: POULE
        ═══════════════════════════════════════════════ */}

        <FaqSection tab="poule" title="⚽ HET SPEL">
          <p>
            Voorspel de uitslag van elke WK 2026-wedstrijd, beantwoord bonusvragen en kies de kampioen.
            Wie de meeste punten scoort in jouw pool wint.
          </p>
          <p>
            Je kunt in meerdere pools deelnemen —{" "}
            <span style={{ color: "#FFD700" }}>elke pool heeft zijn eigen voorspellingen, stand en bonusvragen</span>.
            Zo kun je per gezelschap een andere strategie kiezen.
          </p>
        </FaqSection>

        <FaqSection tab="poule" title="🎯 WEDSTRIJDEN VOORSPELLEN">
          <p>
            Vul voor elke WK-wedstrijd de verwachte thuisscore en uitscore in.
            Je kunt een voorspelling aanpassen tot{" "}
            <span style={{ color: "#FF6200" }}>30 minuten voor aftrap</span>.
          </p>

          <H>GROEPSFASE — MAX 7 PUNTEN</H>
          <Row label="Juiste uitslag (W/G/V)"        value="+3 pt" />
          <Row label="Juiste thuisscore"              value="+1 pt" />
          <Row label="Juiste uitscore"                value="+1 pt" />
          <Row label="Exact goed (alles klopt)"       value="+2 bonus = 7 pt" />

          <H>KNOCK-OUTFASE — BASISPUNTEN PER RONDE</H>
          <Row label="Ronde van 32"            value="4 pt per team dat doorgaat" />
          <Row label="Achtste finale"          value="6 pt per team" />
          <Row label="Kwartfinale"             value="8 pt per team" />
          <Row label="Halve finale"            value="10 pt per team" />
          <Row label="Derde-plaatswedstrijd"   value="10 pt per team" />
          <Row label="Finale"                  value="12 pt per team" />

          <p>
            Per knock-outwedstrijd kun je punten verdienen voor zowel het thuis- als uitteam dat doorgaat.
            Bovenop de basispunten tellen:
          </p>
          <Row label="Juiste uitslag (W/G/V)"                    value="+3 pt" />
          <Row label="Juiste thuisscore"                          value="+1 pt" />
          <Row label="Juiste uitscore"                            value="+1 pt" />
          <Row label="Beide teams + uitslag + exact — alles goed" value="+4 bonus" />
        </FaqSection>

        <FaqSection tab="poule" title="🏆 BONUSVRAGEN">
          <p>
            Elke pool heeft eigen bonusvragen. De{" "}
            <span style={{ color: "#FF6200" }}>deadline is de start van het toernooi</span>{" "}
            (11 juni 2026, 22:00). Daarna zijn antwoorden vergrendeld.
          </p>
          <H>SOORTEN VRAGEN</H>
          <Row label="Schatting"  value="Top 20% dichtst bij het goede antwoord = 7 pt" />
          <Row label="Stelling"   value="Goed of fout = 7 pt" />
          <Row label="Open vraag" value="Admin bepaalt correct antwoord = 7 pt" />
          <p>
            Bij schattingsvragen wint de <span style={{ color: "#FFD700" }}>bovenste 20%</span> (naar
            boven afgerond). Bij 5 deelnemers is dat 1 winnaar, bij 6 zijn het er 2, bij 11 zijn het er 3.
            Bij gelijke afstand deelt iedereen op die plek de prijs.
          </p>
        </FaqSection>

        <FaqSection tab="poule" title="★ LUCKY SHOT — DE JOKER">
          <p>
            Op een wedstrijd kun je een <span style={{ color: "#FFD700" }}>joker</span> inzetten.
            Punten op die wedstrijd <span style={{ color: "#FFD700" }}>tellen dubbel</span>.
          </p>
          <H>HOEVEEL JOKERS PER FASE</H>
          <Row label="Poulefase"                  value="3 jokers" />
          <Row label="Ronde van 32"               value="1 joker" />
          <Row label="Achtste finale"             value="1 joker" />
          <Row label="Kwartfinale"                value="1 joker" />
          <Row label="Halve finale en verder"     value="Geen jokers" />
          <p>
            De joker zet je aan via de gele knop onder je voorspelling. Je kunt hem
            weer uitzetten tot 30 minuten voor aftrap.
          </p>
          <p>
            Op de ranglijst zie je naast elke naam een ★-badge met het aantal ingezette jokers.
            Zo zie je of iemand zijn jokers nog op de plank heeft liggen.
          </p>
        </FaqSection>

        <FaqSection tab="poule" title="🥇 KAMPIOEN KIEZEN">
          <p>
            Kies vóór het toernooi welk land het WK 2026 wint. Als je goed zit:{" "}
            <span style={{ color: "#FFD700" }}>15 punten</span>.
          </p>
          <p>
            Deadline: <span style={{ color: "#FF6200" }}>11 juni 2026, 22:00</span>.
            De kampioensvraag is per pool apart.
          </p>
        </FaqSection>

        <FaqSection tab="poule" title="👥 DE POOL">
          <p>
            Maak een eigen pool aan of doe mee via een{" "}
            <span style={{ color: "#FFD700" }}>uitnodigingscode</span>.
            Deel de code met vrienden en familie.
          </p>
          <Row label="Beheerder (admin)" value="Kan bonusvragen toevoegen en antwoorden invoeren" />
          <Row label="Lid (member)"      value="Kan alles bekijken en voorspellingen invullen" />
          <p>
            De eerste persoon die een pool aanmaakt wordt automatisch beheerder.
            Er kan meer dan één beheerder zijn.
          </p>
        </FaqSection>

        <FaqSection tab="poule" title="📈 DE PROGNOSE">
          <p>
            De prognose is een schatting van je eindscore op basis van je huidige tempo:
          </p>
          <p style={{ color: "#9999cc" }}>
            <span style={{ color: "#4499ff" }}>Prognose</span> = (wedstrijdpunten ÷ gespeelde wedstrijden)
            × 104 + bonuspunten + kampioenspunten
          </p>
          <p>
            Het <span style={{ color: "var(--c-text-2)" }}>/maximale</span> getal laat zien hoeveel je nog
            maximaal kunt halen als alles meezit.
          </p>
        </FaqSection>

        {/* ═══════════════════════════════════════════════
            TAB: SURVIVOR
        ═══════════════════════════════════════════════ */}

        <FaqSection tab="survivor" title="⚔ WAT IS WK SURVIVOR?" headerColor="#1a0d2e">
          <p>
            WK Survivor is een <span style={{ color: "#FFD700" }}>globaal spel</span> — los van de pools.
            Je voorspelt elke ronde welk land wint (of gelijkspelt of verliest). Overleef je de hele weg
            naar de finale? Dan ben je een echte survivor.
          </p>
          <p>
            Er zijn twee modi die je tegelijkertijd speelt:
          </p>
          <Row label="⚔ HARDCORE" value="Eén fout = uitgeschakeld. No mercy." />
          <Row label="🔥 HIGHSCORE" value="Elke ronde punten verzamelen. Altijd actief." />
        </FaqSection>

        <FaqSection tab="survivor" title="⚔ HOE SPEELT HET?" headerColor="#1a0d2e">
          <p>
            Elke speelronde kies je een land. De keuze wordt beoordeeld op basis van het resultaat
            van dat land in die ronde:
          </p>
          <H>HARDCORE</H>
          <Row label="Land wint al zijn wedstrijden"         value="✓ Overleefd" />
          <Row label="Land verliest of speelt gelijk"         value="💀 Uitgeschakeld" />
          <p>
            Je mag elk land <span style={{ color: "#FFD700" }}>maar één keer</span> kiezen tijdens
            het hele toernooi. Plan vooruit!
          </p>

          <H>HIGHSCORE</H>
          <Row label="Land wint"          value="Punten × ronde-multiplier" />
          <Row label="Gelijkspel"         value="Helft van de punten" />
          <Row label="Verlies"            value="0 punten" />
          <p>
            De multiplier loopt op per ronde — een goede keuze in de finale is meer waard dan in de
            groepsfase. Je hebt één keer een <span style={{ color: "#FFD700" }}>reset</span> om je
            teller opnieuw te beginnen.
          </p>
        </FaqSection>

        <FaqSection tab="survivor" title="⚔ DEADLINES & RONDES" headerColor="#1a0d2e">
          <p>
            Per speelronde heb je tot de <span style={{ color: "#FF6200" }}>eerste aftrap</span> van die
            ronde om je pick in te vullen. Na de deadline zijn picks vergrendeld.
          </p>
          <H>RONDES</H>
          <Row label="Groep speelronde 1–3"   value="Drie losse Survivor-rondes" />
          <Row label="Ronde van 32"           value="Één ronde" />
          <Row label="Achtste finales"        value="Één ronde" />
          <Row label="Kwartfinales"           value="Één ronde" />
          <Row label="Halve finales"          value="Één ronde" />
          <Row label="Finale"                 value="Één ronde" />
          <p style={{ color: "var(--c-text-3)", fontSize: "8px" }}>
            Let op: in de groepsfase speelt elk land drie wedstrijden (één per ronde). In de
            knock-outfase speelt elk land maximaal één wedstrijd per ronde.
          </p>
        </FaqSection>

        {/* ═══════════════════════════════════════════════
            TAB: WK MANAGER
        ═══════════════════════════════════════════════ */}

        <FaqSection tab="manager" title="🎮 WAT IS WK MANAGER?" headerColor="#0a2a0a">
          <p>
            WK Manager is het <span style={{ color: "#FFD700" }}>Fantasy Football</span> van dit WK —
            geïnspireerd op FPL (Fantasy Premier League). Stel een selectie samen van 15 spelers uit
            alle WK-landen, verzamel punten op basis van hun prestaties en klim zo hoog mogelijk op
            de ranglijst.
          </p>
          <p>
            WK Manager is een <span style={{ color: "#FFD700" }}>globaal spel</span> — niet per pool.
            Eén team per account, voor iedereen.
          </p>
        </FaqSection>

        <FaqSection tab="manager" title="🎮 JE SELECTIE SAMENSTELLEN" headerColor="#0a2a0a">
          <p>
            Kies exact <span style={{ color: "#FFD700" }}>15 spelers</span> voor je selectie vóór de
            deadline op <span style={{ color: "#FF6200" }}>11 juni 2026, 22:00</span>.
          </p>
          <H>FORMATIE</H>
          <Row label="Keepers (GK)"       value="2 verplicht" />
          <Row label="Verdedigers (DEF)"  value="5 verplicht" />
          <Row label="Middenvelders (MID)" value="5 verplicht" />
          <Row label="Aanvallers (FWD)"   value="3 verplicht" />

          <H>LANDLIMIET</H>
          <Row label="Groepsfase"  value="Max 2 spelers per land" />
          <Row label="KO-ronden"   value="Max 3 spelers per land" />

          <p>
            Geef je team ook een <span style={{ color: "#FFD700" }}>naam</span> (max 30 tekens) —
            die zie je terug op de ranglijst.
          </p>
        </FaqSection>

        <FaqSection tab="manager" title="🎮 TRANSFERS" headerColor="#0a2a0a">
          <p>
            Na elke speelronde kun je je selectie aanpassen. Je hebt{" "}
            <span style={{ color: "#FFD700" }}>2 transfers per ronde</span>.
          </p>
          <H>TRANSFERVENSTERS</H>
          <Row label="Vóór groepsfase speelronde 1" value="Initiële selectie (geen transfers)" />
          <Row label="Vóór speelronde 2 t/m KF"    value="Max 2 transfers per ronde" />
          <Row label="Vanaf halve finale"           value="Geen transfers meer mogelijk" />
          <p style={{ color: "var(--c-text-3)", fontSize: "8px" }}>
            Ongebruikte transfers vervallen — je kunt ze niet oppotten voor de volgende ronde.
          </p>
        </FaqSection>

        <FaqSection tab="manager" title="🎮 PUNTENSYSTEEM" headerColor="#0a2a0a">
          <p>
            Punten worden bijgehouden per wedstrijd. Een admin voert de statistieken in na elke
            speeldag.
          </p>
          <H>MINUTEN GESPEELD</H>
          <Row label="1–59 minuten"   value="+1 pt" />
          <Row label="60+ minuten"    value="+2 pt" />

          <H>DOELPUNTEN</H>
          <Row label="Keeper / verdediger"    value="+6 pt" />
          <Row label="Middenvelder"           value="+5 pt" />
          <Row label="Aanvaller"              value="+4 pt" />

          <H>ASSISTS & CLEAN SHEET</H>
          <Row label="Assist"                                 value="+3 pt" />
          <Row label="Clean sheet (GK/DEF, 60+ min)"         value="+4 pt" />
          <Row label="Clean sheet (MID, 60+ min)"            value="+1 pt" />
          <Row label="Elke 3 reddingen (GK)"                 value="+1 pt" />
          <Row label="Penalty gestopt"                       value="+5 pt" />

          <H>NEGATIEVE PUNTEN</H>
          <Row label="Elke 2 tegendoelpunten (GK/DEF)"  value="−1 pt" />
          <Row label="Penalty gemist"                    value="−2 pt" />
          <Row label="Gele kaart"                        value="−1 pt" />
          <Row label="Rode kaart"                        value="−3 pt" />
          <Row label="Eigen doelpunt"                    value="−2 pt" />

          <p>
            Elke speler kan ook <span style={{ color: "#FFD700" }}>bonuspunten</span> krijgen voor
            een bijzondere prestatie — toegekend door de admin.
          </p>
        </FaqSection>

        {/* ═══════════════════════════════════════════════
            TAB: OVER DE APP
        ═══════════════════════════════════════════════ */}

        <FaqSection tab="app" title="🔴 LIVE WEDSTRIJDEN" headerColor="#1a1a00">
          <p>
            Zodra een wedstrijd begint verschijnt het{" "}
            <span className="pixel-live" style={{ animationPlayState: "paused", opacity: 1 }}>● LIVE</span>
            {" "}label. De score wordt bijgewerkt tijdens de wedstrijd.
            Voorspellingen zijn op dat moment al vergrendeld.
          </p>
        </FaqSection>

        <FaqSection tab="app" title="🏅 ACHIEVEMENTS" headerColor="#1a1a00">
          <p>
            Tijdens het toernooi verdien je automatisch{" "}
            <span style={{ color: "#FFD700" }}>achievements</span> — kleine pixel-emoji&apos;s die
            naast je naam verschijnen op de ranglijst, in het prikbord en overal waar je naam staat.
            Ze leveren geen extra punten op, maar wel pure eer.
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
        </FaqSection>

        <FaqSection tab="app" title="🤖 DE POOL-BOT" headerColor="#1a1a00">
          <p>
            De Pool-bot plaatst automatisch meldingen in het prikbord bij belangrijke gebeurtenissen.
          </p>
          <Row label="🚨 Leiderswissel"   value="Wanneer iemand de eerste plaats overneemt" />
          <Row label="🏅 Achievement"      value="Wanneer iemand een nieuwe badge verdient" />
          <Row label="📊 Dagoverzicht"     value="Na een speeldag — uitslagen + topscorer" />
          <p style={{ color: "var(--c-text-3)", fontSize: "8px" }}>
            Pool-bot berichten herken je aan de gouden zijbalk en de 🤖 POOL-BOT naam.
          </p>
        </FaqSection>

        <FaqSection tab="app" title="🎮 ZIJN ER EASTER EGGS?" headerColor="#1a1a00">
          <p>
            Misschien wel. Misschien niet. Een echte gamer kent de magische volgorde uit zijn hoofd:
          </p>
          <p className="font-pixel text-center" style={{ fontSize: "10px", color: "#FFD700", letterSpacing: "4px", lineHeight: 2 }}>
            ↑ ↑ ↓ ↓ ← → ← → B A
          </p>
          <p style={{ color: "var(--c-text-3)", fontSize: "8px" }}>
            Er zijn ook andere geheime woorden die je gewoon kunt typen op een willekeurige plek
            (niet in een invoerveld)...{" "}
            <span style={{ color: "#FFD700" }}>HUP</span> is patriottisch.{" "}
            <span style={{ color: "#FFD700" }}>GOAL</span> doet iets dramatisch.
            De rest? Ontdek zelf maar.
          </p>
          <p style={{ color: "var(--c-text-4)", fontSize: "7px" }}>
            Geluid aanzetten? Gebruik de ♫ knop in de header. Zonder geluid mis je de helft van de fun.
          </p>
        </FaqSection>

      </FaqTabs>

      <div className="text-center py-4">
        <Link href="/dashboard" className="font-pixel" style={{ fontSize: "7px", color: "#7070a0" }}>
          ◄ TERUG NAAR DASHBOARD
        </Link>
      </div>
    </div>
  )
}
