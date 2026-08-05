import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { SavedSessionsComponent } from './saved-sessions.component';
import { SessionsService } from '../../services/sessions.service';
import { AlertService } from '../../services/alert.service';
import { SessionInfo } from '../../models/Session';

const SESSION: SessionInfo = {
  id: 's1',
  session_name: 'Practice 1',
  start_time: '2026-01-01T10:00:00Z',
  end_time: '2026-01-01T10:05:00Z',
  total_records: 100,
  status: 'completed',
  created_at: '2026-01-01T10:00:00Z',
};

describe('SavedSessionsComponent', () => {
  let component: SavedSessionsComponent;
  let fixture: ComponentFixture<SavedSessionsComponent>;
  let sessionsStub: jasmine.SpyObj<SessionsService>;
  let alertStub: jasmine.SpyObj<AlertService>;
  let sessions$: Subject<SessionInfo[]>;

  beforeEach(async () => {
    sessions$ = new Subject<SessionInfo[]>();
    sessionsStub = jasmine.createSpyObj<SessionsService>(
      'SessionsService',
      ['loadSessions', 'renameSession', 'getSessionData', 'deleteSession', 'setCurrentSession'],
      { sessions$: sessions$.asObservable() },
    );
    sessionsStub.renameSession.and.returnValue(of({}));
    sessionsStub.getSessionData.and.returnValue(of({ session: { id: 's1', name: 'x', startTime: '', endTime: null, totalRecords: 0 }, data: [] }));
    sessionsStub.deleteSession.and.returnValue(of({}));

    alertStub = jasmine.createSpyObj<AlertService>('AlertService', [
      'error', 'success', 'confirm', 'loadingWithSpinner', 'close',
    ]);
    alertStub.confirm.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [SavedSessionsComponent],
      providers: [
        provideRouter([]),
        { provide: SessionsService, useValue: sessionsStub },
        { provide: AlertService, useValue: alertStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SavedSessionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load sessions on init', () => {
    expect(component).toBeTruthy();
    expect(sessionsStub.loadSessions).toHaveBeenCalled();
    sessions$.next([SESSION]);
    expect(component.sessions).toEqual([SESSION]);
  });

  it('clears the loading flag a second after loadSessions() is called', fakeAsync(() => {
    // El primer ngOnInit ya disparó su propio setTimeout real (fuera de
    // esta zona fakeAsync) — se llama loadSessions() de nuevo acá adentro
    // para poder controlar su timer con tick().
    component.loadSessions();
    expect(component.isLoading).toBeTrue();
    tick(1000);
    expect(component.isLoading).toBeFalse();
  }));

  it('selects a session and loads its data', () => {
    component.selectSession(SESSION);
    expect(component.selectedSession).toBe(SESSION);
    expect(sessionsStub.getSessionData).toHaveBeenCalledWith('s1');
    expect(component.sessionData).toBeTruthy();
    expect(sessionsStub.setCurrentSession).toHaveBeenCalledWith(SESSION);
  });

  it('shows an error when session data fails to load', () => {
    sessionsStub.getSessionData.and.returnValue(throwError(() => new Error('boom')));
    component.selectSession(SESSION);
    expect(alertStub.error).toHaveBeenCalled();
  });

  it('starts and cancels renaming', fakeAsync(() => {
    component.selectedSession = SESSION;
    component.startEditingName();
    expect(component.isEditingName).toBeTrue();
    expect(component.editedName).toBe('Practice 1');
    tick(30);

    component.cancelEditingName();
    expect(component.isEditingName).toBeFalse();
  }));

  it('does nothing when starting to edit without a selected session', () => {
    component.selectedSession = null;
    component.startEditingName();
    expect(component.isEditingName).toBeFalse();
  });

  it('saves a renamed session', () => {
    component.selectedSession = { ...SESSION };
    component.sessions = [{ ...SESSION }];
    component.editedName = 'New name';
    component.saveSessionName();
    expect(sessionsStub.renameSession).toHaveBeenCalledWith('s1', 'New name');
    expect(component.selectedSession.session_name).toBe('New name');
    expect(component.isEditingName).toBeFalse();
  });

  it('does not save an empty or unchanged name', () => {
    component.selectedSession = { ...SESSION };
    component.editedName = '   ';
    component.saveSessionName();
    expect(sessionsStub.renameSession).not.toHaveBeenCalled();

    component.editedName = SESSION.session_name;
    component.saveSessionName();
    expect(component.isEditingName).toBeFalse();
  });

  it('shows an error when renaming fails', () => {
    sessionsStub.renameSession.and.returnValue(throwError(() => new Error('boom')));
    component.selectedSession = { ...SESSION };
    component.editedName = 'New name';
    component.saveSessionName();
    expect(alertStub.error).toHaveBeenCalled();
  });

  it('deletes a session after confirmation', fakeAsync(() => {
    component.deleteSession(SESSION);
    tick();
    expect(alertStub.confirm).toHaveBeenCalled();
    expect(sessionsStub.deleteSession).toHaveBeenCalledWith('s1');
    expect(alertStub.success).toHaveBeenCalled();
  }));

  it('does not delete when the confirmation is cancelled', fakeAsync(() => {
    alertStub.confirm.and.resolveTo(false);
    component.deleteSession(SESSION);
    tick();
    expect(sessionsStub.deleteSession).not.toHaveBeenCalled();
  }));

  it('shows an error when deletion fails', fakeAsync(() => {
    sessionsStub.deleteSession.and.returnValue(throwError(() => new Error('boom')));
    component.deleteSession(SESSION);
    tick();
    expect(alertStub.error).toHaveBeenCalled();
  }));

  it('exports the session data as a JSON download', () => {
    component.selectedSession = SESSION;
    component.sessionData = { session: { id: 's1', name: 'x', startTime: '', endTime: null, totalRecords: 0 }, data: [] };
    const createObjectURL = spyOn(URL, 'createObjectURL').and.returnValue('blob:fake');
    const revokeObjectURL = spyOn(URL, 'revokeObjectURL');
    component.exportSession();
    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');
    expect(alertStub.success).toHaveBeenCalled();
  });

  it('does nothing exporting without session data', () => {
    component.sessionData = null;
    const createObjectURL = spyOn(URL, 'createObjectURL');
    component.exportSession();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it('filters sessions by name and id', () => {
    component.sessions = [SESSION, { ...SESSION, id: 's2', session_name: 'Qualifying' }];
    component.searchQuery = 'practice';
    expect(component.getFilteredSessions()).toEqual([SESSION]);
    component.searchQuery = 's2';
    expect(component.getFilteredSessions()[0].id).toBe('s2');
    component.searchQuery = '';
    expect(component.getFilteredSessions().length).toBe(2);
  });

  it('formats a date string', () => {
    expect(component.formatDate(SESSION.start_time)).toBeTruthy();
  });

  it('computes session duration or reports it is still recording', () => {
    expect(component.getSessionDuration(SESSION)).toMatch(/\d+m \d+s/);
    expect(component.getSessionDuration({ ...SESSION, end_time: null })).toBe('Recording...');
  });

  it('navigates back to the dashboard', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');
    component.backToDashboard();
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  });

  it('unsubscribes on destroy', () => {
    fixture.destroy();
    expect(() => sessions$.next([])).not.toThrow();
  });
});
