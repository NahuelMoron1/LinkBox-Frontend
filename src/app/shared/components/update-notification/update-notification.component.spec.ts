import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { UpdateNotificationComponent } from './update-notification.component';
import { UpdateCompleteResult, UpdateService, UpdateStep } from '../../services/update.service';

describe('UpdateNotificationComponent', () => {
  let component: UpdateNotificationComponent;
  let fixture: ComponentFixture<UpdateNotificationComponent>;
  let progress$: Subject<UpdateStep>;
  let complete$: Subject<UpdateCompleteResult>;

  beforeEach(async () => {
    progress$ = new Subject<UpdateStep>();
    complete$ = new Subject<UpdateCompleteResult>();
    await TestBed.configureTestingModule({
      imports: [UpdateNotificationComponent],
      providers: [
        { provide: UpdateService, useValue: { progress: progress$.asObservable(), complete: complete$.asObservable() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create hidden', () => {
    expect(component).toBeTruthy();
    expect(component.phase).toBe('hidden');
  });

  it('shows the installing overlay on progress and marks earlier steps done', () => {
    progress$.next('downloading');
    expect(component.phase).toBe('installing');
    expect(component.isStepActive('downloading')).toBeTrue();
    expect(component.isStepDone('downloading')).toBeFalse();

    progress$.next('healthcheck');
    expect(component.isStepDone('downloading')).toBeTrue();
    expect(component.isStepActive('healthcheck')).toBeTrue();
  });

  it('hides on a successful completion and emits complete(true)', () => {
    const completeSpy = jasmine.createSpy('complete');
    component.complete.subscribe(completeSpy);

    progress$.next('downloading');
    complete$.next({ success: true, error: null });

    expect(component.phase).toBe('hidden');
    expect(completeSpy).toHaveBeenCalledWith(true);
  });

  it('shows the error state with a message and auto-hides', fakeAsync(() => {
    const completeSpy = jasmine.createSpy('complete');
    component.complete.subscribe(completeSpy);

    progress$.next('healthcheck');
    complete$.next({ success: false, error: 'la versión nueva no pasó el healthcheck' });

    expect(component.phase).toBe('error');
    expect(component.errorMessage).toBe('la versión nueva no pasó el healthcheck');
    expect(completeSpy).toHaveBeenCalledWith(false);

    tick(6000);
    expect(component.phase).toBe('hidden');
    expect(component.errorMessage).toBeNull();
  }));

  it('falls back to a default error message when none is provided', () => {
    complete$.next({ success: false });
    expect(component.errorMessage).toBe('No se pudo completar la actualización');
  });

  it('isStepActive is false when there is no current step', () => {
    expect(component.isStepActive('downloading')).toBeFalse();
  });

  it('cleans up subscriptions on destroy', () => {
    fixture.destroy();
    expect(() => progress$.next('downloading')).not.toThrow();
  });
});
