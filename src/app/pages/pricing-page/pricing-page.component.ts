import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from '../../shared/services/i18n.service';
import { ThemeService } from '../../shared/services/theme.service';

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

@Component({
  selector: 'app-pricing-page',
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './pricing-page.component.html',
  styleUrl: './pricing-page.component.css',
})
export class PricingPageComponent implements OnInit {
  plansArray = Object.values(PLANS);
  selectedPlan: PlanDetail = PLANS['pro'];
  faqItems = FAQ_KEYS;
  openFaqIndex: number | null = null;

  form = {
    email: '', name: '',
    cardNumber: '', expiry: '', cvv: '', cardName: '',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public themeService: ThemeService,
    public i18n: I18nService,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.selectedPlan = PLANS[params['planId']] ?? PLANS['pro'];
    });
  }

  selectPlan(id: string): void {
    this.selectedPlan = PLANS[id];
    this.router.navigate(['/pricing', id], { replaceUrl: true });
  }

  toggleFaq(index: number): void {
    this.openFaqIndex = this.openFaqIndex === index ? null : index;
  }

  formatCard(event: Event): void {
    const raw = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 16);
    this.form.cardNumber = raw.replace(/(.{4})/g, '$1 ').trim();
  }

  formatExpiry(event: Event): void {
    const raw = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 4);
    this.form.expiry = raw.length > 2 ? raw.slice(0, 2) + '/' + raw.slice(2) : raw;
  }

  onSubscribe(): void {
    if (!this.form.email || !this.form.name) {
      Swal.fire({ icon: 'warning', title: 'Missing info', text: 'Please fill in your email and name.', background: '#0a0a0a', color: '#fff', confirmButtonColor: '#00cc66' });
      return;
    }
    if (this.selectedPlan.monthlyPrice > 0 && (!this.form.cardNumber || !this.form.expiry || !this.form.cvv)) {
      Swal.fire({ icon: 'warning', title: 'Missing payment info', text: 'Please complete all card fields.', background: '#0a0a0a', color: '#fff', confirmButtonColor: '#00cc66' });
      return;
    }
    Swal.fire({
      icon: 'info',
      title: 'Payment Processing',
      html: `<p style="color:#888;font-size:0.9rem">Online payment via Stripe is coming soon.<br>Contact us to activate your <strong style="color:#fff">${this.selectedPlan.name}</strong> plan.</p>`,
      background: '#0a0a0a',
      color: '#fff',
      confirmButtonColor: '#00cc66',
      confirmButtonText: 'Got it',
    });
  }
}
