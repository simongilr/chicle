import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { MainNavComponent } from '../../shared/main-nav/main-nav.component';

interface CommandStep {
  title: string;
  command?: string;
  ui?: string;
  swagger?: string;
  note: string;
}

interface DocSection {
  id: string;
  label: string;
  summary: string;
}

@Component({
  selector: 'app-docs-page',
  standalone: true,
  imports: [IonContent, MainNavComponent],
  styles: [
    `
      ion-content {
        --background: #f5f7fb;
      }

      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        border-bottom: 1px solid #d9e2ec;
        background: #ffffff;
        padding: 14px 24px;
      }

      .brand-block {
        display: grid;
        gap: 2px;
        min-width: 190px;
      }

      .brand {
        color: #12324f;
        font-size: 1rem;
        font-weight: 850;
      }

      .context-label {
        color: #64748b;
        font-size: 0.82rem;
        font-weight: 700;
      }

      .top-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
      }

      .top-actions a {
        min-height: 38px;
        border: 1px solid #c8d6e4;
        border-radius: 8px;
        background: #ffffff;
        color: #173b5f;
        padding: 8px 12px;
        text-decoration: none;
        font: inherit;
        font-weight: 800;
      }

      .docs-shell {
        max-width: 1180px;
        margin: 0 auto;
        padding: 24px 24px 48px;
      }

      .intro {
        display: grid;
        gap: 10px;
        margin-bottom: 20px;
        border-bottom: 1px solid #d8e3ed;
        padding-bottom: 20px;
      }

      .intro h1 {
        margin: 0;
        color: #12324f;
        font-size: 2.05rem;
        line-height: 1.15;
      }

      .intro p,
      .section-lead {
        margin: 0;
        color: #4d5c6c;
        line-height: 1.55;
      }

      .docs-layout {
        display: grid;
        grid-template-columns: 280px minmax(0, 1fr);
        gap: 24px;
        align-items: start;
      }

      .section-picker {
        display: none;
      }

      .docs-nav {
        position: sticky;
        top: 16px;
        display: grid;
        gap: 8px;
        border: 1px solid #d8e3ed;
        border-radius: 8px;
        background: #ffffff;
        padding: 10px;
      }

      .docs-nav-title {
        margin: 4px 6px 6px;
        color: #64748b;
        font-size: 0.78rem;
        font-weight: 800;
        text-transform: uppercase;
      }

      .docs-nav button {
        display: grid;
        gap: 3px;
        width: 100%;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: #173b5f;
        padding: 9px 10px;
        text-align: left;
        cursor: pointer;
      }

      .docs-nav button[aria-current='true'] {
        background: #e8f2ff;
        box-shadow: inset 3px 0 0 #1554a2;
      }

      .docs-nav button:hover,
      .docs-nav button:focus-visible {
        outline: none;
        background: #eef6ff;
      }

      .docs-nav strong {
        font-size: 0.94rem;
      }

      .docs-nav span {
        color: #64748b;
        font-size: 0.8rem;
        line-height: 1.35;
      }

      .docs-content {
        display: grid;
        gap: 18px;
        min-width: 0;
      }

      .doc-section {
        scroll-margin-top: 18px;
        border: 1px solid #d8e3ed;
        border-radius: 8px;
        background: #ffffff;
        padding: 18px;
      }

      .doc-section[data-tone='critical'] {
        border-left: 4px solid #b42318;
      }

      .doc-section[data-tone='setup'] {
        border-left: 4px solid #147d64;
      }

      .doc-section[data-tone='ops'] {
        border-left: 4px solid #9a6700;
      }

      .doc-section[data-tone='security'] {
        border-left: 4px solid #4f46e5;
      }

      section + section {
        margin-top: 0;
      }

      h2 {
        margin: 0 0 12px;
        color: #173b5f;
        font-size: 1.25rem;
      }

      .section-header {
        display: grid;
        gap: 6px;
        margin-bottom: 14px;
      }

      .section-header .section-lead {
        max-width: 760px;
      }

      .steps {
        display: grid;
        gap: 12px;
      }

      .step {
        display: grid;
        gap: 10px;
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #ffffff;
        padding: 16px;
      }

      .step h3 {
        display: flex;
        gap: 8px;
        align-items: baseline;
      }

      .step h3 {
        margin: 0;
        color: #16324f;
        font-size: 1rem;
      }

      .meta {
        display: grid;
        gap: 6px;
        color: #5a6877;
        font-size: 0.92rem;
      }

      .guide-blocks {
        display: grid;
        gap: 8px;
      }

      .guide-block {
        display: grid;
        gap: 6px;
      }

      .guide-label {
        color: #64748b;
        font-size: 0.75rem;
        font-weight: 850;
        text-transform: uppercase;
      }

      .guide-text {
        border-radius: 8px;
        background: #f5f8fb;
        color: #173b5f;
        padding: 10px 12px;
        line-height: 1.45;
      }

      .doc-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: fit-content;
        min-height: 38px;
        border: 1px solid #1554a2;
        border-radius: 8px;
        background: #1554a2;
        color: #ffffff;
        padding: 8px 12px;
        font-weight: 800;
        text-decoration: none;
      }

      code,
      pre {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
          "Courier New", monospace;
      }

      code {
        color: #16324f;
      }

      pre {
        overflow-x: auto;
        margin: 0;
        border-radius: 8px;
        background: #0e1f2f;
        color: #eaf4ff;
        padding: 12px;
        line-height: 1.45;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .notes {
        display: grid;
        gap: 10px;
        margin: 0;
        padding-left: 18px;
        color: #4d5c6c;
        line-height: 1.5;
      }

      @media (max-width: 640px) {
        .topbar {
          align-items: flex-start;
          flex-direction: column;
          padding: 14px 16px;
        }

        .top-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          width: 100%;
        }

        .top-actions a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 0;
          text-align: center;
        }

        .docs-shell {
          padding: 18px 0 36px;
        }

        .intro,
        .docs-content {
          padding-inline: 16px;
        }

        .intro h1 {
          font-size: 1.55rem;
        }
      }

      @media (max-width: 900px) {
        .docs-layout {
          grid-template-columns: 1fr;
        }

        .section-picker {
          display: grid;
          gap: 7px;
          margin-bottom: 18px;
          padding: 0 16px;
        }

        .section-picker label {
          color: #64748b;
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .section-picker select {
          width: 100%;
          min-height: 42px;
          border: 1px solid #c8d6e4;
          border-radius: 8px;
          background: #ffffff;
          color: #173b5f;
          padding: 8px 10px;
          font: inherit;
          font-weight: 800;
        }

        .docs-nav {
          display: none;
        }

        .docs-nav-title {
          margin: 0;
        }

        .docs-nav button {
          border: 1px solid #cbd8e3;
          background: #ffffff;
          padding: 9px 10px;
        }

        .docs-nav button[aria-current='true'] {
          border-color: #1554a2;
          background: #1554a2;
          color: #ffffff;
          box-shadow: none;
        }
      }
    `
  ],
  template: `
    <ion-content [scrollEvents]="true" (ionScroll)="syncActiveSection()">
      <app-main-nav contextLabel="Manual operativo" />

      <main class="docs-shell">
        <header class="intro">
          <h1>Primeros pasos de Chicle Engine</h1>
          <p>
            Esta página guarda las instrucciones operativas del proyecto para que no dependamos
            de recordar comandos sueltos. La iremos enriqueciendo conforme avance el producto.
          </p>
        </header>

        <div class="section-picker">
          <label for="docs-section">Ir a sección</label>
          <select id="docs-section" [value]="activeSection" (change)="changeSection($event)">
            @for (section of sections; track section.id) {
              <option [value]="section.id">{{ section.label }}</option>
            }
          </select>
        </div>

        <div class="docs-layout">
          <nav class="docs-nav" aria-label="Secciones del manual">
            <div class="docs-nav-title">Secciones</div>
            @for (section of sections; track section.id) {
              <button
                type="button"
                [attr.aria-current]="activeSection === section.id ? 'true' : null"
                (click)="scrollTo(section.id)"
              >
                <strong>{{ section.label }}</strong>
                <span>{{ section.summary }}</span>
              </button>
            }
          </nav>

          <div class="docs-content">
            <section id="reglas" class="doc-section" data-tone="ops">
              <div class="section-header">
                <h2>Reglas rápidas</h2>
                <p class="section-lead">
                  Si estás en la raíz del proyecto usa los comandos del monorepo. Si ya entraste a
                  <code>apps/app</code>, usa el comando propio de la app. Los puertos se cambian en
                  <code>infra/docker/.env.example</code>.
                </p>
              </div>
              <p class="section-lead">
                Siempre dejamos un valor por defecto para que el proyecto arranque sin configuración
                extra. Si existe un valor en <code>infra/docker/.env.example</code> o en la terminal,
                ese valor reemplaza el default.
              </p>
            </section>

            <section id="primer-uso" class="doc-section" data-tone="setup">
              <div class="section-header">
                <h2>Primer uso</h2>
                <p class="section-lead">
                  Este es el camino recomendado para levantar la app, verificar el estado del sistema
                  y crear el primer tenant desde la pantalla web.
                </p>
              </div>
              <div class="steps">
                @for (step of firstRunSteps; track step.title; let index = $index) {
                  <article class="step">
                    <h3><span>{{ index + 1 }}.</span>{{ step.title }}</h3>
                    <div class="meta">
                      <span>{{ step.note }}</span>
                    </div>
                    <div class="guide-blocks">
                      @if (step.ui) {
                        <div class="guide-block">
                          <span class="guide-label">Modo gráfico</span>
                          <div class="guide-text">{{ step.ui }}</div>
                        </div>
                      }
                      @if (step.swagger) {
                        <div class="guide-block">
                          <span class="guide-label">Swagger</span>
                          <div class="guide-text">{{ step.swagger }}</div>
                        </div>
                      }
                      @if (step.command) {
                        <div class="guide-block">
                          <span class="guide-label">Curl / terminal</span>
                          <pre>{{ step.command }}</pre>
                        </div>
                      }
                    </div>
                  </article>
                }
              </div>
            </section>

            <section id="estado" class="doc-section" data-tone="setup">
              <div class="section-header">
                <h2>Estado del sistema</h2>
                <p class="section-lead">
                  La app decide qué mostrar usando <code>/api/setup/status</code>. Si responde
                  <code>not_created</code>, el backend está vivo y falta crear el sistema. Si no responde,
                  el problema es conexión, API o base de datos.
                </p>
              </div>
              <div class="steps">
                @for (step of systemStateSteps; track step.title) {
                  <article class="step">
                    <h3>{{ step.title }}</h3>
                    <div class="meta">
                      <span>{{ step.note }}</span>
                    </div>
                    <div class="guide-blocks">
                      @if (step.ui) {
                        <div class="guide-block">
                          <span class="guide-label">Modo gráfico</span>
                          <div class="guide-text">{{ step.ui }}</div>
                        </div>
                      }
                      @if (step.swagger) {
                        <div class="guide-block">
                          <span class="guide-label">Swagger</span>
                          <div class="guide-text">{{ step.swagger }}</div>
                        </div>
                      }
                      @if (step.command) {
                        <div class="guide-block">
                          <span class="guide-label">Curl / terminal</span>
                          <pre>{{ step.command }}</pre>
                        </div>
                      }
                    </div>
                  </article>
                }
              </div>
            </section>

            <section id="arranque" class="doc-section" data-tone="ops">
              <div class="section-header">
                <h2>Arranque recomendado</h2>
                <p class="section-lead">
                  Comandos base para desarrollo local, Docker, compilación y pruebas rápidas.
                </p>
              </div>
              <div class="steps">
                @for (step of startupSteps; track step.title) {
                  <article class="step">
                    <h3>{{ step.title }}</h3>
                    <div class="meta">
                      <span>{{ step.note }}</span>
                    </div>
                    <div class="guide-blocks">
                      @if (step.ui) {
                        <div class="guide-block">
                          <span class="guide-label">Modo gráfico</span>
                          <div class="guide-text">{{ step.ui }}</div>
                        </div>
                      }
                      @if (step.swagger) {
                        <div class="guide-block">
                          <span class="guide-label">Swagger</span>
                          <div class="guide-text">{{ step.swagger }}</div>
                        </div>
                      }
                      @if (step.command) {
                        <div class="guide-block">
                          <span class="guide-label">Curl / terminal</span>
                          <pre>{{ step.command }}</pre>
                        </div>
                      }
                    </div>
                  </article>
                }
              </div>
            </section>

            <section id="puertos" class="doc-section" data-tone="ops">
              <div class="section-header">
                <h2>Cambiar puertos</h2>
                <p class="section-lead">
                  Si otro proyecto ya usa un puerto, cambia el valor correspondiente y vuelve a
                  ejecutar el comando. Ubicación: <code>infra/docker/.env.example</code>.
                </p>
              </div>
              <div class="steps">
                @for (step of portSteps; track step.title) {
                  <article class="step">
                    <h3>{{ step.title }}</h3>
                    <div class="meta">
                      <span>{{ step.note }}</span>
                    </div>
                    <div class="guide-blocks">
                      @if (step.ui) {
                        <div class="guide-block">
                          <span class="guide-label">Modo gráfico</span>
                          <div class="guide-text">{{ step.ui }}</div>
                        </div>
                      }
                      @if (step.swagger) {
                        <div class="guide-block">
                          <span class="guide-label">Swagger</span>
                          <div class="guide-text">{{ step.swagger }}</div>
                        </div>
                      }
                      @if (step.command) {
                        <div class="guide-block">
                          <span class="guide-label">Curl / terminal</span>
                          <pre>{{ step.command }}</pre>
                        </div>
                      }
                    </div>
                  </article>
                }
              </div>
            </section>

            <section id="confisys" class="doc-section" data-tone="security">
              <div class="section-header">
                <h2>Confisys</h2>
                <p class="section-lead">
                  <code>confisys</code> es la tabla paramétrica del sistema. La API crea una semilla
                  mínima si faltan valores, carga todos los parámetros en memoria al iniciar y trabaja
                  con esa caché hasta el siguiente reinicio.
                </p>
              </div>
              <div class="steps">
                @for (step of confisysSteps; track step.title) {
                  <article class="step">
                    <h3>{{ step.title }}</h3>
                    <div class="meta">
                      <span>{{ step.note }}</span>
                    </div>
                    <div class="guide-blocks">
                      @if (step.ui) {
                        <div class="guide-block">
                          <span class="guide-label">Modo gráfico</span>
                          <div class="guide-text">{{ step.ui }}</div>
                        </div>
                      }
                      @if (step.swagger) {
                        <div class="guide-block">
                          <span class="guide-label">Swagger</span>
                          <div class="guide-text">{{ step.swagger }}</div>
                        </div>
                      }
                      @if (step.command) {
                        <div class="guide-block">
                          <span class="guide-label">Curl / terminal</span>
                          <pre>{{ step.command }}</pre>
                        </div>
                      }
                    </div>
                  </article>
                }
              </div>
            </section>

            <section id="base-datos" class="doc-section" data-tone="ops">
              <div class="section-header">
                <h2>Base de datos y migraciones</h2>
                <p class="section-lead">
                  El visor DB permite revisar datos y el diseñador permite crear tablas
                  <code>custom_*</code> con preview SQL, historial y migración TypeORM generada.
                  Las tablas core del sistema no se modifican desde aquí.
                </p>
              </div>
              <div class="steps">
                @for (step of databaseSteps; track step.title) {
                  <article class="step">
                    <h3>{{ step.title }}</h3>
                    <div class="meta">
                      <span>{{ step.note }}</span>
                    </div>
                    <div class="guide-blocks">
                      @if (step.ui) {
                        <div class="guide-block">
                          <span class="guide-label">Modo gráfico</span>
                          <div class="guide-text">{{ step.ui }}</div>
                        </div>
                      }
                      @if (step.swagger) {
                        <div class="guide-block">
                          <span class="guide-label">Swagger</span>
                          <div class="guide-text">{{ step.swagger }}</div>
                        </div>
                      }
                      @if (step.command) {
                        <div class="guide-block">
                          <span class="guide-label">Curl / terminal</span>
                          <pre>{{ step.command }}</pre>
                        </div>
                      }
                    </div>
                  </article>
                }
              </div>
            </section>

            <section id="modelo-saas" class="doc-section" data-tone="setup">
              <div class="section-header">
                <h2>Modelo SaaS multi-industria</h2>
                <p class="section-lead">
                  Chicle Engine separa identidad, tenant, membresía y datos de negocio para poder
                  atender eventos, inmobiliaria, tickets, servicios, minijuegos y comercios sin
                  convertir el core en un producto rígido.
                </p>
              </div>
              <div class="steps">
                @for (step of saasModelSteps; track step.title) {
                  <article class="step">
                    <h3>{{ step.title }}</h3>
                    <div class="meta">
                      <span>{{ step.note }}</span>
                    </div>
                    <div class="guide-blocks">
                      @if (step.ui) {
                        <div class="guide-block">
                          <span class="guide-label">Modo gráfico</span>
                          <div class="guide-text">{{ step.ui }}</div>
                        </div>
                      }
                      @if (step.swagger) {
                        <div class="guide-block">
                          <span class="guide-label">Swagger</span>
                          <div class="guide-text">{{ step.swagger }}</div>
                        </div>
                      }
                      @if (step.command) {
                        <div class="guide-block">
                          <span class="guide-label">Modelo / ejemplo</span>
                          <pre>{{ step.command }}</pre>
                        </div>
                      }
                    </div>
                  </article>
                }
              </div>
            </section>

            <section id="servicios-dinamicos" class="doc-section" data-tone="setup">
              <div class="section-header">
                <h2>Servicios dinámicos</h2>
                <p class="section-lead">
                  Los servicios son objetos configurables del tenant. Una plantilla de negocio puede
                  instalarlos como semilla y la organización puede administrarlos desde la pantalla
                  web sin escribir código core.
                </p>
              </div>
              <div class="steps">
                @for (step of dynamicServiceSteps; track step.title) {
                  <article class="step">
                    <h3>{{ step.title }}</h3>
                    <div class="meta">
                      <span>{{ step.note }}</span>
                    </div>
                    <div class="guide-blocks">
                      @if (step.ui) {
                        <div class="guide-block">
                          <span class="guide-label">Modo gráfico</span>
                          <div class="guide-text">{{ step.ui }}</div>
                        </div>
                      }
                      @if (step.swagger) {
                        <div class="guide-block">
                          <span class="guide-label">Swagger</span>
                          <div class="guide-text">{{ step.swagger }}</div>
                        </div>
                      }
                      @if (step.command) {
                        <div class="guide-block">
                          <span class="guide-label">Arquitectura / ejemplo</span>
                          <pre>{{ step.command }}</pre>
                        </div>
                      }
                    </div>
                  </article>
                }
              </div>
            </section>

            <section id="seguridad" class="doc-section" data-tone="security">
              <div class="section-header">
                <h2>Seguridad modular</h2>
                <p class="section-lead">
                  La seguridad se configura por organización. La pantalla de login lee
                  <code>/api/auth/config</code> y muestra solo los métodos activos para web, móvil o
                  dispositivo. El backend sigue siendo la autoridad real para permisos y acceso.
                </p>
              </div>
              <div class="steps">
                @for (step of securitySteps; track step.title) {
                  <article class="step">
                    <h3>{{ step.title }}</h3>
                    <div class="meta">
                      <span>{{ step.note }}</span>
                    </div>
                    <div class="guide-blocks">
                      @if (step.ui) {
                        <div class="guide-block">
                          <span class="guide-label">Modo gráfico</span>
                          <div class="guide-text">{{ step.ui }}</div>
                        </div>
                      }
                      @if (step.swagger) {
                        <div class="guide-block">
                          <span class="guide-label">Swagger</span>
                          <div class="guide-text">{{ step.swagger }}</div>
                        </div>
                      }
                      @if (step.command) {
                        <div class="guide-block">
                          <span class="guide-label">Curl / terminal</span>
                          <pre>{{ step.command }}</pre>
                        </div>
                      }
                    </div>
                  </article>
                }
              </div>
            </section>

            <section id="guia-seguridad" class="doc-section" data-tone="security">
              <div class="section-header">
                <h2>Guía de seguridad</h2>
                <p class="section-lead">
                  La seguridad de Chicle Engine se diseña por capas: autenticación, sesión, tenant,
                  roles, permisos, auditoría y configuración por organización.
                </p>
              </div>
              <div class="steps">
                @for (step of securityGuideSteps; track step.title) {
                  <article class="step">
                    <h3>{{ step.title }}</h3>
                    <div class="meta">
                      <span>{{ step.note }}</span>
                    </div>
                    <div class="guide-blocks">
                      @if (step.ui) {
                        <div class="guide-block">
                          <span class="guide-label">Modo gráfico</span>
                          <div class="guide-text">{{ step.ui }}</div>
                        </div>
                      }
                      @if (step.swagger) {
                        <div class="guide-block">
                          <span class="guide-label">Swagger</span>
                          <div class="guide-text">{{ step.swagger }}</div>
                        </div>
                      }
                      @if (step.command) {
                        <div class="guide-block">
                          <span class="guide-label">Curl / terminal</span>
                          <pre>{{ step.command }}</pre>
                        </div>
                      }
                    </div>
                  </article>
                }
              </div>
            </section>

            <section id="swagger" class="doc-section" data-tone="ops">
              <div class="section-header">
                <h2>Swagger / API Docs</h2>
                <p class="section-lead">
                  La API expone documentación interactiva con ejemplos para setup, auth, usuarios,
                  roles, permisos, auditoría y confisys.
                </p>
              </div>
              <div class="steps">
                @for (step of swaggerSteps; track step.title) {
                  <article class="step">
                    <h3>{{ step.title }}</h3>
                    <div class="meta">
                      <span>{{ step.note }}</span>
                    </div>
                    <div class="guide-blocks">
                      @if (step.ui) {
                        <div class="guide-block">
                          <span class="guide-label">Modo gráfico</span>
                          <div class="guide-text">{{ step.ui }}</div>
                        </div>
                      }
                      @if (step.swagger) {
                        <div class="guide-block">
                          <span class="guide-label">Swagger</span>
                          <div class="guide-text">{{ step.swagger }}</div>
                        </div>
                      }
                      @if (step.command) {
                        <div class="guide-block">
                          <span class="guide-label">Curl / terminal</span>
                          <pre>{{ step.command }}</pre>
                        </div>
                      }
                    </div>
                  </article>
                }
              </div>
              <a class="doc-link" href="http://localhost:3000/api/docs" target="_blank" rel="noreferrer">
                Abrir Swagger
              </a>
            </section>

            <section id="reset" class="doc-section" data-tone="critical">
              <div class="section-header">
                <h2>Reset local seguro</h2>
                <p class="section-lead">
                  Para repetir pruebas de creación del sistema existe un reset solo para desarrollo.
                  Está desactivado por defecto, exige llave de entorno, frase exacta y queda bloqueado
                  si <code>NODE_ENV=production</code>.
                </p>
              </div>
              <div class="steps">
                @for (step of resetSteps; track step.title) {
                  <article class="step">
                    <h3>{{ step.title }}</h3>
                    <div class="meta">
                      <span>{{ step.note }}</span>
                    </div>
                    <div class="guide-blocks">
                      @if (step.ui) {
                        <div class="guide-block">
                          <span class="guide-label">Modo gráfico</span>
                          <div class="guide-text">{{ step.ui }}</div>
                        </div>
                      }
                      @if (step.swagger) {
                        <div class="guide-block">
                          <span class="guide-label">Swagger</span>
                          <div class="guide-text">{{ step.swagger }}</div>
                        </div>
                      }
                      @if (step.command) {
                        <div class="guide-block">
                          <span class="guide-label">Curl / terminal</span>
                          <pre>{{ step.command }}</pre>
                        </div>
                      }
                    </div>
                  </article>
                }
              </div>
            </section>

            <section id="semillas" class="doc-section" data-tone="setup">
              <div class="section-header">
                <h2>Semillas iniciales</h2>
              </div>
              <ul class="notes">
                <li>
                  El primer usuario real es el admin creado desde setup. No usamos una contraseña
                  default quemada en el código.
                </li>
                <li>
                  La semilla base inicia con perfil <code>blank</code>: tenant, settings mínimos y
                  usuario admin inicial con rol <code>owner</code>. Roles y permisos finos se suman
                  en la siguiente iteración.
                </li>
                <li>
                  Los usuarios de demo o plantillas de negocio vivirán en seeds opcionales. Borrar una
                  seed no debe romper el core.
                </li>
              </ul>
            </section>

            <section id="errores" class="doc-section" data-tone="critical">
              <div class="section-header">
                <h2>Errores comunes</h2>
              </div>
              <ul class="notes">
                <li>
                  Si <code>ionic serve</code> dice que no es un proyecto Ionic, usa
                  <code>npm run start</code> dentro de <code>apps/app</code>.
                </li>
                <li>
                  Si <code>npm run dev:app</code> falla con “Missing script”, probablemente estás en
                  <code>apps/app</code>. Ese comando se ejecuta desde la raíz del monorepo.
                </li>
                <li>
                  Si la API no arranca por base de datos, abre Docker Desktop y levanta MariaDB con
                  el comando de base de datos.
                </li>
                <li>
                  Si <code>/api/setup/status</code> responde <code>not_created</code>, no está caído:
                  toca ejecutar el setup inicial.
                </li>
                <li>
                  Si el error dice que el puerto está ocupado, cambia <code>APP_PORT</code>,
                  <code>API_PORT</code> o <code>DB_PORT</code> según el servicio afectado.
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </ion-content>
  `
})
export class DocsPageComponent {
  readonly sections: DocSection[] = [
    { id: 'reglas', label: 'Reglas rápidas', summary: 'Dónde correr comandos y cómo funcionan los env.' },
    { id: 'primer-uso', label: 'Primer uso', summary: 'Crear el sistema por primera vez.' },
    { id: 'estado', label: 'Estado', summary: 'Diferenciar setup pendiente de caída real.' },
    { id: 'arranque', label: 'Arranque', summary: 'Node, app, API, Docker y build.' },
    { id: 'puertos', label: 'Puertos', summary: 'Cambios desde env y pruebas locales.' },
    { id: 'confisys', label: 'Confisys', summary: 'Parámetros del sistema en base de datos.' },
    { id: 'base-datos', label: 'Base de datos', summary: 'Visor, diseñador y migraciones.' },
    { id: 'modelo-saas', label: 'Modelo SaaS', summary: 'Tenants, usuarios, membresías y necesidades.' },
    { id: 'servicios-dinamicos', label: 'Servicios', summary: 'Objetos ejecutables, pruebas y runs.' },
    { id: 'seguridad', label: 'Seguridad', summary: 'Auth, roles, permisos y auditoría.' },
    { id: 'guia-seguridad', label: 'Guía de seguridad', summary: 'Capas, reglas y pendientes de seguridad.' },
    { id: 'swagger', label: 'Swagger', summary: 'API interactiva con ejemplos.' },
    { id: 'reset', label: 'Reset local', summary: 'Repetir pruebas de creación sin abrir huecos.' },
    { id: 'semillas', label: 'Semillas', summary: 'Datos iniciales y perfiles base.' },
    { id: 'errores', label: 'Errores comunes', summary: 'Qué hacer cuando algo no arranca.' }
  ];

  scrollTo(sectionId: string) {
    this.activeSection = sectionId;
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  changeSection(event: Event) {
    const sectionId = (event.target as HTMLSelectElement).value;
    this.scrollTo(sectionId);
  }

  syncActiveSection() {
    const visibleSection = this.sections
      .map((section) => ({
        id: section.id,
        top: Math.abs(document.getElementById(section.id)?.getBoundingClientRect().top ?? Number.MAX_SAFE_INTEGER)
      }))
      .sort((a, b) => a.top - b.top)[0];

    if (visibleSection && visibleSection.id !== this.activeSection) {
      this.activeSection = visibleSection.id;
    }
  }

  activeSection = 'reglas';

  readonly firstRunSteps: CommandStep[] = [
    {
      title: 'Confirmar estado inicial',
      ui: 'Abre la app. Si el sistema no existe, la app debe llevarte automáticamente a /setup.',
      swagger: 'Abre /api/docs y ejecuta GET /api/setup/status.',
      command: 'curl http://127.0.0.1:3000/api/setup/status',
      note: 'Debe responder state: "not_created" cuando el backend está vivo y el sistema aún no fue creado.'
    },
    {
      title: 'Crear el primer tenant',
      ui: 'Abre /setup y completa organización, email admin, password y semilla blank.',
      swagger: 'En /api/docs usa POST /api/setup con el ejemplo de body y cambia los datos.',
      note: 'Este es el flujo principal web. Si cambiaste APP_PORT, usa ese puerto en la URL.'
    },
    {
      title: 'Crear el primer tenant por API',
      ui: 'Usa la pantalla /setup. Esta opción por API queda como validación técnica o soporte.',
      swagger: 'En /api/docs abre Setup -> POST /api/setup -> Try it out.',
      command:
        'curl -X POST http://127.0.0.1:3000/api/setup \\\n  -H "Content-Type: application/json" \\\n  -d \'{"organization":"Mi Empresa","email":"admin@example.com","password":"CambiaEstaClave123","template":"blank"}\'',
      note: 'Alternativa técnica para validar backend. La pantalla setup usa este mismo endpoint.'
    },
    {
      title: 'Confirmar que ya quedó creado',
      ui: 'Después de guardar setup, la app debe enviarte a login o mostrar que el sistema ya está listo.',
      swagger: 'Ejecuta GET /api/setup/status y confirma state: "ready".',
      command: 'curl http://127.0.0.1:3000/api/setup/status',
      note: 'Después del setup debe responder state: "ready" y requiredAction: "login".'
    }
  ];

  readonly systemStateSteps: CommandStep[] = [
    {
      title: 'Sistema no creado',
      command:
        '{"state":"not_created","initialized":false,"canRunSetup":true,"requiredAction":"run_setup"}',
      note: 'La API y la DB están arriba. La app debe mostrar setup inicial.'
    },
    {
      title: 'Sistema listo',
      command:
        '{"state":"ready","initialized":true,"canRunSetup":false,"requiredAction":"login"}',
      note: 'Ya existe al menos un tenant. La app debe enviar a login.'
    },
    {
      title: 'Sistema no disponible',
      command: 'fetch /api/setup/status falla, timeout, 500, DNS o conexión rechazada',
      note: 'Esto no es setup pendiente. La app debe mostrar error de conexión o servicio.'
    }
  ];

  readonly resetSteps: CommandStep[] = [
    {
      title: 'Habilitar solo en local',
      ui: 'No hay botón gráfico para habilitar reset. Es intencional: debe activarse desde configuración local del entorno.',
      command: 'CHICLE_ALLOW_SYSTEM_RESET=true\nCHICLE_RESET_KEY=usa-una-llave-local-larga',
      note: 'Ubicación: infra/docker/.env.example. No actives esto en producción.'
    },
    {
      title: 'Recrear API con la llave',
      ui: 'Desde Docker Desktop puedes confirmar que el contenedor API se recreó después de cambiar el env.',
      command: 'docker compose --env-file infra/docker/.env.example -f infra/docker/docker-compose.yml up -d --build api',
      note: 'La API lee la bandera y la llave al iniciar.'
    },
    {
      title: 'Ejecutar reset',
      ui: 'Por ahora no existe botón gráfico de reset para evitar accidentes. Cuando exista, debe pedir llave y frase exacta.',
      swagger: 'En /api/docs usa POST /api/setup/reset, agrega header x-chicle-reset-key y confirma la frase exacta.',
      command:
        'curl -X POST http://127.0.0.1:3000/api/setup/reset \\\n  -H "Content-Type: application/json" \\\n  -H "x-chicle-reset-key: usa-una-llave-local-larga" \\\n  -d \'{"confirm":"RESET CHICLE ENGINE"}\'',
      note: 'Elimina tenant, usuarios, sesiones, roles de tenant, forms, records y auditoría. Conserva confisys y permisos globales.'
    },
    {
      title: 'Desactivar después',
      ui: 'Vuelve a dejar la bandera apagada en el archivo env local y recrea la API.',
      command: 'CHICLE_ALLOW_SYSTEM_RESET=false',
      note: 'Vuelve a levantar la API para cerrar la herramienta de reset.'
    }
  ];

  readonly saasModelSteps: CommandStep[] = [
    {
      title: 'Vocabulario base',
      command:
        'tenant: organizacion, cliente SaaS o espacio de trabajo.\nuser: identidad que inicia sesion.\ntenant_membership: relacion entre user y tenant, con rol de sistema y estado activo.\nrole/permission: permisos operativos dentro del tenant.\nparty: persona u organizacion de negocio, futura tabla para clientes, proveedores, invitados, jugadores o propietarios.\nparty_role: rol de negocio de una party dentro de un tenant.',
      note: 'La regla central es separar identidad de login, pertenencia al tenant y datos propios del negocio.'
    },
    {
      title: 'Por qué usamos membresías',
      command:
        'Un mismo user puede estar en varios tenants:\n\nsain@example.com\n  - Tenant Evento Meteoro: owner\n  - Tenant Inmobiliaria Norte: admin\n  - Tenant Tickets Centro: operator\n\nEl usuario es el mismo, pero sus permisos y contexto cambian por tenant_membership.',
      note: 'Esto evita duplicar usuarios y nos permite soportar organizaciones, sucursales, clientes SaaS y equipos distintos.'
    },
    {
      title: 'Qué tenemos implementado hoy',
      command:
        'users\ntenants\ntenant_memberships\nroles\npermissions\nrole_permissions\nmenus\nconfisys\ndynamic_forms\nrecords\nschema_changes\ncustom_*',
      note: 'Con esto ya podemos manejar login, tenant actual, roles, permisos, menus, parametros, formularios, registros y tablas personalizadas.'
    },
    {
      title: 'Qué queda preparado como siguiente capa',
      command:
        'parties\nparty_contacts\nparty_roles\ntenant_modules\napp_templates\ntenant_feature_flags\nworkflow_templates',
      note: 'Estas tablas futuras nos permiten modelar clientes, personas, proveedores, invitados, jugadores y plantillas por industria sin contaminar el core.'
    },
    {
      title: 'Eventos sociales',
      command:
        'tenant: empresa de eventos, planner o workspace del evento.\nusers/memberships: owner, admin, operador, staff.\nparties futuras: cliente, invitado, proveedor, venue, fotografo.\nforms/records: evento, RSVP, mesa, pago, evidencia, checklist.',
      note: 'El tenant administra el espacio operativo. Las personas del evento viven como datos de negocio, no como usuarios de login salvo que deban entrar al sistema.'
    },
    {
      title: 'Inmobiliaria',
      command:
        'tenant: agencia, broker o equipo inmobiliario.\nusers/memberships: owner, admin, agente, asistente.\nparties futuras: propietario, comprador, arrendatario, fiador, proveedor.\nforms/records: inmueble, visita, oferta, contrato, documento, seguimiento.',
      note: 'Un propietario o comprador no tiene que ser usuario del sistema; puede ser party con contactos, documentos y roles de negocio.'
    },
    {
      title: 'Venta de tickets',
      command:
        'tenant: promotor, organizador o marca que vende tickets.\nusers/memberships: owner, admin, taquilla, operador check-in.\nparties futuras: comprador, asistente, sponsor, punto de venta.\nforms/records: evento, ticket, orden, check-in, reembolso, acceso.',
      note: 'El control de acceso y la venta viven como records y flujos del tenant, mientras el comprador puede ser una party o usuario segun el canal.'
    },
    {
      title: 'Venta de servicios',
      command:
        'tenant: empresa de servicios, taller, consultora o equipo operativo.\nusers/memberships: owner, admin, tecnico, vendedor.\nparties futuras: cliente, tecnico externo, proveedor, aliado.\nforms/records: servicio, agenda, cotizacion, factura, visita, evidencia.',
      note: 'El modelo permite operar agenda, evidencias, estados y clientes sin crear una tabla distinta para cada vertical.'
    },
    {
      title: 'Minijuegos',
      command:
        'tenant: operador, comunidad, marca o campana.\nusers/memberships: owner, admin, moderador, soporte.\nparties futuras: jugador, sponsor, equipo, premio.\nforms/records: partida, score, torneo, premio, ranking, reclamo.',
      note: 'El jugador puede vivir como party o usuario segun si necesita autenticarse dentro de la experiencia.'
    },
    {
      title: 'Comercios',
      command:
        'tenant: comercio, marca, sede o grupo comercial.\nusers/memberships: owner, admin, vendedor, bodeguero.\nparties futuras: cliente, proveedor, vendedor externo.\nforms/records: producto, inventario, venta, pedido, devolucion, soporte.',
      note: 'Si una empresa tiene varias sedes, podemos modelarlas como tenants separados o como unidades internas segun el nivel de aislamiento requerido.'
    },
    {
      title: 'Regla de diseno del core',
      command:
        'No meter nombres de producto o industria en el core.\nNo crear tablas core como eventos_sociales_clientes o inmobiliaria_propietarios.\nUsar templates, modulos, dynamic_forms, records, custom_* y party_roles.\nCada vertical debe ser configuracion, semilla o modulo, no una rama dura del sistema.',
      note: 'Esto mantiene Chicle Engine como plataforma adaptable y no como una app cerrada para un solo negocio.'
    },
    {
      title: 'Mapa recomendado',
      command:
        'tenants\n  users via tenant_memberships\n  roles / permissions / menus\n  confisys / settings\n  dynamic_forms / records\n  custom_* cuando haga falta estructura propia\n  future parties / party_roles para personas y organizaciones de negocio\n  future tenant_modules / app_templates para activar verticales',
      note: 'Este esquema nos deja atender multiples necesidades con una base sencilla, pero sin forzarla cuando llegue una industria mas compleja.'
    }
  ];

  readonly dynamicServiceSteps: CommandStep[] = [
    {
      title: 'Concepto',
      ui: 'Abre /services desde el menú. Crea el servicio, define una versión HTTP, publícala y pruébala desde la misma pantalla.',
      command:
        'dynamic_services: objeto del tenant.\ndynamic_service_versions: definición versionada ejecutable.\ndynamic_service_runs: historial de pruebas y ejecuciones.\nconfisys services.*: defaults y límites del motor.',
      note: 'Un servicio dinámico no es código NestJS. Es configuración ejecutable guardada en DB y controlada por permisos.'
    },
    {
      title: 'Flujo recomendado',
      ui: 'En Servicios toca Nuevo, guarda key/nombre, completa Qué hace este servicio, revisa el JSON, crea versión, publica y prueba.',
      swagger: 'En /api/docs usa Dynamic Services: POST /dynamic-services, POST /versions, POST /publish, POST /test y POST /by-key/{serviceKey}/execute.',
      command:
        '1. Crear dynamic_service\n2. Definir intención: consultar, crear, editar, borrar, validar, sincronizar o notificar\n3. Definir fuente: API externa, tabla interna, records o conector futuro\n4. Definir resultado: uno, lista, lista paginada, booleano, archivo o nada\n5. Crear dynamic_service_version draft\n6. Publicar versión\n7. Probar desde backend\n8. Consumir por key desde frontend, workflow o action\n9. Guardar dynamic_service_run',
      note: 'La ejecución productiva siempre debe usar una versión publicada, nunca una definición suelta del navegador.'
    },
    {
      title: 'Consumo dinámico desde frontend',
      ui: 'Cuando una pantalla necesite usar un servicio publicado, solo llama el key del servicio y envía el contexto. No se crea un endpoint ni un método HTTP nuevo por cada caso.',
      swagger: 'En /api/docs ejecuta POST /api/dynamic-services/by-key/{serviceKey}/execute con body { "context": { ... } }.',
      command:
        'this.dynamicServices.execute<boolean>("buscar_usuario", {\n  name: "simon"\n});\n\nRequisitos:\n  servicio activo\n  version publicada\n  permiso services.execute\n\nRespuesta:\n  ok: true/false\n  result: dato normalizado\n  run: historial tecnico completo',
      note: 'Este es el contrato que usará el futuro diseñador de pantallas: los componentes llaman servicios por key y el backend resuelve la implementación guardada en DB.'
    },
    {
      title: 'Qué hace vs cómo lo ejecuta',
      command:
        'Qué hace:\n  intent: query\n  source: internal_table\n  resultKind: paginated_list\n  dataTarget.primaryTable: custom_clients\n  dataTarget.queryMode: single_table\n  effects: show_response\n\nCómo lo ejecuta:\n  method: GET\n  query: page, pageSize, search',
      note: 'El diseñador debe ser autodidacta: primero explica el objetivo del servicio y luego muestra el detalle técnico.'
    },
    {
      title: 'Consultas internas y varias tablas',
      ui: 'Cuando eliges Tabla interna o Records, el diseñador carga /api/dynamic-services/catalog/tables y usa selects para tabla principal e involucradas.',
      swagger: 'En /api/docs usa Dynamic Services -> GET /api/dynamic-services/catalog/tables para ver el catálogo que alimenta los selects.',
      command:
        'Consulta simple:\n  dataTarget.queryMode: single_table\n  dataTarget.primaryTable: custom_clients\n\nConsulta compleja:\n  dataTarget.queryMode: multi_table\n  dataTarget.primaryTable: custom_orders\n  dataTarget.involvedTables: [custom_clients, records, users]\n  dataTarget.relationNotes: custom_orders.clientId = custom_clients.id\n  dataTarget.filterNotes: tenant actual, estado activo, rango de fechas',
      note: 'No usamos SQL libre desde la UI. Las consultas complejas se describen como plan seguro para que luego un runner controlado las ejecute.'
    },
    {
      title: 'Combinaciones de filtros',
      ui: 'En Servicios, para Una tabla, agrega varios filtros y elige si deben coincidir todos o cualquiera. Marca Obligatorio solo cuando el usuario siempre deba enviar ese valor.',
      command:
        'Buscar por email Y name:\n  matchMode: all\n  filters:\n    email equals input.email required\n    name contains input.name required\n\nBuscar por email O name:\n  matchMode: any\n  filters:\n    email equals input.email opcional\n    name contains input.name opcional\n\nRegla segura:\n  si todos los filtros opcionales llegan vacíos, la API bloquea la consulta.',
      note: 'Esto permite búsquedas reales sin escribir SQL: exactas, por texto, obligatorias u opcionales.'
    },
    {
      title: 'Ejemplo de definición',
      command:
        '{\n  "intent": "query",\n  "source": "internal_table",\n  "resultKind": "list",\n  "dataTarget": {\n    "queryMode": "single_table",\n    "primaryTable": "users",\n    "matchMode": "any",\n    "filterNotes": "email o name opcional",\n    "filters": [\n      {\n        "field": "email",\n        "operator": "equals",\n        "valueSource": "input",\n        "inputKey": "email",\n        "required": false\n      },\n      {\n        "field": "name",\n        "operator": "contains",\n        "valueSource": "input",\n        "inputKey": "name",\n        "required": false\n      }\n    ]\n  },\n  "effects": [{ "type": "show_response" }],\n  "method": "GET",\n  "timeoutMs": 8000\n}',
      note: 'La V1 soporta http_request. Luego podremos agregar internal_action, conectores, webhooks o servicios nativos.'
    },
    {
      title: 'Defaults y límites',
      ui: 'Abre /confisys y busca la categoría services para ajustar defaults. La API los carga en memoria al iniciar.',
      command:
        'services.defaultTimeoutMs = 8000\nservices.maxTimeoutMs = 30000\nservices.maxResponseBytes = 262144\nservices.allowPrivateHosts = false',
      note: 'Si el servicio no define timeout usa el default. Si excede el máximo, se limita al máximo permitido.'
    },
    {
      title: 'Seguridad base',
      command:
        'La ejecución pasa por backend.\nEl front no llama APIs externas directo.\nSe bloquean localhost y redes privadas por defecto.\nHeaders sensibles se enmascaran en snapshots.\nNo se mantiene una transacción DB abierta durante la llamada externa.\nCada prueba queda registrada en dynamic_service_runs.',
      note: 'Estas reglas reducen riesgo de SSRF, fuga de secretos, bloqueos de DB y ejecuciones sin trazabilidad.'
    },
    {
      title: 'Permisos',
      command:
        'services.read: ver servicios e historial.\nservices.manage: crear servicios, versiones y publicar.\nservices.execute: probar o ejecutar servicios.',
      note: 'Ejecuta Seguridad -> Sincronizar seguridad para instalar permisos y menú en tenants existentes.'
    },
    {
      title: 'Relación con plantillas de negocio',
      command:
        'Template venta_tickets:\n  validar_pago\n  generar_qr_ticket\n  validar_checkin\n\nTemplate inmobiliaria:\n  validar_documento_cliente\n  enviar_contrato_firma\n  consultar_score_arrendatario',
      note: 'Las plantillas pueden instalar servicios base; la organización puede adaptarlos desde la UI si tiene permiso.'
    },
    {
      title: 'Relación con event-driven',
      command:
        'record.created\n  -> workflow selecciona servicio\n  -> dynamic_service_run queued/running\n  -> dynamic_service.executed o dynamic_service.failed\n  -> websocket notifica progreso\n  -> actions mapean respuesta al record',
      note: 'Hoy ya tenemos prueba síncrona y consumo frontend por key. La siguiente evolución natural es cola interna, retries, eventos y websockets.'
    },
    {
      title: 'Mapa de evolución',
      command:
        'V1 actual:\n  tablas internas simples\n  HTTP externo\n  prueba en vivo\n  historial de runs\n  consumo frontend por key\n\nSiguientes capacidades:\n  joins guiados\n  uniones y read models\n  paginación avanzada\n  SOAP\n  WebSocket\n  webhooks\n  colas asincrónicas\n  retries configurables\n  secretos administrados\n  mapping visual de request/response',
      note: 'El objetivo es que el creador sea cada vez mas completo sin romper el contrato del front: ejecutar por key con un contexto.'
    }
  ];

  readonly securitySteps: CommandStep[] = [
    {
      title: 'Consultar política pública',
      ui: 'Abre /login. La pantalla debe mostrar solo los métodos habilitados para el canal web.',
      swagger: 'En /api/docs ejecuta GET /api/auth/config.',
      command: 'curl http://127.0.0.1:3000/api/auth/config',
      note: 'La pantalla login usa este endpoint para decidir qué métodos mostrar. Sus defaults salen de confisys.'
    },
    {
      title: 'Canales soportados',
      command: 'web\nmobile\ndevice',
      note: 'Cada método de autenticación declara en qué canales está disponible.'
    },
    {
      title: 'Métodos preparados',
      command: 'password\noauth2\noidc\nsaml\nmagic_link\ndevice_code\npasskey',
      note: 'Se activan por organización desde la política de seguridad del tenant.'
    },
    {
      title: 'Política default',
      command:
        'level: standard\npassword: enabled\nsession.webMode: refresh_cookie\npasskey: disabled\noidc/oauth2: disabled\ndevice_code: disabled',
      note: 'El setup inicial guarda esta política base en settings.security usando valores de confisys.'
    },
    {
      title: 'Regla de UI',
      ui: 'Si un método está desactivado, no debe aparecer como opción en login web ni móvil.',
      command: 'Si un método no está activo para el canal actual, el componente visual no debe mostrarlo.',
      note: 'Esto mejora la experiencia; los permisos reales siempre se validan en backend.'
    },
    {
      title: 'Login real',
      ui: 'Abre /login, escribe tenant si aplica, email y password. Al entrar, la app guarda la sesión y envía a /home.',
      swagger: 'En /api/docs ejecuta POST /api/auth/login y copia el accessToken para Authorize.',
      command:
        'curl -X POST http://127.0.0.1:3000/api/auth/login \\\n  -H "Content-Type: application/json" \\\n  -d \'{"email":"admin@example.com","password":"CambiaEstaClave123","tenantSlug":"mi-empresa"}\'',
      note: 'Devuelve accessToken Bearer, usuario, tenant, roles y permisos.'
    },
    {
      title: 'Consultar sesión actual',
      ui: 'En /home puedes ver usuario, tenant, rol sistema, roles y resumen de permisos cargados.',
      swagger: 'En /api/docs usa Authorize con Bearer TOKEN y ejecuta GET /api/auth/me.',
      command: 'curl http://127.0.0.1:3000/api/auth/me -H "Authorization: Bearer TOKEN"',
      note: 'Valida el token, la sesión activa, el usuario, el tenant y los permisos efectivos.'
    },
    {
      title: 'Refrescar sesión web',
      ui: 'La app lo hace sola cuando hidrata sesión. El usuario no debe ejecutar nada manualmente.',
      swagger: 'En /api/docs ejecuta POST /api/auth/refresh si el navegador conserva la cookie chicle_refresh.',
      command: 'curl -X POST http://127.0.0.1:3000/api/auth/refresh -b "chicle_refresh=COOKIE"',
      note: 'La app lo hace automáticamente con cookie HttpOnly. El backend rota el refresh token.'
    },
    {
      title: 'Confisys protegido',
      ui: 'Abre /confisys desde Home o la barra superior. Solo aparece si tienes confisys.read.',
      swagger: 'En /api/docs usa Authorize y ejecuta GET /api/confisys.',
      command: 'curl http://127.0.0.1:3000/api/confisys -H "Authorization: Bearer TOKEN"',
      note: 'Requiere confisys.read. Para guardar cambios requiere confisys.update.'
    },
    {
      title: 'Administrar seguridad',
      ui: 'Abre /security desde Home. Ahí gestionas usuarios, roles, permisos y auditoría.',
      swagger: 'En /api/docs usa los grupos Security / Users y Security / RBAC.',
      note: 'Permite gestionar usuarios, roles, permisos y revisar auditoría del tenant.'
    },
    {
      title: 'Sincronizar seguridad base',
      ui: 'En /security toca Sincronizar seguridad cuando agreguemos permisos, roles o menús base nuevos al producto.',
      swagger: 'En /api/docs ejecuta POST /api/security/sync con Bearer token autorizado.',
      command: 'curl -X POST http://127.0.0.1:3000/api/security/sync -H "Authorization: Bearer TOKEN"',
      note: 'No resetea la organización. Repara permisos, roles built-in y menús base del tenant actual.'
    },
    {
      title: 'Usuarios y roles por API',
      ui: 'En /security usa el panel de usuarios para crear/editar y el panel de roles para revisar permisos.',
      swagger: 'En /api/docs prueba GET /api/users, GET /api/roles y PUT /api/roles/{roleId}/permissions.',
      command:
        'curl http://127.0.0.1:3000/api/users -H "Authorization: Bearer TOKEN"\\ncurl http://127.0.0.1:3000/api/roles -H "Authorization: Bearer TOKEN"',
      note: 'Usuarios requiere users.read. Roles requiere roles.read. Cambios de permisos requieren roles.manage.'
    },
    {
      title: 'Auditoría',
      ui: 'En /security revisa la sección de auditoría para ver cambios sensibles del tenant.',
      swagger: 'En /api/docs ejecuta GET /api/audit con Bearer token autorizado.',
      command: 'curl http://127.0.0.1:3000/api/audit -H "Authorization: Bearer TOKEN"',
      note: 'Registra cambios sensibles de usuarios y roles.'
    },
    {
      title: 'Logout',
      ui: 'Usa el botón Salir en Home, Seguridad o Configuración.',
      swagger: 'En /api/docs ejecuta POST /api/auth/logout con Bearer token.',
      command: 'curl -X POST http://127.0.0.1:3000/api/auth/logout -H "Authorization: Bearer TOKEN"',
      note: 'Invalida la sesión server-side y la app limpia el token local.'
    },
    {
      title: 'Estado frontend',
      command: 'sessionStorage: chicle.accessToken y chicle.session\nCookie HttpOnly: chicle_refresh',
      note: 'El access token es corto; la cookie refresh se guarda fuera del alcance de JavaScript.'
    },
    {
      title: 'Rate limit de login',
      command: '5 intentos fallidos en 10 minutos bloquean esa llave por 5 minutos',
      note: 'Se guarda en auth_login_attempts para persistir entre reinicios y funcionar como base multi-instancia.'
    },
    {
      title: 'Sesiones propias',
      ui: 'La UI administrativa puede usar esta información para mostrar sesiones activas y permitir revocarlas.',
      swagger: 'En /api/docs usa GET /api/auth/sessions y DELETE /api/auth/sessions/{sessionId}.',
      command:
        'curl http://127.0.0.1:3000/api/auth/sessions -H "Authorization: Bearer TOKEN"\\ncurl -X DELETE http://127.0.0.1:3000/api/auth/sessions/SESSION_ID -H "Authorization: Bearer TOKEN"',
      note: 'No se exponen hashes ni refresh tokens; solo metadatos de sesión.'
    },
    {
      title: 'CORS y producción',
      command: 'CHICLE_CORS_ORIGINS=https://app.tu-dominio.com',
      note: 'En producción la API no arranca sin allowlist explícita y rechaza el comodín *.'
    },
    {
      title: 'JWT secret fuerte',
      command: 'JWT_SECRET=usa-una-cadena-larga-aleatoria-de-32-o-mas-caracteres',
      note: 'En producción es obligatorio y debe tener al menos 32 caracteres.'
    },
    {
      title: 'Módulos protegidos',
      command: 'forms\nrecords\nfiles\nactions\ntenants\nmenus\nconfisys\nusers\nroles',
      note: 'Los endpoints existentes ya pasan por auth, tenant context y permisos cuando corresponde.'
    }
  ];

  readonly securityGuideSteps: CommandStep[] = [
    {
      title: 'Capa 1: setup seguro',
      command: 'not_created -> setup web -> tenant + owner -> ready',
      note: 'El sistema no nace con usuarios quemados. El primer owner se crea desde setup y queda asociado al primer tenant.'
    },
    {
      title: 'Capa 2: autenticación',
      command: 'POST /api/auth/login\nPOST /api/auth/refresh\nGET /api/auth/me\nPOST /api/auth/logout',
      note: 'El login entrega access token corto y refresh cookie HttpOnly. /auth/me valida sesión, usuario, tenant y permisos.'
    },
    {
      title: 'Capa 3: tenant scope',
      command: 'tenantId via JWT + sesión backend + usuario activo',
      note: 'Las operaciones protegidas deben ejecutarse dentro del tenant actual. No se debe confiar en tenantId enviado por el cliente.'
    },
    {
      title: 'Identidad y membresía',
      command:
        'users = identidad de login\n' +
        'tenant_memberships = relación del usuario con un tenant\n' +
        'systemRole y active viven por tenant',
      note: 'users.tenantId queda como compatibilidad temporal, pero la autoridad de pertenencia empieza a ser tenant_memberships.'
    },
    {
      title: 'Capa 4: roles y permisos',
      command: 'owner\nadmin\noperator\nviewer\npermissions: users.read, roles.manage, confisys.update...',
      note: 'La UI puede ocultar opciones, pero la decisión real siempre la toman JwtAuthGuard + PermissionsGuard en backend.'
    },
    {
      title: 'Capa 5: configuración por organización',
      command: 'settings.security + confisys defaults',
      note: 'Cada tenant guarda su política de seguridad. Confisys define defaults y parámetros globales que la API carga al iniciar.'
    },
    {
      title: 'Capa 6: auditoría',
      command: 'audit_events: user.created, user.updated, user.roles.updated, role.permissions.updated',
      note: 'Los cambios sensibles quedan registrados para revisión administrativa.'
    },
    {
      title: 'Capa 7: endurecimiento producción',
      command: 'CORS allowlist\nJWT_SECRET fuerte\nheaders HTTP\nrate limit persistente\nSwagger protegido',
      note: 'Estos controles ya están en la base. En production la API falla al arrancar si faltan valores críticos.'
    },
    {
      title: 'Pendiente avanzado para V1',
      command: 'OAuth2/OIDC real\nMFA\nPasskeys\nArgon2id\ncookie-only + CSRF\nHTTPS/TLS reverse proxy',
      note: 'Estos puntos requieren proveedor, UX de enrolamiento o componente de despliegue dedicado.'
    },
    {
      title: 'Swagger en producción',
      command: 'CHICLE_SWAGGER_ENABLED=false',
      note: 'Swagger queda apagado por defecto en production. Si se activa explícitamente, debe tener usuario y password por Basic Auth.'
    }
  ];

  readonly swaggerSteps: CommandStep[] = [
    {
      title: 'Abrir documentación interactiva',
      ui: 'Desde el manual, sección Swagger / API Docs, toca Abrir Swagger.',
      command: 'http://localhost:3000/api/docs',
      note: 'La API debe estar corriendo. Si cambiaste API_PORT, usa ese puerto.'
    },
    {
      title: 'Probar flujo desde Swagger',
      ui: 'Swagger abre una pantalla gráfica con grupos de endpoints. Usa Try it out para probar cada operación.',
      command: '1. GET /api/setup/status\n2. POST /api/setup si state es not_created\n3. POST /api/auth/login\n4. Copiar accessToken\n5. Authorize -> Bearer TOKEN',
      note: 'Después de Authorize puedes probar /users, /roles, /permissions, /audit y /confisys.'
    },
    {
      title: 'Refresh cookie',
      command: 'POST /api/auth/refresh',
      note: 'Swagger muestra el endpoint, pero la cookie chicle_refresh es HttpOnly; el navegador la maneja si login se ejecuta desde la misma API.'
    },
    {
      title: 'Ejemplos incluidos',
      command: 'Setup\nAuth\nSecurity / Users\nSecurity / RBAC\nConfisys',
      note: 'Los endpoints principales tienen ejemplos de body, respuestas y permisos requeridos.'
    },
    {
      title: 'Protección en producción',
      command: 'CHICLE_SWAGGER_ENABLED=true\nCHICLE_SWAGGER_USER=admin-docs\nCHICLE_SWAGGER_PASSWORD=usa-una-clave-larga',
      note: 'En production no arranca Swagger habilitado si faltan CHICLE_SWAGGER_USER o CHICLE_SWAGGER_PASSWORD.'
    }
  ];

  readonly startupSteps: CommandStep[] = [
    {
      title: 'Usar la versión correcta de Node',
      ui: 'No aplica dentro de la app. Es un requisito para desarrolladores antes de iniciar servicios.',
      command: 'nvm use',
      note: 'Lee .nvmrc y activa Node 22.'
    },
    {
      title: 'Instalar dependencias',
      command: 'npm install',
      note: 'Solo hace falta cuando cambia package.json o package-lock.json.'
    },
    {
      title: 'Correr la app web',
      ui: 'Después de arrancar, abre http://localhost:8100 en el navegador.',
      command: 'npm run dev:app',
      note: 'Ejecuta este comando desde la raíz del proyecto. Usa APP_PORT o el default 8100.'
    },
    {
      title: 'Correr solo desde apps/app',
      command: 'npm run start',
      note: 'Alternativa cuando ya estás dentro de la carpeta de la app.'
    },
    {
      title: 'Abrir Docker Desktop',
      ui: 'Abre Docker Desktop desde macOS y espera a que indique que el motor está corriendo.',
      command: 'open -a Docker',
      note: 'Hazlo antes de levantar servicios con Docker Compose.'
    },
    {
      title: 'Levantar la base de datos',
      command: 'docker compose --env-file infra/docker/.env.example -f infra/docker/docker-compose.yml up db',
      note: 'Lee DB_PORT desde infra/docker/.env.example. Si no existe, usa el default 3306.'
    },
    {
      title: 'Correr la API',
      command: 'DB_HOST=127.0.0.1 DB_SYNCHRONIZE=true npm run dev:api',
      note: 'Para desarrollo local usa 127.0.0.1. En Docker, API_PORT y DB_SYNCHRONIZE salen de infra/docker/.env.example.'
    },
    {
      title: 'Correr API con Docker',
      command: 'docker compose --env-file infra/docker/.env.example -f infra/docker/docker-compose.yml up --build api',
      note: 'Levanta API y DB usando los valores de infra/docker/.env.example.'
    },
    {
      title: 'Administrar confisys',
      ui: 'Abre /confisys desde Home o desde la barra superior si tienes permiso confisys.read.',
      note: 'Los cambios quedan en DB y aplican cuando reinicies la API.'
    },
    {
      title: 'Probar setup status',
      ui: 'En la app, /setup aparece cuando el backend responde not_created. Si aparece login, el sistema ya está listo.',
      swagger: 'En /api/docs ejecuta GET /api/setup/status.',
      command: 'curl http://127.0.0.1:3000/api/setup/status',
      note: 'Cambia 3000 por API_PORT si modificaste el puerto de la API.'
    },
    {
      title: 'Validar que todo compila',
      command: 'npm run build',
      note: 'Ejecuta este comando desde la raíz del proyecto. Útil antes de hacer commit o después de cambios grandes.'
    }
  ];

  readonly portSteps: CommandStep[] = [
    {
      title: 'Cambiar puerto de la app',
      command: 'APP_PORT=8200 npm run dev:app',
      note: 'Override temporal desde la terminal. El default sigue siendo 8100.'
    },
    {
      title: 'Cambiar puerto de la app desde apps/app',
      command: 'APP_PORT=8200 npm run start',
      note: 'Override temporal desde la terminal si ya estás dentro de apps/app.'
    },
    {
      title: 'Cambiar puertos de Docker',
      command: 'API_PORT=3100\nAPP_PORT=8200\nDB_PORT=3307',
      note: 'Ubicación: infra/docker/.env.example. Si no existen, Compose usa los defaults.'
    },
    {
      title: 'Aplicar puertos de Docker',
      command: 'docker compose --env-file infra/docker/.env.example -f infra/docker/docker-compose.yml up --build api',
      note: 'Recrea API y DB usando API_PORT y DB_PORT desde infra/docker/.env.example.'
    },
    {
      title: 'Probar API en puerto alterno',
      command: 'curl http://127.0.0.1:3100/api/setup/status',
      note: 'Usa el mismo número que pusiste en API_PORT.'
    }
  ];

  readonly confisysSteps: CommandStep[] = [
    {
      title: 'Consultar parámetros',
      ui: 'Abre /confisys para ver los parámetros cargados, su categoría, origen, valor y estado editable.',
      swagger: 'En /api/docs ejecuta GET /api/confisys con Bearer token.',
      command: 'curl http://127.0.0.1:3000/api/confisys',
      note: 'Lista todos los parámetros cargados desde la tabla confisys.'
    },
    {
      title: 'Consultar parámetros públicos',
      ui: 'La app puede leer estos valores sin sesión cuando necesita configurar pantallas públicas.',
      swagger: 'En /api/docs ejecuta GET /api/confisys/public.',
      command: 'curl http://127.0.0.1:3000/api/confisys/public',
      note: 'Devuelve solo los valores marcados como seguros para UI pública.'
    },
    {
      title: 'Abrir pantalla web',
      ui: 'Desde Home toca Configuración o abre /confisys directamente.',
      note: 'Desde ahí se editan los parámetros. Por ahora el cambio aplica al reiniciar API.'
    },
    {
      title: 'Qué se queda en env',
      ui: 'Estos valores no se editan desde la UI porque la API los necesita antes de poder leer la base de datos.',
      command: 'DB_HOST\nDB_PORT\nDB_USER\nDB_PASSWORD\nDB_NAME\nPORT\nAPI_PORT\nAPP_PORT',
      note: 'Son valores necesarios antes de que la API pueda leer la base de datos o antes de que Docker cree servicios.'
    },
    {
      title: 'Qué vive en confisys',
      ui: 'Estos valores sí deben administrarse desde /confisys cuando exista el permiso correspondiente.',
      command:
        'setup.seedProfile\nsecurity.level\nsecurity.password.minLength\nsecurity.session.accessTokenTtlMinutes\nfiles.storage.driver\nfeatures.offlineSync.enabled',
      note: 'Son parámetros de comportamiento que sí puede leer la API después de arrancar.'
    }
  ];

  readonly databaseSteps: CommandStep[] = [
    {
      title: 'Abrir visor DB',
      ui: 'Desde Home o la barra superior abre Base de datos. En Datos puedes seleccionar una tabla, ver filas y editar solo campos habilitados.',
      swagger: 'En /api/docs usa GET /api/database/tables y GET /api/database/tables/{table}.',
      command: 'curl http://127.0.0.1:3000/api/database/tables -H "Authorization: Bearer TOKEN"',
      note: 'Disponible para owner/admin. Las tablas sensibles quedan ocultas o bloqueadas.'
    },
    {
      title: 'Crear tabla custom',
      ui: 'En Base de datos -> Diseñador elige Crear tabla, usa un nombre custom_* y agrega campos iniciales. Toca Previsualizar antes de aplicar.',
      swagger: 'En /api/docs ejecuta POST /api/database/schema/preview y luego POST /api/database/schema/apply.',
      command:
        'curl -X POST http://127.0.0.1:3000/api/database/schema/preview \\\n  -H "Authorization: Bearer TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"operation":"create_table","tableName":"custom_clients","columns":[{"name":"name","type":"string","length":180,"nullable":false}]}\'',
      note: 'El diseñador agrega id, tenantId, createdAt y updatedAt automáticamente.'
    },
    {
      title: 'Agregar o editar campo',
      ui: 'En Diseñador elige Agregar campo o Editar campo. Revisa el SQL y la migración antes de aplicar.',
      swagger: 'Usa POST /api/database/schema/preview para revisar y POST /api/database/schema/apply para aplicar.',
      command:
        'operation: add_column\noperation: alter_column\nSolo tablas custom_* y columnas no protegidas.',
      note: 'Agregar un campo NOT NULL exige default o nullable=true para evitar romper filas existentes.'
    },
    {
      title: 'Eliminar campo',
      ui: 'En Diseñador elige Eliminar campo y escribe la frase exacta de confirmación que muestra la pantalla.',
      swagger: 'POST /api/database/schema/apply exige confirmation: "DROP custom_tabla.campo".',
      command: '{"operation":"drop_column","tableName":"custom_clients","currentColumnName":"phone","confirmation":"DROP custom_clients.phone"}',
      note: 'Borrar una columna elimina datos. Por eso requiere confirmación exacta.'
    },
    {
      title: 'Cómo se respeta la secuencia',
      ui: 'En la pestaña Historial verás el número de secuencia, SQL, estado y nombre de migración de cada cambio.',
      command:
        'schema_changes guarda:\nsequence\noperation\ntableName\nsql\nmigrationName\nmigrationSource\nstatus',
      note: 'Nunca se edita una migración vieja. Cada cambio crea una nueva migración ordenada.'
    },
    {
      title: 'Archivos de migración',
      ui: 'Aunque el contenedor no pueda escribir archivos, la migración completa queda guardada en Historial.',
      command:
        'CHICLE_SCHEMA_MIGRATIONS_WRITE_FILES=false\nCHICLE_SCHEMA_MIGRATIONS_DIR=src/database/migrations',
      note: 'Activa WRITE_FILES=true solo en desarrollo local cuando la API tenga permiso de escribir en el repo.'
    },
    {
      title: 'Comandos TypeORM',
      ui: 'El uso normal del diseñador es gráfico. Estos comandos quedan para mantenimiento técnico.',
      command:
        'npm run migration:run\nnpm run migration:revert\nnpm run migration:create\nnpm run migration:generate',
      note: 'Ejecuta desde la raíz del monorepo. La configuración vive en apps/api/src/database/data-source.ts.'
    }
  ];
}
