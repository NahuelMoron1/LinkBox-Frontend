import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { DeviceInfo, PlanInfo } from '../../models/Device';
import { AlertService } from '../../services/alert.service';
import { I18nService } from '../../services/i18n.service';
import { SessionsService } from '../../services/sessions.service';

@Component({
  selector: 'app-plan-info-toolbar',
  imports: [FormsModule, CommonModule, TranslatePipe],
  templateUrl: './plan-info-toolbar.component.html',
  styleUrl: './plan-info-toolbar.component.css',
})
export class PlanInfoToolbarComponent {
  @Input() deviceInfo: DeviceInfo | null = null;
  @Input() planInfo: PlanInfo | null = null;
  @Input() key: string | null = null;

  constructor(
    private sessionsService: SessionsService,
    private alertService: AlertService,
    private router: Router,
    private i18n: I18nService,
  ) {}

  canSaveSession(): boolean {
    return this.sessionsService.canSaveSession();
  }

  getSaveSessionButtonInfo(): { text: string; color: string; disabled: boolean } {
    const plan = this.deviceInfo?.plan;
    if (!plan || plan === 'basic') {
      return { text: this.i18n.t('toolbar.saveUpgrade'), color: '', disabled: !plan };
    }
    if (plan === 'pro') {
      const remaining = this.planInfo?.features.sessionsRemaining || 0;
      return {
        text: `${this.i18n.t('toolbar.save')} (${remaining}/2)`,
        color: remaining > 0 ? '' : 'disabled',
        disabled: remaining === 0,
      };
    }
    return { text: this.i18n.t('toolbar.saveUnlimited'), color: '', disabled: false };
  }

  onSaveSession(): void {
    const plan = this.deviceInfo?.plan;
    if (plan === 'basic') {
      this.alertService.upgradePrompt('Basic', 'Pro', 20).then((upgrade) => {
        if (upgrade) console.log('User wants to upgrade to Pro');
      });
      return;
    }
    if (plan === 'pro') {
      const remaining = this.planInfo?.features.sessionsRemaining || 0;
      if (remaining === 0) {
        const resetDate = new Date();
        resetDate.setDate(resetDate.getDate() + 30);
        this.alertService.proLimitReached(this.planInfo?.features.sessionsSaved || 0, 2, resetDate)
          .then((upgrade) => { if (upgrade) console.log('User wants to upgrade to Ultimate'); });
        return;
      }
    }
    this.showSaveSessionDialog();
  }

  private showSaveSessionDialog(): void {
    this.alertService.info('Save Session', 'Enter a name for this session').then(() => {
      const name = prompt('Enter session name:', `Session - ${new Date().toLocaleTimeString()}`);
      if (name) this.saveSession(name);
    });
  }

  private saveSession(sessionName: string): void {
    this.alertService.loadingWithSpinner('Saving session...');
    this.sessionsService.saveSession(sessionName).subscribe({
      next: (response) => {
        this.alertService.close();
        this.alertService.sessionSaved(response.session.name, response.session.totalRecords);
        this.sessionsService.loadSessions();
        this.sessionsService.loadPlanInfo();
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
          this.alertService.upgradePrompt(this.deviceInfo?.plan || 'Basic', 'Pro', 20);
        } else {
          this.alertService.error('Error', message);
        }
      },
    });
  }

  onViewSessions(): void {
    if (!this.canSaveSession()) { this.alertService.upgradePrompt('Basic', 'Pro', 20); return; }
    this.sessionsService.loadSessions();
    this.router.navigate(['/sessions']);
  }

  onUpgrade(): void {
    this.alertService.planComparison();
  }
}
