import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuardianAddComponent } from './guardian-add.component';

describe('GuardianAddComponent', () => {
  let component: GuardianAddComponent;
  let fixture: ComponentFixture<GuardianAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuardianAddComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuardianAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
