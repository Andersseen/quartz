export interface PaginationConfig {
  page: number;
  pageCount: number;
}

export const DEFAULT_PAGINATION_CONFIG: PaginationConfig = {
  page: 1,
  pageCount: 0,
};
