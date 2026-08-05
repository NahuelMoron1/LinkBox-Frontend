import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { loggedGuard } from './loggedGuard';
import { AuthService } from '../services/auth.service';
import { DeviceInfo } from '../models/Device';

describe('loggedGuard', () => {
  let authStub: { getTokenTC: jasmine.Spy };

  beforeEach(() => {
    authStub = { getTokenTC: jasmine.createSpy('getTokenTC') };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authStub }],
    });
  });

  it('allows navigation when a device token exists', async () => {
    authStub.getTokenTC.and.resolveTo({ id: '1' } as DeviceInfo);
    const result = await TestBed.runInInjectionContext(() =>
      loggedGuard({} as any, { url: '/dashboard' } as any),
    );
    expect(result).toBeTrue();
  });

  it('redirects to /login with a returnUrl when there is no token', async () => {
    authStub.getTokenTC.and.resolveTo(null);
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');
    const result = await TestBed.runInInjectionContext(() =>
      loggedGuard({} as any, { url: '/dashboard' } as any),
    );
    expect(result).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/dashboard' } });
  });
});
