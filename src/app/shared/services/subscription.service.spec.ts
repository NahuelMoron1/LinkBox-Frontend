import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { SubscriptionService } from './subscription.service';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.endpoint}/api/subscriptions`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SubscriptionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('creates a checkout session', () => {
    service.createCheckoutSession('pro').subscribe((res) => {
      expect(res.checkoutUrl).toBe('https://stripe.example/checkout');
    });
    const req = httpMock.expectOne(`${apiUrl}/create-checkout-session`);
    expect(req.request.body).toEqual({ plan: 'pro' });
    req.flush({ checkoutUrl: 'https://stripe.example/checkout' });
  });

  it('cancels a subscription', () => {
    service.cancelSubscription().subscribe((res) => {
      expect(res.message).toBe('cancelled');
    });
    const req = httpMock.expectOne(`${apiUrl}/cancel`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'cancelled', accessUntil: '2026-01-01' });
  });

  it('changes plan', () => {
    service.changePlan('ultimate').subscribe((res) => {
      expect(res.type).toBe('upgrade');
    });
    const req = httpMock.expectOne(`${apiUrl}/change-plan`);
    expect(req.request.body).toEqual({ newPlan: 'ultimate' });
    req.flush({ message: 'ok', type: 'upgrade', effective: 'now' });
  });

  it('gets subscription info', () => {
    service.getSubscriptionInfo().subscribe((res) => {
      expect(res.plan).toBe('pro');
    });
    const req = httpMock.expectOne(`${apiUrl}/info`);
    expect(req.request.method).toBe('GET');
    req.flush({
      plan: 'pro',
      subscriptionStatus: 'active',
      subscriptionEndDate: null,
      cancelAtPeriodEnd: false,
      stripe: null,
      lastPaymentId: null,
    });
  });
});
