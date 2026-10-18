import { z } from "zod";
import { Document, Packer, Paragraph, HeadingLevel } from "docx";
import { uid, now } from "./store.mjs";
import { LEGAL_SOURCES } from "./legal/catalog.mjs";

const normalize = (s) =>
  s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
const words = (s) => normalize(s).match(/[\p{L}\p{N}]+/gu) || [];
const blocks = (doc) =>
  doc.pages.flatMap((p) =>
    p.blocks.map((b) => ({
      documentId: doc.id,
      documentName: doc.name,
      page: p.number,
      pageLabel: p.label,
      blockId: b.id,
      quote: b.text,
      hash: doc.hash,
      sourceType: doc.sourceType,
    })),
  );
const synonyms = {
  resiliation: ["rupture", "preavis"],
  responsabilite: ["plafond", "indemnisation"],
  paiement: ["reglement", "facture", "echeance"],
  confidentialite: ["secret", "divulgation"],
  competence: ["tribunal", "juridiction"],
};
const stop = new Set([
  "de",
  "du",
  "des",
  "le",
  "la",
  "les",
  "un",
  "une",
  "et",
  "ou",
  "dans",
  "pour",
  "est",
  "sur",
  "en",
  "a",
  "au",
  "aux",
  "quel",
  "quelle",
  "quels",
  "quelles",
  "il",
  "que",
  "qui",
]);

export function searchEvidence(
  items,
  query,
  { mode = "all", limit = 40 } = {},
) {
  const phrases = [...query.matchAll(/"([^"]+)"/g)].map((m) => normalize(m[1]));
  const excluded = [...query.matchAll(/(?:^|\s)-([\p{L}\p{N}]+)/gu)].map((m) =>
    normalize(m[1]),
  );
  const terms = [
    ...new Set(
      words(
        query.replace(/"[^"]+"/g, "").replace(/(?:^|\s)-[\p{L}\p{N}]+/gu, ""),
      ).filter((t) => t.length > 1 && !stop.has(t)),
    ),
  ];
  if (!terms.length && !phrases.length) return [];
  const expanded = terms.flatMap((t) => synonyms[t] || []);
  const indexed = items.map((item) => ({
    item,
    tokens: words(item.quote),
    text: normalize(item.quote),
  }));
  const average =
    indexed.reduce((n, r) => n + r.tokens.length, 0) /
    Math.max(1, indexed.length);
  const frequencies = new Map(
    [...terms, ...expanded].map((t) => [
      t,
      indexed.filter((r) => r.tokens.includes(t)).length,
    ]),
  );
  return indexed
    .flatMap(({ item, tokens, text }) => {
      const set = new Set(tokens);
      if (
        excluded.some((t) => set.has(t)) ||
        phrases.some((p) => !text.includes(p))
      )
        return [];
      const matched = terms.filter((t) => set.has(t));
      const related = expanded.filter((t) => set.has(t));
      if (mode === "all" && matched.length !== terms.length) return [];
      if (!phrases.length && !matched.length && !related.length) return [];
      const score = [...matched, ...related].reduce((s, t) => {
        const tf = tokens.filter((w) => w === t).length;
        const idf = Math.log(
          1 +
            (items.length - frequencies.get(t) + 0.5) /
              (frequencies.get(t) + 0.5),
        );
        return (
          s +
          ((idf * tf * 2.2) /
            (tf +
              1.2 * (0.25 + (0.75 * tokens.length) / Math.max(1, average)))) *
            (terms.includes(t) ? 1 : 0.35)
        );
      }, phrases.length * 5);
      return [
        { ...item, score: Math.round(score * 1000) / 1000, matched, related },
      ];
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function compareDocuments(left, right) {
  const a = blocks(left),
    b = blocks(right);
  if (a.length * b.length > 1000000)
    throw Object.assign(
      new Error(
        "Comparaison limitée à un million de paires de paragraphes. Scindez les documents.",
      ),
      { status: 422 },
    );
  // Exact paragraph anchors, followed by positional pairing inside changed spans.
  const dp = Array.from(
    { length: a.length + 1 },
    () => new Uint16Array(b.length + 1),
  );
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] =
        a[i].quote === b[j].quote
          ? 1 + dp[i + 1][j + 1]
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const anchors = [];
  let i = 0,
    j = 0;
  while (i < a.length && j < b.length) {
    if (a[i].quote === b[j].quote) {
      anchors.push([i++, j++]);
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  anchors.push([a.length, b.length]);
  const changes = [];
  let ai = 0,
    bi = 0;
  const add = (l, r, status) => {
    const numberPattern = /\d+(?:[.,]\d+)?(?:\s*(?:€|%|jours?|mois|ans?))?/g;
    const flags = [];
    if (
      status !== "unchanged" &&
      JSON.stringify(l?.quote.match(numberPattern) || []) !==
        JSON.stringify(r?.quote.match(numberPattern) || [])
    )
      flags.push("Chiffres ou délais modifiés");
    if (
      status !== "unchanged" &&
      /\b(ne|pas|sauf|interdit|obligation|responsabilit|résili)/i.test(
        (l?.quote || "") + " " + (r?.quote || ""),
      )
    )
      flags.push("Portée de clause à vérifier");
    changes.push({
      id: uid(),
      status,
      left: l || null,
      right: r || null,
      flags,
      decision: "pending",
      comment: "",
      tokens: tokenDiff(l?.quote || "", r?.quote || ""),
    });
  };
  for (const [x, y] of anchors) {
    while (ai < x || bi < y) {
      const l = ai < x ? a[ai++] : null,
        r = bi < y ? b[bi++] : null;
      add(l, r, l && r ? "modified" : l ? "removed" : "added");
    }
    if (x < a.length) {
      add(a[x], b[y], "unchanged");
      ai = x + 1;
      bi = y + 1;
    }
  }
  return changes;
}

export function tokenDiff(left, right) {
  const a = left.match(/\s+|[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) || [];
  const b = right.match(/\s+|[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) || [];
  if (a.length * b.length > 160000)
    return {
      left: [{ text: left, changed: left !== right }],
      right: [{ text: right, changed: left !== right }],
    };
  const dp = Array.from(
    { length: a.length + 1 },
    () => new Uint16Array(b.length + 1),
  );
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] =
        a[i] === b[j]
          ? 1 + dp[i + 1][j + 1]
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const result = { left: [], right: [] };
  let i = 0,
    j = 0;
  const append = (side, text, changed) => {
    const last = result[side].at(-1);
    if (last?.changed === changed) last.text += text;
    else result[side].push({ text, changed });
  };
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      append("left", a[i++], false);
      append("right", b[j++], false);
    } else if (i < a.length && (j === b.length || dp[i + 1][j] >= dp[i][j + 1]))
      append("left", a[i++], true);
    else append("right", b[j++], true);
  }
  return result;
}

export function registerResearchRoutes(app, store, need) {
  const matterItems = (table, id) =>
    store.all(table).filter((x) => x.matterId === id);
  app.get("/api/matters/:id/research", (req, res) => {
    need("matters", req.params.id);
    res.json({
      references: matterItems("legal_references", req.params.id),
      searches: matterItems("research_sessions", req.params.id),
      comparisons: matterItems("comparisons", req.params.id),
      guides: Object.values(LEGAL_SOURCES),
      connectors: [
        {
          name: "Légifrance",
          status: "external",
          url: "https://www.legifrance.gouv.fr/",
          description:
            "Recherche sur le site officiel ; API PISTE non configurée.",
        },
        {
          name: "Judilibre",
          status: "external",
          url: "https://www.courdecassation.fr/recherche-judilibre",
          description: "Recherche sur le site officiel ; API non configurée.",
        },
        {
          name: "EUR-Lex",
          status: "external",
          url: "https://eur-lex.europa.eu/homepage.html?locale=fr",
          description:
            "Recherche sur le site officiel ; service web non configuré.",
        },
      ],
    });
  });
  const referenceSchema = z.object({
    title: z.string().trim().min(3).max(300),
    text: z.string().trim().min(30).max(150000),
    url: z.url().refine((v) => /^https:\/\//.test(v), "URL HTTPS requise"),
    jurisdiction: z.enum(["FR", "EU"]),
    kind: z.enum(["legislation", "jurisprudence", "doctrine", "internal"]),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .default(""),
    validUntil: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .default(""),
  });
  app.post("/api/matters/:id/references", (req, res) => {
    need("matters", req.params.id);
    const data = referenceSchema.parse(req.body);
    for (const key of ["date", "validUntil"])
      if (
        data[key] &&
        (Number.isNaN(Date.parse(data[key])) ||
          new Date(data[key]).toISOString().slice(0, 10) !== data[key])
      )
        throw Object.assign(new Error("Date invalide."), { status: 422 });
    const ref = {
      ...data,
      id: uid(),
      matterId: req.params.id,
      createdAt: now(),
      verification:
        "Texte et métadonnées fournis par l’utilisateur ; non vérifiés automatiquement.",
    };
    if (ref.date && ref.validUntil && ref.validUntil <= ref.date)
      throw Object.assign(
        new Error("La fin de vigueur doit être postérieure au début."),
        { status: 422 },
      );
    store.put("legal_references", ref, { matter_id: ref.matterId });
    store.log(ref.matterId, "Référence ajoutée", ref.title);
    res.status(201).json(ref);
  });
  app.delete("/api/references/:id", (req, res) => {
    const ref = need("legal_references", req.params.id);
    store.transaction(() => {
      store.db.prepare("DELETE FROM legal_references WHERE id=?").run(ref.id);
      for (const s of matterItems("research_sessions", ref.matterId))
        if (s.results.some((r) => r.referenceId === ref.id))
          store.db
            .prepare("DELETE FROM research_sessions WHERE id=?")
            .run(s.id);
      store.log(ref.matterId, "Référence supprimée", ref.title);
    });
    res.json({ ok: true });
  });
  app.post("/api/matters/:id/research", (req, res) => {
    need("matters", req.params.id);
    const input = z
      .object({
        query: z.string().trim().min(2).max(2000),
        corpus: z.enum(["documents", "references"]),
        mode: z.enum(["all", "any"]).default("all"),
        documentIds: z.array(z.string()).max(100).optional(),
        jurisdiction: z.enum(["all", "FR", "EU"]).default("all"),
        kind: z
          .enum(["all", "legislation", "jurisprudence", "doctrine", "internal"])
          .default("all"),
        asOf: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
      })
      .parse(req.body);
    if (
      input.asOf &&
      (Number.isNaN(Date.parse(input.asOf)) ||
        new Date(input.asOf).toISOString().slice(0, 10) !== input.asOf)
    )
      throw Object.assign(new Error("Date invalide."), { status: 422 });
    let items = [],
      examined = 0;
    if (input.corpus === "documents") {
      const docs = matterItems("documents", req.params.id);
      if (input.documentIds?.some((id) => !docs.some((d) => d.id === id)))
        throw Object.assign(new Error("Document hors du dossier."), {
          status: 422,
        });
      const selected = docs.filter(
        (d) => !input.documentIds || input.documentIds.includes(d.id),
      );
      examined = selected.length;
      items = selected.flatMap(blocks);
    } else {
      const refs = matterItems("legal_references", req.params.id).filter(
        (r) =>
          (input.jurisdiction === "all" ||
            r.jurisdiction === input.jurisdiction) &&
          (input.kind === "all" || r.kind === input.kind) &&
          (!input.asOf ||
            ((!r.date || r.date <= input.asOf) &&
              (!r.validUntil || r.validUntil > input.asOf))),
      );
      examined = refs.length;
      items = refs.flatMap((r) =>
        r.text
          .split(/\n\s*\n/)
          .filter(Boolean)
          .map((quote, i) => ({
            referenceId: r.id,
            documentName: r.title,
            quote,
            url: r.url,
            jurisdiction: r.jurisdiction,
            kind: r.kind,
            date: r.date,
            validUntil: r.validUntil,
            blockId: `ref-${i + 1}`,
            verification: r.verification,
          })),
      );
    }
    const results = searchEvidence(items, input.query, { mode: input.mode });
    const session = {
      id: uid(),
      matterId: req.params.id,
      ...input,
      results,
      examined,
      blocksExamined: items.length,
      createdAt: now(),
      bookmarks: [],
      limitations:
        "Classement lexical BM25 avec synonymes limités. Aucun contrôle exhaustif du droit applicable ni recherche externe exécutée. Absence de résultat ≠ absence de règle. Les dates des références sont déclaratives.",
    };
    store.put("research_sessions", session, { matter_id: session.matterId });
    store.log(session.matterId, "Recherche enregistrée", input.query);
    res.json(session);
  });
  app.patch("/api/research/:id/bookmarks", (req, res) => {
    const s = need("research_sessions", req.params.id);
    const { bookmarks } = z
      .object({ bookmarks: z.array(z.number().int().nonnegative()).max(40) })
      .parse(req.body);
    if (bookmarks.some((i) => i >= s.results.length))
      throw Object.assign(new Error("Résultat invalide."), { status: 422 });
    s.bookmarks = [...new Set(bookmarks)];
    store.put("research_sessions", s, { matter_id: s.matterId });
    res.json(s);
  });
  app.post("/api/matters/:id/comparisons", (req, res) => {
    need("matters", req.params.id);
    const input = z
      .object({ leftId: z.string(), rightId: z.string() })
      .parse(req.body);
    const l = need("documents", input.leftId),
      r = need("documents", input.rightId);
    if (
      l.matterId !== req.params.id ||
      r.matterId !== req.params.id ||
      l.id === r.id
    )
      throw Object.assign(
        new Error("Choisissez deux documents distincts de ce dossier."),
        { status: 422 },
      );
    const comparison = {
      id: uid(),
      matterId: req.params.id,
      leftId: l.id,
      rightId: r.id,
      leftName: l.name,
      rightName: r.name,
      leftHash: l.hash,
      rightHash: r.hash,
      createdAt: now(),
      revision: 1,
      changes: compareDocuments(l, r),
      warnings: [...l.warnings, ...r.warnings],
      method:
        "Différences textuelles par paragraphes et ancres exactes. Les paragraphes modifiés sont appariés par position ; les déplacements peuvent apparaître comme ajouts et suppressions. Mise en page, images et signatures non comparées.",
    };
    store.put("comparisons", comparison, { matter_id: comparison.matterId });
    store.log(
      comparison.matterId,
      "Comparaison créée",
      `${l.name} → ${r.name}`,
    );
    res.status(201).json(comparison);
  });
  app.patch("/api/comparisons/:id", (req, res) => {
    const c = need("comparisons", req.params.id);
    const input = z
      .object({
        revision: z.number().int(),
        changeId: z.string(),
        decision: z.enum(["pending", "accepted", "flagged"]),
        comment: z.string().max(4000),
      })
      .parse(req.body);
    if (c.revision !== input.revision)
      throw Object.assign(
        new Error("La comparaison a été modifiée. Rechargez-la."),
        { status: 409 },
      );
    const change = c.changes.find((x) => x.id === input.changeId);
    if (!change)
      throw Object.assign(new Error("Écart introuvable."), { status: 404 });
    Object.assign(change, { decision: input.decision, comment: input.comment });
    c.revision++;
    store.put("comparisons", c, { matter_id: c.matterId });
    store.log(c.matterId, "Écart annoté", change.decision);
    res.json(c);
  });
  app.get("/api/:type/:id/evidence.docx", async (req, res) => {
    const table = { comparisons: "comparisons", research: "research_sessions" }[
      req.params.type
    ];
    if (!table) return res.status(404).json({ error: "Export introuvable." });
    const item = need(table, req.params.id);
    const title =
      table === "comparisons"
        ? `${item.leftName} → ${item.rightName}`
        : item.query;
    const lines =
      table === "comparisons"
        ? [
            item.method,
            ...item.warnings,
            ...item.changes.flatMap((c) => [
              `${c.status} · ${c.decision}`,
              `Avant : ${c.left?.quote || "∅"}`,
              `Après : ${c.right?.quote || "∅"}`,
              `Sources : ${c.left?.documentName || ""} ${c.left?.blockId || ""} SHA256 ${item.leftHash} / ${c.right?.documentName || ""} ${c.right?.blockId || ""} SHA256 ${item.rightHash}`,
              c.comment,
            ]),
          ]
        : [
            item.limitations,
            `${item.examined} sources · ${item.blocksExamined} passages examinés · ${item.createdAt}`,
            ...(item.bookmarks.length
              ? item.bookmarks.map((i) => item.results[i])
              : item.results
            ).flatMap((r) => [
              r.documentName,
              r.quote,
              r.url || `${r.pageLabel} · ${r.blockId} · SHA256 ${r.hash}`,
              r.verification || "",
            ]),
          ];
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
            ...lines.map((text) => new Paragraph(text)),
          ],
        },
      ],
    });
    res.attachment("dossier-preuves.docx").send(await Packer.toBuffer(doc));
  });
}
