import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PlanInfo } from '../models/Device';
import { SessionDataResponse, SessionInfo } from '../models/Session';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class SessionsService {
  private appUrl = environment.endpoint;
  private apiUrl = `${this.appUrl}/api/devices`;

  private readonly httpOptions = { withCredentials: true };

  private sessionsSubject = new BehaviorSubject<SessionInfo[]>([]);
  public sessions$ = this.sessionsSubject.asObservable();

  private currentSessionSubject = new BehaviorSubject<SessionInfo | null>(null);
  public currentSession$ = this.currentSessionSubject.asObservable();

  private planInfoSubject = new BehaviorSubject<PlanInfo | null>(null);
  public planInfo$ = this.planInfoSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  getSessions(): Observable<any> {
    const deviceId = this.authService.getDeviceId();
    if (!deviceId) throw new Error('Device ID not found');

    return this.http.get<any>(
      `${this.apiUrl}/${deviceId}/sessions`,
      this.httpOptions,
    );
  }

  loadSessions(): void {
    const deviceId = this.authService.getDeviceId();
    if (!deviceId) return;

    this.getSessions().subscribe({
      next: (response) => {
        this.sessionsSubject.next(response.sessions || []);
      },
      error: (error) => {
        console.error('Error loading sessions:', error);
        this.sessionsSubject.next([]);
      },
    });
  }

  getSessionData(sessionId: string): Observable<SessionDataResponse> {
    const deviceId = this.authService.getDeviceId();
    if (!deviceId) throw new Error('Device ID not found');

    return this.http.get<SessionDataResponse>(
      `${this.apiUrl}/sessions/${sessionId}/data`,
      this.httpOptions,
    );
  }

  saveSession(sessionName: string): Observable<any> {
    const deviceId = this.authService.getDeviceId();
    if (!deviceId) throw new Error('Device ID not found');

    return this.http.post<any>(
      `${this.apiUrl}/${deviceId}/sessions/save`,
      { sessionName },
      this.httpOptions,
    );
  }

  renameSession(sessionId: string, name: string): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/sessions/${sessionId}/rename`,
      { name },
      this.httpOptions,
    );
  }

  deleteSession(sessionId: string): Observable<any> {
    const deviceId = this.authService.getDeviceId();
    if (!deviceId) throw new Error('Device ID not found');

    return this.http.delete<any>(
      `${this.apiUrl}/sessions/${sessionId}`,
      this.httpOptions,
    );
  }

  getPlanInfo(): Observable<PlanInfo> {
    const deviceId = this.authService.getDeviceId();
    if (!deviceId) throw new Error('Device ID not found');

    return this.http.get<PlanInfo>(
      `${this.apiUrl}/${deviceId}/plan-info`,
      this.httpOptions,
    );
  }

  loadPlanInfo(): void {
    const deviceId = this.authService.getDeviceId();
    if (!deviceId) return;

    this.getPlanInfo().subscribe({
      next: (info) => {
        this.planInfoSubject.next(info);
      },
      error: (error) => {
        console.error('Error loading plan info:', error);
      },
    });
  }

  setCurrentSession(session: SessionInfo): void {
    this.currentSessionSubject.next(session);
  }

  getCurrentSession(): SessionInfo | null {
    return this.currentSessionSubject.value;
  }

  canSaveSession(): boolean {
    const plan = this.authService.getPlan();
    return plan === 'pro' || plan === 'ultimate';
  }

  getRemainingProSaves(): number {
    const planInfo = this.planInfoSubject.value;
    if (!planInfo || planInfo.plan !== 'pro') return 0;
    return planInfo.features.sessionsRemaining || 0;
  }

  isSubscriptionExpired(): boolean {
    const status = this.authService.getSubscriptionStatus();
    return status === 'expired';
  }

  refreshAll(): void {
    this.loadSessions();
    this.loadPlanInfo();
  }

  getRecordingSession(
    deviceId: string,
  ): Observable<{ session: any; data: any[] }> {
    return this.http.get<{ session: any; data: any[] }>(
      `${this.apiUrl}/${deviceId}/recording-session`,
      this.httpOptions,
    );
  }

  async loadRecordingSession(deviceId: string): Promise<{
    session: any;
    data: any[];
  } | null> {
    try {
      const result = await this.getRecordingSession(deviceId).toPromise();
      if (result?.session) {
        this.currentSessionSubject.next(result.session);
      }
      return result || null;
    } catch (error) {
      console.error('Failed to load recording session:', error);
      return null;
    }
  }

  async completeRecordingSession(deviceId: string): Promise<boolean> {
    try {
      await this.http
        .post(
          `${this.apiUrl}/${deviceId}/recording-session/complete`,
          {},
          this.httpOptions,
        )
        .toPromise();
      return true;
    } catch (error) {
      console.error('Failed to complete recording session:', error);
      return false;
    }
  }
}
