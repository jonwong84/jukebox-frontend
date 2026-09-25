import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { ArtistsService } from '../services';
import { ArtistFilters, ArtistSummary } from '../models';

@Component({
  selector: 'app-artists-list',
  imports: [FormsModule],
  templateUrl: './artists-list.html',
  styleUrl: './artists-list.css',
})
export class ArtistsList implements OnInit {
  private readonly artistsService = inject(ArtistsService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly searchInput$ = new Subject<string>();
  private readonly fetchTrigger$ = new Subject<{ query: string; page: number }>();

  readonly artists = signal<ArtistSummary[]>([]);
  readonly search = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(20);
  readonly totalCount = signal<number>(0);
  readonly totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()) || 1);

  constructor() {
    this.searchInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((query) => {
        this.currentPage.set(1);
        this.fetchTrigger$.next({ query, page: 1 });
      });

    this.fetchTrigger$
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(({ query, page }) => {
          const trimmed = query.trim();
          const filters: ArtistFilters = {
            ...(trimmed ? { nameSearch: trimmed } : {}),
            pageNumber: page,
            pageSize: this.pageSize(),
          };

          return this.artistsService.getArtists(filters).pipe(
            catchError(() => {
              this.error.set('Failed to load artists. Please try again.');
              this.artists.set([]);
              this.totalCount.set(0);
              this.loading.set(false);
              return of(null);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((result) => {
        if (result) {
          this.artists.set(result.items);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
        }
      });
  }

  ngOnInit(): void {
    this.fetchTrigger$.next({ query: this.search(), page: this.currentPage() });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.searchInput$.next(value);
  }

  prevPage(): void {
    if (this.currentPage() > 1 && !this.loading()) {
      const newPage = this.currentPage() - 1;
      this.currentPage.set(newPage);
      this.fetchTrigger$.next({ query: this.search(), page: newPage });
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() && !this.loading()) {
      const newPage = this.currentPage() + 1;
      this.currentPage.set(newPage);
      this.fetchTrigger$.next({ query: this.search(), page: newPage });
    }
  }

  retry(): void {
    this.fetchTrigger$.next({ query: this.search(), page: this.currentPage() });
  }
}
