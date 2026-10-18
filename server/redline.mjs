import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  InsertedTextRun,
  DeletedTextRun,
  Header,
  Footer,
  PageNumber,
  AlignmentType,
} from "docx";

// Build an independent Word document from extracted text. No original formatting is claimed.
export async function comparisonWord(comparison, mode = "redline") {
  let revisionId = 0;
  const revision = () => ({
    id: ++revisionId,
    author: "Atelier · comparaison",
    date: comparison.createdAt,
  });
  const paragraphs = [];
  const runOptions = { font: "Calibri", size: 22 };
  for (const change of comparison.changes) {
    if (mode !== "redline") {
      const source = mode === "original" ? change.left : change.right;
      if (source)
        paragraphs.push(
          new Paragraph({
            children: source.quote
              .split("\n")
              .map(
                (text, i) =>
                  new TextRun({
                    ...runOptions,
                    text,
                    ...(i ? { break: 1 } : {}),
                  }),
              ),
            spacing: { after: 140 },
          }),
        );
      continue;
    }
    const children = change.tokens.operations
      .filter((op) => op.text)
      .flatMap((op) =>
        op.text.split("\n").map((text, i) => {
          const options = { ...runOptions, text, ...(i ? { break: 1 } : {}) };
          if (op.kind === "insert")
            return new InsertedTextRun({
              ...options,
              ...revision(),
              color: "1F6B42",
              underline: {},
            });
          if (op.kind === "delete")
            return new DeletedTextRun({
              ...options,
              ...revision(),
              color: "A13E39",
              strike: true,
            });
          return new TextRun(options);
        }),
      );
    // Track the paragraph mark too: rejecting an inserted paragraph, or accepting
    // a deleted paragraph, must remove that paragraph rather than leave a blank.
    const run =
      change.status === "added"
        ? { insertion: revision() }
        : change.status === "removed"
          ? { deletion: revision() }
          : undefined;
    paragraphs.push(
      new Paragraph({
        children,
        spacing: { after: 140 },
        ...(run ? { run } : {}),
      }),
    );
  }
  const document = new Document({
    title: `Comparaison ${comparison.leftName} / ${comparison.rightName}`,
    creator: "Atelier",
    description:
      "Comparaison indépendante du texte extrait. Mise en page, images et signatures non conservées.",
    features: { trackRevisions: mode === "redline" },
    customProperties: [
      { name: "Original SHA256", value: comparison.leftHash },
      { name: "Revised SHA256", value: comparison.rightHash },
    ],
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1100, right: 1100, bottom: 1100, left: 1100 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${comparison.leftName} → ${comparison.rightName}`,
                    size: 17,
                    color: "68736A",
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "Comparaison du texte extrait · ",
                    size: 16,
                    color: "68736A",
                  }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16 }),
                ],
              }),
            ],
          }),
        },
        children: paragraphs.length ? paragraphs : [new Paragraph("")],
      },
    ],
  });
  return Packer.toBuffer(document);
}
