import { Routes } from '@angular/router';
import { authGuard, loginGuard, permissionGuard } from './core/auth/auth.guard';
import { setupRedirectGuard } from './core/setup/setup-redirect.guard';
import { ConfisysPageComponent } from './pages/confisys/confisys-page.component';
import { DatabasePageComponent } from './pages/database/database-page.component';
import { DocsPageComponent } from './pages/docs/docs-page.component';
import { DynamicFormPageComponent } from './pages/dynamic-form-page/dynamic-form-page.component';
import { HomePageComponent } from './pages/home/home-page.component';
import { LoginPageComponent } from './pages/login/login-page.component';
import { SecurityPageComponent } from './pages/security/security-page.component';
import { SetupPageComponent } from './pages/setup/setup-page.component';

export const routes: Routes = [
  { path: 'setup', component: SetupPageComponent },
  { path: 'docs', component: DocsPageComponent },
  {
    path: 'confisys',
    component: ConfisysPageComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permissions: ['confisys.read'] }
  },
  {
    path: 'database',
    component: DatabasePageComponent,
    canActivate: [authGuard]
  },
  {
    path: 'security',
    component: SecurityPageComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permissions: ['users.read', 'roles.read', 'permissions.read'] }
  },
  { path: 'login', component: LoginPageComponent, canActivate: [loginGuard] },
  { path: 'home', component: HomePageComponent, canActivate: [authGuard] },
  { path: 'forms/:formKey', component: DynamicFormPageComponent, canActivate: [authGuard] },
  { path: '', pathMatch: 'full', canActivate: [setupRedirectGuard], component: SetupPageComponent },
  { path: '**', redirectTo: 'home' }
];
