import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { AdminFilterBarComponent } from '../../shared/admin-filter-bar/admin-filter-bar.component';
import { DynamicFieldControlComponent } from '../../shared/dynamic-field-control/dynamic-field-control.component';
import { DocumentationLayoutComponent, DocumentationSection } from '../../shared/documentation-layout/documentation-layout.component';
import { DocumentationSectionCardComponent } from '../../shared/documentation-layout/documentation-section-card.component';
import { StatusNoticeComponent } from '../../shared/status-notice/status-notice.component';
import { RuntimeField } from '../../engine/forms/form-runtime.service';
import { DOCS_MARKDOWN_FILES, DocsMarkdownFile } from './docs-markdown-manifest';

type MarkdownBlockType = 'heading' | 'paragraph' | 'list' | 'code';

interface MarkdownBlock {
  type: MarkdownBlockType;
  level?: number;
  text?: string;
  items?: string[];
  language?: string;
}

@Component({
  selector: 'app-docs-library-page',
  standalone: true,
  imports: [
    AdminFilterBarComponent,
    DynamicFieldControlComponent,
    DocumentationLayoutComponent,
    DocumentationSectionCardComponent,
    StatusNoticeComponent
  ],
  styles: [
    `
      .library-grid {
        display: grid;
        gap: 16px;
      }

      .markdown-viewer {
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
      }

      .viewer-meta {
        color: var(--ch-color-muted);
        line-height: 1.35;
      }

      .markdown-viewer {
        display: grid;
        gap: 14px;
        min-width: 0;
        padding: 16px;
      }

      .viewer-header {
        display: grid;
        gap: 6px;
        border-bottom: 1px solid var(--ch-color-border);
        padding-bottom: 12px;
      }

      .viewer-header h2 {
        margin: 0;
        color: var(--ch-color-text);
        font-size: 1.35rem;
      }

      .viewer-meta {
        margin: 0;
        font-size: 0.86rem;
      }

      .markdown-body {
        display: grid;
        gap: 10px;
        min-width: 0;
      }

      .markdown-body h1,
      .markdown-body h2,
      .markdown-body h3,
      .markdown-body h4 {
        margin: 12px 0 0;
        color: var(--ch-color-text);
        line-height: 1.2;
      }

      .markdown-body h1 {
        font-size: 1.5rem;
      }

      .markdown-body h2 {
        font-size: 1.25rem;
      }

      .markdown-body h3,
      .markdown-body h4 {
        font-size: 1.05rem;
      }

      .markdown-body p,
      .markdown-body li {
        color: var(--ch-color-muted);
        line-height: 1.55;
      }

      .markdown-body ul {
        display: grid;
        gap: 5px;
        margin: 0;
        padding-left: 18px;
      }

      pre {
        max-width: 100%;
        margin: 0;
        overflow: auto;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: #0f172a;
        color: #e2e8f0;
        padding: 12px;
        font-size: 0.82rem;
        line-height: 1.45;
        white-space: pre-wrap;
      }

    `
  ],
  template: `
    <app-documentation-layout
      contextLabel="Docs"
      title="Repositorio de documentación"
      description="Consulta los Markdown versionados del proyecto desde la app. Esta vista usa los mismos componentes de documentación que Docs operativos y Arquitectura."
      [sections]="docSections()"
      [scrollOnSelect]="false"
      (sectionSelected)="selectDocBySection($event)"
      navTitle="Documentos"
      navAriaLabel="Documentos Markdown"
      pickerId="docs-library-section"
      pickerLabel="Documento"
      width="wide"
    >
      <app-documentation-section-card
        sectionId="markdown"
        title="Markdown del proyecto"
        lead="Todos los documentos fuente viven en /docs y se copian como assets de solo lectura para consulta desde el Admin."
        tone="security"
      >
        <div class="library-grid">
          <app-admin-filter-bar ariaLabel="Markdown document filters" minColumnWidth="220px">
            <app-dynamic-field-control
              [field]="queryField"
              [value]="query()"
              (valueChange)="query.set(stringValue($event))"
            ></app-dynamic-field-control>
            <app-dynamic-field-control
              [field]="categoryField()"
              [value]="category()"
              (valueChange)="category.set(stringValue($event))"
            ></app-dynamic-field-control>
          </app-admin-filter-bar>

          <article class="markdown-viewer">
            @if (selected(); as doc) {
              <header class="viewer-header">
                <h2>{{ doc.title }}</h2>
                <p class="viewer-meta"><code>docs/{{ doc.path }}</code></p>
                <p class="viewer-meta">{{ doc.summary }}</p>
              </header>

              @if (loading()) {
                <app-status-notice tone="info">Cargando documento...</app-status-notice>
              } @else if (error()) {
                <app-status-notice tone="error">{{ error() }}</app-status-notice>
              } @else {
                <div class="markdown-body">
                  @for (block of blocks(); track $index) {
                    @switch (block.type) {
                      @case ('heading') {
                        @switch (block.level) {
                          @case (1) { <h1>{{ block.text }}</h1> }
                          @case (2) { <h2>{{ block.text }}</h2> }
                          @case (3) { <h3>{{ block.text }}</h3> }
                          @default { <h4>{{ block.text }}</h4> }
                        }
                      }
                      @case ('list') {
                        <ul>
                          @for (item of block.items ?? []; track item) {
                            <li>{{ item }}</li>
                          }
                        </ul>
                      }
                      @case ('code') {
                        <pre><code>{{ block.text }}</code></pre>
                      }
                      @default {
                        <p>{{ block.text }}</p>
                      }
                    }
                  }
                </div>
              }
            }
            @if (!selected()) {
              <app-status-notice tone="info">No hay documentos para los filtros actuales.</app-status-notice>
            }
          </article>
        </div>
      </app-documentation-section-card>
    </app-documentation-layout>
  `
})
export class DocsLibraryPageComponent {
  private readonly http = inject(HttpClient);
  readonly docs = DOCS_MARKDOWN_FILES;
  readonly query = signal('');
  readonly category = signal('');
  readonly selected = signal<DocsMarkdownFile | null>(DOCS_MARKDOWN_FILES[0] ?? null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly blocks = signal<MarkdownBlock[]>([]);

  readonly categories = computed(() => Array.from(new Set(this.docs.map((doc) => doc.category))).sort());

  readonly queryField: RuntimeField = {
    name: 'docsQuery',
    type: 'text',
    label: 'Buscar',
    placeholder: 'Nombre, categoría o resumen'
  };

  readonly categoryField = computed<RuntimeField>(() => ({
    name: 'docsCategory',
    type: 'select',
    label: 'Categoría',
    options: [
      { label: 'Todas', value: '' },
      ...this.categories().map((category) => ({
        label: category,
        value: category
      }))
    ]
  }));

  readonly filteredDocs = computed(() => {
    const query = this.query().trim().toLowerCase();
    const category = this.category();

    return this.docs.filter((doc) => {
      const matchesCategory = !category || doc.category === category;
      const haystack = `${doc.title} ${doc.path} ${doc.category} ${doc.summary}`.toLowerCase();
      return matchesCategory && (!query || haystack.includes(query));
    });
  });

  readonly docSections = computed<DocumentationSection[]>(() =>
    this.filteredDocs().map((doc) => ({
      id: this.sectionIdFor(doc),
      label: doc.title,
      summary: doc.summary
    }))
  );

  constructor() {
    if (this.selected()) {
      this.loadDoc(this.selected()!);
    }
  }

  selectDoc(doc: DocsMarkdownFile) {
    this.selected.set(doc);
    this.loadDoc(doc);
  }

  selectDocBySection(sectionId: string) {
    const doc = this.filteredDocs().find((item) => this.sectionIdFor(item) === sectionId);
    if (doc && doc.path !== this.selected()?.path) {
      this.selectDoc(doc);
    }
  }

  stringValue(value: unknown) {
    return value === null || value === undefined ? '' : String(value);
  }

  private loadDoc(doc: DocsMarkdownFile) {
    this.loading.set(true);
    this.error.set('');
    this.blocks.set([]);
    this.http.get(`/assets/chicle-docs/${doc.path}`, { responseType: 'text' }).subscribe({
      next: (content) => {
        this.blocks.set(this.parseMarkdown(content));
        this.loading.set(false);
      },
      error: () => {
        this.error.set(`No se pudo cargar docs/${doc.path}.`);
        this.loading.set(false);
      }
    });
  }

  private sectionIdFor(doc: DocsMarkdownFile) {
    return `md-${doc.path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()}`;
  }

  private parseMarkdown(content: string): MarkdownBlock[] {
    const blocks: MarkdownBlock[] = [];
    const lines = content.replace(/\r\n/g, '\n').split('\n');
    let paragraph: string[] = [];
    let list: string[] = [];
    let code: string[] = [];
    let inCode = false;
    let language = '';

    const flushParagraph = () => {
      if (paragraph.length) {
        blocks.push({ type: 'paragraph', text: paragraph.join(' ').trim() });
        paragraph = [];
      }
    };

    const flushList = () => {
      if (list.length) {
        blocks.push({ type: 'list', items: list });
        list = [];
      }
    };

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('```')) {
        if (inCode) {
          blocks.push({ type: 'code', text: code.join('\n'), language });
          code = [];
          language = '';
          inCode = false;
        } else {
          flushParagraph();
          flushList();
          inCode = true;
          language = trimmed.replace(/^```/, '').trim();
        }
        continue;
      }

      if (inCode) {
        code.push(line);
        continue;
      }

      if (!trimmed) {
        flushParagraph();
        flushList();
        continue;
      }

      const heading = /^(#{1,4})\s+(.+)$/.exec(trimmed);
      if (heading) {
        flushParagraph();
        flushList();
        blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] });
        continue;
      }

      const bullet = /^[-*]\s+(.+)$/.exec(trimmed);
      if (bullet) {
        flushParagraph();
        list.push(bullet[1]);
        continue;
      }

      paragraph.push(trimmed);
    }

    flushParagraph();
    flushList();

    if (inCode && code.length) {
      blocks.push({ type: 'code', text: code.join('\n'), language });
    }

    return blocks;
  }
}
