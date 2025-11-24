import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminBalotariosComponent } from './admin-balotarios.component';

describe('AdminBalotariosComponent', () => {
  let component: AdminBalotariosComponent;
  let fixture: ComponentFixture<AdminBalotariosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminBalotariosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminBalotariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
