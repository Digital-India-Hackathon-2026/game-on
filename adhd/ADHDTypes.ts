export interface ADHDReadTimeRequest {
  pageText: string;
}

export interface ADHDReadTimeResponse {
  estimatedMinutes: number;
  wordCount: number;
}

export interface ADHDSummaryRequest {
  pageText: string;
  url?: string;
}

export interface ADHDSummaryResponse {
  tldr: string | null;
  keyPoints: string[];
  error?: string;
}

export interface ADHDChunkRequest {
  pageText: string;
  url?: string;
}

export interface ADHDChunkResponse {
  chunks: string[];
  error?: string;
}

export interface ADHDDeclutterConfig {
  adSelectors: string[];
  popupSelectors: string[];
  autoplaySelectors: string[];
  hideSelectors: string[];
}

export interface ADHDPalette {
  background: string;
  text: string;
  heading: string;
  link: string;
  border: string;
  muted: string;
  focus: string;
}

export interface ADHDBookmark {
  id: string;
  userId: string;
  url: string;
  title?: string;
  scrollPosition: number;
  timestamp: string;
}

export interface ADHDBookmarkCreateRequest {
  url: string;
  title?: string;
  scrollPosition: number;
}

export interface ADHDReadingProgress {
  userId: string;
  url: string;
  scrollPosition: number;
  totalLength?: number;
  percentage?: number;
  timestamp: string;
}

export interface ADHDReadingProgressRequest {
  url: string;
  scrollPosition: number;
  totalLength?: number;
  percentage?: number;
}

export interface ADHDHealthResponse {
  status: string;
  mode: string;
  timestamp: string;
  version: string;
}

export interface ADHDErrorResponse {
  error: {
    code: string;
    message: string;
    request_id?: string;
  };
}