import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { I18nService } from '../../core/i18n/i18n.service';
import { MainNavComponent } from '../main-nav/main-nav.component';

export type PageShellWidth = 'standard' | 'wide';

@Component({
  selector: 'app-page-shell',
  standalone: true,
  imports: [IonContent, MainNavComponent],
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
        height: 100%;
      }

      .content {
        display: grid;
        gap: var(--ch-page-gap);
        width: min(100%, var(--page-max-width));
        margin: 0 auto;
        padding: var(--ch-page-padding-top) var(--ch-page-padding-inline)
          var(--ch-page-padding-bottom);
      }

      @media (max-width: 760px) {
        .content {
          padding-inline: var(--ch-page-padding-inline-mobile);
        }
      }
    `
  ],
  template: `
    <ion-content
      [scrollEvents]="scrollEvents"
      (ionScroll)="contentScrolled.emit($event)"
    >
      <app-main-nav [contextLabel]="resolvedContextLabel()"></app-main-nav>
      <main
        class="content"
        [style.--page-max-width]="width === 'standard' ? '1180px' : '1260px'"
      >
        <ng-content></ng-content>
      </main>
    </ion-content>
  `
})
export class PageShellComponent {
  private readonly i18n = inject(I18nService);

  @Input() contextLabel = '';
  @Input() contextLabelKey = '';
  @Input() width: PageShellWidth = 'wide';
  @Input() scrollEvents = false;
  @Output() readonly contentScrolled = new EventEmitter<Event>();

  resolvedContextLabel() {
    return this.contextLabelKey ? this.i18n.label(this.contextLabelKey, this.contextLabel) : this.contextLabel;
  }
}
