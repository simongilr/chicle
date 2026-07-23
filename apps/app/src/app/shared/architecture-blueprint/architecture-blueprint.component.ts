import { Component, Input } from '@angular/core';

export type ArchitectureBlueprintTone = 'front' | 'api' | 'runtime' | 'data' | 'ai' | 'infra' | 'event' | 'security';
export type ArchitectureBlueprintLinkKind = 'sync' | 'data' | 'async' | 'ai' | 'infra';

export interface ArchitectureBlueprintNode {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  step?: string;
  icon?: string;
  tone?: ArchitectureBlueprintTone;
  x: number;
  y: number;
  width: number;
  height: number;
  bullets?: string[];
}

export interface ArchitectureBlueprintLink {
  from: string;
  to: string;
  label: string;
  kind?: ArchitectureBlueprintLinkKind;
}

export interface ArchitectureBlueprintStage {
  title: string;
  summary: string;
  x: number;
  width: number;
}

export interface ArchitectureBlueprintGroup {
  title: string;
  summary: string;
  nodeIds: string[];
  flowLabel?: string;
  tone?: ArchitectureBlueprintTone;
}

@Component({
  selector: 'app-architecture-blueprint',
  standalone: true,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .blueprint-shell {
        display: grid;
        gap: 14px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background:
          linear-gradient(var(--ch-color-border) 1px, transparent 1px),
          linear-gradient(90deg, var(--ch-color-border) 1px, transparent 1px),
          var(--ch-color-surface-alt);
        background-size: 24px 24px;
        padding: 16px;
        overflow-x: auto;
      }

      .blueprint-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: color-mix(in srgb, var(--ch-color-surface) 92%, transparent);
        padding: 12px;
        backdrop-filter: blur(10px);
      }

      .blueprint-header div {
        display: grid;
        gap: 4px;
      }

      h3,
      p {
        margin: 0;
      }

      h3 {
        color: var(--ch-color-text);
        font-size: 1.12rem;
        line-height: 1.22;
      }

      p {
        color: var(--ch-color-muted);
        line-height: 1.48;
      }

      .blueprint-badge {
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

      .canvas {
        position: relative;
        min-width: 1120px;
        min-height: 760px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: color-mix(in srgb, var(--ch-color-surface) 82%, transparent);
        overflow: hidden;
      }

      .roadmap {
        display: grid;
        gap: 14px;
        max-width: 980px;
        margin: 0 auto;
      }

      .roadmap-group {
        --group-color: var(--ch-color-primary);
        display: grid;
        gap: 12px;
        border: 1px solid color-mix(in srgb, var(--group-color) 24%, var(--ch-color-border));
        border-left: 5px solid var(--group-color);
        border-radius: var(--ch-radius);
        background: color-mix(in srgb, var(--ch-color-surface) 95%, transparent);
        box-shadow: var(--ch-shadow-card);
        padding: 14px;
      }

      .roadmap-group[data-tone='front'] {
        --group-color: #4f46e5;
      }

      .roadmap-group[data-tone='api'] {
        --group-color: var(--ch-color-primary);
      }

      .roadmap-group[data-tone='runtime'] {
        --group-color: var(--ch-color-success);
      }

      .roadmap-group[data-tone='data'] {
        --group-color: var(--ch-color-warning);
      }

      .roadmap-group[data-tone='ai'] {
        --group-color: #0f766e;
      }

      .roadmap-group[data-tone='infra'] {
        --group-color: #64748b;
      }

      .roadmap-group[data-tone='event'] {
        --group-color: #b45309;
      }

      .roadmap-group[data-tone='security'] {
        --group-color: var(--ch-color-danger);
      }

      .roadmap-group-header {
        display: grid;
        gap: 4px;
      }

      .roadmap-group-header strong {
        color: var(--ch-color-text);
        font-size: 1rem;
        line-height: 1.25;
      }

      .roadmap-group-header span {
        color: var(--ch-color-muted);
        line-height: 1.45;
      }

      .roadmap-nodes {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
        gap: 10px;
      }

      .roadmap-node {
        --node-color: var(--group-color);
        display: grid;
        align-content: start;
        gap: 8px;
        min-width: 0;
        border: 1px solid color-mix(in srgb, var(--node-color) 26%, var(--ch-color-border));
        border-radius: calc(var(--ch-radius) - 2px);
        background: var(--ch-color-surface-alt);
        padding: 12px;
      }

      .roadmap-node[data-tone='front'] {
        --node-color: #4f46e5;
      }

      .roadmap-node[data-tone='api'] {
        --node-color: var(--ch-color-primary);
      }

      .roadmap-node[data-tone='runtime'] {
        --node-color: var(--ch-color-success);
      }

      .roadmap-node[data-tone='data'] {
        --node-color: var(--ch-color-warning);
      }

      .roadmap-node[data-tone='ai'] {
        --node-color: #0f766e;
      }

      .roadmap-node[data-tone='infra'] {
        --node-color: #64748b;
      }

      .roadmap-node[data-tone='event'] {
        --node-color: #b45309;
      }

      .roadmap-node[data-tone='security'] {
        --node-color: var(--ch-color-danger);
      }

      .roadmap-flow {
        display: grid;
        place-items: center;
        gap: 5px;
        color: var(--ch-color-muted);
      }

      .roadmap-flow i {
        display: inline-grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border: 1px solid var(--ch-color-primary-border);
        border-radius: 999px;
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-primary);
        font-style: normal;
        font-weight: 900;
      }

      .roadmap-flow span {
        max-width: 560px;
        text-align: center;
        font-size: 0.84rem;
        font-weight: 800;
      }

      .stage {
        position: absolute;
        top: 12px;
        bottom: 12px;
        display: grid;
        align-content: start;
        gap: 3px;
        border: 1px dashed color-mix(in srgb, var(--ch-color-primary) 26%, var(--ch-color-border));
        border-radius: var(--ch-radius);
        background: color-mix(in srgb, var(--ch-color-primary-soft) 30%, transparent);
        padding: 8px;
        pointer-events: none;
        z-index: 0;
      }

      .stage strong {
        color: var(--ch-color-text);
        font-size: 0.72rem;
        line-height: 1.2;
        text-transform: uppercase;
      }

      .stage span {
        color: var(--ch-color-muted);
        font-size: 0.7rem;
        line-height: 1.25;
      }

      .links {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
      }

      .link-line {
        stroke: var(--ch-color-primary);
        stroke-width: 0.45;
        stroke-linecap: round;
        stroke-linejoin: round;
        opacity: 0.68;
      }

      .link-line[data-kind='data'] {
        stroke: var(--ch-color-warning);
      }

      .link-line[data-kind='async'] {
        stroke: #b45309;
        stroke-dasharray: 2 1.6;
      }

      .link-line[data-kind='ai'] {
        stroke: #0f766e;
        stroke-dasharray: 1.4 1.4;
      }

      .link-line[data-kind='infra'] {
        stroke: #64748b;
      }

      .link-label {
        fill: var(--ch-color-text);
        paint-order: stroke;
        stroke: var(--ch-color-surface);
        stroke-width: 3px;
        stroke-linejoin: round;
        font-size: 2.35px;
        font-weight: 850;
      }

      .node {
        --node-color: var(--ch-color-primary);
        position: absolute;
        display: grid;
        align-content: start;
        gap: 8px;
        min-width: 0;
        border: 1px solid color-mix(in srgb, var(--node-color) 34%, var(--ch-color-border));
        border-top: 4px solid var(--node-color);
        border-radius: var(--ch-radius);
        background: color-mix(in srgb, var(--ch-color-surface) 98%, transparent);
        box-shadow: var(--ch-shadow-card);
        padding: 11px;
        z-index: 2;
      }

      .node[data-tone='front'] {
        --node-color: #4f46e5;
      }

      .node[data-tone='api'] {
        --node-color: var(--ch-color-primary);
      }

      .node[data-tone='runtime'] {
        --node-color: var(--ch-color-success);
      }

      .node[data-tone='data'] {
        --node-color: var(--ch-color-warning);
      }

      .node[data-tone='ai'] {
        --node-color: #0f766e;
      }

      .node[data-tone='infra'] {
        --node-color: #64748b;
      }

      .node[data-tone='event'] {
        --node-color: #b45309;
      }

      .node[data-tone='security'] {
        --node-color: var(--ch-color-danger);
      }

      .node-top {
        display: grid;
        grid-template-columns: auto auto minmax(0, 1fr);
        gap: 9px;
        align-items: start;
      }

      .node-step {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 999px;
        background: var(--node-color);
        color: #fff;
        font-size: 0.74rem;
        font-weight: 900;
      }

      .node-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border: 1px solid color-mix(in srgb, var(--node-color) 32%, var(--ch-color-border));
        border-radius: calc(var(--ch-radius) - 2px);
        background: color-mix(in srgb, var(--node-color) 12%, var(--ch-color-surface));
        color: var(--node-color);
      }

      .node-title {
        display: grid;
        gap: 2px;
      }

      .node-title span {
        color: var(--ch-color-muted);
        font-size: 0.68rem;
        font-weight: 900;
        text-transform: uppercase;
      }

      .node-title strong {
        color: var(--ch-color-text);
        font-size: 0.98rem;
        line-height: 1.18;
      }

      .node-description {
        color: var(--ch-color-muted);
        font-size: 0.86rem;
        line-height: 1.38;
      }

      .bullet-list {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .bullet-list li {
        border: 1px solid var(--ch-color-border);
        border-radius: 999px;
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-text);
        padding: 3px 7px;
        font-size: 0.7rem;
        font-weight: 800;
      }

      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: color-mix(in srgb, var(--ch-color-surface) 90%, transparent);
        padding: 10px;
      }

      .legend span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--ch-color-muted);
        font-size: 0.8rem;
        font-weight: 800;
      }

      .legend i {
        width: 22px;
        height: 3px;
        border-radius: 999px;
        background: var(--ch-color-primary);
      }

      .legend span:nth-child(2) i {
        background: var(--ch-color-warning);
      }

      .legend span:nth-child(3) i {
        background: #b45309;
      }

      .legend span:nth-child(4) i {
        background: #0f766e;
      }

      .mobile-list {
        display: none;
        gap: 10px;
      }

      @media (max-width: 860px) {
        .canvas {
          display: none;
        }

        .mobile-list {
          display: grid;
        }

        .mobile-node {
          --node-color: var(--ch-color-primary);
          display: grid;
          gap: 7px;
          border: 1px solid color-mix(in srgb, var(--node-color) 34%, var(--ch-color-border));
          border-left: 4px solid var(--node-color);
          border-radius: var(--ch-radius);
          background: var(--ch-color-surface);
          padding: 12px;
        }

        .mobile-node[data-tone='front'] {
          --node-color: #4f46e5;
        }

        .mobile-node[data-tone='api'] {
          --node-color: var(--ch-color-primary);
        }

        .mobile-node[data-tone='runtime'] {
          --node-color: var(--ch-color-success);
        }

        .mobile-node[data-tone='data'] {
          --node-color: var(--ch-color-warning);
        }

        .mobile-node[data-tone='ai'] {
          --node-color: #0f766e;
        }

        .mobile-node[data-tone='infra'] {
          --node-color: #64748b;
        }

        .mobile-node[data-tone='event'] {
          --node-color: #b45309;
        }

        .mobile-node[data-tone='security'] {
          --node-color: var(--ch-color-danger);
        }

        .blueprint-header {
          display: grid;
        }
      }
    `
  ],
  template: `
    <section class="blueprint-shell" [attr.aria-label]="title">
      <header class="blueprint-header">
        <div>
          <h3>{{ title }}</h3>
          @if (description) {
            <p>{{ description }}</p>
          }
        </div>
      @if (badge) {
          <span class="blueprint-badge">{{ badge }}</span>
        }
      </header>

      @if (groups.length) {
        <div class="roadmap">
          @for (group of groups; track group.title; let last = $last) {
            <section class="roadmap-group" [attr.data-tone]="group.tone ?? 'api'">
              <div class="roadmap-group-header">
                <strong>{{ group.title }}</strong>
                <span>{{ group.summary }}</span>
              </div>
              <div class="roadmap-nodes">
                @for (node of groupNodes(group); track node.id) {
                  <article class="roadmap-node" [attr.data-tone]="node.tone ?? group.tone ?? 'api'">
                    <div class="node-top">
                      <span class="node-icon">
                        <i [class]="node.icon ?? 'pi pi-circle'" aria-hidden="true"></i>
                      </span>
                      @if (node.step) {
                        <span class="node-step">{{ node.step }}</span>
                      }
                      <div class="node-title">
                        @if (node.subtitle) {
                          <span>{{ node.subtitle }}</span>
                        }
                        <strong>{{ node.title }}</strong>
                      </div>
                    </div>
                    <p class="node-description">{{ node.description }}</p>
                    @if (node.bullets?.length) {
                      <ul class="bullet-list">
                        @for (bullet of node.bullets; track bullet) {
                          <li>{{ bullet }}</li>
                        }
                      </ul>
                    }
                  </article>
                }
              </div>
            </section>
            @if (!last) {
              <div class="roadmap-flow">
                <i aria-hidden="true">↓</i>
                @if (group.flowLabel) {
                  <span>{{ group.flowLabel }}</span>
                }
              </div>
            }
          }
        </div>
      } @else {
        <div class="canvas">
        <svg class="links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id="blueprint-arrow" markerWidth="6" markerHeight="6" refX="5.5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="currentColor"></path>
            </marker>
          </defs>
          @for (link of links; track link.from + '-' + link.to + '-' + link.label) {
            <path
              class="link-line"
              [attr.data-kind]="link.kind ?? 'sync'"
              fill="none"
              [attr.d]="path(link.from, link.to)"
              marker-end="url(#blueprint-arrow)"
            ></path>
            <text
              class="link-label"
              [attr.x]="midX(link.from, link.to)"
              [attr.y]="midY(link.from, link.to)"
              text-anchor="middle"
            >
              {{ link.label }}
            </text>
          }
        </svg>

        @for (stage of stages; track stage.title) {
          <div class="stage" [style.left.%]="stage.x" [style.width.%]="stage.width">
            <strong>{{ stage.title }}</strong>
            <span>{{ stage.summary }}</span>
          </div>
        }

        @for (node of nodes; track node.id) {
          <article
            class="node"
            [attr.data-tone]="node.tone ?? 'api'"
            [style.left.%]="node.x"
            [style.top.%]="node.y"
            [style.width.%]="node.width"
            [style.height.%]="node.height"
          >
            <div class="node-top">
              <span class="node-icon">
                <i [class]="node.icon ?? 'pi pi-circle'" aria-hidden="true"></i>
              </span>
              @if (node.step) {
                <span class="node-step">{{ node.step }}</span>
              }
              <div class="node-title">
                @if (node.subtitle) {
                  <span>{{ node.subtitle }}</span>
                }
                <strong>{{ node.title }}</strong>
              </div>
            </div>
            <p class="node-description">{{ node.description }}</p>
            @if (node.bullets?.length) {
              <ul class="bullet-list">
                @for (bullet of node.bullets; track bullet) {
                  <li>{{ bullet }}</li>
                }
              </ul>
            }
          </article>
        }
      </div>

      <div class="mobile-list">
        @for (node of nodes; track node.id) {
          <article class="mobile-node" [attr.data-tone]="node.tone ?? 'api'">
            <strong>{{ node.step ? node.step + '. ' : '' }}{{ node.title }}</strong>
            <p>{{ node.description }}</p>
            @if (node.bullets?.length) {
              <ul class="bullet-list">
                @for (bullet of node.bullets; track bullet) {
                  <li>{{ bullet }}</li>
                }
              </ul>
            }
          </article>
        }
      </div>
      }

      @if (showLegend) {
        <div class="legend">
          <span><i></i> Comunicación</span>
          <span><i></i> Datos</span>
          <span><i></i> Eventos</span>
          <span><i></i> IA</span>
        </div>
      }
    </section>
  `
})
export class ArchitectureBlueprintComponent {
  @Input({ required: true }) title = '';
  @Input() description = '';
  @Input() badge = '';
  @Input() showLegend = true;
  @Input() stages: ArchitectureBlueprintStage[] = [];
  @Input() groups: ArchitectureBlueprintGroup[] = [];
  @Input({ required: true }) nodes: ArchitectureBlueprintNode[] = [];
  @Input() links: ArchitectureBlueprintLink[] = [];

  centerX(id: string) {
    const node = this.node(id);
    return node ? node.x + node.width / 2 : 0;
  }

  centerY(id: string) {
    const node = this.node(id);
    return node ? node.y + node.height / 2 : 0;
  }

  midX(from: string, to: string) {
    return (this.centerX(from) + this.centerX(to)) / 2;
  }

  midY(from: string, to: string) {
    return (this.centerY(from) + this.centerY(to)) / 2 - 1.4;
  }

  path(from: string, to: string) {
    const x1 = this.centerX(from);
    const y1 = this.centerY(from);
    const x2 = this.centerX(to);
    const y2 = this.centerY(to);
    const dx = Math.abs(x2 - x1);
    const bend = Math.max(4, Math.min(12, dx / 2));

    if (dx > 10) {
      const c1 = x1 < x2 ? x1 + bend : x1 - bend;
      const c2 = x1 < x2 ? x2 - bend : x2 + bend;
      return `M ${x1} ${y1} C ${c1} ${y1}, ${c2} ${y2}, ${x2} ${y2}`;
    }

    const midY = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  }

  groupNodes(group: ArchitectureBlueprintGroup) {
    return group.nodeIds
      .map((id) => this.node(id))
      .filter((item): item is ArchitectureBlueprintNode => Boolean(item));
  }

  private node(id: string) {
    return this.nodes.find((item) => item.id === id);
  }
}
