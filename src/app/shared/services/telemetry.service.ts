import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class TelemetryService {
  private socket: Socket;

  constructor() {
    // Nos conectamos al servidor de Sockets
    this.socket = io('http://localhost:3000');
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
