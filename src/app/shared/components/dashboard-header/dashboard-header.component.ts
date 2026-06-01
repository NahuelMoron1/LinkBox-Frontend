import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { DeviceInfo } from '../../models/Device';
import { I18nService } from '../../services/i18n.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-dashboard-header',
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './dashboard-header.component.html',
  styleUrl: './dashboard-header.component.css',
})
export class DashboardHeaderComponent {
  @Input() deviceInfo: DeviceInfo | null = null;

  constructor(
    public themeService: ThemeService,
    public i18n: I18nService,
  ) {}

  getPlanBadgeColor(): string {
    switch (this.deviceInfo?.plan) {
      case 'basic':    return 'plan-basic';
      case 'pro':      return 'plan-pro';
      case 'ultimate': return 'plan-ultimate';
      default:         return 'plan-default';
    }
  }

  getPlanBadgeText(): string {
    return this.deviceInfo?.plan?.toUpperCase() || 'UNKNOWN';
  }
}
