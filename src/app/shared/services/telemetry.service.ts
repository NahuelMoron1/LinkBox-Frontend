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
    this.socket = io(environment.endpoint, { withCredentials: true });
  }

  joinRoom(key: string) {
    this.socket.emit('joinRoom', key);
  }

  listenTelemetry(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('liveTelemetry', (data: any) => {
        subscriber.next(data);
      });
    });
  }
}
