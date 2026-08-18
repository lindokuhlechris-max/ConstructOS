import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  Layers, 
  ShieldCheck, 
  Sliders, 
  Check, 
  Eye, 
  Sparkles,
  PlayCircle,
  CalendarClock,
  Compass,
  Package,
  Wrench,
  FileCheck,
  Settings2,
  Filter,
  CheckSquare,
  HardHat,
  BadgeCheck,
  TrendingUp
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, ProgressBar } from './ui';
import { Activity, Project, ActivityStatus, WorkstreamType } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveOrShareFile } from '../lib/fileExportService';

export interface ActivitiesPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: Activity[];
  projects: Project[];
  currentUserProfile?: { name?: string; role?: string; email?: string } | null;
  defaultProjectId?: string;
  defaultFilterLabel?: string;
}

export type ReportTemplateType = 
  | 'executive'     // Executive Operations Summary
  | 'detailed'      // Detailed Engineering Task Dossier
  | 'workstream'    // Multi-Discipline Matrix
  | 'briefing';     // Daily Shift Briefing & Sign-Off

export function ActivitiesPdfModal({
  isOpen,
  onClose,
  activities,
  projects,
  currentUserProfile,
  defaultProjectId = 'all',
  defaultFilterLabel = 'All Activities'
}: ActivitiesPdfModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Configuration State
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplateType>('executive');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjectId);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all');
  const [reportTitle, setReportTitle] = useState<string>('Construction Activities Progress & Execution Master Report');
  const [reportSubtitle, setReportSubtitle] = useState<string>(defaultFilterLabel);
  const [preparedBy, setPreparedBy] = useState<string>(
    currentUserProfile?.name 
      ? `${currentUserProfile.name} (${currentUserProfile.role || 'Site Manager'})`
      : 'Site Supervisor / Operations Manager'
  );
  
  // Feature Toggles
  const [includeKpiSummary, setIncludeKpiSummary] = useState<boolean>(true);
  const [includeSubtasks, setIncludeSubtasks] = useState<boolean>(true);
  const [includeQaHoldPoints, setIncludeQaHoldPoints] = useState<boolean>(true);
  const [includeSignoff, setIncludeSignoff] = useState<boolean>(true);

  // Tab mode
  const [activeTab, setActiveTab] = useState<'preview' | 'config'>('preview');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Sync body class for print isolation
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('print-modal-open');
    } else {
      document.body.classList.remove('print-modal-open');
    }
    return () => document.body.classList.remove('print-modal-open');
  }, [isOpen]);

  // Filtered dataset
  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      if (selectedProjectId !== 'all' && a.projectId !== selectedProjectId) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (disciplineFilter !== 'all' && (a.discipline || 'General') !== disciplineFilter) return false;
      return true;
    });
  }, [activities, selectedProjectId, statusFilter, disciplineFilter]);

  // Unique disciplines list
  const uniqueDisciplines = useMemo(() => {
    const set = new Set<string>();
    activities.forEach(a => {
      if (a.discipline) set.add(a.discipline);
    });
    return Array.from(set);
  }, [activities]);

  // Current Project
  const currentProject = useMemo(() => {
    if (selectedProjectId === 'all') return projects[0];
    return projects.find(p => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  // High-Level Metrics
  const totalCount = filteredActivities.length;
  const inProgressCount = filteredActivities.filter(a => a.status === 'In Progress').length;
  const completedCount = filteredActivities.filter(a => a.status === 'Completed').length;
  const blockedCount = filteredActivities.filter(a => a.status === 'Blocked' || a.status === 'Waiting' || a.status === 'Cancelled').length;
  const notStartedCount = filteredActivities.filter(a => a.status === 'Not Started' || a.status === 'Ready').length;
  const avgProgress = totalCount > 0 
    ? Math.round(filteredActivities.reduce((acc, a) => acc + (a.progress || 0), 0) / totalCount) 
    : 0;

  const totalPlannedHours = filteredActivities.reduce((acc, a) => acc + (Number(a.plannedHours) || 0), 0);
  const totalActualHours = filteredActivities.reduce((acc, a) => acc + (Number(a.actualHours) || 0), 0);
  const totalSubtasksCount = filteredActivities.reduce((acc, a) => acc + (a.subtasks?.length || 0), 0);
  const totalQaHoldPoints = filteredActivities.reduce((acc, a) => acc + (a.subtasks?.filter(s => s.isHoldPoint)?.length || 0), 0);

  const currentDateFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const currentTimeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // -------------------------------------------------------------
  // Robust Multi-Page Vector jsPDF Report Engine
  // -------------------------------------------------------------
  const generatePdfBlob = async (): Promise<Blob> => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;
    const contentWidth = pageWidth - margin * 2;

    // Palette tokens
    const brandBlue = [11, 95, 255];   // #0B5FFF
    const darkNavy = [15, 23, 42];     // slate-900
    const slateMuted = [100, 116, 139]; // slate-500
    const cardBg = [248, 250, 252];     // slate-50
    const borderColor = [226, 232, 240]; // slate-200

    // 1. Top Accent & Header Bar
    doc.setFillColor(brandBlue[0], brandBlue[1], brandBlue[2]);
    doc.rect(0, 0, pageWidth, 54, 'F');

    // Title inside banner
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('CONSTRUCTFIELD ENTERPRISE', margin, 24);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      selectedTemplate === 'detailed' 
        ? 'Detailed Engineering Task Dossier & Quality Ledger'
        : selectedTemplate === 'workstream'
        ? 'Cross-Discipline Workstream Progress Matrix'
        : selectedTemplate === 'briefing'
        ? 'Daily Shift Briefing & Task Authorization Sheet'
        : 'Construction Activities Execution & Progress Master Report',
      margin,
      41
    );

    // Reference ID & Classification
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL PROJECT RECORD', pageWidth - margin - 150, 24);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ref: CF-ACT-${new Date().toISOString().split('T')[0]}`, pageWidth - margin - 150, 41);

    // Sub-banner project metadata
    let currentY = 74;
    doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(reportTitle, margin, currentY);

    currentY += 16;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(
      `Project: ${currentProject?.name || 'Main Construction Site'} (${currentProject?.id || 'PROJ-01'})   |   Location: ${currentProject?.location || 'Jobsite'}   |   Scope View: ${reportSubtitle}`,
      margin,
      currentY
    );

    currentY += 13;
    doc.text(
      `Generated: ${currentDateFormatted} at ${currentTimeFormatted}   |   Prepared By: ${preparedBy}   |   Total Items: ${totalCount}`,
      margin,
      currentY
    );

    // 2. Executive KPI Cards Section (if toggled)
    if (includeKpiSummary) {
      currentY += 16;
      const cardHeight = 40;
      const cardGap = 8;
      const numCards = 6;
      const cardW = (contentWidth - cardGap * (numCards - 1)) / numCards;

      const kpis = [
        { label: 'TOTAL TASKS', val: `${totalCount}`, color: brandBlue },
        { label: 'IN PROGRESS', val: `${inProgressCount}`, color: [37, 99, 235] },
        { label: 'COMPLETED', val: `${completedCount}`, color: [5, 150, 105] },
        { label: 'BLOCKED / HOLD', val: `${blockedCount}`, color: blockedCount > 0 ? [220, 38, 38] : [100, 116, 139] },
        { label: 'AVG PROGRESS', val: `${avgProgress}%`, color: [79, 70, 229] },
        { label: 'HOURS LOGGED', val: `${totalActualHours} / ${totalPlannedHours}h`, color: [14, 116, 144] },
      ];

      kpis.forEach((kpi, idx) => {
        const x = margin + idx * (cardW + cardGap);
        doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.roundedRect(x, currentY, cardW, cardHeight, 4, 4, 'FD');

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
        doc.text(kpi.label, x + 6, currentY + 13);

        doc.setFontSize(12);
        doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        doc.text(kpi.val, x + 6, currentY + 31);
      });

      currentY += cardHeight + 14;
    } else {
      currentY += 14;
    }

    // 3. Main Data Table Construction
    if (selectedTemplate === 'detailed') {
      // Detailed Dossier with subtasks & hold points
      const tableHeaders = [
        ['ID & Stream', 'Activity Scope & Subtask Checklist', 'Discipline', 'Priority', 'Qty / Target', 'Status', 'Schedule', 'Progress %']
      ];

      const tableData = filteredActivities.map(act => {
        const subtasks = act.subtasks || [];
        let scopeContent = act.name;
        if (act.workPackage) scopeContent += `\nPackage: ${act.workPackage}`;
        if (act.area) scopeContent += `  •  Area: ${act.area}`;
        if (act.sectionSpan) scopeContent += `  •  Span: ${act.sectionSpan}`;

        if (includeSubtasks && subtasks.length > 0) {
          scopeContent += `\n\nSubtasks & Deliverables (${subtasks.filter(s => s.status === 'Completed').length}/${subtasks.length}):`;
          subtasks.slice(0, 5).forEach(s => {
            const mark = s.status === 'Completed' ? '[✓ DONE]' : s.status === 'In Progress' ? '[▶ PROG]' : '[  TODO]';
            scopeContent += `\n  ${mark} ${s.title}${s.isHoldPoint ? '  [QA HOLD POINT]' : ''}`;
          });
          if (subtasks.length > 5) {
            scopeContent += `\n  ... (+${subtasks.length - 5} more deliverables)`;
          }
        }

        return [
          `${act.id}\n${act.workstream || 'PTS'}`,
          scopeContent,
          act.discipline || 'General',
          act.priority || 'Medium',
          `${act.actualQuantity ?? 0} / ${act.targetQuantity ?? 0} ${act.unit || 'units'}`,
          act.status || 'Not Started',
          `${act.startDate || '—'}\nto ${act.finishDate || '—'}`,
          `${act.progress || 0}%`
        ];
      });

      autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: currentY,
        theme: 'grid',
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [51, 65, 85],
          fontSize: 8,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 6,
          textColor: [15, 23, 42],
          lineColor: [226, 232, 240],
        },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: 'bold' },
          1: { cellWidth: 260 },
          2: { cellWidth: 65 },
          3: { cellWidth: 55 },
          4: { cellWidth: 80 },
          5: { cellWidth: 75 },
          6: { cellWidth: 90 },
          7: { cellWidth: 65, halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: margin, right: margin }
      });
    } else {
      // Standard Executive Summary Table
      const tableHeaders = [
        ['ID', 'Activity Scope & Package Details', 'Discipline', 'Priority', 'Qty / Target', 'Status', 'Start Date', 'Progress %']
      ];

      const tableData = filteredActivities.map(act => [
        act.id,
        `${act.name}${act.workPackage ? `\nPackage: ${act.workPackage}` : ''}${act.area ? `  •  Area: ${act.area}` : ''}${act.sectionSpan ? `  •  Span: ${act.sectionSpan}` : ''}`,
        act.discipline || 'General Civil',
        act.priority || 'Medium',
        `${act.actualQuantity ?? 0} / ${act.targetQuantity ?? 0} ${act.unit || 'units'}`,
        act.status || 'Not Started',
        act.startDate || '—',
        `${act.progress || 0}%`
      ]);

      autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: currentY,
        theme: 'grid',
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [51, 65, 85],
          fontSize: 8.5,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 8,
          cellPadding: 6,
          textColor: [15, 23, 42],
          lineColor: [226, 232, 240],
        },
        columnStyles: {
          0: { cellWidth: 60, fontStyle: 'bold' },
          1: { cellWidth: 260 },
          2: { cellWidth: 75 },
          3: { cellWidth: 60 },
          4: { cellWidth: 85 },
          5: { cellWidth: 75 },
          6: { cellWidth: 80 },
          7: { cellWidth: 65, halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: margin, right: margin }
      });
    }

    // 4. Sign-Off & Verification Footer Block (if toggled)
    const lastTable = (doc as any).lastAutoTable;
    let finalY = lastTable ? lastTable.finalY + 18 : currentY + 30;

    if (includeSignoff) {
      if (finalY > pageHeight - 100) {
        doc.addPage();
        finalY = 50;
      }

      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, finalY, contentWidth, 50, 4, 4, 'FD');

      doc.setFontSize(8);
      doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('SITE MANAGEMENT REVIEW & EXECUTION SIGN-OFF', margin + 12, finalY + 14);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      doc.text('I confirm that the recorded activity states, physical deliverables, and progress milestones represented in this report reflect the authentic site situation.', margin + 12, finalY + 25);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
      doc.text(`Authorized Signature: ___________________________ (${preparedBy})`, margin + 12, finalY + 41);
      doc.text(`QA/QC Verification: ___________________________`, margin + 340, finalY + 41);
      doc.text(`Date: ${currentDateFormatted}`, margin + 600, finalY + 41);
    }

    // 5. Running Page Footers on all pages
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      doc.text(
        `Constructfield Enterprise Field Management System  •  Official Project Record  •  Confidential`,
        margin,
        pageHeight - 16
      );
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin - 50,
        pageHeight - 16
      );
    }

    return doc.output('blob');
  };

  // Export PDF Handler
  const handleDownloadPdf = async () => {
    try {
      setIsGenerating(true);
      const blob = await generatePdfBlob();
      const filename = `constructfield_activities_report_${new Date().toISOString().split('T')[0]}.pdf`;
      await saveOrShareFile({
        filename,
        blob,
        title: reportTitle,
        text: `Constructfield Activities Report - ${reportSubtitle}`
      });
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Dedicated Vector Print Handler (No background screen artifacts)
  const handlePrint = async () => {
    try {
      setIsGenerating(true);
      const blob = await generatePdfBlob();
      const blobUrl = URL.createObjectURL(blob);
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            console.error('Direct print failed, falling back to window.print', e);
            window.print();
          } finally {
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
              URL.revokeObjectURL(blobUrl);
            }, 3000);
          }
        }, 200);
      };
    } catch (err) {
      console.error('Vector PDF print generation error, falling back:', err);
      window.print();
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200 print-modal-wrapper">
      <div className="bg-slate-100 dark:bg-slate-900 rounded-3xl w-full max-w-6xl h-[92vh] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 print-modal-content">
        
        {/* Top Header Bar - Hidden during printing */}
        <div className="flex items-center justify-between p-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xs z-10 shrink-0 no-print print-modal-header">
          <div className="flex items-center gap-3">
            <div className="bg-[#0B5FFF]/10 dark:bg-blue-950/60 p-2.5 rounded-2xl text-[#0B5FFF] dark:text-blue-400">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Activities Report & Print Preview
                </h2>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 font-bold text-[10px]">
                  {filteredActivities.length} Activities
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate high-resolution vector PDF reports with live preview and configuration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="hidden sm:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Eye className="h-3.5 w-3.5" /> Live Preview
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'config'
                    ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Settings2 className="h-3.5 w-3.5" /> Configure
              </button>
            </div>

            <Button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="gap-2 bg-[#0B5FFF] hover:bg-blue-600 text-white font-bold text-xs h-9 rounded-xl shadow-xs"
            >
              <Download className="h-4 w-4" />
              <span>{isGenerating ? 'Generating...' : 'Download / Share PDF'}</span>
            </Button>

            <Button
              onClick={handlePrint}
              disabled={isGenerating}
              variant="outline"
              className="hidden md:flex gap-1.5 text-xs h-9 rounded-xl border-slate-200 dark:border-slate-700 font-semibold"
            >
              <Printer className="h-4 w-4" /> Print
            </Button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              title="Close Preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden print-modal-body">
          
          {/* Left Sidebar: Template & Controls Config (Hidden during print) */}
          <div className={`w-full md:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 sm:p-5 overflow-y-auto space-y-5 no-print ${activeTab === 'config' ? 'block' : 'hidden md:block'}`}>
            
            {/* Report Template Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-[#0B5FFF]" /> Report Template
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'executive', name: 'Executive Master Summary', desc: 'KPI cards, schedule progress & master overview' },
                  { id: 'detailed', name: 'Detailed Engineering Dossier', desc: 'Subtasks, hold points, method statement & notes' },
                  { id: 'workstream', name: 'Workstream Progress Matrix', desc: 'Multi-discipline cross-functional scope tracking' },
                  { id: 'briefing', name: 'Daily Shift Briefing Sheet', desc: 'Target deliverables & authorization sign-off' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id as ReportTemplateType)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedTemplate === t.id
                        ? 'border-[#0B5FFF] bg-blue-50/60 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>{t.name}</span>
                      {selectedTemplate === t.id && <Check className="h-3.5 w-3.5 text-[#0B5FFF]" />}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Scope & Discipline Filters */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-slate-500" /> Filter In Scope
              </label>
              
              <div>
                <label className="text-[11px] font-semibold text-slate-500">Status</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="all">All Statuses ({activities.length})</option>
                  <option value="In Progress">In Progress ({activities.filter(a => a.status === 'In Progress').length})</option>
                  <option value="Completed">Completed ({activities.filter(a => a.status === 'Completed').length})</option>
                  <option value="Blocked">Blocked / Delayed ({activities.filter(a => a.status === 'Blocked' || a.status === 'Waiting').length})</option>
                  <option value="Not Started">Not Started ({activities.filter(a => a.status === 'Not Started' || a.status === 'Ready').length})</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500">Discipline</label>
                <select
                  value={disciplineFilter}
                  onChange={e => setDisciplineFilter(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="all">All Disciplines</option>
                  {uniqueDisciplines.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Content Toggles */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Include Sections
              </label>
              
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeKpiSummary}
                  onChange={e => setIncludeKpiSummary(e.target.checked)}
                  className="rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF]"
                />
                <span>Executive KPI Cards Summary</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSubtasks}
                  onChange={e => setIncludeSubtasks(e.target.checked)}
                  className="rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF]"
                />
                <span>Subtask Deliverables & QA Hold Points</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSignoff}
                  onChange={e => setIncludeSignoff(e.target.checked)}
                  className="rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF]"
                />
                <span>Official Verification & Sign-Off Block</span>
              </label>
            </div>

            {/* Custom Metadata */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="text-[11px] font-semibold text-slate-500">Report Header Title</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={e => setReportTitle(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500">Prepared By</label>
                <input
                  type="text"
                  value={preparedBy}
                  onChange={e => setPreparedBy(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Right Main Area: Live Document Visual Preview */}
          <div className={`flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto bg-slate-200/70 dark:bg-slate-950 flex justify-center items-start ${activeTab === 'preview' ? 'block' : 'hidden md:block'}`}>
            <div 
              ref={printRef}
              className="bg-white text-slate-900 rounded-xl shadow-xl w-full max-w-4xl p-6 sm:p-8 space-y-6 border border-slate-200/80 min-h-[700px] print-content-container"
            >
              
              {/* Document Branded Header Bar */}
              <div className="border-b-2 border-[#0B5FFF] pb-4 flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#0B5FFF] text-white px-2 py-0.5 rounded font-black text-[10px] tracking-wider uppercase">
                      CONSTRUCTFIELD
                    </span>
                    <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                      {reportTitle}
                    </h1>
                  </div>
                  <p className="text-xs text-slate-600">
                    Project: <strong className="text-slate-900">{currentProject?.name || 'Main Site'}</strong> &nbsp;|&nbsp; Location: <strong className="text-slate-900">{currentProject?.location || 'Standerton'}</strong> &nbsp;|&nbsp; Scope: <strong className="text-slate-900">{reportSubtitle}</strong>
                  </p>
                </div>
                <div className="text-right text-[11px] text-slate-500 shrink-0">
                  <div className="font-bold text-slate-700">{currentDateFormatted}</div>
                  <div className="text-[10px] text-slate-400 font-mono">CF-ACT-MASTER</div>
                </div>
              </div>

              {/* KPI Summary Grid (if enabled) */}
              {includeKpiSummary && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                    <div className="text-[9px] font-bold text-slate-500 uppercase">Total Tasks</div>
                    <div className="text-base font-black text-[#0B5FFF]">{totalCount}</div>
                  </div>
                  <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 text-center">
                    <div className="text-[9px] font-bold text-blue-600 uppercase">In Progress</div>
                    <div className="text-base font-black text-blue-700">{inProgressCount}</div>
                  </div>
                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 text-center">
                    <div className="text-[9px] font-bold text-emerald-600 uppercase">Completed</div>
                    <div className="text-base font-black text-emerald-700">{completedCount}</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                    <div className="text-[9px] font-bold text-slate-500 uppercase">Blocked</div>
                    <div className={`text-base font-black ${blockedCount > 0 ? 'text-rose-600' : 'text-slate-600'}`}>{blockedCount}</div>
                  </div>
                  <div className="bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100 text-center">
                    <div className="text-[9px] font-bold text-indigo-600 uppercase">Avg. Progress</div>
                    <div className="text-base font-black text-indigo-700">{avgProgress}%</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                    <div className="text-[9px] font-bold text-slate-500 uppercase">Actual Hours</div>
                    <div className="text-base font-black text-slate-900">{totalActualHours}h</div>
                  </div>
                </div>
              )}

              {/* Activities Preview Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-600 font-bold text-[10px] uppercase border-b border-slate-200">
                      <th className="p-2.5 w-16">ID</th>
                      <th className="p-2.5">Activity Scope & Deliverables</th>
                      <th className="p-2.5 w-24">Discipline</th>
                      <th className="p-2.5 w-20">Priority</th>
                      <th className="p-2.5 w-24">Qty / Target</th>
                      <th className="p-2.5 w-24">Status</th>
                      <th className="p-2.5 w-24">Start Date</th>
                      <th className="p-2.5 w-20 text-right">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredActivities.slice(0, 15).map((act, index) => (
                      <tr key={act.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                        <td className="p-2.5 font-mono font-bold text-[11px] text-slate-700 align-top">{act.id}</td>
                        <td className="p-2.5 align-top">
                          <div className="font-bold text-slate-900 text-xs">{act.name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 flex flex-wrap gap-x-2">
                            {act.area && <span>Area: <strong className="text-slate-700">{act.area}</strong></span>}
                            {act.workPackage && <span>• Pkg: <strong className="text-slate-700">{act.workPackage}</strong></span>}
                            {act.sectionSpan && <span>• Span: <strong className="text-slate-700">{act.sectionSpan}</strong></span>}
                          </div>
                          {includeSubtasks && selectedTemplate === 'detailed' && act.subtasks && act.subtasks.length > 0 && (
                            <div className="mt-2 pl-2.5 border-l-2 border-blue-300 space-y-1 text-[10px] text-slate-600">
                              {act.subtasks.slice(0, 4).map(st => (
                                <div key={st.id} className="flex items-center gap-1.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${st.status === 'Completed' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                                  <span className="font-medium">{st.title}</span>
                                  {st.isHoldPoint && <span className="text-[8px] bg-rose-100 text-rose-700 px-1 py-0.2 rounded font-bold">QA HOLD</span>}
                                </div>
                              ))}
                              {act.subtasks.length > 4 && (
                                <div className="text-[9px] text-slate-400 italic">+{act.subtasks.length - 4} more subtasks</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 align-top">
                          <span className="bg-sky-50 text-sky-700 border border-sky-100 px-1.5 py-0.5 rounded font-semibold text-[10px]">
                            {act.discipline || 'Civil'}
                          </span>
                        </td>
                        <td className="p-2.5 text-[11px] font-medium text-slate-700 align-top">{act.priority || 'Medium'}</td>
                        <td className="p-2.5 text-[11px] font-semibold text-slate-700 align-top">
                          {act.actualQuantity ?? 0} / {act.targetQuantity ?? 0} {act.unit || ''}
                        </td>
                        <td className="p-2.5 align-top">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                            act.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                            act.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            act.status === 'Blocked' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {act.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-[11px] text-slate-600 font-mono align-top">{act.startDate || '—'}</td>
                        <td className="p-2.5 text-right font-black text-xs text-slate-900 align-top">
                          <div>{act.progress || 0}%</div>
                          <div className="w-12 ml-auto mt-1 bg-slate-200 rounded-full h-1 overflow-hidden">
                            <div className="bg-[#0B5FFF] h-full" style={{ width: `${act.progress || 0}%` }}></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredActivities.length > 15 && (
                <div className="text-center py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
                  Showing first 15 of {filteredActivities.length} items in preview. All {filteredActivities.length} activities will be rendered across pages in the exported PDF.
                </div>
              )}

              {/* Sign-off Signature Preview Block */}
              {includeSignoff && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Site Management Verification & Execution Sign-Off
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    I confirm that the recorded activity states, physical deliverables, and progress milestones represented in this report reflect the authentic site situation.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-bold text-slate-800">
                    <div>Authorized Signature: ___________________________ ({preparedBy})</div>
                    <div>QA/QC Verification: ___________________________</div>
                    <div className="sm:text-right">Date: {currentDateFormatted}</div>
                  </div>
                </div>
              )}

              {/* Running Footer */}
              <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-[10px] text-slate-400">
                <div>Constructfield Enterprise Field Operations • Official Document Record • Confidential</div>
                <div>Page 1 of 1 (Live Preview)</div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
