/* catalog-app.jsx — Storybook-style shell for the Bonsai UI catalog. */

const { useState: useStateApp, useEffect: useEffectApp, useMemo: useMemoApp } = React;

/* tiny JSX highlighter → returns HTML string. Single-pass tokenizer so we never
   nest spans (which would corrupt the markup). */
function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function highlight(code) {
  const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(<\/?[A-Za-z][A-Za-z0-9]*)/g;
  let out = "", last = 0, m;
  while ((m = re.exec(code))) {
    out += esc(code.slice(last, m.index));
    if (m[1]) out += '<span class="tok-com">' + esc(m[1]) + "</span>";
    else if (m[2]) out += '<span class="tok-str">' + esc(m[2]) + "</span>";
    else if (m[3]) {
      const lead = m[3].startsWith("</") ? "&lt;/" : "&lt;";
      out += lead + '<span class="tok-tag">' + esc(m[3].replace(/^<\/?/, "")) + "</span>";
    }
    last = re.lastIndex;
  }
  out += esc(code.slice(last));
  return out;
}

function CodeBlock({ code }) {
  const [copied, setCopied] = useStateApp(false);
  const copy = () => {
    navigator.clipboard && navigator.clipboard.writeText(code);
    setCopied(true); setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div className="demo-code">
      <div className="demo-code-head">
        <span>TSX</span>
        <button className="demo-copy" onClick={copy}><Icon name={copied ? "check" : "file"} size={13} /> {copied ? "Copiado" : "Copiar"}</button>
      </div>
      <pre dangerouslySetInnerHTML={{ __html: highlight(code) }} />
    </div>
  );
}

function Demo({ demo }) {
  return (
    <div className="demo">
      {demo.label && <div className="demo-label">{demo.label}</div>}
      <div className="cat-wrap-code">
        <div className="demo-canvas">{demo.render()}</div>
        <CodeBlock code={demo.code} />
      </div>
    </div>
  );
}

function ComponentPage({ item }) {
  return (
    <div className="cat-body" key={item.id}>
      <div>
        <span className="cat-h">{item.name}</span>
        <span className="cat-tag">{item.demos.length} {item.demos.length === 1 ? "ejemplo" : "ejemplos"}</span>
      </div>
      <p className="cat-desc">{item.desc}</p>
      {item.demos.map((d, i) => <Demo key={i} demo={d} />)}
    </div>
  );
}

function ThemeToggle({ theme, onToggle }) {
  return (
    <button className="theme-toggle" onClick={onToggle}>
      <Icon name={theme === "dark" ? "sparkles" : "star"} size={15} />
      {theme === "dark" ? "Oscuro" : "Claro"}
    </button>
  );
}

function Catalog() {
  const flat = useMemoApp(() => CATALOG.flatMap(g => g.items.map(it => ({ ...it, group: g.group }))), []);
  const [activeId, setActiveId] = useStateApp(flat[0].id);
  const [query, setQuery] = useStateApp("");
  const [theme, setTheme] = useStateApp(() => localStorage.getItem("bonsai-cat-theme") || "dark");

  useEffectApp(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("bonsai-cat-theme", theme);
  }, [theme]);

  const active = flat.find(it => it.id === activeId) || flat[0];
  const q = query.trim().toLowerCase();
  const filtered = CATALOG.map(g => ({
    group: g.group,
    items: g.items.filter(it => !q || it.name.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q)),
  })).filter(g => g.items.length);

  return (
    <div className="cat">
      <aside className="cat-side">
        <div className="cat-brand"><Wordmark height={22} /></div>
        <div className="cat-search">
          <Icon name="search" size={15} />
          <input placeholder="Buscar componente…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <nav className="cat-nav">
          {filtered.map(g => (
            <div key={g.group}>
              <div className="cat-group-t">{g.group}</div>
              {g.items.map(it => (
                <button key={it.id} className={"cat-link" + (it.id === activeId ? " active" : "")} onClick={() => setActiveId(it.id)}>
                  <span className="dot" />{it.name}
                </button>
              ))}
            </div>
          ))}
          {!filtered.length && <div style={{ padding: "20px 10px", color: "var(--fg-3)", fontSize: 13 }}>Sin resultados.</div>}
        </nav>
      </aside>
      <main className="cat-main">
        <div className="cat-top">
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "var(--fg-3)" }}>
            {active.group} <span style={{ color: "var(--fg-muted)" }}>/</span> <span style={{ color: "var(--fg)" }}>{active.name}</span>
          </div>
          <div className="cat-top-actions">
            <ThemeToggle theme={theme} onToggle={() => setTheme(t => t === "dark" ? "light" : "dark")} />
          </div>
        </div>
        <ComponentPage item={active} />
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Catalog />);
