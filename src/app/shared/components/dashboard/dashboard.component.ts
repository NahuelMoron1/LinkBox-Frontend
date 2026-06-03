import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { DeviceInfo } from '../../models/Device';
import { TelemetryDataPoint } from '../../models/Session';
import { AlertService } from '../../services/alert.service';
import { AlertThresholdsService, SensorThresholds, SENSOR_UNIT } from '../../services/alert-thresholds.service';
import { AuthService } from '../../services/auth.service';
import { I18nService } from '../../services/i18n.service';
import { SessionsService } from '../../services/sessions.service';
import { TelemetryService } from '../../services/telemetry.service';
import { TelemetryChartDesignComponent } from '../telemetry-chart-design/telemetry-chart-design.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, TelemetryChartDesignComponent, TranslatePipe],

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

  selectedStyle: 'gt3' | 'classic' = 'gt3';

  // ── Alert thresholds config (Ultimate plan) ────────────────
  editingSensor: string | null = null;
  editValues: SensorThresholds = { cold: 0, warm: 0, optimum: 0, warning: 0, danger: 0 };
  readonly configSensors = [
    { key: 'oil_temp',   labelKey: 'dash.oilTemp'   },
    { key: 'water_temp', labelKey: 'dash.waterTemp'  },
    { key: 'oil_press',  labelKey: 'dash.oilPress'   },
    { key: 'tyre_temp',  labelKey: 'dash.tyreTemp'   },
    { key: 'tyre_press', labelKey: 'dash.tyrePress'  },
  ];

  getSensorUnit(sensor: string): string {
    return SENSOR_UNIT[sensor] ?? '';
  }

  /** Translation key for the currently edited sensor */
  get editingSensorLabelKey(): string {
    return this.configSensors.find(s => s.key === this.editingSensor)?.labelKey ?? '';
  }

  toggleSensorConfig(sensor: string): void {
    if (this.editingSensor === sensor) {
      this.editingSensor = null;
    } else {
      this.editingSensor = sensor;
      this.editValues = { ...this.alertThresholds.get(sensor) };
    }
  }

  /** Sanitize a threshold input in real-time: strip non-numeric chars, enforce >= 0 */
  sanitizeInput(field: keyof SensorThresholds, event: Event): void {
    const raw   = (event.target as HTMLInputElement).value;
    const clean = raw.replace(/[^0-9.]/g, '');         // allow digits + one dot
    const num   = parseFloat(clean);
    const safe  = isNaN(num) || num < 0 ? 0 : num;
    this.editValues[field] = safe;
    (event.target as HTMLInputElement).value = String(safe);
  }

  saveSensorConfig(): void {
    if (!this.editingSensor) return;

    const v = this.editValues;

    // All must be finite positive numbers
    const ok = (n: number) => typeof n === 'number' && isFinite(n) && n > 0;
    if (!ok(v.cold) || !ok(v.warm) || !ok(v.optimum) || !ok(v.warning) || !ok(v.danger)) {
      this.alertService.error(
        this.i18n.t('dash.cfg.title'),
        this.i18n.t('dash.cfg.errNeg'),
      );
      return;
    }

    // Must be strictly ascending
    if (!(v.cold < v.warm && v.warm < v.optimum && v.optimum < v.warning && v.warning < v.danger)) {
      this.alertService.error(
        this.i18n.t('dash.cfg.title'),
        this.i18n.t('dash.cfg.errOrder'),
      );
      return;
    }

    this.alertThresholds.save(this.editingSensor, {
      cold:    v.cold,
      warm:    v.warm,
      optimum: v.optimum,
      warning: v.warning,
      danger:  v.danger,
    });
    this.editingSensor = null;
  }

  resetSensorConfig(): void {
    if (this.editingSensor) {
      this.alertThresholds.reset(this.editingSensor);
      this.editValues = { ...this.alertThresholds.get(this.editingSensor) };
    }
  }
  // ──────────────────────────────────────────────────────────

  setStyle(style: 'gt3' | 'classic'): void {
    this.selectedStyle = style;
    localStorage.setItem('linkbox-dashboard-style', style);
  }

  constructor(
    private telemetryService: TelemetryService,
    private authService: AuthService,
    private alertService: AlertService,
    private router: Router,
    private sessionsService: SessionsService,
    public alertThresholds: AlertThresholdsService,
    public i18n: I18nService,
  ) {}

  async ngOnInit() {
    const saved = localStorage.getItem('linkbox-dashboard-style');
    if (saved === 'gt3' || saved === 'classic') this.selectedStyle = saved;

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
          if (!this.isLive) {
            // Reconnected after a stop — discard old session history
            this.history = [];
          }
          this.isLive = true;
          this.data = newData;
          this.history = [...this.history, newData];

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
    }, 3_000); // 3 s without data → mark as stopped and complete session
  }

  ngOnDestroy() {
    this.telemetrySub?.unsubscribe();
    this.deviceSub?.unsubscribe();
    this.historicalSub?.unsubscribe();
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }
  }

  /** Used by the template for all three configurable sensors */
  getSensorStatus(value: number, sensor: string): string {
    return this.alertThresholds.getStatus(value, sensor);
  }

  /** For display: always returns a number (0 when no data). */
  barToPsi(bar: any): number {
    return bar != null ? (+bar) * 14.504 : 0;
  }

  /** For status/color: returns null when there is no sensor data,
   *  so getStatus can distinguish "no data" from "value is 0". */
  pressStatus(bar: any, sensor: string): string {
    const psi = bar != null ? (+bar) * 14.504 : null;
    return this.alertThresholds.getStatus(psi, sensor);
  }

  pressIsDanger(bar: any, sensor: string): boolean {
    return this.pressStatus(bar, sensor) === 'danger';
  }

  /** Legacy alias kept for backward compat */
  getTempStatus(temp: number): string {
    return this.alertThresholds.getStatus(temp, 'oil_temp');
  }

  getLedColor(index: number): string {
    if (index < 8) return 'green';
    if (index < 12) return 'red';
    return 'blue';
  }
}
