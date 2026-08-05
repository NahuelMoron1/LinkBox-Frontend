import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { WifiWidgetComponent } from './wifi-widget.component';
import { NetworkService } from '../../services/network.service';

describe('WifiWidgetComponent', () => {
  let component: WifiWidgetComponent;
  let fixture: ComponentFixture<WifiWidgetComponent>;
  let networkStub: jasmine.SpyObj<NetworkService>;

  beforeEach(async () => {
    networkStub = jasmine.createSpyObj<NetworkService>('NetworkService', ['getStatus', 'scan', 'connect']);
    networkStub.getStatus.and.returnValue(of({ connected: true, ssid: 'HomeWifi' }));
    networkStub.scan.and.returnValue(of({ networks: [{ ssid: 'HomeWifi', signal: 80, secured: true }] }));
    networkStub.connect.and.returnValue(of({ message: 'Conectado', ssid: 'HomeWifi' }));

    await TestBed.configureTestingModule({
      imports: [WifiWidgetComponent],
      providers: [{ provide: NetworkService, useValue: networkStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(WifiWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load the status on init', () => {
    expect(component).toBeTruthy();
    expect(component.status).toEqual({ connected: true, ssid: 'HomeWifi' });
  });

  it('opens the panel and triggers a scan', () => {
    component.togglePanel();
    expect(component.open).toBeTrue();
    expect(component.networks.length).toBe(1);
    expect(component.scanning).toBeFalse();
  });

  it('closes the panel and clears the selection', () => {
    component.open = true;
    component.selected = { ssid: 'HomeWifi', signal: 80, secured: true };
    component.togglePanel();
    expect(component.open).toBeFalse();
    expect(component.selected).toBeNull();
  });

  it('stops scanning on a scan error', () => {
    networkStub.scan.and.returnValue(throwError(() => new Error('boom')));
    component.scan();
    expect(component.scanning).toBeFalse();
  });

  it('selects and cancels a network', () => {
    const net = { ssid: 'HomeWifi', signal: 80, secured: true };
    component.selectNetwork(net);
    expect(component.selected).toBe(net);
    component.cancelSelection();
    expect(component.selected).toBeNull();
  });

  it('connects successfully and refreshes status', () => {
    component.selected = { ssid: 'HomeWifi', signal: 80, secured: true };
    component.connect();
    expect(component.connecting).toBeFalse();
    expect(component.selected).toBeNull();
    expect(networkStub.getStatus).toHaveBeenCalled();
  });

  it('does nothing when connecting without a selected network', () => {
    component.selected = null;
    component.connect();
    expect(networkStub.connect).not.toHaveBeenCalled();
  });

  it('shows an error message when connect fails', () => {
    networkStub.connect.and.returnValue(throwError(() => new Error('boom')));
    component.selected = { ssid: 'HomeWifi', signal: 80, secured: true };
    component.connect();
    expect(component.connecting).toBeFalse();
    expect(component.connectError).toContain('No se pudo conectar');
  });

  it('emits checkUpdates and closes the panel', () => {
    const spy = jasmine.createSpy('checkUpdates');
    component.checkUpdates.subscribe(spy);
    component.open = true;
    component.onCheckUpdates();
    expect(component.open).toBeFalse();
    expect(spy).toHaveBeenCalled();
  });

  it('maps signal strength to bar count', () => {
    expect(component.signalBars(90)).toBe(4);
    expect(component.signalBars(60)).toBe(3);
    expect(component.signalBars(30)).toBe(2);
    expect(component.signalBars(10)).toBe(1);
  });
});
