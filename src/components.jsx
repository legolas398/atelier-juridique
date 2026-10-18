import React, { useEffect, useRef, useState } from "react";
import {
  X,
  FileText,
  ArrowUpRight,
  Download,
  Check,
  LockKeyhole,
  Flag,
  MessageSquare,
  ArrowLeft,
  Pencil,
  ChevronRight,
  Plus,
  Loader2,
} from "lucide-react";
import { api, date, download } from "./api";

export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button className="icon-button" aria-label="Fermer" onClick={onClose}>
          <X size={19} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Empty({ title, children, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <FileText size={26} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Status({ cell }) {
  if (!cell) return <span className="badge neutral">Non analysé</span>;
  const label =
    cell.decision === "approved"
      ? "Validé"
      : cell.decision === "flagged"
        ? "Signalé"
        : {
            missing: "Non trouvé",
            insufficient: "À compléter",
            error: "Erreur",
            source_warning: "Source à qualifier",
            found: "À vérifier",
          }[cell.status];
  return (
    <span
      className={`badge ${cell.decision === "approved" ? "success" : cell.decision === "flagged" || cell.status === "error" ? "danger" : cell.status === "missing" || cell.status === "insufficient" ? "warning" : "neutral"}`}
    >
      {cell.decision === "approved" && <Check size={11} />} {label}
    </span>
  );
}
export function Citation({ citation, index, onOpen }) {
  return (
    <button className="citation" onClick={() => onOpen(citation)}>
      <span>{index + 1}</span>
      <FileText size={14} />
      <span className="ellipsis">{citation.documentName}</span>
      <span className="citation-page">{citation.pageLabel}</span>
      <ArrowUpRight size={13} />
    </button>
  );
}

export function SourceViewer({ source, onClose, onError }) {
  const [doc, setDoc] = useState(null);
  const [failure, setFailure] = useState("");
  const [term, setTerm] = useState("");
  const focusRef = useRef(null);
  useEffect(() => {
    let live = true;
    setDoc(null);
    setFailure("");
    api(`/documents/${source.documentId}`)
      .then((d) => {
        if (live) setDoc(d);
      })
      .catch((e) => {
        if (live) {
          setFailure(e.message);
          onError(e);
        }
      });
    return () => {
      live = false;
    };
  }, [source.documentId]);
  useEffect(() => {
    if (doc && focusRef.current)
      focusRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [doc, source.blockId]);
  return (
    <Modal title="Vérifier la source" onClose={onClose} wide>
      <div className="source-head">
        <div>
          <h3>{doc?.name ?? "Chargement…"}</h3>
          <p>
            Version originale ·{" "}
            {doc?.type === "docx"
              ? "Texte extrait, sans pagination Word"
              : "Texte extrait du document"}
          </p>
        </div>
        <button
          className="button small"
          onClick={() => download(`/documents/${source.documentId}/original`)}
        >
          <Download size={15} /> Original
        </button>
      </div>
      <input
        className="search-input"
        placeholder="Rechercher dans ce document…"
        aria-label="Rechercher dans ce document"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      <div className="document-paper">
        {failure ? (
          <p className="notice">{failure}</p>
        ) : !doc ? (
          <Loader2 className="spin" />
        ) : (
          doc.pages.map((page) => (
            <section key={page.number}>
              <div className="page-label">{page.label}</div>
              {page.blocks
                .filter(
                  (b) =>
                    !term ||
                    b.text
                      .toLocaleLowerCase()
                      .includes(term.toLocaleLowerCase()),
                )
                .map((block) => (
                  <p
                    key={block.id}
                    ref={block.id === source.blockId ? focusRef : null}
                    className={
                      block.id === source.blockId ? "highlighted-block" : ""
                    }
                  >
                    {block.text}
                  </p>
                ))}
              {!page.blocks.length && (
                <p className="notice">
                  Page sans texte exploitable. Ouvrez le document original et
                  ajoutez une version OCR.
                </p>
              )}
            </section>
          ))
        )}
      </div>
      {doc?.warnings.length > 0 && (
        <p className="notice">{doc.warnings.join(" ")}</p>
      )}
    </Modal>
  );
}

export function CellDrawer({
  cell,
  column,
  document,
  onClose,
  onUpdate,
  onSource,
  onError,
}) {
  const [value, setValue] = useState(cell.value);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const panel = useRef(null);
  useEffect(() => {
    const previousFocus = globalThis.document.activeElement;
    const previousOverflow = globalThis.document.body.style.overflow;
    globalThis.document.body.style.overflow = "hidden";
    panel.current?.querySelector("button")?.focus();
    return () => {
      globalThis.document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, []);
  useEffect(() => setValue(cell.value), [cell.id, cell.revision]);
  async function save(patch) {
    setBusy(true);
    try {
      const next = await api(`/cells/${cell.id}`, {
        method: "PATCH",
        body: { revision: cell.revision, ...patch },
      });
      await onUpdate(next);
      if (patch.comment) setComment("");
    } catch (e) {
      onError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="drawer-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        className="cell-drawer"
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Revoir la cellule"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "Tab") {
            const elements = [
              ...panel.current.querySelectorAll(
                "button:not(:disabled),input:not(:disabled),textarea,summary",
              ),
            ];
            const first = elements[0],
              last = elements.at(-1);
            if (e.shiftKey && globalThis.document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            } else if (
              !e.shiftKey &&
              globalThis.document.activeElement === last
            ) {
              e.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <div className="drawer-heading">
          <span className="eyebrow">REVUE DOCUMENTAIRE</span>
          <button
            className="icon-button"
            aria-label="Fermer la cellule"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <h2>{column.title}</h2>
        <p className="muted">{document.name}</p>
        <div className="inline">
          <Status cell={cell} />
          <span className="muted">Révision {cell.revision}</span>
          {cell.locked && <LockKeyhole size={14} />}
        </div>
        <label className="field-label" htmlFor="cell-value">
          Réponse {cell.edited && "· corrigée manuellement"}
        </label>
        <textarea
          id="cell-value"
          className="cell-editor"
          value={value}
          readOnly={cell.locked}
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="button-row">
          <button
            className="button"
            disabled={busy || cell.locked || value === cell.value}
            onClick={() => save({ value })}
          >
            <Pencil size={14} /> Enregistrer la correction
          </button>
          <button
            className={`button ${cell.locked ? "tinted" : ""}`}
            disabled={busy}
            onClick={() => save({ locked: !cell.locked })}
          >
            <LockKeyhole size={14} />
            {cell.locked ? "Déverrouiller" : "Verrouiller"}
          </button>
        </div>
        <p className="explanation">{cell.explanation}</p>
        <h4>
          Passages sources{" "}
          <span className="count">{cell.citations.length}</span>
        </h4>
        {cell.citations.map((cite, i) => (
          <div className="source-excerpt" key={i}>
            <Citation citation={cite} index={i} onOpen={onSource} />
            <blockquote>{cite.quote}</blockquote>
          </div>
        ))}
        {!cell.citations.length && (
          <p className="notice">
            Aucun passage source. Vérifiez le document avant de conclure.
          </p>
        )}
        <div className="decision-bar">
          <button
            className={`button ${cell.decision === "approved" ? "primary" : ""}`}
            disabled={busy || value !== cell.value}
            onClick={() =>
              save({
                decision: cell.decision === "approved" ? "pending" : "approved",
              })
            }
          >
            <Check size={16} />
            {cell.decision === "approved"
              ? "Retirer la validation"
              : "Valider cette révision"}
          </button>
          <button
            className="button"
            disabled={busy}
            onClick={() =>
              save({
                decision: cell.decision === "flagged" ? "pending" : "flagged",
              })
            }
          >
            <Flag size={15} />
            Signaler
          </button>
        </div>
        <h4>Commentaires et décisions</h4>
        {cell.comments.map((c) => (
          <div className="comment" key={c.id}>
            <strong>{c.actor}</strong>
            <time>{date(c.createdAt)}</time>
            <p>{c.text}</p>
          </div>
        ))}
        <form
          className="comment-form"
          onSubmit={(e) => {
            e.preventDefault();
            save({ comment });
          }}
        >
          <input
            aria-label="Commentaire"
            placeholder="Ajouter une observation…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={2000}
          />
          <button
            className="icon-button"
            disabled={!comment.trim() || busy}
            aria-label="Publier le commentaire"
          >
            <MessageSquare size={17} />
          </button>
        </form>
        {cell.history?.length > 0 && (
          <details className="history">
            <summary>Historique des valeurs ({cell.history.length})</summary>
            {[...cell.history].reverse().map((h) => (
              <div key={h.revision}>
                <small>
                  Révision {h.revision} · {date(h.updatedAt)}
                </small>
                <p>{h.value}</p>
              </div>
            ))}
          </details>
        )}
      </aside>
    </div>
  );
}

export function NewMatter({ onClose, onCreated, onError }) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal title="Un nouveau dossier" onClose={onClose}>
      <p className="muted">
        Rassemblez les pièces et les analyses d’une même affaire.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const data = Object.fromEntries(new FormData(e.currentTarget));
          try {
            await onCreated(
              await api("/matters", { method: "POST", body: data }),
            );
          } catch (error) {
            onError(error);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Nom du dossier
          <input
            name="title"
            placeholder="Ex. Acquisition · Projet Atlas"
            required
            maxLength={180}
            autoFocus
          />
        </label>
        <label>
          Client ou organisation
          <input name="client" placeholder="Nom du client" maxLength={180} />
        </label>
        <label>
          Description
          <textarea
            name="description"
            placeholder="Contexte et objectif de la revue…"
            maxLength={3000}
          />
        </label>
        <div className="modal-footer">
          <button type="button" className="button" onClick={onClose}>
            Annuler
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
            Créer le dossier
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function NewReview({
  documents,
  defaults,
  onClose,
  onCreated,
  onError,
}) {
  const [selected, setSelected] = useState(
    documents.filter((d) => d.status !== "needs_ocr").map((d) => d.id),
  );
  const [columns, setColumns] = useState(defaults);
  const [title, setTitle] = useState("Revue des points essentiels");
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Modal title="Préparer une revue" onClose={onClose} wide>
      <div className="review-setup">
        <section>
          <label>
            Titre
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={180}
            />
          </label>
          <h4>
            1. Documents à examiner{" "}
            <span className="count">{selected.length}</span>
          </h4>
          <div className="checklist">
            {documents.map((d) => (
              <label key={d.id}>
                <input
                  type="checkbox"
                  checked={selected.includes(d.id)}
                  disabled={d.status === "needs_ocr"}
                  onChange={() =>
                    setSelected((v) =>
                      v.includes(d.id)
                        ? v.filter((x) => x !== d.id)
                        : [...v, d.id],
                    )
                  }
                />
                <FileText size={16} />
                <span>{d.name}</span>
              </label>
            ))}
          </div>
        </section>
        <section>
          <h4>
            2. Questions de la revue{" "}
            <span className="count">{columns.length}/10</span>
          </h4>
          {columns.map((c, i) => (
            <div className="column-config" key={c.id}>
              <span>{i + 1}</span>
              <div>
                <strong>{c.title}</strong>
                <p>{c.question}</p>
              </div>
              <button
                className="icon-button"
                aria-label={`Retirer ${c.title}`}
                onClick={() =>
                  setColumns((v) => v.filter((x) => x.id !== c.id))
                }
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              if (!question.trim() || columns.length >= 10) return;
              setColumns((v) => [
                ...v,
                {
                  id: crypto.randomUUID(),
                  title: question.slice(0, 45),
                  question,
                },
              ]);
              setQuestion("");
            }}
          >
            <input
              placeholder="Ajouter votre propre question…"
              aria-label="Nouvelle question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={1200}
            />
            <button
              className="button"
              disabled={!question.trim() || columns.length >= 10}
              aria-label="Ajouter la question"
            >
              <Plus size={16} />
            </button>
          </form>
          <p className="muted small-text">
            En mode extraits, les questions sont recherchées par mots-clés.
            Activez Ollama pour une synthèse générative.
          </p>
        </section>
      </div>
      <div className="modal-footer">
        <button className="button" onClick={onClose}>
          Annuler
        </button>
        <button
          className="button primary"
          disabled={
            busy || !title.trim() || !selected.length || !columns.length
          }
          onClick={async () => {
            setBusy(true);
            try {
              await onCreated({ title, documentIds: selected, columns });
            } catch (e) {
              onError(e);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? (
            <Loader2 className="spin" size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
          Créer et lancer la revue
        </button>
      </div>
    </Modal>
  );
}

export function Settings({ config, onClose, onSaved, onError }) {
  const [engine, setEngine] = useState(config.engine);
  const [model, setModel] = useState(config.model);
  const [ollama, setOllama] = useState(null);
  const [busy, setBusy] = useState(false);
  const detect = () => {
    setOllama(null);
    api("/ollama").then(setOllama).catch(onError);
  };
  useEffect(detect, []);
  return (
    <Modal title="Votre atelier, en local" onClose={onClose}>
      <div className="privacy-card">
        <LockKeyhole size={19} />
        <div>
          <strong>Un espace personnel sur cet ordinateur</strong>
          <p>
            Documents et historique enregistrés dans SQLite. Application
            accessible uniquement sur la boucle locale ; pas de comptes
            partagés.
          </p>
        </div>
      </div>
      <label>
        Moteur d’analyse
        <select value={engine} onChange={(e) => setEngine(e.target.value)}>
          <option value="extractive">Extraits sourcés · sans modèle</option>
          <option value="ollama">Ollama · synthèse générative locale</option>
        </select>
      </label>
      {engine === "extractive" ? (
        <p className="notice">
          Recherche lexicale et extraits exacts. Ce mode fonctionne sans clé API
          et sans téléchargement de modèle. Il ne comprend pas toutes les
          formulations ni les contradictions.
        </p>
      ) : (
        <>
          <label>
            Modèle installé
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="">Choisir un modèle local…</option>
              {ollama?.models.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <p className="notice">
            {ollama === null
              ? "Connexion à Ollama…"
              : ollama.available
                ? `${ollama.models.length} modèle(s) local(aux) détecté(s).`
                : "Ollama non détecté sur 127.0.0.1:11434. Installez et démarrez Ollama, puis téléchargez un modèle adapté à votre ordinateur."}
          </p>
          <button className="button small" onClick={detect}>
            Actualiser la détection
          </button>
        </>
      )}
      <div className="settings-details">
        <h4>Formats et limites de cette version</h4>
        <p>
          PDF texte, Word DOCX, TXT et Markdown · 25 Mo par fichier · 100
          documents par dossier. Les scans nécessitent un OCR préalable. Les
          fichiers Word sont affichés en texte extrait.
        </p>
        <p>
          La qualification des sources et la validation des résultats restent
          sous votre contrôle. Aucun accès à une base de jurisprudence n’est
          inclus.
        </p>
      </div>
      <div className="modal-footer">
        <button className="button" onClick={onClose}>
          Fermer
        </button>
        <button
          className="button primary"
          disabled={busy || (engine === "ollama" && !model)}
          onClick={async () => {
            setBusy(true);
            try {
              await api("/settings", {
                method: "PUT",
                body: { engine, model },
              });
              await onSaved();
            } catch (e) {
              onError(e);
            } finally {
              setBusy(false);
            }
          }}
        >
          Enregistrer
        </button>
      </div>
    </Modal>
  );
}
