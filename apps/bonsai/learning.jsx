/* learning.jsx — "Mi aprendizaje" learner view.
   MiAprendizaje + StepCard, ResourceChip, ProgressCard, RecommendationCard, BonsaiBar.
   useLearningView() simula las llamadas del DOC 06 con los mocks de data.jsx. */

const { useState: useStateL, useEffect: useEffectL, useMemo: useMemoL, useCallback: useCbL } = React;

/* ---- type / completion maps ---- */
const RES_META = {
  pdf:                 { icon: "file",   label: "PDF" },
  ebook:               { icon: "book",   label: "eBook" },
  audio:               { icon: "volume", label: "Audio" },
  video:               { icon: "play",   label: "Vídeo" },
  learning_experience: { icon: "layers", label: "LX", lx: true },
};
const COMPLETION_META = {
  consume:    { icon: "book",      label: "Lectura" },
  evaluation: { icon: "award",     label: "Evaluación" },
  quiz:       { icon: "lightbulb", label: "Quiz" },
};

function resMeasure(r) {
  const m = r.metadata || {};
  if (m.durationSec != null) return Math.round(m.durationSec / 60) + " min";
  if (m.pages != null) return m.pages + " págs.";
  return m.level || "";
}

/* ============================ data hook ============================ */
/* Cruza route.steps con progress; consume recursos al abrirlos.
   En local no hay backend: resuelve los mocks tras un pequeño delay y
   cae a fixture si una "llamada" falla. */
function useLearningView() {
  const [route, setRoute] = useStateL(null);
  const [progress, setProgress] = useStateL([]);
  const [resources, setResources] = useStateL({});
  const [recommendations, setRecommendations] = useStateL([]);
  const [loading, setLoading] = useStateL(true);
  const [error, setError] = useStateL(null);
  const [tick, setTick] = useStateL(0);

  // Real backend wiring. The learner role doesn't have GET /resources (manager
  // only), so we hydrate `resources` from the route's resourceIds via
  // present-resource indirectly: we keep a tiny in-memory cache populated as
  // chips render. For the route's step-resource chips we only need title +
  // type for now, both of which are not in /route — we derive them by hitting
  // /resources/:id/open silently? No — that mutates state. Instead, the
  // backend's /route currently only returns ids; we'll need title/type, so
  // we accept that learner-side resources have only `{id, title?, type?}`
  // limited fields. The recommend tool returns full DTOs at chat time.
  //
  // Concretely: route comes from /route, progress from /progress; resources
  // are seeded with placeholders keyed by id; the chips render type icons
  // generically. When the learner clicks a resource we POST /open and (if a
  // step gets completed) refetch progress.

  useEffectL(() => {
    let alive = true;
    setLoading(true); setError(null);

    (async () => {
      try {
        const [routeRes, progressRes] = await Promise.all([
          window.BonsaiAPI.getRoute(),
          window.BonsaiAPI.getProgress(),
        ]);
        if (!alive) return;
        const r = routeRes.route;
        setRoute(r);
        setProgress(progressRes.progress || []);

        // Build a {id: {id, title, type}} map from the seed RESOURCE_META by
        // id, falling back to a generic chip. Real resource details come on
        // open / via recommend-resources from the chat.
        const map = {};
        for (const s of r.steps) {
          for (const id of s.resourceIds) {
            map[id] = (window.RESOURCE_META && window.RESOURCE_META[id]) || {
              id,
              title: id,
              type: "pdf",
              source: {},
              metadata: {},
            };
          }
        }
        setResources(map);

        // Recommendations stay empty until the chat surfaces them via the
        // recommend-resources tool. The prototype's RecommendationCard
        // tolerates an empty list, so this is fine.
        setRecommendations([]);
        setLoading(false);
      } catch (e) {
        if (!alive) return;
        setError(e.code === "NOT_FOUND"
          ? "Aún no hay ruta configurada para tu organización."
          : (e.message || "No hemos podido cargar tu ruta."));
        setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [tick]);

  // POST /resources/:id/open → real backend. If it auto-completes a step,
  // refresh /progress so the UI reflects it.
  const openResource = useCbL(async (id, stepId) => {
    const local = (window.RESOURCE_META || {})[id] || resources[id];
    if (local && local.source && local.source.url) {
      window.open(local.source.url, "_blank", "noopener");
    }
    try {
      const res = await window.BonsaiAPI.openResource(id);
      if (res && res.completedStep) {
        const p = await window.BonsaiAPI.getProgress();
        setProgress(p.progress || []);
      }
    } catch (e) {
      console.warn("openResource failed:", e.message);
    }
  }, [resources]);

  const retry = useCbL(() => setTick(x => x + 1), []);

  // Live sync: when the chat completes a route step (chat.jsx dispatches a
  // window event on /chat's `event: done`), refetch /progress so the step
  // list reflects the closure without a manual reload.
  useEffectL(() => {
    async function refreshProgress() {
      try {
        const p = await window.BonsaiAPI.getProgress();
        setProgress(p.progress || []);
      } catch (e) {
        console.warn("live progress refresh failed:", e.message);
      }
    }
    window.addEventListener("bonsai:step-completed", refreshProgress);
    return () => window.removeEventListener("bonsai:step-completed", refreshProgress);
  }, []);

  return { route, progress, resources, recommendations, loading, error, openResource, retry };
}

/* ============================ subcomponents ============================ */
function ResourceChip({ res, onOpen }) {
  const meta = RES_META[res.type] || RES_META.pdf;
  return (
    <button className="chip" onClick={onOpen} title={res.metadata && res.metadata.description}>
      <span className={"chip-ico" + (meta.lx ? " lx" : "")}><Icon name={meta.icon} size={16} /></span>
      <span className="chip-txt">
        <span className="chip-t">{res.title}</span>
        <span className="chip-m"><span className="tag">{meta.label}</span>{resMeasure(res) && <><span className="dot-sep" />{resMeasure(res)}</>}</span>
      </span>
      <span className="chip-ext"><Icon name="external" size={16} /></span>
    </button>
  );
}

function StepCard({ step, status, resources, isCurrent, isLast, onOpenResource, onOpenChat }) {
  const comp = COMPLETION_META[step.completion.type] || COMPLETION_META.consume;
  const dot = status === "completed"
    ? <Icon name="check" size={17} color="#06231a" />
    : status === "in_progress"
    ? <Icon name="play" size={15} color="#fff" />
    : step.order;
  return (
    <div className={"step is-" + (isCurrent ? "current" : status === "completed" ? "done" : status)}>
      <div className="step-rail">
        <span className={"step-dot " + status}>{dot}</span>
        {!isLast && <span className="step-conn" />}
      </div>
      <div className="step-main">
        <div className="step-row1">
          <span className="step-title">{step.title}</span>
          <span className="step-badge"><Icon name={comp.icon} size={12} /> {comp.label}</span>
        </div>
        <div className="step-obj">{step.objective}</div>
        <div className="chips">
          {step.resourceIds.map(id => resources[id] && (
            <ResourceChip key={id} res={resources[id]} onOpen={() => onOpenResource(id, step.id)} />
          ))}
        </div>
        {isCurrent && (
          <div className="step-cta">
            <button className="btn btn-accent btn-sm" onClick={onOpenChat}>
              <BonsaiMark size={15} /> Continuar con Bonsai
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressCard({ title, done, total }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const line = pct === 100
    ? "¡Ruta completada! Has cerrado todos los pasos."
    : done === 0
    ? "Empieza por el primer paso, no hay prisa."
    : `Vas bien, ${done} de ${total} pasos hechos. Sigue a tu ritmo.`;
  return (
    <div className="prog-card">
      <div className="prog-top">
        <span className="prog-title">{title}</span>
        <span className="prog-pct">{pct}%</span>
      </div>
      <div className="prog-bar"><span style={{ width: pct + "%" }} /></div>
      <div className="prog-line">{line}</div>
    </div>
  );
}

function RecommendationCard({ res, onOpen }) {
  const meta = RES_META[res.type] || RES_META.pdf;
  return (
    <button className="rec" onClick={onOpen} title={res.metadata && res.metadata.description}>
      <span className="rec-ico"><Icon name={meta.icon} size={19} /></span>
      <span className="rec-t">{res.title}</span>
      <span className="rec-m"><span>{meta.label}</span>{resMeasure(res) && <><span className="dot-sep" />{resMeasure(res)}</>}</span>
    </button>
  );
}

function BonsaiBar({ stepIndex, stepTitle, onOpenChat }) {
  return (
    <div className="bonsai-bar">
      <div className="bonsai-bar-inner">
        <div className="bonsai-recall">
          <span className="sb-mark"><BonsaiMark size={14} /></span>
          <span>Bonsai recuerda: vas por el paso <b>{stepIndex}</b> ({stepTitle}).</span>
        </div>
        <button className="bonsai-open" onClick={onOpenChat}>
          <Icon name="message" size={18} color="var(--accent)" />
          <span className="so-txt">Pregúntale a Bonsai…</span>
          <span className="so-send"><Icon name="send" size={17} color="#fff" /></span>
        </button>
      </div>
    </div>
  );
}

/* ============================ skeletons ============================ */
function LearnSkeleton() {
  return (
    <div className="learn-inner" aria-busy="true">
      <div className="learn-head">
        <div className="sk" style={{ width: 46, height: 46, borderRadius: "50%" }} />
        <div style={{ flex: 1 }}>
          <div className="sk" style={{ width: 180, height: 20 }} />
          <div className="sk" style={{ width: 130, height: 12, marginTop: 8 }} />
        </div>
      </div>
      <div className="sk" style={{ height: 96, borderRadius: 16 }} />
      {[0, 1, 2].map(i => <div key={i} className="sk" style={{ height: 120, borderRadius: 16 }} />)}
    </div>
  );
}

/* ============================ main ============================ */
function MiAprendizaje({ onOpenChat }) {
  const { route, progress, resources, recommendations, loading, error, openResource, retry } = useLearningView();
  const onChat = onOpenChat || (() => {});

  const steps = useMemoL(() => {
    if (!route) return [];
    const byStep = Object.fromEntries((progress || []).map(p => [p.stepId, p.status]));
    return route.steps
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(s => ({ step: s, status: byStep[s.id] || "pending" }));
  }, [route, progress]);

  const done = steps.filter(s => s.status === "completed").length;
  const total = steps.length;
  const currentIdx = steps.findIndex(s => s.status !== "completed"); // primer no completado
  const current = currentIdx >= 0 ? steps[currentIdx] : null;

  if (loading) {
    return <div className="learn"><div className="learn-scroll"><LearnSkeleton /></div></div>;
  }
  if (error) {
    return (
      <div className="learn"><div className="learn-scroll"><div className="learn-error">
        <div className="le-t">Algo ha fallado</div>
        <div>{error}</div>
        <button className="btn btn-accent btn-sm" onClick={retry}><Icon name="refresh" size={15} /> Reintentar</button>
      </div></div></div>
    );
  }

  return (
    <div className="learn">
      <div className="learn-scroll">
        <div className="learn-inner">
          {/* 1 · header */}
          <div className="learn-head">
            <span className="learn-ava">{USER.initials}</span>
            <div>
              <div className="learn-hi">Hola, {USER.name}</div>
              <div className="learn-sub">{USER.role} · {USER.company}</div>
            </div>
            <div className="learn-count">
              <div className="v">{done} / {total}</div>
              <div className="l">pasos</div>
            </div>
          </div>

          {/* 2 · progress */}
          <ProgressCard title={route.title} done={done} total={total} />

          {/* 3 · steps */}
          <div className="learn-seclabel"><span className="kicker">Tu ruta</span></div>
          <div className="steps">
            {steps.map(({ step, status }, i) => (
              <StepCard key={step.id} step={step} status={status} resources={resources}
                isCurrent={current && step.id === current.step.id}
                isLast={i === steps.length - 1}
                onOpenResource={openResource} onOpenChat={onChat} />
            ))}
          </div>

          {/* 4 · recommendations */}
          {recommendations.length > 0 && (
            <>
              <div className="learn-seclabel">
                <span className="kicker">Recomendado para ti</span>
                <span className="biblio"><Icon name="book" size={12} /> the Library</span>
              </div>
              <div className="recs">
                {recommendations.map(id => resources[id] && (
                  <RecommendationCard key={id} res={resources[id]} onOpen={() => openResource(id)} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 5 · bonsai bar */}
      <BonsaiBar
        stepIndex={current ? current.step.order : total}
        stepTitle={current ? current.step.title : "ruta completada"}
        onOpenChat={onChat} />
    </div>
  );
}

Object.assign(window, { MiAprendizaje });
