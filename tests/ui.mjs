import { JSDOM } from "jsdom";
import assert from "node:assert/strict";
import { mkdtemp, rm, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApplication } from "../server/app.mjs";
import { Document, Packer, Paragraph } from "docx";

// Test DOM + React + vraies API/SQLite. Ceci n'est pas un test visuel Chromium.
const directory = await mkdtemp(join(tmpdir(), "atelier-ui-"));
const instance = createApplication({
  dataDir: directory,
  legalClock: () => "2026-10-18",
});
const server = instance.app.listen(0, "127.0.0.1");
await new Promise((r) => server.once("listening", r));
const base = `http://127.0.0.1:${server.address().port}`;
const dom = new JSDOM(
  '<!doctype html><html><body><div id="root"></div></body></html>',
  { url: base, pretendToBeVisual: true },
);
const NativeFormData = globalThis.FormData,
  NativeFile = globalThis.File,
  nativeFetch = globalThis.fetch;
for (const key of [
  "window",
  "document",
  "HTMLElement",
  "HTMLDialogElement",
  "Event",
  "MouseEvent",
  "KeyboardEvent",
  "localStorage",
])
  Object.defineProperty(globalThis, key, {
    value: dom.window[key],
    configurable: true,
    writable: true,
  });
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
dom.window.HTMLElement.prototype.scrollIntoView = function () {};
const downloads = [];
dom.window.HTMLAnchorElement.prototype.click = function () {
  downloads.push(this.href);
};
dom.window.HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
};
dom.window.HTMLDialogElement.prototype.close = function () {
  this.removeAttribute("open");
};
globalThis.FormData = class extends NativeFormData {
  constructor(form) {
    super();
    if (form)
      for (const control of form.elements)
        if (control.name && !control.disabled)
          this.append(control.name, control.value);
  }
};
globalThis.fetch = (url, options) =>
  nativeFetch(
    typeof url === "string" && url.startsWith("/") ? base + url : url,
    options,
  );
const { createRoot } = await import("react-dom/client");
const React = await import("react");
const { default: App } = await import("../test-results/ui/App.js");
const root = createRoot(document.getElementById("root"));
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, label) {
  for (let i = 0; i < 150; i++) {
    const result = fn();
    if (result) return result;
    await delay(30);
  }
  throw Error(
    `Délai dépassé : ${label}\n${document.body.textContent.slice(-1500)}`,
  );
}
const button = (label, rootNode = document) =>
  [...rootNode.querySelectorAll("button")].find(
    (b) => b.textContent.trim() === label && !b.disabled,
  );
const click = async (label) =>
  (await until(() => button(label), `bouton ${label}`)).click();
function fill(element, value) {
  const prototype =
    element.tagName === "TEXTAREA"
      ? dom.window.HTMLTextAreaElement.prototype
      : element.tagName === "SELECT"
        ? dom.window.HTMLSelectElement.prototype
        : dom.window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value").set.call(element, value);
  element.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  element.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
}
try {
  root.render(React.createElement(App));
  await until(
    () =>
      document.querySelector("h1")?.textContent.includes("Le fond du dossier"),
    "accueil",
  );
  assert.ok(document.body.textContent.includes("Maison Rivage"));
  await click("Comparer");
  await until(
    () => document.querySelectorAll(".compare-slot select").length === 2,
    "sélecteurs de comparaison",
  );
  for (const [side, name, texts] of [
    [
      "left",
      "ui-original.docx",
      [
        "Contrat fictif UI",
        "Préavis : 30 jours.",
        "Confidentialité maintenue.",
      ],
    ],
    [
      "right",
      "ui-revised.docx",
      [
        "Contrat fictif UI",
        "Préavis : 60 jours.",
        "Confidentialité maintenue.",
        "Annexe ajoutée.",
      ],
    ],
  ]) {
    const input = document.querySelector(
      `.compare-slot.${side} input[type=file]`,
    );
    const buffer = await Packer.toBuffer(
      new Document({
        sections: [{ children: texts.map((t) => new Paragraph(t)) }],
      }),
    );
    Object.defineProperty(input, "files", {
      value: [
        new NativeFile([buffer], name, {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }),
      ],
      configurable: true,
    });
    input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    await until(
      () =>
        document.querySelector(`.compare-slot.${side} .compare-dropzone strong`)
          ?.textContent === name,
      `import ${side}`,
    );
  }
  await click("Comparer les versions");
  await until(
    () => document.querySelector(".comparison-row"),
    "comparaison affichée",
  );
  assert.ok(document.querySelector(".compare-redline-text del"));
  assert.ok(document.querySelector(".compare-redline-text ins"));
  await click("Télécharger le Word redline");
  assert.match(downloads.at(-1), /\/word\?mode=redline$/);
  assert.equal((await nativeFetch(downloads.at(-1))).status, 200);
  await click("Côte à côte");
  await until(
    () => document.querySelector(".comparison-columns"),
    "lecture côte à côte",
  );
  await click("Redline");
  const changeForm = document.querySelector(".change-review");
  fill(changeForm.querySelector("select"), "flagged");
  fill(changeForm.querySelector("input"), "Clause à vérifier dans le test");
  await delay(50);
  await click("Enregistrer la décision");
  await until(
    () => instance.store.all("comparisons")[0]?.revision === 2,
    "décision persistée",
  );
  fill(
    document.querySelector(".change-review input"),
    "Note conservée après filtrage et navigation.",
  );
  await delay(50);
  const compareFilter = document.querySelector(
    '[aria-label="Filtrer les différences"]',
  );
  fill(compareFilter, "unchanged");
  await delay(50);
  fill(compareFilter, "changed");
  await until(
    () =>
      document.querySelector(".change-review input")?.value ===
      "Note conservée après filtrage et navigation.",
    "commentaire conservé après filtrage",
  );
  await click("Recherche juridique");
  const researchInput = await until(
    () => document.querySelector(".research-query input"),
    "recherche juridique",
  );
  assert.equal(instance.store.all("comparisons")[0].revision, 3);
  fill(researchInput, "responsabilité");
  await delay(50);
  await click("Lancer la recherche");
  await until(
    () => document.querySelector(".research-result"),
    "passages de recherche",
  );
  await click("Conserver ce passage");
  await until(
    () => instance.store.all("research_sessions")[0]?.bookmarks.length === 1,
    "passage conservé",
  );
  await click("Revue tabulaire");
  await until(
    () =>
      document.querySelectorAll(".grid-cell").length === 15 &&
      !document.querySelector(".grid-cell").disabled,
    "grille initiale",
  );
  document.querySelector(".grid-cell").click();
  await until(() => document.querySelector(".cell-drawer"), "panneau cellule");
  fill(
    document.querySelector("#cell-value"),
    "Correction vérifiée dans le test UI",
  );
  await delay(50);
  await click("Enregistrer la correction");
  await until(
    () => button("Enregistrer la correction") === undefined,
    "correction enregistrée",
  );
  await click("Verrouiller");
  await until(() => button("Déverrouiller"), "verrouillage");
  await click("Valider cette révision");
  await until(() => button("Retirer la validation"), "validation");
  document.querySelector(".cell-drawer .citation").click();
  await until(
    () => document.querySelector(".highlighted-block"),
    "source surlignée",
  );
  document.querySelector("dialog .icon-button").click();
  document.querySelector('[aria-label="Fermer la cellule"]').click();
  await click("Nouveau dossier");
  await until(
    () => document.querySelector("input[name=title]"),
    "formulaire dossier",
  );
  fill(document.querySelector("input[name=title]"), "Dossier UI synthétique");
  await delay(40);
  document
    .querySelector("dialog form")
    .dispatchEvent(
      new dom.window.Event("submit", { bubbles: true, cancelable: true }),
    );
  await until(() => !document.querySelector("dialog"), "création dossier");
  await until(
    () =>
      document
        .querySelector(".breadcrumb")
        ?.textContent.includes("Dossier UI synthétique"),
    "nouveau dossier",
  );
  await click("Documents0");
  const fileInput = document.querySelector("input[type=file]");
  Object.defineProperty(fileInput, "files", {
    value: [
      new NativeFile(
        [
          "CONTRAT FICTIF\n\nDurée\nLa durée est de quatre ans.\n\nPréavis\nLe préavis est de trente jours.",
        ],
        "ui-contrat.txt",
        { type: "text/plain" },
      ),
    ],
    configurable: true,
  });
  fileInput.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  await until(
    () =>
      document
        .querySelector(".document-name")
        ?.textContent.includes("ui-contrat.txt"),
    "import via interface",
  );
  await click("Revue tabulaire");
  await click("Nouvelle revue");
  await until(() => button("Créer et lancer la revue"), "préparation");
  await click("Créer et lancer la revue");
  await until(
    () =>
      document.querySelectorAll(".grid-cell").length === 5 &&
      button("Relancer"),
    "revue terminée",
  );
  assert.ok(
    document.querySelector(".review-grid").textContent.includes("quatre ans"),
  );
  await click("Assistant");
  fill(
    document.querySelector('[aria-label="Votre demande"]'),
    "Quelle est la durée du contrat ?",
  );
  await delay(40);
  document.querySelector('[aria-label="Envoyer la demande"]').click();
  await until(
    () => document.querySelector(".message.assistant .citation"),
    "réponse sourcée",
  );
  await click("Rédaction");
  await click("Nouvelle note");
  await until(
    () => document.querySelector('[aria-label="Contenu de la note"]'),
    "éditeur",
  );
  fill(
    document.querySelector('[aria-label="Contenu de la note"]'),
    "Note sauvegardée avant navigation.",
  );
  await delay(40);
  await click("Documents1");
  await until(
    () => document.querySelector(".document-table"),
    "navigation avec sauvegarde",
  );
  await click("Rédaction");
  await until(
    () =>
      document.querySelector('[aria-label="Contenu de la note"]')?.value ===
      "Note sauvegardée avant navigation.",
    "note persistée",
  );
  await click("Générateur juridique");
  await until(
    () => document.querySelectorAll(".template-card").length === 16,
    "bibliothèque générateur",
  );
  fill(
    document.querySelector('[aria-label="Rechercher un modèle juridique"]'),
    "licence",
  );
  await until(
    () => document.querySelectorAll(".template-card").length === 1,
    "filtre du catalogue",
  );
  assert.ok(
    document
      .querySelector(".template-card")
      .textContent.includes("Licence de logiciel"),
  );
  fill(
    document.querySelector('[aria-label="Rechercher un modèle juridique"]'),
    "",
  );
  await until(
    () => document.querySelectorAll(".template-card").length === 16,
    "catalogue complet",
  );
  [...document.querySelectorAll(".template-card")]
    .find((card) => card.textContent.includes("Accord de confidentialité"))
    .click();
  const ndaFixture = JSON.parse(
    await readFile(new URL("./fixtures/nda.json", import.meta.url), "utf8"),
  );
  await until(
    () => document.querySelector("#gen-scope"),
    "questionnaire juridique",
  );
  const metadata = await (
    await nativeFetch(
      base +
        "/api/matters/" +
        instance.store
          .all("matters")
          .find((m) => m.title === "Dossier UI synthétique").id +
        "/generator/templates",
    )
  ).json();
  const ndaTemplate = metadata.find((t) => t.id === "fr-nda");
  for (const groupName of [
    ...new Set(ndaTemplate.fields.map((f) => f.group)),
  ]) {
    [...document.querySelectorAll(".questionnaire-nav>button")]
      .find((b) => b.querySelector("strong")?.textContent === groupName)
      .click();
    await until(
      () =>
        document.querySelector(".questionnaire-heading h2")?.textContent ===
        groupName,
      "groupe " + groupName,
    );
    for (const field of ndaTemplate.fields.filter((f) => f.group === groupName))
      if (ndaFixture[field.id] !== undefined) {
        fill(document.getElementById("gen-" + field.id), ndaFixture[field.id]);
        await delay(15);
      }
  }
  await click("Générer le projet");
  await until(
    () => document.querySelectorAll(".generated-clause").length > 5,
    "clauses du NDA",
  );
  assert.ok(
    document
      .querySelector(".generated-paper")
      .textContent.includes("Accord de confidentialité"),
  );
  await click("Vérifier et enregistrer");
  await until(
    () =>
      document
        .querySelector(".generated-toolbar")
        .textContent.includes("Projet enregistré"),
    "projet juridique enregistré",
  );
  await click("Sources");
  assert.ok(
    document.querySelector(".legal-sources").textContent.includes("1112-2"),
  );
  await click("Relecture");
  for (const checkbox of document.querySelectorAll(
    ".review-tick input,.review-check input",
  )) {
    assert.equal(checkbox.disabled, false);
    checkbox.click();
    await delay(10);
  }
  fill(
    document.querySelector('input[aria-label="Nom du relecteur"]'),
    "Relecteur UI fictif",
  );
  await delay(40);
  await click("Enregistrer la relecture");
  await until(
    () =>
      document.querySelector(".generated-toolbar .badge")?.textContent ===
      "Relecture enregistrée",
    "relecture enregistrée",
  );
  assert.ok(button("Word · révision relue"));
  fill(
    document.querySelector(".generated-clause textarea"),
    "Clause modifiée volontairement dans le test d’interface.",
  );
  await delay(50);
  assert.equal(button("Word · révision relue"), undefined);
  await click("Vérifier et enregistrer");
  await until(
    () =>
      document.querySelector(".generated-toolbar .badge")?.textContent ===
      "Projet enregistré",
    "révision et relecture invalidée",
  );
  assert.ok(
    instance.store
      .all("legal_drafts")
      .some((d) => d.status === "draft" && d.history.some((h) => h.review)),
  );
  document.querySelector(".profile-button").click();
  await until(() => document.querySelector("dialog select"), "paramètres");
  assert.ok(document.querySelector("dialog").textContent.includes("Ollama"));
  document.querySelector("dialog .icon-button").click();
  await mkdir("test-results", { recursive: true });
  await writeFile(
    "test-results/dom-report.json",
    JSON.stringify(
      {
        passed: true,
        scope:
          "React + JSDOM + HTTP API + SQLite ; aucun rendu visuel Chromium",
        checks: [
          "import de deux DOCX dans Comparer, redline, vue côte à côte et téléchargement Word",
          "catalogue de vingt-quatre modèles, recherche et filtrage de la licence",
          "comparaison, décision persistée, recherche juridique et passage conservé",
          "accueil",
          "grille",
          "correction",
          "verrou",
          "validation",
          "source surlignée",
          "création dossier",
          "import",
          "exécution revue",
          "assistant sourcé",
          "note sauvegardée à la navigation",
          "paramètres",
          "générateur NDA : questionnaire, clauses, sources, relecture et invalidation après modification",
        ],
        date: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  console.log(
    "Interface DOM validée sur les vraies API : grille, sources, corrections, import, revue, assistant, notes et paramètres.",
  );
} finally {
  root.unmount();
  dom.window.close();
  globalThis.fetch = nativeFetch;
  globalThis.FormData = NativeFormData;
  await new Promise((r) => server.close(r));
  await instance.close();
  await rm(directory, { recursive: true, force: true });
}
