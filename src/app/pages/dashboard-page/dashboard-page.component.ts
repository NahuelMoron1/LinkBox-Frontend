import { Component } from '@angular/core';
import { BootScreenComponent } from '../../shared/components/boot-screen/boot-screen.component';
import { DashboardComponent } from '../../shared/components/dashboard/dashboard.component';
import { UpdateNotificationComponent } from '../../shared/components/update-notification/update-notification.component';

@Component({
  selector: 'app-dashboard-page',
  imports: [BootScreenComponent, DashboardComponent, UpdateNotificationComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
})
export class DashboardPageComponent {
  isBooting = true;
  showDashboard = false;

  onBootDone(): void {
    this.isBooting = false;
    this.showDashboard = true;
  }
}
