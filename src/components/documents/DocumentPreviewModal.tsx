import React, { useState, useEffect } from 'react';
import { Button } from '../ui';
import { 
  X, Download, FileText, FileSpreadsheet, Image as ImageIcon, 
  FileCode, CheckCircle2, ShieldAlert, Clock, Calendar, User, 
  Tag, Link as LinkIcon, Edit3, ExternalLink, Layers, Copy, 
  Check, FileCheck, Eye, Loader2, Maximize2, Minimize2, 
  AlertCircle, Sparkles, BookOpen 
} from 'lucide-react';
import { Activity, DocumentItem } from '../../types';
import { downloadDocument, getDocumentFile } from '../../lib/documentStorage';
import { ImageViewer } from './viewers/ImageViewer';
import { PdfViewer } from './viewers/PdfViewer';
import { SpreadsheetViewer } from './viewers/SpreadsheetViewer';
import { TextViewer } from './viewers/TextViewer';
import { CadBlueprintViewer } from './viewers/CadBlueprintViewer';
import { DocSummaryViewer } from './viewers/DocSummaryViewer';

interface DocumentPreviewModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (doc: DocumentItem) => void;
  onAssignActivity?: (doc: DocumentItem) => void;
  activities: Activity[];
}

export function DocumentPreviewModal({
  document: doc,
  isOpen,
  onClose,
  onEdit,
  onAssignActivity,
  activities
}: DocumentPreviewModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'viewer' | 'metadata'>('viewer');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoadingBlob, setIsLoadingBlob] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    async function loadBinary() {
      if (!doc || !isOpen) {
        setBlobUrl(null);
        return;
      }

      setIsLoadingBlob(true);
      try {
        const record = await getDocumentFile(doc.id);
        if (active && record && record.blob) {
          createdUrl = URL.createObjectURL(record.blob);
          setBlobUrl(createdUrl);
        } else if (active && doc.fileUrl) {
          setBlobUrl(doc.fileUrl);
        } else if (active) {
          setBlobUrl(null);
        }
      } catch (err) {
        console.error('Error loading document blob for preview:', err);
      } finally {
        if (active) setIsLoadingBlob(false);
      }
    }

    loadBinary();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [doc?.id, isOpen]);

  if (!isOpen || !doc) return null;

  const linkedActivity = activities.find(a => a.id === doc.linkedActivityId);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadDocument(doc);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/documents?id=${doc.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderFileIcon = () => {
    switch (doc.fileType) {
      case 'excel':
        return <FileSpreadsheet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />;
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />;
      case 'image':
        return <ImageIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />;
      case 'cad':
        return <Layers className="h-6 w-6 text-blue-500 dark:text-blue-400" />;
      case 'text':
        return <FileCode className="h-6 w-6 text-blue-600 dark:text-blue-400" />;
      default:
        return <FileText className="h-6 w-6 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      case 'Under Review':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      case 'Draft':
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  // Route to the appropriate dedicated viewer component
  const renderActiveViewer = () => {
    const ext = doc.fileExtension.toLowerCase();

    // 1. Image Viewer (PNG, JPG, WEBP, SVG, GIF, BMP)
    if (doc.fileType === 'image' || ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp'].includes(ext)) {
      if (blobUrl || doc.fileUrl) {
        return <ImageViewer document={doc} src={blobUrl || doc.fileUrl || ''} onDownload={handleDownload} />;
      }
    }

    // 2. PDF Viewer (PDF files)
    if (doc.fileType === 'pdf' || ext === 'pdf') {
      if (blobUrl || doc.fileUrl) {
        return <PdfViewer document={doc} src={blobUrl || doc.fileUrl || ''} onDownload={handleDownload} />;
      }
    }

    // 3. Spreadsheet / CSV / Tabular Viewer (XLSX, XLS, CSV, TSV)
    if (doc.fileType === 'excel' || ['xlsx', 'xls', 'csv', 'tsv'].includes(ext)) {
      return <SpreadsheetViewer document={doc} src={blobUrl || doc.fileUrl} onDownload={handleDownload} />;
    }

    // 4. CAD & Blueprint Vector Viewer (DWG, DXF, RVT, CAD, drawings)
    if (doc.fileType === 'cad' || ['dwg', 'dxf', 'rvt', 'ifc', 'cad', 'nwd', 'skp'].includes(ext)) {
      return <CadBlueprintViewer document={doc} src={blobUrl || doc.fileUrl} onDownload={handleDownload} />;
    }

    // 5. Code / Text / Markdown / Log / JSON / XML Viewer
    if (doc.fileType === 'text' || ['txt', 'md', 'json', 'xml', 'log', 'yaml', 'yml', 'html', 'css', 'js', 'ts'].includes(ext)) {
      return <TextViewer document={doc} src={blobUrl || doc.fileUrl} onDownload={handleDownload} />;
    }

    // 6. Word / Specs / Transmittal Summary Viewer (DOC, DOCX, General, Specifications)
    return <DocSummaryViewer document={doc} src={blobUrl || doc.fileUrl} onDownload={handleDownload} />;
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto ${isFullscreen ? 'p-0' : ''}`}>
      <div 
        className={`bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col transition-all ${
          isFullscreen 
            ? 'h-screen w-screen max-w-none rounded-none' 
            : 'max-w-5xl rounded-2xl my-4 max-h-[92vh]'
        }`}
      >
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/70 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
              {renderFileIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">{doc.id}</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(doc.status)}`}>
                  {doc.status}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {doc.version}
                </span>
                {doc.confidential && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" />
                    Confidential
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                {doc.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(doc);
                }}
                className="h-8 px-2.5 rounded-lg text-xs font-bold gap-1 text-slate-700 dark:text-slate-300"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            )}

            <Button
              onClick={handleDownload}
              size="sm"
              disabled={isDownloading}
              className="h-8 px-3 rounded-lg text-xs font-bold gap-1.5 bg-[#0B5FFF] hover:bg-blue-600 text-white"
            >
              {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Download</span>
            </Button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('viewer')}
              className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'viewer'
                  ? 'border-[#0B5FFF] text-[#0B5FFF]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Interactive In-Browser Viewer</span>
            </button>
            <button
              onClick={() => setActiveTab('metadata')}
              className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'metadata'
                  ? 'border-[#0B5FFF] text-[#0B5FFF]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileCheck className="h-3.5 w-3.5" />
              <span>Transmittal Specs & Audit</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <span>{doc.fileSizeFormatted || `${doc.fileSize} B`}</span>
            <span>•</span>
            <span className="uppercase">{doc.fileExtension}</span>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          
          {activeTab === 'viewer' ? (
            <div className="space-y-4">
              
              {/* Linked Activity Ribbon */}
              <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/40 dark:bg-blue-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-[#0B5FFF] shrink-0">
                    <LinkIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                      Assigned Activity
                    </div>
                    {doc.linkedActivityName ? (
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap mt-0.5">
                        <span>{doc.linkedActivityName}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-mono">
                          {doc.linkedActivityId}
                        </span>
                        {linkedActivity && (
                          <span className="text-[11px] text-slate-500 font-normal">
                            (Progress: <strong>{linkedActivity.progress ?? 0}%</strong> • {linkedActivity.status})
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 italic mt-0.5">
                        Not currently assigned to any construction activity.
                      </div>
                    )}
                  </div>
                </div>

                {onAssignActivity && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onClose();
                      onAssignActivity(doc);
                    }}
                    className="h-7 px-2.5 rounded-lg text-xs font-bold gap-1 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 shrink-0"
                  >
                    <LinkIcon className="h-3 w-3" />
                    <span>{doc.linkedActivityId ? 'Change Activity' : 'Assign to Activity'}</span>
                  </Button>
                )}
              </div>

              {/* Linked QA/QC Inspection Ribbon */}
              {doc.linkedQAInspectionId && (
                <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 shrink-0">
                      <FileCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                        Linked QA/QC Inspection
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap mt-0.5">
                        <span>{doc.linkedQAInspectionTitle || 'Quality Inspection Record'}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-mono">
                          {doc.linkedQAInspectionId}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dedicated In-Browser Viewer Container */}
              {isLoadingBlob ? (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-12 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-center text-center min-h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-[#0B5FFF] mb-3" />
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Preparing In-Browser Viewer...
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Loading {doc.fileSizeFormatted || ''} file payload safely from storage
                  </div>
                </div>
              ) : (
                renderActiveViewer()
              )}

              {/* Document Summary Notes */}
              {doc.description && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[10px] block mb-1">
                    Document Scope Notes
                  </span>
                  <p className="leading-relaxed">{doc.description}</p>
                </div>
              )}
            </div>
          ) : (
            /* Specifications & Audit Trail Tab */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Document Identifier</div>
                  <div className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">{doc.id}</div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">File Size & Extension</div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {doc.fileSizeFormatted || `${doc.fileSize} B`} ({doc.fileExtension.toUpperCase()})
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Category & Subsystem</div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{doc.category}</div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Current Version</div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{doc.version}</div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Registered Author</div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{doc.uploadedBy}</div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Upload Date</div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Classified Tags */}
              {doc.tags && doc.tags.length > 0 && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Classified Search Tags
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {doc.tags.map(t => (
                      <span
                        key={t}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quality & Compliance Certification */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Project Compliance Framework
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Verified conforming to Constructfield Document Management Standard ISO 19650 / ISO 9001</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span>Project: <strong className="text-slate-700 dark:text-slate-300">{doc.projectId}</strong></span>
            <span>•</span>
            <button
              onClick={handleCopyLink}
              className="text-[#0B5FFF] hover:underline font-semibold flex items-center gap-1"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? 'Link Copied' : 'Share Link'}</span>
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl px-4 py-1.5 font-semibold text-xs"
            >
              Close
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
