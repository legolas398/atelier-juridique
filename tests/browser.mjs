import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const base = process.env.ATELIER_URL ?? "http://127.0.0.1:4310";
await mkdir("test-results", { recursive: true });
const browser = process.env.ATELIER_CDP
  ? await chromium.connectOverCDP(process.env.ATELIER_CDP)
  : await chromium.launch({
      channel: "chrome",
      headless: true,
      chromiumSandbox: true,
    });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: "fr-FR",
  acceptDownloads: true,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto(base);
  await page
    .getByRole("heading", { name: "Le fond du dossier.", exact: false })
    .waitFor();
  await page.screenshot({ path: "test-results/home.png", fullPage: true });
  await page
    .getByRole("button", { name: "Nouveau dossier", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Nom du dossier" })
    .fill(`Vérification navigateur ${Date.now()}`);
  await page
    .getByRole("button", { name: "Créer le dossier", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Documents", exact: false })
    .first()
    .click();
  await page.locator("input[type=file]").setInputFiles({
    name: "accord-navigation.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(
      "ACCORD FICTIF\n\nDurée\nLe contrat est conclu pour trois ans.\n\nPréavis\nLe préavis de résiliation est de trente jours.\n\nDroit applicable\nLe contrat est régi par le droit français.",
    ),
  });
  await page
    .getByRole("button", { name: "accord-navigation.txt", exact: false })
    .first()
    .waitFor();
  await page
    .getByRole("button", { name: "Revue tabulaire", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Nouvelle revue", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Créer et lancer la revue", exact: true })
    .click();
  await page.getByRole("button", { name: "Relancer", exact: true }).waitFor();
  const firstCell = page.locator(".grid-cell").first();
  await firstCell.click();
  await page
    .getByLabel("Réponse", { exact: false })
    .fill("Trois ans · vérification navigateur");
  await page
    .getByRole("button", { name: "Enregistrer la correction", exact: true })
    .click();
  await page.getByRole("button", { name: "Verrouiller", exact: true }).click();
  await page
    .getByRole("button", { name: "Valider cette révision", exact: true })
    .click();
  await page.locator(".cell-drawer .citation").first().click();
  await page
    .getByRole("heading", { name: "Vérifier la source", exact: true })
    .waitFor();
  assert.ok(await page.locator(".highlighted-block").count());
  await page.getByRole("button", { name: "Fermer", exact: true }).click();
  await page
    .getByRole("button", { name: "Fermer la cellule", exact: true })
    .click();
  await page.screenshot({ path: "test-results/review.png", fullPage: true });
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Excel", exact: true }).click();
  await (await downloaded).saveAs("test-results/revue.xlsx");
  await page.reload();
  await page
    .getByRole("button", { name: "Revue tabulaire", exact: true })
    .click();
  await page
    .getByText("Trois ans · vérification navigateur", { exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Assistant", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Votre demande", exact: true })
    .fill("Quelle est la durée du contrat ?");
  await page
    .getByRole("button", { name: "Envoyer la demande", exact: true })
    .click();
  await page.locator(".message.assistant .citation").first().waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  assert.deepEqual(errors, []);
  await writeFile(
    "test-results/browser-report.json",
    JSON.stringify(
      { passed: true, errors, base, date: new Date().toISOString() },
      null,
      2,
    ),
  );
  console.log(
    "Parcours navigateur validé : import → revue → citation → correction → verrou → export → rechargement → assistant.",
  );
} finally {
  await context.close();
  await browser.close();
}
