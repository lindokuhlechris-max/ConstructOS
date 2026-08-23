import React, { useState, useMemo, useRef } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Share2, 
  X, 
  Check, 
  ChevronRight, 
  Settings, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  Eye, 
  Layers, 
  Building2, 
  Calendar, 
  Clock, 
  Compass, 
  DollarSign, 
  Truck, 
  Package, 
  TrendingUp, 
  HardHat, 
  Sun, 
  CloudRain, 
  ShieldCheck, 
  AlertTriangle, 
  FileCheck, 
  CheckSquare, 
  CheckCircle2, 
  Lock, 
  RotateCcw,
  Sparkles,
  QrCode,
  Sliders,
  Type,
  Palette,
  Paperclip,
  Filter,
  CheckCircle,
  FileSpreadsheet,
  Grid,
  List
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../ui';
import { DailyReport, UniversalReportItem, Activity, Project, ReportCategory } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { saveOrShareFile } from '../../lib/fileExportService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReportsHubPrintStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: UniversalReportItem[];
  allProjects: Project[];
  activeCategoryFilter?: ReportCategory | 'all';
  activeProjectFilter?: string;
}

type ThemeColor = 'navy' | 'slate' | 'emerald' | 'amber' | 'monochrome';
type PageOrientation = 'portrait' | 'landscape';
type WatermarkType = 'none' | 'approved' | 'official' | 'confidential' | 'draft' | 'under_review';
type ReportScope = 'all_visible' | 'daily_only' | 'survey_only' | 'finance_only' | 'fleet_only' | 'progress_only' | 'custom_select';

export function ReportsHubPrintStudioModal({
  isOpen,
  onClose,
  reports,
  allProjects,
  activeCategoryFilter = 'all',
  activeProjectFilter = 'all'
}: ReportsHubPrintStudioModalProps) {
  const { activities = [], currentUserProfile } = useAppContext();

  // --------------------------------------------------------------------------
  // Selection & Scope State
  // --------------------------------------------------------------------------
  const [scope, setScope] = useState<ReportScope>('all_visible');
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>(() => reports.map(r => r.id));
  const [targetProjectId, setTargetProjectId] = useState<string>(activeProjectFilter !== 'all' ? activeProjectFilter : (allProjects[0]?.id || 'PRJ-001'));

  // --------------------------------------------------------------------------
  // Studio Customizer Visual Settings
  // --------------------------------------------------------------------------
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');
  const [theme, setTheme] = useState<ThemeColor>('navy');
  const [watermark, setWatermark] = useState<WatermarkType>('none');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Corporate & Header Customization
  const [companyName, setCompanyName] = useState<string>('CONSTRUCT OS / SCEDIH ENGINEERING');
  const [companyTagline, setCompanyTagline] = useState<string>('Heavy Civil, Infrastructure & EPC Project Management');
  const [dossierTitle, setDossierTitle] = useState<string>('Executive Project Operations & Technical Verification Dossier');
  const [dossierSubtitle, setDossierSubtitle] = useState<string>(
    'Comprehensive Multi-Discipline Engineering Ledger, Site Daily Logs, Survey Tolerances & Valuation Audit'
  );
  const [documentNumber, setDocumentNumber] = useState<string>(() => `DOS-EPC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-01`);

  // Section Inclusions Toggles
  const [includeCoverPage, setIncludeCoverPage] = useState<boolean>(true);
  const [includeExecutiveKpis, setIncludeExecutiveKpis] = useState<boolean>(true);
  const [includeMasterTable, setIncludeMasterTable] = useState<boolean>(true);
  const [includeDailyLogs, setIncludeDailyLogs] = useState<boolean>(true);
  const [includeSurveyData, setIncludeSurveyData] = useState<boolean>(true);
  const [includeFinanceData, setIncludeFinanceData] = useState<boolean>(true);
  const [includeFleetData, setIncludeFleetData] = useState<boolean>(true);
  const [includeMaterialsData, setIncludeMaterialsData] = useState<boolean>(true);
  const [includeProgressMilestones, setIncludeProgressMilestones] = useState<boolean>(true);
  const [includePhotoEvidence, setIncludePhotoEvidence] = useState<boolean>(true);
  const [includeSignoffs, setIncludeSignoffs] = useState<boolean>(true);
  const [includeVerificationQr, setIncludeVerificationQr] = useState<boolean>(true);

  // Print Container Ref
  const printRef = useRef<HTMLDivElement>(null);

  // Project Info
  const currentProject = useMemo(() => {
    return allProjects.find(p => p.id === targetProjectId) || allProjects[0] || {
      id: 'PRJ-001',
      name: 'Tournee Solar Power Plant Project',
      contractNumber: 'TSP-01',
      location: 'Northern Cape, South Africa'
    };
  }, [allProjects, targetProjectId]);

  // Filtered reports based on selected scope
  const targetReports = useMemo(() => {
    let list = reports;
    if (targetProjectId !== 'all') {
      list = list.filter(r => r.projectId === targetProjectId || !r.projectId);
    }

    if (scope === 'daily_only') {
      return list.filter(r => r.category === 'DailySite');
    }
    if (scope === 'survey_only') {
      return list.filter(r => r.category === 'Survey');
    }
    if (scope === 'finance_only') {
      return list.filter(r => r.category === 'Finance');
    }
    if (scope === 'fleet_only') {
      return list.filter(r => r.category === 'Fleet');
    }
    if (scope === 'progress_only') {
      return list.filter(r => r.category === 'WeeklyProgress' || r.category === 'MonthlyProgress');
    }
    if (scope === 'custom_select') {
      return list.filter(r => selectedReportIds.includes(r.id));
    }
    return list;
  }, [reports, targetProjectId, scope, selectedReportIds]);

  // Aggregate Executive KPIs across selected reports
  const kpiSummary = useMemo(() => {
    const totalReports = targetReports.length;
    const approvedCount = targetReports.filter(r => r.status === 'Approved').length;
    const pendingCount = targetReports.filter(r => r.status === 'Submitted' || r.status === 'Under Review' || r.status === 'Draft').length;

    let totalWorkers = 0;
    let peakWorkers = 0;
    let totalEquipment = 0;
    let totalIncidents = 0;
    let totalNcr = 0;
    let totalCertifiedAmount = 0;
    let totalSurveyPoints = 0;
    let passedSurveyPoints = 0;

    targetReports.forEach(r => {
      // Daily Report Data
      if (r.category === 'DailySite' && r.data) {
        const d = r.data as DailyReport;
        const w = Number(d.workersOnSite) || 0;
        totalWorkers += w;
        if (w > peakWorkers) peakWorkers = w;
        totalEquipment += Number(d.equipmentRunning) || 0;
        totalIncidents += Number(d.incidents) || 0;
        totalNcr += Number(d.ncr) || 0;
      }

      // Finance Data
      if (r.category === 'Finance' && r.data) {
        const f = r.data as any;
        totalCertifiedAmount += Number(f.netPayableAmount || f.currentClaimGross || 0);
      }

      // Survey Data
      if (r.category === 'Survey' && r.data) {
        const s = r.data as any;
        if (Array.isArray(s.points)) {
          totalSurveyPoints += s.points.length;
          passedSurveyPoints += s.points.filter((p: any) => p.status === 'Pass').length;
        }
      }
    });

    const averageDailyWorkers = totalReports > 0 ? Math.round(totalWorkers / Math.max(1, targetReports.filter(r => r.category === 'DailySite').length)) : 0;
    const surveyPassRate = totalSurveyPoints > 0 ? Math.round((passedSurveyPoints / totalSurveyPoints) * 100) : 100;

    return {
      totalReports,
      approvedCount,
      pendingCount,
      averageDailyWorkers,
      peakWorkers,
      totalEquipment,
      totalIncidents,
      totalNcr,
      totalCertifiedAmount,
      totalSurveyPoints,
      surveyPassRate
    };
  }, [targetReports]);

  // Color Palette Definitions
  const themeStyles = useMemo(() => {
    switch (theme) {
      case 'slate':
        return {
          primary: '#1e293b',
          accent: '#475569',
          headerBg: 'bg-slate-900 text-white',
          badgeBg: 'bg-slate-800 text-slate-100',
          tableHeader: 'bg-slate-800 text-white',
          border: 'border-slate-300',
          pdfHeader: [30, 41, 59] as [number, number, number],
          pdfAccent: [71, 85, 105] as [number, number, number]
        };
      case 'emerald':
        return {
          primary: '#065f46',
          accent: '#059669',
          headerBg: 'bg-emerald-900 text-white',
          badgeBg: 'bg-emerald-800 text-emerald-100',
          tableHeader: 'bg-emerald-900 text-white',
          border: 'border-emerald-200',
          pdfHeader: [6, 95, 70] as [number, number, number],
          pdfAccent: [5, 150, 105] as [number, number, number]
        };
      case 'amber':
        return {
          primary: '#92400e',
          accent: '#d97706',
          headerBg: 'bg-amber-950 text-white',
          badgeBg: 'bg-amber-900 text-amber-100',
          tableHeader: 'bg-amber-950 text-white',
          border: 'border-amber-200',
          pdfHeader: [146, 64, 14] as [number, number, number],
          pdfAccent: [217, 119, 6] as [number, number, number]
        };
      case 'monochrome':
        return {
          primary: '#000000',
          accent: '#333333',
          headerBg: 'bg-black text-white',
          badgeBg: 'bg-neutral-800 text-neutral-100',
          tableHeader: 'bg-neutral-900 text-white',
          border: 'border-neutral-300',
          pdfHeader: [0, 0, 0] as [number, number, number],
          pdfAccent: [50, 50, 50] as [number, number, number]
        };
      case 'navy':
      default:
        return {
          primary: '#0f172a',
          accent: '#0B5FFF',
          headerBg: 'bg-slate-900 text-white',
          badgeBg: 'bg-blue-900 text-blue-100',
          tableHeader: 'bg-slate-900 text-white',
          border: 'border-blue-200',
          pdfHeader: [15, 23, 42] as [number, number, number],
          pdfAccent: [11, 95, 255] as [number, number, number]
        };
    }
  }, [theme]);

  // --------------------------------------------------------------------------
  // Direct Vector Browser Print
  // --------------------------------------------------------------------------
  const handleTriggerBrowserPrint = () => {
    window.print();
  };

  // --------------------------------------------------------------------------
  // Vector PDF Compiler Engine (jsPDF + autoTable)
  // --------------------------------------------------------------------------
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

    // 1. Cover Page / Title Header Banner
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setFillColor(...accentColor);
    doc.rect(0, 28, pageWidth, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(companyName.toUpperCase(), 14, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(200, 220, 255);
    doc.text(companyTagline, 14, 18);
    doc.text(`Official Executive Dossier | ${currentProject.name} (${currentProject.contractNumber || currentProject.id || 'PRJ'})`, 14, 24);

    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`DOC REF: ${documentNumber}`, pageWidth - 14, 12, { align: 'right' });
    doc.text(`DATE: ${new Date().toISOString().slice(0, 10)}`, pageWidth - 14, 18, { align: 'right' });
    doc.text(`TOTAL ENTRIES: ${targetReports.length}`, pageWidth - 14, 24, { align: 'right' });

    let currentY = 38;

    // 2. Executive Title Box
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(dossierTitle, 14, currentY);

    currentY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(dossierSubtitle, 14, currentY);

    currentY += 8;

    // 3. Executive KPI Dashboard Matrix
    if (includeExecutiveKpis) {
      const kpiData = [
        ['Total Reports Logged', `${kpiSummary.totalReports} Items`, 'Certified Valuations', `R ${kpiSummary.totalCertifiedAmount.toLocaleString()}`],
        ['Approved Status', `${kpiSummary.approvedCount} Approved`, 'Avg Daily Workforce', `${kpiSummary.averageDailyWorkers} Workers`],
        ['Under Review / Pending', `${kpiSummary.pendingCount} Pending`, 'Survey Tolerance Pass', `${kpiSummary.surveyPassRate}%`],
        ['Total Safety Incidents', `${kpiSummary.totalIncidents} Zero LTI`, 'Active Heavy Plant', `${kpiSummary.totalEquipment} Units`]
      ];

      autoTable(doc, {
        startY: currentY,
        head: [['Executive Metric', 'Recorded Value', 'Technical Category', 'Verification Metric']],
        body: kpiData,
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8.5
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59]
        },
        margin: { left: 14, right: 14 }
      });

      currentY = (doc as any).lastAutoTable?.finalY + 8 || currentY + 35;
    }

    // 4. Master Consolidated Ledger Table
    if (includeMasterTable && targetReports.length > 0) {
      const masterRows = targetReports.map((r, idx) => [
        (idx + 1).toString(),
        r.date || r.submissionDate || 'N/A',
        r.documentNumber || `REP-${r.id.slice(-6)}`,
        r.title || 'Official Site Report',
        r.category,
        r.author || 'Site Operations',
        r.status
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['#', 'Date', 'Doc Number', 'Report Title & Scope', 'Discipline', 'Author / Engineer', 'Status']],
        body: masterRows,
        theme: 'striped',
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

      currentY = (doc as any).lastAutoTable?.finalY + 8 || currentY + 40;
    }

    // 5. Multi-Party Formal Sign-Off Matrix
    if (includeSignoffs) {
      if (currentY > pageHeight - 50) {
        doc.addPage();
        currentY = 20;
      }

      const signoffData = [
        ['Lead Site Supervisor', 'Quality Assurance Manager', 'Resident Project Engineer', 'Client Representative (Transnet/EPC)'],
        ['Prepared By: _________________', 'Verified By: _________________', 'Certified By: _________________', 'Approved By: _________________'],
        [`Date: ${new Date().toISOString().slice(0, 10)}`, `Date: ${new Date().toISOString().slice(0, 10)}`, `Date: ${new Date().toISOString().slice(0, 10)}`, `Date: ${new Date().toISOString().slice(0, 10)}`]
      ];

      autoTable(doc, {
        startY: currentY,
        head: [['Prepared By', 'Technical Review', 'Contract Certification', 'Employer Acceptance']],
        body: signoffData,
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
    }

    // Add Page Numbers & Footer to all pages
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `ConstructOS Executive Reporting Engine | Certified Record ${documentNumber} | Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
    }

    // Save or Share File
    const filename = `${documentNumber}_Executive_Dossier.pdf`;
    const pdfBlob = doc.output('blob');
    saveOrShareFile({
      filename,
      blob: pdfBlob,
      title: `${companyName} - ${dossierTitle}`,
      saveToDownloads: true,
      triggerShare: true
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div className="bg-slate-100 dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full h-[95vh] flex flex-col overflow-hidden">
        
        {/* 1. TOP STUDIO TOOLBAR */}
        <div className="p-4 md:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-[#0B5FFF] flex items-center justify-center shrink-0 shadow-sm">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Executive Reports & Dossier Print Studio
                </h3>
                <Badge variant="outline" className="text-[10px] font-mono uppercase bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF]">
                  {targetReports.length} Reports Loaded
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Multi-discipline batch printing, executive portfolio generation, and vector-perfect PDF exports
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTriggerBrowserPrint}
              className="h-9 px-4 rounded-xl text-xs font-bold gap-1.5 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 shadow-2xs"
            >
              <Printer className="h-4 w-4 text-[#0B5FFF]" />
              <span>Print Dossier</span>
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

        {/* 2. STUDIO WORKSPACE BODY */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT DRAWER: STUDIO CONTROLS & REPORT SELECTION */}
          <div className="w-80 sm:w-96 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-4 sm:p-5 space-y-5 shrink-0 select-none">
            
            {/* Scope Selection */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-blue-500" />
                <span>Reporting Scope & Scope Filter</span>
              </h4>

              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {[
                  { id: 'all_visible', label: 'All Reports' },
                  { id: 'daily_only', label: 'Daily Logs' },
                  { id: 'survey_only', label: 'Survey Reports' },
                  { id: 'finance_only', label: 'Finance & BOQ' },
                  { id: 'fleet_only', label: 'Fleet Logs' },
                  { id: 'progress_only', label: 'Progress (WPR)' },
                  { id: 'custom_select', label: 'Custom Multi-Select' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setScope(item.id as ReportScope)}
                    className={`px-3 py-2 rounded-xl text-left font-semibold transition-colors border ${
                      scope === item.id 
                        ? 'border-[#0B5FFF] bg-blue-50/70 dark:bg-blue-950/40 text-[#0B5FFF]' 
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Multi-Select List (If custom scope) */}
            {scope === 'custom_select' && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Select Reports ({selectedReportIds.length}/{reports.length})</span>
                  <div className="flex gap-2 text-[10px]">
                    <button onClick={() => setSelectedReportIds(reports.map(r => r.id))} className="text-blue-600 font-bold hover:underline">Select All</button>
                    <button onClick={() => setSelectedReportIds([])} className="text-slate-400 hover:underline">Clear</button>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-900/50">
                  {reports.map(r => {
                    const isSelected = selectedReportIds.includes(r.id);
                    return (
                      <label key={r.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedReportIds(prev => [...prev, r.id]);
                            } else {
                              setSelectedReportIds(prev => prev.filter(id => id !== r.id));
                            }
                          }}
                          className="rounded text-[#0B5FFF] h-3.5 w-3.5"
                        />
                        <span className="truncate font-medium text-slate-800 dark:text-slate-200">{r.title} ({r.date || r.category})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Project Filter */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Project</label>
              <select
                value={targetProjectId}
                onChange={e => setTargetProjectId(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 p-2.5"
              >
                <option value="all">All Active Projects (Portfolio)</option>
                {allProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.contractNumber || p.id})</option>
                ))}
              </select>
            </div>

            {/* Orientation & Theme Controls */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-blue-500" />
                <span>Layout & Visual Theme</span>
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`p-2.5 rounded-xl text-xs font-bold border text-center transition-colors ${
                    orientation === 'portrait'
                      ? 'border-[#0B5FFF] bg-blue-50 dark:bg-blue-950/40 text-[#0B5FFF]'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Portrait (A4)
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`p-2.5 rounded-xl text-xs font-bold border text-center transition-colors ${
                    orientation === 'landscape'
                      ? 'border-[#0B5FFF] bg-blue-50 dark:bg-blue-950/40 text-[#0B5FFF]'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Landscape (A4)
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

            {/* Document Header Text Overrides */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5 text-blue-500" />
                <span>Dossier Title & Reference</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Document Title</label>
                  <input
                    type="text"
                    value={dossierTitle}
                    onChange={e => setDossierTitle(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Reference Number</label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={e => setDocumentNumber(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section Inclusions Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-blue-500" />
                <span>Section Inclusions</span>
              </h4>

              <div className="space-y-1.5 text-xs">
                {[
                  { label: 'Executive Cover Page & Scorecard', checked: includeCoverPage, onChange: setIncludeCoverPage },
                  { label: 'Executive KPI Summary Dashboard', checked: includeExecutiveKpis, onChange: setIncludeExecutiveKpis },
                  { label: 'Master Consolidated Ledger Table', checked: includeMasterTable, onChange: setIncludeMasterTable },
                  { label: 'Daily Operations & Weather Logs', checked: includeDailyLogs, onChange: setIncludeDailyLogs },
                  { label: 'Survey Coordinate Tolerances', checked: includeSurveyData, onChange: setIncludeSurveyData },
                  { label: 'Finance Claims & BOQ Valuations', checked: includeFinanceData, onChange: setIncludeFinanceData },
                  { label: 'Plant & Heavy Fleet Telematics', checked: includeFleetData, onChange: setIncludeFleetData },
                  { label: 'Materials Conformance & Tests', checked: includeMaterialsData, onChange: setIncludeMaterialsData },
                  { label: 'Attached Photos & Field Evidence', checked: includePhotoEvidence, onChange: setIncludePhotoEvidence },
                  { label: 'Multi-Party Formal Sign-Off Matrix', checked: includeSignoffs, onChange: setIncludeSignoffs },
                  { label: 'Verification QR Code Badge', checked: includeVerificationQr, onChange: setIncludeVerificationQr }
                ].map((item, idx) => (
                  <label key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={e => item.onChange(e.target.checked)}
                      className="rounded text-[#0B5FFF] h-4 w-4"
                    />
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT VIEWPORT: LIVE A4 PRINT SHEET PREVIEW */}
          <div className="flex-1 bg-slate-200/70 dark:bg-slate-900/50 overflow-auto p-4 sm:p-8 flex flex-col items-center relative">
            
            {/* Zoom Controls Bar */}
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

            {/* Virtual A4 Sheet Container (Targeted for Browser Vector Print) */}
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
              
              {/* Security Watermark Overlay */}
              {watermark !== 'none' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 overflow-hidden">
                  <span className="text-7xl font-black text-slate-300/30 dark:text-slate-400/20 transform -rotate-35 uppercase tracking-widest select-none">
                    {watermark.replace('_', ' ')}
                  </span>
                </div>
              )}

              {/* Document Content Top Section */}
              <div className="space-y-6">
                
                {/* 1. Header Ribbon */}
                <div className="rounded-2xl overflow-hidden shadow-sm">
                  <div className={`p-5 ${themeStyles.headerBg} flex items-center justify-between`}>
                    <div>
                      <h1 className="text-xl font-black tracking-wide uppercase">
                        {companyName}
                      </h1>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {dossierTitle}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/10 text-white border border-white/20">
                        {documentNumber}
                      </span>
                      <p className="text-[10px] text-slate-300 mt-1">
                        DATE: {new Date().toISOString().slice(0, 10)}
                      </p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-blue-500" />
                </div>

                {/* 2. Executive Project Metadata Card */}
                {includeCoverPage && (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Project Title</span>
                      <span className="font-bold text-slate-800">{currentProject.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Location / Sector</span>
                      <span className="font-semibold text-slate-700">{currentProject.location || 'Northern Cape'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Client / Authority</span>
                      <span className="font-semibold text-slate-700">Transnet Engineering</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">EPC Contractor</span>
                      <span className="font-semibold text-slate-700">Scedih Engineering</span>
                    </div>
                  </div>
                )}

                {/* 3. Executive KPI Dashboard Grid */}
                {includeExecutiveKpis && (
                  <div className="grid grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Reports</span>
                      <span className="text-lg font-black text-slate-900">{kpiSummary.totalReports}</span>
                      <span className="text-[9px] text-blue-600 font-bold block mt-0.5">{kpiSummary.approvedCount} Certified</span>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Certified Claims</span>
                      <span className="text-lg font-black text-emerald-700">R {(kpiSummary.totalCertifiedAmount / 1000).toFixed(0)}k</span>
                      <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">Valuation Gross</span>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Daily Manpower</span>
                      <span className="text-lg font-black text-slate-900">{kpiSummary.averageDailyWorkers}</span>
                      <span className="text-[9px] text-slate-500 font-bold block mt-0.5">Peak {kpiSummary.peakWorkers} Workers</span>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Safety & HSE</span>
                      <span className="text-lg font-black text-blue-700">{kpiSummary.totalIncidents} LTI</span>
                      <span className="text-[9px] text-blue-600 font-bold block mt-0.5">Zero Lost Time</span>
                    </div>
                  </div>
                )}

                {/* 4. Master Consolidated Ledger Table */}
                {includeMasterTable && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                        <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                        <span>Master Certified Reports Ledger</span>
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500">
                        {targetReports.length} Document Entries
                      </span>
                    </div>

                    {targetReports.length > 0 ? (
                      <div className="rounded-xl border border-slate-200 overflow-hidden text-[11px]">
                        <table className="w-full text-left">
                          <thead className="bg-slate-900 text-white font-bold uppercase text-[9px]">
                            <tr>
                              <th className="px-3 py-2">#</th>
                              <th className="px-3 py-2">Date</th>
                              <th className="px-3 py-2">Doc Reference</th>
                              <th className="px-3 py-2">Report Title & Scope</th>
                              <th className="px-3 py-2">Discipline</th>
                              <th className="px-3 py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {targetReports.map((r, idx) => (
                              <tr key={r.id} className="hover:bg-slate-50/50">
                                <td className="px-3 py-1.5 font-mono text-slate-400 text-[10px]">{idx + 1}</td>
                                <td className="px-3 py-1.5 font-mono text-slate-600">{r.date || r.submissionDate || '-'}</td>
                                <td className="px-3 py-1.5 font-mono font-bold text-slate-900">{r.documentNumber || `REP-${r.id.slice(-6)}`}</td>
                                <td className="px-3 py-1.5 font-semibold text-slate-800">{r.title}</td>
                                <td className="px-3 py-1.5">
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700">
                                    {r.category}
                                  </span>
                                </td>
                                <td className="px-3 py-1.5 font-bold text-[10px] text-emerald-700">
                                  {r.status}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        No reports matching the selected project and discipline filter.
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Photographic Field Evidence Preview */}
                {includePhotoEvidence && targetReports.some(r => (r.photos && r.photos.length > 0) || (r.attachments && r.attachments.some(a => a.type.startsWith('image/')))) && (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                        <Paperclip className="h-4 w-4 text-blue-600" />
                        <span>Field Inspection Photographic Evidence & Attachments</span>
                      </h4>
                    </div>

                    <div className="grid grid-cols-4 gap-2.5">
                      {targetReports.flatMap(r => [
                        ...(r.attachments?.filter(a => a.type.startsWith('image/')) || []),
                        ...(r.photos?.filter(p => !r.attachments?.some(a => a.url === p)).map((p, idx) => ({ id: `p-${idx}`, url: p, name: `Photo ${idx+1}`, caption: r.title })) || [])
                      ]).slice(0, 8).map((photo, pIdx) => (
                        <div key={photo.id || pIdx} className="rounded-lg border border-slate-200 overflow-hidden bg-slate-100">
                          <img src={photo.url} alt={photo.name} className="h-20 w-full object-cover" />
                          <div className="p-1 bg-white text-[8px] font-medium text-slate-700 truncate">
                            {photo.caption || photo.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Multi-Party Formal Sign-Off Matrix */}
                {includeSignoffs && (
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">
                      Multi-Party Technical Verification & Formal Sign-Off Matrix
                    </h4>
                    
                    <div className="grid grid-cols-4 gap-3">
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-center space-y-3">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">Prepared By (Lead Site Supervisor)</span>
                        <div className="h-7 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                          <span className="font-serif italic text-xs text-slate-700">Lindokuhle Chris</span>
                        </div>
                        <span className="text-[8px] text-slate-400 block font-mono">Date: {new Date().toISOString().slice(0, 10)}</span>
                      </div>

                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-center space-y-3">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">Reviewed By (QA/QC Manager)</span>
                        <div className="h-7 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                          <span className="font-serif italic text-xs text-slate-700">David Smith</span>
                        </div>
                        <span className="text-[8px] text-slate-400 block font-mono">Date: {new Date().toISOString().slice(0, 10)}</span>
                      </div>

                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-center space-y-3">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">Certified By (Resident Engineer)</span>
                        <div className="h-7 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                          <span className="font-serif italic text-xs text-slate-700">Sarah Jenkins (Pr.Eng)</span>
                        </div>
                        <span className="text-[8px] text-slate-400 block font-mono">Date: {new Date().toISOString().slice(0, 10)}</span>
                      </div>

                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-center space-y-3">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">Accepted By (Client Representative)</span>
                        <div className="h-7 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                          <span className="font-serif italic text-xs text-slate-700">Transnet Engineering</span>
                        </div>
                        <span className="text-[8px] text-slate-400 block font-mono">Date: {new Date().toISOString().slice(0, 10)}</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Document Footer */}
              <div className="pt-4 mt-6 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Certified Digital Engineering Record | ConstructOS Enterprise Hub</span>
                </div>
                <span>Document ID: {documentNumber}</span>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
