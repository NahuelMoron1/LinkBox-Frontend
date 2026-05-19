import { Component } from '@angular/core';
import { SavedSessionsComponent } from '../../shared/components/saved-sessions/saved-sessions.component';

@Component({
  selector: 'app-sessions-page',
  imports: [SavedSessionsComponent],
  templateUrl: './sessions-page.component.html',
  styleUrl: './sessions-page.component.css',
})
export class SessionsPageComponent {}
