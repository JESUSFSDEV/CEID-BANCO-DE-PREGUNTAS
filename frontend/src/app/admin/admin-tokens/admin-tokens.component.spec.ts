import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminTokensComponent } from './admin-tokens.component';

describe('AdminTokensComponent', () => {
  let component: AdminTokensComponent;
  let fixture: ComponentFixture<AdminTokensComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTokensComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminTokensComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
