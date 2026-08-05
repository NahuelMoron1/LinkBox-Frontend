import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { DashboardPageComponent } from './dashboard-page.component';
import { UpdateService } from '../../shared/services/update.service';

describe('DashboardPageComponent', () => {
  let component: DashboardPageComponent;
  let fixture: ComponentFixture<DashboardPageComponent>;
  let updateStub: jasmine.SpyObj<UpdateService>;

  beforeEach(async () => {
    updateStub = jasmine.createSpyObj<UpdateService>(
      'UpdateService',
      ['check', 'install'],
      { progress: { subscribe: () => ({ unsubscribe: () => {} }) } as any, complete: { subscribe: () => ({ unsubscribe: () => {} }) } as any },
    );

    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: UpdateService, useValue: updateStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('disables the right-click context menu', () => {
    const event = new MouseEvent('contextmenu', { cancelable: true });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBeTrue();
  });

  it('reveals the dashboard once the boot screen finishes', () => {
    component.onBootDone();
    expect(component.isBooting).toBeFalse();
    expect(component.showDashboard).toBeTrue();
  });

  it('checks for updates and stores the result', async () => {
    updateStub.check.and.resolveTo({ available: true, version: 'v1.2.3' });
    await component.onCheckUpdates();
    expect(component.updateAvailable).toBeTrue();
    expect(component.updateVersion).toBe('v1.2.3');
    expect(component.checkingFinished).toBeTrue();
  });

  it('treats a failed update check as unavailable', async () => {
    updateStub.check.and.rejectWith(new Error('network error'));
    await component.onCheckUpdates();
    expect(component.updateAvailable).toBeFalse();
    expect(component.updateVersion).toBeNull();
  });

  it('shows the confirm dialog when an update check finds a new version', () => {
    component.updateAvailable = true;
    component.updateVersion = 'v1.2.3';
    component.onCheckingDone();
    expect(component.showConfirm).toBeTrue();
  });

  it('does not show the confirm dialog when there is nothing to update', () => {
    component.updateAvailable = false;
    component.onCheckingDone();
    expect(component.showConfirm).toBeFalse();
  });

  it('starts the install and hides the confirm dialog on confirm', () => {
    component.showConfirm = true;
    component.onConfirmUpdate();
    expect(component.showConfirm).toBeFalse();
    expect(updateStub.install).toHaveBeenCalled();
  });

  it('hides the confirm dialog on cancel', () => {
    component.showConfirm = true;
    component.onCancelUpdate();
    expect(component.showConfirm).toBeFalse();
  });

  it('handles update completion, success and failure', () => {
    expect(() => component.onUpdateComplete(true)).not.toThrow();
    expect(() => component.onUpdateComplete(false)).not.toThrow();
  });
});
