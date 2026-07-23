import { Component, Input } from '@angular/core';

export type ArchitectureTopologyTone = 'front' | 'api' | 'runtime' | 'data' | 'ai' | 'infra' | 'event' | 'security';
export type ArchitectureTopologyLinkKind = 'sync' | 'data' | 'async' | 'ai' | 'infra' | 'security';

export interface ArchitectureTopologyZone {
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tone?: ArchitectureTopologyTone;
}

export interface ArchitectureTopologyNode {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  tone?: ArchitectureTopologyTone;
  x: number;
  y: number;
}

export interface ArchitectureTopologyLink {
  from: string;
  to: string;
  label: string;
  kind?: ArchitectureTopologyLinkKind;
}

@Component({
  selector: 'app-architecture-topology-diagram',
  standalone: true,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .topology-shell {
        display: grid;
        gap: 14px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
        padding: 16px;
      }

      .topology-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 12px;
      }

      .topology-header div {
        display: grid;
        gap: 4px;
      }

      h3,
      p {
        margin: 0;
      }

      h3 {
        color: var(--ch-color-text);
        font-size: 1.08rem;
        line-height: 1.25;
      }

      p {
        color: var(--ch-color-muted);
        line-height: 1.45;
      }

      .topology-badge {
        flex: 0 0 auto;
        border: 1px solid var(--ch-color-primary-border);
        border-radius: 999px;
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-text);
        padding: 6px 10px;
        font-size: 0.76rem;
        font-weight: 850;
        white-space: nowrap;
      }

      .topology-board {
        position: relative;
        min-height: 820px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background:
          radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--ch-color-border) 68%, transparent) 1px, transparent 0),
          var(--ch-color-surface);
        background-size: 18px 18px;
        overflow: hidden;
      }

      .zone {
        --zone-color: var(--ch-color-primary);
        position: absolute;
        display: grid;
        align-content: start;
        border: 1px dashed color-mix(in srgb, var(--zone-color) 35%, var(--ch-color-border));
        border-radius: var(--ch-radius);
        background: color-mix(in srgb, var(--zone-color) 5%, transparent);
        padding: 9px;
      }

      .zone[data-tone='front'] {
        --zone-color: #4f46e5;
      }

      .zone[data-tone='api'] {
        --zone-color: var(--ch-color-primary);
      }

      .zone[data-tone='runtime'] {
        --zone-color: var(--ch-color-success);
      }

      .zone[data-tone='data'] {
        --zone-color: var(--ch-color-warning);
      }

      .zone[data-tone='ai'] {
        --zone-color: #0f766e;
      }

      .zone[data-tone='infra'] {
        --zone-color: #64748b;
      }

      .zone[data-tone='event'] {
        --zone-color: #b45309;
      }

      .zone[data-tone='security'] {
        --zone-color: var(--ch-color-danger);
      }

      .zone-title {
        color: color-mix(in srgb, var(--zone-color) 72%, var(--ch-color-text));
        font-size: 0.72rem;
        font-weight: 900;
        text-transform: uppercase;
      }

      .connections {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 2;
      }

      .connection {
        stroke: var(--ch-color-primary);
        stroke-width: 0.42;
        stroke-linecap: round;
        stroke-linejoin: round;
        opacity: 0.78;
      }

      .connection[data-kind='data'] {
        stroke: var(--ch-color-warning);
      }

      .connection[data-kind='async'] {
        stroke: #b45309;
        stroke-dasharray: 1.8 1.3;
      }

      .connection[data-kind='ai'] {
        stroke: #0f766e;
        stroke-dasharray: 1.5 1.5;
      }

      .connection[data-kind='infra'] {
        stroke: #64748b;
      }

      .connection[data-kind='security'] {
        stroke: var(--ch-color-danger);
      }

      .topology-node {
        --node-color: var(--ch-color-primary);
        position: absolute;
        z-index: 3;
        display: grid;
        justify-items: center;
        gap: 6px;
        width: 132px;
        min-height: 86px;
        transform: translate(-50%, -50%);
        border: 1px solid color-mix(in srgb, var(--node-color) 36%, var(--ch-color-border));
        border-radius: 10px;
        background: color-mix(in srgb, var(--ch-color-surface) 98%, transparent);
        box-shadow: var(--ch-shadow-card);
        padding: 10px;
        text-align: center;
      }

      .topology-node[data-tone='front'] {
        --node-color: #4f46e5;
      }

      .topology-node[data-tone='api'] {
        --node-color: var(--ch-color-primary);
      }

      .topology-node[data-tone='runtime'] {
        --node-color: var(--ch-color-success);
      }

      .topology-node[data-tone='data'] {
        --node-color: var(--ch-color-warning);
      }

      .topology-node[data-tone='ai'] {
        --node-color: #0f766e;
      }

      .topology-node[data-tone='infra'] {
        --node-color: #64748b;
      }

      .topology-node[data-tone='event'] {
        --node-color: #b45309;
      }

      .topology-node[data-tone='security'] {
        --node-color: var(--ch-color-danger);
      }

      .node-logo {
        display: inline-grid;
        place-items: center;
        width: 36px;
        height: 36px;
        border: 1px solid color-mix(in srgb, var(--node-color) 34%, var(--ch-color-border));
        border-radius: 9px;
        background: color-mix(in srgb, var(--node-color) 12%, var(--ch-color-surface));
        color: var(--node-color);
        font-size: 1.05rem;
      }

      .node-copy {
        display: grid;
        gap: 2px;
      }

      .node-copy strong {
        color: var(--ch-color-text);
        font-size: 0.88rem;
        line-height: 1.15;
      }

      .node-copy span {
        color: var(--ch-color-muted);
        font-size: 0.68rem;
        font-weight: 850;
        text-transform: uppercase;
      }

      .topology-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 10px;
      }

      .connection-list {
        display: grid;
        gap: 10px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 12px;
      }

      .connection-list strong {
        color: var(--ch-color-text);
        font-size: 0.86rem;
      }

      .connection-items {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 8px;
      }

      .connection-chip {
        --chip-color: var(--ch-color-primary);
        display: grid;
        gap: 3px;
        min-width: 0;
        border: 1px solid color-mix(in srgb, var(--chip-color) 28%, var(--ch-color-border));
        border-left: 4px solid var(--chip-color);
        border-radius: 8px;
        background: var(--ch-color-surface-alt);
        padding: 8px;
      }

      .connection-chip[data-kind='data'] {
        --chip-color: var(--ch-color-warning);
      }

      .connection-chip[data-kind='async'] {
        --chip-color: #b45309;
      }

      .connection-chip[data-kind='ai'] {
        --chip-color: #0f766e;
      }

      .connection-chip[data-kind='infra'] {
        --chip-color: #64748b;
      }

      .connection-chip[data-kind='security'] {
        --chip-color: var(--ch-color-danger);
      }

      .connection-chip span {
        color: var(--ch-color-muted);
        font-size: 0.7rem;
        font-weight: 850;
        text-transform: uppercase;
      }

      .connection-chip b {
        color: var(--ch-color-text);
        font-size: 0.82rem;
        line-height: 1.24;
      }

      .topology-legend span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--ch-color-muted);
        font-size: 0.78rem;
        font-weight: 850;
      }

      .topology-legend i {
        width: 22px;
        height: 3px;
        border-radius: 999px;
        background: var(--ch-color-primary);
      }

      .topology-legend span:nth-child(2) i {
        background: var(--ch-color-warning);
      }

      .topology-legend span:nth-child(3) i {
        background: #b45309;
      }

      .topology-legend span:nth-child(4) i {
        background: #0f766e;
      }

      .mobile-stack {
        display: none;
        gap: 10px;
      }

      @media (max-width: 780px) {
        .topology-board {
          display: none;
        }

        .mobile-stack {
          display: grid;
        }

        .mobile-node {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid var(--ch-color-border);
          border-radius: var(--ch-radius);
          background: var(--ch-color-surface);
          padding: 10px;
        }

        .topology-header {
          display: grid;
        }
      }
    `
  ],
  template: `
    <section class="topology-shell" [attr.aria-label]="title">
      <header class="topology-header">
        <div>
          <h3>{{ title }}</h3>
          @if (description) {
            <p>{{ description }}</p>
          }
        </div>
        @if (badge) {
          <span class="topology-badge">{{ badge }}</span>
        }
      </header>

      <div class="topology-board">
        @for (zone of zones; track zone.title) {
          <div
            class="zone"
            [attr.data-tone]="zone.tone ?? 'api'"
            [style.left.%]="zone.x"
            [style.top.%]="zone.y"
            [style.width.%]="zone.width"
            [style.height.%]="zone.height"
          >
            <span class="zone-title">{{ zone.title }}</span>
          </div>
        }

        <svg class="connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id="topology-arrow" markerWidth="6" markerHeight="6" refX="5.5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="currentColor"></path>
            </marker>
          </defs>
          @for (link of links; track link.from + '-' + link.to + '-' + link.label) {
            <path
              class="connection"
              [attr.data-kind]="link.kind ?? 'sync'"
              fill="none"
              [attr.d]="path(link.from, link.to)"
              marker-end="url(#topology-arrow)"
            ></path>
          }
        </svg>

        @for (node of nodes; track node.id) {
          <article
            class="topology-node"
            [attr.data-tone]="node.tone ?? 'api'"
            [style.left.%]="node.x"
            [style.top.%]="node.y"
          >
            <span class="node-logo"><i [class]="node.icon ?? 'pi pi-circle'" aria-hidden="true"></i></span>
            <span class="node-copy">
              @if (node.subtitle) {
                <span>{{ node.subtitle }}</span>
              }
              <strong>{{ node.title }}</strong>
            </span>
          </article>
        }
      </div>

      <div class="connection-list">
        <strong>Comunicación entre piezas</strong>
        <div class="connection-items">
          @for (link of links; track link.from + '-' + link.to + '-' + link.label) {
            <span class="connection-chip" [attr.data-kind]="link.kind ?? 'sync'">
              <span>{{ nodeTitle(link.from) }} → {{ nodeTitle(link.to) }}</span>
              <b>{{ link.label }}</b>
            </span>
          }
        </div>
      </div>

      <div class="mobile-stack">
        @for (node of nodes; track node.id) {
          <article class="mobile-node">
            <span class="node-logo"><i [class]="node.icon ?? 'pi pi-circle'" aria-hidden="true"></i></span>
            <span class="node-copy">
              @if (node.subtitle) {
                <span>{{ node.subtitle }}</span>
              }
              <strong>{{ node.title }}</strong>
            </span>
          </article>
        }
      </div>

      @if (showLegend) {
        <div class="topology-legend">
          <span><i></i> HTTP / contratos</span>
          <span><i></i> Datos</span>
          <span><i></i> Eventos</span>
          <span><i></i> IA</span>
        </div>
      }
    </section>
  `
})
export class ArchitectureTopologyDiagramComponent {
  @Input({ required: true }) title = '';
  @Input() description = '';
  @Input() badge = '';
  @Input() showLegend = true;
  @Input() zones: ArchitectureTopologyZone[] = [];
  @Input({ required: true }) nodes: ArchitectureTopologyNode[] = [];
  @Input() links: ArchitectureTopologyLink[] = [];

  midX(from: string, to: string) {
    return (this.x(from) + this.x(to)) / 2;
  }

  nodeTitle(id: string) {
    return this.node(id)?.title ?? id;
  }

  midY(from: string, to: string) {
    return (this.y(from) + this.y(to)) / 2 - 1.4;
  }

  path(from: string, to: string) {
    const x1 = this.x(from);
    const y1 = this.y(from);
    const x2 = this.x(to);
    const y2 = this.y(to);
    const bend = Math.max(5, Math.min(14, Math.abs(x2 - x1) / 2));
    const c1 = x1 < x2 ? x1 + bend : x1 - bend;
    const c2 = x1 < x2 ? x2 - bend : x2 + bend;

    return `M ${x1} ${y1} C ${c1} ${y1}, ${c2} ${y2}, ${x2} ${y2}`;
  }

  private x(id: string) {
    return this.node(id)?.x ?? 0;
  }

  private y(id: string) {
    return this.node(id)?.y ?? 0;
  }

  private node(id: string) {
    return this.nodes.find((item) => item.id === id);
  }
}
