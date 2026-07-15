import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiKitAwareComponent } from '../../shared/ui-kit/ui-kit-aware.component';

export interface FlowGraphStep {
  id: string;
  key: string;
  name: string;
  type: string;
  position: number;
  config?: Record<string, unknown> | null;
  nextStepKey?: string | null;
  onSuccessStepKey?: string | null;
  onErrorStepKey?: string | null;
  onTimeoutStepKey?: string | null;
  onTrueStepKey?: string | null;
  onFalseStepKey?: string | null;
}

export interface FlowGraphStatus {
  stepKey: string;
  status: string;
}

interface FlowGraphConnection {
  label: string;
  target: string;
  tone: 'success' | 'danger' | 'warning' | 'neutral';
  explicit: boolean;
}

@Component({
  selector: 'app-flow-graph',
  standalone: true,
  host: {
    '[attr.data-ui-kit]': 'resolvedKit'
  },
  styles: [
    `
      :host {
        display: block;
      }

      .graph {
        display: grid;
        gap: 0;
      }

      .node-wrap {
        display: grid;
        justify-items: stretch;
      }

      .node {
        width: 100%;
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        padding: 0;
        text-align: left;
        cursor: pointer;
        overflow: hidden;
      }

      :host([data-ui-kit='material']) .node {
        border-radius: 4px;
        box-shadow: 0 1px 4px color-mix(in srgb, var(--ch-color-text) 12%, transparent);
      }

      :host([data-ui-kit='bootstrap']) .node {
        border-radius: 6px;
      }

      :host([data-ui-kit='ionic']) .node {
        border-radius: 16px;
      }

      :host([data-ui-kit='native']) .node {
        border-radius: 2px;
      }

      .node.active {
        border-color: var(--ch-color-primary);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--ch-color-primary) 12%, transparent);
      }

      .node-head {
        display: grid;
        grid-template-columns: 32px minmax(0, 1fr) auto;
        gap: 9px;
        align-items: center;
        padding: 10px;
        background: var(--ch-color-surface-alt);
      }

      .index {
        display: inline-flex;
        width: 30px;
        height: 30px;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: var(--ch-color-surface-muted);
        font-weight: 900;
      }

      .title {
        display: grid;
        gap: 2px;
        min-width: 0;
      }

      .title strong,
      .title small {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .title small {
        color: var(--ch-color-muted);
      }

      .status {
        border-radius: 999px;
        padding: 4px 7px;
        background: var(--ch-color-surface-muted);
        font-size: 0.72rem;
        font-weight: 900;
      }

      .status.success {
        background: var(--ch-color-success-soft);
        color: var(--ch-color-success);
      }

      .status.failed,
      .status.timeout {
        background: var(--ch-color-surface)0f0;
        color: var(--ch-color-danger);
      }

      .connections {
        display: grid;
        gap: 6px;
        padding: 9px 10px 10px 51px;
      }

      .connection {
        display: grid;
        grid-template-columns: 76px minmax(0, 1fr);
        gap: 8px;
        align-items: center;
        font-size: 0.82rem;
      }

      .connection-label {
        border-left: 3px solid #9db3c9;
        padding-left: 7px;
        color: var(--ch-color-muted);
        font-weight: 800;
      }

      .connection-label.success {
        border-color: var(--ch-color-success);
        color: var(--ch-color-success);
      }

      .connection-label.danger {
        border-color: var(--ch-color-danger);
        color: var(--ch-color-danger);
      }

      .connection-label.warning {
        border-color: var(--ch-color-warning);
        color: var(--ch-color-warning);
      }

      .connection-target {
        display: flex;
        gap: 6px;
        align-items: center;
        min-width: 0;
      }

      .connection-target span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .connection-target small {
        color: var(--ch-color-muted);
      }

      .spine {
        display: grid;
        justify-items: center;
        height: 24px;
        color: var(--ch-color-muted);
      }

      .spine::before {
        width: 1px;
        height: 14px;
        background: var(--ch-color-muted);
        content: '';
      }

      .empty {
        border: 1px dashed var(--ch-color-primary-border);
        border-radius: 8px;
        padding: 18px;
        color: var(--ch-color-muted);
        text-align: center;
      }

      @media (max-width: 620px) {
        .connections {
          padding-left: 10px;
        }

        .connection {
          grid-template-columns: 68px minmax(0, 1fr);
        }
      }
    `
  ],
  template: `
    <div class="graph" aria-label="Mapa de ejecución">
      @for (step of orderedSteps; track step.id; let index = $index; let last = $last) {
        <div class="node-wrap">
          <button class="node" type="button" [class.active]="step.id === selectedStepId" (click)="selected.emit(step)">
            <span class="node-head">
              <span class="index">{{ index + 1 }}</span>
              <span class="title">
                <strong>{{ step.name }}</strong>
                <small>{{ typeLabel(step.type) }} · {{ step.key }}</small>
              </span>
              @if (statusFor(step.key); as status) {
                <span
                  class="status"
                  [class.success]="status === 'success'"
                  [class.failed]="status === 'failed'"
                  [class.timeout]="status === 'timeout'"
                  >{{ status }}</span
                >
              }
            </span>
            <span class="connections">
              @for (connection of connectionsFor(step, index); track connection.label + connection.target) {
                <span class="connection">
                  <span
                    class="connection-label"
                    [class.success]="connection.tone === 'success'"
                    [class.danger]="connection.tone === 'danger'"
                    [class.warning]="connection.tone === 'warning'"
                    >{{ connection.label }}</span
                  >
                  <span class="connection-target">
                    <i class="pi pi-arrow-right" aria-hidden="true"></i>
                    <span>{{ targetLabel(connection.target) }}</span>
                    @if (!connection.explicit) {
                      <small>automático</small>
                    }
                  </span>
                </span>
              }
            </span>
          </button>
          @if (!last) {
            <span class="spine" aria-hidden="true"><i class="pi pi-chevron-down"></i></span>
          }
        </div>
      } @empty {
        <div class="empty">Agrega el primer paso para ver el mapa de ejecución.</div>
      }
    </div>
  `
})
export class FlowGraphComponent extends UiKitAwareComponent {
  @Input() steps: FlowGraphStep[] = [];
  @Input() selectedStepId = '';
  @Input() statuses: FlowGraphStatus[] = [];
  @Output() selected = new EventEmitter<FlowGraphStep>();

  get orderedSteps() {
    return [...this.steps].sort((left, right) => left.position - right.position);
  }

  statusFor(stepKey: string) {
    return this.statuses.find((status) => status.stepKey === stepKey)?.status ?? '';
  }

  connectionsFor(step: FlowGraphStep, index: number): FlowGraphConnection[] {
    const fallback = this.orderedSteps[index + 1]?.key ?? 'end';
    if (step.type === 'decision') {
      return [
        {
          label: 'Si',
          target: step.onTrueStepKey || fallback,
          tone: 'success',
          explicit: Boolean(step.onTrueStepKey)
        },
        {
          label: 'No',
          target: step.onFalseStepKey || fallback,
          tone: 'danger',
          explicit: Boolean(step.onFalseStepKey)
        }
      ];
    }

    const connections: FlowGraphConnection[] = [
      {
        label: 'Continúa',
        target: step.onSuccessStepKey || step.nextStepKey || fallback,
        tone: 'success',
        explicit: Boolean(step.onSuccessStepKey || step.nextStepKey)
      }
    ];
    if (
      step.type === 'dynamic_service' ||
      step.type === 'validation' ||
      step.type === 'parallel' ||
      step.type === 'foreach' ||
      step.type === 'subflow'
    ) {
      connections.push({
        label: 'Error',
        target: step.onErrorStepKey || 'stop',
        tone: 'danger',
        explicit: Boolean(step.onErrorStepKey)
      });
    }
    if (step.type === 'dynamic_service') {
      connections.push({
        label: 'Timeout',
        target: step.onTimeoutStepKey || step.onErrorStepKey || 'stop',
        tone: 'warning',
        explicit: Boolean(step.onTimeoutStepKey || step.onErrorStepKey)
      });
    }
    return connections;
  }

  targetLabel(key: string) {
    if (key === 'end') {
      return 'Fin del proceso';
    }
    if (key === 'stop') {
      return 'Detener y registrar error';
    }
    return this.steps.find((step) => step.key === key)?.name ?? key;
  }

  typeLabel(type: string) {
    const labels: Record<string, string> = {
      start: 'Inicio',
      dynamic_service: 'Servicio',
      parallel: 'En paralelo',
      foreach: 'Por cada elemento',
      subflow: 'Otro flow',
      delay: 'Espera',
      emit_event: 'Evento',
      formula: 'Fórmula',
      validation: 'Validación',
      decision: 'Decisión',
      action: 'Acción',
      response: 'Respuesta',
      end: 'Fin'
    };
    return labels[type] ?? type;
  }
}
