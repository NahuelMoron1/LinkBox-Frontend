import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { subscriptionGuard } from './subscriptionGuard';
import { AuthService } from '../services/auth.service';
import { DeviceInfo } from '../models/Device';

const ACTIVE_DEVICE: DeviceInfo = {
  id: '1',
  clientName: 'x',
  plan: 'pro',
  subscriptionStatus: 'active',
  subscriptionEndDate: null,
  sessionsSavedThisMonth: 0,
};

describe('subscriptionGuard', () => {
  let authStub: { getTokenTC: jasmine.Spy };

  beforeEach(() => {
    authStub = { getTokenTC: jasmine.createSpy('getTokenTC') };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authStub }],
    });
  });

  it('redirects to /login when there is no device', async () => {
    authStub.getTokenTC.and.resolveTo(null);
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');
    const result = await TestBed.runInInjectionContext(() => subscriptionGuard());
    expect(result).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('redirects to /pricing/basic when the subscription is inactive', async () => {
    authStub.getTokenTC.and.resolveTo({ ...ACTIVE_DEVICE, subscriptionStatus: 'inactive' });
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');
    const result = await TestBed.runInInjectionContext(() => subscriptionGuard());
    expect(result).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['/pricing', 'basic']);
  });

  it('allows access when the subscription is active', async () => {
    authStub.getTokenTC.and.resolveTo(ACTIVE_DEVICE);
    const result = await TestBed.runInInjectionContext(() => subscriptionGuard());
    expect(result).toBeTrue();
  });
});
