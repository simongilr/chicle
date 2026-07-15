import { Component, Input } from '@angular/core';
import { AppEntityCardComponent } from './app-entity-card.component';
import { AppMetricStripComponent } from './app-metric-strip.component';
import { AppTimelineComponent } from './app-timeline.component';
import { AppEntityCard, AppMetricItem, AppTimelineItem, AppVertical } from './app-visuals.types';

interface VerticalShowcaseConfig {
  title: string;
  eyebrow: string;
  description: string;
  metrics: AppMetricItem[];
  cards: AppEntityCard[];
  timelineTitle: string;
  timeline: AppTimelineItem[];
}

@Component({
  selector: 'app-vertical-app-showcase',
  standalone: true,
  imports: [AppEntityCardComponent, AppMetricStripComponent, AppTimelineComponent],
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .showcase {
        display: grid;
        gap: 14px;
        min-width: 0;
      }

      .intro {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 12px;
        min-width: 0;
      }

      .intro-copy {
        display: grid;
        gap: 4px;
        min-width: 0;
      }

      .eyebrow {
        color: #52677a;
        font-size: 0.72rem;
        font-weight: 850;
        text-transform: uppercase;
      }

      h3 {
        margin: 0;
        color: #12385c;
        font-size: 1.18rem;
        line-height: 1.1;
      }

      p {
        margin: 0;
        color: #52677a;
        font-size: 0.83rem;
        line-height: 1.35;
      }

      .badge {
        flex: 0 0 auto;
        border: 1px solid #bfd0e0;
        border-radius: 999px;
        background: #f5f9fd;
        color: #12385c;
        padding: 6px 10px;
        font-size: 0.72rem;
        font-weight: 850;
      }

      .content {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(190px, 0.42fr);
        gap: 12px;
        align-items: start;
      }

      .cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 10px;
        min-width: 0;
      }

      .timeline-panel {
        display: grid;
        gap: 8px;
        min-width: 0;
      }

      .timeline-panel h4 {
        margin: 0;
        color: #12385c;
        font-size: 0.86rem;
      }

      @media (max-width: 760px) {
        .intro {
          align-items: flex-start;
          flex-direction: column;
        }

        .content {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  template: `
    @let data = config;
    <section class="showcase">
      <header class="intro">
        <span class="intro-copy">
          <span class="eyebrow">{{ data.eyebrow }}</span>
          <h3>{{ data.title }}</h3>
          <p>{{ data.description }}</p>
        </span>
        <span class="badge">{{ verticalLabel }}</span>
      </header>

      <app-metric-strip [items]="data.metrics"></app-metric-strip>

      <div class="content">
        <div class="cards">
          @for (card of data.cards; track card.title) {
            <app-entity-card [card]="card"></app-entity-card>
          }
        </div>
        <aside class="timeline-panel">
          <h4>{{ data.timelineTitle }}</h4>
          <app-app-timeline [items]="data.timeline"></app-app-timeline>
        </aside>
      </div>
    </section>
  `
})
export class VerticalAppShowcaseComponent {
  @Input() vertical: AppVertical = 'events';

  readonly configs: Record<AppVertical, VerticalShowcaseConfig> = {
    events: {
      eyebrow: 'App social',
      title: 'Eventos',
      description: 'Gestiona agenda, invitados, entradas y check-in desde una misma experiencia.',
      metrics: [
        { label: 'Invitados confirmados', value: '248', trend: '+18 hoy', icon: 'pi pi-users' },
        { label: 'Entradas activas', value: '3', icon: 'pi pi-ticket' },
        { label: 'Check-in', value: '72%', icon: 'pi pi-check-circle' }
      ],
      cards: [
        {
          kind: 'event',
          title: 'Cena de lanzamiento',
          subtitle: 'Salon principal · 8:00 PM',
          status: 'En venta',
          actionLabel: 'Ver agenda'
        },
        {
          kind: 'ticket',
          title: 'Entrada VIP',
          subtitle: 'Acceso preferencial y zona lounge',
          price: '$120',
          status: 'Disponible'
        }
      ],
      timelineTitle: 'Operacion del evento',
      timeline: [
        { label: 'Invitaciones', detail: 'Segmentos enviados', state: 'complete' },
        { label: 'Venta', detail: 'Entradas y pases activos', state: 'active' },
        { label: 'Check-in', detail: 'Validacion en puerta', state: 'pending' }
      ]
    },
    real_estate: {
      eyebrow: 'App inmobiliaria',
      title: 'Inmobiliaria',
      description: 'Publica inmuebles, coordina visitas y acompana oportunidades comerciales.',
      metrics: [
        { label: 'Propiedades', value: '42', icon: 'pi pi-building' },
        { label: 'Visitas esta semana', value: '16', trend: '+4', icon: 'pi pi-calendar-clock' },
        { label: 'Oportunidades', value: '9', icon: 'pi pi-briefcase' }
      ],
      cards: [
        {
          kind: 'property',
          title: 'Apartamento Norte',
          subtitle: '3 hab · 2 banos · 89 m2',
          price: '$320K',
          status: 'Publicado'
        },
        {
          kind: 'service',
          title: 'Visita guiada',
          subtitle: 'Cliente interesado · manana 10:00 AM',
          status: 'Agendada'
        }
      ],
      timelineTitle: 'Embudo comercial',
      timeline: [
        { label: 'Captura', detail: 'Cliente deja datos', state: 'complete' },
        { label: 'Visita', detail: 'Agenda y recordatorio', state: 'active' },
        { label: 'Oferta', detail: 'Documentos y cierre', state: 'pending' }
      ]
    },
    tickets: {
      eyebrow: 'Venta de tickets',
      title: 'Tickets',
      description: 'Controla catalogo, zonas, ventas, validacion y reembolsos.',
      metrics: [
        { label: 'Tickets vendidos', value: '1.2K', trend: '+7%', icon: 'pi pi-ticket' },
        { label: 'Zonas', value: '5', icon: 'pi pi-map' },
        { label: 'Validaciones', value: '884', icon: 'pi pi-qrcode' }
      ],
      cards: [
        {
          kind: 'ticket',
          title: 'General etapa 2',
          subtitle: 'Disponible hasta agotar inventario',
          price: '$45',
          status: 'Activo'
        },
        {
          kind: 'inspection',
          title: 'Control de puerta',
          subtitle: 'Escaneo QR y antifraude',
          status: 'Online'
        }
      ],
      timelineTitle: 'Ciclo del ticket',
      timeline: [
        { label: 'Compra', detail: 'Pago confirmado', state: 'complete' },
        { label: 'Emision', detail: 'QR enviado al usuario', state: 'complete' },
        { label: 'Validacion', detail: 'Entrada en sitio', state: 'active' }
      ]
    },
    services: {
      eyebrow: 'Venta de servicios',
      title: 'Servicios',
      description: 'Agenda solicitudes, asigna operadores y mide cumplimiento.',
      metrics: [
        { label: 'Servicios activos', value: '31', icon: 'pi pi-briefcase' },
        { label: 'SLA cumplido', value: '94%', icon: 'pi pi-clock' },
        { label: 'Operadores', value: '12', icon: 'pi pi-users' }
      ],
      cards: [
        {
          kind: 'service',
          title: 'Instalacion premium',
          subtitle: 'Cliente comercial · zona centro',
          status: 'Asignado',
          actionLabel: 'Ruta'
        },
        {
          kind: 'inspection',
          title: 'Cierre con evidencia',
          subtitle: 'Foto, firma y GPS obligatorio',
          status: 'Pendiente'
        }
      ],
      timelineTitle: 'Ejecucion',
      timeline: [
        { label: 'Solicitud', detail: 'Cliente registra necesidad', state: 'complete' },
        { label: 'Asignacion', detail: 'Operador y agenda', state: 'active' },
        { label: 'Cierre', detail: 'Evidencia y encuesta', state: 'pending' }
      ]
    },
    games: {
      eyebrow: 'Miniapp gamificada',
      title: 'Minijuegos',
      description: 'Misiones, puntos, ranking y recompensas configurables.',
      metrics: [
        { label: 'Jugadores activos', value: '680', trend: '+52', icon: 'pi pi-users' },
        { label: 'Misiones', value: '14', icon: 'pi pi-bolt' },
        { label: 'Premios redimidos', value: '96', icon: 'pi pi-gift' }
      ],
      cards: [
        {
          kind: 'game',
          title: 'Reto diario',
          subtitle: 'Completa 3 acciones para ganar puntos',
          status: 'Disponible'
        },
        {
          kind: 'ticket',
          title: 'Cupon ganador',
          subtitle: 'Recompensa desbloqueada por ranking',
          status: 'Canjeable'
        }
      ],
      timelineTitle: 'Progreso del jugador',
      timeline: [
        { label: 'Ingreso', detail: 'Perfil creado', state: 'complete' },
        { label: 'Mision', detail: 'Acciones verificadas', state: 'active' },
        { label: 'Recompensa', detail: 'Canje o sorteo', state: 'pending' }
      ]
    },
    inspection: {
      eyebrow: 'Operacion movil',
      title: 'Inspeccion',
      description: 'Captura datos en campo con evidencias, GPS, cola offline y sincronizacion.',
      metrics: [
        { label: 'Inspecciones', value: '58', icon: 'pi pi-camera' },
        { label: 'Pendientes sync', value: '3', icon: 'pi pi-sync' },
        { label: 'Con GPS', value: '100%', icon: 'pi pi-map-marker' }
      ],
      cards: [
        {
          kind: 'inspection',
          title: 'Visita tecnica',
          subtitle: 'Foto obligatoria, GPS y observaciones',
          status: 'Offline ready'
        },
        {
          kind: 'service',
          title: 'Revision backend',
          subtitle: 'Idempotencia y evidencias',
          status: 'Seguro'
        }
      ],
      timelineTitle: 'Ruta movil',
      timeline: [
        { label: 'Captura', detail: 'Formulario tactil', state: 'active' },
        { label: 'Cola offline', detail: 'Reintento automatico', state: 'pending' },
        { label: 'Sincronizacion', detail: 'Registro y archivos', state: 'pending' }
      ]
    }
  };

  get config() {
    return this.configs[this.vertical];
  }

  get verticalLabel() {
    return this.vertical.replace('_', ' ');
  }
}
