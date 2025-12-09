// db.js
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

// Pfad zu eurer bestehenden DB-Datei
const DB_PATH = path.join(__dirname, "Datenbank.db");

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error("Fehler beim Öffnen der SQLite-DB:", err.message);
  } else {
    console.log("Mit SQLite-Datenbank verbunden:", DB_PATH);
  }
});

module.exports = db;