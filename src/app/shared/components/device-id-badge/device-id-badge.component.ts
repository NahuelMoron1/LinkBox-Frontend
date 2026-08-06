import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceInfoService } from '../../services/device-info.service';

@Component({
  selector: 'app-device-id-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './device-id-badge.component.html',
  styleUrl: './device-id-badge.component.css',
})
export class DeviceIdBadgeComponent implements OnInit {
  deviceId: string | null = null;

  constructor(private deviceInfo: DeviceInfoService) {}

  ngOnInit(): void {
    this.deviceInfo.getInfo().subscribe({
      next: (info) => (this.deviceId = info.deviceId),
      error: () => (this.deviceId = null),
    });
  }

  get shortId(): string {
    return this.deviceId ? this.deviceId.slice(0, 8) : '';
  }
}
