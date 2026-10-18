import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { randomUUID } from "node:crypto";

export const uid = () => randomUUID();
export const now = () => new Date().toISOString();
export function createStore(directory) {
  mkdirSync(directory, { recursive: true });
  const db = new DatabaseSync(join(resolve(directory), "atelier.sqlite"));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS matters(id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS documents(id TEXT PRIMARY KEY, matter_id TEXT NOT NULL REFERENCES matters(id), data TEXT NOT NULL, original BLOB);
    CREATE TABLE IF NOT EXISTS reviews(id TEXT PRIMARY KEY, matter_id TEXT NOT NULL REFERENCES matters(id), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS cells(id TEXT PRIMARY KEY, review_id TEXT NOT NULL REFERENCES reviews(id), document_id TEXT NOT NULL REFERENCES documents(id), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS runs(id TEXT PRIMARY KEY, review_id TEXT NOT NULL REFERENCES reviews(id), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY, matter_id TEXT NOT NULL REFERENCES matters(id), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS notes(id TEXT PRIMARY KEY, matter_id TEXT NOT NULL REFERENCES matters(id), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY, matter_id TEXT NOT NULL REFERENCES matters(id), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS settings(id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS document_models(id TEXT PRIMARY KEY, matter_id TEXT NOT NULL REFERENCES matters(id), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS legal_drafts(id TEXT PRIMARY KEY, matter_id TEXT NOT NULL REFERENCES matters(id), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS comparisons(id TEXT PRIMARY KEY, matter_id TEXT NOT NULL REFERENCES matters(id), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS legal_references(id TEXT PRIMARY KEY, matter_id TEXT NOT NULL REFERENCES matters(id), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS research_sessions(id TEXT PRIMARY KEY, matter_id TEXT NOT NULL REFERENCES matters(id), data TEXT NOT NULL);
    CREATE VIRTUAL TABLE IF NOT EXISTS search_blocks USING fts5(document_id UNINDEXED, matter_id UNINDEXED, block_id UNINDEXED, content, tokenize='unicode61 remove_diacritics 2');
    CREATE INDEX IF NOT EXISTS docs_matter ON documents(matter_id);
    CREATE INDEX IF NOT EXISTS cells_review ON cells(review_id);`);
  const allowed = new Set([
    "matters",
    "documents",
    "reviews",
    "cells",
    "runs",
    "messages",
    "notes",
    "audit",
    "settings",
    "document_models",
    "legal_drafts",
    "comparisons",
    "legal_references",
    "research_sessions",
  ]);
  const check = (table) => {
    if (!allowed.has(table)) throw new Error("Table invalide");
  };
  const store = {
    db,
    all(table) {
      check(table);
      return db
        .prepare(`SELECT data FROM ${table} ORDER BY rowid`)
        .all()
        .map((r) => JSON.parse(r.data));
    },
    get(table, id) {
      check(table);
      const row = db.prepare(`SELECT data FROM ${table} WHERE id=?`).get(id);
      return row ? JSON.parse(row.data) : null;
    },
    put(table, data, refs = {}) {
      check(table);
      const keys = ["id", "data", ...Object.keys(refs)];
      if (
        keys.some(
          (k) =>
            ![
              "id",
              "data",
              "matter_id",
              "review_id",
              "document_id",
              "original",
            ].includes(k),
        )
      )
        throw new Error("Champ invalide");
      db.prepare(
        `INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")}) ON CONFLICT(id) DO UPDATE SET data=excluded.data`,
      ).run(data.id, JSON.stringify(data), ...Object.values(refs));
      return data;
    },
    transaction(fn) {
      db.exec("BEGIN IMMEDIATE");
      try {
        const result = fn();
        db.exec("COMMIT");
        return result;
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    },
    log(matterId, action, detail) {
      return store.put(
        "audit",
        {
          id: uid(),
          matterId,
          action,
          detail,
          actor: "Utilisateur local",
          createdAt: now(),
        },
        { matter_id: matterId },
      );
    },
    addDocument(doc, original) {
      return store.transaction(() => {
        store.put("documents", doc, { matter_id: doc.matterId, original });
        const insert = db.prepare(
          "INSERT INTO search_blocks(document_id,matter_id,block_id,content) VALUES(?,?,?,?)",
        );
        for (const page of doc.pages)
          for (const block of page.blocks)
            insert.run(doc.id, doc.matterId, block.id, block.text);
        store.log(doc.matterId, "Document importé", doc.name);
        return doc;
      });
    },
    close() {
      db.close();
    },
  };
  return store;
}
