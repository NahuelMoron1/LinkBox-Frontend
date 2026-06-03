import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { DeviceInfo } from '../models/Device';
import { AuthService } from '../services/auth.service';

export const loggedGuard = async (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const tokenExist: DeviceInfo | null = await authService.getTokenTC();

  if (tokenExist !== null && tokenExist !== undefined) {
    return true;
  } else {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
};
