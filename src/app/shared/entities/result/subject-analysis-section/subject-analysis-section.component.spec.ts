import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubjectAnalysisSectionComponent } from './subject-analysis-section.component';

describe('SubjectAnalysisSectionComponent', () => {
  let component: SubjectAnalysisSectionComponent;
  let fixture: ComponentFixture<SubjectAnalysisSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectAnalysisSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubjectAnalysisSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
