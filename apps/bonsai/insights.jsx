/* insights.jsx — Insights panel (mocked): dudas principales de los empleados,
   lo que más se pregunta a la IA. Reutiliza la maqueta de dashboard (dash.css). */

function Insights() {
  const I = INSIGHTS;
  const maxTopic = Math.max(...I.topics.map(t => t.pct));
  return (
    <div className="dash">
      <div className="dash-top">
        <h2><Icon name="lightbulb" size={20} color="var(--accent)" /> Insights · qué pregunta tu gente</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="demo-tag"><Icon name="sparkles" size={12} /> Moqueado</span>
          <button className="btn btn-ghost btn-sm"><Icon name="calendar" size={14} /> Últimos 30 días</button>
          <button className="btn btn-accent btn-sm"><Icon name="download" size={15} /> Exportar</button>
        </div>
      </div>
      <div className="dash-scroll"><div className="dash-inner">

        <div className="kpis">
          {I.kpis.map((c, i) => (
            <div className="kpi card rise" key={i} style={{ animationDelay: i * 40 + "ms" }}>
              <span className="accentbar" style={{ background: c.accent }} />
              <div className="k">{c.k}</div>
              <div className="v" style={{ color: c.k === "Sin respuesta clara" ? "var(--danger)" : "var(--fg)" }}>{c.v}</div>
              <div className="d" style={{ color: c.up ? "var(--success)" : "var(--danger)" }}>
                <Icon name={c.up ? "trending" : "chevronDown"} size={13} /> {c.d}
              </div>
            </div>
          ))}
        </div>

        <div className="two-col">
          {/* lo más preguntado a la IA */}
          <div className="panel card">
            <div className="panel-head">
              <span className="pt"><Icon name="message" size={17} color="var(--accent)" /> Lo más preguntado a Bonsai</span>
              <button className="btn btn-ghost btn-sm"><Icon name="filter" size={14} /> Tema</button>
            </div>
            {I.topQuestions.map((q, i) => (
              <div className="iq" key={i}>
                <span className="iq-rank">{i + 1}</span>
                <div className="iq-main">
                  <div className="iq-q">{q.q}</div>
                  <div className="iq-meta">
                    <span className="iq-topic">{q.topic}</span>
                    <span className={"iq-flag " + (q.resolved ? "ok" : "miss")}>
                      <Icon name={q.resolved ? "check" : "x"} size={11} /> {q.resolved ? "Resuelta por IA" : "Sin respuesta"}
                    </span>
                  </div>
                </div>
                <div className="iq-count">
                  <div className="c">{q.count}</div>
                  <div className="tr" style={{ color: q.trend.startsWith("-") ? "var(--danger)" : "var(--success)" }}>{q.trend}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {/* temas más consultados */}
            <div className="panel card">
              <div className="panel-head"><span className="pt"><Icon name="layers" size={17} color="var(--accent)" /> Temas más consultados</span></div>
              {I.topics.map((t, i) => (
                <div className="route-mini" key={i}>
                  <div className="top"><span style={{ fontWeight: 600 }}>{t.t}</span><span className="ppl">{t.count} · {t.pct}%</span></div>
                  <div className="track"><span style={{ width: (t.pct / maxTopic * 100) + "%" }} /></div>
                </div>
              ))}
            </div>

            {/* lagunas de contenido */}
            <div className="panel card">
              <div className="panel-head"><span className="pt"><Icon name="lightbulb" size={17} color="var(--warning)" /> Lagunas de contenido</span><span className="badge tan">Acción</span></div>
              {I.gaps.map((g, i) => (
                <div className="gap-row" key={i}>
                  <span className="gap-ico"><Icon name="search" size={15} /></span>
                  <div className="gap-main">
                    <div className="gap-t">{g.t}</div>
                    <div className="gap-n">{g.note}</div>
                  </div>
                  <div className="gap-miss"><b>{g.miss}</b>sin resolver</div>
                </div>
              ))}
              <div style={{ padding: "4px 18px 16px" }}>
                <button className="btn btn-sm" style={{ width: "100%" }}><Icon name="upload" size={14} /> Subir contenido para cubrir lagunas</button>
              </div>
            </div>
          </div>
        </div>

      </div></div>
    </div>
  );
}
Object.assign(window, { Insights });
