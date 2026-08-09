import { Injectable } from '@angular/core';
import {
  UI_COMPONENT_CATALOG,
  UiComponentCatalogEntry,
  getDeclarativeComponentKey
} from '../../shared/ui-component-catalog';

@Injectable({ providedIn: 'root' })
export class DeclarativeComponentRegistryService {
  private readonly catalogByKey = new Map<string, UiComponentCatalogEntry>(
    UI_COMPONENT_CATALOG.map((entry) => [getDeclarativeComponentKey(entry), entry])
  );

  resolve(componentKey: string) {
    return this.catalogByKey.get(componentKey);
  }

  has(componentKey: string) {
    return this.catalogByKey.has(componentKey);
  }

  keys() {
    return Array.from(this.catalogByKey.keys()).sort();
  }
}
