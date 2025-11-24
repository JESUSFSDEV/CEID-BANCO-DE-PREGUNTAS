import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminBancoComponent } from './admin-banco.component';

describe('AdminBancoComponent', () => {
  let component: AdminBancoComponent;
  let fixture: ComponentFixture<AdminBancoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminBancoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminBancoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
