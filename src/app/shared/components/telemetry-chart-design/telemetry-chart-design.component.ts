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
import { TranslatePipe } from '../../pipes/translate.pipe';
import { I18nService } from '../../services/i18n.service';
import { ThemeService } from '../../services/theme.service';

interface MultiKey { key: string; color: string; label: string; }

interface ChartMetric {
  key: string;
  labelKey: string;
  color: string;
  unit: string;
  max: number;
  scale?: number;             // multiply raw value before plotting (e.g. bar→PSI)
  multiKeys?: MultiKey[];     // when set, draw one line per entry instead of one
}

@Component({
  selector: 'app-telemetry-chart-design',
  imports: [FormsModule, CommonModule, TranslatePipe],
  templateUrl: './telemetry-chart-design.component.html',
  styleUrl: './telemetry-chart-design.component.css',
})
export class TelemetryChartDesignComponent
  implements OnChanges, AfterViewInit, OnDestroy
{
  @Input() fullData: any[] = [];
  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  metrics: ChartMetric[] = [
    { key: 'rpm',        labelKey: 'tbl.rpm',       color: '#ff2244', unit: 'RPM', max: 9000 },
    { key: 'water_temp', labelKey: 'tbl.water',      color: '#ff6600', unit: '°C',  max: 120  },
    { key: 'oil_temp',   labelKey: 'tbl.oilTemp',    color: '#00e64d', unit: '°C',  max: 150  },
    { key: 'oil_press',  labelKey: 'tbl.oilPress',   color: '#ffcc00', unit: 'PSI', max: 150, scale: 14.504 },
    {
      key: 'tyre_temp', labelKey: 'tbl.tyreTemp', color: '#00aaff', unit: '°C', max: 140,
      multiKeys: [
        { key: 'tyre_temp_fl', color: '#ffcc00', label: 'FL' },
        { key: 'tyre_temp_fr', color: '#00e5f5', label: 'FR' },
        { key: 'tyre_temp_rl', color: '#ff6600', label: 'RL' },
        { key: 'tyre_temp_rr', color: '#ff2244', label: 'RR' },
      ],
    },
    {
      key: 'tyre_press', labelKey: 'tbl.tyrePress', color: '#aa44ff', unit: 'PSI', max: 50, scale: 14.504,
      multiKeys: [
        { key: 'tyre_press_fl', color: '#ffcc00', label: 'FL' },
        { key: 'tyre_press_fr', color: '#00e5f5', label: 'FR' },
        { key: 'tyre_press_rl', color: '#ff6600', label: 'RL' },
        { key: 'tyre_press_rr', color: '#ff2244', label: 'RR' },
      ],
    },
  ];

  currentIndex = 0;
  private config = { margin: { t: 20, l: 60, r: 20, b: 50 } };

  private xMin = 0;
  private xMax = 0;
  private isInitialized = false;
  private hoverIndex: number | null = null;
  private themeSub?: Subscription;
  private langSub?: Subscription;

  // Drag-to-zoom state
  isDragging = false;
  private dragStartPx = 0;   // px dentro del área de plot
  private dragCurrentPx = 0;
  readonly DRAG_THRESHOLD = 5; // px mínimos para considerar que es selección

  constructor(
    private ngZone: NgZone,
    private themeService: ThemeService,
    private i18n: I18nService,
  ) {}

  get currentMetric(): ChartMetric { return this.metrics[this.currentIndex]; }

  get currentMetricLabel(): string {
    return this.i18n.t(this.currentMetric.labelKey);
  }

  get currentMetricMultiKeys(): MultiKey[] | undefined {
    return this.currentMetric.multiKeys;
  }

  ngAfterViewInit() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.themeSub = this.themeService.theme$.subscribe(() => this.render());
    this.langSub  = this.i18n.lang$.subscribe(() => this.render());
  }

  ngOnDestroy() {
    window.removeEventListener('resize', () => this.resize());
    this.themeSub?.unsubscribe();
    this.langSub?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['fullData'] && this.fullData.length > 0) {
      if (!this.isInitialized) {
        this.xMin = 0;
        this.xMax = this.fullData.length;
        this.isInitialized = true;
      } else {
        this.xMax = this.fullData.length;
      }
      this.render();
    }
  }

  private colors() {
    const dark = this.themeService.isDark;
    return {
      gridLine:    dark ? '#1e1e1e'                : '#e0e0e0',
      axisLabel:   dark ? '#555555'                : '#999999',
      crosshair:   dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)',
      tooltipVal:  dark ? '#ffffff'                : '#0a0a0a',
      tooltipTime: dark ? '#888888'                : '#666666',
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
    this.render();
  }

  handleMouseDown(e: MouseEvent) {
    if (e.button !== 0) return; // solo click izquierdo
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const { l } = this.config.margin;
    this.isDragging = true;
    this.dragStartPx   = e.clientX - rect.left - l;
    this.dragCurrentPx = this.dragStartPx;
  }

  handleMouseUp(e: MouseEvent) {
    if (!this.isDragging) return;
    const { l, r } = this.config.margin;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const plotWidth = rect.width - l - r;

    const dragDelta = Math.abs(this.dragCurrentPx - this.dragStartPx);

    if (dragDelta >= this.DRAG_THRESHOLD) {
      const pxA = Math.max(0, Math.min(this.dragStartPx,   plotWidth));
      const pxB = Math.max(0, Math.min(this.dragCurrentPx, plotWidth));
      const lo  = Math.min(pxA, pxB);
      const hi  = Math.max(pxA, pxB);

      const newXMin = this.xMin + (lo / plotWidth) * (this.xMax - this.xMin);
      const newXMax = this.xMin + (hi / plotWidth) * (this.xMax - this.xMin);

      if (newXMax - newXMin >= 2) {
        this.xMin = newXMin;
        this.xMax = newXMax;
      }
    }

    this.isDragging = false;
    this.render();
  }

  handleMouseMove(e: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const { l, r } = this.config.margin;
    const plotWidth = rect.width - l - r;
    const relativeX = e.clientX - rect.left - l;

    if (this.isDragging) {
      this.dragCurrentPx = relativeX;
      this.render(); // redibuja con el rectángulo de selección
      return;
    }

    if (relativeX >= 0 && relativeX <= plotWidth) {
      this.hoverIndex = Math.round(
        this.xMin + (relativeX / plotWidth) * (this.xMax - this.xMin)
      );
      this.render();
    }
  }

  handleMouseWheel(e: WheelEvent) {
    e.preventDefault();
    if (this.fullData.length < 2) return;

    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const { l, r } = this.config.margin;
    const plotWidth = rect.width - l - r;

    const mouseRel = Math.max(0, Math.min(1, (e.clientX - rect.left - l) / plotWidth));
    const range = this.xMax - this.xMin;
    const scaleFactor = e.deltaY < 0 ? 0.95 : 1.05;
    const newRange    = Math.max(10, Math.min(this.fullData.length, range * scaleFactor));
    const pivotIdx = this.xMin + mouseRel * range;
    let newXMin    = pivotIdx - mouseRel * newRange;
    let newXMax    = newXMin + newRange;

    if (newXMin < 0)                       { newXMin = 0; newXMax = newRange; }
    if (newXMax > this.fullData.length)    { newXMax = this.fullData.length; newXMin = Math.max(0, newXMax - newRange); }

    this.xMin = newXMin;
    this.xMax = newXMax;
    this.render();
  }

  handleMouseLeave() { this.isDragging = false; this.hoverIndex = null; this.render(); }

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
    const metric = this.currentMetric;
    const sc     = metric.scale ?? 1;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    // Grid + Y labels
    ctx.strokeStyle = c.gridLine;
    ctx.lineWidth   = 1;
    ctx.fillStyle   = c.axisLabel;
    ctx.font        = '10px "JetBrains Mono", monospace';
    ctx.textAlign   = 'right';
    for (let i = 0; i <= 4; i++) {
      const val = Math.round((metric.max / 4) * i);
      const y   = h - b - i * (plotH / 4);
      ctx.beginPath(); ctx.moveTo(l, y); ctx.lineTo(w - r, y); ctx.stroke();
      ctx.fillText(val.toString(), l - 10, y + 3);
    }

    if (metric.multiKeys && metric.multiKeys.length > 0) {
      // ── Multi-line mode ──
      for (const mk of metric.multiKeys) {
        ctx.beginPath();
        ctx.strokeStyle = mk.color;
        ctx.lineWidth   = 1.8;
        ctx.lineJoin    = 'round';
        for (let i = 0; i < this.fullData.length; i++) {
          const x   = l + ((i - this.xMin) / (this.xMax - this.xMin)) * plotW;
          const val = (this.fullData[i][mk.key] || 0) * sc;
          const y   = h - b - (val / metric.max) * plotH;
          if (x < l - 10 || x > w - r + 10) { ctx.moveTo(x, y); continue; }
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Hover tooltip — multi-line
      if (this.hoverIndex !== null) {
        const dp = this.fullData[this.hoverIndex];
        if (dp) {
          const x = l + ((this.hoverIndex - this.xMin) / (this.xMax - this.xMin)) * plotW;

          ctx.strokeStyle = c.crosshair; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x, t); ctx.lineTo(x, h - b); ctx.stroke();

          let ty = t + 18;
          for (const mk of metric.multiKeys) {
            const rawVal = dp[mk.key] || 0;
            const val    = rawVal * sc;
            const y      = h - b - (val / metric.max) * plotH;

            ctx.fillStyle = mk.color;
            ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = mk.color;
            ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left';
            ctx.fillText(`${mk.label}: ${val.toFixed(1)} ${metric.unit}`, x + 12, ty);
            ty += 16;
          }

          ctx.fillStyle = c.tooltipTime;
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillText(this.formatTime(this.hoverIndex), x + 12, ty);
        }
      }

    } else {
      // ── Single-line mode ──
      ctx.beginPath();
      ctx.strokeStyle = metric.color;
      ctx.lineWidth   = 2;
      ctx.lineJoin    = 'round';
      for (let i = 0; i < this.fullData.length; i++) {
        const x   = l + ((i - this.xMin) / (this.xMax - this.xMin)) * plotW;
        const val = (this.fullData[i][metric.key] || 0) * sc;
        const y   = h - b - (val / metric.max) * plotH;
        if (x < l - 10 || x > w - r + 10) { if (i !== 0) ctx.moveTo(x, y); continue; }
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Hover tooltip — single-line
      if (this.hoverIndex !== null) {
        const dp = this.fullData[this.hoverIndex];
        if (dp) {
          const x   = l + ((this.hoverIndex - this.xMin) / (this.xMax - this.xMin)) * plotW;
          const val = (dp[metric.key] || 0) * sc;
          const y   = h - b - (val / metric.max) * plotH;
          ctx.strokeStyle = c.crosshair; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x, t); ctx.lineTo(x, h - b); ctx.stroke();
          ctx.fillStyle = metric.color;
          ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = c.tooltipVal; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left';
          ctx.fillText(`${val.toFixed(1)} ${metric.unit}`, x + 10, y - 20);
          ctx.fillStyle = c.tooltipTime; ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillText(this.formatTime(this.hoverIndex), x + 10, y - 5);
        }
      }
    }

    // X labels
    ctx.fillStyle = c.axisLabel;
    ctx.textAlign = 'center';
    const numTicks = 5;
    for (let i = 0; i < numTicks; i++) {
      const tickIdx = this.xMin + (i / (numTicks - 1)) * (this.xMax - this.xMin);
      const x       = l + (i / (numTicks - 1)) * plotW;
      if (tickIdx >= 0 && tickIdx < this.fullData.length)
        ctx.fillText(this.formatTime(tickIdx), x, h - 10);
    }

    // Drag-to-zoom selection overlay
    if (this.isDragging && Math.abs(this.dragCurrentPx - this.dragStartPx) >= this.DRAG_THRESHOLD) {
      const pxA = Math.max(0, Math.min(this.dragStartPx,   plotW));
      const pxB = Math.max(0, Math.min(this.dragCurrentPx, plotW));
      const lo  = Math.min(pxA, pxB);
      const hi  = Math.max(pxA, pxB);
      const selX = l + lo;
      const selW = hi - lo;

      // Área oscurecida fuera de la selección
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(l, t, lo, plotH);
      ctx.fillRect(l + hi, t, plotW - hi, plotH);

      // Relleno de la selección
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(selX, t, selW, plotH);

      // Bordes verticales de la selección
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth   = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(selX,        t); ctx.lineTo(selX,        t + plotH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(selX + selW, t); ctx.lineTo(selX + selW, t + plotH); ctx.stroke();
      ctx.setLineDash([]);

      // Etiqueta de tiempo sobre cada borde
      const idxA = this.xMin + (lo / plotW) * (this.xMax - this.xMin);
      const idxB = this.xMin + (hi / plotW) * (this.xMax - this.xMin);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font      = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.formatTime(idxA), selX,        t - 6);
      ctx.fillText(this.formatTime(idxB), selX + selW, t - 6);
    }
  }

  nextMetric() { this.currentIndex = (this.currentIndex + 1) % this.metrics.length; this.render(); }
  prevMetric() { this.currentIndex = (this.currentIndex - 1 + this.metrics.length) % this.metrics.length; this.render(); }

  get hasData(): boolean { return this.fullData && this.fullData.length >= 2; }
}
