import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TelemetryService {
  private socket: Socket;

  constructor() {
    this.socket = io(environment.endpoint);
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
