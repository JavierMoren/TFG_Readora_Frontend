import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAutoresComponent } from './admin-autores.component';

describe('AdminAutoresComponent', () => {
  let component: AdminAutoresComponent;
  let fixture: ComponentFixture<AdminAutoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAutoresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminAutoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
