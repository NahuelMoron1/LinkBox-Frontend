import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('emits a success toast', (done) => {
    service.toast.subscribe(({ message, type }) => {
      expect(message).toBe('It worked');
      expect(type).toBe('success');
      done();
    });
    service.success('It worked');
  });

  it('emits an error toast', (done) => {
    service.toast.subscribe(({ message, type }) => {
      expect(message).toBe('It failed');
      expect(type).toBe('error');
      done();
    });
    service.error('It failed');
  });

  it('emits an arbitrary toast type via show()', (done) => {
    service.toast.subscribe(({ message, type }) => {
      expect(message).toBe('custom');
      expect(type).toBe('success');
      done();
    });
    service.show('custom', 'success');
  });
});
