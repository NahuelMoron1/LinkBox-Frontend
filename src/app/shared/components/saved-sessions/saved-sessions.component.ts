import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AlertService } from '../../services/alert.service';
import {
  SessionDataResponse,
  SessionInfo,
  SessionsService,
} from '../../services/sessions.service';

@Component({
  selector: 'app-saved-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './saved-sessions.component.html',
  styleUrl: './saved-sessions.component.css',
})
export class SavedSessionsComponent implements OnInit, OnDestroy {
  sessions: SessionInfo[] = [];
  selectedSession: SessionInfo | null = null;
  sessionData: SessionDataResponse | null = null;
  isLoading = false;
  searchQuery = '';
  key: string | null = null; /// --> TO DO

  private sessionsSub?: Subscription;

  constructor(
    private sessionsService: SessionsService,
    private alertService: AlertService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadSessions();
    this.sessionsSub = this.sessionsService.sessions$.subscribe((sessions) => {
      this.sessions = sessions;
    });
  }

  ngOnDestroy(): void {
    this.sessionsSub?.unsubscribe();
  }

  loadSessions(): void {
    this.isLoading = true;
    this.sessionsService.loadSessions();
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  selectSession(session: SessionInfo): void {
    this.selectedSession = session;
    this.loadSessionData(session.id);
  }

  loadSessionData(sessionId: string): void {
    this.alertService.loadingWithSpinner('Loading session data...');

    this.sessionsService.getSessionData(sessionId).subscribe({
      next: (data) => {
        this.alertService.close();
        this.sessionData = data;
        this.sessionsService.setCurrentSession(this.selectedSession!);
      },
      error: (error) => {
        this.alertService.close();
        this.alertService.error('Error', 'Failed to load session data');
        console.error(error);
      },
    });
  }

  deleteSession(session: SessionInfo): void {
    this.alertService
      .confirm(
        'Delete Session?',
        `Are you sure you want to delete "${session.session_name}"?`,
        'Delete',
        'Cancel',
      )
      .then((confirmed) => {
        if (confirmed) {
          this.performDelete(session.id);
        }
      });
  }

  private performDelete(sessionId: string): void {
    this.alertService.loadingWithSpinner('Deleting session...');

    this.sessionsService.deleteSession(sessionId).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success(
          'Session Deleted',
          'Session has been permanently deleted',
        );
        this.loadSessions();
        this.selectedSession = null;
        this.sessionData = null;
      },
      error: (error) => {
        this.alertService.close();
        this.alertService.error('Error', 'Failed to delete session');
        console.error(error);
      },
    });
  }

  exportSession(): void {
    if (!this.sessionData) return;

    const dataStr = JSON.stringify(this.sessionData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.selectedSession?.session_name || 'session'}.json`;
    link.click();
    URL.revokeObjectURL(url);

    this.alertService.success('Exported', 'Session data exported successfully');
  }

  getFilteredSessions(): SessionInfo[] {
    if (!this.searchQuery.trim()) {
      return this.sessions;
    }

    return this.sessions.filter(
      (s) =>
        s.session_name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(this.searchQuery.toLowerCase()),
    );
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  getSessionDuration(session: SessionInfo): string {
    if (!session.end_time) return 'Recording...';
    const start = new Date(session.start_time);
    const end = new Date(session.end_time);
    const diff = end.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  backToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
