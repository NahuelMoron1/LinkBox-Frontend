import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DeviceInfoResponse {
  deviceId: string | null;
  version: string;
  shiftRpm: number;
}

@Injectable({ providedIn: 'root' })
export class DeviceInfoService {
  private apiUrl = `${environment.endpoint}/api/device/info`;

  constructor(private http: HttpClient) {}

  getInfo(): Observable<DeviceInfoResponse> {
    return this.http.get<DeviceInfoResponse>(this.apiUrl);
  }
}
