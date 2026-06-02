import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { SessionDataResponse, SessionInfo } from '../../models/Session';
import { AlertService } from '../../services/alert.service';
import { SessionsService } from '../../services/sessions.service';
import { TelemetryChartDesignComponent } from '../telemetry-chart-design/telemetry-chart-design.component';

@Component({
  selector: 'app-saved-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule, TelemetryChartDesignComponent, TranslatePipe, RouterLink],
  templateUrl: './saved-sessions.component.html',
  styleUrl: './saved-sessions.component.css',
})
export class SavedSessionsComponent implements OnInit, OnDestroy {
  sessions: SessionInfo[] = [];
  selectedSession: SessionInfo | null = null;
  sessionData: SessionDataResponse | null = null;
  isLoading = false;
  searchQuery = '';
  key: string | null = null;

  // Rename state
  isEditingName = false;
  editedName    = '';

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
    setTimeout(() => { this.isLoading = false; }, 1000);
  }

  selectSession(session: SessionInfo): void {
    this.isEditingName = false;
    this.selectedSession = session;
    this.loadSessionData(session.id);
  }

  startEditingName(): void {
    if (!this.selectedSession) return;
    this.editedName    = this.selectedSession.session_name;
    this.isEditingName = true;
    setTimeout(() => {
      (document.querySelector('.name-edit-input') as HTMLInputElement)?.select();
    }, 30);
  }

  saveSessionName(): void {
    if (!this.selectedSession || !this.editedName.trim()) return;
    const newName = this.editedName.trim();
    if (newName === this.selectedSession.session_name) { this.isEditingName = false; return; }

    this.sessionsService.renameSession(this.selectedSession.id, newName).subscribe({
      next: () => {
        this.selectedSession!.session_name = newName;
        const inList = this.sessions.find(s => s.id === this.selectedSession!.id);
        if (inList) inList.session_name = newName;
        this.isEditingName = false;
      },
      error: () => this.alertService.error('Error', 'Failed to rename session'),
    });
  }

  cancelEditingName(): void {
    this.isEditingName = false;
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
      .confirm('Delete Session?', `Are you sure you want to delete "${session.session_name}"?`, 'Delete', 'Cancel')
      .then((confirmed) => { if (confirmed) this.performDelete(session.id); });
  }

  private performDelete(sessionId: string): void {
    this.alertService.loadingWithSpinner('Deleting session...');
    this.sessionsService.deleteSession(sessionId).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success('Session Deleted', 'Session has been permanently deleted');
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
    if (!this.searchQuery.trim()) return this.sessions;
    return this.sessions.filter(
      (s) => s.session_name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
             s.id.toLowerCase().includes(this.searchQuery.toLowerCase()),
    );
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  getSessionDuration(session: SessionInfo): string {
    if (!session.end_time) return 'Recording...';
    const start = new Date(session.start_time);
    const end   = new Date(session.end_time);
    const diff  = end.getTime() - start.getTime();
    return `${Math.floor(diff / 60000)}m ${Math.floor((diff % 60000) / 1000)}s`;
  }

  backToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
