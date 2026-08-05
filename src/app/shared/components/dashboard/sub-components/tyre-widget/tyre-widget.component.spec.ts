import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TyreWidgetComponent } from './tyre-widget.component';

describe('TyreWidgetComponent', () => {
  let component: TyreWidgetComponent;
  let fixture: ComponentFixture<TyreWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TyreWidgetComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TyreWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('converts bar to psi', () => {
    expect(component.barToPsi(2)).toBeCloseTo(29.008, 2);
    expect(component.barToPsi(null)).toBe(0);
  });

  it('computes sensor status for a raw value', () => {
    expect(typeof component.getSensorStatus(80, 'tyre_temp')).toBe('string');
  });

  it('computes pressure status converting from bar', () => {
    expect(typeof component.pressStatus(2, 'tyre_press')).toBe('string');
    expect(component.pressStatus(null, 'tyre_press')).toBe('cold');
  });

  it('emits configToggle', () => {
    const spy = jasmine.createSpy('configToggle');
    component.configToggle.subscribe(spy);
    component.configToggle.emit('tyre_temp');
    expect(spy).toHaveBeenCalledWith('tyre_temp');
  });

  it('renders with sample data without throwing', () => {
    component.data = { tyreTempFL: 80, tyrePressFL: 2.1 };
    component.plan = 'ultimate';
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
