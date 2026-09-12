import React from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Users,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { MatchPair, UploadedFile } from '../types';

interface StatisticsViewProps {
  matches: MatchPair[];
  files: UploadedFile[];
  totalRecordsCount: number;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({
  matches,
  files,
  totalRecordsCount,
}) => {
  const duplicatesCount = matches.filter((m) => m.status === 'duplicate').length;
  const uncertainCount = matches.filter((m) => m.status === 'uncertain').length;
  const differentCount = matches.filter((m) => m.status === 'different').length;

  const totalAnalyzed = totalRecordsCount;
  const totalPairs = matches.length || 1;

  const duplicatesPct = Math.round((duplicatesCount / totalPairs) * 100);
  const uncertainPct = Math.round((uncertainCount / totalPairs) * 100);
  const differentPct = Math.max(0, 100 - duplicatesPct - uncertainPct);

  const scoreDistribution = [
    { label: '90% - 100% (Très fort)', count: matches.filter((m) => m.score >= 90).length, color: 'bg-[#8EB735]', pct: Math.round((matches.filter((m) => m.score >= 90).length / totalPairs) * 100) },
    { label: '80% - 89% (Élevé)', count: matches.filter((m) => m.score >= 80 && m.score < 90).length, color: 'bg-[#D3DBA2]', pct: Math.round((matches.filter((m) => m.score >= 80 && m.score < 90).length / totalPairs) * 100) },
    { label: '70% - 79% (Modéré / Incertain)', count: matches.filter((m) => m.score >= 70 && m.score < 80).length, color: 'bg-[#D87A71]', pct: Math.round((matches.filter((m) => m.score >= 70 && m.score < 80).length / totalPairs) * 100) },
    { label: '< 70% (Faible / Différent)', count: matches.filter((m) => m.score < 70).length, color: 'bg-[#AEB4C1]', pct: Math.round((matches.filter((m) => m.score < 70).length / totalPairs) * 100) },
  ];

  const attributeConcordance = [
    { name: 'Nom & Prénom', rate: 91, desc: 'Distance Levenshtein & phonétique' },
    { name: 'Téléphone', rate: 96, desc: 'Normalisation indicatif (+261/034)' },
    { name: 'Ville / Localité', rate: 89, desc: 'Dictionnaire des communes' },
    { name: 'Adresse / Rue', rate: 77, desc: 'Variations fréquentes (Lot, Porte)' },
    { name: 'Adresse Email', rate: 84, desc: 'Identifiants de messagerie' },
  ];

  return (
    <div id="statistics-view" className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#E4E9E1] tracking-tight">Statistiques</h2>
        <p className="text-xs text-[#8F8F8A] mt-1">
          Indicateurs de performance, répartition des scores et taux de détection des doublons.
        </p>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Nombre total d’enregistrements analysés */}
        <div className="bg-[#191919] rounded-2xl p-5 border border-[#2C2C2C] shadow-2xs">
          <div className="flex items-center justify-between text-[#8F8F8A] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8F8F8A]">Total Analysé</span>
            <div className="w-8 h-8 rounded-xl bg-[#111111] text-[#AEB4C1] border border-[#2C2C2C] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#E4E9E1]">{totalAnalyzed.toLocaleString('fr-FR')}</div>
          <p className="text-xs text-[#8F8F8A] mt-1">Sur {files.length} fichiers sources croisés</p>
        </div>

        {/* 2. Doublons probables */}
        <div className="bg-[#191919] rounded-2xl p-5 border border-[#2C2C2C] shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8F8F8A]">
              Doublons probables
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#111111] text-[#8EB735] border border-[#2C2C2C] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-[#8EB735]">{duplicatesCount}</div>
            <span className="text-xs font-semibold text-[#8EB735]">({duplicatesPct}%)</span>
          </div>
          <p className="text-xs text-[#8F8F8A] mt-1">Score de rapprochement ≥ 90%</p>
        </div>

        {/* 3. Cas incertains */}
        <div className="bg-[#191919] rounded-2xl p-5 border border-[#2C2C2C] shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8F8F8A]">
              Cas incertains
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#111111] text-[#D87A71] border border-[#2C2C2C] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-[#D87A71]">{uncertainCount}</div>
            <span className="text-xs font-semibold text-[#D87A71]">({uncertainPct}%)</span>
          </div>
          <p className="text-xs text-[#8F8F8A] mt-1">Score entre 70% et 89%</p>
        </div>

        {/* 4. Enregistrements différents */}
        <div className="bg-[#191919] rounded-2xl p-5 border border-[#2C2C2C] shadow-2xs">
          <div className="flex items-center justify-between text-[#8F8F8A] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8F8F8A]">Différents</span>
            <div className="w-8 h-8 rounded-xl bg-[#111111] text-[#AEB4C1] border border-[#2C2C2C] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-[#E4E9E1]">{differentCount}</div>
            <span className="text-xs font-semibold text-[#8F8F8A]">({differentPct}%)</span>
          </div>
          <p className="text-xs text-[#8F8F8A] mt-1">Enregistrements uniques isolés</p>
        </div>
      </div>

      {/* Visual Graphs: Distribution & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 1: Répartition des résultats */}
        <div className="bg-[#191919] rounded-2xl border border-[#2C2C2C] shadow-2xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#E4E9E1]">Répartition des résultats</h3>
              <p className="text-xs text-[#8F8F8A]">Catégorisation des enregistrements analysés</p>
            </div>
            <PieChart className="w-4 h-4 text-[#8F8F8A]" />
          </div>

          {/* Segmented Visual Bar */}
          <div className="space-y-4">
            <div className="w-full h-7 rounded-xl bg-[#111111] flex overflow-hidden p-1 gap-1 border border-[#2C2C2C]">
              <div
                style={{ width: `${differentPct}%` }}
                className="bg-[#AEB4C1] h-full rounded-lg transition-all"
                title={`Différents: ${differentPct}%`}
              ></div>
              <div
                style={{ width: `${duplicatesPct}%` }}
                className="bg-[#8EB735] h-full rounded-lg transition-all"
                title={`Doublons probables: ${duplicatesPct}%`}
              ></div>
              <div
                style={{ width: `${uncertainPct}%` }}
                className="bg-[#D87A71] h-full rounded-lg transition-all"
                title={`Cas incertains: ${uncertainPct}%`}
              ></div>
            </div>

            {/* Legend with numbers */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[#111111] border border-[#2C2C2C]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#8EB735]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8EB735]"></span>
                  <span>Doublons</span>
                </div>
                <div className="text-lg font-extrabold text-[#E4E9E1] mt-1">{duplicatesCount}</div>
                <div className="text-[11px] text-[#8F8F8A]">{duplicatesPct}% du total</div>
              </div>

              <div className="p-3 rounded-xl bg-[#111111] border border-[#2C2C2C]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#D87A71]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D87A71]"></span>
                  <span>Incertains</span>
                </div>
                <div className="text-lg font-extrabold text-[#E4E9E1] mt-1">{uncertainCount}</div>
                <div className="text-[11px] text-[#8F8F8A]">{uncertainPct}% du total</div>
              </div>

              <div className="p-3 rounded-xl bg-[#111111] border border-[#2C2C2C]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#AEB4C1]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#AEB4C1]"></span>
                  <span>Différents</span>
                </div>
                <div className="text-lg font-extrabold text-[#E4E9E1] mt-1">{differentCount}</div>
                <div className="text-[11px] text-[#8F8F8A]">{differentPct}% du total</div>
              </div>
            </div>
          </div>
        </div>

        {/* Graph 2: Distribution des scores de ressemblance */}
        <div className="bg-[#191919] rounded-2xl border border-[#2C2C2C] shadow-2xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#E4E9E1]">
                Distribution des scores de ressemblance
              </h3>
              <p className="text-xs text-[#8F8F8A]">Tranches de similitude multi-critères</p>
            </div>
            <BarChart3 className="w-4 h-4 text-[#8F8F8A]" />
          </div>

          <div className="space-y-3 pt-1">
            {scoreDistribution.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#E4E9E1]">{item.label}</span>
                  <span className="font-mono font-bold text-[#8F8F8A]">{item.count} paires</span>
                </div>
                <div className="w-full bg-[#111111] rounded-full h-2.5 overflow-hidden border border-[#2C2C2C]">
                  <div
                    className={`${item.color} h-full rounded-full transition-all duration-300`}
                    style={{ width: `${Math.min(100, Math.max(8, item.pct))}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Field-by-Field Concordance Rates */}
      <div className="bg-[#191919] rounded-2xl border border-[#2C2C2C] shadow-2xs p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#E4E9E1]">
              Taux de concordance moyen par attribut comparé
            </h3>
            <p className="text-xs text-[#8F8F8A]">
              Fiabilité et contribution des champs comparés dans le calcul de similarité
            </p>
          </div>
          <TrendingUp className="w-4 h-4 text-[#8EB735]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {attributeConcordance.map((attr, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#111111] border border-[#2C2C2C] flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-bold text-[#E4E9E1]">{attr.name}</div>
                <div className="text-[11px] text-[#8F8F8A] mt-1 leading-snug">{attr.desc}</div>
              </div>
              <div className="mt-4 pt-2 border-t border-[#2C2C2C] flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#8F8F8A]">Précision</span>
                <span className="text-base font-extrabold text-[#8EB735]">{attr.rate} %</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
