export interface DocsMarkdownFile {
  title: string;
  path: string;
  category: string;
  summary: string;
}

export const DOCS_MARKDOWN_FILES: DocsMarkdownFile[] = [
  {
    title: 'Arquitectura base',
    path: 'architecture.md',
    category: 'Arquitectura',
    summary: 'Mapa técnico del repositorio, runtime declarativo, servicios, flows, acciones, seguridad e infra.'
  },
  {
    title: 'Arquitectura de plataforma',
    path: 'platform-architecture.md',
    category: 'Arquitectura',
    summary: 'Definición oficial Event-Driven, Metadata-Driven y Microkernel de Chicle.'
  },
  {
    title: 'Estado del proyecto',
    path: 'project-state-analysis.md',
    category: 'Arquitectura',
    summary: 'Diagnóstico actual de avance, fortalezas, riesgos y próximos bloques recomendados.'
  },
  {
    title: 'Decisiones',
    path: 'decisions.md',
    category: 'Gobierno',
    summary: 'Decisiones base del proyecto y criterios que no deben perderse.'
  },
  {
    title: 'Context handoff',
    path: 'context-handoff.md',
    category: 'Gobierno',
    summary: 'Punto de transferencia para continuar el proyecto entre conversaciones.'
  },
  {
    title: 'MVP scope',
    path: 'mvp-scope.md',
    category: 'Gobierno',
    summary: 'Alcance del MVP y límites iniciales.'
  },
  {
    title: 'Security auth review',
    path: 'security-auth-review.md',
    category: 'Seguridad',
    summary: 'Revisión de seguridad, auth, roles, permisos y protección de runtime.'
  },
  {
    title: 'AI authoring guide',
    path: 'ai-authoring-guide.md',
    category: 'IA',
    summary: 'Entrada humana e IA para crear servicios, forms, flows y contratos JSON.'
  },
  {
    title: 'AI ready authoring',
    path: 'ai-ready-authoring.md',
    category: 'IA',
    summary: 'Endpoints y secuencias JSON-only pensadas para asistentes.'
  },
  {
    title: 'AI RAG architecture',
    path: 'ai-rag-architecture.md',
    category: 'IA',
    summary: 'Knowledge Packs, retrieval local y estrategia RAG de Chicle AI.'
  },
  {
    title: 'AI local Ollama',
    path: 'ai-local-ollama.md',
    category: 'IA',
    summary: 'Runtime local con Ollama, modelos, embeddings y configuración.'
  },
  {
    title: 'Dynamic services contract',
    path: 'dynamic-services-contract.md',
    category: 'Contratos',
    summary: 'Contrato ejecutable de servicios dinámicos, filtros, joins, writeMap, pruebas y publicación.'
  },
  {
    title: 'Dynamic forms contract',
    path: 'dynamic-forms-contract.md',
    category: 'Contratos',
    summary: 'Contrato de formularios dinámicos, steps, campos, acciones, persistencia y responsive.'
  },
  {
    title: 'Flow contract',
    path: 'flow-contract.md',
    category: 'Contratos',
    summary: 'Contrato de flows, triggers, steps, runtime, pruebas y respuesta.'
  },
  {
    title: 'Formly architecture',
    path: 'formly-architecture.md',
    category: 'Frontend',
    summary: 'Puente Formly y render declarativo multikit.'
  },
  {
    title: 'UI presentation architecture',
    path: 'ui-presentation-architecture.md',
    category: 'Frontend',
    summary: 'Arquitectura de presentación, temas, kits visuales y adapters.'
  },
  {
    title: 'UI components',
    path: 'ui-components.md',
    category: 'Frontend',
    summary: 'Reglas de componentes reutilizables, documentación y adopción.'
  },
  {
    title: 'UI component inventory',
    path: 'ui-component-inventory.md',
    category: 'Frontend',
    summary: 'Inventario de componentes visuales existentes y estado de reutilización.'
  },
  {
    title: 'UI reuse audit',
    path: 'ui-reuse-audit.md',
    category: 'Frontend',
    summary: 'Auditoría visual de reutilización por rutas y excepciones.'
  },
  {
    title: 'Admin UI reuse audit',
    path: 'admin-ui-reuse-audit.md',
    category: 'Frontend',
    summary: 'Auditoría por página del Admin, porcentajes de reutilización y componentes faltantes.'
  },
  {
    title: 'Admin kit transformation audit',
    path: 'admin-kit-transformation-audit.md',
    category: 'Frontend',
    summary: 'Auditoría estricta de transformación multi-kit por página y componentes faltantes.'
  },
  {
    title: 'Backup worker architecture',
    path: 'backup-worker-architecture.md',
    category: 'Operación',
    summary: 'Worker, backup, procesos separables y recuperación.'
  },
  {
    title: 'Angular 20 migration roadmap',
    path: 'angular-20-migration-roadmap.md',
    category: 'Operación',
    summary: 'Ruta auditada de migración y estabilización Angular 20.'
  },
  {
    title: 'Angular 20 migration report',
    path: 'angular-20-migration-report.md',
    category: 'Operación',
    summary: 'Resultado instalado y verificación de Angular 20.'
  }
];
