import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-telemetry-chart',
  imports: [],
  templateUrl: './telemetry-chart.component.html',
  styleUrl: './telemetry-chart.component.css',
})
export class TelemetryChartComponent implements OnChanges, AfterViewInit {
  @Input() fullData: any[] = [];
  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  metrics = [
    {
      key: 'rpm',
      label: 'ENGINE RPM',
      color: '#ff0000',
      unit: 'RPM',
      max: 9000,
    },
    {
      key: 'water_temp',
      label: 'WATER TEMP',
      color: '#ff6600',
      unit: '°C',
      max: 120,
    },
    {
      key: 'oil_temp',
      label: 'OIL TEMP',
      color: '#00ff00',
      unit: '°C',
      max: 150,
    },
    {
      key: 'oil_press',
      label: 'OIL PRESS',
      color: '#ffff00',
      unit: 'PSI',
      max: 100,
    },
  ];

  currentIndex = 0;
  private mouseX: number | null = null;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize() {
    const canvas = this.canvasRef.nativeElement;
    const dpr = window.devicePixelRatio || 1; // Detecta la densidad de tu pantalla

    // Establecemos el tamaño del buffer (píxeles reales)
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Escalamos el contexto para poder seguir dibujando con coordenadas lógicas
      ctx.scale(dpr, dpr);
    }

    this.render();
  }

  ngOnChanges() {
    this.render();
  }

  onMouseMove(e: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.mouseX =
      (e.clientX - rect.left) *
      (this.canvasRef.nativeElement.width / rect.width);
    this.render();
  }

  onMouseLeave() {
    this.mouseX = null;
    this.render();
  }

  render() {
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => this.draw());
    });
  }

  private draw() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx || this.fullData.length < 2) return;

    // IMPORTANTE: Ahora usamos clientWidth/Height para los cálculos de dibujo
    // porque el contexto ya está escalado con dpr.
    const logicalWidth = canvas.clientWidth;
    const logicalHeight = canvas.clientHeight;

    const metric = this.metrics[this.currentIndex];
    const paddingL = 50;
    const paddingR = 20;
    const paddingT = 20;
    const paddingB = 30;
    const w = logicalWidth - paddingL - paddingR;
    const h = logicalHeight - paddingT - paddingB;

    ctx.clearRect(0, 0, logicalWidth, logicalHeight);

    // 1. EJES Y VALORES DE REFERENCIA (Estilo P1Doks)
    ctx.strokeStyle = '#1a1a1a';
    ctx.fillStyle = '#666';
    ctx.font = '12px "JetBrains Mono"';
    ctx.textAlign = 'right';

    for (let i = 0; i <= 4; i++) {
      const val = (metric.max / 4) * i;
      const y = canvas.height - paddingB - i * (h / 4);

      // Línea de grilla
      ctx.beginPath();
      ctx.moveTo(paddingL, y);
      ctx.lineTo(canvas.width - paddingR, y);
      ctx.stroke();

      // Texto de referencia
      ctx.fillText(val.toString(), paddingL - 10, y + 4);
    }

    // 2. DIBUJO DE TELEMETRÍA
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = metric.color;

    this.fullData.forEach((d, i) => {
      const x = paddingL + (i / (this.fullData.length - 1)) * w;
      const val = d[metric.key] || 0;
      const y = canvas.height - paddingB - (val / metric.max) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 3. INTERACCIÓN (TOOLTIP)
    if (
      this.mouseX &&
      this.mouseX >= paddingL &&
      this.mouseX <= canvas.width - paddingR
    ) {
      const idx = Math.round(
        ((this.mouseX - paddingL) / w) * (this.fullData.length - 1),
      );
      const data = this.fullData[idx];

      if (data) {
        const x = paddingL + (idx / (this.fullData.length - 1)) * w;
        const val = data[metric.key] || 0;
        const y = canvas.height - paddingB - (val / metric.max) * h;

        // Línea vertical de escaneo
        ctx.strokeStyle = '#444';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(x, paddingT);
        ctx.lineTo(x, canvas.height - paddingB);
        ctx.stroke();
        ctx.setLineDash([]);

        // Punto de enfoque
        ctx.fillStyle = metric.color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Cartelito de valor (Tooltip)
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.font = 'bold 14px "JetBrains Mono"';
        ctx.fillText(`${val} ${metric.unit}`, x + 10, y - 10);
      }
    }
  }

  nextMetric() {
    this.currentIndex = (this.currentIndex + 1) % this.metrics.length;
    this.render();
  }
  prevMetric() {
    this.currentIndex =
      (this.currentIndex - 1 + this.metrics.length) % this.metrics.length;
    this.render();
  }
}
