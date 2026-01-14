import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadResultsSectionComponent } from './upload-results-section.component';

describe('UploadResultsSectionComponent', () => {
  let component: UploadResultsSectionComponent;
  let fixture: ComponentFixture<UploadResultsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadResultsSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadResultsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
