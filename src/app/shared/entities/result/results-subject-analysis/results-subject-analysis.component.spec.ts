import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultsSubjectAnalysisComponent } from './results-subject-analysis.component';

describe('ResultsSubjectAnalysisComponent', () => {
  let component: ResultsSubjectAnalysisComponent;
  let fixture: ComponentFixture<ResultsSubjectAnalysisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultsSubjectAnalysisComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultsSubjectAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
