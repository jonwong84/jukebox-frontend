import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SongService } from './song.service';
import { PagedResult, SongDetails, SongSummary } from '../models';

describe('SongService', () => {
  let service: SongService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SongService,
      ],
    });

    service = TestBed.inject(SongService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSongs', () => {
    it('should call GET /api/songs without params when no filters are provided', () => {
      const mockResult: PagedResult<SongSummary> = {
        items: [
          {
            id: 1,
            title: 'Karma Police',
            artist: 'Radiohead',
            album: 'OK Computer',
          },
        ],
        totalCount: 1,
        page: 1,
        pageSize: 10,
      };

      service.getSongs().subscribe((result) => {
        expect(result).toEqual(mockResult);
      });

      const req = httpMock.expectOne('/api/songs');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockResult);
    });

    it('should call GET /api/songs with query params when filters are provided', () => {
      const mockResult: PagedResult<SongSummary> = {
        items: [
          {
            id: 1,
            title: 'Karma Police',
            artist: 'Radiohead',
            album: 'OK Computer',
          },
        ],
        totalCount: 1,
        page: 1,
        pageSize: 10,
      };

      service
        .getSongs({ titleSearch: 'Karma', pageNumber: 1, pageSize: 10, artistId: 2 })
        .subscribe((result) => {
          expect(result).toEqual(mockResult);
        });

      const req = httpMock.expectOne((r) => {
        return (
          r.url === '/api/songs' &&
          r.params.get('titleSearch') === 'Karma' &&
          r.params.get('pageNumber') === '1' &&
          r.params.get('pageSize') === '10' &&
          r.params.get('artistId') === '2'
        );
      });

      expect(req.request.method).toBe('GET');
      req.flush(mockResult);
    });
  });

  describe('getSongById', () => {
    it('should call GET /api/songs/{id} and return full song details', () => {
      const mockSong: SongDetails = {
        id: 1,
        title: 'Karma Police',
        artistId: 1,
        artist: {
          id: 1,
          name: 'Radiohead',
        },
        albumId: 1,
        album: {
          id: 1,
          title: 'OK Computer',
          artists: [
            {
              id: 1,
              name: 'Radiohead',
            },
          ],
        },
        duration: '00:04:21',
        genres: [
          {
            id: 2,
            name: 'Alternative Rock',
            parentGenreId: 1,
          },
        ],
        trackNumber: 4,
        bpm: 76,
        lyrics: 'Arrest this man, he talks in maths...',
      };

      service.getSongById(1).subscribe((result) => {
        expect(result).toEqual(mockSong);
      });

      const req = httpMock.expectOne('/api/songs/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockSong);
    });
  });
});

