import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-setup-page',
  standalone: true,
  imports: [FormsModule, IonButton, IonContent, IonHeader, IonInput, IonItem, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Chicle Engine Setup</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-item>
        <ion-input label="Organization" [(ngModel)]="organization"></ion-input>
      </ion-item>
      <ion-item>
        <ion-input label="Admin email" [(ngModel)]="email"></ion-input>
      </ion-item>
      <ion-item>
        <ion-input label="Password" type="password" [(ngModel)]="password"></ion-input>
      </ion-item>
      <ion-button expand="block">Create Platform</ion-button>
    </ion-content>
  `
})
export class SetupPageComponent {
  organization = '';
  email = '';
  password = '';
}
