/* bonsai-components.jsx — browser-runnable mirrors of the bonsai-ui .tsx
   components, using the globals.css class names. Reuses Icon + BonsaiMark from
   icons.jsx. Attached to window for the catalog app. */

const { useState: useStateBC, useMemo: useMemoBC } = React;
const BonsaiMark = window.BonsaiMark;
const Wordmark = window.BonsaiLogo;

/* ---------- primitives ---------- */
function Button({ variant = "default", size = "md", block, icon, className, children, ...rest }) {
  const v = { default: "", accent: "btn--accent", ghost: "btn--ghost", outline: "btn--outline" }[variant] || "";
  const cls = ["btn", v, size === "sm" ? "btn--sm" : size === "lg" ? "btn--lg" : "", block ? "btn--block" : "", icon ? "btn--icon" : "", className].filter(Boolean).join(" ");
  return <button className={cls} {...rest}>{children}</button>;
}

function Badge({ tone = "accent", className, children, ...rest }) {
  const t = { accent: "", sky: "badge--sky", neutral: "badge--neutral", success: "badge--success", warning: "badge--warning", danger: "badge--danger" }[tone] || "";
  return <span className={["badge", t, className].filter(Boolean).join(" ")} {...rest}>{children}</span>;
}

function Chip({ icon, active, className, children, ...rest }) {
  return <button className={["chip", active ? "chip--active" : "", className].filter(Boolean).join(" ")} aria-pressed={active} {...rest}>{icon}{children}</button>;
}

function Card({ pad, hover, className, children, ...rest }) {
  return <div className={["card", pad ? "card--pad" : "", hover ? "card--hover" : "", className].filter(Boolean).join(" ")} {...rest}>{children}</div>;
}

function Avatar({ initials, src, alt, size = "md", className, ...rest }) {
  const cls = ["avatar", size === "sm" ? "avatar--sm" : size === "lg" ? "avatar--lg" : "", className].filter(Boolean).join(" ");
  return <span className={cls} {...rest}>{src ? <img src={src} alt={alt || initials || ""} /> : initials}</span>;
}

function ProgressBar({ value, tone = "accent", thin, className, ...rest }) {
  const pct = Math.max(0, Math.min(100, value));
  const cls = ["progress", thin ? "progress--thin" : "", tone === "sky" ? "progress--sky" : tone === "success" ? "progress--success" : "", className].filter(Boolean).join(" ");
  return <div className={cls} role="progressbar" aria-valuenow={pct} {...rest}><span style={{ width: pct + "%" }} /></div>;
}

function TextField({ label, hint, error, className, id, ...rest }) {
  const autoId = useMemoBC(() => id || "f" + Math.random().toString(36).slice(2, 7), [id]);
  return (
    <div className={["field", error ? "field--error" : "", className].filter(Boolean).join(" ")}>
      {label && <label className="field-label" htmlFor={autoId}>{label}</label>}
      <input id={autoId} className="field-input" {...rest} />
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

/* ---------- learning ---------- */
const RES_META = {
  pdf: { icon: "file", label: "PDF" },
  ebook: { icon: "book", label: "eBook" },
  audio: { icon: "volume", label: "Audio" },
  video: { icon: "play", label: "Vídeo" },
  learning_experience: { icon: "layers", label: "LX", lx: true },
};
const COMPLETION_META = {
  consume: { icon: "book", label: "Lectura" },
  evaluation: { icon: "award", label: "Evaluación" },
  quiz: { icon: "lightbulb", label: "Quiz" },
};

function ResourceChip({ title, type, measure, onOpen }) {
  const meta = RES_META[type] || RES_META.pdf;
  return (
    <button className="rchip" onClick={onOpen} type="button">
      <span className={"rchip-ico" + (meta.lx ? " rchip-ico--lx" : "")}><Icon name={meta.icon} size={16} /></span>
      <span className="rchip-txt">
        <span className="rchip-t">{title}</span>
        <span className="rchip-m"><span className="tag">{meta.label}</span>{measure && <><span className="dot-sep" />{measure}</>}</span>
      </span>
      <span className="rchip-ext"><Icon name="external" size={16} /></span>
    </button>
  );
}

function StepCard({ order, title, objective, status, completion, resources = [], current, last, ctaLabel = "Continuar con Bonsai", onCta }) {
  const comp = COMPLETION_META[completion] || COMPLETION_META.consume;
  const stateClass = current ? "step--current" : status === "completed" ? "step--done" : status === "pending" ? "step--pending" : "";
  return (
    <div className={["step", stateClass].filter(Boolean).join(" ")}>
      <div className="step-rail">
        <span className={"step-dot step-dot--" + status}>
          {status === "completed" ? <Icon name="check" size={17} color="#06231a" /> : status === "in_progress" ? <Icon name="play" size={15} color="#fff" /> : order}
        </span>
        {!last && <span className="step-conn" />}
      </div>
      <div className="step-main">
        <div className="step-row1">
          <span className="step-title">{title}</span>
          <span className="step-badge"><Icon name={comp.icon} size={12} /> {comp.label}</span>
        </div>
        <div className="step-obj">{objective}</div>
        {resources.length > 0 && <div className="step-chips">{resources.map((r, i) => <ResourceChip key={i} {...r} />)}</div>}
        {current && <div className="step-cta"><button className="btn btn--accent btn--sm" onClick={onCta} type="button">{ctaLabel}</button></div>}
      </div>
    </div>
  );
}

function ProgressCard({ title, done, total, line }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const msg = line || (pct === 100 ? "¡Ruta completada! Has cerrado todos los pasos." : done === 0 ? "Empieza por el primer paso, no hay prisa." : `Vas bien, ${done} de ${total} pasos hechos. Sigue a tu ritmo.`);
  return (
    <div className="pcard">
      <div className="pcard-top"><span className="pcard-title">{title}</span><span className="pcard-pct">{pct}%</span></div>
      <ProgressBar className="pcard-bar" value={pct} />
      <div className="pcard-line">{msg}</div>
    </div>
  );
}

function RecommendationCard({ title, type, measure, onOpen }) {
  const meta = RES_META[type] || RES_META.pdf;
  return (
    <button className="rec" onClick={onOpen} type="button">
      <span className="rec-ico"><Icon name={meta.icon} size={19} /></span>
      <span className="rec-t">{title}</span>
      <span className="rec-m"><span>{meta.label}</span>{measure && <><span className="dot-sep" />{measure}</>}</span>
    </button>
  );
}

function BonsaiBar({ stepIndex, stepTitle, placeholder = "Pregúntale a Bonsai…", onOpen }) {
  return (
    <div className="sbar">
      <div className="sbar-recall"><span className="sbar-mark"><BonsaiMark size={14} /></span><span>Bonsai recuerda: vas por el paso <b>{stepIndex}</b> ({stepTitle}).</span></div>
      <button className="sbar-open" onClick={onOpen} type="button">
        <Icon name="message" size={18} color="var(--accent)" />
        <span className="sbar-txt">{placeholder}</span>
        <span className="sbar-send"><Icon name="send" size={17} color="#fff" /></span>
      </button>
    </div>
  );
}

function WorkflowButtons({ workflows, onPick }) {
  return (
    <div className="workflows">
      {workflows.map(w => <button key={w.key} className="wf" onClick={() => onPick && onPick(w.key)} type="button"><Icon name={w.icon} size={17} /><span>{w.label}</span></button>)}
    </div>
  );
}

/* ---------- dashboard ---------- */
function Panel({ title, actions, children, className }) {
  return (
    <div className={["panel", className].filter(Boolean).join(" ")}>
      {(title || actions) && <div className="panel-head">{typeof title === "string" ? <span className="panel-title">{title}</span> : title}{actions}</div>}
      {children}
    </div>
  );
}

function KPICard({ label, value, delta, trend = "up", accent = "var(--accent)", danger }) {
  return (
    <div className="kpi bui-rise">
      <span className="kpi-bar" style={{ background: accent }} />
      <div className="kpi-k">{label}</div>
      <div className="kpi-v" style={{ color: danger ? "var(--danger)" : "var(--fg)" }}>{value}</div>
      {delta && <div className="kpi-d" style={{ color: trend === "up" ? "var(--success)" : "var(--danger)" }}><Icon name={trend === "up" ? "trending" : "chevronDown"} size={13} /> {delta}</div>}
    </div>
  );
}

function RankedList({ items, showFlag = true }) {
  return (
    <div>
      {items.map((it, i) => (
        <div className="rank" key={i}>
          <span className="rank-n">{i + 1}</span>
          <div className="rank-main">
            <div className="rank-q">{it.question}</div>
            <div className="rank-meta">
              {it.topic && <span className="rank-topic">{it.topic}</span>}
              {showFlag && it.resolved !== undefined && (
                <span className={"rank-flag " + (it.resolved ? "rank-flag--ok" : "rank-flag--miss")}><Icon name={it.resolved ? "check" : "x"} size={11} /> {it.resolved ? "Resuelta por IA" : "Sin respuesta"}</span>
              )}
            </div>
          </div>
          <div className="rank-count"><div className="c">{it.count}</div>{it.trend && <div className="tr" style={{ color: it.trend.startsWith("-") ? "var(--danger)" : "var(--success)" }}>{it.trend}</div>}</div>
        </div>
      ))}
    </div>
  );
}

function TopicBars({ data, tone = "accent" }) {
  const max = Math.max(1, ...data.map(d => d.pct));
  return (
    <div>
      {data.map((d, i) => (
        <div className="tbar" key={i}>
          <div className="tbar-top"><span className="tbar-name">{d.topic}</span><span className="tbar-val">{d.count != null ? d.count + " · " : ""}{d.pct}%</span></div>
          <ProgressBar value={(d.pct / max) * 100} tone={tone} thin />
        </div>
      ))}
    </div>
  );
}

function GapRow({ topic, note, miss }) {
  return (
    <div className="gap">
      <span className="gap-ico"><Icon name="search" size={15} /></span>
      <div className="gap-main"><div className="gap-t">{topic}</div><div className="gap-n">{note}</div></div>
      <div className="gap-miss"><b>{miss}</b>sin resolver</div>
    </div>
  );
}

function DataTable({ columns, rows, onRowClick }) {
  return (
    <table className="dtable">
      <thead><tr>{columns.map((c, i) => <th key={i} style={{ width: c.width, textAlign: c.align || "left" }}>{c.header}</th>)}</tr></thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} onClick={onRowClick ? () => onRowClick(row, ri) : undefined} style={{ cursor: onRowClick ? "pointer" : undefined }}>
            {columns.map((c, ci) => <td key={ci} style={{ textAlign: c.align || "left" }}>{c.cell(row, ri)}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ---------- navigation ---------- */
function Rail({ items, active, onSelect, onLogo, footer }) {
  return (
    <nav className="rail">
      <button className="rail-logo" onClick={onLogo} title="Inicio" type="button"><BonsaiMark size={26} /></button>
      <div style={{ flex: "0 0 6px" }} />
      <div className="rail-group">
        {items.map(it => (
          <button key={it.id} className={"rail-btn" + (active === it.id ? " rail-btn--active" : "")} onClick={() => onSelect && onSelect(it.id)} type="button">
            <Icon name={it.icon} size={21} /><span className="rail-tip">{it.label}</span>
          </button>
        ))}
      </div>
      <div className="rail-spacer" />
      {footer}
    </nav>
  );
}

function RoleSwitcher({ options, value, onChange }) {
  return (
    <div className="seg" role="tablist">
      {options.map(o => (
        <button key={o.value} role="tab" aria-selected={value === o.value} className={"seg-btn" + (value === o.value ? " seg-btn--active" : "")} onClick={() => onChange && onChange(o.value)} type="button">
          {o.icon && <Icon name={o.icon} size={15} />}{o.label}
        </button>
      ))}
    </div>
  );
}

Object.assign(window, {
  Button, Badge, Chip, Card, Avatar, ProgressBar, TextField,
  BonsaiMark, Wordmark,
  ResourceChip, StepCard, ProgressCard, RecommendationCard, BonsaiBar, WorkflowButtons,
  Panel, KPICard, RankedList, TopicBars, GapRow, DataTable,
  Rail, RoleSwitcher,
});
