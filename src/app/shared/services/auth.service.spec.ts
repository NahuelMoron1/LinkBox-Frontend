import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { DeviceInfo } from '../models/Device';

const DEVICE: DeviceInfo = {
  id: 'device-1',
  clientName: 'Test Car',
  plan: 'pro',
  subscriptionStatus: 'active',
  subscriptionEndDate: null,
  sessionsSavedThisMonth: 0,
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.endpoint}/api/devices`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    // El constructor dispara un GET /token para intentar restaurar la sesión.
    httpMock.expectOne(`${apiUrl}/token`).flush(null);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('logs in and stores the device info', () => {
    service.login('key', 'pass').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/login`);
    expect(req.request.body).toEqual({ key: 'key', password: 'pass' });
    req.flush({ device: DEVICE });
    expect(service.getDeviceInfo()).toEqual(DEVICE);
  });

  it('logs out and navigates to /login on success', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');
    service.logout();
    const req = httpMock.expectOne(`${apiUrl}/logout`);
    req.flush({});
    expect(service.getDeviceInfo()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('logs out and still navigates to /login on error', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');
    service.logout();
    const req = httpMock.expectOne(`${apiUrl}/logout`);
    req.flush('err', { status: 500, statusText: 'boom' });
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('getTokenTC stores and returns the device on success', async () => {
    const promise = service.getTokenTC();
    httpMock.expectOne(`${apiUrl}/token`).flush(DEVICE);
    expect(await promise).toEqual(DEVICE);
    expect(service.getDeviceInfo()).toEqual(DEVICE);
  });

  it('getTokenTC returns null on error', async () => {
    const promise = service.getTokenTC();
    httpMock.expectOne(`${apiUrl}/token`).flush('err', { status: 401, statusText: 'unauthorized' });
    expect(await promise).toBeNull();
  });

  it('getDeviceInfoFromServer stores and returns the device', async () => {
    const promise = service.getDeviceInfoFromServer();
    httpMock.expectOne(`${apiUrl}/token`).flush(DEVICE);
    expect(await promise).toEqual(DEVICE);
  });

  it('getDeviceInfoFromServer returns null on error', async () => {
    const promise = service.getDeviceInfoFromServer();
    httpMock.expectOne(`${apiUrl}/token`).flush('err', { status: 500, statusText: 'boom' });
    expect(await promise).toBeNull();
  });

  it('exposes device key/id/plan/status once loaded', async () => {
    const promise = service.getTokenTC();
    httpMock.expectOne(`${apiUrl}/token`).flush(DEVICE);
    await promise;

    expect(service.getDeviceKey()).toBe('device-1');
    expect(service.getDeviceId()).toBe('device-1');
    expect(service.getPlan()).toBe('pro');
    expect(service.getSubscriptionStatus()).toBe('active');
  });

  it('returns null defaults when there is no device loaded', () => {
    expect(service.getDeviceKey()).toBeNull();
    expect(service.getDeviceId()).toBeNull();
    expect(service.getPlan()).toBeNull();
    expect(service.getSubscriptionStatus()).toBeNull();
  });

  it('isSubscriptionInactive / hasActivePlan reflect device state', async () => {
    const promise = service.getTokenTC();
    httpMock.expectOne(`${apiUrl}/token`).flush({ ...DEVICE, subscriptionStatus: 'inactive' });
    await promise;
    expect(service.isSubscriptionInactive()).toBeTrue();
    expect(service.hasActivePlan()).toBeFalse();
  });

  it('isSubscriptionExpired is false without a device', () => {
    expect(service.isSubscriptionExpired()).toBeFalse();
  });

  it('isSubscriptionExpired compares subscriptionEndDate to now', async () => {
    const promise = service.getTokenTC();
    httpMock.expectOne(`${apiUrl}/token`).flush({ ...DEVICE, subscriptionEndDate: '2000-01-01' });
    await promise;
    expect(service.isSubscriptionExpired()).toBeTrue();
  });

  it('updateSessionsCount updates the current device', async () => {
    const promise = service.getTokenTC();
    httpMock.expectOne(`${apiUrl}/token`).flush(DEVICE);
    await promise;
    service.updateSessionsCount(3);
    expect(service.getDeviceInfo()?.sessionsSavedThisMonth).toBe(3);
  });

  it('updateSessionsCount is a no-op without a loaded device', () => {
    expect(() => service.updateSessionsCount(3)).not.toThrow();
  });

  it('isAuthenticated resolves true when a token exists', async () => {
    const promise = service.isAuthenticated();
    httpMock.expectOne(`${apiUrl}/token`).flush(DEVICE);
    expect(await promise).toBeTrue();
  });

  it('isAuthenticated resolves false on error', async () => {
    const promise = service.isAuthenticated();
    httpMock.expectOne(`${apiUrl}/token`).flush('err', { status: 401, statusText: 'unauthorized' });
    expect(await promise).toBeFalse();
  });
});
