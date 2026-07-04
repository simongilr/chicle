import { Component, Input } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-public-page-shell',
  standalone: true,
  imports: [IonContent],
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100dvh;
        min-height: 100dvh;
        color: var(--ch-color-text);
        background: var(--ch-color-background);
      }

      ion-content {
        --background: var(--ch-color-background);
        height: calc(100% - 63px);
      }

      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 63px;
        gap: 16px;
        border-bottom: 1px solid var(--ch-color-border);
        background: var(--ch-color-surface);
        padding: 12px 24px;
      }

      .brand-block {
        display: grid;
        gap: 2px;
        min-width: 0;
      }

      .brand {
        color: #12324f;
        font-weight: 850;
      }

      .context {
        color: var(--ch-color-muted);
        font-size: 0.78rem;
        font-weight: 700;
      }

      .actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
      }

      .content {
        width: min(100%, var(--public-page-max-width));
        margin: 0 auto;
        padding: 32px var(--ch-page-padding-inline) var(--ch-page-padding-bottom);
      }

      @media (max-width: 820px) {
        .topbar {
          padding-inline: 16px;
        }

        .content {
          padding-top: 16px;
          padding-inline: var(--ch-page-padding-inline-mobile);
        }
      }
    `
  ],
  template: `
    <header class="topbar">
      <div class="brand-block">
        <span class="brand">{{ brand }}</span>
        @if (contextLabel) {
          <span class="context">{{ contextLabel }}</span>
        }
      </div>
      <nav class="actions" aria-label="Acciones públicas">
        <ng-content select="[public-actions]"></ng-content>
      </nav>
    </header>
    <ion-content>
      <main class="content" [style.--public-page-max-width]="maxWidth + 'px'">
        <ng-content></ng-content>
      </main>
    </ion-content>
  `
})
export class PublicPageShellComponent {
  @Input() brand = 'Chicle Engine';
  @Input() contextLabel = '';
  @Input() maxWidth = 1080;
}
