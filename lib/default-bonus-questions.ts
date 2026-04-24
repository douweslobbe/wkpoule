import { BonusQuestionType } from "@prisma/client"

export type DefaultQuestion = {
  type: BonusQuestionType
  question: string
  description?: string
  orderIndex: number
}

export const DEFAULT_BONUS_QUESTIONS: DefaultQuestion[] = [
  // ─── Openvragen ────────────────────────────────────────────────────────────
  {
    type: "OPEN",
    question: "Topscorer van het toernooi",
    description: "Voornaam en achternaam (maximaal 32 tekens)",
    orderIndex: 1,
  },
  {
    type: "OPEN",
    question: "Topscorer van het Nederlands elftal",
    description: "Voornaam en achternaam (maximaal 32 tekens)",
    orderIndex: 2,
  },
  {
    type: "OPEN",
    question: "Land met de meeste doelpunten voor",
    description: "Alleen doelpunten in reguliere speeltijd inclusief blessuretijd",
    orderIndex: 3,
  },
  {
    type: "OPEN",
    question: "Land met de meeste doelpunten tegen",
    description: "Alleen doelpunten in reguliere speeltijd inclusief blessuretijd",
    orderIndex: 4,
  },
  {
    type: "OPEN",
    question: "Land met de meeste rode en gele kaarten",
    description: "Een rode kaart telt als twee gele kaarten",
    orderIndex: 5,
  },

  // ─── Benaderingsvragen – toernooi breed ───────────────────────────────────
  {
    type: "ESTIMATION",
    question: "Totaal aantal doelpunten in het toernooi",
    description: "Alleen doelpunten in reguliere speeltijd inclusief blessuretijd",
    orderIndex: 10,
  },
  {
    type: "ESTIMATION",
    question: "Totaal aantal gele kaarten in het toernooi",
    description: "Twee gele kaarten voor dezelfde speler in één wedstrijd telt als één rode kaart",
    orderIndex: 11,
  },
  {
    type: "ESTIMATION",
    question: "Totaal aantal rode kaarten in het toernooi",
    description: "Twee gele kaarten voor dezelfde speler in één wedstrijd telt als één rode kaart",
    orderIndex: 12,
  },
  {
    type: "ESTIMATION",
    question: "Aantal wedstrijden dat eindigt in een gelijkspel",
    description: "Stand na reguliere speeltijd inclusief blessuretijd",
    orderIndex: 13,
  },
  {
    type: "ESTIMATION",
    question: "Aantal wedstrijden dat eindigt in winst voor één van de teams",
    description: "Stand na reguliere speeltijd inclusief blessuretijd",
    orderIndex: 14,
  },

  // ─── Benaderingsvragen – Nederland ────────────────────────────────────────
  {
    type: "ESTIMATION",
    question: "Totaal aantal doelpunten van Nederland op het WK",
    description: "Alle rondes, reguliere speeltijd inclusief blessuretijd",
    orderIndex: 20,
  },
  {
    type: "ESTIMATION",
    question: "Totaal aantal gele kaarten van Nederland op het WK",
    description: "Alle rondes",
    orderIndex: 21,
  },
  {
    type: "ESTIMATION",
    question: "Totaal aantal rode kaarten van Nederland op het WK",
    description: "Alle rondes",
    orderIndex: 22,
  },
  {
    type: "ESTIMATION",
    question: "Totaal aantal corners van Nederland op het WK",
    description: "Alle rondes",
    orderIndex: 23,
  },
  {
    type: "ESTIMATION",
    question: "Totaal aantal vrije trappen van Nederland op het WK",
    description: "Alle rondes",
    orderIndex: 24,
  },
  {
    type: "ESTIMATION",
    question: "Totaal aantal penalty's van Nederland op het WK",
    description: "Inclusief strafschoppenseries",
    orderIndex: 25,
  },

  // ─── Stellingen – Nederland bereikt... ───────────────────────────────────
  {
    type: "STATEMENT",
    question: "Nederland bereikt de kwartfinale van het WK",
    orderIndex: 30,
  },
  {
    type: "STATEMENT",
    question: "Nederland bereikt de halve finale van het WK",
    orderIndex: 31,
  },
  {
    type: "STATEMENT",
    question: "Nederland wint het WK",
    orderIndex: 32,
  },
  {
    type: "STATEMENT",
    question: "Er wordt minimaal één hattrick gescoord door een Nederlandse speler",
    description: "Doelpunten tijdens een strafschoppenserie tellen niet mee",
    orderIndex: 33,
  },
  {
    type: "STATEMENT",
    question: "De finale wordt een Europees onderonsje (twee Europese landen)",
    orderIndex: 34,
  },
  {
    type: "STATEMENT",
    question: "Er worden meer dan 200 doelpunten gescoord tijdens de groepsfase",
    description: "Alleen reguliere speeltijd inclusief blessuretijd",
    orderIndex: 35,
  },

  // ─── Stellingen – Spelers vs spelers ─────────────────────────────────────
  {
    type: "STATEMENT",
    question: "Mbappé scoort meer doelpunten dan Haaland",
    description: "Reguliere speeltijd + blessuretijd, strafschoppenseries tellen niet",
    orderIndex: 40,
  },
  {
    type: "STATEMENT",
    question: "Bellingham geeft meer assists dan Kane",
    description: "Alle rondes",
    orderIndex: 41,
  },
  {
    type: "STATEMENT",
    question: "Xavi Simons speelt meer minuten dan Cody Gakpo",
    description: "Inclusief invalbeurten, exclusief strafschoppenseries",
    orderIndex: 42,
  },
  {
    type: "STATEMENT",
    question: "Pedri speelt meer passes dan Musiala",
    description: "Alle rondes",
    orderIndex: 43,
  },
  {
    type: "STATEMENT",
    question: "Vinícius Jr. heeft meer doelpunten + assists dan Neymar",
    description: "Neymar moet dus deelnemen aan het toernooi; bij afwezigheid geldt de stelling als fout",
    orderIndex: 44,
  },
  {
    type: "STATEMENT",
    question: "Frenkie de Jong geeft meer key passes dan Declan Rice",
    description: "Alle rondes",
    orderIndex: 45,
  },

  // ─── Stellingen – Land vs land ────────────────────────────────────────────
  {
    type: "STATEMENT",
    question: "Brazilië komt verder dan Argentinië",
    description: "Verder komen = hogere ronde bereiken. Bij gelijke ronde: wie het verst doorkomt wint, bij exact gelijk eindigen geldt de stelling als fout",
    orderIndex: 50,
  },
  {
    type: "STATEMENT",
    question: "Frankrijk komt verder dan Engeland",
    description: "Verder komen = hogere ronde bereiken. Bij gelijke ronde: wie het verst doorkomt wint, bij exact gelijk eindigen geldt de stelling als fout",
    orderIndex: 51,
  },
  {
    type: "STATEMENT",
    question: "Nederland komt verder dan Duitsland",
    description: "Verder komen = hogere ronde bereiken. Bij gelijke ronde: wie het verst doorkomt wint, bij exact gelijk eindigen geldt de stelling als fout",
    orderIndex: 52,
  },
  {
    type: "STATEMENT",
    question: "Spanje komt verder dan Italië",
    description: "Verder komen = hogere ronde bereiken. Bij gelijke ronde: wie het verst doorkomt wint, bij exact gelijk eindigen geldt de stelling als fout",
    orderIndex: 53,
  },
  {
    type: "STATEMENT",
    question: "Portugal komt verder dan België",
    description: "Verder komen = hogere ronde bereiken. Bij gelijke ronde: wie het verst doorkomt wint, bij exact gelijk eindigen geldt de stelling als fout",
    orderIndex: 54,
  },
  {
    type: "STATEMENT",
    question: "VS komt verder dan Mexico",
    description: "Verder komen = hogere ronde bereiken. Bij gelijke ronde: wie het verst doorkomt wint, bij exact gelijk eindigen geldt de stelling als fout",
    orderIndex: 55,
  },

  // ─── Stellingen – Team prestaties ─────────────────────────────────────────
  {
    type: "STATEMENT",
    question: "Nederland scoort meer dan 10 doelpunten in het toernooi",
    description: "Alle rondes, reguliere speeltijd inclusief blessuretijd",
    orderIndex: 60,
  },
  {
    type: "STATEMENT",
    question: "Frankrijk krijgt minder dan 5 tegendoelpunten",
    description: "Alle rondes, reguliere speeltijd inclusief blessuretijd",
    orderIndex: 61,
  },
  {
    type: "STATEMENT",
    question: "Engeland wint minimaal 4 wedstrijden",
    description: "Inclusief winst na verlengingen, exclusief strafschoppenseries",
    orderIndex: 62,
  },
  {
    type: "STATEMENT",
    question: "Brazilië houdt minimaal 3 keer de nul",
    description: "Reguliere speeltijd inclusief blessuretijd",
    orderIndex: 63,
  },
  {
    type: "STATEMENT",
    question: "Duitsland scoort in elke groepswedstrijd",
    description: "Reguliere speeltijd inclusief blessuretijd",
    orderIndex: 64,
  },

  // ─── Stellingen – Toernooi-statistieken ──────────────────────────────────
  {
    type: "STATEMENT",
    question: "De topscorer maakt minimaal 7 doelpunten",
    description: "Reguliere speeltijd + blessuretijd, strafschoppenseries tellen niet",
    orderIndex: 70,
  },
  {
    type: "STATEMENT",
    question: "Er worden meer dan 5 rode kaarten gegeven in totaal",
    description: "Inclusief tweede gele kaarten",
    orderIndex: 71,
  },
  {
    type: "STATEMENT",
    question: "Minimaal 3 wedstrijden eindigen in een penaltyserie",
    orderIndex: 72,
  },
  {
    type: "STATEMENT",
    question: "Er vallen meer dan 150 doelpunten in het hele toernooi",
    description: "Alle rondes, reguliere speeltijd inclusief blessuretijd",
    orderIndex: 73,
  },
  {
    type: "STATEMENT",
    question: "Minimaal 5 eigen doelpunten worden gescoord",
    description: "Alle rondes",
    orderIndex: 74,
  },

  // ─── Stellingen – Oranje-specifiek ───────────────────────────────────────
  {
    type: "STATEMENT",
    question: "Nederland wint minimaal 2 groepswedstrijden",
    orderIndex: 80,
  },
  {
    type: "STATEMENT",
    question: "Oranje krijgt minder dan 2 tegendoelpunten in de groepsfase",
    description: "Reguliere speeltijd inclusief blessuretijd",
    orderIndex: 81,
  },
  {
    type: "STATEMENT",
    question: "De Nederlandse topscorer maakt minimaal 4 goals",
    description: "Alle rondes, strafschoppenseries tellen niet",
    orderIndex: 82,
  },
  {
    type: "STATEMENT",
    question: "Nederland wint minimaal 1 knock-outwedstrijd",
    description: "Inclusief winst na verlengingen of strafschoppen",
    orderIndex: 83,
  },
  {
    type: "STATEMENT",
    question: "Er spelen minimaal 18 verschillende spelers minuten voor Oranje",
    description: "Inclusief invalbeurten",
    orderIndex: 84,
  },

  // ─── Stellingen – Grappig maar meetbaar ──────────────────────────────────
  {
    type: "STATEMENT",
    question: "Minstens 1 keeper scoort (penalty of uit het spel)",
    description: "Strafschoppenseries tellen ook mee",
    orderIndex: 90,
  },
  {
    type: "STATEMENT",
    question: "Minstens 1 hattrick wordt gescoord in de knock-outfase",
    description: "Strafschoppenseries tellen niet",
    orderIndex: 91,
  },
  {
    type: "STATEMENT",
    question: "Er wordt minimaal 1 penalty gemist in een finale of halve finale",
    description: "Reguliere speeltijd of verlengingen, geen strafschoppenseries",
    orderIndex: 92,
  },
  {
    type: "STATEMENT",
    question: "Minstens 1 wedstrijd wordt beslist door een VAR-interventie (penalty of afgekeurd goal)",
    description: "Beslissend = zonder de VAR had de uitslag anders geweest",
    orderIndex: 93,
  },

  // ─── Stellingen – Goud-categorie ─────────────────────────────────────────
  {
    type: "STATEMENT",
    question: "Er worden meer penalties gemist dan benut in het hele toernooi",
    description: "Reguliere speeltijd + verlengingen, exclusief strafschoppenseries",
    orderIndex: 100,
  },
  {
    type: "STATEMENT",
    question: "Er valt een doelpunt in de eerste minuut van een wedstrijd",
    description: "Eerste minuut = voor het fluitsignaal dat minuut 2 aangeeft",
    orderIndex: 101,
  },
  {
    type: "STATEMENT",
    question: "Er valt een beslissend doelpunt in minuut 90+5 of later",
    description: "Beslissend = de winnende goal of gelijkmaker in een knock-outwedstrijd",
    orderIndex: 102,
  },
  {
    type: "STATEMENT",
    question: "Minstens 1 wedstrijd eindigt in 0-0 in de knock-outfase",
    description: "Stand na reguliere speeltijd inclusief blessuretijd",
    orderIndex: 103,
  },

  // ─── Stellingen – Dit zou zomaar kunnen ──────────────────────────────────
  {
    type: "STATEMENT",
    question: "Een verdediger eindigt in de top 5 van topscorers",
    description: "Strafschoppenseries tellen niet",
    orderIndex: 110,
  },
  {
    type: "STATEMENT",
    question: "Er worden meer eigen doelpunten gescoord dan vrije trappen direct in het doel",
    description: "Alle rondes",
    orderIndex: 111,
  },
  {
    type: "STATEMENT",
    question: "Minstens 3 wedstrijden worden beslist door een penalty in blessuretijd",
    description: "Blessuretijd = na minuut 90",
    orderIndex: 112,
  },
  {
    type: "STATEMENT",
    question: "Een invaller scoort minimaal 3 goals in het toernooi (als invaller)",
    description: "Alleen goals gescoord na ingevallen te zijn",
    orderIndex: 113,
  },
  {
    type: "STATEMENT",
    question: "De topscorer scoort geen enkel doelpunt in de groepsfase",
    description: "Strafschoppenseries tellen niet",
    orderIndex: 114,
  },

  // ─── Stellingen – Keeper chaos ────────────────────────────────────────────
  {
    type: "STATEMENT",
    question: "Minstens 1 keeper krijgt een gele kaart voor tijdrekken",
    orderIndex: 120,
  },
  {
    type: "STATEMENT",
    question: "Een keeper pakt 2 penalties in één wedstrijd",
    description: "Inclusief strafschoppenseries",
    orderIndex: 121,
  },
  {
    type: "STATEMENT",
    question: "Een penaltyserie eindigt met een misser van een verdediger",
    orderIndex: 122,
  },
  {
    type: "STATEMENT",
    question: "Minstens 1 keeper wordt Man of the Match in een verloren wedstrijd",
    orderIndex: 123,
  },

  // ─── Stellingen – Statistisch vreemd maar heerlijk ───────────────────────
  {
    type: "STATEMENT",
    question: "Er vallen meer doelpunten in de tweede helft dan in de eerste helft (toernooi totaal)",
    description: "Alle rondes, reguliere speeltijd inclusief blessuretijd",
    orderIndex: 130,
  },
  {
    type: "STATEMENT",
    question: "Minstens 1 team scoort in elke groepswedstrijd maar gaat er toch uit",
    orderIndex: 131,
  },
  {
    type: "STATEMENT",
    question: "Een land gaat door met minder dan 4 punten in de groepsfase",
    orderIndex: 132,
  },

  // ─── Stellingen – Oranje met een twist ───────────────────────────────────
  {
    type: "STATEMENT",
    question: "Nederland krijgt meer gele kaarten dan doelpunten in het toernooi",
    description: "Alle rondes",
    orderIndex: 140,
  },
  {
    type: "STATEMENT",
    question: "Een verdediger van Oranje scoort vaker dan een aanvaller in het toernooi",
    description: "Strafschoppenseries tellen niet",
    orderIndex: 141,
  },
  {
    type: "STATEMENT",
    question: "Nederland wint een wedstrijd zonder zelf te scoren (eigen goal tegenstander)",
    description: "Reguliere speeltijd inclusief blessuretijd",
    orderIndex: 142,
  },
  {
    type: "STATEMENT",
    question: "Oranje komt achter in minimaal 3 wedstrijden",
    description: "Reguliere speeltijd inclusief blessuretijd",
    orderIndex: 143,
  },

  // ─── Stellingen – Bonus (discussiemagneten) ──────────────────────────────
  {
    type: "STATEMENT",
    question: "De WK-finale wordt beslist via een strafschoppenserie",
    orderIndex: 150,
  },
  {
    type: "STATEMENT",
    question: "Beide finalisten scoren in de finale",
    description: "Reguliere speeltijd inclusief blessuretijd",
    orderIndex: 151,
  },
  {
    type: "STATEMENT",
    question: "De winnaar van het WK verliest minimaal 1 wedstrijd in het toernooi",
    description: "Inclusief knock-outfase, reguliere speeltijd inclusief blessuretijd",
    orderIndex: 152,
  },
]
