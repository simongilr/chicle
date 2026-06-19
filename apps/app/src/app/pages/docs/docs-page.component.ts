import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';

interface CommandStep {
  title: string;
  command: string;
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
  imports: [RouterLink, IonContent],
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
    <ion-content>
      <header class="topbar">
        <div class="brand-block">
          <div class="brand">Chicle Engine</div>
          <div class="context-label">Manual operativo</div>
        </div>
        <nav class="top-actions" aria-label="Navegación principal">
          <a routerLink="/home">Inicio</a>
          <a routerLink="/setup">Setup</a>
          <a routerLink="/confisys">Configuración</a>
          <a routerLink="/security">Seguridad</a>
        </nav>
      </header>

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
                    <pre>{{ step.command }}</pre>
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
                    <pre>{{ step.command }}</pre>
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
                    <pre>{{ step.command }}</pre>
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
                    <pre>{{ step.command }}</pre>
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
                    <pre>{{ step.command }}</pre>
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
                    <pre>{{ step.command }}</pre>
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
                    <pre>{{ step.command }}</pre>
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
                    <pre>{{ step.command }}</pre>
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
                    <pre>{{ step.command }}</pre>
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

  activeSection = 'reglas';

  readonly firstRunSteps: CommandStep[] = [
    {
      title: 'Confirmar estado inicial',
      command: 'curl http://127.0.0.1:3000/api/setup/status',
      note: 'Debe responder state: "not_created" cuando el backend está vivo y el sistema aún no fue creado.'
    },
    {
      title: 'Crear el primer tenant',
      command: 'Abre http://localhost:8100/setup y completa organización, email admin, password y semilla blank.',
      note: 'Este es el flujo principal web. Si cambiaste APP_PORT, usa ese puerto en la URL.'
    },
    {
      title: 'Crear el primer tenant por API',
      command:
        'curl -X POST http://127.0.0.1:3000/api/setup \\\n  -H "Content-Type: application/json" \\\n  -d \'{"organization":"Mi Empresa","email":"admin@example.com","password":"CambiaEstaClave123","template":"blank"}\'',
      note: 'Alternativa técnica para validar backend. La pantalla setup usa este mismo endpoint.'
    },
    {
      title: 'Confirmar que ya quedó creado',
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
      command: 'CHICLE_ALLOW_SYSTEM_RESET=true\nCHICLE_RESET_KEY=usa-una-llave-local-larga',
      note: 'Ubicación: infra/docker/.env.example. No actives esto en producción.'
    },
    {
      title: 'Recrear API con la llave',
      command: 'docker compose --env-file infra/docker/.env.example -f infra/docker/docker-compose.yml up -d --build api',
      note: 'La API lee la bandera y la llave al iniciar.'
    },
    {
      title: 'Ejecutar reset',
      command:
        'curl -X POST http://127.0.0.1:3000/api/setup/reset \\\n  -H "Content-Type: application/json" \\\n  -H "x-chicle-reset-key: usa-una-llave-local-larga" \\\n  -d \'{"confirm":"RESET CHICLE ENGINE"}\'',
      note: 'Elimina tenant, usuarios, sesiones, roles de tenant, forms, records y auditoría. Conserva confisys y permisos globales.'
    },
    {
      title: 'Desactivar después',
      command: 'CHICLE_ALLOW_SYSTEM_RESET=false',
      note: 'Vuelve a levantar la API para cerrar la herramienta de reset.'
    }
  ];

  readonly securitySteps: CommandStep[] = [
    {
      title: 'Consultar política pública',
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
      command: 'Si un método no está activo para el canal actual, el componente visual no debe mostrarlo.',
      note: 'Esto mejora la experiencia; los permisos reales siempre se validan en backend.'
    },
    {
      title: 'Login real',
      command:
        'curl -X POST http://127.0.0.1:3000/api/auth/login \\\n  -H "Content-Type: application/json" \\\n  -d \'{"email":"admin@example.com","password":"CambiaEstaClave123","tenantSlug":"mi-empresa"}\'',
      note: 'Devuelve accessToken Bearer, usuario, tenant, roles y permisos.'
    },
    {
      title: 'Consultar sesión actual',
      command: 'curl http://127.0.0.1:3000/api/auth/me -H "Authorization: Bearer TOKEN"',
      note: 'Valida el token, la sesión activa, el usuario, el tenant y los permisos efectivos.'
    },
    {
      title: 'Refrescar sesión web',
      command: 'curl -X POST http://127.0.0.1:3000/api/auth/refresh -b "chicle_refresh=COOKIE"',
      note: 'La app lo hace automáticamente con cookie HttpOnly. El backend rota el refresh token.'
    },
    {
      title: 'Confisys protegido',
      command: 'curl http://127.0.0.1:3000/api/confisys -H "Authorization: Bearer TOKEN"',
      note: 'Requiere confisys.read. Para guardar cambios requiere confisys.update.'
    },
    {
      title: 'Administrar seguridad',
      command: 'Abre http://localhost:8100/security',
      note: 'Permite gestionar usuarios, roles, permisos y revisar auditoría del tenant.'
    },
    {
      title: 'Usuarios y roles por API',
      command:
        'curl http://127.0.0.1:3000/api/users -H "Authorization: Bearer TOKEN"\\ncurl http://127.0.0.1:3000/api/roles -H "Authorization: Bearer TOKEN"',
      note: 'Usuarios requiere users.read. Roles requiere roles.read. Cambios de permisos requieren roles.manage.'
    },
    {
      title: 'Auditoría',
      command: 'curl http://127.0.0.1:3000/api/audit -H "Authorization: Bearer TOKEN"',
      note: 'Registra cambios sensibles de usuarios y roles.'
    },
    {
      title: 'Logout',
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
      note: 'Es memoria local de API. En producción multi-instancia se moverá a storage compartido.'
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
      title: 'Pendiente para V1',
      command: 'OAuth2/OIDC real\nMFA\nPasskeys\nrate limit persistente\nCORS estricto\nJWT_SECRET obligatorio fuerte\nHTTPS/TLS en deploy',
      note: 'La base está lista para crecer modularmente, pero estos puntos todavía deben cerrarse antes de una V1 productiva.'
    }
  ];

  readonly swaggerSteps: CommandStep[] = [
    {
      title: 'Abrir documentación interactiva',
      command: 'http://localhost:3000/api/docs',
      note: 'La API debe estar corriendo. Si cambiaste API_PORT, usa ese puerto.'
    },
    {
      title: 'Probar flujo desde Swagger',
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
    }
  ];

  readonly startupSteps: CommandStep[] = [
    {
      title: 'Usar la versión correcta de Node',
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
      command: 'Abre http://localhost:8100/confisys',
      note: 'Los cambios quedan en DB y aplican cuando reinicies la API.'
    },
    {
      title: 'Probar setup status',
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
      command: 'curl http://127.0.0.1:3000/api/confisys',
      note: 'Lista todos los parámetros cargados desde la tabla confisys.'
    },
    {
      title: 'Consultar parámetros públicos',
      command: 'curl http://127.0.0.1:3000/api/confisys/public',
      note: 'Devuelve solo los valores marcados como seguros para UI pública.'
    },
    {
      title: 'Abrir pantalla web',
      command: 'http://localhost:8100/confisys',
      note: 'Desde ahí se editan los parámetros. Por ahora el cambio aplica al reiniciar API.'
    },
    {
      title: 'Qué se queda en env',
      command: 'DB_HOST\nDB_PORT\nDB_USER\nDB_PASSWORD\nDB_NAME\nPORT\nAPI_PORT\nAPP_PORT',
      note: 'Son valores necesarios antes de que la API pueda leer la base de datos o antes de que Docker cree servicios.'
    },
    {
      title: 'Qué vive en confisys',
      command:
        'setup.seedProfile\nsecurity.level\nsecurity.password.minLength\nsecurity.session.accessTokenTtlMinutes\nfiles.storage.driver\nfeatures.offlineSync.enabled',
      note: 'Son parámetros de comportamiento que sí puede leer la API después de arrancar.'
    }
  ];
}
