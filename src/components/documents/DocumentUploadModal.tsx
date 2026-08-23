import React, { useState, useRef, useEffect } from 'react';
import { Button, CustomSelect } from '../ui';
import { 
  X, 
  UploadCloud, 
  FileText, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  FileCode, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  Link as LinkIcon, 
  Plus, 
  Tag, 
  Loader2, 
  HardDrive,
  GitBranch,
  Layers,
  Compass,
  FileCheck,
  RefreshCw
} from 'lucide-react';
import { Activity, DocumentCategory, DocumentFileType, DocumentItem, DocumentStatus, DocumentIssueStatus, DocumentDiscipline, DocumentRevisionRecord } from '../../types';
import { formatFileSize } from '../../lib/documentUtils';
import { saveDocumentFile } from '../../lib/documentStorage';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (doc: DocumentItem) => void;
  activities: Activity[];
  currentUser: string;
  projectId?: string;
  defaultActivityId?: string;
  defaultCategory?: DocumentCategory;
  defaultQAInspectionId?: string;
  defaultQAInspectionTitle?: string;
  lockCategory?: boolean;
  existingDocuments?: DocumentItem[];
  initialTargetDocForRevision?: DocumentItem | null;
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

const ISSUE_STATUSES: { code: DocumentIssueStatus; label: string; desc: string }[] = [
  { code: 'IFC', label: 'IFC - Issued For Construction', desc: 'Approved for active physical site execution' },
  { code: 'IFA', label: 'IFA - Issued For Approval', desc: 'Submitted for consultant / engineer review' },
  { code: 'IFI', label: 'IFI - Issued For Information', desc: 'Reference and coordination copy' },
  { code: 'AB', label: 'AB - As-Built Record', desc: 'Survey-verified final completed installation' },
  { code: 'TND', label: 'TND - Tender / Bid', desc: 'Procurement and tender package' },
  { code: 'SUP', label: 'SUP - Superseded / Void', desc: 'Archived historical revision' }
];

export function DocumentUploadModal({
  isOpen,
  onClose,
  onUpload,
  activities,
  currentUser,
  projectId = 'PRJ-001',
  defaultActivityId,
  defaultCategory,
  defaultQAInspectionId,
  defaultQAInspectionTitle,
  lockCategory = false,
  existingDocuments = [],
  initialTargetDocForRevision = null
}: DocumentUploadModalProps) {
  const [uploadMode, setUploadMode] = useState<'new' | 'revision'>(initialTargetDocForRevision ? 'revision' : 'new');
  const [targetDocId, setTargetDocId] = useState<string>(initialTargetDocForRevision?.id || '');

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [documentNumber, setDocumentNumber] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>(defaultCategory || 'Drawings & Blueprints');
  const [discipline, setDiscipline] = useState<DocumentDiscipline>('Civil');
  const [issueStatus, setIssueStatus] = useState<DocumentIssueStatus>('IFC');
  const [status, setStatus] = useState<DocumentStatus>('Approved');
  const [revision, setRevision] = useState('Rev 0');
  const [version, setVersion] = useState('v1.0');
  const [changeSummary, setChangeSummary] = useState('');
  const [linkedActivityId, setLinkedActivityId] = useState<string>(defaultActivityId || '');
  const [description, setDescription] = useState('');
  const [confidential, setConfidential] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(() => {
    const initialTags: string[] = [];
    if (defaultQAInspectionId) {
      initialTags.push('QA-QC', defaultQAInspectionId);
    }
    return initialTags;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // If initial target doc changed
  useEffect(() => {
    if (initialTargetDocForRevision) {
      setUploadMode('revision');
      setTargetDocId(initialTargetDocForRevision.id);
      populateFromTargetDoc(initialTargetDocForRevision);
    }
  }, [initialTargetDocForRevision]);

  const populateFromTargetDoc = (doc: DocumentItem) => {
    setDocumentNumber(doc.documentNumber || `DOC-${doc.id.slice(-6)}`);
    setTitle(doc.title);
    setCategory(doc.category);
    if (doc.discipline) setDiscipline(doc.discipline as DocumentDiscipline);
    setLinkedActivityId(doc.linkedActivityId || '');
    // Bump revision e.g. Rev 0 -> Rev 1, Rev A -> Rev B
    const currentRev = doc.revision || 'Rev 0';
    if (currentRev.startsWith('Rev ')) {
      const num = parseInt(currentRev.replace('Rev ', ''), 10);
      if (!isNaN(num)) {
        setRevision(`Rev ${num + 1}`);
      } else {
        const letter = currentRev.replace('Rev ', '');
        const nextChar = String.fromCharCode(letter.charCodeAt(0) + 1);
        setRevision(`Rev ${nextChar}`);
      }
    } else {
      setRevision('Rev 1');
    }
    setIssueStatus('IFC');
  };

  const handleTargetDocChange = (docId: string) => {
    setTargetDocId(docId);
    const found = existingDocuments.find(d => d.id === docId);
    if (found) {
      populateFromTargetDoc(found);
    }
  };

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

  const handleFileProcess = (file: File) => {
    setErrorMsg('');

    const MAX_ALLOWED_SIZE = 150 * 1024 * 1024; // 150MB
    if (file.size > MAX_ALLOWED_SIZE) {
      setErrorMsg(`Selected file is too large (${formatFileSize(file.size)}). Maximum supported file size is 150 MB.`);
      return;
    }

    setSelectedFile(file);

    // Auto-generate title if empty
    if (!title && uploadMode === 'new') {
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const cleanTitle = nameWithoutExt
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      setTitle(cleanTitle);

      // Auto-suggest document number if empty
      if (!documentNumber) {
        const code = cleanTitle.slice(0, 8).toUpperCase().replace(/\s+/g, '-');
        setDocumentNumber(`TSP-${code}-001`);
      }
    }

    // Auto-guess category based on filename keywords
    const lowerName = file.name.toLowerCase();
    if (lowerName.includes('dwg') || lowerName.includes('draw') || lowerName.includes('plan') || lowerName.includes('layout')) {
      setCategory('Drawings & Blueprints');
    } else if (lowerName.includes('rebar') || lowerName.includes('boq') || lowerName.includes('spec') || lowerName.includes('mix')) {
      setCategory('Specifications & Specs');
    } else if (lowerName.includes('safety') || lowerName.includes('swms') || lowerName.includes('hazard')) {
      setCategory('Safety & Compliance');
    } else if (lowerName.includes('qa') || lowerName.includes('qc') || lowerName.includes('pour') || lowerName.includes('inspect')) {
      setCategory('QA/QC Inspections');
    } else if (lowerName.includes('cost') || lowerName.includes('val') || lowerName.includes('invoice') || lowerName.includes('claim')) {
      setCategory('Financial & Invoices');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !title) {
      setErrorMsg('Please select a file or enter document information.');
      return;
    }

    if (uploadMode === 'revision' && !targetDocId) {
      setErrorMsg('Please select the existing document you wish to revise.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const ext = selectedFile ? selectedFile.name.split('.').pop() || 'bin' : 'pdf';
      const mime = selectedFile?.type || 'application/pdf';
      const fileType = determineFileType(ext, mime);
      const fileSize = selectedFile?.size || 1024 * 512;
      const fileName = selectedFile?.name || `${title.toLowerCase().replace(/\s+/g, '_')}.${ext}`;

      const linkedActivity = activities.find(a => a.id === linkedActivityId);

      // Handle Revision Mode: Update existing document and push old revision into history
      if (uploadMode === 'revision' && targetDocId) {
        const targetDoc = existingDocuments.find(d => d.id === targetDocId);
        if (targetDoc) {
          setUploadProgressText(`Securing revision file payload...`);
          
          // Save new binary
          if (selectedFile) {
            await saveDocumentFile(targetDoc.id, selectedFile, {
              fileName,
              mimeType: mime,
              size: fileSize
            });
          }

          // Build historical revision record for previous version
          const prevRevisionRecord: DocumentRevisionRecord = {
            revision: targetDoc.revision || targetDoc.version || 'Rev 0',
            version: targetDoc.version || '1.0',
            uploadedAt: targetDoc.uploadedAt,
            uploadedBy: targetDoc.uploadedBy,
            fileName: targetDoc.fileName,
            fileSize: targetDoc.fileSize,
            fileSizeFormatted: targetDoc.fileSizeFormatted,
            fileUrl: targetDoc.fileUrl,
            changeSummary: targetDoc.description || 'Initial Release',
            status: 'Superseded',
            issueStatus: 'SUP',
            transmittalNumber: targetDoc.transmittalNumber
          };

          const existingHistory = targetDoc.revisionHistory || [];

          const updatedDoc: DocumentItem = {
            ...targetDoc,
            title: title.trim() || targetDoc.title,
            fileName,
            fileType,
            fileExtension: ext.toLowerCase(),
            fileSize,
            fileSizeFormatted: formatFileSize(fileSize),
            discipline,
            category,
            revision: revision.trim() || 'Rev 1',
            version: version.trim() || 'v2.0',
            status: issueStatus === 'IFC' ? 'Approved' : (issueStatus === 'IFA' ? 'Under Review' : 'Approved'),
            issueStatus,
            isCurrentRevision: true,
            revisionHistory: [prevRevisionRecord, ...existingHistory],
            description: changeSummary.trim() || description.trim() || undefined,
            uploadedBy: currentUser || 'Site Engineer',
            uploadedAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
          };

          onUpload(updatedDoc);
          setIsSubmitting(false);
          onClose();
          return;
        }
      }

      // Handle New Document Mode
      const docId = `DOC-${Math.floor(100 + Math.random() * 900)}-${Date.now().toString(36).toUpperCase()}`;

      if (selectedFile) {
        setUploadProgressText(`Securing ${formatFileSize(fileSize)} binary payload...`);
        await saveDocumentFile(docId, selectedFile, {
          fileName,
          mimeType: mime,
          size: fileSize
        });
      }

      setUploadProgressText('Registering ISO Document metadata...');

      const newDoc: DocumentItem = {
        id: docId,
        projectId,
        documentNumber: documentNumber.trim() || `DOC-${docId.slice(-6)}`,
        title: title.trim() || fileName,
        fileName,
        fileType,
        fileExtension: ext.toLowerCase(),
        fileSize,
        fileSizeFormatted: formatFileSize(fileSize),
        category,
        discipline,
        tags: tags.length > 0 ? tags : [category.split(' ')[0], discipline],
        revision: revision.trim() || 'Rev 0',
        version: version.trim() || 'v1.0',
        status: issueStatus === 'IFC' ? 'Approved' : (issueStatus === 'IFA' ? 'Under Review' : 'Approved'),
        issueStatus,
        isCurrentRevision: true,
        revisionHistory: [],
        linkedActivityId: linkedActivity ? linkedActivity.id : undefined,
        linkedActivityName: linkedActivity ? linkedActivity.name : undefined,
        linkedQAInspectionId: defaultQAInspectionId || undefined,
        linkedQAInspectionTitle: defaultQAInspectionTitle || undefined,
        uploadedBy: currentUser || 'Site Engineer',
        uploadedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        description: description.trim() || undefined,
        confidential
      };

      onUpload(newDoc);
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      console.error('Error during document upload:', err);
      setErrorMsg(`Failed to save document: ${err?.message || 'Storage error'}. Please try again.`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-[#0B5FFF]">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{uploadMode === 'new' ? 'Upload Controlled Document' : 'Upload New Revision (Supersede Previous)'}</span>
              </h2>
              <p className="text-xs text-slate-500">
                {uploadMode === 'new'
                  ? 'Attach drawings, specifications, contracts, and QA records with ISO numbering.'
                  : 'Upload an updated drawing revision. The previous version will be automatically marked Superseded.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Mode Selector */}
          {existingDocuments.length > 0 && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setUploadMode('new')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  uploadMode === 'new'
                    ? 'bg-white dark:bg-slate-700 text-[#0B5FFF] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Plus className="h-4 w-4" />
                <span>Upload New Document</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUploadMode('revision');
                  if (!targetDocId && existingDocuments[0]) {
                    handleTargetDocChange(existingDocuments[0].id);
                  }
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  uploadMode === 'revision'
                    ? 'bg-white dark:bg-slate-700 text-[#0B5FFF] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <GitBranch className="h-4 w-4" />
                <span>Upload Revision for Existing</span>
              </button>
            </div>
          )}

          {/* Existing Document Picker (If in Revision Mode) */}
          {uploadMode === 'revision' && (
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-2">
              <label className="block text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                Select Existing Document to Revise <span className="text-red-500">*</span>
              </label>
              <select
                value={targetDocId}
                onChange={e => handleTargetDocChange(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="">-- Choose document to update --</option>
                {existingDocuments.map(d => (
                  <option key={d.id} value={d.id}>
                    [{d.revision || 'Rev 0'}] {d.documentNumber || `DOC-${d.id.slice(-6)}`} - {d.title}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Uploading this new file will archive current revision to Superseded history.</span>
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 flex items-center gap-2.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* File Drag-and-Drop Area */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
              Select or Drop File <span className="text-red-500">*</span>
            </label>
            
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                dragActive
                  ? 'border-[#0B5FFF] bg-blue-50/50 dark:bg-blue-950/20 scale-[0.99]'
                  : selectedFile
                  ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-[#0B5FFF] bg-slate-50/50 dark:bg-slate-800/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileInputChange}
                className="hidden"
                accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.dwg,.dxf,.png,.jpg,.jpeg,.zip,.txt"
              />

              {selectedFile ? (
                <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                      {selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.csv') ? (
                        <FileSpreadsheet className="h-6 w-6" />
                      ) : selectedFile.name.endsWith('.png') || selectedFile.name.endsWith('.jpg') ? (
                        <ImageIcon className="h-6 w-6" />
                      ) : (
                        <FileText className="h-6 w-6" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{selectedFile.name}</div>
                      <div className="text-xs text-slate-500 font-medium">{formatFileSize(selectedFile.size)} • Click or drop another to replace</div>
                    </div>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 ml-2" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-[#0B5FFF] flex items-center justify-center mx-auto">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Click to browse or drag & drop file here
                  </div>
                  <p className="text-xs text-slate-400">
                    PDF, AutoCAD (.dwg, .dxf), Excel (.xlsx, .csv), Word, Images up to 150 MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Document Number & Revision Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Document Number / Drawing Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={documentNumber}
                onChange={e => setDocumentNumber(e.target.value)}
                placeholder="e.g. TSP-DWG-CIV-003"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Revision Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={revision}
                onChange={e => setRevision(e.target.value)}
                placeholder="e.g. Rev 0, Rev 1, Rev A"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-blue-600 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Document Title & Scope <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. MV Cable Trench Layout & Cross-Section Details"
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
            />
          </div>

          {/* Discipline & Issue Status Purpose */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Engineering Discipline
              </label>
              <select
                value={discipline}
                onChange={e => setDiscipline(e.target.value as DocumentDiscipline)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
              >
                {DISCIPLINES.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Issue Status / Purpose
              </label>
              <select
                value={issueStatus}
                onChange={e => setIssueStatus(e.target.value as DocumentIssueStatus)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
              >
                {ISSUE_STATUSES.map(s => (
                  <option key={s.code} value={s.code}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category & Activity Linking */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Document Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as DocumentCategory)}
                disabled={lockCategory}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Link to Activity (Optional)
              </label>
              <select
                value={linkedActivityId}
                onChange={e => setLinkedActivityId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
              >
                <option value="">-- No Linked Activity --</option>
                {activities.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.status})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Change Summary (for Revisions) or Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              {uploadMode === 'revision' ? 'Revision Change Summary / Transmittal Notes' : 'Description / Scope Remarks'}
            </label>
            <textarea
              rows={2}
              value={uploadMode === 'revision' ? changeSummary : description}
              onChange={e => uploadMode === 'revision' ? setChangeSummary(e.target.value) : setDescription(e.target.value)}
              placeholder={uploadMode === 'revision' ? 'e.g. Revised trench invert depths at chainage 0+450 following RFI-012.' : 'Key notes, drawing references, or specifications'}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400 font-mono">
              {uploadProgressText}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl text-xs bg-[#0B5FFF] hover:bg-blue-600 text-white font-bold gap-1.5 shadow-sm">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" />
                    <span>{uploadMode === 'new' ? 'Register Document' : 'Publish Revision'}</span>
                  </>
                )}
              </Button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
