import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPreguntasComponent } from './admin-preguntas.component';

describe('AdminPreguntasComponent', () => {
  let component: AdminPreguntasComponent;
  let fixture: ComponentFixture<AdminPreguntasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPreguntasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminPreguntasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
