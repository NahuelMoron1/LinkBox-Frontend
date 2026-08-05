import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

export type ConnectionStatus = 'connected' | 'disconnected';

@Injectable({
  providedIn: 'root',
})
export class TelemetryService {
  private socket: Socket;

  // El backend corre con restart:always/Restart=always y socket.io-client
  // reconecta solo — esto solo expone ese estado para que la UI muestre
  // "reconectando…" en vez de quedar en blanco. Ver
  // PLAN_LinkBox_Dashboard_Only.md sección 1.3.
  private connectionStatus$ = new BehaviorSubject<ConnectionStatus>('disconnected');
  connectionStatus = this.connectionStatus$.asObservable();

  constructor() {
    this.socket = io(environment.endpoint);
    this.socket.on('connect', () => this.connectionStatus$.next('connected'));
    this.socket.on('disconnect', () => this.connectionStatus$.next('disconnected'));
  }

  getSocket(): Socket { return this.socket; }

  listenTelemetry(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('liveTelemetry', (data: any) => {
        subscriber.next(data);
      });
    });
  }
}
