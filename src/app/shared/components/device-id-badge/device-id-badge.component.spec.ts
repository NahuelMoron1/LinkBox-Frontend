import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DeviceIdBadgeComponent } from './device-id-badge.component';
import { DeviceInfoService } from '../../services/device-info.service';

describe('DeviceIdBadgeComponent', () => {
  let component: DeviceIdBadgeComponent;
  let fixture: ComponentFixture<DeviceIdBadgeComponent>;
  let deviceInfoStub: jasmine.SpyObj<DeviceInfoService>;

  function setup(response: { deviceId: string | null; version: string } | 'error') {
    deviceInfoStub = jasmine.createSpyObj<DeviceInfoService>('DeviceInfoService', ['getInfo']);
    deviceInfoStub.getInfo.and.returnValue(
      response === 'error' ? throwError(() => new Error('boom')) : of(response),
    );

    TestBed.configureTestingModule({
      imports: [DeviceIdBadgeComponent],
      providers: [{ provide: DeviceInfoService, useValue: deviceInfoStub }],
    });

    fixture = TestBed.createComponent(DeviceIdBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    setup({ deviceId: 'e3b5cf2f-eaf9-48ee-90ff-28e187629095', version: 'v1.0.0' });
    expect(component).toBeTruthy();
  });

  it('shows a shortened id and renders the badge', () => {
    setup({ deviceId: 'e3b5cf2f-eaf9-48ee-90ff-28e187629095', version: 'v1.0.0' });
    expect(component.shortId).toBe('e3b5cf2f');
    const badge = (fixture.nativeElement as HTMLElement).querySelector('.dev-badge');
    expect(badge).toBeTruthy();
    expect(badge?.textContent?.trim()).toBe('e3b5cf2f');
    expect(badge?.getAttribute('title')).toContain('e3b5cf2f-eaf9-48ee-90ff-28e187629095');
  });

  it('renders nothing when there is no device id', () => {
    setup({ deviceId: null, version: 'v1.0.0' });
    expect(component.shortId).toBe('');
    const badge = (fixture.nativeElement as HTMLElement).querySelector('.dev-badge');
    expect(badge).toBeFalsy();
  });

  it('renders nothing when the request fails', () => {
    setup('error');
    expect(component.deviceId).toBeNull();
    const badge = (fixture.nativeElement as HTMLElement).querySelector('.dev-badge');
    expect(badge).toBeFalsy();
  });
});
