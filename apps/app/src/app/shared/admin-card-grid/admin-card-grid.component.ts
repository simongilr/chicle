import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin-card-grid',
  standalone: true,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(var(--card-min-width), 1fr));
        gap: var(--card-gap);
        align-items: stretch;
        min-width: 0;
      }

      :host([data-compact='true']) .grid {
        align-items: start;
      }
    `
  ],
  host: {
    '[attr.data-compact]': 'compact ? "true" : null'
  },
  template: `
    <section
      class="grid"
      [attr.aria-label]="ariaLabel"
      [style.--card-min-width]="minColumnWidth"
      [style.--card-gap]="gap"
    >
      <ng-content></ng-content>
    </section>
  `
})
export class AdminCardGridComponent {
  @Input() ariaLabel = 'Admin card grid';
  @Input() minColumnWidth = '320px';
  @Input() gap = '16px';
  @Input() compact = false;
}
