// ---------- Oppsett ----------
const MODEL = "mistral-small-latest";
const API_URL = "https://api.mistral.ai/v1/conversations";

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

function settOppInnstillinger() {
  const modal = document.getElementById("settingsModal");
  const input = document.getElementById("apiKeyInput");
  const settingsBtn = document.getElementById("settingsBtn");
  const saveBtn = document.getElementById("saveKeyBtn");
  const closeBtn = document.getElementById("closeSettingsBtn");

  const apneModal = () => {
    input.value = hentApiNokkel();
    modal.classList.remove("hidden");
  };

  settingsBtn.addEventListener("click", apneModal);
  closeBtn.addEventListener("click", () => modal.classList.add("hidden"));

  saveBtn.addEventListener("click", () => {
    const verdi = input.value.trim();
    if (verdi) {
      localStorage.setItem("mistral_api_key", verdi);
      modal.classList.add("hidden");
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

// ---------- Chat UI ----------
function leggTilMelding(tekst, type) {
  const messages = document.getElementById("messages");
  const div = document.createElement("div");
  div.className = `msg ${type}`;
  div.textContent = tekst;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div;
}

async function sendSporsmal(sporsmal) {
  const apiKey = hentApiNokkel();
  if (!apiKey) {
    document.getElementById("settingsModal").classList.remove("hidden");
    return;
  }

  const relevanteSider = finnRelevanteSider(sporsmal);
  const kontekst = relevanteSider
    .map(s => `[Side ${s.side}]\n${s.tekst}`)
    .join("\n\n---\n\n");

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
      leggTilMelding(`Noe gikk galt: ${feilmelding}`, "bot error");
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

    leggTilMelding(svarTekst, "bot");
  } catch (err) {
    lastende.remove();
    leggTilMelding(`Klarte ikke å kontakte Mistral API: ${err.message}`, "bot error");
  }
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  settOppInnstillinger();

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
