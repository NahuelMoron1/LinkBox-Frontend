import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { PricingPageComponent, PLANS } from './pricing-page.component';
import { AuthService } from '../../shared/services/auth.service';
import { SubscriptionService } from '../../shared/services/subscription.service';
import { DeviceInfo } from '../../shared/models/Device';

describe('PricingPageComponent', () => {
  let component: PricingPageComponent;
  let fixture: ComponentFixture<PricingPageComponent>;
  let params$: BehaviorSubject<any>;
  let queryParams$: BehaviorSubject<any>;
  let device$: BehaviorSubject<DeviceInfo | null>;
  let subscriptionStub: jasmine.SpyObj<SubscriptionService>;

  // Se puede llamar más de una vez dentro del mismo test para probar
  // distintas combinaciones de plan/device — TestBed necesita un reset
  // explícito porque no permite reconfigurarse post-instanciación.
  function setup(planId = 'pro') {
    TestBed.resetTestingModule();

    params$ = new BehaviorSubject<any>({ planId });
    queryParams$ = new BehaviorSubject<any>({});
    device$ = new BehaviorSubject<DeviceInfo | null>(null);
    subscriptionStub = jasmine.createSpyObj<SubscriptionService>('SubscriptionService', [
      'createCheckoutSession', 'changePlan',
    ]);

    TestBed.configureTestingModule({
      imports: [PricingPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { device$: device$.asObservable() } },
        { provide: SubscriptionService, useValue: subscriptionStub },
        { provide: ActivatedRoute, useValue: { params: params$.asObservable(), queryParams: queryParams$.asObservable() } },
      ],
    });

    fixture = TestBed.createComponent(PricingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => Swal.close());

  it('should create and select the plan from the route param', () => {
    setup('ultimate');
    expect(component.selectedPlan.id).toBe('ultimate');
  });

  it('falls back to the pro plan for an unknown route param', () => {
    setup('not-a-plan');
    expect(component.selectedPlan.id).toBe('pro');
  });

  it('updates deviceInfo from the auth service', () => {
    setup();
    device$.next({ id: '1', clientName: 'x', plan: 'basic', subscriptionStatus: 'active', subscriptionEndDate: null, sessionsSavedThisMonth: 0 });
    expect(component.deviceInfo?.plan).toBe('basic');
  });

  it('shows a success dialog and redirects on subscription=success', fakeAsync(() => {
    setup();
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');
    queryParams$.next({ subscription: 'success', plan: 'pro' });
    tick(); // deja que SweetAlert2 monte el modal antes de clickear
    Swal.clickConfirm();
    tick();
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  }));

  it('shows an info dialog on subscription=cancelled', () => {
    setup();
    expect(() => queryParams$.next({ subscription: 'cancelled' })).not.toThrow();
  });

  it('computes currentPlan/isCurrentPlan/isUpgrade/isDowngrade for a basic device', () => {
    setup('pro');
    device$.next({ id: '1', clientName: 'x', plan: 'basic', subscriptionStatus: 'active', subscriptionEndDate: null, sessionsSavedThisMonth: 0 });
    expect(component.currentPlan).toBe('basic');
    expect(component.isCurrentPlan).toBeFalse();
    expect(component.isUpgrade).toBeTrue();
    expect(component.isDowngrade).toBeFalse();
  });

  it('computes ctaLabel for the basic plan (included, not purchasable)', () => {
    setup('basic');
    // Con un plan pago activo, "básico" deja de ser el plan actual — así se
    // ejercita la rama "incluido" en vez de la de "plan actual".
    device$.next({ id: '1', clientName: 'x', plan: 'pro', subscriptionStatus: 'active', subscriptionEndDate: null, sessionsSavedThisMonth: 0 });
    expect(component.ctaLabel).toBe('Plan incluido con el controlador');
  });

  it('computes ctaLabel for the basic plan with no device info (defaults to "current")', () => {
    setup('basic');
    expect(component.ctaLabel).toBe('Plan actual');
  });

  it('computes ctaLabel for the current plan', () => {
    setup('pro');
    device$.next({ id: '1', clientName: 'x', plan: 'pro', subscriptionStatus: 'active', subscriptionEndDate: null, sessionsSavedThisMonth: 0 });
    expect(component.ctaLabel).toBe('Plan actual');
  });

  it('computes ctaLabel for an upgrade', () => {
    setup('ultimate');
    device$.next({ id: '1', clientName: 'x', plan: 'pro', subscriptionStatus: 'active', subscriptionEndDate: null, sessionsSavedThisMonth: 0 });
    expect(component.ctaLabel).toContain('Mejorar a');
  });

  it('computes ctaLabel for a downgrade', () => {
    setup('pro');
    device$.next({ id: '1', clientName: 'x', plan: 'ultimate', subscriptionStatus: 'active', subscriptionEndDate: null, sessionsSavedThisMonth: 0 });
    expect(component.ctaLabel).toContain('Cambiar a');
  });

  it('ctaDisabled is true for the basic plan', () => {
    setup('basic');
    expect(component.ctaDisabled).toBeTrue();
  });

  it('selectPlan updates the selection and navigates', () => {
    setup('pro');
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');
    component.selectPlan('ultimate');
    expect(component.selectedPlan.id).toBe('ultimate');
    expect(navigateSpy).toHaveBeenCalledWith(['/pricing', 'ultimate'], { replaceUrl: true });
  });

  it('toggles the open FAQ index', () => {
    setup();
    component.toggleFaq(0);
    expect(component.openFaqIndex).toBe(0);
    component.toggleFaq(0);
    expect(component.openFaqIndex).toBeNull();
  });

  it('onSubscribe does nothing when the CTA is disabled', () => {
    setup('basic');
    component.onSubscribe();
    expect(subscriptionStub.createCheckoutSession).not.toHaveBeenCalled();
  });

  it('starts a Stripe checkout for a first-time subscription', () => {
    setup('pro');
    device$.next({ id: '1', clientName: 'x', plan: 'basic', subscriptionStatus: 'active', subscriptionEndDate: null, sessionsSavedThisMonth: 0 });
    // Nunca emite: si emitiera, el componente haría window.location.href = ...
    // y navegaría la página real del navegador de test.
    subscriptionStub.createCheckoutSession.and.returnValue(new Subject());
    component.onSubscribe();
    expect(subscriptionStub.createCheckoutSession).toHaveBeenCalledWith('pro');
  });

  it('shows a specific message when the plan is already active', () => {
    setup('pro');
    device$.next({ id: '1', clientName: 'x', plan: 'basic', subscriptionStatus: 'active', subscriptionEndDate: null, sessionsSavedThisMonth: 0 });
    subscriptionStub.createCheckoutSession.and.returnValue(
      throwError(() => ({ error: { code: 'PLAN_ALREADY_ACTIVE' } })),
    );
    expect(() => component.onSubscribe()).not.toThrow();
  });

  it('shows a generic error on checkout failure', () => {
    setup('pro');
    device$.next({ id: '1', clientName: 'x', plan: 'basic', subscriptionStatus: 'active', subscriptionEndDate: null, sessionsSavedThisMonth: 0 });
    subscriptionStub.createCheckoutSession.and.returnValue(throwError(() => ({ error: {} })));
    expect(() => component.onSubscribe()).not.toThrow();
  });

  it('confirms and applies a plan change for an existing subscriber', fakeAsync(() => {
    setup('ultimate');
    device$.next({ id: '1', clientName: 'x', plan: 'pro', subscriptionStatus: 'active', subscriptionEndDate: null, sessionsSavedThisMonth: 0 });
    subscriptionStub.changePlan.and.returnValue(of({ message: 'ok', type: 'upgrade', effective: 'now' }));

    component.onSubscribe();
    tick(); // deja que SweetAlert2 monte el modal antes de clickear
    Swal.clickConfirm();
    tick();
    expect(subscriptionStub.changePlan).toHaveBeenCalledWith('ultimate');
  }));

  it('shows an error when changing plans fails', fakeAsync(() => {
    setup('ultimate');
    device$.next({ id: '1', clientName: 'x', plan: 'pro', subscriptionStatus: 'active', subscriptionEndDate: null, sessionsSavedThisMonth: 0 });
    subscriptionStub.changePlan.and.returnValue(throwError(() => new Error('boom')));

    component.onSubscribe();
    tick();
    Swal.clickConfirm();
    tick();
    expect(subscriptionStub.changePlan).toHaveBeenCalled();
  }));

  it('exposes all three plans', () => {
    setup();
    expect(component.plansArray.length).toBe(Object.keys(PLANS).length);
  });
});
