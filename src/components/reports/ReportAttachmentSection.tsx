import React, { useState, useRef } from 'react';
import { 
  Paperclip, 
  Image as ImageIcon, 
  FileText, 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  Trash2, 
  Eye, 
  Plus, 
  X, 
  ZoomIn, 
  FileCode, 
  HardDrive, 
  FileCheck, 
  Maximize2,
  Calendar,
  User,
  Sparkles,
  Camera
} from 'lucide-react';
import { ReportAttachment } from '../../types';
import { saveDocumentFile, getDocumentFile, getDocumentBlobUrl } from '../../lib/documentStorage';
import { saveOrShareFile } from '../../lib/fileExportService';
import { formatFileSize } from '../../lib/documentUtils';

interface ReportAttachmentSectionProps {
  attachments?: ReportAttachment[];
  photos?: string[];
  onChange?: (updatedAttachments: ReportAttachment[], updatedPhotos: string[]) => void;
  currentUser?: string;
  readOnly?: boolean;
  compact?: boolean;
  title?: string;
  description?: string;
}

export function ReportAttachmentSection({
  attachments = [],
  photos = [],
  onChange,
  currentUser = 'Field Engineer',
  readOnly = false,
  compact = false,
  title = 'Documents & Site Photo Attachments',
  description = 'Attach technical submittals, site photos, inspection sign-offs, and survey files to this report.'
}: ReportAttachmentSectionProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'photos' | 'documents'>('all');
  const [lightboxAttachment, setLightboxAttachment] = useState<ReportAttachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
  const [captionText, setCaptionText] = useState('');

  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // Normalize all photos and attachments into a unified ReportAttachment list
  const unifiedAttachments: ReportAttachment[] = React.useMemo(() => {
    const list: ReportAttachment[] = [...(attachments || [])];
    
    // Check if there are raw string photo URLs that haven't been wrapped in ReportAttachment
    (photos || []).forEach((photoUrl, idx) => {
      const alreadyIncluded = list.some(a => a.url === photoUrl || a.id === `photo-raw-${idx}`);
      if (!alreadyIncluded && photoUrl) {
        list.push({
          id: `photo-raw-${idx}`,
          name: `Site Photo ${idx + 1}.jpg`,
          url: photoUrl,
          type: 'image/jpeg',
          uploadedAt: new Date().toISOString().split('T')[0],
          uploadedBy: currentUser
        });
      }
    });

    return list;
  }, [attachments, photos, currentUser]);

  const filteredItems = unifiedAttachments.filter(item => {
    const isImg = isImageAttachment(item);
    if (activeFilter === 'photos') return isImg;
    if (activeFilter === 'documents') return !isImg;
    return true;
  });

  const photoCount = unifiedAttachments.filter(a => isImageAttachment(a)).length;
  const docCount = unifiedAttachments.length - photoCount;

  function isImageAttachment(att: ReportAttachment): boolean {
    const type = (att.type || '').toLowerCase();
    const name = (att.name || '').toLowerCase();
    const url = (att.url || '').toLowerCase();
    return (
      type.startsWith('image/') ||
      name.endsWith('.jpg') ||
      name.endsWith('.jpeg') ||
      name.endsWith('.png') ||
      name.endsWith('.webp') ||
      name.endsWith('.gif') ||
      name.endsWith('.svg') ||
      name.endsWith('.heic') ||
      url.startsWith('data:image/')
    );
  }

  function getFileIcon(att: ReportAttachment) {
    const name = (att.name || '').toLowerCase();
    if (isImageAttachment(att)) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (name.endsWith('.pdf')) return <FileText className="h-5 w-5 text-rose-500" />;
    if (name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.csv')) return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
    if (name.endsWith('.dwg') || name.endsWith('.dxf')) return <FileCode className="h-5 w-5 text-purple-500" />;
    return <FileCheck className="h-5 w-5 text-slate-500" />;
  }

  // Handle Uploading Files (Photos or Documents)
  const handleFilesSelected = async (files: FileList | null, isCamera: boolean = false) => {
    if (!files || files.length === 0 || !onChange) return;
    setIsUploading(true);

    try {
      const newItems: ReportAttachment[] = [];
      const newPhotoUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const attachmentId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        
        // Save to IndexedDB binary store
        await saveDocumentFile(attachmentId, file, {
          fileName: file.name,
          mimeType: file.type,
          size: file.size
        });

        // Create a local blob URL or read as base64 for images
        let previewUrl = URL.createObjectURL(file);
        if (file.type.startsWith('image/')) {
          // If small, also convert to data URL for high-res offline embedding
          if (file.size < 3 * 1024 * 1024) {
            previewUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => resolve(URL.createObjectURL(file));
              reader.readAsDataURL(file);
            });
          }
          newPhotoUrls.push(previewUrl);
        }

        newItems.push({
          id: attachmentId,
          name: file.name,
          url: previewUrl,
          type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
          size: file.size,
          uploadedBy: currentUser,
          uploadedAt: new Date().toISOString().split('T')[0],
          caption: isCamera ? 'Site Inspection Capture' : ''
        });
      }

      const updatedList = [...unifiedAttachments, ...newItems];
      const allPhotos = updatedList.filter(isImageAttachment).map(a => a.url);

      onChange(updatedList, allPhotos);
    } catch (err) {
      console.error('Failed to attach files to report:', err);
      alert('Error uploading attachment. Please try again.');
    } finally {
      setIsUploading(false);
      if (photoFileInputRef.current) photoFileInputRef.current.value = '';
      if (docFileInputRef.current) docFileInputRef.current.value = '';
    }
  };

  // Handle Delete Attachment
  const handleDelete = (attachmentId: string) => {
    if (!onChange || readOnly) return;
    const confirmDel = window.confirm('Remove this attachment from the report?');
    if (!confirmDel) return;

    const updated = unifiedAttachments.filter(a => a.id !== attachmentId);
    const updatedPhotos = updated.filter(isImageAttachment).map(a => a.url);
    onChange(updated, updatedPhotos);

    if (lightboxAttachment?.id === attachmentId) {
      setLightboxAttachment(null);
    }
  };

  // Handle Download Attachment
  const handleDownload = async (att: ReportAttachment) => {
    try {
      const stored = await getDocumentFile(att.id);
      let blob: Blob;

      if (stored && stored.blob) {
        blob = stored.blob;
      } else if (att.url.startsWith('data:')) {
        const res = await fetch(att.url);
        blob = await res.blob();
      } else if (att.url.startsWith('blob:')) {
        const res = await fetch(att.url);
        blob = await res.blob();
      } else {
        // Fallback placeholder blob
        blob = new Blob([`Report Attachment: ${att.name}`], { type: att.type || 'text/plain' });
      }

      await saveOrShareFile({
        filename: att.name || 'Report_Attachment',
        blob,
        title: att.name,
        saveToDownloads: true,
        triggerShare: true
      });
    } catch (err) {
      console.error('Error downloading attachment:', err);
      // Fallback simple link download
      const link = document.createElement('a');
      link.href = att.url;
      link.download = att.name;
      link.click();
    }
  };

  // Save Caption
  const handleSaveCaption = (attachmentId: string) => {
    if (!onChange) return;
    const updated = unifiedAttachments.map(a => {
      if (a.id === attachmentId) {
        return { ...a, caption: captionText };
      }
      return a;
    });
    onChange(updated, updated.filter(isImageAttachment).map(a => a.url));
    setEditingCaptionId(null);
    setCaptionText('');
  };

  return (
    <div className={`rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm ${compact ? 'p-4' : 'p-6'} space-y-5 w-full`}>
      
      {/* Hidden File Inputs */}
      <input
        ref={photoFileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFilesSelected(e.target.files, false)}
      />
      <input
        ref={docFileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.dwg,.dxf,.txt,.zip,.png,.jpg,.jpeg"
        multiple
        className="hidden"
        onChange={e => handleFilesSelected(e.target.files, false)}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#0B5FFF] flex items-center justify-center">
              <Paperclip className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {unifiedAttachments.length} {unifiedAttachments.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        {/* Upload Buttons */}
        {!readOnly && (
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
            <button
              type="button"
              onClick={() => photoFileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#0B5FFF] dark:text-blue-300 text-xs font-semibold transition-colors border border-blue-200 dark:border-blue-800"
            >
              <Camera className="h-3.5 w-3.5" />
              <span>Add Photos</span>
            </button>

            <button
              type="button"
              onClick={() => docFileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B5FFF] hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Attach Documents</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            activeFilter === 'all'
              ? 'bg-[#0B5FFF] text-white shadow-2xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          All Items ({unifiedAttachments.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('photos')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeFilter === 'photos'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          <span>Photos ({photoCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('documents')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeFilter === 'documents'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Documents ({docCount})</span>
        </button>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 ? (
        <div 
          onClick={() => !readOnly && docFileInputRef.current?.click()}
          className={`border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center transition-colors ${!readOnly ? 'cursor-pointer hover:border-[#0B5FFF] hover:bg-blue-50/20' : ''}`}
        >
          <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <UploadCloud className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No {activeFilter === 'photos' ? 'Photos' : activeFilter === 'documents' ? 'Documents' : 'Attachments'} Attached Yet
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {!readOnly 
              ? 'Click to browse files or drag and drop pictures, PDF certificates, spreadsheets, or technical drawings.'
              : 'No documents or images were attached to this report record.'}
          </p>
        </div>
      ) : (
        /* Items Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const isImg = isImageAttachment(item);

            return (
              <div 
                key={item.id}
                className="group relative rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Visual Thumbnail for Images */}
                {isImg ? (
                  <div 
                    onClick={() => setLightboxAttachment(item)}
                    className="relative h-40 w-full bg-slate-900 cursor-pointer overflow-hidden flex items-center justify-center"
                  >
                    <img 
                      src={item.url} 
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="p-2 rounded-xl bg-white/90 text-slate-900 text-xs font-semibold flex items-center gap-1 shadow-lg backdrop-blur-xs">
                        <Maximize2 className="h-3.5 w-3.5" /> Full View
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Document Banner */
                  <div className="p-4 bg-gradient-to-br from-slate-100 to-slate-200/60 dark:from-slate-800 dark:to-slate-900/80 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-white dark:bg-slate-800 shadow-2xs border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                      {getFileIcon(item)}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                        {item.name.split('.').pop() || 'FILE'}
                      </span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {item.name}
                      </p>
                    </div>
                  </div>
                )}

                {/* Details Footer */}
                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={item.name}>
                      {item.name}
                    </h5>

                    {/* Caption / Description */}
                    {editingCaptionId === item.id ? (
                      <div className="mt-1 flex items-center gap-1">
                        <input
                          type="text"
                          value={captionText}
                          onChange={e => setCaptionText(e.target.value)}
                          placeholder="Add photo caption..."
                          className="w-full text-xs px-2 py-1 rounded-lg border border-blue-400 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveCaption(item.id)}
                          className="px-2 py-1 rounded-lg bg-[#0B5FFF] text-white text-[10px] font-bold"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <p 
                        onClick={() => {
                          if (!readOnly) {
                            setEditingCaptionId(item.id);
                            setCaptionText(item.caption || '');
                          }
                        }}
                        className={`text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 ${!readOnly ? 'cursor-pointer hover:text-[#0B5FFF]' : ''}`}
                        title={item.caption || 'Click to add caption'}
                      >
                        {item.caption || (!readOnly ? '+ Add caption/tag' : 'No description')}
                      </p>
                    )}
                  </div>

                  {/* Metadata and Action Buttons */}
                  <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-2">
                    <div className="text-[10px] font-mono text-slate-400 space-y-0.5">
                      {item.size ? <div>{formatFileSize(item.size)}</div> : null}
                      {item.uploadedAt ? <div>{item.uploadedAt}</div> : null}
                    </div>

                    <div className="flex items-center gap-1">
                      {isImg && (
                        <button
                          type="button"
                          onClick={() => setLightboxAttachment(item)}
                          className="p-1.5 rounded-lg bg-slate-200/70 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                          title="Preview Full Screen"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDownload(item)}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-[#0B5FFF] dark:text-blue-300 transition-colors"
                        title="Download / Share"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>

                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 transition-colors"
                          title="Remove Attachment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* High-Resolution Photo & Document Lightbox Modal */}
      {lightboxAttachment && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setLightboxAttachment(null)}
        >
          <div 
            className="relative max-w-5xl w-full max-h-[90vh] bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 text-white">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold truncate max-w-md">{lightboxAttachment.name}</h4>
                  <p className="text-[11px] text-slate-400">
                    Uploaded by {lightboxAttachment.uploadedBy || 'Inspector'} • {lightboxAttachment.uploadedAt || 'Today'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(lightboxAttachment)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B5FFF] hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxAttachment(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Photo / Document Canvas */}
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-950 min-h-[300px]">
              {isImageAttachment(lightboxAttachment) ? (
                <img 
                  src={lightboxAttachment.url} 
                  alt={lightboxAttachment.name}
                  className="max-h-[65vh] w-auto object-contain rounded-xl shadow-lg"
                />
              ) : (
                <div className="text-center p-8 space-y-4">
                  <div className="h-16 w-16 rounded-3xl bg-slate-800 text-[#0B5FFF] flex items-center justify-center mx-auto">
                    {getFileIcon(lightboxAttachment)}
                  </div>
                  <h4 className="text-lg font-bold text-white">{lightboxAttachment.name}</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    This document binary is stored in ConstructOS offline storage. Click "Download" to open in your default application.
                  </p>
                </div>
              )}
            </div>

            {/* Caption & Metadata Footer */}
            {lightboxAttachment.caption && (
              <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
                <span>{lightboxAttachment.caption}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
