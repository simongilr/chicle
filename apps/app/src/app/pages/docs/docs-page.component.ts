import { Component } from '@angular/core';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';

interface CommandStep {
  title: string;
  command: string;
  note: string;
}

@Component({
  selector: 'app-docs-page',
  standalone: true,
  imports: [IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar],
  styles: [
    `
      .docs-shell {
        max-width: 980px;
        margin: 0 auto;
        padding: 24px 0 48px;
      }

      .intro {
        display: grid;
        gap: 8px;
        margin-bottom: 28px;
      }

      .intro h1 {
        margin: 0;
        color: #12324f;
        font-size: 2rem;
        line-height: 1.15;
      }

      .intro p,
      .section-lead {
        margin: 0;
        color: #4d5c6c;
        line-height: 1.55;
      }

      section {
        margin-top: 28px;
      }

      h2 {
        margin: 0 0 12px;
        color: #173b5f;
        font-size: 1.25rem;
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
        .docs-shell {
          padding-top: 12px;
        }

        .intro h1 {
          font-size: 1.55rem;
        }
      }
    `
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/setup"></ion-back-button>
        </ion-buttons>
        <ion-title>Documentación</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <main class="docs-shell">
        <header class="intro">
          <h1>Primeros pasos de Chicle Engine</h1>
          <p>
            Esta página guarda las instrucciones operativas del proyecto para que no dependamos
            de recordar comandos sueltos. La iremos enriqueciendo conforme avance el producto.
          </p>
        </header>

        <section>
          <h2>Regla rápida</h2>
          <p class="section-lead">
            Si estás en la raíz del proyecto usa los comandos del monorepo. Si ya entraste a
            <code>apps/app</code>, usa el comando propio de la app. Los puertos se cambian en
            <code>infra/docker/.env.example</code>.
          </p>
        </section>

        <section>
          <h2>Cómo funciona el env</h2>
          <p class="section-lead">
            Siempre dejamos un valor por defecto para que el proyecto arranque sin configuración
            extra. Si existe un valor en <code>infra/docker/.env.example</code> o en la terminal,
            ese valor reemplaza el default.
          </p>
        </section>

        <section>
          <h2>Primer uso</h2>
          <div class="steps">
            @for (step of firstRunSteps; track step.title) {
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

        <section>
          <h2>Estado del sistema</h2>
          <p class="section-lead">
            La app decide qué mostrar usando <code>/api/setup/status</code>. Si responde
            <code>not_created</code>, el backend está vivo y falta crear el sistema. Si no responde,
            el problema es conexión, API o base de datos.
          </p>
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

        <section>
          <h2>Semillas iniciales</h2>
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

        <section>
          <h2>Arranque recomendado</h2>
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

        <section>
          <h2>Cambiar puertos</h2>
          <p class="section-lead">
            Si otro proyecto ya usa un puerto, cambia el valor correspondiente y vuelve a ejecutar
            el comando. Ubicación: <code>infra/docker/.env.example</code>.
          </p>
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

        <section>
          <h2>Errores comunes</h2>
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
      </main>
    </ion-content>
  `
})
export class DocsPageComponent {
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
}
