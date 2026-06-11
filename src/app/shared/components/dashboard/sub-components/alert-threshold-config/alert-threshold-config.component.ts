import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { AlertService } from '../../../../services/alert.service';
import { SensorThresholds } from '../../../../services/alert-thresholds.service';
import { I18nService } from '../../../../services/i18n.service';

@Component({
  selector: 'app-alert-threshold-config',
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './alert-threshold-config.component.html',
  styleUrl: './alert-threshold-config.component.css',
})
export class AlertThresholdConfigComponent {
  @Input() sensorLabelKey: string = '';
  @Input() sensorUnit: string = '';
  @Input() editValues: SensorThresholds = { cold: 0, warm: 0, optimum: 0, warning: 0, danger: 0 };

  @Output() closed   = new EventEmitter<void>();
  @Output() saved    = new EventEmitter<SensorThresholds>();
  @Output() resetted = new EventEmitter<void>();

  constructor(
    private alertService: AlertService,
    private i18n: I18nService,
  ) {}

  sanitizeInput(field: keyof SensorThresholds, event: Event): void {
    const raw   = (event.target as HTMLInputElement).value;
    const clean = raw.replace(/[^0-9.]/g, '');
    const num   = parseFloat(clean);
    const safe  = isNaN(num) || num < 0 ? 0 : num;
    this.editValues[field] = safe;
    (event.target as HTMLInputElement).value = String(safe);
  }

  onSave(): void {
    const v = this.editValues;
    const ok = (n: number) => typeof n === 'number' && isFinite(n) && n > 0;

    if (!ok(v.cold) || !ok(v.warm) || !ok(v.optimum) || !ok(v.warning) || !ok(v.danger)) {
      this.alertService.error(this.i18n.t('dash.cfg.title'), this.i18n.t('dash.cfg.errNeg'));
      return;
    }

    if (!(v.cold < v.warm && v.warm < v.optimum && v.optimum < v.warning && v.warning < v.danger)) {
      this.alertService.error(this.i18n.t('dash.cfg.title'), this.i18n.t('dash.cfg.errOrder'));
      return;
    }

    this.saved.emit({ ...v });
  }
}
