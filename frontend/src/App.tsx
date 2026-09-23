import React, { useEffect, useState } from 'react';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ImportFilesView } from './components/ImportFilesView';
import { DataPreviewView } from './components/DataPreviewView';
import { ResultsView } from './components/ResultsView';
import { ArbitrationView } from './components/ArbitrationView';
import { StatisticsView } from './components/StatisticsView';
import { HistoryView } from './components/HistoryView';
import { AnalysisModal } from './components/AnalysisModal';
import { MatchDetailModal } from './components/MatchDetailModal';

import {
  ActiveTab,
  UploadedFile,
  DataRecord,
  MatchPair,
  AnalysisHistoryItem,
} from './types';

import {
  INITIAL_RECORDS,
  INITIAL_MATCH_PAIRS,
} from './data/mockData';

import {
  getFiles,
  deleteFile,
  arbitrate,
  resetArbitration,
  getDashboardStats,
  getResults,
} from './services/api';
import { listRecords, listHistory } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] =
    useState<ActiveTab>('dashboard');

  // Les fichiers viennent maintenant du backend
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const [records, setRecords] =
    useState<DataRecord[]>(INITIAL_RECORDS);

  const [matches, setMatches] =
    useState<MatchPair[]>(INITIAL_MATCH_PAIRS);

  const [historyItems, setHistoryItems] =
    useState<AnalysisHistoryItem[]>([]);

  const [isAnalysisModalOpen, setIsAnalysisModalOpen] =
    useState(false);

  const refreshHistoryFromBackend = async () => {
    try {
      const backendHistory = await listHistory();
      setHistoryItems((backendHistory || []) as AnalysisHistoryItem[]);
    } catch (err) {
      console.warn('Impossible de recharger l\'historique depuis le backend :', err);
    }
  };

  const [selectedMatchForDetail, setSelectedMatchForDetail] =
    useState<MatchPair | null>(null);

  const [isLoadingFiles, setIsLoadingFiles] =
    useState(true);

  const refreshMatchesFromBackend = async () => {
    try {
      const backendMatches = await getResults();
      setMatches((backendMatches || []) as MatchPair[]);
    } catch (error) {
      console.warn('Impossible de recharger les matches depuis le backend :', error);
    }
  };

  /*
   * Charger les fichiers depuis le backend
   * au démarrage de l'application.
   *
   * Cela permet de conserver les fichiers
   * après un actualisation de la page.
   */
  useEffect(() => {
    const loadFiles = async () => {
      try {
        setIsLoadingFiles(true);

        const backendFiles = await getFiles();

        setFiles(backendFiles as UploadedFile[]);

        // Charger les enregistrements depuis le backend si présents
        try {
          const backendRecords = await listRecords();
          setRecords(backendRecords as any);
        } catch (err) {
          console.warn('Impossible de charger les enregistrements:', err);
        }

        // Charger les résultats depuis le backend pour les cas d'arbitrage
        try {
          await refreshMatchesFromBackend();
        } catch (err) {
          console.warn('Impossible de charger les résultats backend:', err);
        }

        // Charger l'historique depuis PostgreSQL
        await refreshHistoryFromBackend();
      } catch (error) {
        console.error(
          'Erreur lors du chargement des fichiers :',
          error
        );
      } finally {
        setIsLoadingFiles(false);
      }
    };

    loadFiles();
  }, []);

  /*
   * Nombre de cas nécessitant une arbitration
   */
  const pendingArbitrationCount = matches.filter(
    (m) => m.status === 'uncertain' && !m.decision
  ).length;

  /*
   * Ajouter les fichiers dans l'état React
   *
    * L'envoi réel au backend sera effectué
    * dans `ImportFilesView` via `uploadFiles()`.
   */
  const handleAddFiles = (
    newFiles: UploadedFile[],
    newRecords?: DataRecord[]
  ) => {
    setFiles((prev) => [...prev, ...newFiles]);

    if (newRecords && newRecords.length > 0) {
      setRecords((prev) => [...prev, ...newRecords]);
    }
  };

  /*
   * Supprimer un fichier
   *
   * Le fichier est d'abord supprimé du backend,
   * puis retiré de l'interface.
   */
  const handleRemoveFile = async (fileId: string) => {
    try {
      await deleteFile(fileId);

      const fileToRemove = files.find(
        (f) => f.id === fileId
      );

      setFiles((prev) =>
        prev.filter((f) => f.id !== fileId)
      );

      if (fileToRemove) {
        setRecords((prev) =>
          prev.filter(
            (r) => r.sourceFile !== fileToRemove.name
          )
        );
      }
    } catch (error) {
      console.error(
        'Erreur lors de la suppression du fichier :',
        error
      );

      alert(
        'Impossible de supprimer le fichier.'
      );
    }
  };

  /*
   * Réinitialiser les données de démonstration
   */
  const handleResetToDemo = () => {
    setRecords(INITIAL_RECORDS);
    setMatches(INITIAL_MATCH_PAIRS);
  };

  /*
   * Gestion de l'arbitrage humain
   */
  const handleArbitrate = async (
    matchId: string,
    decision: 'confirmed' | 'rejected'
  ) => {
    try {
      const updated = await arbitrate(matchId, decision);

      setMatches((prev) => {
        const exists = prev.some((m) => m.id === updated.id);

        if (!exists) {
          return [updated as MatchPair, ...prev];
        }

        return prev.map((m) => (m.id === updated.id ? (updated as MatchPair) : m));
      });

      if (selectedMatchForDetail && selectedMatchForDetail.id === matchId) {
        setSelectedMatchForDetail(updated as MatchPair);
      }

      await refreshMatchesFromBackend();
    } catch (err: any) {
      console.error('Erreur lors de l\'arbitrage :', err);

      if (err && err.status === 404) {
        try {
          const serverResults = await getResults();
          const local = matches.find((m) => m.id === matchId);

          if (local) {
            const candidate = (serverResults || []).find((s: any) => {
              const a1 = s.recordA?.id;
              const b1 = s.recordB?.id;
              const a2 = local.recordA?.id;
              const b2 = local.recordB?.id;

              return (
                (a1 === a2 && b1 === b2) ||
                (a1 === b2 && b1 === a2)
              );
            });

            if (candidate) {
              const retried = await arbitrate(candidate.id, decision);

              setMatches((prev) => {
                const exists = prev.some((m) => m.id === retried.id);
                if (!exists) {
                  return [retried as MatchPair, ...prev];
                }
                return prev.map((m) => (m.id === retried.id ? (retried as MatchPair) : m));
              });

              if (selectedMatchForDetail && selectedMatchForDetail.id === matchId) {
                setSelectedMatchForDetail(retried as MatchPair);
              }

              await refreshMatchesFromBackend();
              return;
            }
          }

          alert('Aucune correspondance serveur trouvée — lancez une analyse pour générer les correspondances puis réessayez.');
          return;
        } catch (inner) {
          console.error('Erreur lors du retry arbitrage:', inner);
          alert('Impossible d\'enregistrer la décision.');
          return;
        }
      }

      const message = err?.text || 'Impossible d\'enregistrer la décision.';
      alert(message);
    }
  };

  /*
   * Réinitialiser toutes les arbitrations
   */
  const handleResetArbitration = async () => {
    try {
      const updated = await resetArbitration();

      setMatches((prev) => {
        const updatedMap = new Map((updated || []).map((m: any) => [m.id, m]));
        return prev.map((m) => updatedMap.get(m.id) || m);
      });

      await refreshMatchesFromBackend();
    } catch (err) {
      console.error('Erreur reset arbitrage :', err);
      alert('Impossible de réinitialiser les arbitrages.');
    }
  };

  /*
   * Ouvrir la fenêtre d'analyse
   */
  const handleStartAnalysis = () => {
    setIsAnalysisModalOpen(true);
  };

  /*
   * Fin de l'analyse
   */
  const handleAnalysisComplete = () => {
    setIsAnalysisModalOpen(false);
    setActiveTab('results');
  };

  const handleRunComplete = async (resp: any) => {
    if (resp?.matches) {
      setMatches(resp.matches as any[]);
    }

    if (resp?.history) {
      await refreshHistoryFromBackend();
    }
  };

  /*
   * Recharger une analyse depuis l'historique
   */
  const handleReloadHistory = (
    item: AnalysisHistoryItem
  ) => {
    setActiveTab('results');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#111111] font-sans text-[#E4E9E1] antialiased">

      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingArbitrationCount={
          pendingArbitrationCount
        }
        totalFilesCount={files.length}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onStartAnalysis={handleStartAnalysis}
          totalRecordsCount={records.length}
          totalFilesCount={files.length}
        />

        <main className="flex-1 overflow-y-auto p-6 sm:p-8">

          <div className="max-w-7xl mx-auto">

            {/* Dashboard */}
            {activeTab === 'dashboard' && (
              <DashboardView
                files={files}
                records={records}
                matches={matches}
                setActiveTab={setActiveTab}
                onStartAnalysis={
                  handleStartAnalysis
                }
                onOpenMatchDetails={(match) =>
                  setSelectedMatchForDetail(match)
                }
              />
            )}

            {/* Import */}
            {activeTab === 'import' && (
              <ImportFilesView
                files={files}
                onAddFiles={handleAddFiles}
                onRemoveFile={handleRemoveFile}
                onGoToDataPreview={() =>
                  setActiveTab('data')
                }
                onResetToDemo={handleResetToDemo}
              />
            )}

            {/* Data Preview */}
            {activeTab === 'data' && (
              <DataPreviewView
                records={records}
                files={files}
                onStartAnalysis={
                  handleStartAnalysis
                }
              />
            )}

            {/* Results */}
            {activeTab === 'results' && (
              <ResultsView
                matches={matches}
                onOpenDetails={(match) =>
                  setSelectedMatchForDetail(match)
                }
                onGoToArbitration={() =>
                  setActiveTab('arbitration')
                }
              />
            )}

            {/* Arbitration */}
            {activeTab === 'arbitration' && (
              <ArbitrationView
                matches={matches}
                onArbitrate={handleArbitrate}
                onResetArbitration={
                  handleResetArbitration
                }
              />
            )}

            {/* Statistics */}
            {activeTab === 'stats' && (
              <StatisticsView
                totalRecordsCount={records.length}
                matches={matches}
                files={files}
              />
            )}

            {/* History */}
            {activeTab === 'history' && (
              <HistoryView
                historyItems={historyItems}
                onReloadAnalysis={
                  handleReloadHistory
                }
              />
            )}

          </div>

        </main>

      </div>

      {/* Analysis modal */}
      <AnalysisModal
        isOpen={isAnalysisModalOpen}
        totalRecords={
          records.length > 0
            ? records.length
            : 1045
        }
        onComplete={handleAnalysisComplete}
        onClose={() => setIsAnalysisModalOpen(false)}
        fileIds={files.map((f) => f.id)}
        onRunComplete={handleRunComplete}
      />

      {/* Match details modal */}
      <MatchDetailModal
        match={selectedMatchForDetail}
        onClose={() =>
          setSelectedMatchForDetail(null)
        }
        onArbitrate={handleArbitrate}
      />

    </div>
  );
}