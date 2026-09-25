import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ɵresolveComponentResources } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Subject, of, throwError } from 'rxjs';
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

  const templateString = `
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
      } @else if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
          <button type="button" class="retry-button" (click)="retry()">Try again</button>
        </div>
      } @else if (artists().length === 0) {
        <p class="empty-state">No artists found.</p>
      } @else {
        <ul class="artists-list">
          @for (artist of artists(); track artist.id) {
            <li class="artist-item">
              {{ artist.name }}
            </li>
          }
        </ul>

        @if (totalPages() > 1) {
          <div class="pagination-controls">
            <button
              type="button"
              class="page-button prev-btn"
              [disabled]="currentPage() <= 1 || loading()"
              (click)="prevPage()"
            >
              Previous
            </button>
            <span class="page-info">
              Page {{ currentPage() }} of {{ totalPages() }} ({{ totalCount() }} artists)
            </span>
            <button
              type="button"
              class="page-button next-btn"
              [disabled]="currentPage() >= totalPages() || loading()"
              (click)="nextPage()"
            >
              Next
            </button>
          </div>
        }
      }
    </div>
  `;

  beforeEach(async () => {
    mockArtistsService = {
      getArtists: vi.fn().mockReturnValue(of(mockArtistsResult)),
    };

    await ɵresolveComponentResources(async (url) => {
      if (url.includes('artists-list.html')) {
        return templateString;
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

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial Load', () => {
    it('should fetch artists and render them on initialization', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockArtistsService.getArtists).toHaveBeenCalledWith({
        pageNumber: 1,
        pageSize: 20,
      });
      expect(component.artists()).toEqual(mockArtistsResult.items);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();

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
  });

  describe('Issue 1: Debounce & SwitchMap Search Behavior', () => {
    it('should cancel the active request and clear old results as soon as the search changes', () => {
      vi.useFakeTimers();
      const pending = new Subject<PagedResult<ArtistSummary>>();
      mockArtistsService.getArtists
        .mockReturnValueOnce(of(mockArtistsResult))
        .mockReturnValueOnce(pending.asObservable());

      fixture.detectChanges();
      component.onSearchChange('First');
      vi.advanceTimersByTime(300);
      expect(pending.observed).toBe(true);

      component.onSearchChange('Second');

      expect(pending.observed).toBe(false);
      expect(component.artists()).toEqual([]);
      expect(component.totalCount()).toBe(0);
      expect(component.loading()).toBe(true);
      expect(mockArtistsService.getArtists).toHaveBeenCalledTimes(2);

      pending.next(mockArtistsResult);
      fixture.detectChanges();
      expect(component.artists()).toEqual([]);
      expect(fixture.nativeElement.querySelector('.loading-state')).toBeTruthy();
    });

    it('should debounce rapid keystrokes and only query with the final search term', () => {
      vi.useFakeTimers();

      fixture.detectChanges();
      expect(mockArtistsService.getArtists).toHaveBeenCalledTimes(1);

      // Rapidly simulate keystrokes
      component.onSearchChange('R');
      vi.advanceTimersByTime(100);
      component.onSearchChange('Ra');
      vi.advanceTimersByTime(100);
      component.onSearchChange('Rad');
      vi.advanceTimersByTime(100);
      component.onSearchChange('Radio');

      // Before 300ms debounce elapses, no new call should be made
      vi.advanceTimersByTime(200);
      expect(mockArtistsService.getArtists).toHaveBeenCalledTimes(1);

      // Complete the debounce window
      vi.advanceTimersByTime(100);
      expect(mockArtistsService.getArtists).toHaveBeenCalledTimes(2);
      expect(mockArtistsService.getArtists).toHaveBeenLastCalledWith({
        nameSearch: 'Radio',
        pageNumber: 1,
        pageSize: 20,
      });
    });

    it('should fetch when the query returns to the last requested value during debounce', () => {
      vi.useFakeTimers();
      fixture.detectChanges();

      component.onSearchChange('Radio');
      vi.advanceTimersByTime(300);
      component.onSearchChange('Other');
      component.onSearchChange('Radio');
      vi.advanceTimersByTime(300);

      expect(mockArtistsService.getArtists).toHaveBeenCalledTimes(3);
      expect(component.loading()).toBe(false);
      expect(component.artists()).toEqual(mockArtistsResult.items);
    });

    it('should cancel in-flight older requests and never overwrite with stale responses', () => {
      vi.useFakeTimers();

      const subject1 = new Subject<PagedResult<ArtistSummary>>();
      const subject2 = new Subject<PagedResult<ArtistSummary>>();

      mockArtistsService.getArtists
        .mockReturnValueOnce(of(mockArtistsResult))
        .mockReturnValueOnce(subject1.asObservable())
        .mockReturnValueOnce(subject2.asObservable());

      fixture.detectChanges();

      // Trigger first search
      component.onSearchChange('FirstSearch');
      vi.advanceTimersByTime(300);
      expect(component.loading()).toBe(true);

      // Trigger second search before first resolves
      component.onSearchChange('SecondSearch');
      vi.advanceTimersByTime(300);

      // Now resolve second search first
      const secondResult: PagedResult<ArtistSummary> = {
        items: [{ id: 99, name: 'Second Search Result' }],
        totalCount: 1,
        page: 1,
        pageSize: 20,
      };
      subject2.next(secondResult);
      subject2.complete();
      fixture.detectChanges();

      expect(component.artists()).toEqual(secondResult.items);

      // Now if older in-flight request resolves afterwards, it must NOT overwrite state
      const firstStaleResult: PagedResult<ArtistSummary> = {
        items: [{ id: 88, name: 'Stale First Result' }],
        totalCount: 1,
        page: 1,
        pageSize: 20,
      };
      subject1.next(firstStaleResult);
      subject1.complete();
      fixture.detectChanges();

      expect(component.artists()).toEqual(secondResult.items);
      expect(component.artists()[0].name).toBe('Second Search Result');
    });
  });

  describe('Issue 2: Pagination', () => {
    const multiPageResult: PagedResult<ArtistSummary> = {
      items: [{ id: 1, name: 'Radiohead' }],
      totalCount: 45,
      page: 1,
      pageSize: 20,
    };

    beforeEach(async () => {
      mockArtistsService.getArtists.mockReturnValue(of(multiPageResult));
    });

    it('should compute totalPages correctly and render pagination controls', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.totalPages()).toBe(3); // 45 / 20 = 2.25 -> 3 pages
      const compiled = fixture.nativeElement as HTMLElement;
      const pagination = compiled.querySelector('.pagination-controls');
      expect(pagination).toBeTruthy();
      expect(pagination?.textContent).toContain('Page 1 of 3 (45 artists)');
    });

    it('should disable Previous button on page 1', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const compiled = fixture.nativeElement as HTMLElement;
      const prevBtn = compiled.querySelector('.prev-btn') as HTMLButtonElement;
      expect(prevBtn.disabled).toBe(true);
    });

    it('should navigate to page 2 when clicking Next', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      component.nextPage();
      fixture.detectChanges();

      expect(component.currentPage()).toBe(2);
      expect(mockArtistsService.getArtists).toHaveBeenLastCalledWith({
        pageNumber: 2,
        pageSize: 20,
      });
    });

    it('should navigate to page 1 when clicking Previous from page 2', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      component.nextPage();
      fixture.detectChanges();
      expect(component.currentPage()).toBe(2);

      component.prevPage();
      fixture.detectChanges();
      expect(component.currentPage()).toBe(1);
      expect(mockArtistsService.getArtists).toHaveBeenLastCalledWith({
        pageNumber: 1,
        pageSize: 20,
      });
    });

    it('should disable Next button on the last page', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      component.nextPage(); // Page 2
      fixture.detectChanges();
      component.nextPage(); // Page 3 (last page)
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.currentPage()).toBe(3);
      const compiled = fixture.nativeElement as HTMLElement;
      const nextBtn = compiled.querySelector('.next-btn') as HTMLButtonElement;
      expect(nextBtn.disabled).toBe(true);
    });

    it('should reset currentPage to 1 when search query changes', () => {
      vi.useFakeTimers();

      fixture.detectChanges();

      component.nextPage(); // Go to page 2
      expect(component.currentPage()).toBe(2);

      // Search query changes
      component.onSearchChange('Radio');
      vi.advanceTimersByTime(300); // Debounce

      expect(component.currentPage()).toBe(1);
      expect(mockArtistsService.getArtists).toHaveBeenLastCalledWith({
        nameSearch: 'Radio',
        pageNumber: 1,
        pageSize: 20,
      });
    });
  });

  describe('Issue 3: Error Handling & Retry', () => {
    it('should display distinct error state on initial load failure without showing empty state', async () => {
      mockArtistsService.getArtists.mockReturnValue(throwError(() => new Error('Server Error')));

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.error()).toBe('Failed to load artists. Please try again.');
      expect(component.loading()).toBe(false);

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.error-state')).toBeTruthy();
      expect(compiled.querySelector('.error-state')?.textContent).toContain('Failed to load artists. Please try again.');
      expect(compiled.querySelector('.empty-state')).toBeNull();
      expect(compiled.querySelector('.retry-button')).toBeTruthy();
    });

    it('should clear previous results and show error state on subsequent search failure', () => {
      vi.useFakeTimers();

      // First search succeeds
      fixture.detectChanges();
      expect(component.artists().length).toBe(2);

      // Subsequent search fails
      mockArtistsService.getArtists.mockReturnValueOnce(throwError(() => new Error('Network timeout')));
      component.onSearchChange('FailingQuery');
      vi.advanceTimersByTime(300);
      fixture.detectChanges();

      expect(component.error()).toBe('Failed to load artists. Please try again.');
      expect(component.artists()).toEqual([]);
      expect(component.totalCount()).toBe(0);

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.error-state')).toBeTruthy();
      expect(compiled.querySelectorAll('.artist-item').length).toBe(0);
    });

    it('should retry current fetch when retry button is clicked', async () => {
      mockArtistsService.getArtists
        .mockReturnValueOnce(throwError(() => new Error('Initial fail')))
        .mockReturnValueOnce(of(mockArtistsResult));

      fixture.detectChanges();
      await fixture.whenStable();
      expect(component.error()).toBeTruthy();

      component.retry();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.error()).toBeNull();
      expect(component.artists()).toEqual(mockArtistsResult.items);
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelectorAll('.artist-item').length).toBe(2);
    });

    it('should keep subscription alive after an error so subsequent searches continue to work', () => {
      vi.useFakeTimers();

      fixture.detectChanges();

      // First query fails
      mockArtistsService.getArtists.mockReturnValueOnce(throwError(() => new Error('Search failed')));
      component.onSearchChange('BadQuery');
      vi.advanceTimersByTime(300);
      fixture.detectChanges();
      expect(component.error()).toBeTruthy();

      // Subsequent query succeeds
      mockArtistsService.getArtists.mockReturnValueOnce(of(mockArtistsResult));
      component.onSearchChange('GoodQuery');
      vi.advanceTimersByTime(300);
      fixture.detectChanges();

      expect(component.error()).toBeNull();
      expect(component.artists()).toEqual(mockArtistsResult.items);
      expect(component.loading()).toBe(false);
    });
  });
});
