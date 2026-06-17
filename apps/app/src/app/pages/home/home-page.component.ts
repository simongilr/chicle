import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [IonContent],
  template: `
    <ion-content class="ion-padding">
      <h1>Chicle Engine</h1>
      <p>Runtime ready. Menus will be loaded from the API.</p>
    </ion-content>
  `
})
export class HomePageComponent {}
