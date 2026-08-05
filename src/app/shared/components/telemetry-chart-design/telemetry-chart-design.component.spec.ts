import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TelemetryChartDesignComponent } from './telemetry-chart-design.component';
import { ThemeService } from '../../services/theme.service';

function sampleData(n = 20): any[] {
  const start = Date.now();
  return Array.from({ length: n }, (_, i) => ({
    timestamp: new Date(start + i * 1000).toISOString(),
    rpm: 3000 + i * 50,
    water_temp: 80 + i,
    oil_temp: 90 + i,
    oil_press: 3 + i * 0.1,
    tyre_temp_fl: 70 + i,
    tyre_temp_fr: 71 + i,
    tyre_temp_rl: 72 + i,
    tyre_temp_rr: 73 + i,
    tyre_press_fl: 2 + i * 0.05,
    tyre_press_fr: 2.1 + i * 0.05,
    tyre_press_rl: 2.2 + i * 0.05,
    tyre_press_rr: 2.3 + i * 0.05,
  }));
}

describe('TelemetryChartDesignComponent', () => {
  let component: TelemetryChartDesignComponent;
  let fixture: ComponentFixture<TelemetryChartDesignComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TelemetryChartDesignComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TelemetryChartDesignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // dispara ngAfterViewInit y resuelve canvasRef
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('hasData reflects the length of fullData', () => {
    expect(component.hasData).toBeFalse();
    component.fullData = sampleData(1);
    expect(component.hasData).toBeFalse();
    component.fullData = sampleData(5);
    expect(component.hasData).toBeTrue();
  });

  it('initializes the zoom range on the first data arrival and preserves it on later updates', () => {
    component.fullData = sampleData(10);
    component.ngOnChanges({ fullData: { currentValue: component.fullData, previousValue: [], firstChange: true, isFirstChange: () => true } });
    expect((component as any).xMin).toBe(0);
    expect((component as any).xMax).toBe(10);

    (component as any).xMin = 2; // simula un zoom aplicado por el usuario
    component.fullData = sampleData(15);
    component.ngOnChanges({ fullData: { currentValue: component.fullData, previousValue: [], firstChange: false, isFirstChange: () => false } });
    expect((component as any).xMin).toBe(2); // no se resetea
    expect((component as any).xMax).toBe(15);
  });

  it('does nothing on ngOnChanges when fullData is empty or unrelated to the change', () => {
    expect(() => component.ngOnChanges({})).not.toThrow();
    component.fullData = [];
    expect(() => component.ngOnChanges({ fullData: { currentValue: [], previousValue: [], firstChange: true, isFirstChange: () => true } })).not.toThrow();
  });

  it('cycles through metrics forwards and backwards, wrapping around', () => {
    const total = component.metrics.length;
    expect(component.currentIndex).toBe(0);
    component.prevMetric();
    expect(component.currentIndex).toBe(total - 1);
    component.nextMetric();
    expect(component.currentIndex).toBe(0);
    for (let i = 0; i < total; i++) component.nextMetric();
    expect(component.currentIndex).toBe(0);
  });

  it('exposes the current metric label and multiKeys', () => {
    expect(component.currentMetricLabel).toBeTruthy();
    expect(component.currentMetricMultiKeys).toBeUndefined(); // rpm no tiene multiKeys

    const tyreTempIndex = component.metrics.findIndex((m) => m.key === 'tyre_temp');
    component.currentIndex = tyreTempIndex;
    expect(component.currentMetricMultiKeys?.length).toBe(4);
  });

  it('draws the single-line path without throwing', () => {
    component.fullData = sampleData(20);
    component.ngOnChanges({ fullData: { currentValue: component.fullData, previousValue: [], firstChange: true, isFirstChange: () => true } });
    expect(() => (component as any).draw()).not.toThrow();
  });

  it('draws the single-line path with a hover tooltip', () => {
    component.fullData = sampleData(20);
    component.ngOnChanges({ fullData: { currentValue: component.fullData, previousValue: [], firstChange: true, isFirstChange: () => true } });
    (component as any).hoverIndex = 5;
    expect(() => (component as any).draw()).not.toThrow();
  });

  it('draws the multi-line path (tyre temp) without throwing, with and without hover', () => {
    component.fullData = sampleData(20);
    component.ngOnChanges({ fullData: { currentValue: component.fullData, previousValue: [], firstChange: true, isFirstChange: () => true } });
    component.currentIndex = component.metrics.findIndex((m) => m.key === 'tyre_temp');
    expect(() => (component as any).draw()).not.toThrow();
    (component as any).hoverIndex = 3;
    expect(() => (component as any).draw()).not.toThrow();
  });

  it('draws the multi-line pressure path (scaled bar→PSI) without throwing', () => {
    component.fullData = sampleData(20);
    component.ngOnChanges({ fullData: { currentValue: component.fullData, previousValue: [], firstChange: true, isFirstChange: () => true } });
    component.currentIndex = component.metrics.findIndex((m) => m.key === 'tyre_press');
    expect(() => (component as any).draw()).not.toThrow();
  });

  it('does nothing when drawing with fewer than 2 data points', () => {
    component.fullData = sampleData(1);
    expect(() => (component as any).draw()).not.toThrow();
  });

  it('runs a full drag-to-zoom cycle via mouse events', () => {
    component.fullData = sampleData(20);
    component.ngOnChanges({ fullData: { currentValue: component.fullData, previousValue: [], firstChange: true, isFirstChange: () => true } });

    const down = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 50 });
    component.handleMouseDown(down);
    expect(component.isDragging).toBeTrue();

    const move = new MouseEvent('mousemove', { clientX: 160, clientY: 50 });
    component.handleMouseMove(move);

    const up = new MouseEvent('mouseup', { clientX: 160, clientY: 50 });
    component.handleMouseUp(up);
    expect(component.isDragging).toBeFalse();
  });

  it('ignores mousedown from non-primary buttons', () => {
    const down = new MouseEvent('mousedown', { button: 2, clientX: 100, clientY: 50 });
    component.handleMouseDown(down);
    expect(component.isDragging).toBeFalse();
  });

  it('ignores mouseup when there was no drag in progress', () => {
    expect(() => component.handleMouseUp(new MouseEvent('mouseup', { clientX: 10, clientY: 10 }))).not.toThrow();
  });

  it('updates the hover index on mousemove without dragging', () => {
    component.fullData = sampleData(20);
    component.ngOnChanges({ fullData: { currentValue: component.fullData, previousValue: [], firstChange: true, isFirstChange: () => true } });
    const move = new MouseEvent('mousemove', { clientX: 100, clientY: 50 });
    expect(() => component.handleMouseMove(move)).not.toThrow();
  });

  it('zooms in and out with the mouse wheel and clamps at the data boundaries', () => {
    component.fullData = sampleData(50);
    component.ngOnChanges({ fullData: { currentValue: component.fullData, previousValue: [], firstChange: true, isFirstChange: () => true } });

    const zoomIn = new WheelEvent('wheel', { deltaY: -100, clientX: 100 });
    spyOn(zoomIn, 'preventDefault');
    component.handleMouseWheel(zoomIn);
    expect(zoomIn.preventDefault).toHaveBeenCalled();

    const zoomOut = new WheelEvent('wheel', { deltaY: 100, clientX: 100 });
    component.handleMouseWheel(zoomOut);

    expect((component as any).xMin).toBeGreaterThanOrEqual(0);
    expect((component as any).xMax).toBeLessThanOrEqual(component.fullData.length);
  });

  it('does nothing on wheel with fewer than 2 data points', () => {
    component.fullData = sampleData(1);
    const wheel = new WheelEvent('wheel', { deltaY: -100 });
    spyOn(wheel, 'preventDefault');
    component.handleMouseWheel(wheel);
    expect(wheel.preventDefault).toHaveBeenCalled();
  });

  it('resets the hover/drag state on mouse leave', () => {
    (component as any).isDragging = true;
    (component as any).hoverIndex = 4;
    component.handleMouseLeave();
    expect(component.isDragging).toBeFalse();
    expect((component as any).hoverIndex).toBeNull();
  });

  it('resets the zoom to the full data range', () => {
    component.fullData = sampleData(20);
    (component as any).xMin = 5;
    (component as any).xMax = 10;
    component.resetZoom();
    expect((component as any).xMin).toBe(0);
    expect((component as any).xMax).toBe(20);
  });

  it('re-renders when the theme or language changes', () => {
    const renderSpy = spyOn(component as any, 'render').and.callThrough();
    TestBed.inject(ThemeService).toggle();
    expect(renderSpy).toHaveBeenCalled();
  });

  it('cleans up subscriptions and the resize listener on destroy', () => {
    const removeSpy = spyOn(window, 'removeEventListener').and.callThrough();
    fixture.destroy();
    expect(removeSpy).toHaveBeenCalledWith('resize', jasmine.any(Function));
  });
});
