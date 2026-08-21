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
  Maximize2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, ProgressBar } from './ui';
import { Activity, Project, ActivityStatus, WorkstreamType, SubTask } from '../types';
import { getSubtaskProgressionNumber } from '../lib/labourUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveOrShareFile } from '../lib/fileExportService';

export type ReportTemplateType = 
  | 'executive'        // Executive Operations Summary
  | 'daily_shift'      // Daily Shift Diary & Focused Subtasks (NEW)
  | 'subtasks_matrix'  // Granular Subtask Execution & Deliverables Matrix (NEW)
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
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  
  const [reportTitle, setReportTitle] = useState<string>('Construction Activities Progress & Execution Master Report');
  const [reportSubtitle, setReportSubtitle] = useState<string>(defaultFilterLabel);
  const [preparedBy, setPreparedBy] = useState<string>(
    currentUserProfile?.name 
      ? `${currentUserProfile.name} (${currentUserProfile.role || 'Site Supervisor'})`
      : 'Site Supervisor / Operations Manager'
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
      if (sel === 'all' || !sel) return all;
      if (Array.isArray(sel)) {
        return all.filter(s => sel.includes(s.id));
      }
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
  
  // Total Subtasks & QA Gates across filtered dataset
  const totalSubtasksCount = useMemo(() => {
    return filteredActivities.reduce((sum, a) => sum + getSubtasksForActivity(a).length, 0);
  }, [filteredActivities]);

  const completedSubtasksCount = useMemo(() => {
    return filteredActivities.reduce((sum, a) => 
      sum + getSubtasksForActivity(a).filter(s => s.status === 'Completed').length, 0
    );
  }, [filteredActivities]);

  const totalQaHoldPoints = useMemo(() => {
    return filteredActivities.reduce((sum, a) => 
      sum + getSubtasksForActivity(a).filter(s => s.isHoldPoint).length, 0
    );
  }, [filteredActivities]);

  const clearedQaHoldPoints = useMemo(() => {
    return filteredActivities.reduce((sum, a) => 
      sum + getSubtasksForActivity(a).filter(s => s.isHoldPoint && (s.holdPointSignOff?.approved || s.status === 'Completed')).length, 0
    );
  }, [filteredActivities]);

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

  const totalEquipmentUnits = useMemo(() => {
    const eqIds = new Set<string>();
    filteredActivities.forEach(a => {
      (a.assignedEquipment || []).forEach(e => {
        if (e.equipmentId || e.name) eqIds.add(e.equipmentId || e.name || 'EQ');
      });
    });
    return eqIds.size;
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
      setReportTitle(`Daily Shift Site Diary & Progress Dossier — ${shiftDateFormatted}`);
      setReportSubtitle(`Shift Execution & QA Quality Gate Record`);
    } else if (selectedTemplate === 'subtasks_matrix') {
      setReportTitle('Granular Subtask Execution & Deliverables Progress Matrix');
      setReportSubtitle('Method Progression, Quantity Metrics & Inspection Quality Gates');
    } else if (selectedTemplate === 'detailed') {
      setReportTitle('Detailed Engineering Task Dossier & Quality Ledger');
      setReportSubtitle(defaultFilterLabel);
    } else if (selectedTemplate === 'workstream') {
      setReportTitle('Multi-Discipline Workstream Progress Matrix');
      setReportSubtitle('Cross-Functional Engineering & Scope Tracking');
    } else if (selectedTemplate === 'briefing') {
      setReportTitle(`Daily Shift Briefing & Task Authorization Sheet — ${shiftDateFormatted}`);
      setReportSubtitle('Morning Toolbox Safety & Task Assignment Sheet');
    } else {
      setReportTitle('Construction Activities Progress & Execution Master Report');
      setReportSubtitle(defaultFilterLabel);
    }
  }, [selectedTemplate, shiftDateFormatted, defaultFilterLabel]);

  // -------------------------------------------------------------
  // Robust Multi-Page Vector jsPDF Report Engine
  // -------------------------------------------------------------
  const generatePdfBlob = async (): Promise<Blob> => {
    const doc = new jsPDF({
      orientation: orientation,
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;
    const contentWidth = pageWidth - margin * 2;

    // Palette tokens
    const brandBlue = [11, 95, 255];     // #0B5FFF
    const darkNavy = [15, 23, 42];       // slate-900
    const slateMuted = [100, 116, 139];  // slate-500
    const cardBg = [248, 250, 252];      // slate-50
    const borderColor = [226, 232, 240]; // slate-200
    const emeraldColor = [5, 150, 105];  // emerald-600
    const amberColor = [217, 119, 6];    // amber-600
    const roseColor = [220, 38, 38];     // rose-600

    // 1. Top Accent Header Bar
    doc.setFillColor(brandBlue[0], brandBlue[1], brandBlue[2]);
    doc.rect(0, 0, pageWidth, 50, 'F');

    // Title inside banner
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('CONSTRUCTFIELD ENTERPRISE', margin, 22);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      selectedTemplate === 'daily_shift'
        ? 'Daily Site Diary, Shift Execution & Progress Dossier'
        : selectedTemplate === 'subtasks_matrix'
        ? 'Granular Subtask Execution & Deliverables Matrix'
        : selectedTemplate === 'detailed'
        ? 'Detailed Engineering Task Dossier & Quality Ledger'
        : selectedTemplate === 'workstream'
        ? 'Cross-Discipline Workstream Progress Matrix'
        : selectedTemplate === 'briefing'
        ? 'Daily Shift Briefing & Task Authorization Sheet'
        : 'Construction Activities Execution & Progress Master Report',
      margin,
      38
    );

    // Reference ID & Classification
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL PROJECT RECORD', pageWidth - margin - 150, 22);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Ref: CF-${selectedTemplate === 'daily_shift' ? 'SHIFT' : 'ACT'}-${shiftDate}`,
      pageWidth - margin - 150,
      38
    );

    // 2. Sub-banner project metadata
    let currentY = 70;
    doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.text(reportTitle, margin, currentY);

    currentY += 15;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(
      `Project: ${currentProject?.name || 'Main Site'} (${currentProject?.id || 'PROJ-01'})   |   Location: ${currentProject?.location || 'Jobsite'}   |   Shift Date: ${shiftDateFormatted}`,
      margin,
      currentY
    );

    currentY += 12;
    doc.text(
      `Generated: ${shiftDateFormatted} at ${currentTimeFormatted}   |   Prepared By: ${preparedBy}   |   Scope: ${reportSubtitle} (${totalCount} Activities)`,
      margin,
      currentY
    );

    // 3. Environmental & Weather Banner (if Daily Shift & toggled)
    if (includeWeatherRecord && (selectedTemplate === 'daily_shift' || selectedTemplate === 'briefing')) {
      currentY += 14;
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.roundedRect(margin, currentY, contentWidth, 24, 3, 3, 'FD');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
      doc.text('SITE ENVIRONMENT & WEATHER:', margin + 8, currentY + 15);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      doc.text('Weather: Clear / Sunny 24°C   |   Ground: Firm & Dry   |   Wind: 8 km/h NW   |   Site Safety Status: Operational / Zero Incidents', margin + 160, currentY + 15);

      currentY += 28;
    } else {
      currentY += 10;
    }

    // 4. Executive KPI Summary Cards
    if (includeKpiSummary) {
      currentY += 4;
      const cardHeight = 36;
      const cardGap = 6;
      const numCards = selectedTemplate === 'daily_shift' ? 5 : 6;
      const cardW = (contentWidth - cardGap * (numCards - 1)) / numCards;

      const kpis = selectedTemplate === 'daily_shift' ? [
        { label: 'ACTIVITIES ON SHIFT', val: `${totalCount}`, color: brandBlue },
        { label: 'DELIVERABLES DONE', val: `${completedSubtasksCount} / ${totalSubtasksCount}`, color: emeraldColor },
        { label: 'QA GATES CLEARED', val: `${clearedQaHoldPoints} / ${totalQaHoldPoints}`, color: amberColor },
        { label: 'CREW WORKFORCE', val: `${totalWorkforceCrew.count} workers (${totalWorkforceCrew.hours}h)`, color: [79, 70, 229] },
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
        doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.roundedRect(x, currentY, cardW, cardHeight, 3, 3, 'FD');

        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
        doc.text(kpi.label, x + 6, currentY + 12);

        doc.setFontSize(10.5);
        doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        doc.text(kpi.val, x + 6, currentY + 27);
      });

      currentY += cardHeight + 14;
    } else {
      currentY += 8;
    }

    // -------------------------------------------------------------
    // 5. Main Data Table Rendering Based on Selected Template
    // -------------------------------------------------------------
    if (selectedTemplate === 'daily_shift') {
      // DAILY SHIFT & SITE DIARY DOSSIER
      const tableHeaders = [
        ['ID & Code', 'Activity Scope & Granular Subtasks Worked', 'Discipline', 'Target Qty', 'Subtasks Done', 'QA Quality Gates', 'Progress %']
      ];

      const tableData = filteredActivities.map(act => {
        const subtasks = getSubtasksForActivity(act);
        let scopeContent = act.name;
        if (act.workPackage) scopeContent += `\nWork Package: ${act.workPackage}`;
        if (act.area) scopeContent += `  •  Area: ${act.area}`;
        if (act.sectionSpan) scopeContent += `  •  Span: ${act.sectionSpan}`;

        if (includeSubtasks && subtasks.length > 0) {
          scopeContent += `\n\nShift Deliverables & Progression (${subtasks.filter(s => s.status === 'Completed').length}/${subtasks.length} Completed):`;
          subtasks.forEach((s, sIdx) => {
            const mark = s.status === 'Completed' ? '[✓ DONE]' : s.status === 'In Progress' ? '[▶ ACTIVE]' : '[  TODO]';
            const seq = getSubtaskProgressionNumber(act.subtasks || [], sIdx) || `${sIdx + 1}.0`;
            const holdPoint = s.isHoldPoint ? (s.holdPointSignOff?.approved ? ' [QA CLEARED]' : ' [QA HOLD GATE]') : '';
            scopeContent += `\n  ${mark} ${seq} ${s.title} (${s.completedQuantity || 0}/${s.targetQuantity || 1} ${s.unit || 'units'})${holdPoint}`;
          });
        }

        const completedSub = subtasks.filter(s => s.status === 'Completed').length;
        const holdPointsTotal = subtasks.filter(s => s.isHoldPoint).length;
        const holdPointsCleared = subtasks.filter(s => s.isHoldPoint && (s.holdPointSignOff?.approved || s.status === 'Completed')).length;

        return [
          `${act.id}\n${act.workstream || 'PTS'}`,
          scopeContent,
          act.discipline || 'General',
          `${act.actualQuantity ?? 0} / ${act.targetQuantity ?? 0} ${act.unit || 'units'}`,
          `${completedSub} / ${subtasks.length}`,
          holdPointsTotal > 0 ? `${holdPointsCleared} / ${holdPointsTotal} Approved` : 'N/A',
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
          cellPadding: 5.5,
          textColor: [15, 23, 42],
          lineColor: [226, 232, 240],
        },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: 'bold' },
          1: { cellWidth: orientation === 'landscape' ? 320 : 190 },
          2: { cellWidth: 65 },
          3: { cellWidth: 75 },
          4: { cellWidth: 65, halign: 'center' },
          5: { cellWidth: 75, halign: 'center' },
          6: { cellWidth: 55, halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: margin, right: margin }
      });

    } else if (selectedTemplate === 'subtasks_matrix') {
      // GRANULAR SUBTASK & METHOD PROGRESS MATRIX
      const tableHeaders = [
        ['Activity ID', 'Seq #', 'Subtask Deliverable & Method Item', 'Category', 'Target Qty', 'Completed', 'Unit', 'Status', 'QA Gate', 'Progress %']
      ];

      const tableData: any[] = [];
      filteredActivities.forEach(act => {
        const subtasks = getSubtasksForActivity(act);
        if (subtasks.length === 0) {
          tableData.push([
            act.id,
            '—',
            `${act.name} (Direct Activity Scope)`,
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
          textColor: [51, 65, 85],
          fontSize: 7.5,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 7,
          cellPadding: 4.5,
          textColor: [15, 23, 42],
          lineColor: [226, 232, 240],
        },
        columnStyles: {
          0: { cellWidth: 55, fontStyle: 'bold' },
          1: { cellWidth: 35, halign: 'center' },
          2: { cellWidth: orientation === 'landscape' ? 240 : 140 },
          3: { cellWidth: 65 },
          4: { cellWidth: 45, halign: 'right' },
          5: { cellWidth: 45, halign: 'right' },
          6: { cellWidth: 40 },
          7: { cellWidth: 55 },
          8: { cellWidth: 60, halign: 'center' },
          9: { cellWidth: 50, halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: margin, right: margin }
      });

    } else if (selectedTemplate === 'briefing') {
      // DAILY SHIFT BRIEFING & TOOLBOX AUTHORIZATION SHEET
      const tableHeaders = [
        ['ID', 'Scope Deliverables / Shift Objectives', 'Lead / Discipline', 'Planned Hours', 'Hazards / QA Hold Check', 'Crew Authorization Sign-In']
      ];

      const tableData = filteredActivities.map(act => {
        const subtasks = getSubtasksForActivity(act);
        let scopeContent = act.name;
        if (subtasks.length > 0) {
          scopeContent += `\nTarget Deliverables: ` + subtasks.slice(0, 3).map(s => s.title).join('; ');
        }
        const leadWorker = (act.assignedLabour && act.assignedLabour[0]?.name) || 'Assigned Crew';
        return [
          act.id,
          scopeContent,
          `${leadWorker}\n(${act.discipline || 'General'})`,
          `${act.plannedHours || 8} hrs`,
          act.subtasks?.some(s => s.isHoldPoint) ? '⚠ MANDATORY QA HOLD GATE' : 'Standard PPE & Safe Work Procedure',
          'Signature: ______________________'
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
          0: { cellWidth: 55, fontStyle: 'bold' },
          1: { cellWidth: orientation === 'landscape' ? 260 : 160 },
          2: { cellWidth: 80 },
          3: { cellWidth: 55, halign: 'center' },
          4: { cellWidth: 120 },
          5: { cellWidth: 140 },
        },
        margin: { left: margin, right: margin }
      });

    } else {
      // EXECUTIVE & DETAILED DOSSIER
      const tableHeaders = [
        ['ID', 'Activity Scope & Work Package', 'Discipline', 'Priority', 'Qty / Target', 'Status', 'Start Date', 'Progress %']
      ];

      const tableData = filteredActivities.map(act => {
        const subtasks = getSubtasksForActivity(act);
        let scopeContent = act.name;
        if (act.workPackage) scopeContent += `\nPackage: ${act.workPackage}`;
        if (act.area) scopeContent += `  •  Area: ${act.area}`;
        if (act.sectionSpan) scopeContent += `  •  Span: ${act.sectionSpan}`;

        if (includeSubtasks && subtasks.length > 0 && selectedTemplate === 'detailed') {
          scopeContent += `\n\nDeliverables (${subtasks.filter(s => s.status === 'Completed').length}/${subtasks.length}):`;
          subtasks.slice(0, 4).forEach(s => {
            const mark = s.status === 'Completed' ? '[✓ DONE]' : s.status === 'In Progress' ? '[▶ PROG]' : '[  TODO]';
            scopeContent += `\n  ${mark} ${s.title}${s.isHoldPoint ? ' [QA HOLD]' : ''}`;
          });
        }

        return [
          act.id,
          scopeContent,
          act.discipline || 'General Civil',
          act.priority || 'Medium',
          `${act.actualQuantity ?? 0} / ${act.targetQuantity ?? 0} ${act.unit || 'units'}`,
          act.status || 'Not Started',
          act.startDate || '—',
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
          cellPadding: 5.5,
          textColor: [15, 23, 42],
          lineColor: [226, 232, 240],
        },
        columnStyles: {
          0: { cellWidth: 55, fontStyle: 'bold' },
          1: { cellWidth: orientation === 'landscape' ? 280 : 170 },
          2: { cellWidth: 70 },
          3: { cellWidth: 55 },
          4: { cellWidth: 80 },
          5: { cellWidth: 70 },
          6: { cellWidth: 75 },
          7: { cellWidth: 60, halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: margin, right: margin }
      });
    }

    // 6. Sign-Off & Verification Footer Block
    const lastTable = (doc as any).lastAutoTable;
    let finalY = lastTable ? lastTable.finalY + 16 : currentY + 30;

    if (includeSignoff) {
      if (finalY > pageHeight - 90) {
        doc.addPage();
        finalY = 40;
      }

      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, finalY, contentWidth, 48, 3, 3, 'FD');

      doc.setFontSize(7.5);
      doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('SITE MANAGEMENT REVIEW & EXECUTION SIGN-OFF', margin + 10, finalY + 13);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      doc.text(
        'I confirm that the recorded activity states, physical deliverables, and progress milestones represented in this report reflect authentic site execution.',
        margin + 10,
        finalY + 23
      );

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
      doc.text(`Authorized Supervisor: ___________________________ (${preparedBy})`, margin + 10, finalY + 39);
      doc.text(`QA/QC Quality Inspector: ___________________________`, margin + (orientation === 'landscape' ? 320 : 220), finalY + 39);
      doc.text(`Date: ${shiftDateFormatted}`, margin + (orientation === 'landscape' ? 560 : 400), finalY + 39);
    }

    // 7. Running Page Footers
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      doc.text(
        `Constructfield Enterprise Field Management System  •  Official Project Record  •  Shift: ${shiftDateFormatted}`,
        margin,
        pageHeight - 14
      );
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin - 45,
        pageHeight - 14
      );
    }

    return doc.output('blob');
  };

  // Export PDF Handler
  const handleDownloadPdf = async () => {
    try {
      setIsGenerating(true);
      const blob = await generatePdfBlob();
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

  // Dedicated Vector Print Handler
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
                    badge: 'NEW: Shift Diary',
                    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  },
                  { 
                    id: 'subtasks_matrix', 
                    name: 'Granular Subtask Deliverables Matrix', 
                    desc: 'Sequences, method deliverables, quantities & inspection',
                    badge: 'NEW: Subtask Matrix',
                    badgeColor: 'bg-blue-50 text-blue-700 border-blue-300'
                  },
                  { 
                    id: 'executive', 
                    name: 'Executive Master Summary', 
                    desc: 'KPI cards, schedule dates & master overview',
                    badge: 'Executive',
                    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300'
                  },
                  { 
                    id: 'detailed', 
                    name: 'Detailed Engineering Task Dossier', 
                    desc: 'Subtasks, hold points, packages & methods',
                    badge: 'Engineering',
                    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-300'
                  },
                  { 
                    id: 'briefing', 
                    name: 'Daily Shift Briefing & Sign-Off', 
                    desc: 'Toolbox talk safety objectives & crew sign-in',
                    badge: 'Toolbox Talk',
                    badgeColor: 'bg-amber-50 text-amber-800 border-amber-300'
                  },
                  { 
                    id: 'workstream', 
                    name: 'Workstream Progress Matrix', 
                    desc: 'Multi-discipline cross-functional scope tracking',
                    badge: 'Workstreams',
                    badgeColor: 'bg-purple-50 text-purple-700 border-purple-300'
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
                    className={`p-3 rounded-2xl border text-left transition-all relative ${
                      selectedTemplate === t.id
                        ? 'border-[#0B5FFF] bg-blue-50/60 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-xs">{t.name}</span>
                      {selectedTemplate === t.id && <Check className="h-3.5 w-3.5 text-[#0B5FFF]" />}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Shift Date & Scope Selection */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-600" /> Shift Date & Scope Filtering
              </label>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Shift / Record Date</label>
                <input
                  type="date"
                  value={shiftDate}
                  onChange={e => setShiftDate(e.target.value)}
                  className="w-full p-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Progress Scope</label>
                <select
                  value={scopeMode}
                  onChange={e => setScopeMode(e.target.value as any)}
                  className="w-full p-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="all">All Project Activities ({activities.length})</option>
                  <option value="focused_only">Shift Focused / Pinned Items Only ({Object.keys(activePinnedMap).length > 0 ? Object.keys(activePinnedMap).length : 'Auto'})</option>
                  <option value="in_progress">In Progress Activities Only</option>
                  <option value="blocked">Blocked / QA Hold Only</option>
                  <option value="completed">Completed Activities Only</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Subtask Level Granularity</label>
                <select
                  value={subtaskInclusion}
                  onChange={e => setSubtaskInclusion(e.target.value as any)}
                  className="w-full p-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="all">All Configured Subtasks</option>
                  <option value="focused">Only Shift-Pinned & Active Subtasks</option>
                  <option value="active_only">Active / In Progress Subtasks Only</option>
                  <option value="hold_points_only">QA Hold Quality Gates Only</option>
                </select>
              </div>

              {/* Orientation Selector */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Page Orientation</label>
                <div className="grid grid-cols-2 gap-2">
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

          {/* Right Main Area: Interactive Live Vector Preview */}
          <div className="flex-1 bg-slate-200/60 dark:bg-slate-950 p-4 sm:p-6 overflow-y-auto flex justify-center">
            <div 
              ref={printRef}
              className={`bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 rounded-xl p-8 transition-all ${
                orientation === 'landscape' ? 'w-full max-w-5xl min-h-[600px]' : 'w-full max-w-3xl min-h-[750px]'
              }`}
            >
              {/* Document Header Accent */}
              <div className="bg-[#0B5FFF] text-white -m-8 mb-6 p-5 rounded-t-xl flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h1 className="text-lg font-black tracking-tight">CONSTRUCTFIELD ENTERPRISE</h1>
                  <p className="text-xs text-blue-100 font-medium">{reportTitle}</p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold tracking-widest uppercase bg-white/20 px-2.5 py-0.5 rounded-full inline-block">
                    OFFICIAL PROJECT RECORD
                  </div>
                  <div className="text-xs text-blue-100 font-mono mt-1">
                    Ref: CF-{selectedTemplate === 'daily_shift' ? 'SHIFT' : 'ACT'}-{shiftDate}
                  </div>
                </div>
              </div>

              {/* Sub-header Metadata */}
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-5 flex justify-between items-start flex-wrap gap-3">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Project: <strong className="text-slate-800 dark:text-slate-200">{currentProject?.name || 'Main Jobsite'}</strong> ({currentProject?.id || 'PROJ-01'})
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Location: <strong className="text-slate-800 dark:text-slate-200">{currentProject?.location || 'Jobsite'}</strong>  •  Scope: <strong>{reportSubtitle}</strong>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                  <div>Shift Date: <strong className="text-slate-800 dark:text-slate-200">{shiftDateFormatted}</strong></div>
                  <div className="mt-0.5">Prepared By: <strong className="text-slate-800 dark:text-slate-200">{preparedBy}</strong></div>
                </div>
              </div>

              {/* Environmental & Weather Bar if Daily Shift */}
              {includeWeatherRecord && (selectedTemplate === 'daily_shift' || selectedTemplate === 'briefing') && (
                <div className="mb-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                    <CloudSun className="h-4 w-4 text-amber-500" />
                    <span>Weather: <strong>Sunny / Clear 24°C</strong></span>
                    <span>•</span>
                    <span>Ground: <strong>Firm & Dry</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 font-bold">
                      Zero HSE Incidents
                    </Badge>
                  </div>
                </div>
              )}

              {/* Executive KPI Summary Cards */}
              {includeKpiSummary && (
                <div className={`grid gap-3 mb-6 ${selectedTemplate === 'daily_shift' ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-6'}`}>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Activities</div>
                    <div className="text-lg font-black text-[#0B5FFF]">{totalCount}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Deliverables Done</div>
                    <div className="text-lg font-black text-emerald-600">{completedSubtasksCount} / {totalSubtasksCount}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">QA Quality Gates</div>
                    <div className="text-lg font-black text-amber-600">{clearedQaHoldPoints} / {totalQaHoldPoints}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Crew on Site</div>
                    <div className="text-lg font-black text-indigo-600">{totalWorkforceCrew.count} workers</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Avg Progress</div>
                    <div className="text-lg font-black text-cyan-600">{avgProgress}%</div>
                  </div>
                </div>
              )}

              {/* Main Preview Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 mb-6">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <th className="p-2.5">ID</th>
                      <th className="p-2.5">{selectedTemplate === 'subtasks_matrix' ? 'Subtask / Method Deliverable' : 'Scope & Deliverables'}</th>
                      <th className="p-2.5">Discipline</th>
                      <th className="p-2.5">{selectedTemplate === 'subtasks_matrix' ? 'Seq' : 'Qty / Target'}</th>
                      <th className="p-2.5">{selectedTemplate === 'subtasks_matrix' ? 'Category' : 'Status'}</th>
                      <th className="p-2.5 text-right">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredActivities.slice(0, 15).map(act => {
                      const subtasks = getSubtasksForActivity(act);
                      return (
                        <tr key={act.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-2.5 font-bold font-mono text-[#0B5FFF] align-top">{act.id}</td>
                          <td className="p-2.5 align-top">
                            <div className="font-bold text-slate-900 dark:text-white">{act.name}</div>
                            {act.workPackage && <div className="text-[10px] text-slate-500">Package: {act.workPackage}</div>}
                            {includeSubtasks && subtasks.length > 0 && (
                              <div className="mt-2 space-y-1 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                                {subtasks.slice(0, 3).map(st => (
                                  <div key={st.id} className="text-[11px] flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                    <span className={st.status === 'Completed' ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                                      {st.status === 'Completed' ? '✓' : '○'}
                                    </span>
                                    <span>{st.title}</span>
                                    {st.isHoldPoint && (
                                      <span className="text-[9px] px-1 rounded bg-amber-100 text-amber-800 font-bold">QA GATE</span>
                                    )}
                                  </div>
                                ))}
                                {subtasks.length > 3 && (
                                  <div className="text-[10px] text-slate-400 italic">+ {subtasks.length - 3} more deliverables</div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 align-top text-slate-600 dark:text-slate-300">{act.discipline || 'General'}</td>
                          <td className="p-2.5 align-top font-mono text-[11px]">{act.actualQuantity ?? 0} / {act.targetQuantity ?? 0} {act.unit}</td>
                          <td className="p-2.5 align-top">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              act.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                              act.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                              act.status === 'Blocked' ? 'bg-rose-100 text-rose-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {act.status}
                            </span>
                          </td>
                          <td className="p-2.5 align-top text-right font-bold text-slate-900 dark:text-white">
                            {act.progress || 0}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Sign-Off Block */}
              {includeSignoff && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <div className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                    SITE MANAGEMENT REVIEW & EXECUTION SIGN-OFF
                  </div>
                  <p className="text-[11px] text-slate-500">
                    I confirm that the recorded activity states, physical deliverables, and progress milestones represented in this report reflect authentic site execution.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <div>Authorized: ____________________ ({preparedBy})</div>
                    <div>QA/QC Verified: ____________________</div>
                    <div>Date: {shiftDateFormatted}</div>
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
