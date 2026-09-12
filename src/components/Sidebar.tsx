import React from 'react';
import {
  LayoutDashboard,
  FolderUp,
  Search,
  Scale,
  BarChart3,
  History,
  FileCheck,
  CheckCircle2,
  Database,
  Cpu,
  Layers,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingArbitrationCount: number;
  totalFilesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingArbitrationCount,
  totalFilesCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'import' as ActiveTab,
      label: 'Importer des fichiers',
      icon: FolderUp,
      badge: totalFilesCount > 0 ? `${totalFilesCount}` : null,
      badgeColor: 'bg-indigo-100 text-indigo-700 font-semibold',
    },
    {
      id: 'data' as ActiveTab,
      label: 'Voir les données',
      icon: FileCheck,
      badge: null,
    },
    {
      id: 'results' as ActiveTab,
      label: 'Résultats',
      icon: Search,
      badge: null,
    },
    {
      id: 'arbitration' as ActiveTab,
      label: 'Arbitrage',
      icon: Scale,
      badge: pendingArbitrationCount > 0 ? `${pendingArbitrationCount}` : null,
      badgeColor: 'bg-amber-100 text-amber-800 font-bold border border-amber-200',
    },
    {
      id: 'stats' as ActiveTab,
      label: 'Statistiques',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'history' as ActiveTab,
      label: 'Historique',
      icon: History,
      badge: null,
    },
  ];

  return (
    <aside
      id="app-sidebar"
      className="w-64 bg-[#0A0A0A] text-[#E4E9E1] flex flex-col border-r border-[#2C2C2C] shrink-0 select-none h-screen shadow-2xs"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-[#2C2C2C] flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#8EB735] text-[#0A0A0A] font-black text-lg flex items-center justify-center shadow-xs">
          <Layers className="w-5 h-5 text-[#0A0A0A]" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[#E4E9E1] text-sm tracking-tight">RecMatch</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#8EB735]/15 text-[#8EB735] border border-[#8EB735]/30">
              v2.0
            </span>
          </div>
          <p className="text-[11px] text-[#8F8F8A] font-medium">Rapprochement de données</p>
        </div>
      </div>

      {/* Navigation Main Menu */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-[#8F8F8A] uppercase tracking-widest">
          MENU PRINCIPAL
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                isActive
                  ? 'bg-[#8EB735]/15 text-[#8EB735] font-semibold border border-[#8EB735]/30'
                  : 'text-[#8F8F8A] hover:bg-[#191919] hover:text-[#E4E9E1]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-[#8EB735] text-[#0A0A0A] shadow-2xs'
                      : 'text-[#8F8F8A] group-hover:text-[#E4E9E1]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className={isActive ? 'text-[#E4E9E1] font-semibold' : ''}>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    item.id === 'arbitration'
                      ? 'bg-[#D87A71]/20 text-[#D87A71] border border-[#D87A71]/30'
                      : isActive
                      ? 'bg-[#8EB735] text-[#0A0A0A]'
                      : 'bg-[#191919] text-[#AEB4C1] border border-[#2C2C2C]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Engine Status Card */}
      <div className="p-3 border-t border-[#2C2C2C] bg-[#0A0A0A]">
        <div className="p-3 rounded-xl bg-[#191919] border border-[#2C2C2C] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#8EB735] animate-pulse"></span>
              <span className="text-[11px] font-semibold text-[#E4E9E1]">Moteur Actif</span>
            </div>
            <span className="text-[10px] font-mono text-[#8EB735] font-semibold bg-[#8EB735]/15 px-1.5 py-0.5 rounded border border-[#8EB735]/30">
              Levenshtein + Jaro
            </span>
          </div>
          <p className="text-[10px] text-[#8F8F8A] leading-tight">
            Normalisation phonétique & multi-attributs prête
          </p>
        </div>
      </div>
    </aside>
  );
};
