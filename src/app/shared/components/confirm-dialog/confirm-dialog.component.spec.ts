import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits confirm and cancel', () => {
    const confirmSpy = jasmine.createSpy('confirm');
    const cancelSpy = jasmine.createSpy('cancel');
    component.confirm.subscribe(confirmSpy);
    component.cancel.subscribe(cancelSpy);

    component.confirm.emit();
    component.cancel.emit();

    expect(confirmSpy).toHaveBeenCalled();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('renders the version when visible', () => {
    component.visible = true;
    component.version = 'v1.2.3';
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent || '';
    expect(text).toContain('v1.2.3');
  });
});
