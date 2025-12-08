
// kleinanzeigen.js (mit eingebetteten Coverbildern, kein assets/ und keine externen Bilddienste)
console.log('kleinanzeigen.js geladen');

// ===== DOM =====
const grid = document.getElementById('adsGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');

// ===== Modal =====
const offerModal = document.getElementById('offerModal');
const modalCloseBtn = document.querySelector('.modal-close');
const msgInput = document.getElementById('msgInput');
const profileInput = document.getElementById('profileInput');
const amountInput = document.getElementById('amountInput');
const shippingSelect = document.getElementById('shippingSelect');
const protectionToggle = document.getElementById('protectionToggle');
const sumAmount = document.getElementById('sumAmount');
const sumShipping = document.getElementById('sumShipping');
const sumProtection = document.getElementById('sumProtection');
const sumTotal = document.getElementById('sumTotal');
const protectionPrice = document.getElementById('protectionPrice');
const offerSendBtn = document.getElementById('offerSendBtn');

let allAds = [];

/* =========================
   Helpers & Modal-Logik
   ========================= */
const formatEUR = (n) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
    .format(Number(n || 0));

const calcProtection = (amount) => Number(Math.max(amount * 0.03, 0.99).toFixed(2));

const recalc = () => {
  const amount = Number(amountInput?.value || 0);
  const shipping = Number(shippingSelect?.value || 0);
  const protection = protectionToggle?.checked ? calcProtection(amount) : 0;

  sumAmount.textContent = formatEUR(amount);
  sumShipping.textContent = formatEUR(shipping);
  sumProtection.textContent = formatEUR(protection);
  protectionPrice.textContent = formatEUR(protection);
  sumTotal.textContent = formatEUR(amount + shipping + protection);
};




function openOfferModal(ad) {
  // Betrag aus der Anzeige vorbelegen (falls vorhanden)
  if (amountInput) {
    amountInput.value = ad?.Preis != null ? Number(ad.Preis) : '';
  }

  // ✅ Fix: Profilname NICHT mehr aus Verkaeufer/Standort ableiten
  if (profileInput) {
    profileInput.value = 'Benutzer12';
    profileInput.readOnly = true; // optional: macht das Feld unveränderbar
  }

  // Nachricht vorbelegen
  if (msgInput) {
    msgInput.value = `Hallo, ich interessiere mich für "${ad?.Titel ?? 'deine Anzeige'}".`;
  }

  // Standardwerte
  if (protectionToggle) protectionToggle.checked = false;

  // ===== Versand: nur 2 Optionen (Selbstabholung / Versand mit berechnetem Preis) =====
  const norm = (t) =>
    String(t || '')
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss');

  const title = norm(ad?.Titel);
  const desc  = norm(ad?.Beschreibung);
  const kat   = norm(ad?.Kategorie);

  // Preisberechnung für "Versand" (ein einziger Preis)
  function computeShippingPrice(a) {
    const gewichtKg = (typeof a?.GewichtKg === 'number') ? a.GewichtKg : null;

    // 1) Reale Gewichtsangabe bevorzugt
    if (gewichtKg != null) {
      if (gewichtKg <= 0.5) return 3.99;   // kleines Päckchen / Warensendung
      if (gewichtKg <= 2)   return 6.19;   // Paket bis 2 kg
      if (gewichtKg <= 5)   return 7.99;   // Paket bis 5 kg
      return 19.90;                       // >5 kg: pauschal teurer (Beispiel)
    }

    // 2) Keine Gewichtsangabe -> Heuristik
    const text = `${title} ${desc} ${kat}`;
    const isMoebel     = /moebel|sofa|couch|bett|schrank|kommode|tisch|stuhl|buerostuhl|regal/.test(text);
    const isFahrrad    = /fahrrad|bike|e-bike|rennrad|mtb/.test(text);
    const isSperrig    = /gross|sperrig|palette|spedition/.test(text);
    const isKleidung   = /kleidung|t-shirt|jacke|hose|pullover|schuhe|socken|kleid|muetze|mütze/.test(text);
    const isKleinteil  = /zubehoer|adapter|kabel|sd-karte|akku|case|huelle|schutzglas|speicherkarte/.test(text);
    const isElektronik = /elektronik|handy|smartphone|tablet|kamera|konsole|controller|kopfhörer|kopfhoerer|maus|tastatur|router|raspberry|arduino|monitor/.test(text);

    if (isMoebel || isFahrrad || isSperrig) return 29.90; // Spedition/teurer Versand (Beispiel)
    if (isKleidung || isKleinteil)          return 3.99;  // leichte Teile
    if (isElektronik)                       return 6.19;  // typisches 2-kg-Paket

    // Fallback
    return 6.19;
  }

  // Select leeren & exakt zwei Optionen setzen
  if (shippingSelect) {
    while (shippingSelect.firstChild) {
      shippingSelect.removeChild(shippingSelect.firstChild);
    }

    // Option 1: Selbstabholung
    const optPickup = document.createElement('option');
    optPickup.value = '0';
    optPickup.dataset.label = 'Selbstabholung';
    optPickup.textContent = 'Selbstabholung – 0,00 €';
    shippingSelect.appendChild(optPickup);

    // Option 2: Versand (ein Preis)
    const price = computeShippingPrice(ad);
    const optShip = document.createElement('option');
    optShip.value = String(price);
    optShip.dataset.label = 'Versand';
    optShip.textContent = `Versand – ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price)}`;
    shippingSelect.appendChild(optShip);

    // Keine Vorauswahl: Nutzer soll bewusst wählen
    shippingSelect.value = '';
  }

  // Summen neu berechnen
  recalc();

  // Titel setzen
  const titleNode = document.getElementById('offerModalTitle');
  if (titleNode) titleNode.textContent = 'Verkäufer kontaktieren';

  // Modal öffnen & Fokus setzen
  if (offerModal) offerModal.hidden = false;
  amountInput?.focus();
}

  // ======= Ende Versand-Heuristik =======

  // Summen neu berechnen
  recalc();

  // Titel setzen
  const titleNode = document.getElementById('offerModalTitle');
  if (titleNode) titleNode.textContent = 'Verkäufer kontaktieren';




const closeOfferModal = () => { offerModal.hidden = true; };

modalCloseBtn?.addEventListener('click', closeOfferModal);
offerModal?.addEventListener('click', (e) => {
  if (e.target.classList?.contains('modal-backdrop')) closeOfferModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !offerModal.hidden) closeOfferModal();
});
amountInput?.addEventListener('input', recalc);
shippingSelect?.addEventListener('change', recalc);
protectionToggle?.addEventListener('change', recalc);
offerSendBtn?.addEventListener('click', () => {
  console.log('Angebot gesendet:', {
    nachricht: msgInput.value,
    profilname: profileInput.value,
    betrag: amountInput.value,
    versand: shippingSelect.options[shippingSelect.selectedIndex]?.dataset?.label,
    versandKosten: shippingSelect.value,
    kaeuferSchutzAktiv: protectionToggle.checked,
    gesamt: sumTotal.textContent
  });
  closeOfferModal();
});

/* =========================
   Coverbild (SVG data: URI) – immer sichtbar, thematisch passend
   ========================= */

// Text normalisieren fürs Matching
function norm(t) {
  return String(t || '')
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
}

// Emoji + Farben je Kategorie (deine Beispiele sind priorisiert)
function categoryVisuals(ad) {
  const text = norm(`${ad.Titel || ''} ${ad.Beschreibung || ''}`);

  // Priorisierte Sonderfälle (aus deinen Screenshots)
  if (/(wander|rucksack)/.test(text)) return { emoji: '🎒', from: '#C7E9B0', to: '#9CD08F' };
  if (/(jbl|lautsprecher|speaker|bluetooth)/.test(text)) return { emoji: '🔊', from: '#BDE0FE', to: '#A2D2FF' };
  if (/(oneplus|smartphone|handy|iphone|android|telefon)/.test(text)) return { emoji: '📱', from: '#FFDDE1', to: '#FFC2D1' };
  if (/(stehlampe|lampe|beleuchtung|led)/.test(text)) return { emoji: '💡', from: '#FFF1BA', to: '#FFE58F' };
  if (/(wandspiegel|spiegel)/.test(text)) return { emoji: '🪞', from: '#E7EAF0', to: '#D5DAE3' };
  if (/(smeg.*toaster|toaster)/.test(text)) return { emoji: '🍞', from: '#FFECC7', to: '#FFD39A' };
  if (/(isofix|kindersitz)/.test(text)) return { emoji: '👶', from: '#E0FBFC', to: '#C2E9F5' };
  if (/(airpods|earbuds|kopfhoerer)/.test(text)) return { emoji: '🎧', from: '#DFE7FD', to: '#C7D2FE' };
  if (/(siemens.*waschmaschine|waschmaschine)/.test(text)) return { emoji: '🧼', from: '#D0F4DE', to: '#B8E3C4' };
  if (/(schreibtisch.*160|schreibtisch|desk|table)/.test(text)) return { emoji: '🪑', from: '#EDE7F6', to: '#D1C4E9' };
  if (/(delonghi|kaffeemaschine|espresso|coffee)/.test(text)) return { emoji: '☕️', from: '#EBD4CB', to: '#D3B8AE' };
  if (/(lg.*55|fernseher|tv|monitor|bildschirm)/.test(text)) return { emoji: '📺', from: '#D7F9FF', to: '#B9EAF5' };

  // Allgemeine Kategorien
  if (/(laptop|notebook|macbook|pc|computer)/.test(text)) return { emoji: '💻', from: '#D6E5FA', to: '#B9D7F2' };
  if (/(kamera|dslr|canon|nikon|sony|fotografie)/.test(text)) return { emoji: '📷', from: '#FFE6E6', to: '#FFC9C9' };
  if (/(konsole|playstation|xbox|nintendo|gaming)/.test(text)) return { emoji: '🎮', from: '#CDEAC0', to: '#B5E0A9' };
  if (/(sofa|couch|stuhl|schrank|moebel|kommode|deko|bilderrahmen|wandbild)/.test(text)) return { emoji: '🛋️', from: '#FBE7C6', to: '#F1D1A8' };
  if (/(haushalt|kueche|geraet|wasserkocher|staubsauger)/.test(text)) return { emoji: '🏠', from: '#FDE2E4', to: '#FAD2E1' };
  if (/(spielzeug|puppe|kinder|bausteine)/.test(text)) return { emoji: '🧸', from: '#FFEECC', to: '#FFD6A5' };
  if (/(buch|buecher|roman|literatur)/.test(text)) return { emoji: '📚', from: '#E6F3FF', to: '#CCE6FF' };
  if (/(fahrrad|bike|mtb|ebike)/.test(text)) return { emoji: '🚲', from: '#E8FFCE', to: '#D3F8B5' };
  if (/(auto|pkw|fahrzeug|kfz|felgen|reifen)/.test(text)) return { emoji: '🚗', from: '#E0F0FF', to: '#C6E2FF' };
  if (/(haustier|katze|hund|tierbedarf)/.test(text)) return { emoji: '🐶', from: '#FFF4E6', to: '#FFE9CC' };
  if (/(werkzeug|bohrmaschine|schrauber|hammer|saege)/.test(text)) return { emoji: '🛠️', from: '#E9F5E1', to: '#D5EFC9' };
  if (/(garten|pflanzen|rasen|topf|kraeuter)/.test(text)) return { emoji: '🌿', from: '#E3F9E5', to: '#CFEFD1' };
  if (/(sport|fitness|fussball|yoga|ball)/.test(text)) return { emoji: '⚽️', from: '#E7F0FF', to: '#D0E0FF' };
  if (/(gitarre|klavier|keyboard|musik|instrument)/.test(text)) return { emoji: '🎸', from: '#FFEAD1', to: '#FFD4A3' };

  // Default
  return { emoji: '🛍️', from: '#EEF1F5', to: '#E2E6EC' };
}

// Baut eine SVG und gibt sie als data: URI zurück
function coverDataUrl(ad) {
  const { emoji, from, to } = categoryVisuals(ad);
  const title = (ad.Titel || 'Anzeige');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${from}"/>
          <stop offset="100%" stop-color="${to}"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="800" height="600" fill="url(#g)"/>
      <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle"
            font-family="system-ui,Segoe UI,Arial,sans-serif" font-size="140">${emoji}</text>
      <text x="50%" y="70%" dominant-baseline="middle" text-anchor="middle"
            font-family="system-ui,Segoe UI,Arial,sans-serif" font-size="36" fill="#3a4755">
        ${esc(title)}
      </text>
    </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

/** Setzt ein Bild oben in der Karte: DB-Bild bevorzugt, sonst eingebettetes SVG */
function setImageInCard(card, ad) {
  const wrap = document.createElement('div');
  wrap.className = 'ad-image-wrap';
  wrap.style.position = 'relative';

  const img = document.createElement('img');
  img.className = 'ad-image';
  img.alt = ad.Titel || 'Anzeige';
  img.loading = 'lazy';
  img.decoding = 'async';

  const dbUrl = (ad.BildURL && String(ad.BildURL).trim()) ? ad.BildURL : null;
  img.src = dbUrl || coverDataUrl(ad);

  // Wenn DB-Bild fehlschlägt, auf eingebettetes Cover umschalten
  img.onerror = () => {
    if (dbUrl) img.src = coverDataUrl(ad);
  };

  wrap.appendChild(img);
  card.appendChild(wrap);
}

/* =========================
   Render
   ========================= */
function renderAds(ads) {
  grid.innerHTML = '';
  emptyState.hidden = !!ads.length;

  for (const ad of ads) {
    const card = document.createElement('article');
    card.className = 'ad-card';

    // Bild oben
    setImageInCard(card, ad);

    // Inhalt
    const content = document.createElement('div');
    content.className = 'ad-content';

    const title = document.createElement('h2');
    title.className = 'ad-title';
    title.textContent = ad.Titel ?? 'Ohne Titel';

    const desc = document.createElement('p');
    desc.className = 'ad-desc';
    desc.textContent = ad.Beschreibung ?? '';

    const meta = document.createElement('div');
    meta.className = 'ad-meta';
    const metaItems = [];
    if (ad.Zustand) metaItems.push(`Zustand: ${ad.Zustand}`);
    if (ad.Standort) metaItems.push(`Standort: ${ad.Standort}`);
    if (ad.Erstellungsdatum) {
      const d = new Date(ad.Erstellungsdatum);
      metaItems.push(`Erstellt: ${isNaN(d) ? ad.Erstellungsdatum : d.toLocaleDateString('de-DE')}`);
    }
    if (metaItems.length) meta.textContent = metaItems.join(' • ');

    // Footer
    const footer = document.createElement('div');
    footer.className = 'ad-footer';

    const left = document.createElement('div');
    left.style.display = 'flex';
    left.style.alignItems = 'baseline';
    left.style.gap = '.4rem';

    const price = document.createElement('span');
    price.className = 'ad-price';
    price.textContent = formatEUR(ad.Preis);

    const id = document.createElement('span');
    id.className = 'ad-id';
    id.textContent = ad.Anzeige_ID != null ? `#${ad.Anzeige_ID}` : '';

    left.append(price, id);

    const offerBtn = document.createElement('button');
    offerBtn.className = 'btn-green btn-sm offer-btn';
    offerBtn.type = 'button';
    offerBtn.textContent = '€ Angebot machen';
    offerBtn.setAttribute('aria-label', `Angebot machen für "${ad.Titel ?? 'Anzeige'}"`);
    offerBtn.addEventListener('click', () => openOfferModal(ad));

    footer.append(left, offerBtn);

    content.append(title, desc);
    if (metaItems.length) content.appendChild(meta);
    content.appendChild(footer);

    card.appendChild(content);
    grid.appendChild(card);
  }
}

/* =========================
   Suche
   ========================= */
const filterAds = (q) => {
  const s = (q || '').trim().toLowerCase();
  if (!s) return allAds;
  return allAds.filter(ad =>
    (ad.Titel ?? '').toLowerCase().includes(s) ||
    (ad.Beschreibung ?? '').toLowerCase().includes(s)
  );
};
searchInput?.addEventListener('input', () => renderAds(filterAds(searchInput.value)));

/* =========================
   DB laden (sql.js)
   ========================= */
async function loadDb() {
  try {
    if (typeof initSqlJs !== 'function') throw new Error('initSqlJs fehlt (sql-wasm.js geladen?)');
    const SQL = await initSqlJs({
      locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    });

    const res = await fetch('./Datenbank.db');
    if (!res.ok) throw new Error(`DB-Load: ${res.status} ${res.statusText}`);

    const buf = await res.arrayBuffer();
    const db = new SQL.Database(new Uint8Array(buf));

    const ads = [];
    try {
      const stmt = db.prepare(`
        SELECT Anzeige_ID, Titel, Beschreibung, Preis, Zustand, Standort, Erstellungsdatum, BildURL
        FROM Anzeigen
        ORDER BY Anzeige_ID DESC
      `);
      while (stmt.step()) ads.push(stmt.getAsObject());
      stmt.free();
    } catch {
      const stmt = db.prepare(`SELECT * FROM Anzeigen ORDER BY 1 DESC`);
      while (stmt.step()) ads.push(stmt.getAsObject());
      stmt.free();
    }

    db.close();
    allAds = ads;
    renderAds(allAds);
  } catch (e) {
    console.error('DB-Fehler:', e);
    emptyState.hidden = false;
    emptyState.textContent = 'Fehler beim Laden der Anzeigen (siehe Konsole).';
  }
}
loadDb();



/* =========================
   Angebot senden: Entscheidung + Payment
   ========================= */

// Hilfsfunktion: kleines Ergebnis-Popup
function showDecisionPopup({ accepted, message, onClose }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  Object.assign(overlay.style, {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 1000,
    display: 'grid', placeItems: 'center'
  });

  const box = document.createElement('div');
  box.className = 'modal dialog';
  Object.assign(box.style, {
    width: 'min(480px, 92vw)', background: '#fff', borderRadius: '12px',
    boxShadow: '0 16px 40px rgba(0,0,0,.25)', padding: '20px'
  });

  const title = document.createElement('h3');
  title.textContent = accepted ? 'Angebot angenommen' : 'Angebot abgelehnt';

  const p = document.createElement('p');
  p.textContent = message || (accepted
    ? 'Der Verkäufer hat dein Angebot akzeptiert.'
    : 'Der Verkäufer hat dein Angebot abgelehnt.');

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.justifyContent = 'flex-end';
  actions.style.gap = '8px';
  actions.style.marginTop = '16px';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn btn-sm';
  closeBtn.textContent = 'Schließen';

  if (accepted) {
    const payBtn = document.createElement('button');
    payBtn.className = 'btn-green btn-sm';
    payBtn.textContent = 'Zur Zahlung';
    payBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      showPaymentModal();
    });
    actions.appendChild(payBtn);
  }

  actions.appendChild(closeBtn);
  box.append(title, p, actions);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  const close = () => {
    document.body.removeChild(overlay);
    onClose?.();
  };
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); }, { once: true });
}

// Zahlungsmodal (ein eigenes Fenster mit einfachen Optionen)
function showPaymentModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  Object.assign(overlay.style, {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 1000,
    display: 'grid', placeItems: 'center'
  });

  const box = document.createElement('div');
  box.className = 'modal payment';
  Object.assign(box.style, {
    width: 'min(560px, 94vw)', background: '#fff', borderRadius: '12px',
    boxShadow: '0 16px 40px rgba(0,0,0,.25)', padding: '20px'
  });

  const title = document.createElement('h3');
  title.textContent = 'Bezahlmöglichkeiten';

  const list = document.createElement('div');
  list.style.display = 'grid';
  list.style.gap = '10px';
  list.style.marginTop = '12px';

  const methods = [
    { id: 'pay-card', label: 'Kredit-/Debitkarte' },
    { id: 'pay-paypal', label: 'PayPal' },
    { id: 'pay-sepa', label: 'SEPA-Lastschrift' },
  ];
  methods.forEach(m => {
    const label = document.createElement('label');
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.gap = '10px';
    const input = Object.assign(document.createElement('input'), { type: 'radio', name: 'payMethod', id: m.id });
    const span = document.createElement('span');
    span.textContent = m.label;
    label.append(input, span);
    list.appendChild(label);
  });
  // standardmäßig erstes wählen
  list.querySelector('input[type="radio"]').checked = true;

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.justifyContent = 'flex-end';
  actions.style.gap = '8px';
  actions.style.marginTop = '16px';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn-sm';
  backBtn.textContent = 'Zurück';
  backBtn.addEventListener('click', () => {
    document.body.removeChild(overlay);
    // ursprüngliches Kontaktfenster wieder anzeigen
    offerModal.hidden = false;
  });

  const payBtn = document.createElement('button');
  payBtn.className = 'btn-green btn-sm';
  payBtn.textContent = 'Jetzt bezahlen';
  payBtn.addEventListener('click', () => {
    const chosen = list.querySelector('input[name="payMethod"]:checked')?.id;
    // Hier später echte Zahlungslogik integrieren:
    alert(`Zahlung gestartet: ${chosen || 'unbekannt'}`);
    document.body.removeChild(overlay);
  });

  actions.append(backBtn, payBtn);
  box.append(title, list, actions);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // ESC/Click-out schließt Payment und zeigt wieder das Kontaktfenster
  const close = () => { document.body.removeChild(overlay); offerModal.hidden = false; };
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); }, { once: true });
}


function decideOffer({ amount }) {
  const a = Number(amount || 0);

  // Basis 50%, Betrag-Bias max ±20% (linear bis 200 €)
  const bias = Math.max(-0.2, Math.min(0.2, (a - 50) / 750)); // bei 50€ ≈ 0, bei 200€ ≈ +0.2, bei 0€ ≈ -0.067
  const pAccept = Math.max(0.20, Math.min(0.80, 0.50 + bias));

  return Math.random() < pAccept;
}


// Event: Klick auf „Angebot senden“
offerSendBtn?.addEventListener('click', () => {
  // Modal zunächst ausblenden, damit Ergebnis-Popup klar sichtbar ist
  offerModal.hidden = true;

  const amount = Number(amountInput?.value || 0);

  const accepted = decideOffer({ amount });
  showDecisionPopup({
    accepted,
    message: accepted
      ? 'Der Verkäufer hat dein Angebot akzeptiert. Wähle eine Bezahlmethode aus.'
      : 'Der Verkäufer hat dein Angebot leider abgelehnt. Du kannst dein Angebot anpassen und es erneut versuchen.',
    onClose: () => {
      if (!accepted) {
        // Bei Ablehnung: ursprüngliches Kontaktfenster wieder zeigen
        offerModal.hidden = false;
        amountInput?.focus();
      }
      // Bei Annahme: nichts zu tun – die Zahlungsmodal wurde über die Aktion geöffnet.
    }
  });
});
