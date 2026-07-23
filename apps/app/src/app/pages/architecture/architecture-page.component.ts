import { Component } from '@angular/core';
import {
  DocumentationLayoutComponent,
  DocumentationSection
} from '../../shared/documentation-layout/documentation-layout.component';
import { DocumentationSectionCardComponent } from '../../shared/documentation-layout/documentation-section-card.component';
import {
  ArchitectureBlueprintComponent,
  ArchitectureBlueprintGroup,
  ArchitectureBlueprintLink,
  ArchitectureBlueprintNode
} from '../../shared/architecture-blueprint/architecture-blueprint.component';
import {
  ArchitectureDiagramComponent,
  ArchitectureDiagramLink,
  ArchitectureDiagramNode
} from '../../shared/architecture-diagram/architecture-diagram.component';
import {
  ArchitectureTopologyDiagramComponent,
  ArchitectureTopologyLink,
  ArchitectureTopologyNode,
  ArchitectureTopologyZone
} from '../../shared/architecture-topology-diagram/architecture-topology-diagram.component';

interface ArchitectureMapItem {
  title: string;
  status: string;
  description: string;
  paths: string[];
}

interface DataTableGroup {
  title: string;
  tables: string[];
  notes: string;
}

interface CapacityItem {
  phase: string;
  done: string;
  next: string;
}

interface PrincipleCommandment {
  title: string;
  statement: string;
  how: string[];
}

@Component({
  selector: 'app-architecture-page',
  standalone: true,
  imports: [
    ArchitectureBlueprintComponent,
    ArchitectureDiagramComponent,
    ArchitectureTopologyDiagramComponent,
    DocumentationLayoutComponent,
    DocumentationSectionCardComponent
  ],
  styles: [
    `
      :host {
        display: block;
      }

      .arch-grid,
      .module-grid,
      .precepts-grid,
      .runtime-grid,
      .data-grid,
      .capacity-grid {
        display: grid;
        gap: 12px;
      }

      .arch-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .module-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .precepts-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .runtime-grid,
      .data-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .capacity-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .card,
      .repo-row,
      .contract-row {
        display: grid;
        gap: 10px;
        min-width: 0;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
        padding: 14px;
      }

      .card h3,
      .repo-row h3,
      .contract-row h3 {
        margin: 0;
        color: var(--ch-color-text);
        font-size: 1rem;
        line-height: 1.25;
      }

      .card p,
      .repo-row p,
      .contract-row p,
      .muted {
        margin: 0;
        color: var(--ch-color-muted);
        line-height: 1.52;
      }

      .status {
        justify-self: start;
        border: 1px solid var(--ch-color-primary-border);
        border-radius: 999px;
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-text);
        padding: 4px 8px;
        font-size: 0.75rem;
        font-weight: 850;
      }

      .path-list,
      .plain-list,
      .table-list {
        display: grid;
        gap: 7px;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .path-list li,
      .plain-list li,
      .table-list li {
        min-width: 0;
        border: 1px solid var(--ch-color-border);
        border-radius: calc(var(--ch-radius) - 2px);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        padding: 8px 9px;
        overflow-wrap: anywhere;
      }

      .precepts-grid .card {
        align-content: start;
        gap: 8px;
      }

      .precepts-grid .plain-list {
        gap: 5px;
      }

      .precepts-grid .plain-list li {
        padding: 6px 8px;
      }

      code {
        color: var(--ch-color-text);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
        font-size: 0.88em;
      }

      .diagram-row {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
        align-items: stretch;
      }

      .diagram-node {
        display: grid;
        align-content: start;
        gap: 6px;
        min-height: 92px;
        border: 1px solid var(--ch-color-border);
        border-left: 4px solid var(--ch-color-primary);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 12px;
      }

      .diagram-node strong {
        color: var(--ch-color-text);
      }

      .diagram-node span {
        color: var(--ch-color-muted);
        font-size: 0.86rem;
        line-height: 1.35;
      }

      .arrow {
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--ch-color-muted);
        font-weight: 900;
      }

      .flow-line {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 34px minmax(0, 1fr) 34px minmax(0, 1fr);
        gap: 8px;
        align-items: stretch;
      }

      .repo-map {
        display: grid;
        gap: 10px;
      }

      .contract-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .matrix {
        display: grid;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        overflow: hidden;
      }

      .matrix-row {
        display: grid;
        grid-template-columns: 180px minmax(0, 1fr) minmax(0, 1fr);
      }

      .matrix-row > div {
        border-bottom: 1px solid var(--ch-color-border);
        border-right: 1px solid var(--ch-color-border);
        background: var(--ch-color-surface);
        padding: 10px;
        color: var(--ch-color-muted);
        line-height: 1.45;
      }

      .matrix-row > div:last-child {
        border-right: 0;
      }

      .matrix-row:last-child > div {
        border-bottom: 0;
      }

      .matrix-head > div,
      .matrix-key {
        color: var(--ch-color-text) !important;
        font-weight: 850;
      }

      @media (max-width: 1120px) {
        .arch-grid,
        .runtime-grid,
        .precepts-grid,
        .data-grid,
        .diagram-row {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .flow-line {
          grid-template-columns: 1fr;
        }

        .arrow {
          min-height: 24px;
        }
      }

      @media (max-width: 760px) {
        .arch-grid,
        .module-grid,
        .runtime-grid,
        .precepts-grid,
        .data-grid,
        .capacity-grid,
        .contract-grid,
        .diagram-row {
          grid-template-columns: 1fr;
        }

        .matrix-row {
          grid-template-columns: 1fr;
        }

        .matrix-row > div {
          border-right: 0;
        }
      }
    `
  ],
  template: `
      <app-documentation-layout
      contextLabel="Docs de arquitectura"
      title="Arquitectura técnica de Chicle Engine"
      description="Mapa técnico del monorepo, módulos, runtime dinámico, seguridad, datos, infraestructura, IA, eventos, patrones y microkernel. Esta página le sirve a una persona o a una IA para entender dónde está cada cosa y qué reglas gobiernan a Chicle."
      [sections]="sections"
      navTitle="Arquitectura"
      navAriaLabel="Secciones de arquitectura"
      pickerId="architecture-section"
    >
      <app-documentation-section-card
        sectionId="definicion"
        title="Definición y estilo"
        lead="Chicle no es una app cerrada. Es una plataforma event-driven, metadata-driven y microkernel para construir productos digitales desde contratos versionados, plantillas, runtime dinámico, componentes multi-target y capacidades instalables."
        tone="ops"
      >
        <div class="arch-grid">
          <article class="card">
            <h3>Patrón principal</h3>
            <span class="status">Arquitectura</span>
            <p>
              <strong>Event-driven metadata platform</strong>: una plataforma guiada por eventos y metadata
              versionada, donde servicios, formularios, flows, acciones y pantallas se ejecutan por contrato.
            </p>
          </article>
          <article class="card">
            <h3>Kernel extensible</h3>
            <span class="status">Microkernel</span>
            <p>
              <strong>Microkernel platform</strong>: kernel estable, contratos de extensión, templates, adapters,
              capacidades instalables, compatibilidad y rollback.
            </p>
          </article>
          <article class="card">
            <h3>Modo de ejecución</h3>
            <span class="status">Eventos</span>
            <p>
              <strong>Event-driven runtime</strong>: eventos, runs, outbox, workers, websockets y colas coordinan
              procesos sin romper la consistencia del módulo dueño.
            </p>
          </article>
        </div>
      </app-documentation-section-card>

      <app-documentation-section-card
        sectionId="preceptos"
        title="10 preceptos de Chicle Engine"
        lead="Cada módulo, pantalla, migración, servicio dinámico, flow, formulario, componente visual o integración se justifica contra estos principios. Si una decisión contradice uno, se documenta el motivo o se rediseña."
        tone="critical"
      >
        <div class="precepts-grid">
          @for (item of commandments; track item.title) {
            <article class="card">
              <h3>{{ item.title }}</h3>
              <p>{{ item.statement }}</p>
              <ul class="plain-list">
                @for (rule of item.how; track rule) {
                  <li>{{ rule }}</li>
                }
              </ul>
            </article>
          }
        </div>
      </app-documentation-section-card>

      <app-documentation-section-card
        sectionId="patrones"
        title="Patrones de diseño"
        lead="Chicle usa patrones conocidos para que la flexibilidad no dependa de improvisación. Cada patrón tiene una responsabilidad concreta dentro del admin, el kernel, el runtime y la infraestructura."
        tone="setup"
      >
        <div class="module-grid">
          @for (item of designPatterns; track item.title) {
            <article class="card">
              <h3>{{ item.title }}</h3>
              <span class="status">{{ item.status }}</span>
              <p>{{ item.description }}</p>
              <ul class="path-list">
                @for (path of item.paths; track path) {
                  <li><code>{{ path }}</code></li>
                }
              </ul>
            </article>
          }
        </div>
      </app-documentation-section-card>

      <app-documentation-section-card
        sectionId="diagrama-general"
        title="Diagrama general"
        lead="Dibujo de alto nivel de cómo se conecta el usuario, el front, la API, el runtime dinámico, la base de datos, Chicle AI, eventos e infraestructura."
        tone="security"
      >
        <app-architecture-blueprint
          title="Roadmap del flujo de información"
          description="Recorrido principal: una acción nace en la UI, se valida, entra a la API, ejecuta runtime dinámico, persiste datos y emite eventos observables."
          badge="Flujo vivo"
          [groups]="blueprintGroups"
          [nodes]="blueprintNodes"
          [links]="blueprintLinks"
        ></app-architecture-blueprint>

        <app-architecture-topology-diagram
          title="Topología visual de comunicación"
          description="Vista tipo draw.io: el Admin administra, diseña y configura; las apps de negocio ejecutan lo publicado. Todo entra por tenant, pasa al API Kernel, ejecuta Runtime y persiste en DB."
          badge="Comunicación"
          [zones]="topologyZones"
          [nodes]="topologyNodes"
          [links]="topologyLinks"
        ></app-architecture-topology-diagram>

        <app-architecture-diagram
          title="Mapa técnico de Chicle"
          description="Nodos principales, ubicación en el monorepo y relaciones de ejecución."
          badge="Sistema vivo"
          linksTitle="Cómo se comunican"
          [nodes]="systemDiagramNodes"
          [links]="systemDiagramLinks"
        ></app-architecture-diagram>
      </app-documentation-section-card>

      <app-documentation-section-card
        sectionId="monorepo"
        title="Monorepo y ubicación"
        lead="Dónde vive cada parte importante del proyecto. Esta sección funciona como mapa rápido para cualquier nuevo desarrollador o asistente IA."
        tone="setup"
      >
        <div class="repo-map">
          @for (item of repoMap; track item.title) {
            <article class="repo-row">
              <h3>{{ item.title }}</h3>
              <span class="status">{{ item.status }}</span>
              <p>{{ item.description }}</p>
              <ul class="path-list">
                @for (path of item.paths; track path) {
                  <li><code>{{ path }}</code></li>
                }
              </ul>
            </article>
          }
        </div>
      </app-documentation-section-card>

      <app-documentation-section-card
        sectionId="backend"
        title="Backend API"
        lead="NestJS actúa como kernel API modular. Cada módulo expone controller, service, entidades TypeORM, contratos, eventos y validaciones de permisos/tenant cuando corresponde."
        tone="security"
      >
        <div class="module-grid">
          @for (item of backendModules; track item.title) {
            <article class="card">
              <h3>{{ item.title }}</h3>
              <span class="status">{{ item.status }}</span>
              <p>{{ item.description }}</p>
              <ul class="path-list">
                @for (path of item.paths; track path) {
                  <li><code>{{ path }}</code></li>
                }
              </ul>
            </article>
          }
        </div>
      </app-documentation-section-card>

      <app-documentation-section-card
        sectionId="frontend"
        title="Frontend y componentes"
        lead="El admin usa componentes reutilizables. Las páginas consumen componentes compartidos para mantener navegación, formularios, catálogos, previews y estados visuales consistentes."
        tone="setup"
      >
        <div class="module-grid">
          @for (item of frontendModules; track item.title) {
            <article class="card">
              <h3>{{ item.title }}</h3>
              <span class="status">{{ item.status }}</span>
              <p>{{ item.description }}</p>
              <ul class="path-list">
                @for (path of item.paths; track path) {
                  <li><code>{{ path }}</code></li>
                }
              </ul>
            </article>
          }
        </div>
      </app-documentation-section-card>

      <app-documentation-section-card
        sectionId="runtime"
        title="Runtime dinámico"
        lead="Aquí está el corazón low-code: objetos declarativos versionados que el backend y el frontend interpretan sin crear implementación específica por cada caso de negocio."
        tone="ops"
      >
        <div class="runtime-grid">
          @for (item of runtimeModules; track item.title) {
            <article class="card">
              <h3>{{ item.title }}</h3>
              <span class="status">{{ item.status }}</span>
              <p>{{ item.description }}</p>
              <ul class="path-list">
                @for (path of item.paths; track path) {
                  <li><code>{{ path }}</code></li>
                }
              </ul>
            </article>
          }
        </div>
      </app-documentation-section-card>

      <app-documentation-section-card
        sectionId="contratos-json"
        title="Contratos JSON"
        lead="Servicios, formularios y flows se crean desde interfaz guiada o JSON puro. El mismo contrato alimenta Chicle AI, templates instalables, pruebas y publicación."
        tone="ops"
      >
        <div class="contract-grid">
          @for (item of contracts; track item.title) {
            <article class="contract-row">
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
              <ul class="path-list">
                @for (path of item.paths; track path) {
                  <li><code>{{ path }}</code></li>
                }
              </ul>
            </article>
          }
        </div>
      </app-documentation-section-card>

      <app-documentation-section-card
        sectionId="datos"
        title="Modelo de datos"
        lead="La base usa tablas core, tablas tenant-scoped, tablas globales, tablas de runtime y tablas custom administradas desde el DB designer."
        tone="security"
      >
        <div class="data-grid">
          @for (group of dataGroups; track group.title) {
            <article class="card">
              <h3>{{ group.title }}</h3>
              <p>{{ group.notes }}</p>
              <ul class="table-list">
                @for (table of group.tables; track table) {
                  <li><code>{{ table }}</code></li>
                }
              </ul>
            </article>
          }
        </div>
      </app-documentation-section-card>

      <app-documentation-section-card
        sectionId="seguridad"
        title="Seguridad y tenant scope"
        lead="La seguridad está pensada por capas: autenticación, sesión, tenant actual, roles, permisos, políticas por recurso y controles visuales."
        tone="critical"
      >
        <div class="matrix">
          <div class="matrix-row matrix-head">
            <div>Capa</div>
            <div>Hecho</div>
            <div>Extensión configurable</div>
          </div>
          <div class="matrix-row">
            <div class="matrix-key">Auth</div>
            <div>Login, JWT, refresh cookie, sesiones, guards y usuario actual.</div>
            <div>Adaptadores MFA, OAuth2/OIDC, passkeys, device trust y políticas por organización.</div>
          </div>
          <div class="matrix-row">
            <div class="matrix-key">RBAC</div>
            <div>Roles, permisos, asignación de roles, pantalla admin y permisos por módulo.</div>
            <div>Políticas por servicio, flow, formulario, pantalla, acción y recurso dinámico.</div>
          </div>
          <div class="matrix-row">
            <div class="matrix-key">Tenant</div>
            <div>Tenant actual, tenant memberships y filtros por <code>tenantId</code>.</div>
            <div>Segmentación por cliente, persona, comercio, producto instalado y contexto operativo.</div>
          </div>
          <div class="matrix-row">
            <div class="matrix-key">Producción</div>
            <div>Swagger configurable, defaults seguros y confisys.</div>
            <div>Headers, rate limits, secrets, auditoría ampliada y controles alineados con OWASP.</div>
          </div>
        </div>
      </app-documentation-section-card>

      <app-documentation-section-card
        sectionId="infraestructura"
        title="Infraestructura"
        lead="Chicle usa Docker para empaquetar artefactos y llevarlos al servidor. La operación de plataforma separa configuración por defaults, env y Confisys; auditoría, calidad y rendimiento se gestionan desde herramientas propias de Chicle."
        tone="setup"
      >
        <div class="arch-grid">
          <article class="card">
            <h3>Artefactos actuales</h3>
            <ul class="plain-list">
              <li><code>api</code>: NestJS + TypeORM.</li>
              <li><code>db</code>: MariaDB 11.</li>
              <li><code>ollama</code>: runtime local de IA.</li>
            </ul>
          </article>
          <article class="card">
            <h3>Archivos</h3>
            <ul class="path-list">
              <li><code>infra/docker/docker-compose.yml</code></li>
              <li><code>infra/docker/.env.example</code></li>
              <li><code>apps/api/src/database/migrations</code></li>
            </ul>
          </article>
          <article class="card">
            <h3>Procesos separables</h3>
            <ul class="plain-list">
              <li>Worker/backup independiente.</li>
              <li>Storage MinIO o compatible S3.</li>
              <li>Artefactos versionados para API, app, DB, storage, workers y soporte operativo.</li>
            </ul>
          </article>
        </div>
      </app-documentation-section-card>

      <app-documentation-section-card
        sectionId="ia-rag"
        title="Chicle AI y RAG"
        lead="La IA actúa como asistente de configuración, no como runtime crítico. Propone drafts, hace preguntas guiadas y aplica cambios visuales con aprobación del usuario."
        tone="security"
      >
        <div class="flow-line">
          <div class="diagram-node">
            <strong>Pregunta del usuario</strong>
            <span>Servicios, flows, formularios, DB designer, componentes o arquitectura.</span>
          </div>
          <div class="arrow">→</div>
          <div class="diagram-node">
            <strong>Interpretación + contexto</strong>
            <span>Catálogo real, docs, ejemplos JSON, tenant, permisos y estado de pantalla.</span>
          </div>
          <div class="arrow">→</div>
          <div class="diagram-node">
            <strong>Draft revisable</strong>
            <span>La pantalla recibe propuesta, JSON editable y pasos confirmables; no publica sin confirmación.</span>
          </div>
        </div>
        <p class="muted">
          Runtime local: <code>Ollama</code>, modelo local, embeddings locales y Knowledge Pack versionado. La IA
          conserva modo guiado cuando el modelo local tarda o no responde.
        </p>
      </app-documentation-section-card>

      <app-documentation-section-card
        sectionId="event-driven"
        title="Event-driven y asincronía"
        lead="Chicle organiza la asincronía con eventos internos, outbox, runs observables y procesos separables. La consistencia inmediata queda en el módulo dueño de la operación."
        tone="ops"
      >
        <div class="diagram-row">
          <div class="diagram-node">
            <strong>Registro</strong>
            <span>Audit events, dynamic service runs, flow runs, record events y eventos de outbox creados por módulos.</span>
          </div>
          <div class="diagram-node">
            <strong>Procesamiento</strong>
            <span>Outbox processor, jobs, reintentos, workers y estado en vivo por websocket.</span>
          </div>
          <div class="diagram-node">
            <strong>Operación</strong>
            <span>Procesos async largos, sync offline, backup worker, notificaciones e integraciones pesadas.</span>
          </div>
          <div class="diagram-node">
            <strong>Regla</strong>
            <span>El evento coordina; la transacción del módulo sigue siendo dueña de la consistencia inmediata.</span>
          </div>
        </div>
      </app-documentation-section-card>

      <app-documentation-section-card
        sectionId="microkernel"
        title="Microkernel y plugins"
        lead="Chicle instala capacidades sin modificar el core. El core provee contratos; los plugins/templates aportan negocio, UI, datos, flujos y acciones."
        tone="setup"
      >
        <div class="matrix">
          <div class="matrix-row matrix-head">
            <div>Elemento</div>
            <div>Kernel</div>
            <div>Plugin / template</div>
          </div>
          <div class="matrix-row">
            <div class="matrix-key">Seguridad</div>
            <div>Auth, tenant scope, permisos, sesiones, auditoría.</div>
            <div>Roles iniciales, permisos de producto, políticas específicas.</div>
          </div>
          <div class="matrix-row">
            <div class="matrix-key">Runtime</div>
            <div>Contratos de servicios, forms, flows, actions y records.</div>
            <div>Servicios, formularios, pantallas, workflows y acciones de negocio.</div>
          </div>
          <div class="matrix-row">
            <div class="matrix-key">UI</div>
            <div>Componentes base, adaptadores visuales, tokens, preview responsive.</div>
            <div>Temas, componentes especializados, layouts de producto.</div>
          </div>
          <div class="matrix-row">
            <div class="matrix-key">Instalación</div>
            <div>Registry, manifest, dependencias, rollback y compatibilidad.</div>
            <div>Seeds, migrations controladas, assets, docs y ejemplos.</div>
          </div>
        </div>
      </app-documentation-section-card>

      <app-documentation-section-card
        sectionId="capacidades"
        title="Mapa de capacidades"
        lead="Resumen de los dominios arquitectónicos de Chicle y la garantía que cada uno aporta al sistema."
        tone="critical"
      >
        <div class="capacity-grid">
          @for (item of capabilities; track item.phase) {
            <article class="card">
              <h3>{{ item.phase }}</h3>
              <p><strong>Base:</strong> {{ item.done }}</p>
              <p><strong>Garantía:</strong> {{ item.next }}</p>
            </article>
          }
        </div>
      </app-documentation-section-card>

      <app-documentation-section-card
        sectionId="fuentes"
        title="Fuentes vivas"
        lead="Esta página resume decisiones repartidas en documentos existentes. Cuando cambie un contrato técnico, debe actualizarse el documento fuente y esta vista."
        tone="ops"
      >
        <div class="contract-grid">
          @for (item of sourceDocs; track item.title) {
            <article class="contract-row">
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
              <ul class="path-list">
                @for (path of item.paths; track path) {
                  <li><code>{{ path }}</code></li>
                }
              </ul>
            </article>
          }
        </div>
      </app-documentation-section-card>
    </app-documentation-layout>
  `
})
export class ArchitecturePageComponent {
  readonly sections: DocumentationSection[] = [
    { id: 'definicion', label: 'Definición', summary: 'Patrón, estilo y dirección.' },
    { id: 'preceptos', label: '10 preceptos', summary: 'La brújula técnica del proyecto.' },
    { id: 'patrones', label: 'Patrones', summary: 'Patrones de diseño aplicados.' },
    { id: 'diagrama-general', label: 'Diagrama general', summary: 'Vista de alto nivel.' },
    { id: 'monorepo', label: 'Monorepo', summary: 'Ubicación de cada parte.' },
    { id: 'backend', label: 'Backend API', summary: 'Módulos NestJS y responsabilidades.' },
    { id: 'frontend', label: 'Frontend', summary: 'Páginas, componentes y UI kits.' },
    { id: 'runtime', label: 'Runtime dinámico', summary: 'Servicios, forms, flows y actions.' },
    { id: 'contratos-json', label: 'Contratos JSON', summary: 'Autoría guiada y JSON only.' },
    { id: 'datos', label: 'Modelo de datos', summary: 'Tablas core, dinámicas y custom.' },
    { id: 'seguridad', label: 'Seguridad', summary: 'Auth, RBAC, tenant y producción.' },
    { id: 'infraestructura', label: 'Infraestructura', summary: 'Docker, env, DB y despliegue.' },
    { id: 'ia-rag', label: 'Chicle AI/RAG', summary: 'Asistente, contexto y modelos locales.' },
    { id: 'event-driven', label: 'Event-driven', summary: 'Eventos, outbox y workers.' },
    { id: 'microkernel', label: 'Microkernel', summary: 'Kernel, plugins y templates.' },
    { id: 'capacidades', label: 'Capacidades', summary: 'Mapa de dominios arquitectónicos.' },
    { id: 'fuentes', label: 'Fuentes', summary: 'Documentos técnicos relacionados.' }
  ];

  readonly blueprintGroups: ArchitectureBlueprintGroup[] = [
    {
      title: '1. Admin y canales de negocio',
      summary: 'El admin gobierna lo configurable; las apps web, móvil y desktop ejecutan la experiencia de negocio.',
      nodeIds: ['designers', 'front'],
      flowLabel: 'El admin publica contratos; las apps consumen acciones autenticadas por la API.',
      tone: 'front'
    },
    {
      title: '2. Control de acceso',
      summary: 'Chicle decide quién es el usuario, en qué tenant opera y qué puede ejecutar.',
      nodeIds: ['security'],
      flowLabel: 'Solo las operaciones autorizadas pasan al kernel API.',
      tone: 'security'
    },
    {
      title: '3. Kernel y runtime dinámico',
      summary: 'La API recibe la operación y el runtime interpreta contratos versionados.',
      nodeIds: ['api', 'runtime'],
      flowLabel: 'El runtime lee/escribe datos y registra la ejecución.',
      tone: 'api'
    },
    {
      title: '4. Estado, trazabilidad y asincronía',
      summary: 'La base conserva el estado; los eventos coordinan runs, outbox, jobs y reintentos.',
      nodeIds: ['db', 'events'],
      flowLabel: 'La operación devuelve respuesta a la UI y deja trazabilidad.',
      tone: 'data'
    },
    {
      title: '5. Soporte inteligente y operación',
      summary: 'IA, artefactos Docker, workers, backup, auditoría, calidad y rendimiento acompañan el ciclo sin saltarse permisos ni contratos.',
      nodeIds: ['ai', 'infra'],
      tone: 'ai'
    }
  ];

  readonly blueprintNodes: ArchitectureBlueprintNode[] = [
    {
      id: 'front',
      title: 'Apps negocio',
      subtitle: 'Web / móvil / desktop',
      step: '1',
      description: 'Los usuarios finales operan las pantallas de negocio configuradas: web, app móvil o escritorio.',
      icon: 'pi pi-window-maximize',
      tone: 'front',
      x: 4,
      y: 52,
      width: 14,
      height: 20,
      bullets: ['web', 'móvil', 'desktop']
    },
    {
      id: 'designers',
      title: 'Admin',
      subtitle: 'Owner / Admin',
      step: '1B',
      description: 'Consola administrable, diseñable y configurable: seguridad, tenants, servicios, formularios, flows, DB, preferencias y componentes.',
      icon: 'pi pi-pencil',
      tone: 'front',
      x: 4,
      y: 18,
      width: 14,
      height: 22,
      bullets: ['admin', 'diseño', 'config']
    },
    {
      id: 'security',
      title: 'Auth + RBAC + Tenant',
      subtitle: 'Seguridad transversal',
      step: '2',
      description: 'Cada request valida sesión, tenant actual, roles, permisos y políticas por recurso.',
      icon: 'pi pi-shield',
      tone: 'security',
      x: 24,
      y: 22,
      width: 14,
      height: 20,
      bullets: ['JWT', 'RBAC', 'tenant']
    },
    {
      id: 'api',
      title: 'API NestJS',
      subtitle: 'Kernel modular',
      step: '3',
      description: 'El kernel recibe la operación, aplica límites, confisys, validación y contratos backend.',
      icon: 'pi pi-server',
      tone: 'api',
      x: 44,
      y: 16,
      width: 16,
      height: 20,
      bullets: ['modules', 'guards', 'limits']
    },
    {
      id: 'runtime',
      title: 'Runtime dinámico',
      subtitle: 'Metadata versionada',
      step: '4',
      description: 'Interpreta servicios, formularios, flows, actions, bindings, versiones y pruebas reales.',
      icon: 'pi pi-bolt',
      tone: 'runtime',
      x: 44,
      y: 48,
      width: 16,
      height: 22,
      bullets: ['services', 'forms', 'flows']
    },
    {
      id: 'db',
      title: 'MariaDB',
      subtitle: 'Persistencia',
      step: '5',
      description: 'Guarda core, tenant data, objetos dinámicos, versiones, records, runs y custom_*.',
      icon: 'pi pi-database',
      tone: 'data',
      x: 68,
      y: 18,
      width: 14,
      height: 21,
      bullets: ['core', 'runtime', 'custom_*']
    },
    {
      id: 'events',
      title: 'Event engine',
      subtitle: 'Asincronía',
      step: '6',
      description: 'Registra eventos, runs, outbox, jobs, reintentos, workers y estado en vivo.',
      icon: 'pi pi-share-alt',
      tone: 'event',
      x: 68,
      y: 52,
      width: 14,
      height: 21,
      bullets: ['outbox', 'jobs', 'SSE']
    },
    {
      id: 'ai',
      title: 'Chicle AI / Ollama',
      subtitle: 'Asistente local',
      step: 'A',
      description: 'Acompaña a la UI: interpreta intención, consulta contexto y propone drafts revisables.',
      icon: 'pi pi-sparkles',
      tone: 'ai',
      x: 86,
      y: 18,
      width: 11,
      height: 23,
      bullets: ['RAG', 'drafts', 'JSON']
    },
    {
      id: 'infra',
      title: 'Docker / Artefactos',
      subtitle: 'Ejecución',
      step: 'B',
      description: 'Empaqueta y entrega artefactos: API, app, DB, Ollama, workers, backup y procesos de soporte.',
      icon: 'pi pi-box',
      tone: 'infra',
      x: 86,
      y: 56,
      width: 11,
      height: 22,
      bullets: ['build', 'deploy', 'backup']
    }
  ];

  readonly blueprintLinks: ArchitectureBlueprintLink[] = [
    { from: 'front', to: 'security', label: '1. request', kind: 'sync' },
    { from: 'security', to: 'api', label: '2. contexto autorizado', kind: 'sync' },
    { from: 'api', to: 'runtime', label: '3. contrato', kind: 'sync' },
    { from: 'runtime', to: 'db', label: '4. lectura/escritura', kind: 'data' },
    { from: 'runtime', to: 'events', label: '5. runs/outbox', kind: 'async' },
    { from: 'events', to: 'db', label: '6. trazabilidad', kind: 'data' },
    { from: 'designers', to: 'runtime', label: 'contratos JSON', kind: 'sync' },
    { from: 'ai', to: 'designers', label: 'propuesta IA', kind: 'ai' },
    { from: 'infra', to: 'api', label: 'contenedores', kind: 'infra' },
    { from: 'infra', to: 'events', label: 'workers', kind: 'infra' }
  ];

  readonly topologyZones: ArchitectureTopologyZone[] = [
    { title: 'Admin y apps componentizadas', x: 4, y: 8, width: 19, height: 56, tone: 'front' },
    { title: 'Tenant / Seguridad', x: 29, y: 8, width: 16, height: 56, tone: 'security' },
    { title: 'API + Runtime', x: 51, y: 8, width: 19, height: 56, tone: 'api' },
    { title: 'Estado', x: 76, y: 8, width: 20, height: 56, tone: 'data' },
    { title: 'Soporte operativo', x: 4, y: 71, width: 92, height: 23, tone: 'infra' }
  ];

  readonly topologyNodes: ArchitectureTopologyNode[] = [
    { id: 'admin', title: 'Admin', subtitle: 'Owner / diseño / configuración', icon: 'pi pi-desktop', tone: 'front', x: 13.5, y: 25 },
    { id: 'businessApps', title: 'Apps de negocio', subtitle: 'Apps web / móvil / desktop', icon: 'pi pi-window-maximize', tone: 'front', x: 13.5, y: 52 },
    { id: 'auth', title: 'Auth / RBAC', subtitle: 'Tenant', icon: 'pi pi-shield', tone: 'security', x: 37, y: 38.5 },
    { id: 'api', title: 'API Kernel', subtitle: 'NestJS modular', icon: 'pi pi-server', tone: 'api', x: 60.5, y: 25 },
    { id: 'runtime', title: 'Runtime', subtitle: 'Services / Forms / Flows', icon: 'pi pi-bolt', tone: 'runtime', x: 60.5, y: 52 },
    { id: 'db', title: 'MariaDB', subtitle: 'Core + custom_*', icon: 'pi pi-database', tone: 'data', x: 86, y: 34 },
    { id: 'events', title: 'Event Engine', subtitle: 'Outbox / Jobs', icon: 'pi pi-share-alt', tone: 'event', x: 86, y: 57 },
    { id: 'ai', title: 'Chicle AI', subtitle: 'Ollama / RAG', icon: 'pi pi-sparkles', tone: 'ai', x: 13.5, y: 83 },
    { id: 'docker', title: 'Docker', subtitle: 'Artefactos / deploy', icon: 'pi pi-box', tone: 'infra', x: 37, y: 83 },
    { id: 'worker', title: 'Workers', subtitle: 'Async / Backup', icon: 'pi pi-cog', tone: 'infra', x: 60.5, y: 83 },
    { id: 'assurance', title: 'Auditoría + rendimiento', subtitle: 'Seguridad / calidad / API', icon: 'pi pi-chart-line', tone: 'infra', x: 86, y: 83 }
  ];

  readonly topologyLinks: ArchitectureTopologyLink[] = [
    { from: 'admin', to: 'auth', label: 'sesión + permisos', kind: 'security' },
    { from: 'businessApps', to: 'auth', label: 'sesión de negocio', kind: 'security' },
    { from: 'auth', to: 'api', label: 'guards', kind: 'sync' },
    { from: 'api', to: 'runtime', label: 'execute', kind: 'sync' },
    { from: 'runtime', to: 'db', label: 'TypeORM', kind: 'data' },
    { from: 'runtime', to: 'events', label: 'runs/outbox', kind: 'async' },
    { from: 'events', to: 'db', label: 'audit', kind: 'data' },
    { from: 'ai', to: 'admin', label: 'asistente', kind: 'ai' },
    { from: 'docker', to: 'api', label: 'artefactos', kind: 'infra' },
    { from: 'worker', to: 'events', label: 'claims', kind: 'infra' },
    { from: 'assurance', to: 'api', label: 'seguridad/calidad/rendimiento', kind: 'infra' }
  ];

  readonly systemDiagramNodes: ArchitectureDiagramNode[] = [
    {
      id: 'app',
      title: 'Apps de negocio',
      eyebrow: 'Web / móvil / desktop',
      description: 'Apps web, móviles y desktop que ejecutan pantallas, formularios, servicios y flujos publicados por el admin a través de la API; también se entregan como artefactos desplegables.',
      icon: 'pi pi-desktop',
      status: 'Multi-target',
      tone: 'ui',
      paths: ['apps/app/src/app/pages', 'apps/app/src/app/shared', 'apps/app/src/app/engine']
    },
    {
      id: 'designers',
      title: 'Admin',
      eyebrow: 'Administración + construcción',
      description: 'Consola owner/admin para seguridad, tenants, preferencias, componentes, servicios, formularios, flows, DB designer y configuración del back.',
      icon: 'pi pi-pencil',
      status: 'Diseño guiado + JSON',
      tone: 'ui',
      paths: ['apps/app/src/app/pages/services', 'apps/app/src/app/pages/forms', 'apps/app/src/app/pages/flows']
    },
    {
      id: 'api',
      title: 'NestJS API',
      eyebrow: 'Kernel',
      description: 'Módulos de dominio, guards, tenant scope, RBAC, validadores, TypeORM y runtime backend.',
      icon: 'pi pi-server',
      status: 'Kernel modular',
      tone: 'core',
      paths: ['apps/api/src/modules', 'apps/api/src/app.module.ts']
    },
    {
      id: 'runtime',
      title: 'Runtime dinámico',
      eyebrow: 'Metadata',
      description: 'Ejecuta servicios, formularios, actions, flows, records, bindings y contratos versionados.',
      icon: 'pi pi-bolt',
      status: 'Declarativo',
      tone: 'runtime',
      paths: ['apps/api/src/modules/dynamic-services', 'apps/api/src/modules/dynamic-forms', 'apps/api/src/modules/flows']
    },
    {
      id: 'db',
      title: 'MariaDB',
      eyebrow: 'Datos',
      description: 'Tablas core, tenant scope, runtime objects, records JSON, runs, audit y custom_*.',
      icon: 'pi pi-database',
      status: 'Persistencia',
      tone: 'data',
      paths: ['apps/api/src/database', 'apps/api/src/database/migrations']
    },
    {
      id: 'ai',
      title: 'Chicle AI',
      eyebrow: 'Asistente',
      description: 'Chat flotante, Ollama local, drafts guiados, validación de contexto y Knowledge Pack.',
      icon: 'pi pi-sparkles',
      status: 'Asistencia',
      tone: 'ai',
      paths: ['apps/api/src/modules/ai-assistant', 'apps/app/src/app/shared/ai-assistant-launcher']
    },
    {
      id: 'events',
      title: 'Event engine',
      eyebrow: 'Asincronía',
      description: 'Audit events, service runs, flow runs, outbox, jobs, workers, reintentos y websockets.',
      icon: 'pi pi-share-alt',
      status: 'Event-driven',
      tone: 'event',
      paths: ['apps/api/src/modules/audit', 'apps/api/src/modules/flows', 'apps/api/src/modules/dynamic-services']
    },
    {
      id: 'infra',
      title: 'Docker / Artefactos',
      eyebrow: 'Ejecución',
      description: 'Empaquetado, artefactos, despliegue al servidor, env, puertos, procesos separables, storage, worker y backup.',
      icon: 'pi pi-box',
      status: 'Build/deploy',
      tone: 'infra',
      paths: ['infra/docker/docker-compose.yml', 'infra/docker/.env.example']
    }
  ];

  readonly systemDiagramLinks: ArchitectureDiagramLink[] = [
    {
      from: 'app',
      to: 'api',
      label: 'HTTP + Auth',
      description: 'La app consume endpoints protegidos con sesión, permisos y tenant actual.'
    },
    {
      from: 'designers',
      to: 'runtime',
      label: 'JSON contracts',
      description: 'Los designers generan metadata versionada para servicios, forms, flows y acciones.'
    },
    {
      from: 'api',
      to: 'db',
      label: 'TypeORM',
      description: 'El backend valida y persiste entidades core, runtime y tablas custom controladas.'
    },
    {
      from: 'ai',
      to: 'designers',
      label: 'Drafts',
      description: 'La IA propone cambios revisables sobre la pantalla activa, sin publicar automáticamente.'
    },
    {
      from: 'runtime',
      to: 'events',
      label: 'Runs + outbox',
      description: 'Cada ejecución relevante deja trazabilidad, estado, error y duración.'
    },
    {
      from: 'infra',
      to: 'api',
      label: 'Artefactos',
      description: 'Docker empaqueta API, app, Ollama y procesos separables para despliegue controlado.'
    }
  ];

  readonly commandments: PrincipleCommandment[] = [
    {
      title: '1. Flexible',
      statement:
        'Chicle satisface necesidades distintas de clientes distintos, incluso cuando el problema de negocio es muy específico.',
      how: [
        'Convertir requerimientos particulares en templates, servicios, formularios, flows, pantallas o capacidades configurables.',
        'Evitar que una solución de cliente contamine el core o bloquee otros tipos de producto.',
        'Permitir variaciones por tenant, vertical de negocio, dispositivo, proceso, permisos, datos y experiencia visual.'
      ]
    },
    {
      title: '2. Adaptable',
      statement:
        'Chicle se integra con distintos estilos de arquitectura, infraestructuras, proveedores y formas de despliegue sin perder su identidad.',
      how: [
        'Convivir con arquitecturas monolíticas, modulares, event-driven, microkernel, workers o microservicios.',
        'Separar contratos de implementación para storage, IA, autenticación, integraciones, dispositivos y mensajería.',
        'Mantener defaults simples, pero permitir reemplazar piezas por configuración, plugin, adapter o despliegue.'
      ]
    },
    {
      title: '3. Reutilizable',
      statement:
        'Nada importante queda como lógica aislada cuando puede convertirse en módulo, componente, servicio, contrato, adapter o capacidad reutilizable.',
      how: [
        'Crear módulos backend reutilizables para auth, tenants, RBAC, auditoría, confisys, runtime dinámico, eventos y datos.',
        'Crear componentes compartidos para catálogos, workspaces, docs, campos, previews, formularios móviles y flujos guiados.',
        'Reutilizar clientes dinámicos para services, forms, flows y actions.',
        'Documentar cada módulo o componente reutilizable en la arquitectura, el catálogo visual y la guía técnica.'
      ]
    },
    {
      title: '4. Calidad',
      statement: 'El proyecto es fácil de leer, probar, extender y depurar incluso cuando el runtime dinámico crece.',
      how: [
        'Mantener módulos pequeños, nombres claros y responsabilidades explícitas.',
        'Agregar pruebas donde haya riesgo: seguridad, runtime dinámico, DB designer, IA y migraciones.',
        'Evitar atajos que rompan contratos, tipos o mantenibilidad.'
      ]
    },
    {
      title: '5. Seguro',
      statement: 'La flexibilidad nunca abre huecos: todo runtime dinámico opera con permisos, tenant scope, validación y auditoría.',
      how: [
        'No ejecutar SQL libre ni JavaScript arbitrario desde la base de datos.',
        'Validar tablas, campos, servicios, flows, permisos y límites en backend.',
        'Proteger Swagger, reset, DB designer, schema changes, AI tools y acciones sensibles.'
      ]
    },
    {
      title: '6. Administrable',
      statement: 'Lo que existe se puede ver, entender, configurar, auditar, restaurar y operar desde el admin.',
      how: [
        'Preferir pantallas guiadas con JSON editable, historial, papelera y pruebas en vivo.',
        'Exponer estados claros: creado, draft, versionado, publicado, fallido, retenido o restaurable.',
        'Centralizar preferencias, confisys, usuarios, roles, permisos, servicios, forms, flows y datos.'
      ]
    },
    {
      title: '7. Escalable',
      statement:
        'Chicle escala vertical y horizontalmente en usuarios, tenants, jobs, eventos, integraciones y volumen de datos.',
      how: [
        'Escalar verticalmente optimizando consultas, índices, cachés en memoria, límites, timeouts y uso eficiente de conexiones.',
        'Escalar horizontalmente separando API, app, workers, colas, storage, backup y procesos async por contrato.',
        'Cuidar concurrencia, idempotencia, locks, cuellos de botella, saturación de DB, pérdida de rendimiento y reintentos.',
        'Preparar registry de plugins/templates y límites configurables por proceso, tenant e integración.'
      ]
    },
    {
      title: '8. Fiable y resiliente',
      statement:
        'El sistema se comporta de forma predecible, observable y recuperable, incluso ante fallos de red, IA, integraciones, workers o configuración incompleta.',
      how: [
        'Registrar runs, errores, duración, auditoría, eventos e idempotency keys.',
        'Probar CRUD real, submit real, migraciones, restauraciones y flujos principales.',
        'Mostrar errores accionables al usuario y no ocultar fallas del runtime.',
        'Tener defaults si env o confisys no están disponibles.',
        'Permitir fallback guiado cuando Ollama/IA falle o tarde demasiado.',
        'Preparar offline sync, colas, reintentos, outbox, backup y restauración.'
      ]
    },
    {
      title: '9. Extensible',
      statement:
        'Chicle crece por contratos de extensión: plugins, templates, adapters, capabilities, actions, servicios, formularios, flows, componentes y migraciones controladas.',
      how: [
        'Mantener un kernel estable que expone puntos de extensión claros y versionados.',
        'Instalar necesidades de negocio como capacidades declarativas antes de tocar el core.',
        'Permitir que cada extensión declare permisos, dependencias, assets, datos, contratos, pruebas, rollback y compatibilidad.'
      ]
    },
    {
      title: '10. Inteligente',
      statement: 'La IA reduce complejidad sin tomar control peligroso: propone, explica, pregunta, valida y aplica drafts revisables.',
      how: [
        'Usar contexto real: documentación, catálogo de tablas, servicios publicados, flows, formularios y permisos.',
        'Generar JSON correcto para services, forms, flows, DB designer y pantallas dinámicas.',
        'Aprender del flujo conversacional y dividir tareas complejas en pasos confirmables.'
      ]
    }
  ];

  readonly designPatterns: ArchitectureMapItem[] = [
    {
      title: 'Event-Driven Platform',
      status: 'Patrón principal',
      description:
        'Los módulos registran eventos, runs y outbox para coordinar procesos, auditoría, reintentos e integraciones sin acoplar dominios.',
      paths: ['apps/api/src/modules/audit', 'apps/api/src/modules/flows', 'apps/api/src/modules/dynamic-services']
    },
    {
      title: 'Metadata-Driven Architecture',
      status: 'Runtime dinámico',
      description: 'Servicios, formularios, flows, acciones, presentación y templates se expresan como metadata versionada.',
      paths: ['docs/dynamic-services-contract.md', 'docs/dynamic-forms-contract.md', 'docs/flow-contract.md']
    },
    {
      title: 'Microkernel',
      status: 'Kernel extensible',
      description: 'El kernel conserva contratos estables y las capacidades se instalan como plugins, templates o adapters.',
      paths: ['docs/platform-architecture.md', 'docs/decisions.md']
    },
    {
      title: 'Modular Kernel',
      status: 'Organización interna',
      description:
        'El backend se organiza por módulos con fronteras claras, servicios de aplicación, entidades propias y contratos públicos.',
      paths: ['apps/api/src/modules', 'apps/api/src/app.module.ts']
    },
    {
      title: 'Adapter / Strategy',
      status: 'Integraciones',
      description: 'Storage, IA, auth, UI kits, servicios externos y dispositivos cambian por adapter sin alterar el contrato central.',
      paths: ['apps/app/src/app/core/ui', 'apps/api/src/modules/ai-assistant', 'apps/api/src/modules/files']
    },
    {
      title: 'Repository + Service Layer',
      status: 'Datos y reglas',
      description: 'TypeORM maneja persistencia; los services concentran reglas, validación, auditoría y tenant scope.',
      paths: ['apps/api/src/modules/*/*.service.ts', 'apps/api/src/modules/*/*.entity.ts']
    },
    {
      title: 'Policy / Guard',
      status: 'Seguridad',
      description: 'Los guards, permisos, roles, policies y tenant scope protegen endpoints y recursos dinámicos.',
      paths: ['apps/api/src/modules/auth/guards', 'apps/api/src/modules/rbac']
    },
    {
      title: 'Outbox / Event Log',
      status: 'Asincronía',
      description: 'Los eventos, runs y outbox registran cambios y coordinan procesos sin mezclar transacciones de dominio.',
      paths: ['apps/api/src/modules/audit', 'apps/api/src/modules/flows', 'apps/api/src/modules/dynamic-services']
    },
    {
      title: 'Schema Registry / Contract First',
      status: 'JSON authoring',
      description: 'Cada objeto dinámico tiene contrato, ejemplos, validación, versionado, publicación y pruebas.',
      paths: ['docs/examples', 'docs/ai-authoring-guide.md']
    }
  ];

  readonly repoMap: ArchitectureMapItem[] = [
    {
      title: 'API',
      status: 'NestJS',
      description: 'Backend modular, TypeORM, seguridad, runtime dinámico y endpoints administrativos.',
      paths: ['apps/api/src/app.module.ts', 'apps/api/src/modules', 'apps/api/src/database']
    },
    {
      title: 'App',
      status: 'Angular 20 + Ionic',
      description: 'Frontend administrativo, diseñadores, runtime visual, navegación, componentes y preferencias.',
      paths: ['apps/app/src/app/pages', 'apps/app/src/app/shared', 'apps/app/src/app/core', 'apps/app/src/app/engine']
    },
    {
      title: 'Shared',
      status: 'Paquete común',
      description: 'Contratos compartidos y punto natural para tipos comunes entre API y app.',
      paths: ['packages/shared/src/index.ts']
    },
    {
      title: 'Infra',
      status: 'Docker / artefactos',
      description: 'Base de empaquetado y despliegue con API, MariaDB y Ollama, con procesos separables para worker, backup y storage.',
      paths: ['infra/docker/docker-compose.yml', 'infra/docker/.env.example']
    },
    {
      title: 'Docs',
      status: 'Fuente viva',
      description: 'Decisiones, contratos, ejemplos JSON, RAG, formularios, flows, servicios y componentes.',
      paths: ['docs', 'docs/examples']
    }
  ];

  readonly backendModules: ArchitectureMapItem[] = [
    {
      title: 'Setup, tenants y usuarios',
      status: 'Base funcional',
      description: 'Inicialización segura, tenant inicial, usuarios, membresías y administración básica.',
      paths: ['apps/api/src/modules/setup', 'apps/api/src/modules/tenants', 'apps/api/src/modules/users']
    },
    {
      title: 'Auth y RBAC',
      status: 'En fortalecimiento',
      description: 'Login, JWT, refresh cookie, sesiones, roles, permisos y guards.',
      paths: ['apps/api/src/modules/auth', 'apps/api/src/modules/rbac']
    },
    {
      title: 'Confisys, settings, menus y audit',
      status: 'Base funcional',
      description: 'Configuración parametrizable, defaults, menús desde DB y eventos de auditoría.',
      paths: ['apps/api/src/modules/confisys', 'apps/api/src/modules/menus', 'apps/api/src/modules/audit']
    },
    {
      title: 'Database viewer/designer',
      status: 'Operativo controlado',
      description: 'Visor de DB, CRUD de filas, schema changes y migraciones TypeORM para tablas custom_*.',
      paths: ['apps/api/src/modules/database-viewer', 'apps/api/src/database/migrations']
    }
  ];

  readonly frontendModules: ArchitectureMapItem[] = [
    {
      title: 'Shell, navegación y preferencias',
      status: 'Base reutilizable',
      description: 'Page shell, menú responsive, preferencias visuales, i18n y tema admin.',
      paths: ['apps/app/src/app/shared/page-shell', 'apps/app/src/app/shared/main-nav', 'apps/app/src/app/pages/preferences']
    },
    {
      title: 'Componentes de diseño',
      status: 'En homologación',
      description: 'Catálogo, campos dinámicos, preview responsive, catalog panels, workspaces y mobile form shell.',
      paths: [
        'apps/app/src/app/shared/dynamic-field-control',
        'apps/app/src/app/shared/preview-viewport',
        'apps/app/src/app/shared/mobile-form',
        'apps/app/src/app/pages/components'
      ]
    },
    {
      title: 'Designers',
      status: 'En construcción',
      description: 'Servicios, formularios, flows y DB designer con JSON editable y asistencia IA.',
      paths: ['apps/app/src/app/pages/services', 'apps/app/src/app/pages/forms', 'apps/app/src/app/pages/flows', 'apps/app/src/app/pages/database']
    },
    {
      title: 'Runtime cliente',
      status: 'Base funcional',
      description: 'Clientes dinámicos para servicios/flows, action runner, form runtime y Formly adapter.',
      paths: ['apps/app/src/app/core/services', 'apps/app/src/app/engine/actions', 'apps/app/src/app/engine/forms']
    }
  ];

  readonly runtimeModules: ArchitectureMapItem[] = [
    {
      title: 'Dynamic Services',
      status: 'Runtime operativo',
      description: 'Servicios internos/HTTP declarativos, versiones, publicación, runs, papelera, catálogos y pruebas.',
      paths: ['apps/api/src/modules/dynamic-services', 'docs/dynamic-services-contract.md']
    },
    {
      title: 'Dynamic Forms',
      status: 'En construcción avanzada',
      description: 'Formularios versionados, preview web/tablet/móvil, submit real, bindings y write policies.',
      paths: ['apps/api/src/modules/dynamic-forms', 'apps/app/src/app/pages/forms', 'docs/dynamic-forms-contract.md']
    },
    {
      title: 'Flow Engine',
      status: 'Orquestación declarativa',
      description: 'Flows declarativos, pasos, versiones, runtime, live events, test cases y jobs.',
      paths: ['apps/api/src/modules/flows', 'apps/app/src/app/pages/flows', 'docs/flow-contract.md']
    },
    {
      title: 'Actions',
      status: 'Base cliente',
      description: 'Acciones declarativas para ejecutar servicios, flows, navegación y capacidades instalables.',
      paths: ['apps/app/src/app/engine/actions', 'apps/api/src/modules/actions']
    },
    {
      title: 'Records',
      status: 'Base persistente',
      description: 'Persistencia genérica JSON para casos donde no se escribe una tabla específica.',
      paths: ['apps/api/src/modules/records']
    },
    {
      title: 'Files, devices y sync',
      status: 'Placeholder/base',
      description: 'Evidencias, capacidades móviles y sincronización offline como módulos separables del runtime.',
      paths: ['apps/api/src/modules/files', 'apps/api/src/modules/devices', 'apps/api/src/modules/sync']
    }
  ];

  readonly contracts: ArchitectureMapItem[] = [
    {
      title: 'Servicios dinámicos',
      status: 'JSON + UI',
      description: 'Contrato para consultas internas, HTTP, filtros, joins, writeMap, timeout, retry y responseMap.',
      paths: ['docs/dynamic-services-contract.md', 'docs/examples/dynamic-services.examples.json']
    },
    {
      title: 'Formularios dinámicos',
      status: 'JSON + UI + preview',
      description: 'Contrato para runtime, presentación, layout responsive, pasos, campos, acciones y persistencia.',
      paths: ['docs/dynamic-forms-contract.md', 'docs/examples/dynamic-forms.examples.json']
    },
    {
      title: 'Flows',
      status: 'JSON + runner',
      description: 'Contrato para triggers, pasos, decisiones, ejecución de servicios, mapeos, pruebas y salidas.',
      paths: ['docs/flow-contract.md', 'docs/examples/flows.examples.json', 'docs/examples/flow-runtime.examples.json']
    },
    {
      title: 'Presentación UI',
      status: 'En homologación',
      description: 'Contrato de kit visual, tema, tokens, densidad, responsive y equivalentes por componente.',
      paths: ['docs/ui-presentation-architecture.md', 'docs/examples/ui-presentation.examples.json']
    }
  ];

  readonly dataGroups: DataTableGroup[] = [
    {
      title: 'Identidad y seguridad',
      tables: ['tenants', 'tenant_memberships', 'users', 'roles', 'permissions', 'user_roles', 'role_permissions'],
      notes: 'Controlan quién entra, en qué tenant opera y qué puede hacer.'
    },
    {
      title: 'Configuración y administración',
      tables: ['confisys', 'menus', 'audit_events', 'auth_sessions', 'auth_login_attempts'],
      notes: 'Defaults, parametrización, menú dinámico, sesión y trazabilidad.'
    },
    {
      title: 'Servicios dinámicos',
      tables: ['dynamic_services', 'dynamic_service_versions', 'dynamic_service_runs'],
      notes: 'Definición, versionado, publicación, papelera y ejecución observable.'
    },
    {
      title: 'Formularios dinámicos',
      tables: ['dynamic_forms', 'dynamic_form_versions', 'dynamic_form_runs', 'dynamic_form_bindings', 'dynamic_form_write_policies'],
      notes: 'Diseño, versiones, pruebas, submit y conexión segura con servicios o records.'
    },
    {
      title: 'Flows y eventos',
      tables: ['flows', 'flow_versions', 'flow_steps', 'flow_runs', 'flow_step_runs', 'flow_jobs', 'flow_outbox_events'],
      notes: 'Procesos, pasos, jobs, outbox y observabilidad.'
    },
    {
      title: 'Datos de negocio',
      tables: ['records', 'schema_changes', 'custom_*'],
      notes: 'Records JSON para persistencia genérica y custom_* para tablas diseñadas visualmente.'
    }
  ];

  readonly capabilities: CapacityItem[] = [
    {
      phase: '1. Runtime dinámico',
      done: 'Servicios, formularios, flows, DB designer y AI operan sobre contratos declarativos.',
      next: 'Cada objeto dinámico tiene JSON editable, versión, publicación, prueba y trazabilidad.'
    },
    {
      phase: '2. Interfaces declarativas',
      done: 'Componentes reutilizables, preview viewport, mobile form shell y presentación UI forman la base visual.',
      next: 'Las pantallas se expresan con layouts, navegación, bindings, acciones y componentes configurables.'
    },
    {
      phase: '3. Microkernel y plugins',
      done: 'El core conserva contratos estables y las capacidades viven como templates, plugins o adapters.',
      next: 'Cada capacidad declara manifest, dependencias, permisos, instalación, compatibilidad y rollback.'
    },
    {
      phase: '4. Event engine',
      done: 'Runs, audit events, flow jobs y outbox registran actividad y coordinan procesos.',
      next: 'Workers, reintentos, websocket status, backup y procesos async se conectan al mismo contrato de eventos.'
    },
    {
      phase: '5. IA/RAG',
      done: 'Chat flotante, Ollama local, drafts, guías por pantalla y fallback guiado.',
      next: 'Knowledge Pack, embeddings, herramientas por pantalla, memoria de tarea y validación de propuestas.'
    },
    {
      phase: '6. Multi-target',
      done: 'Angular/Ionic, kits visuales y previews web/tablet/móvil.',
      next: 'Equivalentes PrimeNG/Ionic/Material/Bootstrap por componente, pantallas móviles y offline sync.'
    }
  ];

  readonly sourceDocs: ArchitectureMapItem[] = [
    {
      title: 'Arquitectura base',
      status: 'Documento fuente',
      description: 'Decisiones generales de plataforma, alcance MVP y handoff de contexto.',
      paths: ['docs/architecture.md', 'docs/platform-architecture.md', 'docs/decisions.md', 'docs/context-handoff.md']
    },
    {
      title: 'Contratos dinámicos',
      status: 'Documento fuente',
      description: 'Definición técnica de servicios, formularios, flows, Formly y ejemplos JSON.',
      paths: ['docs/dynamic-services-contract.md', 'docs/dynamic-forms-contract.md', 'docs/flow-contract.md', 'docs/formly-architecture.md']
    },
    {
      title: 'IA y RAG',
      status: 'Documento fuente',
      description: 'Arquitectura de asistente, knowledge pack, Ollama local y guía de authoring para IA.',
      paths: ['docs/ai-authoring-guide.md', 'docs/ai-rag-architecture.md', 'docs/ai-ready-authoring.md', 'docs/ai-local-ollama.md']
    },
    {
      title: 'UI y componentes',
      status: 'Documento fuente',
      description: 'Inventario visual, reutilización, presentación multi-kit y auditoría de componentes.',
      paths: ['docs/ui-components.md', 'docs/ui-component-inventory.md', 'docs/ui-reuse-audit.md', 'docs/ui-presentation-architecture.md']
    },
    {
      title: 'Infra, backup y migración',
      status: 'Documento fuente',
      description: 'Docker, worker, backup, Angular 20 y riesgos de migración.',
      paths: ['infra/docker/docker-compose.yml', 'docs/backup-worker-architecture.md', 'docs/angular-20-migration-roadmap.md']
    }
  ];
}
