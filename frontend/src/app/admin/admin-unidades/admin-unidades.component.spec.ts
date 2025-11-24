import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminUnidadesComponent } from './admin-unidades.component';

describe('AdminUnidadesComponent', () => {
  let component: AdminUnidadesComponent;
  let fixture: ComponentFixture<AdminUnidadesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUnidadesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminUnidadesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
