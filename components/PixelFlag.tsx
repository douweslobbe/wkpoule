// Pixel art vlaggen via flagcdn.com (30×20px PNG → opschalen met image-rendering: pixelated)
// TLA = football-data.org 3-letter code → ISO 3166-1 alpha-2 voor flagcdn.com
const TLA_TO_ISO2: Record<string, string> = {
  // Europa
  ALB: "al", AND: "ad", ARM: "am", AUT: "at", AZE: "az", BEL: "be", BIH: "ba",
  BUL: "bg", CRO: "hr", CZE: "cz", DEN: "dk", ENG: "gb-eng", ESP: "es",
  EST: "ee", FIN: "fi", FRA: "fr", GEO: "ge", GER: "de", GRE: "gr",
  HUN: "hu", ISL: "is", ITA: "it", KOS: "xk", LTU: "lt", LUX: "lu",
  LVA: "lv", MDA: "md", MKD: "mk", MLT: "mt", MNE: "me", NED: "nl",
  NIR: "gb-nir", NOR: "no", POL: "pl", POR: "pt", ROU: "ro",
  SCO: "gb-sct", SRB: "rs", SVK: "sk", SVN: "si", SUI: "ch", SWE: "se",
  TUR: "tr", UKR: "ua", WAL: "gb-wls",
  // Noord- en Midden-Amerika + Caraïben
  CAN: "ca", CRC: "cr", CUB: "cu", GUA: "gt", HAI: "ht", HON: "hn",
  JAM: "jm", MEX: "mx", PAN: "pa", TRI: "tt", USA: "us",
  // Zuid-Amerika
  ARG: "ar", BOL: "bo", BRA: "br", CHI: "cl", COL: "co", ECU: "ec",
  PAR: "py", PER: "pe", URU: "uy", VEN: "ve",
  // Afrika
  ALG: "dz", ANG: "ao", BEN: "bj", BFA: "bf", CMR: "cm", CGO: "cg",
  CIV: "ci", CPV: "cv", DRC: "cd", EGY: "eg", ETH: "et", GAM: "gm",
  GHA: "gh", GUI: "gn", KEN: "ke", LBA: "ly", MAR: "ma", MLI: "ml",
  MOZ: "mz", MTN: "mr", NAM: "na", NGA: "ng", RWA: "rw", SEN: "sn",
  SLE: "sl", TAN: "tz", TGO: "tg", TUN: "tn", UGA: "ug", RSA: "za",
  ZAM: "zm", ZIM: "zw",
  // Azië
  AUS: "au", BHR: "bh", CHN: "cn", IDN: "id", IND: "in", IRI: "ir",
  IRQ: "iq", JOR: "jo", JPN: "jp", KOR: "kr", KWT: "kw", LBN: "lb",
  MYA: "mm", OMA: "om", PHI: "ph", QAT: "qa", SAU: "sa", SYR: "sy",
  THA: "th", UAE: "ae", UZB: "uz", VIE: "vn", YEM: "ye",
  // Oceanië
  FIJ: "fj", NZL: "nz", PNG: "pg", SOL: "sb", VAN: "vu",
}

export function PixelFlag({
  code,
  size = "md",
}: {
  code: string
  size?: "sm" | "md" | "lg"
}) {
  const iso2 = TLA_TO_ISO2[code?.toUpperCase()]
  const dimensions = {
    sm: { w: 24, h: 16 },
    md: { w: 32, h: 22 },
    lg: { w: 48, h: 32 },
  }
  const { w, h } = dimensions[size]

  if (!iso2) {
    // Fallback: colored TLA badge
    return (
      <span
        style={{
          display: "inline-block",
          width: w,
          height: h,
          background: "#1a6b36",
          border: "2px solid #1a1a2e",
          fontFamily: "monospace",
          fontSize: Math.floor(h * 0.45) + "px",
          fontWeight: "bold",
          color: "white",
          textAlign: "center",
          lineHeight: h + "px",
          letterSpacing: "-1px",
          flexShrink: 0,
        }}
      >
        {code?.slice(0, 3)}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w20/${iso2}.png`}
      alt={code}
      width={w}
      height={h}
      style={{
        width: w,
        height: h,
        imageRendering: "pixelated",
        border: "2px solid #1a1a2e",
        objectFit: "cover",
        flexShrink: 0,
      }}
    />
  )
}
