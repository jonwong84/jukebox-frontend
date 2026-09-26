import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ArtistFilters, ArtistSummary, PagedResult } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ArtistsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/artists';

  /**
   * Fetch a paginated list of artists matching the provided filters.
   * @param filters Optional filter criteria and pagination options
   * @returns Observable of paginated artist summaries
   */
  getArtists(filters?: ArtistFilters): Observable<PagedResult<ArtistSummary>> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => {
              if (v !== undefined && v !== null) {
                params = params.append(key, v.toString());
              }
            });
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<PagedResult<ArtistSummary>>(this.apiUrl, { params });
  }
}

