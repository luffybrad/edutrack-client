import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardUnauthorizedComponent } from './dashboard-unauthorized.component';

describe('DashboardUnauthorizedComponent', () => {
  let component: DashboardUnauthorizedComponent;
  let fixture: ComponentFixture<DashboardUnauthorizedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardUnauthorizedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardUnauthorizedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
