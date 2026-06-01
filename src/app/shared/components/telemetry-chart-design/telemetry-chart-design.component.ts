import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-telemetry-chart-design',
  imports: [FormsModule, CommonModule],
  templateUrl: './telemetry-chart-design.component.html',
  styleUrl: './telemetry-chart-design.component.css',
})
export class TelemetryChartDesignComponent
  implements OnChanges, AfterViewInit, OnDestroy
{
  @Input() fullData: any[] = [];
  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  metrics = [
    { key: 'rpm',        label: 'ENGINE RPM',  color: '#ff2244', unit: 'RPM', max: 9000 },
    { key: 'water_temp', label: 'WATER TEMP',  color: '#ff6600', unit: '°C',  max: 120  },
    { key: 'oil_temp',   label: 'OIL TEMP',    color: '#00e64d', unit: '°C',  max: 150  },
    { key: 'oil_press',  label: 'OIL PRESS',   color: '#ffcc00', unit: 'PSI', max: 100  },
  ];

  currentIndex = 0;
  private config = { margin: { t: 20, l: 60, r: 20, b: 50 } };

  private xMin = 0;
  private xMax = 100;
  private isPanning = false;
  private lastMouseX = 0;
  private hoverIndex: number | null = null;
  private themeSub?: Subscription;

  constructor(private ngZone: NgZone, private themeService: ThemeService) {}

  ngAfterViewInit() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Re-render whenever the theme changes
    this.themeSub = this.themeService.theme$.subscribe(() => this.render());
  }

  ngOnDestroy() {
    window.removeEventListener('resize', () => this.resize());
    this.themeSub?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['fullData'] && this.fullData.length > 0) {
      if (this.xMax >= this.fullData.length - 2) {
        this.xMax = this.fullData.length;
        this.xMin = Math.max(0, this.xMax - (this.xMax - this.xMin));
      }
      this.render();
    }
  }

  // Returns canvas-draw colors based on the current theme
  private colors() {
    const dark = this.themeService.isDark;
    return {
      gridLine:    dark ? '#1e1e1e'                  : '#e0e0e0',
      axisLabel:   dark ? '#555555'                  : '#999999',
      crosshair:   dark ? 'rgba(255,255,255,0.12)'   : 'rgba(0,0,0,0.15)',
      tooltipVal:  dark ? '#ffffff'                  : '#0a0a0a',
      tooltipTime: dark ? '#888888'                  : '#666666',
    };
  }

  private formatTime(index: number): string {
    const data = this.fullData[Math.floor(index)];
    if (data?.timestamp) {
      return new Date(data.timestamp).toLocaleTimeString([], {
        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
    }
    return '';
  }

  private resize() {
    const canvas = this.canvasRef.nativeElement;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = canvas.clientWidth * dpr;
    canvas.height = 800;
    if (this.fullData.length > 0 && this.xMax === 100) this.resetZoom();
    this.render();
  }

  // --- INTERACTION ---

  handleMouseDown(e: MouseEvent) {
    this.isPanning  = true;
    this.lastMouseX = e.clientX;
  }

  handleMouseUp() { this.isPanning = false; }

  handleMouseMove(e: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const currentX = e.clientX - rect.left;

    if (this.isPanning) {
      const deltaX   = e.clientX - this.lastMouseX;
      this.lastMouseX = e.clientX;
      const scale    = (this.xMax - this.xMin) / rect.width;
      const deltaIdx = deltaX * scale;
      this.xMin -= deltaIdx;
      this.xMax -= deltaIdx;
      this.render();
    } else {
      const plotWidth = rect.width - this.config.margin.l - this.config.margin.r;
      const relativeX = currentX - this.config.margin.l;
      if (relativeX >= 0 && relativeX <= plotWidth) {
        const percent = relativeX / plotWidth;
        this.hoverIndex = Math.round(this.xMin + percent * (this.xMax - this.xMin));
        this.render();
      }
    }
  }

  handleMouseWheel(e: WheelEvent) {
    e.preventDefault();
    const factor    = 0.01;
    const direction = e.deltaY > 0 ? 1 : -1;
    const range     = this.xMax - this.xMin;
    this.xMin += range * factor * direction;
    this.xMax -= range * factor * direction;
    this.render();
  }

  handleMouseLeave() {
    this.isPanning  = false;
    this.hoverIndex = null;
    this.render();
  }

  resetZoom() {
    this.xMin = 0;
    this.xMax = this.fullData.length;
    this.render();
  }

  private render() {
    this.ngZone.runOutsideAngular(() => requestAnimationFrame(() => this.draw()));
  }

  private draw() {
    const canvas = this.canvasRef.nativeElement;
    const ctx    = canvas.getContext('2d');
    if (!ctx || this.fullData.length < 2) return;

    const dpr    = window.devicePixelRatio || 1;
    const w      = canvas.width / dpr;
    const h      = canvas.height / dpr;
    const { l, r, t, b } = this.config.margin;
    const plotW  = w - l - r;
    const plotH  = h - t - b;
    const c      = this.colors();
    const metric = this.metrics[this.currentIndex];

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    // 1. Grid lines + Y-axis labels
    ctx.strokeStyle = c.gridLine;
    ctx.lineWidth   = 1;
    ctx.fillStyle   = c.axisLabel;
    ctx.font        = '10px "JetBrains Mono", monospace';
    ctx.textAlign   = 'right';

    for (let i = 0; i <= 4; i++) {
      const val = Math.round((metric.max / 4) * i);
      const y   = h - b - i * (plotH / 4);
      ctx.beginPath();
      ctx.moveTo(l, y);
      ctx.lineTo(w - r, y);
      ctx.stroke();
      ctx.fillText(val.toString(), l - 10, y + 3);
    }

    // 2. Data line
    ctx.beginPath();
    ctx.strokeStyle = metric.color;
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';

    for (let i = 0; i < this.fullData.length; i++) {
      const x   = l + ((i - this.xMin) / (this.xMax - this.xMin)) * plotW;
      const val = this.fullData[i][metric.key] || 0;
      const y   = h - b - (val / metric.max) * plotH;

      if (x < l - 10 || x > w - r + 10) {
        if (i !== 0) ctx.moveTo(x, y);
        continue;
      }
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 3. X-axis time labels
    ctx.fillStyle = c.axisLabel;
    ctx.textAlign = 'center';
    const numTicks = 5;
    for (let i = 0; i < numTicks; i++) {
      const tickIdx = this.xMin + (i / (numTicks - 1)) * (this.xMax - this.xMin);
      const x       = l + (i / (numTicks - 1)) * plotW;
      if (tickIdx >= 0 && tickIdx < this.fullData.length) {
        ctx.fillText(this.formatTime(tickIdx), x, h - 10);
      }
    }

    // 4. Hover tooltip
    if (this.hoverIndex !== null) {
      const dataPoint = this.fullData[this.hoverIndex];
      if (dataPoint) {
        const x   = l + ((this.hoverIndex - this.xMin) / (this.xMax - this.xMin)) * plotW;
        const val = dataPoint[metric.key] || 0;
        const y   = h - b - (val / metric.max) * plotH;

        // Crosshair line
        ctx.strokeStyle = c.crosshair;
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(x, t);
        ctx.lineTo(x, h - b);
        ctx.stroke();

        // Dot on line
        ctx.fillStyle = metric.color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Value label
        ctx.fillStyle = c.tooltipVal;
        ctx.font      = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${val} ${metric.unit}`, x + 10, y - 20);

        // Time label
        ctx.fillStyle = c.tooltipTime;
        ctx.font      = '10px "JetBrains Mono", monospace';
        ctx.fillText(this.formatTime(this.hoverIndex), x + 10, y - 5);
      }
    }
  }

  nextMetric() {
    this.currentIndex = (this.currentIndex + 1) % this.metrics.length;
    this.render();
  }

  prevMetric() {
    this.currentIndex = (this.currentIndex - 1 + this.metrics.length) % this.metrics.length;
    this.render();
  }

  get hasData(): boolean {
    return this.fullData && this.fullData.length >= 2;
  }
}
