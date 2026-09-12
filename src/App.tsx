import React, { useState } from 'react';
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
  INITIAL_FILES,
  INITIAL_RECORDS,
  INITIAL_MATCH_PAIRS,
  INITIAL_HISTORY,
} from './data/mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [files, setFiles] = useState<UploadedFile[]>(INITIAL_FILES);
  const [records, setRecords] = useState<DataRecord[]>(INITIAL_RECORDS);
  const [matches, setMatches] = useState<MatchPair[]>(INITIAL_MATCH_PAIRS);
  const [historyItems, setHistoryItems] = useState<AnalysisHistoryItem[]>(INITIAL_HISTORY);

  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [selectedMatchForDetail, setSelectedMatchForDetail] = useState<MatchPair | null>(null);

  // Pending arbitration count
  const pendingArbitrationCount = matches.filter(
    (m) => m.status === 'uncertain' && !m.decision
  ).length;

  // Add files
  const handleAddFiles = (newFiles: UploadedFile[], newRecords?: DataRecord[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    if (newRecords && newRecords.length > 0) {
      setRecords((prev) => [...prev, ...newRecords]);
    }
  };

  // Remove file
  const handleRemoveFile = (fileId: string) => {
    const fileToRemove = files.find((f) => f.id === fileId);
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    if (fileToRemove) {
      setRecords((prev) => prev.filter((r) => r.sourceFile !== fileToRemove.name));
    }
  };

  // Reset to demo data
  const handleResetToDemo = () => {
    setFiles(INITIAL_FILES);
    setRecords(INITIAL_RECORDS);
    setMatches(INITIAL_MATCH_PAIRS);
  };

  // Handle human arbitration
  const handleArbitrate = (matchId: string, decision: 'confirmed' | 'rejected') => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id === matchId) {
          return {
            ...m,
            decision,
            decisionDate: new Date().toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            statusLabel:
              decision === 'confirmed'
                ? 'Doublon confirmé (Arbitré)'
                : 'Ressemblance rejetée (Arbitré)',
          };
        }
        return m;
      })
    );

    // Also update selected modal match if open
    if (selectedMatchForDetail && selectedMatchForDetail.id === matchId) {
      setSelectedMatchForDetail((prev) =>
        prev
          ? {
              ...prev,
              decision,
              statusLabel:
                decision === 'confirmed'
                  ? 'Doublon confirmé (Arbitré)'
                  : 'Ressemblance rejetée (Arbitré)',
            }
          : null
      );
    }
  };

  // Reset all arbitrations
  const handleResetArbitration = () => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.status === 'uncertain') {
          return {
            ...m,
            decision: null,
            statusLabel: 'Cas incertain',
          };
        }
        return m;
      })
    );
  };

  // Trigger analysis simulation
  const handleStartAnalysis = () => {
    setIsAnalysisModalOpen(true);
  };

  // Analysis complete -> switch to results view
  const handleAnalysisComplete = () => {
    setIsAnalysisModalOpen(false);
    setActiveTab('results');
  };

  // Reload history item
  const handleReloadHistory = (item: AnalysisHistoryItem) => {
    setActiveTab('results');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#111111] font-sans text-[#E4E9E1] antialiased">
      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingArbitrationCount={pendingArbitrationCount}
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
            {activeTab === 'dashboard' && (
              <DashboardView
                files={files}
                records={records}
                matches={matches}
                setActiveTab={setActiveTab}
                onStartAnalysis={handleStartAnalysis}
                onOpenMatchDetails={(match) => setSelectedMatchForDetail(match)}
              />
            )}

            {activeTab === 'import' && (
              <ImportFilesView
                files={files}
                onAddFiles={handleAddFiles}
                onRemoveFile={handleRemoveFile}
                onGoToDataPreview={() => setActiveTab('data')}
                onResetToDemo={handleResetToDemo}
              />
            )}

            {activeTab === 'data' && (
              <DataPreviewView
                records={records}
                files={files}
                onStartAnalysis={handleStartAnalysis}
              />
            )}

            {activeTab === 'results' && (
              <ResultsView
                matches={matches}
                onOpenDetails={(match) => setSelectedMatchForDetail(match)}
                onGoToArbitration={() => setActiveTab('arbitration')}
              />
            )}

            {activeTab === 'arbitration' && (
              <ArbitrationView
                matches={matches}
                onArbitrate={handleArbitrate}
                onResetArbitration={handleResetArbitration}
              />
            )}

            {activeTab === 'stats' && (
              <StatisticsView
                totalRecordsCount={records.length}
                matches={matches}
                files={files}
              />
            )}

            {activeTab === 'history' && (
              <HistoryView
                historyItems={historyItems}
                onReloadAnalysis={handleReloadHistory}
              />
            )}
          </div>
        </main>
      </div>

      {/* Analysis simulation modal */}
      <AnalysisModal
        isOpen={isAnalysisModalOpen}
        totalRecords={records.length > 0 ? records.length : 1045}
        onComplete={handleAnalysisComplete}
        onClose={() => setIsAnalysisModalOpen(false)}
      />

      {/* Match Details side-by-side modal */}
      <MatchDetailModal
        match={selectedMatchForDetail}
        onClose={() => setSelectedMatchForDetail(null)}
        onArbitrate={handleArbitrate}
      />
    </div>
  );
}
