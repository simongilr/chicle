import { Component } from '@angular/core';

@Component({
  selector: 'app-designer-workspace',
  standalone: true,
  styles: [
    `
      :host {
        display: grid;
        grid-template-columns: 300px minmax(0, 1fr);
        min-height: 680px;
        overflow: hidden;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        box-shadow: var(--ch-shadow-card);
      }

      :host(.app-studio-workspace) {
        min-height: calc(100dvh - 220px);
        border-radius: calc(var(--ch-radius) + 2px);
      }

      .navigation {
        display: grid;
        align-content: start;
        gap: 12px;
        min-width: 0;
        overflow: auto;
        border-right: 1px solid var(--ch-color-border);
        background: var(--ch-color-surface-alt);
        padding: 14px;
      }

      :host(.app-studio-workspace) .navigation {
        padding: 12px;
      }

      .workspace {
        display: grid;
        gap: 18px;
        align-content: start;
        min-width: 0;
        overflow: auto;
        padding: 18px;
      }

      :host(.app-studio-workspace) .workspace {
        gap: 12px;
        padding: 14px;
      }

      @media (max-width: 940px) {
        :host {
          grid-template-columns: 1fr;
          min-height: 0;
          overflow: visible;
        }

        .navigation {
          max-height: 340px;
          border-right: 0;
          border-bottom: 1px solid var(--ch-color-border);
        }

        .workspace {
          padding: 12px;
        }
      }
    `
  ],
  template: `
    <aside class="navigation" aria-label="Catálogo">
      <ng-content select="[designer-navigation]"></ng-content>
    </aside>
    <section class="workspace" aria-label="Área de trabajo">
      <ng-content select="[designer-workspace]"></ng-content>
    </section>
  `
})
export class DesignerWorkspaceComponent {}
