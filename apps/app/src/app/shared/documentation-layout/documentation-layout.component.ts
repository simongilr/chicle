import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RuntimeField } from '../../engine/forms/form-runtime.service';
import { DynamicFieldControlComponent } from '../dynamic-field-control/dynamic-field-control.component';
import { PageShellComponent, PageShellWidth } from '../page-shell/page-shell.component';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

export interface DocumentationSection {
  id: string;
  label: string;
  summary: string;
}

@Component({
  selector: 'app-documentation-layout',
  standalone: true,
  imports: [DynamicFieldControlComponent, PageShellComponent],
  host: {
    '[attr.data-ui-kit]': 'resolvedKit',
    '[attr.title]': 'null'
  },
  styles: [
    `
      .docs-shell {
        display: grid;
      }

      .intro {
        display: grid;
        gap: 10px;
        margin-bottom: 20px;
        border-bottom: 1px solid var(--ch-color-border);
        padding-bottom: 20px;
      }

      .intro h1 {
        margin: 0;
        color: var(--ch-color-text);
        font-size: 2.05rem;
        line-height: 1.15;
      }

      .intro p {
        max-width: 860px;
        margin: 0;
        color: var(--ch-color-muted);
        line-height: 1.55;
      }

      .section-picker {
        display: none;
      }

      .docs-layout {
        display: grid;
        grid-template-columns: 280px minmax(0, 1fr);
        gap: 24px;
        align-items: start;
      }

      .docs-nav {
        position: sticky;
        top: 16px;
        display: grid;
        gap: 8px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 10px;
      }

      .docs-nav-title {
        margin: 4px 6px 6px;
        color: var(--ch-color-muted);
        font-size: 0.78rem;
        font-weight: 800;
        text-transform: uppercase;
      }

      .docs-nav button {
        display: grid;
        gap: 3px;
        width: 100%;
        border: 0;
        border-radius: calc(var(--ch-radius) - 2px);
        background: transparent;
        color: var(--ch-color-text);
        padding: 9px 10px;
        text-align: left;
        cursor: pointer;
      }

      .docs-nav button[aria-current='true'] {
        background: var(--ch-color-primary-soft);
        box-shadow: inset 3px 0 0 var(--ch-color-primary);
      }

      .docs-nav button:hover,
      .docs-nav button:focus-visible {
        outline: none;
        background: var(--ch-color-primary-soft);
      }

      .docs-nav strong {
        font-size: 0.94rem;
      }

      .docs-nav span {
        color: var(--ch-color-muted);
        font-size: 0.8rem;
        line-height: 1.35;
      }

      .docs-content {
        display: grid;
        gap: 18px;
        min-width: 0;
      }

      @media (max-width: 640px) {
        .intro h1 {
          font-size: 1.55rem;
        }
      }

      @media (max-width: 900px) {
        .docs-layout {
          grid-template-columns: 1fr;
        }

        .section-picker {
          display: grid;
          gap: 7px;
          margin-bottom: 18px;
          padding: 0 16px;
        }

        .docs-nav {
          display: none;
        }
      }
    `
  ],
  template: `
    <app-page-shell
      [contextLabel]="contextLabel"
      [width]="width"
      [scrollEvents]="true"
      (contentScrolled)="syncActiveSection()"
    >
      <div class="docs-shell">
        <header class="intro">
          <h1>{{ title }}</h1>
          <p>{{ description }}</p>
        </header>

        <div class="section-picker">
          <app-dynamic-field-control
            [field]="sectionPickerField"
            [value]="activeSection"
            (valueChange)="changeSectionValue($event)"
          ></app-dynamic-field-control>
        </div>

        <div class="docs-layout">
          <nav class="docs-nav" [attr.aria-label]="navAriaLabel">
            <div class="docs-nav-title">{{ navTitle }}</div>
            @for (section of sections; track section.id) {
              <button
                type="button"
                [attr.aria-current]="activeSection === section.id ? 'true' : null"
                (click)="selectSection(section.id)"
              >
                <strong>{{ section.label }}</strong>
                <span>{{ section.summary }}</span>
              </button>
            }
          </nav>

          <div class="docs-content">
            <ng-content></ng-content>
          </div>
        </div>
      </div>
    </app-page-shell>
  `
})
export class DocumentationLayoutComponent extends UiKitAwareComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) description = '';
  @Input({ required: true }) sections: DocumentationSection[] = [];
  @Input() contextLabel = '';
  @Input() width: PageShellWidth = 'standard';
  @Input() pickerLabel = 'Ir a sección';
  @Input() navTitle = 'Secciones';
  @Input() navAriaLabel = 'Secciones';
  @Input() pickerId = 'documentation-section';
  @Input() scrollOnSelect = true;
  @Output() sectionSelected = new EventEmitter<string>();
  activeSection = '';

  get sectionPickerField(): RuntimeField {
    return {
      name: this.pickerId,
      type: 'select',
      label: this.pickerLabel,
      options: this.sections.map((section) => ({
        label: section.label,
        value: section.id
      }))
    };
  }

  ngOnChanges() {
    if (!this.activeSection && this.sections.length) {
      this.activeSection = this.sections[0].id;
    }

    if (this.activeSection && this.sections.length && !this.sections.some((section) => section.id === this.activeSection)) {
      this.activeSection = this.sections[0].id;
      this.sectionSelected.emit(this.activeSection);
    }
  }

  selectSection(sectionId: string) {
    this.activeSection = sectionId;
    this.sectionSelected.emit(sectionId);

    if (this.scrollOnSelect) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  changeSectionValue(value: unknown) {
    this.selectSection(String(value ?? ''));
  }

  syncActiveSection() {
    if (!this.scrollOnSelect) {
      return;
    }

    const visibleSection = this.sections
      .map((section) => ({
        id: section.id,
        top: Math.abs(document.getElementById(section.id)?.getBoundingClientRect().top ?? Number.MAX_SAFE_INTEGER)
      }))
      .sort((a, b) => a.top - b.top)[0];

    if (visibleSection && visibleSection.id !== this.activeSection) {
      this.activeSection = visibleSection.id;
    }
  }
}
