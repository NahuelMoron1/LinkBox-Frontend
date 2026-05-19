import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanInfoToolbarComponent } from './plan-info-toolbar.component';

describe('PlanInfoToolbarComponent', () => {
  let component: PlanInfoToolbarComponent;
  let fixture: ComponentFixture<PlanInfoToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanInfoToolbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlanInfoToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
