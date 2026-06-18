import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, IonButton, IonContent],
  template: `
    <ion-content class="ion-padding">
      <h1>Chicle Engine</h1>
      <p>Runtime ready. Menus will be loaded from the API.</p>
      <ion-button routerLink="/docs">Open documentation</ion-button>
      <ion-button routerLink="/confisys">Confisys</ion-button>
    </ion-content>
  `
})
export class HomePageComponent {}
