import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { loginGuard } from './loginGuard';
import { AuthService } from '../services/auth.service';
import { DeviceInfo } from '../models/Device';

describe('loginGuard', () => {
  let authStub: { getTokenTC: jasmine.Spy };

  beforeEach(() => {
    authStub = { getTokenTC: jasmine.createSpy('getTokenTC') };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authStub }],
    });
  });

  it('redirects to /dashboard when already logged in', async () => {
    authStub.getTokenTC.and.resolveTo({ id: '1' } as DeviceInfo);
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');
    const result = await TestBed.runInInjectionContext(() => loginGuard());
    expect(result).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['dashboard']);
  });

  it('allows access to the login page when not logged in', async () => {
    authStub.getTokenTC.and.resolveTo(null);
    const result = await TestBed.runInInjectionContext(() => loginGuard());
    expect(result).toBeTrue();
  });
});
