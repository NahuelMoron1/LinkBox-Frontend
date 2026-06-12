import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-boot-screen',
  templateUrl: './boot-screen.component.html',
  styleUrl: './boot-screen.component.css',
})
export class BootScreenComponent implements OnInit {
  @Output() done = new EventEmitter<void>();

  fadingOut = false;

  ngOnInit(): void {
    setTimeout(() => { this.fadingOut = true; }, 3600);
    setTimeout(() => { this.done.emit(); }, 4300);
  }
}
