import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonInput, IonItem } from '@ionic/angular/standalone';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [RouterLink, IonButton, IonContent, IonInput, IonItem],
  template: `
    <ion-content class="ion-padding">
      <h1>Login</h1>
      <ion-item>
        <ion-input label="Email"></ion-input>
      </ion-item>
      <ion-item>
        <ion-input label="Password" type="password"></ion-input>
      </ion-item>
      <ion-button expand="block" routerLink="/home">Enter</ion-button>
    </ion-content>
  `
})
export class LoginPageComponent {}
