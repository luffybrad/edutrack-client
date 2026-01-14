import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentResultsSectionComponent } from './student-results-section.component';

describe('StudentResultsSectionComponent', () => {
  let component: StudentResultsSectionComponent;
  let fixture: ComponentFixture<StudentResultsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentResultsSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentResultsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
