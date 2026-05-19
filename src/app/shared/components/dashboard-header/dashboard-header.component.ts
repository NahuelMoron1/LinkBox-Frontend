import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DeviceInfo } from '../../models/Device';
@Component({
  selector: 'app-dashboard-header',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-header.component.html',
  styleUrl: './dashboard-header.component.css',
})
export class DashboardHeaderComponent {
  @Input() deviceInfo: DeviceInfo | null = null;
  getPlanBadgeColor(): string {
    switch (this.deviceInfo?.plan) {
      case 'basic':
        return 'bg-blue-500';
      case 'pro':
        return 'bg-green-500';
      case 'ultimate':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  }

  /**
   * Get plan badge text (uppercase)
   */
  getPlanBadgeText(): string {
    return this.deviceInfo?.plan?.toUpperCase() || 'UNKNOWN';
  }
}
