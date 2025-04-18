import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelAdministradorComponent } from './panel-administrador.component';

describe('PanelAdministradorComponent', () => {
  let component: PanelAdministradorComponent;
  let fixture: ComponentFixture<PanelAdministradorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelAdministradorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelAdministradorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
