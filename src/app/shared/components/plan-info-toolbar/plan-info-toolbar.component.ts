import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DeviceInfo, PlanInfo } from '../../models/Device';
import { AlertService } from '../../services/alert.service';
import { SessionsService } from '../../services/sessions.service';

@Component({
  selector: 'app-plan-info-toolbar',
  imports: [FormsModule, CommonModule],
  templateUrl: './plan-info-toolbar.component.html',
  styleUrl: './plan-info-toolbar.component.css',
})
export class PlanInfoToolbarComponent {
  @Input() deviceInfo: DeviceInfo | null = null;
  @Input() planInfo: PlanInfo | null = null;
  @Input() key: string | null = null;
  private sessionsService: SessionsService;
  private alertService: AlertService;

  constructor(
    sessionsService: SessionsService,
    alertService: AlertService,
    private router: Router,
  ) {
    this.sessionsService = sessionsService;
    this.alertService = alertService;
  }

  canSaveSession(): boolean {
    return this.sessionsService.canSaveSession();
  }

  /**
   * Get session save button text and color
   */
  getSaveSessionButtonInfo(): {
    text: string;
    color: string;
    disabled: boolean;
  } {
    const plan = this.deviceInfo?.plan;
    if (!plan || plan === 'basic') {
      return {
        text: 'Upgrade to Save',
        color: 'bg-blue-500 hover:bg-blue-600',
        disabled: !plan ? true : false,
      };
    }

    if (plan === 'pro') {
      const remaining = this.planInfo?.features.sessionsRemaining || 0;

      return {
        text: `Save Session (${remaining}/2)`,
        color:
          remaining > 0
            ? 'bg-green-500 hover:bg-green-600'
            : 'bg-gray-400 cursor-not-allowed',
        disabled: remaining === 0,
      };
    }

    return {
      text: 'Save Session (Unlimited)',
      color: 'bg-purple-500 hover:bg-purple-600',
      disabled: false,
    };
  }

  /**
   * Handle save session button click
   */
  onSaveSession(): void {
    const plan = this.deviceInfo?.plan;

    // Basic users get upgrade prompt
    if (plan === 'basic') {
      this.alertService.upgradePrompt('Basic', 'Pro', 20).then((upgrade) => {
        if (upgrade) {
          // Navigate to upgrade or show upgrade info
        }
      });
      return;
    }

    // Pro users check limit
    if (plan === 'pro') {
      const remaining = this.planInfo?.features.sessionsRemaining || 0;
      if (remaining === 0) {
        const resetDate = new Date();
        resetDate.setDate(resetDate.getDate() + 30);
        this.alertService
          .proLimitReached(
            this.planInfo?.features.sessionsSaved || 0,
            2,
            resetDate,
          )
          .then((upgrade) => {
            if (upgrade) {
            }
          });
        return;
      }
    }

    // Show input dialog for session name
    this.showSaveSessionDialog();
  }

  /**
   * Show dialog to enter session name and save
   */
  private showSaveSessionDialog(): void {
    this.alertService
      .info('Save Session', 'Enter a name for this session')
      .then(() => {
        // For now, use a simple prompt - in production, use a custom dialog component
        const name = prompt(
          'Enter session name:',
          `Session - ${new Date().toLocaleTimeString()}`,
        );
        if (name) {
          this.saveSession(name);
        }
      });
  }

  /**
   * Save the session to database
   */
  private saveSession(sessionName: string): void {
    this.alertService.loadingWithSpinner('Saving session...');

    this.sessionsService.saveSession(sessionName).subscribe({
      next: (response) => {
        this.alertService.close();
        this.alertService.sessionSaved(
          response.session.name,
          response.session.totalRecords,
        );
        this.sessionsService.loadSessions();
        this.sessionsService.loadPlanInfo(this.key);
      },
      error: (error) => {
        this.alertService.close();
        const message = error.error?.message || 'Failed to save session';
        const code = error.error?.code;

        if (code === 'SESSIONS_LIMIT_REACHED') {
          const resetDate = new Date();
          resetDate.setDate(resetDate.getDate() + 30);
          this.alertService.proLimitReached(2, 2, resetDate);
        } else if (code === 'PLAN_UPGRADE_REQUIRED') {
          this.alertService.upgradePrompt(
            this.deviceInfo?.plan || 'Basic',
            'Pro',
            20,
          );
        } else {
          this.alertService.error('Error', message);
        }
      },
    });
  }

  /**
   * View saved sessions
   */
  onViewSessions(): void {
    if (!this.canSaveSession()) {
      this.alertService.upgradePrompt('Basic', 'Pro', 20);
      return;
    }

    this.sessionsService.loadSessions();
    this.router.navigate(['/sessions']);
  }

  /**
   * Show upgrade plan modal
   */
  onUpgrade(): void {
    this.alertService.planComparison();
  }
}
