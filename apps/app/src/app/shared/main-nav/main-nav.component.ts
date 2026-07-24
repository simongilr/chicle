import { Component, HostListener, Input, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { AppMenuItem } from '../../core/navigation/app-menu.types';
import { AppMenuService } from '../../core/navigation/app-menu.service';
import { UiKitButtonComponent } from '../ui-kit-button/ui-kit-button.component';

interface NavGroup {
  label: string;
  items: AppMenuItem[];
}

@Component({
  selector: 'app-main-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, UiKitButtonComponent],
  styles: [
    `
      .app-nav {
        position: sticky;
        top: 0;
        z-index: 30;
        border-bottom: 1px solid var(--ch-color-border);
        background: color-mix(in srgb, var(--ch-color-surface) 94%, transparent);
        box-shadow: var(--ch-shadow-card);
        backdrop-filter: blur(14px);
      }

      .nav-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        max-width: 1280px;
        margin: 0 auto;
        padding: 12px 24px;
      }

      .brand-block {
        display: grid;
        gap: 2px;
        min-width: 190px;
      }

      .brand {
        color: var(--ch-color-text);
        font-size: 1rem;
        font-weight: 900;
      }

      .context-label {
        color: var(--ch-color-muted);
        font-size: 0.82rem;
        font-weight: 750;
      }

      .desktop-nav {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        min-width: 0;
      }

      .nav-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-height: 38px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        padding: 8px 12px;
        text-decoration: none;
        font: inherit;
        font-weight: 850;
        line-height: 1;
        white-space: nowrap;
      }

      .logout-button,
      .dropdown-button,
      .drawer-close {
        display: inline-block;
      }

      .nav-link.active {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary);
        color: var(--ch-color-primary-contrast);
      }

      .nav-icon {
        font-size: 0.95rem;
      }

      .dropdown {
        position: relative;
      }

      .dropdown-button.active {
        border-color: var(--ch-color-primary-border);
        background: var(--ch-color-primary-soft);
      }

      .dropdown-panel {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        display: grid;
        gap: 6px;
        min-width: 230px;
        max-width: min(320px, 90vw);
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 8px;
        box-shadow: var(--ch-shadow-card);
      }

      .dropdown-panel .nav-link {
        justify-content: flex-start;
        width: 100%;
        border-color: transparent;
      }

      .dropdown-panel .nav-link:hover {
        border-color: var(--ch-color-border);
        background: var(--ch-color-surface-alt);
      }

      .menu-button {
        display: none;
        width: 42px;
        min-width: 42px;
      }

      .menu-label {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
      }

      .drawer-backdrop {
        position: fixed;
        inset: 0;
        z-index: 70;
        background: color-mix(in srgb, var(--ch-color-text) 30%, transparent);
      }

      .drawer {
        position: fixed;
        inset: 0 0 0 auto;
        z-index: 80;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr) auto;
        width: min(390px, 92vw);
        border-left: 1px solid var(--ch-color-border);
        background: var(--ch-color-surface);
        box-shadow: var(--ch-shadow-card);
      }

      .drawer-header,
      .drawer-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 16px;
      }

      .drawer-content {
        display: grid;
        align-content: start;
        gap: 16px;
        overflow: auto;
        padding: 0 16px 16px;
      }

      .drawer-group {
        display: grid;
        gap: 8px;
      }

      .drawer-title {
        color: var(--ch-color-muted);
        font-size: 0.76rem;
        font-weight: 900;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      .drawer-link {
        justify-content: flex-start;
        width: 100%;
        min-height: 44px;
      }

      .drawer-footer {
        border-top: 1px solid var(--ch-color-border);
      }

      .drawer-footer .logout-button {
        width: 100%;
      }

      @media (max-width: 980px) {
        .nav-inner {
          padding: 12px 16px;
        }

        .desktop-nav {
          display: none;
        }

        .menu-button {
          display: inline-flex;
        }
      }

      @media (max-width: 520px) {
        .brand-block {
          min-width: 0;
        }

        .context-label {
          max-width: 220px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    `
  ],
  template: `
    <header class="app-nav">
      <div class="nav-inner">
        <div class="brand-block">
          <div class="brand">Chicle Engine</div>
          <div class="context-label">{{ contextLabel }}</div>
        </div>

        <nav class="desktop-nav" [attr.aria-label]="i18n.translate('nav.mainNavigation')">
          @for (item of leadingPrimaryItems(); track item.key) {
            <a
              class="nav-link"
              [routerLink]="item.route"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.route === '/home' || item.route === '/setup' }"
              (click)="closeMenus()"
            >
              @if (item.icon) {
                <i [class]="iconClass(item.icon)" aria-hidden="true"></i>
              }
              <span>{{ itemLabel(item) }}</span>
            </a>
          }

          @if (manualItems().length) {
            <div class="dropdown">
              <app-ui-kit-button
                class="dropdown-button"
                icon="pi pi-book"
                [label]="i18n.translate('nav.group.manual')"
                tone="neutral"
                variant="outline"
                [class.active]="activeDropdown() === 'manual'"
                [attr.aria-expanded]="activeDropdown() === 'manual'"
                (pressed)="toggleDropdown('manual')"
              ></app-ui-kit-button>
              @if (activeDropdown() === 'manual') {
                <div class="dropdown-panel">
                  @for (item of manualItems(); track item.key) {
                    <a
                      class="nav-link"
                      [routerLink]="item.route"
                      routerLinkActive="active"
                      [routerLinkActiveOptions]="{ exact: true }"
                      (click)="closeMenus()"
                    >
                      @if (item.icon) {
                        <i [class]="iconClass(item.icon)" aria-hidden="true"></i>
                      }
                      <span>{{ itemLabel(item) }}</span>
                    </a>
                  }
                </div>
              }
            </div>
          }

          @for (item of trailingPrimaryItems(); track item.key) {
            <a
              class="nav-link"
              [routerLink]="item.route"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.route === '/home' || item.route === '/setup' }"
              (click)="closeMenus()"
            >
              @if (item.icon) {
                <i [class]="iconClass(item.icon)" aria-hidden="true"></i>
              }
              <span>{{ itemLabel(item) }}</span>
            </a>
          }

          @if (adminItems().length) {
            <div class="dropdown">
              <app-ui-kit-button
                class="dropdown-button"
                icon="pi pi-shield"
                [label]="i18n.translate('nav.group.admin')"
                tone="neutral"
                variant="outline"
                [class.active]="activeDropdown() === 'admin'"
                [attr.aria-expanded]="activeDropdown() === 'admin'"
                (pressed)="toggleDropdown('admin')"
              ></app-ui-kit-button>
              @if (activeDropdown() === 'admin') {
                <div class="dropdown-panel">
                  @for (item of adminItems(); track item.key) {
                    <a
                      class="nav-link"
                      [routerLink]="item.route"
                      routerLinkActive="active"
                      [routerLinkActiveOptions]="{ exact: true }"
                      (click)="closeMenus()"
                    >
                      @if (item.icon) {
                        <i [class]="iconClass(item.icon)" aria-hidden="true"></i>
                      }
                      <span>{{ itemLabel(item) }}</span>
                    </a>
                  }
                </div>
              }
            </div>
          }

          @if (buildItems().length) {
            <div class="dropdown">
              <app-ui-kit-button
                class="dropdown-button"
                icon="pi pi-pencil"
                [label]="i18n.translate('nav.group.build')"
                tone="neutral"
                variant="outline"
                [class.active]="activeDropdown() === 'build'"
                [attr.aria-expanded]="activeDropdown() === 'build'"
                (pressed)="toggleDropdown('build')"
              ></app-ui-kit-button>
              @if (activeDropdown() === 'build') {
                <div class="dropdown-panel">
                  @for (item of buildItems(); track item.key) {
                    <a
                      class="nav-link"
                      [routerLink]="item.route"
                      routerLinkActive="active"
                      [routerLinkActiveOptions]="{ exact: true }"
                      (click)="closeMenus()"
                    >
                      @if (item.icon) {
                        <i [class]="iconClass(item.icon)" aria-hidden="true"></i>
                      }
                      <span>{{ itemLabel(item) }}</span>
                    </a>
                  }
                </div>
              }
            </div>
          }

          @if (auth.state.isAuthenticated) {
            <app-ui-kit-button
              class="logout-button"
              icon="pi pi-sign-out"
              [label]="i18n.translate('nav.logout')"
              tone="neutral"
              variant="outline"
              (pressed)="logout()"
            ></app-ui-kit-button>
          }
        </nav>

        <app-ui-kit-button
          class="menu-button"
          label=""
          [ariaLabel]="i18n.translate('nav.menu')"
          icon="pi pi-bars"
          tone="neutral"
          variant="outline"
          [attr.aria-expanded]="drawerOpen()"
          aria-controls="main-navigation-drawer"
          (pressed)="drawerOpen.set(true)"
        ></app-ui-kit-button>
      </div>
    </header>

    @if (drawerOpen()) {
      <div class="drawer-backdrop" (click)="closeMenus()" aria-hidden="true"></div>
      <aside id="main-navigation-drawer" class="drawer" [attr.aria-label]="i18n.translate('nav.mainMenu')">
        <div class="drawer-header">
          <div class="brand-block">
            <div class="brand">Chicle Engine</div>
            <div class="context-label">{{ contextLabel }}</div>
          </div>
          <app-ui-kit-button
            class="drawer-close"
            label=""
            [ariaLabel]="i18n.translate('nav.close')"
            icon="pi pi-times"
            tone="neutral"
            variant="outline"
            (pressed)="closeMenus()"
          ></app-ui-kit-button>
        </div>

        <div class="drawer-content">
          @for (group of drawerGroups(); track group.label) {
            <section class="drawer-group">
              <div class="drawer-title">{{ group.label }}</div>
              @for (item of group.items; track item.key) {
                <a
                  class="nav-link drawer-link"
                  [routerLink]="item.route"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{ exact: true }"
                  (click)="closeMenus()"
                >
                  @if (item.icon) {
                    <i [class]="iconClass(item.icon)" aria-hidden="true"></i>
                  }
                  <span>{{ itemLabel(item) }}</span>
                </a>
              }
            </section>
          }
        </div>

        @if (auth.state.isAuthenticated) {
          <div class="drawer-footer">
            <app-ui-kit-button
              class="logout-button"
              icon="pi pi-sign-out"
              [label]="i18n.translate('nav.logout')"
              tone="neutral"
              variant="outline"
              [full]="true"
              (pressed)="logout()"
            ></app-ui-kit-button>
          </div>
        }
      </aside>
    }
  `
})
export class MainNavComponent implements OnInit {
  @Input() contextLabel = 'Panel principal';

  readonly menu = inject(AppMenuService);
  readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);
  readonly drawerOpen = signal(false);
  readonly activeDropdown = signal<'manual' | 'admin' | 'build' | null>(null);

  readonly primaryItems = computed(() => this.menu.items().filter((item) => this.placementFor(item) === 'primary'));
  readonly leadingPrimaryItems = computed(() => this.primaryItems().filter((item) => item.key === 'home'));
  readonly trailingPrimaryItems = computed(() => this.primaryItems().filter((item) => item.key !== 'home'));
  readonly manualItems = computed(() => this.menu.items().filter((item) => this.placementFor(item) === 'manual'));
  readonly adminItems = computed(() => this.menu.items().filter((item) => this.placementFor(item) === 'admin'));
  readonly buildItems = computed(() => this.menu.items().filter((item) => this.placementFor(item) === 'build'));
  readonly drawerGroups = computed<NavGroup[]>(() => {
    const groups = new Map<string, AppMenuItem[]>();
    for (const item of this.menu.items()) {
      const label = this.drawerGroupFor(item);
      groups.set(label, [...(groups.get(label) ?? []), item]);
    }

    return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
  });

  ngOnInit() {
    this.menu.loadCurrent();
  }

  @HostListener('document:keydown.escape')
  closeMenus() {
    this.drawerOpen.set(false);
    this.activeDropdown.set(null);
  }

  toggleDropdown(dropdown: 'manual' | 'admin' | 'build') {
    this.drawerOpen.set(false);
    this.activeDropdown.set(this.activeDropdown() === dropdown ? null : dropdown);
  }

  logout() {
    this.closeMenus();
    this.menu.reset();
    this.auth.logout();
  }

  iconClass(icon: string | null | undefined) {
    return `nav-icon ${icon ?? ''}`.trim();
  }

  itemLabel(item: AppMenuItem) {
    return this.i18n.label(item.i18nKey ?? `nav.${item.key}`, item.label);
  }

  private placementFor(item: AppMenuItem): 'primary' | 'manual' | 'admin' | 'build' {
    if (
      item.placement === 'primary' ||
      item.placement === 'manual' ||
      item.placement === 'admin' ||
      item.placement === 'build'
    ) {
      return item.placement;
    }

    if (item.placement === 'more') {
      return 'build';
    }

    if (['docs', 'architecture'].includes(item.key)) {
      return 'manual';
    }

    if (['home', 'setup', 'login'].includes(item.key)) {
      return 'primary';
    }

    if (['confisys', 'database', 'environments', 'security', 'users', 'roles', 'permissions'].includes(item.key)) {
      return 'admin';
    }

    return 'build';
  }

  private drawerGroupFor(item: AppMenuItem) {
    const placement = this.placementFor(item);
    if (placement === 'primary') {
      return this.i18n.translate('nav.group.primary');
    }

    if (placement === 'manual') {
      return this.i18n.translate('nav.group.manual');
    }

    if (placement === 'admin') {
      return this.groupLabel(item.group, 'nav.group.admin');
    }

    return this.groupLabel(item.group, 'nav.group.build');
  }

  private groupLabel(group: string | null | undefined, fallbackKey: string) {
    if (!group) {
      return this.i18n.translate(fallbackKey);
    }

    if (group === 'Administración') {
      return this.i18n.translate('nav.group.admin');
    }

    if (group === 'Construcción') {
      return this.i18n.translate('nav.group.build');
    }

    if (group === 'Principal') {
      return this.i18n.translate('nav.group.primary');
    }

    return group;
  }
}
