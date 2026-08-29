/* admin.jsx — Global admin console (mocked): catalog, monetization, global analytics */

function Admin() {
  const max = Math.max(...ADMIN.bars);
  const months = ["E","F","M","A","M","J","J","A","S","O","N","D"];
  return (
    <div className="dash">
      <div className="dash-top">
        <h2><Icon name="shield" size={20} color="var(--accent)" /> Consola global</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="demo-tag"><Icon name="sparkles" size={12} /> Moqueado</span>
          <div className="ctx" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 11px", border: "1px solid var(--line-2)", borderRadius: "999px", background: "var(--surface-1)", fontSize: 12.5, color: "var(--fg-2)" }}><Icon name="globe" size={14} color="var(--accent)" /> Northwind · 3 sedes</div>
        </div>
      </div>
      <div className="dash-scroll"><div className="dash-inner">

        <div className="kpis">
          {ADMIN.kpis.map((c, i) => (
            <div className="kpi card rise" key={i} style={{ animationDelay: i * 40 + "ms" }}>
              <span className="accentbar" style={{ background: c.accent }} />
              <div className="k">{c.k}</div>
              <div className="v">{c.v}</div>
              <div className="d" style={{ color: "var(--success)" }}><Icon name="trending" size={13} /> {c.d}</div>
            </div>
          ))}
        </div>

        <div className="two-col">
          <div className="panel card">
            <div className="panel-head"><span className="pt"><Icon name="chart" size={17} color="var(--accent)" /> Horas de aprendizaje · 12 meses</span><span className="badge neutral">2025–26</span></div>
            <div className="bars">
              {ADMIN.bars.map((b, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" }}>
                  <div className="bar" style={{ height: (b / max * 100) + "%", width: "100%" }} title={b * 180 + " h"} />
                  <span style={{ fontSize: 10, color: "var(--fg-3)" }}>{months[i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel card">
            <div className="panel-head"><span className="pt"><Icon name="coins" size={17} color="var(--tan)" /> Monetización · add-ons</span></div>
            <div style={{ padding: 18 }}>
              <div className="num" style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.025em", color: "var(--tan)" }}>24.900 €</div>
              <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 4 }}>ingresos por recursos premium este mes</div>
              <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 13 }}>
                {[{ t: "Certificación PMP®", v: 58, eur: "14.400 €" }, { t: "Inglés B2", v: 30, eur: "6.900 €" }, { t: "Excel avanzado", v: 12, eur: "3.600 €" }].map((r, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}><span>{r.t}</span><span style={{ color: "var(--fg-2)", fontVariantNumeric: "tabular-nums" }}>{r.eur}</span></div>
                    <div className="track tan"><span style={{ width: r.v + "%" }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="panel card">
          <div className="panel-head"><span className="pt"><Icon name="layers" size={17} color="var(--accent)" /> Catálogo central de cursos</span>
            <div style={{ display: "flex", gap: 8 }}><button className="btn btn-ghost btn-sm"><Icon name="search" size={14} /> Buscar</button><button className="btn btn-accent btn-sm"><Icon name="plus" size={15} /> Añadir curso</button></div></div>
          {ADMIN.catalog.map((c, i) => {
            const premium = c.price.includes("Premium"), addon = c.price.includes("Add-on");
            return (
              <div className="cat-row" key={i}>
                <span className="cat-ico"><Icon name="cap" size={18} /></span>
                <div className="cat-main"><div className="cat-t">{c.t}</div><div className="cat-c">{c.cat}</div></div>
                <span className="cat-seats">{c.seats.toLocaleString("es-ES")} asignados</span>
                <span className="cat-price"><span className={"badge " + (premium ? "tan" : addon ? "" : "neutral")}>{c.price}</span></span>
              </div>
            );
          })}
        </div>

      </div></div>
    </div>
  );
}
Object.assign(window, { Admin });
