import React, { useState, useEffect } from 'react';
import { Button, Badge } from '../ui';
import { 
  X, Download, FileText, FileSpreadsheet, Image as ImageIcon, 
  FileCode, CheckCircle2, ShieldAlert, Clock, Calendar, User, 
  Tag, Link as LinkIcon, Edit3, ExternalLink, Layers, Copy, 
  Check, FileCheck, Eye, Loader2, Maximize2, Minimize2, 
  AlertCircle, Sparkles, BookOpen, GitBranch, History, 
  ShieldCheck, AlertTriangle, PenTool, CheckCheck, RefreshCw, Plus 
} from 'lucide-react';
import { Activity, DocumentItem, DocumentRevisionRecord } from '../../types';
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
  onUploadNewRevision?: (doc: DocumentItem) => void;
  activities: Activity[];
}

export function DocumentPreviewModal({
  document: doc,
  isOpen,
  onClose,
  onEdit,
  onAssignActivity,
  onUploadNewRevision,
  activities
}: DocumentPreviewModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'viewer' | 'history' | 'signoffs' | 'metadata'>('viewer');
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

  const isSuperseded = doc.issueStatus === 'SUP' || doc.status === 'Superseded';
  const isIFC = doc.issueStatus === 'IFC' || doc.status === 'Approved';
  const isIFA = doc.issueStatus === 'IFA' || doc.status === 'Under Review';

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

  // Dedicated in-browser viewers
  const renderActiveViewer = () => {
    const ext = doc.fileExtension.toLowerCase();

    if (doc.fileType === 'image' || ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp'].includes(ext)) {
      if (blobUrl || doc.fileUrl) {
        return <ImageViewer document={doc} src={blobUrl || doc.fileUrl || ''} onDownload={handleDownload} />;
      }
    }

    if (doc.fileType === 'pdf' || ext === 'pdf') {
      if (blobUrl || doc.fileUrl) {
        return <PdfViewer document={doc} src={blobUrl || doc.fileUrl || ''} onDownload={handleDownload} />;
      }
    }

    if (doc.fileType === 'excel' || ['xlsx', 'xls', 'csv', 'tsv'].includes(ext)) {
      return <SpreadsheetViewer document={doc} src={blobUrl || doc.fileUrl} onDownload={handleDownload} />;
    }

    if (doc.fileType === 'cad' || ['dwg', 'dxf', 'rvt', 'ifc', 'cad', 'nwd', 'skp'].includes(ext)) {
      return <CadBlueprintViewer document={doc} src={blobUrl || doc.fileUrl} onDownload={handleDownload} />;
    }

    if (doc.fileType === 'text' || ['txt', 'md', 'json', 'xml', 'log', 'yaml', 'yml', 'html', 'css', 'js', 'ts'].includes(ext)) {
      return <TextViewer document={doc} src={blobUrl || doc.fileUrl} onDownload={handleDownload} />;
    }

    return <DocSummaryViewer document={doc} src={blobUrl || doc.fileUrl} onDownload={handleDownload} />;
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto ${isFullscreen ? 'p-0' : ''}`}>
      <div 
        className={`bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col transition-all ${
          isFullscreen 
            ? 'h-screen w-screen max-w-none rounded-none' 
            : 'max-w-5xl rounded-3xl my-4 max-h-[92vh]'
        }`}
      >
        
        {/* Top Watermark Status Banner */}
        {isSuperseded ? (
          <div className="bg-red-600 text-white px-5 py-2 flex items-center justify-between text-xs font-bold shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>SUPERSEDED REVISION ({doc.revision || 'Historical'}) — This drawing is archived. Do NOT execute physical works from this sheet.</span>
            </div>
            <span className="text-[10px] bg-red-700 px-2 py-0.5 rounded font-mono uppercase">Void / Archived</span>
          </div>
        ) : isIFC ? (
          <div className="bg-emerald-600 text-white px-5 py-1.5 flex items-center justify-between text-xs font-bold shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span>ISSUED FOR CONSTRUCTION (IFC) — Current Certified Revision ({doc.revision || 'Rev 0'}) Approved for Active Site Works.</span>
            </div>
            <span className="text-[10px] bg-emerald-700 px-2 py-0.5 rounded font-mono uppercase">Verified IFC</span>
          </div>
        ) : isIFA ? (
          <div className="bg-amber-600 text-white px-5 py-1.5 flex items-center justify-between text-xs font-bold shrink-0">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>ISSUED FOR APPROVAL (IFA) — Revision ({doc.revision || 'Rev A'}) Under Consultant / Engineer Review.</span>
            </div>
            <span className="text-[10px] bg-amber-700 px-2 py-0.5 rounded font-mono uppercase">Pending Sign-off</span>
          </div>
        ) : null}

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/70 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
              {renderFileIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                  {doc.documentNumber || `DOC-${doc.id.slice(-6)}`}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 font-mono">
                  {doc.revision || 'Rev 0'}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  isIFC ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40' :
                  isIFA ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40' :
                  isSuperseded ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40' : 'bg-slate-100 text-slate-700'
                }`}>
                  {doc.issueStatus || doc.status}
                </span>
                {doc.discipline && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {doc.discipline}
                  </span>
                )}
                {doc.confidential && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
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
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            {onUploadNewRevision && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onUploadNewRevision(doc);
                }}
                className="h-8 px-2.5 rounded-xl text-xs font-bold gap-1 text-blue-700 border-blue-200 dark:border-blue-800 bg-blue-50/50 hover:bg-blue-100"
              >
                <GitBranch className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New Rev</span>
              </Button>
            )}

            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(doc);
                }}
                className="h-8 px-2.5 rounded-xl text-xs font-bold gap-1 text-slate-700 dark:text-slate-300"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            )}

            <Button
              onClick={handleDownload}
              size="sm"
              disabled={isDownloading}
              className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5 bg-[#0B5FFF] hover:bg-blue-600 text-white shadow-sm"
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
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
              <span>Interactive Viewer</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'border-[#0B5FFF] text-[#0B5FFF]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Revision History ({(doc.revisionHistory?.length || 0) + 1})</span>
            </button>

            <button
              onClick={() => setActiveTab('signoffs')}
              className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'signoffs'
                  ? 'border-[#0B5FFF] text-[#0B5FFF]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Approval Matrix</span>
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
              <span>Transmittal & Audit</span>
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
          
          {/* TAB 1: Viewer */}
          {activeTab === 'viewer' && (
            <div className="space-y-4">
              
              {/* Linked Activity Ribbon */}
              <div className="p-3.5 rounded-2xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/40 dark:bg-blue-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-[#0B5FFF] shrink-0">
                    <LinkIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                      Assigned Construction Activity
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
                    className="h-7 px-2.5 rounded-xl text-xs font-bold gap-1 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 shrink-0"
                  >
                    <LinkIcon className="h-3 w-3" />
                    <span>{doc.linkedActivityId ? 'Change Activity' : 'Assign to Activity'}</span>
                  </Button>
                )}
              </div>

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
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[10px] block mb-1">
                    Scope Remarks & Revision Notes
                  </span>
                  <p className="leading-relaxed">{doc.description}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Revision History Timeline */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Document Revision Stack & Historical Trail
                  </h4>
                  <p className="text-xs text-slate-400">
                    Complete chronological history conforming to ISO 19650 document control
                  </p>
                </div>

                {onUploadNewRevision && (
                  <Button
                    size="sm"
                    onClick={() => {
                      onClose();
                      onUploadNewRevision(doc);
                    }}
                    className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5 bg-[#0B5FFF] hover:bg-blue-600 text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Upload Next Revision</span>
                  </Button>
                )}
              </div>

              {/* Current Active Revision Card */}
              <div className="p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white font-mono">
                      {doc.revision || 'Rev 0'} (CURRENT)
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {doc.fileName}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                    ACTIVE IFC REVISION
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                  <div><strong>Uploaded:</strong> {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'N/A'}</div>
                  <div><strong>Author:</strong> {doc.uploadedBy || 'Site Engineer'}</div>
                  <div><strong>Size:</strong> {doc.fileSizeFormatted || 'N/A'}</div>
                </div>

                {doc.description && (
                  <div className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <span className="font-bold text-[10px] text-emerald-700 dark:text-emerald-400 uppercase block">Revision Summary:</span>
                    {doc.description}
                  </div>
                )}
              </div>

              {/* Historical Revision Cards */}
              {doc.revisionHistory && doc.revisionHistory.length > 0 ? (
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Superseded Past Revisions
                  </span>
                  {doc.revisionHistory.map((rev, index) => (
                    <div key={index} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2 opacity-85 hover:opacity-100 transition-opacity">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                            {rev.revision} (SUPERSEDED)
                          </span>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {rev.fileName}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded border border-red-200 dark:border-red-800">
                          VOID / ARCHIVED
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500 pt-1">
                        <div><strong>Archived Date:</strong> {new Date(rev.uploadedAt).toLocaleDateString()}</div>
                        <div><strong>Author:</strong> {rev.uploadedBy}</div>
                        <div><strong>File Size:</strong> {rev.fileSizeFormatted || `${Math.round(rev.fileSize / 1024)} KB`}</div>
                      </div>

                      {rev.changeSummary && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                          "{rev.changeSummary}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  This document is currently on its initial release ({doc.revision || 'Rev 0'}). No previous superseded revisions recorded.
                </div>
              )}

            </div>
          )}

          {/* TAB 3: Sign-Off Matrix */}
          {activeTab === 'signoffs' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Engineering Certification & Employer Acceptance Matrix
                </h4>
                <p className="text-xs text-slate-400">
                  Formal sign-off matrix for construction issue verification
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Role 1: Document Controller */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Lead Document Controller</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Registered</span>
                  </div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{doc.uploadedBy || 'Document Controller'}</div>
                  <div className="text-xs text-slate-500 font-mono">Date: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'N/A'}</div>
                </div>

                {/* Role 2: QA/QC Manager */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Project QA/QC Manager</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Verified</span>
                  </div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">David Smith</div>
                  <div className="text-xs text-slate-500 font-mono">Status: Conforms to Project Specs</div>
                </div>

                {/* Role 3: Resident Engineer */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Resident Project Engineer</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">Certified IFC</span>
                  </div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Sarah Jenkins (Pr.Eng)</div>
                  <div className="text-xs text-slate-500 font-mono">Stamp: SACPCMP #84920</div>
                </div>

                {/* Role 4: Client Consultant */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Employer / Client Representative</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Accepted</span>
                  </div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Transnet Engineering Oversight</div>
                  <div className="text-xs text-slate-500 font-mono">Transmittal Verified</div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: Metadata & Audit */}
          {activeTab === 'metadata' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Document Identifier</div>
                  <div className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">{doc.documentNumber || doc.id}</div>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Discipline & Category</div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {doc.discipline || 'General'} • {doc.category}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Issue Purpose</div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{doc.issueStatus || doc.status}</div>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Current Revision</div>
                  <div className="text-sm font-bold text-blue-600">{doc.revision || doc.version || 'Rev 0'}</div>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Registered Author</div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{doc.uploadedBy}</div>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Upload Date</div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Classified Tags */}
              {doc.tags && doc.tags.length > 0 && (
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
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
