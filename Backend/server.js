// Server.js

const express = require("express");

const cors = require("cors");

const path = require("path");

const db = require("./db");



const app = express();

const PORT = 3001; // Backend-Port



// Middlewares

app.use(cors());

app.use(express.json());



// === API: Alle Anzeigen (optional mit Suche ?q=…) ===
app.get("/api/ads", (req, res) => {
  const search = req.query.q ? String(req.query.q).trim() : "";

  let sql = `
    SELECT Anzeige_ID, Titel, Beschreibung, Preis, Zustand, Standort, Erstellungsdatum, BildURL
    FROM Anzeigen
  `;
  const params = [];

  if (search) {
    sql += " WHERE Titel LIKE ? OR Beschreibung LIKE ?";
    const like = `%${search}%`;
    params.push(like, like);
  }

  sql += " ORDER BY Anzeige_ID DESC";

  db.all(sql, params, (err, rows) => {
    if (err) {
      // → erster Versuch mit Spaltenliste ist fehlgeschlagen
      console.error("Fehler beim Lesen aus DB (mit Spaltenliste):", err.message);

      // Fallback: SELECT * FROM Anzeigen (robuster, falls z.B. BildURL nicht existiert)
      let fallbackSql = "SELECT * FROM Anzeigen";
      if (search) {
        fallbackSql += " WHERE Titel LIKE ? OR Beschreibung LIKE ?";
      }
      fallbackSql += " ORDER BY 1 DESC";

      return db.all(fallbackSql, params, (err2, rows2) => {
        if (err2) {
          console.error("Fehler beim Lesen aus DB (Fallback *):", err2.message);
          return res.status(500).json({ error: "DB-Fehler", details: err2.message });
        }
        res.json(rows2);
      });
    }

    // erster Versuch erfolgreich → direkt zurückgeben
    res.json(rows);
  });
});



// === API: einzelne Anzeige nach ID ===

app.get("/api/ads/:id", (req, res) => {

  const id = Number(req.params.id);

  if (Number.isNaN(id)) {

    return res.status(400).json({ error: "Ungültige ID" });

  }



  const SQL = `

    SELECT Anzeige_ID, Titel, Beschreibung, Preis, Zustand, Standort, Erstellungsdatum, BildURL

    FROM Anzeigen

    WHERE Anzeige_ID = ?

  `;



  db.get(SQL, [id], (err, row) => {

    if (err) {

      console.error("Fehler beim Lesen aus DB:", err);

      return res.status(500).json({ error: "DB-Fehler" });

    }

    if (!row) return res.status(404).json({ error: "Nicht gefunden" });

    res.json(row);

  });

});



// === Frontend statisch ausliefern ===

// Achtung: Ordnername "Frontend" mit großem F

const frontendPath = path.join(__dirname, "..", "Frontend");

app.use(express.static(frontendPath));



// Fallback: alle unbekannten Routen -> kleinanzeigen2.html

// (Express 5: kein "app.get('*')" mehr benutzen)

app.use((req, res) => {

  res.sendFile(path.join(frontendPath, "kleinanzeigen2.html"));

});



// Server starten

app.listen(PORT, () => {

  console.log(`Backend läuft auf http://localhost:${PORT}`);

});