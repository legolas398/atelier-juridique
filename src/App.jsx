import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Generator from "./Generator";
import Research from "./Research";
import {
  ArrowUp,
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FilePlus2,
  Files,
  FileText,
  Folder,
  FolderOpen,
  History,
  LayoutGrid,
  ListFilter,
  Loader2,
  LockKeyhole,
  MessageSquare,
  MoreHorizontal,
  PanelLeftClose,
  PencilLine,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Table2,
  Upload,
  Download,
  X,
  Square,
  Flag,
  Trash2,
} from "lucide-react";
import { api, bytes, date, download } from "./api";
import {
  Citation,
  CellDrawer,
  Empty,
  Modal,
  NewMatter,
  NewReview,
  Settings,
  SourceViewer,
  Status,
} from "./components";

const NAV = [
  ["home", "Vue d’ensemble", LayoutGrid],
  ["assistant", "Assistant", Sparkles],
  ["reviews", "Revue tabulaire", Table2],
  ["documents", "Documents", Files],
  ["generator", "Générateur juridique", FilePlus2],
  ["compare", "Comparer", Files],
  ["research", "Recherche juridique", Search],
  ["notes", "Rédaction", PencilLine],
  ["activity", "Activité", History],
];
const SOURCE_TYPES = {
  primary: "Pièce primaire",
  statement: "Déclaration d’une partie",
  framing: "Instruction / cadrage",
  analysis: "Analyse / commentaire",
};

export default function App() {
  const [state, setState] = useState(null);
  const [matterId, setMatterId] = useState(
    () => localStorage.getItem("atelier.matter") ?? "",
  );
  const [page, setPage] = useState("home");
  const [reviewId, setReviewId] = useState(null);
  const [review, setReview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notes, setNotes] = useState([]);
  const [audit, setAudit] = useState([]);
  const [modal, setModal] = useState(null);
  const [source, setSource] = useState(null);
  const [cellId, setCellId] = useState(null);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [prompt, setPrompt] = useState("");
  const [docFilter, setDocFilter] = useState("");
  const [cellFilter, setCellFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [contextIds, setContextIds] = useState(null);
  const fileInput = useRef(null);
  const messagesEnd = useRef(null);
  const chatLock = useRef(false);
  const noteGuard = useRef(null);
  const selectedMatterRef = useRef(matterId);
  selectedMatterRef.current = matterId;
  const error = (e) =>
    setToast({ type: "error", text: e.message ?? String(e) });
  const tell = (text) => setToast({ type: "success", text });
  async function refresh() {
    const data = await api("/state");
    setState(data);
    setMatterId((id) =>
      data.matters.some((m) => m.id === id) ? id : (data.matters[0]?.id ?? ""),
    );
    return data;
  }
  useEffect(() => {
    refresh().catch(error);
  }, []);
  useEffect(() => {
    if (matterId) localStorage.setItem("atelier.matter", matterId);
    setContextIds(null);
    setMessages([]);
    setNotes([]);
    setAudit([]);
    setReview(null);
    setCellId(null);
    setReviewId(null);
  }, [matterId]);
  useEffect(() => {
    if (!matterId) return;
    let live = true;
    Promise.all([
      api(`/matters/${matterId}/messages`),
      api(`/matters/${matterId}/notes`),
      api(`/matters/${matterId}/audit`),
    ])
      .then(([m, n, a]) => {
        if (live) {
          setMessages(m);
          setNotes(n);
          setAudit(a);
        }
      })
      .catch(error);
    return () => {
      live = false;
    };
  }, [matterId, page]);
  const matter = state?.matters.find((m) => m.id === matterId);
  const docs = state?.documents.filter((d) => d.matterId === matterId) ?? [];
  const reviews = state?.reviews.filter((r) => r.matterId === matterId) ?? [];
  const chosenReview = reviews.find((r) => r.id === reviewId) ?? reviews[0];
  const run = state?.runs.filter((r) => r.reviewId === chosenReview?.id).at(-1);
  const isRunning = run && ["queued", "running"].includes(run.status);
  const anyRunning = state?.runs.some((r) =>
    ["queued", "running"].includes(r.status),
  );
  useEffect(() => {
    if (!anyRunning) return;
    const timer = setInterval(() => refresh().catch(error), 650);
    return () => clearInterval(timer);
  }, [anyRunning]);
  useEffect(() => {
    if (!chosenReview) {
      setReview(null);
      return;
    }
    let live = true;
    api(`/reviews/${chosenReview.id}`)
      .then((r) => {
        if (live) setReview(r);
      })
      .catch(error);
    return () => {
      live = false;
    };
  }, [chosenReview?.id, run?.completed, run?.status]);
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(
      () => setToast(null),
      toast.type === "error" ? 10000 : 4500,
    );
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const listener = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setModal("search");
      }
      if (e.key === "Escape") {
        setCellId(null);
        setSidebar(false);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
  const go = async (next) => {
    if (
      ["notes", "generator"].includes(page) &&
      next !== page &&
      noteGuard.current &&
      !(await noteGuard.current())
    )
      return;
    setPage(next);
    setSidebar(false);
  };
  async function upload(files) {
    if (!files.length || !matterId) return;
    setUploading(true);
    try {
      const body = new FormData();
      for (const file of files) body.append("files", file);
      const result = await api(`/matters/${matterId}/documents`, {
        method: "POST",
        body,
      });
      await refresh();
      if (result.errors.length)
        error(
          new Error(
            result.errors.map((e) => `${e.name} : ${e.message}`).join("\n"),
          ),
        );
      else tell(`${result.documents.length} document(s) importé(s).`);
      go("documents");
    } catch (e) {
      error(e);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  async function send(question = prompt) {
    if (!question.trim() || chatLock.current) return;
    if (!docs.length) {
      tell("Importez un document pour commencer.");
      fileInput.current.click();
      return;
    }
    chatLock.current = true;
    setBusy(true);
    setPrompt("");
    go("assistant");
    const target = matterId;
    setMessages((v) => [
      ...v,
      {
        id: "pending-user",
        role: "user",
        content: question,
        createdAt: new Date().toISOString(),
      },
    ]);
    try {
      await api(`/matters/${target}/chat`, {
        method: "POST",
        body: { question, documentIds: contextIds ?? docs.map((d) => d.id) },
      });
      if (selectedMatterRef.current === target)
        setMessages(await api(`/matters/${target}/messages`));
    } catch (e) {
      error(e);
      if (selectedMatterRef.current === target)
        setMessages(await api(`/matters/${target}/messages`).catch(() => []));
    } finally {
      setBusy(false);
      chatLock.current = false;
    }
  }
  async function startReview() {
    if (!chosenReview) return;
    try {
      await api(`/reviews/${chosenReview.id}/run`, { method: "POST" });
      await refresh();
      tell("Revue lancée. Les cellules verrouillées seront préservées.");
    } catch (e) {
      error(e);
    }
  }
  const selectedCell = review?.cells.find((c) => c.id === cellId);
  const approved =
    review?.cells.filter((c) => c.decision === "approved").length ?? 0;
  const searchResults = query.trim()
    ? docs.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()))
    : docs;
  if (!state)
    return (
      <main className="loading-app">
        <div className="brand-symbol">
          a<span>•</span>
        </div>
        <h1>Votre atelier se prépare.</h1>
        {toast ? (
          <p>
            {toast.text}
            <button className="button" onClick={() => refresh().catch(error)}>
              Réessayer
            </button>
          </p>
        ) : (
          <Loader2 className="spin" />
        )}
      </main>
    );

  const composer = (large = false) => (
    <form
      className={`composer ${large ? "large" : ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <textarea
        aria-label="Votre demande"
        placeholder={
          large
            ? "Que souhaitez-vous examiner aujourd’hui ?"
            : "Posez une question sur les documents du dossier…"
        }
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        rows={large ? 3 : 2}
        maxLength={6000}
      />
      <div className="composer-footer">
        <div className="inline">
          <button
            type="button"
            className="icon-button"
            title="Joindre des documents"
            aria-label="Joindre des documents"
            onClick={() => fileInput.current.click()}
            disabled={!matterId || uploading}
          >
            <Plus size={19} />
          </button>
          <button
            type="button"
            className="context-button"
            onClick={() => setModal("context")}
          >
            <FolderOpen size={14} />
            {contextIds === null
              ? "Tout le dossier"
              : `${contextIds.length} document(s)`}
            <ChevronDown size={12} />
          </button>
        </div>
        <div className="inline">
          <span className="engine-label">
            <span className="green-dot" />
            {state.settings.engine === "ollama"
              ? "Ollama local"
              : "Extraits sourcés"}
          </span>
          <button
            className="send-button"
            disabled={busy || !prompt.trim() || !matterId}
            aria-label="Envoyer la demande"
          >
            {busy ? (
              <Loader2 className="spin" size={18} />
            ) : (
              <ArrowUp size={19} />
            )}
          </button>
        </div>
      </div>
    </form>
  );
  return (
    <div className="app-shell">
      <input
        ref={fileInput}
        type="file"
        multiple
        accept=".pdf,.docx,.txt,.md"
        hidden
        onChange={(e) => upload([...e.target.files])}
      />
      <aside className={`sidebar ${sidebar ? "open" : ""}`}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("home");
          }}
        >
          <span className="brand-symbol">
            a<span>•</span>
          </span>
          <span>
            atelier<span className="brand-period">.</span>
          </span>
        </a>
        <div className="workspace-switch">
          <div className="workspace-avatar">AJ</div>
          <div>
            <strong>Espace juridique</strong>
            <small>Personnel · sur cet ordinateur</small>
          </div>
          <LockKeyhole size={13} />
        </div>
        <button className="search-trigger" onClick={() => setModal("search")}>
          <Search size={15} />
          <span>Rechercher</span>
          <kbd>Ctrl K</kbd>
        </button>
        <div className="nav-label">VOTRE ESPACE</div>
        <nav>
          {NAV.map(([id, label, Icon]) => (
            <button
              key={id}
              className={`nav-item ${page === id ? "active" : ""}`}
              onClick={() => go(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {id === "documents" && <small>{docs.length}</small>}
            </button>
          ))}
        </nav>
        <div className="nav-label matter-label">
          <span>DOSSIERS</span>
          <button
            className="icon-button"
            aria-label="Créer un dossier"
            onClick={() => setModal("matter")}
          >
            <Plus size={15} />
          </button>
        </div>
        <div className="matter-list">
          {state.matters.map((m) => (
            <button
              key={m.id}
              className={`matter-item ${m.id === matterId ? "selected" : ""}`}
              onClick={async () => {
                if (
                  ["notes", "generator"].includes(page) &&
                  noteGuard.current &&
                  !(await noteGuard.current())
                )
                  return;
                setMatterId(m.id);
                setPage("home");
                setSidebar(false);
              }}
            >
              <span className="matter-dot" />
              <span>{m.title}</span>
            </button>
          ))}
          <button
            className="matter-item add-matter"
            onClick={() => setModal("matter")}
          >
            <Plus size={14} />
            Nouveau dossier
          </button>
        </div>
        <div className="sidebar-bottom">
          <div className="local-note">
            <ShieldCheck size={17} />
            <div>
              <strong>Un espace, sous votre contrôle</strong>
              <p>Vos pièces restent sur cet ordinateur.</p>
            </div>
          </div>
          <button
            className="profile-button"
            onClick={() => setModal("settings")}
          >
            <div className="profile-avatar">L</div>
            <span>
              <strong>Utilisateur local</strong>
              <small>Paramètres de l’atelier</small>
            </span>
            <Settings2 size={16} />
          </button>
        </div>
      </aside>
      {sidebar && (
        <div className="sidebar-scrim" onClick={() => setSidebar(false)} />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button sidebar-toggle"
              aria-label="Ouvrir la navigation"
              onClick={() => setSidebar(!sidebar)}
            >
              <LayoutGrid size={19} />
            </button>
            <Folder size={15} />
            <button onClick={() => go("home")}>
              {matter?.title ?? "Espace de travail"}
            </button>
            <ChevronRight size={13} />
            <span>{NAV.find((n) => n[0] === page)?.[1]}</span>
          </div>
          <div className="topbar-right">
            {matter?.demo && <span className="demo-badge">Dossier fictif</span>}
            <span className="private-badge">
              <LockKeyhole size={12} />
              Local & privé
            </span>
            <button
              className="icon-button"
              aria-label="À propos de l’application"
              onClick={() => setModal("about")}
            >
              <CircleHelp size={18} />
            </button>
          </div>
        </header>
        <main
          className={`main-content ${page === "assistant" ? "chat-layout" : ""}`}
        >
          {!matter ? (
            <Empty
              title="Bienvenue dans votre atelier"
              action={
                <button
                  className="button primary"
                  onClick={() => setModal("matter")}
                >
                  <Plus size={16} />
                  Créer votre premier dossier
                </button>
              }
            >
              Créez un dossier et ajoutez vos documents pour commencer.
            </Empty>
          ) : (
            <>
              {page === "home" && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">
                        VOTRE ESPACE DE TRAVAIL JURIDIQUE
                      </div>
                      <h1>
                        Le fond du dossier.
                        <br />
                        <span>L’esprit libre pour l’essentiel.</span>
                      </h1>
                      <p className="intro">
                        Analysez vos pièces, vérifiez vos sources, faites
                        avancer votre travail.
                      </p>
                    </div>
                    <div className="abstract-emblem" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                  <div className="home-composer">
                    {composer(true)}
                    <div className="prompt-chips">
                      <button
                        onClick={() =>
                          send(
                            "Compare les durées et les préavis des contrats du dossier.",
                          )
                        }
                      >
                        <Table2 size={14} />
                        Comparer des contrats
                      </button>
                      <button
                        onClick={() =>
                          send(
                            "Quels passages concernent la responsabilité et ses exceptions ?",
                          )
                        }
                      >
                        <ShieldCheck size={14} />
                        Examiner les responsabilités
                      </button>
                      <button
                        onClick={() => {
                          go("notes");
                        }}
                      >
                        <PencilLine size={14} />
                        Préparer une note
                      </button>
                    </div>
                  </div>
                  <div className="section-heading">
                    <h2>Votre dossier en un regard</h2>
                    <span className="muted">{matter.practice}</span>
                  </div>
                  <div className="overview-cards">
                    <button
                      className="overview-card"
                      onClick={() => go("documents")}
                    >
                      <span className="card-icon sage">
                        <Files size={20} />
                      </span>
                      <ArrowUpRight className="card-arrow" size={17} />
                      <strong>
                        {docs.length}
                        <small>document{docs.length > 1 ? "s" : ""}</small>
                      </strong>
                      <p>Les pièces de votre dossier</p>
                    </button>
                    <button
                      className="overview-card"
                      onClick={() => go("reviews")}
                    >
                      <span className="card-icon sand">
                        <Table2 size={20} />
                      </span>
                      <ArrowUpRight className="card-arrow" size={17} />
                      <strong>
                        {reviews.length}
                        <small>revue{reviews.length > 1 ? "s" : ""}</small>
                      </strong>
                      <p>Des réponses, sources à l’appui</p>
                    </button>
                    <button
                      className="overview-card"
                      onClick={() => go("notes")}
                    >
                      <span className="card-icon mauve">
                        <PencilLine size={20} />
                      </span>
                      <ArrowUpRight className="card-arrow" size={17} />
                      <strong>
                        {notes.length}
                        <small>note{notes.length > 1 ? "s" : ""}</small>
                      </strong>
                      <p>Du raisonnement au livrable</p>
                    </button>
                  </div>
                  <div className="home-bottom">
                    <section className="recent-documents">
                      <div className="section-heading">
                        <h2>Documents récents</h2>
                        <button
                          className="text-button"
                          onClick={() => go("documents")}
                        >
                          Tout voir
                          <ArrowRight size={14} />
                        </button>
                      </div>
                      {docs
                        .slice(-4)
                        .reverse()
                        .map((doc) => (
                          <button
                            key={doc.id}
                            className="recent-row"
                            onClick={() => setSource({ documentId: doc.id })}
                          >
                            <span className={`file-symbol ${doc.type}`}>
                              {doc.type === "text"
                                ? "TXT"
                                : doc.type.toUpperCase()}
                            </span>
                            <span>
                              <strong>{doc.name}</strong>
                              <small>
                                {bytes(doc.size)} · {date(doc.createdAt)}
                              </small>
                            </span>
                            <ArrowUpRight size={16} />
                          </button>
                        ))}
                      {!docs.length && (
                        <button
                          className="drop-zone small-drop"
                          onClick={() => fileInput.current.click()}
                        >
                          <Upload size={20} />
                          Importer les premières pièces
                        </button>
                      )}
                    </section>
                    <section className="review-callout">
                      <div className="callout-art">
                        <Table2 size={32} strokeWidth={1.2} />
                      </div>
                      <span className="eyebrow">REVUE TABULAIRE</span>
                      <h2>
                        Chaque contrat.
                        <br />
                        Les bonnes questions.
                      </h2>
                      <p>
                        Comparez vos documents dans une matrice et retrouvez les
                        clauses derrière chaque réponse.
                      </p>
                      <button
                        className="text-button"
                        onClick={() => go("reviews")}
                      >
                        Ouvrir les revues
                        <ArrowRight size={16} />
                      </button>
                    </section>
                  </div>
                </>
              )}
              {page === "assistant" && (
                <>
                  <div className="section-page-heading">
                    <div>
                      <span className="eyebrow">
                        EXAMINER · COMPRENDRE · VÉRIFIER
                      </span>
                      <h1>Assistant documentaire</h1>
                      <p>Un dialogue ancré dans les pièces de votre dossier.</p>
                    </div>
                    <span className="badge neutral">
                      {state.settings.engine === "ollama"
                        ? state.settings.model
                        : "Mode extraits"}
                    </span>
                  </div>
                  <div className="messages">
                    {!messages.length && (
                      <div className="chat-empty">
                        <div className="assistant-mark">
                          <Sparkles size={25} />
                        </div>
                        <h2>Ouvrons le dossier.</h2>
                        <p>
                          Posez une question sur vos documents. Chaque passage
                          retrouvé reste consultable.
                        </p>
                        <div className="starter-prompts">
                          {[
                            "Quelle est la durée de chaque contrat ?",
                            "Quels préavis de résiliation sont prévus ?",
                            "Quels plafonds de responsabilité sont applicables ?",
                          ].map((q) => (
                            <button key={q} onClick={() => send(q)}>
                              {q}
                              <ArrowUpRight size={16} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {messages.map((message) => (
                      <article
                        key={message.id}
                        className={`message ${message.role}`}
                      >
                        <div className="message-avatar">
                          {message.role === "user" ? (
                            "L"
                          ) : (
                            <Sparkles size={16} />
                          )}
                        </div>
                        <div className="message-body">
                          <div className="message-meta">
                            <strong>
                              {message.role === "user" ? "Vous" : "Atelier"}
                            </strong>
                            <small>
                              {message.engine === "extractive"
                                ? "Extraits documentaires"
                                : message.engine === "ollama"
                                  ? "Synthèse Ollama"
                                  : ""}
                            </small>
                          </div>
                          <p className={message.error ? "error-text" : ""}>
                            {message.content}
                          </p>
                          {message.partial && (
                            <p className="notice">
                              Une partie du contexte n’est pas entièrement
                              exploitable. Vérifiez les alertes des documents.
                            </p>
                          )}
                          {message.citations?.map((cite, i) => (
                            <div className="chat-source" key={i}>
                              <Citation
                                citation={cite}
                                index={i}
                                onOpen={setSource}
                              />
                              <blockquote>{cite.quote}</blockquote>
                            </div>
                          ))}
                        </div>
                      </article>
                    ))}
                    {busy && (
                      <div className="working">
                        <Loader2 size={17} className="spin" />
                        Recherche des passages et contrôle des sources…
                      </div>
                    )}
                    <div ref={messagesEnd} />
                  </div>
                  <div className="chat-composer-wrap">
                    {composer()}
                    <p className="composer-disclaimer">
                      La présence d’une citation ne suffit pas à établir un
                      fait. Vérifiez la nature de la source et son contexte.
                    </p>
                  </div>
                </>
              )}
              {page === "documents" && (
                <>
                  <div className="section-page-heading">
                    <div>
                      <span className="eyebrow">LE CORPUS DU DOSSIER</span>
                      <h1>Vos documents</h1>
                      <p>Une base claire pour chaque analyse.</p>
                    </div>
                    <button
                      className="button primary"
                      onClick={() => fileInput.current.click()}
                      disabled={uploading}
                    >
                      <Upload size={16} />
                      {uploading
                        ? "Extraction en cours…"
                        : "Importer des documents"}
                    </button>
                  </div>
                  <div
                    className={`drop-zone ${uploading ? "uploading" : ""}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      upload([...e.dataTransfer.files]);
                    }}
                  >
                    <Upload size={22} />
                    <div>
                      <strong>
                        {uploading
                          ? "Import et extraction des fichiers…"
                          : "Déposez vos documents ici"}
                      </strong>
                      <p>
                        PDF texte, DOCX, TXT ou Markdown · 25 Mo par fichier ·
                        les scans nécessitent un OCR
                      </p>
                    </div>
                    <button
                      className="button small"
                      onClick={() => fileInput.current.click()}
                      disabled={uploading}
                    >
                      Parcourir
                    </button>
                  </div>
                  <div className="table-toolbar">
                    <div className="tabs">
                      <span className="tab active">
                        Tous les documents <span>{docs.length}</span>
                      </span>
                    </div>
                    <div className="table-search">
                      <Search size={15} />
                      <input
                        value={docFilter}
                        onChange={(e) => setDocFilter(e.target.value)}
                        placeholder="Rechercher un document…"
                        aria-label="Filtrer les documents"
                      />
                    </div>
                  </div>
                  <div className="document-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Nom du document</th>
                          <th>Nature de la source</th>
                          <th>État</th>
                          <th>Ajouté le</th>
                          <th aria-label="Actions" />
                        </tr>
                      </thead>
                      <tbody>
                        {docs
                          .filter((d) =>
                            d.name
                              .toLowerCase()
                              .includes(docFilter.toLowerCase()),
                          )
                          .map((doc) => (
                            <tr key={doc.id}>
                              <td>
                                <button
                                  className="document-name"
                                  onClick={() =>
                                    setSource({ documentId: doc.id })
                                  }
                                >
                                  <span className={`file-symbol ${doc.type}`}>
                                    {doc.type === "text"
                                      ? "TXT"
                                      : doc.type.toUpperCase()}
                                  </span>
                                  <span>
                                    <strong>{doc.name}</strong>
                                    <small>
                                      {bytes(doc.size)} ·{" "}
                                      {doc.type === "pdf"
                                        ? `${doc.pageCount} page(s)`
                                        : `${doc.blockCount} blocs de texte`}
                                    </small>
                                  </span>
                                </button>
                              </td>
                              <td>
                                <select
                                  aria-label={`Nature de ${doc.name}`}
                                  value={doc.sourceType}
                                  onChange={async (e) => {
                                    try {
                                      await api(`/documents/${doc.id}`, {
                                        method: "PATCH",
                                        body: { sourceType: e.target.value },
                                      });
                                      await refresh();
                                      tell(
                                        "Source requalifiée. Les validations associées sont à revoir.",
                                      );
                                    } catch (e) {
                                      error(e);
                                    }
                                  }}
                                >
                                  {Object.entries(SOURCE_TYPES).map(
                                    ([v, label]) => (
                                      <option key={v} value={v}>
                                        {label}
                                      </option>
                                    ),
                                  )}
                                </select>
                              </td>
                              <td>
                                <span
                                  className={`badge ${doc.status === "ready" ? "success" : "warning"}`}
                                >
                                  {doc.status === "ready"
                                    ? "Prêt à analyser"
                                    : doc.status === "partial"
                                      ? "Texte partiel"
                                      : "OCR requis"}
                                </span>
                              </td>
                              <td className="muted">{date(doc.createdAt)}</td>
                              <td>
                                <div className="inline">
                                  <button
                                    className="icon-button"
                                    title="Télécharger l’original"
                                    aria-label={`Télécharger ${doc.name}`}
                                    onClick={() =>
                                      download(`/documents/${doc.id}/original`)
                                    }
                                  >
                                    <Download size={15} />
                                  </button>
                                  <button
                                    className="icon-button"
                                    title="Supprimer"
                                    aria-label={`Supprimer ${doc.name}`}
                                    onClick={() =>
                                      setModal({
                                        type: "delete",
                                        document: doc,
                                      })
                                    }
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {!docs.length && (
                      <Empty title="Le dossier attend ses pièces">
                        Importez vos documents pour lancer une revue ou
                        retrouver une clause.
                      </Empty>
                    )}
                    {docs.length > 0 &&
                      !docs.some((d) =>
                        d.name.toLowerCase().includes(docFilter.toLowerCase()),
                      ) && (
                        <Empty title="Aucun document correspondant">
                          Essayez un autre nom.
                        </Empty>
                      )}
                  </div>
                </>
              )}
              {page === "reviews" && (
                <>
                  <div className="section-page-heading">
                    <div>
                      <span className="eyebrow">
                        UNE VUE D’ENSEMBLE, DES SOURCES PRÉCISES
                      </span>
                      <h1>Revue tabulaire</h1>
                      <p>Un document par ligne. Une question par colonne.</p>
                    </div>
                    <button
                      className="button primary"
                      onClick={() => setModal("review")}
                      disabled={!docs.length}
                    >
                      <Plus size={16} />
                      Nouvelle revue
                    </button>
                  </div>
                  {!reviews.length ? (
                    <Empty
                      title="Posez les mêmes questions à tout le dossier"
                      action={
                        <button
                          className="button"
                          disabled={!docs.length}
                          onClick={() => setModal("review")}
                        >
                          Préparer une revue
                        </button>
                      }
                    >
                      {docs.length
                        ? "Choisissez vos documents et les points à extraire."
                        : "Importez d’abord des documents dans ce dossier."}
                    </Empty>
                  ) : (
                    <>
                      <div className="review-toolbar">
                        <select
                          aria-label="Choisir une revue"
                          value={chosenReview?.id ?? ""}
                          onChange={(e) => {
                            setReviewId(e.target.value);
                            setCellId(null);
                          }}
                        >
                          {reviews.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.title}
                            </option>
                          ))}
                        </select>
                        <div className="inline">
                          <select
                            aria-label="Filtrer les cellules"
                            value={cellFilter}
                            onChange={(e) => setCellFilter(e.target.value)}
                          >
                            <option value="all">Tous les résultats</option>
                            <option value="pending">À vérifier</option>
                            <option value="approved">Validés</option>
                            <option value="flagged">Signalés</option>
                          </select>
                          {isRunning ? (
                            <button
                              className="button"
                              onClick={async () => {
                                try {
                                  await api(`/runs/${run.id}/cancel`, {
                                    method: "POST",
                                  });
                                  await refresh();
                                } catch (e) {
                                  error(e);
                                }
                              }}
                            >
                              <Square size={13} />
                              Arrêter
                            </button>
                          ) : (
                            <button className="button" onClick={startReview}>
                              <Sparkles size={15} />
                              {review?.cells.length
                                ? "Relancer"
                                : "Lancer la revue"}
                            </button>
                          )}
                          <button
                            className="button"
                            onClick={() =>
                              download(
                                `/reviews/${chosenReview.id}/export?format=xlsx`,
                              )
                            }
                            disabled={isRunning}
                          >
                            <Download size={15} />
                            Excel
                          </button>
                          <button
                            className="button"
                            onClick={() =>
                              download(
                                `/reviews/${chosenReview.id}/export?format=docx`,
                              )
                            }
                            disabled={isRunning}
                          >
                            Word
                          </button>
                        </div>
                      </div>
                      <div className="review-status">
                        <div className="inline">
                          <span className="green-dot" />
                          <strong>{approved}</strong> cellule(s) validée(s) sur{" "}
                          {chosenReview.documentIds.length *
                            chosenReview.columns.length}
                        </div>
                        <span>
                          {isRunning ? (
                            <>
                              <Loader2 size={13} className="spin" />
                              Analyse {run.completed}/{run.total}
                            </>
                          ) : run?.status === "cancelled" ? (
                            "Revue arrêtée · résultats partiels"
                          ) : run?.status === "interrupted" ? (
                            "Exécution interrompue · relancez la revue"
                          ) : run?.status === "failed" ? (
                            "Échec · relancez ou vérifiez Ollama"
                          ) : run?.status === "partial" ? (
                            "Terminée avec des erreurs · cellules à revoir"
                          ) : (
                            "Les résultats restent à vérifier dans leurs sources"
                          )}
                        </span>
                      </div>
                      {isRunning && (
                        <div className="progress">
                          <span
                            style={{
                              width: `${(100 * run.completed) / run.total}%`,
                            }}
                          />
                        </div>
                      )}
                      <div className="review-grid-wrap">
                        <table className="review-grid">
                          <thead>
                            <tr>
                              <th className="row-number">#</th>
                              <th className="sticky-document">
                                Document{" "}
                                <span className="count">
                                  {chosenReview.documentIds.length}
                                </span>
                              </th>
                              {chosenReview.columns.map((c) => (
                                <th key={c.id}>
                                  <span className="column-type">Aa</span>
                                  {c.title}
                                  <small>{c.question}</small>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {chosenReview.documentIds.map((id, index) => {
                              const doc = docs.find((d) => d.id === id);
                              if (!doc) return null;
                              return (
                                <tr key={id}>
                                  <td className="row-number">{index + 1}</td>
                                  <td className="sticky-document">
                                    <button
                                      onClick={() =>
                                        setSource({ documentId: id })
                                      }
                                    >
                                      <FileText size={17} />
                                      <span>{doc.name}</span>
                                    </button>
                                    {doc.sourceType !== "primary" && (
                                      <span className="badge warning">
                                        {SOURCE_TYPES[doc.sourceType]}
                                      </span>
                                    )}
                                  </td>
                                  {chosenReview.columns.map((col) => {
                                    const cell = review?.cells.find(
                                      (c) =>
                                        c.documentId === id &&
                                        c.columnId === col.id,
                                    );
                                    const dim =
                                      cellFilter !== "all" &&
                                      cell?.decision !== cellFilter;
                                    return (
                                      <td
                                        key={col.id}
                                        className={`${dim ? "dimmed" : ""} ${cell?.decision === "approved" ? "approved-cell" : ""}`}
                                      >
                                        <button
                                          className="grid-cell"
                                          onClick={() =>
                                            cell && setCellId(cell.id)
                                          }
                                          disabled={!cell}
                                        >
                                          <div className="cell-top">
                                            <Status cell={cell} />
                                            {cell?.locked && (
                                              <LockKeyhole size={12} />
                                            )}
                                          </div>
                                          <p>
                                            {cell?.value ??
                                              (isRunning
                                                ? "En attente de traitement…"
                                                : "Lancez la revue pour extraire ce point.")}
                                          </p>
                                          {cell?.citations.length > 0 && (
                                            <small>
                                              <BookOpen size={12} />
                                              {cell.citations.length} passage(s)
                                              source
                                            </small>
                                          )}
                                          {cell?.edited && (
                                            <small>Correction humaine</small>
                                          )}
                                        </button>
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <p className="grid-hint">
                        <MessageSquare size={14} /> Cliquez sur une cellule pour
                        lire ses sources, corriger la réponse et enregistrer
                        votre décision.
                      </p>
                    </>
                  )}
                </>
              )}
              {page === "notes" && (
                <Notes
                  notes={notes}
                  matterId={matterId}
                  onChange={setNotes}
                  onError={error}
                  onSuccess={tell}
                  guard={noteGuard}
                />
              )}
              {page === "generator" && (
                <Generator
                  key={matterId}
                  matterId={matterId}
                  documents={docs}
                  onError={error}
                  onSuccess={tell}
                  guard={noteGuard}
                />
              )}
              {(page === "compare" || page === "research") && (
                <Research
                  key={`${matterId}-${page}`}
                  matterId={matterId}
                  documents={docs}
                  comparisonMode={page === "compare"}
                  onSource={setSource}
                  onError={error}
                />
              )}
              {page === "activity" && (
                <>
                  <div className="section-page-heading">
                    <div>
                      <span className="eyebrow">LA MÉMOIRE DU DOSSIER</span>
                      <h1>Journal d’activité</h1>
                      <p>
                        Les imports, révisions et décisions enregistrés
                        localement.
                      </p>
                    </div>
                    <button
                      className="button"
                      onClick={() =>
                        api(`/matters/${matterId}/audit`)
                          .then(setAudit)
                          .catch(error)
                      }
                    >
                      Actualiser
                    </button>
                  </div>
                  <div className="activity-list">
                    {audit.map((event) => (
                      <article key={event.id}>
                        <div className="timeline-dot">
                          <Check size={13} />
                        </div>
                        <div>
                          <strong>{event.action}</strong>
                          <p>{event.detail}</p>
                          <small>
                            {event.actor} · {date(event.createdAt)}
                          </small>
                        </div>
                      </article>
                    ))}
                    {!audit.length && (
                      <Empty title="Le dossier vient de commencer">
                        Les actions apparaîtront ici.
                      </Empty>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </main>
        <footer className="app-footer">
          <span>
            ATELIER <span className="footer-dot">/</span> L’intelligence du
            dossier, la maîtrise du juriste.
          </span>
          <span>
            <span className="green-dot" />
            Enregistré sur cet ordinateur
          </span>
        </footer>
      </div>
      {modal === "matter" && (
        <NewMatter
          onClose={() => setModal(null)}
          onError={error}
          onCreated={async (m) => {
            if (
              ["notes", "generator"].includes(page) &&
              noteGuard.current &&
              !(await noteGuard.current())
            )
              return;
            await refresh();
            setMatterId(m.id);
            go("home");
            setModal(null);
            tell("Votre dossier est prêt.");
          }}
        />
      )}
      {modal === "review" && (
        <ReviewLoader
          documents={docs}
          onClose={() => setModal(null)}
          onError={error}
          onCreated={async (body) => {
            const next = await api(`/matters/${matterId}/reviews`, {
              method: "POST",
              body,
            });
            setModal(null);
            setReviewId(next.id);
            go("reviews");
            await api(`/reviews/${next.id}/run`, { method: "POST" });
            await refresh();
          }}
        />
      )}
      {modal === "settings" && (
        <Settings
          config={state.settings}
          onClose={() => setModal(null)}
          onError={error}
          onSaved={async () => {
            await refresh();
            setModal(null);
            tell("Paramètres enregistrés.");
          }}
        />
      )}
      {modal === "search" && (
        <Modal title="Retrouver un document" onClose={() => setModal(null)}>
          <div className="table-search full">
            <Search size={17} />
            <input
              autoFocus
              placeholder="Nom du document dans ce dossier…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="search-results">
            {searchResults.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setSource({ documentId: d.id });
                  setModal(null);
                }}
              >
                <FileText size={17} />
                <span>{d.name}</span>
                <ArrowUpRight size={15} />
              </button>
            ))}
            {!searchResults.length && (
              <p className="muted">
                Aucun document correspondant dans ce dossier.
              </p>
            )}
          </div>
          <p className="muted small-text">
            Pour chercher une clause dans le contenu, utilisez l’Assistant
            documentaire.
          </p>
        </Modal>
      )}
      {modal === "context" && (
        <Modal title="Contexte de votre demande" onClose={() => setModal(null)}>
          <p className="muted">
            Choisissez les pièces que l’assistant pourra consulter.
          </p>
          <div className="checklist">
            {docs.map((d) => (
              <label key={d.id}>
                <input
                  type="checkbox"
                  checked={(contextIds ?? docs.map((x) => x.id)).includes(d.id)}
                  onChange={() =>
                    setContextIds((current) => {
                      const v = current ?? docs.map((x) => x.id);
                      return v.includes(d.id)
                        ? v.filter((id) => id !== d.id)
                        : [...v, d.id];
                    })
                  }
                />
                <FileText size={16} />
                <span>{d.name}</span>
              </label>
            ))}
          </div>
          <div className="modal-footer">
            <button className="button" onClick={() => setContextIds(null)}>
              Tout le dossier
            </button>
            <button className="button primary" onClick={() => setModal(null)}>
              Appliquer
            </button>
          </div>
        </Modal>
      )}
      {modal?.type === "delete" && (
        <Modal title="Supprimer cette pièce ?" onClose={() => setModal(null)}>
          <p>
            « {modal.document.name} » sera retiré des revues. Les réponses de
            l’assistant de ce dossier seront retirées pour éviter de conserver
            des extraits de la pièce supprimée.
          </p>
          <p className="notice">
            Cette suppression ne retire pas les fichiers déjà téléchargés.
          </p>
          <div className="modal-footer">
            <button className="button" onClick={() => setModal(null)}>
              Conserver
            </button>
            <button
              className="button danger-button"
              onClick={async () => {
                try {
                  await api(`/documents/${modal.document.id}`, {
                    method: "DELETE",
                  });
                  setModal(null);
                  setCellId(null);
                  await refresh();
                  setMessages(await api(`/matters/${matterId}/messages`));
                  if (chosenReview)
                    setReview(await api(`/reviews/${chosenReview.id}`));
                  tell("Document supprimé.");
                } catch (e) {
                  error(e);
                }
              }}
            >
              Supprimer le document
            </button>
          </div>
        </Modal>
      )}
      {modal === "about" && (
        <Modal title="À propos d’Atelier" onClose={() => setModal(null)}>
          <p>
            Atelier est une application juridique locale indépendante,
            construite à partir de l’analyse de fonctionnalités publiquement
            documentées de Legora. Elle n’est pas affiliée à Legora.
          </p>
          <p>
            Vous disposez d’un espace personnel : dossiers, imports, extraits
            sourcés, grille de revue, corrections, notes et exports. Le dossier
            initial contient uniquement des documents fictifs.
          </p>
          <p className="notice">
            Cette version ne comprend pas de recherche juridique externe, de
            comptes d’équipe, d’OCR ni de complément Word. La synthèse
            générative nécessite Ollama et un modèle local installé.
          </p>
          <button className="button" onClick={() => setModal("settings")}>
            Ouvrir les paramètres
          </button>
        </Modal>
      )}
      {selectedCell && (
        <CellDrawer
          cell={selectedCell}
          column={chosenReview.columns.find(
            (c) => c.id === selectedCell.columnId,
          )}
          document={docs.find((d) => d.id === selectedCell.documentId)}
          onClose={() => setCellId(null)}
          onError={error}
          onSource={setSource}
          onUpdate={async (next) => {
            setReview((v) => ({
              ...v,
              cells: v.cells.map((c) => (c.id === next.id ? next : c)),
            }));
          }}
        />
      )}
      {source && (
        <SourceViewer
          source={source}
          onClose={() => setSource(null)}
          onError={error}
        />
      )}
      {toast &&
        createPortal(
          <div
            className={`toast ${toast.type}`}
            role={toast.type === "error" ? "alert" : "status"}
          >
            {toast.type === "error" ? <Flag size={18} /> : <Check size={18} />}
            <span>{toast.text}</span>
            <button
              className="icon-button"
              aria-label="Fermer la notification"
              onClick={() => setToast(null)}
            >
              <X size={16} />
            </button>
          </div>,
          document.querySelector("dialog[open]") ?? document.body,
        )}
      {uploading && (
        <div className="upload-status" role="status">
          <Loader2 className="spin" size={17} />
          Import et extraction des documents…
        </div>
      )}
    </div>
  );
}

function ReviewLoader(props) {
  const [defaults, setDefaults] = useState(null);
  useEffect(() => {
    api("/templates").then(setDefaults).catch(props.onError);
  }, []);
  return defaults ? (
    <NewReview {...props} defaults={defaults} />
  ) : (
    <Modal title="Préparation de la revue" onClose={props.onClose}>
      <Loader2 className="spin" />
    </Modal>
  );
}

function Notes({ notes, matterId, onChange, onError, onSuccess, guard }) {
  const [noteId, setNoteId] = useState(notes[0]?.id);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const note = notes.find((n) => n.id === noteId) ?? notes[0];
  useEffect(() => {
    setDraft(note ? { ...note } : null);
  }, [note?.id, note?.updatedAt]);
  const dirty =
    note &&
    draft &&
    (note.content !== draft.content || note.title !== draft.title);
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
  async function save() {
    if (!draft) return;
    setBusy(true);
    try {
      const saved = await api(`/notes/${note.id}`, {
        method: "PATCH",
        body: {
          title: draft.title,
          content: draft.content,
          updatedAt: note.updatedAt,
        },
      });
      onChange((v) => v.map((n) => (n.id === saved.id ? saved : n)));
      onSuccess("Note enregistrée.");
      return true;
    } catch (e) {
      onError(e);
      return false;
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    guard.current = () => (dirty ? save() : Promise.resolve(true));
    return () => {
      guard.current = null;
    };
  }, [dirty, draft, note]);
  return (
    <>
      <div className="section-page-heading">
        <div>
          <span className="eyebrow">DU DOSSIER AU LIVRABLE</span>
          <h1>Vos notes de travail</h1>
          <p>Rédigez, organisez et exportez votre analyse.</p>
        </div>
        <button
          className="button primary"
          disabled={busy}
          onClick={async () => {
            if (dirty && !(await save())) return;
            try {
              const next = await api(`/matters/${matterId}/notes`, {
                method: "POST",
                body: { title: "Nouvelle note", content: "" },
              });
              onChange((v) => [...v, next]);
              setNoteId(next.id);
            } catch (e) {
              onError(e);
            }
          }}
        >
          <Plus size={16} />
          Nouvelle note
        </button>
      </div>
      {!note ? (
        <Empty title="La première page vous appartient">
          Créez une note pour rédiger votre analyse.
        </Empty>
      ) : (
        <div className="notes-layout">
          <div className="note-list">
            {notes.map((n) => (
              <button
                key={n.id}
                className={n.id === note.id ? "active" : ""}
                onClick={async () => {
                  if (dirty && !(await save())) return;
                  setNoteId(n.id);
                }}
              >
                <FileText size={17} />
                <span>
                  <strong>{n.title}</strong>
                  <small>{date(n.updatedAt)}</small>
                </span>
              </button>
            ))}
          </div>
          <div className="note-workspace">
            <div className="note-toolbar">
              <span className="muted">
                {dirty
                  ? "Modifications non enregistrées"
                  : "Enregistré localement"}
              </span>
              <div className="inline">
                <button
                  className="button small"
                  disabled={busy || !dirty || !draft?.title.trim()}
                  onClick={save}
                >
                  Enregistrer
                </button>
                <button
                  className="button small"
                  onClick={async () => {
                    if (dirty && !(await save())) return;
                    download(`/notes/${note.id}/export`);
                  }}
                >
                  <Download size={14} />
                  Word
                </button>
              </div>
            </div>
            {draft && (
              <div className="note-paper">
                <input
                  className="note-title"
                  aria-label="Titre de la note"
                  value={draft.title}
                  onChange={(e) =>
                    setDraft((v) => ({ ...v, title: e.target.value }))
                  }
                  maxLength={180}
                />
                <textarea
                  aria-label="Contenu de la note"
                  placeholder="Votre analyse commence ici…"
                  value={draft.content}
                  onChange={(e) =>
                    setDraft((v) => ({ ...v, content: e.target.value }))
                  }
                  maxLength={150000}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
