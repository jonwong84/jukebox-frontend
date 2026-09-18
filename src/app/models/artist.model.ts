export interface ArtistFilters {
  nameSearch?: string;
  pageNumber?: number;
  pageSize?: number;
  [key: string]: string | number | boolean | readonly (string | number | boolean)[] | undefined;
}

