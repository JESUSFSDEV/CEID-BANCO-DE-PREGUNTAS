import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPersonasComponent } from './admin-personas.component';

describe('AdminPersonasComponent', () => {
  let component: AdminPersonasComponent;
  let fixture: ComponentFixture<AdminPersonasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPersonasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminPersonasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
