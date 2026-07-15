import { Component, Input } from '@angular/core';
import { AppTimelineItem } from './app-visuals.types';

@Component({
  selector: 'app-app-timeline',
  standalone: true,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .timeline {
        display: grid;
        gap: 8px;
      }

      .item {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 9px;
        min-width: 0;
        border: 1px solid #d5e0eb;
        border-radius: 8px;
        background: #ffffff;
        padding: 9px;
      }

      .dot {
        width: 10px;
        height: 10px;
        margin-top: 4px;
        border-radius: 999px;
        background: #9fb2c4;
        box-shadow: 0 0 0 4px #eef3f8;
      }

      .item.complete .dot {
        background: #1f8f5f;
        box-shadow: 0 0 0 4px #e4f6ed;
      }

      .item.active .dot {
        background: #1f5faa;
        box-shadow: 0 0 0 4px #e8f2ff;
      }

      .item.warning .dot {
        background: #b7791f;
        box-shadow: 0 0 0 4px #fff4db;
      }

      .copy {
        display: grid;
        gap: 2px;
        min-width: 0;
      }

      strong {
        color: #12385c;
        font-size: 0.84rem;
        line-height: 1.2;
      }

      span {
        color: #52677a;
        font-size: 0.76rem;
        line-height: 1.3;
      }
    `
  ],
  template: `
    <div class="timeline">
      @for (item of items; track item.label) {
        <div class="item" [class.complete]="item.state === 'complete'" [class.active]="item.state === 'active'" [class.warning]="item.state === 'warning'">
          <span class="dot" aria-hidden="true"></span>
          <span class="copy">
            <strong>{{ item.label }}</strong>
            @if (item.detail) {
              <span>{{ item.detail }}</span>
            }
          </span>
        </div>
      }
    </div>
  `
})
export class AppTimelineComponent {
  @Input() items: AppTimelineItem[] = [];
}
