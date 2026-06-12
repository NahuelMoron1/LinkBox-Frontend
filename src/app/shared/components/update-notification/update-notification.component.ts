import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { UpdateService, UpdateInfo, UpdateStep } from '../../services/update.service';

type Phase = 'hidden' | 'prompt' | 'installing' | 'success' | 'error';

const STEP_LABELS: Record<string, string> = {
  downloading: 'Descargando cambios',
  validating:  'Validando compilación',
  frontend:    'Actualizando interfaz',
  compiling:   'Compilando TypeScript',
  restarting:  'Reiniciando sistema',
  done:        'Listo',
};

const STEP_ORDER = ['downloading', 'validating', 'frontend', 'compiling', 'restarting'];

@Component({
  selector: 'app-update-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './update-notification.component.html',
  styleUrl: './update-notification.component.css',
})
export class UpdateNotificationComponent implements OnInit, OnDestroy {
  phase: Phase = 'hidden';
  version = '';
  currentStep: UpdateStep | null = null;
  stepOrder = STEP_ORDER;
  stepLabels = STEP_LABELS;

  private subs = new Subscription();

  constructor(private update: UpdateService) {}

  ngOnInit(): void {
    this.subs.add(
      this.update.available.subscribe((info: UpdateInfo) => {
        this.version = info.version;
        this.phase = 'prompt';
      })
    );
    this.subs.add(
      this.update.progress.subscribe((step: UpdateStep) => {
        this.currentStep = step;
        this.phase = 'installing';
      })
    );
    this.subs.add(
      this.update.complete.subscribe(({ success }) => {
        this.phase = success ? 'success' : 'error';
        if (success) {
          // Brief "success" screen — then the backend restarts and connection drops
          setTimeout(() => { this.phase = 'hidden'; }, 4000);
        }
      })
    );
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  approve(): void { this.update.approve(); this.phase = 'installing'; }
  dismiss(): void { this.update.reject(); this.phase = 'hidden'; }

  isStepDone(step: string): boolean {
    if (!this.currentStep) return false;
    const currentIdx = STEP_ORDER.indexOf(this.currentStep.split(':')[0]);
    const stepIdx    = STEP_ORDER.indexOf(step);
    return currentIdx > stepIdx;
  }

  isStepActive(step: string): boolean {
    return this.currentStep?.startsWith(step) ?? false;
  }
}
