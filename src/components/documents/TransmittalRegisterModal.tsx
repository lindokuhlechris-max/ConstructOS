import React, { useState, useMemo } from 'react';
import { 
  X, 
  Send, 
  Search, 
  Filter, 
  Printer, 
  Download, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  ChevronRight, 
  Building2, 
  Calendar,
  Layers,
  FileCheck
} from 'lucide-react';
import { DocumentTransmittal, Project } from '../../types';
import { saveOrShareFile } from '../../lib/fileExportService';
import { Button, Badge } from '../ui';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TransmittalRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  transmittals: DocumentTransmittal[];
  projects: Project[];
  currentUser: string;
  onDeleteTransmittal: (id: string) => void;
  canEdit: boolean;
}

export function TransmittalRegisterModal({
  isOpen,
  onClose,
  transmittals,
  projects,
  currentUser,
  onDeleteTransmittal,
  canEdit
}: TransmittalRegisterModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTransmittal, setSelectedTransmittal] = useState<DocumentTransmittal | null>(null);

  if (!isOpen) return null;

  const activeProject = projects[0] || { id: 'PRJ-001', name: 'Standard Project' };

  const filteredTransmittals = useMemo(() => {
    return transmittals.filter(t => {
      if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${t.transmittalNumber} ${t.issuedToCompany} ${t.issuedToRecipient} ${t.subject} ${t.issuedBy}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [transmittals, selectedStatus, searchQuery]);

  const active = selectedTransmittal || filteredTransmittals[0] || null;

  // Re-generate vector PDF
  const handlePrintPDF = (t: DocumentTransmittal) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Header banner
    doc.setFillColor(15, 23, 42);
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
    doc.setTextColor(56, 189, 248);
    doc.text(`DTN NO: ${t.transmittalNumber}`, 196, 15, { align: 'right' });

    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`ISSUE DATE: ${t.issueDate}`, 196, 22, { align: 'right' });

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
    doc.text(`Sender: ${t.issuedBy}`, 18, 56);
    doc.text(`Project ID: ${t.projectId}`, 18, 62);
    doc.text(`Transmission Method: ${t.transmissionMethod}`, 18, 68);

    // Issued To
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('ISSUED TO (RECIPIENT):', 112, 44);

    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`Company: ${t.issuedToCompany}`, 112, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(`Attn: ${t.issuedToRecipient}`, 112, 56);
    doc.text(`Email: ${t.issuedToEmail || '-'}`, 112, 62);
    doc.text(`Issue Purpose: ${t.issuePurpose}`, 112, 68);

    // Subject & Remarks
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, 80, 182, 20, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`SUBJECT: ${t.subject}`, 18, 86);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`REMARKS: ${t.remarks || 'Standard Issue'}`, 18, 93, { maxWidth: 174 });

    const tableRows = (t.documentSnapshots || []).map((d, idx) => [
      String(idx + 1),
      d.documentNumber,
      d.title,
      d.revision,
      d.issueStatus,
      d.fileExtension.toUpperCase()
    ]);

    autoTable(doc, {
      startY: 106,
      head: [['#', 'Document No.', 'Title / Description', 'Rev', 'Purpose', 'Format']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: [30, 41, 59]
      }
    });

    const pdfBlob = doc.output('blob');
    saveOrShareFile({
      filename: `${t.transmittalNumber}_Transmittal_Notice.pdf`,
      blob: pdfBlob,
      title: `${t.transmittalNumber} Document Transmittal`,
      saveToDownloads: true,
      triggerShare: true
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-6xl my-6 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 shadow-xs">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Document Transmittal Register (DTN Log)
                </h2>
                <Badge variant="outline" className="text-[10px] font-mono uppercase bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {transmittals.length} Transmittals Logged
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Official audit trail of all submittal notices issued to Clients, Engineers, and Contractors.
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

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
          
          {/* Left Column: Transmittal Log List */}
          <div className="p-4 flex flex-col justify-between overflow-y-auto space-y-3 bg-slate-50/40 dark:bg-slate-900/40">
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search transmittals..."
                  className="w-full h-8 pl-8 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              {/* Transmittal Cards */}
              <div className="space-y-2 pt-1">
                {filteredTransmittals.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No transmittal notices issued yet.
                  </div>
                ) : (
                  filteredTransmittals.map(t => {
                    const isSelected = active?.id === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTransmittal(t)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-100/60 dark:bg-indigo-900/60 px-1.5 py-0.5 rounded-md">
                            {t.transmittalNumber}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {t.issuePurpose}
                          </span>
                        </div>

                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-1.5 line-clamp-1">
                          {t.subject}
                        </div>

                        <div className="text-[11px] text-slate-500 mt-1 truncate">
                          To: {t.issuedToCompany} ({t.issuedToRecipient})
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 border-t border-slate-100 dark:border-slate-700/60 pt-1.5 font-mono">
                          <span>{t.issueDate}</span>
                          <span>{t.documentSnapshots?.length || t.documentIds.length} Attachments</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Active Transmittal Certificate Preview & Actions */}
          <div className="md:col-span-2 p-5 flex flex-col justify-between overflow-y-auto space-y-4">
            {active ? (
              <div className="space-y-4">
                
                {/* Header info */}
                <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                          {active.transmittalNumber}
                        </span>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-600">
                          {active.issuePurpose}
                        </Badge>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1.5">
                        {active.subject}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Issued to <span className="font-semibold text-slate-700 dark:text-slate-300">{active.issuedToCompany}</span> (Attn: {active.issuedToRecipient}) on {active.issueDate}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => handlePrintPDF(active)}
                        className="rounded-xl text-xs font-bold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Print DTN Certificate</span>
                      </Button>

                      {canEdit && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete Transmittal record ${active.transmittalNumber}?`)) {
                              onDeleteTransmittal(active.id);
                              setSelectedTransmittal(null);
                            }
                          }}
                          className="p-1.5 rounded-xl border border-red-200 dark:border-red-800 hover:bg-red-50 text-red-600 text-xs"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {active.remarks && (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-bold">Remarks: </span>{active.remarks}
                    </div>
                  )}
                </div>

                {/* Attached Documents Snapshot Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                    <span>Transmitted Documents ({active.documentSnapshots?.length || 0})</span>
                  </div>

                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                        <tr>
                          <th className="px-3 py-2">Doc Number</th>
                          <th className="px-3 py-2">Title</th>
                          <th className="px-3 py-2">Rev</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2 text-right">Format</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {(active.documentSnapshots || []).map((doc, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-3 py-2 font-mono font-bold text-slate-800 dark:text-slate-200">
                              {doc.documentNumber}
                            </td>
                            <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300">
                              {doc.title}
                            </td>
                            <td className="px-3 py-2 font-mono font-bold text-indigo-600">
                              {doc.revision}
                            </td>
                            <td className="px-3 py-2 font-bold text-emerald-600">
                              {doc.issueStatus}
                            </td>
                            <td className="px-3 py-2 text-right font-mono uppercase text-slate-500">
                              {doc.fileExtension}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Select a transmittal record from the left list to view details.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
