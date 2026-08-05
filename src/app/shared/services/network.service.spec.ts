import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { NetworkService } from './network.service';

describe('NetworkService', () => {
  let service: NetworkService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.endpoint}/api/network`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NetworkService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('gets the connection status', () => {
    service.getStatus().subscribe((res) => {
      expect(res).toEqual({ connected: true, ssid: 'HomeWifi' });
    });
    const req = httpMock.expectOne(`${apiUrl}/status`);
    expect(req.request.method).toBe('GET');
    req.flush({ connected: true, ssid: 'HomeWifi' });
  });

  it('scans for networks', () => {
    service.scan().subscribe((res) => {
      expect(res.networks.length).toBe(1);
    });
    const req = httpMock.expectOne(`${apiUrl}/scan`);
    expect(req.request.method).toBe('GET');
    req.flush({ networks: [{ ssid: 'HomeWifi', signal: 80, secured: true }] });
  });

  it('connects with a password', () => {
    service.connect('HomeWifi', 'secret').subscribe((res) => {
      expect(res.message).toBe('Conectado');
    });
    const req = httpMock.expectOne(`${apiUrl}/connect`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ ssid: 'HomeWifi', password: 'secret' });
    req.flush({ message: 'Conectado', ssid: 'HomeWifi' });
  });

  it('connects without a password', () => {
    service.connect('OpenNet').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/connect`);
    expect(req.request.body).toEqual({ ssid: 'OpenNet', password: undefined });
    req.flush({ message: 'Conectado' });
  });
});
