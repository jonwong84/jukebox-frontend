import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagedResult, SongDetails, SongFilters, SongSummary } from '../models';

@Injectable({
  providedIn: 'root',
})
export class SongService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/songs';

  /**
   * Fetch a paginated list of songs matching the provided filters.
   * @param filters Optional filter criteria and pagination options
   * @returns Observable of paginated song summaries
   */
  getSongs(filters?: SongFilters): Observable<PagedResult<SongSummary>> {
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

    return this.http.get<PagedResult<SongSummary>>(this.apiUrl, { params });
  }

  /**
   * Fetch detailed information for a specific song by ID.
   * @param id The song ID
   * @returns Observable of full song details
   */
  getSongById(id: number): Observable<SongDetails> {
    return this.http.get<SongDetails>(`${this.apiUrl}/${id}`);
  }
}

