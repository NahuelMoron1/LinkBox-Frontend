import { Routes } from '@angular/router';
import { loggedGuard } from './shared/guards/loggedGuard';
import { loginGuard } from './shared/guards/loginGuard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/main-menu-page/main-menu-page.component').then(
        (m) => m.MainMenuPageComponent,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./shared/components/login/login.component').then(
        (m) => m.LoginComponent,
      ),
    canActivate: [loginGuard],
  },
  {
    path: 'pricing/:planId',
    loadComponent: () =>
      import('./pages/pricing-page/pricing-page.component').then(
        (m) => m.PricingPageComponent,
      ),
  },
  {
    path: 'sessions',
    loadComponent: () =>
      import('./pages/sessions-page/sessions-page.component').then(
        (m) => m.SessionsPageComponent,
      ),
    canActivate: [loggedGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard-page/dashboard-page.component').then(
        (m) => m.DashboardPageComponent,
      ),
    canActivate: [loggedGuard],
  },
  { path: '**', redirectTo: '' },
];
