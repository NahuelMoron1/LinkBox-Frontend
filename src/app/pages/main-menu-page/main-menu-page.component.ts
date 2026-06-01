import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { AuthService } from '../../shared/services/auth.service';
import { I18nService } from '../../shared/services/i18n.service';
import { ThemeService } from '../../shared/services/theme.service';

@Component({
  selector: 'app-main-menu-page',
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './main-menu-page.component.html',
  styleUrl: './main-menu-page.component.css',
})
export class MainMenuPageComponent implements OnInit {
  isLoggedIn = false;
  navScrolled = false;

  features = [
    { icon: '◈', titleKey: 'feat.1.title', descKey: 'feat.1.desc' },
    { icon: '◎', titleKey: 'feat.2.title', descKey: 'feat.2.desc' },
    { icon: '◇', titleKey: 'feat.3.title', descKey: 'feat.3.desc' },
    { icon: '◉', titleKey: 'feat.4.title', descKey: 'feat.4.desc' },
  ];

  plans = [
    {
      id: 'basic',
      name: 'BASIC',
      badgeClass: 'plan-basic',
      taglineKey: 'plan.basic.tagline',
      featureKeys: ['plan.basic.f1', 'plan.basic.f2', 'plan.basic.f3', 'plan.basic.f4'],
      ctaKey: 'plan.basic.cta',
      highlight: false,
    },
    {
      id: 'pro',
      name: 'PRO',
      badgeClass: 'plan-pro',
      taglineKey: 'plan.pro.tagline',
      featureKeys: ['plan.pro.f1', 'plan.pro.f2', 'plan.pro.f3', 'plan.pro.f4'],
      ctaKey: 'plan.pro.cta',
      highlight: false,
    },
    {
      id: 'ultimate',
      name: 'ULTIMATE',
      badgeClass: 'plan-ultimate',
      taglineKey: 'plan.ult.tagline',
      featureKeys: ['plan.ult.f1', 'plan.ult.f2', 'plan.ult.f3', 'plan.ult.f4'],
      ctaKey: 'plan.ult.cta',
      highlight: true,
    },
  ];

  constructor(
    private authService: AuthService,
    public themeService: ThemeService,
    public i18n: I18nService,
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = !!this.authService.getDeviceKey();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.navScrolled = window.scrollY > 60;
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  logout(): void {
    this.authService.logout();
  }
}
