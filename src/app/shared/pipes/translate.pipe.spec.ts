import { TestBed } from '@angular/core/testing';
import { TranslatePipe } from './translate.pipe';
import { I18nService } from '../services/i18n.service';

describe('TranslatePipe', () => {
  let pipe: TranslatePipe;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    const i18n = TestBed.inject(I18nService);
    pipe = new TranslatePipe(i18n);
  });

  afterEach(() => localStorage.clear());

  it('translates a known key using the current language', () => {
    expect(pipe.transform('nav.login')).toBe('LOGIN');
  });

  it('returns the key itself when unknown', () => {
    expect(pipe.transform('nope.nope')).toBe('nope.nope');
  });
});
