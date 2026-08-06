import { Component, OnInit } from '@angular/core';
import { BootScreenComponent } from '../../shared/components/boot-screen/boot-screen.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ConnectionStatusComponent } from '../../shared/components/connection-status/connection-status.component';
import { DashboardComponent } from '../../shared/components/dashboard/dashboard.component';
import { DeviceIdBadgeComponent } from '../../shared/components/device-id-badge/device-id-badge.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { UpdateNotificationComponent } from '../../shared/components/update-notification/update-notification.component';
import { WifiWidgetComponent } from '../../shared/components/wifi-widget/wifi-widget.component';
import { ToastService } from '../../shared/services/toast.service';
import { UpdateService } from '../../shared/services/update.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    BootScreenComponent,
    DashboardComponent,
    UpdateNotificationComponent,
    ConfirmDialogComponent,
    WifiWidgetComponent,
    ConnectionStatusComponent,
    DeviceIdBadgeComponent,
    ToastComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
})
export class DashboardPageComponent implements OnInit {
  isBooting = true;
  showDashboard = false;

  checkingUpdates = false;
  checkingFinished = false;

  updateAvailable = false;
  updateVersion: string | null = null;
  showConfirm = false;

  constructor(
    private updateService: UpdateService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  onBootDone(): void {
    this.isBooting = false;
    this.showDashboard = true;
  }

  async onCheckUpdates(): Promise<void> {
    this.checkingUpdates = true;
    this.checkingFinished = false;

    try {
      const result = await this.updateService.check();
      this.updateAvailable = result.available;
      this.updateVersion = result.version;
    } catch {
      this.updateAvailable = false;
      this.updateVersion = null;
    }

    this.checkingFinished = true;
  }

  onCheckingDone(): void {
    this.checkingUpdates = false;
    this.checkingFinished = false;

    if (this.updateAvailable) {
      this.showConfirm = true;
    } else {
      this.toast.success('No hay actualizaciones');
    }
  }

  onConfirmUpdate(): void {
    this.showConfirm = false;
    this.updateService.install();
  }

  onCancelUpdate(): void {
    this.showConfirm = false;
  }

  onUpdateComplete(success: boolean): void {
    if (success) {
      this.toast.success('Se completaron las actualizaciones');
    } else {
      this.toast.error('No se pudo actualizar');
    }
  }
}
