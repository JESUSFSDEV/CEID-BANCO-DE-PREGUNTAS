import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminIdiomasComponent } from './admin-idiomas.component';

describe('AdminIdiomasComponent', () => {
  let component: AdminIdiomasComponent;
  let fixture: ComponentFixture<AdminIdiomasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminIdiomasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminIdiomasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
