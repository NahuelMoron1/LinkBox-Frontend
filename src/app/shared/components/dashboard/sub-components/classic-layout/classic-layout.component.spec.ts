import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClassicLayoutComponent } from './classic-layout.component';

describe('ClassicLayoutComponent', () => {
  let component: ClassicLayoutComponent;
  let fixture: ComponentFixture<ClassicLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassicLayoutComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClassicLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('computes sensor status', () => {
    expect(typeof component.getSensorStatus(80, 'oil_temp')).toBe('string');
  });

  it('converts bar to psi and computes pressure status', () => {
    expect(component.barToPsi(2)).toBeCloseTo(29.008, 2);
    expect(component.barToPsi(null)).toBe(0);
    expect(typeof component.pressStatus(3, 'oil_press')).toBe('string');
    expect(component.pressStatus(null, 'oil_press')).toBe('cold');
  });

  it('emits configToggle', () => {
    const spy = jasmine.createSpy('configToggle');
    component.configToggle.subscribe(spy);
    component.configToggle.emit('oil_temp');
    expect(spy).toHaveBeenCalledWith('oil_temp');
  });

  it('renders with sample data without throwing', () => {
    component.data = { rpm: 5000, water_temp: 90, oil_temp: 95, oil_press: 3.5, fuel_press: 2.8, sonda: 14.2, gear: 3 };
    component.plan = 'pro';
    component.isLive = true;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
