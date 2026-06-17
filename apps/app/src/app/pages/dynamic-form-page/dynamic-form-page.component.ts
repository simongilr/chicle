import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-dynamic-form-page',
  standalone: true,
  imports: [IonContent],
  template: `
    <ion-content class="ion-padding">
      <h1>Dynamic Form</h1>
      <p>The renderer will choose Ionic or PrimeNG based on context.</p>
    </ion-content>
  `
})
export class DynamicFormPageComponent {}
