// Idempotent seed for the bonsai demo — banking learning path.
//
//   bun run apps/mastra/scripts/seed-bonsai.ts
//
// Seeds org "Banco Acme" + 1 manager + 1 learner, upserts the 13 nodes of
// the banking certification route as `learning_experience` resources (rich
// metadata: tema, descripción, imagen, duración, URL del curso), writes the
// route JSON to seed/routes/<orgId>.json, seeds the learner's progress to
// match the demo client's state (the nodes they have started vs. pending),
// then runs the index-resource pipeline so Bonsai can ground answers on each
// node's description.
//
// Re-runs are safe: it upserts by deterministic id, removes resources no
// longer in the route, resets the learner's progress, and wipes the org's
// vectors before re-embedding.
//
// IDs (org/learner/route) are kept stable across the old Acme onboarding seed
// so existing DB helpers (e2e _db.ts) still resolve. The step/resource ids
// are the node codes (COMP-01 → step-comp-01 / res-comp-01).
import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadDotenv } from "dotenv";

const here = dirname(fileURLToPath(import.meta.url));
const mastraRoot = resolve(here, "..");
const envPath = resolve(mastraRoot, ".env");
loadDotenv({ path: envPath, quiet: true });

// Imports that need env are deferred until after dotenv loads.
const { prisma } = await import("../src/mastra/domain/prisma");
const { pgVector, RESOURCE_INDEX_NAME, ensureResourceIndex } = await import(
  "../src/mastra/domain/vector"
);
const { runIndexResource } = await import("../src/mastra/workflows/index-resource");

// Deterministic IDs so re-runs are idempotent and seed/routes/<orgId>.json
// matches what the tools look for. Kept stable from the prior Acme seed.
const ORG_ID = "acme-org";
const ORG_NAME = "Banco Acme";
const MANAGER_ID = "acme-manager";
const LEARNER_ID = "acme-learner";
const ROUTE_ID = "route-acme-default";
const ROUTE_TITLE = "Ruta de aprendizaje · Banca (Compliance, Herramientas y Cultura)";

// --- The banking learning path ---------------------------------------------
// One entry per node/subnode. The flat order interleaves each parent node
// with its subnodes; the system's step model is flat, and the "Nodo:" /
// "Subnodo:" prefixes in the names already convey the hierarchy.
//
//   estado: ONGOING → in_progress · PENDING → pending · (100/COMPLETED → completed)
//   tiempo: "60 min" → durationSec 3600

type Estado = "ONGOING" | "PENDING" | "COMPLETED";

interface Node {
  nodo: string;
  nombre: string;
  tematica: string;
  objetivo: string;
  descripcion: string;
  imagen: string;
  url: string;
  progreso: number;
  estado: Estado;
  tiempo: string;
}

const NODES: Node[] = [
  {
    nodo: "COMP-01",
    nombre: "Nodo: Certificación Integral en Compliance y Ética Bancaria",
    tematica: "Compliance",
    objetivo: "Visión general del programa de cumplimiento normativo y ética bancaria.",
    descripcion:
      "Este es el programa maestro de cumplimiento normativo, diseñado para blindar a la institución frente a riesgos legales y reputacionales. Como entidad financiera, operamos bajo el escrutinio constante de entes reguladores. Este nodo principal agrupa todas las normativas obligatorias, la filosofía de Gobierno Corporativo y los estándares de ética profesional que todos los colaboradores, desde áreas operativas hasta la alta dirección, deben internalizar para garantizar operaciones seguras y transparentes.",
    imagen: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=200",
    url: "https://bank-learning.com/compliance/certificacion-integral",
    progreso: 20,
    estado: "ONGOING",
    tiempo: "60 min",
  },
  {
    nodo: "COMP-01.1",
    nombre: "Subnodo: Prevención de Fraude y Delitos Financieros",
    tematica: "Compliance",
    objetivo: "Identificar y escalar señales de fraude y delitos financieros.",
    descripcion:
      "Profundiza en las tipologías de fraude interno y externo que amenazan al sector bancario. Aprenderás a identificar banderas rojas (red flags) en transacciones atípicas, la manipulación de documentos y el fraude electrónico. Revisaremos casos de estudio reales y te capacitaremos en los protocolos de escalamiento inmediato al departamento de Auditoría y Riesgos ante cualquier sospecha de irregularidad financiera.",
    imagen: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=200",
    url: "https://bank-learning.com/compliance/prevencion-fraude",
    progreso: 0,
    estado: "PENDING",
    tiempo: "120 min",
  },
  {
    nodo: "COMP-01.2",
    nombre: "Subnodo: Ley de Protección de Datos Personales y Secreto Bancario",
    tematica: "Compliance",
    objetivo: "Aplicar la protección de datos y el secreto bancario en tu día a día.",
    descripcion:
      "La confianza de nuestros clientes se basa en la privacidad de sus datos. Este módulo te enseñará cómo aplicar rigurosamente las normativas de protección de datos (como GDPR o leyes locales equivalentes) y el principio del secreto bancario en tu día a día. Aprenderás qué información puede ser compartida, cómo manejar las solicitudes de los clientes sobre su información personal y las graves consecuencias legales de la filtración de datos sensibles.",
    imagen: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=200",
    url: "https://bank-learning.com/compliance/proteccion-datos",
    progreso: 0,
    estado: "PENDING",
    tiempo: "90 min",
  },
  {
    nodo: "COMP-01.3",
    nombre: "Subnodo: Código de Conducta y Canal de Denuncias Anónimo",
    tematica: "Compliance",
    objetivo: "Conocer el código de conducta y el canal de denuncias anónimo.",
    descripcion:
      "Revisión exhaustiva de nuestro Código de Ética Empresarial. Exploraremos situaciones cotidianas que pueden representar conflictos de interés (por ejemplo, recepción de regalos de clientes o proveedores, o vínculos familiares en decisiones crediticias). Además, se te instruirá sobre el uso correcto de nuestro Canal de Denuncias (Whistleblowing), garantizando tu protección y anonimato al reportar conductas inapropiadas que atenten contra los valores del banco.",
    imagen: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=200",
    url: "https://bank-learning.com/compliance/codigo-conducta",
    progreso: 0,
    estado: "PENDING",
    tiempo: "60 min",
  },
  {
    nodo: "TOOL-01",
    nombre: "Nodo: Dominio del Ecosistema Digital y Herramientas Corporativas",
    tematica: "Herramientas Internas",
    objetivo: "Dominar el ecosistema digital y las herramientas corporativas del banco.",
    descripcion:
      "El entorno de trabajo de nuestro banco es altamente digitalizado. Este nodo central está enfocado en la adopción tecnológica y en la reducción del riesgo técnico mediante el dominio de las plataformas internas. Aquí agrupamos las capacitaciones sobre los softwares de gestión diarios, desde las herramientas de atención comercial hasta los sistemas de reportería analítica. El objetivo es que logres total fluidez y eficiencia en el uso del stack tecnológico del banco.",
    imagen: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=200",
    url: "https://bank-learning.com/herramientas/ecosistema-digital",
    progreso: 50,
    estado: "ONGOING",
    tiempo: "45 min",
  },
  {
    nodo: "TOOL-01.1",
    nombre: "Subnodo: Gestión Integral en el CRM Financiero (Salesforce)",
    tematica: "Herramientas Internas",
    objetivo: "Gestionar clientes y ventas en el CRM financiero (Salesforce).",
    descripcion:
      "Aprende a maximizar el uso de nuestro CRM adaptado al sector financiero. Te guiaremos en la creación de perfiles 360 del cliente, registro de interacciones, gestión del pipeline de ventas de productos financieros (préstamos, tarjetas, fondos de inversión) y la configuración de alertas automatizadas. Un dominio absoluto del CRM te permitirá cruzar ventas (cross-selling) y ofrecer una experiencia altamente personalizada.",
    imagen: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=200",
    url: "https://bank-learning.com/herramientas/crm-financiero",
    progreso: 0,
    estado: "PENDING",
    tiempo: "180 min",
  },
  {
    nodo: "TOOL-01.2",
    nombre: "Subnodo: Uso del Asistente Virtual (RAG) para Documentación Interna",
    tematica: "Herramientas Internas",
    objetivo: "Usar el asistente virtual (RAG) para consultar documentación interna.",
    descripcion:
      "Conoce nuestra nueva herramienta de Inteligencia Artificial Conversacional basada en tecnología RAG (Retrieval-Augmented Generation). Te enseñaremos cómo formular consultas (prompts) efectivas para extraer información precisa de nuestros extensos manuales de políticas, normativas de crédito y guías de productos. Esto reducirá drásticamente el tiempo que pasas buscando respuestas y estandarizará el conocimiento en toda la red de sucursales.",
    imagen: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=200",
    url: "https://bank-learning.com/herramientas/ia-documentacion",
    progreso: 0,
    estado: "PENDING",
    tiempo: "90 min",
  },
  {
    nodo: "TOOL-01.3",
    nombre: "Subnodo: Plataforma de Evaluación y Aprobación de Riesgos",
    tematica: "Herramientas Internas",
    objetivo: "Operar la plataforma de evaluación y aprobación de riesgos.",
    descripcion:
      "Formación técnica sobre el software interno utilizado para la calificación crediticia (Scoring) y análisis de riesgo. Aprenderás a introducir variables financieras de clientes (personas físicas y jurídicas), interpretar los dictámenes arrojados por el sistema, revisar historiales de burós de crédito integrados y entender el flujo de aprobación jerárquica para montos que superen tu nivel de autonomía.",
    imagen: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=200",
    url: "https://bank-learning.com/herramientas/evaluacion-riesgos",
    progreso: 0,
    estado: "PENDING",
    tiempo: "150 min",
  },
  {
    nodo: "CAP-01",
    nombre: "Nodo: Academia de Excelencia, Cultura y Habilidades del Futuro",
    tematica: "Otras Capacitaciones",
    objetivo: "Desarrollar habilidades transversales y cultura de mejora continua.",
    descripcion:
      "Para mantener nuestra posición en el mercado, necesitamos profesionales integrales. Este nodo agrupa todas las capacitaciones transversales orientadas al desarrollo humano, innovación metodológica y mejora continua. Aquí encontrarás desde planes de bienestar laboral hasta habilidades que fomentan el liderazgo, la lectura, el aprendizaje social continuo y la resiliencia organizativa (habilidades ampliamente requeridas por nuestros departamentos de Recursos Humanos y L&D).",
    imagen: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=200",
    url: "https://bank-learning.com/capacitaciones/academia-excelencia",
    progreso: 10,
    estado: "ONGOING",
    tiempo: "45 min",
  },
  {
    nodo: "CAP-01.1",
    nombre: "Subnodo: Gestión de Proyectos Ágiles (Agile & Scrum) en Banca",
    tematica: "Otras Capacitaciones",
    objetivo: "Aplicar metodologías ágiles (Scrum, Kanban) en banca.",
    descripcion:
      "El sector financiero exige adaptación rápida. Este curso te introduce en las metodologías ágiles (Scrum, Kanban) aplicadas a entornos corporativos no tecnológicos. Entenderás cómo organizar el trabajo en sprints, la importancia de las ceremonias diarias (dailies) y cómo aplicar mentalidad ágil para el lanzamiento de nuevos productos financieros, la optimización de procesos operativos y la colaboración fluida con el área de TI.",
    imagen: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=200",
    url: "https://bank-learning.com/capacitaciones/proyectos-agiles",
    progreso: 0,
    estado: "PENDING",
    tiempo: "180 min",
  },
  {
    nodo: "CAP-01.2",
    nombre: "Subnodo: Finanzas Básicas para Áreas de Soporte (No Financieros)",
    tematica: "Otras Capacitaciones",
    objetivo: "Entender las finanzas básicas del negocio bancario.",
    descripcion:
      "Diseñado específicamente para colaboradores en áreas como RRHH, TI o Marketing. El objetivo es nivelar el conocimiento general sobre cómo funciona el modelo de negocio de un banco. Exploraremos conceptos clave como el margen de intermediación, la tasa de interés, el encaje bancario, los indicadores de morosidad y cómo el trabajo de los departamentos de soporte impacta directamente en el estado de resultados y el balance general de la institución.",
    imagen: "https://images.unsplash.com/photo-1553729459-efe14ef20550?q=80&w=200",
    url: "https://bank-learning.com/capacitaciones/finanzas-soporte",
    progreso: 0,
    estado: "PENDING",
    tiempo: "120 min",
  },
  {
    nodo: "CAP-01.3",
    nombre: "Subnodo: Biblioteca Digital y Fomento de la Cultura Financiera",
    tematica: "Otras Capacitaciones",
    objetivo: "Aprovechar la biblioteca digital y fomentar la cultura financiera.",
    descripcion:
      "Te damos la bienvenida a nuestra Biblioteca Digital Corporativa. Esta iniciativa busca fomentar el hábito de la lectura y el autoaprendizaje continuo. Aprenderás a navegar por nuestro catálogo enriquecido con audiolibros, resúmenes de mercado (book summaries), revistas económicas internacionales y best-sellers sobre liderazgo y economía del comportamiento. Es tu espacio personal para inspirarte y conectar tu aprendizaje con las tendencias macroeconómicas globales.",
    imagen: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=200",
    url: "https://bank-learning.com/capacitaciones/biblioteca-digital",
    progreso: 0,
    estado: "PENDING",
    tiempo: "60 min",
  },
  {
    nodo: "CAP-01.4",
    nombre: "Subnodo: Liderazgo Femenino e Inclusión en el Sector Financiero",
    tematica: "Otras Capacitaciones",
    objetivo: "Impulsar el liderazgo femenino y la inclusión en el sector financiero.",
    descripcion:
      "Parte fundamental de nuestro programa de ESG y talento humano. Este módulo aborda la importancia de la diversidad en la toma de decisiones financieras. Capacita a los equipos en la detección y eliminación de sesgos inconscientes durante la contratación y promoción, y proporciona herramientas a futuras líderes para desarrollar su marca personal, potenciar sus habilidades de negociación directiva y fomentar entornos de trabajo verdaderamente inclusivos.",
    imagen: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=200",
    url: "https://bank-learning.com/capacitaciones/liderazgo-inclusion",
    progreso: 0,
    estado: "PENDING",
    tiempo: "120 min",
  },
];

// --- Derivations ------------------------------------------------------------

// "COMP-01.1" → "comp-01-1"
const slug = (nodo: string) => nodo.toLowerCase().replace(/\./g, "-");
const resourceId = (nodo: string) => `res-${slug(nodo)}`;
const stepId = (nodo: string) => `step-${slug(nodo)}`;

// "120 min" → 7200 (seconds). Falls back to undefined if unparseable.
function durationSec(tiempo: string): number | undefined {
  const m = /(\d+)\s*min/i.exec(tiempo);
  return m ? Number(m[1]) * 60 : undefined;
}

const estadoToStatus = (n: Node): "pending" | "in_progress" | "completed" =>
  n.estado === "COMPLETED" || n.progreso >= 100
    ? "completed"
    : n.estado === "ONGOING" || n.progreso > 0
      ? "in_progress"
      : "pending";

// --- Completion types -------------------------------------------------------
// A real compliance certification is not just "read & continue": the critical
// modules require an assessment. We map the assessment-appropriate nodes to a
// quiz (multiple-choice, auto-graded) or an evaluation (free-text, rubric-
// graded by the evaluator agent). Everything else stays `consume` (open the
// course → step completes). Keyed by node code; missing → consume.

type Completion =
  | { type: "consume" }
  | { type: "evaluation"; prompt: string; rubric: string }
  | {
      type: "quiz";
      passScore: number;
      questions: { q: string; options: string[]; answer: number }[];
    };

const COMPLETIONS: Record<string, Completion> = {
  // Prevención de Fraude → quiz de tipologías y protocolo de escalamiento.
  "COMP-01.1": {
    type: "quiz",
    passScore: 0.7,
    questions: [
      {
        q: "¿Qué es una 'bandera roja' (red flag) en la detección de fraude?",
        options: [
          "Una transacción rutinaria ya aprobada por el sistema",
          "Un patrón o señal atípica que sugiere una posible irregularidad",
          "El informe anual de auditoría externa",
          "Una promoción comercial dirigida a clientes nuevos",
        ],
        answer: 1,
      },
      {
        q: "Ante la sospecha de una operación fraudulenta, ¿cuál es el protocolo correcto?",
        options: [
          "Ignorarla si el importe es bajo",
          "Resolverla por cuenta propia sin avisar a nadie",
          "Escalarla de inmediato al departamento de Auditoría y Riesgos",
          "Comentarla de forma informal con un compañero",
        ],
        answer: 2,
      },
      {
        q: "¿Cuál de los siguientes es un ejemplo de fraude interno?",
        options: [
          "Un correo de phishing dirigido a un cliente",
          "La manipulación de documentos por parte de un empleado",
          "El robo de una tarjeta física por un tercero",
          "Un ataque de denegación de servicio a la web del banco",
        ],
        answer: 1,
      },
    ],
  },
  // Código de Conducta → evaluación reflexiva sobre conflictos de interés.
  "COMP-01.3": {
    type: "evaluation",
    prompt:
      "Describe una situación de posible conflicto de interés en tu día a día (por ejemplo, un regalo de un cliente o un vínculo familiar en una decisión crediticia) y explica cómo actuarías según el Código de Conducta.",
    rubric:
      "Debe identificar correctamente el conflicto de interés, mencionar la obligación de declararlo o abstenerse de la decisión, y referir el uso del canal de denuncias o la comunicación a un superior / Compliance. Una respuesta válida demuestra comprensión de la transparencia y del no aprovechamiento del cargo.",
  },
  // Plataforma de Riesgos → quiz de scoring y flujo de aprobación.
  "TOOL-01.3": {
    type: "quiz",
    passScore: 0.7,
    questions: [
      {
        q: "¿Qué mide principalmente el 'scoring' crediticio?",
        options: [
          "La rentabilidad de una sucursal",
          "La probabilidad de impago de un cliente",
          "El número de empleados de la oficina",
          "La cuota de mercado del banco",
        ],
        answer: 1,
      },
      {
        q: "Si una operación supera tu nivel de autonomía, ¿qué procede?",
        options: [
          "Aprobarla igualmente para no perder al cliente",
          "Rechazarla automáticamente sin análisis",
          "Elevarla al flujo de aprobación jerárquica",
          "Fraccionarla en varias para no superar el límite",
        ],
        answer: 2,
      },
    ],
  },
  // Finanzas Básicas → quiz de conceptos del negocio bancario.
  "CAP-01.2": {
    type: "quiz",
    passScore: 0.7,
    questions: [
      {
        q: "¿Qué es el margen de intermediación?",
        options: [
          "La diferencia entre ingresos y gastos de personal",
          "La diferencia entre los intereses cobrados y los pagados",
          "El beneficio obtenido por comisiones de tarjetas",
          "El capital social aportado por los accionistas",
        ],
        answer: 1,
      },
      {
        q: "El indicador de morosidad mide…",
        options: [
          "La satisfacción media de los clientes",
          "La proporción de créditos impagados sobre el total concedido",
          "El número de oficinas abiertas en el año",
          "La rentabilidad de los fondos de inversión",
        ],
        answer: 1,
      },
    ],
  },
  // Liderazgo e Inclusión → evaluación reflexiva sobre sesgos.
  "CAP-01.4": {
    type: "evaluation",
    prompt:
      "Explica qué es un sesgo inconsciente en los procesos de contratación o promoción y propón una acción concreta para reducirlo en tu equipo.",
    rubric:
      "Debe definir el sesgo inconsciente como un prejuicio automático y no deliberado, dar un ejemplo aplicado a contratación o promoción, y proponer al menos una medida concreta (criterios objetivos, paneles diversos, formación específica o revisión 'a ciegas'). Una respuesta válida demuestra entendimiento real de diversidad e inclusión.",
  },
};

const completionFor = (nodo: string): Completion =>
  COMPLETIONS[nodo] ?? { type: "consume" };

// --- Seed helpers -----------------------------------------------------------

async function upsertOrg() {
  await prisma.organization.upsert({
    where: { id: ORG_ID },
    update: { name: ORG_NAME },
    create: { id: ORG_ID, name: ORG_NAME },
  });
}

async function upsertUser(
  id: string,
  email: string,
  name: string,
  role: "manager" | "learner",
) {
  await prisma.user.upsert({
    where: { id },
    update: { email, name, role, organizationId: ORG_ID },
    create: { id, email, name, role, organizationId: ORG_ID },
  });
}

// Upsert one node as a `learning_experience` resource. The course lives at an
// external URL (bank-learning.com); we keep the rich metadata so Bonsai can
// describe and recommend it, and so the index pipeline has text to embed.
async function upsertNodeResource(n: Node) {
  const id = resourceId(n.nodo);
  const metadata = {
    description: n.descripcion,
    tags: [n.tematica],
    level: "intro" as const,
    language: "es",
    durationSec: durationSec(n.tiempo),
    image: n.imagen,
  };
  const data = {
    organizationId: ORG_ID,
    type: "learning_experience" as const,
    title: n.nombre,
    status: "registered" as const,
    source: { provider: "bank-learning", url: n.url },
    metadata,
  };
  await prisma.resource.upsert({
    where: { id },
    update: data,
    create: { id, ...data },
  });
}

// Remove any resource of this org that is no longer part of the route (e.g.
// the previous Acme onboarding seed) so the catalogue reflects the new route.
async function pruneStaleResources() {
  const keep = NODES.map((n) => resourceId(n.nodo));
  const removed = await prisma.resource.deleteMany({
    where: { organizationId: ORG_ID, id: { notIn: keep } },
  });
  if (removed.count) console.log(`  pruned ${removed.count} stale resource(s)`);
}

// --- Route ------------------------------------------------------------------

const route = {
  id: ROUTE_ID,
  organizationId: ORG_ID,
  title: ROUTE_TITLE,
  steps: NODES.map((n, i) => ({
    id: stepId(n.nodo),
    order: i + 1,
    title: n.nombre,
    objective: n.objetivo,
    resourceIds: [resourceId(n.nodo)],
    completion: completionFor(n.nodo),
  })),
};

async function writeRouteJson() {
  const file = resolve(mastraRoot, "src", "mastra", "seed", "routes", `${ORG_ID}.json`);
  await writeFile(file, JSON.stringify(route, null, 2) + "\n", "utf-8");
  console.log("Wrote", file);
}

// --- Progress ---------------------------------------------------------------

// Seed the demo client's progress: the state of each node they have started
// or left pending. Resets first so re-runs reflect exactly the NODES table.
async function seedProgress() {
  await prisma.learnerProgress.deleteMany({ where: { userId: LEARNER_ID } });
  for (const n of NODES) {
    const status = estadoToStatus(n);
    await prisma.learnerProgress.create({
      data: {
        organizationId: ORG_ID,
        userId: LEARNER_ID,
        routeId: ROUTE_ID,
        stepId: stepId(n.nodo),
        status,
        completedAt: status === "completed" ? new Date() : null,
        // Keep the original percentage + label for fidelity / debugging.
        evidence: { progress: n.progreso, estado: n.estado, nodo: n.nodo },
      },
    });
  }
  console.log(`  seeded ${NODES.length} progress row(s) for ${LEARNER_ID}`);
}

// --- Indexing ---------------------------------------------------------------

async function purgeOrgVectors() {
  await ensureResourceIndex();
  try {
    await pgVector.deleteVectors({
      indexName: RESOURCE_INDEX_NAME,
      filter: { organizationId: { $eq: ORG_ID } },
    });
  } catch (err) {
    console.warn("purgeOrgVectors warning:", (err as Error).message);
  }
}

async function indexAll() {
  for (const n of NODES) {
    const id = resourceId(n.nodo);
    try {
      const r = await runIndexResource({ resourceId: id, organizationId: ORG_ID });
      console.log(`  indexed ${id} (${r.chunks} chunks)`);
    } catch (err) {
      console.warn(`  FAILED ${id}: ${(err as Error).message}`);
    }
  }
}

// --- Main -------------------------------------------------------------------

console.log("→ org + users");
await upsertOrg();
await upsertUser(MANAGER_ID, "manager@acme.us", "Responsable de Formación", "manager");
await upsertUser(LEARNER_ID, "learner@acme.us", "Ana Torres", "learner");

console.log("→ node resources");
for (const n of NODES) await upsertNodeResource(n);
await pruneStaleResources();

console.log("→ route JSON");
await writeRouteJson();

console.log("→ learner progress");
await seedProgress();

console.log("→ purge prior vectors");
await purgeOrgVectors();

console.log("→ index everything");
await indexAll();

console.log("done.");
await prisma.$disconnect();
