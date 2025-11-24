import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAuditoriaComponent } from './admin-auditoria.component';

describe('AdminAuditoriaComponent', () => {
  let component: AdminAuditoriaComponent;
  let fixture: ComponentFixture<AdminAuditoriaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAuditoriaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminAuditoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
