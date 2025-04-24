import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminUsuarioLibrosComponent } from './admin-usuario-libros.component';

describe('AdminUsuarioLibrosComponent', () => {
  let component: AdminUsuarioLibrosComponent;
  let fixture: ComponentFixture<AdminUsuarioLibrosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUsuarioLibrosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminUsuarioLibrosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
