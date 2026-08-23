import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Send, 
  Printer, 
  Download, 
  FileText, 
  CheckCircle2, 
  Building2, 
  UserCheck, 
  Layers, 
  Calendar, 
  Mail, 
  FileCheck, 
  ShieldCheck,
  Check,
  AlertCircle
} from 'lucide-react';
import { DocumentItem, DocumentTransmittal, DocumentIssueStatus, Project } from '../../types';
import { saveOrShareFile } from '../../lib/fileExportService';
import { Button, Badge } from '../ui';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DocumentTransmittalModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  initialSelectedDocIds?: string[];
  projects: Project[];
  currentUser: string;
  onIssueTransmittal: (transmittal: DocumentTransmittal) => void;
}

export function DocumentTransmittalModal({
  isOpen,
  onClose,
  documents,
  initialSelectedDocIds = [],
  projects,
  currentUser,
  onIssueTransmittal
}: DocumentTransmittalModalProps) {
  const activeProject = projects[0] || { id: 'PRJ-001', name: 'Standard Project' };

  const [transmittalNumber, setTransmittalNumber] = useState(
    () => `TRN-PRJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [issuedToCompany, setIssuedToCompany] = useState('Principal Consultant / Resident Engineer');
  const [issuedToRecipient, setIssuedToRecipient] = useState('Lead Project Engineer');
  const [issuedToEmail, setIssuedToEmail] = useState('engineer@consultancy.com');
  const [issuePurpose, setIssuePurpose] = useState<DocumentIssueStatus | 'For Approval' | 'For Construction' | 'For Information' | 'As-Built'>('IFC');
  const [transmissionMethod, setTransmissionMethod] = useState<'Digital Portal' | 'Email Package' | 'Hard Copy Delivery'>('Digital Portal');
  const [subject, setSubject] = useState('Submission of Engineering Drawings and Specifications');
  const [remarks, setRemarks] = useState('Please review and confirm receipt / approval within 14 calendar days per contractual requirements.');
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(() => {
    return new Set(initialSelectedDocIds.length > 0 ? initialSelectedDocIds : documents.slice(0, 5).map(d => d.id));
  });

  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialSelectedDocIds && initialSelectedDocIds.length > 0) {
        setSelectedDocIds(new Set(initialSelectedDocIds));
      } else {
        setSelectedDocIds(new Set(documents.slice(0, 5).map(d => d.id)));
      }
      setIsSuccess(false);
    }
  }, [isOpen, initialSelectedDocIds, documents]);

  if (!isOpen) return null;

  const attachedDocs = documents.filter(d => selectedDocIds.has(d.id));

  const toggleDoc = (docId: string) => {
    setSelectedDocIds(prev => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

  // Compile Executive Vector PDF Transmittal Notice
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const primaryColor = [11, 95, 255]; // #0B5FFF

    // Header banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 32, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('DOCUMENT TRANSMITTAL NOTICE (DTN)', 14, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`ISO 19650 FORMAL TRANSMITTAL CERTIFICATE | ${activeProject.name}`, 14, 22);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(56, 189, 248); // sky-400
    doc.text(`DTN NO: ${transmittalNumber}`, 196, 15, { align: 'right' });

    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`ISSUE DATE: ${new Date().toLocaleDateString('en-GB')}`, 196, 22, { align: 'right' });

    // Metadata Grid Boxes
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 38, 88, 38, 2, 2, 'F');
    doc.roundedRect(108, 38, 88, 38, 2, 2, 'F');

    // Issued From
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('ISSUED FROM (CONTRACTOR):', 18, 44);

    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Scedih Engineering / ConstructOS EDMS', 18, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(`Sender: ${currentUser}`, 18, 56);
    doc.text(`Project ID: ${activeProject.id}`, 18, 62);
    doc.text(`Transmission Method: ${transmissionMethod}`, 18, 68);

    // Issued To
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('ISSUED TO (RECIPIENT):', 112, 44);

    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`Company: ${issuedToCompany}`, 112, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(`Attn: ${issuedToRecipient}`, 112, 56);
    doc.text(`Email: ${issuedToEmail}`, 112, 62);
    doc.text(`Issue Purpose: ${issuePurpose}`, 112, 68);

    // Subject & Remarks
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, 80, 182, 20, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`SUBJECT: ${subject}`, 18, 86);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`REMARKS / INSTRUCTIONS: ${remarks}`, 18, 93, { maxWidth: 174 });

    // Table of Transmitted Documents
    const tableRows = attachedDocs.map((d, idx) => [
      String(idx + 1),
      d.documentNumber || d.id,
      d.title,
      d.discipline || 'General',
      d.revision || d.version,
      d.issueStatus || String(issuePurpose),
      d.fileExtension.toUpperCase()
    ]);

    autoTable(doc, {
      startY: 106,
      head: [['#', 'Document No.', 'Title / Description', 'Discipline', 'Rev', 'Purpose', 'Format']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left'
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: [30, 41, 59]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      }
    });

    // Signature and Signoff Stamp Block
    const finalY = (doc as any).lastAutoTable.finalY + 12;
    if (finalY < 250) {
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, finalY, 88, 30, 2, 2, 'S');
      doc.roundedRect(108, finalY, 88, 30, 2, 2, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('CONTRACTOR AUTHORIZED SIGNATURE', 18, finalY + 6);
      doc.text('CLIENT / CONSULTANT ACKNOWLEDGEMENT', 112, finalY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Signed: __________________________`, 18, finalY + 18);
      doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 18, finalY + 25);

      doc.text(`Received By: _____________________`, 112, finalY + 18);
      doc.text(`Date & Stamp: ____________________`, 112, finalY + 25);
    }

    const pdfBlob = doc.output('blob');
    saveOrShareFile({
      filename: `${transmittalNumber}_Transmittal_Notice.pdf`,
      blob: pdfBlob,
      title: `${transmittalNumber} Document Transmittal`,
      saveToDownloads: true,
      triggerShare: true
    });
  };

  const handleIssueTransmittalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (attachedDocs.length === 0) {
      alert('Please select at least one document to include in this transmittal.');
      return;
    }

    const transmittalRecord: DocumentTransmittal = {
      id: `TRN-${Date.now().toString(36).toUpperCase()}`,
      transmittalNumber: transmittalNumber.trim(),
      projectId: activeProject.id,
      issueDate: new Date().toISOString().slice(0, 10),
      issuedBy: currentUser,
      issuedToCompany: issuedToCompany.trim(),
      issuedToRecipient: issuedToRecipient.trim(),
      issuedToEmail: issuedToEmail.trim() || undefined,
      issuePurpose,
      transmissionMethod,
      subject: subject.trim(),
      remarks: remarks.trim() || undefined,
      documentIds: attachedDocs.map(d => d.id),
      documentSnapshots: attachedDocs.map(d => ({
        documentId: d.id,
        documentNumber: d.documentNumber || d.id,
        title: d.title,
        revision: d.revision || d.version,
        issueStatus: d.issueStatus || String(issuePurpose),
        fileExtension: d.fileExtension
      })),
      status: 'Issued'
    };

    onIssueTransmittal(transmittalRecord);
    handleExportPDF();
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl my-6 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 shadow-xs">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Issue Document Transmittal Notice (DTN)
                </h2>
                <Badge variant="outline" className="text-[10px] font-mono uppercase bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  ISO 19650 Form
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Generate official contractual submittal certificates for Clients, Engineers, and Subcontractors.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleIssueTransmittalSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {isSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>Transmittal Notice issued and PDF Certificate generated successfully!</span>
            </div>
          )}

          {/* Top Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Transmittal No. *
              </label>
              <input
                type="text"
                required
                value={transmittalNumber}
                onChange={e => setTransmittalNumber(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-[#0B5FFF]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Issue Purpose *
              </label>
              <select
                value={issuePurpose}
                onChange={e => setIssuePurpose(e.target.value as any)}
                className="w-full h-9 px-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-emerald-700"
              >
                <option value="IFC">For Construction (IFC)</option>
                <option value="IFA">For Approval (IFA)</option>
                <option value="IFI">For Information (IFI)</option>
                <option value="AB">As-Built Survey (AB)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Transmission Method
              </label>
              <select
                value={transmissionMethod}
                onChange={e => setTransmissionMethod(e.target.value as any)}
                className="w-full h-9 px-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              >
                <option value="Digital Portal">Digital Portal (EDMS)</option>
                <option value="Email Package">Email Package</option>
                <option value="Hard Copy Delivery">Hard Copy Delivery (Courier)</option>
              </select>
            </div>
          </div>

          {/* Recipient Details Row */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Recipient Organization *
              </label>
              <input
                type="text"
                required
                value={issuedToCompany}
                onChange={e => setIssuedToCompany(e.target.value)}
                placeholder="e.g. Mott MacDonald / Arup"
                className="w-full h-8 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Attention (Contact Name) *
              </label>
              <input
                type="text"
                required
                value={issuedToRecipient}
                onChange={e => setIssuedToRecipient(e.target.value)}
                placeholder="e.g. Lead Resident Engineer"
                className="w-full h-8 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Recipient Email
              </label>
              <input
                type="email"
                value={issuedToEmail}
                onChange={e => setIssuedToEmail(e.target.value)}
                placeholder="e.g. engineer@consultant.com"
                className="w-full h-8 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Subject and Remarks */}
          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Subject *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full h-8 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Contractual Remarks & Review Instructions</label>
              <textarea
                rows={2}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              />
            </div>
          </div>

          {/* Document Checklist Selection */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Attached Documents ({attachedDocs.length} Selected)</span>
              <span className="text-[11px] text-[#0B5FFF] font-mono">Select drawings or specs to transmit</span>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {documents.map(doc => {
                const isSelected = selectedDocIds.has(doc.id);
                return (
                  <div
                    key={doc.id}
                    onClick={() => toggleDoc(doc.id)}
                    className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded text-indigo-600 h-4 w-4"
                      />
                      <div className="min-w-0">
                        <div className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 truncate">
                          {doc.documentNumber || doc.id} • {doc.revision || doc.version}
                        </div>
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                          {doc.title}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                      {doc.fileExtension.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={attachedDocs.length === 0}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Preview Vector PDF Notice</span>
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={attachedDocs.length === 0}
                className="rounded-xl text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5 shadow-sm"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Issue DTN Certificate ({attachedDocs.length} Docs)</span>
              </Button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
