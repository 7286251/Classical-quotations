export enum ViewState {
  LIBRARY = 'LIBRARY',
  CREATE = 'CREATE'
}

export type Category = 
  | '全部'
  | '房贷·生存'
  | '职场·内卷'
  | '婚姻·情感'
  | '人性·现实'
  | '孤独·崩溃'
  | '金钱·阶层'
  | '摆烂·躺平';

export interface Quote {
  id: number;
  text: string;
  category: Category;
  author?: string; // Defaults to '大承活法'
}

export interface AnalysisResult {
  transcription: string;
  generatedQuotes: string[];
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}