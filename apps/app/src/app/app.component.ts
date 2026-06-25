import { Component } from '@angular/core';
import { animate, group, query, style, transition, trigger } from '@angular/animations';
import { RouterOutlet } from '@angular/router';
import { IonApp } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, RouterOutlet],
  animations: [
    trigger('routeTransition', [
      transition('* <=> *', [
        query(
          ':enter, :leave',
          [
            style({
              display: 'block',
              width: '100%'
            })
          ],
          { optional: true }
        ),
        group([
          query(
            ':leave',
            [
              animate(
                '120ms cubic-bezier(0.4, 0, 1, 1)',
                style({
                  opacity: 0,
                  transform: 'translateY(-4px)'
                })
              )
            ],
            { optional: true }
          ),
          query(
            ':enter',
            [
              style({
                opacity: 0,
                transform: 'translateY(10px)'
              }),
              animate(
                '190ms cubic-bezier(0.2, 0, 0, 1)',
                style({
                  opacity: 1,
                  transform: 'translateY(0)'
                })
              )
            ],
            { optional: true }
          )
        ])
      ])
    ])
  ],
  template: `
    <ion-app>
      <main class="route-frame" [@routeTransition]="routeKey(outlet)">
        <router-outlet #outlet="outlet"></router-outlet>
      </main>
    </ion-app>
  `
})
export class AppComponent {
  routeKey(outlet: RouterOutlet) {
    if (!outlet?.isActivated) {
      return 'root';
    }

    return outlet.activatedRoute.snapshot.routeConfig?.path ?? 'root';
  }
}
