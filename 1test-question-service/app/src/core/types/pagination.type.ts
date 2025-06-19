export type PaginationInput = {
  limit?: number;
  offset?: number;
};

export type PaginationMetadataV1 = {
  limit: number;
  offset?: number;
  previousOffset?: number;
};

export type PaginationMetadataV2 = {
  limit: number;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  nextPage: number;
  previousPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginationOutput<
  T,
  Metadata extends PaginationMetadataV1 | PaginationMetadataV2,
> = {
  data: T[];
  metadata: Metadata;
};
