import { Component } from '@angular/core';
import { DeclarativeRuntimeLabComponent } from '../../shared/declarative-runtime-lab/declarative-runtime-lab.component';
import { ModuleHeaderComponent } from '../../shared/module-header/module-header.component';
import { PageShellComponent } from '../../shared/page-shell/page-shell.component';

@Component({
  selector: 'app-declarative-runtime-page',
  standalone: true,
  imports: [DeclarativeRuntimeLabComponent, ModuleHeaderComponent, PageShellComponent],
  template: `
    <app-page-shell
      contextLabel="C-Declarativos"
      contextLabelKey="nav.context.componentsRuntime"
      width="wide"
    >
      <app-module-header
        eyebrow="Componentes declarativos"
        eyebrowKey="componentsRuntime.eyebrow"
        title="C-Declarativos"
        titleKey="componentsRuntime.title"
        description="Prueba cómo un objeto JSON se convierte en componente real, cómo resuelve bindings y cómo ejecuta acciones seguras."
        descriptionKey="componentsRuntime.description"
        badge="Tandas 0-3"
        badgeKey="componentsRuntime.badge"
      ></app-module-header>

      <app-declarative-runtime-lab></app-declarative-runtime-lab>
    </app-page-shell>
  `,
})
export class DeclarativeRuntimePageComponent {}
