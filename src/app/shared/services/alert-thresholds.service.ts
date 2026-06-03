import { Injectable } from '@angular/core';

export interface SensorThresholds {
  cold:    number; // below cold  → danger (too low)
  warm:    number; // [cold, warm)    → cold (blue)
  optimum: number; // [warm, optimum) → warm (yellow)
  warning: number; // [optimum, warning) → optimum (green)
  danger:  number; // [warning, danger) → warning (orange) | >=danger → danger (red)
}

const DEFAULTS: Record<string, SensorThresholds> = {
  oil_temp:   { cold: 70,  warm: 80,  optimum: 90,  warning: 105, danger: 120  },
  water_temp: { cold: 70,  warm: 78,  optimum: 85,  warning: 98,  danger: 105  },
  oil_press:  { cold: 22,  warm: 36,  optimum: 51,  warning: 90,  danger: 116  }, // PSI
  tyre_temp:  { cold: 45,  warm: 65,  optimum: 75,  warning: 100, danger: 110  },
  tyre_press: { cold: 22,  warm: 26,  optimum: 30,  warning: 36,  danger: 40   }, // PSI
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
  private readonly KEY = 'linkbox-sensor-thresholds-v3';
  private data: Record<string, SensorThresholds>;

  constructor() {
    try {
      const saved = localStorage.getItem(this.KEY);
      const parsed: Record<string, Partial<SensorThresholds>> = saved ? JSON.parse(saved) : {};
      // Deep-merge: each saved sensor is merged with its defaults so new fields get fallbacks
      this.data = {} as Record<string, SensorThresholds>;
      for (const sensor of Object.keys(DEFAULTS)) {
        this.data[sensor] = { ...DEFAULTS[sensor], ...(parsed[sensor] ?? {}) };
      }
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

  /**
   * 5-zone color scale:
   *   value < cold              → danger  (red blink — too low)
   *   [cold,    warm)           → cold    (blue)
   *   [warm,    optimum)        → warm    (yellow)
   *   [optimum, warning)        → optimum (green)
   *   [warning, danger)         → warning (orange)
   *   value >= danger           → danger  (red blink — too high)
   */
  getStatus(value: number | null | undefined, sensor: string): string {
    if (value == null) return 'cold';
    const t = this.get(sensor);
    if (value < t.cold)    return 'danger';
    if (value < t.warm)    return 'cold';
    if (value < t.optimum) return 'warm';
    if (value < t.warning) return 'optimum';
    if (value < t.danger)  return 'warning';
    return 'danger';
  }

  isDanger(value: number | null | undefined, sensor: string): boolean {
    return this.getStatus(value, sensor) === 'danger';
  }
}
