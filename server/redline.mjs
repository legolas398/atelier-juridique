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
  UnderlineType,
  HighlightColor,
} from "docx";

// Rebuild a reviewable Word file with tracked text and supported formatting revisions.
export async function comparisonWord(comparison, mode = "redline") {
  let revisionId = 0;
  const revision = () => ({
    id: ++revisionId,
    author: "Atelier · comparaison",
    date: comparison.createdAt,
  });
  const paragraphs = [];
  const runOptions = { font: "Calibri", size: 22 };
  const runStyle = (style = {}) => ({
    ...(style.bold ? { bold: true } : {}),
    ...(style.italic ? { italics: true } : {}),
    ...(style.underline ? { underline: { type: UnderlineType.SINGLE } } : {}),
    ...(style.strike ? { strike: true } : {}),
    ...(style.smallCaps ? { smallCaps: true } : {}),
    ...(style.caps ? { allCaps: true } : {}),
    ...(style.characterSpacing ? { characterSpacing: style.characterSpacing } : {}),
    ...(style.vertical === "superscript" ? { superScript: true } : {}),
    ...(style.vertical === "subscript" ? { subScript: true } : {}),
    ...(style.font ? { font: style.font } : {}),
    ...(style.size ? { size: Math.round(style.size * 2) } : {}),
    ...(style.color && /^[\da-f]{6}$/i.test(style.color) ? { color: style.color } : {}),
    ...(style.highlight && HighlightColor[style.highlight.toUpperCase()] ? { highlight: HighlightColor[style.highlight.toUpperCase()] } : {}),
  });
  const paragraphProps = (format = {}) => ({
    ...(format.style?.toLowerCase().startsWith("heading") ? { heading: format.style.toLowerCase().includes("1") ? "Heading1" : format.style.toLowerCase().includes("2") ? "Heading2" : "Heading3" } : {}),
    ...(format.pageBreakBefore ? { pageBreakBefore: true } : {}),
    ...(format.keepNext ? { keepNext: true } : {}),
    ...(format.keepLines ? { keepLines: true } : {}),
    ...(format.widowControl ? { widowControl: true } : {}),
    ...(format.bidi ? { bidirectional: true } : {}),
    ...(format.alignment ? { alignment: ({ left: AlignmentType.LEFT, center: AlignmentType.CENTER, right: AlignmentType.RIGHT, both: AlignmentType.JUSTIFIED })[format.alignment] } : {}),
    ...((format.indentLeft || format.indentRight || format.firstLineIndent) ? { indent: { left: format.indentLeft || 0, right: format.indentRight || 0, firstLine: format.firstLineIndent || 0 } } : {}),
    ...(format.spaceBefore || format.spaceAfter || format.lineSpacing ? { spacing: { before: format.spaceBefore || 0, after: format.spaceAfter || 0, ...(format.lineSpacing ? { line: format.lineSpacing } : {}) } } : {}),
  });
  const runAt = (runs, position) => {
    let offset = 0;
    for (const run of runs) {
      const end = offset + run.text.length;
      if (position < end) return { run, end };
      offset = end;
    }
    return { run: runs.at(-1), end: position + 1 };
  };
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
                    ...runStyle(source.formatting?.runs?.[0]),
                    ...(i ? { break: 1 } : {}),
                  }),
              ),
            ...paragraphProps(source.formatting?.paragraph),
            ...(source.formatting?.paragraph?.spaceAfter == null ? { spacing: { after: 140 } } : {}),
          }),
        );
      continue;
    }
    const runFormattingChanged = change.formatChanges?.some((item) => item.area === "run");
    const sourceRuns = change.right?.formatting?.runs || [];
    const previousRuns = change.left?.formatting?.runs || [];
    let leftPosition = 0;
    let rightPosition = 0;
    const children = [];
    for (const op of change.tokens.operations.filter((item) => item.text)) {
      let cursor = 0;
      while (cursor < op.text.length) {
        const oldSpan = op.kind === "insert" ? null : runAt(previousRuns, leftPosition + cursor);
        const newSpan = op.kind === "delete" ? null : runAt(sourceRuns, rightPosition + cursor);
        const boundary = Math.min(
          op.text.length,
          oldSpan ? cursor + Math.max(1, oldSpan.end - (leftPosition + cursor)) : op.text.length,
          newSpan ? cursor + Math.max(1, newSpan.end - (rightPosition + cursor)) : op.text.length,
        );
        const segment = op.text.slice(cursor, boundary);
        segment.split("\n").forEach((text, i) => {
          const options = { ...runOptions, text, ...(i ? { break: 1 } : {}) };
          if (op.kind === "delete" && oldSpan?.run) Object.assign(options, runStyle(oldSpan.run));
          else if (newSpan?.run) Object.assign(options, runStyle(newSpan.run));
          if (op.kind === "equal" && runFormattingChanged && oldSpan?.run && newSpan?.run &&
              JSON.stringify(Object.fromEntries(Object.entries(oldSpan.run).filter(([key]) => key !== "text"))) !==
              JSON.stringify(Object.fromEntries(Object.entries(newSpan.run).filter(([key]) => key !== "text")))
          )
            options.revision = { ...runStyle(oldSpan.run), ...revision() };
          if (op.kind === "insert") children.push(new InsertedTextRun({ ...options, ...revision(), color: "1F6B42", underline: {} }));
          else if (op.kind === "delete") children.push(new DeletedTextRun({ ...options, ...revision(), color: "A13E39", strike: true }));
          else children.push(new TextRun(options));
        });
        cursor = boundary;
      }
      if (op.kind !== "insert") leftPosition += op.text.length;
      if (op.kind !== "delete") rightPosition += op.text.length;
    }
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
        ...paragraphProps((change.right || change.left)?.formatting?.paragraph),
        ...(change.formatChanges?.some((item) => item.area === "paragraph")
          ? { revision: { ...paragraphProps(change.left?.formatting?.paragraph), ...revision() } }
          : {}),
        ...((change.right || change.left)?.formatting?.paragraph?.spaceAfter == null ? { spacing: { after: 140 } } : {}),
        ...(run ? { run } : {}),
      }),
    );
  }
  const document = new Document({
    title: `Comparaison ${comparison.leftName} / ${comparison.rightName}`,
    creator: "Atelier",
    description:
      "Comparaison du texte et des mises en forme Word détectées. La mise en page complexe et les objets incorporés ne sont pas reproduits à l’identique.",
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
