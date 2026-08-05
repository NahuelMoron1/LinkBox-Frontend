import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastComponent } from './toast.component';
import { ToastService } from '../../services/toast.service';

describe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows a toast and hides it again after 4s', fakeAsync(() => {
    toastService.success('Saved!');
    expect(component.visible).toBeTrue();
    expect(component.message).toBe('Saved!');
    expect(component.type).toBe('success');

    tick(4000);
    expect(component.visible).toBeFalse();
  }));

  it('resets the hide timer when a new toast arrives before the previous one hides', fakeAsync(() => {
    toastService.success('First');
    tick(2000);
    toastService.error('Second');
    expect(component.message).toBe('Second');
    expect(component.type).toBe('error');

    tick(2000);
    expect(component.visible).toBeTrue(); // el timer se reinició con el segundo toast

    tick(2000);
    expect(component.visible).toBeFalse();
  }));

  it('cleans up the subscription and timer on destroy', fakeAsync(() => {
    toastService.success('Bye');
    expect(() => {
      fixture.destroy();
      tick(4000);
    }).not.toThrow();
  }));
});
