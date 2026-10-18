import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeftRight,
  Upload,
  FileText,
  Download,
  Check,
  Flag,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { api, bytes, date, download } from "./api";
import "./compare.css";

const labels = {
  modified: "Modifié",
  added: "Ajouté",
  removed: "Supprimé",
  unchanged: "Identique",
};
export default function Compare({
  matterId,
  documents,
  onImported,
  onSource,
  onError,
  guard,
}) {
  const [selected, setSelected] = useState({ left: "", right: "" }),
    [comparison, setComparison] = useState(null),
    [history, setHistory] = useState([]),
    [busy, setBusy] = useState(""),
    [view, setView] = useState("redline"),
    [filter, setFilter] = useState("changed"),
    [query, setQuery] = useState(""),
    [active, setActive] = useState(null);
  const [edits, setEdits] = useState({});
  const lock = useRef(false);
  const byId = new Map(documents.map((d) => [d.id, d]));
  useEffect(() => {
    let live = true;
    api(`/matters/${matterId}/research`)
      .then((d) => {
        if (live) setHistory(d.comparisons.slice().reverse());
      })
      .catch(onError);
    return () => {
      live = false;
    };
  }, [matterId]);
  async function run(label, action) {
    if (lock.current) return false;
    lock.current = true;
    setBusy(label);
    try {
      await action();
      return true;
    } catch (e) {
      onError(e);
      return false;
    } finally {
      lock.current = false;
      setBusy("");
    }
  }
  function edit(change, patch) {
    setEdits((previous) => {
      const next = { ...previous };
      const draft = {
        decision: change.decision,
        comment: change.comment,
        ...previous[change.id],
        ...patch,
      };
      if (
        draft.decision === change.decision &&
        draft.comment === change.comment
      )
        delete next[change.id];
      else next[change.id] = draft;
      return next;
    });
  }
  async function saveEdits() {
    if (!Object.keys(edits).length) return !lock.current;
    return run("Enregistrement des décisions", async () => {
      let next = comparison;
      for (const [changeId, draft] of Object.entries(edits)) {
        next = await api(`/comparisons/${next.id}`, {
          method: "PATCH",
          body: { revision: next.revision, changeId, ...draft },
        });
        setComparison(next);
        setEdits((previous) => {
          const remaining = { ...previous };
          delete remaining[changeId];
          return remaining;
        });
      }
      setHistory((h) => h.map((c) => (c.id === next.id ? next : c)));
    });
  }
  useEffect(() => {
    if (guard) guard.current = saveEdits;
    return () => {
      if (guard) guard.current = null;
    };
  }, [edits, comparison]);
  useEffect(() => {
    const handler = (e) => {
      if (Object.keys(edits).length) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [edits]);
  function apply(c) {
    setEdits({});
    setComparison(c);
    setSelected({ left: c.leftId, right: c.rightId });
    setHistory((h) => [c, ...h.filter((x) => x.id !== c.id)]);
    setActive(c.changes.find((x) => x.status !== "unchanged")?.id || null);
  }
  async function upload(side, file) {
    if (!file) return;
    if (!(await saveEdits())) return;
    await run(
      `Import ${side === "left" ? "de la référence" : "de la nouvelle version"}`,
      async () => {
        const form = new FormData();
        form.append("files", file);
        const result = await api(`/matters/${matterId}/documents?reuse=true`, {
          method: "POST",
          body: form,
        });
        const doc = result.documents[0];
        if (!doc)
          throw Error(result.errors?.[0]?.message || "Import impossible.");
        await onImported();
        setSelected((s) => ({ ...s, [side]: doc.id }));
        setComparison(null);
        setActive(null);
      },
    );
  }
  function jump(id) {
    setActive(id);
    document
      .getElementById(`change-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  const changes = comparison?.changes || [],
    changed = changes.filter((c) => c.status !== "unchanged");
  const visible = changes.filter(
    (c) =>
      (filter === "all" ||
        (filter === "changed" && c.status !== "unchanged") ||
        (filter === "flagged" && c.decision === "flagged") ||
        (filter === "pending" &&
          c.status !== "unchanged" &&
          c.decision === "pending") ||
        filter === c.status) &&
      (!query ||
        `${c.left?.quote || ""} ${c.right?.quote || ""}`
          .toLocaleLowerCase("fr")
          .includes(query.toLocaleLowerCase("fr"))),
  );
  const index = visible.findIndex((c) => c.id === active);
  return (
    <section className="compare-workspace" aria-busy={!!busy}>
      <header className="compare-heading">
        <div>
          <span className="eyebrow">COMPARAISON · SUIVI DES MODIFICATIONS</span>
          <h1>Chaque changement, en clair.</h1>
          <p>
            Importez vos deux versions. Examinez les écarts. Emportez un Word en
            redline.
          </p>
        </div>
        <span className="compare-private">
          <ShieldCheck size={16} />
          Traitement local
        </span>
      </header>
      <div className="compare-upload-grid">
        {["left", "right"].map((side, i) => (
          <DocumentSlot
            key={side}
            side={side}
            index={i}
            document={byId.get(selected[side])}
            value={selected[side]}
            documents={documents}
            busy={!!busy}
            onSelect={async (id) => {
              if (!(await saveEdits())) return;
              setSelected((s) => ({ ...s, [side]: id }));
              setComparison(null);
              setActive(null);
            }}
            onUpload={(file) => upload(side, file)}
          />
        ))}
        <div className="compare-bridge">
          <ArrowRight size={20} />
        </div>
      </div>
      <div className="compare-start">
        <p>
          <FileText size={15} />
          DOCX recommandé · PDF texte, TXT et Markdown acceptés · 25 Mo par
          fichier
        </p>
        <button
          className="button primary"
          disabled={!!busy || !selected.left || !selected.right}
          onClick={async () =>
            (await saveEdits()) &&
            run("Comparaison des versions", async () =>
              apply(
                await api(`/matters/${matterId}/comparisons`, {
                  method: "POST",
                  body: { leftId: selected.left, rightId: selected.right },
                }),
              ),
            )
          }
        >
          {busy ? (
            <Loader2 size={17} className="spin" />
          ) : (
            <ArrowLeftRight size={17} />
          )}
          Comparer les versions
        </button>
      </div>
      {busy && (
        <p className="compare-progress" role="status">
          {busy}…
        </p>
      )}
      {!comparison ? (
        <div className="compare-intro">
          <div>
            <span>01</span>
            <strong>Deux versions</strong>
            <p>
              Un original et une version révisée, importés ici ou choisis dans
              le dossier.
            </p>
          </div>
          <div>
            <span>02</span>
            <strong>Une lecture précise</strong>
            <p>
              Les ajouts en vert, les suppressions en rouge, avec retour aux
              sources.
            </p>
          </div>
          <div>
            <span>03</span>
            <strong>Un Word exploitable</strong>
            <p>
              Des révisions natives à accepter ou rejeter dans Microsoft Word.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="compare-summary">
            {[
              ["modified", "Modifications"],
              ["added", "Ajouts"],
              ["removed", "Suppressions"],
              ["unchanged", "Identiques"],
            ].map(([status, label]) => (
              <button
                key={status}
                className={`compare-stat ${status} ${filter === status ? "selected" : ""}`}
                onClick={() => setFilter(status)}
              >
                <strong>
                  {changes.filter((c) => c.status === status).length}
                </strong>
                <span>{label}</span>
              </button>
            ))}
            <div className="compare-review-progress">
              <Check size={16} />
              {changed.filter((c) => c.decision === "accepted").length} /{" "}
              {changed.length} écarts acceptés
            </div>
            {Object.keys(edits).length > 0 && (
              <button className="button" disabled={!!busy} onClick={saveEdits}>
                Enregistrer {Object.keys(edits).length} décision(s)
              </button>
            )}
          </div>
          <div className="compare-result-header">
            <div>
              <h2>Version de travail</h2>
              <p>
                {comparison.leftName} <ArrowRight size={13} />{" "}
                {comparison.rightName}
              </p>
            </div>
            <div className="compare-export">
              <button
                className="button primary"
                disabled={!!busy}
                onClick={() =>
                  download(`/comparisons/${comparison.id}/word?mode=redline`)
                }
              >
                <Download size={16} />
                Télécharger le Word redline
              </button>
              <details>
                <summary>Autres exports</summary>
                <button
                  onClick={() =>
                    download(`/comparisons/${comparison.id}/word?mode=revised`)
                  }
                >
                  Word · version révisée
                </button>
                <button
                  onClick={() =>
                    download(`/comparisons/${comparison.id}/word?mode=original`)
                  }
                >
                  Word · version originale
                </button>
                <button
                  onClick={() =>
                    download(`/comparisons/${comparison.id}/evidence.docx`)
                  }
                >
                  Rapport de comparaison
                </button>
              </details>
            </div>
          </div>
          <div className="compare-toolbar">
            <div
              className="compare-tabs"
              role="group"
              aria-label="Mode de lecture"
            >
              <button
                aria-pressed={view === "redline"}
                onClick={() => setView("redline")}
              >
                Redline
              </button>
              <button
                aria-pressed={view === "split"}
                onClick={() => setView("split")}
              >
                Côte à côte
              </button>
            </div>
            <label className="compare-search">
              <Search size={16} />
              <input
                aria-label="Rechercher dans les différences"
                placeholder="Rechercher un passage…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              aria-label="Filtrer les différences"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {[
                ["changed", "Tous les écarts"],
                ["all", "Document complet"],
                ["pending", "À examiner"],
                ["flagged", "Signalés"],
                ["modified", "Modifiés"],
                ["added", "Ajoutés"],
                ["removed", "Supprimés"],
                ["unchanged", "Identiques"],
              ].map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
            <button
              className="icon-button"
              title="Écart précédent"
              disabled={index <= 0}
              onClick={() => jump(visible[index - 1].id)}
            >
              <ChevronLeft size={17} />
            </button>
            <button
              className="icon-button"
              title="Écart suivant"
              disabled={!visible.length || index >= visible.length - 1}
              onClick={() => jump(visible[Math.max(0, index + 1)].id)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
          <div className="compare-legend">
            <span>
              <ins>Ajouté</ins>
            </span>
            <span>
              <del>Supprimé</del>
            </span>
            <small>
              Les décisions de relecture ne valident ni ne retirent les
              révisions du Word exporté.
            </small>
          </div>
          <div className="compare-reader">
            <aside className="compare-outline">
              <strong>Dans cette comparaison</strong>
              <small>{visible.length} passage(s) affiché(s)</small>
              {visible.map((c, i) => (
                <button
                  className={active === c.id ? "active" : ""}
                  key={c.id}
                  onClick={() => jump(c.id)}
                >
                  <span className={`change-dot ${c.status}`} />
                  <span>
                    <small>
                      {labels[c.status]} · {i + 1}
                    </small>
                    {(c.right?.quote || c.left?.quote || "").slice(0, 75)}
                  </span>
                  {c.decision === "flagged" && <Flag size={13} />}
                </button>
              ))}
            </aside>
            <div className="compare-paper">
              {!visible.length && (
                <div className="compare-empty">
                  <Check size={26} />
                  <h3>
                    {changed.length
                      ? "Aucun passage pour ce filtre"
                      : "Les textes extraits sont identiques"}
                  </h3>
                  <p>
                    {changed.length
                      ? "Modifiez le filtre ou la recherche."
                      : "La comparaison ne détecte aucun changement textuel. Les différences de mise en page ne sont pas examinées."}
                  </p>
                </div>
              )}
              {visible.map((c) => (
                <article
                  id={`change-${c.id}`}
                  className={`comparison-row compare-change ${c.status} ${active === c.id ? "focused" : ""}`}
                  key={c.id}
                  onClick={() => setActive(c.id)}
                >
                  <header>
                    <span className={`compare-status ${c.status}`}>
                      {labels[c.status]}
                    </span>
                    <span>
                      {c.decision === "accepted"
                        ? "Écart accepté"
                        : c.decision === "flagged"
                          ? "À vérifier"
                          : "À examiner"}
                    </span>
                  </header>
                  {c.flags.length > 0 && (
                    <p className="compare-flags">{c.flags.join(" · ")}</p>
                  )}
                  {view === "redline" ? (
                    <p className="compare-redline-text">
                      {c.tokens.operations.map((op, i) =>
                        op.kind === "insert" ? (
                          <ins key={i}>{op.text}</ins>
                        ) : op.kind === "delete" ? (
                          <del key={i}>{op.text}</del>
                        ) : (
                          <React.Fragment key={i}>{op.text}</React.Fragment>
                        ),
                      )}
                    </p>
                  ) : (
                    <div className="comparison-columns">
                      {[c.left, c.right].map((source, j) => (
                        <div key={j}>
                          <small>{j ? "Version révisée" : "Référence"}</small>
                          <p>
                            {source
                              ? c.tokens[j ? "right" : "left"].map((t, i) =>
                                  t.changed ? (
                                    j ? (
                                      <ins key={i}>{t.text}</ins>
                                    ) : (
                                      <del key={i}>{t.text}</del>
                                    )
                                  ) : (
                                    <React.Fragment key={i}>
                                      {t.text}
                                    </React.Fragment>
                                  ),
                                )
                              : "∅"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="compare-sources">
                    {[c.left, c.right].filter(Boolean).map((source, i) => (
                      <button
                        className="source-link"
                        key={i}
                        onClick={() => onSource(source)}
                      >
                        <FileText size={12} />
                        {source.documentName} · {source.blockId}
                      </button>
                    ))}
                  </div>
                  {c.status !== "unchanged" && (
                    <ReviewDecision
                      key={`${c.id}-${comparison.revision}`}
                      change={c}
                      draft={edits[c.id] || c}
                      onChange={(patch) => edit(c, patch)}
                      busy={!!busy}
                      save={(decision, comment) =>
                        run("Enregistrement de la décision", async () => {
                          const next = await api(
                            `/comparisons/${comparison.id}`,
                            {
                              method: "PATCH",
                              body: {
                                revision: comparison.revision,
                                changeId: c.id,
                                decision,
                                comment,
                              },
                            },
                          );
                          setComparison(next);
                          setEdits((previous) => {
                            const remaining = { ...previous };
                            delete remaining[c.id];
                            return remaining;
                          });
                          setHistory((h) =>
                            h.map((x) => (x.id === next.id ? next : x)),
                          );
                        })
                      }
                    />
                  )}
                </article>
              ))}
            </div>
          </div>
          <details className="compare-method">
            <summary>Sources et périmètre de la comparaison</summary>
            <p>{comparison.method}</p>
            {comparison.warnings.map((w, i) => (
              <p key={i}>{w}</p>
            ))}
            <p>
              Le DOCX est reconstruit à partir du texte extrait. Les tableaux,
              images, styles, signatures et révisions préexistantes ne sont pas
              préservés comme dans les fichiers d’origine.
            </p>
            <code>
              Référence SHA-256 : {comparison.leftHash}
              <br />
              Version révisée SHA-256 : {comparison.rightHash}
            </code>
          </details>
        </>
      )}
      <details className="compare-history">
        <summary>Comparaisons enregistrées ({history.length})</summary>
        {history.map((c) => (
          <button
            disabled={!!busy}
            key={c.id}
            onClick={async () =>
              (await saveEdits()) &&
              run("Ouverture de la comparaison", async () =>
                apply(await api(`/comparisons/${c.id}`)),
              )
            }
          >
            <FileText size={16} />
            <span>
              {c.leftName} → {c.rightName}
              <small>{date(c.createdAt)}</small>
            </span>
            <ChevronRight size={16} />
          </button>
        ))}
      </details>
    </section>
  );
}

function DocumentSlot({
  side,
  index,
  document,
  value,
  documents,
  busy,
  onSelect,
  onUpload,
}) {
  const input = useRef(null);
  const [drag, setDrag] = useState(false);
  return (
    <section
      className={`compare-slot ${side} ${drag ? "dragging" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        if (!busy) setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (!busy) onUpload(e.dataTransfer.files[0]);
      }}
    >
      <header>
        <span className="compare-slot-number">0{index + 1}</span>
        <div>
          <h2>{index ? "Version révisée" : "Document de référence"}</h2>
          <p>
            {index
              ? "La version qui contient les changements"
              : "Votre version de départ"}
          </p>
        </div>
        <span className="compare-slot-badge">{index ? "APRÈS" : "AVANT"}</span>
      </header>
      <input
        ref={input}
        type="file"
        className="visually-hidden"
        aria-label={
          index
            ? "Importer la version révisée"
            : "Importer le document de référence"
        }
        accept=".docx,.pdf,.txt,.md"
        disabled={busy}
        onChange={(e) => {
          onUpload(e.target.files[0]);
          e.target.value = "";
        }}
      />
      <button
        className={`compare-dropzone ${document ? "has-document" : ""}`}
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        <span className="compare-file-icon">
          {document ? <FileText size={25} /> : <Upload size={25} />}
        </span>
        <strong>{document ? document.name : "Déposer un document ici"}</strong>
        <span>
          {document
            ? `${bytes(document.size)} · Remplacer le fichier`
            : "ou cliquer pour choisir un fichier"}
        </span>
      </button>
      <div className="compare-slot-divider">
        <span>ou depuis le dossier</span>
      </div>
      <label>
        <span className="visually-hidden">
          {index
            ? "Choisir la version révisée du dossier"
            : "Choisir la référence du dossier"}
        </span>
        <select
          disabled={busy}
          value={value}
          onChange={(e) => onSelect(e.target.value)}
        >
          <option value="">Sélectionner un document existant</option>
          {documents.map((d) => (
            <option value={d.id} key={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>
      {document?.status === "needs_ocr" && (
        <p role="alert">
          Texte inexploitable : effectuer un OCR avant comparaison.
        </p>
      )}
    </section>
  );
}
function ReviewDecision({ change, draft, onChange, busy, save }) {
  const { decision, comment } = draft;
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
          onChange={(e) => onChange({ decision: e.target.value })}
        >
          <option value="pending">À examiner</option>
          <option value="accepted">Écart accepté</option>
          <option value="flagged">À négocier / vérifier</option>
        </select>
      </label>
      <label>
        Commentaire
        <input
          disabled={busy}
          maxLength={4000}
          placeholder="Votre note sur ce changement…"
          value={comment}
          onChange={(e) => onChange({ comment: e.target.value })}
        />
      </label>
      <button
        className="button"
        disabled={
          busy || (decision === change.decision && comment === change.comment)
        }
      >
        <Check size={14} />
        Enregistrer la décision
      </button>
    </form>
  );
}
