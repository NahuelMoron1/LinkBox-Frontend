import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastService, ToastType } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css',
})
export class ToastComponent implements OnInit, OnDestroy {
  visible = false;
  message = '';
  type: ToastType = 'success';

  private sub = new Subscription();
  private hideTimeout?: ReturnType<typeof setTimeout>;

  constructor(private toast: ToastService) {}

  ngOnInit(): void {
    this.sub.add(
      this.toast.toast.subscribe(({ message, type }) => {
        this.message = message;
        this.type = type;
        this.visible = true;

        if (this.hideTimeout) clearTimeout(this.hideTimeout);
        this.hideTimeout = setTimeout(() => {
          this.visible = false;
        }, 4000);
      }),
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    if (this.hideTimeout) clearTimeout(this.hideTimeout);
  }
}
