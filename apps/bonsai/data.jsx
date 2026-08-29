/* data.jsx — Bonsai scripted content (deterministic demo data, ES primary) */

const USER = { name: "Ana", full: "Ana Torres", initials: "AT", role: "Analista de Cumplimiento", company: "Banco Pichincha", streak: 6, minutesToday: 12, goalMin: 20 };

const PENDING = {
  course: "Comunicación efectiva",
  lesson: "Lección 3 · Feedback que mueve a la acción",
  progress: 62,
  left: "8 min",
  next: "Lección 4 · La conversación difícil",
};

const WEEKLY_GOAL = {
  title: "Liderar tu primera conversación de feedback",
  why: "Es el hito que tu manager marcó para esta semana en tu ruta de Liderazgo.",
  lessons: [
    { id: "l1", title: "Feedback que mueve a la acción", dur: "8 min", kind: "Microcápsula", progress: 62 },
    { id: "l2", title: "Escucha activa en 4 pasos", dur: "6 min", kind: "Lectura", progress: 0 },
    { id: "l3", title: "La conversación difícil", dur: "11 min", kind: "Vídeo + quiz", progress: 0 },
  ],
};

const FLASHCARDS = [
  { q: "¿Cuál es el primer paso del modelo SBI de feedback?", a: "Situación — describe el contexto concreto y observable (cuándo y dónde), sin juicios." },
  { q: "¿Qué diferencia el feedback de la crítica?", a: "El feedback se centra en una conducta específica y futura; la crítica juzga a la persona." },
  { q: "¿Para qué sirve cerrar con una pregunta?", a: "Convierte el monólogo en diálogo y da a la otra persona control sobre la solución." },
];

const QUIZ = {
  title: "Autoevaluación semanal · Comunicación efectiva",
  questions: [
    {
      q: "En el modelo SBI, ¿qué representa la 'I'?",
      options: ["Intención", "Impacto", "Información", "Idea"],
      correct: 1,
      explain: "I = Impacto. Describes el efecto observable que la conducta tuvo sobre ti o el equipo.",
    },
    {
      q: "Un buen feedback de mejora debería…",
      options: ["Acumularse y darse en la evaluación anual", "Darse en privado y cerca del hecho", "Enviarse siempre por escrito", "Empezar por tres elogios"],
      correct: 1,
      explain: "Cerca del hecho y en privado: maximiza la relevancia y reduce la carga defensiva.",
    },
    {
      q: "¿Qué señal indica escucha activa real?",
      options: ["Asentir sin parar", "Preparar tu respuesta mientras habla", "Parafrasear lo que ha dicho", "Cambiar de tema rápido"],
      correct: 2,
      explain: "Parafrasear demuestra que has procesado el mensaje y abre espacio a matizar.",
    },
  ],
};

const PDF_DOC = {
  name: "Política de gastos 2026.pdf",
  pages: 14,
  size: "1.2 MB",
};
const PDF_ANSWERS = [
  { q: "¿Cuál es el límite para dietas sin justificante?", a: "Según la página 4, los gastos de dieta hasta **26,40 €/día** en territorio nacional no requieren justificante, solo el parte de gastos firmado.", cite: "p. 4 · §2.3 Dietas" },
  { q: "¿Cómo reporto un taxi al aeropuerto?", a: "El trayecto a aeropuertos es reembolsable al 100 %. Sube la factura en la app de gastos dentro de los **15 días** posteriores al viaje (p. 9).", cite: "p. 9 · §5.1 Transporte" },
];

const REEXPLAIN = {
  detected: "Lección 3 · Feedback que mueve a la acción",
  metaphor: "Piensa en el feedback como ajustar el GPS de un coche, no como pisar el freno. No estás diciendo «conduces fatal» — estás diciendo «en la próxima rotonda, salida a la derecha». Concreto, orientado a la siguiente acción y sin drama.",
  recap: [
    "Describe la situación observable (el «dónde y cuándo»).",
    "Nombra la conducta concreta, no la personalidad.",
    "Explica el impacto real que tuvo.",
    "Cierra con una pregunta que invite a decidir el siguiente paso.",
  ],
  audioLen: 47, // seconds
};

const NEWSLETTER = {
  period: "Semana del 26 may – 1 jun",
  hours: "1 h 48 min",
  completed: 3,
  highlight: "Has terminado la microcápsula de Feedback y subido 2 posiciones en tu ruta de Liderazgo.",
  items: [
    { t: "Comunicación efectiva", d: "2 de 4 lecciones · al 62 %" },
    { t: "Nuevo en la Biblioteca", d: "«Conversaciones cruciales» (audiolibro, 5 h)" },
    { t: "Para la próxima semana", d: "La conversación difícil · 11 min" },
  ],
};

const LIBRARY = [
  { t: "Conversaciones cruciales", kind: "Audiolibro", meta: "5 h 12 min", tag: "Biblioteca" },
  { t: "Radical Candor", kind: "eBook", meta: "248 págs.", tag: "Biblioteca" },
  { t: "Dar feedback sin herir", kind: "Vídeo", meta: "14 min", tag: "Biblioteca" },
];

const EXPERIENCES = [
  { t: "Liderazgo de equipos", pct: 41, modules: 8, done: 3, accent: "var(--accent)" },
  { t: "Onboarding Northwind", pct: 100, modules: 6, done: 6, accent: "var(--success)" },
  { t: "Excel para producto", pct: 12, modules: 5, done: 0, accent: "var(--tan)" },
];

/* ---- Quick-prompt suggestions (the three main workflow buttons) ----
   Each `key` maps to a Mastra workflow id (see apps/mastra/.../workflows/).
   `workflow: true` tells the chat to run it via /workflows/:id/run instead of
   the scripted mock flows. */
const SUGGESTIONS = [
  { key: "weekly-goal", workflow: true, icon: "target", short: "¿Qué toca hoy?", label: "¿Qué toca hoy?", sub: "Tu objetivo de la semana" },
  { key: "quick-review", workflow: true, icon: "clock", short: "Repaso en 5 min", label: "Repaso en 5 min", sub: "Recap exprés + flashcards" },
  { key: "role-play", workflow: true, roleplay: true, icon: "users", short: "Ponte en situación", label: "Ponte en situación", sub: "Practica el caso con Bonsai" },
];

/* ---- Manager workflow buttons (mirror the learner trio) ---- */
const MANAGER_SUGGESTIONS = [
  { key: "team-at-risk", workflow: true, icon: "alert", short: "¿Quién necesita ayuda?", label: "¿Quién necesita ayuda?", sub: "Personas en riesgo + acción" },
  { key: "assign-route", workflow: true, icon: "route", short: "Asignar / ajustar ruta", label: "Asignar / ajustar ruta", sub: "Propuesta por persona" },
  { key: "team-digest", workflow: true, icon: "chart", short: "Resumen del equipo", label: "Resumen del equipo", sub: "Digest semanal" },
];

const SECONDARY_PROMPTS = [
  { key: "newsletter", icon: "mail", label: "Genera mi newsletter" },
  { key: "quiz", icon: "award", label: "Hacer mi autoevaluación" },
  { key: "pdf", icon: "file", label: "Pregunta sobre un documento" },
];

/* ---- Manager mock data ---- */
const MANAGER = {
  team: [
    { n: "Carlos Vidal", r: "Onboarding Northwind", pct: 86, trend: "+12", risk: false, last: "hoy" },
    { n: "Lucía Méndez", r: "Liderazgo de equipos", pct: 64, trend: "+5", risk: false, last: "ayer" },
    { n: "Marta Ríos", r: "Liderazgo de equipos", pct: 41, trend: "+8", risk: false, last: "hoy" },
    { n: "Diego Salas", r: "Onboarding Northwind", pct: 23, trend: "-2", risk: true, last: "hace 6 d" },
    { n: "Aroa Pérez", r: "Excel para producto", pct: 12, trend: "0", risk: true, last: "hace 9 d" },
  ],
  routes: [
    { t: "Onboarding Northwind", people: 14, pct: 78 },
    { t: "Liderazgo de equipos", people: 9, pct: 52 },
    { t: "Excel para producto", people: 6, pct: 24 },
  ],
  docs: [
    { n: "Política de gastos 2026.pdf", st: "Indexado", chunks: 132 },
    { n: "Manual de marca Northwind.pdf", st: "Indexado", chunks: 89 },
    { n: "Onboarding · primer mes.docx", st: "Procesando", chunks: 0 },
  ],
};

/* ---- Admin mock data ---- */
const ADMIN = {
  kpis: [
    { k: "Usuarios activos", v: "8.420", d: "+6,1%", accent: "var(--accent)" },
    { k: "Horas / mes", v: "17.260", d: "+12%", accent: "var(--tan)" },
    { k: "Finalización media", v: "73%", d: "+4 pts", accent: "var(--success)" },
    { k: "Ingresos add-ons", v: "24.900 €", d: "+18%", accent: "var(--accent)" },
  ],
  catalog: [
    { t: "Comunicación efectiva", cat: "Soft skills", seats: 1240, price: "Incluido" },
    { t: "Liderazgo de equipos", cat: "Liderazgo", seats: 860, price: "Incluido" },
    { t: "Excel avanzado", cat: "Datos", seats: 540, price: "Add-on · 9 €/u" },
    { t: "Certificación PMP®", cat: "Gestión", seats: 95, price: "Premium · 240 €/u" },
    { t: "Inglés de negocios B2", cat: "Idiomas", seats: 410, price: "Add-on · 12 €/u" },
  ],
  bars: [62, 48, 71, 80, 58, 90, 74, 66, 95, 70, 84, 60],
};

Object.assign(window, {
  USER, PENDING, WEEKLY_GOAL, FLASHCARDS, QUIZ, PDF_DOC, PDF_ANSWERS, REEXPLAIN,
  NEWSLETTER, LIBRARY, EXPERIENCES, SUGGESTIONS, SECONDARY_PROMPTS, MANAGER_SUGGESTIONS, MANAGER, ADMIN,
});

/* ---- Onboarding content map (temporal force-directed graph) ----
   Ruta real de un Gestor de clientes en Banco Pichincha. Cinco áreas —
   Ventas y Cartera, Compliance y Riesgo, Productos Financieros, Ecosistema
   Digital y Academia y Cultura. Algunas lecciones encadenan sub-lecciones
   avanzadas. status: done | current | pending | locked · level: root | area | lesson */
const GRAPH = {
  nodes: [
    { id: "root", label: "Gestor de clientes", level: "root", status: "current", wave: 0, desc: "Tu ruta como Gestor de clientes en Banco Pichincha, paso a paso." },

    /* ---- Áreas ---- */
    { id: "ventas", label: "Ventas y Cartera", level: "area", status: "current", wave: 1, desc: "El corazón del rol: captar, gestionar y hacer crecer tu cartera." },
    { id: "compliance", label: "Compliance y Riesgo", level: "area", status: "current", wave: 1, desc: "Cumplimiento normativo, ética y control de riesgo bancario." },
    { id: "producto", label: "Productos Financieros", level: "area", status: "pending", wave: 1, desc: "Todo el catálogo: cuentas, crédito, inversión y seguros." },
    { id: "tools", label: "Ecosistema Digital", level: "area", status: "current", wave: 1, desc: "El stack y las herramientas del día a día." },
    { id: "academy", label: "Academia y Cultura", level: "area", status: "pending", wave: 1, desc: "Habilidades transversales y mejora continua." },

    /* ---- Ventas y Cartera ---- */
    { id: "prospeccion", label: "Prospección", group: "ventas", level: "lesson", status: "done", wave: 2, desc: "Cómo identificar y calificar nuevos clientes potenciales." },
    { id: "segmentacion", label: "Segmentación de cartera", group: "ventas", level: "lesson", status: "current", wave: 2, desc: "Clasifica tu cartera por valor, riesgo y potencial." },
    { id: "pitch", label: "Pitch comercial", group: "ventas", level: "lesson", status: "pending", wave: 3, desc: "Presenta el valor con claridad y en menos de 2 minutos." },
    { id: "objeciones", label: "Manejo de objeciones", group: "ventas", level: "lesson", status: "pending", wave: 3, desc: "Convierte el «no» en una conversación útil." },
    { id: "negociacion", label: "Técnicas de negociación", group: "ventas", level: "lesson", status: "locked", wave: 4, desc: "Cierra acuerdos ganar-ganar y defiende el margen." },
    { id: "crossselling", label: "Cross & up-selling", group: "ventas", level: "lesson", status: "locked", wave: 4, desc: "Detecta oportunidades de venta cruzada en tu cartera." },
    { id: "fidelizacion", label: "Fidelización", group: "ventas", level: "lesson", status: "locked", wave: 5, desc: "Retención, NPS y planes de recuperación de clientes." },

    /* ---- Compliance y Riesgo ---- */
    { id: "conducta", label: "Código de conducta", group: "compliance", level: "lesson", status: "done", wave: 2, desc: "Conflictos de interés y canal de denuncias anónimo." },
    { id: "kyc", label: "KYC y onboarding", group: "compliance", level: "lesson", status: "current", wave: 2, desc: "Conoce a tu cliente: identificación y debida diligencia." },
    { id: "fraude", label: "Prevención de fraude", group: "compliance", level: "lesson", status: "pending", wave: 3, desc: "Tipologías de fraude, red flags y protocolos de escalamiento." },
    { id: "pld", label: "Prevención de lavado", group: "compliance", level: "lesson", status: "pending", wave: 3, desc: "PLD/FT: detección de operaciones sospechosas y reportes." },
    { id: "sanciones", label: "Listas de sanciones", group: "compliance", level: "lesson", status: "locked", wave: 4, desc: "OFAC, listas restrictivas y cribado de clientes." },
    { id: "datos", label: "Protección de datos", group: "compliance", level: "lesson", status: "pending", wave: 4, desc: "GDPR, secreto bancario y manejo de datos sensibles." },

    /* ---- Productos Financieros ---- */
    { id: "cuentas", label: "Cuentas y depósitos", group: "producto", level: "lesson", status: "pending", wave: 2, desc: "Cuentas corrientes, ahorro y depósitos a plazo." },
    { id: "tarjetas", label: "Tarjetas de crédito", group: "producto", level: "lesson", status: "pending", wave: 3, desc: "Líneas, beneficios, comisiones y gestión de mora." },
    { id: "creditos", label: "Créditos y préstamos", group: "producto", level: "lesson", status: "pending", wave: 3, desc: "Consumo, nómina y capital de trabajo." },
    { id: "hipotecas", label: "Hipotecas", group: "producto", level: "lesson", status: "locked", wave: 4, desc: "Originación hipotecaria y tasación de garantías." },
    { id: "inversiones", label: "Fondos e inversión", group: "producto", level: "lesson", status: "locked", wave: 4, desc: "Perfil de riesgo, fondos y asesoría de inversión." },
    { id: "seguros", label: "Bancaseguros", group: "producto", level: "lesson", status: "locked", wave: 5, desc: "Seguros vinculados a productos financieros." },

    /* ---- Ecosistema Digital ---- */
    { id: "rag", label: "Asistente RAG", group: "tools", level: "lesson", status: "current", wave: 2, desc: "Prompts efectivos para consultar manuales y políticas internas." },
    { id: "crm", label: "CRM financiero", group: "tools", level: "lesson", status: "pending", wave: 3, desc: "Salesforce: perfiles 360, pipeline y cross-selling." },
    { id: "core", label: "Core bancario", group: "tools", level: "lesson", status: "pending", wave: 3, desc: "Operativa en el core: altas, movimientos y consultas." },
    { id: "riesgos", label: "Scoring de riesgos", group: "tools", level: "lesson", status: "locked", wave: 4, desc: "Scoring crediticio y flujo de aprobación de riesgos." },
    { id: "dashboards", label: "Dashboards y reporting", group: "tools", level: "lesson", status: "locked", wave: 4, desc: "Lee tus KPIs de cartera y arma tu reporte semanal." },

    /* ---- Academia y Cultura ---- */
    { id: "biblioteca", label: "Biblioteca digital", group: "academy", level: "lesson", status: "pending", wave: 2, desc: "Audiolibros, resúmenes de mercado y best-sellers." },
    { id: "finanzas", label: "Finanzas básicas", group: "academy", level: "lesson", status: "pending", wave: 3, desc: "El modelo de negocio bancario para no financieros." },
    { id: "comunicacion", label: "Comunicación con clientes", group: "academy", level: "lesson", status: "pending", wave: 3, desc: "Escucha activa y mensajes claros con el cliente." },
    { id: "agile", label: "Proyectos ágiles", group: "academy", level: "lesson", status: "locked", wave: 4, desc: "Scrum y Kanban aplicados a la banca." },
    { id: "liderazgo", label: "Liderazgo e inclusión", group: "academy", level: "lesson", status: "locked", wave: 5, desc: "Diversidad, sesgos inconscientes y liderazgo inclusivo." },
  ],
  links: [
    ["root", "ventas"], ["root", "compliance"], ["root", "producto"], ["root", "tools"], ["root", "academy"],

    ["ventas", "prospeccion"], ["ventas", "segmentacion"], ["ventas", "pitch"], ["ventas", "objeciones"], ["ventas", "crossselling"], ["ventas", "fidelizacion"],
    ["objeciones", "negociacion"],

    ["compliance", "conducta"], ["compliance", "kyc"], ["compliance", "fraude"], ["compliance", "pld"], ["compliance", "datos"],
    ["pld", "sanciones"],

    ["producto", "cuentas"], ["producto", "tarjetas"], ["producto", "creditos"], ["producto", "hipotecas"], ["producto", "inversiones"], ["producto", "seguros"],

    ["tools", "rag"], ["tools", "crm"], ["tools", "core"], ["tools", "riesgos"], ["tools", "dashboards"],

    ["academy", "biblioteca"], ["academy", "finanzas"], ["academy", "comunicacion"], ["academy", "agile"], ["academy", "liderazgo"],
  ],
};

Object.assign(window, { GRAPH });

/* ============================================================================
   Mi aprendizaje · vista del learner (modelo del DOC 06)
   ============================================================================ */

/* Resource library keyed by id. durationSec en segundos, pages en páginas. */
const LEARN_RESOURCES = {
  r_brand:    { id: "r_brand",    type: "pdf",                 title: "Manual de marca Northwind",            source: { url: "https://example.com" }, metadata: { description: "Identidad, tono y uso del logo.", pages: 24 } },
  r_values:   { id: "r_values",   type: "ebook",               title: "Nuestros 5 valores",                   source: { url: "https://example.com" }, metadata: { description: "Los principios que nos guían.", pages: 18 } },
  r_comm:     { id: "r_comm",     type: "video",               title: "Comunicación efectiva: el feedback que mueve", source: { url: "https://example.com" }, metadata: { description: "Microvídeo + ejemplos.", durationSec: 840, level: "Inicial" } },
  r_sbi:      { id: "r_sbi",      type: "pdf",                 title: "El modelo SBI de feedback",            source: { url: "https://example.com" }, metadata: { description: "Situación · Conducta · Impacto.", pages: 8 } },
  r_lead_lx:  { id: "r_lead_lx",  type: "learning_experience", title: "Liderazgo de equipos",                 source: { url: "https://example.com" }, metadata: { description: "Experiencia guiada de 8 módulos.", level: "Intermedio" } },
  r_listen:   { id: "r_listen",   type: "learning_experience", title: "Escucha activa en 4 pasos",            source: { url: "https://example.com" }, metadata: { description: "Práctica interactiva.", level: "Inicial" } },
  r_hard:     { id: "r_hard",     type: "video",               title: "La conversación difícil",              source: { url: "https://example.com" }, metadata: { description: "Cómo abordar desacuerdos.", durationSec: 660, level: "Intermedio" } },
  r_expense:  { id: "r_expense",  type: "pdf",                 title: "Política de gastos 2026",              source: { url: "https://example.com" }, metadata: { description: "Límites, dietas y plazos.", pages: 14 } },

  /* Fuera de la ruta → recomendaciones de la the Library */
  rec_crucial:{ id: "rec_crucial",type: "audio",               title: "Conversaciones cruciales",             source: { url: "https://example.com" }, metadata: { description: "Audiolibro completo.", durationSec: 18720, level: "Todos" } },
  rec_candor: { id: "rec_candor", type: "ebook",               title: "Radical Candor",                       source: { url: "https://example.com" }, metadata: { description: "Liderar con franqueza y empatía.", pages: 248, level: "Intermedio" } },
  rec_noharm: { id: "rec_noharm", type: "video",               title: "Dar feedback sin herir",               source: { url: "https://example.com" }, metadata: { description: "Masterclass de 14 min.", durationSec: 840, level: "Inicial" } },
};

const LEARN_ROUTE = {
  id: "route-northwind-lead",
  organizationId: "northwind",
  title: "Onboarding · Liderazgo de equipos",
  steps: [
    { id: "s1", order: 1, title: "Cultura y valores",       objective: "Conoce cómo trabajamos y en qué creemos.",        resourceIds: ["r_brand", "r_values"], completion: { type: "consume" } },
    { id: "s2", order: 2, title: "Comunicación efectiva",   objective: "Aprende a dar feedback que mueve a la acción.",    resourceIds: ["r_comm", "r_sbi"],     completion: { type: "evaluation" } },
    { id: "s3", order: 3, title: "Tu primera conversación de feedback", objective: "Pon en práctica el modelo SBI con tu equipo.", resourceIds: ["r_lead_lx", "r_sbi"], completion: { type: "quiz" } },
    { id: "s4", order: 4, title: "Escucha activa",          objective: "Escuchar para entender, no para responder.",      resourceIds: ["r_listen"],            completion: { type: "consume" } },
    { id: "s5", order: 5, title: "La conversación difícil", objective: "Maneja desacuerdos sin romper la relación.",       resourceIds: ["r_hard"],              completion: { type: "quiz" } },
    { id: "s6", order: 6, title: "Política de gastos",      objective: "Límites, dietas y plazos que debes conocer.",      resourceIds: ["r_expense"],           completion: { type: "consume" } },
  ],
};

const LEARN_PROGRESS = [
  { routeId: "route-northwind-lead", stepId: "s1", status: "completed" },
  { routeId: "route-northwind-lead", stepId: "s2", status: "completed" },
  { routeId: "route-northwind-lead", stepId: "s3", status: "in_progress" },
  { routeId: "route-northwind-lead", stepId: "s4", status: "pending" },
  { routeId: "route-northwind-lead", stepId: "s5", status: "pending" },
  { routeId: "route-northwind-lead", stepId: "s6", status: "pending" },
];

const LEARN_RECS = ["rec_crucial", "rec_candor", "rec_noharm"];

Object.assign(window, { LEARN_RESOURCES, LEARN_ROUTE, LEARN_PROGRESS, LEARN_RECS });

/* RESOURCE_META — minimal client-side catalogue used to render route chips
   for the learner role. The /resources endpoint is manager-only, so we ship
   a small lookup for the ids the seeded route references. Real titles +
   types come from the backend seed and stay in sync via the chat (the
   present-resource and recommend-resources tools return full DTOs). */
const RESOURCE_META = {
  "res-comp-01":   { id: "res-comp-01",   type: "learning_experience", title: "Certificación Integral en Compliance y Ética Bancaria", source: { url: "https://bank-learning.com/compliance/certificacion-integral" }, metadata: { description: "Programa maestro de cumplimiento normativo y ética bancaria.", durationSec: 3600, image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=200" } },
  "res-comp-01-1": { id: "res-comp-01-1", type: "learning_experience", title: "Prevención de Fraude y Delitos Financieros",            source: { url: "https://bank-learning.com/compliance/prevencion-fraude" },        metadata: { description: "Tipologías de fraude, red flags y protocolos de escalamiento.", durationSec: 7200, image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=200" } },
  "res-comp-01-2": { id: "res-comp-01-2", type: "learning_experience", title: "Protección de Datos Personales y Secreto Bancario",     source: { url: "https://bank-learning.com/compliance/proteccion-datos" },         metadata: { description: "GDPR, secreto bancario y manejo de datos sensibles.", durationSec: 5400, image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=200" } },
  "res-comp-01-3": { id: "res-comp-01-3", type: "learning_experience", title: "Código de Conducta y Canal de Denuncias Anónimo",        source: { url: "https://bank-learning.com/compliance/codigo-conducta" },          metadata: { description: "Conflictos de interés y canal de whistleblowing.", durationSec: 3600, image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=200" } },
  "res-tool-01":   { id: "res-tool-01",   type: "learning_experience", title: "Dominio del Ecosistema Digital y Herramientas",         source: { url: "https://bank-learning.com/herramientas/ecosistema-digital" },     metadata: { description: "Adopción tecnológica y dominio del stack interno.", durationSec: 2700, image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=200" } },
  "res-tool-01-1": { id: "res-tool-01-1", type: "learning_experience", title: "Gestión Integral en el CRM Financiero (Salesforce)",     source: { url: "https://bank-learning.com/herramientas/crm-financiero" },         metadata: { description: "Perfiles 360, pipeline de ventas y cross-selling.", durationSec: 10800, image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=200" } },
  "res-tool-01-2": { id: "res-tool-01-2", type: "learning_experience", title: "Asistente Virtual (RAG) para Documentación Interna",     source: { url: "https://bank-learning.com/herramientas/ia-documentacion" },       metadata: { description: "Prompts efectivos para consultar manuales y políticas.", durationSec: 5400, image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=200" } },
  "res-tool-01-3": { id: "res-tool-01-3", type: "learning_experience", title: "Plataforma de Evaluación y Aprobación de Riesgos",       source: { url: "https://bank-learning.com/herramientas/evaluacion-riesgos" },     metadata: { description: "Scoring crediticio y flujo de aprobación de riesgos.", durationSec: 9000, image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=200" } },
  "res-cap-01":    { id: "res-cap-01",    type: "learning_experience", title: "Academia de Excelencia, Cultura y Habilidades",          source: { url: "https://bank-learning.com/capacitaciones/academia-excelencia" },  metadata: { description: "Habilidades transversales y mejora continua.", durationSec: 2700, image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=200" } },
  "res-cap-01-1":  { id: "res-cap-01-1",  type: "learning_experience", title: "Gestión de Proyectos Ágiles (Agile & Scrum) en Banca",   source: { url: "https://bank-learning.com/capacitaciones/proyectos-agiles" },     metadata: { description: "Scrum y Kanban aplicados a la banca.", durationSec: 10800, image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=200" } },
  "res-cap-01-2":  { id: "res-cap-01-2",  type: "learning_experience", title: "Finanzas Básicas para Áreas de Soporte",                source: { url: "https://bank-learning.com/capacitaciones/finanzas-soporte" },     metadata: { description: "Modelo de negocio bancario para no financieros.", durationSec: 7200, image: "https://images.unsplash.com/photo-1553729459-efe14ef20550?q=80&w=200" } },
  "res-cap-01-3":  { id: "res-cap-01-3",  type: "learning_experience", title: "Biblioteca Digital y Cultura Financiera",               source: { url: "https://bank-learning.com/capacitaciones/biblioteca-digital" },   metadata: { description: "Audiolibros, resúmenes de mercado y best-sellers.", durationSec: 3600, image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=200" } },
  "res-cap-01-4":  { id: "res-cap-01-4",  type: "learning_experience", title: "Liderazgo Femenino e Inclusión en el Sector Financiero", source: { url: "https://bank-learning.com/capacitaciones/liderazgo-inclusion" },  metadata: { description: "Diversidad, sesgos inconscientes y liderazgo inclusivo.", durationSec: 7200, image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=200" } },
};
Object.assign(window, { RESOURCE_META });

/* ============================================================================
   Insights · dudas principales de los empleados (lo que más se pregunta a la IA)
   ============================================================================ */
const INSIGHTS = {
  kpis: [
    { k: "Preguntas este mes", v: "3.482", d: "+12% vs. mes anterior", accent: "var(--accent)", up: true },
    { k: "Resueltas por la IA", v: "86%", d: "+4 pts", accent: "var(--success)", up: true },
    { k: "Por empleado / semana", v: "4,1", d: "+0,6", accent: "var(--tan)", up: true },
    { k: "Sin respuesta clara", v: "6%", d: "-2 pts", accent: "var(--danger)", up: true },
  ],
  // Lo más preguntado a Bonsai, ordenado por volumen.
  topQuestions: [
    { q: "¿Cuál es el límite de dietas sin justificante?",   count: 142, trend: "+18%", topic: "Gastos y viajes", resolved: true },
    { q: "¿Cómo doy feedback a alguien de mi equipo?",        count: 128, trend: "+9%",  topic: "Liderazgo",       resolved: true },
    { q: "¿Cómo solicito mis días de vacaciones?",            count: 119, trend: "+4%",  topic: "RRHH y permisos", resolved: true },
    { q: "¿Qué es el modelo SBI de feedback?",                count: 96,  trend: "+22%", topic: "Liderazgo",       resolved: true },
    { q: "¿Dónde subo una factura de viaje?",                 count: 88,  trend: "+6%",  topic: "Gastos y viajes", resolved: true },
    { q: "¿Cómo configuro Slack y el correo?",                count: 74,  trend: "-3%",  topic: "Herramientas",    resolved: true },
    { q: "¿Cuál es la política de teletrabajo en 2026?",      count: 63,  trend: "+31%", topic: "RRHH y permisos", resolved: false },
    { q: "¿Qué cursos tengo pendientes esta semana?",         count: 57,  trend: "+14%", topic: "Aprendizaje",     resolved: true },
  ],
  // Temas más consultados (reparto del volumen).
  topics: [
    { t: "Gastos y viajes",      pct: 27, count: 940 },
    { t: "Liderazgo y feedback", pct: 23, count: 800 },
    { t: "RRHH y permisos",      pct: 18, count: 626 },
    { t: "Herramientas",         pct: 14, count: 487 },
    { t: "Aprendizaje y rutas",  pct: 11, count: 383 },
    { t: "Otros",                pct: 7,  count: 246 },
  ],
  // Lagunas: lo que se pregunta pero la IA no resuelve bien → oportunidad de contenido.
  gaps: [
    { t: "Política de teletrabajo 2026",        miss: 63, note: "Sin documento indexado" },
    { t: "Proceso de promoción interna",        miss: 41, note: "No hay contenido en ninguna ruta" },
    { t: "Beneficios sociales y seguro médico",  miss: 29, note: "Documento desactualizado (2023)" },
  ],
};

Object.assign(window, { INSIGHTS });
