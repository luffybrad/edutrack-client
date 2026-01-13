import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultsExamAnalysisComponent } from './results-exam-analysis.component';

describe('ResultsExamAnalysisComponent', () => {
  let component: ResultsExamAnalysisComponent;
  let fixture: ComponentFixture<ResultsExamAnalysisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultsExamAnalysisComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultsExamAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
