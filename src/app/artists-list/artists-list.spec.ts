import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ɵresolveComponentResources } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, Subject } from 'rxjs';
import { ArtistsList } from './artists-list';
import { ArtistsService } from '../services';
import { ArtistSummary, PagedResult } from '../models';

describe('ArtistsList', () => {
  let component: ArtistsList;
  let fixture: ComponentFixture<ArtistsList>;
  let mockArtistsService: {
    getArtists: ReturnType<typeof vi.fn>;
  };

  const mockArtistsResult: PagedResult<ArtistSummary> = {
    items: [
      { id: 1, name: 'Radiohead' },
      { id: 2, name: 'Portishead' },
    ],
    totalCount: 2,
    page: 1,
    pageSize: 20,
  };

  beforeEach(async () => {
    mockArtistsService = {
      getArtists: vi.fn().mockReturnValue(of(mockArtistsResult)),
    };

    await ɵresolveComponentResources(async (url) => {
      if (url.includes('artists-list.html')) {
        return `
          <div class="artists-container">
            <h2>Artists</h2>
            <div class="search-box">
              <input
                type="text"
                placeholder="Search artists by name..."
                [ngModel]="search()"
                (ngModelChange)="onSearchChange($event)"
                aria-label="Search artists"
              />
            </div>
            @if (loading()) {
              <p class="loading-state">Loading artists...</p>
            } @else if (artists().length === 0) {
              <p class="empty-state">No artists found.</p>
            } @else {
              <ul class="artists-list">
                @for (artist of artists(); track artist.id) {
                  <li class="artist-item">{{ artist.name }}</li>
                }
              </ul>
            }
          </div>
        `;
      }
      return '';
    });

    await TestBed.configureTestingModule({
      imports: [ArtistsList],
      providers: [
        { provide: ArtistsService, useValue: mockArtistsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ArtistsList);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch artists and render them on initialization', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockArtistsService.getArtists).toHaveBeenCalledWith(undefined);
    expect(component.artists()).toEqual(mockArtistsResult.items);
    expect(component.loading()).toBe(false);

    const compiled = fixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('.artist-item');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('Radiohead');
    expect(items[1].textContent).toContain('Portishead');
  });

  it('should display empty-state message when no artists are returned', async () => {
    mockArtistsService.getArtists.mockReturnValue(
      of({
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 20,
      })
    );

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.artists()).toEqual([]);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-state')?.textContent).toContain('No artists found.');
  });

  it('should display loading state while request is in flight', () => {
    const pendingSubject = new Subject<PagedResult<ArtistSummary>>();
    mockArtistsService.getArtists.mockReturnValue(pendingSubject.asObservable());

    fixture.detectChanges();

    expect(component.loading()).toBe(true);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loading-state')?.textContent).toContain('Loading artists...');

    pendingSubject.next(mockArtistsResult);
    pendingSubject.complete();
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
  });

  it('should query artists with nameSearch filter on search change', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.onSearchChange('Radio');

    expect(mockArtistsService.getArtists).toHaveBeenCalledWith({ nameSearch: 'Radio' });
  });
});

