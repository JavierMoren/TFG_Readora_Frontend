import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsuarioLibroComponent } from './usuario-libro.component';

describe('UsuarioLibroComponent', () => {
  let component: UsuarioLibroComponent;
  let fixture: ComponentFixture<UsuarioLibroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuarioLibroComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsuarioLibroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
