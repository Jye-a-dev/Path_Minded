export type TranscriptUploadEntity = {
  id: string;
  [key: string]: unknown;
};

export type TranscriptUploadResponse = TranscriptUploadEntity;

export type TranscriptUploadsPaginationResponse = {
  data: TranscriptUploadResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
