import { Routes } from '@angular/router';
import { authGuard, loginGuard, permissionGuard } from './core/auth/auth.guard';
import { setupRedirectGuard } from './core/setup/setup-redirect.guard';

export const routes: Routes = [
  {
    path: 'setup',
    loadComponent: () => import('./pages/setup/setup-page.component').then((module) => module.SetupPageComponent)
  },
  {
    path: 'docs',
    loadComponent: () => import('./pages/docs/docs-page.component').then((module) => module.DocsPageComponent)
  },
  {
    path: 'components',
    loadComponent: () =>
      import('./pages/components/components-page.component').then((module) => module.ComponentsPageComponent)
  },
  {
    path: 'confisys',
    loadComponent: () =>
      import('./pages/confisys/confisys-page.component').then((module) => module.ConfisysPageComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: ['confisys.read'] }
  },
  {
    path: 'database',
    loadComponent: () =>
      import('./pages/database/database-page.component').then((module) => module.DatabasePageComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: ['database.read'] }
  },
  {
    path: 'security',
    loadComponent: () =>
      import('./pages/security/security-page.component').then((module) => module.SecurityPageComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: ['users.read', 'roles.read', 'permissions.read'] }
  },
  {
    path: 'services',
    loadComponent: () =>
      import('./pages/services/services-page.component').then((module) => module.ServicesPageComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: ['services.read'] }
  },
  {
    path: 'flows',
    loadComponent: () => import('./pages/flows/flows-page.component').then((module) => module.FlowsPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'forms',
    loadComponent: () => import('./pages/forms/forms-page.component').then((module) => module.FormsPageComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: ['forms.read'] }
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login-page.component').then((module) => module.LoginPageComponent),
    canActivate: [loginGuard]
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home-page.component').then((module) => module.HomePageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'forms/:formKey',
    loadComponent: () =>
      import('./pages/dynamic-form-page/dynamic-form-page.component').then(
        (module) => module.DynamicFormPageComponent
      ),
    canActivate: [authGuard]
  },
  {
    path: '',
    pathMatch: 'full',
    canActivate: [setupRedirectGuard],
    loadComponent: () => import('./pages/setup/setup-page.component').then((module) => module.SetupPageComponent)
  },
  { path: '**', redirectTo: 'home' }
];
