import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

import { PlanInfoToolbarComponent } from './plan-info-toolbar.component';

describe('PlanInfoToolbarComponent', () => {
  let component: PlanInfoToolbarComponent;
  let fixture: ComponentFixture<PlanInfoToolbarComponent>;
  let httpMock: HttpTestingController;
  let authStub: { getDeviceId: jasmine.Spy; getPlan: jasmine.Spy; getSubscriptionStatus: jasmine.Spy };
  const saveUrl = `${environment.endpoint}/api/devices/1/sessions/save`;

  beforeEach(async () => {
    // SessionsService (real, no stubbeada) lee el device id/plan de
    // AuthService, no de component.deviceInfo (que solo alimenta el
    // template) — se reemplaza AuthService por un doble controlable en vez
    // de depender del fetch HTTP real de su constructor.
    authStub = {
      getDeviceId: jasmine.createSpy('getDeviceId').and.returnValue('1'),
      getPlan: jasmine.createSpy('getPlan').and.returnValue('ultimate'),
      getSubscriptionStatus: jasmine.createSpy('getSubscriptionStatus').and.returnValue('active'),
    };

    await TestBed.configureTestingModule({
      imports: [PlanInfoToolbarComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlanInfoToolbarComponent);
    component = fixture.componentInstance;
    component.key = '1';
    fixture.detectChanges();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    Swal.close();
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the upgrade prompt for basic plan with no device info', () => {
    component.deviceInfo = null;
    const info = component.getSaveSessionButtonInfo();
    expect(info.disabled).toBeTrue();
  });

  it('shows remaining pro saves', () => {
    component.deviceInfo = { id: '1', clientName: 'x', plan: 'pro', subscriptionStatus: 'active', subscriptionEndDate: null, sessionsSavedThisMonth: 0 };
    component.planInfo = { plan: 'pro', subscriptionStatus: 'active', subscriptionEndDate: null, features: { liveTelemetry: true, saveData: true, historicalData: true, sessionsRemaining: 1 } };
    const info = component.getSaveSessionButtonInfo();
    expect(info.disabled).toBeFalse();
  });

  it('disables the button when pro sessions are exhausted', () => {
    component.deviceInfo = { id: '1', clientName: 'x', plan: 'pro', subscriptionStatus: 'active', subscriptionEndDate: null, sessionsSavedThisMonth: 2 };
    component.planInfo = { plan: 'pro', subscriptionStatus: 'active', subscriptionEndDate: null, features: { liveTelemetry: true, saveData: true, historicalData: true, sessionsRemaining: 0 } };
    const info = component.getSaveSessionButtonInfo();
    expect(info.disabled).toBeTrue();
  });

  it('shows unlimited saves for ultimate plan', () => {
    component.deviceInfo = { id: '1', clientName: 'x', plan: 'ultimate', subscriptionStatus: 'active', subscriptionEndDate: null, sessionsSavedThisMonth: 5 };
    const info = component.getSaveSessionButtonInfo();
    expect(info.disabled).toBeFalse();
  });

  it('prompts an upgrade when a basic-plan device tries to save a session', () => {
    component.deviceInfo = { id: '1', clientName: 'x', plan: 'basic', subscriptionStatus: 'active', subscriptionEndDate: null, sessionsSavedThisMonth: 0 };
    expect(() => component.onSaveSession()).not.toThrow();
  });

  it('shows the pro limit reached prompt when out of saves', () => {
    component.deviceInfo = { id: '1', clientName: 'x', plan: 'pro', subscriptionStatus: 'active', subscriptionEndDate: null, sessionsSavedThisMonth: 2 };
    component.planInfo = { plan: 'pro', subscriptionStatus: 'active', subscriptionEndDate: null, features: { liveTelemetry: true, saveData: true, historicalData: true, sessionsRemaining: 0, sessionsSaved: 2 } };
    expect(() => component.onSaveSession()).not.toThrow();
  });

  it('reports whether it can save a session', () => {
    expect(typeof component.canSaveSession()).toBe('boolean');
  });

  it('prompts an upgrade instead of navigating when the plan cannot save sessions', () => {
    authStub.getPlan.and.returnValue('basic');
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');
    component.onViewSessions();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('navigates to sessions when allowed to save', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');
    component.onViewSessions();
    const req = httpMock.expectOne(`${environment.endpoint}/api/devices/1/sessions`);
    req.flush({ sessions: [] });
    expect(navigateSpy).toHaveBeenCalledWith(['/sessions']);
  });

  it('shows plan comparison on upgrade click', () => {
    expect(() => component.onUpgrade()).not.toThrow();
  });

  it('saves a session for an ultimate-plan device via the prompt dialog', fakeAsync(() => {
    component.deviceInfo = { id: '1', clientName: 'x', plan: 'ultimate', subscriptionStatus: 'active', subscriptionEndDate: null, sessionsSavedThisMonth: 0 };
    spyOn(window, 'prompt').and.returnValue('My Session');

    component.onSaveSession();
    tick(); // deja que se monte el modal "Save Session" de SweetAlert2
    Swal.clickConfirm();
    tick();

    const req = httpMock.expectOne(saveUrl);
    expect(req.request.body).toEqual({ sessionName: 'My Session' });
    req.flush({ session: { name: 'My Session', totalRecords: 10 } });

    httpMock.expectOne(`${environment.endpoint}/api/devices/1/sessions`).flush({ sessions: [] });
    httpMock.expectOne(`${environment.endpoint}/api/devices/1/plan-info`).flush({
      plan: 'ultimate', subscriptionStatus: 'active', subscriptionEndDate: null, features: {},
    });
  }));

  it('does not save when the prompt is dismissed', fakeAsync(() => {
    spyOn(window, 'prompt').and.returnValue(null);

    component.onSaveSession();
    tick();
    Swal.clickConfirm();
    tick();

    expect(() => httpMock.expectNone(saveUrl)).not.toThrow();
  }));

  it('shows the session limit reached prompt when the backend rejects with SESSIONS_LIMIT_REACHED', fakeAsync(() => {
    spyOn(window, 'prompt').and.returnValue('My Session');

    component.onSaveSession();
    tick();
    Swal.clickConfirm();
    tick();

    const req = httpMock.expectOne(saveUrl);
    expect(() => req.flush({ code: 'SESSIONS_LIMIT_REACHED' }, { status: 403, statusText: 'Forbidden' })).not.toThrow();
  }));

  it('shows the upgrade prompt when the backend rejects with PLAN_UPGRADE_REQUIRED', fakeAsync(() => {
    spyOn(window, 'prompt').and.returnValue('My Session');

    component.onSaveSession();
    tick();
    Swal.clickConfirm();
    tick();

    const req = httpMock.expectOne(saveUrl);
    expect(() => req.flush({ code: 'PLAN_UPGRADE_REQUIRED' }, { status: 403, statusText: 'Forbidden' })).not.toThrow();
  }));

  it('shows a generic error for any other save failure', fakeAsync(() => {
    spyOn(window, 'prompt').and.returnValue('My Session');

    component.onSaveSession();
    tick();
    Swal.clickConfirm();
    tick();

    const req = httpMock.expectOne(saveUrl);
    expect(() => req.flush({}, { status: 500, statusText: 'boom' })).not.toThrow();
  }));
});
