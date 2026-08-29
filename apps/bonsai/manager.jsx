/* manager.jsx — Manager panel: team/route panels stay mocked (no backend
 * endpoints), but the "Documentos de empresa" panel and the upload zone are
 * fully wired to /resources + /resources/pdf with real Bonsai responses. */

const { useState: useStateM, useEffect: useEffectM, useRef: useRefM } = React;

function useManagerResources() {
  const [items, setItems] = useStateM([]);
  const [loading, setLoading] = useStateM(true);
  const [error, setError] = useStateM(null);
  const [uploading, setUploading] = useStateM(false);

  async function refresh() {
    setLoading(true); setError(null);
    try {
      const res = await window.BonsaiAPI.getResources();
      setItems(res.resources || []);
    } catch (e) {
      setError(e.message || "No hemos podido cargar los recursos.");
    } finally {
      setLoading(false);
    }
  }

  useEffectM(() => { refresh(); }, []);

  async function uploadFile(file) {
    if (!file) return;
    setUploading(true);
    try {
      const res = await window.BonsaiAPI.uploadPdf(file);
      // Refresh the list so the new row appears.
      await refresh();
      return res;
    } catch (e) {
      setError(e.message || "Subida fallida");
      throw e;
    } finally {
      setUploading(false);
    }
  }

  return { items, loading, error, uploading, refresh, uploadFile };
}

const STATUS_LABEL = {
  indexed: "Indexado",
  indexing: "Indexando…",
  registered: "Registrado",
  mock: "Mock",
  error: "Error",
};

/* Minimal markdown → HTML for the workflow modal (reuses marked if present). */
function mdToHtmlM(text) {
  const m = window.marked;
  if (m && typeof m.parse === "function") {
    try { return m.parse(text, { breaks: true }); } catch (_) { /* fall through */ }
  }
  // Fallback: paragraphs + **bold**.
  return (text || "")
    .split(/\n{2,}/)
    .map(p => "<p>" + p.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>") + "</p>")
    .join("");
}

/* Slide-over modal that streams a manager workflow's composed reply. */
function ManagerWorkflowModal({ state, onClose }) {
  if (!state.open) return null;
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(8,20,16,.45)", zIndex: 60, display: "flex", justifyContent: "flex-end" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ width: "min(560px, 94vw)", height: "100%", borderRadius: 0, display: "flex", flexDirection: "column", boxShadow: "-12px 0 40px rgba(0,0,0,.18)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 20px", borderBottom: "1px solid var(--line)" }}>
          <span className="doc-ico"><Icon name={state.icon || "sparkles"} size={18} color="var(--accent)" /></span>
          <div style={{ flex: 1, fontWeight: 700 }}>{state.title}</div>
          <span className="demo-tag"><Icon name="sparkles" size={12} /> Workflow</span>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><Icon name="x" size={18} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
          {state.error
            ? <div style={{ color: "var(--danger)", fontSize: 13.5 }}><Icon name="alert" size={14} /> {state.error}</div>
            : state.text
              ? <div className="rich-text" dangerouslySetInnerHTML={{ __html: mdToHtmlM(state.text) }} />
              : <div style={{ color: "var(--fg-3)", fontSize: 13 }}>Bonsai está ejecutando el workflow…</div>}
          {state.loading && state.text && (
            <div style={{ color: "var(--fg-3)", fontSize: 12, marginTop: 10 }}>▋</div>
          )}
        </div>
      </div>
    </div>
  );
}

const MGR_WF_INITIAL = { open: false, title: "", icon: "", text: "", loading: false, error: "" };

function Manager() {
  const atRisk = MANAGER.team.filter(t => t.risk).length;
  const docs = useManagerResources();
  const fileRef = useRefM(null);
  const [dragOver, setDragOver] = useStateM(false);
  const [lastWarning, setLastWarning] = useStateM("");
  const [wf, setWf] = useStateM(MGR_WF_INITIAL);

  // Run one of the manager workflows and stream its reply into the modal.
  function runWf(sug) {
    setWf({ open: true, title: sug.label, icon: sug.icon, text: "", loading: true, error: "" });
    let acc = "";
    window.BonsaiAPI.runWorkflow(sug.key, null, {
      onDelta: (delta) => { acc += delta; setWf(s => s.open ? { ...s, text: acc } : s); },
      onDone: () => setWf(s => s.open ? { ...s, loading: false } : s),
      onError: (err) => setWf(s => s.open
        ? { ...s, loading: false, error: (err && err.message) || "Error al ejecutar el workflow" }
        : s),
    });
  }

  async function handleFiles(files) {
    if (!files || !files.length) return;
    setLastWarning("");
    for (const file of Array.from(files)) {
      if (!/\.pdf$/i.test(file.name)) {
        setLastWarning(`"${file.name}" no es un PDF — se ha omitido.`);
        continue;
      }
      try {
        const res = await docs.uploadFile(file);
        if (res && res.warning) setLastWarning(res.warning);
      } catch (e) { /* error surfaced via docs.error */ }
    }
  }
  return (
    <div className="dash">
      <div className="dash-top">
        <h2><Icon name="users" size={20} color="var(--accent)" /> Panel del Manager</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {(window.MANAGER_SUGGESTIONS || []).map(s => (
            <button key={s.key} className="btn btn-sm" title={s.sub} onClick={() => runWf(s)}>
              <Icon name={s.icon} size={15} /> {s.short}
            </button>
          ))}
        </div>
      </div>
      <ManagerWorkflowModal state={wf} onClose={() => setWf(MGR_WF_INITIAL)} />
      <div className="dash-scroll"><div className="dash-inner">

        <div className="kpis">
          {[
            { k: "Personas a cargo", v: "5", d: "Equipo Producto", accent: "var(--accent)", up: true },
            { k: "Progreso medio", v: "45%", d: "+7 pts esta semana", accent: "var(--tan)", up: true },
            { k: "Horas / semana", v: "26 h", d: "+3 h", accent: "var(--success)", up: true },
            { k: "En riesgo", v: String(atRisk), d: "sin actividad +5 d", accent: "var(--danger)", up: false },
          ].map((c, i) => (
            <div className="kpi card rise" key={i} style={{ animationDelay: i * 40 + "ms" }}>
              <span className="accentbar" style={{ background: c.accent }} />
              <div className="k">{c.k}</div>
              <div className="v" style={{ color: c.k === "En riesgo" ? "var(--danger)" : "var(--fg)" }}>{c.v}</div>
              <div className="d" style={{ color: c.up ? "var(--success)" : "var(--danger)" }}>
                <Icon name={c.up ? "trending" : "chevronDown"} size={13} /> {c.d}
              </div>
            </div>
          ))}
        </div>

        <div className="two-col">
          <div className="panel card">
            <div className="panel-head"><span className="pt"><Icon name="chart" size={17} color="var(--accent)" /> Progreso del equipo en tiempo real</span>
              <button className="btn btn-ghost btn-sm"><Icon name="filter" size={14} /> Filtrar</button></div>
            <div className="table">
              <div className="trow head"><span style={{ width: 34 }} /><span className="cell-name">Persona</span><span className="cell-prog">Progreso</span><span className="cell-trend">7 d</span><span className="cell-last">Activo</span></div>
              {MANAGER.team.map((t, i) => (
                <div className="trow" key={i}>
                  <span className="av">{t.n.split(" ").map(x => x[0]).join("").slice(0, 2)}</span>
                  <div className="cell-name"><div className="nm">{t.n} {t.risk && <span className="badge" style={{ background: "color-mix(in srgb,var(--danger) 14%,transparent)", color: "var(--danger)", borderColor: "color-mix(in srgb,var(--danger) 30%,transparent)", marginLeft: 6 }}>en riesgo</span>}</div><div className="rt">{t.r}</div></div>
                  <div className="cell-prog"><div className="track" style={{ flex: 1 }}><span style={{ width: t.pct + "%", background: t.risk ? "var(--danger)" : "var(--accent)" }} /></div><span className="pv">{t.pct}%</span></div>
                  <span className="cell-trend" style={{ color: t.trend.startsWith("-") ? "var(--danger)" : t.trend === "0" ? "var(--fg-3)" : "var(--success)" }}>{t.trend !== "0" && !t.trend.startsWith("-") ? "+" + t.trend.replace("+", "") : t.trend}</span>
                  <span className="cell-last">{t.last}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div className="panel card">
              <div className="panel-head"><span className="pt"><Icon name="route" size={17} color="var(--accent)" /> Rutas asignadas</span></div>
              {MANAGER.routes.map((r, i) => (
                <div className="route-mini" key={i}>
                  <div className="top"><span style={{ fontWeight: 600 }}>{r.t}</span><span className="ppl">{r.people} personas</span></div>
                  <div className="track"><span style={{ width: r.pct + "%" }} /></div>
                </div>
              ))}
            </div>

            <div className="panel card">
              <div className="panel-head">
                <span className="pt"><Icon name="file" size={17} color="var(--accent)" /> Documentos de empresa</span>
                <span className="badge tan">RAG</span>
              </div>
              {docs.loading && (
                <div className="doc-row" style={{ color: "var(--fg-3)", fontSize: 12.5 }}>
                  <span className="doc-ico"><Icon name="file" size={16} /></span>
                  <div style={{ flex: 1 }}>Cargando catálogo…</div>
                </div>
              )}
              {docs.error && (
                <div className="doc-row" style={{ color: "var(--danger)", fontSize: 12.5 }}>
                  <span className="doc-ico"><Icon name="file" size={16} /></span>
                  <div style={{ flex: 1 }}>{docs.error}</div>
                </div>
              )}
              {!docs.loading && !docs.error && docs.items.length === 0 && (
                <div className="doc-row" style={{ color: "var(--fg-3)", fontSize: 12.5 }}>
                  <span className="doc-ico"><Icon name="file" size={16} /></span>
                  <div style={{ flex: 1 }}>Aún no hay recursos en el catálogo.</div>
                </div>
              )}
              {docs.items.map((d) => {
                const ok = d.status === "indexed";
                const label = STATUS_LABEL[d.status] || d.status;
                const meta = d.metadata || {};
                const sub = ok
                  ? `${d.type} · listo para el chat`
                  : d.status === "error"
                    ? "Error al indexar — revisa OPENAI_API_KEY"
                    : meta.description
                      ? meta.description.slice(0, 60) + (meta.description.length > 60 ? "…" : "")
                      : "Indexando para el chat…";
                return (
                  <div className="doc-row" key={d.id}>
                    <span className="doc-ico"><Icon name="file" size={16} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</div>
                      <div style={{ fontSize: 11.5, color: "var(--fg-3)" }}>{sub}</div>
                    </div>
                    <span className={"badge " + (ok ? "success" : d.status === "error" ? "neutral" : "neutral")}>{label}</span>
                  </div>
                );
              })}
              <div
                className={"dropzone" + (dragOver ? " is-over" : "")}
                onClick={() => fileRef.current && fileRef.current.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                style={{ cursor: "pointer", opacity: docs.uploading ? 0.6 : 1 }}
              >
                <Icon name="upload" size={22} color="var(--fg-3)" />
                <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 8 }}>
                  {docs.uploading ? "Subiendo y procesando…" : "Sube un PDF"}
                </div>
                <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 3 }}>
                  {docs.uploading ? "Bonsai lo indexará en cuanto termine" : "Bonsai lo indexará automáticamente para el chat"}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  style={{ display: "none" }}
                  onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
                />
              </div>
              {lastWarning && (
                <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--fg-3)", lineHeight: 1.4 }}>
                  <Icon name="alert" size={12} /> {lastWarning}
                </div>
              )}
            </div>
          </div>
        </div>

      </div></div>
    </div>
  );
}
Object.assign(window, { Manager });
