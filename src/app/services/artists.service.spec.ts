import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ArtistsService } from './artists.service';
import { ArtistSummary, PagedResult } from '../models';

describe('ArtistsService', () => {
  let service: ArtistsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ArtistsService,
      ],
    });

    service = TestBed.inject(ArtistsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getArtists', () => {
    it('should call GET /api/artists without params when no filters are provided', () => {
      const mockResult: PagedResult<ArtistSummary> = {
        items: [
          { id: 1, name: 'Radiohead' },
          { id: 2, name: 'Portishead' },
        ],
        totalCount: 2,
        page: 1,
        pageSize: 20,
      };

      service.getArtists().subscribe((result) => {
        expect(result).toEqual(mockResult);
      });

      const req = httpMock.expectOne('/api/artists');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockResult);
    });

    it('should call GET /api/artists with query params when filters are provided', () => {
      const mockResult: PagedResult<ArtistSummary> = {
        items: [{ id: 1, name: 'Radiohead' }],
        totalCount: 1,
        page: 1,
        pageSize: 10,
      };

      service
        .getArtists({ nameSearch: 'Radio', pageNumber: 1, pageSize: 10 })
        .subscribe((result) => {
          expect(result).toEqual(mockResult);
        });

      const req = httpMock.expectOne((r) => {
        return (
          r.url === '/api/artists' &&
          r.params.get('nameSearch') === 'Radio' &&
          r.params.get('pageNumber') === '1' &&
          r.params.get('pageSize') === '10'
        );
      });

      expect(req.request.method).toBe('GET');
      req.flush(mockResult);
    });
  });
});

