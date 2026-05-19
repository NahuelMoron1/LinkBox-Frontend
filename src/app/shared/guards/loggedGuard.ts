import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { DeviceInfo } from '../models/Device';
import { AuthService } from '../services/auth.service';

export const loggedGuard = async () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  let tokenExist: DeviceInfo | null = await authService.getTokenTC();

  if (tokenExist !== null && tokenExist !== undefined) {
    return true;
  } else {
    router.navigate(['login']);
    return false;
  }
};
