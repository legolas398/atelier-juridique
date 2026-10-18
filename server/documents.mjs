import { createHash } from "node:crypto";
import mammoth from "mammoth";
import JSZip from "jszip";
import { uid, now } from "./store.mjs";

export function makePages(text, label = "Texte extrait") {
  return [
    {
      number: 1,
      label,
      blocks: text
        .split(/\n\s*\n/)
        .map((t) => t.trim())
        .filter(Boolean)
        .map((text, i) => ({ id: `b-${i + 1}`, text })),
    },
  ];
}

const xmlText = (value) => value
  .replace(/<w:tab\b[^>]*\/>/g, "\t").replace(/<w:br\b[^>]*\/>/g, "\n")
  .replace(/<\/w:p>/g, "\n\n").replace(/<[^>]+>/g, "")
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));

// Preserve explicit DOCX paragraph and run formatting alongside extracted text.
async function wordFormatting(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const file = zip.file("word/document.xml");
  if (!file) return [];
  const xml = await file.async("string");
  return [...xml.matchAll(/<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g)].map(([, paragraph]) => {
    const pPr = paragraph.match(/<w:pPr(?:\s[^>]*)?>([\s\S]*?)<\/w:pPr>/)?.[1] || "";
    const attr = (tag, name = "val") => pPr.match(new RegExp(`<w:${tag}\\b[^>]*\\bw:${name}="([^"]+)"`))?.[1] || "";
    const runs = [...paragraph.matchAll(/<w:r(?:\s[^>]*)?>([\s\S]*?)<\/w:r>/g)].map(([, run]) => {
      const rPr = run.match(/<w:rPr(?:\s[^>]*)?>([\s\S]*?)<\/w:rPr>/)?.[1] || "";
      const value = (tag, name = "val") => rPr.match(new RegExp(`<w:${tag}\\b[^>]*\\bw:${name}="([^"]+)"`))?.[1] || "";
      const on = (tag) => {
        const element = rPr.match(new RegExp(`<w:${tag}\\b([^>]*)/?>`))?.[1] || "";
        const value = element.match(/w:val="([^"]+)"/)?.[1];
        return !!element && !["0", "false", "off", "none"].includes(value);
      };
      const text = xmlText(run).replace(/\n/g, "");
      return { text, ...(on("b") ? { bold: true } : {}), ...(on("i") ? { italic: true } : {}), ...(on("u") ? { underline: true } : {}), ...(on("strike") ? { strike: true } : {}), ...(value("rFonts", "ascii") ? { font: value("rFonts", "ascii") } : {}), ...(value("sz") ? { size: Number(value("sz")) / 2 } : {}), ...(value("color") ? { color: value("color") } : {}), ...(value("highlight") ? { highlight: value("highlight") } : {}), ...(value("vertAlign") ? { vertical: value("vertAlign") } : {}), ...(on("smallCaps") ? { smallCaps: true } : {}), ...(on("caps") ? { caps: true } : {}), ...(value("spacing") ? { characterSpacing: Number(value("spacing")) } : {}) };
    }).filter((run) => run.text);
    const numbering = pPr.match(/<w:numPr[^>]*>([\s\S]*?)<\/w:numPr>/)?.[1] || "";
    return {
      text: xmlText(paragraph).trim(),
      paragraph: { ...(attr("pStyle") ? { style: attr("pStyle") } : {}), ...(attr("jc") ? { alignment: attr("jc") } : {}), ...(attr("outlineLvl") ? { outlineLevel: Number(attr("outlineLvl")) } : {}), ...(attr("ind", "left") ? { indentLeft: Number(attr("ind", "left")) } : {}), ...(attr("ind", "right") ? { indentRight: Number(attr("ind", "right")) } : {}), ...(attr("ind", "firstLine") ? { firstLineIndent: Number(attr("ind", "firstLine")) } : {}), ...(attr("spacing", "before") ? { spaceBefore: Number(attr("spacing", "before")) } : {}), ...(attr("spacing", "after") ? { spaceAfter: Number(attr("spacing", "after")) } : {}), ...(attr("spacing", "line") ? { lineSpacing: Number(attr("spacing", "line")) } : {}), ...(numbering ? { list: `${numbering.match(/w:numId="([^"]+)"/)?.[1] || ""}:${numbering.match(/w:ilvl="([^"]+)"/)?.[1] || "0"}` } : {}), ...["pageBreakBefore", "keepNext", "keepLines", "widowControl", "contextualSpacing", "bidi"].filter((tag) => new RegExp(`<w:${tag}(?:\\s[^>]*)?\\s*/>`).test(pPr)).reduce((out, tag) => ({ ...out, [tag]: true }), {}) },
      runs,
      objects: (paragraph.match(/<w:(?:drawing|pict|object)\b/g) || []).length,
    };
  });
}
export async function parseDocument(file, matterId) {
  const name = file.originalname.replace(/[\x00-\x1f]/g, "").slice(0, 180);
  const ext = name.split(".").pop().toLowerCase();
  let pages,
    type,
    warnings = [];
  if (ext === "pdf") {
    if (!file.buffer.subarray(0, 5).equals(Buffer.from("%PDF-")))
      throw new Error("Ce fichier ne contient pas un PDF valide.");
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const task = getDocument({
      data: new Uint8Array(file.buffer),
      useSystemFonts: true,
      isEvalSupported: false,
    });
    try {
      const pdf = await task.promise;
      if (pdf.numPages > 100)
        throw new Error("Limite locale : 100 pages par document.");
      pages = [];
      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n);
        const content = await page.getTextContent();
        let text = "",
          lastY;
        for (const item of content.items) {
          if (!("str" in item)) continue;
          const y = item.transform?.[5];
          if (lastY !== undefined && Math.abs(y - lastY) > 16) text += "\n\n";
          text += item.str + (item.hasEOL ? "\n" : " ");
          lastY = y;
        }
        const pageText = text.trim();
        if (pageText.length < 30)
          warnings.push(
            `Page ${n} sans texte exploitable : OCR requis, non inclus dans cette version.`,
          );
        pages.push({
          ...makePages(pageText)[0],
          number: n,
          label: `Page ${n}`,
          blocks: makePages(pageText)[0].blocks.map((b) => ({
            ...b,
            id: `p${n}-${b.id}`,
          })),
        });
      }
    } finally {
      await task.destroy();
    }
    type = "pdf";
  } else if (ext === "docx") {
    if (file.buffer.subarray(0, 2).toString() !== "PK")
      throw new Error("Document Word invalide. Utilisez un fichier DOCX.");
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    pages = makePages(result.value, "Texte Word · pagination non conservée");
    const formatting = await wordFormatting(file.buffer);
    let paragraphIndex = 0;
    for (const page of pages)
      for (const block of page.blocks) {
        const key = (value) => value.replace(/\s+/g, " ").trim();
        while (paragraphIndex < formatting.length && key(formatting[paragraphIndex].text) !== key(block.text)) paragraphIndex++;
        const details = formatting[paragraphIndex++];
        if (details) block.formatting = details;
      }
    warnings = result.messages.map((m) => m.message);
    type = "docx";
  } else if (["txt", "md"].includes(ext)) {
    if (file.buffer.includes(0))
      throw new Error(
        "Encodage non pris en charge. Enregistrez le texte en UTF-8.",
      );
    pages = makePages(
      new TextDecoder("utf-8", { fatal: true }).decode(file.buffer),
    );
    type = "text";
  } else
    throw new Error("Formats acceptés : PDF texte, DOCX, TXT et Markdown.");
  const text = pages.flatMap((p) => p.blocks.map((b) => b.text)).join("\n\n");
  if (text.length > 800000)
    throw new Error(
      "Document trop volumineux après extraction (800 000 caractères maximum).",
    );
  if (!text.trim())
    warnings.push(
      "Aucun texte extrait. Ajoutez une version OCR pour lancer une revue.",
    );
  return {
    id: uid(),
    matterId,
    name,
    type,
    sourceType: "primary",
    size: file.size,
    hash: createHash("sha256").update(file.buffer).digest("hex"),
    pages,
    text,
    warnings,
    status: !text.trim()
      ? "needs_ocr"
      : warnings.some((w) => w.includes("OCR requis"))
        ? "partial"
        : "ready",
    createdAt: now(),
  };
}
