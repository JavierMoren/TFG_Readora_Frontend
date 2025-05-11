import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleAutorComponent } from './detalle-autor.component';

describe('DetalleAutorComponent', () => {
  let component: DetalleAutorComponent;
  let fixture: ComponentFixture<DetalleAutorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleAutorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetalleAutorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
