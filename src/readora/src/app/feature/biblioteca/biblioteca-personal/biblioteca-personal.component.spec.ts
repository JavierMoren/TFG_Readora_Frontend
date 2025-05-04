import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BibliotecaPersonalComponent } from './biblioteca-personal.component';

describe('BibliotecaPersonalComponent', () => {
  let component: BibliotecaPersonalComponent;
  let fixture: ComponentFixture<BibliotecaPersonalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BibliotecaPersonalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BibliotecaPersonalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
