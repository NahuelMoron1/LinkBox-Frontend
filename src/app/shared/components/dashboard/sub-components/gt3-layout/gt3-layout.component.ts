import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { AlertThresholdsService } from '../../../../services/alert-thresholds.service';
import { TyreWidgetComponent } from '../tyre-widget/tyre-widget.component';

@Component({
  selector: 'app-gt3-layout',
  imports: [CommonModule, TranslatePipe, TyreWidgetComponent],
  templateUrl: './gt3-layout.component.html',
  styleUrl: './gt3-layout.component.css',
})
export class Gt3LayoutComponent {
  @Input() data: any = {};
  @Input() plan: 'basic' | 'pro' | 'ultimate' | null = null;
  @Input() isLive: boolean = false;
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

  pressIsDanger(bar: any, sensor: string): boolean {
    return this.pressStatus(bar, sensor) === 'danger';
  }

  barToPsi(bar: any): number {
    return bar != null ? (+bar) * 14.504 : 0;
  }
}
