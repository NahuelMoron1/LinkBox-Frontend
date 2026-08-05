import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.body.removeAttribute('data-theme');
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
    document.body.removeAttribute('data-theme');
  });

  it('defaults to dark theme and applies it to the body', () => {
    expect(service.isDark).toBeTrue();
    expect(document.body.getAttribute('data-theme')).toBe('dark');
  });

  it('toggles to light and back, persisting and applying each time', () => {
    service.toggle();
    expect(service.theme).toBe('light');
    expect(service.isDark).toBeFalse();
    expect(localStorage.getItem('linkbox-theme')).toBe('light');
    expect(document.body.getAttribute('data-theme')).toBe('light');

    service.toggle();
    expect(service.theme).toBe('dark');
    expect(document.body.getAttribute('data-theme')).toBe('dark');
  });

  it('loads a previously saved theme on init', () => {
    localStorage.setItem('linkbox-theme', 'light');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(ThemeService);
    expect(reloaded.theme).toBe('light');
    expect(document.body.getAttribute('data-theme')).toBe('light');
  });

  it('emits theme changes on theme$', (done) => {
    service.theme$.subscribe((theme) => {
      expect(theme).toBe('dark');
      done();
    });
  });
});
