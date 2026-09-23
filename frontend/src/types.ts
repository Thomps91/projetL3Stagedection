export interface DataRecord {
  id: string;
  nom: string;
  prenom?: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
  sourceFile: string;
}

export type MatchStatus = 'duplicate' | 'uncertain' | 'different';

export type ArbitrationDecision = 'confirmed' | 'rejected' | null;

export interface FieldComparison {
  field: string;
  label: string;
  valA: string;
  valB: string;
  isMatch: boolean;
  similarity: number; // 0 - 100
}

export interface MatchPair {
  id: string;
  recordA: DataRecord;
  recordB: DataRecord;
  score: number; // 0 - 100
  status: MatchStatus;
  statusLabel: string;
  fieldComparisons: FieldComparison[];
  decision?: ArbitrationDecision;
  decisionDate?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: string; // e.g. "245 Ko"
  sizeBytes: number;
  format: 'CSV' | 'XLSX' | 'XLS';
  rowCount: number;
  uploadDate: string;
}

export interface AnalysisHistoryItem {
  id: string;
  date: string;
  files: string[];
  totalRecords: number;
  duplicatesFound: number;
  uncertainCases: number;
  differentCount: number;
  status: 'Terminé' | 'En cours' | 'Arbitré';
  executionTime: string;
}

export type ActiveTab = 'dashboard' | 'import' | 'data' | 'results' | 'arbitration' | 'stats' | 'history';
