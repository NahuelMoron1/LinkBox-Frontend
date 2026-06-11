import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-rpm-led-strip',
  imports: [CommonModule],
  templateUrl: './rpm-led-strip.component.html',
  styleUrl: './rpm-led-strip.component.css',
})
export class RpmLedStripComponent {
  @Input() rpm: number = 0;
  @Input() shiftRpm: number = 6500;

  readonly leds = Array(15);

  getLedColor(index: number): string {
    if (index < 8)  return 'green';
    if (index < 12) return 'red';
    return 'blue';
  }
}
