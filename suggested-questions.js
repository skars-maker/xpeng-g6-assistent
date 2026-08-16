// Forslag til spørsmål, gruppert etter tema i XPeng G6 2026-håndboken
const SUGGESTED_QUESTIONS = {
  speil: {
    nokkelord: ["speil", "sidespeil", "bakspeil", "ytterspeil", "innfelling", "felle"],
    sporsmal: [
      "Hvordan justerer jeg sidespeilene?",
      "Hvorfor felles speilene automatisk når jeg parkerer?",
      "Kan jeg lagre speilposisjonen på min egen brukerprofil?",
      "Hvordan slår jeg av automatisk innfelling av speilene?",
      "Hva viser speilkameraet (CMS) på skjermen?",
      "Hvorfor felles ikke speilene inn når jeg låser bilen?",
      "Hvordan justerer jeg det innvendige bakspeilet?"
    ]
  },
  vindu: {
    nokkelord: ["vindu", "visker", "spylervæske", "rute"],
    sporsmal: [
      "Hvordan justerer jeg intensiteten på vindusviskerne?",
      "Hvordan slår jeg på automatisk viskermodus?",
      "Hvorfor virker ikke den bakre vindusviskeren?",
      "Hvordan fyller jeg på spylervæske?",
      "Kan jeg åpne alle vinduene samtidig med fjernkontrollen?",
      "Hvordan lukker jeg vinduene automatisk når jeg låser bilen?",
      "Hva gjør jeg hvis et vindu sitter fast?"
    ]
  },
  lading: {
    nokkelord: ["lading", "lade", "ladeport", "ladekabel", "hurtiglading"],
    sporsmal: [
      "Hvordan starter jeg lading av bilen?",
      "Hvordan setter jeg en ladegrense i appen?",
      "Hva betyr tidsstyrt lading?",
      "Hvordan bruker jeg trådløs lading for mobilen i bilen?",
      "Hvorfor stopper ladingen før den er ferdig?",
      "Hvordan åpner jeg ladeporten uten appen?",
      "Hva gjør jeg hvis ladekabelen sitter fast i ladeporten?",
      "Hvordan finner jeg gjeldende ladestatus i CID?"
    ]
  },
  nokkel: {
    nokkelord: ["nøkkel", "nfc", "bluetooth-nøkkel", "fjernkontrollnøkkel", "app-nøkkel"],
    sporsmal: [
      "Hvordan legger jeg til en ny fjernkontrollnøkkel?",
      "Hvordan bruker jeg NFC-kortet som nøkkel?",
      "Hva gjør jeg hvis nøkkelbatteriet er tomt?",
      "Hvordan kobler jeg telefonen som Bluetooth-nøkkel?",
      "Kan jeg låse opp bilen med XPENG-appen?",
      "Hvorfor krever nøkkelen at telefonen er tilkoblet?",
      "Hvordan sletter jeg en nøkkel jeg ikke lenger bruker?"
    ]
  },
  klima: {
    nokkelord: ["klima", "temperatur", "vifte", "aircondition", "luft"],
    sporsmal: [
      "Hvordan justerer jeg temperaturen på klimaanlegget?",
      "Hvordan setter jeg ulik temperatur for fører og passasjer?",
      "Hvordan slår jeg på klimaanlegget før jeg går ut til bilen?",
      "Hvorfor blåser luften bare mot frontruten?",
      "Hvordan reduserer jeg viftestyrken til lavt nivå?",
      "Kan jeg planlegge at klimaanlegget starter automatisk?",
      "Hvordan justerer jeg luftvolumet på passasjersiden?"
    ]
  },
  sete: {
    nokkelord: ["sete", "setevarme", "massasje", "seteposisjon", "ventilasjon"],
    sporsmal: [
      "Hvordan slår jeg på setevarme?",
      "Hvordan aktiverer jeg massasjefunksjonen i førersetet?",
      "Kan jeg lagre seteposisjonen på min brukerprofil?",
      "Hvordan justerer jeg setet i andre rad?",
      "Hvordan setter jeg massasjeintensiteten til lav?",
      "Hvorfor flytter setet seg automatisk når jeg setter meg inn?",
      "Hvordan skrur jeg av seteventilasjon?",
      "Kan jeg gi nytt navn til en lagret seteinnstilling?"
    ]
  },
  infotainment: {
    nokkelord: ["infotainment", "skjerm", "hotspot", "speiling", "casting", "carplay"],
    sporsmal: [
      "Hvordan speiler jeg telefonskjermen til bilens skjerm?",
      "Hvordan kobler jeg telefonen til bilens hotspot?",
      "Hvordan avslutter jeg skjermspeiling?",
      "Hvordan finner jeg ut hvilken infotainment-versjon jeg har?",
      "Hvordan oppdaterer jeg systemet?",
      "Hvordan kobler jeg til trådløs CarPlay eller Android Auto?",
      "Hvordan endrer jeg innstillinger for det innebygde hotspotet?"
    ]
  },
  sikkerhet: {
    nokkelord: ["sentry", "vaktmodus", "kollisjon", "sikkerhet", "varsel", "radar"],
    sporsmal: [
      "Hvordan aktiverer jeg Sentry-modus?",
      "Hvor lenge er Sentry-modus aktiv?",
      "Bruker Sentry-modus mye batteri?",
      "Hvordan slår jeg på kollisjonsvarsling?",
      "Hva betyr varselet om at et sikkerhetsbelte ikke er festet?",
      "Hvordan aktiverer jeg fjernovervåking av bilen via appen?",
      "Hva betyr varselet om radarbegrenset område?",
      "Hvordan skrur jeg av Sentry-modus manuelt?"
    ]
  },
  kjoring: {
    nokkelord: ["kjøring", "kjøremodus", "regenerering", "fartsholder", "apa", "parkeringsassistanse"],
    sporsmal: [
      "Hvordan velger jeg kjøremodus?",
      "Hva påvirker hvor mye regenerering jeg får ved oppbremsing?",
      "Hvordan justerer jeg nivået på regenerativ bremsing?",
      "Hva bør jeg sjekke før jeg starter kjøreturen?",
      "Hvordan aktiverer jeg fartsholderen?",
      "Hva betyr det når rekkevidden vises annerledes enn forventet?",
      "Hvordan slår jeg på automatisk parkeringsassistanse (APA)?"
    ]
  },
  belysning: {
    nokkelord: ["lys", "frontlys", "baklys", "fjernlys", "tåkelys", "ihb", "blinklys"],
    sporsmal: [
      "Hvordan slår jeg på automatisk fjernlys (IHB)?",
      "Hvordan justerer jeg intensiteten på frontlysene?",
      "Hvorfor virker ikke tåkelysene som forventet?",
      "Hvordan slår jeg på baklysene manuelt?",
      "Hva gjør velkomstbelysningen når jeg nærmer meg bilen?",
      "Hvordan aktiverer jeg velkomstbelysning?",
      "Hvordan slår jeg av nødblinklysene?"
    ]
  },
  dorer: {
    nokkelord: ["dør", "dørhåndtak", "bagasjerom", "bakluke", "lås"],
    sporsmal: [
      "Hvordan åpner jeg dørene med de elektriske dørhåndtakene?",
      "Hva gjør jeg hvis et dørhåndtak ikke folder ut?",
      "Hvordan låser jeg alle dørene samtidig?",
      "Hvorfor låses ikke dørene automatisk når jeg går fra bilen?",
      "Hvordan åpner jeg bagasjerommet elektrisk?",
      "Hva betyr varselet om at en dør ikke er lukket?"
    ]
  }
};
