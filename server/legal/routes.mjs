import { z } from "zod";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Footer,
  Header,
  PageNumber,
  AlignmentType,
} from "docx";
import {
  BUILTIN_TEMPLATES,
  commonFields,
  field,
  LEGAL_CHECKED_AT,
} from "./catalog.mjs";
import {
  draftInputSchema,
  generateDocument,
  fingerprint,
} from "./generator.mjs";
import { now, uid } from "../store.mjs";

const fail = (message, status = 400) =>
  Object.assign(Error(message), { status });
const makeTitle = (input, template) => input?.trim() || template.title;
export function registerGeneratorRoutes(
  app,
  store,
  need,
  { today = () => new Date().toISOString().slice(0, 10) } = {},
) {
  const findTemplate = (id, matterId) => {
    const template =
      BUILTIN_TEMPLATES.find((t) => t.id === id) ??
      store.get("document_models", id);
    if (!template || (template.matterId && template.matterId !== matterId))
      throw fail("Modèle introuvable dans ce dossier.", 404);
    return template;
  };
  app.get("/api/matters/:id/generator/templates", (req, res) => {
    need("matters", req.params.id);
    res.json([
      ...BUILTIN_TEMPLATES,
      ...store
        .all("document_models")
        .filter((t) => t.matterId === req.params.id),
    ]);
  });
  app.post("/api/matters/:id/generator/templates", (req, res) => {
    const matter = need("matters", req.params.id);
    const body = z
      .object({
        title: z.string().trim().min(3).max(180),
        body: z.string().trim().min(30).max(60000),
        sourceDocumentId: z.string().optional(),
      })
      .parse(req.body);
    const variables = [
      ...new Set(
        [...body.body.matchAll(/\{\{([a-z][a-z0-9_]{1,63})\}\}/g)].map(
          (m) => m[1],
        ),
      ),
    ];
    if (!variables.length || variables.length > 40)
      throw fail(
        "Le modèle doit comporter entre 1 et 40 variables au format {{nom_du_champ}}.",
      );
    if (
      /\{\{|\}\}/.test(body.body.replace(/\{\{[a-z][a-z0-9_]{1,63}\}\}/g, ""))
    )
      throw fail(
        "Variable mal formée. Utilisez des lettres minuscules, chiffres et traits de soulignement.",
      );
    let source;
    if (body.sourceDocumentId) {
      const doc = need("documents", body.sourceDocumentId);
      if (doc.matterId !== matter.id)
        throw fail("La pièce source appartient à un autre dossier.");
      source = { documentId: doc.id, name: doc.name, hash: doc.hash };
    }
    const template = {
      id: uid(),
      matterId: matter.id,
      title: body.title,
      body: body.body,
      version: fingerprint(body).slice(0, 16),
      category: "Modèle de cabinet",
      tag: "Trame fournie par vous",
      description:
        "Variables déterministes, rédaction de la trame sous votre contrôle.",
      origin: "cabinet",
      jurisdiction: "FR",
      sourceIds: [],
      source,
      createdAt: now(),
      fields: [
        ...commonFields.filter((f) => f.group === "Périmètre"),
        ...variables
          .filter((v) => !["jurisdiction", "scope"].includes(v))
          .map((v) =>
            field(v, v.replaceAll("_", " "), "Votre modèle", "textarea"),
          ),
      ],
      reviewItems: [
        {
          id: "authority",
          label:
            "Périmètre de droit français et professionnel adapté au dossier.",
        },
        {
          id: "template",
          label:
            "Texte intégral du modèle, références et clauses spécifiques relus.",
        },
        {
          id: "facts",
          label:
            "Faits, identité, chiffres, dates et pouvoir des signataires vérifiés.",
        },
      ],
    };
    store.put("document_models", template, { matter_id: matter.id });
    store.log(matter.id, "Modèle de document ajouté", template.title);
    res.status(201).json(template);
  });
  app.post("/api/matters/:id/generator/preview", (req, res) => {
    need("matters", req.params.id);
    const body = draftInputSchema.parse(req.body);
    const template = findTemplate(body.templateId, req.params.id);
    const result = generateDocument(
      template,
      body.answers,
      body.overrides,
      today(),
    );
    result.content.title = makeTitle(body.title, template);
    result.contentHash = fingerprint({ ...result, contentHash: undefined });
    res.json(result);
  });
  app.get("/api/matters/:id/generator/drafts", (req, res) => {
    need("matters", req.params.id);
    res.json(
      store
        .all("legal_drafts")
        .filter((d) => d.matterId === req.params.id)
        .map(({ history, ...d }) => ({ ...d, historyCount: history.length })),
    );
  });
  app.get("/api/generator/drafts/:id", (req, res) =>
    res.json(need("legal_drafts", req.params.id)),
  );
  function prepare(input, matterId, template) {
    const result = generateDocument(
      template,
      input.answers,
      input.overrides,
      today(),
    );
    result.content.title = makeTitle(input.title, template);
    result.contentHash = fingerprint({ ...result, contentHash: undefined });
    return result;
  }
  app.post("/api/matters/:id/generator/drafts", (req, res) => {
    const matter = need("matters", req.params.id);
    const input = draftInputSchema.parse(req.body);
    const template = findTemplate(input.templateId, matter.id);
    const result = prepare(input, matter.id, template);
    const draft = {
      id: uid(),
      matterId: matter.id,
      templateId: template.id,
      templateSnapshot: template,
      ...result,
      overrides: input.overrides,
      revision: 1,
      status: "draft",
      review: null,
      history: [],
      createdAt: now(),
      updatedAt: now(),
    };
    store.put("legal_drafts", draft, { matter_id: matter.id });
    store.log(
      matter.id,
      "Document juridique généré",
      `${draft.content.title} · ${template.version} · brouillon`,
    );
    res.status(201).json(draft);
  });
  app.put("/api/generator/drafts/:id", (req, res) => {
    const previous = need("legal_drafts", req.params.id);
    const input = draftInputSchema
      .extend({ revision: z.number().int() })
      .parse(req.body);
    if (input.revision !== previous.revision)
      throw fail(
        "Le document a changé dans une autre fenêtre. Rechargez sa dernière révision.",
        409,
      );
    if (input.templateId !== previous.templateId)
      throw fail("Un changement de modèle nécessite un nouveau document.");
    const result = prepare(input, previous.matterId, previous.templateSnapshot);
    const snapshot = {
      revision: previous.revision,
      content: previous.content,
      answers: previous.answers,
      overrides: previous.overrides,
      contentHash: previous.contentHash,
      legal: previous.legal,
      templateVersion: previous.templateSnapshot.version,
      review: previous.review,
      updatedAt: previous.updatedAt,
    };
    const next = {
      ...previous,
      ...result,
      overrides: input.overrides,
      revision: previous.revision + 1,
      review: null,
      status: "draft",
      history: [...previous.history, snapshot],
      updatedAt: now(),
    };
    if (next.history.length > 100)
      throw fail(
        "Limite de 100 révisions atteinte. Créez une nouvelle copie du document.",
      );
    store.put("legal_drafts", next, { matter_id: next.matterId });
    store.log(
      next.matterId,
      "Document juridique révisé",
      `${next.content.title} · révision ${next.revision} · relecture à refaire`,
    );
    res.json(next);
  });
  app.post("/api/generator/drafts/:id/review", (req, res) => {
    const draft = need("legal_drafts", req.params.id);
    const body = z
      .object({
        revision: z.number().int(),
        contentHash: z.string(),
        reviewer: z.string().trim().min(3).max(160),
        capacity: z.enum(["lawyer", "legal", "other"]),
        acknowledgements: z.array(z.string()).max(120),
      })
      .parse(req.body);
    if (
      body.revision !== draft.revision ||
      body.contentHash !== draft.contentHash
    )
      throw fail(
        "La relecture doit viser la révision et l’empreinte actuelles.",
        409,
      );
    const refreshed = prepare(
      {
        answers: draft.answers,
        overrides: draft.overrides,
        title: draft.content.title,
      },
      draft.matterId,
      draft.templateSnapshot,
    );
    if (refreshed.legal.blockingCount)
      throw fail(
        "La relecture finale est bloquée : " +
          refreshed.legal.issues
            .filter((i) => i.severity === "blocking")
            .map((i) => i.message)
            .join(" "),
        422,
      );
    if (refreshed.contentHash !== draft.contentHash)
      throw fail(
        "Les contrôles ont changé depuis la génération. Régénérez et relisez le document.",
        409,
      );
    const required = [
      ...draft.content.sections.map((s) => "clause:" + s.id),
      ...draft.legal.requiredReviewItems.map((c) => "check:" + c.id),
      "check:limits",
    ];
    if (required.some((id) => !body.acknowledgements.includes(id)))
      throw fail(
        "Relisez chaque clause et complétez les points de contrôle avant d’enregistrer la relecture.",
        422,
      );
    if (body.acknowledgements.some((id) => !required.includes(id)))
      throw fail("Point de relecture inconnu.", 422);
    const review = {
      reviewer: body.reviewer,
      capacity: body.capacity,
      acknowledgements: [...new Set(body.acknowledgements)],
      revision: draft.revision,
      contentHash: draft.contentHash,
      createdAt: now(),
      identityVerified: false,
    };
    const next = { ...draft, review, status: "reviewed", updatedAt: now() };
    store.put("legal_drafts", next, { matter_id: draft.matterId });
    store.log(
      draft.matterId,
      "Relecture de document enregistrée",
      `${draft.content.title} · révision ${draft.revision} · ${body.reviewer} (identité déclarative)`,
    );
    res.json(next);
  });
  app.get("/api/generator/drafts/:id/export", async (req, res) => {
    const draft = need("legal_drafts", req.params.id);
    const final = req.query.mode === "reviewed";
    if (final) {
      if (
        draft.status !== "reviewed" ||
        !draft.review ||
        draft.review.contentHash !== draft.contentHash
      )
        throw fail(
          "Enregistrez une relecture de la révision actuelle avant cet export.",
          422,
        );
      const current = prepare(
        {
          answers: draft.answers,
          overrides: draft.overrides,
          title: draft.content.title,
        },
        draft.matterId,
        draft.templateSnapshot,
      );
      if (
        current.legal.blockingCount ||
        current.contentHash !== draft.contentHash
      )
        throw fail(
          "Les références ou contrôles doivent être actualisés avant cet export.",
          422,
        );
    }
    const label = final
      ? "RELECTURE ENREGISTRÉE — SANS CERTIFICATION JURIDIQUE"
      : "PROJET — À COMPLÉTER ET RELIRE";
    const children = [
      new Paragraph({
        text: draft.content.title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 280 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: label,
            bold: true,
            color: final ? "31563C" : "9B6339",
            size: 18,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 420 },
        children: [new TextRun({
          text: `Révision ${draft.revision} · modèle ${draft.templateSnapshot.version} · droit français`,
          color: "666666",
          size: 18,
        })],
      }),
    ];
    let articleNumber = 0;
    for (const section of draft.content.sections) {
      const isStructural = ["parties", "signatures", "signature"].includes(section.id);
      const heading = isStructural || /^\s*(?:article\s+\d+|\d+(?:\.\d+)*)\b/i.test(section.title)
        ? section.title
        : `Article ${++articleNumber} — ${section.title}`;
      children.push(
        new Paragraph({
          text: heading,
          heading: HeadingLevel.HEADING_1,
          keepNext: true,
          spacing: { before: 240, after: 100 },
        }),
      );
      for (const line of section.body.split("\n"))
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line, bold: !!section.emphasis })],
          }),
        );
    }
    children.push(
      new Paragraph({
        text: "Dossier de contrôle — hors stipulations du document",
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: true,
      }),
      new Paragraph(`Empreinte de génération : ${draft.contentHash}`),
      new Paragraph(
        draft.legal.sources.length
          ? `Sources consultées le ${draft.legal.checkedAt}. Les références aident la relecture et ne constituent pas une validation juridique du contrat.`
          : "Modèle fourni par l’utilisateur : aucune vérification juridique de la trame ni de ses références par Atelier.",
      ),
    );
    for (const source of draft.legal.sources)
      children.push(
        new Paragraph({ text: source.title, heading: HeadingLevel.HEADING_2 }),
        new Paragraph(source.url),
        new Paragraph(source.note),
      );
    for (const item of draft.legal.issues)
      children.push(
        new Paragraph(
          `${item.severity === "blocking" ? "À compléter" : "Point de vigilance"} : ${item.message}`,
        ),
      );
    if (draft.review)
      children.push(
        new Paragraph(
          `Relecture déclarée par ${draft.review.reviewer}, qualité déclarée : ${draft.review.capacity}, le ${draft.review.createdAt}, révision ${draft.review.revision}. Identité et qualification non authentifiées ; il ne s’agit ni d’une signature ni d’une certification.`,
        ),
      );
    const doc = new Document({
      creator: "Atelier juridique local",
      title: draft.content.title,
      styles: {
        default: {
          document: {
            run: { font: "Cambria", size: 22 },
            paragraph: { spacing: { after: 140, line: 276 } },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              size: { width: 11906, height: 16838 },
              margin: { top: 1417, right: 1417, bottom: 1417, left: 1417, header: 708, footer: 708 },
            },
          },
          headers: {
            default: new Header({
              children: [new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({
                  text: `${draft.content.title} · Rév. ${draft.revision}`,
                  color: "777777",
                  size: 16,
                })],
              })],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: `${final ? "Relecture enregistrée" : "Projet"} · Rév. ${draft.revision} · `,
                    }),
                    new TextRun({ children: [PageNumber.CURRENT] }),
                  ],
                }),
              ],
            }),
          },
          children,
        },
      ],
    });
    store.log(
      draft.matterId,
      "Document juridique exporté",
      `${draft.content.title} · ${final ? "relecture enregistrée" : "projet"} · révision ${draft.revision}`,
    );
    res
      .attachment(
        final ? "document-relu-atelier.docx" : "projet-document-atelier.docx",
      )
      .send(await Packer.toBuffer(doc));
  });
}
