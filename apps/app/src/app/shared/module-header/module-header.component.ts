import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-module-header',
  standalone: true,
  styles: [
    `
      :host {
        display: block;
      }

      .header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #ffffff;
        padding: 18px;
        box-shadow: 0 16px 42px rgba(20, 50, 80, 0.06);
      }

      .copy {
        display: grid;
        gap: 7px;
        min-width: 0;
      }

      .eyebrow {
        color: #52677a;
        font-size: 0.78rem;
        font-weight: 850;
      }

      h1,
      p {
        margin: 0;
      }

      h1 {
        color: #12324f;
        font-size: 1.85rem;
        line-height: 1.15;
      }

      p {
        max-width: 820px;
        color: #52677a;
        line-height: 1.45;
      }

      .badge {
        flex: 0 0 auto;
        border: 1px solid #c7d8e8;
        border-radius: 999px;
        background: #eef6ff;
        color: #173b5f;
        padding: 6px 10px;
        font-size: 0.82rem;
        font-weight: 850;
        white-space: nowrap;
      }

      @media (max-width: 620px) {
        .header {
          display: grid;
        }

        h1 {
          font-size: 1.55rem;
        }

        .badge {
          justify-self: start;
        }
      }
    `
  ],
  template: `
    <section class="header">
      <div class="copy">
        @if (eyebrow) {
          <span class="eyebrow">{{ eyebrow }}</span>
        }
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
      </div>
      @if (badge) {
        <span class="badge">{{ badge }}</span>
      }
    </section>
  `
})
export class ModuleHeaderComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) description = '';
  @Input() eyebrow = '';
  @Input() badge = '';
}
