import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ArtistsService } from '../services';
import { ArtistSummary } from '../models';

@Component({
  selector: 'app-artists-list',
  imports: [FormsModule],
  templateUrl: './artists-list.html',
  styleUrl: './artists-list.css',
})
export class ArtistsList implements OnInit {
  private readonly artistsService = inject(ArtistsService);

  readonly artists = signal<ArtistSummary[]>([]);
  readonly search = signal('');
  readonly loading = signal(false);

  ngOnInit(): void {
    this.fetchArtists();
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.fetchArtists();
  }

  fetchArtists(): void {
    this.loading.set(true);
    const nameSearch = this.search().trim();
    const filters = nameSearch ? { nameSearch } : undefined;

    this.artistsService.getArtists(filters).subscribe({
      next: (result) => {
        this.artists.set(result.items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}

