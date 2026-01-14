import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamResultsSectionComponent } from './exam-results-section.component';

describe('ExamResultsSectionComponent', () => {
  let component: ExamResultsSectionComponent;
  let fixture: ComponentFixture<ExamResultsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamResultsSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamResultsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
