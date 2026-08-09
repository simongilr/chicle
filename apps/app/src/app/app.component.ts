import { Component, DestroyRef, OnDestroy, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet
} from '@angular/router';
import { IonApp } from '@ionic/angular/standalone';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoadingSkeletonComponent } from './shared/loading-skeleton/loading-skeleton.component';
import { UiPreferencesService } from './core/ui/ui-preferences.service';
import { AiAssistantLauncherComponent } from './shared/ai-assistant-launcher/ai-assistant-launcher.component';
import { I18nService } from './core/i18n/i18n.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, LoadingSkeletonComponent, RouterOutlet, AiAssistantLauncherComponent],
  styles: [
    `
      .navigation-loading {
        position: fixed;
        z-index: 1000;
        inset: 0;
        overflow: hidden;
        background: var(--ch-color-background);
        animation: loading-enter 110ms ease-out;
      }

      .loading-nav {
        height: 63px;
        border-bottom: 1px solid var(--ch-color-border);
        background: var(--ch-color-surface);
      }

      .loading-content {
        width: min(100%, 1260px);
        margin: 0 auto;
        padding: var(--ch-page-padding-top) var(--ch-page-padding-inline);
      }

      .progress {
        position: absolute;
        z-index: 1;
        top: 61px;
        left: 0;
        width: 42%;
        height: 2px;
        background: var(--ch-color-primary);
        animation: progress 900ms ease-in-out infinite;
      }

      @keyframes loading-enter {
        from {
          opacity: 0;
        }
      }

      @keyframes progress {
        from {
          transform: translateX(-110%);
        }
        to {
          transform: translateX(340%);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .navigation-loading,
        .progress {
          animation: none;
        }
      }

      @media (max-width: 760px) {
        .loading-content {
          padding-inline: var(--ch-page-padding-inline-mobile);
        }
      }
    `
  ],
  template: `
    <ion-app>
      <main class="route-frame">
        <router-outlet></router-outlet>
      </main>
      <app-ai-assistant-launcher></app-ai-assistant-launcher>
      @if (navigationLoading()) {
        <div class="navigation-loading">
          <div class="loading-nav"></div>
          <span class="progress" aria-hidden="true"></span>
          <div class="loading-content">
            <app-loading-skeleton
              variant="page"
              [label]="i18n.translate('common.loadingPage')"
            ></app-loading-skeleton>
          </div>
        </div>
      }
    </ion-app>
  `
})
export class AppComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly preferences = inject(UiPreferencesService);
  readonly i18n = inject(I18nService);
  private hideTimer?: ReturnType<typeof setTimeout>;
  readonly navigationLoading = signal(false);

  constructor() {
    this.preferences.initialize();
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.cancelHide();
        this.navigationLoading.set(true);
      }

      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.cancelHide();
        this.hideTimer = setTimeout(() => this.navigationLoading.set(false), 180);
      }
    });
  }

  ngOnDestroy() {
    this.cancelHide();
  }

  private cancelHide() {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = undefined;
    }
  }
}
