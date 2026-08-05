import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { MainMenuPageComponent } from './main-menu-page.component';

describe('MainMenuPageComponent', () => {
  let component: MainMenuPageComponent;
  let fixture: ComponentFixture<MainMenuPageComponent>;
  let authStub: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authStub = jasmine.createSpyObj<AuthService>('AuthService', ['getDeviceKey', 'logout']);
    authStub.getDeviceKey.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [MainMenuPageComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(MainMenuPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and default isLoggedIn to the auth service state', () => {
    expect(component).toBeTruthy();
    expect(component.isLoggedIn).toBeFalse();
  });

  it('reflects a logged-in device key', () => {
    authStub.getDeviceKey.and.returnValue('device-1');
    component.ngOnInit();
    expect(component.isLoggedIn).toBeTrue();
  });

  it('tracks scroll position for the nav bar', () => {
    Object.defineProperty(window, 'scrollY', { value: 100, configurable: true });
    component.onScroll();
    expect(component.navScrolled).toBeTrue();

    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
    component.onScroll();
    expect(component.navScrolled).toBeFalse();
  });

  it('scrolls to a section by id without throwing when missing', () => {
    expect(() => component.scrollTo('nonexistent-section')).not.toThrow();
  });

  it('logs out via the auth service', () => {
    component.logout();
    expect(authStub.logout).toHaveBeenCalled();
  });

  it('exposes the features and plans arrays', () => {
    expect(component.features.length).toBe(5);
    expect(component.plans.length).toBe(3);
  });
});
