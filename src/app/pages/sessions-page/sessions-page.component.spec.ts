import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { SessionsPageComponent } from './sessions-page.component';

describe('SessionsPageComponent', () => {
  let component: SessionsPageComponent;
  let fixture: ComponentFixture<SessionsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionsPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
