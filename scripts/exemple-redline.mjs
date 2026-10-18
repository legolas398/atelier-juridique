import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { Document, Packer, Paragraph } from "docx";
import { makePages } from "../server/documents.mjs";
import { compareDocuments } from "../server/research.mjs";
import { comparisonWord } from "../server/redline.mjs";

const versions = [
  [
    "EXEMPLE FICTIF — COMPARAISON ATELIER",
    "Article 1. Le contrat est conclu pour douze mois.",
    "Article 2. Le préavis de non-renouvellement est de trente jours.",
    "Article 3. Le prix de la mission est fixé à 10 000 euros HT.",
    "Article 4. Le contrat ne peut être transféré à un tiers.",
  ],
  [
    "EXEMPLE FICTIF — COMPARAISON ATELIER",
    "Article 1. Le contrat est conclu pour vingt-quatre mois.",
    "Article 2. Le préavis de non-renouvellement est de soixante jours.",
    "Article 3. Le prix de la mission est fixé à 12 500 euros HT.",
    "Article 5. Les parties conviennent d’une réunion de suivi trimestrielle.",
  ],
];
const directory = fileURLToPath(
  new URL("../test-results/exemple-redline/", import.meta.url),
);
await mkdir(directory, { recursive: true });
const documents = [];
for (const [index, paragraphs] of versions.entries()) {
  const name = index ? "version-revisee.docx" : "version-originale.docx";
  const buffer = await Packer.toBuffer(
    new Document({
      sections: [{ children: paragraphs.map((text) => new Paragraph(text)) }],
    }),
  );
  await writeFile(join(directory, name), buffer);
  documents.push({
    id: `demo-${index}`,
    name,
    hash: createHash("sha256").update(buffer).digest("hex"),
    sourceType: "primary",
    pages: makePages(paragraphs.join("\n\n")),
    warnings: [],
  });
}
const comparison = {
  leftName: documents[0].name,
  rightName: documents[1].name,
  leftHash: documents[0].hash,
  rightHash: documents[1].hash,
  createdAt: new Date().toISOString(),
  changes: compareDocuments(...documents),
};
await writeFile(
  join(directory, "comparaison-redline.docx"),
  await comparisonWord(comparison),
);
console.log(
  `Exemple fictif : deux versions et un Word redline dans ${directory}`,
);
