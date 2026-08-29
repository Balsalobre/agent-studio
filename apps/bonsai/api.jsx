/* api.jsx — Bonsai backend integration layer.
 *
 * Exposes `window.BonsaiAPI` with all HTTP calls the prototype needs:
 *   - devLogin(email)         -> { token, user }
 *   - getRoute()              -> route
 *   - getProgress()           -> progress[]
 *   - getResources()          -> resources[]  (manager-only)
 *   - openResource(id)        -> { ok, completedStep? }
 *   - chat(message, threadId, { onDelta, onDone, onError, signal })
 *   - uploadPdf(file)         -> { resource, warning? }
 *
 * Token + session live in localStorage. API base is auto-detected (assumes
 * same origin unless overridden via ?api=... or localStorage.bonsai.api).
 */
(function () {
  const STORAGE_TOKEN = "bonsai.token";
  const STORAGE_USER = "bonsai.user";
  const STORAGE_THREAD = "bonsai.thread";
  const STORAGE_API = "bonsai.api";

  function apiBase() {
    const url = new URL(location.href);
    const fromQS = url.searchParams.get("api");
    const fromStorage = localStorage.getItem(STORAGE_API);
    if (fromQS) {
      localStorage.setItem(STORAGE_API, fromQS); // sticky for the session
      return fromQS;
    }
    if (fromStorage) return fromStorage;
    const host = url.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1";
    // Local split-server dev: front served by a static server on :5500, while
    // the Mastra API runs separately on :4111. (Override with ?api=... if you
    // use a different static port.)
    if (isLocal && url.port === "5500") return "http://localhost:4111";
    // Production / same-origin: the Mastra server serves the front at /app and
    // exposes the API on the same host (Railway, etc.).
    return location.origin;
  }

  function token() { return localStorage.getItem(STORAGE_TOKEN); }
  function setSession(t, u) {
    localStorage.setItem(STORAGE_TOKEN, t);
    localStorage.setItem(STORAGE_USER, JSON.stringify(u));
  }
  function clearSession() {
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_USER);
    localStorage.removeItem(STORAGE_THREAD);
  }
  function currentUser() {
    try { return JSON.parse(localStorage.getItem(STORAGE_USER) || "null"); }
    catch { return null; }
  }
  function getThread() { return localStorage.getItem(STORAGE_THREAD) || null; }
  function setThread(id) { if (id) localStorage.setItem(STORAGE_THREAD, id); }

  async function api(path, opts) {
    opts = opts || {};
    const headers = Object.assign({}, opts.headers || {});
    if (!(opts.body instanceof FormData) && opts.body !== undefined) {
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
    }
    const t = token();
    if (t) headers.Authorization = "Bearer " + t;
    const res = await fetch(apiBase() + path, Object.assign({}, opts, { headers }));
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    if (!res.ok) {
      if (res.status === 401 && t) handleUnauthorized(path);
      const code = body && body.error && body.error.code ? body.error.code : "HTTP_" + res.status;
      const msg = body && body.error && body.error.message ? body.error.message : "HTTP " + res.status;
      const err = new Error(code + ": " + msg);
      err.code = code;
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return body;
  }

  async function devLogin(email) {
    const res = await api("/dev/login", { method: "POST", body: JSON.stringify({ email }) });
    setSession(res.token, res.user);
    return res;
  }

  function logout() { clearSession(); }

  // A stale token (rotated JWT_SECRET, expired 7-day TTL) makes every protected
  // call 401 while the cached user keeps the app out of the login overlay,
  // leaving a dead-end "Algo ha fallado" with a Reintentar that loops forever.
  // When a request that DID carry a token comes back 401, drop the session and
  // signal the shell so it falls back to LoginOverlay. /dev/login is exempt —
  // its 401 means "unknown email", not a dead token.
  function handleUnauthorized(path) {
    if (path === "/dev/login") return;
    clearSession();
    try { window.dispatchEvent(new CustomEvent("bonsai:unauthorized")); } catch (_) { /* ignore */ }
  }

  async function getRoute() { return api("/route"); }
  async function getProgress() { return api("/progress"); }
  async function getResources() { return api("/resources"); }
  async function openResource(id) {
    return api("/resources/" + encodeURIComponent(id) + "/open", { method: "POST" });
  }

  async function getThreads(perPage) {
    const qs = perPage ? "?perPage=" + encodeURIComponent(perPage) : "";
    return api("/threads" + qs);
  }

  // Clear the persisted thread id so the next /chat call starts a fresh
  // conversation. Used by the "Nueva conversación" button and right after
  // selecting a different thread from the history dropdown.
  function clearThread() {
    localStorage.removeItem(STORAGE_THREAD);
  }

  async function uploadPdf(file) {
    const fd = new FormData();
    fd.append("file", file);
    return api("/resources/pdf", { method: "POST", body: fd });
  }

  async function registerLearningExperience(payload) {
    return api("/resources/learning-experience", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // SSE consumer over POST. EventSource only supports GET; we hand-parse the
  // event stream so POST endpoints (/chat, /workflows/:id/run) work. Tolerates
  // partial chunks across reads. Shared by chat() and runWorkflow().
  async function consumeSSE(path, body, handlers) {
    handlers = handlers || {};
    const headers = { "Content-Type": "application/json" };
    const t = token();
    if (t) headers.Authorization = "Bearer " + t;

    let res;
    try {
      res = await fetch(apiBase() + path, {
        method: "POST",
        headers,
        body: JSON.stringify(body || {}),
        signal: handlers.signal,
      });
    } catch (e) {
      handlers.onError && handlers.onError(e);
      return;
    }
    if (!res.ok || !res.body) {
      if (res.status === 401 && t) handleUnauthorized(path);
      let detail = "";
      try { detail = await res.text(); } catch (_) { /* ignore */ }
      handlers.onError && handlers.onError(new Error("HTTP " + res.status + (detail ? ": " + detail : "")));
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    function flushFrame(frame) {
      if (!frame.trim()) return;
      let event = "message";
      let data = "";
      for (const line of frame.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data += (data ? "\n" : "") + line.slice(5).trim();
      }
      if (!data) return;
      let parsed;
      try { parsed = JSON.parse(data); } catch { parsed = { type: "text", delta: data }; }

      if (event === "done" || parsed.type === "done") {
        // Persist the main chat thread, but never let a role-play sub-thread
        // overwrite it (role-play tracks its own thread id in the UI).
        if (parsed.threadId && !handlers.noPersistThread) setThread(parsed.threadId);
        handlers.onDone && handlers.onDone(parsed);
      } else if (parsed.type === "tool-call") {
        handlers.onToolCall && handlers.onToolCall(parsed.toolName, parsed.toolCallId);
      } else if (parsed.type === "tool-result") {
        handlers.onToolResult && handlers.onToolResult(parsed.toolName, parsed.toolCallId);
      } else if (parsed.type === "resource-card") {
        handlers.onResourceCard && handlers.onResourceCard(parsed.resource);
      } else if (parsed.type === "text" && parsed.delta) {
        handlers.onDelta && handlers.onDelta(parsed.delta);
      } else if (parsed.type === "error") {
        handlers.onError && handlers.onError(new Error(parsed.message || "stream error"));
      }
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (buffer.trim()) flushFrame(buffer);
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf("\n\n")) >= 0) {
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        flushFrame(frame);
      }
    }
  }

  // Free-text chat with the Bonsai agent.
  function chat(message, threadId, handlers) {
    return consumeSSE("/chat", { message, threadId: threadId || undefined }, handlers);
  }

  // Run one of the button-backing Mastra workflows. `id` is the workflow id
  // (e.g. "weekly-goal", "team-at-risk"); `topic` is an optional free-text
  // hint. Streams the composed reply using the same handlers as chat().
  function runWorkflow(id, topic, handlers) {
    return consumeSSE("/workflows/" + encodeURIComponent(id) + "/run",
      topic ? { topic } : {}, handlers);
  }

  // One turn of a role-play practice. `config` is the scenario set up by the
  // role-play workflow (re-sent each turn so Bonsai stays in character).
  // `feedback: true` asks Bonsai to drop the role and coach instead.
  function roleplayChat(message, threadId, config, feedback, handlers) {
    return consumeSSE("/roleplay/chat", {
      message,
      threadId: threadId || undefined,
      roleplay: config,
      feedback: !!feedback,
    }, Object.assign({ noPersistThread: true }, handlers || {}));
  }

  window.BonsaiAPI = {
    apiBase,
    token,
    currentUser,
    getThread,
    setThread,
    clearThread,
    clearSession,
    devLogin,
    logout,
    getRoute,
    getProgress,
    getResources,
    getThreads,
    openResource,
    uploadPdf,
    registerLearningExperience,
    chat,
    runWorkflow,
    roleplayChat,
  };
})();
