/* widgets.jsx — interactive inline chat widgets (flashcard, quiz, audio, pdf, newsletter) */
const { useState, useRef, useEffect } = React;

/* Recommended-lessons list (weekly goal) */
function LessonListW({ lessons, onStart }) {
  return (
    <div className="w">
      <div className="w-head">
        <span className="w-ico"><Icon name="route" size={16} /></span>
        <div style={{ flex: 1 }}>
          <div className="wk">Plan de la semana</div>
          <div className="wt">3 lecciones para tu objetivo</div>
        </div>
      </div>
      {lessons.map((l, i) => (
        <div className="lesson-row" key={l.id}>
          <span className="lesson-num">{i + 1}</span>
          <div className="lesson-main">
            <div className="lesson-t">{l.title}</div>
            <div className="lesson-meta">
              <span>{l.kind}</span><span className="dot-sep" /><span>{l.dur}</span>
              {l.progress > 0 && (<><span className="dot-sep" /><span style={{ color: "var(--accent)" }}>{l.progress}%</span></>)}
            </div>
          </div>
          <button className="btn btn-sm" onClick={() => onStart && onStart(l)}>
            {l.progress > 0 ? "Continuar" : "Empezar"}
          </button>
        </div>
      ))}
    </div>
  );
}

/* Flashcard — click to flip, cycle through deck */
function FlashcardW({ cards }) {
  const [i, setI] = useState(0);
  const [show, setShow] = useState(false);
  const c = cards[i];
  return (
    <div className="w">
      <div className="w-head">
        <span className="w-ico" style={{ background: "var(--tan-tint)", color: "var(--tan)" }}><Icon name="layers" size={16} /></span>
        <div style={{ flex: 1 }}><div className="wk">Repaso exprés</div><div className="wt">Flashcards · Feedback</div></div>
      </div>
      <div className="flash">
        <div className="flash-card" onClick={() => setShow(s => !s)}>
          <div className="flash-tag">{show ? "Respuesta" : "Pregunta"}</div>
          {show ? <div className="flash-a">{c.a}</div> : <div className="flash-q">{c.q}</div>}
          <div className="flash-hint"><Icon name="refresh" size={13} /> {show ? "Toca para volver" : "Toca para revelar"}</div>
        </div>
        <div className="flash-foot">
          <div className="flash-dots">{cards.map((_, k) => <i key={k} className={k === i ? "on" : ""} />)}</div>
          <button className="btn btn-sm" onClick={() => { setShow(false); setI((i + 1) % cards.length); }}>
            Siguiente <Icon name="arrowRight" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* Quiz / autoevaluación */
function QuizW({ quiz }) {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = quiz.questions[step];

  if (done) {
    const total = quiz.questions.length;
    const pct = Math.round((score / total) * 100);
    return (
      <div className="w">
        <div className="w-head"><span className="w-ico"><Icon name="award" size={16} /></span><div><div className="wk">Resultado</div><div className="wt">{quiz.title}</div></div></div>
        <div className="quiz"><div className="quiz-done">
          <div className="quiz-score" style={{ color: pct >= 67 ? "var(--success)" : "var(--accent)" }}>{score}/{total}</div>
          <p style={{ color: "var(--fg-2)", fontSize: 14, marginTop: 6 }}>
            {pct >= 67 ? "¡Bien! Dominas lo esencial del feedback." : "Vas por buen camino. Te recomiendo repasar la lección 3."}
          </p>
          <button className="btn btn-sm" style={{ marginTop: 14 }} onClick={() => { setStep(0); setPicked(null); setScore(0); setDone(false); }}>
            <Icon name="refresh" size={14} /> Repetir
          </button>
        </div></div>
      </div>
    );
  }

  const pick = (idx) => {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === q.correct) setScore(s => s + 1);
  };
  const next = () => {
    if (step + 1 >= quiz.questions.length) setDone(true);
    else { setStep(step + 1); setPicked(null); }
  };

  return (
    <div className="w">
      <div className="w-head"><span className="w-ico"><Icon name="award" size={16} /></span><div style={{ flex: 1 }}><div className="wk">Autoevaluación</div><div className="wt">{quiz.title}</div></div></div>
      <div className="quiz">
        <div className="quiz-prog">PREGUNTA {step + 1} DE {quiz.questions.length}</div>
        <div className="quiz-q">{q.q}</div>
        <div className="quiz-opts">
          {q.options.map((o, idx) => {
            let cls = "quiz-opt";
            if (picked !== null && idx === q.correct) cls += " correct";
            else if (picked === idx) cls += " wrong";
            return (
              <button key={idx} className={cls} disabled={picked !== null} onClick={() => pick(idx)}>
                <span className="qk">{String.fromCharCode(65 + idx)}</span>{o}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <>
            <div className="quiz-explain"><b>{picked === q.correct ? "Correcto. " : "Casi. "}</b>{q.explain}</div>
            <button className="btn btn-accent btn-sm" style={{ marginTop: 12 }} onClick={next}>
              {step + 1 >= quiz.questions.length ? "Ver resultado" : "Siguiente pregunta"} <Icon name="arrowRight" size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* Audio player (simulated) */
function AudioW({ seconds = 47, label = "Resumen en audio" }) {
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const ref = useRef(null);
  const BARS = 38;
  useEffect(() => {
    if (playing) {
      ref.current = setInterval(() => setT(x => { if (x + 0.25 >= seconds) { clearInterval(ref.current); setPlaying(false); return seconds; } return x + 0.25; }), 250);
    }
    return () => clearInterval(ref.current);
  }, [playing, seconds]);
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const prog = t / seconds;
  return (
    <div className="w">
      <div className="audio">
        <button className="audio-play" onClick={() => { if (t >= seconds) setT(0); setPlaying(p => !p); }}>
          <Icon name={playing ? "pause" : "play"} size={18} />
        </button>
        <div className="audio-main">
          <div className="audio-wave">
            {Array.from({ length: BARS }).map((_, i) => {
              const h = 26 + 70 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6));
              return <i key={i} className={i / BARS <= prog ? "on" : ""} style={{ height: `${h}%` }} />;
            })}
          </div>
          <div className="audio-time"><span style={{ color: "var(--fg-2)" }}>{label}</span><span>{fmt(t)} / {fmt(seconds)}</span></div>
        </div>
      </div>
    </div>
  );
}

/* PDF read (RAG) chip */
function PdfW({ doc, answer }) {
  return (
    <div className="w">
      <div className="pdf-chip">
        <span className="pdf-ico"><Icon name="file" size={20} /></span>
        <div className="pdf-info"><div className="pdf-name">{doc.name}</div><div className="pdf-meta">{doc.pages} págs · {doc.size} · Indexado</div></div>
        <span className="badge success"><Icon name="check" size={12} /> Leído</span>
      </div>
    </div>
  );
}

/* Newsletter / weekly recap */
function NewsletterW({ data }) {
  return (
    <div className="w">
      <div className="w-head"><span className="w-ico"><Icon name="mail" size={16} /></span><div style={{ flex: 1 }}><div className="wk">Tu semana en Bonsai</div><div className="wt">{data.period}</div></div></div>
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--line)" }}>
        <div style={{ flex: 1, padding: "14px 16px", borderRight: "1px solid var(--line)" }}>
          <div className="num" style={{ fontSize: 22, fontWeight: 600 }}>{data.hours}</div>
          <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 2 }}>aprendidas</div>
        </div>
        <div style={{ flex: 1, padding: "14px 16px" }}>
          <div className="num" style={{ fontSize: 22, fontWeight: 600, color: "var(--accent)" }}>{data.completed}</div>
          <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 2 }}>lecciones completadas</div>
        </div>
      </div>
      <div style={{ padding: "13px 16px", fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.5, borderBottom: "1px solid var(--line)" }}>{data.highlight}</div>
      {data.items.map((it, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 16px", borderBottom: i < data.items.length - 1 ? "1px solid var(--line)" : "none" }}>
          <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--accent)", flex: "0 0 auto" }} />
          <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>{it.t}</div><div style={{ fontSize: 11.5, color: "var(--fg-3)" }}>{it.d}</div></div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { LessonListW, FlashcardW, QuizW, AudioW, PdfW, NewsletterW });
