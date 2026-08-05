import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NetworkStatus {
  connected: boolean;
  ssid: string | null;
}

export interface WifiNetwork {
  ssid: string;
  signal: number;
  secured: boolean;
}

export interface WifiScanResult {
  networks: WifiNetwork[];
}

export interface WifiConnectResult {
  message: string;
  ssid?: string;
}

@Injectable({ providedIn: 'root' })
export class NetworkService {
  private apiUrl = `${environment.endpoint}/api/network`;

  constructor(private http: HttpClient) {}

  getStatus(): Observable<NetworkStatus> {
    return this.http.get<NetworkStatus>(`${this.apiUrl}/status`);
  }

  scan(): Observable<WifiScanResult> {
    return this.http.get<WifiScanResult>(`${this.apiUrl}/scan`);
  }

  connect(ssid: string, password?: string): Observable<WifiConnectResult> {
    return this.http.post<WifiConnectResult>(`${this.apiUrl}/connect`, { ssid, password });
  }
}
