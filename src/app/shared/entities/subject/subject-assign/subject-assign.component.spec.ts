import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubjectAssignComponent } from './subject-assign.component';

describe('SubjectAssignComponent', () => {
  let component: SubjectAssignComponent;
  let fixture: ComponentFixture<SubjectAssignComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectAssignComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubjectAssignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
