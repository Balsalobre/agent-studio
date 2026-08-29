/* catalog-registry.jsx — the component registry that drives the catalog.
   Each entry: { id, name, group, desc, demos: [{ label, render, code }] }. */

const wf3 = [
  { key: "goal", label: "Mi objetivo semanal", icon: "target" },
  { key: "fivemin", label: "Repaso en 5 min", icon: "clock" },
  { key: "news", label: "Mi newsletter", icon: "mail" },
];
const rankItems = [
  { question: "¿Cuál es el límite de dietas sin justificante?", count: 142, trend: "+18%", topic: "Gastos y viajes", resolved: true },
  { question: "¿Cómo doy feedback a alguien de mi equipo?", count: 128, trend: "+9%", topic: "Liderazgo", resolved: true },
  { question: "¿Cuál es la política de teletrabajo en 2026?", count: 63, trend: "+31%", topic: "RRHH", resolved: false },
];
const topicData = [
  { topic: "Gastos y viajes", pct: 27, count: 940 },
  { topic: "Liderazgo y feedback", pct: 23, count: 800 },
  { topic: "RRHH y permisos", pct: 18, count: 626 },
  { topic: "Herramientas", pct: 14, count: 487 },
];
const tableRows = [
  { name: "Marta Ríos", role: "Producto", pct: 33 },
  { name: "Luis Pardo", role: "Ventas", pct: 80 },
  { name: "Ana Coll", role: "Soporte", pct: 100 },
];

const CATALOG = [
  {
    group: "Fundamentos",
    items: [
      {
        id: "colors", name: "Colores", desc: "Paleta de acento, cielo y estados. Todo deriva de variables CSS y se re-tona con --accent.",
        demos: [{ label: "Tokens de color", render: () => <SwatchGrid />, code: "/* globals.css */\n--accent: #2F6CFF;\n--sky:    #7FA8FF;\n--success:#5BD8A0;\n--warning:#EFC88B;\n--danger: #F0654E;" }],
      },
      {
        id: "type", name: "Tipografía", desc: "Space Grotesk para display/marca y números; Hanken Grotesk para UI y cuerpo.",
        demos: [{ label: "Escala", render: () => <TypeScale />, code: "<span className=\"bui-display\">Display</span>\n<span className=\"bui-kicker\">Kicker</span>" }],
      },
      {
        id: "icons", name: "Iconos", desc: "Set de iconos de línea 24×24 (trazo 1.6px). Heredan currentColor.",
        demos: [{ label: "Galería", render: () => <IconGallery />, code: "import { Icon } from \"@/bonsai-ui/components\";\n\n<Icon name=\"target\" size={20} />" }],
      },
    ],
  },
  {
    group: "Primitivas",
    items: [
      {
        id: "button", name: "Button", desc: "Acción principal. Variantes accent / default / outline / ghost, tamaños sm/md/lg, iconos y bloque.",
        demos: [
          { label: "Variantes", render: () => <Row><Button variant="accent">Accent</Button><Button>Default</Button><Button variant="outline">Outline</Button><Button variant="ghost">Ghost</Button></Row>,
            code: '<Button variant="accent">Accent</Button>\n<Button>Default</Button>\n<Button variant="outline">Outline</Button>\n<Button variant="ghost">Ghost</Button>' },
          { label: "Tamaños", render: () => <Row><Button size="sm" variant="accent">Small</Button><Button size="md" variant="accent">Medium</Button><Button size="lg" variant="accent">Large</Button></Row>,
            code: '<Button size="sm" variant="accent">Small</Button>\n<Button size="lg" variant="accent">Large</Button>' },
          { label: "Con icono", render: () => <Row><Button variant="accent"><Icon name="download" size={15} /> Exportar</Button><Button icon aria-label="ajustes"><Icon name="settings" size={18} /></Button></Row>,
            code: '<Button variant="accent"><Icon name="download" size={15} /> Exportar</Button>\n<Button icon aria-label="ajustes"><Icon name="settings" size={18} /></Button>' },
        ],
      },
      {
        id: "badge", name: "Badge", desc: "Etiqueta compacta de estado o categoría. 6 tonos.",
        demos: [{ label: "Tonos", render: () => <Row><Badge>Accent</Badge><Badge tone="sky">Sky</Badge><Badge tone="success">Resuelta</Badge><Badge tone="warning">Acción</Badge><Badge tone="danger">Sin respuesta</Badge><Badge tone="neutral">Borrador</Badge></Row>,
          code: '<Badge tone="success">Resuelta</Badge>\n<Badge tone="warning">Acción</Badge>\n<Badge tone="danger">Sin respuesta</Badge>' }],
      },
      {
        id: "chip", name: "Chip", desc: "Píldora de acción rápida o filtro, con estado activo.",
        demos: [{ label: "Por defecto + activo", render: () => <Row><Chip icon={<Icon name="target" size={14} />}>Objetivo</Chip><Chip icon={<Icon name="clock" size={14} />} active>Activo</Chip><Chip>Sin icono</Chip></Row>,
          code: '<Chip icon={<Icon name="target" size={14} />}>Objetivo</Chip>\n<Chip active>Activo</Chip>' }],
      },
      {
        id: "card", name: "Card", desc: "Contenedor de superficie. Opciones de padding y hover.",
        demos: [{ label: "Padding / hover", render: () => <Row><Card pad style={{ width: 200 }}><b style={{ fontFamily: "var(--font-display)" }}>Card</b><div style={{ color: "var(--fg-3)", fontSize: 13, marginTop: 4 }}>Superficie base con borde.</div></Card><Card pad hover style={{ width: 200 }}><b style={{ fontFamily: "var(--font-display)" }}>Hover</b><div style={{ color: "var(--fg-3)", fontSize: 13, marginTop: 4 }}>Pasa el ratón.</div></Card></Row>,
          code: '<Card pad>…</Card>\n<Card pad hover>…</Card>' }],
      },
      {
        id: "avatar", name: "Avatar", desc: "Marca de usuario con degradado azul e iniciales. 3 tamaños.",
        demos: [{ label: "Tamaños", render: () => <Row style={{ alignItems: "center" }}><Avatar initials="MR" size="sm" /><Avatar initials="MR" /><Avatar initials="MR" size="lg" /></Row>,
          code: '<Avatar initials="MR" size="sm" />\n<Avatar initials="MR" />\n<Avatar initials="MR" size="lg" />' }],
      },
      {
        id: "progress", name: "ProgressBar", desc: "Medidor horizontal de avance. Tonos accent / sky / success.",
        demos: [{ label: "Tonos", render: () => <Stack style={{ width: 320 }}><ProgressBar value={33} /><ProgressBar value={60} tone="sky" /><ProgressBar value={100} tone="success" thin /></Stack>,
          code: '<ProgressBar value={33} />\n<ProgressBar value={60} tone="sky" />\n<ProgressBar value={100} tone="success" thin />' }],
      },
      {
        id: "textfield", name: "TextField", desc: "Input con etiqueta, ayuda y estado de error.",
        demos: [{ label: "Estados", render: () => <Stack style={{ width: 320 }}><TextField label="Nombre" placeholder="Marta Ríos" /><TextField label="Email" defaultValue="marta@" hint="Formato no válido" error /></Stack>,
          code: '<TextField label="Nombre" placeholder="Marta Ríos" />\n<TextField label="Email" hint="Formato no válido" error />' }],
      },
    ],
  },
  {
    group: "Marca",
    items: [
      {
        id: "mark", name: "BonsaiMark", desc: "Símbolo de marca: bonsái multi-copa con raíces extendidas, en azules tonales y tronco blanco.",
        demos: [{ label: "Tamaños", render: () => <Row style={{ alignItems: "flex-end" }}><BonsaiMark size={28} /><BonsaiMark size={56} /><BonsaiMark size={96} /></Row>,
          code: '<BonsaiMark size={56} />' }],
      },
      {
        id: "wordmark", name: "Wordmark", desc: 'Lockup completo: símbolo + “Bonsai” (con “ai” en acento) + “by Agent Studio”.',
        demos: [
          { label: "Completo", render: () => <Wordmark height={28} />, code: '<Wordmark height={28} />' },
          { label: "Sin tagline / sin símbolo", render: () => <Row style={{ alignItems: "center" }}><Wordmark height={22} hideTagline /><Wordmark height={22} hideMark /></Row>, code: '<Wordmark height={22} hideTagline />\n<Wordmark height={22} hideMark />' },
        ],
      },
    ],
  },
  {
    group: "Aprendizaje",
    items: [
      {
        id: "workflow", name: "WorkflowButtons", desc: "Los tres workflows principales bajo el composer del chat.",
        demos: [{ label: "Tres workflows", render: () => <WorkflowButtons workflows={wf3} />, code: 'const workflows = [\n  { key: "goal", label: "Mi objetivo semanal", icon: "target" },\n  { key: "fivemin", label: "Repaso en 5 min", icon: "clock" },\n  { key: "news", label: "Mi newsletter", icon: "mail" },\n];\n<WorkflowButtons workflows={workflows} onPick={run} />' }],
      },
      {
        id: "resourcechip", name: "ResourceChip", desc: "Fila de recurso: icono por tipo, título, tipo y medida.",
        demos: [{ label: "Tipos", render: () => <Stack style={{ width: 360 }}><ResourceChip title="Manual de marca Northwind" type="pdf" measure="24 págs." /><ResourceChip title="La conversación difícil" type="video" measure="11 min" /><ResourceChip title="Liderazgo de equipos" type="learning_experience" measure="Intermedio" /></Stack>,
          code: '<ResourceChip title="Manual de marca" type="pdf" measure="24 págs." />\n<ResourceChip title="Liderazgo" type="learning_experience" />' }],
      },
      {
        id: "stepcard", name: "StepCard", desc: "Paso de una ruta: estado, objetivo, recursos y CTA del paso actual.",
        demos: [{ label: "Estados", render: () => <Stack style={{ width: 460 }}>
          <StepCard order={1} title="Cultura y valores" objective="Conoce cómo trabajamos." status="completed" completion="consume" />
          <StepCard order={2} title="Comunicación efectiva" objective="Da feedback que mueve a la acción." status="in_progress" completion="quiz" current resources={[{ title: "El modelo SBI", type: "pdf", measure: "8 págs." }]} />
          <StepCard order={3} title="Escucha activa" objective="Escuchar para entender." status="pending" completion="consume" last />
        </Stack>,
          code: '<StepCard order={2} title="Comunicación efectiva"\n  objective="Da feedback que mueve a la acción."\n  status="in_progress" completion="quiz" current\n  resources={[{ title: "El modelo SBI", type: "pdf", measure: "8 págs." }]}\n  onCta={openChat} />' }],
      },
      {
        id: "progresscard", name: "ProgressCard", desc: "Cabecera de ruta con porcentaje, barra y frase de ánimo.",
        demos: [{ label: "Por defecto", render: () => <div style={{ width: 460 }}><ProgressCard title="Onboarding · Liderazgo de equipos" done={2} total={6} /></div>,
          code: '<ProgressCard title="Onboarding · Liderazgo" done={2} total={6} />' }],
      },
      {
        id: "reccard", name: "RecommendationCard", desc: "Recurso recomendado de la the Library (tarjeta vertical).",
        demos: [{ label: "Rejilla", render: () => <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, width: 520 }}><RecommendationCard title="Conversaciones cruciales" type="audio" measure="312 min" /><RecommendationCard title="Radical Candor" type="ebook" measure="248 págs." /><RecommendationCard title="Dar feedback sin herir" type="video" measure="14 min" /></div>,
          code: '<RecommendationCard title="Radical Candor" type="ebook" measure="248 págs." />' }],
      },
      {
        id: "bonsaibar", name: "BonsaiBar", desc: "Pie persistente para preguntar al asistente, con recordatorio de memoria.",
        demos: [{ label: "Por defecto", render: () => <div style={{ width: 460 }}><BonsaiBar stepIndex={3} stepTitle="Tu primera conversación" /></div>,
          code: '<BonsaiBar stepIndex={3} stepTitle="Tu primera conversación" onOpen={openChat} />' }],
      },
    ],
  },
  {
    group: "Dashboard",
    items: [
      {
        id: "kpi", name: "KPICard", desc: "Métrica destacada con barra de acento y delta de tendencia.",
        demos: [{ label: "Rejilla", render: () => <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, width: 560 }}>
          <KPICard label="Preguntas este mes" value="3.482" delta="+12% vs. mes anterior" trend="up" />
          <KPICard label="Resueltas por la IA" value="86%" delta="+4 pts" trend="up" accent="var(--success)" />
          <KPICard label="Sin respuesta clara" value="6%" delta="-2 pts" trend="up" accent="var(--danger)" danger />
        </div>,
          code: '<KPICard label="Preguntas este mes" value="3.482" delta="+12%" trend="up" />\n<KPICard label="Sin respuesta" value="6%" accent="var(--danger)" danger />' }],
      },
      {
        id: "panel", name: "Panel", desc: "Contenedor con título y acciones. Compón listas y tablas dentro.",
        demos: [{ label: "Con RankedList", render: () => <div style={{ width: 560 }}><Panel title={<span className="panel-title"><Icon name="message" size={17} color="var(--accent)" /> Lo más preguntado</span>} actions={<Button size="sm" variant="ghost"><Icon name="filter" size={14} /> Tema</Button>}><RankedList items={rankItems} /></Panel></div>,
          code: '<Panel title="Lo más preguntado" actions={<Button size="sm" variant="ghost">Tema</Button>}>\n  <RankedList items={items} />\n</Panel>' }],
      },
      {
        id: "ranked", name: "RankedList", desc: "Lista ordenada de preguntas con volumen, tendencia y resolución.",
        demos: [{ label: "Por defecto", render: () => <Card style={{ width: 560 }}><RankedList items={rankItems} /></Card>,
          code: '<RankedList items={items} />' }],
      },
      {
        id: "topicbars", name: "TopicBars", desc: "Barras de reparto de volumen (normalizadas al mayor).",
        demos: [{ label: "Por defecto", render: () => <Card pad style={{ width: 420 }}><TopicBars data={topicData} /></Card>,
          code: '<TopicBars data={topics} />' }],
      },
      {
        id: "gap", name: "GapRow", desc: "Laguna de contenido: lo que se pregunta y la IA no resuelve bien.",
        demos: [{ label: "Filas", render: () => <Card style={{ width: 520 }}><GapRow topic="Política de teletrabajo 2026" note="Sin documento indexado" miss={63} /><GapRow topic="Proceso de promoción interna" note="No hay contenido en ninguna ruta" miss={41} /></Card>,
          code: '<GapRow topic="Política de teletrabajo 2026" note="Sin documento indexado" miss={63} />' }],
      },
      {
        id: "table", name: "DataTable", desc: "Tabla genérica y tipada con el estilo Bonsai.",
        demos: [{ label: "Por defecto", render: () => <Card style={{ width: 460, overflow: "hidden" }}><DataTable rows={tableRows} columns={[{ header: "Empleado", cell: (r) => <Row style={{ gap: 9, alignItems: "center" }}><Avatar initials={r.name.split(" ").map(s => s[0]).join("")} size="sm" />{r.name}</Row> }, { header: "Equipo", cell: (r) => r.role }, { header: "Progreso", align: "right", cell: (r) => <b style={{ fontFamily: "var(--font-display)", color: r.pct === 100 ? "var(--success)" : "var(--fg)" }}>{r.pct}%</b> }]} /></Card>,
          code: '<DataTable rows={people} columns={[\n  { header: "Empleado", cell: (r) => r.name },\n  { header: "Progreso", align: "right", cell: (r) => r.pct + "%" },\n]} />' }],
      },
    ],
  },
  {
    group: "Navegación",
    items: [
      {
        id: "rail", name: "Rail", desc: "Navegación vertical con tile de logo, botones con tooltip y pie.",
        demos: [{ label: "Interactiva", render: () => <RailDemo />, code: 'const items = [\n  { id: "home", icon: "message", label: "Mi aprendizaje" },\n  { id: "team", icon: "users", label: "Equipo" },\n  { id: "insights", icon: "lightbulb", label: "Insights" },\n];\n<Rail items={items} active={tab} onSelect={setTab}\n  footer={<Avatar initials="MR" />} />' }],
      },
      {
        id: "roleswitcher", name: "RoleSwitcher", desc: "Control segmentado para cambiar de rol o vista.",
        demos: [{ label: "Interactivo", render: () => <RoleDemo />, code: '<RoleSwitcher value={role} onChange={setRole} options={[\n  { value: "chat", label: "Empleado", icon: "message" },\n  { value: "manager", label: "Manager", icon: "users" },\n  { value: "admin", label: "Admin", icon: "shield" },\n]} />' }],
      },
    ],
  },
];

/* ---- small layout + demo helpers ---- */
function Row({ children, style }) { return <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start", ...style }}>{children}</div>; }
function Stack({ children, style }) { return <div style={{ display: "flex", flexDirection: "column", gap: 10, ...style }}>{children}</div>; }

function SwatchGrid() {
  const groups = [
    { t: "Acento", items: [["--accent", "Accent"], ["--accent-600", "Accent 600"], ["--accent-tint", "Tint"], ["--sky", "Sky"]] },
    { t: "Estados", items: [["--success", "Success"], ["--warning", "Warning"], ["--danger", "Danger"]] },
    { t: "Superficie", items: [["--bg", "Bg"], ["--surface-1", "Surface 1"], ["--surface-2", "Surface 2"], ["--surface-3", "Surface 3"]] },
    { t: "Texto", items: [["--fg", "Fg"], ["--fg-2", "Fg 2"], ["--fg-3", "Fg 3"], ["--fg-muted", "Muted"]] },
  ];
  return (
    <Stack style={{ gap: 18 }}>
      {groups.map(g => (
        <div key={g.t}>
          <div className="bui-kicker" style={{ marginBottom: 10 }}>{g.t}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {g.items.map(([v, label]) => (
              <div key={v} style={{ width: 116 }}>
                <div style={{ height: 56, borderRadius: 12, background: `var(${v})`, border: "1px solid var(--line)" }} />
                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 7 }}>{label}</div>
                <div style={{ fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-display)" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </Stack>
  );
}

function TypeScale() {
  const rows = [
    ["48 / 600", 48, "var(--font-display)", "Bonsai aprende contigo"],
    ["28 / 600", 28, "var(--font-display)", "Onboarding · Liderazgo"],
    ["20 / 600", 20, "var(--font-display)", "Comunicación efectiva"],
    ["15 / 400", 15, "var(--font-ui)", "Texto de interfaz y cuerpo. Hanken Grotesk con buena legibilidad."],
    ["13 / 500", 13, "var(--font-ui)", "Texto secundario y metadatos."],
  ];
  return (
    <Stack style={{ gap: 16 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", gap: 18, alignItems: "baseline", borderBottom: "1px solid var(--line)", paddingBottom: 14 }}>
          <span className="bui-kicker" style={{ width: 70, flex: "0 0 auto" }}>{r[0]}</span>
          <span style={{ fontFamily: r[2], fontSize: r[1], fontWeight: r[2].includes("display") ? 600 : 400, letterSpacing: r[2].includes("display") ? "-0.02em" : 0, lineHeight: 1.2 }}>{r[3]}</span>
        </div>
      ))}
    </Stack>
  );
}

function IconGallery() {
  const names = (window.ICON_NAMES_LIST || []);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8 }}>
      {names.map(n => (
        <div key={n} title={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 8px", border: "1px solid var(--line)", borderRadius: 12, background: "var(--surface-1)" }}>
          <Icon name={n} size={22} />
          <span style={{ fontSize: 10.5, color: "var(--fg-3)", fontFamily: "var(--font-display)" }}>{n}</span>
        </div>
      ))}
    </div>
  );
}

function RailDemo() {
  const [tab, setTab] = useStateBC("home");
  const items = [
    { id: "home", icon: "message", label: "Mi aprendizaje" },
    { id: "team", icon: "users", label: "Equipo" },
    { id: "insights", icon: "lightbulb", label: "Insights" },
    { id: "admin", icon: "shield", label: "Global" },
  ];
  return <div style={{ height: 360, border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden", width: 76 }}><Rail items={items} active={tab} onSelect={setTab} footer={<Avatar initials="MR" />} /></div>;
}

function RoleDemo() {
  const [role, setRole] = useStateBC("chat");
  return <RoleSwitcher value={role} onChange={setRole} options={[{ value: "chat", label: "Empleado", icon: "message" }, { value: "manager", label: "Manager", icon: "users" }, { value: "admin", label: "Admin", icon: "shield" }]} />;
}

Object.assign(window, { CATALOG, Row, Stack });
