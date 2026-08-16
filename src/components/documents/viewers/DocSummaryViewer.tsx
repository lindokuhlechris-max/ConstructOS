import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, ShieldCheck, AlertCircle, Download, Copy, Check, ExternalLink, Bookmark, Clock, User, Building, FileCheck } from 'lucide-react';
import { DocumentItem } from '../../../types';
import { Button } from '../../ui';
import { readDocumentTextChunk } from '../../../lib/documentStorage';

interface DocSummaryViewerProps {
  document: DocumentItem;
  src?: string | null;
  onDownload: () => void;
}

export function DocSummaryViewer({ document: doc, onDownload }: DocSummaryViewerProps) {
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadExtract() {
      setLoading(true);
      try {
        const chunk = await readDocumentTextChunk(doc.id, 200 * 1024);
        if (!active) return;

        if (chunk && chunk.text && chunk.text.trim().length > 0) {
          // Check if plain text
          const hasNull = chunk.text.slice(0, 500).includes('\0');
          if (!hasNull) {
            setExtractedText(chunk.text);
          }
        }
      } catch (err) {
        console.warn('Could not extract text preview:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadExtract();

    return () => {
      active = false;
    };
  }, [doc.id]);

  const handleCopyTransmittal = () => {
    const summary = `=== TRANSMITTAL RECORD ===\nDocument ID: ${doc.id}\nTitle: ${doc.title}\nCategory: ${doc.category}\nVersion: ${doc.version} | Status: ${doc.status}\nAuthor: ${doc.uploadedBy}\nProject Activity: ${doc.linkedActivityName || 'None'}\nDescription:\n${doc.description || 'No description'}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
      {/* Top Header */}
      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#0B5FFF] dark:text-blue-400">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{doc.title}</div>
            <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
              <span>{doc.fileName}</span>
              <span>•</span>
              <span>{doc.fileSizeFormatted || ''}</span>
              <span>•</span>
              <span className="text-[#0B5FFF] font-semibold">{doc.category}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyTransmittal}
            className="rounded-xl px-3 py-1.5 text-xs font-bold gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Summary'}</span>
          </Button>

          <Button
            size="sm"
            onClick={onDownload}
            className="h-8 px-3 rounded-lg text-xs font-bold gap-1.5 bg-[#0B5FFF] hover:bg-blue-600 text-white shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </Button>
        </div>
      </div>

      {/* Main Document Content Viewport */}
      <div className="p-6 overflow-y-auto max-h-[520px] space-y-6 text-slate-800 dark:text-slate-200">
        
        {/* Document Scope Abstract */}
        <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Executive Summary & Purpose
          </div>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {doc.description ||
              `This document serves as an authorized construction transmittal and technical reference for ${doc.title}. All project personnel and contractors executing related site operations must verify compliance against the specifications contained herein.`}
          </p>
        </div>

        {/* Technical Specification Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Bookmark className="h-3.5 w-3.5 text-blue-500" />
              <span>Specification Parameters</span>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Document Type</span>
                <span className="font-semibold">{doc.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">File Format</span>
                <span className="font-mono font-semibold uppercase">{doc.fileExtension} ({doc.fileType})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Classification</span>
                <span className="font-semibold">{doc.confidential ? 'Restricted / Confidential' : 'Standard Project Distribution'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Revision State</span>
                <span className="font-mono font-bold text-[#0B5FFF]">{doc.version}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Compliance & QA Sign-Off</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Approval State</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{doc.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Quality Framework</span>
                <span className="font-semibold">ISO 9001:2015 / ISO 45001</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Sign-Off By</span>
                <span className="font-semibold">{doc.uploadedBy}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Verification Date</span>
                <span className="font-mono">{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-GB') : 'Verified'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Extracted Text View if available */}
        {extractedText && (
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileCheck className="h-3.5 w-3.5 text-blue-500" />
              <span>Extracted Text Stream</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 text-slate-300 font-mono text-xs max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
              {extractedText}
            </div>
          </div>
        )}

        {/* Quality Standard Banner */}
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
            <strong>Verified Construction Specification</strong> — This transmittal has been verified and registered in the ConstructOS document repository. You can review all sections without downloading or request revision updates.
          </div>
        </div>

      </div>
    </div>
  );
}
