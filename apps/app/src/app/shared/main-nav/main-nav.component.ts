import { Component, Input, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { AppMenuService } from '../../core/navigation/app-menu.service';

@Component({
  selector: 'app-main-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  styles: [
    `
      .app-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        border-bottom: 1px solid #d9e2ec;
        background: #ffffff;
        padding: 14px 24px;
      }

      .brand-block {
        display: grid;
        gap: 2px;
        min-width: 190px;
      }

      .brand {
        color: #12324f;
        font-size: 1rem;
        font-weight: 850;
      }

      .context-label {
        color: #64748b;
        font-size: 0.82rem;
        font-weight: 700;
      }

      .nav-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
      }

      .nav-link,
      .logout-button,
      .menu-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-height: 38px;
        border: 1px solid #c8d6e4;
        border-radius: 8px;
        background: #ffffff;
        color: #173b5f;
        padding: 8px 12px;
        text-decoration: none;
        font: inherit;
        font-weight: 800;
        white-space: nowrap;
      }

      .nav-link.active {
        border-color: #1554a2;
        background: #1554a2;
        color: #ffffff;
      }

      .logout-button,
      .menu-button {
        cursor: pointer;
      }

      .menu-button {
        display: none;
      }

      .nav-icon {
        font-size: 0.95rem;
      }

      @media (max-width: 760px) {
        .app-nav {
          align-items: stretch;
          flex-direction: column;
          padding: 14px 16px;
        }

        .nav-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .menu-button {
          display: inline-flex;
          width: 42px;
          min-width: 42px;
          padding: 8px;
        }

        .menu-label {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
        }

        .nav-actions {
          display: none;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          justify-content: stretch;
          width: 100%;
        }

        .nav-actions.open {
          display: grid;
        }

        .nav-link,
        .logout-button {
          width: 100%;
          min-width: 0;
          text-align: center;
        }
      }
    `
  ],
  template: `
    <header class="app-nav">
      <div class="nav-header">
        <div class="brand-block">
          <div class="brand">Chicle Engine</div>
          <div class="context-label">{{ contextLabel }}</div>
        </div>

        <button
          class="menu-button"
          type="button"
          [attr.aria-expanded]="open"
          aria-controls="main-navigation"
          (click)="open = !open"
        >
          <i class="pi pi-bars" aria-hidden="true"></i>
          <span class="menu-label">Menú</span>
        </button>
      </div>

      <nav id="main-navigation" class="nav-actions" [class.open]="open" aria-label="Navegación principal">
        @for (item of menu.items(); track item.key) {
          <a
            class="nav-link"
            [routerLink]="item.route"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.route === '/home' || item.route === '/setup' }"
          >
            @if (item.icon) {
              <i [class]="iconClass(item.icon)" aria-hidden="true"></i>
            }
            <span>{{ item.label }}</span>
          </a>
        }

        @if (auth.state.isAuthenticated) {
          <button class="logout-button" type="button" (click)="logout()">
            <i class="pi pi-sign-out" aria-hidden="true"></i>
            <span>Salir</span>
          </button>
        }
      </nav>
    </header>
  `
})
export class MainNavComponent implements OnInit {
  @Input() contextLabel = 'Panel principal';

  readonly menu = inject(AppMenuService);
  readonly auth = inject(AuthService);
  open = false;

  ngOnInit() {
    this.menu.loadCurrent();
  }

  logout() {
    this.menu.reset();
    this.auth.logout();
  }

  iconClass(icon: string | null | undefined) {
    return `nav-icon ${icon ?? ''}`.trim();
  }
}
