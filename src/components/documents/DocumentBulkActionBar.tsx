import React, { useState } from 'react';
import { 
  Download, 
  Folder, 
  Trash2, 
  CheckCircle2, 
  X, 
  Loader2, 
  Archive, 
  Sliders, 
  Layers,
  ChevronDown
} from 'lucide-react';
import { DocumentItem, DocumentFolder, DocumentIssueStatus } from '../../types';
import { getDocumentFile } from '../../lib/documentStorage';
import { saveOrShareFile } from '../../lib/fileExportService';
import { Button } from '../ui';
import JSZip from 'jszip';

interface DocumentBulkActionBarProps {
  selectedDocIds: string[];
  allDocuments: DocumentItem[];
  folders: DocumentFolder[];
  onClearSelection: () => void;
  onMoveToFolder: (folderId: string) => void;
  onBulkUpdateStatus: (issueStatus: DocumentIssueStatus) => void;
  onBulkDelete: () => void;
}

export function DocumentBulkActionBar({
  selectedDocIds,
  allDocuments,
  folders,
  onClearSelection,
  onMoveToFolder,
  onBulkUpdateStatus,
  onBulkDelete
}: DocumentBulkActionBarProps) {
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgressText, setZipProgressText] = useState('');
  const [isMoveFolderOpen, setIsMoveFolderOpen] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState<string>('');
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  if (selectedDocIds.length === 0) return null;

  const selectedDocs = allDocuments.filter(d => selectedDocIds.includes(d.id));

  // High-performance ZIP creation using JSZip
  const handleDownloadZip = async () => {
    setIsZipping(true);
    setZipProgressText(`Bundling ${selectedDocs.length} files into ZIP archive...`);

    try {
      const zip = new JSZip();

      for (let i = 0; i < selectedDocs.length; i++) {
        const doc = selectedDocs[i];
        setZipProgressText(`Compressing (${i + 1}/${selectedDocs.length}): ${doc.fileName}`);

        // Try getting binary from IndexedDB
        const fileRecord = await getDocumentFile(doc.id);
        if (fileRecord && fileRecord.blob) {
          zip.file(doc.fileName, fileRecord.blob);
        } else if (doc.fileUrl && doc.fileUrl.startsWith('data:')) {
          // If base64 data URL
          const base64Data = doc.fileUrl.split(',')[1];
          if (base64Data) {
            zip.file(doc.fileName, base64Data, { base64: true });
          }
        } else {
          // Fallback text summary
          zip.file(`${doc.fileName}.txt`, `Document: ${doc.title}\nID: ${doc.id}\nCategory: ${doc.category}\nRevision: ${doc.revision || doc.version}`);
        }
      }

      setZipProgressText('Finalizing compressed archive...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `ConstructOS_Documents_Package_${timestamp}.zip`;

      saveOrShareFile({
        filename,
        blob: zipBlob,
        title: 'Project Documents Archive ZIP',
        saveToDownloads: true,
        triggerShare: true
      });

      setIsZipping(false);
      setZipProgressText('');
    } catch (err) {
      console.error('ZIP generation error:', err);
      alert('Failed to generate ZIP archive.');
      setIsZipping(false);
      setZipProgressText('');
    }
  };

  const handleConfirmMove = () => {
    onMoveToFolder(targetFolderId);
    setIsMoveFolderOpen(false);
  };

  return (
    <>
      <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 pointer-events-none animate-in slide-in-from-bottom-5 duration-200">
        <div className="bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700/80 px-4 py-3 sm:px-6 flex items-center justify-between gap-3 sm:gap-6 max-w-3xl w-full pointer-events-auto backdrop-blur-md">
          
          {/* Selected count info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {selectedDocIds.length}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-100 truncate">
                {selectedDocIds.length} Document{selectedDocIds.length > 1 ? 's' : ''} Selected
              </div>
              <div className="text-[10px] text-slate-400 font-mono hidden sm:block">
                Bulk operations ready
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            
            {/* Download ZIP */}
            <Button
              type="button"
              size="sm"
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
              title="Download all selected documents in a single ZIP file"
            >
              {isZipping ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Download ZIP</span>
            </Button>

            {/* Move to Folder */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsMoveFolderOpen(true)}
              className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            >
              <Folder className="h-3.5 w-3.5 text-blue-400" />
              <span className="hidden sm:inline">Move Folder</span>
            </Button>

            {/* Bulk Status Change */}
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                className="h-8 px-2.5 rounded-xl text-xs font-bold gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                <span className="hidden sm:inline">Set Status</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </Button>

              {isStatusMenuOpen && (
                <div className="absolute bottom-10 right-0 w-44 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-1.5 space-y-1 text-xs z-50">
                  <button
                    onClick={() => { onBulkUpdateStatus('IFC'); setIsStatusMenuOpen(false); }}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-700 text-emerald-400 font-bold flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>IFC Approved</span>
                  </button>
                  <button
                    onClick={() => { onBulkUpdateStatus('IFA'); setIsStatusMenuOpen(false); }}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-700 text-amber-400 font-bold flex items-center gap-2"
                  >
                    <span>IFA Under Review</span>
                  </button>
                  <button
                    onClick={() => { onBulkUpdateStatus('AB'); setIsStatusMenuOpen(false); }}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-700 text-purple-400 font-bold flex items-center gap-2"
                  >
                    <span>As-Built Survey</span>
                  </button>
                  <button
                    onClick={() => { onBulkUpdateStatus('SUP'); setIsStatusMenuOpen(false); }}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-700 text-red-400 font-bold flex items-center gap-2"
                  >
                    <span>Supersede / Void</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bulk Delete */}
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-800/80 transition-colors"
              title="Delete Selected Documents"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>

            {/* Clear Selection */}
            <button
              type="button"
              onClick={onClearSelection}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Deselect All"
            >
              <X className="h-3.5 w-3.5" />
            </button>

          </div>

        </div>
      </div>

      {/* Move to Folder Modal */}
      {isMoveFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600">
                  <Folder className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Move {selectedDocIds.length} Documents
                  </h3>
                  <p className="text-[11px] text-slate-500">Select target directory folder</p>
                </div>
              </div>
              <button onClick={() => setIsMoveFolderOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block text-[11px] font-bold uppercase text-slate-500">Target Folder</label>
              <select
                value={targetFolderId}
                onChange={e => setTargetFolderId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
              >
                <option value="">-- Root Directory (No Folder) --</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsMoveFolderOpen(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirmMove} className="rounded-xl text-xs bg-[#0B5FFF] hover:bg-blue-600 text-white font-bold">
                Move Documents
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-900/30 text-red-600 w-fit">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Delete {selectedDocIds.length} Documents?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete the selected documents? This will permanently remove their records and files.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsDeleteConfirmOpen(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={() => {
                  onBulkDelete();
                  setIsDeleteConfirmOpen(false);
                }} 
                className="rounded-xl text-xs bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                Delete {selectedDocIds.length} Files
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
