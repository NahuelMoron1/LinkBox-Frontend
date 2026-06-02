import { Injectable } from '@angular/core';

export interface SensorThresholds {
  cold:    number; // below → cold (blue)
  warm:    number; // cold→this → warm (yellow)
  optimum: number; // warm→this → optimum (green)
  warning: number; // optimum→this → warning (orange)
  // above warning → danger (red, blinking)
}

// Default thresholds — match the previous hardcoded getTempStatus() logic
const DEFAULTS: Record<string, SensorThresholds> = {
  oil_temp:   { cold: 70,  warm: 85,  optimum: 98,  warning: 105  },
  water_temp: { cold: 70,  warm: 80,  optimum: 98,  warning: 102  },
  oil_press:  { cold: 22,  warm: 36,  optimum: 102, warning: 124  }, // PSI
  tyre_temp:  { cold: 45,  warm: 65,  optimum: 75,  warning: 108  },
  tyre_press: { cold: 22,  warm: 26,  optimum: 30,  warning: 38   }, // PSI
};

export const SENSOR_UNIT: Record<string, string> = {
  oil_temp:   '°C',
  water_temp: '°C',
  oil_press:  'PSI',
  tyre_temp:  '°C',
  tyre_press: 'PSI',
};

@Injectable({ providedIn: 'root' })
export class AlertThresholdsService {
  private readonly KEY = 'linkbox-sensor-thresholds-v2';
  private data: Record<string, SensorThresholds>;

  constructor() {
    try {
      const saved = localStorage.getItem(this.KEY);
      this.data = saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS };
    } catch {
      this.data = { ...DEFAULTS };
    }
  }

  get(sensor: string): SensorThresholds {
    return this.data[sensor] ?? DEFAULTS[sensor];
  }

  getDefault(sensor: string): SensorThresholds {
    return { ...DEFAULTS[sensor] };
  }

  save(sensor: string, t: SensorThresholds): void {
    this.data[sensor] = { ...t };
    localStorage.setItem(this.KEY, JSON.stringify(this.data));
  }

  reset(sensor: string): void {
    this.data[sensor] = { ...DEFAULTS[sensor] };
    localStorage.setItem(this.KEY, JSON.stringify(this.data));
  }

  /** Returns CSS class name based on value + current thresholds.
   *  Danger fires in BOTH directions:
   *    value < cold threshold  → danger (too low, e.g. very low oil pressure)
   *    value > warning threshold → danger (too high, e.g. overheating)
   */
  getStatus(value: number, sensor: string): string {
    if (!value || value <= 0) return 'cold';
    const t = this.get(sensor);
    if (value < t.cold)    return 'danger';   // ← too low = danger
    if (value < t.warm)    return 'cold';
    if (value < t.optimum) return 'warm';
    if (value < t.warning) return 'optimum';
    return 'danger';                           // ← too high = danger
  }

  isDanger(value: number, sensor: string): boolean {
    return this.getStatus(value, sensor) === 'danger';
  }
}
