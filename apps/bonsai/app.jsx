/* app.jsx — Bonsai shell: auth gate, left rail, role switching, Tweaks */
const { useState: useStateA, useEffect: useEffectA } = React;

const FONT_PAIRS = {
  geo:   { display: '"Space Grotesk", sans-serif', ui: '"Hanken Grotesk", sans-serif', label: "Geométrica" },
  sora:  { display: '"Sora", sans-serif',          ui: '"Sora", sans-serif',          label: "Sora" },
  outfit:{ display: '"Outfit", sans-serif',        ui: '"Hanken Grotesk", sans-serif', label: "Outfit" },
};
const DENSITY = { compacto: 0.93, normal: 1, amplio: 1.07 };
const BACKGROUNDS = {
  carbon:  { hex: "#14161C", label: "Negro" },
  negro:   { hex: "#000000", label: "Negro puro" },
  azulado: { hex: "#080B14", label: "Negro azulado" },
  calido:  { hex: "#13100E", label: "Cálido" },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "oscuro",
  "accent": "#2F6CFF",
  "bg": "carbon",
  "chatLayout": "aprendizaje",
  "fontPair": "geo",
  "density": "normal",
  "showHint": true
}/*EDITMODE-END*/;

const ROLES = [
  { id: "chat", icon: "message", label: "Mi aprendizaje", sub: "Empleado" },
  { id: "manager", icon: "users", label: "Equipo", sub: "Manager" },
  { id: "insights", icon: "lightbulb", label: "Insights", sub: "Dudas IA" },
  { id: "admin", icon: "shield", label: "Global", sub: "Admin" },
];

function App() {
  // Auth gate: show LoginOverlay until BonsaiAPI has a token + user.
  const [authedUser, setAuthedUser] = useStateA(() => window.BonsaiAPI?.currentUser?.() || null);
  const [role, setRole] = useStateA("chat");
  const [resetN, setResetN] = useStateA(0);
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // When a manager logs in we land them on the manager view by default; for
  // learners we keep the existing "aprendizaje" landing.
  useEffectA(() => {
    if (authedUser && authedUser.role === "manager" && role === "chat") {
      setRole("manager");
    }
  }, [authedUser]);

  // A 401 from any protected call (stale/expired token) clears the session in
  // api.jsx and fires this event. Drop back to the LoginOverlay instead of
  // leaving a dead-end "Algo ha fallado" the user can't escape.
  useEffectA(() => {
    const onUnauthorized = () => setAuthedUser(null);
    window.addEventListener("bonsai:unauthorized", onUnauthorized);
    return () => window.removeEventListener("bonsai:unauthorized", onUnauthorized);
  }, []);

  function handleLogout() {
    window.BonsaiAPI.logout();
    setAuthedUser(null);
  }

  // Logo = inicio: abre el chat de cero y muestra el mapa del onboarding de nuevo.
  const goHome = () => { setRole("chat"); setTweak("chatLayout", "graph"); setResetN(n => n + 1); };

  // Conversations panel (left menu) → chat. Stash the intent on window so the
  // freshly-mounted Chat picks it up, then bring the centered chat into focus
  // and bump resetN so Chat always remounts cleanly on the selected thread.
  const openThreadInChat = (t) => {
    if (window.BonsaiAPI?.setThread) window.BonsaiAPI.setThread(t.id);
    window.__bonsaiPendingThread = { type: "open", threadId: t.id, title: t.title };
    setRole("chat"); setTweak("chatLayout", "center"); setResetN(n => n + 1);
  };
  const openNewChat = () => {
    if (window.BonsaiAPI?.clearThread) window.BonsaiAPI.clearThread();
    window.__bonsaiPendingThread = { type: "new" };
    setRole("chat"); setTweak("chatLayout", "center"); setResetN(n => n + 1);
  };

  const fp = FONT_PAIRS[t.fontPair] || FONT_PAIRS.geo;
  const light = t.theme === "claro";
  const rootStyle = {
    "--accent": t.accent,
    "--font-display": fp.display,
    "--font-ui": fp.ui,
    "--ui-scale": DENSITY[t.density] || 1,
  };
  if (!light) rootStyle["--bg"] = (BACKGROUNDS[t.bg] || BACKGROUNDS.carbon).hex;

  // Render the auth overlay until we have a session. Returning AFTER the
  // hooks above keeps React's hooks order stable across renders.
  if (!authedUser) {
    return <LoginOverlay onLoggedIn={(u) => setAuthedUser(u)} />;
  }

  // Compute initials from the real authenticated user (fallback to mock).
  const displayName = authedUser.name || USER.full;
  const initials = displayName
    .split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    || USER.initials;

  // The conversations panel is part of the left menu, shown only in the
  // learner area (role "chat") where threads are meaningful.
  const showThreads = role === "chat";

  return (
    <div className={"app" + (showThreads ? " has-threads" : "")} data-theme={light ? "light" : "dark"} style={rootStyle}>
      <nav className="rail">
        <button className="rail-logo" onClick={goHome} title="Inicio · nueva conversación"><BonsaiMark size={26} /></button>
        <div className="rail-group" style={{ marginTop: 6 }}>
          {ROLES.map(r => (
            <button key={r.id} className={"rail-btn" + (role === r.id ? " active" : "")} onClick={() => {
              setRole(r.id);
              // "Mi aprendizaje" must always land on the learning route, even if a
              // previous nav (logo → graph, or opening the chat → center) left
              // chatLayout on another variant. Without this the button is a no-op.
              if (r.id === "chat") setTweak("chatLayout", "aprendizaje");
            }}>
              <Icon name={r.icon} size={22} />
              <span className="rail-tip">{r.label} · <span style={{ color: "var(--fg-3)" }}>{r.sub}</span></span>
            </button>
          ))}
        </div>
        <div className="rail-spacer" />
        <div className="rail-group">
          <button
            className="rail-avatar"
            title={`${displayName} · ${authedUser.role}  ·  Cerrar sesión`}
            onClick={handleLogout}
            style={{ border: "none", cursor: "pointer" }}
          >
            {initials}
          </button>
        </div>
      </nav>

      {showThreads && <ThreadsPanel onPick={openThreadInChat} onNew={openNewChat} />}

      <main className="surface">
        {role === "chat" && (t.chatLayout === "aprendizaje"
          ? <MiAprendizaje onOpenChat={() => setTweak("chatLayout", "center")} />
          : <Chat key={t.chatLayout + "-" + resetN} variant={t.chatLayout} showHint={t.showHint} accent={t.accent} />)}
        {role === "manager" && <Manager />}
        {role === "insights" && <Insights />}
        {role === "admin" && <Admin />}
      </main>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Marca" />
        <TweakRadio label="Tema" value={t.theme}
          options={[{ value: "claro", label: "Claro" }, { value: "oscuro", label: "Oscuro" }]}
          onChange={(v) => setTweak("theme", v)} />
        <TweakColor label="Color de acento" value={t.accent}
          options={["#2F6CFF", "#4F8DFF", "#1E54E8", "#18E591", "#F56D3E"]}
          onChange={(v) => setTweak("accent", v)} />
        <TweakSelect label="Tipografía" value={t.fontPair}
          options={Object.keys(FONT_PAIRS).map(k => ({ value: k, label: FONT_PAIRS[k].label }))}
          onChange={(v) => setTweak("fontPair", v)} />
        {!light && <TweakSelect label="Fondo (oscuro)" value={t.bg}
          options={Object.keys(BACKGROUNDS).map(k => ({ value: k, label: BACKGROUNDS[k].label }))}
          onChange={(v) => setTweak("bg", v)} />}

        <TweakSection label="Chat del empleado" />
        <TweakSelect label="Distribución del inicio" value={t.chatLayout}
          options={[{ value: "aprendizaje", label: "Mi aprendizaje (ruta)" }, { value: "graph", label: "Mapa del onboarding" }, { value: "center", label: "Centrado (chat)" }, { value: "rail", label: "Con panel lateral" }, { value: "brief", label: "Resumen diario" }]}
          onChange={(v) => { setRole("chat"); setTweak("chatLayout", v); }} />
        <TweakToggle label="Aviso bajo el chat" value={t.showHint} onChange={(v) => setTweak("showHint", v)} />

        <TweakSection label="Densidad" />
        <TweakRadio label="Tamaño UI" value={t.density}
          options={[{ value: "compacto", label: "Compacto" }, { value: "normal", label: "Normal" }, { value: "amplio", label: "Amplio" }]}
          onChange={(v) => setTweak("density", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
