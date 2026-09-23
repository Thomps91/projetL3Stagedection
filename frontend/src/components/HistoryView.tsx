import React from 'react';
import {
  History,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { AnalysisHistoryItem } from '../types';

interface HistoryViewProps {
  historyItems: AnalysisHistoryItem[];
  onReloadAnalysis: (item: AnalysisHistoryItem) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  historyItems,
  onReloadAnalysis,
}) => {
  return (
    <div id="history-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#E4E9E1] tracking-tight">
            Historique
          </h2>
          <p className="text-xs text-[#8F8F8A] mt-1">
            Consultez les sessions antérieures de détection et de rapprochement.
          </p>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-[#191919] rounded-2xl border border-[#2C2C2C] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#111111] border-b border-[#2C2C2C] text-[#8F8F8A] font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Fichiers analysés</th>
                <th className="py-3 px-4 text-center">Enregistrements</th>
                <th className="py-3 px-4 text-center">Doublons trouvés</th>
                <th className="py-3 px-4 text-center">Cas incertains</th>
                <th className="py-3 px-4 text-center">Différents</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C2C2C] text-[#E4E9E1]">
              {historyItems.map((item) => (
                <tr key={item.id} className="hover:bg-[#111111]/80 transition-colors">
                  {/* Date */}
                  <td className="py-3.5 px-4 font-semibold text-[#E4E9E1]">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#8F8F8A]" />
                      <span>{item.date}</span>
                    </div>
                    <div className="text-[10px] text-[#8F8F8A] font-normal mt-0.5">
                      Durée : {item.executionTime}
                    </div>
                  </td>

                  {/* Fichiers analysés */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1.5 max-w-sm">
                      {item.files.map((fileName, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#111111] text-[#AEB4C1] text-[10px] font-medium border border-[#2C2C2C]"
                        >
                          <FileSpreadsheet className="w-3 h-3 text-[#8F8F8A]" />
                          <span className="truncate max-w-[150px]">{fileName}</span>
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Nombre d'enregistrements */}
                  <td className="py-3.5 px-4 text-center font-bold font-mono text-[#E4E9E1]">
                    {item.totalRecords.toLocaleString('fr-FR')}
                  </td>

                  {/* Doublons trouvés */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#8EB735]/15 text-[#8EB735] border border-[#8EB735]/30">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{item.duplicatesFound}</span>
                    </span>
                  </td>

                  {/* Cas incertains */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D87A71]/15 text-[#D87A71] border border-[#D87A71]/30">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{item.uncertainCases}</span>
                    </span>
                  </td>

                  {/* Différents */}
                  <td className="py-3.5 px-4 text-center font-bold font-mono text-[#E4E9E1]">
                    {item.differentCount ?? 0}
                  </td>

                  {/* Statut */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.status === 'Terminé'
                          ? 'bg-[#111111] text-[#AEB4C1] border border-[#2C2C2C]'
                          : item.status === 'Arbitré'
                          ? 'bg-[#8EB735]/15 text-[#8EB735] border border-[#8EB735]/30'
                          : 'bg-[#111111] text-[#8F8F8A] border border-[#2C2C2C]'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      id={`btn-reload-history-${item.id}`}
                      onClick={() => onReloadAnalysis(item)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#111111] hover:bg-[#2C2C2C] hover:text-[#8EB735] border border-[#2C2C2C] text-[#E4E9E1] text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                    >
                      <RotateCcw className="w-3 h-3 text-[#8F8F8A]" />
                      <span>Charger</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-[#111111]/80 border-t border-[#2C2C2C] text-xs text-[#8F8F8A] flex items-center justify-between">
          <span>{historyItems.length} sessions d'analyses enregistrées</span>
          <span className="text-[#8F8F8A] opacity-75">Toutes les archives sont conservées localement</span>
        </div>
      </div>
    </div>
  );
};
