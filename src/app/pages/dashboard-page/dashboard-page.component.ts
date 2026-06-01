import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs/internal/Subscription';
import { DashboardHeaderComponent } from '../../shared/components/dashboard-header/dashboard-header.component';
import { DashboardComponent } from '../../shared/components/dashboard/dashboard.component';
import { PlanInfoToolbarComponent } from '../../shared/components/plan-info-toolbar/plan-info-toolbar.component';
import { DeviceInfo, PlanInfo } from '../../shared/models/Device';
import { AlertService } from '../../shared/services/alert.service';
import { AuthService } from '../../shared/services/auth.service';
import { SessionsService } from '../../shared/services/sessions.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    DashboardComponent,
    PlanInfoToolbarComponent,
    DashboardHeaderComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
})
export class DashboardPageComponent {
  private deviceSub?: Subscription;
  private planSub?: Subscription;

  // Plan and subscription info
  public deviceInfo: DeviceInfo | null = null;
  public planInfo: PlanInfo | null = null;
  public key: string | null = null;

  constructor(
    private authService: AuthService,
    private sessionsService: SessionsService,
    private alertService: AlertService,
    private router: Router,
  ) {}
  async ngOnInit() {
    // PRIMERO: Esperar a que se cargue el device info del servidor
    this.deviceInfo = await this.authService.getDeviceInfoFromServer();

    // Si no hay sesión activa, redirigir a login
    if (!this.deviceInfo) {
      this.router.navigate(['/login']);
      return;
    }

    // Subscribe to device changes (actualizaciones posteriores)
    this.deviceSub = this.authService.device$.subscribe((info) => {
      this.deviceInfo = info;
    });

    if (this.authService.isSubscriptionExpired()) {
      this.alertService.subscriptionExpired().then(() => {});
      return;
    }

    this.key = this.authService.getDeviceKey();

    // Load plan information
    this.sessionsService.loadPlanInfo();
    this.planSub = this.sessionsService.planInfo$.subscribe((info) => {
      this.planInfo = info;
    });

    // Para plan ULTIMATE: Cargar la sesión recording actual con histórico
    if (this.deviceInfo.plan === 'ultimate') {
      const recordingData = await this.sessionsService.loadRecordingSession(
        this.deviceInfo.id,
      );

      if (recordingData?.session) {
        console.log(
          `[ULTIMATE] Recording session loaded: ${recordingData.session.id}`,
          `Records: ${recordingData.data.length}`,
        );
        // El dashboard recibirá los datos vía currentSession$
      }
    }
  }
}
