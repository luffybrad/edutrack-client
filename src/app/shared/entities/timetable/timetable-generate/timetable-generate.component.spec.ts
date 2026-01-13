import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimetableGenerateComponent } from './timetable-generate.component';

describe('TimetableGenerateComponent', () => {
  let component: TimetableGenerateComponent;
  let fixture: ComponentFixture<TimetableGenerateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimetableGenerateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimetableGenerateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
