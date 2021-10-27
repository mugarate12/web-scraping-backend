export interface downDetectorData {
  x: string,
  y: number
}

export interface downDetectorSearchResult {
  name: string;
  title: string;
  status: string;
  baseline: downDetectorData[];
  reports: downDetectorData[];
  url: string;
}