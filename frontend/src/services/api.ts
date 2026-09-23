import type { AnalysisHistoryItem } from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * Fichier retourné par le backend
 */
export interface BackendUploadedFile {
  id: string;
  name: string;
  size: string;
  sizeBytes: number;
  format: string;
  rowCount: number;
  uploadDate: string;
}

export interface UploadResponse {
  files: BackendUploadedFile[];
  records: any[];
  warnings: string[];
}

export interface AnalysisRunResponse {
  history: any;
  matches: any[];
}

/**
 * Récupérer tous les fichiers enregistrés dans PostgreSQL
 */
export async function getFiles(): Promise<BackendUploadedFile[]> {
  const response = await fetch(`${API_BASE_URL}/api/files`);

  if (!response.ok) {
    throw new Error(
      `Erreur lors du chargement des fichiers : ${response.status}`
    );
  }

  return await response.json();
}

/**
 * Envoyer un fichier au backend
 */
export async function uploadFiles(
  files: File[] | FileList
): Promise<UploadResponse> {
  const formData = new FormData();

  const fileArray = Array.from(files as File[]);

  for (const f of fileArray) {
    formData.append('files', f);
  }

  const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Erreur lors de l'import : ${response.status}`);
  }

  return await response.json();
}

export async function runAnalysis(
  fileIds: string[]
): Promise<AnalysisRunResponse> {
  const payload = { file_ids: fileIds };

  const response = await fetch(`${API_BASE_URL}/api/analysis/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Erreur analyse : ${response.status}`);
  }

  return await response.json();
}

export async function getResults(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/api/analysis/results`);
  if (!response.ok) throw new Error(`Erreur récupération résultats: ${response.status}`);
  return await response.json();
}

export async function listRecords(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/api/records`);
  if (!response.ok) throw new Error(`Erreur récupération enregistrements: ${response.status}`);
  return await response.json();
}

export async function listHistory(): Promise<AnalysisHistoryItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/history`);
  if (!response.ok) throw new Error(`Erreur récupération historique: ${response.status}`);
  return await response.json();
}

/**
 * Arbitration: post decision for a match
 */
export async function arbitrate(matchId: string, decision: 'confirmed' | 'rejected') {
  const response = await fetch(`${API_BASE_URL}/api/arbitration/${encodeURIComponent(matchId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision }),
  });

  if (!response.ok) {
    const txt = await response.text();
    // Throw structured error so caller can inspect status
    throw { status: response.status, text: txt || `Erreur arbitrage: ${response.status}` };
  }

  return await response.json();
}

export async function resetArbitration(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/api/arbitration/reset`, {
    method: 'POST',
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(txt || `Erreur reset arbitrage: ${response.status}`);
  }

  return await response.json();
}

export async function getDashboardStats(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/stats/dashboard`);
  if (!response.ok) throw new Error(`Erreur récupération stats: ${response.status}`);
  return await response.json();
}

/**
 * Supprimer un fichier du backend et de PostgreSQL
 */
export async function deleteFile(fileId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/files/${encodeURIComponent(fileId)}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      errorText || `Erreur lors de la suppression : ${response.status}`
    );
  }
}