import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { GoogleBooksService } from './google-books.service';
import { environment } from '../../../enviroments/enviroments';

describe('GoogleBooksService', () => {
  let service: GoogleBooksService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GoogleBooksService]
    });
    service = TestBed.inject(GoogleBooksService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('searchBooks', () => {
    it('should make a GET request to search books', () => {
      const mockResponse = {
        items: [{ id: '1', volumeInfo: { title: 'Test Book' } }]
      };
      const query = 'test query';

      service.searchBooks(query).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpTestingController.expectOne(
        `${environment.apiUrl}/books/google/search?query=${encodeURIComponent(query)}`
      );
      expect(req.request.method).toEqual('GET');
      req.flush(mockResponse);
    });

    it('should include maxResults parameter when provided', () => {
      const mockResponse = {
        items: [{ id: '1', volumeInfo: { title: 'Test Book' } }]
      };
      const query = 'test query';
      const maxResults = 20;

      service.searchBooks(query, maxResults).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpTestingController.expectOne(
        `${environment.apiUrl}/books/google/search?query=${encodeURIComponent(query)}&maxResults=${maxResults}`
      );
      expect(req.request.method).toEqual('GET');
      req.flush(mockResponse);
    });
  });

  describe('importBook', () => {
    it('should make a POST request to import a book', () => {
      const mockResponse = { id: 1, titulo: 'Imported Book' };
      const googleBookId = 'abc123';

      service.importBook(googleBookId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpTestingController.expectOne(
        `${environment.apiUrl}/books/google/import/${googleBookId}`
      );
      expect(req.request.method).toEqual('POST');
      req.flush(mockResponse);
    });
  });
});
