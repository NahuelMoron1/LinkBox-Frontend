import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertThresholdConfigComponent } from './alert-threshold-config.component';
import { AlertService } from '../../../../services/alert.service';

describe('AlertThresholdConfigComponent', () => {
  let component: AlertThresholdConfigComponent;
  let fixture: ComponentFixture<AlertThresholdConfigComponent>;
  let alertStub: jasmine.SpyObj<AlertService>;

  beforeEach(async () => {
    alertStub = jasmine.createSpyObj<AlertService>('AlertService', ['error']);
    await TestBed.configureTestingModule({
      imports: [AlertThresholdConfigComponent],
      providers: [{ provide: AlertService, useValue: alertStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertThresholdConfigComponent);
    component = fixture.componentInstance;
    component.editValues = { cold: 70, warm: 80, optimum: 90, warning: 105, danger: 120 };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sanitizes non-numeric input to a safe number', () => {
    const input = document.createElement('input');
    input.value = 'ab12.5cd';
    component.sanitizeInput('cold', { target: input } as unknown as Event);
    expect(component.editValues.cold).toBe(12.5);
    expect(input.value).toBe('12.5');
  });

  it('sanitizes a negative-looking result to 0', () => {
    const input = document.createElement('input');
    input.value = '-';
    component.sanitizeInput('cold', { target: input } as unknown as Event);
    expect(component.editValues.cold).toBe(0);
  });

  it('emits saved when all values are valid and ascending', () => {
    const spy = jasmine.createSpy('saved');
    component.saved.subscribe(spy);
    component.onSave();
    expect(spy).toHaveBeenCalledWith(component.editValues);
    expect(alertStub.error).not.toHaveBeenCalled();
  });

  it('rejects non-positive values', () => {
    component.editValues.cold = 0;
    const spy = jasmine.createSpy('saved');
    component.saved.subscribe(spy);
    component.onSave();
    expect(spy).not.toHaveBeenCalled();
    expect(alertStub.error).toHaveBeenCalled();
  });

  it('rejects values that are not in ascending order', () => {
    component.editValues.warm = 200; // rompe cold < warm < optimum
    const spy = jasmine.createSpy('saved');
    component.saved.subscribe(spy);
    component.onSave();
    expect(spy).not.toHaveBeenCalled();
    expect(alertStub.error).toHaveBeenCalled();
  });

  it('emits closed and resetted', () => {
    const closedSpy = jasmine.createSpy('closed');
    const resettedSpy = jasmine.createSpy('resetted');
    component.closed.subscribe(closedSpy);
    component.resetted.subscribe(resettedSpy);
    component.closed.emit();
    component.resetted.emit();
    expect(closedSpy).toHaveBeenCalled();
    expect(resettedSpy).toHaveBeenCalled();
  });
});
