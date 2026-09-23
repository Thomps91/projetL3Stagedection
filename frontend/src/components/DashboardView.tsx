import React from 'react';
import {
  FolderUp,
  FileCheck,
  Search,
  Scale,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Play,
  Layers,
  Database,
  Users,
  Eye,
  Check,
  X,
  FileSpreadsheet,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { ActiveTab, MatchPair, UploadedFile, DataRecord } from '../types';

interface DashboardViewProps {
  files: UploadedFile[];
  records: DataRecord[];
  matches: MatchPair[];
  setActiveTab: (tab: ActiveTab) => void;
  onStartAnalysis: () => void;
  onOpenMatchDetails: (match: MatchPair) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  files,
  records,
  matches,
  setActiveTab,
  onStartAnalysis,
  onOpenMatchDetails,
}) => {
  const duplicates = matches.filter((m) => m.status === 'duplicate');
  const uncertains = matches.filter((m) => m.status === 'uncertain');
  const pendingArbitrations = matches.filter((m) => m.status === 'uncertain' && !m.decision);
  const arbitrated = matches.filter((m) => m.decision);

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Top Banner with dark modern aesthetic */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#191919] via-[#141414] to-[#0A0A0A] text-[#E4E9E1] rounded-2xl p-6 sm:p-8 shadow-sm border border-[#2C2C2C]">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#8EB735]/15 text-[#8EB735] border border-[#8EB735]/30 text-xs font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8EB735] animate-pulse"></span>
            <span>Moteur de Rapprochement Intelligent</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#E4E9E1]">
            Détection de doublons & Rapprochement d’enregistrements
          </h2>
          <p className="text-[#8F8F8A] text-xs sm:text-sm mt-2 leading-relaxed">
            Analysez vos fichiers de données multi-sources, comparez les attributs complexes (noms inversés, téléphones normalisés, localisations) et arbitrez les cas de ressemblance sans identifiant unique.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              id="dashboard-start-analysis"
              onClick={onStartAnalysis}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8EB735] hover:bg-[#7ea32e] active:bg-[#6f9027] text-[#0A0A0A] text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-[#0A0A0A] text-[#0A0A0A]" />
              <span>Lancer l’analyse</span>
            </button>
            <button
              id="dashboard-goto-import"
              onClick={() => setActiveTab('import')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#191919] hover:bg-[#2C2C2C] text-[#E4E9E1] border border-[#2C2C2C] text-xs font-medium transition-all cursor-pointer"
            >
              <FolderUp className="w-3.5 h-3.5 text-[#D3DBA2]" />
              <span>Gérer les fichiers ({files.length})</span>
            </button>
          </div>
        </div>

        {/* Subtle decorative glow */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-radial from-[#8EB735]/10 to-transparent pointer-events-none" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-[#191919] rounded-2xl p-5 border border-[#2C2C2C] shadow-2xs hover:border-[#8EB735]/40 transition-all">
          <div className="flex items-center justify-between text-[#8F8F8A] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8F8F8A]">
              Fichiers importés
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#111111] text-[#AEB4C1] flex items-center justify-center border border-[#2C2C2C]">
              <FolderUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#E4E9E1] tracking-tight">{files.length}</div>
          <p className="text-[11px] text-[#8F8F8A] mt-1">Formats : CSV, XLSX, XLS</p>
        </div>

        {/* Card 2 */}
        <div className="bg-[#191919] rounded-2xl p-5 border border-[#2C2C2C] shadow-2xs hover:border-[#8EB735]/40 transition-all">
          <div className="flex items-center justify-between text-[#8F8F8A] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8F8F8A]">
              Total Enregistrements
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#111111] text-[#D3DBA2] flex items-center justify-center border border-[#2C2C2C]">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#E4E9E1] tracking-tight">
            {records.length > 0 ? records.length.toLocaleString('fr-FR') : '1 045'}
          </div>
          <p className="text-[11px] text-[#8F8F8A] mt-1">Multiples sources réconciliées</p>
        </div>

        {/* Card 3 */}
        <div className="bg-[#191919] rounded-2xl p-5 border border-[#2C2C2C] shadow-2xs hover:border-[#8EB735]/40 transition-all">
          <div className="flex items-center justify-between text-[#8F8F8A] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8F8F8A]">
              Doublons Détectés
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#111111] text-[#8EB735] flex items-center justify-center border border-[#2C2C2C]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-[#8EB735] tracking-tight">{duplicates.length}</div>
            <span className="text-[11px] font-medium text-[#D3DBA2]">≥ 90% ressemblance</span>
          </div>
          <p className="text-[11px] text-[#8F8F8A] mt-1">Forte similarité multi-critères</p>
        </div>

        {/* Card 4 */}
        <div className="bg-[#191919] rounded-2xl p-5 border border-[#2C2C2C] shadow-2xs hover:border-[#8EB735]/40 transition-all">
          <div className="flex items-center justify-between text-[#8F8F8A] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8F8F8A]">
              Cas Incertains
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#111111] text-[#D87A71] flex items-center justify-center border border-[#2C2C2C]">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-[#D87A71] tracking-tight">{pendingArbitrations.length}</div>
            <span className="text-[11px] font-medium text-[#D87A71]">
              {arbitrated.length > 0 ? `${arbitrated.length} arbitré(s)` : 'À valider'}
            </span>
          </div>
          <p className="text-[11px] text-[#8F8F8A] mt-1">Score entre 70% et 89%</p>
        </div>
      </div>

      {/* Main Grid: Left Matches Table, Right Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width): Dernières correspondances */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#191919] rounded-2xl border border-[#2C2C2C] shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-[#2C2C2C] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#E4E9E1] tracking-tight">
                  Dernières correspondances identifiées
                </h3>
                <p className="text-xs text-[#8F8F8A] mt-0.5">
                  Paires comparées avec scores calculés par croisement multi-attributs.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('results')}
                className="text-xs font-semibold text-[#8EB735] hover:text-[#D3DBA2] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Voir tout ({matches.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#111111] border-b border-[#2C2C2C] text-[#8F8F8A] font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Enregistrement A</th>
                    <th className="py-3 px-4">Enregistrement B</th>
                    <th className="py-3 px-4 text-center">Score</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2C2C2C] text-[#E4E9E1]">
                  {matches.slice(0, 5).map((match) => (
                    <tr key={match.id} className="hover:bg-[#111111]/80 transition-colors">
                      {/* Enregistrement A */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#E4E9E1]">{match.recordA.nom}</div>
                        <div className="text-[11px] text-[#8F8F8A] font-mono mt-0.5">
                          {match.recordA.telephone || match.recordA.email}
                        </div>
                        <span className="text-[10px] text-[#8F8F8A] opacity-75 truncate max-w-[150px] inline-block mt-0.5">
                          {match.recordA.sourceFile}
                        </span>
                      </td>

                      {/* Enregistrement B */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#E4E9E1]">{match.recordB.nom}</div>
                        <div className="text-[11px] text-[#8F8F8A] font-mono mt-0.5">
                          {match.recordB.telephone || match.recordB.email}
                        </div>
                        <span className="text-[10px] text-[#8F8F8A] opacity-75 truncate max-w-[150px] inline-block mt-0.5">
                          {match.recordB.sourceFile}
                        </span>
                      </td>

                      {/* Score */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              match.score >= 90
                                ? 'bg-[#8EB735]/15 text-[#8EB735] border border-[#8EB735]/30'
                                : match.score >= 70
                                ? 'bg-[#D3DBA2]/15 text-[#D3DBA2] border border-[#D3DBA2]/30'
                                : 'bg-[#111111] text-[#8F8F8A] border border-[#2C2C2C]'
                            }`}
                          >
                            {match.score}%
                          </span>
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            match.status === 'duplicate'
                              ? 'bg-[#8EB735]/15 text-[#8EB735] border border-[#8EB735]/30'
                              : match.status === 'uncertain'
                              ? 'bg-[#D87A71]/15 text-[#D87A71] border border-[#D87A71]/30'
                              : 'bg-[#111111] text-[#AEB4C1] border border-[#2C2C2C]'
                          }`}
                        >
                          {match.decision ? 'Arbitré ✓' : match.statusLabel}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onOpenMatchDetails(match)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#111111] hover:bg-[#2C2C2C] hover:text-[#8EB735] border border-[#2C2C2C] text-[#E4E9E1] text-xs font-medium transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#AEB4C1]" />
                          <span>Détails</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-[#111111]/80 border-t border-[#2C2C2C] flex items-center justify-between text-xs text-[#8F8F8A]">
              <span>Affichage de 5 correspondances sur {matches.length} détectées</span>
              <button
                onClick={() => setActiveTab('results')}
                className="font-medium text-[#8EB735] hover:text-[#D3DBA2] transition-colors"
              >
                Explorer la liste complète →
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width): Fast Arbitration & Active Files */}
        <div className="space-y-6">
          {/* Card: Arbitrage en attente */}
          <div className="bg-[#191919] rounded-2xl border border-[#2C2C2C] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#111111] text-[#D87A71] border border-[#2C2C2C] flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#E4E9E1]">Arbitrage en attente</h4>
                  <p className="text-[11px] text-[#8F8F8A]">Cas nécessitant une décision humaine</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#D87A71]/20 text-[#D87A71] border border-[#D87A71]/30">
                {pendingArbitrations.length}
              </span>
            </div>

            {pendingArbitrations.length > 0 ? (
              <div className="space-y-3">
                {pendingArbitrations.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#111111] border border-[#2C2C2C] text-xs space-y-2 hover:bg-[#222222] transition-colors cursor-pointer"
                    onClick={() => onOpenMatchDetails(item)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#E4E9E1]">{item.recordA.nom}</span>
                      <span className="text-[11px] font-bold text-[#D87A71] bg-[#D87A71]/20 px-1.5 py-0.2 rounded border border-[#D87A71]/30">
                        {item.score}%
                      </span>
                    </div>
                    <div className="text-[11px] text-[#8F8F8A]">
                      vs <span className="font-medium text-[#E4E9E1]">{item.recordB.nom}</span>
                    </div>
                    <div className="text-[10px] text-[#8F8F8A] opacity-75 truncate">
                      {item.recordA.ville} • {item.recordA.telephone || item.recordA.email}
                    </div>
                  </div>
                ))}

                <button
                  id="dashboard-btn-arbitrage"
                  onClick={() => setActiveTab('arbitration')}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#8EB735] hover:bg-[#7ea32e] text-[#0A0A0A] text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Arbitrer ces cas maintenant</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#8EB735]/15 border border-[#8EB735]/30 text-center text-xs text-[#8EB735] font-medium">
                <CheckCircle2 className="w-5 h-5 text-[#8EB735] mx-auto mb-1" />
                Tous les cas incertains ont été arbitrés !
              </div>
            )}
          </div>

          {/* Card: Fichiers sources chargés */}
          <div className="bg-[#191919] rounded-2xl border border-[#2C2C2C] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#111111] text-[#AEB4C1] border border-[#2C2C2C] flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#E4E9E1]">Fichiers sources</h4>
                  <p className="text-[11px] text-[#8F8F8A]">{files.length} fichiers prêts</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('import')}
                className="text-[11px] font-semibold text-[#8EB735] hover:text-[#D3DBA2] transition-colors"
              >
                Gérer
              </button>
            </div>

            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  onClick={() => setActiveTab('data')}
                  className="p-3 rounded-xl bg-[#111111] border border-[#2C2C2C] flex items-center justify-between text-xs hover:bg-[#222222] transition-colors cursor-pointer"
                >
                  <div className="truncate max-w-[180px]">
                    <div className="font-semibold text-[#E4E9E1] truncate">{file.name}</div>
                    <div className="text-[10px] text-[#8F8F8A] mt-0.5">
                      {file.rowCount} enregistrements • {file.size}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#191919] border border-[#2C2C2C] text-[#AEB4C1]">
                    {file.format}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Méthodes de détection actives */}
          <div className="bg-[#191919] rounded-2xl border border-[#2C2C2C] p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#8EB735]" />
              <h4 className="text-xs font-bold text-[#E4E9E1]">Rapprochement sans clé unique</h4>
            </div>
            <p className="text-[11px] text-[#8F8F8A] leading-relaxed">
              Le système combine distance de Levenshtein, Jaro-Winkler, suppression des séparateurs de téléphone (+261/0), inversion Prénom/Nom et comparaison géographique tolérante.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
