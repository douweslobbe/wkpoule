import { BonusQuestionType } from "@prisma/client"

export type DefaultQuestion = {
  type: BonusQuestionType
  category: string
  question: string
  description?: string
  orderIndex: number
}

export const DEFAULT_BONUS_QUESTIONS: DefaultQuestion[] = [
  // ─── Openvragen ────────────────────────────────────────────────────────────
  {
    type: "OPEN",
    category: "Openvragen",
    question: "Topscorer van het toernooi",
    description: "Voornaam en achternaam (maximaal 32 tekens)",
    orderIndex: 1,
  },
  {
    type: "OPEN",
    category: "Openvragen",
    question: "Topscorer van het Nederlands elftal",
    description: "Voornaam en achternaam (maximaal 32 tekens)",
    orderIndex: 2,
  },
  {
    type: "OPEN",
    category: "Openvragen",
    question: "Land met de meeste doelpunten voor",
    description: "Alle rondes, reguliere speeltijd inclusief blessuretijd",
    orderIndex: 3,
  },
  {
    type: "OPEN",
    category: "Openvragen",
    question: "Land met de meeste doelpunten tegen",
    description: "Alle rondes, reguliere speeltijd inclusief blessuretijd",
    orderIndex: 4,
  },
  {
    type: "OPEN",
    category: "Openvragen",
    question: "Land met de meeste rode en gele kaarten",
    description: "Een rode kaart telt als twee gele kaarten",
    orderIndex: 5,
  },

  // ─── Schattingsvragen – Toernooi breed ────────────────────────────────────
  {
    type: "ESTIMATION",
    category: "Schattingsvragen – Toernooi",
    question: "Totaal aantal doelpunten in het toernooi",
    description: "Alle rondes, reguliere speeltijd inclusief blessuretijd",
    orderIndex: 10,
  },
  {
    type: "ESTIMATION",
    category: "Schattingsvragen – Toernooi",
    question: "Totaal aantal gele kaarten in het toernooi",
    description: "Twee gele kaarten voor dezelfde speler in één wedstrijd telt als één rode kaart",
    orderIndex: 11,
  },
  {
    type: "ESTIMATION",
    category: "Schattingsvragen – Toernooi",
    question: "Totaal aantal rode kaarten in het toernooi",
    description: "Twee gele kaarten voor dezelfde speler in één wedstrijd telt als één rode kaart",
    orderIndex: 12,
  },
  {
    type: "ESTIMATION",
    category: "Schattingsvragen – Toernooi",
    question: "Aantal wedstrijden dat eindigt in een gelijkspel",
    description: "Stand na reguliere speeltijd inclusief blessuretijd",
    orderIndex: 13,
  },
  {
    type: "ESTIMATION",
    category: "Schattingsvragen – Toernooi",
    question: "Aantal wedstrijden dat eindigt in winst voor één van de teams",
    description: "Stand na reguliere speeltijd inclusief blessuretijd",
    orderIndex: 14,
  },

  // ─── Schattingsvragen – Nederland ─────────────────────────────────────────
  {
    type: "ESTIMATION",
    category: "Schattingsvragen – Nederland",
    question: "Totaal aantal doelpunten van Nederland op het WK",
    description: "Alle rondes, reguliere speeltijd inclusief blessuretijd",
    orderIndex: 20,
  },
  {
    type: "ESTIMATION",
    category: "Schattingsvragen – Nederland",
    question: "Totaal aantal gele kaarten van Nederland op het WK",
    description: "Alle rondes",
    orderIndex: 21,
  },
  {
    type: "ESTIMATION",
    category: "Schattingsvragen – Nederland",
    question: "Totaal aantal rode kaarten van Nederland op het WK",
    description: "Alle rondes",
    orderIndex: 22,
  },
  {
    type: "ESTIMATION",
    category: "Schattingsvragen – Nederland",
    question: "Totaal aantal corners van Nederland op het WK",
    description: "Alle rondes",
    orderIndex: 23,
  },
  {
    type: "ESTIMATION",
    category: "Schattingsvragen – Nederland",
    question: "Totaal aantal vrije trappen van Nederland op het WK",
    description: "Alle rondes",
    orderIndex: 24,
  },
  {
    type: "ESTIMATION",
    category: "Schattingsvragen – Nederland",
    question: "Totaal aantal penalty's van Nederland op het WK",
    description: "Inclusief strafschoppenseries",
    orderIndex: 25,
  },

  // ─── Stellingen – Oranje algemeen ─────────────────────────────────────────
  {
    type: "STATEMENT",
    category: "🇳🇱 Oranje algemeen",
    question: "Nederland bereikt de kwartfinale van het WK",
    orderIndex: 30,
  },
  {
    type: "STATEMENT",
    category: "🇳🇱 Oranje algemeen",
    question: "Nederland bereikt de halve finale van het WK",
    orderIndex: 31,
  },
  {
    type: "STATEMENT",
    category: "🇳🇱 Oranje algemeen",
    question: "Nederland wint het WK",
    orderIndex: 32,
  },
  {
    type: "STATEMENT",
    category: "🇳🇱 Oranje algemeen",
    question: "Er wordt minimaal één hattrick gescoord door een Nederlandse speler",
    description: "Doelpunten tijdens een strafschoppenserie tellen niet mee",
    orderIndex: 33,
  },
  {
    type: "STATEMENT",
    category: "🇳🇱 Oranje algemeen",
    question: "De finale wordt een Europees onderonsje (twee Europese landen)",
    orderIndex: 34,
  },
  {
    type: "STATEMENT",
    category: "🇳🇱 Oranje algemeen",
    question: "Er worden meer dan 200 doelpunten gescoord tijdens de groepsfase",
    description: "Alleen reguliere speeltijd inclusief blessuretijd",
    orderIndex: 35,
  },

  // ─── Stellingen – Spelers vs spelers ─────────────────────────────────────
  {
    type: "STATEMENT",
    category: "⚽ Spelers vs spelers",
    question: "Mbappé scoort meer doelpunten dan Haaland",
    description: "Reguliere speeltijd + blessuretijd, strafschoppenseries tellen niet",
    orderIndex: 40,
  },
  {
    type: "STATEMENT",
    category: "⚽ Spelers vs spelers",
    question: "Bellingham geeft meer assists dan Kane",
    description: "Alle rondes",
    orderIndex: 41,
  },
  {
    type: "STATEMENT",
    category: "⚽ Spelers vs spelers",
    question: "Xavi Simons speelt meer minuten dan Cody Gakpo",
    description: "Inclusief invalbeurten, exclusief strafschoppenseries",
    orderIndex: 42,
  },
  {
    type: "STATEMENT",
    category: "⚽ Spelers vs spelers",
    question: "Pedri speelt meer passes dan Musiala",
    description: "Alle rondes",
    orderIndex: 43,
  },
  {
    type: "STATEMENT",
    category: "⚽ Spelers vs spelers",
    question: "Frenkie de Jong geeft meer key passes dan Declan Rice",
    description: "Alle rondes",
    orderIndex: 44,
  },

  // ─── Stellingen – Land vs land ────────────────────────────────────────────
  {
    type: "STATEMENT",
    category: "🌍 Land vs land",
    question: "Brazilië komt verder dan Argentinië",
    description: "Verder komen = hogere ronde bereiken. Bij exact gelijk eindigen geldt de stelling als fout",
    orderIndex: 50,
  },
  {
    type: "STATEMENT",
    category: "🌍 Land vs land",
    question: "Frankrijk komt verder dan Engeland",
    description: "Verder komen = hogere ronde bereiken. Bij exact gelijk eindigen geldt de stelling als fout",
    orderIndex: 51,
  },
  {
    type: "STATEMENT",
    category: "🌍 Land vs land",
    question: "Nederland komt verder dan Duitsland",
    description: "Verder komen = hogere ronde bereiken. Bij exact gelijk eindigen geldt de stelling als fout",
    orderIndex: 52,
  },
  {
    type: "STATEMENT",
    category: "🌍 Land vs land",
    question: "Spanje komt verder dan Italië",
    description: "Verder komen = hogere ronde bereiken. Bij exact gelijk eindigen geldt de stelling als fout",
    orderIndex: 53,
  },
  {
    type: "STATEMENT",
    category: "🌍 Land vs land",
    question: "Portugal komt verder dan België",
    description: "Verder komen = hogere ronde bereiken. Bij exact gelijk eindigen geldt de stelling als fout",
    orderIndex: 54,
  },
  {
    type: "STATEMENT",
    category: "🌍 Land vs land",
    question: "VS komt verder dan Mexico",
    description: "Verder komen = hogere ronde bereiken. Bij exact gelijk eindigen geldt de stelling als fout",
    orderIndex: 55,
  },

  // ─── Stellingen – Team prestaties ─────────────────────────────────────────
  {
    type: "STATEMENT",
    category: "🎯 Team prestaties",
    question: "Nederland scoort meer dan 10 doelpunten in het toernooi",
    description: "Alle rondes, reguliere speeltijd inclusief blessuretijd",
    orderIndex: 60,
  },
  {
    type: "STATEMENT",
    category: "🎯 Team prestaties",
    question: "Frankrijk krijgt minder dan 5 tegendoelpunten",
    description: "Alle rondes, reguliere speeltijd inclusief blessuretijd",
    orderIndex: 61,
  },
  {
    type: "STATEMENT",
    category: "🎯 Team prestaties",
    question: "Engeland wint minimaal 4 wedstrijden",
    description: "Inclusief winst na verlengingen, exclusief strafschoppenseries",
    orderIndex: 62,
  },
  {
    type: "STATEMENT",
    category: "🎯 Team prestaties",
    question: "Brazilië houdt minimaal 3 keer de nul",
    description: "Reguliere speeltijd inclusief blessuretijd",
    orderIndex: 63,
  },
  {
    type: "STATEMENT",
    category: "🎯 Team prestaties",
    question: "Duitsland scoort in elke groepswedstrijd",
    description: "Reguliere speeltijd inclusief blessuretijd",
    orderIndex: 64,
  },

  // ─── Stellingen – Toernooi-statistieken ──────────────────────────────────
  {
    type: "STATEMENT",
    category: "📊 Toernooi-statistieken",
    question: "De topscorer maakt minimaal 7 doelpunten",
    description: "Reguliere speeltijd + blessuretijd, strafschoppenseries tellen niet",
    orderIndex: 70,
  },
  {
    type: "STATEMENT",
    category: "📊 Toernooi-statistieken",
    question: "Er worden meer dan 5 rode kaarten gegeven in totaal",
    description: "Inclusief tweede gele kaarten",
    orderIndex: 71,
  },
  {
    type: "STATEMENT",
    category: "📊 Toernooi-statistieken",
    question: "Minimaal 3 wedstrijden eindigen in een penaltyserie",
    orderIndex: 72,
  },
  {
    type: "STATEMENT",
    category: "📊 Toernooi-statistieken",
    question: "Er vallen meer dan 150 doelpunten in het hele toernooi",
    description: "Alle rondes, reguliere speeltijd inclusief blessuretijd",
    orderIndex: 73,
  },
  {
    type: "STATEMENT",
    category: "📊 Toernooi-statistieken",
    question: "Minimaal 5 eigen doelpunten worden gescoord",
    description: "Alle rondes",
    orderIndex: 74,
  },
  {
    type: "STATEMENT",
    category: "📊 Toernooi-statistieken",
    question: "Minstens 1 land wint een wedstrijd met 4 of meer doelpunten verschil",
    description: "Alle rondes, reguliere speeltijd inclusief blessuretijd",
    orderIndex: 75,
  },

  // ─── Stellingen – Oranje-specifiek ───────────────────────────────────────
  {
    type: "STATEMENT",
    category: "🇳🇱 Oranje-specifiek",
    question: "Nederland wint minimaal 2 groepswedstrijden",
    orderIndex: 80,
  },
  {
    type: "STATEMENT",
    category: "🇳🇱 Oranje-specifiek",
    question: "Oranje krijgt minder dan 2 tegendoelpunten in de groepsfase",
    description: "Reguliere speeltijd inclusief blessuretijd",
    orderIndex: 81,
  },
  {
    type: "STATEMENT",
    category: "🇳🇱 Oranje-specifiek",
    question: "De Nederlandse topscorer maakt minimaal 4 goals",
    description: "Alle rondes, strafschoppenseries tellen niet",
    orderIndex: 82,
  },
  {
    type: "STATEMENT",
    category: "🇳🇱 Oranje-specifiek",
    question: "Nederland wint minimaal 1 knock-outwedstrijd",
    description: "Inclusief winst na verlengingen of strafschoppen",
    orderIndex: 83,
  },
  {
    type: "STATEMENT",
    category: "🇳🇱 Oranje-specifiek",
    question: "Er spelen minimaal 18 verschillende spelers minuten voor Oranje",
    description: "Inclusief invalbeurten",
    orderIndex: 84,
  },
  {
    type: "STATEMENT",
    category: "🇳🇱 Oranje-specifiek",
    question: "Nederland krijgt meer gele kaarten dan doelpunten in het toernooi",
    description: "Alle rondes",
    orderIndex: 85,
  },
  {
    type: "STATEMENT",
    category: "🇳🇱 Oranje-specifiek",
    question: "Een verdediger van Oranje scoort vaker dan een aanvaller in het toernooi",
    description: "Strafschoppenseries tellen niet",
    orderIndex: 86,
  },
  {
    type: "STATEMENT",
    category: "🇳🇱 Oranje-specifiek",
    question: "Oranje komt achter in minimaal 3 wedstrijden",
    description: "Reguliere speeltijd inclusief blessuretijd",
    orderIndex: 87,
  },

  // ─── Stellingen – Grappig maar meetbaar ──────────────────────────────────
  {
    type: "STATEMENT",
    category: "😂 Grappig maar meetbaar",
    question: "Minstens 1 keeper scoort (penalty of uit het spel)",
    description: "Strafschoppenseries tellen ook mee",
    orderIndex: 90,
  },
  {
    type: "STATEMENT",
    category: "😂 Grappig maar meetbaar",
    question: "Minstens 1 hattrick wordt gescoord in de knock-outfase",
    description: "Strafschoppenseries tellen niet",
    orderIndex: 91,
  },
  {
    type: "STATEMENT",
    category: "😂 Grappig maar meetbaar",
    question: "Er wordt minimaal 1 penalty gemist in een finale of halve finale",
    description: "Reguliere speeltijd of verlengingen, geen strafschoppenseries",
    orderIndex: 92,
  },
  {
    type: "STATEMENT",
    category: "😂 Grappig maar meetbaar",
    question: "Minstens 1 wedstrijd wordt beslist door een VAR-interventie (penalty of afgekeurd goal)",
    description: "Beslissend = zonder de VAR had de uitslag anders geweest",
    orderIndex: 93,
  },
  {
    type: "STATEMENT",
    category: "😂 Grappig maar meetbaar",
    question: "Er valt een doelpunt in de eerste minuut van een wedstrijd",
    description: "Eerste minuut = voor het fluitsignaal dat minuut 2 aangeeft",
    orderIndex: 94,
  },
  {
    type: "STATEMENT",
    category: "😂 Grappig maar meetbaar",
    question: "Er valt een beslissend doelpunt in minuut 90+5 of later",
    description: "Beslissend = winnende goal of gelijkmaker in een knock-outwedstrijd",
    orderIndex: 95,
  },
  {
    type: "STATEMENT",
    category: "😂 Grappig maar meetbaar",
    question: "Minstens 2 spelers scoren tegen hun (club)teamgenoot",
    description: "Telt alleen als de spelers op het moment van het doelpunt bij dezelfde club spelen",
    orderIndex: 96,
  },
  {
    type: "STATEMENT",
    category: "😂 Grappig maar meetbaar",
    question: "Er worden meer penalties gemist dan benut in het hele toernooi",
    description: "Reguliere speeltijd + verlengingen, exclusief strafschoppenseries",
    orderIndex: 97,
  },

  // ─── Stellingen – Dit zou zomaar kunnen ──────────────────────────────────
  {
    type: "STATEMENT",
    category: "🤡 Dit zou zomaar kunnen",
    question: "Een verdediger eindigt in de top 5 van topscorers",
    description: "Strafschoppenseries tellen niet",
    orderIndex: 110,
  },
  {
    type: "STATEMENT",
    category: "🤡 Dit zou zomaar kunnen",
    question: "Er worden meer eigen doelpunten gescoord dan vrije trappen direct in het doel",
    description: "Alle rondes",
    orderIndex: 111,
  },
  {
    type: "STATEMENT",
    category: "🤡 Dit zou zomaar kunnen",
    question: "Minstens 3 wedstrijden worden beslist door een penalty in blessuretijd",
    description: "Blessuretijd = na minuut 90",
    orderIndex: 112,
  },
  {
    type: "STATEMENT",
    category: "🤡 Dit zou zomaar kunnen",
    question: "Een invaller scoort minimaal 3 goals in het toernooi (als invaller)",
    description: "Alleen goals gescoord na ingevallen te zijn",
    orderIndex: 113,
  },
  {
    type: "STATEMENT",
    category: "🤡 Dit zou zomaar kunnen",
    question: "De topscorer scoort geen enkel doelpunt in de groepsfase",
    description: "Strafschoppenseries tellen niet",
    orderIndex: 114,
  },
  {
    type: "STATEMENT",
    category: "🤡 Dit zou zomaar kunnen",
    question: "Minstens 1 wedstrijd eindigt in 0-0 in de knock-outfase",
    description: "Stand na reguliere speeltijd inclusief blessuretijd",
    orderIndex: 115,
  },
  {
    type: "STATEMENT",
    category: "🤡 Dit zou zomaar kunnen",
    question: "Nederland wint een wedstrijd zonder zelf te scoren (eigen goal tegenstander)",
    description: "Reguliere speeltijd inclusief blessuretijd",
    orderIndex: 116,
  },

  // ─── Stellingen – Keeper chaos ────────────────────────────────────────────
  {
    type: "STATEMENT",
    category: "🎭 Keeper chaos",
    question: "Minstens 1 keeper krijgt een gele kaart voor tijdrekken",
    orderIndex: 120,
  },
  {
    type: "STATEMENT",
    category: "🎭 Keeper chaos",
    question: "Een keeper pakt 2 penalties in één wedstrijd",
    description: "Inclusief strafschoppenseries",
    orderIndex: 121,
  },
  {
    type: "STATEMENT",
    category: "🎭 Keeper chaos",
    question: "Een penaltyserie eindigt met een misser van een verdediger",
    orderIndex: 122,
  },
  {
    type: "STATEMENT",
    category: "🎭 Keeper chaos",
    question: "Minstens 1 keeper wordt Man of the Match in een verloren wedstrijd",
    orderIndex: 123,
  },

  // ─── Stellingen – Statistisch vreemd ─────────────────────────────────────
  {
    type: "STATEMENT",
    category: "🧠 Statistisch vreemd",
    question: "Er vallen meer doelpunten in de tweede helft dan in de eerste helft (toernooi totaal)",
    description: "Alle rondes, reguliere speeltijd inclusief blessuretijd",
    orderIndex: 130,
  },
  {
    type: "STATEMENT",
    category: "🧠 Statistisch vreemd",
    question: "Minstens 1 team scoort in elke groepswedstrijd maar gaat er toch uit",
    orderIndex: 131,
  },
  {
    type: "STATEMENT",
    category: "🧠 Statistisch vreemd",
    question: "Een land gaat door met minder dan 4 punten in de groepsfase",
    orderIndex: 132,
  },

  // ─── Stellingen – Bonus (discussiemagneten) ───────────────────────────────
  {
    type: "STATEMENT",
    category: "🔥 Bonus",
    question: "De WK-finale wordt beslist via een strafschoppenserie",
    orderIndex: 150,
  },
  {
    type: "STATEMENT",
    category: "🔥 Bonus",
    question: "Beide finalisten scoren in de finale",
    description: "Reguliere speeltijd inclusief blessuretijd",
    orderIndex: 151,
  },
  {
    type: "STATEMENT",
    category: "🔥 Bonus",
    question: "De winnaar van het WK verliest minimaal 1 wedstrijd in het toernooi",
    description: "Reguliere speeltijd inclusief blessuretijd",
    orderIndex: 152,
  },
]

/** Unieke categorieën in volgorde van verschijning */
export const QUESTION_CATEGORIES = Array.from(
  new Set(DEFAULT_BONUS_QUESTIONS.map((q) => q.category))
)
