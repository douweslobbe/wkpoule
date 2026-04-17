import { BonusQuestionType } from "@prisma/client"

export type DefaultQuestion = {
  type: BonusQuestionType
  question: string
  description?: string
  orderIndex: number
}

export const DEFAULT_BONUS_QUESTIONS: DefaultQuestion[] = [
  // Openvragen
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

  // Benaderingsvragen – toernooi breed
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

  // Benaderingsvragen – Nederland
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

  // Stellingen
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
]
