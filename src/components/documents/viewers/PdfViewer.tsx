import React, { useState } from 'react';
import { FileText, ExternalLink, Download, AlertCircle, RefreshCw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { DocumentItem } from '../../../types';
import { Button } from '../../ui';

interface PdfViewerProps {
  document: DocumentItem;
  src: string;
  onDownload: () => void;
}

export function PdfViewer({ document: doc, src, onDownload }: PdfViewerProps) {
  const [loadError, setLoadError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const handleReload = () => {
    setLoadError(false);
    setIframeKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
      {/* Top Controls Header */}
      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{doc.fileName}</div>
            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
              <span>{doc.fileSizeFormatted || ''}</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">PDF Document View</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReload}
            title="Reload PDF Frame"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs flex items-center gap-1"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-[#0B5FFF] dark:text-blue-300 border border-blue-200 dark:border-blue-800 inline-flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open in Full Tab</span>
          </a>

          <Button
            size="sm"
            onClick={onDownload}
            className="h-8 px-3 rounded-lg text-xs font-bold gap-1.5 bg-[#0B5FFF] hover:bg-blue-600 text-white"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </Button>
        </div>
      </div>

      {/* PDF Viewport */}
      <div className="relative w-full h-[520px] bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center">
        {loadError ? (
          <div className="p-8 text-center max-w-md space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Browser PDF Viewer Notice
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your browser preview for embedded PDFs may be restricted by iframe sandbox policies. You can view the document directly in a high-resolution tab or download the file.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <a
                href={src}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0B5FFF] text-white hover:bg-blue-600 inline-flex items-center gap-1.5 shadow-sm"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open Full PDF in New Tab</span>
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                className="rounded-xl px-3 py-2 text-xs font-bold"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download</span>
              </Button>
            </div>
          </div>
        ) : (
          <iframe
            key={iframeKey}
            src={`${src}#toolbar=1&navpanes=1&statusbar=1`}
            title={doc.title}
            className="w-full h-full border-0 bg-white dark:bg-slate-900"
            onError={() => setLoadError(true)}
          />
        )}
      </div>
    </div>
  );
}
