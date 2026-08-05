import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RpmLedStripComponent } from './rpm-led-strip.component';

describe('RpmLedStripComponent', () => {
  let component: RpmLedStripComponent;
  let fixture: ComponentFixture<RpmLedStripComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RpmLedStripComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RpmLedStripComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with 15 leds', () => {
    expect(component).toBeTruthy();
    expect(component.leds.length).toBe(15);
  });

  it('colors the first 8 leds green, next 4 red, and the rest blue', () => {
    expect(component.getLedColor(0)).toBe('green');
    expect(component.getLedColor(7)).toBe('green');
    expect(component.getLedColor(8)).toBe('red');
    expect(component.getLedColor(11)).toBe('red');
    expect(component.getLedColor(12)).toBe('blue');
    expect(component.getLedColor(14)).toBe('blue');
  });
});
