/* login.jsx — Auth overlay shown when no token is present.
 *
 * Two quick-pick buttons load the two seeded accounts (learner + manager).
 * On success the overlay closes and the host app reads `BonsaiAPI.currentUser`.
 */
const { useState: useStateLG } = React;

function LoginOverlay({ onLoggedIn }) {
  const [email, setEmail] = useStateLG("learner@acme.us");
  const [busy, setBusy] = useStateLG(false);
  const [err, setErr] = useStateLG("");

  async function submit(emailOverride) {
    const target = emailOverride || email;
    setBusy(true); setErr("");
    try {
      const res = await window.BonsaiAPI.devLogin(target.trim());
      onLoggedIn && onLoggedIn(res.user);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-overlay" role="dialog" aria-modal="true">
      <div className="login-card">
        <div className="login-brand">
          {window.BonsaiMark && <span className="login-mark"><BonsaiMark size={28} /></span>}
          <div>
            <div className="login-title">Bonsai</div>
            <div className="login-sub">Entrar a tu workspace</div>
          </div>
        </div>

        <label className="login-label" htmlFor="login-email">Email</label>
        <input
          id="login-email"
          name="email"
          className="login-input"
          type="email"
          autoComplete="email"
          aria-label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !busy) submit(); }}
          autoFocus
        />

        <div className="login-quick">
          <button
            type="button"
            className="login-quick-btn"
            onClick={() => submit("learner@acme.us")}
            disabled={busy}
          >
            Soy <b>empleado</b> (learner@acme.us)
          </button>
          <button
            type="button"
            className="login-quick-btn"
            onClick={() => submit("manager@acme.us")}
            disabled={busy}
          >
            Soy <b>manager</b> (manager@acme.us)
          </button>
        </div>

        <button
          type="button"
          className="login-cta"
          onClick={() => submit()}
          disabled={busy || !email.trim()}
        >
          {busy ? "Entrando…" : "Entrar"}
        </button>

        {err && <div className="login-err">{err}</div>}

        <div className="login-foot">
          API: <code>{window.BonsaiAPI.apiBase()}</code>
        </div>
      </div>

      <style>{`
        .login-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(8, 10, 18, 0.72);
          backdrop-filter: blur(6px);
          display: grid; place-items: center;
          font-family: var(--font-ui, system-ui);
        }
        .login-card {
          width: 400px; max-width: calc(100vw - 32px);
          background: var(--panel, #1B1E26);
          border: 1px solid var(--border, #2A2E3A);
          border-radius: 14px;
          padding: 26px;
          color: var(--fg, #E8E9EE);
          box-shadow: 0 30px 80px rgba(0,0,0,.4);
        }
        .login-brand { display: flex; gap: 12px; align-items: center; margin-bottom: 18px; }
        .login-mark { display: inline-flex; padding: 6px; background: rgba(47,108,255,0.12); border-radius: 10px; }
        .login-title { font-size: 18px; font-weight: 700; line-height: 1; }
        .login-sub { font-size: 12.5px; color: var(--fg-3, #8B91A2); margin-top: 4px; }
        .login-label { display: block; font-size: 12px; color: var(--fg-3, #8B91A2); margin: 0 0 6px; }
        .login-input {
          width: 100%; padding: 9px 11px; border-radius: 8px;
          border: 1px solid var(--border, #2A2E3A);
          background: #0F1117; color: var(--fg, #E8E9EE);
          font: inherit;
        }
        .login-input:focus { outline: none; border-color: var(--accent, #2F6CFF); }
        .login-quick { display: flex; flex-direction: column; gap: 8px; margin: 14px 0; }
        .login-quick-btn {
          background: #0F1117; color: var(--fg, #E8E9EE);
          border: 1px solid var(--border, #2A2E3A);
          border-radius: 8px; padding: 9px 12px;
          font: inherit; cursor: pointer;
          text-align: left;
        }
        .login-quick-btn:hover { border-color: var(--accent, #2F6CFF); }
        .login-quick-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .login-cta {
          width: 100%; padding: 10px 14px; border-radius: 8px;
          background: var(--accent, #2F6CFF); color: white; border: none;
          font: inherit; font-weight: 600; cursor: pointer;
        }
        .login-cta:disabled { opacity: 0.55; cursor: not-allowed; }
        .login-err { color: var(--danger, #E54B5C); font-size: 12.5px; margin-top: 10px; }
        .login-foot { margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border, #2A2E3A); color: var(--fg-3, #8B91A2); font-size: 11.5px; }
        .login-foot code { background: rgba(255,255,255,0.06); padding: 1px 5px; border-radius: 4px; font-size: 11px; }
      `}</style>
    </div>
  );
}

Object.assign(window, { LoginOverlay });
