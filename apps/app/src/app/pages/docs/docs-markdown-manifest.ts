export interface DocsMarkdownFile {
  title: string;
  path: string;
  category: string;
  summary: string;
}

export const DOCS_MARKDOWN_FILES: DocsMarkdownFile[] = [
  {
    title: "Base architecture",
    path: "architecture.md",
    category: "Architecture",
    summary:
      "Technical map of the repository, declarative runtime, services, flows, actions, security and infrastructure.",
  },
  {
    title: "Platform architecture",
    path: "platform-architecture.md",
    category: "Architecture",
    summary:
      "Official Event-Driven, Metadata-Driven and Microkernel definition for Chicle.",
  },
  {
    title: "Chicle architecture draft",
    path: "chicle-architecture-draft.md",
    category: "Architecture",
    summary:
      "Draft architecture identity for the Event-Driven Microkernel synthesis behind Chicle.",
  },
  {
    title: "Project state",
    path: "project-state-analysis.md",
    category: "Architecture",
    summary:
      "Current diagnosis of progress, strengths, risks and recommended next blocks.",
  },
  {
    title: "Environment deploy and vault",
    path: "environment-deploy-vault-roadmap.md",
    category: "Architecture",
    summary:
      "Environment And Deploy Center, Chicle Vault, runtime config, service registry and V1/V2 scope.",
  },
  {
    title: "Text and language architecture",
    path: "i18n-text-architecture.md",
    category: "Architecture",
    summary:
      "Text bundles, backend-controlled locales, artifact preferences, offline cache and Admin/generated-app rules.",
  },
  {
    title: "Decisions",
    path: "decisions.md",
    category: "Governance",
    summary: "Base project decisions and criteria that must not be lost.",
  },
  {
    title: "Context handoff",
    path: "context-handoff.md",
    category: "Governance",
    summary:
      "Transfer point for continuing the project across conversations.",
  },
  {
    title: "MVP scope",
    path: "mvp-scope.md",
    category: "Governance",
    summary: "MVP scope and initial boundaries.",
  },
  {
    title: "Platform validator backlog",
    path: "platform-validator-backlog.md",
    category: "Governance",
    summary:
      "Pending checks for seeds, dynamic texts, translations, component reuse, tests, duplication, security and obsolete code.",
  },
  {
    title: "Security auth review",
    path: "security-auth-review.md",
    category: "Security",
    summary:
      "Security review for auth, roles, permissions and runtime protection.",
  },
  {
    title: "AI authoring guide",
    path: "ai-authoring-guide.md",
    category: "AI",
    summary:
      "Human and AI entry point for creating services, forms, flows and JSON contracts.",
  },
  {
    title: "AI ready authoring",
    path: "ai-ready-authoring.md",
    category: "AI",
    summary: "JSON-only endpoints and sequences designed for assistants.",
  },
  {
    title: "AI RAG architecture",
    path: "ai-rag-architecture.md",
    category: "AI",
    summary: "Knowledge Packs, local retrieval and Chicle AI RAG strategy.",
  },
  {
    title: "AI local Ollama",
    path: "ai-local-ollama.md",
    category: "AI",
    summary: "Local runtime with Ollama, models, embeddings and configuration.",
  },
  {
    title: "Dynamic services contract",
    path: "dynamic-services-contract.md",
    category: "Contracts",
    summary:
      "Executable contract for dynamic services, filters, joins, writeMap, tests and publishing.",
  },
  {
    title: "Dynamic forms contract",
    path: "dynamic-forms-contract.md",
    category: "Contracts",
    summary:
      "Dynamic forms contract for steps, fields, actions, persistence and responsive behavior.",
  },
  {
    title: "Flow contract",
    path: "flow-contract.md",
    category: "Contracts",
    summary:
      "Flow contract for triggers, steps, runtime, tests and response shaping.",
  },
  {
    title: "Formly architecture",
    path: "formly-architecture.md",
    category: "Frontend",
    summary: "Formly bridge and declarative multikit rendering.",
  },
  {
    title: "UI presentation architecture",
    path: "ui-presentation-architecture.md",
    category: "Frontend",
    summary: "Presentation architecture, themes, visual kits and adapters.",
  },
  {
    title: "Dynamic grid layout contract",
    path: "dynamic-grid-layout-contract.md",
    category: "Frontend",
    summary:
      "Rules for screen layouts, GridStack design mode, runtime rendering and multikit components.",
  },
  {
    title: "App template factory architecture",
    path: "app-template-factory-architecture.md",
    category: "Architecture",
    summary:
      "Portable app packages, template import/export, screen contracts and artifact generation boundaries.",
  },
  {
    title: "Screen and app designer architecture",
    path: "screen-app-designer-architecture.md",
    category: "Architecture",
    summary:
      "Dynamic app and screen contracts, runtime objects, authoring flow, permissions and template package strategy.",
  },
  {
    title: "App Studio completion roadmap",
    path: "app-studio-completion-roadmap.md",
    category: "Architecture",
    summary:
      "Practical roadmap for finishing the App Studio visualizer, runtime, AI authoring and template packages.",
  },
  {
    title: "UI components",
    path: "ui-components.md",
    category: "Frontend",
    summary: "Reusable component rules, documentation and adoption.",
  },
  {
    title: "UI component inventory",
    path: "ui-component-inventory.md",
    category: "Frontend",
    summary:
      "Inventory of existing visual components and reuse status.",
  },
  {
    title: "UI reuse audit",
    path: "ui-reuse-audit.md",
    category: "Frontend",
    summary: "Visual reuse audit by route and exception.",
  },
  {
    title: "Admin UI reuse audit",
    path: "admin-ui-reuse-audit.md",
    category: "Frontend",
    summary:
      "Admin page audit, reuse percentages and missing reusable components.",
  },
  {
    title: "Admin kit transformation audit",
    path: "admin-kit-transformation-audit.md",
    category: "Frontend",
    summary:
      "Strict multi-kit transformation audit by page and missing components.",
  },
  {
    title: "Backup worker architecture",
    path: "backup-worker-architecture.md",
    category: "Operations",
    summary: "Worker, backup, separable processes and recovery.",
  },
  {
    title: "Angular 20 migration roadmap",
    path: "angular-20-migration-roadmap.md",
    category: "Operations",
    summary: "Audited Angular 20 migration and stabilization path.",
  },
  {
    title: "Angular 20 migration report",
    path: "angular-20-migration-report.md",
    category: "Operations",
    summary: "Installed Angular 20 result and verification.",
  },
];
