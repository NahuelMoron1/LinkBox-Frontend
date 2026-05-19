import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DeviceInfo } from '../../models/Device';
import { TelemetryDataPoint } from '../../models/Session';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';
import { SessionsService } from '../../services/sessions.service';
import { TelemetryService } from '../../services/telemetry.service';
import { TelemetryChartDesignComponent } from '../telemetry-chart-design/telemetry-chart-design.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, TelemetryChartDesignComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  @Input() key: string | null = null;
  @Input() plan: 'basic' | 'pro' | 'ultimate' | null = null;
  @Input() deviceId: string | null = null;

  public data: any = {};
  private telemetrySub?: Subscription;
  private deviceSub?: Subscription;
  private historicalSub?: Subscription;
  public deviceInfo: DeviceInfo | null = null;

  public isLive = false;
  public history: any[] = [];
  private inactivityTimeout?: ReturnType<typeof setTimeout>;

  readonly MAX_RPM = 7000;
  readonly SHIFT_RPM = 6500;

  constructor(
    private telemetryService: TelemetryService,
    private authService: AuthService,
    private alertService: AlertService,
    private router: Router,
    private sessionsService: SessionsService,
  ) {}

  async ngOnInit() {
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

    // Para plan ULTIMATE: Cargar histórico de sesión recording actual
    if (this.plan === 'ultimate' && this.deviceId) {
      await this.loadUltimateRecordingSession();
    }

    this.key = this.authService.getDeviceKey();

    if (this.key) {
      this.telemetryService.joinRoom(this.key);

      this.telemetrySub = this.telemetryService
        .listenTelemetry()
        .subscribe((newData) => {
          this.isLive = true;
          this.data = newData;
          this.history = [...this.history, newData];
          if (this.history.length > 500) this.history.shift();

          // Reset inactivity timeout cuando llegan datos
          this.resetInactivityTimeout();
        });

      // Iniciar timeout de inactividad
      this.resetInactivityTimeout();
    }
  }

  /**
   * Para plan Ultimate: Cargar datos históricos de la sesión recording actual
   */
  private async loadUltimateRecordingSession(): Promise<void> {
    try {
      const recordingData = await this.sessionsService.loadRecordingSession(
        this.deviceId!,
      );

      if (recordingData?.session && recordingData.data.length > 0) {
        // Cargar histórico de la sesión
        this.history = recordingData.data.map((point: TelemetryDataPoint) => ({
          rpm: point.rpm,
          water_temp: point.water_temp,
          oil_temp: point.oil_temp,
          oil_press: point.oil_press,
          fuel_press: point.fuel_press,
          sonda: point.sonda,
          gear: point.gear,
          timestamp: new Date(point.timestamp).getTime(),
        }));

        // Usar el último registro como datos actuales
        if (this.history.length > 0) {
          this.data = this.history[this.history.length - 1];
          this.isLive = true;
        }

        console.log(
          `[DASHBOARD-ULTIMATE] Loaded ${this.history.length} historical records`,
        );
      }
    } catch (error) {
      console.error(
        '[DASHBOARD-ULTIMATE] Error loading recording session:',
        error,
      );
    }
  }

  /**
   * Resetear timeout de inactividad (3 segundos sin datos = stopped)
   */
  private resetInactivityTimeout(): void {
    // Limpiar timeout anterior
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }

    // Establecer nuevo timeout
    this.inactivityTimeout = setTimeout(async () => {
      console.log('[DASHBOARD] Inactivity detected - marking as stopped');
      this.isLive = false;

      // Para plan ULTIMATE: Notificar al servidor para completar la sesión
      if (this.plan === 'ultimate' && this.deviceId) {
        const completed = await this.sessionsService.completeRecordingSession(
          this.deviceId,
        );
        if (completed) {
          console.log(
            '[DASHBOARD-ULTIMATE] Recording session completed on server',
          );
        }
      }
    }, 3000); // 3 segundos sin datos
  }

  ngOnDestroy() {
    this.telemetrySub?.unsubscribe();
    this.deviceSub?.unsubscribe();
    this.historicalSub?.unsubscribe();
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }
  }

  getTempStatus(temp: number): string {
    if (!temp || temp <= 0) return 'cold';
    if (temp < 70) return 'cold';
    if (temp >= 70 && temp < 85) return 'warm';
    if (temp >= 85 && temp <= 98) return 'optimum';
    if (temp > 98 && temp <= 105) return 'warning';
    return 'danger';
  }

  getLedColor(index: number): string {
    if (index < 8) return 'green';
    if (index < 12) return 'red';
    return 'blue';
  }
}
