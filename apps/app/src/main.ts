import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { importProvidersFrom } from '@angular/core';
import { provideFormlyCore } from '@ngx-formly/core';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/auth/auth.interceptor';
import { ChicleFormlyDisplayTypeComponent } from './app/engine/forms/formly/chicle-formly-display.type';
import { ChicleFormlyFieldTypeComponent } from './app/engine/forms/formly/chicle-formly-field.type';

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    importProvidersFrom(IonicModule.forRoot()),
    provideFormlyCore({
      types: [
        { name: 'chicle-field', component: ChicleFormlyFieldTypeComponent },
        { name: 'chicle-display', component: ChicleFormlyDisplayTypeComponent }
      ],
      validationMessages: [
        { name: 'required', message: 'Este campo es obligatorio.' },
        { name: 'minlength', message: 'El valor no alcanza la longitud mínima.' },
        { name: 'maxlength', message: 'El valor supera la longitud máxima.' }
      ]
    }),
    providePrimeNG({
      theme: {
        preset: Aura
      }
    })
  ]
}).catch((err) => console.error(err));
