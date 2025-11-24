import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminNivelesComponent } from './admin-niveles.component';

describe('AdminNivelesComponent', () => {
  let component: AdminNivelesComponent;
  let fixture: ComponentFixture<AdminNivelesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminNivelesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminNivelesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
