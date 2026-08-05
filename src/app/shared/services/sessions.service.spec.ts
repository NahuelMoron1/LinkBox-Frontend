import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { SessionsService } from './sessions.service';
import { AuthService } from './auth.service';
import { SessionInfo } from '../models/Session';

describe('SessionsService', () => {
  let service: SessionsService;
  let httpMock: HttpTestingController;
  let authStub: { getDeviceId: jasmine.Spy; getPlan: jasmine.Spy; getSubscriptionStatus: jasmine.Spy };
  const apiUrl = `${environment.endpoint}/api/devices`;

  beforeEach(() => {
    authStub = {
      getDeviceId: jasmine.createSpy('getDeviceId').and.returnValue('device-1'),
      getPlan: jasmine.createSpy('getPlan').and.returnValue('pro'),
      getSubscriptionStatus: jasmine.createSpy('getSubscriptionStatus').and.returnValue('active'),
    };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authStub },
      ],
    });
    service = TestBed.inject(SessionsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('throws when there is no device id', () => {
    authStub.getDeviceId.and.returnValue(null);
    expect(() => service.getSessions()).toThrowError('Device ID not found');
  });

  it('loads sessions into the sessions$ stream', (done) => {
    service.sessions$.subscribe((sessions) => {
      if (sessions.length) {
        expect(sessions[0].id).toBe('s1');
        done();
      }
    });
    service.loadSessions();
    const req = httpMock.expectOne(`${apiUrl}/device-1/sessions`);
    req.flush({ sessions: [{ id: 's1' } as SessionInfo] });
  });

  it('clears sessions on a load error', (done) => {
    let calls = 0;
    service.sessions$.subscribe((sessions) => {
      calls++;
      if (calls === 2) {
        expect(sessions).toEqual([]);
        done();
      }
    });
    service.loadSessions();
    const req = httpMock.expectOne(`${apiUrl}/device-1/sessions`);
    req.flush('error', { status: 500, statusText: 'Server error' });
  });

  it('does nothing when loading sessions without a device id', () => {
    authStub.getDeviceId.and.returnValue(null);
    service.loadSessions();
    expect(() => httpMock.expectNone(`${apiUrl}/device-1/sessions`)).not.toThrow();
  });

  it('gets session data', () => {
    service.getSessionData('s1').subscribe((data) => expect(data.session.id).toBe('s1'));
    const req = httpMock.expectOne(`${apiUrl}/sessions/s1/data`);
    req.flush({ session: { id: 's1', name: 'x', startTime: '', endTime: null, totalRecords: 0 }, data: [] });
  });

  it('saves a session', () => {
    service.saveSession('My Session').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/device-1/sessions/save`);
    expect(req.request.body).toEqual({ sessionName: 'My Session' });
    req.flush({});
  });

  it('renames a session', () => {
    service.renameSession('s1', 'New name').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/sessions/s1/rename`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('deletes a session', () => {
    service.deleteSession('s1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/sessions/s1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('loads plan info into planInfo$', (done) => {
    service.planInfo$.subscribe((info) => {
      if (info) {
        expect(info.plan).toBe('pro');
        done();
      }
    });
    service.loadPlanInfo();
    const req = httpMock.expectOne(`${apiUrl}/device-1/plan-info`);
    req.flush({ plan: 'pro', subscriptionStatus: 'active', subscriptionEndDate: null, features: {} });
  });

  it('does not throw when a plan-info load fails', () => {
    service.loadPlanInfo();
    const req = httpMock.expectOne(`${apiUrl}/device-1/plan-info`);
    expect(() => req.flush('err', { status: 500, statusText: 'boom' })).not.toThrow();
  });

  it('tracks the current session', () => {
    const session = { id: 's1' } as SessionInfo;
    service.setCurrentSession(session);
    expect(service.getCurrentSession()).toBe(session);
  });

  it('canSaveSession reflects the plan', () => {
    authStub.getPlan.and.returnValue('basic');
    expect(service.canSaveSession()).toBeFalse();
    authStub.getPlan.and.returnValue('pro');
    expect(service.canSaveSession()).toBeTrue();
    authStub.getPlan.and.returnValue('ultimate');
    expect(service.canSaveSession()).toBeTrue();
  });

  it('getRemainingProSaves returns 0 without plan info', () => {
    expect(service.getRemainingProSaves()).toBe(0);
  });

  it('isSubscriptionExpired reflects the auth service', () => {
    authStub.getSubscriptionStatus.and.returnValue('expired');
    expect(service.isSubscriptionExpired()).toBeTrue();
  });

  it('refreshAll triggers both loads', () => {
    service.refreshAll();
    const sessionsReq = httpMock.expectOne(`${apiUrl}/device-1/sessions`);
    const planReq = httpMock.expectOne(`${apiUrl}/device-1/plan-info`);
    expect(sessionsReq.request.method).toBe('GET');
    expect(planReq.request.method).toBe('GET');
    sessionsReq.flush({ sessions: [] });
    planReq.flush({ plan: 'pro', subscriptionStatus: 'active', subscriptionEndDate: null, features: {} });
  });

  it('loads a recording session', async () => {
    const promise = service.loadRecordingSession('device-1');
    const req = httpMock.expectOne(`${apiUrl}/device-1/recording-session`);
    req.flush({ session: { id: 's1' }, data: [] });
    const result = await promise;
    expect(result?.session.id).toBe('s1');
  });

  it('returns null when loading a recording session fails', async () => {
    const promise = service.loadRecordingSession('device-1');
    const req = httpMock.expectOne(`${apiUrl}/device-1/recording-session`);
    req.flush('err', { status: 500, statusText: 'boom' });
    expect(await promise).toBeNull();
  });

  it('completes a recording session', async () => {
    const promise = service.completeRecordingSession('device-1');
    const req = httpMock.expectOne(`${apiUrl}/device-1/recording-session/complete`);
    req.flush({});
    expect(await promise).toBeTrue();
  });

  it('reports failure when completing a recording session fails', async () => {
    const promise = service.completeRecordingSession('device-1');
    const req = httpMock.expectOne(`${apiUrl}/device-1/recording-session/complete`);
    req.flush('err', { status: 500, statusText: 'boom' });
    expect(await promise).toBeFalse();
  });
});
