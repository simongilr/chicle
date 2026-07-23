import { Component, Input } from '@angular/core';

export type ArchitectureDiagramTone = 'core' | 'runtime' | 'data' | 'ui' | 'ai' | 'infra' | 'event';

export interface ArchitectureDiagramNode {
  id: string;
  title: string;
  eyebrow?: string;
  description: string;
  icon?: string;
  status?: string;
  tone?: ArchitectureDiagramTone;
  paths?: string[];
}

export interface ArchitectureDiagramLink {
  from: string;
  to: string;
  label: string;
  description?: string;
}

@Component({
  selector: 'app-architecture-diagram',
  standalone: true,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .diagram-shell {
        display: grid;
        gap: 14px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
        padding: 16px;
        overflow: hidden;
      }

      .diagram-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        border-bottom: 1px solid var(--ch-color-border);
        padding-bottom: 12px;
      }

      .diagram-header div {
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
        line-height: 1.5;
      }

      .diagram-badge {
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

      .node-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .node-card {
        --node-color: var(--ch-color-primary);
        display: grid;
        align-content: start;
        gap: 10px;
        min-width: 0;
        min-height: 168px;
        border: 1px solid var(--ch-color-border);
        border-top: 4px solid var(--node-color);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 13px;
        box-shadow: var(--ch-shadow-card);
      }

      .node-card[data-tone='core'] {
        --node-color: var(--ch-color-primary);
      }

      .node-card[data-tone='runtime'] {
        --node-color: var(--ch-color-success);
      }

      .node-card[data-tone='data'] {
        --node-color: var(--ch-color-warning);
      }

      .node-card[data-tone='ui'] {
        --node-color: #4f46e5;
      }

      .node-card[data-tone='ai'] {
        --node-color: #0f766e;
      }

      .node-card[data-tone='infra'] {
        --node-color: #64748b;
      }

      .node-card[data-tone='event'] {
        --node-color: #b45309;
      }

      .node-top {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 10px;
        align-items: start;
      }

      .node-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        border: 1px solid color-mix(in srgb, var(--node-color) 34%, var(--ch-color-border));
        border-radius: var(--ch-radius);
        background: color-mix(in srgb, var(--node-color) 12%, var(--ch-color-surface));
        color: var(--node-color);
      }

      .node-title {
        display: grid;
        gap: 3px;
      }

      .node-title span {
        color: var(--ch-color-muted);
        font-size: 0.72rem;
        font-weight: 850;
        text-transform: uppercase;
      }

      .node-title strong {
        color: var(--ch-color-text);
        font-size: 1rem;
        line-height: 1.25;
      }

      .node-status {
        justify-self: start;
        border: 1px solid color-mix(in srgb, var(--node-color) 30%, var(--ch-color-border));
        border-radius: 999px;
        background: color-mix(in srgb, var(--node-color) 10%, var(--ch-color-surface));
        color: var(--ch-color-text);
        padding: 4px 8px;
        font-size: 0.72rem;
        font-weight: 850;
      }

      .path-list {
        display: grid;
        gap: 6px;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .path-list li {
        min-width: 0;
        border: 1px solid var(--ch-color-border);
        border-radius: calc(var(--ch-radius) - 2px);
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-text);
        padding: 6px 8px;
        overflow-wrap: anywhere;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
        font-size: 0.78rem;
      }

      .link-board {
        display: grid;
        gap: 8px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 10px;
      }

      .link-title {
        color: var(--ch-color-muted);
        font-size: 0.76rem;
        font-weight: 900;
        text-transform: uppercase;
      }

      .link-list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .link-item {
        display: grid;
        gap: 5px;
        border: 1px solid var(--ch-color-border);
        border-radius: calc(var(--ch-radius) - 2px);
        background: var(--ch-color-surface-alt);
        padding: 9px;
      }

      .link-route {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
        color: var(--ch-color-text);
        font-weight: 850;
      }

      .link-route i {
        color: var(--ch-color-primary);
      }

      .link-route span {
        color: var(--ch-color-muted);
        font-size: 0.82rem;
      }

      .link-item p {
        font-size: 0.86rem;
      }

      @media (max-width: 1080px) {
        .node-grid,
        .link-list {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 680px) {
        .diagram-shell {
          padding: 12px;
        }

        .diagram-header {
          display: grid;
        }

        .diagram-badge {
          justify-self: start;
        }

        .node-grid,
        .link-list {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  template: `
    <section class="diagram-shell" [attr.aria-label]="title">
      <header class="diagram-header">
        <div>
          <h3>{{ title }}</h3>
          @if (description) {
            <p>{{ description }}</p>
          }
        </div>
        @if (badge) {
          <span class="diagram-badge">{{ badge }}</span>
        }
      </header>

      <div class="node-grid">
        @for (node of nodes; track node.id) {
          <article class="node-card" [attr.data-tone]="node.tone ?? 'core'">
            <div class="node-top">
              <span class="node-icon">
                <i [class]="node.icon ?? 'pi pi-circle'" aria-hidden="true"></i>
              </span>
              <div class="node-title">
                @if (node.eyebrow) {
                  <span>{{ node.eyebrow }}</span>
                }
                <strong>{{ node.title }}</strong>
              </div>
            </div>
            <p>{{ node.description }}</p>
            @if (node.status) {
              <span class="node-status">{{ node.status }}</span>
            }
            @if (node.paths?.length) {
              <ul class="path-list">
                @for (path of node.paths; track path) {
                  <li>{{ path }}</li>
                }
              </ul>
            }
          </article>
        }
      </div>

      @if (links.length) {
        <div class="link-board">
          <div class="link-title">{{ linksTitle }}</div>
          <div class="link-list">
            @for (link of links; track link.from + '-' + link.to + '-' + link.label) {
              <article class="link-item">
                <div class="link-route">
                  <span>{{ nodeTitle(link.from) }}</span>
                  <i class="pi pi-arrow-right" aria-hidden="true"></i>
                  <span>{{ nodeTitle(link.to) }}</span>
                  <strong>{{ link.label }}</strong>
                </div>
                @if (link.description) {
                  <p>{{ link.description }}</p>
                }
              </article>
            }
          </div>
        </div>
      }
    </section>
  `
})
export class ArchitectureDiagramComponent {
  @Input({ required: true }) title = '';
  @Input() description = '';
  @Input() badge = '';
  @Input() linksTitle = 'Relaciones';
  @Input({ required: true }) nodes: ArchitectureDiagramNode[] = [];
  @Input() links: ArchitectureDiagramLink[] = [];

  nodeTitle(id: string) {
    return this.nodes.find((node) => node.id === id)?.title ?? id;
  }
}
