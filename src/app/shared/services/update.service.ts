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
  | 'downloading' | 'starting_candidate' | 'healthcheck'
  | 'swapping' | 'verifying' | 'rolling_back' | 'done'
  | `error:${string}`;

export interface UpdateCompleteResult {
  success: boolean;
  error?: string | null;
}

@Injectable({ providedIn: 'root' })
export class UpdateService {
  private apiUrl = `${environment.endpoint}/api/update`;

  private progress$ = new Subject<UpdateStep>();
  private complete$ = new Subject<UpdateCompleteResult>();

  progress = this.progress$.asObservable();
  complete = this.complete$.asObservable();

  constructor(
    private http: HttpClient,
    telemetry: TelemetryService,
  ) {
    const socket = telemetry.getSocket();
    socket.on('update:progress', ({ step }: { step: UpdateStep }) => this.progress$.next(step));
    socket.on('update:complete', (d: UpdateCompleteResult) => this.complete$.next(d));
  }

  check(): Promise<UpdateCheckResult> {
    return firstValueFrom(this.http.post<UpdateCheckResult>(`${this.apiUrl}/check`, {}));
  }

  install(): void {
    this.http.post(`${this.apiUrl}/install`, {}).subscribe();
  }
}
