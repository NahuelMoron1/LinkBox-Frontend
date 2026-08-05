import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ConnectionStatusComponent } from './connection-status.component';
import { ConnectionStatus, TelemetryService } from '../../services/telemetry.service';

describe('ConnectionStatusComponent', () => {
  let component: ConnectionStatusComponent;
  let fixture: ComponentFixture<ConnectionStatusComponent>;
  let statusSubject: Subject<ConnectionStatus>;

  beforeEach(async () => {
    statusSubject = new Subject<ConnectionStatus>();
    await TestBed.configureTestingModule({
      imports: [ConnectionStatusComponent],
      providers: [
        { provide: TelemetryService, useValue: { connectionStatus: statusSubject.asObservable() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConnectionStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and start connected', () => {
    expect(component).toBeTruthy();
    expect(component.status).toBe('connected');
  });

  it('shows the reconnecting banner when disconnected', () => {
    statusSubject.next('disconnected');
    fixture.detectChanges();
    expect(component.status).toBe('disconnected');
    const banner = (fixture.nativeElement as HTMLElement).querySelector('.conn-banner');
    expect(banner).toBeTruthy();
  });

  it('hides the banner again once reconnected', () => {
    statusSubject.next('disconnected');
    fixture.detectChanges();
    statusSubject.next('connected');
    fixture.detectChanges();
    const banner = (fixture.nativeElement as HTMLElement).querySelector('.conn-banner');
    expect(banner).toBeFalsy();
  });

  it('unsubscribes on destroy', () => {
    fixture.destroy();
    expect(() => statusSubject.next('disconnected')).not.toThrow();
  });
});
