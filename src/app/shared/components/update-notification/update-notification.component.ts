import { Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { UpdateService, UpdateStep } from '../../services/update.service';

type Phase = 'hidden' | 'installing' | 'error';

const STEP_LABELS: Record<string, string> = {
  downloading:         'Descargando nueva versión',
  starting_candidate:  'Iniciando versión nueva',
  healthcheck:         'Verificando que arrancó bien',
  swapping:            'Aplicando actualización',
  verifying:           'Confirmando versión activa',
  done:                'Listo',
};

const STEP_ORDER = ['downloading', 'starting_candidate', 'healthcheck', 'swapping', 'verifying'];
const ERROR_DISPLAY_MS = 6000;

@Component({
  selector: 'app-update-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './update-notification.component.html',
  styleUrl: './update-notification.component.css',
})
export class UpdateNotificationComponent implements OnInit, OnDestroy {
  @Output() complete = new EventEmitter<boolean>();

  phase: Phase = 'hidden';
  currentStep: UpdateStep | null = null;
  stepOrder = STEP_ORDER;
  stepLabels = STEP_LABELS;
  errorMessage: string | null = null;

  private subs = new Subscription();

  constructor(private update: UpdateService) {}

  ngOnInit(): void {
    this.subs.add(
      this.update.progress.subscribe((step: UpdateStep) => {
        this.currentStep = step;
        this.phase = 'installing';
      })
    );
    this.subs.add(
      this.update.complete.subscribe(({ success, error }) => {
        if (success) {
          this.phase = 'hidden';
        } else {
          this.errorMessage = error || 'No se pudo completar la actualización';
          this.phase = 'error';
          setTimeout(() => {
            this.phase = 'hidden';
            this.errorMessage = null;
          }, ERROR_DISPLAY_MS);
        }
        this.complete.emit(success);
      })
    );
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

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
