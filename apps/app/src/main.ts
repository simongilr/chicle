import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { provideFormlyCore } from '@ngx-formly/core';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/auth/auth.interceptor';
import { ChicleFormlyDisplayTypeComponent } from './app/engine/forms/formly/chicle-formly-display.type';
import { ChicleFormlyFieldTypeComponent } from './app/engine/forms/formly/chicle-formly-field.type';

const formlyMessage = (es: string, en: string) => () => {
  if (typeof localStorage !== 'undefined' && localStorage.getItem('chicle.admin.language') === 'en') {
    return en;
  }

  return es;
};

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    provideIonicAngular(),
    provideFormlyCore({
      types: [
        { name: 'chicle-field', component: ChicleFormlyFieldTypeComponent },
        { name: 'chicle-display', component: ChicleFormlyDisplayTypeComponent }
      ],
      validationMessages: [
        { name: 'required', message: formlyMessage('Este campo es obligatorio.', 'This field is required.') },
        {
          name: 'minlength',
          message: formlyMessage('El valor no alcanza la longitud mínima.', 'The value is shorter than the minimum length.')
        },
        {
          name: 'maxlength',
          message: formlyMessage('El valor supera la longitud máxima.', 'The value exceeds the maximum length.')
        }
      ]
    }),
    providePrimeNG({
      theme: {
        preset: Aura
      }
    })
  ]
}).catch((err) => console.error(err));
