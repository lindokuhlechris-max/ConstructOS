import React, { useState, useMemo, useRef } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  X, 
  Search, 
  Filter, 
  Layers, 
  Calendar, 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileCheck, 
  FileSpreadsheet, 
  ZoomIn, 
  ZoomOut, 
  Palette, 
  Type, 
  Compass, 
  HardHat, 
  Lock, 
  Sliders
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../ui';
import { DocumentItem, DocumentCategory, DocumentIssueStatus, DocumentDiscipline, Project } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { saveOrShareFile } from '../../lib/fileExportService';
import { exportDocumentsToCSV } from '../../lib/csvExport';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface MasterDocumentRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  projects: Project[];
}

type ThemeColor = 'navy' | 'slate' | 'emerald' | 'amber' | 'monochrome';
type PageOrientation = 'portrait' | 'landscape';

const DISCIPLINES: ('All' | DocumentDiscipline)[] = [
  'All',
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

const ISSUE_STATUSES: ('All' | DocumentIssueStatus)[] = [
  'All',
  'IFC',
  'IFA',
  'IFI',
  'AB',
  'TND',
  'SUP'
];

export function MasterDocumentRegisterModal({
  isOpen,
  onClose,
  documents,
  projects
}: MasterDocumentRegisterModalProps) {
  const { currentUserProfile } = useAppContext();

  // --------------------------------------------------------------------------
  // Filters State
  // --------------------------------------------------------------------------
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedDiscipline, setSelectedDiscipline] = useState<'All' | DocumentDiscipline>('All');
  const [selectedIssueStatus, setSelectedIssueStatus] = useState<'All' | DocumentIssueStatus>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [includeSuperseded, setIncludeSuperseded] = useState<boolean>(true);

  // --------------------------------------------------------------------------
  // Visual Studio Customization
  // --------------------------------------------------------------------------
  const [orientation, setOrientation] = useState<PageOrientation>('landscape');
  const [theme, setTheme] = useState<ThemeColor>('navy');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const [companyName, setCompanyName] = useState<string>('CONSTRUCT OS / SCEDIH ENGINEERING');
  const [companyTagline, setCompanyTagline] = useState<string>('Heavy Civil, Infrastructure & EPC Project Management');
  const [registerTitle, setRegisterTitle] = useState<string>('Master Document Register & Technical Revision Index (MDR)');
  const [mdrDocNumber, setMdrDocNumber] = useState<string>(() => `MDR-EPC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-01`);

  // Section Toggles
  const [includeKpiScorecard, setIncludeKpiScorecard] = useState<boolean>(true);
  const [includeSignoffs, setIncludeSignoffs] = useState<boolean>(true);

  const printRef = useRef<HTMLDivElement>(null);

  // Selected Project
  const currentProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || projects[0] || {
      id: 'PRJ-001',
      name: 'Tournee Solar Power Plant Project',
      contractNumber: 'TSP-01',
      location: 'Northern Cape, South Africa'
    };
  }, [projects, selectedProjectId]);

  // Filtered Documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // Project filter
      if (selectedProjectId !== 'all' && doc.projectId !== selectedProjectId) {
        return false;
      }
      // Discipline filter
      if (selectedDiscipline !== 'All' && doc.discipline !== selectedDiscipline) {
        return false;
      }
      // Issue Status filter
      if (selectedIssueStatus !== 'All' && doc.issueStatus !== selectedIssueStatus) {
        return false;
      }
      // Superseded exclusion
      if (!includeSuperseded && (doc.status === 'Superseded' || doc.issueStatus === 'SUP')) {
        return false;
      }
      // Search term
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = doc.title.toLowerCase().includes(query);
        const matchesDocNo = (doc.documentNumber || '').toLowerCase().includes(query);
        const matchesFileName = doc.fileName.toLowerCase().includes(query);
        const matchesAuthor = (doc.uploadedBy || '').toLowerCase().includes(query);
        const matchesTags = (doc.tags || []).some(t => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDocNo && !matchesFileName && !matchesAuthor && !matchesTags) {
          return false;
        }
      }
      return true;
    });
  }, [documents, selectedProjectId, selectedDiscipline, selectedIssueStatus, includeSuperseded, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = filteredDocuments.length;
    const ifcCount = filteredDocuments.filter(d => d.issueStatus === 'IFC' || d.status === 'Approved').length;
    const ifaCount = filteredDocuments.filter(d => d.issueStatus === 'IFA' || d.status === 'Under Review').length;
    const asBuiltCount = filteredDocuments.filter(d => d.issueStatus === 'AB').length;
    const supersededCount = filteredDocuments.filter(d => d.issueStatus === 'SUP' || d.status === 'Superseded').length;
    const drawingsCount = filteredDocuments.filter(d => d.category === 'Drawings & Blueprints' || d.fileType === 'cad' || d.fileType === 'pdf').length;

    return {
      total,
      ifcCount,
      ifaCount,
      asBuiltCount,
      supersededCount,
      drawingsCount
    };
  }, [filteredDocuments]);

  // Color Styles
  const themeStyles = useMemo(() => {
    switch (theme) {
      case 'slate':
        return {
          primary: '#1e293b',
          accent: '#475569',
          headerBg: 'bg-slate-900 text-white',
          pdfHeader: [30, 41, 59] as [number, number, number],
          pdfAccent: [71, 85, 105] as [number, number, number]
        };
      case 'emerald':
        return {
          primary: '#065f46',
          accent: '#059669',
          headerBg: 'bg-emerald-900 text-white',
          pdfHeader: [6, 95, 70] as [number, number, number],
          pdfAccent: [5, 150, 105] as [number, number, number]
        };
      case 'amber':
        return {
          primary: '#92400e',
          accent: '#d97706',
          headerBg: 'bg-amber-950 text-white',
          pdfHeader: [146, 64, 14] as [number, number, number],
          pdfAccent: [217, 119, 6] as [number, number, number]
        };
      case 'monochrome':
        return {
          primary: '#000000',
          accent: '#333333',
          headerBg: 'bg-black text-white',
          pdfHeader: [0, 0, 0] as [number, number, number],
          pdfAccent: [50, 50, 50] as [number, number, number]
        };
      case 'navy':
      default:
        return {
          primary: '#0f172a',
          accent: '#0B5FFF',
          headerBg: 'bg-slate-900 text-white',
          pdfHeader: [15, 23, 42] as [number, number, number],
          pdfAccent: [11, 95, 255] as [number, number, number]
        };
    }
  }, [theme]);

  // Direct Clean Vector Print
  const handleTriggerBrowserPrint = () => {
    window.print();
  };

  // Vector PDF Generator Engine (jsPDF + autoTable)
  const handleDownloadVectorPdf = () => {
    const doc = new jsPDF({
      orientation: orientation === 'landscape' ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = orientation === 'landscape' ? 297 : 210;
    const pageHeight = orientation === 'landscape' ? 210 : 297;
    const primaryColor = themeStyles.pdfHeader;
    const accentColor = themeStyles.pdfAccent;

    // Header Ribbon
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 26, 'F');

    doc.setFillColor(...accentColor);
    doc.rect(0, 26, pageWidth, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(companyName.toUpperCase(), 14, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(200, 220, 255);
    doc.text(companyTagline, 14, 17);
    doc.text(`Official Master Document Register | ${currentProject.name} (${currentProject.contractNumber || currentProject.id})`, 14, 23);

    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`REGISTER REF: ${mdrDocNumber}`, pageWidth - 14, 11, { align: 'right' });
    doc.text(`DATE: ${new Date().toISOString().slice(0, 10)}`, pageWidth - 14, 17, { align: 'right' });
    doc.text(`CONTROLLED ITEMS: ${filteredDocuments.length}`, pageWidth - 14, 23, { align: 'right' });

    let currentY = 35;

    // Title Block
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(registerTitle, 14, currentY);

    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`ISO 19650 Engineering Document Control Register - Active Project Drawings, Technical Specs & Quality Records`, 14, currentY);

    currentY += 8;

    // KPI Matrix
    if (includeKpiScorecard) {
      const kpiData = [
        ['Total Controlled Documents', `${metrics.total} Files`, 'Active IFC Construction Sheets', `${metrics.ifcCount} Approved`],
        ['IFA Under Review', `${metrics.ifaCount} Pending`, 'As-Built Survey Verified', `${metrics.asBuiltCount} Sheets`],
        ['Superseded Historical Records', `${metrics.supersededCount} Archived`, 'Drawings & Blueprints', `${metrics.drawingsCount} Plans`]
      ];

      autoTable(doc, {
        startY: currentY,
        head: [['Control Metric', 'Volume', 'Engineering Status', 'Verified Count']],
        body: kpiData,
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59]
        },
        margin: { left: 14, right: 14 }
      });

      currentY = (doc as any).lastAutoTable?.finalY + 8 || currentY + 30;
    }

    // Master Document Table
    if (filteredDocuments.length > 0) {
      const rows = filteredDocuments.map((d, idx) => [
        (idx + 1).toString(),
        d.documentNumber || `DOC-${d.id.slice(-6)}`,
        d.title,
        d.discipline || 'General',
        d.category,
        d.revision || d.version || 'Rev 0',
        d.issueStatus || (d.status === 'Approved' ? 'IFC' : 'IFI'),
        d.status,
        d.uploadedAt ? d.uploadedAt.slice(0, 10) : '-',
        d.uploadedBy || 'Doc Controller'
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['#', 'Doc Number', 'Document / Drawing Title', 'Discipline', 'Category', 'Rev', 'Issue', 'Status', 'Date', 'Author']],
        body: rows,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 7.5
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [30, 41, 59]
        },
        margin: { left: 14, right: 14 }
      });

      currentY = (doc as any).lastAutoTable?.finalY + 8 || currentY + 40;
    }

    // Sign-Off Matrix
    if (includeSignoffs) {
      if (currentY > pageHeight - 45) {
        doc.addPage();
        currentY = 20;
      }

      const signoffData = [
        ['Lead Document Controller', 'Project QA/QC Manager', 'Resident Project Engineer', 'Client Consultant Representative'],
        ['Issued By: _________________', 'Verified By: _________________', 'Approved By: _________________', 'Accepted By: _________________'],
        [`Date: ${new Date().toISOString().slice(0, 10)}`, `Date: ${new Date().toISOString().slice(0, 10)}`, `Date: ${new Date().toISOString().slice(0, 10)}`, `Date: ${new Date().toISOString().slice(0, 10)}`]
      ];

      autoTable(doc, {
        startY: currentY,
        head: [['Document Control', 'Quality Assurance', 'Engineering Certification', 'Employer Acceptance']],
        body: signoffData,
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 7.5
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [30, 41, 59]
        },
        margin: { left: 14, right: 14 }
      });
    }

    // Recurring Page Footers
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `ConstructOS Master Document Register | Certified Record ${mdrDocNumber} | Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 7,
        { align: 'center' }
      );
    }

    // Save or Share
    const filename = `${mdrDocNumber}_Master_Document_Register.pdf`;
    const pdfBlob = doc.output('blob');
    saveOrShareFile({
      filename,
      blob: pdfBlob,
      title: `${companyName} - ${registerTitle}`,
      saveToDownloads: true,
      triggerShare: true
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    exportDocumentsToCSV(filteredDocuments, projects, `_MDR_${new Date().toISOString().slice(0, 10)}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div className="bg-slate-100 dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full h-[95vh] flex flex-col overflow-hidden">
        
        {/* Top Studio Toolbar */}
        <div className="p-4 md:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-teal-100 dark:bg-teal-900/40 text-teal-600 flex items-center justify-center shrink-0 shadow-sm">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Master Document Register (MDR) Studio
                </h3>
                <Badge variant="outline" className="text-[10px] font-mono uppercase bg-teal-50 dark:bg-teal-950/60 text-teal-600">
                  ISO 19650 Engine
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official project drawing register, revision matrix control, and certified engineering PDF export
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 border-emerald-200 text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100 shadow-2xs"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export Excel/CSV</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTriggerBrowserPrint}
              className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 shadow-2xs"
            >
              <Printer className="h-4 w-4 text-[#0B5FFF]" />
              <span>Print Register</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleDownloadVectorPdf}
              className="h-9 px-4 rounded-xl text-xs font-bold gap-1.5 bg-[#0B5FFF] hover:bg-blue-600 text-white shadow-sm"
            >
              <Download className="h-4 w-4" />
              <span>Export Vector PDF</span>
            </Button>

            <button
              onClick={onClose}
              className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors ml-2"
              title="Close Studio"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Workspace Body */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Drawer: Controls & Filters */}
          <div className="w-80 sm:w-96 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-4 sm:p-5 space-y-5 shrink-0 select-none">
            
            {/* Project Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project Portfolio</label>
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 p-2.5"
              >
                <option value="all">All Active Projects (Portfolio)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.contractNumber || p.id})</option>
                ))}
              </select>
            </div>

            {/* Discipline Filter */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Engineering Discipline</label>
              <select
                value={selectedDiscipline}
                onChange={e => setSelectedDiscipline(e.target.value as any)}
                className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 p-2.5"
              >
                {DISCIPLINES.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Issue Status Purpose Filter */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Issue Status / Purpose</label>
              <div className="grid grid-cols-4 gap-1.5 text-xs">
                {ISSUE_STATUSES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedIssueStatus(s)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                      selectedIssueStatus === s 
                        ? 'border-[#0B5FFF] bg-blue-50 dark:bg-blue-950/40 text-[#0B5FFF]' 
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Include Superseded Toggle */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">Include Superseded Revisions</span>
                <input
                  type="checkbox"
                  checked={includeSuperseded}
                  onChange={e => setIncludeSuperseded(e.target.checked)}
                  className="rounded text-[#0B5FFF] h-4 w-4"
                />
              </label>
            </div>

            {/* Layout Orientation & Theme */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-blue-500" />
                <span>Layout & Color Theme</span>
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`p-2 rounded-xl text-xs font-bold border text-center transition-colors ${
                    orientation === 'portrait'
                      ? 'border-[#0B5FFF] bg-blue-50 dark:bg-blue-950/40 text-[#0B5FFF]'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Portrait
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`p-2 rounded-xl text-xs font-bold border text-center transition-colors ${
                    orientation === 'landscape'
                      ? 'border-[#0B5FFF] bg-blue-50 dark:bg-blue-950/40 text-[#0B5FFF]'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Landscape (MDR)
                </button>
              </div>

              {/* Theme Palettes */}
              <div className="flex gap-2">
                {(['navy', 'slate', 'emerald', 'amber', 'monochrome'] as ThemeColor[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                      theme === t ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-200 dark:border-slate-700'
                    } ${
                      t === 'navy' ? 'bg-slate-900 text-white' :
                      t === 'slate' ? 'bg-slate-700 text-white' :
                      t === 'emerald' ? 'bg-emerald-800 text-white' :
                      t === 'amber' ? 'bg-amber-700 text-white' : 'bg-black text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Register Title & Code */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Register Title</label>
                <input
                  type="text"
                  value={registerTitle}
                  onChange={e => setRegisterTitle(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Register Document Code</label>
                <input
                  type="text"
                  value={mdrDocNumber}
                  onChange={e => setMdrDocNumber(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                />
              </div>
            </div>

            {/* Section Toggles */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                <span>Executive KPI Scorecard</span>
                <input
                  type="checkbox"
                  checked={includeKpiScorecard}
                  onChange={e => setIncludeKpiScorecard(e.target.checked)}
                  className="rounded text-[#0B5FFF] h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                <span>Formal Sign-Off Matrix</span>
                <input
                  type="checkbox"
                  checked={includeSignoffs}
                  onChange={e => setIncludeSignoffs(e.target.checked)}
                  className="rounded text-[#0B5FFF] h-4 w-4"
                />
              </label>
            </div>

          </div>

          {/* Right Viewport: Live A4 Printable Sheet Preview */}
          <div className="flex-1 bg-slate-200/70 dark:bg-slate-900/50 overflow-auto p-4 sm:p-8 flex flex-col items-center relative">
            
            {/* Zoom Controls */}
            <div className="sticky top-2 z-30 mb-6 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-md flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 font-mono pl-1">{zoomLevel}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(50, prev - 15))}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(150, prev + 15))}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="text-[11px] font-bold text-blue-600 hover:underline px-1"
              >
                Reset
              </button>
            </div>

            {/* Printable A4 Sheet */}
            <div 
              ref={printRef}
              id="report-printable-area"
              style={{ 
                transform: `scale(${zoomLevel / 100})`, 
                transformOrigin: 'top center',
                width: orientation === 'landscape' ? '297mm' : '210mm',
                minHeight: orientation === 'landscape' ? '210mm' : '297mm'
              }}
              className="bg-white text-slate-900 shadow-2xl rounded-none transition-transform duration-150 p-8 sm:p-10 relative flex flex-col justify-between select-text"
            >
              
              <div className="space-y-6">
                
                {/* Header Ribbon */}
                <div className="rounded-2xl overflow-hidden shadow-sm">
                  <div className={`p-5 ${themeStyles.headerBg} flex items-center justify-between`}>
                    <div>
                      <h1 className="text-xl font-black tracking-wide uppercase">
                        {companyName}
                      </h1>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {registerTitle}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/10 text-white border border-white/20">
                        {mdrDocNumber}
                      </span>
                      <p className="text-[10px] text-slate-300 mt-1">
                        DATE: {new Date().toISOString().slice(0, 10)}
                      </p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-teal-500" />
                </div>

                {/* Project Metadata Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 grid grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Project Title</span>
                    <span className="font-bold text-slate-800">{currentProject.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Contract Reference</span>
                    <span className="font-semibold text-slate-700">{currentProject.contractNumber || currentProject.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Lead Contractor</span>
                    <span className="font-semibold text-slate-700">Scedih Engineering</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Client / Employer</span>
                    <span className="font-semibold text-slate-700">Transnet Engineering</span>
                  </div>
                </div>

                {/* KPI Scorecard */}
                {includeKpiScorecard && (
                  <div className="grid grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Controlled Docs</span>
                      <span className="text-lg font-black text-slate-900">{metrics.total}</span>
                      <span className="text-[9px] text-teal-600 font-bold block mt-0.5">Active MDR</span>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">IFC Approved</span>
                      <span className="text-lg font-black text-emerald-700">{metrics.ifcCount}</span>
                      <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">Construction Ready</span>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">IFA Under Review</span>
                      <span className="text-lg font-black text-amber-700">{metrics.ifaCount}</span>
                      <span className="text-[9px] text-amber-600 font-bold block mt-0.5">Consultant Queue</span>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">As-Built Certified</span>
                      <span className="text-lg font-black text-blue-700">{metrics.asBuiltCount}</span>
                      <span className="text-[9px] text-blue-600 font-bold block mt-0.5">Survey Verified</span>
                    </div>
                  </div>
                )}

                {/* Master Revision Register Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <FileSpreadsheet className="h-4 w-4 text-teal-600" />
                      <span>Controlled Engineering Document & Revision Register</span>
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500">
                      {filteredDocuments.length} Documents
                    </span>
                  </div>

                  {filteredDocuments.length > 0 ? (
                    <div className="rounded-xl border border-slate-200 overflow-hidden text-[11px]">
                      <table className="w-full text-left">
                        <thead className="bg-slate-900 text-white font-bold uppercase text-[9px]">
                          <tr>
                            <th className="px-3 py-2">#</th>
                            <th className="px-3 py-2">Doc Reference</th>
                            <th className="px-3 py-2">Title & Scope</th>
                            <th className="px-3 py-2">Discipline</th>
                            <th className="px-3 py-2">Category</th>
                            <th className="px-3 py-2">Rev</th>
                            <th className="px-3 py-2">Purpose</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {filteredDocuments.map((d, idx) => (
                            <tr key={d.id} className="hover:bg-slate-50/50">
                              <td className="px-3 py-1.5 font-mono text-slate-400 text-[10px]">{idx + 1}</td>
                              <td className="px-3 py-1.5 font-mono font-bold text-slate-900">{d.documentNumber || `DOC-${d.id.slice(-6)}`}</td>
                              <td className="px-3 py-1.5 font-semibold text-slate-800">{d.title}</td>
                              <td className="px-3 py-1.5 text-slate-600">{d.discipline || 'General'}</td>
                              <td className="px-3 py-1.5 text-slate-500 text-[10px]">{d.category}</td>
                              <td className="px-3 py-1.5 font-mono font-bold text-blue-600">{d.revision || d.version || 'Rev 0'}</td>
                              <td className="px-3 py-1.5">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  d.issueStatus === 'IFC' ? 'bg-emerald-100 text-emerald-800' :
                                  d.issueStatus === 'IFA' ? 'bg-amber-100 text-amber-800' :
                                  d.issueStatus === 'SUP' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {d.issueStatus || (d.status === 'Approved' ? 'IFC' : 'IFI')}
                                </span>
                              </td>
                              <td className="px-3 py-1.5 font-bold text-[10px] text-slate-700">
                                {d.status}
                              </td>
                              <td className="px-3 py-1.5 font-mono text-slate-500 text-[10px]">
                                {d.uploadedAt ? d.uploadedAt.slice(0, 10) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No documents matching the selected filter criteria.
                    </div>
                  )}
                </div>

                {/* Sign-Off Matrix */}
                {includeSignoffs && (
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">
                      Multi-Party Technical Verification & Master Register Sign-Off Matrix
                    </h4>
                    
                    <div className="grid grid-cols-4 gap-3">
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-center space-y-3">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">Lead Document Controller</span>
                        <div className="h-7 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                          <span className="font-serif italic text-xs text-slate-700">Lindokuhle Chris</span>
                        </div>
                        <span className="text-[8px] text-slate-400 block font-mono">Date: {new Date().toISOString().slice(0, 10)}</span>
                      </div>

                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-center space-y-3">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">Project QA/QC Manager</span>
                        <div className="h-7 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                          <span className="font-serif italic text-xs text-slate-700">David Smith</span>
                        </div>
                        <span className="text-[8px] text-slate-400 block font-mono">Date: {new Date().toISOString().slice(0, 10)}</span>
                      </div>

                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-center space-y-3">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">Resident Project Engineer</span>
                        <div className="h-7 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                          <span className="font-serif italic text-xs text-slate-700">Sarah Jenkins (Pr.Eng)</span>
                        </div>
                        <span className="text-[8px] text-slate-400 block font-mono">Date: {new Date().toISOString().slice(0, 10)}</span>
                      </div>

                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-center space-y-3">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">Client Consultant Representative</span>
                        <div className="h-7 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                          <span className="font-serif italic text-xs text-slate-700">Transnet Engineering</span>
                        </div>
                        <span className="text-[8px] text-slate-400 block font-mono">Date: {new Date().toISOString().slice(0, 10)}</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="pt-4 mt-6 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>ISO 19650 Certified Engineering Document Control | ConstructOS Enterprise Hub</span>
                </div>
                <span>Document ID: {mdrDocNumber}</span>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
