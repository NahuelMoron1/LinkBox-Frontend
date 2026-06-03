import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Requiere que el device tenga una suscripción activa.
 * Si el status es 'inactive' (nunca compró un plan), redirige a /pricing/basic.
 * Debe usarse DESPUÉS de loggedGuard en las rutas que lo necesiten.
 */
export const subscriptionGuard = async () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const device = await authService.getTokenTC();

  if (!device) {
    router.navigate(['/login']);
    return false;
  }

  if (device.subscriptionStatus === 'inactive') {
    router.navigate(['/pricing', 'basic']);
    return false;
  }

  return true;
};
