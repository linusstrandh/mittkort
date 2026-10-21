"use strict";

/*
 * All UI-state (flik, kortvy, favoriter) hanteras här i webbläsaren.
 * Inga sidladdningar och ingen URL-ändring vid flikbyte.
 */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// Platshållare i stället för riktiga produktbilder och varumärken
const OFFERS = [
  { id: "tablet", brand: "Teknikbutiken", text: "Studentpris på surfplattor hela veckan.", art: "tablet" },
  { id: "headphones", brand: "Ljudhuset", text: "20 % på hörlurar med brusreducering.", art: "headphones" },
  { id: "costume", brand: "Maskeradlagret", text: "Två maskeraddräkter för priset av en.", art: "costume" },
  { id: "candy", brand: "Godisboden", text: "Halva priset på lösgodis till festen.", art: "candy" },
];

// Generiska exempelkort, fem stycken eftersom referensen har fem prickar.
// Första kortets färgövergång är uppmätt ur videon (13 x 5 mätpunkter).
const GREEN = "linear-gradient(142deg, #235747 0%, #1f684b 12%, #1b7a4b 22%, #18914c 36%, #179d4d 46%, #26ad55 54%, #46ba5e 64%, #62c365 73%, #85d46f 82%, #a7e077 90%, #cdee82 100%)";
const CARDS = [
  { title: "NATIONSMEDLEMSKAP", bg: GREEN, ink: "#000" },
  { title: "Medlemskort", bg: "linear-gradient(142deg, #4a3590, #a98ad8)", ink: "#fff" },
  { title: "Gymkort", bg: "linear-gradient(142deg, #b04a17, #efa257)", ink: "#fff" },
  { title: "Bibliotekskort", bg: "linear-gradient(142deg, #2b3540, #7d8b99)", ink: "#fff" },
  { title: "Rabattkort", bg: "linear-gradient(142deg, #962f52, #ec8aa5)", ink: "#fff" },
];

const ART = {
  tablet: `
    <rect width="250" height="80" fill="#eef0f3"/>
    <g transform="translate(150 6) rotate(6)">
      <rect width="92" height="62" rx="5" fill="#3a3d44"/>
      <rect x="4" y="4" width="84" height="54" rx="2" fill="url(#g-tab)"/>
    </g>
    <rect x="134" y="14" width="3" height="56" rx="1.5" fill="#6d7079" transform="rotate(-8 134 14)"/>
    <defs><linearGradient id="g-tab" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#7fd1f2"/><stop offset=".5" stop-color="#e6a6d6"/><stop offset="1" stop-color="#8c6ef0"/></linearGradient></defs>`,
  headphones: `
    <rect width="250" height="80" fill="#e6eef2"/>
    <path d="M150 52v-12a25 25 0 0 1 50 0v12" fill="none" stroke="#2c3440" stroke-width="7" stroke-linecap="round"/>
    <rect x="141" y="44" width="16" height="26" rx="6" fill="#2c3440"/>
    <rect x="193" y="44" width="16" height="26" rx="6" fill="#2c3440"/>`,
  costume: `
    <rect width="250" height="80" fill="#2b2140"/>
    <circle cx="200" cy="22" r="12" fill="#f4e7b5"/>
    <path d="M150 80c4-26 14-40 26-40s22 14 26 40z" fill="#120d1d"/>
    <circle cx="170" cy="56" r="2.5" fill="#ffcf4d"/><circle cx="182" cy="56" r="2.5" fill="#ffcf4d"/>`,
  candy: `
    <rect width="250" height="80" fill="#fbe9d8"/>
    <circle cx="160" cy="40" r="14" fill="#f2711c"/>
    <circle cx="190" cy="30" r="10" fill="#7c4ad8"/>
    <circle cx="214" cy="52" r="12" fill="#2bb673"/>
    <circle cx="182" cy="60" r="8" fill="#e8336d"/>`,
};

const $ = (sel, root = document) => {
  const el = root.querySelector(sel);
  if (!el) throw new Error(`Hittar inte ${sel}`);
  return el;
};

/* ---------- Favoriter (bara en bekvämlighet per webbläsare) ---------- */

const favs = new Set(readFavs());

function readFavs() {
  try {
    return JSON.parse(localStorage.getItem("favs") || "[]");
  } catch {
    return [];
  }
}

function saveFavs() {
  try {
    localStorage.setItem("favs", JSON.stringify([...favs]));
  } catch {
    // Privat läge eller blockerad lagring: favoriter gäller då bara sessionen
  }
}

/* ---------- Kampanjraden ---------- */

function renderOffers() {
  const list = $("#offers");
  list.innerHTML = OFFERS.map((o) => `
    <li class="offer">
      <span class="offer__badge">Kampanj</span>
      <span class="offer__art" aria-hidden="true">
        <svg viewBox="0 0 250 80" preserveAspectRatio="xMidYMid slice">${ART[o.art]}</svg>
      </span>
      <div class="offer__foot">
        <button class="icon-btn like" type="button" data-like="${o.id}"
          aria-pressed="${favs.has(o.id)}" aria-label="Spara ${o.brand} som favorit">
          <svg width="24" height="24" aria-hidden="true"><use href="#i-heart"/></svg>
        </button>
        <span class="offer__brand">${o.brand}</span>
        <button class="icon-btn" type="button" aria-label="Mer om erbjudandet från ${o.brand}">
          <svg width="24" height="24" aria-hidden="true"><use href="#i-info"/></svg>
        </button>
      </div>
      <p class="offer__text">${o.text}</p>
    </li>`).join("");

  list.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-like]");
    if (!btn) return;
    const id = btn.dataset.like;
    if (favs.has(id)) favs.delete(id); else favs.add(id);
    btn.setAttribute("aria-pressed", String(favs.has(id)));
    saveFavs();
    renderFavs();
  });
}

function renderFavs() {
  const items = OFFERS.filter((o) => favs.has(o.id));
  $("#fav-summary").textContent = items.length
    ? `Du har sparat ${items.length} ${items.length === 1 ? "erbjudande" : "erbjudanden"}.`
    : "Tryck på hjärtat på ett erbjudande för att spara det här.";
  $("#fav-list").innerHTML = items
    .map((o) => `<li><strong>${o.brand}</strong>${o.text}</li>`)
    .join("");
}

/* ---------- Flikar ---------- */

const tabs = [...document.querySelectorAll(".tab")];
const views = [...document.querySelectorAll(".view")];
let currentTab = "hem";

function showTab(name) {
  currentTab = name;
  for (const t of tabs) {
    const on = t.dataset.tab === name;
    t.classList.toggle("is-active", on);
    if (on) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current");
  }
  for (const v of views) v.hidden = v.dataset.view !== name;
  $("#screen").scrollTop = 0;
}

for (const t of tabs) {
  t.addEventListener("click", () => {
    if (t.dataset.tab === "kort") openWallet(t);
    else showTab(t.dataset.tab);
  });
}

/* ---------- Kortvy ---------- */

const phone = $("#phone");
const wallet = $("#wallet");
const track = $("#wallet-track");
const dotsEl = $("#wallet-dots");
let lastFocus = null;
let activeIndex = 0;
let enterTimer = 0;

// Allt i QR-koden är oförändrat utom sista fältet: tidsstämpeln (Unix-sekunder)
// sätts till tidpunkten då koden byggs, dvs. när sidan laddas.
const QR_PREFIX = "50af5686-da5b-4348-bbe6-27ce934f77e0|270210|fUa97WHKR1sD1g|";

function buildQrSvg() {
  const payload = QR_PREFIX + Math.floor(Date.now() / 1000);
  const qr = qrcode(8, "M");
  qr.addData(payload);
  qr.make();
  const n = qr.getModuleCount();
  let d = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (qr.isDark(y, x)) d += `M${x} ${y}h1v1h-1z`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" role="img" aria-label="QR-kod" style="display:block;width:100%;height:auto;aspect-ratio:1;box-sizing:border-box;padding:8.3%"><rect width="${n}" height="${n}" fill="#fff"/><path fill="#000" d="${d}"/></svg>`;
}

// Bygg om QR-koderna med aktuell tidsstämpel utan att röra karusellen.
// Körs när appen tas fram igen, eftersom en iOS-PWA ofta återupptas utan omladdning.
function refreshQr() {
  const svg = buildQrSvg();
  for (const el of track.querySelectorAll(".xcard__code")) {
    el.innerHTML = svg;
  }
}

function renderCards() {
  const qrSvg = buildQrSvg();
  track.innerHTML = CARDS.map((c, i) => `
    <div class="wallet__slide" role="group" aria-roledescription="kort" aria-label="${c.title}, ${i + 1} av ${CARDS.length}">
      <div class="xcard" style="--bg:${c.bg};--ink:${c.ink}">
        <img class="xcard__rings" src="startbild2-cirkel.webp" width="1000" height="1000" alt="" aria-hidden="true" decoding="async">
        <span class="xcard__stamp" aria-hidden="true"></span>
        <div class="xcard__face">
          <div class="xcard__head">
            <p class="xcard__title">${c.title}</p>
            <img class="xcard__logo" src="logga.png" width="35" height="40" alt="" decoding="async">
            <p class="xcard__sub">nationsguiden.se</p>
          </div>
          <p class="xcard__meta">ID-num:  07425051<br>Stockholms nation</p>
          <p class="xcard__name"></p>
          <p class="xcard__pnr"></p>
          <p class="xcard__valid"><small>VALID THRU</small>2027-02-10</p>
          <div class="xcard__code">${qrSvg}</div>
        </div>
      </div>
    </div>`).join("");
  applyHolder();

  dotsEl.innerHTML = CARDS.map((c, i) => `
    <button class="dot" type="button" role="tab" data-index="${i}"
      aria-selected="${i === 0}" aria-label="Visa ${c.title}"></button>`).join("");
}

function slideWidth() {
  return track.clientWidth || 1;
}

function setActive(i) {
  activeIndex = i;
  for (const d of dotsEl.children) {
    d.setAttribute("aria-selected", String(Number(d.dataset.index) === i));
  }
}

// Mål för en pågående programstyrd scrollning. Utan det läser scroll-hanteraren
// av ett mellanläge och skriver över målet, så ett andra snabbt piltryck
// räknas från fel kort.
let pendingTarget = null;

function goTo(i, smooth = true) {
  const idx = Math.max(0, Math.min(CARDS.length - 1, i));
  const animate = smooth && !reduceMotion.matches;
  pendingTarget = animate ? idx : null;
  track.scrollTo({ left: idx * slideWidth(), behavior: animate ? "smooth" : "auto" });
  setActive(idx);
}

// Användaren tar över med finger, mus eller hjul: släpp det gamla målet
for (const type of ["pointerdown", "touchstart", "wheel"]) {
  track.addEventListener(type, () => { pendingTarget = null; }, { passive: true });
}

// Uppdatera prickarna medan man sveper, max en gång per bildruta
let scrollRaf = 0;
track.addEventListener("scroll", () => {
  if (scrollRaf) return;
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = 0;
    const pos = track.scrollLeft / slideWidth();
    if (pendingTarget !== null) {
      if (Math.abs(pos - pendingTarget) < 0.01) pendingTarget = null;
      return;
    }
    const i = Math.round(pos);
    if (i !== activeIndex) setActive(i);
  });
}, { passive: true });

dotsEl.addEventListener("click", (e) => {
  const dot = e.target.closest(".dot");
  if (dot) goTo(Number(dot.dataset.index));
});

function openWallet(opener) {
  lastFocus = opener;
  clearTimeout(enterTimer);
  wallet.hidden = false;
  phone.classList.add("is-wallet-open");
  goTo(activeIndex, false);

  if (reduceMotion.matches) {
    wallet.dataset.state = "open";
  } else {
    // Videon visar ca 200 ms svart innan kortet tonar in
    wallet.dataset.state = "entering";
    enterTimer = setTimeout(() => { wallet.dataset.state = "open"; }, 180);
  }
  $("#wallet-close").focus({ preventScroll: true });
}

function closeWallet() {
  // Stängning är ett direkt klipp i videon
  clearTimeout(enterTimer);
  wallet.hidden = true;
  wallet.dataset.state = "";
  phone.classList.remove("is-wallet-open");
  if (lastFocus) lastFocus.focus({ preventScroll: true });
}

$("#wallet-close").addEventListener("click", closeWallet);

// Tryck på ett kort tar en tillbaka till startvyn
track.addEventListener("click", (e) => {
  if (!e.target.closest(".xcard")) return;
  lastFocus = tabs.find((t) => t.dataset.tab === "hem") || lastFocus;
  closeWallet();
  showTab("hem");
});

wallet.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.preventDefault();
    closeWallet();
  } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    e.preventDefault();
    goTo(activeIndex + (e.key === "ArrowRight" ? 1 : -1));
  } else if (e.key === "Tab") {
    // Håll fokus inne i kortvyn
    const focusables = [track, ...dotsEl.children, $("#wallet-close")];
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

// Håll rätt kort i bild om fönstret ändrar storlek
window.addEventListener("resize", () => {
  if (!wallet.hidden) goTo(activeIndex, false);
});

/* ---------- Namn och pers. på korten (mail-ikonen) ---------- */

const holder = readHolder();

function readHolder() {
  const fallback = { name: "Linus Strand", pnr: "123123" };
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem("holder") || "{}") };
  } catch {
    return fallback;
  }
}

function saveHolder() {
  try {
    localStorage.setItem("holder", JSON.stringify(holder));
  } catch {
    // Privat läge eller blockerad lagring: ändringen gäller då bara sessionen
  }
}

// Byter bara texten, inget annat på korten rörs
function applyHolder() {
  track.querySelectorAll(".xcard__name").forEach((el) => { el.textContent = holder.name; });
  track.querySelectorAll(".xcard__pnr").forEach((el) => { el.textContent = holder.pnr; });
}

const editor = $("#editor");
const nameInput = $('[name="holder-name"]', editor);
const pnrInput = $('[name="holder-pnr"]', editor);

$("#mail-btn").addEventListener("click", () => {
  nameInput.value = holder.name;
  pnrInput.value = holder.pnr;
  editor.returnValue = "";
  editor.showModal();
});

editor.addEventListener("close", () => {
  if (editor.returnValue !== "save") return;
  holder.name = nameInput.value.trim();
  holder.pnr = pnrInput.value.trim();
  saveHolder();
  applyHolder();
});

/* ---------- Start ---------- */

renderOffers();
renderFavs();
renderCards();
showTab(currentTab);

// Färsk tidsstämpel varje gång kortet tas fram, även när iOS återupptar
// appen från bakgrunden utan att ladda om sidan.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") refreshQr();
});
window.addEventListener("pageshow", refreshQr);
// Dessutom färsk stämpel var 15:e sekund medan kortet ligger framme.
// (iOS pausar timern i bakgrunden; visibilitychange ovan tar hand om återkomsten.)
setInterval(refreshQr, 15000);

// Offline-stöd när appen ligger på hemskärmen (kräver https eller localhost)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
