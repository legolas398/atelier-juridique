import { createHash } from "node:crypto";
import mammoth from "mammoth";
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
