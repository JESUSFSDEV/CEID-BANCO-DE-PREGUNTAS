import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminModulosComponent } from './admin-modulos.component';

describe('AdminModulosComponent', () => {
  let component: AdminModulosComponent;
  let fixture: ComponentFixture<AdminModulosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminModulosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminModulosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
