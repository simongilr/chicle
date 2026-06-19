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
      <p>Runtime listo. Los menús se cargarán desde la API.</p>
      @if (auth.state.session(); as session) {
        <p>
          Sesión: {{ session.user.email }} · Tenant: {{ session.tenant.name }}
        </p>
      }
      <ion-button routerLink="/docs">Documentación</ion-button>
      @if (auth.state.hasPermission('confisys.read')) {
        <ion-button routerLink="/confisys">Configuración</ion-button>
      }
      @if (auth.state.hasPermission('users.read') && auth.state.hasPermission('roles.read')) {
        <ion-button routerLink="/security">Seguridad</ion-button>
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
