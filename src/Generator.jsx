import React, { useEffect, useRef, useState } from "react";
import {
  FilePlus2,
  FileText,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  FolderOpen,
  Loader2,
  Plus,
  Save,
  Scale,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import { api, date, download } from "./api";
import { Modal, Empty } from "./components";
import "./generator.css";

export default function Generator({
  matterId,
  documents,
  onError,
  onSuccess,
  guard,
}) {
  const [templates, setTemplates] = useState([]),
    [drafts, setDrafts] = useState([]),
    [selected, setSelected] = useState(null),
    [answers, setAnswers] = useState({}),
    [overrides, setOverrides] = useState({}),
    [title, setTitle] = useState(""),
    [saved, setSaved] = useState(null),
    [output, setOutput] = useState(null),
    [step, setStep] = useState("library"),
    [group, setGroup] = useState("Périmètre"),
    [busy, setBusy] = useState(false),
    [importing, setImporting] = useState(false),
    [ack, setAck] = useState([]),
    [reviewer, setReviewer] = useState(""),
    [capacity, setCapacity] = useState("legal"),
    [inspector, setInspector] = useState("checks");
  const baseline = useRef("");
  const actionLock = useRef(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const current = JSON.stringify({ answers, overrides, title });
  const dirty = !!selected && current !== baseline.current;
  const groups = [...new Set(selected?.fields.map((f) => f.group) ?? [])];
  const currentFields = selected?.fields.filter((f) => f.group === group) ?? [];
  const load = async () => {
    const [t, d] = await Promise.all([
      api(`/matters/${matterId}/generator/templates`),
      api(`/matters/${matterId}/generator/drafts`),
    ]);
    setTemplates(t);
    setDrafts(d.reverse());
  };
  useEffect(() => {
    let live = true;
    Promise.all([
      api(`/matters/${matterId}/generator/templates`),
      api(`/matters/${matterId}/generator/drafts`),
    ])
      .then(([t, d]) => {
        if (live) {
          setTemplates(t);
          setDrafts(d.reverse());
        }
      })
      .catch(onError);
    return () => {
      live = false;
    };
  }, [matterId]);
  const payload = () => ({
    templateId: selected.id,
    title,
    answers,
    overrides,
  });
  function applySaved(record) {
    setSaved(record);
    setOutput(record);
    setDrafts((v) => [record, ...v.filter((d) => d.id !== record.id)]);
    baseline.current = JSON.stringify({
      answers: record.answers,
      overrides: record.overrides,
      title: record.content.title,
    });
    setAnswers(record.answers);
    setOverrides(record.overrides);
    setTitle(record.content.title);
  }
  async function saveDraft() {
    if (!selected) return null;
    if (actionLock.current) return null;
    actionLock.current = true;
    setBusy(true);
    try {
      const next = await api(
        saved
          ? `/generator/drafts/${saved.id}`
          : `/matters/${matterId}/generator/drafts`,
        {
          method: saved ? "PUT" : "POST",
          body: {
            ...payload(),
            ...(saved ? { revision: saved.revision } : {}),
          },
        },
      );
      applySaved(next);
      setAck([]);
      return next;
    } catch (e) {
      onError(e);
      return null;
    } finally {
      actionLock.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    guard.current = async () => !dirty || !!(await saveDraft());
    return () => {
      guard.current = null;
    };
  }, [dirty, current, saved]);
  useEffect(() => {
    const listener = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", listener);
    return () => window.removeEventListener("beforeunload", listener);
  }, [dirty]);
  async function library() {
    if (dirty && !(await saveDraft())) return;
    setStep("library");
    setSelected(null);
    setOutput(null);
    setSaved(null);
    setAck([]);
    await load();
  }
  function choose(template) {
    setSelected(template);
    setAnswers({ jurisdiction: "FR" });
    setOverrides({});
    setTitle(template.title);
    setSaved(null);
    setOutput(null);
    setAck([]);
    setGroup("Périmètre");
    setStep("questionnaire");
    baseline.current = "";
  }
  async function openDraft(draft) {
    try {
      const full = await api(`/generator/drafts/${draft.id}`);
      setSelected(full.templateSnapshot);
      applySaved(full);
      setAck(full.review?.acknowledgements ?? []);
      setReviewer(full.review?.reviewer ?? "");
      setCapacity(full.review?.capacity ?? "legal");
      setStep("document");
    } catch (e) {
      onError(e);
    }
  }
  function updateAnswer(id, value) {
    setAnswers((v) => ({ ...v, [id]: value }));
    setAck([]);
  }
  async function generate(allowReset = false) {
    if (Object.keys(overrides).length && allowReset !== true) {
      setConfirmRegenerate(true);
      return;
    }
    if (actionLock.current) return;
    setConfirmRegenerate(false);
    actionLock.current = true;
    setBusy(true);
    try {
      const result = await api(`/matters/${matterId}/generator/preview`, {
        method: "POST",
        body: { ...payload(), overrides: {} },
      });
      setOverrides({});
      setOutput(result);
      setAck([]);
      setStep("document");
    } catch (e) {
      onError(e);
    } finally {
      actionLock.current = false;
      setBusy(false);
    }
  }
  async function review() {
    setBusy(true);
    try {
      const record = await api(`/generator/drafts/${saved.id}/review`, {
        method: "POST",
        body: {
          revision: saved.revision,
          contentHash: saved.contentHash,
          reviewer,
          capacity,
          acknowledgements: ack,
        },
      });
      applySaved(record);
      onSuccess("Relecture enregistrée pour cette révision.");
    } catch (e) {
      onError(e);
    } finally {
      setBusy(false);
    }
  }
  const toggle = (id) =>
    setAck((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  const sourceMap = Object.fromEntries(
    (output?.legal.sources ?? []).map((s) => [s.id, s]),
  );
  const requiredAck = output
    ? [
        ...output.content.sections.map((s) => "clause:" + s.id),
        ...output.legal.requiredReviewItems.map((c) => "check:" + c.id),
        "check:limits",
      ]
    : [];
  const allRead =
    requiredAck.length > 0 && requiredAck.every((id) => ack.includes(id));
  return (
    <section className="generator">
      <div className="section-page-heading">
        <div>
          <span className="eyebrow">RÉDIGER · CONTRÔLER · RELIRE</span>
          <h1>Générateur juridique</h1>
          <p>
            Des clauses structurées, des choix explicites et une trace de
            relecture.
          </p>
        </div>
        {step === "library" ? (
          <button className="button" onClick={() => setImporting(true)}>
            <FolderOpen size={16} />
            Modèle de cabinet
          </button>
        ) : (
          <button className="button" disabled={busy} onClick={library}>
            <ArrowLeft size={15} />
            Bibliothèque
          </button>
        )}
      </div>
      {step === "library" && (
        <>
          <div className="generator-scope">
            <Scale size={21} />
            <div>
              <strong>
                Droit français · relations entre professionnels privés
              </strong>
              <p>
                Les trames proposées restent des projets à adapter aux faits et
                au droit applicable. Vos propres modèles peuvent compléter cette
                bibliothèque.
              </p>
            </div>
            <span className="badge neutral">Sans clé API</span>
          </div>
          <div className="generator-templates">
            {templates.map((template, index) => (
              <button
                className="template-card"
                key={template.id}
                onClick={() => choose(template)}
              >
                <div className="template-card-top">
                  <span className={`card-icon ${index % 2 ? "sand" : "sage"}`}>
                    <FilePlus2 size={22} />
                  </span>
                  <span>{template.category}</span>
                  <ChevronRight size={17} />
                </div>
                <h2>{template.title}</h2>
                <p>{template.description}</p>
                <footer>
                  <span>{template.tag}</span>
                  <small>
                    {template.origin === "cabinet"
                      ? "Votre trame"
                      : "Trame versionnée"}
                  </small>
                </footer>
              </button>
            ))}
          </div>
          <div className="section-heading">
            <h2>Documents préparés dans ce dossier</h2>
            <span className="muted">{drafts.length} document(s)</span>
          </div>
          {drafts.length ? (
            <div className="generated-list">
              {drafts.map((d) => (
                <button key={d.id} onClick={() => openDraft(d)}>
                  <span className="file-symbol docx">DOCX</span>
                  <span>
                    <strong>{d.content.title}</strong>
                    <small>
                      Révision {d.revision} · {date(d.updatedAt)}
                    </small>
                  </span>
                  <span
                    className={`badge ${d.status === "reviewed" ? "success" : "warning"}`}
                  >
                    {d.status === "reviewed"
                      ? "Relecture enregistrée"
                      : "Projet"}
                  </span>
                  <ArrowRight size={16} />
                </button>
              ))}
            </div>
          ) : (
            <Empty title="Du questionnaire au document">
              Choisissez une trame pour préparer votre premier document
              juridique.
            </Empty>
          )}
        </>
      )}
      {step !== "library" && selected && (
        <div className="generator-steps">
          <span className="done">
            <Check size={12} />
            Modèle
          </span>
          <ChevronRight size={13} />
          <span className={step === "questionnaire" ? "current" : "done"}>
            2 · Questionnaire
          </span>
          <ChevronRight size={13} />
          <span className={step === "document" ? "current" : ""}>
            3 · Document et relecture
          </span>
        </div>
      )}
      {step === "questionnaire" && selected && (
        <div className="questionnaire-layout">
          <aside className="questionnaire-nav">
            <div className="questionnaire-model">
              <FileText size={19} />
              <strong>{selected.title}</strong>
              <small>
                {selected.origin === "cabinet"
                  ? "Modèle fourni par vous"
                  : "Droit français · trame Atelier"}
              </small>
            </div>
            {groups.map((g, i) => {
              const fields = selected.fields.filter((f) => f.group === g);
              const done = fields.filter((f) => answers[f.id]?.trim()).length;
              return (
                <button
                  key={g}
                  className={group === g ? "active" : ""}
                  onClick={() => setGroup(g)}
                >
                  <span>{i + 1}</span>
                  <strong>{g}</strong>
                  <small>
                    {done}/{fields.length}
                  </small>
                </button>
              );
            })}
          </aside>
          <div className="questionnaire-body">
            <div className="questionnaire-heading">
              <span className="eyebrow">{selected.title}</span>
              <h2>{group}</h2>
              <p>
                Renseignez les faits sans les supposer. Un champ manquant
                restera visible dans le projet.
              </p>
            </div>
            {group === groups[0] && (
              <label className="generator-field">
                Titre de votre document
                <input
                  disabled={busy}
                  value={title}
                  maxLength={180}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setAck([]);
                  }}
                />
              </label>
            )}
            <div className="generator-fields">
              {currentFields.map((f) => (
                <label
                  className={`generator-field ${f.type === "textarea" ? "full" : ""}`}
                  key={f.id}
                  htmlFor={`gen-${f.id}`}
                >
                  <span>
                    {f.label}
                    {f.required && <em> *</em>}
                  </span>
                  {f.type === "select" ? (
                    <select
                      disabled={busy}
                      id={`gen-${f.id}`}
                      value={answers[f.id] ?? ""}
                      onChange={(e) => updateAnswer(f.id, e.target.value)}
                    >
                      <option value="">Sélectionner…</option>
                      {f.options.map(([id, label]) => (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea
                      disabled={busy}
                      id={`gen-${f.id}`}
                      rows={f.id === "dpaText" ? 12 : 4}
                      maxLength={f.maxLength ?? 12000}
                      value={answers[f.id] ?? ""}
                      onChange={(e) => updateAnswer(f.id, e.target.value)}
                    />
                  ) : (
                    <input
                      disabled={busy}
                      id={`gen-${f.id}`}
                      type={f.type === "date" ? "date" : "text"}
                      inputMode={
                        ["money", "integer", "decimal", "siren"].includes(
                          f.type,
                        )
                          ? "decimal"
                          : undefined
                      }
                      maxLength={500}
                      value={answers[f.id] ?? ""}
                      onChange={(e) => updateAnswer(f.id, e.target.value)}
                    />
                  )}{" "}
                  {f.help && <small>{f.help}</small>}
                </label>
              ))}
            </div>
            <div className="questionnaire-footer">
              <button
                className="button"
                onClick={async () => {
                  if (await saveDraft())
                    onSuccess(
                      "Projet enregistré, y compris les champs à compléter.",
                    );
                }}
                disabled={busy}
              >
                <Save size={15} />
                Sauvegarder
              </button>
              <div className="inline">
                {groups.indexOf(group) < groups.length - 1 && (
                  <button
                    className="button"
                    onClick={() => setGroup(groups[groups.indexOf(group) + 1])}
                  >
                    Étape suivante
                    <ArrowRight size={15} />
                  </button>
                )}
                <button
                  className="button primary"
                  disabled={busy || !title.trim()}
                  onClick={generate}
                >
                  {busy ? (
                    <Loader2 size={15} className="spin" />
                  ) : (
                    <FilePlus2 size={15} />
                  )}
                  Générer le projet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {step === "document" && output && (
        <>
          <div className="generated-toolbar">
            <div>
              <strong>{title}</strong>
              <span
                className={`badge ${saved?.status === "reviewed" && !dirty ? "success" : "warning"}`}
              >
                {saved?.status === "reviewed" && !dirty
                  ? "Relecture enregistrée"
                  : dirty
                    ? "Projet non enregistré"
                    : "Projet enregistré"}
              </span>
            </div>
            <div className="inline">
              <button
                className="button"
                disabled={busy}
                onClick={() => {
                  setStep("questionnaire");
                  setGroup(groups[0]);
                }}
              >
                <ArrowLeft size={14} />
                Réponses
              </button>
              <button
                className="button"
                disabled={busy}
                onClick={async () => {
                  if (await saveDraft())
                    onSuccess("Projet et contrôles enregistrés.");
                }}
              >
                <Save size={14} />
                {dirty ? "Vérifier et enregistrer" : "Enregistrer une révision"}
              </button>
              <button
                className="button"
                disabled={busy}
                onClick={async () => {
                  const record = dirty || !saved ? await saveDraft() : saved;
                  if (record)
                    download(
                      `/generator/drafts/${record.id}/export?mode=draft`,
                    );
                }}
              >
                <Download size={14} />
                Word · projet
              </button>
            </div>
          </div>
          <div className="document-generation-layout">
            <div className="generated-paper">
              <div className="generated-paper-cover">
                <span className="eyebrow">
                  {selected.category} · DROIT FRANÇAIS
                </span>
                <h2>{title}</h2>
                <p>
                  {selected.origin === "cabinet"
                    ? "Modèle de cabinet fourni par vous"
                    : "Rédaction structurée à partir du questionnaire"}{" "}
                  · Révision {saved?.revision ?? "en préparation"}
                </p>
                <div className="paper-stamp">
                  {saved?.status === "reviewed" && !dirty
                    ? "Relecture déclarée sur cette révision"
                    : "PROJET — À COMPLÉTER ET RELIRE"}
                </div>
              </div>
              {output.content.sections.map((section, i) => (
                <article className="generated-clause" key={section.id}>
                  <header>
                    <span className="clause-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3>{section.title}</h3>
                    {Object.hasOwn(overrides, section.id) && (
                      <span className="badge neutral">Modifiée</span>
                    )}
                  </header>
                  <textarea
                    disabled={busy}
                    aria-label={`Clause ${section.title}`}
                    className={section.emphasis ? "emphasized" : ""}
                    value={overrides[section.id] ?? section.body}
                    onChange={(e) => {
                      setOverrides((v) => ({
                        ...v,
                        [section.id]: e.target.value,
                      }));
                      setAck([]);
                    }}
                    style={{
                      minHeight: Math.min(
                        680,
                        Math.max(
                          120,
                          Math.ceil(
                            (overrides[section.id] ?? section.body).length / 75,
                          ) *
                            23 +
                            30,
                        ),
                      ),
                    }}
                    maxLength={45000}
                  />
                  <div className="clause-footer">
                    <div>
                      {section.sourceIds.map(
                        (id) =>
                          sourceMap[id] && (
                            <a
                              key={id}
                              href={sourceMap[id].url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <BookOpen size={12} />
                              {sourceMap[id].title}
                            </a>
                          ),
                      )}
                    </div>
                    <label className="review-tick">
                      <input
                        type="checkbox"
                        disabled={busy || dirty || !saved}
                        checked={!dirty && ack.includes("clause:" + section.id)}
                        onChange={() => toggle("clause:" + section.id)}
                      />
                      Clause relue
                    </label>
                  </div>
                </article>
              ))}
            </div>
            <aside className="generator-inspector">
              <div className="inspector-tabs">
                {[
                  ["checks", "Contrôles"],
                  ["sources", "Sources"],
                  ["review", "Relecture"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    className={inspector === id ? "active" : ""}
                    onClick={() => setInspector(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {dirty && (
                <div className="generator-pending">
                  <TriangleAlert size={17} />
                  <p>
                    Des réponses ou clauses ont changé. Cliquez sur « Vérifier
                    et enregistrer » pour actualiser les contrôles et relire la
                    nouvelle révision.
                  </p>
                </div>
              )}
              {inspector === "checks" && (
                <>
                  <div className="legal-summary">
                    <ShieldCheck size={22} />
                    <strong>
                      {output.legal.blockingCount} point(s) bloquant(s)
                    </strong>
                    <p>
                      Contrôles structurels et de cohérence ; aucune
                      certification juridique automatique.
                    </p>
                  </div>
                  {output.legal.issues.map((item) => (
                    <div
                      className={`legal-issue ${item.severity}`}
                      key={item.id}
                    >
                      <span>
                        {item.severity === "blocking" ? (
                          <X size={14} />
                        ) : (
                          <TriangleAlert size={14} />
                        )}
                      </span>
                      <div>
                        <strong>
                          {item.severity === "blocking"
                            ? "À compléter / corriger"
                            : "Point de vigilance"}
                        </strong>
                        <p>{item.message}</p>
                        {item.field && (
                          <button
                            onClick={() => {
                              setGroup(
                                selected.fields.find((f) => f.id === item.field)
                                  ?.group ?? groups[0],
                              );
                              setStep("questionnaire");
                            }}
                          >
                            Revenir au champ
                            <ArrowRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
              {inspector === "sources" && (
                <div className="legal-sources">
                  <p>
                    {output.legal.sources.length
                      ? `Références consultées le ${output.legal.checkedAt}. Chaque référence indique sa portée ; elle ne valide pas la clause à elle seule.`
                      : "Aucune référence légale de ce modèle de cabinet n’a été vérifiée par Atelier."}
                  </p>
                  {output.legal.sources.map((source) => (
                    <article key={source.id}>
                      <a href={source.url} target="_blank" rel="noreferrer">
                        <BookOpen size={15} />
                        {source.title}
                        <ArrowRight size={12} />
                      </a>
                      <p>{source.note}</p>
                      {source.validUntil && (
                        <small>
                          Version à réexaminer avant le {source.validUntil}.
                        </small>
                      )}
                    </article>
                  ))}
                  {!output.legal.sources.length && (
                    <p className="notice">
                      Ce modèle a été fourni par vous. Atelier n’en a pas
                      vérifié les références juridiques.
                    </p>
                  )}
                </div>
              )}
              {inspector === "review" && (
                <div className="legal-review">
                  <h3>Enregistrer une relecture</h3>
                  <p>
                    Relisez chaque clause dans le document, puis les points
                    ci-dessous. Toute modification réinitialise cette relecture.
                  </p>
                  {output.legal.requiredReviewItems.map((item) => (
                    <label className="review-check" key={item.id}>
                      <input
                        type="checkbox"
                        disabled={busy || dirty || !saved}
                        checked={ack.includes("check:" + item.id)}
                        onChange={() => toggle("check:" + item.id)}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                  <label className="review-check">
                    <input
                      type="checkbox"
                      disabled={busy || dirty || !saved}
                      checked={ack.includes("check:limits")}
                      onChange={() => toggle("check:limits")}
                    />
                    <span>
                      J’ai examiné les points de vigilance et l’actualité des
                      sources. Cette relecture ne constitue ni une signature ni
                      une certification automatique.
                    </span>
                  </label>
                  <div className="review-progress">
                    <CheckCircle2 size={16} />
                    {ack.filter((id) => requiredAck.includes(id)).length} /{" "}
                    {requiredAck.length} points relus
                  </div>
                  <label className="generator-field">
                    Nom du relecteur
                    <input
                      aria-label="Nom du relecteur"
                      value={reviewer}
                      onChange={(e) => setReviewer(e.target.value)}
                      maxLength={160}
                    />
                  </label>
                  <label className="generator-field">
                    Qualité déclarée
                    <select
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                    >
                      <option value="legal">Juriste</option>
                      <option value="lawyer">Avocat</option>
                      <option value="other">Autre relecteur</option>
                    </select>
                  </label>
                  <small>
                    L’identité et la qualification sont déclaratives dans cette
                    application locale.
                  </small>
                  <button
                    className="button primary full-width"
                    disabled={
                      busy ||
                      dirty ||
                      !saved ||
                      output.legal.blockingCount > 0 ||
                      !allRead ||
                      reviewer.trim().length < 3
                    }
                    onClick={review}
                  >
                    <Check size={16} />
                    Enregistrer la relecture
                  </button>
                  <button
                    className="button full-width"
                    disabled={busy || dirty || saved?.status !== "reviewed"}
                    onClick={() =>
                      download(
                        `/generator/drafts/${saved.id}/export?mode=reviewed`,
                      )
                    }
                  >
                    <Download size={16} />
                    Word · révision relue
                  </button>
                </div>
              )}
            </aside>
          </div>
          {saved?.history?.length > 0 && (
            <details className="generated-history">
              <summary>
                Historique des versions ({saved.history.length})
              </summary>
              {[...saved.history].reverse().map((h) => (
                <article key={h.revision}>
                  <strong>Révision {h.revision}</strong>
                  <span>{date(h.updatedAt)}</span>
                  <p>
                    {h.review
                      ? `Relecture déclarée par ${h.review.reviewer}`
                      : "Projet sans relecture enregistrée"}
                  </p>
                  <details className="archived-draft">
                    <summary>Voir la rédaction archivée</summary>
                    {h.content.sections.map((section) => (
                      <section key={section.id}>
                        <h4>{section.title}</h4>
                        <div>{section.body}</div>
                      </section>
                    ))}
                  </details>
                </article>
              ))}
            </details>
          )}
        </>
      )}
      {confirmRegenerate && (
        <Modal
          title="Régénérer le document ?"
          onClose={() => setConfirmRegenerate(false)}
        >
          <p>
            La nouvelle génération remplacera vos modifications manuelles de
            clauses par la rédaction issue du questionnaire. Les révisions déjà
            enregistrées restent dans l’historique.
          </p>
          <div className="modal-footer">
            <button
              className="button"
              onClick={() => setConfirmRegenerate(false)}
            >
              Conserver mes modifications
            </button>
            <button className="button primary" onClick={() => generate(true)}>
              Régénérer depuis les réponses
            </button>
          </div>
        </Modal>
      )}
      {importing && (
        <ImportModel
          documents={documents}
          matterId={matterId}
          onClose={() => setImporting(false)}
          onError={onError}
          onCreated={async (template) => {
            await load();
            setImporting(false);
            choose(template);
          }}
        />
      )}
    </section>
  );
}

function ImportModel({ documents, matterId, onClose, onError, onCreated }) {
  const [title, setTitle] = useState(""),
    [body, setBody] = useState(""),
    [sourceDocumentId, setSource] = useState(""),
    [busy, setBusy] = useState(false);
  const variables = [
    ...new Set(
      [...body.matchAll(/\{\{([a-z][a-z0-9_]{1,63})\}\}/g)].map((m) => m[1]),
    ),
  ];
  return (
    <Modal title="Votre modèle de cabinet" onClose={onClose} wide>
      <p className="muted">
        Collez une trame que vous êtes autorisé à utiliser. Marquez les champs
        variables avec <code>{"{{nom_du_champ}}"}</code>. Le texte du modèle
        sera conservé sans réécriture générative.
      </p>
      <label>
        Titre du modèle
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={180}
        />
      </label>
      <label>
        Reprendre le texte d’un document du dossier
        <select
          value={sourceDocumentId}
          onChange={async (e) => {
            const id = e.target.value;
            setSource(id);
            if (id) {
              setBusy(true);
              try {
                const doc = await api(`/documents/${id}`);
                setBody(doc.text);
                if (!title) setTitle(doc.name);
              } catch (error) {
                onError(error);
              } finally {
                setBusy(false);
              }
            }
          }}
        >
          <option value="">Texte collé manuellement</option>
          {documents
            .filter((d) => d.status === "ready")
            .map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
        </select>
      </label>
      <label>
        Texte du modèle
        <textarea
          className="template-body-input"
          aria-label="Texte du modèle"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={60000}
          placeholder={
            "Entre {{societe_a}} et {{societe_b}}…\nObjet : {{objet_de_la_mission}}"
          }
        />
      </label>
      <p className="muted small-text">
        {variables.length} variable(s) détectée(s) :{" "}
        {variables.join(", ") || "aucune"}. La conformité juridique du modèle
        reste à vérifier.
      </p>
      <div className="modal-footer">
        <button className="button" onClick={onClose}>
          Annuler
        </button>
        <button
          className="button primary"
          disabled={
            busy ||
            title.trim().length < 3 ||
            body.trim().length < 30 ||
            !variables.length ||
            variables.length > 40
          }
          onClick={async () => {
            setBusy(true);
            try {
              const result = await api(
                `/matters/${matterId}/generator/templates`,
                {
                  method: "POST",
                  body: {
                    title,
                    body,
                    ...(sourceDocumentId ? { sourceDocumentId } : {}),
                  },
                },
              );
              await onCreated(result);
            } catch (e) {
              onError(e);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Plus size={16} />
          Ajouter le modèle
        </button>
      </div>
    </Modal>
  );
}
