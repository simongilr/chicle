import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin-stack',
  standalone: true,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .stack {
        display: grid;
        gap: var(--stack-gap);
        min-width: 0;
      }

      .stack > * {
        min-width: 0;
        max-width: 100%;
      }
    `
  ],
  template: `
    <div class="stack" [style.--stack-gap]="gap">
      <ng-content></ng-content>
    </div>
  `
})
export class AdminStackComponent {
  @Input() gap = '10px';
}
