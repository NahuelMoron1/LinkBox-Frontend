import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
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
import { RpmLedStripComponent } from './sub-components/rpm-led-strip/rpm-led-strip.component';
import { Gt3LayoutComponent } from './sub-components/gt3-layout/gt3-layout.component';
import { ClassicLayoutComponent } from './sub-components/classic-layout/classic-layout.component';
import { AlertThresholdConfigComponent } from './sub-components/alert-threshold-config/alert-threshold-config.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    TranslatePipe,
    TelemetryChartDesignComponent,
    RpmLedStripComponent,
    Gt3LayoutComponent,
    ClassicLayoutComponent,
    AlertThresholdConfigComponent,
  ],
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

  readonly MAX_RPM   = 7000;
  readonly SHIFT_RPM = 6500;

  selectedStyle: 'gt3' | 'classic' = 'gt3';

  // ── Alert thresholds config (Ultimate plan) ────────────────
  editingSensor: string | null = null;
  editValues: SensorThresholds = { cold: 0, warm: 0, optimum: 0, warning: 0, danger: 0 };

  private readonly configSensors = [
    { key: 'oil_temp',   labelKey: 'dash.oilTemp'  },
    { key: 'water_temp', labelKey: 'dash.waterTemp' },
    { key: 'oil_press',  labelKey: 'dash.oilPress'  },
    { key: 'tyre_temp',  labelKey: 'dash.tyreTemp'  },
    { key: 'tyre_press', labelKey: 'dash.tyrePress' },
  ];

  get editingSensorLabelKey(): string {
    return this.configSensors.find(s => s.key === this.editingSensor)?.labelKey ?? '';
  }

  getSensorUnit(sensor: string): string {
    return SENSOR_UNIT[sensor] ?? '';
  }

  toggleSensorConfig(sensor: string): void {
    if (this.editingSensor === sensor) {
      this.editingSensor = null;
    } else {
      this.editingSensor = sensor;
      this.editValues = { ...this.alertThresholds.get(sensor) };
    }
  }

  onThresholdSaved(values: SensorThresholds): void {
    if (!this.editingSensor) return;
    this.alertThresholds.save(this.editingSensor, values);
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

    if (!this.deviceInfo) {
      this.router.navigate(['/login']);
      return;
    }

    this.deviceSub = this.authService.device$.subscribe(info => {
      this.deviceInfo = info;
    });

    if (this.authService.isSubscriptionExpired()) {
      this.alertService.subscriptionExpired().then(() => {});
      return;
    }

    if (this.plan === 'ultimate' && this.deviceId) {
      await this.loadUltimateRecordingSession();
    }

    this.key = this.authService.getDeviceKey();

    if (this.key) {
      this.telemetryService.joinRoom(this.key);

      this.telemetrySub = this.telemetryService
        .listenTelemetry()
        .subscribe(newData => {
          if (!this.isLive) this.history = [];
          this.isLive = true;
          this.data = newData;
          this.history = [...this.history, newData];
          this.resetInactivityTimeout();
        });

      this.resetInactivityTimeout();
    }
  }

  private async loadUltimateRecordingSession(): Promise<void> {
    try {
      const recordingData = await this.sessionsService.loadRecordingSession(this.deviceId!);

      if (recordingData?.session && recordingData.data.length > 0) {
        this.history = recordingData.data.map((point: TelemetryDataPoint) => ({
          rpm:        point.rpm,
          water_temp: point.water_temp,
          oil_temp:   point.oil_temp,
          oil_press:  point.oil_press,
          fuel_press: point.fuel_press,
          sonda:      point.sonda,
          gear:       point.gear,
          timestamp:  new Date(point.timestamp).getTime(),
        }));

        if (this.history.length > 0) {
          this.data   = this.history[this.history.length - 1];
          this.isLive = true;
        }
      }
    } catch (error) {
      console.error('[DASHBOARD-ULTIMATE] Error loading recording session:', error);
    }
  }

  private resetInactivityTimeout(): void {
    if (this.inactivityTimeout) clearTimeout(this.inactivityTimeout);

    this.inactivityTimeout = setTimeout(async () => {
      this.isLive = false;

      if (this.plan === 'ultimate' && this.deviceId) {
        await this.sessionsService.completeRecordingSession(this.deviceId);
      }
    }, 3_000);
  }

  ngOnDestroy() {
    this.telemetrySub?.unsubscribe();
    this.deviceSub?.unsubscribe();
    this.historicalSub?.unsubscribe();
    if (this.inactivityTimeout) clearTimeout(this.inactivityTimeout);
  }
}
