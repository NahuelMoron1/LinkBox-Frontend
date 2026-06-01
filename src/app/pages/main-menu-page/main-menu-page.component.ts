import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { ThemeService } from '../../shared/services/theme.service';

@Component({
  selector: 'app-main-menu-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './main-menu-page.component.html',
  styleUrl: './main-menu-page.component.css',
})
export class MainMenuPageComponent implements OnInit {
  isLoggedIn = false;
  navScrolled = false;

  features = [
    {
      icon: '◈',
      title: 'REAL-TIME MONITORING',
      desc: 'Live RPM, water temperature, oil pressure, fuel pressure and more — updated every millisecond your engine is running.',
    },
    {
      icon: '◎',
      title: 'SESSION RECORDING',
      desc: 'Capture every run automatically. Review historical data, compare sessions and identify performance trends over time.',
    },
    {
      icon: '◇',
      title: 'TELEMETRY CHARTS',
      desc: 'Interactive multi-channel charts with zoom and pan. Correlate metrics across time and spot anomalies before they cost you a race.',
    },
    {
      icon: '◉',
      title: 'GT3 DISPLAY MODE',
      desc: 'Professional dashboard inspired by the Porsche GT3 DDU. Switch between GT3 and Classic layouts on the fly.',
    },
  ];

  plans = [
    {
      name: 'BASIC',
      badgeClass: 'plan-basic',
      tagline: 'Monitor your car',
      features: [
        'Live dashboard',
        'Real-time telemetry',
        'GT3 & Classic display',
        'Dark & Light mode',
      ],
      cta: 'GET STARTED',
      highlight: false,
    },
    {
      name: 'PRO',
      badgeClass: 'plan-pro',
      tagline: 'Record & analyse',
      features: [
        'Everything in Basic',
        'Session recording',
        '2 saved sessions / month',
        'Export to JSON',
      ],
      cta: 'GET PRO',
      highlight: false,
    },
    {
      name: 'ULTIMATE',
      badgeClass: 'plan-ultimate',
      tagline: 'No limits',
      features: [
        'Everything in Pro',
        'Unlimited sessions',
        'Auto-save on connect',
        'Priority support',
      ],
      cta: 'GET ULTIMATE',
      highlight: true,
    },
  ];

  constructor(
    private authService: AuthService,
    public themeService: ThemeService,
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
