import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SubscriptionInfo {
  plan: 'basic' | 'pro' | 'ultimate';
  subscriptionStatus: 'active' | 'suspended' | 'expired';
  subscriptionEndDate: string | null;
  cancelAtPeriodEnd: boolean;
  stripe: {
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string;
  } | null;
  lastPaymentId: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  private apiUrl = `${environment.endpoint}/api/subscriptions`;

  constructor(private http: HttpClient) {}

  /**
   * Solicita una sesión de Stripe Checkout para el plan indicado.
   * El backend devuelve { checkoutUrl } y el frontend redirige ahí.
   */
  createCheckoutSession(plan: 'pro' | 'ultimate'): Observable<{ checkoutUrl: string }> {
    return this.http.post<{ checkoutUrl: string }>(
      `${this.apiUrl}/create-checkout-session`,
      { plan },
      { withCredentials: true },
    );
  }

  /**
   * Cancela la suscripción al final del período vigente.
   */
  cancelSubscription(): Observable<{ message: string; accessUntil: string }> {
    return this.http.post<{ message: string; accessUntil: string }>(
      `${this.apiUrl}/cancel`,
      {},
      { withCredentials: true },
    );
  }

  /**
   * Cambia el plan.
   * Upgrades: inmediato con prorrateo.
   * Downgrades: al vencimiento del período actual.
   */
  changePlan(newPlan: 'pro' | 'ultimate'): Observable<{ message: string; type: string; effective: string }> {
    return this.http.post<{ message: string; type: string; effective: string }>(
      `${this.apiUrl}/change-plan`,
      { newPlan },
      { withCredentials: true },
    );
  }

  /**
   * Obtiene el estado actual de la suscripción del device logueado.
   */
  getSubscriptionInfo(): Observable<SubscriptionInfo> {
    return this.http.get<SubscriptionInfo>(
      `${this.apiUrl}/info`,
      { withCredentials: true },
    );
  }
}
