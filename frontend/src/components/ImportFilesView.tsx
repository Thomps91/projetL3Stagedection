import React, { useRef, useState } from 'react';

import {
  FileSpreadsheet,
  Trash2,
  Table,
  CheckCircle2,
  FileText,
  Upload,
  Sparkles,
  Info,
} from 'lucide-react';

import { UploadedFile, DataRecord } from '../types';
import { uploadFiles } from '../services/api';

interface ImportFilesViewProps {
  files: UploadedFile[];
  onAddFiles: (
    newFiles: UploadedFile[],
    newRecords?: DataRecord[]
  ) => void;
  onRemoveFile: (fileId: string) => void;
  onGoToDataPreview: () => void;
  onResetToDemo: () => void;
}

export const ImportFilesView: React.FC<ImportFilesViewProps> = ({
  files,
  onAddFiles,
  onRemoveFile,
  onGoToDataPreview,
  onResetToDemo,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /*
   * Vérifie si le format du fichier est accepté.
   */
  const isValidFile = (file: File): boolean => {
    const extension = file.name.split('.').pop()?.toUpperCase();

    return ['CSV', 'XLSX', 'XLS'].includes(extension || '');
  };

  /*
   * Vérifie la taille du fichier.
   */
  const isValidSize = (file: File): boolean => {
    const maxSize = 50 * 1024 * 1024;

    return file.size <= maxSize;
  };

  /*
   * Traitement et envoi des fichiers vers le backend.
   */
  const processFileObjects = async (
    fileList: FileList | null
  ) => {
    if (!fileList || fileList.length === 0) {
      return;
    }

    const selectedFiles = Array.from(fileList);

    const invalidFormatFiles = selectedFiles.filter(
      (file) => !isValidFile(file)
    );

    if (invalidFormatFiles.length > 0) {
      setUploadMessage(
        `Format non supporté : ${invalidFormatFiles
          .map((file) => file.name)
          .join(', ')}. Utilisez CSV, XLSX ou XLS.`
      );

      return;
    }

    const oversizedFiles = selectedFiles.filter(
      (file) => !isValidSize(file)
    );

    if (oversizedFiles.length > 0) {
      setUploadMessage(
        `Fichier trop volumineux : ${oversizedFiles
          .map((file) => file.name)
          .join(', ')}. La taille maximale est de 50 Mo par fichier.`
      );

      return;
    }

    setIsUploading(true);
    setUploadMessage(null);

    let uploadedFiles: UploadedFile[] = [];
    const errors: string[] = [];

    try {
      const resp = await uploadFiles(selectedFiles);

      uploadedFiles = resp.files.map((backendFile) => ({
        id: backendFile.id,
        name: backendFile.name,
        size: backendFile.size,
        sizeBytes: backendFile.sizeBytes,
        format: backendFile.format as 'CSV' | 'XLSX' | 'XLS',
        rowCount: backendFile.rowCount,
        uploadDate: backendFile.uploadDate,
      }));

      // Map records returned by backend to DataRecord shape if present
      const returnedRecords: DataRecord[] = (resp.records || []).map((r: any) => ({
        id: r.id,
        nom: r.nom,
        prenom: r.prenom,
        email: r.email,
        telephone: r.telephone,
        adresse: r.adresse,
        ville: r.ville,
        sourceFile: r.sourceFile,
      }));

      if (uploadedFiles.length > 0) {
        onAddFiles(uploadedFiles, returnedRecords);
      }

      if (resp.warnings && resp.warnings.length > 0) {
        setUploadMessage(resp.warnings.join(' — '));
      }
    } catch (err) {
      console.error('Erreur lors de l import:', err);
      const backendMessage = err instanceof Error ? err.message : 'Erreur inconnue lors de l\'import.';
      setUploadMessage(backendMessage);
      errors.push(...selectedFiles.map((f) => f.name));
    }

    setIsUploading(false);

    if (uploadedFiles.length > 0 && errors.length === 0) {
      setUploadMessage(
        `${uploadedFiles.length} fichier(s) importé(s) avec succès. Prêts pour le croisement et l'analyse.`
      );
    } else if (uploadedFiles.length > 0 && errors.length > 0) {
      setUploadMessage(
        `${uploadedFiles.length} fichier(s) importé(s). Échec pour : ${errors.join(', ')}.`
      );
    } else {
      setUploadMessage(`Aucun fichier n'a pu être importé.`);
    }

    setTimeout(() => {
      setUploadMessage(null);
    }, 6000);
  };

  /*
   * Gestion du glisser-déposer.
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    processFileObjects(e.dataTransfer.files);
  };

  /*
   * Sélection classique d'un fichier.
   */
  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    processFileObjects(e.target.files);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      id="import-files-view"
      className="space-y-6"
    >
      {/* Title and context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#E4E9E1] tracking-tight">
            Importer des fichiers
          </h2>

          <p className="text-xs text-[#8F8F8A] mt-1">
            Ajoutez vos fichiers de données aux formats CSV,
            XLSX ou XLS pour identifier les doublons.
          </p>
        </div>

        {/* Demo reset button */}
        <button
          onClick={onResetToDemo}
          disabled={isUploading}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#2C2C2C] hover:bg-[#2C2C2C] text-[#E4E9E1] text-xs font-medium transition-colors cursor-pointer bg-[#191919] shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#8EB735]" />

          <span>
            Recharger fichiers de test
          </span>
        </button>
      </div>

      {/* Upload Drop Zone */}
      <div
        id="file-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isUploading) {
            fileInputRef.current?.click();
          }
        }}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all ${
          isUploading
            ? 'border-[#8EB735]/40 bg-[#191919] cursor-wait'
            : isDragging
            ? 'border-[#8EB735] bg-[#8EB735]/10 shadow-sm cursor-pointer'
            : 'border-[#2C2C2C] hover:border-[#8EB735]/60 bg-[#191919] hover:bg-[#1f1f1f] shadow-2xs cursor-pointer'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="file-upload-input"
          multiple
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={isUploading}
        />

        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-[#111111] text-[#8EB735] border border-[#2C2C2C] flex items-center justify-center mb-4 shadow-2xs">
            <Upload className="w-6 h-6" />
          </div>

          <p className="text-sm font-semibold text-[#E4E9E1]">
            {isUploading
              ? 'Importation en cours...'
              : (
                <>
                  Glissez-déposez vos fichiers ici, ou{' '}
                  <span className="text-[#8EB735] underline">
                    parcourez vos dossiers
                  </span>
                </>
              )}
          </p>

          <p className="text-xs text-[#8F8F8A] mt-1.5">
            Formats acceptés :{' '}
            <span className="font-semibold text-[#E4E9E1]">
              CSV, XLSX, XLS
            </span>
          </p>

          <div className="flex items-center gap-3 mt-4 text-[11px] text-[#8F8F8A]">
            <span className="flex items-center gap-1 text-[#E4E9E1]">
              <CheckCircle2 className="w-3 h-3 text-[#8EB735]" />
              Multi-fichiers supporté
            </span>

            <span>•</span>

            <span>
              Jusqu’à 50 Mo par fichier
            </span>
          </div>
        </div>
      </div>

      {/* Upload message */}
      {uploadMessage && (
        <div className="p-3.5 rounded-xl bg-[#8EB735]/15 border border-[#8EB735]/30 text-[#E4E9E1] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#8EB735]" />

          <span>{uploadMessage}</span>
        </div>
      )}

      {/* Files List Card */}
      <div className="bg-[#191919] rounded-2xl border border-[#2C2C2C] shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#2C2C2C] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#E4E9E1]">
                Fichiers importés
              </h3>

              <span className="px-2.5 py-0.5 rounded-full bg-[#8EB735]/15 text-[#8EB735] border border-[#8EB735]/30 font-semibold text-xs">
                {files.length} fichier
                {files.length > 1 ? 's' : ''}
              </span>
            </div>

            <p className="text-xs text-[#8F8F8A] mt-0.5">
              Ces fichiers seront croisés pour détecter les
              doublons potentiels.
            </p>
          </div>

          {/* Action button */}
          {files.length > 0 && (
            <button
              id="btn-voir-les-donnees-top"
              onClick={onGoToDataPreview}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#8EB735] hover:bg-[#7ea32e] text-[#0A0A0A] text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Table className="w-3.5 h-3.5" />

              <span>
                Voir les données
              </span>
            </button>
          )}
        </div>

        {files.length === 0 ? (
          <div className="p-10 text-center text-[#8F8F8A] text-xs">
            Aucun fichier importé pour le moment.
            Veuillez glisser un fichier CSV ou Excel.
          </div>
        ) : (
          <div className="divide-y divide-[#2C2C2C]">
            {files.map((file) => (
              <div
                key={file.id}
                id={`file-row-${file.id}`}
                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-[#111111]/80 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                      file.format === 'CSV'
                        ? 'bg-[#111111] text-[#D3DBA2] border border-[#2C2C2C]'
                        : 'bg-[#111111] text-[#8EB735] border border-[#2C2C2C]'
                    }`}
                  >
                    {file.format === 'CSV' ? (
                      <FileText className="w-5 h-5" />
                    ) : (
                      <FileSpreadsheet className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#E4E9E1] truncate">
                      {file.name}
                    </p>

                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#8F8F8A] mt-0.5">
                      <span className="font-medium text-[#E4E9E1]">
                        {file.size}
                      </span>

                      <span>•</span>

                      <span>
                        {file.rowCount} enregistrements
                      </span>

                      <span>•</span>

                      <span className="text-[#8F8F8A]">
                        Importé le {file.uploadDate}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#111111] text-[#AEB4C1] text-[10px] font-semibold uppercase tracking-wider border border-[#2C2C2C]">
                    {file.format}
                  </span>

                  <button
                    id={`btn-delete-file-${file.id}`}
                    onClick={() => onRemoveFile(file.id)}
                    title="Supprimer ce fichier"
                    disabled={isUploading}
                    className="p-1.5 rounded-lg text-[#8F8F8A] hover:text-[#D87A71] hover:bg-[#D87A71]/15 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom footer */}
        {files.length > 0 && (
          <div className="p-4 bg-[#111111]/80 border-t border-[#2C2C2C] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs text-[#8F8F8A] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#8EB735]" />

              <span>
                Total :{' '}
                <strong className="text-[#E4E9E1]">
                  {files.length} fichier
                  {files.length > 1 ? 's' : ''}
                </strong>{' '}
                prêts pour l'analyse.
              </span>
            </div>

            <button
              id="btn-voir-les-donnees"
              onClick={onGoToDataPreview}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#8EB735] hover:bg-[#7ea32e] active:bg-[#6f9027] text-[#0A0A0A] text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Table className="w-3.5 h-3.5" />

              <span>
                Voir les données
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};