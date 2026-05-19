import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
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
  public data: any = {};
  private telemetrySub?: Subscription;

  public isLive = false;
  public history: any[] = [];

  readonly MAX_RPM = 7000;
  readonly SHIFT_RPM = 6500;

  constructor(private telemetryService: TelemetryService) {}

  ngOnInit() {
    if (this.key) {
      this.telemetryService.joinRoom(this.key);

      this.telemetrySub = this.telemetryService
        .listenTelemetry()
        .subscribe((newData) => {
          this.isLive = true;
          this.data = newData;
          this.history = [...this.history, newData];
          if (this.history.length > 500) this.history.shift();
        });
    }
  }

  ngOnDestroy() {
    this.telemetrySub?.unsubscribe();
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
