import React, { useEffect, useState } from "react";
import { api, download } from "./api";
import "./research.css";

export default function Research({
  matterId,
  documents,
  comparisonMode = false,
  onSource,
  onError,
}) {
  const [data, setData] = useState(null),
    [busy, setBusy] = useState(false),
    [session, setSession] = useState(null),
    [comparison, setComparison] = useState(null);
  const [left, setLeft] = useState(""),
    [right, setRight] = useState(""),
    [filter, setFilter] = useState("changed");
  const [query, setQuery] = useState(""),
    [corpus, setCorpus] = useState("documents"),
    [mode, setMode] = useState("all"),
    [jurisdiction, setJurisdiction] = useState("all"),
    [kind, setKind] = useState("all"),
    [asOf, setAsOf] = useState("");
  const [scope, setScope] = useState(null),
    [adding, setAdding] = useState(false);
  const load = () => api(`/matters/${matterId}/research`).then(setData);
  useEffect(() => {
    let active = true;
    api(`/matters/${matterId}/research`)
      .then((d) => {
        if (active) setData(d);
      })
      .catch(onError);
    return () => {
      active = false;
    };
  }, [matterId]);
  async function perform(fn) {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (e) {
      onError(e);
    } finally {
      setBusy(false);
    }
  }
  async function bookmark(index) {
    await perform(async () => {
      const bookmarks = session.bookmarks.includes(index)
        ? session.bookmarks.filter((i) => i !== index)
        : [...session.bookmarks, index];
      setSession(
        await api(`/research/${session.id}/bookmarks`, {
          method: "PATCH",
          body: { bookmarks },
        }),
      );
    });
  }
  async function annotate(change, decision, comment) {
    await perform(async () =>
      setComparison(
        await api(`/comparisons/${comparison.id}`, {
          method: "PATCH",
          body: {
            revision: comparison.revision,
            changeId: change.id,
            decision,
            comment,
          },
        }),
      ),
    );
  }
  if (!data) return <p role="status">Chargement de l’espace de recherche…</p>;
  const changed =
    comparison?.changes.filter((c) => c.status !== "unchanged") || [];
  return (
    <section className="research-workspace" aria-busy={busy}>
      <header>
        <p className="eyebrow">ATELIER · ANALYSE DOCUMENTAIRE</p>
        <h1>
          {comparisonMode ? "Comparer les documents" : "Recherche juridique"}
        </h1>
        <p>
          {comparisonMode
            ? "Vérifiez les écarts entre deux pièces, puis consignez votre décision."
            : "Retrouvez des passages, constituez votre corpus et conservez les preuves utiles."}
        </p>
      </header>
      <fieldset disabled={busy} className="research-controls">
        {comparisonMode ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              perform(async () =>
                setComparison(
                  await api(`/matters/${matterId}/comparisons`, {
                    method: "POST",
                    body: { leftId: left, rightId: right },
                  }),
                ),
              );
            }}
          >
            <label>
              Document de référence
              <select
                required
                value={left}
                onChange={(e) => setLeft(e.target.value)}
              >
                <option value="">Choisir une version</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Document à comparer
              <select
                required
                value={right}
                onChange={(e) => setRight(e.target.value)}
              >
                <option value="">Choisir une version</option>
                {documents
                  .filter((d) => d.id !== left)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
              </select>
            </label>
            <button
              className="btn primary"
              disabled={!left || !right || left === right}
            >
              Comparer les versions
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              perform(async () =>
                setSession(
                  await api(`/matters/${matterId}/research`, {
                    method: "POST",
                    body: {
                      query,
                      corpus,
                      mode,
                      jurisdiction,
                      kind,
                      ...(asOf ? { asOf } : {}),
                      ...(corpus === "documents" && scope !== null
                        ? { documentIds: scope }
                        : {}),
                    },
                  }),
                ),
              );
            }}
          >
            <label className="research-query">
              Question ou termes recherchés
              <input
                required
                minLength={2}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={'responsabilité "faute lourde" -assurance'}
              />
            </label>
            <label>
              Corpus
              <select
                value={corpus}
                onChange={(e) => setCorpus(e.target.value)}
              >
                <option value="documents">Pièces du dossier</option>
                <option value="references">
                  Références juridiques importées
                </option>
              </select>
            </label>
            <label>
              Correspondance
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="all">Tous les termes</option>
                <option value="any">Un terme ou un synonyme</option>
              </select>
            </label>
            {corpus === "references" && (
              <>
                <label>
                  Juridiction
                  <select
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                  >
                    <option value="all">Toutes</option>
                    <option value="FR">France</option>
                    <option value="EU">Union européenne</option>
                  </select>
                </label>
                <label>
                  Nature
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                  >
                    {[
                      ["all", "Toutes"],
                      ["legislation", "Législation"],
                      ["jurisprudence", "Jurisprudence"],
                      ["doctrine", "Doctrine"],
                      ["internal", "Interne"],
                    ].map(([v, t]) => (
                      <option key={v} value={v}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Date d’application déclarée
                  <input
                    type="date"
                    value={asOf}
                    onChange={(e) => setAsOf(e.target.value)}
                  />
                </label>
              </>
            )}
            <button className="btn primary">Lancer la recherche</button>
            <p className="research-help">
              Guillemets : expression exacte. −mot : exclusion. Classement
              lexical avec synonymes limités ; aucune recherche externe
              automatique.
            </p>
            {corpus === "documents" && (
              <details>
                <summary>
                  Périmètre :{" "}
                  {scope === null
                    ? "toutes les pièces"
                    : `${scope.length} pièce(s)`}
                </summary>
                <button type="button" onClick={() => setScope(null)}>
                  Tout sélectionner
                </button>
                {documents.map((d) => (
                  <label className="research-check" key={d.id}>
                    <input
                      type="checkbox"
                      checked={scope === null || scope.includes(d.id)}
                      onChange={(e) =>
                        setScope(
                          e.target.checked
                            ? [...new Set([...(scope || []), d.id])]
                            : (scope || documents.map((x) => x.id)).filter(
                                (id) => id !== d.id,
                              ),
                        )
                      }
                    />
                    {d.name}
                  </label>
                ))}
              </details>
            )}
          </form>
        )}
      </fieldset>
      {busy && <p role="status">Traitement en cours…</p>}
      {comparisonMode ? (
        <>
          {comparison && (
            <>
              <div className="research-toolbar">
                <strong>
                  {changed.length} écarts ·{" "}
                  {changed.filter((c) => c.decision === "pending").length} à
                  examiner
                </strong>
                <select
                  aria-label="Filtrer les différences"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  {[
                    ["changed", "Écarts uniquement"],
                    ["all", "Tous les paragraphes"],
                    ["flagged", "Signalés"],
                    ["pending", "À examiner"],
                  ].map(([v, t]) => (
                    <option key={v} value={v}>
                      {t}
                    </option>
                  ))}
                </select>
                <button
                  className="btn"
                  onClick={() =>
                    download(`/comparisons/${comparison.id}/evidence.docx`)
                  }
                >
                  Exporter la comparaison Word
                </button>
              </div>
              <p className="research-notice">{comparison.method}</p>
              {comparison.warnings.map((w, i) => (
                <p className="research-notice" key={i}>
                  {w}
                </p>
              ))}
              {comparison.changes
                .filter(
                  (c) =>
                    filter === "all" ||
                    (filter === "changed" && c.status !== "unchanged") ||
                    (filter === "flagged" && c.decision === "flagged") ||
                    (filter === "pending" &&
                      c.status !== "unchanged" &&
                      c.decision === "pending"),
                )
                .map((c, i) => (
                  <article className={`comparison-row ${c.status}`} key={c.id}>
                    <header>
                      <strong>
                        {i + 1}.{" "}
                        {
                          {
                            modified: "Modifié",
                            added: "Ajouté",
                            removed: "Supprimé",
                            unchanged: "Identique",
                          }[c.status]
                        }
                      </strong>
                      <span>{c.flags.join(" · ")}</span>
                    </header>
                    <div className="comparison-columns">
                      {[c.left, c.right].map((r, j) => (
                        <div key={j}>
                          <small>{j ? "Après" : "Avant"}</small>
                          <p>
                            {c.tokens
                              ? c.tokens[j ? "right" : "left"].map((t, k) =>
                                  t.changed ? (
                                    j ? (
                                      <ins key={k}>{t.text}</ins>
                                    ) : (
                                      <del key={k}>{t.text}</del>
                                    )
                                  ) : (
                                    <React.Fragment key={k}>
                                      {t.text}
                                    </React.Fragment>
                                  ),
                                )
                              : r?.quote || "∅"}
                          </p>
                          {r && (
                            <button
                              className="source-link"
                              onClick={() => onSource(r)}
                            >
                              {r.documentName} · {r.pageLabel} · {r.blockId}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {c.status !== "unchanged" && (
                      <ChangeReview
                        key={`${c.id}-${comparison.revision}`}
                        change={c}
                        busy={busy}
                        save={(d, n) => annotate(c, d, n)}
                      />
                    )}
                  </article>
                ))}
            </>
          )}
          <HistoryList
            title="Comparaisons enregistrées"
            items={data.comparisons}
            onSelect={setComparison}
            label={(c) => `${c.leftName} → ${c.rightName}`}
          />
        </>
      ) : (
        <>
          {session && (
            <section aria-label="Résultats de recherche">
              <div className="research-toolbar">
                <h2>{session.results.length} passages retrouvés</h2>
                <button
                  className="btn"
                  onClick={() =>
                    download(`/research/${session.id}/evidence.docx`)
                  }
                >
                  Exporter les preuves Word
                </button>
              </div>
              <p>
                {session.query} · {session.examined} sources ·{" "}
                {session.blocksExamined} passages examinés
              </p>
              <p className="research-notice">{session.limitations}</p>
              {!session.results.length && (
                <p>
                  Aucun passage retrouvé. Essayez moins de termes ou le mode «
                  Un terme ou un synonyme ».
                </p>
              )}
              {session.results.map((r, i) => (
                <article className="research-result" key={i}>
                  <header>
                    <h3>{r.documentName}</h3>
                    <button
                      disabled={busy}
                      aria-pressed={session.bookmarks.includes(i)}
                      onClick={() => bookmark(i)}
                    >
                      {session.bookmarks.includes(i)
                        ? "Retirer de la sélection"
                        : "Conserver ce passage"}
                    </button>
                  </header>
                  <blockquote>{r.quote}</blockquote>
                  <p className="research-help">
                    Termes : {r.matched.join(", ") || "expression exacte"}
                    {r.related.length
                      ? ` · Synonymes : ${r.related.join(", ")}`
                      : ""}{" "}
                    · Score {r.score}
                  </p>
                  {r.documentId ? (
                    <button className="source-link" onClick={() => onSource(r)}>
                      Vérifier la source · {r.pageLabel} · {r.blockId}
                    </button>
                  ) : (
                    <>
                      <a href={r.url} target="_blank" rel="noreferrer">
                        Ouvrir la référence déclarée ↗
                      </a>
                      <p className="research-help">
                        {r.jurisdiction} · {r.kind} ·{" "}
                        {r.date || "Date non renseignée"} · {r.verification}
                      </p>
                    </>
                  )}
                </article>
              ))}
            </section>
          )}
          <HistoryList
            title="Recherches enregistrées"
            items={data.searches}
            onSelect={setSession}
            label={(s) => `${s.query} · ${s.results.length} résultats`}
          />
          <section className="reference-library">
            <div className="research-toolbar">
              <h2>Bibliothèque juridique du dossier</h2>
              <button className="btn" onClick={() => setAdding(!adding)}>
                {adding ? "Fermer" : "Ajouter une référence"}
              </button>
            </div>
            <p>
              Importez uniquement des textes que vous êtes autorisé à utiliser.
              La date, la juridiction et la vigueur sont déclaratives.
            </p>
            {adding && (
              <ReferenceForm
                busy={busy}
                submit={(body) =>
                  perform(async () => {
                    await api(`/matters/${matterId}/references`, {
                      method: "POST",
                      body,
                    });
                    setAdding(false);
                  })
                }
              />
            )}{" "}
            {data.references.map((r) => (
              <article className="research-result" key={r.id}>
                <strong>{r.title}</strong>
                <p>
                  {r.jurisdiction} · {r.kind} · {r.date || "Sans date"}
                </p>
                <a href={r.url} target="_blank" rel="noreferrer">
                  Source déclarée ↗
                </a>{" "}
                <button
                  disabled={busy}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Supprimer cette référence et les recherches qui en reproduisent le texte ?",
                      )
                    )
                      perform(async () => {
                        await api(`/references/${r.id}`, { method: "DELETE" });
                        setSession(null);
                      });
                  }}
                >
                  Supprimer
                </button>
              </article>
            ))}
          </section>
          <details className="research-references">
            <summary>Repères officiels et accès aux bases</summary>
            <p>
              Les repères ci-dessous sont des notes éditoriales ; ils ne
              constituent pas un corpus intégral de textes en vigueur.
            </p>
            {data.guides.map((g) => (
              <p key={g.id}>
                <a href={g.url} target="_blank" rel="noreferrer">
                  {g.title} ↗
                </a>{" "}
                · repère vérifié le {g.checkedAt}
                <br />
                {g.note}
              </p>
            ))}
            {data.connectors.map((c) => (
              <p key={c.name}>
                <a href={c.url} target="_blank" rel="noreferrer">
                  {c.name} ↗
                </a>{" "}
                — {c.description}
              </p>
            ))}
          </details>
        </>
      )}
    </section>
  );
}

function ChangeReview({ change, busy, save }) {
  const [decision, setDecision] = useState(change.decision),
    [comment, setComment] = useState(change.comment);
  return (
    <form
      className="change-review"
      onSubmit={(e) => {
        e.preventDefault();
        save(decision, comment);
      }}
    >
      <label>
        Décision
        <select
          disabled={busy}
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
        >
          <option value="pending">À examiner</option>
          <option value="accepted">Écart accepté</option>
          <option value="flagged">À négocier / vérifier</option>
        </select>
      </label>
      <label>
        Commentaire
        <input
          maxLength={4000}
          disabled={busy}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </label>
      <button
        className="btn"
        disabled={
          busy || (decision === change.decision && comment === change.comment)
        }
      >
        Enregistrer la décision
      </button>
    </form>
  );
}
function HistoryList({ title, items, onSelect, label }) {
  return (
    <details className="research-history">
      <summary>
        {title} ({items.length})
      </summary>
      {[...items].reverse().map((item) => (
        <button key={item.id} onClick={() => onSelect(item)}>
          {label(item)}{" "}
          <small>{new Date(item.createdAt).toLocaleString("fr-FR")}</small>
        </button>
      ))}
    </details>
  );
}
function ReferenceForm({ busy, submit }) {
  return (
    <form
      className="reference-form"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const body = Object.fromEntries(f);
        if (!body.date) delete body.date;
        if (!body.validUntil) delete body.validUntil;
        submit(body);
      }}
    >
      <label>
        Titre / référence
        <input name="title" required minLength={3} maxLength={300} />
      </label>
      <label>
        URL de la source
        <input name="url" type="url" required placeholder="https://…" />
      </label>
      <label>
        Juridiction
        <select name="jurisdiction">
          <option value="FR">France</option>
          <option value="EU">Union européenne</option>
        </select>
      </label>
      <label>
        Nature
        <select name="kind">
          <option value="legislation">Législation</option>
          <option value="jurisprudence">Jurisprudence</option>
          <option value="doctrine">Doctrine</option>
          <option value="internal">Interne</option>
        </select>
      </label>
      <label>
        Début de vigueur / date de décision
        <input type="date" name="date" />
      </label>
      <label>
        Fin de vigueur exclusive (si connue)
        <input type="date" name="validUntil" />
      </label>
      <label className="reference-text">
        Texte intégral ou extrait autorisé
        <textarea
          name="text"
          required
          minLength={30}
          maxLength={150000}
          rows={8}
        />
      </label>
      <button className="btn primary" disabled={busy}>
        Enregistrer la référence
      </button>
    </form>
  );
}
