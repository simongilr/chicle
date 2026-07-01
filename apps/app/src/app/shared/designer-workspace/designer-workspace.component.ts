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
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 16px 42px rgba(20, 50, 80, 0.06);
      }

      .navigation {
        display: grid;
        align-content: start;
        gap: 12px;
        min-width: 0;
        overflow: auto;
        border-right: 1px solid #d9e2ec;
        background: #fbfcfe;
        padding: 14px;
      }

      .workspace {
        display: grid;
        gap: 18px;
        align-content: start;
        min-width: 0;
        overflow: auto;
        padding: 18px;
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
          border-bottom: 1px solid #d9e2ec;
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
