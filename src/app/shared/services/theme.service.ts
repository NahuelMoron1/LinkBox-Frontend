import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'linkbox-theme';

  private _theme = new BehaviorSubject<'dark' | 'light'>('dark');
  readonly theme$ = this._theme.asObservable();

  constructor() {
    const saved = localStorage.getItem(this.STORAGE_KEY) as 'dark' | 'light' | null;
    const initial = saved ?? 'dark';
    this._theme.next(initial);
    this.apply(initial);
  }

  toggle(): void {
    const next = this._theme.value === 'dark' ? 'light' : 'dark';
    this._theme.next(next);
    localStorage.setItem(this.STORAGE_KEY, next);
    this.apply(next);
  }

  get isDark(): boolean    { return this._theme.value === 'dark'; }
  get theme(): 'dark' | 'light' { return this._theme.value; }

  private apply(theme: 'dark' | 'light'): void {
    document.body.setAttribute('data-theme', theme);
  }
}
