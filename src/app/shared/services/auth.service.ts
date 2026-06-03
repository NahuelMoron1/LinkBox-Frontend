import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { DeviceInfo } from '../models/Device';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private appUrl = environment.endpoint;
  private apiUrl = `${this.appUrl}/api/devices`;

  private deviceSubject = new BehaviorSubject<DeviceInfo | null>(null);
  public device$ = this.deviceSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.loadDeviceFromToken();
  }

  login(device_key: string, password: string): Observable<any> {
    return this.http
      .post(
        this.apiUrl + '/login',
        { key: device_key, password },
        { withCredentials: true },
      )
      .pipe(
        tap((res: any) => {
          // El servidor ya puso las cookies automáticamente
          // Solo actualizar el BehaviorSubject con los datos
          const deviceInfo: DeviceInfo = res.device;
          this.deviceSubject.next(deviceInfo);
          this.router.navigate(['/dashboard']);
        }),
      );
  }

  logout(): void {
    this.http
      .post(this.apiUrl + '/logout', {}, { withCredentials: true })
      .subscribe({
        next: () => {
          // El servidor limpió las cookies
          this.deviceSubject.next(null);
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error('Logout error:', err);
          // Limpiar estado local de todas formas
          this.deviceSubject.next(null);
          this.router.navigate(['/login']);
        },
      });
  }

  getToken(): Observable<DeviceInfo> {
    return this.http.get<DeviceInfo>(`${this.apiUrl}/token`, {
      withCredentials: true,
    });
  }

  async getTokenTC(): Promise<DeviceInfo | null> {
    try {
      const deviceInfo = await this.getToken().toPromise();

      if (deviceInfo) {
        this.deviceSubject.next(deviceInfo);
        return deviceInfo;
      }
      return null;
    } catch (error) {
      console.error('Token fetch error:', error);
      return null;
    }
  }

  getDeviceInfo(): DeviceInfo | null {
    return this.deviceSubject.value;
  }

  getDeviceKey(): string | null {
    return this.deviceSubject.value?.id || null;
  }

  async getDeviceInfoFromServer(): Promise<DeviceInfo | null> {
    try {
      const info = await this.getToken().toPromise();
      if (info) {
        this.deviceSubject.next(info);
        return info;
      }
      return null;
    } catch (error) {
      console.error('Failed to get device info from server:', error);
      return null;
    }
  }

  getDeviceId(): string | null {
    return this.deviceSubject.value?.id || null;
  }

  getPlan(): 'basic' | 'pro' | 'ultimate' | null {
    return this.deviceSubject.value?.plan || null;
  }

  getSubscriptionStatus(): 'inactive' | 'active' | 'suspended' | 'expired' | null {
    return this.deviceSubject.value?.subscriptionStatus || null;
  }

  // ========== SUBSCRIPTION & SESSION ==========
  isSubscriptionInactive(): boolean {
    return this.deviceSubject.value?.subscriptionStatus === 'inactive';
  }

  isSubscriptionExpired(): boolean {
    const info = this.deviceSubject.value;
    if (!info?.subscriptionEndDate) return false;
    return new Date(info.subscriptionEndDate) < new Date();
  }

  hasActivePlan(): boolean {
    return this.deviceSubject.value?.subscriptionStatus === 'active';
  }

  updateSessionsCount(count: number): void {
    // Actualizar en el BehaviorSubject
    const current = this.deviceSubject.value;
    if (current) {
      current.sessionsSavedThisMonth = count;
      this.deviceSubject.next(current);
    }
  }

  // ========== PRIVATE METHODS ==========
  /**
   * Al inicializar, intentar cargar la sesión del servidor
   * Si el JWT existe en cookies httpOnly, el servidor responderá con los datos
   */
  private async loadDeviceFromToken(): Promise<void> {
    await this.getTokenTC().catch(() => {
      // No hay sesión activa, usuario debe hacer login
    });
  }

  /**
   * Verificar si hay sesión activa llamando al servidor
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const info = await this.getToken().toPromise();
      return !!info;
    } catch (error) {
      return false;
    }
  }
}
