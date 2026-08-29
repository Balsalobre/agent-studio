/* chat.jsx — employee chat surface (the star). 3 layout variants + scripted flows. */
const { useState: useStateC, useRef: useRefC, useEffect: useEffectC } = React;

/* Human-readable labels for each backend tool. Surface in chips while a
   tool is in flight so the learner sees Bonsai's reasoning trace. */
const TOOL_META = {
  "rag-query-tool":            { emoji: "🔍", label: "Buscando en el catálogo" },
  "get-route-and-progress":    { emoji: "🗺️", label: "Consultando tu ruta" },
  "present-resource":          { emoji: "📄", label: "Cargando recurso" },
  "evaluate-answer":           { emoji: "🧠", label: "Evaluando tu respuesta" },
  "grade-quiz":                { emoji: "📊", label: "Corrigiendo el quiz" },
  "mark-step-complete":        { emoji: "✅", label: "Marcando paso completado" },
  "recommend-resources":       { emoji: "💡", label: "Buscando recomendaciones" },
};
function toolLabel(name) {
  return TOOL_META[name] || { emoji: "⚙️", label: name };
}

/* Resource type → icon + label for cards rendered alongside Bonsai
   replies when present-resource / recommend-resources surface a resource. */
const RESOURCE_TYPE_META = {
  pdf:                 { icon: "file",   label: "PDF" },
  ebook:               { icon: "book",   label: "eBook" },
  audio:               { icon: "volume", label: "Audio" },
  video:               { icon: "play",   label: "Vídeo" },
  learning_experience: { icon: "layers", label: "LX" },
};
function resourceTypeMeta(t) {
  return RESOURCE_TYPE_META[t] || { icon: "file", label: t || "Recurso" };
}
function resourceMeasure(r) {
  const m = (r && r.metadata) || {};
  if (typeof m.durationSec === "number") return Math.round(m.durationSec / 60) + " min";
  if (typeof m.pages === "number") return m.pages + " págs.";
  return null;
}

/* Click handler shared by the inline cards in a Bonsai reply. Mirrors the
   behaviour of openResource() in learning.jsx: opens the source URL (if
   any) and POSTs /resources/:id/open. If the response carries a
   completedStep, dispatch bonsai:step-completed so the learning view
   refreshes live. */
async function openResourceFromCard(resource) {
  if (resource?.source?.url) {
    window.open(resource.source.url, "_blank", "noopener");
  }
  try {
    const res = await window.BonsaiAPI.openResource(resource.id);
    if (res && res.completedStep) {
      window.dispatchEvent(new CustomEvent("bonsai:step-completed", {
        detail: { stepId: res.completedStep, viaCard: true },
      }));
    }
  } catch (e) {
    console.warn("openResourceFromCard failed:", e && e.message);
  }
}

/* Markdown renderer for Bonsai replies. Uses marked.js (loaded as a UMD
   global) and overrides the link renderer so every <a> opens in a new
   tab with rel=noopener and only http(s)/mailto URIs pass through.
   Falls back to a paragraph split + **bold** parsing if marked failed
   to load (offline / CDN blocked). */
function buildRenderer() {
  const m = window.marked;
  if (!m) return null;
  const renderer = new m.Renderer();
  renderer.link = function (href, title, text) {
    const url = typeof href === "string" ? href : (href && href.href) || "";
    const label = typeof text === "string" ? text : (text && text.text) || "";
    if (!/^(https?:|mailto:|\/)/i.test(url)) {
      return label; // strip javascript: / data: / anything fishy
    }
    const t = title ? ` title="${String(title).replace(/"/g, "&quot;")}"` : "";
    return `<a href="${url}" target="_blank" rel="noopener noreferrer"${t}>${label}</a>`;
  };
  return renderer;
}

function markdownToHtml(text) {
  const m = window.marked;
  if (!m || !text) return null;
  const renderer = buildRenderer();
  try {
    return m.parse(String(text), {
      renderer,
      gfm: true,         // tables, strikethrough, autolinks
      breaks: true,      // single newline → <br>
      headerIds: false,  // no DOM ids leaking into the chat
      mangle: false,
    });
  } catch {
    return null;
  }
}

function RichText({ text }) {
  const html = markdownToHtml(text);
  if (html != null) {
    return <div className="rich-text" dangerouslySetInnerHTML={{ __html: html }} />;
  }
  // Fallback: plain paragraphs + **bold**.
  const paras = String(text).split("\n\n");
  return (
    <div className="rich-text">
      {paras.map((p, pi) => (
        <p key={pi}>
          {p.split(/(\*\*[^*]+\*\*)/g).map((seg, i) =>
            seg.startsWith("**") && seg.endsWith("**")
              ? <b key={i}>{seg.slice(2, -2)}</b>
              : <React.Fragment key={i}>{seg}</React.Fragment>
          )}
        </p>
      ))}
    </div>
  );
}

/* reexplain composite widget */
function ReexplainW() {
  return (
    <div className="w">
      <div className="w-head"><span className="w-ico" style={{ background: "var(--tan-tint)", color: "var(--tan)" }}><Icon name="lightbulb" size={16} /></span>
        <div style={{ flex: 1 }}><div className="wk">Detectado · tu última lección</div><div className="wt">{REEXPLAIN.detected}</div></div>
      </div>
      <div style={{ padding: 15 }}>
        <div className="metaphor">{REEXPLAIN.metaphor}</div>
        <ol className="recap">
          {REEXPLAIN.recap.map((r, i) => <li key={i}><span className="n">{i + 1}</span>{r}</li>)}
        </ol>
      </div>
      <div style={{ padding: "0 11px 11px" }}><AudioW seconds={REEXPLAIN.audioLen} label="Escúchalo en 47 s" /></div>
    </div>
  );
}

function PendingW() {
  return (
    <div className="w">
      <div className="w-head"><span className="w-ico"><Icon name="play" size={15} /></span>
        <div style={{ flex: 1 }}><div className="wk">{PENDING.course}</div><div className="wt">{PENDING.lesson}</div></div>
        <span className="badge">{PENDING.left}</span>
      </div>
      <div style={{ padding: "14px 15px" }}>
        <div className="track" style={{ marginBottom: 8 }}><span style={{ width: PENDING.progress + "%" }} /></div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--fg-3)" }}>
          <span>{PENDING.progress}% completado</span><span>Sigue: {PENDING.next.split("·")[0]}</span>
        </div>
      </div>
      <div className="w-foot"><button className="btn btn-accent btn-sm"><Icon name="play" size={14} /> Continuar lección</button><button className="btn btn-sm">Ver ruta</button></div>
    </div>
  );
}

function Widget({ w }) {
  switch (w.type) {
    case "lessons": return <LessonListW lessons={WEEKLY_GOAL.lessons} />;
    case "flash": return <FlashcardW cards={FLASHCARDS} />;
    case "quiz": return <QuizW quiz={QUIZ} />;
    case "audio": return <AudioW seconds={w.seconds} label={w.label} />;
    case "pdf": return <PdfW doc={PDF_DOC} />;
    case "newsletter": return <NewsletterW data={NEWSLETTER} />;
    case "reexplain": return <ReexplainW />;
    case "pending": return <PendingW />;
    default: return null;
  }
}

/* ---- scripted responses ---- */
function buildFlow(key, freeText, node) {
  switch (key) {
    case "goal": return {
      userText: "¿Cuál es mi objetivo semanal?",
      replies: [{ text: `Tu objetivo de esta semana es **${WEEKLY_GOAL.title}**.\n\n${WEEKLY_GOAL.why} Estas tres lecciones te llevan justo ahí:`, widget: { type: "lessons" } }],
    };
    case "fivemin": return {
      userText: "Tengo solo 5 minutos",
      replies: [{ text: "Perfecto, vamos a aprovecharlos. Te lanzo un repaso rápido de lo último que viste — toca cada tarjeta para comprobarte:", widget: { type: "flash" } }],
    };
    case "newsletter": return {
      userText: "Genérame mi newsletter de la semana",
      replies: [{ text: "Aquí tienes tu resumen. También puedo enviártelo al correo cada viernes si quieres.", widget: { type: "newsletter" } }],
    };
    case "reexplain": return {
      userText: "No entiendo la última lección",
      replies: [{ text: "Sin problema. Veo que lo último que trabajaste fue el **modelo de feedback SBI**. Te lo cuento de otra forma:", widget: { type: "reexplain" } }],
    };
    case "quiz": return {
      userText: "Quiero hacer mi autoevaluación semanal",
      replies: [{ text: "Vamos con 3 preguntas rápidas. No hay nota pública — es solo para que veas qué tienes fresco:", widget: { type: "quiz" } }],
    };
    case "pdf": return {
      userText: "Tengo una duda sobre la política de gastos de la empresa",
      replies: [
        { text: "He leído el documento que subió tu empresa. Pregúntame lo que necesites y te respondo citando la página exacta:", widget: { type: "pdf" } },
        { text: `${PDF_ANSWERS[0].a}`, cite: PDF_ANSWERS[0].cite },
      ],
    };
    case "pending": return {
      userText: "Continúa mi lección pendiente",
      replies: [{ text: "Lo retomamos justo donde lo dejaste:", widget: { type: "pending" } }],
    };
    case "__node": {
      const n = node || {};
      const status = { done: "Ya la completaste — ¿quieres un repaso rápido?", current: "La tienes en curso ahora mismo.", pending: "Aún no la has empezado. ¿Arrancamos?", locked: "Todavía está bloqueada." }[n.status] || "";
      return {
        userText: `Háblame de «${n.label}»`,
        replies: [{ text: `**${n.label}.** ${n.desc || ""}\n\n${status}`, widget: (n.level === "lesson" && n.status !== "locked") ? { type: "pending" } : null, quick: true }],
      };
    }
    default: return {
      userText: freeText,
      replies: [{ text: "Buena pregunta. En esta demo respondo con guiones, pero en producción usaría el library catalog, the Library and your company documents para darte una respuesta a medida.\n\nMientras tanto, ¿te lanzo tu objetivo semanal o un repaso de 5 minutos?", quick: true }],
    };
  }
}

let MSG_ID = 0;

function Composer({ value, onChange, onSend, autoFocus }) {
  const ta = useRefC(null);
  useEffectC(() => {
    if (ta.current) { ta.current.style.height = "auto"; ta.current.style.height = Math.min(ta.current.scrollHeight, 160) + "px"; }
  }, [value]);
  useEffectC(() => { if (autoFocus && ta.current) ta.current.focus(); }, [autoFocus]);
  return (
    <div className="composer">
      <textarea ref={ta} rows={1} value={value} placeholder="Pregúntale a Bonsai…  /  Ask Bonsai anything"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }} />
      <div className="tools">
        <button className="icon-btn" title="Adjuntar documento"><Icon name="clip" size={19} /></button>
        <button className="icon-btn" title="Dictar"><Icon name="mic" size={19} /></button>
      </div>
      <button className="send-btn" disabled={!value.trim()} onClick={onSend}><Icon name="send" size={19} /></button>
    </div>
  );
}

/* Tres botones principales: los tres workflows definidos de Bonsai */
function WorkflowBar({ onPick }) {
  return (
    <div className="workflows">
      {SUGGESTIONS.map(s => (
        <button key={s.key} className="wf" onClick={() => onPick(s.key)}>
          <Icon name={s.icon} size={17} />
          <span>{s.short || s.label}</span>
        </button>
      ))}
    </div>
  );
}

function SecondaryPrompts({ onPick }) {
  return (
    <div className="secondary-prompts">
      {SECONDARY_PROMPTS.map(s => (
        <button key={s.key} className="sp" onClick={() => onPick(s.key)}><Icon name={s.icon} size={14} /> {s.label}</button>
      ))}
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 6 ? "Buenas noches" : h < 13 ? "Buenos días" : h < 21 ? "Buenas tardes" : "Buenas noches";
}

function ContextSubrail() {
  return (
    <aside className="chat-subrail">
      <div className="subrail-sec">
        <div className="sh"><span className="kicker">Conversaciones</span><button className="icon-btn" style={{ width: 26, height: 26 }}><Icon name="plus" size={16} /></button></div>
        <div className="subrail-item active"><Icon name="message" size={16} /> Hoy con Bonsai</div>
        <div className="subrail-item"><Icon name="message" size={16} /> Repaso de feedback</div>
        <div className="subrail-item"><Icon name="message" size={16} /> Dudas política gastos</div>
      </div>
      <div className="subrail-sec">
        <div className="sh"><span className="kicker">Mi ruta</span><span className="kicker" style={{ color: "var(--accent)" }}>41%</span></div>
        <div className="subrail-route">
          <div className="rt">Liderazgo de equipos</div>
          <div className="track"><span style={{ width: "41%" }} /></div>
          <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 7 }}>3 de 8 módulos</div>
        </div>
      </div>
      <div className="subrail-sec">
        <div className="sh"><span className="kicker">Integraciones</span></div>
        <div className="subrail-item"><Icon name="book" size={16} /> Biblioteca</div>
        <div className="subrail-item"><Icon name="route" size={16} /> Learning Experiences</div>
        <div className="subrail-item"><Icon name="file" size={16} /> Documentos de empresa</div>
      </div>
    </aside>
  );
}

function ProgressRing({ pct, size = 64 }) {
  const r = (size - 8) / 2, c = 2 * Math.PI * r;
  return (
    <svg className="ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-2)" strokeWidth="6" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset .6s var(--ease-emph)" }} />
      <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--fg)" fontFamily="var(--font-display)">{pct}%</text>
    </svg>
  );
}

function DailyBrief({ onPick }) {
  const pct = Math.round((USER.minutesToday / USER.goalMin) * 100);
  return (
    <div className="brief rise">
      <div className="kicker" style={{ marginBottom: 12 }}>Tu día · {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</div>
      <div className="brief-grid">
        <div className="brief-card brief-focus">
          <span className="badge">Foco de hoy</span>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 21, letterSpacing: "-0.02em", lineHeight: 1.25 }}>{PENDING.lesson}</div>
          <div style={{ fontSize: 13.5, color: "var(--fg-3)" }}>Te quedan {PENDING.left} para terminarla. Es el {PENDING.progress}% de la microcápsula.</div>
          <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
            <button className="btn btn-accent btn-sm" onClick={() => onPick("pending")}><Icon name="play" size={14} /> Continuar</button>
            <button className="btn btn-sm" onClick={() => onPick("quick-review")}>Solo 5 min</button>
          </div>
        </div>
        <div className="brief-card">
          <div className="ring-wrap"><ProgressRing pct={pct} /><div><div style={{ fontSize: 13, color: "var(--fg-2)", fontWeight: 600, whiteSpace: "nowrap" }}>Meta diaria</div><div style={{ fontSize: 12, color: "var(--fg-3)", whiteSpace: "nowrap" }}>{USER.minutesToday} / {USER.goalMin} min</div></div></div>
          <div className="brief-stat" style={{ marginTop: 16 }}>
            <div><div className="v" style={{ color: "var(--tan)" }}>{USER.streak}</div><div className="l">días seguidos</div></div>
            <div><div className="v">41%</div><div className="l">tu ruta</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Conversations panel that lives in the app's left menu (next to the nav
 * rail), ChatGPT / Claude style. Self-managed: it fetches the learner's
 * recent Bonsai threads (Mastra memory) and tracks the active thread from
 * BonsaiAPI, re-fetching whenever the chat dispatches "bonsai:threads-updated"
 * (a reply finished, or a conversation was switched/created).
 *
 * Selection is delegated to the parent via onPick/onNew, because switching
 * threads needs to bring the chat view into focus — see app.jsx. Collapsed
 * state is remembered in localStorage so it survives reloads.
 */
const THREADS_PANEL_KEY = "bonsai.threadsPanel";

function ThreadsPanel({ onPick, onNew }) {
  const [threads, setThreads] = useStateC([]);
  const [loading, setLoading] = useStateC(false);
  const [error, setError] = useStateC(null);
  const [activeThreadId, setActiveThreadId] = useStateC(() => window.BonsaiAPI?.getThread?.() || null);
  const [collapsed, setCollapsed] = useStateC(
    () => localStorage.getItem(THREADS_PANEL_KEY) === "collapsed",
  );

  useEffectC(() => {
    let alive = true;
    function load() {
      setLoading(true); setError(null);
      window.BonsaiAPI.getThreads(30)
        .then((res) => {
          if (!alive) return;
          setThreads(res.threads || []);
          setActiveThreadId(window.BonsaiAPI?.getThread?.() || null);
          setLoading(false);
        })
        .catch((e) => { if (alive) { setError(e.message || "No se pudo cargar el historial"); setLoading(false); } });
    }
    load();
    window.addEventListener("bonsai:threads-updated", load);
    return () => { alive = false; window.removeEventListener("bonsai:threads-updated", load); };
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem(THREADS_PANEL_KEY, next ? "collapsed" : "open"); } catch (_) { /* ignore */ }
      return next;
    });
  }

  function pick(t) { setActiveThreadId(t.id); onPick(t); }
  function handleNew() { setActiveThreadId(null); onNew(); }

  function fmtDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  }

  if (collapsed) {
    return (
      <div className="threads-panel is-collapsed" data-testid="threads-panel">
        <button className="threads-panel-toggle" title="Mostrar conversaciones" onClick={toggle}>
          <Icon name="message" size={18} />
        </button>
        <button className="threads-panel-toggle" title="Nueva conversación" onClick={handleNew}>
          <Icon name="plus" size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="threads-panel" data-testid="threads-panel" role="navigation" aria-label="Historial de conversaciones">
      <div className="threads-panel-head">
        <span className="threads-panel-title"><Icon name="message" size={14} /> Conversaciones</span>
        <button className="threads-panel-collapse" title="Ocultar panel" onClick={toggle}>
          <Icon name="chevronRight" size={16} style={{ transform: "rotate(180deg)" }} />
        </button>
      </div>
      <button className="threads-panel-new" data-testid="threads-new" onClick={handleNew}>
        <Icon name="plus" size={16} /> Nueva conversación
      </button>
      <div className="threads-panel-list">
        {loading && <div className="threads-empty">Cargando…</div>}
        {error && <div className="threads-empty threads-err">{error}</div>}
        {!loading && !error && threads.length === 0 && (
          <div className="threads-empty">Aún no hay conversaciones guardadas.</div>
        )}
        {threads.map((t) => (
          <button
            key={t.id}
            className={"threads-item" + (t.id === activeThreadId ? " is-active" : "")}
            data-testid="threads-item"
            data-thread-id={t.id}
            onClick={() => pick(t)}
          >
            <span className="threads-item-title">{t.title || "Conversación sin título"}</span>
            <span className="threads-item-meta">{fmtDate(t.updatedAt)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
Object.assign(window, { ThreadsPanel });

function Chat({ variant, showHint = true }) {
  const [messages, setMessages] = useStateC([]);
  const [activeThreadId, setActiveThreadId] = useStateC(() => window.BonsaiAPI?.getThread?.() || null);
  const [resumeBanner, setResumeBanner] = useStateC(null); // {threadId, title}
  const [input, setInput] = useStateC("");
  const [typing, setTyping] = useStateC(false);
  // Role-play practice mode: { config, threadId } once "Ponte en situación"
  // has set up a scenario. While active, the composer routes to /roleplay/chat.
  const [rolePlay, setRolePlay] = useStateC(null);
  const scrollRef = useRefC(null);
  const empty = messages.length === 0;

  useEffectC(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  // When the conversations panel (in the left menu) opens a thread or starts a
  // new chat, it brings this view into focus and stashes the intent here. The
  // panel lives outside the chat, so we pick it up on mount instead of via a
  // prop. (Picking a thread always remounts Chat — see app.jsx — so reading
  // this once on mount is enough.)
  useEffectC(() => {
    const pending = window.__bonsaiPendingThread;
    if (!pending) return;
    window.__bonsaiPendingThread = null;
    if (pending.type === "open" && pending.threadId) {
      setActiveThreadId(pending.threadId);
      setResumeBanner({ threadId: pending.threadId, title: pending.title || "Conversación sin título" });
    } else if (pending.type === "new") {
      setActiveThreadId(null);
      setResumeBanner(null);
    }
  }, []);

  // Scripted flows (suggestion buttons, graph nodes) keep the mock so the
  // designed micro-interactions stay alive. Free-text input goes to the
  // real Bonsai agent via /chat SSE.
  function run(key, freeText, node) {
    if (key === "__free") {
      return sendToBackend(freeText);
    }
    // Workflow-backed buttons (learner + manager trios) hit a real Mastra
    // workflow instead of the scripted mock flows.
    const sug = (window.SUGGESTIONS || [])
      .concat(window.MANAGER_SUGGESTIONS || [])
      .find(s => s.key === key);
    if (sug && sug.workflow) {
      return runWorkflowToBackend(key, sug.label, freeText);
    }
    const flow = buildFlow(key, freeText, node);
    setMessages(m => [...m, { id: ++MSG_ID, role: "user", text: flow.userText }]);
    setInput("");
    setTyping(true);
    let delay = 620;
    flow.replies.forEach((rep, idx) => {
      setTimeout(() => {
        setTyping(false);
        setMessages(m => [...m, { id: ++MSG_ID, role: "bonsai", ...rep }]);
        if (idx < flow.replies.length - 1) setTimeout(() => setTyping(true), 120);
      }, delay);
      delay += 900;
    });
  }

  // Shared streaming pipeline for both free-text chat and workflow buttons.
  // `userText` is the bubble shown for the user's turn; `invoke(handlers)`
  // performs the actual SSE call (chat or runWorkflow).
  async function streamReply(userText, invoke, afterDone) {
    const userId = ++MSG_ID;
    setMessages(m => [...m, { id: userId, role: "user", text: userText }]);
    setInput("");
    setTyping(true);

    // Insert an empty Bonsai message we'll fill via SSE deltas.
    const replyId = ++MSG_ID;
    let firstDelta = true;
    let acc = "";

    setMessages(m => [...m, { id: replyId, role: "bonsai", text: "" }]);

    try {
      await invoke({
        onDelta: (delta) => {
          if (firstDelta) { firstDelta = false; setTyping(false); }
          acc += delta;
          setMessages(m => m.map(x => x.id === replyId ? { ...x, text: acc } : x));
        },
        onToolCall: (toolName, toolCallId) => {
          setTyping(false);
          setMessages(m => m.map(x => x.id === replyId ? {
            ...x,
            toolCalls: [...(x.toolCalls || []), { id: toolCallId, toolName, done: false }],
          } : x));
        },
        onToolResult: (toolName, toolCallId) => {
          setMessages(m => m.map(x => x.id === replyId ? {
            ...x,
            toolCalls: (x.toolCalls || []).map((tc) =>
              tc.id === toolCallId ? { ...tc, done: true } : tc,
            ),
          } : x));
        },
        onResourceCard: (resource) => {
          if (!resource || !resource.id) return;
          setMessages(m => m.map(x => x.id === replyId ? {
            ...x,
            resourceCards: [
              ...(x.resourceCards || []).filter(r => r.id !== resource.id),
              resource,
            ],
          } : x));
        },
        onDone: (payload) => {
          setTyping(false);
          if (payload && payload.stepCompleted) {
            // Show a subtle marker that a route step closed.
            setMessages(m => m.map(x => x.id === replyId
              ? { ...x, stepCompleted: payload.stepCompleted }
              : x));
            // Notify the rest of the app (Mi aprendizaje view) so it can
            // refetch /progress without a manual reload.
            window.dispatchEvent(new CustomEvent("bonsai:step-completed", {
              detail: { stepId: payload.stepCompleted, threadId: payload.threadId },
            }));
          }
          if (payload && payload.roleplay) {
            // The role-play workflow just set up a scenario → enter practice
            // mode. Subsequent turns go to /roleplay/chat.
            setRolePlay({ config: payload.roleplay, threadId: null });
          } else if (payload && payload.threadId) {
            // A role-play turn carries its own thread id (kept separate from
            // the main chat thread, which api.jsx persists).
            setRolePlay(rp => rp ? { ...rp, threadId: payload.threadId } : rp);
          }
          // Sync the active thread with whatever api.jsx persisted (a brand-new
          // conversation gets its id here) and tell the conversations panel to
          // refresh so the new/updated thread shows with its latest title.
          const persisted = window.BonsaiAPI?.getThread?.();
          if (persisted) setActiveThreadId((prev) => prev || persisted);
          window.dispatchEvent(new CustomEvent("bonsai:threads-updated"));
          if (afterDone) afterDone(payload);
        },
        onError: (err) => {
          setTyping(false);
          const msg = "❌ " + (err && err.message ? err.message : "Error de conexión");
          setMessages(m => m.map(x => x.id === replyId ? { ...x, text: acc || msg } : x));
        },
      });
    } catch (err) {
      setTyping(false);
      console.error("stream error:", err);
    }
  }

  function sendToBackend(text) {
    if (!text || !text.trim()) return;
    return streamReply(text, (h) => window.BonsaiAPI.chat(text, window.BonsaiAPI.getThread(), h));
  }

  // Run a workflow-backed button. Shows `label` as the user's turn, streams the
  // composed reply. `topic` (optional free text) is forwarded to the workflow.
  function runWorkflowToBackend(workflowId, label, topic) {
    return streamReply(label, (h) => window.BonsaiAPI.runWorkflow(workflowId, topic, h));
  }

  // One turn of the active role-play. Stays in character via /roleplay/chat.
  function sendRolePlayTurn(text) {
    if (!text || !text.trim() || !rolePlay) return;
    return streamReply(text,
      (h) => window.BonsaiAPI.roleplayChat(text, rolePlay.threadId, rolePlay.config, false, h));
  }

  // End the practice: ask Bonsai to drop the role and give feedback, then exit.
  function endRolePlay() {
    if (!rolePlay) return;
    const cfg = rolePlay.config;
    streamReply("He terminado la práctica — ¿cómo lo he hecho?",
      (h) => window.BonsaiAPI.roleplayChat("/feedback", rolePlay.threadId, cfg, true, h),
      () => setRolePlay(null));
  }

  const send = () => {
    const text = input.trim();
    if (!text) return;
    if (rolePlay) return sendRolePlayTurn(text);
    return sendToBackend(text);
  };

  // Start a fresh conversation: drop the persisted thread so the next /chat
  // call opens a new server-side thread, and clear the local view.
  function startNewConversation() {
    setMessages([]);
    setResumeBanner(null);
    if (window.BonsaiAPI?.clearThread) window.BonsaiAPI.clearThread();
    setActiveThreadId(null);
    window.dispatchEvent(new CustomEvent("bonsai:threads-updated"));
  }

  const Thread = (
    <div className="thread-col">
      {resumeBanner && (
        <div className="resume-banner" data-testid="resume-banner">
          <Icon name="clock" size={14} />
          <span>Retomando: <b>{resumeBanner.title}</b>. Bonsai recuerda los turnos anteriores aunque aquí veas el chat en blanco.</span>
          <button
            className="resume-banner-close"
            aria-label="Cerrar aviso"
            onClick={() => setResumeBanner(null)}
          >
            ×
          </button>
        </div>
      )}
      {messages.map(m => (
        <div key={m.id} className={"msg rise " + m.role}>
          {m.role === "bonsai" && <div className="msg-avatar"><BonsaiMark size={20} /></div>}
          <div className="msg-content">
            {m.role === "user"
              ? <div className="bubble-user">{m.text}</div>
              : <>
                  <div className="msg-name">Bonsai <span className="t">guía de aprendizaje</span></div>
                  {m.toolCalls && m.toolCalls.length > 0 && (
                    <div className="tool-trace" data-testid="tool-trace">
                      {m.toolCalls.map((tc) => {
                        const meta = toolLabel(tc.toolName);
                        return (
                          <span
                            key={tc.id || tc.toolName}
                            className={"tool-chip" + (tc.done ? " is-done" : " is-running")}
                            data-tool={tc.toolName}
                            data-done={tc.done ? "true" : "false"}
                          >
                            <span className="tool-emoji">{meta.emoji}</span>
                            <span className="tool-label">{meta.label}</span>
                            {!tc.done && <span className="tool-dots"><i /><i /><i /></span>}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {m.text && <div className="msg-text"><RichText text={m.text} /></div>}
                  {m.resourceCards && m.resourceCards.length > 0 && (
                    <div className="resource-cards" data-testid="resource-cards">
                      {m.resourceCards.map((r) => {
                        const meta = resourceTypeMeta(r.type);
                        const measure = resourceMeasure(r);
                        const desc = r.metadata && r.metadata.description;
                        return (
                          <div
                            key={r.id}
                            className="resource-card"
                            data-testid="resource-card"
                            data-resource-id={r.id}
                            data-resource-type={r.type}
                          >
                            <span className="resource-card-icon">
                              <Icon name={meta.icon} size={18} />
                            </span>
                            <div className="resource-card-body">
                              <div className="resource-card-title">{r.title}</div>
                              <div className="resource-card-meta">
                                <span className="resource-card-type">{meta.label}</span>
                                {measure && (<><span className="resource-card-sep" />{measure}</>)}
                                {desc && (<><span className="resource-card-sep" /><span className="resource-card-desc">{desc}</span></>)}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="resource-card-open"
                              onClick={() => openResourceFromCard(r)}
                              data-testid="resource-card-open"
                            >
                              Abrir
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {m.cite && <span className="cite"><Icon name="file" size={12} /> {m.cite}</span>}
                  {m.stepCompleted && (
                    <div className="step-completed-pill" data-testid="step-completed-pill">
                      <Icon name="check" size={13} /> Paso completado: {m.stepCompleted}
                    </div>
                  )}
                  {m.widget && <Widget w={m.widget} />}
                  {m.quick && <div className="secondary-prompts" style={{ justifyContent: "flex-start", marginTop: 14 }}>
                    {SUGGESTIONS.map(s => <button key={s.key} className="sp" onClick={() => run(s.key)}><Icon name={s.icon} size={14} /> {s.label}</button>)}
                  </div>}
                </>}
          </div>
        </div>
      ))}
      {typing && (
        <div className="msg bonsai"><div className="msg-avatar"><BonsaiMark size={20} /></div>
          <div className="msg-content"><div className="msg-name">Bonsai</div><div className="typing"><i /><i /><i /></div></div></div>
      )}
      <div style={{ height: 8 }} />
    </div>
  );

  const HeroEmpty = (
    <div className="hero rise">
      <div className="hero-mark"><BonsaiMark size={32} /></div>
      <h1>{greeting()}, <span className="greet-accent">{USER.name}</span>.</h1>
      <p className="sub">Soy Bonsai, tu guía de aprendizaje. Te acompaño paso a paso para que avances sin agobios.</p>
      <div className="nudge">
        <span className="badge"><Icon name="play" size={12} /> {PENDING.left}</span>
        <span className="t">Tienes <b>{PENDING.lesson}</b> a medias.</span>
        <button className="btn btn-sm" onClick={() => run("pending")}>Retomar</button>
      </div>
    </div>
  );

  return (
    <div className="chat">
      <div className="chat-top">
        <div className="chat-top-left">
          <BonsaiLogo height={20} />
          <div className="ctx" style={{ marginLeft: 6 }}><Icon name="route" size={14} color="var(--accent)" /> Ruta: Gestor de clientes</div>
        </div>
        <div className="chat-top-right">
          <button className="icon-btn" title="Buscar"><Icon name="search" size={19} /></button>
          <button
            className="icon-btn"
            title="Nueva conversación"
            onClick={startNewConversation}
          >
            <Icon name="plus" size={20} />
          </button>
          <button className="icon-btn" title="Notificaciones"><Icon name="bell" size={19} /></button>
        </div>
      </div>

      <div className="chat-body">
        {variant === "rail" && <ContextSubrail />}
        <div className="thread-scroll" ref={scrollRef}>
          {(empty && !resumeBanner)
            ? (variant === "graph"
                ? <ContentGraph onPick={(n) => n.flow ? run(n.flow) : run("__node", null, n)} />
                : variant === "brief"
                ? <><DailyBrief onPick={run} /><div className="hero rise" style={{ flex: "none", padding: "20px 24px 0" }}>
                     <p className="sub" style={{ marginTop: 0 }}>Pregúntame lo que necesites o empieza por aquí.</p></div></>
                : HeroEmpty)
            : Thread}
        </div>
      </div>

      <div
        className={"composer-wrap" + (empty ? " is-empty" : " is-chatting")}
        style={empty ? { padding: "19px 24px 18px", height: "371px" } : { padding: "14px 24px 18px" }}
      >
        <div className="composer-inner">
          {rolePlay && (
            <div className="resume-banner" style={{ marginBottom: 10, alignItems: "flex-start" }} data-testid="roleplay-banner">
              <Icon name="users" size={14} color="var(--accent)" />
              <span style={{ flex: 1 }}>
                Modo práctica: <b>{rolePlay.config.title}</b> — interpretas a <b>{rolePlay.config.learnerRole}</b>. Responde para seguir el role-play.
              </span>
              <button className="btn btn-sm" onClick={endRolePlay}>
                <Icon name="check" size={13} /> Terminar y recibir feedback
              </button>
            </div>
          )}
          <Composer value={input} onChange={setInput} onSend={send} autoFocus={!empty} />
          {!rolePlay && empty && <WorkflowBar onPick={run} />}
          {!rolePlay && empty && variant !== "graph" && <SecondaryPrompts onPick={run} />}
          {empty && variant === "graph" && <div className="composer-hint">Toca un nodo del mapa o escríbeme directamente.</div>}
          {!empty && showHint && <div className="composer-hint">Bonsai puede equivocarse. Verifica lo importante con tu manager. · Respuestas guionizadas en esta demo.</div>}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Chat });
