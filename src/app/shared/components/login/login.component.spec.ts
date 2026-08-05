import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let httpMock: HttpTestingController;
  const loginUrl = `${environment.endpoint}/api/devices/login`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    httpMock = TestBed.inject(HttpTestingController);
    // AuthService (inyectado por LoginComponent) dispara un GET /token al construirse.
    httpMock.expectOne(`${environment.endpoint}/api/devices/token`).flush(null);
  });

  afterEach(() => {
    Swal.close();
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not throw when submitting with empty fields', () => {
    component.key = '';
    component.password = '';
    expect(() => component.onLogin()).not.toThrow();
  });

  it('logs in and navigates to the return url on success', fakeAsync(() => {
    component.key = 'device-key';
    component.password = 'secret';
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigateByUrl');

    component.onLogin();
    const req = httpMock.expectOne(loginUrl);
    expect(req.request.body).toEqual({ key: 'device-key', password: 'secret' });
    req.flush({ device: { id: '1', clientName: 'x', plan: 'basic', subscriptionStatus: 'active', subscriptionEndDate: null, sessionsSavedThisMonth: 0 } });

    tick(); // deja que se monte el modal de éxito de SweetAlert2
    Swal.clickConfirm();
    tick();

    expect(navigateSpy).toHaveBeenCalledWith('/dashboard');
  }));

  it('shows an error dialog on invalid credentials', fakeAsync(() => {
    component.key = 'device-key';
    component.password = 'wrong';

    component.onLogin();
    const req = httpMock.expectOne(loginUrl);
    req.flush({ message: 'Credenciales incorrectas' }, { status: 401, statusText: 'Unauthorized' });
    tick();

    expect(document.querySelector('.swal2-container')).toBeTruthy();
  }));
});
