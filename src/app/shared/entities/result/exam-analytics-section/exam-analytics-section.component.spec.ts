import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamAnalyticsSectionComponent } from './exam-analytics-section.component';

describe('ExamAnalyticsSectionComponent', () => {
  let component: ExamAnalyticsSectionComponent;
  let fixture: ComponentFixture<ExamAnalyticsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamAnalyticsSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamAnalyticsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
