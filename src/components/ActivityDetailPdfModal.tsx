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
  Compass,
  Package,
  Wrench,
  FileCheck,
  Settings2,
  HardHat,
  Truck,
  TrendingUp,
  Flag,
  Lock,
  ListChecks,
  MapPin,
  Mic,
  MessageSquare,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from './ui';
import { Activity, Project, SubTask } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveOrShareFile } from '../lib/fileExportService';
import { getSubtaskProgressionNumber, getPersonInitials, normalizeLabourAssignments } from '../lib/labourUtils';

export interface ActivityDetailPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity;
  project?: Project;
  currentUserProfile?: { name?: string; role?: string; email?: string } | null;
  employees?: any[];
  equipment?: any[];
  materials?: any[];
  labourLogs?: any[];
  equipmentLogs?: any[];
}

export type ActivityReportScope = 
  | 'full'              // Complete Comprehensive Activity Dossier
  | 'subtasks_only'     // Work Breakdown Structure (Subtasks & Milestones Only)
  | 'labour_equipment'  // Labour Roster & Equipment Manifest
  | 'qa_holdpoints'     // Quality Control & QA Inspection Ledger
  | 'overview_scope'    // Executive Scope & Progress Summary
  | 'custom';           // Custom selection

export function ActivityDetailPdfModal({
  isOpen,
  onClose,
  activity,
  project,
  currentUserProfile,
  employees = [],
  equipment = [],
  materials = [],
  labourLogs = [],
  equipmentLogs = []
}: ActivityDetailPdfModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Configuration State
  const [reportScope, setReportScope] = useState<ActivityReportScope>('full');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [reportTitle, setReportTitle] = useState<string>(
    `${activity.id}: ${activity.name || 'Activity Technical Report'}`
  );
  const [reportSubtitle, setReportSubtitle] = useState<string>(
    `Project: ${project?.name || activity.projectId || 'Site Operations'} | Discipline: ${activity.discipline || 'General Construction'}`
  );
  const [preparedBy, setPreparedBy] = useState<string>(
    currentUserProfile?.name 
      ? `${currentUserProfile.name} (${currentUserProfile.role || 'Site Engineer'})`
      : 'Site Supervisor / Project Engineer'
  );

  // Section Toggles
  const [includeKpiSummary, setIncludeKpiSummary] = useState<boolean>(true);
  const [includeOverview, setIncludeOverview] = useState<boolean>(true);
  const [includeSubtasks, setIncludeSubtasks] = useState<boolean>(true);
  const [includeLabour, setIncludeLabour] = useState<boolean>(true);
  const [includeEquipment, setIncludeEquipment] = useState<boolean>(true);
  const [includeMaterials, setIncludeMaterials] = useState<boolean>(true);
  const [includeQaHoldPoints, setIncludeQaHoldPoints] = useState<boolean>(true);
  const [includeRemarks, setIncludeRemarks] = useState<boolean>(true);
  const [includeSignoff, setIncludeSignoff] = useState<boolean>(true);

  // Modal Tabs & Generation State
  const [activeTab, setActiveTab] = useState<'preview' | 'config'>('preview');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // Sync section toggles when report scope preset changes
  useEffect(() => {
    if (reportScope === 'full') {
      setIncludeKpiSummary(true);
      setIncludeOverview(true);
      setIncludeSubtasks(true);
      setIncludeLabour(true);
      setIncludeEquipment(true);
      setIncludeMaterials(true);
      setIncludeQaHoldPoints(true);
      setIncludeRemarks(true);
      setIncludeSignoff(true);
    } else if (reportScope === 'subtasks_only') {
      setIncludeKpiSummary(true);
      setIncludeOverview(false);
      setIncludeSubtasks(true);
      setIncludeLabour(false);
      setIncludeEquipment(false);
      setIncludeMaterials(false);
      setIncludeQaHoldPoints(true);
      setIncludeRemarks(false);
      setIncludeSignoff(true);
    } else if (reportScope === 'labour_equipment') {
      setIncludeKpiSummary(true);
      setIncludeOverview(false);
      setIncludeSubtasks(false);
      setIncludeLabour(true);
      setIncludeEquipment(true);
      setIncludeMaterials(false);
      setIncludeQaHoldPoints(false);
      setIncludeRemarks(false);
      setIncludeSignoff(true);
    } else if (reportScope === 'qa_holdpoints') {
      setIncludeKpiSummary(true);
      setIncludeOverview(false);
      setIncludeSubtasks(false);
      setIncludeLabour(false);
      setIncludeEquipment(false);
      setIncludeMaterials(false);
      setIncludeQaHoldPoints(true);
      setIncludeRemarks(true);
      setIncludeSignoff(true);
    } else if (reportScope === 'overview_scope') {
      setIncludeKpiSummary(true);
      setIncludeOverview(true);
      setIncludeSubtasks(false);
      setIncludeLabour(false);
      setIncludeEquipment(false);
      setIncludeMaterials(false);
      setIncludeQaHoldPoints(false);
      setIncludeRemarks(true);
      setIncludeSignoff(true);
    }
  }, [reportScope]);

  // Sync body class for print isolation
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('print-modal-open');
    } else {
      document.body.classList.remove('print-modal-open');
    }
    return () => document.body.classList.remove('print-modal-open');
  }, [isOpen]);

  // Normalized Subtasks and Resources
  const subtasks = useMemo(() => activity.subtasks || [], [activity.subtasks]);
  const completedSubtasksCount = useMemo(() => subtasks.filter(s => s.status === 'Completed').length, [subtasks]);
  const holdPointSubtasks = useMemo(() => subtasks.filter(s => s.isHoldPoint), [subtasks]);
  const signedOffHoldPointsCount = useMemo(() => holdPointSubtasks.filter(s => s.holdPointSignOff?.approved).length, [holdPointSubtasks]);

  const normalizedLabour = useMemo(() => 
    normalizeLabourAssignments(activity.assignedLabour, employees), 
  [activity.assignedLabour, employees]);

  const assignedEquipment = useMemo(() => activity.assignedEquipment || [], [activity.assignedEquipment]);
  const assignedMaterials = useMemo(() => activity.assignedMaterials || [], [activity.assignedMaterials]);

  // Calculated logged hours
  const actualLabourHours = useMemo(() => {
    if (!labourLogs || labourLogs.length === 0) return activity.actualHours || 0;
    const matching = labourLogs.filter(l => l.activityId === activity.id);
    if (matching.length === 0) return activity.actualHours || 0;
    return matching.reduce((sum, l) => sum + (Number(l.hoursWorked ?? l.hours) || 0), 0);
  }, [labourLogs, activity.id, activity.actualHours]);

  const actualMachineHours = useMemo(() => {
    if (!equipmentLogs || equipmentLogs.length === 0) return 0;
    return equipmentLogs
      .filter(l => l.activityId === activity.id && l.type === 'Hours')
      .reduce((sum, l) => sum + (Number(l.hoursAdded ?? l.hours) || 0), 0);
  }, [equipmentLogs, activity.id]);

  const currentDateFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const currentTimeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // -------------------------------------------------------------
  // Vector jsPDF Activity Dossier Engine
  // -------------------------------------------------------------
  const generatePdfBlob = async (): Promise<Blob> => {
    const isLandscape = orientation === 'landscape';
    const doc = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 36;
    const contentWidth = pageWidth - margin * 2;

    // Corporate Color Tokens
    const brandBlue: [number, number, number] = [11, 95, 255];     // #0B5FFF
    const darkNavy: [number, number, number] = [15, 23, 42];       // slate-900
    const slateMuted: [number, number, number] = [100, 116, 139];   // slate-500
    const cardBg: [number, number, number] = [248, 250, 252];       // slate-50
    const borderColor: [number, number, number] = [226, 232, 240]; // slate-200
    const emeraldColor: [number, number, number] = [5, 150, 105];  // emerald-600
    const roseColor: [number, number, number] = [225, 29, 72];     // rose-600

    // 1. Corporate Header Banner
    doc.setFillColor(brandBlue[0], brandBlue[1], brandBlue[2]);
    doc.rect(0, 0, pageWidth, 54, 'F');

    // Title inside banner
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('SCEDIH ENTERPRISE', margin, 24);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      reportScope === 'subtasks_only'
        ? 'Work Breakdown Structure (Subtasks & Milestones Execution Ledger)'
        : reportScope === 'labour_equipment'
        ? 'Site Workforce & Machinery Allocation Manifest'
        : reportScope === 'qa_holdpoints'
        ? 'QA/QC Inspection & Quality Gate Verification Dossier'
        : reportScope === 'overview_scope'
        ? 'Executive Activity Scope & Progress Summary'
        : 'Detailed Activity Engineering Dossier & Execution Record',
      margin,
      41
    );

    // Reference ID
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL ACTIVITY DOSSIER', pageWidth - margin - 150, 24);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ref: ${activity.id} / ${new Date().toISOString().split('T')[0]}`, pageWidth - margin - 150, 41);

    // Sub-banner metadata
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
      `Project: ${project?.name || activity.projectId || 'Site Operations'}   |   Discipline: ${activity.discipline || 'General'}   |   Workstream: ${activity.workstream || 'PTS'}`,
      margin,
      currentY
    );

    currentY += 13;
    doc.text(
      `Generated: ${currentDateFormatted} at ${currentTimeFormatted}   |   Prepared By: ${preparedBy}   |   Location: ${activity.location || 'Jobsite'}`,
      margin,
      currentY
    );

    // 2. Executive KPI Cards
    if (includeKpiSummary) {
      currentY += 16;
      const cardHeight = 38;
      const cardGap = 8;
      const numCards = isLandscape ? 6 : 4;
      const cardW = (contentWidth - cardGap * (numCards - 1)) / numCards;

      const kpis = [
        { label: 'OVERALL PROGRESS', val: `${activity.progress || 0}%`, color: brandBlue },
        { label: 'STATUS', val: (activity.status || 'Not Started').toUpperCase(), color: activity.status === 'Completed' ? emeraldColor : [37, 99, 235] },
        { label: 'SUBTASKS COMPLETE', val: `${completedSubtasksCount} / ${subtasks.length}`, color: [79, 70, 229] },
        { label: 'QA HOLD POINTS', val: `${signedOffHoldPointsCount} / ${holdPointSubtasks.length}`, color: holdPointSubtasks.length > 0 ? roseColor : slateMuted },
        ...(isLandscape ? [
          { label: 'LABOUR HOURS', val: `${actualLabourHours} / ${activity.plannedHours || 0}h`, color: [14, 116, 144] },
          { label: 'MACHINE HOURS', val: `${actualMachineHours}h`, color: [217, 119, 6] },
        ] : [])
      ];

      kpis.forEach((kpi, idx) => {
        const x = margin + idx * (cardW + cardGap);
        doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.roundedRect(x, currentY, cardW, cardHeight, 4, 4, 'FD');

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
        doc.text(kpi.label, x + 6, currentY + 12);

        doc.setFontSize(11);
        doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        doc.text(kpi.val, x + 6, currentY + 28);
      });

      currentY += cardHeight + 14;
    } else {
      currentY += 14;
    }

    // 3. Activity Scope & General Specifications Table
    if (includeOverview) {
      autoTable(doc, {
        startY: currentY,
        head: [['Specification Attribute', 'Operational Detail & Execution Parameters']],
        body: [
          ['Activity Identifier', `${activity.id}  (Workstream: ${activity.workstream || 'PTS'})`],
          ['Activity Name & Title', activity.name || 'N/A'],
          ['Discipline & Category', `${activity.discipline || 'General'}  |  Work Package: ${activity.workPackage || 'Main'}`],
          ['Span / Section Range', activity.sectionSpan || 'Full Alignment'],
          ['Schedule Window', `Start: ${activity.startDate || '—'}  |  Finish: ${activity.finishDate || '—'}`],
          ['Priority Level', (activity.priority || 'Medium').toUpperCase()],
          ['Target Deliverable', `${activity.actualQuantity ?? 0} / ${activity.targetQuantity ?? 0} ${activity.unit || 'units'} (${activity.progress || 0}% Complete)`],
          ['Scope of Work & Notes', activity.description || 'No additional scope text specified.']
        ],
        theme: 'grid',
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontSize: 8.5,
          fontStyle: 'bold',
          cellPadding: 5
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59],
          cellPadding: 4.5
        },
        columnStyles: {
          0: { cellWidth: isLandscape ? 160 : 130, fontStyle: 'bold', fillColor: [248, 250, 252] },
          1: { cellWidth: 'auto' }
        },
        margin: { left: margin, right: margin }
      });

      currentY = (doc as any).lastAutoTable.finalY + 14;
    }

    // 4. Work Breakdown Structure (Subtasks & Progression Ledger)
    if (includeSubtasks && subtasks.length > 0) {
      const subtaskHeaders = [
        ['Seq', 'Deliverable / Subtask Title', 'Discipline / Category', 'Measurement / Qty', 'Hold Point', 'Assigned Personnel', 'Status', '%']
      ];

      const subtaskData = subtasks.map((st, idx) => {
        const progNum = getSubtaskProgressionNumber(subtasks, idx);
        
        let qtyText = '—';
        if (st.targetQuantity) {
          qtyText = `${st.completedQuantity || 0} / ${st.targetQuantity} ${st.unit || 'units'}`;
        } else if (st.measurementType === 'Checklist' && st.checklist) {
          qtyText = `${st.checklist.filter(c => c.completed).length}/${st.checklist.length} Steps`;
        } else {
          qtyText = st.measurementType || 'Direct';
        }

        const workers = (st.assignedWorkers && st.assignedWorkers.length > 0)
          ? st.assignedWorkers.join(', ')
          : st.assignedPerson || 'Unassigned';

        const holdPointText = st.isHoldPoint
          ? st.holdPointSignOff?.approved ? `✓ Approved (${st.holdPointSignOff.signedBy})` : '🔒 QA Hold Point'
          : '—';

        let subPercent = 0;
        if (st.targetQuantity && st.targetQuantity > 0) {
          subPercent = Math.min(100, Math.round(((st.completedQuantity || 0) / st.targetQuantity) * 100));
        } else {
          subPercent = st.status === 'Completed' ? 100 : st.status === 'In Progress' ? 50 : 0;
        }

        return [
          progNum,
          st.title + (st.isMilestone ? '  [🚩 MILESTONE]' : '') + (st.linkedActivityId ? `\nLinked: ${st.linkedActivityName || st.linkedActivityId}` : ''),
          st.category,
          qtyText,
          holdPointText,
          workers,
          st.status,
          `${subPercent}%`
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: subtaskHeaders,
        body: subtaskData,
        theme: 'striped',
        headStyles: {
          fillColor: brandBlue,
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          cellPadding: 5
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59],
          cellPadding: 4.5
        },
        columnStyles: {
          0: { cellWidth: 32, fontStyle: 'bold', halign: 'center' },
          1: { cellWidth: isLandscape ? 190 : 130, fontStyle: 'bold' },
          2: { cellWidth: isLandscape ? 110 : 75 },
          3: { cellWidth: isLandscape ? 90 : 65 },
          4: { cellWidth: isLandscape ? 100 : 75, fontSize: 7 },
          5: { cellWidth: isLandscape ? 110 : 80 },
          6: { cellWidth: 60, fontStyle: 'bold', halign: 'center' },
          7: { cellWidth: 35, fontStyle: 'bold', halign: 'right' }
        },
        margin: { left: margin, right: margin },
        didParseCell: (data) => {
          if (data.section === 'body') {
            if (data.column.index === 6) {
              const val = String(data.cell.raw);
              if (val === 'Completed') data.cell.styles.textColor = emeraldColor;
              else if (val === 'In Progress') data.cell.styles.textColor = brandBlue;
              else data.cell.styles.textColor = slateMuted;
            }
            if (data.column.index === 4) {
              const val = String(data.cell.raw);
              if (val.includes('Approved')) data.cell.styles.textColor = emeraldColor;
              else if (val.includes('QA Hold Point')) data.cell.styles.textColor = roseColor;
            }
          }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 14;
    }

    // 5. Labour & Workforce Allocation
    if (includeLabour && normalizedLabour.length > 0) {
      const labourHeaders = [['Worker / Personnel Name', 'Assigned Role / Trade', 'Allocated Hours', 'Start Date', 'Notes / Scope']];
      const labourData = normalizedLabour.map(l => [
        l.name,
        l.role || 'Site Worker',
        `${l.hours || 8} hrs`,
        l.startDate || '—',
        l.notes || 'Standard daily shift allocation'
      ]);

      autoTable(doc, {
        startY: currentY,
        head: labourHeaders,
        body: labourData,
        theme: 'grid',
        headStyles: {
          fillColor: [217, 119, 6], // Amber-600
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          cellPadding: 5
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59],
          cellPadding: 4
        },
        columnStyles: {
          0: { cellWidth: isLandscape ? 160 : 120, fontStyle: 'bold' },
          1: { cellWidth: isLandscape ? 130 : 100 },
          2: { cellWidth: 70, halign: 'center' },
          3: { cellWidth: 70, halign: 'center' },
          4: { cellWidth: 'auto' }
        },
        margin: { left: margin, right: margin }
      });

      currentY = (doc as any).lastAutoTable.finalY + 14;
    }

    // 6. Plant & Equipment Allocation
    if (includeEquipment && assignedEquipment.length > 0) {
      const eqHeaders = [['Machinery & Plant Name', 'Designated Operator', 'Equipment Type', 'Allocated Hours', 'Operational Remarks']];
      const eqData = assignedEquipment.map(e => [
        e.name,
        e.operator || 'Unassigned / General',
        e.type || 'Heavy Plant',
        `${e.hours || 0} hrs`,
        e.notes || 'Active on site'
      ]);

      autoTable(doc, {
        startY: currentY,
        head: eqHeaders,
        body: eqData,
        theme: 'grid',
        headStyles: {
          fillColor: [37, 99, 235], // Blue-600
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          cellPadding: 5
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59],
          cellPadding: 4
        },
        columnStyles: {
          0: { cellWidth: isLandscape ? 160 : 120, fontStyle: 'bold' },
          1: { cellWidth: isLandscape ? 130 : 100 },
          2: { cellWidth: 80 },
          3: { cellWidth: 70, halign: 'center' },
          4: { cellWidth: 'auto' }
        },
        margin: { left: margin, right: margin }
      });

      currentY = (doc as any).lastAutoTable.finalY + 14;
    }

    // 7. Materials & Logistics
    if (includeMaterials && assignedMaterials.length > 0) {
      const matHeaders = [['Material Item', 'Allocated Quantity', 'Status', 'Allocated Date', 'Specification Notes']];
      const matData = assignedMaterials.map(m => [
        m.name,
        `${m.quantity} ${m.unit || 'units'}`,
        m.status || 'Allocated',
        m.assignedDate || '—',
        m.notes || 'Staged for installation'
      ]);

      autoTable(doc, {
        startY: currentY,
        head: matHeaders,
        body: matData,
        theme: 'grid',
        headStyles: {
          fillColor: [13, 148, 136], // Teal-600
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          cellPadding: 5
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59],
          cellPadding: 4
        },
        columnStyles: {
          0: { cellWidth: isLandscape ? 160 : 120, fontStyle: 'bold' },
          1: { cellWidth: 90, halign: 'center' },
          2: { cellWidth: 70, halign: 'center' },
          3: { cellWidth: 70, halign: 'center' },
          4: { cellWidth: 'auto' }
        },
        margin: { left: margin, right: margin }
      });

      currentY = (doc as any).lastAutoTable.finalY + 14;
    }

    // 8. QA/QC Hold Points & Compliance Ledger
    if (includeQaHoldPoints && holdPointSubtasks.length > 0) {
      const qaHeaders = [['Quality Gate / Hold Point', 'Verification Requirement', 'Inspector', 'Sign-Off Date', 'Compliance Status']];
      const qaData = holdPointSubtasks.map(st => [
        st.title,
        st.milestoneCriteria || 'Formal engineering sign-off mandatory before proceeding to subsequent tasks.',
        st.holdPointSignOff?.signedBy || 'Pending QA Inspector',
        st.holdPointSignOff?.signedAt ? new Date(st.holdPointSignOff.signedAt).toLocaleDateString() : 'Pending',
        st.holdPointSignOff?.approved ? 'APPROVED & VERIFIED' : 'PENDING INSPECTION'
      ]);

      autoTable(doc, {
        startY: currentY,
        head: qaHeaders,
        body: qaData,
        theme: 'grid',
        headStyles: {
          fillColor: roseColor,
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          cellPadding: 5
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59],
          cellPadding: 4
        },
        columnStyles: {
          0: { cellWidth: isLandscape ? 160 : 120, fontStyle: 'bold' },
          1: { cellWidth: isLandscape ? 200 : 130 },
          2: { cellWidth: 90 },
          3: { cellWidth: 70, halign: 'center' },
          4: { cellWidth: 90, fontStyle: 'bold', halign: 'center' }
        },
        margin: { left: margin, right: margin },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 4) {
            const val = String(data.cell.raw);
            if (val.includes('APPROVED')) data.cell.styles.textColor = emeraldColor;
            else data.cell.styles.textColor = roseColor;
          }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 14;
    }

    // 9. Remarks & Voice Notes Log
    if (includeRemarks && (activity.remarks || (activity.voiceNotes && activity.voiceNotes.length > 0))) {
      const remarkEntries: [string, string][] = [];
      if (Array.isArray(activity.remarks)) {
        activity.remarks.forEach((r: string) => remarkEntries.push(['Field Remark', r]));
      } else if (typeof activity.remarks === 'string' && (activity.remarks as string).trim()) {
        remarkEntries.push(['Field Remark', activity.remarks]);
      }
      (activity.voiceNotes || []).forEach((vn: string) => remarkEntries.push(['Audio Voice Log', vn]));

      autoTable(doc, {
        startY: currentY,
        head: [['Log Type', 'Site Observations & Engineering Remarks']],
        body: remarkEntries,
        theme: 'grid',
        headStyles: {
          fillColor: [71, 85, 105], // Slate-600
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          cellPadding: 5
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59],
          cellPadding: 4
        },
        columnStyles: {
          0: { cellWidth: 90, fontStyle: 'bold' },
          1: { cellWidth: 'auto' }
        },
        margin: { left: margin, right: margin }
      });

      currentY = (doc as any).lastAutoTable.finalY + 14;
    }

    // 10. Formal Digital Sign-Off Authorization Block
    if (includeSignoff) {
      // Check if page overflow requires new page
      if (currentY > doc.internal.pageSize.getHeight() - 110) {
        doc.addPage();
        currentY = 40;
      }

      const signBoxWidth = (contentWidth - 16) / 2;
      const signBoxHeight = 65;

      // Site Supervisor Authorization Box
      doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.roundedRect(margin, currentY, signBoxWidth, signBoxHeight, 4, 4, 'FD');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      doc.text('SITE SUPERVISOR / PROJECT ENGINEER SIGN-OFF', margin + 8, currentY + 12);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
      doc.text(`Supervisor: ${preparedBy}`, margin + 8, currentY + 26);
      doc.text(`Digital Sign-off: ${activity.digitalSignature || 'Recorded & Verified on System'}`, margin + 8, currentY + 38);
      doc.text(`Date Verified: ${currentDateFormatted}`, margin + 8, currentY + 50);

      // QA/QC Certification Box
      const qaX = margin + signBoxWidth + 16;
      doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.roundedRect(qaX, currentY, signBoxWidth, signBoxHeight, 4, 4, 'FD');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      doc.text('QA/QC QUALITY GATE & COMPLIANCE VERIFICATION', qaX + 8, currentY + 12);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
      doc.text(`Quality Inspector: ${holdPointSubtasks.find(s => s.holdPointSignOff?.signedBy)?.holdPointSignOff?.signedBy || 'Lead QA/QC Auditor'}`, qaX + 8, currentY + 26);
      doc.text(`Compliance Certificate: ${holdPointSubtasks.length > 0 && signedOffHoldPointsCount === holdPointSubtasks.length ? 'CLEARED & AUTHORIZED' : 'STANDARD QUALITY AUDIT'}`, qaX + 8, currentY + 38);
      doc.text(`Timestamp: ${currentDateFormatted} ${currentTimeFormatted}`, qaX + 8, currentY + 50);
    }

    // 11. Global Multi-Page Header & Footer
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);

      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 15;
      doc.text(
        `Scedih Enterprise Engineering Dossier  |  Activity: ${activity.id} (${activity.name})  |  Generated ${currentDateFormatted}`,
        margin,
        footerY
      );
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 50, footerY);
    }

    return doc.output('blob');
  };

  // Download PDF Action
  const handleDownloadPdf = async () => {
    try {
      setIsGenerating(true);
      const blob = await generatePdfBlob();
      const sanitizedName = (activity.name || 'activity').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      const filename = `activity_report_${activity.id}_${sanitizedName}_${new Date().toISOString().split('T')[0]}.pdf`;
      await saveOrShareFile({
        filename,
        blob,
        title: `${activity.id} - ${activity.name}`,
        text: `Constructfield Activity Dossier for ${activity.id}`
      });
    } catch (err) {
      console.error('Failed to export activity PDF:', err);
      alert('Error generating PDF document. Please retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Direct Browser Print Action
  const handleNativePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[95vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-[#0B5FFF] flex items-center justify-center border border-blue-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Activity Print & PDF Document Engine
                </h2>
                <Badge variant="outline" className="text-[10px] font-mono text-[#0B5FFF] border-blue-200 dark:border-blue-900">
                  {activity.id}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate clean, high-fidelity engineering dossiers, WBS subtask checklists, and quality gate reports.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab Switcher */}
            <div className="hidden sm:inline-flex p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'preview'
                    ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                Live Preview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('config')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'config'
                    ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Settings2 className="h-3.5 w-3.5" />
                Print & Section Options
              </button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-9 w-9 p-0 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="sm:hidden flex border-b border-slate-200 dark:border-slate-800 p-2 bg-slate-100 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${
              activeTab === 'preview' ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-xs' : 'text-slate-500'
            }`}
          >
            <Eye className="h-3.5 w-3.5" /> Live Preview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${
              activeTab === 'config' ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-xs' : 'text-slate-500'
            }`}
          >
            <Settings2 className="h-3.5 w-3.5" /> Options
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/60 dark:bg-slate-950/40">
          {activeTab === 'config' ? (
            /* CONFIGURATION & SECTION OPTIONS TAB */
            <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-150">
              {/* Scope Presets */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-[#0B5FFF]" />
                  Select Report Scope / Section to Print
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { id: 'full', label: 'Full Activity Dossier', desc: 'Complete engineering dossier with all subtasks, labour, plant & QA gates' },
                    { id: 'subtasks_only', label: 'Subtasks & WBS Only', desc: 'Work breakdown sequence, checklists, quantities & QA hold points' },
                    { id: 'labour_equipment', label: 'Labour & Plant Manifest', desc: 'Workforce roster, employee assignments & machinery hours' },
                    { id: 'qa_holdpoints', label: 'QA Inspection Ledger', desc: 'Quality hold points, inspection verification & certificates' },
                    { id: 'overview_scope', label: 'Executive Scope Briefing', desc: 'High-level activity specifications, schedule & progress summary' },
                    { id: 'custom', label: 'Custom Selection', desc: 'Manually select which sections and tables to include below' }
                  ].map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setReportScope(preset.id as ActivityReportScope)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        reportScope === preset.id
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-[#0B5FFF] ring-1 ring-[#0B5FFF] shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>{preset.label}</span>
                        {reportScope === preset.id && <Check className="h-3.5 w-3.5 text-[#0B5FFF]" />}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        {preset.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Document Metadata Fields */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FileCheck className="h-3.5 w-3.5 text-[#0B5FFF]" />
                  Document Titles & Signer Info
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Report Main Title</label>
                    <input
                      type="text"
                      value={reportTitle}
                      onChange={e => setReportTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#0B5FFF]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Subtitle / Context</label>
                    <input
                      type="text"
                      value={reportSubtitle}
                      onChange={e => setReportSubtitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#0B5FFF]"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Prepared & Certified By</label>
                    <input
                      type="text"
                      value={preparedBy}
                      onChange={e => setPreparedBy(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#0B5FFF]"
                    />
                  </div>
                </div>
              </div>

              {/* Granular Section Toggles */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-[#0B5FFF]" />
                  Custom Section Inclusions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { state: includeKpiSummary, setter: setIncludeKpiSummary, label: 'Executive KPI Cards', desc: 'Progress, status, hours & counts' },
                    { state: includeOverview, setter: setIncludeOverview, label: 'Activity Scope & Specs', desc: 'Dates, locations, targets, descriptions' },
                    { state: includeSubtasks, setter: setIncludeSubtasks, label: 'WBS Subtasks Sequence', desc: `All ${subtasks.length} subtasks & checklists` },
                    { state: includeLabour, setter: setIncludeLabour, label: 'Labour Personnel Roster', desc: `${normalizedLabour.length} assigned workers` },
                    { state: includeEquipment, setter: setIncludeEquipment, label: 'Plant & Machinery List', desc: `${assignedEquipment.length} allocated machines` },
                    { state: includeMaterials, setter: setIncludeMaterials, label: 'Materials & Logistics', desc: `${assignedMaterials.length} materials` },
                    { state: includeQaHoldPoints, setter: setIncludeQaHoldPoints, label: 'QA Hold Points & Gates', desc: `${holdPointSubtasks.length} inspection gates` },
                    { state: includeRemarks, setter: setIncludeRemarks, label: 'Remarks & Voice Notes Log', desc: 'Site observations & logs' },
                    { state: includeSignoff, setter: setIncludeSignoff, label: 'Digital Authorization Box', desc: 'Formal signature block' }
                  ].map((item, idx) => (
                    <label 
                      key={idx}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        item.state
                          ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 text-slate-900 dark:text-slate-100'
                          : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-400'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={item.state}
                        onChange={e => {
                          item.setter(e.target.checked);
                          if (reportScope !== 'custom') setReportScope('custom');
                        }}
                        className="mt-0.5 rounded border-blue-400 text-[#0B5FFF] focus:ring-[#0B5FFF] h-3.5 w-3.5"
                      />
                      <div>
                        <p className="font-bold text-xs">{item.label}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Orientation Switcher */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Page Layout Orientation</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Portrait is ideal for detailed reports; Landscape is best for wide matrices.</p>
                </div>
                <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      orientation === 'portrait' ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Portrait (A4)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      orientation === 'landscape' ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Landscape (A4)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* LIVE DOCUMENT PREVIEW TAB */
            <div className="space-y-4 max-w-4xl mx-auto animate-in fade-in duration-150">
              {/* Preview Zoom Controls */}
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-[#0B5FFF]" />
                  Interactive Document Preview
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(z => Math.max(60, z - 10))}
                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 w-12 text-center">
                    {previewZoom}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(z => Math.min(140, z + 10))}
                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(100)}
                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Printable Document Container */}
              <div className="overflow-x-auto pb-4 flex justify-center">
                <div 
                  ref={printRef}
                  id="activity-printable-doc"
                  style={{ transform: `scale(${previewZoom / 100})`, transformOrigin: 'top center' }}
                  className={`bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 p-8 font-sans transition-transform ${
                    orientation === 'landscape' ? 'w-[1020px]' : 'w-[790px]'
                  }`}
                >
                  {/* Document Corporate Top Banner */}
                  <div className="border-b-4 border-[#0B5FFF] pb-5 mb-6 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-[#0B5FFF] text-[11px] font-black tracking-wider uppercase font-mono">
                          {activity.id}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                          {activity.discipline || 'Construction'}
                        </span>
                      </div>
                      <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        {activity.name || 'Activity Technical Report'}
                      </h1>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        Project: {project?.name || activity.projectId}  |  Discipline: {activity.discipline || 'General'}  |  Span: {activity.sectionSpan || 'Full Span'}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">OFFICIAL DOSSIER</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{currentDateFormatted}</p>
                      <p className="text-[11px] text-slate-500">{currentTimeFormatted}</p>
                    </div>
                  </div>

                  {/* KPI Executive Summary Grid */}
                  {includeKpiSummary && (
                    <div className="grid grid-cols-4 gap-3 mb-6">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Task Completion</p>
                        <p className="text-xl font-black text-[#0B5FFF]">{activity.progress || 0}%</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Execution Status</p>
                        <p className="text-sm font-bold text-slate-800 mt-1 uppercase">{activity.status || 'Not Started'}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-[10px] font-bold uppercase text-slate-400">WBS Subtasks</p>
                        <p className="text-xl font-black text-indigo-600">{completedSubtasksCount}/{subtasks.length}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-[10px] font-bold uppercase text-slate-400">QA Hold Points</p>
                        <p className="text-xl font-black text-rose-600">{signedOffHoldPointsCount}/{holdPointSubtasks.length}</p>
                      </div>
                    </div>
                  )}

                  {/* General Overview Table */}
                  {includeOverview && (
                    <div className="mb-6 space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-[#0B5FFF]" /> Activity Specifications & Scope
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        <div className="space-y-1.5">
                          <p><span className="font-semibold text-slate-500 w-28 inline-block">Workstream:</span> <span className="font-bold text-slate-900">{activity.workstream || 'PTS'}</span></p>
                          <p><span className="font-semibold text-slate-500 w-28 inline-block">Priority:</span> <span className="font-bold text-slate-900">{activity.priority || 'Medium'}</span></p>
                          <p><span className="font-semibold text-slate-500 w-28 inline-block">Location:</span> <span className="font-bold text-slate-900">{activity.location || 'Jobsite'}</span></p>
                          <p><span className="font-semibold text-slate-500 w-28 inline-block">Deliverable:</span> <span className="font-bold text-slate-900">{activity.actualQuantity ?? 0} / {activity.targetQuantity ?? 0} {activity.unit || 'units'}</span></p>
                        </div>
                        <div className="space-y-1.5">
                          <p><span className="font-semibold text-slate-500 w-28 inline-block">Start Date:</span> <span className="font-bold text-slate-900">{activity.startDate || '—'}</span></p>
                          <p><span className="font-semibold text-slate-500 w-28 inline-block">Finish Date:</span> <span className="font-bold text-slate-900">{activity.finishDate || '—'}</span></p>
                          <p><span className="font-semibold text-slate-500 w-28 inline-block">Planned Hours:</span> <span className="font-bold text-slate-900">{activity.plannedHours || 0} hrs</span></p>
                          <p><span className="font-semibold text-slate-500 w-28 inline-block">Actual Logged:</span> <span className="font-bold text-slate-900">{actualLabourHours} hrs</span></p>
                        </div>
                        {activity.description && (
                          <div className="col-span-2 pt-2 border-t border-slate-200">
                            <p className="text-[11px] font-semibold text-slate-500">Scope Description:</p>
                            <p className="text-xs text-slate-700 mt-0.5 whitespace-pre-wrap">{activity.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Work Breakdown Structure (Subtasks Table) */}
                  {includeSubtasks && subtasks.length > 0 && (
                    <div className="mb-6 space-y-2">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-[#0B5FFF]" /> Work Breakdown Structure (Subtasks & Milestones)
                        </h3>
                        <span className="text-[10px] font-bold text-slate-500">
                          {completedSubtasksCount} of {subtasks.length} Completed
                        </span>
                      </div>
                      <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                        <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="p-2 w-10 text-center">#</th>
                            <th className="p-2">Deliverable Title</th>
                            <th className="p-2">Category</th>
                            <th className="p-2">Progress / Qty</th>
                            <th className="p-2">Assigned Personnel</th>
                            <th className="p-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {subtasks.map((st, sIdx) => {
                            const progNum = getSubtaskProgressionNumber(subtasks, sIdx);
                            return (
                              <tr key={st.id} className={sIdx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                                <td className="p-2 font-mono font-bold text-center text-slate-500">{progNum}</td>
                                <td className="p-2">
                                  <span className="font-bold text-slate-800">{st.title}</span>
                                  {st.isMilestone && <span className="ml-1.5 px-1.5 py-0.2 rounded text-[9px] bg-purple-100 text-purple-800 font-bold">Milestone</span>}
                                  {st.isHoldPoint && (
                                    <span className={`ml-1.5 px-1.5 py-0.2 rounded text-[9px] font-bold ${st.holdPointSignOff?.approved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                      {st.holdPointSignOff?.approved ? '✓ QA Approved' : '🔒 QA Gate'}
                                    </span>
                                  )}
                                </td>
                                <td className="p-2 text-slate-600 text-[11px]">{st.category}</td>
                                <td className="p-2 font-medium text-slate-700">
                                  {st.targetQuantity ? `${st.completedQuantity || 0}/${st.targetQuantity} ${st.unit}` : st.status}
                                </td>
                                <td className="p-2 text-slate-600 text-[11px]">
                                  {st.assignedWorkers?.join(', ') || st.assignedPerson || '—'}
                                </td>
                                <td className="p-2 text-center font-bold">
                                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                                    st.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                                    st.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {st.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Labour & Equipment 2-Column Section */}
                  {(includeLabour || includeEquipment) && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {includeLabour && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                            <HardHat className="h-3.5 w-3.5 text-amber-600" /> Allocated Site Personnel ({normalizedLabour.length})
                          </h3>
                          {normalizedLabour.length > 0 ? (
                            <div className="space-y-1.5 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              {normalizedLabour.map((l, i) => (
                                <div key={i} className="flex justify-between items-center py-1 border-b border-slate-100 border-dashed last:border-none">
                                  <span className="font-bold text-slate-800">{l.name}</span>
                                  <span className="text-[11px] text-slate-500">{l.role} ({l.hours || 8}h)</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No workforce recorded.</p>
                          )}
                        </div>
                      )}

                      {includeEquipment && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                            <Truck className="h-3.5 w-3.5 text-blue-600" /> Allocated Machinery & Plant ({assignedEquipment.length})
                          </h3>
                          {assignedEquipment.length > 0 ? (
                            <div className="space-y-1.5 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              {assignedEquipment.map((e, i) => (
                                <div key={i} className="flex justify-between items-center py-1 border-b border-slate-100 border-dashed last:border-none">
                                  <span className="font-bold text-slate-800">{e.name}</span>
                                  <span className="text-[11px] text-slate-500">{e.operator || 'Unassigned'}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No machinery allocated.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* QA Hold Points Ledger */}
                  {includeQaHoldPoints && holdPointSubtasks.length > 0 && (
                    <div className="mb-6 space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-rose-600" /> QA Quality Gates & Compliance Ledger
                      </h3>
                      <div className="space-y-2">
                        {holdPointSubtasks.map(st => (
                          <div key={st.id} className="p-2.5 rounded-xl border border-rose-100 bg-rose-50/40 text-xs flex justify-between items-center">
                            <div>
                              <p className="font-bold text-slate-800">{st.title}</p>
                              <p className="text-[10px] text-rose-700">{st.milestoneCriteria || 'Quality verification inspection mandatory'}</p>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${st.holdPointSignOff?.approved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                {st.holdPointSignOff?.approved ? `Approved: ${st.holdPointSignOff.signedBy}` : 'Pending QA Clearance'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Formal Sign-off Box */}
                  {includeSignoff && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-slate-100">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Site Supervisor Sign-Off</p>
                        <p className="text-xs font-bold text-slate-800">{preparedBy}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Signature: {activity.digitalSignature || 'Certified on System'}</p>
                        <p className="text-[10px] text-slate-400 mt-2">Date: {currentDateFormatted}</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">QA/QC Compliance Auditor</p>
                        <p className="text-xs font-bold text-slate-800">Lead QA/QC Operations Engineer</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Verification: Cleared for Project Records</p>
                        <p className="text-[10px] text-slate-400 mt-2">Date: {currentDateFormatted}</p>
                      </div>
                    </div>
                  )}

                  {/* Document Footer */}
                  <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
                    Constructfield Enterprise System  •  Activity Reference: {activity.id}  •  Generated {currentDateFormatted} {currentTimeFormatted}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {orientation.toUpperCase()}
            </Badge>
            <span>Scope: <strong>{reportScope.replace('_', ' ').toUpperCase()}</strong></span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-xs"
            >
              Close
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleNativePrint}
              className="rounded-xl text-xs gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
            <Button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="bg-[#0B5FFF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold gap-1.5 shadow-md px-4"
            >
              {isGenerating ? (
                <>Generating PDF...</>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
