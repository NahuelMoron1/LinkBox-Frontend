import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { AuthService } from '../../shared/services/auth.service';
import { I18nService } from '../../shared/services/i18n.service';
import { SubscriptionService } from '../../shared/services/subscription.service';
import { ThemeService } from '../../shared/services/theme.service';
import { DeviceInfo } from '../../shared/models/Device';

export interface PlanFeature {
  labelKey: string;
  included: boolean;
}

export interface PlanDetail {
  id: string;
  name: string;
  badgeClass: string;
  monthlyPrice: number;
  yearlyPrice: number;
  taglineKey: string;
  descKey: string;
  popular?: boolean;
  features: PlanFeature[];
}

export const PLANS: Record<string, PlanDetail> = {
  basic: {
    id: 'basic',
    name: 'BASIC',
    badgeClass: 'plan-basic',
    monthlyPrice: 9.99,
    yearlyPrice: 119.88,
    taglineKey: 'pricing.tagline.basic',
    descKey:    'pricing.desc.basic',
    features: [
      { labelKey: 'pricingFeat.1',  included: true  },
      { labelKey: 'pricingFeat.2',  included: true  },
      { labelKey: 'pricingFeat.3',  included: true  },
      { labelKey: 'pricingFeat.4',  included: true  },
      { labelKey: 'pricingFeat.5',  included: true  },
      { labelKey: 'pricingFeat.6',  included: false },
      { labelKey: 'pricingFeat.7',  included: false },
      { labelKey: 'pricingFeat.8',  included: false },
      { labelKey: 'pricingFeat.9',  included: false },
      { labelKey: 'pricingFeat.10', included: false },
    ],
  },
  pro: {
    id: 'pro',
    name: 'PRO',
    badgeClass: 'plan-pro',
    monthlyPrice: 19.99,
    yearlyPrice: 239.88,
    taglineKey: 'pricing.tagline.pro',
    descKey:    'pricing.desc.pro',
    features: [
      { labelKey: 'pricingFeat.1',    included: true  },
      { labelKey: 'pricingFeat.2',    included: true  },
      { labelKey: 'pricingFeat.3',    included: true  },
      { labelKey: 'pricingFeat.4',    included: true  },
      { labelKey: 'pricingFeat.5',    included: true  },
      { labelKey: 'pricingFeat.6',    included: true  },
      { labelKey: 'pricingFeat.7pro', included: true  },
      { labelKey: 'pricingFeat.8',    included: true  },
      { labelKey: 'pricingFeat.9',    included: false },
      { labelKey: 'pricingFeat.10',   included: false },
    ],
  },
  ultimate: {
    id: 'ultimate',
    name: 'ULTIMATE',
    badgeClass: 'plan-ultimate',
    monthlyPrice: 34.99,
    yearlyPrice: 419.88,
    taglineKey: 'pricing.tagline.ult',
    descKey:    'pricing.desc.ult',
    popular: true,
    features: [
      { labelKey: 'pricingFeat.1',    included: true },
      { labelKey: 'pricingFeat.2',    included: true },
      { labelKey: 'pricingFeat.3',    included: true },
      { labelKey: 'pricingFeat.4',    included: true },
      { labelKey: 'pricingFeat.5',    included: true },
      { labelKey: 'pricingFeat.6',    included: true },
      { labelKey: 'pricingFeat.7ult', included: true },
      { labelKey: 'pricingFeat.8',    included: true },
      { labelKey: 'pricingFeat.9',    included: true },
      { labelKey: 'pricingFeat.10',   included: true },
    ],
  },
};

const FAQ_KEYS = [
  { qKey: 'pricing.faq1.q', aKey: 'pricing.faq1.a' },
  { qKey: 'pricing.faq2.q', aKey: 'pricing.faq2.a' },
  { qKey: 'pricing.faq3.q', aKey: 'pricing.faq3.a' },
  { qKey: 'pricing.faq4.q', aKey: 'pricing.faq4.a' },
];

const PLAN_RANK: Record<string, number> = { basic: 0, pro: 1, ultimate: 2 };

@Component({
  selector: 'app-pricing-page',
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './pricing-page.component.html',
  styleUrl: './pricing-page.component.css',
})
export class PricingPageComponent implements OnInit {
  plansArray = Object.values(PLANS);
  selectedPlan: PlanDetail = PLANS['pro'];
  faqItems = FAQ_KEYS;
  openFaqIndex: number | null = null;

  deviceInfo: DeviceInfo | null = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public themeService: ThemeService,
    public i18n: I18nService,
    private authService: AuthService,
    private subscriptionService: SubscriptionService,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.selectedPlan = PLANS[params['planId']] ?? PLANS['pro'];
    });

    this.authService.device$.subscribe(device => {
      this.deviceInfo = device;
    });

    // Verificar si se vuelve de Stripe con éxito
    this.route.queryParams.subscribe(params => {
      if (params['subscription'] === 'success') {
        const plan = params['plan'] ?? '';
        Swal.fire({
          icon: 'success',
          title: '¡Suscripción activada!',
          html: `Tu plan <strong>${plan.toUpperCase()}</strong> ya está activo. Redirigiendo al dashboard...`,
          background: '#0a0a0a',
          color: '#fff',
          confirmButtonColor: '#00cc66',
          timer: 3000,
          timerProgressBar: true,
        }).then(() => {
          this.router.navigate(['/dashboard']);
        });
      }
      if (params['subscription'] === 'cancelled') {
        Swal.fire({
          icon: 'info',
          title: 'Pago cancelado',
          text: 'No se realizó ningún cargo. Podés intentarlo de nuevo cuando quieras.',
          background: '#0a0a0a',
          color: '#fff',
          confirmButtonColor: '#00cc66',
        });
      }
    });
  }

  get currentPlan(): string {
    return this.deviceInfo?.plan ?? 'basic';
  }

  get isCurrentPlan(): boolean {
    return this.selectedPlan.id === this.currentPlan;
  }

  get isUpgrade(): boolean {
    return PLAN_RANK[this.selectedPlan.id] > PLAN_RANK[this.currentPlan];
  }

  get isDowngrade(): boolean {
    return PLAN_RANK[this.selectedPlan.id] < PLAN_RANK[this.currentPlan];
  }

  get ctaLabel(): string {
    if (this.isCurrentPlan) return 'Plan actual';
    if (this.selectedPlan.id === 'basic') return 'Plan incluido con el controlador';
    if (this.isUpgrade && this.currentPlan !== 'basic') return `Mejorar a ${this.selectedPlan.name}`;
    if (this.isDowngrade) return `Cambiar a ${this.selectedPlan.name}`;
    return `Suscribirse a ${this.selectedPlan.name}`;
  }

  get ctaDisabled(): boolean {
    return this.isCurrentPlan || this.selectedPlan.id === 'basic' || this.loading;
  }

  selectPlan(id: string): void {
    this.selectedPlan = PLANS[id];
    this.router.navigate(['/pricing', id], { replaceUrl: true });
  }

  toggleFaq(index: number): void {
    this.openFaqIndex = this.openFaqIndex === index ? null : index;
  }

  onSubscribe(): void {
    if (this.ctaDisabled) return;

    const plan = this.selectedPlan.id as 'pro' | 'ultimate';
    const hasActiveSub = this.currentPlan !== 'basic';

    if (hasActiveSub) {
      // Cambio de plan
      const isUpgrade = PLAN_RANK[plan] > PLAN_RANK[this.currentPlan];
      const msg = isUpgrade
        ? `Se te cobrará la diferencia prorrateada ahora y tu plan cambiará inmediatamente.`
        : `Tu plan actual se mantiene hasta el vencimiento, luego cambia a ${this.selectedPlan.name}.`;

      Swal.fire({
        icon: 'question',
        title: `${isUpgrade ? 'Mejorar' : 'Cambiar'} a ${this.selectedPlan.name}`,
        html: `<p style="color:#aaa;font-size:0.9rem">${msg}</p>`,
        background: '#0a0a0a',
        color: '#fff',
        showCancelButton: true,
        confirmButtonColor: '#00cc66',
        cancelButtonColor: '#555',
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
      }).then(result => {
        if (result.isConfirmed) this.doChangePlan(plan);
      });
    } else {
      // Primera suscripción → Stripe Checkout
      this.doCheckout(plan);
    }
  }

  private doCheckout(plan: 'pro' | 'ultimate'): void {
    this.loading = true;
    this.subscriptionService.createCheckoutSession(plan).subscribe({
      next: ({ checkoutUrl }) => {
        window.location.href = checkoutUrl;
      },
      error: (err) => {
        this.loading = false;
        const code = err.error?.code;
        if (code === 'PLAN_ALREADY_ACTIVE') {
          Swal.fire({ icon: 'info', title: 'Plan ya activo', text: 'Ya tenés este plan activo.', background: '#0a0a0a', color: '#fff', confirmButtonColor: '#00cc66' });
        } else {
          Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo iniciar el proceso de pago. Intentá de nuevo.', background: '#0a0a0a', color: '#fff', confirmButtonColor: '#00cc66' });
        }
      },
    });
  }

  private doChangePlan(plan: 'pro' | 'ultimate'): void {
    this.loading = true;
    this.subscriptionService.changePlan(plan).subscribe({
      next: (res) => {
        this.loading = false;
        const isUpgrade = res.type === 'upgrade';
        Swal.fire({
          icon: 'success',
          title: isUpgrade ? '¡Plan mejorado!' : 'Cambio programado',
          html: `<p style="color:#aaa;font-size:0.9rem">${res.message}</p>`,
          background: '#0a0a0a',
          color: '#fff',
          confirmButtonColor: '#00cc66',
        }).then(() => {
          if (isUpgrade) this.router.navigate(['/dashboard']);
        });
      },
      error: () => {
        this.loading = false;
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cambiar el plan. Intentá de nuevo.', background: '#0a0a0a', color: '#fff', confirmButtonColor: '#00cc66' });
      },
    });
  }
}
