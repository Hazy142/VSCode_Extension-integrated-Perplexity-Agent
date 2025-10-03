export interface Source {
  url: string;
  title: string;
  snippet: string;
}

export interface SearchResult {
  answer: string;
  sources: Source[];
  followUpQuestions: string[];
}
