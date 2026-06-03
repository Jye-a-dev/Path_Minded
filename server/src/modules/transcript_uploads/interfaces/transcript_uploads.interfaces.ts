export type TranscriptUploadEntity = {
  id: string;
  student_id: string;
  raw_text: string;
  source_type: 'PASTE' | 'FILE';
  parse_status: 'PENDING' | 'SUCCESS' | 'FAILED';
  parse_error: string | null;
  parsed_json: any | null;
  uploaded_at: Date;
  parsed_at: Date | null;
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
