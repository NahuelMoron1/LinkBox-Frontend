import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(I18nService);
  });

  afterEach(() => localStorage.clear());

  it('defaults to english', () => {
    expect(service.lang).toBe('en');
  });

  it('toggles between en and es and persists the choice', () => {
    service.toggle();
    expect(service.lang).toBe('es');
    expect(localStorage.getItem('linkbox-lang')).toBe('es');
    service.toggle();
    expect(service.lang).toBe('en');
  });

  it('loads a previously saved language on init', () => {
    localStorage.setItem('linkbox-lang', 'es');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(I18nService);
    expect(reloaded.lang).toBe('es');
  });

  it('ignores an invalid saved language', () => {
    localStorage.setItem('linkbox-lang', 'fr');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(I18nService);
    expect(reloaded.lang).toBe('en');
  });

  it('translates a known key', () => {
    expect(service.t('nav.login')).toBe('LOGIN');
    service.toggle();
    expect(service.t('nav.login')).toBe('INGRESAR');
  });

  it('falls back to english when a key is missing in the current language', () => {
    expect(service.t('totally.unknown.key')).toBe('totally.unknown.key');
  });

  it('emits the current language on lang$', (done) => {
    service.lang$.subscribe((lang) => {
      expect(lang).toBe('en');
      done();
    });
  });
});
