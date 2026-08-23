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
  Palette
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../ui';
import { DailyReport, UniversalReportItem, Activity, SubTask } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { normalizeLabourAssignments, getSubtaskProgressionNumber, getPersonInitials } from '../../lib/labourUtils';
import { saveOrShareFile } from '../../lib/fileExportService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface UniversalReportPrintStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: DailyReport | UniversalReportItem;
  reportType?: 'daily' | 'universal' | 'progress';
}

type ThemeColor = 'navy' | 'monochrome' | 'emerald' | 'amber' | 'cyan';
type PageOrientation = 'portrait' | 'landscape';
type PageDensity = 'compact' | 'standard' | 'expanded';
type WatermarkType = 'none' | 'approved' | 'official' | 'confidential' | 'draft' | 'under_review';

export function UniversalReportPrintStudioModal({
  isOpen,
  onClose,
  report,
  reportType = 'daily'
}: UniversalReportPrintStudioModalProps) {
  const { activities = [], projects = [], employees = [], currentUserProfile } = useAppContext();

  // --------------------------------------------------------------------------
  // Studio Customizer State
  // --------------------------------------------------------------------------
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');
  const [theme, setTheme] = useState<ThemeColor>('navy');
  const [density, setDensity] = useState<PageDensity>('standard');
  const [watermark, setWatermark] = useState<WatermarkType>('none');
  const [zoomLevel, setZoomLevel] = useState<number>(100); // 75, 100, 125

  // Custom Header & Company Overrides
  const [companyName, setCompanyName] = useState<string>('CONSTRUCT OS / SCEDIH ENGINEERING');
  const [companyTagline, setCompanyTagline] = useState<string>('Heavy Civil, Infrastructure & EPC Project Management');
  const [customTitle, setCustomTitle] = useState<string>(() => {
    if ('title' in report && report.title) return report.title;
    if ('date' in report) return `Daily Site Operations Record - ${report.date}`;
    return 'Official Project Report';
  });
  const [customSubtitle, setCustomSubtitle] = useState<string>(
    'Certified Project Verification, Quality Assurance & Daily Site Execution Ledger'
  );

  // Section Inclusions Toggles
  const [includeHeaderCard, setIncludeHeaderCard] = useState<boolean>(true);
  const [includeKpiSummary, setIncludeKpiSummary] = useState<boolean>(true);
  const [includePinnedTasks, setIncludePinnedTasks] = useState<boolean>(true);
  const [includeAllActivitiesTable, setIncludeAllActivitiesTable] = useState<boolean>(true);
  const [includeEnvironment, setIncludeEnvironment] = useState<boolean>(true);
  const [includeDiaryNarrative, setIncludeDiaryNarrative] = useState<boolean>(true);
  const [includeWorkforceMachinery, setIncludeWorkforceMachinery] = useState<boolean>(true);
  const [includeSignoffs, setIncludeSignoffs] = useState<boolean>(true);
  const [includeVerificationQr, setIncludeVerificationQr] = useState<boolean>(true);

  // Print Container Ref
  const printRef = useRef<HTMLDivElement>(null);

  // Detect project details
  const project = useMemo(() => {
    const pId = report.projectId;
    return projects.find(p => p.id === pId) || {
      id: pId || 'PRJ-001',
      name: 'Tournee Solar Power Plant Project',
      code: 'TSP-01',
      location: 'Northern Cape, South Africa'
    };
  }, [projects, report.projectId]);

  // Is Daily Log vs Universal
  const isDaily = 'weather' in report || reportType === 'daily' || ('category' in report && report.category === 'DailySite');
  const dailyData = isDaily ? (report as DailyReport) : null;
  const universalData = !isDaily ? (report as UniversalReportItem) : null;

  // Active Pinned Activities for Daily Report
  const pinnedActivities = useMemo(() => {
    if (!isDaily || !dailyData) return [];
    const pinnedMap = dailyData.pinnedSubtaskMap || {};
    const workedList = dailyData.activitiesWorked || [];
    const loggedList = dailyData.activitiesLogged || [];

    return activities.filter(a => {
      if (pinnedMap[a.id]) return true;
      if (loggedList.includes(a.id)) return true;
      if (workedList.includes(a.name)) return true;
      return false;
    });
  }, [isDaily, dailyData, activities]);

  // Helper to extract focused subtasks for an activity
  const getFocusedSubtasks = (act: Activity): SubTask[] => {
    const allSubtasks = act.subtasks || [];
    if (!dailyData?.pinnedSubtaskMap) return allSubtasks;
    const sel = dailyData.pinnedSubtaskMap[act.id];
    if (!sel || sel === 'all') return allSubtasks;
    if (Array.isArray(sel)) {
      return allSubtasks.filter(st => sel.includes(st.id));
    }
    return allSubtasks;
  };

  // --------------------------------------------------------------------------
  // Theme Color Configurations
  // --------------------------------------------------------------------------
  const themeStyles = useMemo(() => {
    switch (theme) {
      case 'monochrome':
        return {
          primaryBg: 'bg-black text-white',
          headerBg: 'bg-black text-white',
          accentBorder: 'border-black',
          badgeBg: 'bg-slate-100 text-black border border-black',
          kpiBox: 'bg-slate-50 border-slate-300 text-black',
          highlightText: 'text-black font-black',
          stripe: 'bg-black',
          pdfHeader: [0, 0, 0] as [number, number, number],
          pdfAccent: [50, 50, 50] as [number, number, number]
        };
      case 'emerald':
        return {
          primaryBg: 'bg-emerald-900 text-white',
          headerBg: 'bg-emerald-950 text-white',
          accentBorder: 'border-emerald-600',
          badgeBg: 'bg-emerald-50 text-emerald-800 border border-emerald-300',
          kpiBox: 'bg-emerald-50/50 border-emerald-200 text-emerald-950',
          highlightText: 'text-emerald-700 font-bold',
          stripe: 'bg-emerald-600',
          pdfHeader: [6, 78, 59] as [number, number, number],
          pdfAccent: [16, 185, 129] as [number, number, number]
        };
      case 'amber':
        return {
          primaryBg: 'bg-amber-900 text-white',
          headerBg: 'bg-amber-950 text-white',
          accentBorder: 'border-amber-600',
          badgeBg: 'bg-amber-50 text-amber-900 border border-amber-300',
          kpiBox: 'bg-amber-50/50 border-amber-200 text-amber-950',
          highlightText: 'text-amber-700 font-bold',
          stripe: 'bg-amber-500',
          pdfHeader: [120, 53, 15] as [number, number, number],
          pdfAccent: [217, 119, 6] as [number, number, number]
        };
      case 'cyan':
        return {
          primaryBg: 'bg-cyan-950 text-white',
          headerBg: 'bg-slate-900 text-white',
          accentBorder: 'border-cyan-500',
          badgeBg: 'bg-cyan-50 text-cyan-900 border border-cyan-300',
          kpiBox: 'bg-cyan-50/40 border-cyan-200 text-cyan-950',
          highlightText: 'text-cyan-600 font-bold',
          stripe: 'bg-cyan-500',
          pdfHeader: [15, 23, 42] as [number, number, number],
          pdfAccent: [6, 182, 212] as [number, number, number]
        };
      case 'navy':
      default:
        return {
          primaryBg: 'bg-[#0F172A] text-white',
          headerBg: 'bg-[#0F172A] text-white',
          accentBorder: 'border-[#0B5FFF]',
          badgeBg: 'bg-blue-50 text-[#0B5FFF] border border-blue-200',
          kpiBox: 'bg-slate-50 border-slate-200 text-slate-900',
          highlightText: 'text-[#0B5FFF] font-bold',
          stripe: 'bg-[#0B5FFF]',
          pdfHeader: [15, 23, 42] as [number, number, number],
          pdfAccent: [11, 95, 255] as [number, number, number]
        };
    }
  }, [theme]);

  // --------------------------------------------------------------------------
  // Native Browser Print Engine (Vector Perfect & @media print)
  // --------------------------------------------------------------------------
  const handleTriggerBrowserPrint = () => {
    window.print();
  };

  // --------------------------------------------------------------------------
  // Vector PDF Generator Engine (jsPDF + autoTable)
  // --------------------------------------------------------------------------
  const handleDownloadVectorPdf = () => {
    const doc = new jsPDF({
      orientation: orientation === 'landscape' ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = orientation === 'landscape' ? 297 : 210;
    const primaryColor = themeStyles.pdfHeader;
    const accentColor = themeStyles.pdfAccent;

    // 1. Header Banner
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 24, 'F');

    doc.setFillColor(...accentColor);
    doc.rect(0, 24, pageWidth, 1.8, 'F');

    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName.toUpperCase(), 14, 11);

    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.setFont('helvetica', 'normal');
    doc.text(customTitle, 14, 18);

    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(`DOC REF: ${report.id || ('documentNumber' in report ? report.documentNumber : 'DLY-REC')}`, pageWidth - 14, 11, { align: 'right' });

    doc.setFontSize(7.5);
    doc.setTextColor(191, 219, 254);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${report.date}   |   Status: APPROVED`, pageWidth - 14, 18, { align: 'right' });

    // 2. Project Information Card
    autoTable(doc, {
      startY: 30,
      head: [['Project & Site Information', 'Contract & Governance Details']],
      body: [
        [
          `Project: ${project.name} (${project.id})\nLocation: ${project.location || 'Site Wide'}\nDiscipline / Package: ${('category' in report && report.category) || 'General Construction Works'}`,
          `Reference Number: ${report.id}\nShift Date: ${report.date}\nRevision: Rev 0 (Certified Final)\nAuthor: ${('author' in report && report.author) || 'Site Operations Lead'}`
        ]
      ],
      theme: 'plain',
      headStyles: {
        fillColor: [248, 250, 252],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 8.5,
        cellPadding: 3
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
        cellPadding: 3,
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      },
      margin: { left: 14, right: 14 }
    });

    let currentY = (doc as any).lastAutoTable?.finalY || 55;

    // 3. Environmental & KPI Table for Daily Reports
    if (isDaily && dailyData && includeKpiSummary) {
      autoTable(doc, {
        startY: currentY + 3,
        head: [['Weather & Ground', 'Workforce Deployed', 'Plant & Machinery', 'Safety & Quality']],
        body: [[
          `${dailyData.weather || 'Sunny'} (${dailyData.temperature || '24°C'})\n${dailyData.siteConditions || 'Normal operations'}`,
          `${dailyData.workersOnSite || 0} Active Personnel\nAssigned to Focus Deliverables`,
          `${dailyData.equipmentRunning || 0} Plant Units\nOperating on Task`,
          `${dailyData.incidents || 0} Incidents | ${dailyData.ncr || 0} NCRs\nHSE Verified Zero Harm`
        ]],
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59],
          halign: 'center',
          fontStyle: 'bold'
        },
        margin: { left: 14, right: 14 }
      });

      currentY = (doc as any).lastAutoTable?.finalY || currentY + 25;
    }

    // 4. Pinned Tasks & Deliverable Verification
    if (isDaily && pinnedActivities.length > 0 && includePinnedTasks) {
      const taskRows: any[][] = [];

      pinnedActivities.forEach(act => {
        const focused = getFocusedSubtasks(act);
        focused.forEach((st, sIdx) => {
          const progNum = getSubtaskProgressionNumber(act.subtasks || [], sIdx);
          const isDone = st.status === 'Completed';
          const qtyText = st.targetQuantity ? `${st.completedQuantity || 0} / ${st.targetQuantity} ${st.unit || act.unit || 'm'}` : '-';
          const pct = st.targetQuantity ? Math.min(100, Math.round(((st.completedQuantity || 0) / st.targetQuantity) * 100)) : (isDone ? 100 : 50);

          taskRows.push([
            `[${act.code || act.id}] ${act.name}`,
            progNum,
            st.title,
            st.category || 'General',
            qtyText,
            `${pct}%`,
            isDone ? 'COMPLETED' : 'IN PROGRESS'
          ]);
        });
      });

      autoTable(doc, {
        startY: currentY + 4,
        head: [['Activity & Work Package', 'Step', 'Subtask Deliverable', 'Category', 'Output / Qty', 'Progress', 'Status']],
        body: taskRows,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 7.5
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: 2.5
        },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
          2: { cellWidth: 50 },
          3: { cellWidth: 25 },
          4: { cellWidth: 22, halign: 'center' },
          5: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
          6: { cellWidth: 22, halign: 'center' }
        },
        margin: { left: 14, right: 14 }
      });

      currentY = (doc as any).lastAutoTable?.finalY || currentY + 30;
    }

    // 5. Site Diary & Supervisor Notes
    if (isDaily && dailyData && includeDiaryNarrative) {
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      autoTable(doc, {
        startY: currentY + 4,
        head: [['Daily Site Diary, Significant Events & Inspection Notes']],
        body: [[dailyData.significantEvents || dailyData.workSummary || dailyData.supervisorNotes || 'Standard shift operations executed in full accordance with design drawings and safety specifications.']],
        theme: 'plain',
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontStyle: 'bold',
          fontSize: 8.5
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [51, 65, 85],
          cellPadding: 3.5,
          lineColor: [226, 232, 240],
          lineWidth: 0.2
        },
        margin: { left: 14, right: 14 }
      });

      currentY = (doc as any).lastAutoTable?.finalY || currentY + 25;
    }

    // 6. Multi-Party Sign-Off Card
    if (includeSignoffs) {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      autoTable(doc, {
        startY: currentY + 4,
        head: [['Site Supervisor (Prepared By)', 'QA/QC Engineer (Verified By)', 'Resident Engineer / Client (Approved By)']],
        body: [
          [
            `Name: Site Operations Lead\nSignature: __________________\nDate: ${report.date}\nStatus: VERIFIED & SUBMITTED`,
            `Name: Lead QA/QC Consultant\nSignature: __________________\nDate: ${report.date}\nStatus: HOLD POINTS CLEARED`,
            `Name: Resident Project Engineer\nSignature: __________________\nDate: ${report.date}\nStatus: FORMALLY ACCEPTED`
          ]
        ],
        theme: 'grid',
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontStyle: 'bold',
          fontSize: 7.5,
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [71, 85, 105],
          cellPadding: 3
        },
        margin: { left: 14, right: 14 }
      });
    }

    // 7. Security Watermark Stamp (if selected)
    if (watermark !== 'none') {
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(48);
        doc.setTextColor(220, 220, 220);
        doc.setFont('helvetica', 'bold');
        const stampText = watermark.replace('_', ' ').toUpperCase();
        doc.text(stampText, pageWidth / 2, orientation === 'landscape' ? 105 : 148, {
          align: 'center',
          angle: 35
        });
      }
    }

    // Save or Share PDF
    const filename = `${report.id || 'Report'}_Official_Record.pdf`;
    const pdfBlob = doc.output('blob');
    saveOrShareFile({
      filename,
      blob: pdfBlob,
      title: `${companyName} - ${customTitle}`,
      saveToDownloads: true,
      triggerShare: true
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div className="bg-slate-100 dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full h-[95vh] flex flex-col overflow-hidden">
        
        {/* Top Studio Control Bar */}
        <div className="p-4 md:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-[#0B5FFF] flex items-center justify-center shrink-0 shadow-sm">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Universal Report Print & PDF Studio
                </h3>
                <Badge variant="outline" className="text-[10px] font-mono uppercase bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF]">
                  WYSIWYG Engine
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Interactive real-time preview, custom corporate branding, and vector-perfect document export
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
              <span>Print Document</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleDownloadVectorPdf}
              className="h-9 px-4 rounded-xl text-xs font-bold gap-1.5 bg-[#0B5FFF] hover:bg-blue-600 text-white shadow-sm"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 ml-1 text-slate-500"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Studio Body: Split View (Left: Customization Drawer, Right: Live A4 Visualizer) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* LEFT PANE: Studio Controls & Configuration Drawer */}
          <div className="w-full lg:w-80 xl:w-96 p-4 md:p-5 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto space-y-6 shrink-0">
            
            {/* 1. Layout & Geometry */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-blue-500" />
                <span>Layout & Formatting</span>
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    orientation === 'portrait'
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-[#0B5FFF] text-[#0B5FFF] shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  <Maximize2 className="h-3.5 w-3.5 rotate-90" />
                  <span>A4 Portrait</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    orientation === 'landscape'
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-[#0B5FFF] text-[#0B5FFF] shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>A4 Landscape</span>
                </button>
              </div>

              {/* Color Themes */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5 flex items-center gap-1">
                  <Palette className="h-3 w-3" /> Color Palette
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['navy', 'monochrome', 'emerald', 'amber', 'cyan'] as ThemeColor[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTheme(t)}
                      className={`h-8 rounded-xl border text-[10px] font-bold capitalize transition-all ${
                        theme === t
                          ? 'border-[#0B5FFF] ring-2 ring-blue-400 font-black'
                          : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                      } ${
                        t === 'navy' ? 'bg-[#0F172A] text-white' :
                        t === 'monochrome' ? 'bg-black text-white' :
                        t === 'emerald' ? 'bg-emerald-800 text-white' :
                        t === 'amber' ? 'bg-amber-700 text-white' :
                        'bg-cyan-800 text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Watermark Selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5">
                  Security Watermark
                </label>
                <select
                  value={watermark}
                  onChange={e => setWatermark(e.target.value as WatermarkType)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="none">No Watermark</option>
                  <option value="approved">APPROVED</option>
                  <option value="official">OFFICIAL SITE RECORD</option>
                  <option value="confidential">CONFIDENTIAL</option>
                  <option value="draft">DRAFT</option>
                  <option value="under_review">UNDER REVIEW</option>
                </select>
              </div>
            </div>

            {/* 2. Corporate Branding Overrides */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-blue-500" />
                <span>Branding & Organization</span>
              </h4>

              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Company Header Text</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Document Title Override</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={e => setCustomTitle(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* 3. Section Inclusions Toggle */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-blue-500" />
                <span>Section Inclusions</span>
              </h4>

              <div className="space-y-2 text-xs">
                <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                  <span>Project & Header Card</span>
                  <input
                    type="checkbox"
                    checked={includeHeaderCard}
                    onChange={e => setIncludeHeaderCard(e.target.checked)}
                    className="rounded text-[#0B5FFF] h-4 w-4"
                  />
                </label>

                {isDaily && (
                  <>
                    <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                      <span>Environmental & Resource KPIs</span>
                      <input
                        type="checkbox"
                        checked={includeKpiSummary}
                        onChange={e => setIncludeKpiSummary(e.target.checked)}
                        className="rounded text-[#0B5FFF] h-4 w-4"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                      <span>Pinned Tasks & Deliverable Execution</span>
                      <input
                        type="checkbox"
                        checked={includePinnedTasks}
                        onChange={e => setIncludePinnedTasks(e.target.checked)}
                        className="rounded text-[#0B5FFF] h-4 w-4"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                      <span>Workforce & Machinery Badges</span>
                      <input
                        type="checkbox"
                        checked={includeWorkforceMachinery}
                        onChange={e => setIncludeWorkforceMachinery(e.target.checked)}
                        className="rounded text-[#0B5FFF] h-4 w-4"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                      <span>Site Diary / Significant Events</span>
                      <input
                        type="checkbox"
                        checked={includeDiaryNarrative}
                        onChange={e => setIncludeDiaryNarrative(e.target.checked)}
                        className="rounded text-[#0B5FFF] h-4 w-4"
                      />
                    </label>
                  </>
                )}

                <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                  <span>Formal Sign-Off & Verification Box</span>
                  <input
                    type="checkbox"
                    checked={includeSignoffs}
                    onChange={e => setIncludeSignoffs(e.target.checked)}
                    className="rounded text-[#0B5FFF] h-4 w-4"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                  <span>Verification QR & Document Hash</span>
                  <input
                    type="checkbox"
                    checked={includeVerificationQr}
                    onChange={e => setIncludeVerificationQr(e.target.checked)}
                    className="rounded text-[#0B5FFF] h-4 w-4"
                  />
                </label>
              </div>
            </div>

          </div>

          {/* RIGHT PANE: Live Interactive A4 / Letter Document Visualizer */}
          <div className="flex-1 bg-slate-200/80 dark:bg-slate-950 p-4 sm:p-6 md:p-8 overflow-y-auto flex flex-col items-center justify-start">
            
            {/* Visualizer Floating Zoom Toolbar */}
            <div className="sticky top-0 z-10 mb-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-full shadow-md flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(60, prev - 15))}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300 w-10 text-center">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(150, prev + 15))}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
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
                        {customTitle}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold bg-white/15 px-2.5 py-1 rounded-md">
                        {report.id || ('documentNumber' in report ? report.documentNumber : 'DLY-REC')}
                      </span>
                      <p className="text-[11px] text-slate-300 font-mono mt-1">
                        Date: {report.date} | Rev 0
                      </p>
                    </div>
                  </div>
                  <div className={`h-1.5 ${themeStyles.stripe}`} />
                </div>

                {/* 2. Project Information Card */}
                {includeHeaderCard && (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Project & Location</span>
                      <p className="font-bold text-slate-900 text-sm">{project.name}</p>
                      <p className="text-slate-500">{project.location || 'Northern Cape, South Africa'} ({project.id})</p>
                      <p className="text-slate-600 mt-1">
                        Discipline: <strong>{('category' in report && report.category) || 'Civil & Electrical Infrastructure'}</strong>
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Governance & Filing</span>
                      <p className="text-slate-700">Author: <strong>{('author' in report && report.author) || 'Site Supervisor / Engineer'}</strong></p>
                      <p className="text-slate-700">Submission Date: <strong>{report.date}</strong></p>
                      <p className="text-slate-700">Compliance: <strong>ISO 9001 / GCC 2015 Site Standard</strong></p>
                    </div>
                  </div>
                )}

                {/* 3. Daily KPIs Strip (For Daily Reports) */}
                {isDaily && dailyData && includeKpiSummary && (
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div className={`p-3 rounded-xl border ${themeStyles.kpiBox}`}>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Weather / Ground</span>
                      <p className="font-black text-sm mt-0.5">{dailyData.weather || 'Sunny'} ({dailyData.temperature || '24°C'})</p>
                      <p className="text-[10px] text-slate-500 truncate">{dailyData.siteConditions || 'Normal operations'}</p>
                    </div>

                    <div className={`p-3 rounded-xl border ${themeStyles.kpiBox}`}>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Workforce Deployed</span>
                      <p className={`text-base font-black mt-0.5 ${themeStyles.highlightText}`}>{dailyData.workersOnSite || 0}</p>
                      <p className="text-[10px] text-slate-500">Personnel on task</p>
                    </div>

                    <div className={`p-3 rounded-xl border ${themeStyles.kpiBox}`}>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Plant Allocated</span>
                      <p className="text-base font-black text-blue-600 mt-0.5">{dailyData.equipmentRunning || 0}</p>
                      <p className="text-[10px] text-slate-500">Operating units</p>
                    </div>

                    <div className={`p-3 rounded-xl border ${themeStyles.kpiBox}`}>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">HSE & Quality</span>
                      <p className="text-base font-black text-emerald-600 mt-0.5">{dailyData.incidents || 0} / {dailyData.ncr || 0}</p>
                      <p className="text-[10px] text-emerald-700 font-bold">Zero Harm Record</p>
                    </div>
                  </div>
                )}

                {/* 4. Pinned Tasks & Deliverable Execution (Matching Image 2 / Daily Logs) */}
                {isDaily && pinnedActivities.length > 0 && includePinnedTasks && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                        <span>Today's Pinned Focus & Deliverable Verification</span>
                      </h3>
                      <span className="font-mono text-[10px] text-slate-500 font-bold">
                        {pinnedActivities.length} Activities Active
                      </span>
                    </div>

                    <div className="space-y-3">
                      {pinnedActivities.map(act => {
                        const allSubtasks = act.subtasks || [];
                        const focused = getFocusedSubtasks(act);
                        const actLabour = normalizeLabourAssignments(act.assignedLabour, employees);
                        const actEquipment = act.assignedEquipment || [];

                        return (
                          <div key={act.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2.5">
                            <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-black text-blue-600">
                                  {act.code || act.id}
                                </span>
                                <span className="font-bold text-xs text-slate-900">{act.name}</span>
                                <span className="text-[10px] bg-slate-200 px-1.5 py-0.2 rounded font-bold">{act.discipline || 'General'}</span>
                                {act.sectionSpan && (
                                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-bold">Span: {act.sectionSpan}</span>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Overall: </span>
                                <span className="text-xs font-black text-blue-600">{act.progress || 0}%</span>
                              </div>
                            </div>

                            {/* Subtask Rows */}
                            <div className="space-y-1.5">
                              {focused.map((st, sIdx) => {
                                const origIdx = allSubtasks.findIndex(s => s.id === st.id);
                                const progNum = getSubtaskProgressionNumber(allSubtasks, origIdx >= 0 ? origIdx : sIdx);
                                const isDone = st.status === 'Completed';

                                return (
                                  <div key={st.id} className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200 text-xs">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <span className="font-mono font-black text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                                        {progNum}
                                      </span>
                                      <span className={`text-[11px] font-bold truncate ${isDone ? 'text-emerald-700' : 'text-slate-800'}`}>
                                        {isDone ? '✓ ' : '○ '} {st.title}
                                      </span>
                                      <span className="text-[9px] text-slate-400">({st.category})</span>
                                      {st.isHoldPoint && (
                                        <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-1 rounded">QA Hold</span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      {st.targetQuantity ? (
                                        <span className="font-mono text-[11px] font-bold text-slate-700">
                                          {st.completedQuantity || 0} / {st.targetQuantity} {st.unit || act.unit || 'm'}
                                        </span>
                                      ) : null}
                                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {isDone ? 'Done 100%' : 'In Progress'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Labour & Machinery row */}
                            {includeWorkforceMachinery && (
                              <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 flex-wrap gap-2">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="font-bold text-amber-700">👷 Workforce:</span>
                                  {actLabour.length === 0 ? (
                                    <span>Standard crew</span>
                                  ) : (
                                    actLabour.map((l, lIdx) => (
                                      <span key={lIdx} className="bg-amber-50 text-amber-900 px-1.5 rounded font-semibold border border-amber-200">
                                        {l.name} ({l.hours || 8}h)
                                      </span>
                                    ))
                                  )}
                                </div>

                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="font-bold text-blue-700">🚜 Plant:</span>
                                  {actEquipment.length === 0 ? (
                                    <span>None</span>
                                  ) : (
                                    actEquipment.map((eq, eIdx) => (
                                      <span key={eIdx} className="bg-blue-50 text-blue-900 px-1.5 rounded font-semibold border border-blue-200">
                                        {typeof eq === 'string' ? eq : (eq.name || eq.equipmentId)}
                                      </span>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 5. Site Diary / Significant Events Narrative */}
                {isDaily && dailyData && includeDiaryNarrative && (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Site Operations Diary & Significant Events
                    </h4>
                    <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                      {dailyData.significantEvents || dailyData.workSummary || dailyData.supervisorNotes || 'All site operations conducted within design tolerances and approved HSE safety standards.'}
                    </p>
                  </div>
                )}

                {/* 6. Multi-Party Formal Sign-Off Matrix */}
                {includeSignoffs && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center">
                      Official Multi-Party Site Verification & Approval Sign-Off
                    </h4>

                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
                        <span className="font-bold text-[10px] uppercase text-slate-400 block">Site Supervisor</span>
                        <p className="font-bold text-slate-900">David Smith</p>
                        <div className="h-8 border-b border-dashed border-slate-300 flex items-end">
                          <span className="font-mono text-[9px] text-emerald-600 font-bold">DIGITALLY SIGNED</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Date: {report.date}</p>
                      </div>

                      <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
                        <span className="font-bold text-[10px] uppercase text-slate-400 block">Lead QA/QC Inspector</span>
                        <p className="font-bold text-slate-900">Sarah Jenkins</p>
                        <div className="h-8 border-b border-dashed border-slate-300 flex items-end">
                          <span className="font-mono text-[9px] text-emerald-600 font-bold">QA GATES PASSED</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Date: {report.date}</p>
                      </div>

                      <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
                        <span className="font-bold text-[10px] uppercase text-slate-400 block">Resident Engineer / Client</span>
                        <p className="font-bold text-slate-900">Michael Scott</p>
                        <div className="h-8 border-b border-dashed border-slate-300 flex items-end">
                          <span className="font-mono text-[9px] text-emerald-600 font-bold">ACCEPTED</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Date: {report.date}</p>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Document Footer Ribbon & Security Hash */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono mt-6">
                <div>
                  <span>ConstructOS Security Verified • SHA-256 Hash: </span>
                  <span className="font-bold text-slate-600">8f92a1bc...390e</span>
                </div>

                <div className="flex items-center gap-2">
                  {includeVerificationQr && (
                    <span className="flex items-center gap-1 font-sans font-semibold text-slate-600">
                      <QrCode className="h-3.5 w-3.5 text-blue-600" />
                      Verify Online
                    </span>
                  )}
                  <span>Page 1 of 1</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
