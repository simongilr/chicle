import { Routes } from '@angular/router';
import { ConfisysPageComponent } from './pages/confisys/confisys-page.component';
import { DocsPageComponent } from './pages/docs/docs-page.component';
import { DynamicFormPageComponent } from './pages/dynamic-form-page/dynamic-form-page.component';
import { HomePageComponent } from './pages/home/home-page.component';
import { LoginPageComponent } from './pages/login/login-page.component';
import { SetupPageComponent } from './pages/setup/setup-page.component';

export const routes: Routes = [
  { path: 'setup', component: SetupPageComponent },
  { path: 'docs', component: DocsPageComponent },
  { path: 'confisys', component: ConfisysPageComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'home', component: HomePageComponent },
  { path: 'forms/:formKey', component: DynamicFormPageComponent },
  { path: '', pathMatch: 'full', redirectTo: 'setup' },
  { path: '**', redirectTo: 'home' }
];
