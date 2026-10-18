import { createHash } from "node:crypto";
import { z } from "zod";
import { extendedClauses } from "./extended.mjs";
import {
  LEGAL_SOURCES,
  LEGAL_CHECKED_AT,
  TEMPLATE_VERSION,
} from "./catalog.mjs";

export const draftInputSchema = z.object({
  templateId: z.string().min(1).max(100),
  title: z.string().trim().max(180).optional(),
  answers: z.record(z.string(), z.string().max(45000)),
  overrides: z.record(z.string(), z.string().max(45000)).default({}),
});
export const fingerprint = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
export function validDate(value) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function cents(value) {
  if (!/^\d{1,9}([.,]\d{1,2})?$/.test(value ?? "")) return null;
  const [whole, fraction = ""] = value.replace(",", ".").split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
const euro = (value) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    value / 100,
  );
const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeZone: "UTC",
});
export function generateDocument(
  template,
  rawAnswers,
  overrides = {},
  asOf = new Date().toISOString().slice(0, 10),
) {
  const known = new Set(template.fields.map((f) => f.id));
  if (Object.keys(rawAnswers).some((key) => !known.has(key)))
    throw Object.assign(Error("Le questionnaire contient un champ inconnu."), {
      status: 422,
    });
  const answers = Object.fromEntries(
    template.fields.map((f) => [f.id, String(rawAnswers[f.id] ?? "").trim()]),
  );
  const labels = Object.fromEntries(
    template.fields.map((f) => [f.id, f.label]),
  );
  const issues = [];
  const issue = (id, severity, message, field, sourceIds = []) =>
    issues.push({ id, severity, message, field, sourceIds });
  const required = new Set(
    template.fields.filter((f) => f.required).map((f) => f.id),
  );
  if (template.id === "fr-services") {
    if (answers.taxRegime === "vat") required.add("vatRate");
    if (answers.taxRegime === "exempt") required.add("taxBasis");
    if (answers.invoiceType === "periodic") required.add("schedule");
    if (answers.personalData === "yes") required.add("dpaText");
  }
  if (answers.forumCity) required.add("bothCommercial");
  const invalid = new Set();
  for (const f of template.fields) {
    const value = answers[f.id];
    if (required.has(f.id) && !value) {
      issue(
        `missing-${f.id}`,
        "blocking",
        `${f.label} : réponse requise.`,
        f.id,
      );
      invalid.add(f.id);
      continue;
    }
    if (!value) continue;
    let message;
    if (value.length > (f.maxLength ?? (f.type === "textarea" ? 12000 : 500)))
      message = "Texte trop long.";
    else if (f.options && !f.options.some(([v]) => v === value))
      message = "Choix non reconnu.";
    else if (f.type === "date" && !validDate(value))
      message =
        "Date invalide : utilisez une date réelle au format AAAA-MM-JJ.";
    else if (f.type === "siren" && !/^\d{9}$/.test(value.replace(/\s/g, "")))
      message =
        "Le SIREN doit comporter neuf chiffres. Ce contrôle ne vérifie pas le registre.";
    else if (
      f.type === "integer" &&
      (!/^\d+$/.test(value) ||
        Number(value) < (f.min ?? 1) ||
        Number(value) > (f.max ?? 10000))
    )
      message = `Nombre entier attendu entre ${f.min ?? 1} et ${f.max ?? 10000}.`;
    else if (
      f.type === "decimal" &&
      (!/^\d+(?:[.,]\d{1,2})?$/.test(value) ||
        Number(value.replace(",", ".")) < (f.min ?? 0) ||
        Number(value.replace(",", ".")) > (f.max ?? 100))
    )
      message = "Valeur numérique hors limites.";
    else if (
      f.type === "money" &&
      (cents(value) === null ||
        cents(value) < Math.round((f.min ?? 0.01) * 100))
    )
      message = "Montant en euros invalide (deux décimales maximum).";
    else if (/\{\{|\}\}|⟦|⟧|\[à compléter\]/i.test(value))
      message = "Valeur contenant un champ de modèle non résolu.";
    if (message) {
      issue(`invalid-${f.id}`, "blocking", `${f.label} : ${message}`, f.id);
      invalid.add(f.id);
    }
  }
  if (answers.jurisdiction && answers.jurisdiction !== "FR")
    issue(
      "jurisdiction",
      "blocking",
      "Ce modèle est limité au droit français. Utilisez une trame adaptée à la juridiction choisie.",
      "jurisdiction",
    );
  if (answers.scope && answers.scope !== "b2b")
    issue(
      "scope",
      "blocking",
      "Contexte hors périmètre : ce modèle ne traite pas les consommateurs, marchés publics, opérations internationales ou régimes spéciaux.",
      "scope",
    );
  if (
    answers.p1siren &&
    answers.p1siren.replace(/\s/g, "") === answers.p2siren?.replace(/\s/g, "")
  )
    issue(
      "same-party",
      "blocking",
      "Les deux parties portent le même SIREN. Vérifiez leur identité.",
      "p2siren",
    );
  if (answers.forumCity && answers.bothCommercial !== "yes")
    issue(
      "venue-condition",
      "blocking",
      "Une compétence territoriale exclusive ne peut être retenue ici sans confirmation de la qualité de commerçant des deux parties.",
      "bothCommercial",
      ["venue"],
    );
  if (answers.forumCity)
    issue(
      "venue-review",
      "warning",
      "Vérifier la compétence matérielle et le caractère très apparent de la clause ; la seule ville ne suffit pas à établir sa validité.",
      "forumCity",
      ["venue"],
    );
  const compareDates = (left, right, id, message) => {
    if (
      validDate(answers[left]) &&
      validDate(answers[right]) &&
      answers[left] > answers[right]
    )
      issue(id, "blocking", message, right);
  };
  compareDates(
    "startDate",
    "endDate",
    "date-order",
    "La fin doit être postérieure ou égale au début.",
  );
  if (
    validDate(answers.signDate) &&
    validDate(answers.startDate) &&
    answers.startDate < answers.signDate
  )
    issue(
      "retroactive-start",
      "warning",
      "Le début précède la signature : vérifier les actes déjà accomplis et l’effet rétroactif souhaité.",
      "startDate",
    );
  if (template.id === "fr-services") {
    if (answers.invoiceType === "periodic" && Number(answers.paymentDays) > 45)
      issue(
        "periodic-payment",
        "blocking",
        "Une facture périodique ne peut retenir ici plus de 45 jours à compter de son émission.",
        "paymentDays",
        ["payment"],
      );
    if (answers.personalData === "yes" && (answers.dpaText ?? "").length < 500)
      issue(
        "dpa-short",
        "blocking",
        "L’annexe données personnelles doit être fournie et adaptée : une mention courte ne constitue pas un encadrement de sous-traitance.",
        "dpaText",
        ["privacy"],
      );
    if (answers.personalData === "yes")
      issue(
        "dpa-review",
        "warning",
        "La présence d’une annexe ne prouve pas sa conformité à l’article 28 : vérifier les instructions, mesures de sécurité, droits, sous-traitants et transferts.",
        "dpaText",
        ["privacy"],
      );
    if (
      cents(answers.liabilityCap) !== null &&
      cents(answers.price) !== null &&
      cents(answers.liabilityCap) < cents(answers.price)
    )
      issue(
        "cap-review",
        "warning",
        "Le plafond est inférieur au prix de la mission : apprécier sa portée au regard des obligations essentielles et des risques. Ce n’est pas un seuil légal automatique.",
        "liabilityCap",
        ["essential"],
      );
    if (
      answers.taxRegime === "vat" &&
      Number(answers.vatRate?.replace(",", ".")) === 0
    )
      issue(
        "zero-vat",
        "warning",
        "Un taux de TVA nul nécessite la vérification de son fondement.",
        "vatRate",
      );
  }
  if (template.id === "fr-amendment") {
    compareDates(
      "contractDate",
      "signDate",
      "contract-after-amendment",
      "Le contrat initial est postérieur à la signature de l’avenant.",
    );
    compareDates(
      "contractDate",
      "effectiveDate",
      "amendment-before-contract",
      "L’avenant ne peut prendre effet avant la date du contrat initial dans cette trame.",
    );
    if (
      validDate(answers.effectiveDate) &&
      validDate(answers.signDate) &&
      answers.effectiveDate < answers.signDate
    )
      issue(
        "retroactive-amendment",
        "warning",
        "L’avenant prévoit une prise d’effet antérieure à sa signature. Vérifier les droits acquis et les tiers.",
        "effectiveDate",
        ["amendment"],
      );
  }
  if (template.id === "fr-demand") {
    compareDates(
      "invoiceDate",
      "dueDate",
      "due-before-invoice",
      "L’échéance est antérieure à la date de facture.",
    );
    if (
      validDate(answers.dueDate) &&
      validDate(answers.signDate) &&
      answers.dueDate >= answers.signDate
    )
      issue(
        "not-due",
        "blocking",
        "La créance doit être échue à la date d’émission du courrier.",
        "dueDate",
        ["notice"],
      );
    if (
      cents(answers.paid) !== null &&
      cents(answers.principal) !== null &&
      cents(answers.paid) >= cents(answers.principal)
    )
      issue(
        "paid-claim",
        "blocking",
        "Le solde exigible doit être strictement positif après paiements et avoirs.",
        "paid",
      );
    if (answers.dispute && answers.dispute !== "no")
      issue(
        "disputed-claim",
        "blocking",
        "Créance contestée ou situation non vérifiée : adapter la démarche, notamment en cas de procédure collective, avant d’enregistrer une relecture finale.",
        "dispute",
      );
  }
  const value = (id) =>
    invalid.has(id) || !answers[id]
      ? `⟦À compléter : ${labels[id] ?? id}⟧`
      : answers[id];
  const when = (id) =>
    validDate(answers[id])
      ? DATE_FORMAT.format(new Date(answers[id] + "T12:00:00Z"))
      : value(id);
  const amount = (id) =>
    cents(answers[id]) !== null ? euro(cents(answers[id])) : value(id);
  const party = (p) =>
    `${value(p + "name")}, ${value(p + "form")}, identifiée sous le numéro SIREN ${value(p + "siren")}, dont le siège est situé ${value(p + "address")}, représentée par ${value(p + "representative")}, en qualité de ${value(p + "capacity")}, déclarant disposer des pouvoirs nécessaires aux présentes`;
  const sections = [];
  const section = (id, title, body, sourceIds = [], options = {}) =>
    sections.push({
      id,
      title,
      body,
      sourceIds,
      origin: "template",
      ...options,
    });
  if (template.origin === "cabinet") {
    const body = template.body.replace(
      /\{\{([a-z][a-z0-9_]{1,63})\}\}/g,
      (_, key) => value(key),
    );
    section("custom", "Document issu du modèle de cabinet", body, [], {
      origin: "cabinet",
    });
    issue(
      "custom-review",
      "warning",
      "Modèle fourni par l’utilisateur : aucune validation juridique de la trame ni des clauses par Atelier. La complétude des variables ne suffit pas.",
    );
  } else {
    section(
      "parties",
      template.id === "fr-demand"
        ? "Expéditeur et destinataire"
        : "Identification des parties",
      template.id === "fr-demand"
        ? `Créancier : ${party("p1")}.\n\nDébiteur destinataire : ${party("p2")}.`
        : `Entre ${party("p1")} (la « Partie 1 ») ;\n\net ${party("p2")} (la « Partie 2 »).`,
    );
    if (template.id === "fr-nda") {
      const mutual = answers.ndaType === "mutual";
      section(
        "purpose",
        "1. Objet et finalité",
        `Le présent accord encadre les échanges nécessaires à la finalité suivante : ${value("purpose")}. ${mutual ? "Chaque partie peut communiquer des informations et en recevoir ; les obligations ci-dessous s’appliquent à chacune dans son rôle de destinataire." : "Seule la Partie 1 divulgue des informations protégées ; la Partie 2 assume les obligations de destinataire prévues ci-dessous."}`,
        ["confidentiality"],
      );
      section(
        "scope",
        "2. Informations protégées et exclusions",
        `Le périmètre et l’identification des informations couverts sont les suivants : ${value("information")}.\nNe sont pas protégées les informations dont le destinataire établit qu’elles étaient déjà licitement en sa possession sans obligation de confidentialité, qu’elles sont devenues publiques sans violation du présent accord, qu’elles ont été reçues licitement d’un tiers autorisé ou qu’elles ont été développées indépendamment sans accès aux informations protégées. Ces exceptions s’apprécient information par information ; leur preuve doit être conservée.`,
      );
      section(
        "duties",
        "3. Utilisation et accès autorisés",
        `Le destinataire utilise les informations uniquement pour la finalité de l’article 1, met en œuvre des protections proportionnées à leur sensibilité et limite l’accès aux personnes ayant un besoin réel d’en connaître parmi les catégories suivantes : ${value("recipients")}. Il veille à ce que ces personnes soient liées par des engagements appropriés de confidentialité avant tout accès et répond de leur respect dans les limites du droit applicable. Aucune diffusion supplémentaire ou exploitation commerciale autonome n’est autorisée.`,
      );
      section(
        "required-disclosure",
        "4. Divulgation imposée et incident",
        `En cas de demande légalement obligatoire, le destinataire limite la divulgation au strict nécessaire et, sauf interdiction légale, informe préalablement la partie concernée afin qu’elle puisse faire valoir ses droits. Il notifie sans délai injustifié tout accès ou usage non autorisé dont il a connaissance, en précisant les informations disponibles et les mesures de limitation prises.`,
      );
      section(
        "term",
        "5. Période couverte et survie",
        `Les échanges couverts interviennent du ${when("startDate")} au ${when("endDate")}. Les obligations relatives aux informations communiquées pendant cette période se poursuivent pendant ${value("survivalYears")} année(s) à compter de sa fin, sans préjudice des protections légales qui continueraient de s’appliquer. Cette durée de survie est distincte de la période d’échanges.`,
      );
      section(
        "return",
        "6. Restitution et conservation résiduelle",
        `À la demande de la partie ayant communiqué les informations, ou à la fin des échanges, le destinataire restitue ou supprime les informations et leurs copies dans un délai de ${value("returnDays")} jours. Il peut conserver les éléments strictement requis par une obligation légale ou pour la défense de ses droits ; les copies de sauvegarde non accessibles en exploitation courante suivent leur cycle normal d’effacement. Les éléments conservés restent soumis aux obligations de confidentialité pendant la durée applicable. Une confirmation des opérations réalisées est fournie sur demande.`,
      );
      section(
        "rights",
        "7. Absence de cession et liberté des discussions",
        `La communication ne transfère aucun droit de propriété intellectuelle et n’accorde aucun droit d’usage au-delà de la finalité prévue. L’accord ne crée ni exclusivité ni obligation de conclure une opération. Il ne contient aucune garantie générale d’exhaustivité des informations et ne limite pas les obligations légales d’information ni la responsabilité pour comportement déloyal.`,
      );
      section(
        "remedies",
        "8. Manquements",
        `Chaque partie peut demander les mesures et réparations permises par le droit applicable, en tenant compte du préjudice établi et des conditions de leur mise en œuvre. Aucun montant de pénalité ni plafond de responsabilité n’est inventé par la présente trame.`,
        ["confidentiality"],
      );
    }
    if (template.id === "fr-services") {
      section(
        "mission",
        "1. Mission et documents contractuels",
        `La Partie 1 intervient comme prestataire et la Partie 2 comme client. La mission est définie ainsi : ${value("mission")}. Les livrables, formats, étapes et échéances sont les suivants : ${value("deliverables")}. Toute modification de périmètre, délai ou prix fait l’objet d’un accord écrit préalable des parties précisant ses incidences ; aucune extension de mission n’est déduite du seul silence du client.`,
      );
      section(
        "performance",
        "2. Exécution, coopération et recette",
        `Le prestataire est tenu ${answers.obligation === "result" ? "d’atteindre le résultat décrit par les livrables et les critères ci-après" : "de mobiliser les diligences et moyens professionnels appropriés à la mission, sans garantir un résultat non expressément promis"}. Le client fournit en temps utile : ${value("cooperation")}.\nLa conformité des livrables se vérifie sur les critères suivants : ${value("acceptance")}. Le client dispose de ${value("acceptanceDays")} jours à compter de la remise documentée pour notifier des réserves motivées rattachées à ces critères. Le prestataire examine et corrige les non-conformités qui lui sont imputables dans un délai convenu au regard de leur nature. L’absence de réponse ne vaut pas, à elle seule, renonciation aux réserves ou acceptation de défauts non décelables.`,
      );
      section(
        "term",
        "3. Durée",
        `La mission court du ${when("startDate")} au ${when("endDate")}. Il n’est prévu aucune reconduction tacite. La prolongation ou la commande de prestations nouvelles nécessite un accord écrit distinct. Les stipulations destinées à survivre, notamment relatives aux droits sur les livrables, aux paiements dus et à la confidentialité, conservent leur effet selon leur objet et leur durée.`,
      );
      const tax =
        answers.taxRegime === "exempt"
          ? `La TVA n’est pas facturée sur le fondement suivant, à confirmer : ${value("taxBasis")}.`
          : `La TVA s’applique au taux renseigné de ${value("vatRate")} %, sous réserve du régime effectivement applicable à l’opération.`;
      section(
        "price",
        "4. Prix et facturation",
        `Le prix forfaitaire de la mission est de ${amount("price")} hors taxes. ${tax} ${answers.invoiceType === "periodic" ? `La facturation suit cet échéancier : ${value("schedule")}.` : "Le prix est facturé à la recette des livrables conformes."} Aucun frais supplémentaire n’est dû sans accord écrit préalable précisant sa nature et son montant.`,
      );
      section(
        "payment",
        "5. Règlement et retard de paiement",
        `Les factures sont payables dans un délai de ${value("paymentDays")} jours à compter de leur émission, sous réserve des plafonds et dispositions impératives applicables à l’opération. Aucun escompte n’est prévu pour paiement anticipé. Les pénalités sont exigibles dès le lendemain de l’échéance, sans rappel préalable, au taux résultant de l’article L. 441-10 du Code de commerce : taux de refinancement de référence de la Banque centrale européenne augmenté de dix points, déterminé selon la période légale applicable. Elles ne peuvent être fixées sous le minimum légal correspondant à trois fois le taux d’intérêt légal. Lorsqu’il est applicable, le régime de retard ouvre également droit à l’indemnité forfaitaire de 40 euros par facture et, sur justificatifs, à l’indemnisation complémentaire des frais de recouvrement supérieurs, sous réserve des exclusions légales. Aucun taux chiffré variable n’est figé dans ce document.`,
        ["payment", "recovery"],
      );
      section(
        "independence",
        "6. Indépendance et organisation",
        `Le prestataire organise ses moyens et son activité sous sa responsabilité, sans lien de subordination créé par le présent contrat. Il reste responsable de ses intervenants, de leurs habilitations et de ses obligations légales. Aucune substitution de cocontractant n’est permise sans accord écrit du client. Le recours à des intervenants ne réduit pas les engagements de confidentialité, de sécurité ou de protection des données.`,
      );
      section(
        "ip",
        "7. Droits sur les livrables — licence non exclusive",
        `Chaque partie conserve ses droits sur ses éléments préexistants. Sous réserve de disposer effectivement des droits nécessaires et après paiement intégral des sommes dues pour les livrables concernés, le prestataire accorde au client une licence non exclusive de reproduction et de représentation des livrables uniquement pour l’usage interne suivant : ${value("usage")}. Cette licence est consentie pour ${value("licenseYears")} année(s) à compter de la remise, dans le monde entier, pour les seuls besoins internes du client ; son prix est compris dans le prix de la mission. Elle n’autorise ni revente, ni sous-licence, ni diffusion à des tiers, ni adaptation au-delà de ce qui est indispensable à l’utilisation autorisée. Les éléments et logiciels de tiers restent soumis à leurs licences, qui doivent être identifiées et remises au client. Aucune cession exclusive ou transfert général de droits d’auteur n’est prévu par cette trame.`,
      );
      section(
        "confidentiality",
        "8. Confidentialité",
        `Chaque partie limite l’usage des informations non publiques reçues à l’exécution du contrat et les protège par des mesures adaptées. L’accès est limité aux intervenants autorisés et tenus à la confidentialité. Ne sont pas couvertes les informations déjà publiques sans faute, reçues licitement sans restriction ou développées indépendamment, sous réserve d’en justifier. La confidentialité s’applique pendant la mission puis pendant trois ans après son terme, sans réduire les protections impératives qui demeureraient applicables. Une divulgation légalement imposée est limitée au nécessaire, avec information préalable de l’autre partie lorsque la loi le permet.`,
      );
      section(
        "privacy",
        "9. Données personnelles",
        answers.personalData === "yes"
          ? "Les parties ont déclaré un traitement de données pour le compte du client. L’annexe « Données personnelles » reproduite au présent document complète les stipulations de la mission et doit encadrer le traitement avant tout accès aux données. Elle doit être examinée spécifiquement, y compris pour les rôles effectifs, sous-traitants ultérieurs et éventuels transferts. Aucune autorisation générale de transfert hors de l’Espace économique européen n’est accordée par la présente clause."
          : "Les parties déclarent que la mission ne comporte pas de traitement de données personnelles par le prestataire pour le compte du client. Chacune demeure responsable de ses traitements propres, notamment les coordonnées professionnelles de ses interlocuteurs. Si le périmètre réel change, les rôles et l’encadrement requis sont définis par écrit avant le traitement concerné.",
        ["privacy"],
      );
      section(
        "liability",
        "10. Responsabilité et assurance",
        `Sous réserve des règles impératives, la responsabilité contractuelle totale du prestataire au titre des dommages directs imputables à l’exécution de la mission est plafonnée à ${amount("liabilityCap")}. Ce plafond ne s’applique pas en cas de dol, faute lourde, atteinte corporelle ni lorsqu’il neutraliserait une obligation essentielle. Il n’écarte pas les droits propres des tiers ou des personnes concernées par des données personnelles. Les autres exclusions ou régimes spéciaux ne sont pas présumés couverts et doivent être examinés selon la mission. Le prestataire déclare l’assurance professionnelle suivante : ${value("insurance")}, dont l’attestation et l’adéquation au risque doivent être vérifiées.`,
        ["essential"],
      );
      section(
        "termination",
        "11. Manquement et fin du contrat",
        `Un manquement substantiel non réparé dans les ${value("cureDays")} jours suivant réception d’une notification écrite décrivant précisément le manquement peut justifier l’exercice des remèdes ouverts par le droit applicable. La notification exprime clairement la demande de remédier et les conséquences envisagées ; les conditions propres à la résolution et les stipulations éventuellement convenues doivent être respectées. La fin de la mission donne lieu à la remise des livrables dus, à un décompte des prestations effectivement réalisées et à la restitution des éléments du client, sans pénalité de rupture inventée ni renonciation générale à indemnisation.`,
      );
      section(
        "force",
        "12. Force majeure",
        `La force majeure s’apprécie suivant les conditions de l’article 1218 du Code civil, au regard de l’événement et de ses effets concrets sur l’obligation concernée. La partie affectée informe l’autre sans délai injustifié et documente l’empêchement ainsi que les mesures raisonnables de limitation. Un obstacle temporaire suspend l’obligation affectée, sauf retard justifiant la fin du contrat ; en cas d’empêchement définitif, les effets prévus par le droit applicable s’appliquent. Aucun événement n’est automatiquement qualifié de force majeure par sa seule dénomination.`,
        ["force"],
      );
      if (answers.personalData === "yes")
        section(
          "dpa",
          "Annexe — Données personnelles",
          value("dpaText"),
          ["privacy"],
          { origin: "user-annex" },
        );
    }
    if (template.id === "fr-amendment") {
      section(
        "original",
        "1. Contrat modifié et contexte",
        `Les parties ont conclu le contrat intitulé « ${value("contractTitle")} » le ${when("contractDate")}. Les modifications antérieures déclarées sont les suivantes : ${value("priorAmendments")}. L’objet du présent avenant est : ${value("reason")}. Les parties conviennent des modifications ci-après.`,
        ["amendment"],
      );
      section(
        "replacement",
        "2. Remplacement des stipulations désignées",
        `Les seuls articles ou stipulations suivants sont remplacés : ${value("replacedArticles")}.\n\nIls sont désormais rédigés intégralement comme suit :\n${value("replacementText")}`,
      );
      section(
        "impacts",
        "3. Coordination avec le contrat et ses annexes",
        `Les incidences déclarées sur les annexes, le prix, le calendrier et les autres stipulations sont : ${value("impacts")}. En cas de contradiction, le présent avenant prévaut uniquement pour les dispositions qu’il modifie expressément. Les autres stipulations du contrat initial et de ses avenants demeurent applicables. La présente rédaction ne dispense pas de vérifier les renvois, garanties, autorisations et droits des tiers concernés.`,
      );
      section(
        "effective",
        "4. Prise d’effet et maintien du contrat",
        `Le présent avenant prend effet le ${when("effectiveDate")}, sous réserve des formalités ou conditions particulières applicables. Il ne constitue pas, par lui-même, une renonciation aux droits déjà acquis ni une volonté de substituer une nouvelle obligation aux engagements non modifiés. Le droit applicable et le règlement des différends du contrat initial ne sont pas modifiés.`,
        ["amendment"],
      );
    }
    if (template.id === "fr-demand") {
      const outstanding =
        cents(answers.principal) !== null && cents(answers.paid) !== null
          ? euro(cents(answers.principal) - cents(answers.paid))
          : "⟦À compléter : solde exigible⟧";
      section(
        "subject",
        "Objet — Mise en demeure de payer",
        `Facture / titre de créance : ${value("invoiceRef")}, du ${when("invoiceDate")}, arrivé à échéance le ${when("dueDate")}.\nMode d’envoi préparé : ${answers.delivery === "bailiff" ? "remise par commissaire de justice" : "lettre recommandée avec accusé de réception"}.`,
      );
      section(
        "basis",
        "Origine et décompte de la somme demandée",
        `Nous vous rappelons la créance résultant des faits et prestations suivants : ${value("basis")}.\nMontant initial TTC : ${amount("principal")}.\nPaiements et avoirs déjà imputés : ${amount("paid")}.\nPrincipal restant demandé : ${outstanding}.\nPièces justificatives à joindre : ${value("evidence")}.`,
      );
      section(
        "demand",
        "Interpellation et demande de paiement",
        `Par la présente, nous vous mettons formellement en demeure de nous régler le principal restant dû de ${outstanding} dans un délai de ${value("deadlineDays")} jours à compter de la réception de cette demande. Le paiement doit être effectué selon les modalités suivantes : ${value("paymentMethod")}. Si un règlement ou un avoir non pris en compte est intervenu, nous vous invitons à transmettre sans délai son justificatif afin de régulariser le décompte.`,
        ["notice"],
      );
      section(
        "follow-up",
        "Suite envisagée",
        `À défaut de régularisation, nous nous réservons la possibilité d’exercer les recours appropriés auprès de l’autorité compétente, après vérification de leurs conditions. Le présent courrier chiffre uniquement le principal : aucun intérêt, frais de recouvrement, indemnité forfaitaire ou pénalité n’est ajouté sans détermination et justification de son régime applicable. Ce délai supplémentaire ne constitue pas une remise de dette ni une renonciation générale aux droits existants. Veuillez conserver la preuve du contenu adressé et de sa remise au destinataire.`,
      );
    }
    extendedClauses(template, {
      answers,
      value,
      when,
      amount,
      section,
      issue,
      cents,
      euro,
      validDate,
    });
    if (["fr-nda", "fr-services"].includes(template.id))
      section(
        "disputes",
        "Droit applicable et règlement des différends",
        answers.forumCity
          ? `LE PRÉSENT CONTRAT EST SOUMIS AU DROIT FRANÇAIS. LES PARTIES DÉCLARENT AVOIR TOUTES DEUX CONTRACTÉ EN QUALITÉ DE COMMERÇANT. SOUS RÉSERVE DES RÈGLES IMPÉRATIVES ET DE COMPÉTENCE MATÉRIELLE, ELLES ATTRIBUENT COMPÉTENCE TERRITORIALE EXCLUSIVE AUX JURIDICTIONS COMPÉTENTES DE ${value("forumCity").toUpperCase()}. CETTE STIPULATION DOIT ÊTRE ACCEPTÉE DE FAÇON TRÈS APPARENTE.`
          : "Le présent contrat est soumis au droit français. Les parties cherchent une solution amiable sans suspendre les délais impératifs ni empêcher les mesures urgentes. À défaut d’accord, les juridictions compétentes sont déterminées selon les règles de droit commun ; aucune compétence territoriale exclusive n’est stipulée.",
        ["venue"],
        { emphasis: !!answers.forumCity },
      );
    section(
      "signatures",
      ["fr-demand", "fr-notice-termination"].includes(template.id)
        ? "Émission et signature"
        : "Formalisation et signatures",
      `Fait à ${value("signCity")}, le ${when("signDate")}.\n\nPour ${value("p1name")} : ${value("p1representative")}, ${value("p1capacity")}.\nSignature : ____________________${["fr-demand", "fr-notice-termination"].includes(template.id) ? "" : `\n\nPour ${value("p2name")} : ${value("p2representative")}, ${value("p2capacity")}.\nSignature : ____________________`}`,
    );
  }
  const validIds = new Set(sections.map((s) => s.id));
  if (Object.keys(overrides).some((id) => !validIds.has(id)))
    throw Object.assign(Error("Clause modifiée inconnue."), { status: 422 });
  for (const s of sections) {
    if (Object.hasOwn(overrides, s.id) && overrides[s.id] !== s.body) {
      s.body = overrides[s.id];
      s.origin = "human-edit";
      issue(
        `edited-${s.id}`,
        "warning",
        `« ${s.title} » a été modifiée : les contrôles automatiques ne valident pas le sens juridique de cette rédaction.`,
      );
    }
  }
  if (sections.reduce((n, s) => n + s.body.length, 0) > 180000)
    throw Object.assign(
      Error("Document trop long (180 000 caractères maximum)."),
      { status: 422 },
    );
  for (const s of sections) {
    if (!s.body.trim() || /⟦|⟧|\{\{|\}\}|\[à compléter\]/i.test(s.body))
      issue(
        `unresolved-${s.id}`,
        "blocking",
        `La clause « ${s.title} » est vide ou comporte un champ non résolu.`,
      );
  }
  const sourceIds = [
    ...new Set(
      sections.flatMap((s) => s.sourceIds).concat(template.sourceIds ?? []),
    ),
  ];
  const sources = sourceIds.map((id) => ({ ...LEGAL_SOURCES[id] }));
  for (const s of sources) {
    if (
      s.validUntil &&
      (asOf >= s.validUntil ||
        (validDate(answers.signDate) && answers.signDate >= s.validUntil))
    )
      issue(
        `expired-${s.id}`,
        "blocking",
        `La version consultée de ${s.title} arrive à échéance le ${s.validUntil}. Actualiser la trame avant une relecture enregistrée.`,
        undefined,
        [s.id],
      );
    else if (
      s.validUntil &&
      validDate(answers.endDate) &&
      answers.endDate >= s.validUntil
    )
      issue(
        `future-law-${s.id}`,
        "warning",
        `La mission dépasse le ${s.validUntil}, date d’évolution annoncée de la version consultée de ${s.title}. Réexaminer les conditions applicables aux factures futures.`,
        undefined,
        [s.id],
      );
    if (Date.parse(asOf) - Date.parse(s.checkedAt) > 180 * 86400000)
      issue(
        `stale-${s.id}`,
        "blocking",
        `La consultation de ${s.title} remonte à plus de 180 jours : vérifier les sources et mettre à jour la trame avant une relecture enregistrée.`,
        undefined,
        [s.id],
      );
  }
  issue(
    "human-review",
    "warning",
    "Les contrôles portent sur le questionnaire et certaines cohérences. L’identité, les faits, la négociation et l’applicabilité complète du droit ne sont pas vérifiés automatiquement.",
  );
  const content = { title: template.title, sections };
  const legal = {
    jurisdiction: "FR",
    checkedAt: template.origin === "cabinet" ? null : LEGAL_CHECKED_AT,
    templateVersion: template.version ?? TEMPLATE_VERSION,
    issues,
    sources,
    requiredReviewItems: template.reviewItems,
    blockingCount: issues.filter((i) => i.severity === "blocking").length,
    answered: template.fields.filter((f) => answers[f.id]).length,
    totalFields: template.fields.length,
  };
  return {
    answers,
    content,
    legal,
    contentHash: fingerprint({
      templateId: template.id,
      templateVersion: template.version,
      answers,
      content,
      legal,
    }),
  };
}
