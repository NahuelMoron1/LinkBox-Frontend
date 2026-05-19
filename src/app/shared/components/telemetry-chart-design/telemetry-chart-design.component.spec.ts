import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TelemetryChartDesignComponent } from './telemetry-chart-design.component';

describe('TelemetryChartDesignComponent', () => {
  let component: TelemetryChartDesignComponent;
  let fixture: ComponentFixture<TelemetryChartDesignComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TelemetryChartDesignComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TelemetryChartDesignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
