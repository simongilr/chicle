import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, IonButton, IonContent],
  template: `
    <ion-content class="ion-padding">
      <h1>Chicle Engine</h1>
      <p>Runtime ready. Menus will be loaded from the API.</p>
      @if (auth.state.session(); as session) {
        <p>
          Sesión: {{ session.user.email }} · Tenant: {{ session.tenant.name }}
        </p>
      }
      <ion-button routerLink="/docs">Open documentation</ion-button>
      @if (auth.state.hasPermission('confisys.read')) {
        <ion-button routerLink="/confisys">Confisys</ion-button>
      }
      <ion-button fill="outline" (click)="logout()">Salir</ion-button>
    </ion-content>
  `
})
export class HomePageComponent {
  constructor(readonly auth: AuthService) {}

  logout() {
    this.auth.logout();
  }
}
