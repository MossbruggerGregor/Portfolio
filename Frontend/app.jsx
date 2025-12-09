const { useState, useEffect, useMemo } = React;

/* ===== Helpers ===== */
const formatEUR = (n) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
    Number(n || 0)
  );

const calcProtection = (amount) =>
  Number(Math.max(amount * 0.03, 0.99).toFixed(2)); // min. 0,99 €

const coverDataUrl = (ad) => {
  const title = ad.Titel || "Anzeige";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#EEF1F5"/>
          <stop offset="100%" stop-color="#E2E6EC"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="800" height="600" fill="url(#g)"/>
      <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle"
            font-family="system-ui,Segoe UI,Arial,sans-serif" font-size="140">🛍</text>
      <text x="50%" y="70%" dominant-baseline="middle" text-anchor="middle"
            font-family="system-ui,Segoe UI,Arial,sans-serif" font-size="36" fill="#3a4755">
        ${String(title)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}
      </text>
    </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
};

const SHIPPING_OPTIONS = [
  { value: "0", label: "Abholung – 0,00 €" },
  { value: "3.99", label: "Warensendung – 3,99 €" },
];

const decideOffer = (amount) => {
  const a = Number(amount || 0);
  const bias = Math.max(-0.2, Math.min(0.2, (a - 50) / 750));
  const pAccept = Math.max(0.2, Math.min(0.8, 0.5 + bias));
  return Math.random() < pAccept;
};

/* ===== UI-Baustein: generisches Modal ===== */
function Modal({ open, title, children, footer, onBackdrop }) {
  if (!open) return null;
  const handleClick = (e) => {
    if (e.target.classList.contains("modal") && onBackdrop) onBackdrop();
  };
  return (
    <div className="modal" aria-modal="true" role="dialog" onClick={handleClick}>
      <div className="modal-backdrop" />
      <div className="modal-dialog">
        {title && (
          <div className="modal-header">
            <h3>{title}</h3>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/* ===== Card ===== */
function AdCard({ ad, onOffer }) {
  const imgSrc =
    ad.BildURL && String(ad.BildURL).trim() ? ad.BildURL : coverDataUrl(ad);
  return (
    <article className="ad-card">
      <img
        className="ad-image"
        src={imgSrc}
        alt={ad.Titel || "Anzeige"}
        loading="lazy"
      />
      <div className="ad-content">
        <h2 className="ad-title">{ad.Titel ?? "Ohne Titel"}</h2>
        {ad.Beschreibung && <p className="ad-desc">{ad.Beschreibung}</p>}

        <div className="ad-meta">
          {ad.Zustand && <span className="badge">Zustand: {ad.Zustand}</span>}
          {ad.Standort && <span className="badge">Standort: {ad.Standort}</span>}
          {ad.Erstellungsdatum && (
            <span className="badge">
              Erstellt:{" "}
              {(() => {
                const d = new Date(ad.Erstellungsdatum);
                return isNaN(d)
                  ? ad.Erstellungsdatum
                  : d.toLocaleDateString("de-DE");
              })()}
            </span>
          )}
        </div>

        <div className="ad-footer">
          <div className="ad-footer-left">
            <span className="ad-price">{formatEUR(ad.Preis)}</span>
            {ad.Anzeige_ID != null && (
              <span className="ad-id">#{ad.Anzeige_ID}</span>
            )}
          </div>
          <button
            type="button"
            className="btn-green btn-sm offer-btn"
            onClick={() => onOffer(ad)}
            aria-label={`Angebot machen für "${ad.Titel ?? "Anzeige"}"`}
          >
            € Angebot machen
          </button>
        </div>
      </div>
    </article>
  );
}

/* ===== Angebot-Modal ===== */
function OfferModal({ ad, open, onClose, onSend }) {
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState("");
  const [shipping, setShipping] = useState("0");
  const [protection, setProtection] = useState(false);

  useEffect(() => {
    if (!ad || !open) return;
    setAmount(ad.Preis != null ? String(ad.Preis) : "");
    setMessage(
      `Hallo, ich interessiere mich für "${ad.Titel ?? "deine Anzeige"}".`
    );
    setShipping("0");
    setProtection(false);
  }, [ad, open]);

  const { sumAmount, sumShipping, sumProtection, sumTotal } = useMemo(() => {
    const a = Number(amount || 0);
    const s = Number(shipping || 0);
    const p = protection ? calcProtection(a) : 0;
    return {
      sumAmount: formatEUR(a),
      sumShipping: formatEUR(s),
      sumProtection: formatEUR(p),
      sumTotal: formatEUR(a + s + p),
    };
  }, [amount, shipping, protection]);

  const handleSend = () => {
    onSend({
      betrag: amount,
      nachricht: message,
      versandLabel: SHIPPING_OPTIONS.find((o) => o.value === shipping)?.label,
      versandKosten: shipping,
      kaeuferSchutzAktiv: protection,
      gesamt: sumTotal,
    });
  };

  const footer = (
    <button type="button" className="btn-green btn-sm" onClick={handleSend}>
      Angebot senden
    </button>
  );

  return (
    <Modal
      open={open && !!ad}
      title="Verkäufer kontaktieren"
      footer={footer}
      onBackdrop={onClose}
    >
      {!ad ? null : (
        <>
          <label className="field-label" htmlFor="msgInput">
            Nachricht
          </label>
          <textarea
            id="msgInput"
            className="input textarea"
            rows="4"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <label className="field-label">Profilname</label>
          <input
            className="input"
            type="text"
            value="Benutzer12"
            readOnly
          />

          <div className="offer-grid">
            <div className="offer-col">
              <label className="field-label" htmlFor="amountInput">
                Betrag
              </label>
              <div className="input-with-prefix">
                <span className="prefix">€</span>
                <input
                  id="amountInput"
                  className="input"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="offer-col">
              <label className="field-label" htmlFor="shippingSelect">
                Versandmethode
              </label>
              <select
                id="shippingSelect"
                className="input select"
                value={shipping}
                onChange={(e) => setShipping(e.target.value)}
              >
                {SHIPPING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="protection-row">
            <label className="switch">
              <input
                type="checkbox"
                checked={protection}
                onChange={(e) => setProtection(e.target.checked)}
              />
              <span className="slider" />
            </label>
            <div className="protection-info">
              <div className="title">Käuferschutz</div>
              <div className="note">
                Schützt deinen Kauf – Gebühr wird zum Gesamtpreis addiert.
              </div>
            </div>
            <div className="protection-price">{sumProtection}</div>
          </div>

          <div className="summary">
            <div className="summary-row">
              <span>Betrag</span>
              <strong>{sumAmount}</strong>
            </div>
            <div className="summary-row">
              <span>Versand</span>
              <strong>{sumShipping}</strong>
            </div>
            <div className="summary-row">
              <span>Käuferschutz</span>
              <strong>{sumProtection}</strong>
            </div>
            <div className="summary-row total">
              <span>Gesamt</span>
              <strong>{sumTotal}</strong>
            </div>
          </div>

          <div className="legal-note">
            Es gelten die Bedingungen der Kleinanzeigen Bezahlfunktion sowie die
            Datenschutzhinweise unserer Zahlungsdienste.
          </div>
        </>
      )}
    </Modal>
  );
}

/* ===== Haupt-App ===== */
function KleinanzeigenApp() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [selectedAd, setSelectedAd] = useState(null);
  const [offerOpen, setOfferOpen] = useState(false);

  const [decision, setDecision] = useState(null); // {accepted, text}
  const [decisionOpen, setDecisionOpen] = useState(false);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payMethod, setPayMethod] = useState("card");

  // Daten vom Backend
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/ads");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setAds(data);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Fehler beim Laden der Anzeigen (API).");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredAds = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return ads;
    return ads.filter(
      (ad) =>
        (ad.Titel ?? "").toLowerCase().includes(s) ||
        (ad.Beschreibung ?? "").toLowerCase().includes(s)
    );
  }, [ads, search]);

  const handleOfferClick = (ad) => {
    setSelectedAd(ad);
    setOfferOpen(true);
  };

  const handleOfferSend = (payload) => {
    const accepted = decideOffer(payload.betrag);
    setOfferOpen(false);
    setDecisionOpen(true);
    setDecision(
      accepted
        ? {
            accepted: true,
            text: "Der Verkäufer hat dein Angebot akzeptiert. Wähle eine Bezahlmethode aus.",
          }
        : {
            accepted: false,
            text: "Der Verkäufer hat dein Angebot abgelehnt. Du kannst dein Angebot anpassen und es erneut versuchen.",
          }
    );
  };

  const handleDecisionClose = () => {
    if (decision?.accepted) {
      setDecisionOpen(false);
    } else {
      setDecisionOpen(false);
      setOfferOpen(true); 
    }
  };

  const handleGoToPayment = () => {
    setDecisionOpen(false);
    setPaymentOpen(true);
  };

  const handlePaymentFinish = () => {
    alert(`Zahlung gestartet mit: ${payMethod}`);
    setPaymentOpen(false);
    setSelectedAd(null);
  };

  return (
    <>
      <header className="site-header">
        <h1>Kleinanzeigen</h1>
        <input
          type="search"
          placeholder="Suche nach Titel oder Beschreibung…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </header>

      <main>
        {loading && <p style={{ padding: "1rem" }}>Lade Anzeigen…</p>}
        {error && <div className="empty-state">{error}</div>}
        {!loading && !error && filteredAds.length === 0 && (
          <div className="empty-state">Keine Anzeigen gefunden.</div>
        )}

        <section className="ads-grid" aria-live="polite">
          {filteredAds.map((ad) => (
            <AdCard
              key={ad.Anzeige_ID ?? ad.Titel}
              ad={ad}
              onOffer={handleOfferClick}
            />
          ))}
        </section>
      </main>

      <OfferModal
        ad={selectedAd}
        open={offerOpen}
        onClose={() => setOfferOpen(false)}
        onSend={handleOfferSend}
      />

      {/* Entscheidung */}
      <Modal
        open={decisionOpen && !!decision}
        title={decision?.accepted ? "Angebot angenommen" : "Angebot abgelehnt"}
        onBackdrop={handleDecisionClose}
        footer={
          <>
            {decision?.accepted && (
              <button
                type="button"
                className="btn-green btn-sm"
                onClick={handleGoToPayment}
              >
                Zur Zahlung
              </button>
            )}
            <button
              type="button"
              className="btn btn-sm"
              onClick={handleDecisionClose}
            >
              Schließen
            </button>
          </>
        }
      >
        <p>{decision?.text}</p>
      </Modal>

      {/* Zahlung */}
      <Modal
        open={paymentOpen}
        title="Bezahlmöglichkeiten"
        onBackdrop={() => setPaymentOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setPaymentOpen(false)}
            >
              Zurück
            </button>
            <button
              type="button"
              className="btn-green btn-sm"
              onClick={handlePaymentFinish}
            >
              Jetzt bezahlen
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gap: "8px" }}>
          {[
            { id: "card", label: "Kredit-/Debitkarte" },
            { id: "paypal", label: "PayPal" },
            { id: "sepa", label: "SEPA-Lastschrift" },
          ].map((m) => (
            <label
              key={m.id}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <input
                type="radio"
                name="payMethod"
                value={m.id}
                checked={payMethod === m.id}
                onChange={() => setPayMethod(m.id)}
              />
              {m.label}
            </label>
          ))}
        </div>
      </Modal>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <KleinanzeigenApp />
);