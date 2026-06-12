import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AlertThresholdsService, SensorThresholds, SENSOR_UNIT } from '../../services/alert-thresholds.service';
import { I18nService } from '../../services/i18n.service';
import { TelemetryService } from '../../services/telemetry.service';
import { RpmLedStripComponent } from './sub-components/rpm-led-strip/rpm-led-strip.component';
import { Gt3LayoutComponent } from './sub-components/gt3-layout/gt3-layout.component';
import { ClassicLayoutComponent } from './sub-components/classic-layout/classic-layout.component';
import { AlertThresholdConfigComponent } from './sub-components/alert-threshold-config/alert-threshold-config.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    TranslatePipe,
    RpmLedStripComponent,
    Gt3LayoutComponent,
    ClassicLayoutComponent,
    AlertThresholdConfigComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  public data: any = {};
  private telemetrySub?: Subscription;

  public isLive = false;
  private inactivityTimeout?: ReturnType<typeof setTimeout>;

  readonly MAX_RPM   = 7000;
  readonly SHIFT_RPM = 6500;
  readonly plan      = 'ultimate';

  selectedStyle: 'gt3' | 'classic' = 'gt3';

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

  setStyle(style: 'gt3' | 'classic'): void {
    this.selectedStyle = style;
    localStorage.setItem('linkbox-dashboard-style', style);
  }

  constructor(
    private telemetryService: TelemetryService,
    public alertThresholds: AlertThresholdsService,
    public i18n: I18nService,
  ) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('linkbox-dashboard-style');
    if (saved === 'gt3' || saved === 'classic') this.selectedStyle = saved;

    this.telemetrySub = this.telemetryService
      .listenTelemetry()
      .subscribe((newData) => {
        this.isLive = true;
        this.data = newData;
        this.resetInactivityTimeout();
      });

    this.resetInactivityTimeout();
  }

  private resetInactivityTimeout(): void {
    if (this.inactivityTimeout) clearTimeout(this.inactivityTimeout);
    this.inactivityTimeout = setTimeout(() => {
      this.isLive = false;
    }, 3_000);
  }

  ngOnDestroy(): void {
    this.telemetrySub?.unsubscribe();
    if (this.inactivityTimeout) clearTimeout(this.inactivityTimeout);
  }
}
