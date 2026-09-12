import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Scale,
  Sparkles,
} from 'lucide-react';
import { MatchPair } from '../types';

interface ResultsViewProps {
  matches: MatchPair[];
  onOpenDetails: (match: MatchPair) => void;
  onGoToArbitration: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  matches,
  onOpenDetails,
  onGoToArbitration,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'duplicate' | 'uncertain' | 'different'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const duplicatesCount = matches.filter((m) => m.status === 'duplicate').length;
  const uncertainCount = matches.filter((m) => m.status === 'uncertain').length;
  const differentCount = matches.filter((m) => m.status === 'different').length;

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (activeFilter !== 'all' && m.status !== activeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inRecordA =
          m.recordA.nom.toLowerCase().includes(q) ||
          m.recordA.telephone.toLowerCase().includes(q) ||
          m.recordA.ville.toLowerCase().includes(q);
        const inRecordB =
          m.recordB.nom.toLowerCase().includes(q) ||
          m.recordB.telephone.toLowerCase().includes(q) ||
          m.recordB.ville.toLowerCase().includes(q);
        return inRecordA || inRecordB;
      }
      return true;
    });
  }, [matches, activeFilter, searchQuery]);

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Nom A',
      'Email A',
      'Telephone A',
      'Ville A',
      'Source A',
      'Nom B',
      'Email B',
      'Telephone B',
      'Ville B',
      'Source B',
      'Score Similarite (%)',
      'Statut',
      'Arbitrage Decision',
    ];

    const rows = filteredMatches.map((m) => [
      m.id,
      `"${m.recordA.nom}"`,
      `"${m.recordA.email}"`,
      `"${m.recordA.telephone}"`,
      `"${m.recordA.ville}"`,
      `"${m.recordA.sourceFile}"`,
      `"${m.recordB.nom}"`,
      `"${m.recordB.email}"`,
      `"${m.recordB.telephone}"`,
      `"${m.recordB.ville}"`,
      `"${m.recordB.sourceFile}"`,
      m.score,
      `"${m.statusLabel}"`,
      m.decision ? `"${m.decision}"` : 'Non arbitre',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Resultats_Rapprochement_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="results-view" className="space-y-6">
      {/* Header and Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#E4E9E1] tracking-tight">
            Résultats
          </h2>
          <p className="text-xs text-[#8F8F8A] mt-1">
            Correspondances détectées réparties par statut et score de ressemblance.
          </p>
        </div>

        <button
          id="btn-exporter-resultats"
          onClick={handleExportCSV}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#191919] hover:bg-[#2C2C2C] text-[#E4E9E1] border border-[#2C2C2C] font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#8F8F8A]" />
          <span>Exporter CSV</span>
        </button>
      </div>

      {/* Arbitration Notice Banner if uncertain cases exist */}
      {uncertainCount > 0 && (
        <div className="bg-[#D87A71]/10 border border-[#D87A71]/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D87A71]/20 text-[#D87A71] flex items-center justify-center shrink-0 mt-0.5 border border-[#D87A71]/30">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#E4E9E1]">
                {uncertainCount} cas incertain{uncertainCount > 1 ? 's' : ''} détecté{uncertainCount > 1 ? 's' : ''}
              </h4>
              <p className="text-xs text-[#8F8F8A] mt-0.5">
                Certains enregistrements présentent un score intermédiaire (ex: 84%). L'arbitrage est requis pour statuer.
              </p>
            </div>
          </div>

          <button
            id="btn-goto-arbitrage-from-results"
            onClick={onGoToArbitration}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8EB735] hover:bg-[#7ea32e] active:bg-[#6f9027] text-[#0A0A0A] font-bold text-xs transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Arbitrer les cas incertains</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#191919] rounded-2xl border border-[#2C2C2C] p-3.5 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
          <button
            id="filter-all"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-[#8EB735] text-[#0A0A0A] font-bold shadow-xs'
                : 'bg-[#111111] text-[#8F8F8A] hover:bg-[#2C2C2C] border border-[#2C2C2C]'
            }`}
          >
            Tous ({matches.length})
          </button>
          <button
            id="filter-doublons"
            onClick={() => setActiveFilter('duplicate')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
              activeFilter === 'duplicate'
                ? 'bg-[#8EB735] text-[#0A0A0A] font-bold shadow-xs'
                : 'bg-[#111111] text-[#8EB735] hover:bg-[#8EB735]/15 border border-[#2C2C2C]'
            }`}
          >
            Doublons ({duplicatesCount})
          </button>
          <button
            id="filter-incertains"
            onClick={() => setActiveFilter('uncertain')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
              activeFilter === 'uncertain'
                ? 'bg-[#D87A71] text-[#0A0A0A] font-bold shadow-xs'
                : 'bg-[#111111] text-[#D87A71] hover:bg-[#D87A71]/15 border border-[#2C2C2C]'
            }`}
          >
            Incertains ({uncertainCount})
          </button>
          <button
            id="filter-differents"
            onClick={() => setActiveFilter('different')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
              activeFilter === 'different'
                ? 'bg-[#AEB4C1] text-[#0A0A0A] font-bold shadow-xs'
                : 'bg-[#111111] text-[#AEB4C1] hover:bg-[#2C2C2C] border border-[#2C2C2C]'
            }`}
          >
            Différents ({differentCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8F8F8A]" />
          <input
            type="text"
            id="results-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une personne, ville..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#111111] text-[#E4E9E1] placeholder-[#8F8F8A] border border-[#2C2C2C] focus:border-[#8EB735] focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Main Results Table */}
      <div className="bg-[#191919] rounded-2xl border border-[#2C2C2C] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#111111] border-b border-[#2C2C2C] text-[#8F8F8A] font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 w-[32%]">Enregistrement A</th>
                <th className="py-3 px-4 w-[32%]">Enregistrement B</th>
                <th className="py-3 px-4 text-right w-[14%]">Score</th>
                <th className="py-3 px-4 text-center w-[12%]">Statut</th>
                <th className="py-3 px-4 text-center w-[10%]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C2C2C] text-[#E4E9E1]">
              {filteredMatches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[#8F8F8A]">
                    Aucune correspondance ne correspond aux filtres sélectionnés.
                  </td>
                </tr>
              ) : (
                filteredMatches.map((match) => {
                  const isDuplicate = match.status === 'duplicate';
                  const isUncertain = match.status === 'uncertain';

                  return (
                    <tr
                      key={match.id}
                      id={`match-row-${match.id}`}
                      className="hover:bg-[#111111]/80 transition-colors"
                    >
                      {/* Enregistrement A */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#E4E9E1] text-xs flex items-center gap-1.5">
                          <span>{match.recordA.nom}</span>
                        </div>
                        <div className="text-[11px] text-[#8F8F8A] mt-0.5 truncate">
                          {match.recordA.telephone} • {match.recordA.ville}
                        </div>
                        <div className="text-[10px] text-[#8F8F8A] opacity-75 mt-0.5 truncate">
                          Source : {match.recordA.sourceFile}
                        </div>
                      </td>

                      {/* Enregistrement B */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#E4E9E1] text-xs flex items-center gap-1.5">
                          <span>{match.recordB.nom}</span>
                        </div>
                        <div className="text-[11px] text-[#8F8F8A] mt-0.5 truncate">
                          {match.recordB.telephone} • {match.recordB.ville}
                        </div>
                        <div className="text-[10px] text-[#8F8F8A] opacity-75 mt-0.5 truncate">
                          Source : {match.recordB.sourceFile}
                        </div>
                      </td>

                      {/* Score */}
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-bold font-mono text-xs px-2.5 py-1 rounded-lg ${
                            match.score >= 90
                              ? 'text-[#8EB735] bg-[#8EB735]/15 border border-[#8EB735]/30'
                              : match.score >= 70
                              ? 'text-[#D87A71] bg-[#D87A71]/15 border border-[#D87A71]/30'
                              : 'text-[#AEB4C1] bg-[#111111] border border-[#2C2C2C]'
                          }`}
                        >
                          {match.score} %
                        </span>
                      </td>

                      {/* Statut */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            isDuplicate
                              ? 'bg-[#8EB735]/15 text-[#8EB735] border border-[#8EB735]/30'
                              : isUncertain
                              ? 'bg-[#D87A71]/15 text-[#D87A71] border border-[#D87A71]/30'
                              : 'bg-[#111111] text-[#AEB4C1] border border-[#2C2C2C]'
                          }`}
                        >
                          {isDuplicate ? (
                            <CheckCircle2 className="w-3 h-3 text-[#8EB735]" />
                          ) : isUncertain ? (
                            <AlertTriangle className="w-3 h-3 text-[#D87A71]" />
                          ) : null}
                          <span>{match.statusLabel}</span>
                        </span>

                        {match.decision && (
                          <div className="mt-1 text-[10px] font-medium text-[#8EB735]">
                            Arbitré : {match.decision === 'confirmed' ? 'Confirmé ✓' : 'Refusé ✕'}
                          </div>
                        )}
                      </td>

                      {/* Button: Voir les détails */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          id={`btn-voir-details-${match.id}`}
                          onClick={() => onOpenDetails(match)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#111111] hover:bg-[#2C2C2C] hover:text-[#8EB735] text-[#E4E9E1] font-medium text-xs transition-colors border border-[#2C2C2C] cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#AEB4C1]" />
                          <span>Détails</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 bg-[#111111]/80 border-t border-[#2C2C2C] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#8F8F8A]">
          <div>
            Affichage de <strong className="text-[#E4E9E1]">{filteredMatches.length}</strong> correspondances pertinentes
          </div>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8EB735] hover:text-[#D3DBA2] hover:underline cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter les résultats filtrés en CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
