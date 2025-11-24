import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCiclosComponent } from './admin-ciclos.component';

describe('AdminCiclosComponent', () => {
  let component: AdminCiclosComponent;
  let fixture: ComponentFixture<AdminCiclosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCiclosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCiclosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
