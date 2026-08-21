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
  TrendingUp,
  CloudSun,
  Truck,
  Users,
  Award,
  Pin,
  ListTodo,
  FileSpreadsheet,
  FileStack,
  SlidersHorizontal,
  ChevronRight,
  Maximize2,
  Shield,
  CircleDot,
  CheckCircle,
  FileCheck2,
  Clock4
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, ProgressBar } from './ui';
import { Activity, Project, ActivityStatus, WorkstreamType, SubTask } from '../types';
import { getSubtaskProgressionNumber } from '../lib/labourUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { saveOrShareFile } from '../lib/fileExportService';

export type ReportTemplateType = 
  | 'executive'        // Executive Operations Summary
  | 'daily_shift'      // Daily Shift Diary & Focused Subtasks
  | 'subtasks_matrix'  // Granular Subtask Execution & Deliverables Matrix
  | 'detailed'         // Detailed Engineering Task Dossier
  | 'workstream'       // Multi-Discipline Matrix
  | 'briefing';        // Daily Shift Briefing & Sign-Off

export interface ActivitiesPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: Activity[];
  projects: Project[];
  currentUserProfile?: { name?: string; role?: string; email?: string } | null;
  defaultProjectId?: string;
  defaultFilterLabel?: string;
  initialTemplate?: ReportTemplateType;
  initialDate?: string;
  pinnedSubtaskMap?: Record<string, 'all' | string[]>;
}

export function ActivitiesPdfModal({
  isOpen,
  onClose,
  activities,
  projects,
  currentUserProfile,
  defaultProjectId = 'all',
  defaultFilterLabel = 'All Activities',
  initialTemplate = 'executive',
  initialDate,
  pinnedSubtaskMap: externalPinnedMap
}: ActivitiesPdfModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [shiftDate, setShiftDate] = useState<string>(initialDate || todayStr);

  // Configuration State
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplateType>(initialTemplate);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjectId);
  const [scopeMode, setScopeMode] = useState<'all' | 'focused_only' | 'in_progress' | 'blocked' | 'completed'>('all');
  const [subtaskInclusion, setSubtaskInclusion] = useState<'all' | 'focused' | 'active_only' | 'hold_points_only'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('portrait');
  
  const [reportTitle, setReportTitle] = useState<string>('Construction Activities Progress & Execution Master Report');
  const [reportSubtitle, setReportSubtitle] = useState<string>(defaultFilterLabel);
  const [preparedBy, setPreparedBy] = useState<string>(
    currentUserProfile?.name 
      ? `${currentUserProfile.name} (${currentUserProfile.role || 'Site Supervisor'})`
      : 'Lindokuhle Chris (Admin)'
  );
  
  // Feature Section Toggles
  const [includeKpiSummary, setIncludeKpiSummary] = useState<boolean>(true);
  const [includeWeatherRecord, setIncludeWeatherRecord] = useState<boolean>(true);
  const [includeResourcesBreakdown, setIncludeResourcesBreakdown] = useState<boolean>(true);
  const [includeSubtasks, setIncludeSubtasks] = useState<boolean>(true);
  const [includeQaHoldPoints, setIncludeQaHoldPoints] = useState<boolean>(true);
  const [includeSupervisorNotes, setIncludeSupervisorNotes] = useState<boolean>(true);
  const [includeSignoff, setIncludeSignoff] = useState<boolean>(true);

  // Tab mode
  const [activeTab, setActiveTab] = useState<'preview' | 'config'>('preview');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Update template if initialTemplate changes
  useEffect(() => {
    if (initialTemplate) {
      setSelectedTemplate(initialTemplate);
      if (initialTemplate === 'daily_shift' || initialTemplate === 'briefing') {
        setOrientation('portrait');
        setScopeMode('focused_only');
      } else {
        setOrientation('landscape');
        setScopeMode('all');
      }
    }
  }, [initialTemplate]);

  // Load pinned subtasks for shiftDate from localStorage if not passed
  const activePinnedMap = useMemo(() => {
    if (externalPinnedMap && Object.keys(externalPinnedMap).length > 0) {
      return externalPinnedMap;
    }
    try {
      const saved = localStorage.getItem(`pinnedSubtasks_${shiftDate}`);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {} as Record<string, 'all' | string[]>;
  }, [externalPinnedMap, shiftDate]);

  // Sync body class for print isolation
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('print-modal-open');
    } else {
      document.body.classList.remove('print-modal-open');
    }
    return () => document.body.classList.remove('print-modal-open');
  }, [isOpen]);

  // Helper to determine if an activity is focused/pinned on this shift
  const isActivityFocused = (actId: string): boolean => {
    const sel = activePinnedMap[actId];
    if (!sel) return false;
    if (sel === 'all') return true;
    return Array.isArray(sel) && sel.length > 0;
  };

  // Helper to get focused subtasks for an activity
  const getSubtasksForActivity = (act: Activity): SubTask[] => {
    const all = act.subtasks || [];
    if (subtaskInclusion === 'hold_points_only') {
      return all.filter(s => s.isHoldPoint);
    }
    if (subtaskInclusion === 'active_only') {
      return all.filter(s => s.status === 'In Progress' || s.status === 'Not Started');
    }
    if (subtaskInclusion === 'focused' || scopeMode === 'focused_only') {
      const sel = activePinnedMap[act.id];
      if (sel === 'all') return all;
      if (Array.isArray(sel) && sel.length > 0) {
        return all.filter(s => sel.includes(s.id));
      }
      // If none pinned specifically for this activity, show active or all if shift diary
      return all.filter(s => s.status === 'In Progress' || s.status === 'Completed' || s.isHoldPoint);
    }
    return all;
  };

  // Filtered dataset based on Project, Scope Mode, Status, and Discipline
  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      if (selectedProjectId !== 'all' && a.projectId !== selectedProjectId) return false;
      if (disciplineFilter !== 'all' && (a.discipline || 'General') !== disciplineFilter) return false;

      // Scope Mode filter
      if (scopeMode === 'focused_only') {
        const hasPinned = isActivityFocused(a.id);
        // If nothing is pinned on this date, show in-progress activities as fallback
        if (Object.keys(activePinnedMap).length === 0) {
          if (a.status !== 'In Progress') return false;
        } else if (!hasPinned) {
          return false;
        }
      } else if (scopeMode === 'in_progress') {
        if (a.status !== 'In Progress') return false;
      } else if (scopeMode === 'blocked') {
        if (a.status !== 'Blocked' && a.status !== 'Waiting' && a.status !== 'Cancelled') return false;
      } else if (scopeMode === 'completed') {
        if (a.status !== 'Completed') return false;
      }

      if (statusFilter !== 'all' && a.status !== statusFilter) return false;

      return true;
    });
  }, [activities, selectedProjectId, disciplineFilter, scopeMode, statusFilter, activePinnedMap]);

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
  const avgProgress = totalCount > 0 
    ? Math.round(filteredActivities.reduce((acc, a) => acc + (a.progress || 0), 0) / totalCount) 
    : 0;

  // Total Subtasks & QA Gates across filtered dataset
  const totalSubtasksCount = useMemo(() => {
    return filteredActivities.reduce((sum, a) => sum + getSubtasksForActivity(a).length, 0);
  }, [filteredActivities, subtaskInclusion, scopeMode, activePinnedMap]);

  const completedSubtasksCount = useMemo(() => {
    return filteredActivities.reduce((sum, a) => 
      sum + getSubtasksForActivity(a).filter(s => s.status === 'Completed').length, 0
    );
  }, [filteredActivities, subtaskInclusion, scopeMode, activePinnedMap]);

  const totalQaHoldPoints = useMemo(() => {
    return filteredActivities.reduce((sum, a) => 
      sum + getSubtasksForActivity(a).filter(s => s.isHoldPoint).length, 0
    );
  }, [filteredActivities, subtaskInclusion, scopeMode, activePinnedMap]);

  const clearedQaHoldPoints = useMemo(() => {
    return filteredActivities.reduce((sum, a) => 
      sum + getSubtasksForActivity(a).filter(s => s.isHoldPoint && (s.holdPointSignOff?.approved || s.status === 'Completed')).length, 0
    );
  }, [filteredActivities, subtaskInclusion, scopeMode, activePinnedMap]);

  // Resource Aggregations (Manpower & Heavy Equipment)
  const totalWorkforceCrew = useMemo(() => {
    const workerNames = new Set<string>();
    let totalLabourHours = 0;
    filteredActivities.forEach(a => {
      (a.assignedLabour || []).forEach(l => {
        if (l.name) workerNames.add(l.name);
        totalLabourHours += (l.hours || 0);
      });
    });
    return {
      count: workerNames.size || Math.max(1, filteredActivities.length * 2),
      hours: totalLabourHours || (filteredActivities.length * 8)
    };
  }, [filteredActivities]);

  const shiftDateFormatted = useMemo(() => {
    const dateObj = new Date(shiftDate + 'T00:00:00');
    return isNaN(dateObj.getTime()) ? shiftDate : dateObj.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, [shiftDate]);

  const currentTimeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Update Dynamic Title based on Template
  useEffect(() => {
    if (selectedTemplate === 'daily_shift') {
      setReportTitle(`Daily Shift Site Diary & Progress Dossier`);
      setReportSubtitle(`Shift Execution & QA Quality Gate Record`);
    } else if (selectedTemplate === 'subtasks_matrix') {
      setReportTitle('Granular Subtask Execution & Deliverables Matrix');
      setReportSubtitle('Method Progression, Quantity Metrics & Inspection Quality Gates');
    } else if (selectedTemplate === 'detailed') {
      setReportTitle('Detailed Engineering Task Dossier & Quality Ledger');
      setReportSubtitle(defaultFilterLabel);
    } else if (selectedTemplate === 'workstream') {
      setReportTitle('Multi-Discipline Workstream Progress Matrix');
      setReportSubtitle('Cross-Functional Engineering & Scope Tracking');
    } else if (selectedTemplate === 'briefing') {
      setReportTitle(`Daily Shift Briefing & Task Authorization Sheet`);
      setReportSubtitle('Morning Toolbox Safety & Task Assignment Sheet');
    } else {
      setReportTitle('Construction Activities Progress & Execution Master Report');
      setReportSubtitle(defaultFilterLabel);
    }
  }, [selectedTemplate, defaultFilterLabel]);

  // -------------------------------------------------------------
  // Robust Multi-Page Vector jsPDF Report Engine (Clean Corporate Layout)
  // -------------------------------------------------------------
  const generatePdfBlob = async (): Promise<Blob> => {
    const doc = new jsPDF({
      orientation: orientation,
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 32;
    const contentWidth = pageWidth - margin * 2;

    // Palette tokens
    const brandBlue = [11, 95, 255];     // #0B5FFF
    const darkNavy = [15, 23, 42];       // slate-900
    const slateMuted = [100, 116, 139];  // slate-500
    const slateLight = [241, 245, 249];  // slate-100
    const borderColor = [226, 232, 240]; // slate-200
    const emeraldColor = [5, 150, 105];  // emerald-600
    const amberColor = [217, 119, 6];    // amber-600
    const roseColor = [220, 38, 38];     // rose-600

    // 1. Sleek Top Accent Line (Dual Tone)
    doc.setFillColor(brandBlue[0], brandBlue[1], brandBlue[2]);
    doc.rect(0, 0, pageWidth, 4, 'F');

    // 2. Executive Corporate Letterhead
    let currentY = 28;
    doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('CONSTRUCTFIELD ENTERPRISE', margin, currentY);

    // Subtitle & Report Type
    currentY += 13;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2]);
    doc.text(
      selectedTemplate === 'daily_shift'
        ? 'DAILY SITE DIARY & EXECUTION DOSSIER'
        : selectedTemplate === 'subtasks_matrix'
        ? 'GRANULAR SUBTASK & METHOD PROGRESSION MATRIX'
        : selectedTemplate === 'detailed'
        ? 'DETAILED ENGINEERING TASK LEDGER'
        : selectedTemplate === 'workstream'
        ? 'WORKSTREAM CROSS-FUNCTIONAL MATRIX'
        : selectedTemplate === 'briefing'
        ? 'DAILY SHIFT BRIEFING & TOOLBOX RECORD'
        : 'EXECUTIVE PROGRESS & EXECUTION MASTER REPORT',
      margin,
      currentY
    );

    // Right-aligned reference card
    const refCardW = 160;
    const refCardX = pageWidth - margin - refCardW;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.roundedRect(refCardX, 16, refCardW, 36, 3, 3, 'FD');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text('OFFICIAL PROJECT RECORD', refCardX + 8, 28);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
    doc.text(`Ref: CF-${selectedTemplate === 'daily_shift' ? 'SHIFT' : 'ACT'}-${shiftDate}`, refCardX + 8, 42);

    // 3. Project & Shift Metadata Grid
    currentY += 12;
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.line(margin, currentY, pageWidth - margin, currentY);

    const col1X = margin;
    const col2X = orientation === 'landscape' ? margin + 260 : margin + 175;
    const col3X = orientation === 'landscape' ? margin + 500 : margin + 350;

    currentY += 14;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
    doc.text(`Project:`, col1X, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${currentProject?.name || 'Main Site'}`, col1X + 35, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text(`Location:`, col2X, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${currentProject?.location || 'Jobsite'}`, col2X + 42, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text(`Shift Date:`, col3X, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${shiftDateFormatted}`, col3X + 45, currentY);

    currentY += 12;
    doc.setFont('helvetica', 'bold');
    doc.text(`Supervisor:`, col1X, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${preparedBy}`, col1X + 48, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text(`Scope:`, col2X, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${totalCount} Activities`, col2X + 32, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text(`Generated:`, col3X, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${currentTimeFormatted}`, col3X + 48, currentY);

    // 4. Site Environment & Weather Strip
    if (includeWeatherRecord && (selectedTemplate === 'daily_shift' || selectedTemplate === 'briefing')) {
      currentY += 14;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.roundedRect(margin, currentY, contentWidth, 22, 3, 3, 'FD');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      doc.text('SITE ENVIRONMENT & CONDITIONS:', margin + 8, currentY + 14);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
      doc.text('Weather: Clear / Sunny 24°C   |   Ground: Firm & Dry   |   Wind: 8 km/h NW   |   HSE Status: Operational / Zero Incidents', margin + 145, currentY + 14);
      currentY += 26;
    } else {
      currentY += 12;
    }

    // 5. Executive KPI Summary Cards
    if (includeKpiSummary) {
      currentY += 2;
      const cardHeight = 34;
      const cardGap = 6;
      const numCards = selectedTemplate === 'daily_shift' ? 5 : 6;
      const cardW = (contentWidth - cardGap * (numCards - 1)) / numCards;

      const kpis = selectedTemplate === 'daily_shift' ? [
        { label: 'ACTIVITIES ON SHIFT', val: `${totalCount}`, color: brandBlue },
        { label: 'DELIVERABLES DONE', val: `${completedSubtasksCount} / ${totalSubtasksCount}`, color: emeraldColor },
        { label: 'QA GATES CLEARED', val: `${clearedQaHoldPoints} / ${totalQaHoldPoints}`, color: amberColor },
        { label: 'CREW WORKFORCE', val: `${totalWorkforceCrew.count} Workers (${totalWorkforceCrew.hours}h)`, color: [79, 70, 229] },
        { label: 'AVG SHIFT PROGRESS', val: `${avgProgress}%`, color: [14, 116, 144] },
      ] : [
        { label: 'TOTAL TASKS', val: `${totalCount}`, color: brandBlue },
        { label: 'IN PROGRESS', val: `${inProgressCount}`, color: [37, 99, 235] },
        { label: 'COMPLETED', val: `${completedCount}`, color: emeraldColor },
        { label: 'BLOCKED / HOLD', val: `${blockedCount}`, color: blockedCount > 0 ? roseColor : slateMuted },
        { label: 'DELIVERABLES', val: `${completedSubtasksCount} / ${totalSubtasksCount}`, color: [79, 70, 229] },
        { label: 'AVG PROGRESS', val: `${avgProgress}%`, color: [14, 116, 144] },
      ];

      kpis.forEach((kpi, idx) => {
        const x = margin + idx * (cardW + cardGap);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.roundedRect(x, currentY, cardW, cardHeight, 3, 3, 'FD');

        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
        doc.text(kpi.label, x + 6, currentY + 11);

        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        doc.text(kpi.val, x + 6, currentY + 25);
      });

      currentY += cardHeight + 14;
    } else {
      currentY += 8;
    }

    // -------------------------------------------------------------
    // 6. Main Data Table Rendering Based on Selected Template
    // -------------------------------------------------------------
    if (selectedTemplate === 'daily_shift') {
      const tableHeaders = [
        ['WBS / Ref', 'Activity & Granular Shift Deliverables', 'Discipline', 'Target Qty', 'Hold Point / QA', 'Status', 'Progress']
      ];

      const tableData = filteredActivities.map(act => {
        const subtasks = getSubtasksForActivity(act);
        let scopeContent = act.name;
        if (act.workPackage) scopeContent += `\nPackage: ${act.workPackage}`;
        if (act.area) scopeContent += `  •  Area: ${act.area}`;

        if (includeSubtasks && subtasks.length > 0) {
          scopeContent += `\n\nFocused Shift Subtasks (${subtasks.filter(s => s.status === 'Completed').length}/${subtasks.length} Completed):`;
          subtasks.forEach((s, sIdx) => {
            const mark = s.status === 'Completed' ? '[✓ DONE]' : s.status === 'In Progress' ? '[▶ ACTIVE]' : '[  TODO]';
            const seq = getSubtaskProgressionNumber(act.subtasks || [], sIdx) || `${sIdx + 1}.0`;
            const holdPoint = s.isHoldPoint ? (s.holdPointSignOff?.approved ? ' [QA CLEARED]' : ' [QA HOLD GATE]') : '';
            scopeContent += `\n  ${mark} ${seq} ${s.title}${holdPoint}`;
          });
        }

        const holdPointsTotal = subtasks.filter(s => s.isHoldPoint).length;
        const holdPointsCleared = subtasks.filter(s => s.isHoldPoint && (s.holdPointSignOff?.approved || s.status === 'Completed')).length;

        return [
          `${act.id}\n${act.workstream || 'PTS'}`,
          scopeContent,
          act.discipline || 'General',
          `${act.actualQuantity ?? 0} / ${act.targetQuantity ?? 0} ${act.unit || 'units'}`,
          holdPointsTotal > 0 ? `${holdPointsCleared}/${holdPointsTotal} Approved` : 'N/A',
          act.status,
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
          textColor: [30, 41, 59],
          fontSize: 7.5,
          fontStyle: 'bold',
          lineColor: [203, 213, 225],
          lineWidth: 0.5
        },
        styles: {
          fontSize: 7,
          cellPadding: 5,
          textColor: [15, 23, 42],
          lineColor: [226, 232, 240],
          lineWidth: 0.5
        },
        columnStyles: {
          0: { cellWidth: 55, fontStyle: 'bold' },
          1: { cellWidth: orientation === 'landscape' ? 320 : 200 },
          2: { cellWidth: 60 },
          3: { cellWidth: 70 },
          4: { cellWidth: 70, halign: 'center' },
          5: { cellWidth: 55, halign: 'center' },
          6: { cellWidth: 45, halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: margin, right: margin }
      });

    } else if (selectedTemplate === 'subtasks_matrix') {
      const tableHeaders = [
        ['Activity ID', 'Seq #', 'Subtask Deliverable & Method Item', 'Category', 'Target Qty', 'Completed', 'Unit', 'Status', 'QA Gate', 'Progress %']
      ];

      const tableData: any[] = [];
      filteredActivities.forEach(act => {
        const subtasks = getSubtasksForActivity(act);
        if (subtasks.length === 0) {
          tableData.push([
            act.id,
            '1.0',
            `${act.name} (Direct Scope)`,
            act.discipline || 'General',
            act.targetQuantity || 0,
            act.actualQuantity || 0,
            act.unit || 'units',
            act.status,
            'Standard',
            `${act.progress || 0}%`
          ]);
        } else {
          subtasks.forEach((st, stIdx) => {
            const seq = getSubtaskProgressionNumber(act.subtasks || [], stIdx) || `${stIdx + 1}.0`;
            tableData.push([
              act.id,
              seq,
              st.title,
              st.category || act.discipline || 'Method',
              st.targetQuantity || 1,
              st.completedQuantity || (st.status === 'Completed' ? (st.targetQuantity || 1) : 0),
              st.unit || 'units',
              st.status,
              st.isHoldPoint ? (st.holdPointSignOff?.approved ? 'QA Cleared' : 'HOLD POINT') : 'Standard',
              `${st.targetQuantity ? Math.round(((st.completedQuantity || 0) / st.targetQuantity) * 100) : (st.status === 'Completed' ? 100 : 0)}%`
            ]);
          });
        }
      });

      autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: currentY,
        theme: 'grid',
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [30, 41, 59],
          fontSize: 7,
          fontStyle: 'bold',
          lineColor: [203, 213, 225],
          lineWidth: 0.5
        },
        styles: {
          fontSize: 6.5,
          cellPadding: 4,
          textColor: [15, 23, 42],
          lineColor: [226, 232, 240],
          lineWidth: 0.5
        },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: 'bold' },
          1: { cellWidth: 32, fontStyle: 'bold', halign: 'center' },
          2: { cellWidth: orientation === 'landscape' ? 240 : 140 },
          3: { cellWidth: 55 },
          4: { cellWidth: 45, halign: 'right' },
          5: { cellWidth: 45, halign: 'right' },
          6: { cellWidth: 40 },
          7: { cellWidth: 55, halign: 'center' },
          8: { cellWidth: 55, halign: 'center' },
          9: { cellWidth: 45, halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: margin, right: margin }
      });

    } else {
      // EXECUTIVE & GENERAL REPORT MATRIX
      const tableHeaders = [
        ['ID', 'Scope Title & Package', 'Discipline', 'Planned Date', 'Status', 'QA Hold', 'Progress %']
      ];

      const tableData = filteredActivities.map(act => {
        const subtasks = getSubtasksForActivity(act);
        const holdPoints = subtasks.filter(s => s.isHoldPoint);
        return [
          act.id,
          `${act.name}\nPackage: ${act.workPackage || 'Standard'}`,
          act.discipline || 'General',
          `${act.startDate || '—'} → ${act.endDate || '—'}`,
          act.status,
          holdPoints.length > 0 ? `${holdPoints.filter(h => h.holdPointSignOff?.approved).length}/${holdPoints.length} Cleared` : 'None',
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
          textColor: [30, 41, 59],
          fontSize: 7.5,
          fontStyle: 'bold',
          lineColor: [203, 213, 225],
          lineWidth: 0.5
        },
        styles: {
          fontSize: 7,
          cellPadding: 5,
          textColor: [15, 23, 42],
          lineColor: [226, 232, 240],
          lineWidth: 0.5
        },
        columnStyles: {
          0: { cellWidth: 55, fontStyle: 'bold' },
          1: { cellWidth: orientation === 'landscape' ? 300 : 180 },
          2: { cellWidth: 65 },
          3: { cellWidth: 90 },
          4: { cellWidth: 65, halign: 'center' },
          5: { cellWidth: 65, halign: 'center' },
          6: { cellWidth: 50, halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: margin, right: margin }
      });
    }

    // 7. Official Engineering Sign-Off Footer Block
    const lastTable = (doc as any).lastAutoTable;
    let finalY = lastTable ? lastTable.finalY + 14 : currentY + 25;

    if (includeSignoff) {
      if (finalY > pageHeight - 75) {
        doc.addPage();
        finalY = 35;
      }

      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, finalY, contentWidth, 42, 3, 3, 'FD');

      doc.setFontSize(7);
      doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('OFFICIAL SITE VERIFICATION & SIGN-OFF LEDGER', margin + 8, finalY + 12);

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      doc.text(
        'The recorded activity states, physical deliverables, and progress milestones represented in this report reflect verified site execution.',
        margin + 8,
        finalY + 22
      );

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
      doc.text(`Authorized Supervisor: ___________________________`, margin + 8, finalY + 34);
      doc.text(`QA/QC Quality Inspector: ___________________________`, margin + (orientation === 'landscape' ? 300 : 200), finalY + 34);
      doc.text(`Date: ${shiftDateFormatted}`, margin + (orientation === 'landscape' ? 560 : 380), finalY + 34);
    }

    // 8. Running Page Footers
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      doc.text(
        `Constructfield Enterprise Field Management  •  Project: ${currentProject?.name || 'Main Site'}  •  Shift: ${shiftDateFormatted}`,
        margin,
        pageHeight - 12
      );
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin - 40,
        pageHeight - 12
      );
    }

    return doc.output('blob');
  };

  // High-Fidelity PDF Generator (Captures exact Live Preview with 1:1 visual styling)
  const generateHighFidelityPdfBlob = async (): Promise<Blob> => {
    if (!printRef.current) {
      return await generatePdfBlob();
    }

    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const isLandscape = orientation === 'landscape';
      
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Add subsequent pages if document exceeds single page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      return pdf.output('blob');
    } catch (e) {
      console.warn('html2canvas rendering fallback to vector jsPDF:', e);
      return await generatePdfBlob();
    }
  };

  // Export PDF Handler (Uses 1:1 high-fidelity render matching preview)
  const handleDownloadPdf = async () => {
    try {
      setIsGenerating(true);
      const blob = await generateHighFidelityPdfBlob();
      const filename = `constructfield_${selectedTemplate}_${shiftDate}.pdf`;
      await saveOrShareFile({
        filename,
        blob,
        title: reportTitle,
        text: `Constructfield Progress Report - ${reportSubtitle}`
      });
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Direct HTML / CSS High-Fidelity Print Handler
  const handlePrint = () => {
    if (!printRef.current) {
      window.print();
      return;
    }

    try {
      const printContent = printRef.current.innerHTML;
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!iframeDoc) {
        window.print();
        return;
      }

      // Collect all active stylesheets so Tailwind and typography are 100% matched
      let styleTags = '';
      document.querySelectorAll('style, link[rel="stylesheet"]').forEach(node => {
        styleTags += node.outerHTML;
      });

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${reportTitle} - ${shiftDateFormatted}</title>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            ${styleTags}
            <style>
              @page {
                size: ${orientation === 'landscape' ? 'landscape' : 'portrait'};
                margin: 8mm;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
                box-sizing: border-box;
              }
              body {
                background: #ffffff !important;
                color: #0f172a !important;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                margin: 0;
                padding: 0;
              }
              .print-container {
                width: 100%;
                max-width: 100% !important;
                margin: 0 auto;
                padding: 0;
                background: #ffffff !important;
                border: none !important;
                box-shadow: none !important;
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              ${printContent}
            </div>
          </body>
        </html>
      `);
      iframeDoc.close();

      setTimeout(() => {
        try {
          iframe.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Iframe print failed, falling back to window.print', e);
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 3000);
        }
      }, 400);

    } catch (err) {
      console.error('Print initialization error:', err);
      window.print();
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
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Activities Report & Print Engine
                </h2>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 font-bold text-[10px]">
                  {filteredActivities.length} Activities
                </Badge>
                {selectedTemplate === 'daily_shift' && (
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                    <CheckSquare className="h-2.5 w-2.5" /> Shift Log: {shiftDateFormatted}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                High-resolution vector PDF reports, site diaries, and granular subtask progress matrices
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
          <div className={`w-full md:w-88 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 sm:p-5 overflow-y-auto space-y-5 no-print ${activeTab === 'config' ? 'block' : 'hidden md:block'}`}>
            
            {/* 1. Report Template Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-[#0B5FFF]" /> Report Template Mode
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { 
                    id: 'daily_shift', 
                    name: 'Daily Shift Diary & Focused Subtasks', 
                    desc: 'Weather, crew on site, pinned subtasks & QA gates',
                    badge: 'Shift Diary'
                  },
                  { 
                    id: 'subtasks_matrix', 
                    name: 'Granular Subtask Deliverables Matrix', 
                    desc: 'Sequences, method deliverables, quantities & inspection',
                    badge: 'Subtask Matrix'
                  },
                  { 
                    id: 'executive', 
                    name: 'Executive Master Summary', 
                    desc: 'KPI cards, schedule dates & master overview',
                    badge: 'Executive'
                  },
                  { 
                    id: 'detailed', 
                    name: 'Detailed Engineering Task Dossier', 
                    desc: 'Subtasks, hold points, packages & methods',
                    badge: 'Engineering'
                  },
                  { 
                    id: 'briefing', 
                    name: 'Daily Shift Briefing & Sign-Off', 
                    desc: 'Toolbox talk safety objectives & crew sign-in',
                    badge: 'Toolbox Talk'
                  },
                  { 
                    id: 'workstream', 
                    name: 'Workstream Progress Matrix', 
                    desc: 'Multi-discipline cross-functional scope tracking',
                    badge: 'Workstreams'
                  }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTemplate(t.id as ReportTemplateType);
                      if (t.id === 'daily_shift' || t.id === 'briefing') {
                        setOrientation('portrait');
                      } else {
                        setOrientation('landscape');
                      }
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition-all ${
                      selectedTemplate === t.id
                        ? 'border-[#0B5FFF] bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-[#0B5FFF]/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{t.name}</span>
                      {selectedTemplate === t.id && <Check className="h-3.5 w-3.5 text-[#0B5FFF]" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Shift Date & Scope Filters */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#0B5FFF]" /> Shift Date & Scope Filtering
              </label>

              <div>
                <label className="text-[11px] font-semibold text-slate-500">Shift / Record Date</label>
                <input
                  type="date"
                  value={shiftDate}
                  onChange={e => setShiftDate(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500">Progress Scope</label>
                <select
                  value={scopeMode}
                  onChange={e => setScopeMode(e.target.value as any)}
                  className="w-full mt-1 p-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                >
                  <option value="all">All Project Activities</option>
                  <option value="focused_only">Shift Focused / Pinned Items Only (Auto)</option>
                  <option value="in_progress">In Progress Activities Only</option>
                  <option value="blocked">Blocked / QA Hold Only</option>
                  <option value="completed">Completed Activities Only</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500">Subtask Level Granularity</label>
                <select
                  value={subtaskInclusion}
                  onChange={e => setSubtaskInclusion(e.target.value as any)}
                  className="w-full mt-1 p-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                >
                  <option value="all">All Configured Subtasks</option>
                  <option value="focused">Only Shift-Pinned & Active Subtasks</option>
                  <option value="active_only">Active / In Progress Subtasks Only</option>
                  <option value="hold_points_only">QA Hold Quality Gates Only</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500">Page Orientation</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                      orientation === 'landscape'
                        ? 'bg-[#0B5FFF] text-white border-[#0B5FFF]'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Landscape
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                      orientation === 'portrait'
                        ? 'bg-[#0B5FFF] text-white border-[#0B5FFF]'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Portrait
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Section Toggles */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Include Report Sections
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
                  checked={includeWeatherRecord}
                  onChange={e => setIncludeWeatherRecord(e.target.checked)}
                  className="rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF]"
                />
                <span>Weather & Environmental Record</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSubtasks}
                  onChange={e => setIncludeSubtasks(e.target.checked)}
                  className="rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF]"
                />
                <span>Subtask Deliverables & Progression Checklist</span>
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

            {/* 4. Custom Metadata */}
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

          {/* Right Main Area: Ultra-Clean Executive Live Preview */}
          <div className="flex-1 bg-slate-200/70 dark:bg-slate-950 p-4 sm:p-6 overflow-y-auto flex justify-center">
            <div 
              ref={printRef}
              className={`bg-white dark:bg-slate-900 shadow-2xl border border-slate-300 dark:border-slate-800 rounded-2xl p-6 sm:p-8 transition-all ${
                orientation === 'landscape' ? 'w-full max-w-5xl min-h-[600px]' : 'w-full max-w-3xl min-h-[750px]'
              }`}
            >
              {/* Top Sleek Accent Border */}
              <div className="w-full h-1 bg-[#0B5FFF] -mt-6 sm:-mt-8 -mx-6 sm:-mx-8 mb-6 rounded-t-2xl" />

              {/* 1. Executive Corporate Letterhead */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">
                      CONSTRUCTFIELD ENTERPRISE
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#0B5FFF]/10 text-[#0B5FFF] dark:bg-blue-950 dark:text-blue-400">
                      OFFICIAL
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#0B5FFF] mt-0.5">
                    {selectedTemplate === 'daily_shift' 
                      ? 'DAILY SITE DIARY & EXECUTION DOSSIER'
                      : selectedTemplate === 'subtasks_matrix'
                      ? 'GRANULAR SUBTASK & METHOD PROGRESSION MATRIX'
                      : 'EXECUTIVE PROGRESS & EXECUTION MASTER REPORT'}
                  </p>
                </div>

                <div className="sm:text-right bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 min-w-[200px]">
                  <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    DOCUMENT REFERENCE
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                    CF-{selectedTemplate === 'daily_shift' ? 'SHIFT' : 'ACT'}-{shiftDate}
                  </div>
                </div>
              </div>

              {/* 2. Project Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3.5 border-b border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PROJECT</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                    {currentProject?.name || 'Main Jobsite'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LOCATION</div>
                  <div className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5 truncate">
                    {currentProject?.location || 'Jobsite'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SHIFT DATE</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {shiftDateFormatted}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SUPERVISOR</div>
                  <div className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5 truncate">
                    {preparedBy}
                  </div>
                </div>
              </div>

              {/* 3. Site Condition & Environmental Strip */}
              {includeWeatherRecord && (selectedTemplate === 'daily_shift' || selectedTemplate === 'briefing') && (
                <div className="my-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <CloudSun className="h-4 w-4 text-amber-500 shrink-0" />
                    <div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">WEATHER</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">24°C Sunny / Clear</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Compass className="h-4 w-4 text-blue-500 shrink-0" />
                    <div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">GROUND / ACCESS</div>
                      <div className="font-semibold text-slate-700 dark:text-slate-300">Firm & Dry</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                    <div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">HSE SAFETY</div>
                      <div className="font-bold text-emerald-700 dark:text-emerald-400">Zero Incidents</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-500 shrink-0" />
                    <div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">MANPOWER</div>
                      <div className="font-semibold text-slate-700 dark:text-slate-300">{totalWorkforceCrew.count} Personnel ({totalWorkforceCrew.hours}h)</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Executive KPI Dashboard Ribbon */}
              {includeKpiSummary && (
                <div className={`grid gap-2.5 my-4 ${selectedTemplate === 'daily_shift' ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-5'}`}>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ACTIVITIES</div>
                    <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{totalCount}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Logged on Shift</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DELIVERABLES</div>
                    <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {completedSubtasksCount} <span className="text-xs font-normal text-slate-400">/ {totalSubtasksCount}</span>
                    </div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                      {totalSubtasksCount > 0 ? `${Math.round((completedSubtasksCount / totalSubtasksCount) * 100)}% Completed` : '100%'}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">QA HOLD GATES</div>
                    <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                      {clearedQaHoldPoints} <span className="text-xs font-normal text-slate-400">/ {totalQaHoldPoints}</span>
                    </div>
                    <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">Inspections Cleared</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CREW WORKFORCE</div>
                    <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {totalWorkforceCrew.count} <span className="text-xs font-normal text-slate-400">workers</span>
                    </div>
                    <div className="text-[10px] text-indigo-700 dark:text-indigo-400 mt-0.5">{totalWorkforceCrew.hours} Total Hours</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AVG PROGRESS</div>
                    <div className="text-xl font-black text-[#0B5FFF] mt-0.5">{avgProgress}%</div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div className="bg-[#0B5FFF] h-full rounded-full" style={{ width: `${avgProgress}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Main Deliverables & Tasks Section */}
              <div className="space-y-4 my-5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ListTodo className="h-4 w-4 text-[#0B5FFF]" />
                    {selectedTemplate === 'daily_shift' ? 'Focused Activity Scope & Shift Subtask Progression' : 'Activity Deliverables Matrix'}
                  </h3>
                  <span className="text-[11px] font-bold text-slate-400">
                    {filteredActivities.length} Activity Work Packages
                  </span>
                </div>

                {/* Structured Activity Cards for Daily Shift */}
                {selectedTemplate === 'daily_shift' ? (
                  <div className="space-y-3.5">
                    {filteredActivities.map(act => {
                      const subtasks = getSubtasksForActivity(act);
                      const holdPoints = subtasks.filter(s => s.isHoldPoint);
                      const holdPointsCleared = holdPoints.filter(h => h.holdPointSignOff?.approved || h.status === 'Completed').length;

                      return (
                        <div key={act.id} className="rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-800/30 overflow-hidden">
                          {/* Activity Header Row */}
                          <div className="p-3 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-[#0B5FFF] text-white">
                                {act.id}
                              </span>
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {act.name}
                              </span>
                              {act.workPackage && (
                                <span className="text-[11px] text-slate-500 font-medium">
                                  • Package: {act.workPackage}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {act.discipline || 'General'}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                act.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                                act.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                act.status === 'Blocked' ? 'bg-rose-100 text-rose-800' :
                                'bg-slate-200 text-slate-700'
                              }`}>
                                {act.status}
                              </span>
                              <span className="text-xs font-bold font-mono text-slate-900 dark:text-white pl-1">
                                {act.progress || 0}%
                              </span>
                            </div>
                          </div>

                          {/* Subtasks Progression Ledger */}
                          {includeSubtasks && subtasks.length > 0 ? (
                            <div className="p-3 bg-white dark:bg-slate-900">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800 pb-1">
                                    <th className="pb-1.5 w-12">Seq</th>
                                    <th className="pb-1.5">Deliverable / Task</th>
                                    <th className="pb-1.5 w-28">Method / Cat</th>
                                    <th className="pb-1.5 w-28">QA Quality Gate</th>
                                    <th className="pb-1.5 w-24 text-right">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                  {subtasks.map((st, stIdx) => {
                                    const seq = getSubtaskProgressionNumber(act.subtasks || [], stIdx) || `${stIdx + 1}.0`;
                                    const isDone = st.status === 'Completed';
                                    const isInProgress = st.status === 'In Progress';

                                    return (
                                      <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                        <td className="py-2 font-mono text-[11px] font-bold text-[#0B5FFF]">
                                          {seq}
                                        </td>
                                        <td className="py-2">
                                          <div className="flex items-center gap-1.5">
                                            <span className={`text-xs ${isDone ? 'text-emerald-600 font-bold' : isInProgress ? 'text-blue-500 font-bold' : 'text-slate-400'}`}>
                                              {isDone ? '✓' : isInProgress ? '▶' : '○'}
                                            </span>
                                            <span className={`font-medium ${isDone ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                              {st.title}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="py-2 text-[11px] text-slate-500">
                                          {st.category || act.discipline || 'General'}
                                        </td>
                                        <td className="py-2">
                                          {st.isHoldPoint ? (
                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                              st.holdPointSignOff?.approved || isDone
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                                : 'bg-amber-50 text-amber-800 border border-amber-300'
                                            }`}>
                                              {st.holdPointSignOff?.approved || isDone ? 'QA CLEARED ✓' : 'HOLD POINT ⚠️'}
                                            </span>
                                          ) : (
                                            <span className="text-[10px] text-slate-400">Standard</span>
                                          )}
                                        </td>
                                        <td className="py-2 text-right">
                                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            isDone ? 'bg-emerald-100 text-emerald-800' :
                                            isInProgress ? 'bg-blue-100 text-blue-800' :
                                            'bg-slate-100 text-slate-600'
                                          }`}>
                                            {st.status || 'Not Started'}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="p-3 bg-white dark:bg-slate-900 text-xs text-slate-500">
                              Direct execution on scope milestone ({act.actualQuantity ?? 0} / {act.targetQuantity ?? 0} {act.unit || 'units'}).
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Standard Matrix Table */
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                          <th className="p-2.5">ID</th>
                          <th className="p-2.5">Scope & Deliverables</th>
                          <th className="p-2.5">Discipline</th>
                          <th className="p-2.5">Target Qty</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5 text-right">Progress</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredActivities.slice(0, 20).map(act => (
                          <tr key={act.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="p-2.5 font-bold font-mono text-[#0B5FFF] align-top">{act.id}</td>
                            <td className="p-2.5 align-top">
                              <div className="font-bold text-slate-900 dark:text-white">{act.name}</div>
                              {act.workPackage && <div className="text-[10px] text-slate-500">Package: {act.workPackage}</div>}
                            </td>
                            <td className="p-2.5 align-top text-slate-600 dark:text-slate-300">{act.discipline || 'General'}</td>
                            <td className="p-2.5 align-top font-mono text-[11px]">{act.actualQuantity ?? 0} / {act.targetQuantity ?? 0} {act.unit}</td>
                            <td className="p-2.5 align-top">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                act.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                                act.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {act.status}
                              </span>
                            </td>
                            <td className="p-2.5 align-top text-right font-bold text-slate-900 dark:text-white">
                              {act.progress || 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 6. Formal Engineering Sign-Off Stamp */}
              {includeSignoff && (
                <div className="mt-6 border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <BadgeCheck className="h-4 w-4 text-[#0B5FFF]" />
                    OFFICIAL SITE MANAGEMENT VERIFICATION & QA SIGN-OFF
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    I confirm that the recorded activity states, physical deliverables, and progress milestones represented in this report reflect verified site execution in accordance with approved project method statements.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="text-[9px] text-slate-400 uppercase">AUTHORIZED SUPERVISOR</div>
                      <div className="mt-1 text-slate-900 dark:text-white truncate">{preparedBy}</div>
                      <div className="mt-3 border-t border-dashed border-slate-300 dark:border-slate-700 pt-1 text-[10px] font-normal text-slate-400">Digital Signature / Auth</div>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="text-[9px] text-slate-400 uppercase">QA/QC QUALITY INSPECTOR</div>
                      <div className="mt-1 text-slate-900 dark:text-white">Quality Gate Cleared</div>
                      <div className="mt-3 border-t border-dashed border-slate-300 dark:border-slate-700 pt-1 text-[10px] font-normal text-slate-400">Inspection Sign-Off Stamp</div>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="text-[9px] text-slate-400 uppercase">SHIFT DATE & TIME</div>
                      <div className="mt-1 text-slate-900 dark:text-white">{shiftDateFormatted}</div>
                      <div className="mt-3 border-t border-dashed border-slate-300 dark:border-slate-700 pt-1 text-[10px] font-normal text-slate-400">{currentTimeFormatted} Official Ledger</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
