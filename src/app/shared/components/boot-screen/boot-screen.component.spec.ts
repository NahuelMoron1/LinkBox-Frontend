import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BootScreenComponent } from './boot-screen.component';

describe('BootScreenComponent', () => {
  let component: BootScreenComponent;
  let fixture: ComponentFixture<BootScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BootScreenComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BootScreenComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('fades out and emits done automatically in boot mode', fakeAsync(() => {
    component.mode = 'boot';
    fixture.detectChanges();

    let doneEmitted = false;
    component.done.subscribe(() => (doneEmitted = true));

    tick(3600);
    expect(component.fadingOut).toBeTrue();

    tick(700);
    expect(doneEmitted).toBeTrue();
  }));

  it('emits done shortly after finished becomes true in checking mode', fakeAsync(() => {
    component.mode = 'checking';
    component.finished = false;
    fixture.detectChanges();

    let doneEmitted = false;
    component.done.subscribe(() => (doneEmitted = true));

    component.finished = true;
    component.ngOnChanges({
      finished: {
        currentValue: true,
        previousValue: false,
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.fadingOut).toBeTrue();
    tick(700);
    expect(doneEmitted).toBeTrue();
  }));

  it('does nothing on unrelated ngOnChanges calls', () => {
    component.mode = 'checking';
    fixture.detectChanges();
    expect(() => component.ngOnChanges({})).not.toThrow();
  });
});
