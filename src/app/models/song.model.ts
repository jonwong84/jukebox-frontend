export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface SongSummary {
  id: number;
  title: string;
  artist: string;
  album: string;
}

export interface ArtistSummary {
  id: number;
  name: string;
}

export interface AlbumSummary {
  id: number;
  title: string;
  artists: ArtistSummary[];
}

export interface GenreSummary {
  id: number;
  name: string;
  parentGenreId?: number | null;
}

export interface SongDetails {
  id: number;
  title: string;
  artistId: number;
  artist: ArtistSummary;
  albumId?: number | null;
  album?: AlbumSummary | null;
  duration: string;
  genres: GenreSummary[];
  trackNumber?: number | null;
  bpm?: number | null;
  lyrics: string;
}

export interface SongFilters {
  artistId?: number;
  albumId?: number;
  genreId?: number;
  minBpm?: number;
  maxBpm?: number;
  titleSearch?: string;
  pageNumber?: number;
  pageSize?: number;
  [key: string]: string | number | boolean | readonly (string | number | boolean)[] | undefined;
}

