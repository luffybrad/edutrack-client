import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardRedirectComponent } from './dashboard-redirect.component';

describe('DashboardRedirectComponent', () => {
  let component: DashboardRedirectComponent;
  let fixture: ComponentFixture<DashboardRedirectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardRedirectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardRedirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
