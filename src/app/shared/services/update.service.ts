import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { TelemetryService } from './telemetry.service';

export interface UpdateCheckResult {
  available: boolean;
  version: string | null;
}

export type UpdateStep =
  | 'downloading' | 'validating' | 'frontend'
  | 'compiling'  | 'restarting' | 'done'
  | `error:${string}`;

@Injectable({ providedIn: 'root' })
export class UpdateService {
  private apiUrl = `${environment.endpoint}/api/update`;

  private progress$ = new Subject<UpdateStep>();
  private complete$ = new Subject<{ success: boolean }>();

  progress = this.progress$.asObservable();
  complete = this.complete$.asObservable();

  constructor(
    private http: HttpClient,
    telemetry: TelemetryService,
  ) {
    const socket = telemetry.getSocket();
    socket.on('update:progress', ({ step }: { step: UpdateStep }) => this.progress$.next(step));
    socket.on('update:complete', (d: { success: boolean }) => this.complete$.next(d));
  }

  check(): Promise<UpdateCheckResult> {
    return firstValueFrom(this.http.post<UpdateCheckResult>(`${this.apiUrl}/check`, {}));
  }

  install(): void {
    this.http.post(`${this.apiUrl}/install`, {}).subscribe();
  }
}
