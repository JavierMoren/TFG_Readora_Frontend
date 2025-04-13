import { TestBed } from '@angular/core/testing';

import { UsuarioLibroService } from './usuario-libro.service';

describe('UsuarioLibroService', () => {
  let service: UsuarioLibroService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UsuarioLibroService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
