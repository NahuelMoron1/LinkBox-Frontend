import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { DeviceInfoService } from './device-info.service';

describe('DeviceInfoService', () => {
  let service: DeviceInfoService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.endpoint}/api/device/info`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DeviceInfoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('gets the device info', () => {
    service.getInfo().subscribe((res) => {
      expect(res).toEqual({ deviceId: 'abc-123', version: 'v1.0.0' });
    });
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush({ deviceId: 'abc-123', version: 'v1.0.0' });
  });

  it('passes through a null deviceId', () => {
    service.getInfo().subscribe((res) => {
      expect(res.deviceId).toBeNull();
    });
    const req = httpMock.expectOne(apiUrl);
    req.flush({ deviceId: null, version: 'v1.0.0' });
  });
});
