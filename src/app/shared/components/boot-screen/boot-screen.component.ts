import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-boot-screen',
  templateUrl: './boot-screen.component.html',
  styleUrl: './boot-screen.component.css',
})
export class BootScreenComponent implements OnInit, OnChanges {
  @Input() mode: 'boot' | 'checking' = 'boot';
  @Input() finished = false;
  @Output() done = new EventEmitter<void>();

  fadingOut = false;

  ngOnInit(): void {
    if (this.mode === 'boot') {
      setTimeout(() => { this.fadingOut = true; }, 3600);
      setTimeout(() => { this.done.emit(); }, 4300);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.mode === 'checking' && changes['finished'] && this.finished) {
      this.fadingOut = true;
      setTimeout(() => { this.done.emit(); }, 700);
    }
  }
}
