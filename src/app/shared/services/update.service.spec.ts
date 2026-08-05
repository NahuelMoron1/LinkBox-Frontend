import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { UpdateService } from './update.service';
import { TelemetryService } from './telemetry.service';

/** Evita depender de un socket.io real: socket.emit() del lado cliente
 * manda al servidor, no dispara los .on() locales, así que para simular
 * un evento entrante hace falta un doble simple con su propio registro. */
class FakeSocket {
  private handlers: Record<string, Array<(payload: any) => void>> = {};
  on(event: string, cb: (payload: any) => void): void {
    (this.handlers[event] ??= []).push(cb);
  }
  trigger(event: string, payload: any): void {
    (this.handlers[event] || []).forEach((cb) => cb(payload));
  }
}

describe('UpdateService', () => {
  let service: UpdateService;
  let httpMock: HttpTestingController;
  let fakeSocket: FakeSocket;
  const apiUrl = `${environment.endpoint}/api/update`;

  beforeEach(() => {
    fakeSocket = new FakeSocket();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TelemetryService, useValue: { getSocket: () => fakeSocket } },
      ],
    });
    service = TestBed.inject(UpdateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('checks for an update', async () => {
    const promise = service.check();
    const req = httpMock.expectOne(`${apiUrl}/check`);
    expect(req.request.method).toBe('POST');
    req.flush({ available: true, version: 'v1.1.0' });
    expect(await promise).toEqual({ available: true, version: 'v1.1.0' });
  });

  it('triggers an install', () => {
    service.install();
    const req = httpMock.expectOne(`${apiUrl}/install`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'ok' });
  });

  it('emits progress steps received over the socket', (done) => {
    service.progress.subscribe((step) => {
      expect(step).toBe('downloading');
      done();
    });
    fakeSocket.trigger('update:progress', { step: 'downloading' });
  });

  it('emits the completion result received over the socket', (done) => {
    service.complete.subscribe((result) => {
      expect(result).toEqual({ success: true, error: null });
      done();
    });
    fakeSocket.trigger('update:complete', { success: true, error: null });
  });
});
