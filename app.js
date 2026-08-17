// ---------- Oppsett ----------
const MODEL = "mistral-small-latest";
const API_URL = "https://api.mistral.ai/v1/conversations";

const HILSNINGS_ADJEKTIVER = [
  "omsorgsfulle", "flotte", "snille", "søte", "energiske", "strukturerte",
  "smarte", "strålende", "fantastiske", "hyggelige", "positive", "inspirerende"
];

function tilfeldigHilsen() {
  const adjektiv = HILSNINGS_ADJEKTIVER[Math.floor(Math.random() * HILSNINGS_ADJEKTIVER.length)];
  return `Hei, ${adjektiv} Kristin! 😊`;
}

const STOPORD = new Set([
  "jeg","du","han","hun","den","det","vi","dere","de","er","var","har","hadde",
  "og","i","på","til","med","om","for","av","en","et","som","hva","hvordan",
  "hvorfor","hvor","når","kan","skal","vil","må","min","mitt","min","din",
  "sin","seg","meg","deg","oss","dem","ikke","så","men","eller","fra","ved",
  "der","her","denne","dette","disse","gjør","gjøre","funker","fungerer"
]);

// ---------- API-nøkkel håndtering ----------
function hentApiNokkel() {
  return localStorage.getItem("mistral_api_key") || "";
}

// ---------- Bilmodus ----------
function hentBilmodus() {
  return localStorage.getItem("bilmodus") === "true";
}

function settBilmodus(aktiv) {
  localStorage.setItem("bilmodus", aktiv ? "true" : "false");
  document.body.classList.toggle("bilmodus-aktiv", aktiv);
}

function settOppInnstillinger() {
  const modal = document.getElementById("settingsModal");
  const input = document.getElementById("apiKeyInput");
  const settingsBtn = document.getElementById("settingsBtn");
  const saveBtn = document.getElementById("saveKeyBtn");
  const closeBtn = document.getElementById("closeSettingsBtn");
  const toggleKeyBtn = document.getElementById("toggleKeyBtn");
  const bilmodusToggle = document.getElementById("bilmodusToggle");

  const apneModal = () => {
    input.value = hentApiNokkel();
    input.type = "password";
    toggleKeyBtn.textContent = "Vis";
    bilmodusToggle.checked = hentBilmodus();
    modal.classList.remove("hidden");
  };

  settingsBtn.addEventListener("click", apneModal);
  closeBtn.addEventListener("click", () => modal.classList.add("hidden"));

  toggleKeyBtn.addEventListener("click", () => {
    const skalVises = input.type === "password";
    input.type = skalVises ? "text" : "password";
    toggleKeyBtn.textContent = skalVises ? "Skjul" : "Vis";
  });

  bilmodusToggle.addEventListener("change", () => {
    settBilmodus(bilmodusToggle.checked);
  });

  saveBtn.addEventListener("click", () => {
    const verdi = input.value.trim();
    if (verdi) {
      localStorage.setItem("mistral_api_key", verdi);
      modal.classList.add("hidden");
      return;
    }

    if (hentApiNokkel()) {
      const bekreftet = confirm("Dette vil slette den lagrede API-nøkkelen. Er du sikker?");
      if (bekreftet) {
        localStorage.removeItem("mistral_api_key");
        modal.classList.add("hidden");
      }
    }
  });

  // Første besøk: be om nøkkel automatisk
  if (!hentApiNokkel()) {
    apneModal();
  }
}

// ---------- Søk i håndboken ----------
function finnRelevanteSider(sporsmal, antall = 6) {
  const ord = sporsmal
    .toLowerCase()
    .replace(/[^a-zæøå0-9\s]/gi, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPORD.has(w));

  if (ord.length === 0) return MANUAL_CHUNKS.slice(0, antall);

  const poengsatt = MANUAL_CHUNKS.map(side => {
    const tekstLav = side.tekst.toLowerCase();
    let poeng = 0;
    for (const w of ord) {
      const treff = tekstLav.split(w).length - 1;
      poeng += treff;
    }
    return { side, poeng };
  });

  poengsatt.sort((a, b) => b.poeng - a.poeng);
  return poengsatt
    .filter(x => x.poeng > 0)
    .slice(0, antall)
    .map(x => x.side);
}

// ---------- Forslag til spørsmål ----------
function hentAlleForslagsSporsmal() {
  const alle = [];
  for (const kategori in SUGGESTED_QUESTIONS) {
    SUGGESTED_QUESTIONS[kategori].sporsmal.forEach(sp => alle.push(sp));
  }
  return alle;
}

function tilfeldigUtvalg(liste, antall) {
  const kopi = liste.slice();
  for (let i = kopi.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const midlertidig = kopi[i];
    kopi[i] = kopi[j];
    kopi[j] = midlertidig;
  }
  return kopi.slice(0, antall);
}

function visForslagsSporsmal(sporsmalListe) {
  const container = document.getElementById("suggestedChips");
  if (!container) return;

  container.innerHTML = "";
  sporsmalListe.forEach(sp => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "suggestion-chip";
    chip.textContent = sp;
    chip.addEventListener("click", () => {
      const input = document.getElementById("chatInput");
      input.value = sp;
      input.focus();
    });
    container.appendChild(chip);
  });
}

function finnMatchendeKategori(sporsmal) {
  const tekstLav = sporsmal.toLowerCase();
  for (const kategori in SUGGESTED_QUESTIONS) {
    const treffer = SUGGESTED_QUESTIONS[kategori].nokkelord.some(ord => tekstLav.includes(ord));
    if (treffer) return kategori;
  }
  return null;
}

function oppdaterForslagEtterSporsmal(sporsmal) {
  const kategori = finnMatchendeKategori(sporsmal);
  if (!kategori) return;

  const stiltSporsmalLav = sporsmal.trim().toLowerCase();
  const kandidater = SUGGESTED_QUESTIONS[kategori].sporsmal.filter(
    sp => sp.trim().toLowerCase() !== stiltSporsmalLav
  );

  visForslagsSporsmal(tilfeldigUtvalg(kandidater, 4));
}

// ---------- Chat UI ----------
function leggTilMelding(tekst, type) {
  const messages = document.getElementById("messages");
  const div = document.createElement("div");
  div.className = `msg ${type}`;
  div.textContent = tekst;
  messages.appendChild(div);

  if (type.startsWith("bot")) {
    // Vis starten av det nye svaret øverst i meldingsområdet, ikke bunnen
    // av hele listen - viktig i Bilmodus der tastaturet kan dekke resten.
    const meldingerRect = messages.getBoundingClientRect();
    const meldingRect = div.getBoundingClientRect();
    messages.scrollTop += meldingRect.top - meldingerRect.top;
  } else {
    messages.scrollTop = messages.scrollHeight;
  }

  return div;
}

async function sendSporsmal(sporsmal) {
  oppdaterForslagEtterSporsmal(sporsmal);

  const apiKey = hentApiNokkel();
  if (!apiKey) {
    document.getElementById("settingsModal").classList.remove("hidden");
    return;
  }

  const relevanteSider = finnRelevanteSider(sporsmal);
  let kontekst = relevanteSider
    .map(s => `[Side ${s.side}]\n${s.tekst}`)
    .join("\n\n---\n\n");

  const gjelderXcombo = /xcombo|combo|kode/i.test(sporsmal);
  if (gjelderXcombo) {
    const xcomboTekst = XCOMBO_KODER
      .map(x => `${x.kode} - ${x.funksjon} - ${x.merknad}`)
      .join("\n");
    kontekst += `\n\n---\n\nKjente Xcombo-koder (lokal referanseliste, kan være ufullstendig for koder merket "ufullstendig"):\n${xcomboTekst}`;
  }

  const lastende = leggTilMelding("Søker i håndboken ...", "bot loading");

  const systemInstruction =
    "Du er en hjelpsom assistent for eiere av XPeng G6 2026 (LHD, europeisk modell). " +
    "Svar alltid på norsk, kort og presist.\n\n" +
    "Bruk primært utdragene fra brukerhåndboken under til å svare på spørsmål om bilens offisielle " +
    "funksjoner (infotainment, lading, nøkkelbatteri osv).\n\n" +
    "I tillegg kjenner du til 'Xcombo-koder': dette er BRUKERSKAPTE automatiseringskoder for XPeng-biler, " +
    "delt av eierfellesskapet, IKKE offisielle XPeng-funksjoner eller rabattkoder. En Xcombo-kode kobler " +
    "sammen en trigger og en handling i bilen, for eksempel 'start massasje når giret settes i D'. Disse " +
    "kodene deles og diskuteres hovedsakelig på nettsiden xcombos.com, samt i fellesskapsforum og " +
    "Facebook-grupper for XPeng-eiere.\n\n" +
    "Når brukeren spør om Xcombo-koder, automatiseringer eller kombinasjoner av bilfunksjoner: bruk " +
    "nettsøk-verktøyet aktivt, og søk spesifikt på xcombos.com og relaterte kilder for å finne konkrete, " +
    "eksisterende koder som matcher det brukeren spør etter. Presenter gjerne 2-4 konkrete forslag til " +
    "koder med kort forklaring på hva de gjør, hvis du finner relevante treff. Oppgi at kildene er " +
    "brukerdelte og ikke offisielt fra XPeng.\n\n" +
    "Hvis du ikke finner en eksakt Xcombo-kode som matcher det brukeren spurte om, men du finner " +
    "LIGNENDE koder fra xcombos.com eller andre kilder (samme kategori trigger eller handling, f.eks. " +
    "andre koder som bruker sjåførdør, gir-skifte, eller massasje/setefunksjoner), presenter disse som " +
    "forslag i stedet for bare å si at du ikke fant noe. Vis 2-4 lignende eksempler med kort forklaring " +
    "på hva de gjør og hvilken kilde de kommer fra, og si tydelig at de ikke er en eksakt match men kan " +
    "være av interesse.\n\n" +
    "Når du søker etter Xcombo-koder, bruk nettsøket til å lete spesifikt på disse kildene, ikke bare " +
    "xcombos.com:\n" +
    "- xcombos.com (mest dedikerte stedet for deling av Xcombo-oppsett)\n" +
    "- XPeng-Fahrer Community (tysk forum, egne tråder for X-Combos)\n" +
    "- Reddit r/Xpeng (egne 'X-combo Share here'-tråder)\n" +
    "- Forum Automobile Propre (fransk forum, egen tråd for G6 X-Combo-koder)\n" +
    "- GoingElectric.de (koder delt i diskusjonstråder, f.eks. som firesifrede tallkoder)\n" +
    "- Tweakers.net (nederlandsk XPeng-tråd med delte koder)\n\n" +
    "Søk gjerne med flere varianter av søkeordet: 'XCOMBO', 'X-Combo', 'XPENG G6 combo code', kombinert " +
    "med selve funksjonen brukeren spør om (f.eks. 'G6 XCOMBO climate' eller 'G6 XCOMBO unlock " +
    "lights').\n\n" +
    "Når konteksten under inneholder en seksjon med 'Kjente Xcombo-koder (lokal referanseliste)': sjekk " +
    "denne FØRST før du søker på nett. Bruk nettsøk i tillegg for å finne flere koder utover listen, og " +
    "for å bekrefte eller utfylle koder i listen som er merket 'ufullstendig'.\n\n" +
    "For alt annet som endrer seg over tid og ikke står i håndboken (kampanjer, priser, nyheter): bruk " +
    "også nettsøk-verktøyet.\n\n" +
    "Hvis du er usikker eller ikke finner noe relevant, si det ærlig i stedet for å gjette eller dikte opp koder.";

  const body = {
    model: "mistral-small-latest",
    instructions: systemInstruction,
    inputs: `Utdrag fra brukerhåndboken:\n\n${kontekst}\n\n---\n\nSpørsmål: ${sporsmal}`,
    tools: [{ type: "web_search" }]
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    lastende.remove();

    if (!res.ok) {
      const feilmelding = data?.error?.message || "Ukjent feil";
      leggTilMelding(`Feil ved henting av svar (HTTP ${res.status}): ${feilmelding}`, "bot error");
      return;
    }

    const meldingOutput = data?.outputs?.find(o => o.type === "message.output");
    const content = meldingOutput?.content;
    let svarTekst;
    if (typeof content === "string") {
      svarTekst = content;
    } else if (Array.isArray(content)) {
      svarTekst = content
        .filter(chunk => chunk.type === "text")
        .map(chunk => chunk.text)
        .join("");
    } else {
      svarTekst = "Jeg fikk ikke noe svar. Prøv å omformulere spørsmålet.";
    }

    const visningsTekst = `${tilfeldigHilsen()}\n${svarTekst}`;
    leggTilMelding(visningsTekst, "bot");
  } catch (err) {
    lastende.remove();
    leggTilMelding(`Nettverksfeil - kunne ikke nå Mistral API: ${err.message}`, "bot error");
  }
}

// ---------- Talegjenkjenning ----------
function settOppTaleGjenkjenning() {
  const micBtn = document.getElementById("micBtn");
  const input = document.getElementById("chatInput");
  if (!micBtn || !input) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    leggTilMelding("Talegjenkjenning støttes ikke i denne nettleseren", "bot error");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "nb-NO";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  let lytter = false;
  let timeoutId = null;

  recognition.addEventListener("start", () => {
    console.log("Talegjenkjenning startet");
    lytter = true;
    micBtn.classList.add("listening");
    micBtn.title = "Lytter...";

    timeoutId = setTimeout(() => {
      leggTilMelding(
        "Ingen svar fra talegjenkjenningstjenesten - dette skjer ofte i innebygde bil-nettlesere som mangler tilgang til Googles talegjenkjenningsserver",
        "bot error"
      );
      recognition.stop();
    }, 8000);
  });

  recognition.addEventListener("end", () => {
    clearTimeout(timeoutId);
    lytter = false;
    micBtn.classList.remove("listening");
    micBtn.title = "Snakk inn spørsmål";
  });

  recognition.addEventListener("result", (e) => {
    clearTimeout(timeoutId);
    const gjenkjentTekst = e.results[0][0].transcript;
    input.value = gjenkjentTekst;
    input.focus();
  });

  recognition.addEventListener("error", (event) => {
    clearTimeout(timeoutId);
    leggTilMelding("Mikrofonfeil: " + event.error, "bot error");
  });

  micBtn.addEventListener("click", () => {
    if (lytter) {
      recognition.stop();
      return;
    }
    try {
      recognition.start();
    } catch (err) {
      leggTilMelding("Mikrofonfeil: " + err.message, "bot error");
    }
  });
}

// ---------- Skjermtastatur-håndtering ----------
// Fryser --vh til den faktiske, opprinnelige viewport-høyden. Uten dette bruker
// .hero og .messages rå "vh"-enheter, som i enkelte innebygde nettlesere (bl.a.
// biler) regnes ut på nytt når skjermtastaturet åpner window.innerHeight krymper.
// Det tvinger frem en full reflow (.hero krymper kraftig siden den er 55vh), og
// det er DENNE reflowen - ikke vår egen scroll-kode - som fikk enkelte nettlesere
// til å nullstille scrollposisjonen til toppen. Ved å fryse --vh unngår vi at
// tastaturet i det hele tatt trigger denne reflowen.
function settOppFastViewportHoyde() {
  const settVh = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
    console.log("[tastatur-diagnostikk] --vh satt til", vh, "px (innerHeight:", window.innerHeight, ")");
  };

  settVh();

  // Kun ekte rotasjon/oppløsningsendring skal oppdatere --vh på nytt - ALDRI
  // window "resize" eller visualViewport "resize", siden begge kan trigges av
  // at tastaturet åpnes/lukkes i enkelte nettlesere.
  window.addEventListener("orientationchange", () => {
    setTimeout(settVh, 300);
  });
}

// scrollChatInputInnISyne() / settOppTastaturHandtering() (resize/visualViewport/
// focus-basert scrolling) er fjernet - den fungerte ikke pålitelig i bilens
// nettleser. Bilskjermen løses nå med en ren CSS media query (se style.css)
// som holder chat-panelet i øvre del av skjermen uten å være avhengig av
// JS-hendelser som ikke trigges konsekvent der.

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  settBilmodus(hentBilmodus());
  settOppFastViewportHoyde();
  settOppInnstillinger();
  settOppTaleGjenkjenning();
  visForslagsSporsmal(tilfeldigUtvalg(hentAlleForslagsSporsmal(), 4));

  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const tekst = input.value.trim();
    if (!tekst) return;
    leggTilMelding(tekst, "user");
    input.value = "";
    sendSporsmal(tekst);
  });
});
