import { TestBed } from '@angular/core/testing';
import Swal from 'sweetalert2';
import { AlertService } from './alert.service';

describe('AlertService', () => {
  let service: AlertService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlertService);
  });

  afterEach(() => Swal.close());

  it('shows a success alert', async () => {
    const promise = service.success('Title', 'Message');
    Swal.clickConfirm();
    await expectAsync(promise).toBeResolved();
  });

  it('shows an error alert', async () => {
    const promise = service.error('Title');
    Swal.clickConfirm();
    await expectAsync(promise).toBeResolved();
  });

  it('shows a warning alert', async () => {
    const promise = service.warning('Title');
    Swal.clickConfirm();
    await expectAsync(promise).toBeResolved();
  });

  it('shows an info alert', async () => {
    const promise = service.info('Title');
    Swal.clickConfirm();
    await expectAsync(promise).toBeResolved();
  });

  it('resolves true when confirm() is confirmed', async () => {
    const promise = service.confirm('Are you sure?');
    Swal.clickConfirm();
    expect(await promise).toBeTrue();
  });

  it('resolves false when confirm() is cancelled', async () => {
    const promise = service.confirm('Are you sure?');
    Swal.clickCancel();
    expect(await promise).toBeFalse();
  });

  it('shows an upgrade prompt', async () => {
    const promise = service.upgradePrompt('Basic', 'Pro', 20);
    Swal.clickCancel();
    expect(await promise).toBeFalse();
  });

  it('shows the subscription expired modal', async () => {
    const promise = service.subscriptionExpired();
    Swal.clickConfirm();
    await expectAsync(promise).toBeResolved();
  });

  it('shows the session saved modal', async () => {
    const promise = service.sessionSaved('My Session', 120);
    Swal.clickConfirm();
    await expectAsync(promise).toBeResolved();
  });

  it('shows the pro limit reached modal', async () => {
    const promise = service.proLimitReached(2, 2, new Date());
    Swal.clickCancel();
    expect(await promise).toBeFalse();
  });

  it('shows and closes a loading toast', () => {
    expect(() => service.loading('Loading...')).not.toThrow();
    expect(() => service.closeLoading()).not.toThrow();
  });

  it('shows the plan comparison modal', async () => {
    const promise = service.planComparison();
    Swal.clickConfirm();
    await expectAsync(promise).toBeResolved();
  });

  it('shows a loading spinner with a message', () => {
    expect(() => service.loadingWithSpinner('Processing...')).not.toThrow();
  });

  it('closes any open alert', () => {
    service.info('Title');
    expect(() => service.close()).not.toThrow();
  });
});
