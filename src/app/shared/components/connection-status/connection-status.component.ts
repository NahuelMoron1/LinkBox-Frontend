import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConnectionStatus, TelemetryService } from '../../services/telemetry.service';

@Component({
  selector: 'app-connection-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './connection-status.component.html',
  styleUrl: './connection-status.component.css',
})
export class ConnectionStatusComponent implements OnInit, OnDestroy {
  status: ConnectionStatus = 'connected';

  private sub?: Subscription;

  constructor(private telemetry: TelemetryService) {}

  ngOnInit(): void {
    this.sub = this.telemetry.connectionStatus.subscribe((status) => (this.status = status));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
