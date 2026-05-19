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

  /**
   * Get all saved sessions for the current device
   */
  getSessions(): Observable<any> {
    const deviceId = this.authService.getDeviceId();
    if (!deviceId) {
      throw new Error('Device ID not found');
    }

    return this.http.get<any>(`${this.apiUrl}/${deviceId}/sessions`, {
      params: { key: deviceId },
    });
  }

  /**
   * Load all sessions and update subject
   */
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
    if (!deviceId) {
      throw new Error('Device ID not found');
    }

    return this.http.get<SessionDataResponse>(
      `${this.apiUrl}/sessions/${sessionId}/data`,
      {
        params: { key: deviceId },
      },
    );
  }

  /**
   * Save current session (Pro plan - max 2/month, Ultimate - unlimited)
   */
  saveSession(sessionName: string): Observable<any> {
    const deviceId = this.authService.getDeviceId();
    if (!deviceId) {
      throw new Error('Device ID not found');
    }

    return this.http.post<any>(
      `${this.apiUrl}/${deviceId}/sessions/save`,
      {
        sessionName,
      },
      { params: { key: deviceId } },
    );
  }

  /**
   * Delete a saved session
   */
  deleteSession(sessionId: string): Observable<any> {
    const deviceId = this.authService.getDeviceId();
    if (!deviceId) {
      throw new Error('Device ID not found');
    }
    return this.http.delete<any>(`${this.apiUrl}/sessions/${sessionId}`, {
      params: { key: deviceId },
    });
  }

  /**
   * Get plan information with feature details
   */
  getPlanInfo(key: string | null): Observable<PlanInfo> {
    const deviceId = this.authService.getDeviceId();
    if (!deviceId) {
      throw new Error('Device ID not found');
    }

    return this.http.get<PlanInfo>(`${this.apiUrl}/${deviceId}/plan-info`, {
      params: { key: key || '' },
    });
  }

  /**
   * Load plan info and update subject
   */
  loadPlanInfo(key: string | null): void {
    const deviceId = this.authService.getDeviceId();
    if (!deviceId) return;

    this.getPlanInfo(key).subscribe({
      next: (info) => {
        this.planInfoSubject.next(info);
      },
      error: (error) => {
        console.error('Error loading plan info:', error);
      },
    });
  }

  /**
   * Set current session (for playback/viewing)
   */
  setCurrentSession(session: SessionInfo): void {
    this.currentSessionSubject.next(session);
  }

  /**
   * Get current session being viewed/played
   */
  getCurrentSession(): SessionInfo | null {
    return this.currentSessionSubject.value;
  }

  /**
   * Check if can save session (Pro/Ultimate only)
   */
  canSaveSession(): boolean {
    const plan = this.authService.getPlan();
    return plan === 'pro' || plan === 'ultimate';
  }

  /**
   * Get remaining saves for Pro plan
   */
  getRemainingProSaves(): number {
    const planInfo = this.planInfoSubject.value;
    if (!planInfo || planInfo.plan !== 'pro') return 0;
    return planInfo.features.sessionsRemaining || 0;
  }

  /**
   * Check if subscription is expired
   */
  isSubscriptionExpired(): boolean {
    const status = this.authService.getSubscriptionStatus();
    return status === 'expired';
  }

  /**
   * Refresh all data
   */
  refreshAll(key: string | null): void {
    this.loadSessions();
    this.loadPlanInfo(key);
  }

  /**
   * Get current recording session with all historical telemetry (Ultimate only)
   */
  getRecordingSession(
    deviceId: string,
  ): Observable<{ session: any; data: any[] }> {
    return this.http.get<{ session: any; data: any[] }>(
      `${this.apiUrl}/${deviceId}/recording-session`,
      { withCredentials: true },
    );
  }

  /**
   * Load recording session and its historical data (Ultimate plan)
   */
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

  /**
   * Complete the current recording session (Ultimate only)
   * Called when client detects inactivity
   */
  async completeRecordingSession(deviceId: string): Promise<boolean> {
    try {
      await this.http
        .post(
          `${this.apiUrl}/${deviceId}/recording-session/complete`,
          {},
          { withCredentials: true },
        )
        .toPromise();

      console.log('[SESSION] Recording session completed');
      return true;
    } catch (error) {
      console.error('Failed to complete recording session:', error);
      return false;
    }
  }
}
