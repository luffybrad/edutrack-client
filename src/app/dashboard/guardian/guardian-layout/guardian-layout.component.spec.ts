import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuardianLayoutComponent } from './guardian-layout.component';

describe('GuardianLayoutComponent', () => {
  let component: GuardianLayoutComponent;
  let fixture: ComponentFixture<GuardianLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuardianLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuardianLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
