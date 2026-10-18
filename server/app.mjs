import express from "express";
import multer from "multer";
import { z } from "zod";
import ExcelJS from "exceljs";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { createStore, uid, now } from "./store.mjs";
import { parseDocument } from "./documents.mjs";
import {
  DEFAULT_COLUMNS,
  extractCell,
  retrieve,
  ollamaAnswer,
} from "./analysis.mjs";
import { seed } from "./seed.mjs";
import { registerGeneratorRoutes } from "./legal/routes.mjs";
import { registerResearchRoutes } from "./research.mjs";

const text = z.string().trim().min(1).max(180);
const columnSchema = z.object({
  id: text,
  title: text,
  question: z.string().trim().min(3).max(1200),
  keywords: z.array(z.string().max(100)).max(20).optional(),
});
const bad = (message, status = 400) =>
  Object.assign(new Error(message), { status });
const pause = () => new Promise((r) => setTimeout(r, 25));

export function createApplication({ dataDir, demo = true, legalClock } = {}) {
  const app = express();
  const store = createStore(dataDir);
  const active = new Map();
  let shuttingDown = false;
  if (demo) seed(store);
  for (const run of store.all("runs"))
    if (["queued", "running"].includes(run.status))
      store.put(
        "runs",
        {
          ...run,
          status: "interrupted",
          error:
            "Serveur redémarré. Relancez la revue ; les valeurs verrouillées sont préservées.",
          finishedAt: now(),
        },
        { review_id: run.reviewId },
      );
  if (!store.get("settings", "local"))
    store.put("settings", { id: "local", engine: "extractive", model: "" });

  app.disable("x-powered-by");
  app.use((req, res, next) => {
    const host = req.headers.host ?? "";
    if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host))
      return res.status(403).json({ error: "Hôte local requis." });
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    if (req.path.startsWith("/api")) {
      res.setHeader("Cache-Control", "no-store");
      if (req.headers.origin && req.headers.origin !== `http://${host}`)
        return res.status(403).json({ error: "Origine refusée." });
      if (
        !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
        req.headers["x-atelier-request"] !== "local"
      )
        return res
          .status(403)
          .json({ error: "Requête locale explicite requise." });
    }
    next();
  });
  app.use(express.json({ limit: "2mb" }));
  const need = (table, id) => {
    const value = store.get(table, id);
    if (!value) throw bad("Élément introuvable.", 404);
    return value;
  };
  const docsFor = (matterId) =>
    store.all("documents").filter((d) => d.matterId === matterId);
  const cellsFor = (reviewId) =>
    store.all("cells").filter((c) => c.reviewId === reviewId);
  const running = (reviewId) =>
    [...active.values()].some((r) => r.reviewId === reviewId);
  const settings = () => store.get("settings", "local");
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024, files: 30, fields: 0 },
  });

  app.get("/api/health", (req, res) =>
    res.json({ ok: true, name: "Atelier juridique", local: true }),
  );
  app.post("/api/shutdown", (req, res) => {
    if (!app.locals.shutdown)
      throw bad("Arrêt indisponible dans ce contexte.", 503);
    res.json({ ok: true });
    setTimeout(() => void app.locals.shutdown(), 100);
  });
  app.get("/api/state", (req, res) =>
    res.json({
      matters: store.all("matters"),
      documents: store.all("documents").map(({ text, pages, ...doc }) => ({
        ...doc,
        pageCount: pages.length,
        blockCount: pages.reduce((n, p) => n + p.blocks.length, 0),
      })),
      reviews: store.all("reviews"),
      runs: store.all("runs"),
      settings: settings(),
    }),
  );
  app.post("/api/matters", (req, res) => {
    const body = z
      .object({
        title: text,
        client: z.string().max(180).default(""),
        description: z.string().max(3000).default(""),
        practice: text.default("Droit des affaires"),
      })
      .parse(req.body);
    const matter = store.put("matters", {
      ...body,
      id: uid(),
      createdAt: now(),
      color: "sage",
    });
    store.log(matter.id, "Dossier créé", matter.title);
    res.status(201).json(matter);
  });
  app.patch("/api/matters/:id", (req, res) => {
    const matter = need("matters", req.params.id);
    const patch = z
      .object({
        title: text.optional(),
        description: z.string().max(3000).optional(),
        client: z.string().max(180).optional(),
      })
      .parse(req.body);
    store.put("matters", { ...matter, ...patch });
    store.log(matter.id, "Dossier modifié", matter.title);
    res.json({ ok: true });
  });
  app.post(
    "/api/matters/:id/documents",
    upload.array("files", 30),
    async (req, res) => {
      const matter = need("matters", req.params.id);
      const result = { documents: [], errors: [] };
      if (!req.files?.length) throw bad("Sélectionnez au moins un fichier.");
      if (docsFor(matter.id).length + req.files.length > 100)
        throw bad("Limite locale : 100 documents par dossier.");
      for (const file of req.files) {
        try {
          const doc = await parseDocument(file, matter.id);
          const existing = docsFor(matter.id).find((d) => d.hash === doc.hash);
          if (existing) {
            if (req.query.reuse === "true") {
              result.documents.push(existing);
              continue;
            }
            result.errors.push({
              name: doc.name,
              message: `Déjà importé : ${existing.name}`,
              documentId: existing.id,
            });
            continue;
          }
          store.addDocument(doc, file.buffer);
          result.documents.push(doc);
        } catch (e) {
          result.errors.push({ name: file.originalname, message: e.message });
        }
      }
      res.status(result.documents.length ? 201 : 422).json(result);
    },
  );
  app.get("/api/documents/:id", (req, res) =>
    res.json(need("documents", req.params.id)),
  );
  app.get("/api/documents/:id/original", (req, res) => {
    const doc = need("documents", req.params.id);
    const row = store.db
      .prepare("SELECT original FROM documents WHERE id=?")
      .get(doc.id);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(doc.name)}`,
    );
    res
      .type(
        doc.type === "pdf"
          ? "application/pdf"
          : doc.type === "docx"
            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : "text/plain; charset=utf-8",
      )
      .send(Buffer.from(row.original));
  });
  app.patch("/api/documents/:id", (req, res) => {
    const doc = need("documents", req.params.id);
    const { sourceType } = z
      .object({
        sourceType: z.enum(["primary", "statement", "framing", "analysis"]),
      })
      .parse(req.body);
    if (
      store
        .all("reviews")
        .some((r) => r.documentIds.includes(doc.id) && running(r.id))
    )
      throw bad(
        "Attendez la fin de la revue pour modifier la qualification.",
        409,
      );
    store.transaction(() => {
      store.put("documents", { ...doc, sourceType });
      for (const c of store.all("cells").filter((c) => c.documentId === doc.id))
        store.put(
          "cells",
          {
            ...c,
            status:
              sourceType === "framing" && c.citations.length
                ? "source_warning"
                : c.status === "source_warning"
                  ? "found"
                  : c.status,
            citations: c.citations.map((cite) => ({ ...cite, sourceType })),
            decision: "pending",
            revision: c.revision + 1,
            updatedAt: now(),
          },
          { review_id: c.reviewId, document_id: c.documentId },
        );
      store.log(
        doc.matterId,
        "Nature de source modifiée",
        `${doc.name} : ${sourceType}. Validations à revoir.`,
      );
    });
    res.json({ ok: true });
  });
  app.delete("/api/documents/:id", (req, res) => {
    const doc = need("documents", req.params.id);
    const reviews = store
      .all("reviews")
      .filter((r) => r.documentIds.includes(doc.id));
    if (reviews.some((r) => running(r.id)))
      throw bad("Arrêtez la revue avant de supprimer ce document.", 409);
    store.transaction(() => {
      for (const review of reviews)
        store.put(
          "reviews",
          {
            ...review,
            documentIds: review.documentIds.filter((id) => id !== doc.id),
          },
          { matter_id: doc.matterId },
        );
      store.db.prepare("DELETE FROM cells WHERE document_id=?").run(doc.id);
      store.db
        .prepare("DELETE FROM search_blocks WHERE document_id=?")
        .run(doc.id);
      // Une réponse peut contenir des dérivés : retirer les échanges concernés plutôt que laisser des extraits orphelins.
      for (const m of store
        .all("messages")
        .filter((m) => m.matterId === doc.matterId))
        if (m.role === "assistant")
          store.db.prepare("DELETE FROM messages WHERE id=?").run(m.id);
      store.db.prepare("DELETE FROM documents WHERE id=?").run(doc.id);
      for (const table of ["comparisons", "research_sessions"]) {
        for (const item of store.all(table)) {
          if (
            item.matterId === doc.matterId &&
            (table === "comparisons"
              ? item.leftId === doc.id || item.rightId === doc.id
              : item.results.some((r) => r.documentId === doc.id))
          )
            store.db.prepare(`DELETE FROM ${table} WHERE id=?`).run(item.id);
        }
      }
      store.log(doc.matterId, "Document supprimé", doc.name);
    });
    res.json({ ok: true });
  });

  app.get("/api/templates", (req, res) => res.json(DEFAULT_COLUMNS));
  app.post("/api/matters/:id/reviews", (req, res) => {
    const matter = need("matters", req.params.id);
    const body = z
      .object({
        title: text,
        documentIds: z.array(text).min(1).max(100),
        columns: z.array(columnSchema).min(1).max(10),
      })
      .parse(req.body);
    if (
      new Set(body.documentIds).size !== body.documentIds.length ||
      new Set(body.columns.map((c) => c.id)).size !== body.columns.length
    )
      throw bad("Documents ou colonnes dupliqués.");
    for (const id of body.documentIds)
      if (need("documents", id).matterId !== matter.id)
        throw bad("Un document appartient à un autre dossier.");
    const review = store.put(
      "reviews",
      { ...body, id: uid(), matterId: matter.id, createdAt: now() },
      { matter_id: matter.id },
    );
    store.log(matter.id, "Revue créée", review.title);
    res.status(201).json(review);
  });
  app.get("/api/reviews/:id", (req, res) => {
    const review = need("reviews", req.params.id);
    res.json({
      ...review,
      cells: cellsFor(review.id),
      runs: store.all("runs").filter((r) => r.reviewId === review.id),
    });
  });
  app.post("/api/reviews/:id/run", async (req, res) => {
    const review = need("reviews", req.params.id);
    if (running(review.id)) throw bad("Une revue est déjà en cours.", 409);
    if (!review.documentIds.length)
      throw bad("Ajoutez des documents dans une nouvelle revue.");
    const config = settings();
    const run = {
      id: uid(),
      reviewId: review.id,
      status: "running",
      total: review.documentIds.length * review.columns.length,
      completed: 0,
      errors: 0,
      engine: config.engine,
      createdAt: now(),
    };
    store.put("runs", run, { review_id: review.id });
    const controller = new AbortController();
    active.set(run.id, { controller, reviewId: review.id });
    res.status(202).json(run);
    const execute = async () => {
      try {
        for (const docId of review.documentIds)
          for (const column of review.columns) {
            if (controller.signal.aborted || shuttingDown)
              throw bad("Revue arrêtée.");
            const doc = need("documents", docId);
            const previous = cellsFor(review.id).find(
              (c) => c.documentId === docId && c.columnId === column.id,
            );
            if (!previous?.locked) {
              let result = extractCell(doc, column);
              if (config.engine === "ollama" && result.citations.length) {
                try {
                  const generated = await ollamaAnswer(
                    config.model,
                    column.question,
                    result.citations,
                    AbortSignal.any([
                      controller.signal,
                      AbortSignal.timeout(120000),
                    ]),
                  );
                  result = {
                    ...result,
                    value: generated.answer,
                    citations: generated.citations,
                    status: generated.citations.length
                      ? "found"
                      : "insufficient",
                    explanation:
                      "Synthèse Ollama locale. Ancrage des citations contrôlé ; portée et raisonnement à vérifier.",
                  };
                } catch (e) {
                  if (controller.signal.aborted) throw e;
                  result = {
                    value: "Analyse interrompue",
                    status: "error",
                    citations: [],
                    explanation: e.message,
                  };
                  run.errors++;
                }
              }
              const current = previous ? store.get("cells", previous.id) : null;
              if (
                !current?.locked &&
                (!previous || current.revision === previous.revision)
              ) {
                const history = previous
                  ? [
                      ...(previous.history ?? []),
                      {
                        revision: previous.revision,
                        value: previous.value,
                        citations: previous.citations,
                        decision: previous.decision,
                        updatedAt: previous.updatedAt,
                      },
                    ]
                  : [];
                store.put(
                  "cells",
                  {
                    ...previous,
                    id: previous?.id ?? uid(),
                    reviewId: review.id,
                    documentId: docId,
                    columnId: column.id,
                    ...result,
                    engine: config.engine,
                    revision: (previous?.revision ?? 0) + 1,
                    locked: false,
                    decision: "pending",
                    comments: previous?.comments ?? [],
                    history,
                    updatedAt: now(),
                  },
                  { review_id: review.id, document_id: docId },
                );
              }
            }
            run.completed++;
            store.put("runs", run, { review_id: review.id });
            await pause();
          }
        run.status = run.errors ? "partial" : "completed";
      } catch (e) {
        run.status = controller.signal.aborted ? "cancelled" : "failed";
        run.error = e.message;
      } finally {
        run.finishedAt = now();
        store.put("runs", run, { review_id: review.id });
        active.delete(run.id);
        store.log(
          review.matterId,
          "Exécution de revue",
          `${review.title} · ${run.status} · ${run.completed}/${run.total}`,
        );
      }
    };
    void execute();
  });
  app.post("/api/runs/:id/cancel", (req, res) => {
    const run = need("runs", req.params.id);
    active.get(run.id)?.controller.abort();
    res.json({ ok: true });
  });
  app.patch("/api/cells/:id", (req, res) => {
    const c = need("cells", req.params.id);
    const patch = z
      .object({
        revision: z.number().int(),
        value: z.string().max(16000).optional(),
        locked: z.boolean().optional(),
        decision: z.enum(["pending", "approved", "flagged"]).optional(),
        comment: z.string().trim().min(1).max(2000).optional(),
      })
      .parse(req.body);
    if (c.revision !== patch.revision)
      throw bad("Cette cellule a changé. Rechargez avant de modifier.", 409);
    if (c.locked && patch.value !== undefined && patch.value !== c.value)
      throw bad("Déverrouillez la cellule avant de la corriger.", 409);
    const edited = patch.value !== undefined && patch.value !== c.value;
    if (
      patch.decision === "approved" &&
      ["error", "insufficient"].includes(c.status)
    )
      throw bad(
        "Un résultat techniquement incomplet ne peut pas être approuvé.",
      );
    const updated = {
      ...c,
      value: patch.value ?? c.value,
      locked: patch.locked ?? c.locked,
      decision: edited ? "pending" : (patch.decision ?? c.decision),
      revision: c.revision + 1,
      updatedAt: now(),
      history: edited
        ? [
            ...(c.history ?? []),
            {
              revision: c.revision,
              value: c.value,
              citations: c.citations,
              decision: c.decision,
              updatedAt: c.updatedAt,
            },
          ]
        : c.history,
      comments: patch.comment
        ? [
            ...c.comments,
            {
              id: uid(),
              text: patch.comment,
              actor: "Utilisateur local",
              createdAt: now(),
            },
          ]
        : c.comments,
    };
    if (edited) updated.edited = true;
    store.put("cells", updated, {
      review_id: c.reviewId,
      document_id: c.documentId,
    });
    const review = need("reviews", c.reviewId);
    store.log(
      review.matterId,
      "Cellule modifiée",
      `${review.title} · ${c.columnId} · révision ${updated.revision}${edited ? " · correction humaine" : ""}`,
    );
    res.json(updated);
  });

  app.get("/api/matters/:id/messages", (req, res) => {
    need("matters", req.params.id);
    res.json(store.all("messages").filter((m) => m.matterId === req.params.id));
  });
  app.post("/api/matters/:id/chat", async (req, res) => {
    const matter = need("matters", req.params.id);
    const body = z
      .object({
        question: z.string().trim().min(3).max(6000),
        documentIds: z.array(text).max(100).optional(),
      })
      .parse(req.body);
    let docs = docsFor(matter.id);
    if (body.documentIds) {
      if (body.documentIds.some((id) => !docs.some((d) => d.id === id)))
        throw bad("Contexte documentaire invalide.");
      docs = docs.filter((d) => body.documentIds.includes(d.id));
    }
    if (!docs.length)
      throw bad("Ajoutez ou sélectionnez au moins un document.");
    const user = store.put(
      "messages",
      {
        id: uid(),
        matterId: matter.id,
        role: "user",
        content: body.question,
        createdAt: now(),
      },
      { matter_id: matter.id },
    );
    const sources = retrieve(docs, body.question, 8);
    const config = settings();
    let answer,
      citations = sources,
      usage;
    try {
      if (!sources.length)
        answer =
          "Aucun passage pertinent n’a été retrouvé dans le contexte sélectionné. Reformulez la question ou ajoutez la pièce utile. L’absence de résultat lexical ne prouve pas l’absence d’information.";
      else if (config.engine === "ollama")
        ({ answer, citations, usage } = await ollamaAnswer(
          config.model,
          body.question,
          sources,
          AbortSignal.timeout(120000),
        ));
      else
        answer =
          "Voici les passages retrouvés dans les documents sélectionnés. Ce mode fournit des extraits vérifiables ; il ne produit pas d’avis juridique ni de synthèse générative. Ouvrez chaque source pour lire la clause dans son contexte.";
      const message = store.put(
        "messages",
        {
          id: uid(),
          matterId: matter.id,
          role: "assistant",
          content: answer,
          citations,
          engine: config.engine,
          scope: docs.map((d) => d.id),
          partial: docs.some((d) => d.status !== "ready"),
          usage,
          createdAt: now(),
        },
        { matter_id: matter.id },
      );
      res.json({ user, message });
    } catch (e) {
      const message = store.put(
        "messages",
        {
          id: uid(),
          matterId: matter.id,
          role: "assistant",
          content: `L’analyse n’a pas abouti : ${e.message}`,
          citations: [],
          error: true,
          createdAt: now(),
        },
        { matter_id: matter.id },
      );
      res.status(502).json({ error: message.content });
    }
  });
  app.get("/api/matters/:id/notes", (req, res) => {
    need("matters", req.params.id);
    res.json(store.all("notes").filter((n) => n.matterId === req.params.id));
  });
  app.post("/api/matters/:id/notes", (req, res) => {
    const matter = need("matters", req.params.id);
    const body = z
      .object({ title: text, content: z.string().max(150000) })
      .parse(req.body);
    const note = store.put(
      "notes",
      { ...body, id: uid(), matterId: matter.id, updatedAt: now() },
      { matter_id: matter.id },
    );
    store.log(matter.id, "Note créée", note.title);
    res.status(201).json(note);
  });
  app.patch("/api/notes/:id", (req, res) => {
    const note = need("notes", req.params.id);
    const patch = z
      .object({
        title: text,
        content: z.string().max(150000),
        updatedAt: z.string(),
      })
      .parse(req.body);
    if (note.updatedAt !== patch.updatedAt)
      throw bad(
        "La note a changé dans une autre fenêtre. Rechargez avant de sauvegarder.",
        409,
      );
    const next = { ...note, ...patch, updatedAt: now() };
    store.put("notes", next, { matter_id: note.matterId });
    store.log(note.matterId, "Note enregistrée", note.title);
    res.json(next);
  });
  app.get("/api/matters/:id/audit", (req, res) => {
    need("matters", req.params.id);
    res.json(
      store
        .all("audit")
        .filter((e) => e.matterId === req.params.id)
        .reverse(),
    );
  });
  app.get("/api/settings", (req, res) => res.json(settings()));
  app.put("/api/settings", async (req, res) => {
    const body = z
      .object({
        engine: z.enum(["extractive", "ollama"]),
        model: z.string().max(180),
      })
      .parse(req.body);
    if (body.engine === "ollama") {
      if (!body.model || /cloud/i.test(body.model))
        throw bad("Choisissez un modèle local.");
      let models;
      try {
        const r = await fetch("http://127.0.0.1:11434/api/tags", {
          signal: AbortSignal.timeout(3000),
        });
        if (!r.ok) throw Error();
        models = await r.json();
      } catch {
        throw bad(
          "Ollama ne répond pas sur 127.0.0.1:11434. Démarrez-le avant de l’activer.",
        );
      }
      if (!models.models?.some((m) => m.name === body.model))
        throw bad("Ce modèle n’est pas installé dans Ollama.");
    }
    res.json(store.put("settings", { id: "local", ...body }));
  });
  app.get("/api/ollama", async (req, res) => {
    try {
      const r = await fetch("http://127.0.0.1:11434/api/tags", {
        signal: AbortSignal.timeout(2500),
      });
      if (!r.ok) throw Error();
      const data = await r.json();
      res.json({
        available: true,
        models: (data.models ?? [])
          .filter((m) => !/cloud/i.test(m.name))
          .map((m) => m.name),
      });
    } catch {
      res.json({ available: false, models: [] });
    }
  });
  app.get("/api/reviews/:id/export", async (req, res) => {
    const review = need("reviews", req.params.id);
    const cells = cellsFor(review.id);
    const docs = review.documentIds.map((id) => need("documents", id));
    if (running(review.id))
      throw bad("Attendez la fin de la revue avant d’exporter.", 409);
    const validated =
      cells.length === review.columns.length * docs.length &&
      cells.length > 0 &&
      cells.every((c) => c.decision === "approved");
    const manifest = `${validated ? "REVUE VALIDÉE LOCALEMENT" : "BROUILLON — REVUE NON TERMINÉE"} · ${now()} · ${settings().engine} · utilisateur local unique`;
    store.log(
      review.matterId,
      "Revue exportée",
      `${review.title} · ${req.query.format ?? "xlsx"} · ${validated ? "validée" : "brouillon"}`,
    );
    if (req.query.format === "docx") {
      const paragraphs = [
        new Paragraph({ text: review.title, heading: HeadingLevel.TITLE }),
        new Paragraph(manifest),
      ];
      for (const doc of docs) {
        paragraphs.push(
          new Paragraph({ text: doc.name, heading: HeadingLevel.HEADING_1 }),
        );
        for (const col of review.columns) {
          const cell = cells.find(
            (c) => c.documentId === doc.id && c.columnId === col.id,
          );
          paragraphs.push(
            new Paragraph({ text: col.title, heading: HeadingLevel.HEADING_2 }),
            new Paragraph(cell?.value ?? "Non analysé"),
          );
          for (const cite of cell?.citations ?? [])
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Source : ${doc.name} · ${cite.pageLabel} · ${cite.blockId}\n${cite.quote}`,
                    italics: true,
                  }),
                ],
              }),
            );
        }
      }
      const file = await Packer.toBuffer(
        new Document({ sections: [{ children: paragraphs }] }),
      );
      res.attachment("revue-atelier.docx").send(file);
    } else {
      const book = new ExcelJS.Workbook();
      book.creator = "Atelier juridique local";
      const sheet = book.addWorksheet("Revue");
      sheet.addRow([review.title]);
      sheet.addRow([manifest]);
      sheet.addRow([
        "Document",
        ...review.columns.map((c) => c.title),
        "Validation",
      ]);
      for (const doc of docs) {
        const rowCells = review.columns.map((col) =>
          cells.find((c) => c.documentId === doc.id && c.columnId === col.id),
        );
        sheet.addRow([
          doc.name,
          ...rowCells.map((c) => c?.value ?? "Non analysé"),
          rowCells.every((c) => c?.decision === "approved")
            ? "Validé"
            : "À revoir",
        ]);
      }
      sheet.getRow(3).font = { bold: true, color: { argb: "FFFFFFFF" } };
      sheet.getRow(3).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF24473E" },
      };
      sheet.columns.forEach((c, i) => (c.width = i === 0 ? 45 : 55));
      sheet.eachRow((r) => (r.alignment = { vertical: "top", wrapText: true }));
      sheet.views = [{ state: "frozen", ySplit: 3, xSplit: 1 }];
      const sources = book.addWorksheet("Sources et décisions");
      sources.addRow([
        "Document",
        "Question",
        "Valeur",
        "Statut",
        "Décision",
        "Révision",
        "Source (extrait exact)",
        "Repère",
        "Empreinte document",
        "Moteur",
      ]);
      for (const cell of cells) {
        const doc = docs.find((d) => d.id === cell.documentId);
        const col = review.columns.find((c) => c.id === cell.columnId);
        for (const cite of cell.citations.length ? cell.citations : [null])
          sources.addRow([
            doc.name,
            col.title,
            cell.value,
            cell.status,
            cell.decision,
            cell.revision,
            cite?.quote ?? "",
            cite ? `${cite.pageLabel} · ${cite.blockId}` : "",
            doc.hash,
            cell.engine,
          ]);
      }
      sources.columns.forEach((c) => (c.width = 35));
      sources.getRow(1).font = { bold: true };
      const buffer = await book.xlsx.writeBuffer();
      res.attachment("revue-atelier.xlsx").send(Buffer.from(buffer));
    }
  });
  app.get("/api/notes/:id/export", async (req, res) => {
    const note = need("notes", req.params.id);
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ text: note.title, heading: HeadingLevel.TITLE }),
            ...note.content.split("\n").map((t) => new Paragraph(t)),
          ],
        },
      ],
    });
    res.attachment("note-atelier.docx").send(await Packer.toBuffer(doc));
  });
  registerGeneratorRoutes(app, store, need, { today: legalClock });
  registerResearchRoutes(app, store, need);
  app.use("/api", (req, res) =>
    res.status(404).json({ error: "Route introuvable." }),
  );
  const errorHandler = (error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status =
      error instanceof z.ZodError
        ? 422
        : error instanceof multer.MulterError
          ? 413
          : (error.status ?? 500);
    if (status === 500) console.error(error);
    res.status(status).json({
      error:
        error instanceof z.ZodError
          ? error.issues
              .map((i) => `${i.path.join(".")} : ${i.message}`)
              .join(" ; ")
          : error instanceof multer.MulterError
            ? "Trop de fichiers ou fichier de plus de 25 Mo."
            : status === 500
              ? "Erreur interne. Vos données enregistrées sont conservées."
              : error.message,
    });
  };
  app.use(errorHandler);
  return {
    app,
    store,
    errorHandler,
    async close() {
      shuttingDown = true;
      for (const { controller } of active.values()) controller.abort();
      while (active.size) await pause();
      store.close();
    },
  };
}
