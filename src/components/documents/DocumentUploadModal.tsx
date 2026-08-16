import React, { useState, useRef } from 'react';
import { Button, CustomSelect } from '../ui';
import { X, UploadCloud, FileText, FileSpreadsheet, Image as ImageIcon, FileCode, CheckCircle2, AlertCircle, ShieldAlert, Link as LinkIcon, Plus, Tag, Loader2, HardDrive } from 'lucide-react';
import { Activity, DocumentCategory, DocumentFileType, DocumentItem, DocumentStatus } from '../../types';
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

export function DocumentUploadModal({
  isOpen,
  onClose,
  onUpload,
  activities,
  currentUser,
  projectId = 'PRJ-9348',
  defaultActivityId
}: DocumentUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('Specifications & Specs');
  const [status, setStatus] = useState<DocumentStatus>('Approved');
  const [version, setVersion] = useState('v1.0');
  const [linkedActivityId, setLinkedActivityId] = useState<string>(defaultActivityId || '');
  const [description, setDescription] = useState('');
  const [confidential, setConfidential] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleFileProcess = (file: File) => {
    setErrorMsg('');

    // Safety check for extreme file size (e.g. > 150MB)
    const MAX_ALLOWED_SIZE = 150 * 1024 * 1024; // 150MB
    if (file.size > MAX_ALLOWED_SIZE) {
      setErrorMsg(`Selected file is too large (${formatFileSize(file.size)}). Maximum supported file size is 150 MB.`);
      return;
    }

    setSelectedFile(file);

    // Auto-generate title if empty
    if (!title) {
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const cleanTitle = nameWithoutExt
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      setTitle(cleanTitle);
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

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const ext = selectedFile ? selectedFile.name.split('.').pop() || 'bin' : 'pdf';
      const mime = selectedFile?.type || 'application/pdf';
      const fileType = determineFileType(ext, mime);
      const fileSize = selectedFile?.size || 1024 * 512;
      const fileName = selectedFile?.name || `${title.toLowerCase().replace(/\s+/g, '_')}.${ext}`;

      const linkedActivity = activities.find(a => a.id === linkedActivityId);
      const docId = `DOC-${Math.floor(100 + Math.random() * 900)}-${Date.now().toString(36).toUpperCase()}`;

      // If a binary file was uploaded, store it securely in IndexedDB
      if (selectedFile) {
        setUploadProgressText(`Securing ${formatFileSize(fileSize)} binary payload...`);
        await saveDocumentFile(docId, selectedFile, {
          fileName,
          mimeType: mime,
          size: fileSize
        });
      }

      setUploadProgressText('Registering document metadata...');

      const newDoc: DocumentItem = {
        id: docId,
        projectId,
        title: title.trim() || fileName,
        fileName,
        fileType,
        fileExtension: ext.toLowerCase(),
        fileSize,
        fileSizeFormatted: formatFileSize(fileSize),
        category,
        tags: tags.length > 0 ? tags : [category.split(' ')[0]],
        version: version.trim() || 'v1.0',
        status,
        linkedActivityId: linkedActivity ? linkedActivity.id : undefined,
        linkedActivityName: linkedActivity ? linkedActivity.name : undefined,
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-[#0B5FFF]">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Upload Project Document</h2>
              <p className="text-xs text-slate-500">Attach blueprints, spreadsheets, specs, or contracts with activity linking.</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5 max-h-[80vh] overflow-y-auto">
          
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
                <div className="flex flex-col items-center">
                  <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#0B5FFF] mb-2.5">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Drag & drop your document here, or <span className="text-[#0B5FFF] hover:underline">browse files</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Supports PDF, Excel (.xlsx, .csv), Word (.docx), CAD (.dwg), Images (.png, .jpg), and Archives (.zip)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Title & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Document Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Foundation Structural IFC Drawing Rev C"
                required
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <CustomSelect
                value={category}
                onChange={(val) => setCategory(val as DocumentCategory)}
                options={CATEGORIES.map(c => ({ value: c, label: c }))}
                className="w-full"
              />
            </div>
          </div>

          {/* Version & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Version / Revision
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="v1.0 or Rev C"
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Review Status
              </label>
              <CustomSelect
                value={status}
                onChange={(val) => setStatus(val as DocumentStatus)}
                options={[
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Under Review', label: 'Under Review' },
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Archived', label: 'Archived' }
                ]}
                className="w-full"
              />
            </div>

            {/* Optional Activity Assignment */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Assign to Activity</span>
                <span className="text-[10px] text-blue-600 font-semibold lowercase">optional</span>
              </label>
              <CustomSelect
                value={linkedActivityId}
                onChange={(val) => setLinkedActivityId(val)}
                options={[
                  { value: '', label: 'None (Unassigned)' },
                  ...activities.map(a => ({
                    value: a.id,
                    label: `${a.name} (${a.status})`
                  }))
                ]}
                className="w-full"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Tags & Keywords
            </label>
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex-1">
                <Tag className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Type tag (e.g. Rebar, Steel, SWMS) and press Enter or click Add"
                  className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                />
              </div>
              <Button
                type="button"
                onClick={handleAddTag}
                variant="outline"
                className="h-10 px-3.5 rounded-xl font-bold text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map(t => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800"
                  >
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-red-500 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Description & Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a brief summary of what this document covers, revisions made, or key specifications..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
            />
          </div>

          {/* Confidentiality Checkbox */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              id="confidential"
              checked={confidential}
              onChange={(e) => setConfidential(e.target.checked)}
              className="h-4 w-4 rounded text-[#0B5FFF] focus:ring-[#0B5FFF] border-slate-300 cursor-pointer"
            />
            <label htmlFor="confidential" className="text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer select-none flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
              Mark as Confidential / Restricted Access Document
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2.5">
            <div className="text-xs text-slate-500 font-medium truncate max-w-xs flex items-center gap-1.5">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0B5FFF]" />
                  <span className="text-[#0B5FFF] font-semibold">{uploadProgressText || 'Saving document...'}</span>
                </>
              ) : selectedFile ? (
                <>
                  <HardDrive className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Size: <strong>{formatFileSize(selectedFile.size)}</strong> (Max 150 MB)</span>
                </>
              ) : (
                <span>Max file size: 150 MB</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl px-4 py-2 font-semibold text-xs sm:text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#0B5FFF] hover:bg-blue-600 text-white rounded-xl px-5 py-2 font-semibold text-xs sm:text-sm shadow-sm gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" />
                    <span>Save & Attach Document</span>
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
