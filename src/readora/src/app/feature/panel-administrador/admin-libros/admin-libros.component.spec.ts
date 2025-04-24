import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminLibrosComponent } from './admin-libros.component';

describe('AdminLibrosComponent', () => {
  let component: AdminLibrosComponent;
  let fixture: ComponentFixture<AdminLibrosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLibrosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminLibrosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
