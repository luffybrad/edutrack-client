import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultsStudentAnalysisComponent } from './results-student-analysis.component';

describe('ResultsStudentAnalysisComponent', () => {
  let component: ResultsStudentAnalysisComponent;
  let fixture: ComponentFixture<ResultsStudentAnalysisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultsStudentAnalysisComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultsStudentAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
