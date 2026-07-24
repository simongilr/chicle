import { Component, Input } from '@angular/core';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

@Component({
  selector: 'app-admin-form-grid',
  standalone: true,
  host: {
    '[attr.data-ui-kit]': 'resolvedKit',
    '[attr.data-density]': 'density'
  },
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(var(--admin-form-min-width), 1fr));
        gap: var(--admin-form-gap);
        align-items: end;
        min-width: 0;
      }

      :host([data-density='compact']) .form-grid {
        --admin-form-gap: 10px;
      }

      :host([data-density='spacious']) .form-grid {
        --admin-form-gap: 18px;
      }

      :host([data-ui-kit='ionic']) .form-grid {
        align-items: end;
      }

      @media (max-width: 640px) {
        .form-grid {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  template: `
    <section
      class="form-grid"
      [attr.aria-label]="ariaLabel"
      [style.--admin-form-min-width]="minColumnWidth"
      [style.--admin-form-gap]="gap"
    >
      <ng-content></ng-content>
    </section>
  `
})
export class AdminFormGridComponent extends UiKitAwareComponent {
  @Input() ariaLabel = 'Admin form fields';
  @Input() minColumnWidth = '240px';
  @Input() gap = '14px';
  @Input() density: 'compact' | 'comfortable' | 'spacious' = 'comfortable';
}
