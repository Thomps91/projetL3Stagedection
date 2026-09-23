import React from 'react';
import {
  Play,
  Database,
  Layers,
  Sparkles,
  CheckCircle2,
  FolderUp,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onStartAnalysis: () => void;
  totalRecordsCount: number;
  totalFilesCount: number;
}

const TAB_META: Record<ActiveTab, { title: string; description: string }> = {
  dashboard: {
    title: 'Tableau de bord',
    description: 'Vue d’ensemble des fichiers, métriques de rapprochement et doublons détectés.',
  },
  import: {
    title: 'Importer des fichiers',
    description: 'Importez vos bases de données clients, fournisseurs ou contacts (CSV, XLSX, XLS).',
  },
  data: {
    title: 'Voir les données',
    description: 'Explorez, filtrez et prévisualisez tous les enregistrements sources avant rapprochement.',
  },
  results: {
    title: 'Résultats du rapprochement',
    description: 'Paires d’enregistrements comparées avec calcul des indices de ressemblance.',
  },
  arbitration: {
    title: 'Arbitrage humain',
    description: 'Comparez côte à côte les cas incertains et validez les décisions manuellement.',
  },
  stats: {
    title: 'Statistiques & Performance',
    description: 'Distribution des scores de similarité, taux de concorde et fiabilité par attribut.',
  },
  history: {
    title: 'Historique des analyses',
    description: 'Journal des sessions d’analyse et des rapprochements sauvegardés.',
  },
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onStartAnalysis,
  totalRecordsCount,
  totalFilesCount,
}) => {
  const currentMeta = TAB_META[activeTab] || TAB_META.dashboard;

  return (
    <header
      id="app-header"
      className="bg-[#0A0A0A] border-b border-[#2C2C2C] px-6 sm:px-8 py-4 sticky top-0 z-20 shadow-2xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Title and description */}
        <div>
          <h1 className="text-xl font-bold text-[#E4E9E1] tracking-tight flex items-center gap-2">
            <span>{currentMeta.title}</span>
          </h1>
          <p className="text-xs text-[#8F8F8A] mt-1 max-w-2xl leading-normal">
            {currentMeta.description}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[#191919] border border-[#2C2C2C] text-xs text-[#8F8F8A]">
            <div className="flex items-center gap-1.5 font-medium">
              <Database className="w-3.5 h-3.5 text-[#AEB4C1]" />
              <span>{totalFilesCount} fichier(s)</span>
            </div>
            <span className="text-[#2C2C2C]">|</span>
            <div className="flex items-center gap-1.5 font-mono text-[#E4E9E1] font-bold">
              <span>{totalRecordsCount.toLocaleString('fr-FR')}</span>
              <span className="font-sans font-normal text-[#8F8F8A]">lignes</span>
            </div>
          </div>

          <button
            id="header-btn-start-analysis"
            onClick={onStartAnalysis}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8EB735] hover:bg-[#7ea32e] active:bg-[#6f9027] text-[#0A0A0A] text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-[#0A0A0A] text-[#0A0A0A]" />
            <span>Lancer l’analyse</span>
          </button>
        </div>
      </div>
    </header>
  );
};
