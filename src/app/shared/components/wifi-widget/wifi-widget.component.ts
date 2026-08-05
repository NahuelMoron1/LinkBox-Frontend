import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NetworkService, NetworkStatus, WifiNetwork } from '../../services/network.service';

@Component({
  selector: 'app-wifi-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wifi-widget.component.html',
  styleUrl: './wifi-widget.component.css',
})
export class WifiWidgetComponent implements OnInit {
  @Output() checkUpdates = new EventEmitter<void>();

  open = false;
  status: NetworkStatus = { connected: false, ssid: null };
  networks: WifiNetwork[] = [];
  scanning = false;

  selected: WifiNetwork | null = null;
  password = '';
  connecting = false;
  connectError: string | null = null;

  constructor(private network: NetworkService) {}

  ngOnInit(): void {
    this.refreshStatus();
  }

  togglePanel(): void {
    this.open = !this.open;
    if (this.open) {
      this.refreshStatus();
      this.scan();
    } else {
      this.cancelSelection();
    }
  }

  refreshStatus(): void {
    this.network.getStatus().subscribe((status) => (this.status = status));
  }

  scan(): void {
    this.scanning = true;
    this.network.scan().subscribe({
      next: ({ networks }) => {
        this.networks = networks;
        this.scanning = false;
      },
      error: () => {
        this.scanning = false;
      },
    });
  }

  selectNetwork(net: WifiNetwork): void {
    this.selected = net;
    this.password = '';
    this.connectError = null;
  }

  cancelSelection(): void {
    this.selected = null;
    this.password = '';
    this.connectError = null;
  }

  connect(): void {
    if (!this.selected) return;

    this.connecting = true;
    this.connectError = null;

    this.network.connect(this.selected.ssid, this.password || undefined).subscribe({
      next: () => {
        this.connecting = false;
        this.cancelSelection();
        this.refreshStatus();
        this.scan();
      },
      error: () => {
        this.connecting = false;
        this.connectError = 'No se pudo conectar. Verificá la contraseña.';
      },
    });
  }

  onCheckUpdates(): void {
    this.open = false;
    this.checkUpdates.emit();
  }

  signalBars(signal: number): number {
    if (signal >= 75) return 4;
    if (signal >= 50) return 3;
    if (signal >= 25) return 2;
    return 1;
  }
}
