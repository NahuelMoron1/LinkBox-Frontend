import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { TelemetryService } from './telemetry.service';

export interface UpdateInfo { version: string; }
export type UpdateStep =
  | 'downloading' | 'validating' | 'frontend'
  | 'compiling'  | 'restarting' | 'done'
  | `error:${string}`;

@Injectable({ providedIn: 'root' })
export class UpdateService {
  private available$ = new Subject<UpdateInfo>();
  private progress$  = new Subject<UpdateStep>();
  private complete$  = new Subject<{ success: boolean }>();

  available = this.available$.asObservable();
  progress  = this.progress$.asObservable();
  complete  = this.complete$.asObservable();

  constructor(telemetry: TelemetryService) {
    const socket = telemetry.getSocket();
    socket.on('update:available', (info: UpdateInfo)          => this.available$.next(info));
    socket.on('update:progress',  ({ step }: { step: UpdateStep }) => this.progress$.next(step));
    socket.on('update:complete',  (d: { success: boolean })   => this.complete$.next(d));
  }

  approve(): void { fetch('/api/update/approve', { method: 'POST' }); }
  reject():  void { fetch('/api/update/reject',  { method: 'POST' }); }
}
