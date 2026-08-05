import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { TelemetryService } from '../../services/telemetry.service';
import { AlertThresholdsService } from '../../services/alert-thresholds.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let telemetry$: Subject<any>;

  beforeEach(async () => {
    localStorage.clear();
    telemetry$ = new Subject<any>();

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: TelemetryService, useValue: { listenTelemetry: () => telemetry$.asObservable() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('goes live and updates data on incoming telemetry', () => {
    telemetry$.next({ rpm: 5000 });
    expect(component.isLive).toBeTrue();
    expect(component.data).toEqual({ rpm: 5000 });
  });

  it('goes offline again after 3s of inactivity', fakeAsync(() => {
    telemetry$.next({ rpm: 5000 });
    expect(component.isLive).toBeTrue();
    tick(3000);
    expect(component.isLive).toBeFalse();
  }));

  it('restarts the inactivity timer on every new reading', fakeAsync(() => {
    telemetry$.next({ rpm: 5000 });
    tick(2000);
    telemetry$.next({ rpm: 5100 }); // reinicia el timer de 3s
    tick(2000);
    expect(component.isLive).toBeTrue(); // todavía no pasaron 3s desde la última lectura
    tick(1000);
    expect(component.isLive).toBeFalse();
  }));

  it('loads a previously saved dashboard style', () => {
    localStorage.setItem('linkbox-dashboard-style', 'classic');
    const newFixture = TestBed.createComponent(DashboardComponent);
    newFixture.detectChanges();
    expect(newFixture.componentInstance.selectedStyle).toBe('classic');
  });

  it('ignores an invalid saved dashboard style', () => {
    localStorage.setItem('linkbox-dashboard-style', 'bogus');
    const newFixture = TestBed.createComponent(DashboardComponent);
    newFixture.detectChanges();
    expect(newFixture.componentInstance.selectedStyle).toBe('gt3');
  });

  it('switches and persists the dashboard style', () => {
    component.setStyle('classic');
    expect(component.selectedStyle).toBe('classic');
    expect(localStorage.getItem('linkbox-dashboard-style')).toBe('classic');
  });

  it('toggles the sensor config panel open and closed', () => {
    component.toggleSensorConfig('oil_temp');
    expect(component.editingSensor).toBe('oil_temp');
    component.toggleSensorConfig('oil_temp');
    expect(component.editingSensor).toBeNull();
  });

  it('loads the sensor thresholds into editValues when opening the config panel', () => {
    const thresholds = TestBed.inject(AlertThresholdsService);
    component.toggleSensorConfig('oil_temp');
    expect(component.editValues).toEqual(thresholds.get('oil_temp'));
  });

  it('resolves the label key for the currently edited sensor', () => {
    expect(component.editingSensorLabelKey).toBe('');
    component.toggleSensorConfig('water_temp');
    expect(component.editingSensorLabelKey).toBe('dash.waterTemp');
  });

  it('resolves the unit for a known and an unknown sensor', () => {
    expect(component.getSensorUnit('oil_temp')).toBe('°C');
    expect(component.getSensorUnit('unknown_sensor')).toBe('');
  });

  it('saves the edited thresholds and closes the panel', () => {
    const thresholds = TestBed.inject(AlertThresholdsService);
    const saveSpy = spyOn(thresholds, 'save').and.callThrough();
    component.toggleSensorConfig('oil_temp');
    const newValues = { cold: 1, warm: 2, optimum: 3, warning: 4, danger: 5 };
    component.onThresholdSaved(newValues);
    expect(saveSpy).toHaveBeenCalledWith('oil_temp', newValues);
    expect(component.editingSensor).toBeNull();
  });

  it('does nothing when saving thresholds without an open panel', () => {
    const thresholds = TestBed.inject(AlertThresholdsService);
    const saveSpy = spyOn(thresholds, 'save');
    component.onThresholdSaved({ cold: 1, warm: 2, optimum: 3, warning: 4, danger: 5 });
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('resets the currently edited sensor to defaults', () => {
    const thresholds = TestBed.inject(AlertThresholdsService);
    const resetSpy = spyOn(thresholds, 'reset').and.callThrough();
    component.toggleSensorConfig('oil_temp');
    component.resetSensorConfig();
    expect(resetSpy).toHaveBeenCalledWith('oil_temp');
    expect(component.editValues).toEqual(thresholds.get('oil_temp'));
  });

  it('does nothing resetting thresholds without an open panel', () => {
    const thresholds = TestBed.inject(AlertThresholdsService);
    const resetSpy = spyOn(thresholds, 'reset');
    component.resetSensorConfig();
    expect(resetSpy).not.toHaveBeenCalled();
  });

  it('unsubscribes and clears the inactivity timer on destroy', fakeAsync(() => {
    telemetry$.next({ rpm: 5000 });
    expect(() => {
      fixture.destroy();
      tick(3000);
    }).not.toThrow();
  }));
});
