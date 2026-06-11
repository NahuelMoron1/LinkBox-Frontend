import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { AlertThresholdsService } from '../../../../services/alert-thresholds.service';

@Component({
  selector: 'app-tyre-widget',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './tyre-widget.component.html',
  styleUrl: './tyre-widget.component.css',
})
export class TyreWidgetComponent {
  @Input() data: any = {};
  @Input() plan: 'basic' | 'pro' | 'ultimate' | null = null;
  @Input() editingSensor: string | null = null;
  @Output() configToggle = new EventEmitter<string>();

  constructor(public alertThresholds: AlertThresholdsService) {}

  getSensorStatus(value: number, sensor: string): string {
    return this.alertThresholds.getStatus(value, sensor);
  }

  pressStatus(bar: any, sensor: string): string {
    const psi = bar != null ? (+bar) * 14.504 : null;
    return this.alertThresholds.getStatus(psi, sensor);
  }

  barToPsi(bar: any): number {
    return bar != null ? (+bar) * 14.504 : 0;
  }
}
