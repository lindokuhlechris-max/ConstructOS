import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  Layers, 
  FileCode, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  Check, 
  Sliders, 
  Folder,
  FolderOpen
} from 'lucide-react';
import { 
  DocumentItem, 
  DocumentFolder, 
  DocumentCategory, 
  DocumentFileType, 
  DocumentIssueStatus, 
  DocumentDiscipline, 
  Activity 
} from '../../types';
import { formatFileSize } from '../../lib/documentUtils';
import { saveDocumentFile } from '../../lib/documentStorage';
import { Button } from '../ui';

interface StagedFileItem {
  id: string;
  file: File;
  documentNumber: string;
  title: string;
  fileName: string;
  fileSize: number;
  fileSizeFormatted: string;
  fileType: DocumentFileType;
  fileExtension: string;
  category: DocumentCategory;
  discipline: DocumentDiscipline;
  issueStatus: DocumentIssueStatus;
  folderId?: string;
  revision: string;
}

interface DocumentBatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadBatch: (docs: DocumentItem[]) => void;
  folders: DocumentFolder[];
  activities: Activity[];
  currentUser: string;
  projectId?: string;
  defaultFolderId?: string | null;
}

const CATEGORIES: DocumentCategory[] = [
  'Drawings & Blueprints',
  'Contracts & Agreements',
  'Specifications & Specs',
  'Safety & Compliance',
  'QA/QC Inspections',
  'Financial & Invoices',
  'Material Data Sheets (MSDS)',
  'Daily Logs & Site Records',
  'Method Statements',
  'General'
];

const DISCIPLINES: DocumentDiscipline[] = [
  'Civil',
  'Structural',
  'Electrical & MEP',
  'Mechanical',
  'Geotechnical & Survey',
  'Architectural',
  'HSE & Safety',
  'Commercial & Contracts',
  'General'
];

const ISSUE_STATUSES: DocumentIssueStatus[] = ['IFC', 'IFA', 'IFI', 'AB', 'TND'];

export function DocumentBatchUploadModal({
  isOpen,
  onClose,
  onUploadBatch,
  folders,
  activities,
  currentUser,
  projectId = 'PRJ-001',
  defaultFolderId
}: DocumentBatchUploadModalProps) {
  const [stagedFiles, setStagedFiles] = useState<StagedFileItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, text: '' });
  const [errorMsg, setErrorMsg] = useState('');

  // Bulk Apply Controls
  const [bulkDiscipline, setBulkDiscipline] = useState<DocumentDiscipline>('Civil');
  const [bulkCategory, setBulkCategory] = useState<DocumentCategory>('Drawings & Blueprints');
  const [bulkIssueStatus, setBulkIssueStatus] = useState<DocumentIssueStatus>('IFC');
  const [bulkFolderId, setBulkFolderId] = useState<string>(defaultFolderId || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const determineFileType = (ext: string, mime: string): DocumentFileType => {
    const lowerExt = ext.toLowerCase();
    if (lowerExt === 'pdf' || mime.includes('pdf')) return 'pdf';
    if (['xlsx', 'xls', 'csv', 'ods'].includes(lowerExt) || mime.includes('sheet') || mime.includes('csv') || mime.includes('excel')) return 'excel';
    if (['docx', 'doc', 'rtf', 'odt'].includes(lowerExt) || mime.includes('word') || mime.includes('document')) return 'word';
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(lowerExt) || mime.startsWith('image/')) return 'image';
    if (['dwg', 'dxf', 'rvt', 'ifc', 'step'].includes(lowerExt)) return 'cad';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(lowerExt) || mime.includes('zip') || mime.includes('compressed')) return 'archive';
    if (['txt', 'log', 'md', 'json'].includes(lowerExt) || mime.startsWith('text/')) return 'text';
    return 'other';
  };

  // Smart metadata parser from filename
  const parseMetadataFromFilename = (file: File): StagedFileItem => {
    const fileName = file.name;
    const ext = fileName.split('.').pop() || 'bin';
    const mime = file.type || '';
    const fileType = determineFileType(ext, mime);

    let docNumber = `TSP-DWG-${Date.now().toString(36).slice(-4).toUpperCase()}`;
    let revision = 'Rev 0';
    let discipline: DocumentDiscipline = 'Civil';
    let category: DocumentCategory = 'Drawings & Blueprints';

    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    let cleanTitle = nameWithoutExt.replace(/[_-]+/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const lowerName = fileName.toLowerCase();

    // Guess Discipline
    if (lowerName.includes('elec') || lowerName.includes('cable') || lowerName.includes('mv') || lowerName.includes('power') || lowerName.includes('solar') || lowerName.includes('inverter')) {
      discipline = 'Electrical & MEP';
    } else if (lowerName.includes('struct') || lowerName.includes('steel') || lowerName.includes('rebar') || lowerName.includes('concrete') || lowerName.includes('beam')) {
      discipline = 'Structural';
    } else if (lowerName.includes('mech') || lowerName.includes('pipe') || lowerName.includes('pump') || lowerName.includes('hvac')) {
      discipline = 'Mechanical';
    } else if (lowerName.includes('topo') || lowerName.includes('survey') || lowerName.includes('geotech') || lowerName.includes('borehole')) {
      discipline = 'Geotechnical & Survey';
    } else if (lowerName.includes('arch') || lowerName.includes('floor') || lowerName.includes('elevation')) {
      discipline = 'Architectural';
    } else if (lowerName.includes('safe') || lowerName.includes('swms') || lowerName.includes('hse') || lowerName.includes('risk')) {
      discipline = 'HSE & Safety';
    }

    // Guess Category
    if (lowerName.includes('spec') || lowerName.includes('data sheet')) {
      category = 'Specifications & Specs';
    } else if (lowerName.includes('contract') || lowerName.includes('agreement') || lowerName.includes('po')) {
      category = 'Contracts & Agreements';
    } else if (lowerName.includes('method') || lowerName.includes('swms')) {
      category = 'Method Statements';
    } else if (lowerName.includes('qa') || lowerName.includes('qc') || lowerName.includes('itp') || lowerName.includes('test')) {
      category = 'QA/QC Inspections';
    }

    // Guess Revision
    const revMatch = fileName.match(/rev[ _-]?([0-9a-z]+)/i);
    if (revMatch && revMatch[1]) {
      revision = `Rev ${revMatch[1].toUpperCase()}`;
    }

    // Guess Document Number
    const docNoMatch = fileName.match(/([a-z0-9]{2,5}-[a-z0-9]{2,5}-[a-z0-9]{2,5}(-[0-9]{2,4})?)/i);
    if (docNoMatch && docNoMatch[0]) {
      docNumber = docNoMatch[0].toUpperCase();
    }

    return {
      id: `DOC-BATCH-${Math.floor(100 + Math.random() * 900)}-${Date.now().toString(36).toUpperCase()}`,
      file,
      documentNumber: docNumber,
      title: cleanTitle,
      fileName,
      fileSize: file.size,
      fileSizeFormatted: formatFileSize(file.size),
      fileType,
      fileExtension: ext.toLowerCase(),
      category,
      discipline,
      issueStatus: 'IFC',
      folderId: defaultFolderId || undefined,
      revision
    };
  };

  const handleFilesAdded = (files: FileList | File[]) => {
    setErrorMsg('');
    const newStaged: StagedFileItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 150 * 1024 * 1024) continue; // skip oversized
      newStaged.push(parseMetadataFromFilename(file));
    }
    setStagedFiles(prev => [...prev, ...newStaged]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const handleRemoveStaged = (id: string) => {
    setStagedFiles(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateStagedItem = (id: string, updates: Partial<StagedFileItem>) => {
    setStagedFiles(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  // Bulk Apply Functions
  const handleApplyBulkDiscipline = () => {
    setStagedFiles(prev => prev.map(item => ({ ...item, discipline: bulkDiscipline })));
  };

  const handleApplyBulkCategory = () => {
    setStagedFiles(prev => prev.map(item => ({ ...item, category: bulkCategory })));
  };

  const handleApplyBulkIssueStatus = () => {
    setStagedFiles(prev => prev.map(item => ({ ...item, issueStatus: bulkIssueStatus })));
  };

  const handleApplyBulkFolder = () => {
    setStagedFiles(prev => prev.map(item => ({ ...item, folderId: bulkFolderId || undefined })));
  };

  // Execute Parallel Upload to IndexedDB & Register
  const handleExecuteBatchUpload = async () => {
    if (stagedFiles.length === 0) return;

    setIsUploading(true);
    setErrorMsg('');
    const total = stagedFiles.length;
    const uploadedDocs: DocumentItem[] = [];

    try {
      for (let i = 0; i < total; i++) {
        const item = stagedFiles[i];
        setUploadProgress({
          current: i + 1,
          total,
          text: `Processing file ${i + 1} of ${total}: ${item.fileName}`
        });

        // Save Binary Payload to IndexedDB
        await saveDocumentFile(item.id, item.file, {
          fileName: item.fileName,
          mimeType: item.file.type || 'application/octet-stream',
          size: item.fileSize
        });

        const newDoc: DocumentItem = {
          id: item.id,
          projectId,
          folderId: item.folderId,
          documentNumber: item.documentNumber,
          title: item.title,
          fileName: item.fileName,
          fileType: item.fileType,
          fileExtension: item.fileExtension,
          fileSize: item.fileSize,
          fileSizeFormatted: item.fileSizeFormatted,
          category: item.category,
          discipline: item.discipline,
          tags: [item.category.split(' ')[0], item.discipline],
          version: 'v1.0',
          revision: item.revision,
          status: item.issueStatus === 'IFC' ? 'Approved' : 'Under Review',
          issueStatus: item.issueStatus,
          isCurrentRevision: true,
          revisionHistory: [],
          uploadedBy: currentUser || 'Batch Ingestion Engine',
          uploadedAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        };

        uploadedDocs.push(newDoc);
      }

      onUploadBatch(uploadedDocs);
      setIsUploading(false);
      onClose();
    } catch (err: any) {
      console.error('Batch upload error:', err);
      setErrorMsg(`Failed batch upload: ${err?.message || 'Storage error'}`);
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl my-6 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-900/40 text-teal-600 shadow-xs">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Multi-File Batch Document Ingestion</span>
                <span className="text-[10px] font-mono font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-md">
                  {stagedFiles.length} Staged
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Drag and drop 50+ drawings or specs. Metadata, revision, and discipline are auto-extracted from filenames.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* Drag and Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all duration-200 ${
              dragActive
                ? 'border-[#0B5FFF] bg-blue-50/50 dark:bg-blue-950/20 scale-[0.99]'
                : 'border-slate-300 dark:border-slate-700 hover:border-[#0B5FFF] bg-slate-50/50 dark:bg-slate-800/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={e => e.target.files && handleFilesAdded(e.target.files)}
              className="hidden"
              accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.dwg,.dxf,.png,.jpg,.jpeg,.zip,.txt"
            />
            <div className="h-10 w-10 rounded-2xl bg-teal-50 dark:bg-teal-900/40 text-teal-600 flex items-center justify-center mx-auto mb-2">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Click to select multiple files or drag & drop files here
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Supports simultaneous batch upload of PDFs, AutoCAD drawings, specs, and spreadsheets
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Bulk Controls Toolbar */}
          {stagedFiles.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-blue-500" />
                  <span>Bulk Apply to All Staged Files</span>
                </span>
                <span className="text-slate-400 font-mono text-[11px]">{stagedFiles.length} files selected</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {/* Bulk Discipline */}
                <div className="flex gap-1.5">
                  <select
                    value={bulkDiscipline}
                    onChange={e => setBulkDiscipline(e.target.value as DocumentDiscipline)}
                    className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200"
                  >
                    {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <Button type="button" size="sm" variant="outline" onClick={handleApplyBulkDiscipline} className="rounded-xl text-[11px] px-2.5 font-bold">
                    Apply
                  </Button>
                </div>

                {/* Bulk Issue Status */}
                <div className="flex gap-1.5">
                  <select
                    value={bulkIssueStatus}
                    onChange={e => setBulkIssueStatus(e.target.value as DocumentIssueStatus)}
                    className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-emerald-700"
                  >
                    {ISSUE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <Button type="button" size="sm" variant="outline" onClick={handleApplyBulkIssueStatus} className="rounded-xl text-[11px] px-2.5 font-bold">
                    Apply
                  </Button>
                </div>

                {/* Bulk Category */}
                <div className="flex gap-1.5">
                  <select
                    value={bulkCategory}
                    onChange={e => setBulkCategory(e.target.value as DocumentCategory)}
                    className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-300"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <Button type="button" size="sm" variant="outline" onClick={handleApplyBulkCategory} className="rounded-xl text-[11px] px-2.5 font-bold">
                    Apply
                  </Button>
                </div>

                {/* Bulk Target Folder */}
                <div className="flex gap-1.5">
                  <select
                    value={bulkFolderId}
                    onChange={e => setBulkFolderId(e.target.value)}
                    className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-300"
                  >
                    <option value="">-- Root Directory --</option>
                    {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  <Button type="button" size="sm" variant="outline" onClick={handleApplyBulkFolder} className="rounded-xl text-[11px] px-2.5 font-bold">
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Staged Items Table */}
          {stagedFiles.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2.5">Doc Number</th>
                    <th className="px-3 py-2.5">Title & File</th>
                    <th className="px-3 py-2.5">Discipline</th>
                    <th className="px-3 py-2.5">Rev</th>
                    <th className="px-3 py-2.5">Issue</th>
                    <th className="px-3 py-2.5">Folder</th>
                    <th className="px-3 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {stagedFiles.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.documentNumber}
                          onChange={e => handleUpdateStagedItem(item.id, { documentNumber: e.target.value })}
                          className="w-32 font-mono font-bold p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px]"
                        />
                      </td>

                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.title}
                          onChange={e => handleUpdateStagedItem(item.id, { title: e.target.value })}
                          className="w-full font-semibold p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px]"
                        />
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.fileName} ({item.fileSizeFormatted})</div>
                      </td>

                      <td className="px-3 py-2">
                        <select
                          value={item.discipline}
                          onChange={e => handleUpdateStagedItem(item.id, { discipline: e.target.value as DocumentDiscipline })}
                          className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px]"
                        >
                          {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </td>

                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.revision}
                          onChange={e => handleUpdateStagedItem(item.id, { revision: e.target.value })}
                          className="w-16 font-mono font-bold text-blue-600 p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px]"
                        />
                      </td>

                      <td className="px-3 py-2">
                        <select
                          value={item.issueStatus}
                          onChange={e => handleUpdateStagedItem(item.id, { issueStatus: e.target.value as DocumentIssueStatus })}
                          className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-emerald-700"
                        >
                          {ISSUE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>

                      <td className="px-3 py-2">
                        <select
                          value={item.folderId || ''}
                          onChange={e => handleUpdateStagedItem(item.id, { folderId: e.target.value || undefined })}
                          className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] max-w-[140px] truncate"
                        >
                          <option value="">-- Root --</option>
                          {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                      </td>

                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveStaged(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-lg"
                          title="Remove file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-200">
                <span>Batch Uploading Files...</span>
                <span>{uploadProgress.current} / {uploadProgress.total}</span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-[#0B5FFF] h-full transition-all duration-150"
                  style={{ width: `${(uploadProgress.current / Math.max(1, uploadProgress.total)) * 100}%` }}
                />
              </div>
              <div className="text-[11px] text-blue-700 dark:text-blue-300 font-mono truncate">
                {uploadProgress.text}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStagedFiles([])}
            disabled={stagedFiles.length === 0 || isUploading}
            className="rounded-xl text-xs text-red-600 hover:bg-red-50"
          >
            Clear All
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleExecuteBatchUpload}
              disabled={stagedFiles.length === 0 || isUploading}
              className="rounded-xl text-xs bg-[#0B5FFF] hover:bg-blue-600 text-white font-bold gap-1.5 shadow-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Ingesting Batch ({uploadProgress.current}/{uploadProgress.total})...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  <span>Publish Batch ({stagedFiles.length} Documents)</span>
                </>
              )}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
