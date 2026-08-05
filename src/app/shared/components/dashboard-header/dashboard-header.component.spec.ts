import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { DashboardHeaderComponent } from './dashboard-header.component';

describe('DashboardHeaderComponent', () => {
  let component: DashboardHeaderComponent;
  let fixture: ComponentFixture<DashboardHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardHeaderComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('defaults the plan badge to unknown when there is no device info', () => {
    component.deviceInfo = null;
    expect(component.getPlanBadgeColor()).toBe('plan-default');
    expect(component.getPlanBadgeText()).toBe('UNKNOWN');
  });

  it('maps each plan to its badge color', () => {
    component.deviceInfo = { id: '1', clientName: 'x', plan: 'basic', subscriptionStatus: 'active', subscriptionEndDate: null, sessionsSavedThisMonth: 0 };
    expect(component.getPlanBadgeColor()).toBe('plan-basic');
    component.deviceInfo = { ...component.deviceInfo, plan: 'pro' };
    expect(component.getPlanBadgeColor()).toBe('plan-pro');
    component.deviceInfo = { ...component.deviceInfo, plan: 'ultimate' };
    expect(component.getPlanBadgeColor()).toBe('plan-ultimate');
    expect(component.getPlanBadgeText()).toBe('ULTIMATE');
  });

  it('logs out via the auth service', () => {
    expect(() => component.logout()).not.toThrow();
  });
});
