import { TestBed } from '@angular/core/testing';
import { AlertThresholdsService } from './alert-thresholds.service';

describe('AlertThresholdsService', () => {
  let service: AlertThresholdsService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlertThresholdsService);
  });

  afterEach(() => localStorage.clear());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('returns default thresholds when nothing is saved', () => {
    expect(service.get('oil_temp')).toEqual(service.getDefault('oil_temp'));
  });

  it('saves and retrieves custom thresholds', () => {
    const custom = { cold: 1, warm: 2, optimum: 3, warning: 4, danger: 5 };
    service.save('oil_temp', custom);
    expect(service.get('oil_temp')).toEqual(custom);
  });

  it('persists saved thresholds to localStorage and reloads them on a new instance', () => {
    const custom = { cold: 1, warm: 2, optimum: 3, warning: 4, danger: 5 };
    service.save('oil_temp', custom);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(AlertThresholdsService);
    expect(reloaded.get('oil_temp')).toEqual(custom);
  });

  it('falls back to defaults when localStorage has corrupt JSON', () => {
    localStorage.setItem('linkbox-sensor-thresholds-v3', '{not-json');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(AlertThresholdsService);
    expect(reloaded.get('oil_temp')).toEqual(reloaded.getDefault('oil_temp'));
  });

  it('resets a sensor back to its defaults', () => {
    service.save('oil_temp', { cold: 1, warm: 2, optimum: 3, warning: 4, danger: 5 });
    service.reset('oil_temp');
    expect(service.get('oil_temp')).toEqual(service.getDefault('oil_temp'));
  });

  it('returns cold for null/undefined values', () => {
    expect(service.getStatus(null, 'oil_temp')).toBe('cold');
    expect(service.getStatus(undefined, 'oil_temp')).toBe('cold');
  });

  it('classifies values across all five zones', () => {
    const t = service.get('oil_temp');
    expect(service.getStatus(t.cold - 1, 'oil_temp')).toBe('danger');
    expect(service.getStatus(t.cold, 'oil_temp')).toBe('cold');
    expect(service.getStatus(t.warm, 'oil_temp')).toBe('warm');
    expect(service.getStatus(t.optimum, 'oil_temp')).toBe('optimum');
    expect(service.getStatus(t.warning, 'oil_temp')).toBe('warning');
    expect(service.getStatus(t.danger, 'oil_temp')).toBe('danger');
  });

  it('isDanger reflects the danger zone at both extremes', () => {
    const t = service.get('oil_temp');
    expect(service.isDanger(t.cold - 1, 'oil_temp')).toBeTrue();
    expect(service.isDanger(t.danger, 'oil_temp')).toBeTrue();
    expect(service.isDanger(t.optimum, 'oil_temp')).toBeFalse();
  });
});
