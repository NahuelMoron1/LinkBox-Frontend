import { Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { UpdateService, UpdateStep } from '../../services/update.service';

type Phase = 'hidden' | 'installing';

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
  @Output() complete = new EventEmitter<boolean>();

  phase: Phase = 'hidden';
  currentStep: UpdateStep | null = null;
  stepOrder = STEP_ORDER;
  stepLabels = STEP_LABELS;

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
      this.update.complete.subscribe(({ success }) => {
        this.phase = 'hidden';
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
