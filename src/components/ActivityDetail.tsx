import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ActivityStatus, Priority, TaskMaterialAssignment, TaskLabourAssignment, TaskEquipmentAssignment, SubTask, DailyReport, canUserEditSection, WORKSTREAMS, WorkstreamType, Comment, ActivityChecklistItem } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Badge, ProgressBar, Button } from './ui';
import { InteractiveProgress } from './InteractiveProgress';
import { CameraCapture } from './CameraCapture';
import { ActivityLabourTracking } from './ActivityLabourTracking';
import { ActivityEquipmentTracking } from './ActivityEquipmentTracking';
import { SubTaskManager } from './SubTaskManager';
import { ActivityChecklistPanel } from './ActivityChecklistPanel';
import { ActivityExplainerBreakdown } from './ActivityExplainerBreakdown';
import { RecordActivityForTaskModal } from './RecordActivityForTaskModal';
import { PlanningCalendar } from './PlanningCalendar';
import { ActivityDetailPdfModal } from './ActivityDetailPdfModal';
import { ActivityAuditScreen } from './ActivityAuditScreen';
import { useAppContext } from '../context/AppContext';
import { getPersonInitials, normalizeLabourAssignments, isEmployeeAlreadyAssigned, getLoggedHoursForWorker } from '../lib/labourUtils';
import { findActivityResourceConflicts, getAvailableAlternativeEquipment, ResourceConflict } from '../lib/resourceConflictUtils';
import { recordSubtaskProgress, calculateSubtaskDailyAverage, calculateActivityRollupFromSubtasks } from '../lib/subtaskProgressUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveOrShareFile } from '../lib/fileExportService';
import {
  MapPin,
  QrCode,
  Barcode,
  FileText,
  Calendar,
  Clock,
  User,
  History,
  ShieldAlert,
  Paperclip,
  Image as ImageIcon,
  Mic,
  PenTool,
  CheckCircle2,
  Printer,
  AlertTriangle,
  PlayCircle,
  XCircle,
  BarChart2,
  GitBranch,
  Building2,
  Save,
  ArrowLeft,
  Copy,
  Check,
  Edit3,
  Camera,
  MessageSquare,
  Send,
  Upload,
  Eye,
  Trash2,
  Download,
  X,
  UserCheck,
  Package,
  Truck,
  Users,
  Plus,
  TrendingUp,
  Tag,
  FileBarChart,
  FolderOpen,
  FileSpreadsheet,
  Link as LinkIcon,
  Sun,
  Cloud,
  CloudRain,
  Wind,
  Thermometer,
  CheckSquare,
  Layers,
  Sparkles,
  CheckCircle,
  Compass,
  Zap,
  Link2,
  ShieldCheck,
  Wrench,
  ArrowRightLeft,
  AlertOctagon
} from 'lucide-react';

interface ActivityDetailProps {
  activity: Activity;
  onSave?: (updatedActivity: Activity, oldId?: string) => void;
  onClose?: () => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (activity: Activity) => void;
  isEditable?: boolean;
}

export function ActivityDetail({ activity: initialActivity, onSave, onClose, onDelete, onDuplicate, isEditable = true }: ActivityDetailProps) {
  const navigate = useNavigate();
  const { 
    activities, projects, materials, employees, equipment, documents, updateActivity, addActivity, deleteActivity, addReport, addAuditLog, addAllocation, 
    userRole, currentUserProfile, labourLogs, addLabourLog, deleteLabourLog, equipmentLogs, addEquipmentLog, deleteEquipmentLog 
  } = useAppContext();
  const canEditActivities = canUserEditSection(currentUserProfile, 'activities');
  const [activity, setActivity] = useState<Activity>(initialActivity);

  useEffect(() => {
    setActivity(initialActivity);
  }, [initialActivity]);

  const [isEditing, setIsEditing] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [copiedGps, setCopiedGps] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Normalized and deduplicated labour personnel assignments
  const normalizedLabour = React.useMemo(() => 
    normalizeLabourAssignments(activity.assignedLabour, employees), 
  [activity.assignedLabour, employees]);

  // Deterministic Living Resource Vitality & Conflict Calculation
  const resourceVitality = React.useMemo(() => 
    findActivityResourceConflicts(activity, activities, equipment, employees),
  [activity, activities, equipment, employees]);

  const [swappingConflict, setSwappingConflict] = useState<ResourceConflict | null>(null);

  const availableAlternatives = React.useMemo(() => {
    if (!swappingConflict) return [];
    return getAvailableAlternativeEquipment(
      equipment,
      activities,
      activity.startDate || new Date().toISOString().split('T')[0],
      activity.finishDate || activity.startDate || new Date().toISOString().split('T')[0],
      swappingConflict.resourceId,
      swappingConflict.category
    );
  }, [swappingConflict, equipment, activities, activity.startDate, activity.finishDate]);

  const handleSwapEquipment = (oldResourceIdOrName: string, newEquip: import('../types').Equipment) => {
    const oldNorm = oldResourceIdOrName.toLowerCase().trim();
    const updatedAssigned = (activity.assignedEquipment || []).map(eq => {
      const isTarget = (eq.equipmentId && eq.equipmentId.toLowerCase() === oldNorm) ||
                       (eq.name && eq.name.toLowerCase().trim() === oldNorm) ||
                       (eq.id && eq.id.toLowerCase() === oldNorm);
      if (isTarget) {
        return {
          ...eq,
          equipmentId: newEquip.id || eq.equipmentId,
          name: newEquip.name,
          operator: newEquip.operator || eq.operator || 'Assigned Operator',
          notes: `Swapped from ${eq.name} to resolve site scheduling conflict.`
        };
      }
      return eq;
    });

    const updatedSubtasks = (activity.subtasks || []).map(st => {
      const eqList = (st.assignedEquipmentList || []).map(eqName => 
        eqName.toLowerCase().trim() === oldNorm ? newEquip.name : eqName
      );
      return {
        ...st,
        assignedEquipmentList: eqList,
        assignedEquipment: st.assignedEquipment && st.assignedEquipment.toLowerCase().trim() === oldNorm
          ? newEquip.name
          : st.assignedEquipment
      };
    });

    const today = new Date().toISOString().split('T')[0];
    const updated: Activity = {
      ...activity,
      assignedEquipment: updatedAssigned,
      subtasks: updatedSubtasks,
      updatedAt: today
    };

    setActivity(updated);
    if (onSave) onSave(updated, initialActivity.id);
    else updateActivity(updated, initialActivity.id);

    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: activity.projectId,
      userId: currentUserProfile?.name || 'Site Supervisor',
      action: 'Equipment Swapped (Conflict Resolution)',
      details: `Swapped "${oldResourceIdOrName}" with "${newEquip.name}" (${newEquip.id || ''}) on "${activity.name}" (${activity.id})`,
      timestamp: new Date().toISOString()
    });

    setSwappingConflict(null);
  };

  // Cross-Workstream Multi-Discipline Handshake Data
  const crossDisciplineData = React.useMemo(() => {
    const actSpan = activity.sectionSpan || activity.name.match(/PTS\s*\d+\s*(?:TO|-)\s*PTS\s*\d+/i)?.[0]?.toUpperCase().replace(/\s*TO\s*/i, ' - ');
    
    // Find all linked survey items (from other activities or subtasks)
    const surveyItems: any[] = [];
    const qaItems: any[] = [];
    const materialItems: any[] = [];
    const safetyItems: any[] = [];

    (activities || []).forEach(a => {
      const isSurveyAct = a.workstream === 'SURVEYING' && (a.linkedPTSActivityId === activity.id || (actSpan && a.sectionSpan === actSpan));
      const isQaAct = a.workstream === 'QA_QC' && (a.linkedPTSActivityId === activity.id || (actSpan && a.sectionSpan === actSpan));
      const isMatAct = a.workstream === 'MATERIALS' && (a.linkedPTSActivityId === activity.id || (actSpan && a.sectionSpan === actSpan));
      const isSafetyAct = a.workstream === 'SAFETY' && (a.linkedPTSActivityId === activity.id || (actSpan && a.sectionSpan === actSpan));

      if (isSurveyAct) surveyItems.push({ id: a.id, title: a.name, status: a.status, progress: a.progress, source: 'Activity', data: a });
      if (isQaAct) qaItems.push({ id: a.id, title: a.name, status: a.status, holdPoint: true, data: a });
      if (isMatAct) materialItems.push({ id: a.id, title: a.name, status: a.status, data: a });
      if (isSafetyAct) safetyItems.push({ id: a.id, title: a.name, status: a.status, data: a });

      // Scan subtasks for cross-links
      (a.subtasks || []).forEach(st => {
        const isLinkedToThis = st.linkedActivityId === activity.id;
        const matchesSpan = actSpan && st.sectionSpan === actSpan;
        const isThisAct = a.id === activity.id;

        if (isLinkedToThis || matchesSpan || isThisAct) {
          if (st.category === 'Surveying & Set-out' || st.surveyData || st.isLinkedDiscipline) {
            surveyItems.push({
              id: st.id,
              title: st.title,
              status: st.status,
              progress: st.completedQuantity ? Math.round(((st.completedQuantity || 0)/(st.targetQuantity || 1))*100) : (st.status === 'Completed' ? 100 : 0),
              surveyor: st.surveyData?.surveyorName,
              coords: st.surveyData?.coordinates,
              source: 'Subtask',
              data: st
            });
          }
          if (st.isHoldPoint || st.category === 'Quality Control & Hold Points') {
            qaItems.push({
              id: st.id,
              title: st.title,
              status: st.holdPointSignOff?.approved ? 'Completed' : st.status,
              holdPoint: true,
              inspector: st.holdPointSignOff?.signedBy,
              source: 'Subtask',
              data: st
            });
          }
        }
      });
    });

    (activity.assignedMaterials || []).forEach(m => {
      materialItems.push({ id: m.id, title: `${m.name} (${m.quantity} ${m.unit || 'units'})`, status: 'Allocated', data: m });
    });

    return {
      actSpan,
      surveyItems,
      qaItems,
      materialItems,
      safetyItems
    };
  }, [activity, activities]);

  const calculatedActualHours = React.useMemo(() => {
    if (!labourLogs) return activity.actualHours || 0;
    return labourLogs
      .filter(log => log?.activityId === activity.id)
      .reduce((sum, log) => sum + (log.hours || 0), 0);
  }, [labourLogs, activity.id, activity.actualHours]);

  const calculatedMachineHours = React.useMemo(() => {
    if (!equipmentLogs) return 0;
    return equipmentLogs
      .filter(log => log?.activityId === activity.id && log?.type === 'Hours')
      .reduce((sum, log) => sum + (log.hoursAdded || log.hours || 0), 0);
  }, [equipmentLogs, activity.id]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Task Resource Assign Modal States
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTab, setAssignTab] = useState<'Material' | 'Labour' | 'Equipment'>('Material');

  // Assign Material State
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [assignMaterialQty, setAssignMaterialQty] = useState(10);
  const [assignMaterialNotes, setAssignMaterialNotes] = useState('');

  // Assign Labour State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [customWorkerName, setCustomWorkerName] = useState('');
  const [assignLabourRole, setAssignLabourRole] = useState('Technician / Worker');
  const [assignLabourHours, setAssignLabourHours] = useState(8);
  const [assignLabourNotes, setAssignLabourNotes] = useState('');

  // Assign Equipment State
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [assignEqOperator, setAssignEqOperator] = useState('');
  const [assignEqNotes, setAssignEqNotes] = useState('');

  // Log Progress Modal State & Granular Subtask Engine
  const [isLogProgressModalOpen, setIsLogProgressModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isRecordActivityModalOpen, setIsRecordActivityModalOpen] = useState(false);
  const [logProgressIsGranularMode, setLogProgressIsGranularMode] = useState<boolean>(true);
  const [logProgressSelectedSubtaskIds, setLogProgressSelectedSubtaskIds] = useState<string[]>([]);
  const [logProgressSubtaskInputs, setLogProgressSubtaskInputs] = useState<Record<string, {
    mode: 'shift' | 'cumulative';
    shiftOutput: number;
    cumulativeOutput: number;
    status: 'Not Started' | 'In Progress' | 'Completed';
    notes: string;
    chainageSpan: string;
    holdPointApproved: boolean;
    holdPointSignedBy: string;
  }>>({});
  const [logProgressActualQty, setLogProgressActualQty] = useState<number>(initialActivity.actualQuantity || 0);
  const [logProgressActualHours, setLogProgressActualHours] = useState<number>(initialActivity.actualHours || 0);
  const [logProgressPercent, setLogProgressPercent] = useState<number>(initialActivity.progress || 0);
  const [logProgressStatus, setLogProgressStatus] = useState<ActivityStatus>(initialActivity.status || 'Not Started');
  const [logProgressNotes, setLogProgressNotes] = useState('');
  const [logProgressDate, setLogProgressDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [logProgressWeather, setLogProgressWeather] = useState<string>('Sunny');
  const [logProgressTemp, setLogProgressTemp] = useState<string>('24°C');
  const [logProgressSiteConditions, setLogProgressSiteConditions] = useState<string>('Site dry and fully accessible');
  const [logProgressSubtasks, setLogProgressSubtasks] = useState<SubTask[]>([]);
  const [logProgressPostReport, setLogProgressPostReport] = useState<boolean>(true);
  const [logProgressDelayReason, setLogProgressDelayReason] = useState<string>('');

  // Voice Notes, Sign-Off, and Field Remarks State
  const [isAddVoiceNoteOpen, setIsAddVoiceNoteOpen] = useState(false);
  const [voiceNoteInput, setVoiceNoteInput] = useState('');

  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerRole, setSignerRole] = useState('Site Supervisor / Engineer');

  const [isAddRemarkModalOpen, setIsAddRemarkModalOpen] = useState(false);
  const [remarkInput, setRemarkInput] = useState('');

  // Expanded QR Code & Barcode Modal State
  const [expandedCodeTag, setExpandedCodeTag] = useState<'qr' | 'barcode' | null>(null);
  const [editingQrCode, setEditingQrCode] = useState(activity.qrCode || `QR-${activity.id}`);
  const [editingBarcode, setEditingBarcode] = useState(activity.barcode || `BC-${activity.id}`);
  const [copiedCodeTag, setCopiedCodeTag] = useState(false);

  const handleSaveCodeTag = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...activity,
      qrCode: editingQrCode.trim(),
      barcode: editingBarcode.trim()
    };
    setActivity(updated);
    if (onSave) onSave(updated);
    else updateActivity(updated);

    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: activity.projectId,
      userId: 'Current User',
      action: 'Identification Tags Updated',
      details: `Updated QR (${editingQrCode}) and Barcode (${editingBarcode}) for Activity "${activity.name}"`,
      timestamp: new Date().toISOString()
    });

    setExpandedCodeTag(null);
  };

  const handleAddVoiceNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceNoteInput.trim()) return;
    const newNote = `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ${voiceNoteInput.trim()}`;
    const updatedNotes = [...(activity.voiceNotes || []), newNote];
    const updated = { ...activity, voiceNotes: updatedNotes };
    setActivity(updated);
    if (onSave) onSave(updated);
    else updateActivity(updated);

    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: activity.projectId,
      userId: 'Current User',
      action: 'Voice Note Added',
      details: `Added voice note to Activity "${activity.name}" (${activity.id})`,
      timestamp: new Date().toISOString()
    });

    setVoiceNoteInput('');
    setIsAddVoiceNoteOpen(false);
  };

  const handleSignOffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim()) return;
    const signatureStr = `${signerName.trim()} (${signerRole || 'Site Supervisor'}) - Signed ${new Date().toISOString().split('T')[0]}`;
    const updated = { ...activity, digitalSignature: signatureStr, status: 'Completed' as ActivityStatus, progress: 100 };
    setActivity(updated);
    if (onSave) onSave(updated);
    else updateActivity(updated);

    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: activity.projectId,
      userId: 'Current User',
      action: 'Digital Sign-Off Recorded',
      details: `Supervisor "${signerName.trim()}" digitally signed off Activity "${activity.name}" (${activity.id})`,
      timestamp: new Date().toISOString()
    });

    setIsSignOffModalOpen(false);
  };

  const handleAddRemarkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarkInput.trim()) return;
    const timestamp = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedEntry = `[${timestamp}]: ${remarkInput.trim()}`;
    const updatedRemarks = activity.remarks ? `${activity.remarks}\n${formattedEntry}` : formattedEntry;
    const updated = { ...activity, remarks: updatedRemarks };
    setActivity(updated);
    if (onSave) onSave(updated);
    else updateActivity(updated);

    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: activity.projectId,
      userId: 'Current User',
      action: 'Field Remark Added',
      details: `Added field remark to Activity "${activity.name}" (${activity.id})`,
      timestamp: new Date().toISOString()
    });

    setRemarkInput('');
    setIsAddRemarkModalOpen(false);
  };

  const handleLogProgressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = logProgressDate || new Date().toISOString().split('T')[0];

    let finalStatus = logProgressStatus;
    let finalProgress = Number(logProgressPercent) || 0;
    let finalActualQty = Number(logProgressActualQty) || 0;

    let subtasksToSave: SubTask[] = logProgressSubtasks && logProgressSubtasks.length > 0
      ? logProgressSubtasks
      : (activity.subtasks || []);

    // 1. Process Granular Subtasks if in Granular Mode
    if (logProgressIsGranularMode && subtasksToSave.length > 0) {
      subtasksToSave = subtasksToSave.map(st => {
        const isSelected = logProgressSelectedSubtaskIds.includes(st.id);
        const input = logProgressSubtaskInputs[st.id];

        if (!isSelected || !input) return st;

        let updatedSt = { ...st };

        // QA Hold Point Sign-Off Handling
        if (st.isHoldPoint) {
          if (input.holdPointApproved) {
            updatedSt.holdPointSignOff = {
              signedBy: input.holdPointSignedBy || currentUserProfile?.name || 'Site Supervisor',
              signedAt: todayStr,
              signatureNote: input.notes || 'Inspection cleared and approved on site.',
              approved: true
            };
            updatedSt.status = 'Completed';
          } else {
            updatedSt.status = input.status || st.status;
          }
        }

        // Apply Shift Output or Cumulative change
        const hasOutputChange = input.mode === 'shift' ? input.shiftOutput > 0 : (input.cumulativeOutput !== st.completedQuantity);
        if (hasOutputChange || input.notes.trim()) {
          updatedSt = recordSubtaskProgress(updatedSt, {
            date: todayStr,
            shiftOutput: input.mode === 'shift' ? input.shiftOutput : input.cumulativeOutput,
            mode: input.mode,
            status: input.status,
            notes: input.notes.trim(),
            loggedBy: currentUserProfile?.name || 'Site Supervisor',
            weather: logProgressWeather,
            chainageSpan: input.chainageSpan
          });
        } else if (input.status && input.status !== st.status) {
          updatedSt.status = input.status;
        }

        return updatedSt;
      });

      // Automatically calculate master activity rollup
      const rollup = calculateActivityRollupFromSubtasks(activity, subtasksToSave);
      finalProgress = rollup.overallProgress;
      finalActualQty = rollup.actualQuantity;
      finalStatus = rollup.status;
    }

    // Strict validation: Parent activity cannot be Completed if any subtask or milestone is incomplete
    if (subtasksToSave.length > 0) {
      const incomplete = subtasksToSave.filter(s => s.status !== 'Completed');
      if (incomplete.length > 0 && (finalStatus === 'Completed' || finalProgress >= 100)) {
        finalStatus = 'In Progress';
        finalProgress = Math.min(99, finalProgress);
      }
    }

    const updatedRemarks = logProgressNotes.trim() 
      ? `${activity.remarks ? activity.remarks + '\n' : ''}[Progress Log ${todayStr}${logProgressDelayReason ? ` • Blocker: ${logProgressDelayReason}` : ''}]: ${logProgressNotes.trim()}`
      : activity.remarks;

    const updatedActivity: Activity = {
      ...activity,
      actualQuantity: finalActualQty,
      actualHours: calculatedActualHours,
      progress: finalProgress,
      status: finalStatus,
      remarks: updatedRemarks,
      subtasks: subtasksToSave
    };

    setActivity(updatedActivity);
    if (onSave) onSave(updatedActivity);
    else updateActivity(updatedActivity);

    // Smart & Detailed Daily Report Generation
    if (logProgressPostReport) {
      const projectName = projects.find(p => p.id === updatedActivity.projectId)?.name || updatedActivity.projectId;
      const assignedLabour = updatedActivity.assignedLabour || [];
      const assignedEquipment = updatedActivity.assignedEquipment || [];
      const assignedMaterials = updatedActivity.assignedMaterials || [];

      const labourSummary = assignedLabour.length > 0
        ? assignedLabour.map(l => `${l.name} (${l.role || 'Worker'}, ${l.hours || 8}h)`).join(', ')
        : 'General site personnel deployed.';

      const equipmentSummary = assignedEquipment.length > 0
        ? assignedEquipment.map(eq => `${eq.name}${eq.operator ? ` [Operator: ${eq.operator}]` : ''}`).join(', ')
        : 'Standard tools & equipment utilized.';

      const materialsSummary = assignedMaterials.length > 0
        ? assignedMaterials.map(m => `${m.name}: ${m.quantity} ${m.unit}`).join(', ')
        : 'Standard site consumables.';

      const subtasksCompletedCount = subtasksToSave.filter(s => s.status === 'Completed').length;
      
      const subtaskSummaryLines = subtasksToSave.length > 0
        ? subtasksToSave.map((s, idx) => {
            const input = logProgressSubtaskInputs[s.id];
            const wasLoggedToday = logProgressSelectedSubtaskIds.includes(s.id);
            const metrics = calculateSubtaskDailyAverage(s);
            const shiftGain = wasLoggedToday && input?.mode === 'shift' && input.shiftOutput > 0 ? ` (+${input.shiftOutput} ${s.unit || 'units'} today)` : '';
            const runRateStr = metrics.dailyAverage > 0 ? ` [Avg: ${metrics.formattedRate}]` : '';
            const holdStr = s.isHoldPoint ? (s.holdPointSignOff?.approved ? ` [🔒 QA Cleared: ${s.holdPointSignOff.signedBy}]` : ' [🔒 QA Hold Point Pending]') : '';
            const noteStr = input?.notes?.trim() ? `\n      Remarks: "${input.notes.trim()}"` : '';

            return `  ${s.status === 'Completed' ? '[✓]' : s.status === 'In Progress' ? '[►]' : '[ ]'} #${idx + 1} ${s.title} (${s.category || 'General'}) - ${s.status}${shiftGain} [Total: ${s.completedQuantity || 0}/${s.targetQuantity || 0} ${s.unit || ''}]${runRateStr}${s.isMilestone ? ' 🎯 Milestone' : ''}${holdStr}${noteStr}`;
          }).join('\n')
        : '  No WBS subtasks listed for this activity.';

      const detailedSupervisorNotes = `DAILY ACTIVITY PROGRESS SNAPSHOT: ${updatedActivity.name} (${updatedActivity.id})
================================================================================
Project: ${projectName}
Discipline / Package: ${updatedActivity.discipline || 'General'} • ${updatedActivity.workPackage || 'N/A'}
Date Logged: ${todayStr}
${logProgressDelayReason ? `Site Blocker / Delay Tag: ${logProgressDelayReason}\n` : ''}
1. OVERALL PROGRESS & QUANTITIES:
• Current Status: ${finalStatus} (${finalProgress}% Complete)
• Output Measured: ${finalActualQty} / ${updatedActivity.targetQuantity || 0} ${updatedActivity.unit || 'units'}
• Actual Hours Logged: ${calculatedActualHours} hrs
• Priority Level: ${updatedActivity.priority || 'Medium'}

2. FIELD REMARKS & OBSERVATIONS:
${logProgressNotes.trim() || 'Daily site progress logged and verified on site.'}

3. SUBTASK & GRANULAR EXECUTION BREAKDOWN (${subtasksCompletedCount}/${subtasksToSave.length} Completed):
${subtaskSummaryLines}

4. CREW & MACHINERY ALLOCATED ON TASK:
• Assigned Personnel (${assignedLabour.length || 1}): ${labourSummary}
• Assigned Machinery (${assignedEquipment.length}): ${equipmentSummary}
• Allocated Materials: ${materialsSummary}

5. ENVIRONMENTAL & SITE CONDITIONS:
• Weather: ${logProgressWeather} (${logProgressTemp})
• Site Condition: ${logProgressSiteConditions}`;

      const manpowerBreakdown = assignedLabour.length > 0
        ? assignedLabour.map(l => ({ trade: l.role || 'Labour', count: 1, hours: l.hours || 8 }))
        : [{ trade: updatedActivity.discipline || 'General Labour', count: 1, hours: calculatedActualHours || 8 }];

      const equipmentLogged = assignedEquipment.map(eq => ({
        equipmentId: eq.equipmentId || eq.id || 'EQ-01',
        hours: 8,
        status: 'Operating'
      }));

      const newDailyReport: DailyReport = {
        id: `RPT-${Date.now()}`,
        date: todayStr,
        projectId: updatedActivity.projectId,
        weather: logProgressWeather,
        temperature: logProgressTemp,
        siteConditions: logProgressSiteConditions,
        significantEvents: logProgressNotes.trim() 
          ? `Progress logged on ${updatedActivity.name}: ${finalProgress}% (${finalStatus})`
          : `Daily progress record for ${updatedActivity.name}`,
        workersOnSite: assignedLabour.length || 1,
        equipmentRunning: assignedEquipment.length || (assignedEquipment.length === 0 ? 0 : 1),
        incidents: 0,
        ncr: 0,
        activitiesLogged: [
          `${updatedActivity.name} (${updatedActivity.id}) - ${finalProgress}% - ${finalActualQty} ${updatedActivity.unit || 'units'}`
        ],
        manpowerBreakdown,
        equipmentLogged,
        photos: updatedActivity.photos || [],
        supervisorNotes: detailedSupervisorNotes,
      };

      addReport(newDailyReport);
    }

    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: activity.projectId,
      userId: userRole === 'Manager' ? 'Current User' : 'Current User',
      action: 'Progress & Daily Report Logged',
      details: `Logged progress for Activity "${activity.name}" (${activity.id}): ${finalProgress}%, ${finalActualQty} ${activity.unit || 'units'} completed. Subtasks updated with daily averages. Daily report posted to Reports.`,
      timestamp: new Date().toISOString()
    });

    setIsLogProgressModalOpen(false);
    setLogProgressNotes('');
  };

  const handleAddMaterialAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const matObj = materials.find(m => m.id === selectedMaterialId);
    const matName = matObj ? matObj.name : (selectedMaterialId || 'Site Material');
    const matUnit = matObj ? matObj.unit : 'pcs';

    const newAssignment: TaskMaterialAssignment = {
      id: `TMA-${Date.now()}`,
      materialId: selectedMaterialId || `MAT-${Date.now()}`,
      name: matName,
      quantity: Number(assignMaterialQty) || 1,
      unit: matUnit,
      assignedDate: new Date().toISOString().split('T')[0],
      notes: assignMaterialNotes,
    };

    const updatedMaterials = [newAssignment, ...(activity.assignedMaterials || [])];
    const updatedActivity = { ...activity, assignedMaterials: updatedMaterials };
    setActivity(updatedActivity);
    if (onSave) onSave(updatedActivity);
    else updateActivity(updatedActivity);

    if (addAllocation) {
      addAllocation({
        id: `RES-${newAssignment.id}`,
        projectId: activity.projectId,
        activityId: activity.id,
        materialId: newAssignment.materialId,
        resourceType: 'Material',
        name: matName,
        quantity: newAssignment.quantity,
        unit: matUnit,
        status: 'Allocated',
        assignedDate: newAssignment.assignedDate,
        notes: assignMaterialNotes
      });
    }

    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: activity.projectId,
      userId: userRole === 'Manager' ? 'Current User' : 'Current User',
      action: 'Material Assigned to Task',
      details: `Assigned ${assignMaterialQty} ${matUnit} of ${matName} to Task "${activity.name}" (${activity.id})`,
      timestamp: new Date().toISOString()
    });

    setIsAssignModalOpen(false);
    setAssignMaterialNotes('');
  };

  const handleAddLabourAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedHours = Number(assignLabourHours) || 8;
    const todayStr = new Date().toISOString().split('T')[0];

    const newAssignmentsToAdd: TaskLabourAssignment[] = [];

    if (selectedEmployeeId && selectedEmployeeId !== 'CUSTOM') {
      const empObj = employees.find(emp => emp.id === selectedEmployeeId);
      const workerName = empObj ? `${empObj.firstName} ${empObj.lastName}` : (customWorkerName || 'Site Worker');
      const workerRole = empObj ? empObj.position : (assignLabourRole || 'Site Worker');

      if (isEmployeeAlreadyAssigned(normalizedLabour, selectedEmployeeId, workerName)) {
        alert(`Notice: ${workerName} is already allocated to this task.`);
        return;
      }

      const autoLabourLogId = `LAB-AUTO-${Date.now()}`;
      newAssignmentsToAdd.push({
        id: `TLA-${selectedEmployeeId || Date.now()}`,
        employeeId: selectedEmployeeId,
        name: workerName,
        role: workerRole,
        hours: assignedHours,
        startDate: todayStr,
        notes: assignLabourNotes,
        labourLogId: autoLabourLogId
      });

      // Auto-register onto Labour Tracking Panel if not already logged today
      const logCheck = getLoggedHoursForWorker(labourLogs, activity.id, workerName, todayStr);
      if (!logCheck.isLogged) {
        addLabourLog({
          id: autoLabourLogId,
          projectId: activity.projectId,
          activityId: activity.id,
          date: todayStr,
          workerType: workerRole,
          workerName: workerName,
          startTime: '08:00',
          endTime: '16:00',
          hours: assignedHours,
          hoursWorked: assignedHours,
          notes: `Allocated to task "${activity.name}" (${assignedHours}h/shift)`
        });
      }
    } else {
      // Custom worker name entry (supports single or comma-separated lists)
      const rawInput = customWorkerName || 'Site Worker';
      const names = rawInput.split(',').map(s => s.trim()).filter(Boolean);

      if (names.length === 0) {
        alert('Please enter a worker name.');
        return;
      }

      const addedNames: string[] = [];
      names.forEach((singleName, idx) => {
        const empMatch = employees.find(emp => `${emp.firstName} ${emp.lastName}`.toLowerCase() === singleName.toLowerCase());
        const empId = empMatch?.id;
        const finalName = empMatch ? `${empMatch.firstName} ${empMatch.lastName}` : singleName;
        const finalRole = empMatch?.position || assignLabourRole || 'Site Worker';

        if (!isEmployeeAlreadyAssigned(normalizedLabour, empId, finalName) && !addedNames.includes(finalName.toLowerCase())) {
          addedNames.push(finalName.toLowerCase());
          const autoLabourLogId = `LAB-AUTO-${Date.now()}-${idx}`;
          newAssignmentsToAdd.push({
            id: `TLA-${empId || Date.now()}-${idx}`,
            employeeId: empId,
            name: finalName,
            role: finalRole,
            hours: assignedHours,
            startDate: todayStr,
            notes: assignLabourNotes,
            labourLogId: autoLabourLogId
          });

          const logCheck = getLoggedHoursForWorker(labourLogs, activity.id, finalName, todayStr);
          if (!logCheck.isLogged) {
            addLabourLog({
              id: autoLabourLogId,
              projectId: activity.projectId,
              activityId: activity.id,
              date: todayStr,
              workerType: finalRole,
              workerName: finalName,
              startTime: '08:00',
              endTime: '16:00',
              hours: assignedHours,
              hoursWorked: assignedHours,
              notes: `Allocated to task "${activity.name}" (${assignedHours}h/shift)`
            });
          }
        }
      });

      if (newAssignmentsToAdd.length === 0) {
        alert('All specified workers are already allocated to this task.');
        return;
      }
    }

    const updatedLabour = [...newAssignmentsToAdd, ...normalizedLabour];
    const updatedActivity = { ...activity, assignedLabour: updatedLabour };
    setActivity(updatedActivity);
    if (onSave) onSave(updatedActivity);
    else updateActivity(updatedActivity);

    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: activity.projectId,
      userId: userRole === 'Manager' ? 'Current User' : 'Current User',
      action: 'Labour Assigned to Task',
      details: `Assigned ${newAssignmentsToAdd.map(a => `${a.name} (${a.role})`).join(', ')} to Task "${activity.name}" (${activity.id})`,
      timestamp: new Date().toISOString()
    });

    setIsAssignModalOpen(false);
    setCustomWorkerName('');
    setAssignLabourNotes('');
  };

  const handleAddEquipmentAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const eqObj = equipment.find(eq => eq.id === selectedEquipmentId);
    const eqName = eqObj ? eqObj.name : 'Site Equipment';
    const assignedOperator = assignEqOperator || eqObj?.operator || 'Assigned Operator';
    const autoEqLogId = `EQL-AUTO-${Date.now()}`;

    const newAssignment: TaskEquipmentAssignment = {
      id: `TEA-${Date.now()}`,
      equipmentId: selectedEquipmentId || `EQ-${Date.now()}`,
      name: eqName,
      operator: assignedOperator,
      startDate: new Date().toISOString().split('T')[0],
      notes: assignEqNotes,
      equipmentLogId: autoEqLogId
    };

    // Automatically register onto Equipment Hour Tracking Panel
    addEquipmentLog({
      id: autoEqLogId,
      equipmentId: newAssignment.equipmentId,
      activityId: activity.id,
      activityName: activity.name,
      projectId: activity.projectId,
      type: 'Hours',
      date: newAssignment.startDate,
      loggedBy: currentUserProfile?.name || 'Site Supervisor',
      hoursAdded: 8,
      hours: 8,
      startTime: '08:00',
      endTime: '16:00',
      driverOperator: assignedOperator,
      operator: assignedOperator,
      status: 'Operating',
      setStatus: 'Operating',
      notes: `Allocated to task "${activity.name}" (8 hrs shift)`
    });

    const updatedEquipment = [newAssignment, ...(activity.assignedEquipment || [])];
    const updatedActivity = { ...activity, assignedEquipment: updatedEquipment };
    setActivity(updatedActivity);
    if (onSave) onSave(updatedActivity);
    else updateActivity(updatedActivity);

    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: activity.projectId,
      userId: userRole === 'Manager' ? 'Current User' : 'Current User',
      action: 'Equipment Assigned to Task',
      details: `Assigned equipment ${eqName} to Task "${activity.name}" (${activity.id}) and registered on Equipment Hour Tracking`,
      timestamp: new Date().toISOString()
    });

    setIsAssignModalOpen(false);
    setAssignEqOperator('');
    setAssignEqNotes('');
  };

  const handleRemoveMaterialAssignment = (assignmentId: string) => {
    const updated = (activity.assignedMaterials || []).filter(m => m.id !== assignmentId);
    const updatedActivity = { ...activity, assignedMaterials: updated };
    setActivity(updatedActivity);
    if (onSave) onSave(updatedActivity);
    else updateActivity(updatedActivity);
  };

  const handleRemoveLabourAssignment = (assignmentId: string) => {
    const targetLabour = normalizedLabour.find(l => l.id === assignmentId);
    if (targetLabour?.labourLogId) {
      deleteLabourLog(targetLabour.labourLogId);
    }
    const updated = normalizedLabour.filter(l => l.id !== assignmentId);
    const updatedActivity = { ...activity, assignedLabour: updated };
    setActivity(updatedActivity);
    if (onSave) onSave(updatedActivity);
    else updateActivity(updatedActivity);
  };

  const handleRemoveEquipmentAssignment = (assignmentId: string) => {
    const targetEquipment = (activity.assignedEquipment || []).find(e => e.id === assignmentId);
    if (targetEquipment?.equipmentLogId) {
      deleteEquipmentLog(targetEquipment.equipmentLogId);
    }
    const updated = (activity.assignedEquipment || []).filter(e => e.id !== assignmentId);
    const updatedActivity = { ...activity, assignedEquipment: updated };
    setActivity(updatedActivity);
    if (onSave) onSave(updatedActivity);
    else updateActivity(updatedActivity);
  };

  const handleAttachPhoto = (dataUrl: string) => {
    const updatedPhotos = [dataUrl, ...(activity.photos || [])];
    const updatedActivity = { ...activity, photos: updatedPhotos };
    setActivity(updatedActivity);
    
    // Automatically persist photo update
    if (onSave) {
      onSave(updatedActivity);
    }

    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: activity.projectId,
      userId: userRole === 'Manager' ? 'Current User' : 'Current User',
      action: 'Photo Attached',
      details: `Site progress photo captured and attached to Activity "${activity.name}" (${activity.id})`,
      timestamp: new Date().toISOString()
    });
  };

  const handleTagPhoto = (photoIndex: number, subtaskId: string) => {
    const updatedTags = { ...(activity.photoTags || {}) };
    if (subtaskId) {
      updatedTags[photoIndex] = subtaskId;
    } else {
      delete updatedTags[photoIndex];
    }
    const updatedActivity = { ...activity, photoTags: updatedTags };
    setActivity(updatedActivity);
    if (onSave) {
      onSave(updatedActivity);
    }
  };

  const handleDeletePhoto = (photoIndex: number) => {
    const updatedPhotos = [...(activity.photos || [])];
    updatedPhotos.splice(photoIndex, 1);
    
    // Shift photo tags
    const updatedPhotoTags: Record<number, string> = {};
    if (activity.photoTags) {
      Object.entries(activity.photoTags).forEach(([idxStr, taskId]) => {
        const idx = parseInt(idxStr, 10);
        if (idx < photoIndex) {
          updatedPhotoTags[idx] = taskId as string;
        } else if (idx > photoIndex) {
          updatedPhotoTags[idx - 1] = taskId as string;
        }
      });
    }

    const updatedActivity = { ...activity, photos: updatedPhotos, photoTags: updatedPhotoTags };
    setActivity(updatedActivity);
    if (previewPhoto === activity.photos?.[photoIndex]) {
      setPreviewPhoto(null);
    }
    if (onSave) {
      onSave(updatedActivity);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleAttachPhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostComment = () => {
    if (!newComment.trim()) return;

    const authorName = currentUserProfile?.name || (userRole === 'Admin' ? 'Administrator' : 'Current User');
    const authorId = currentUserProfile?.id || 'current-user';
    const authorRole = currentUserProfile?.role || userRole || 'Worker';
    const authorInitials = currentUserProfile?.initials || authorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const authorAvatar = currentUserProfile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authorName)}`;

    const comment: Comment = {
      id: `CMT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      author: authorName,
      userId: authorId,
      userRole: authorRole,
      userInitials: authorInitials,
      text: newComment.trim(),
      timestamp: new Date().toISOString(),
      avatar: authorAvatar
    };

    const updatedComments = [...(activity.comments || []), comment];
    const updatedActivity = { ...activity, comments: updatedComments };
    
    setActivity(updatedActivity);
    setNewComment('');
    
    if (onSave) {
      onSave(updatedActivity);
    } else {
      updateActivity(updatedActivity);
    }

    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: activity.projectId,
      userId: authorName,
      action: 'Comment Added',
      details: `Added comment on Activity "${activity.name}" (${activity.id}): "${comment.text.slice(0, 50)}${comment.text.length > 50 ? '...' : ''}"`,
      timestamp: new Date().toISOString()
    });
  };

  const handleDeleteComment = (commentId: string) => {
    const commentToDelete = (activity.comments || []).find(c => c.id === commentId);
    if (!commentToDelete) return;

    const currentUserName = currentUserProfile?.name || 'Current User';
    const currentUserId = currentUserProfile?.id;
    const isAuthor = (currentUserId && commentToDelete.userId === currentUserId) || 
      commentToDelete.author.toLowerCase() === currentUserName.toLowerCase();
    const isAdminOrManager = userRole === 'Admin' || userRole === 'Manager' || 
      currentUserProfile?.role === 'Admin' || currentUserProfile?.role === 'Manager';

    if (!isAuthor && !isAdminOrManager) {
      alert('Permission Denied: You can only delete your own comments.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    const updatedComments = (activity.comments || []).filter(c => c.id !== commentId);
    const updatedActivity = { ...activity, comments: updatedComments };

    setActivity(updatedActivity);
    if (onSave) {
      onSave(updatedActivity);
    } else {
      updateActivity(updatedActivity);
    }

    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: activity.projectId,
      userId: currentUserName,
      action: 'Comment Deleted',
      details: `Deleted comment by ${commentToDelete.author} on Activity "${activity.name}" (${activity.id})`,
      timestamp: new Date().toISOString()
    });
  };

  const handleStartEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text);
  };

  const handleSaveEditComment = (commentId: string) => {
    if (!editingCommentText.trim()) return;

    const updatedComments = (activity.comments || []).map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          text: editingCommentText.trim(),
          editedAt: new Date().toISOString()
        };
      }
      return c;
    });

    const updatedActivity = { ...activity, comments: updatedComments };
    setActivity(updatedActivity);
    setEditingCommentId(null);
    setEditingCommentText('');

    if (onSave) {
      onSave(updatedActivity);
    } else {
      updateActivity(updatedActivity);
    }
  };

  const handleUpdateChecklists = (updatedChecklists: ActivityChecklistItem[]) => {
    const updated = { ...activity, checklists: updatedChecklists };
    setActivity(updated);
    if (onSave) {
      onSave(updated);
    } else {
      updateActivity(updated);
    }

    const completedCount = updatedChecklists.filter(c => c.completed).length;
    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: activity.projectId,
      userId: currentUserProfile?.name || 'Current User',
      action: 'Prerequisites Checklist Updated',
      details: `Updated prerequisites on "${activity.name}" (${activity.id}): ${completedCount}/${updatedChecklists.length} completed`,
      timestamp: new Date().toISOString()
    });
  };

  const handleInputChange = (field: keyof Activity, value: any) => {
    setActivity(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubtasksChange = (updatedSubtasks: SubTask[]) => {
    let calculatedProgress = activity.progress;
    let newStatus = activity.status;

    if (updatedSubtasks.length > 0) {
      let totalPercent = 0;
      updatedSubtasks.forEach(s => {
        const children = updatedSubtasks.filter(c => c.parentId === s.id);
        if (children.length > 0) {
          const childDone = children.filter(c => c.status === 'Completed').length;
          totalPercent += Math.round((childDone / children.length) * 100);
        } else if (s.targetQuantity && s.targetQuantity > 0) {
          totalPercent += Math.min(100, Math.round(((s.completedQuantity || 0) / s.targetQuantity) * 100));
        } else {
          totalPercent += s.status === 'Completed' ? 100 : s.status === 'In Progress' ? 50 : 0;
        }
      });
      calculatedProgress = Math.round(totalPercent / updatedSubtasks.length);
      
      const allSubtasksDone = updatedSubtasks.every(s => s.status === 'Completed');
      const allMilestonesDone = updatedSubtasks.filter(s => s.isMilestone).every(s => s.status === 'Completed');

      if (allSubtasksDone && allMilestonesDone && calculatedProgress === 100) {
        newStatus = 'Completed';
      } else if (calculatedProgress > 0) {
        newStatus = 'In Progress';
      } else {
        newStatus = 'Not Started';
      }
    }

    // Auto-sync workers and equipment from subtasks into activity resources & tracking panels
    let updatedAssignedLabour = [...(activity.assignedLabour || [])];
    let updatedAssignedEquipment = [...(activity.assignedEquipment || [])];

    updatedSubtasks.forEach(s => {
      const workersSet = new Set<string>();
      (s.assignedWorkers || []).forEach(w => { if (w && w.trim()) workersSet.add(w.trim()); });
      if (s.assignedPerson) {
        s.assignedPerson.split(',').map(p => p.trim()).filter(Boolean).forEach(p => workersSet.add(p));
      }
      const workers = Array.from(workersSet);

      workers.forEach(wName => {
        if (!wName || wName.trim() === '' || wName.includes(',')) return;
        const exists = updatedAssignedLabour.some(l => l.name.toLowerCase() === wName.toLowerCase());
        if (!exists) {
          const emp = employees.find(e => `${e.firstName} ${e.lastName}`.toLowerCase() === wName.toLowerCase());
          const autoLabId = `LAB-AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
          const newLab: TaskLabourAssignment = {
            id: `TLA-SUB-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            employeeId: emp?.id,
            name: wName,
            role: emp?.position || 'Site Worker',
            hours: 8,
            startDate: s.startDate || activity.startDate || new Date().toISOString().split('T')[0],
            notes: `Assigned via subtask "${s.title}"`,
            labourLogId: autoLabId
          };
          updatedAssignedLabour.push(newLab);

          // Register in Labour Tracking
          addLabourLog({
            id: autoLabId,
            projectId: activity.projectId,
            activityId: activity.id,
            date: newLab.startDate,
            workerType: newLab.role,
            workerName: wName,
            startTime: '08:00',
            endTime: '16:00',
            hours: 8,
            hoursWorked: 8,
            notes: `Assigned via subtask "${s.title}" on task "${activity.name}"`
          });
        }
      });

      const eqList = [...(s.assignedEquipmentList || []), ...(s.assignedEquipment ? [s.assignedEquipment] : [])];
      eqList.forEach(eqIdentifier => {
        if (!eqIdentifier || eqIdentifier.trim() === '') return;
        const exists = updatedAssignedEquipment.some(e => e.name.toLowerCase() === eqIdentifier.toLowerCase() || e.equipmentId === eqIdentifier);
        if (!exists) {
          const eqObj = equipment.find(e => e.name.toLowerCase() === eqIdentifier.toLowerCase() || e.id === eqIdentifier);
          const eqName = eqObj ? eqObj.name : eqIdentifier;
          const autoEqId = `EQL-AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
          const newEq: TaskEquipmentAssignment = {
            id: `TEA-SUB-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            equipmentId: eqObj?.id || `EQ-${Date.now()}`,
            name: eqName,
            operator: eqObj?.operator || 'Assigned Operator',
            startDate: s.startDate || activity.startDate || new Date().toISOString().split('T')[0],
            notes: `Allocated via subtask "${s.title}"`,
            equipmentLogId: autoEqId
          };
          updatedAssignedEquipment.push(newEq);

          // Register in Equipment Tracking
          addEquipmentLog({
            id: autoEqId,
            equipmentId: newEq.equipmentId,
            activityId: activity.id,
            activityName: activity.name,
            projectId: activity.projectId,
            type: 'Hours',
            date: newEq.startDate,
            loggedBy: currentUserProfile?.name || 'Site Supervisor',
            hoursAdded: 8,
            hours: 8,
            startTime: '08:00',
            endTime: '16:00',
            driverOperator: newEq.operator,
            operator: newEq.operator,
            status: 'Operating',
            setStatus: 'Operating',
            notes: `Allocated via subtask "${s.title}" on task "${activity.name}"`
          });
        }
      });
    });

    const updated = { 
      ...activity, 
      subtasks: updatedSubtasks,
      assignedLabour: updatedAssignedLabour,
      assignedEquipment: updatedAssignedEquipment,
      progress: calculatedProgress,
      status: newStatus
    };
    
    setActivity(updated);
    if (onSave) {
      onSave(updated);
    }
  };

  const handleSave = () => {
    const today = new Date().toISOString().split('T')[0];
    const newId = (activity.id || '').trim() || initialActivity.id;
    const oldId = initialActivity.id;

    const updated: Activity = {
      ...activity,
      id: newId,
      updatedAt: today,
      createdAt: activity.createdAt || activity.startDate || today
    };
    setActivity(updated);
    if (onSave) {
      onSave(updated, oldId);
    } else {
      updateActivity(updated, oldId);
    }
    setIsEditing(false);
  };

  const getStatusIcon = (status: ActivityStatus) => {
    switch (status) {
      case 'In Progress': return <PlayCircle className="h-4 w-4 text-[#0B5FFF]" />;
      case 'Completed': return <CheckCircle2 className="h-4 w-4 text-[#2E7D32]" />;
      case 'Blocked': return <AlertTriangle className="h-4 w-4 text-[#D32F2F]" />;
      case 'Not Started': return <XCircle className="h-4 w-4 text-[#F9A825]" />;
      default: return <Clock className="h-4 w-4 text-slate-500" />;
    }
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'Critical': return <Badge variant="danger" className="uppercase font-bold text-[10px]">Critical</Badge>;
      case 'High': return <Badge variant="warning" className="uppercase font-bold text-[10px]">High</Badge>;
      case 'Medium': return <Badge variant="default" className="uppercase font-bold text-[10px]">Medium</Badge>;
      case 'Low': return <Badge variant="outline" className="uppercase font-bold text-[10px]">Low</Badge>;
    }
  };

  const formatGps = (gps?: { lat: number; lng: number } | string) => {
    if (!gps) return 'Not recorded';
    if (typeof gps === 'string') return gps;
    return `${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)}`;
  };

  const copyGpsToClipboard = () => {
    const text = formatGps(activity.gpsLocation);
    navigator.clipboard.writeText(text);
    setCopiedGps(true);
    setTimeout(() => setCopiedGps(false), 2000);
  };

  const handleDownloadPDF = () => {
    try {
      const project = projects.find(p => p.id === activity.projectId);
      const doc = new jsPDF("p", "pt", "a4");
      doc.setFontSize(20);
      doc.setTextColor(11, 95, 255);
      doc.text(activity.name || "Activity Detail", 40, 40);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 40, 60);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Project: ${projects.find(p => p.id === activity.projectId)?.name || activity.projectId}`, 40, 90);
      doc.text(`Status: ${activity.status || "Not Started"}`, 40, 110);
      doc.text(`Priority: ${activity.priority || "Medium"}`, 40, 130);
      doc.text(`Assigned To: ${activity.assignedTo || "Unassigned"}`, 40, 150);
      doc.text(`Location: ${activity.location || "N/A"}`, 40, 170);
      doc.text(`Start Date: ${activity.startDate || "N/A"}`, 300, 90);
      doc.text(`End Date: ${activity.finishDate || "N/A"}`, 300, 110);
      doc.text(`Progress: ${activity.progress || 0}%`, 300, 130);
      doc.text("Description:", 40, 200);
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      const filename = `Activity_${activity.name?.replace(/\s+/g, "_")}_Detail.pdf`;
      const blob = doc.output('blob');
      saveOrShareFile({
        filename,
        blob,
        title: `Activity: ${activity.name}`,
        text: `Constructfield Activity Details: ${activity.name}`
      });
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full min-h-full p-4 sm:p-6 md:p-8 pb-28 sm:pb-36">
      {/* Top Header Bar (MD3 Top App Bar style) */}
      <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onClose ? onClose() : (window.history.length > 1 ? navigate(-1) : navigate('/activities'))} 
            className="rounded-xl"
            title="Go back to previous page"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold tracking-widest text-[#0B5FFF] dark:text-blue-400 uppercase">
                {activity.id}
              </span>
              <Badge variant="outline" className="text-[10px] font-bold uppercase">{activity.workPackage}</Badge>
              {getPriorityBadge(activity.priority)}
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-0.5">{activity.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && canEditActivities && (
            <Button 
              onClick={() => {
                const subtasks = activity.subtasks ? JSON.parse(JSON.stringify(activity.subtasks)) : [];
                setLogProgressActualQty(activity.actualQuantity || 0);
                setLogProgressActualHours(activity.actualHours || 0);
                setLogProgressPercent(activity.progress || 0);
                setLogProgressStatus(activity.status || 'Not Started');
                setLogProgressNotes('');
                setLogProgressDate(new Date().toISOString().split('T')[0]);
                setLogProgressWeather('Sunny');
                setLogProgressTemp('24°C');
                setLogProgressSiteConditions('Site dry and fully accessible');
                setLogProgressSubtasks(subtasks);
                setLogProgressPostReport(true);
                setLogProgressDelayReason('');

                // Granular Subtask Initialization
                const initialInputs: Record<string, any> = {};
                const initialSelectedIds: string[] = [];

                subtasks.forEach((st: SubTask) => {
                  initialInputs[st.id] = {
                    mode: 'shift',
                    shiftOutput: 0,
                    cumulativeOutput: st.completedQuantity || 0,
                    status: st.status || 'Not Started',
                    notes: '',
                    chainageSpan: st.chainage || '',
                    holdPointApproved: st.holdPointSignOff?.approved || false,
                    holdPointSignedBy: st.holdPointSignOff?.signedBy || currentUserProfile?.name || ''
                  };
                  if (st.status !== 'Completed') {
                    initialSelectedIds.push(st.id);
                  }
                });

                if (initialSelectedIds.length === 0 && subtasks.length > 0) {
                  initialSelectedIds.push(subtasks[0].id);
                }

                setLogProgressSubtaskInputs(initialInputs);
                setLogProgressSelectedSubtaskIds(initialSelectedIds);
                setLogProgressIsGranularMode(subtasks.length > 0);
                setIsLogProgressModalOpen(true);
              }} 
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 rounded-xl shadow-sm font-medium px-4"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Log Progress</span>
            </Button>
          )}
          {!isEditing && canEditActivities && (
            <Button onClick={() => setIsAssignModalOpen(true)} className="bg-[#0B5FFF] hover:bg-blue-600 text-white gap-2 rounded-xl shadow-sm font-medium px-4">
              <UserCheck className="h-4 w-4" />
              <span>Assign</span>
            </Button>
          )}
          {!isEditing && canEditActivities && onDuplicate && (
            <Button 
              variant="outline" 
              onClick={() => onDuplicate(activity)} 
              className="gap-2 rounded-xl text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
              title="Duplicate activity with resources and edit minor differences"
            >
              <Copy className="h-4 w-4" />
              <span>Duplicate</span>
            </Button>
          )}
          {!isEditing && canEditActivities && onDelete && (
            <Button variant="outline" onClick={() => onDelete(activity.id)} className="gap-2 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50">
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          )}
          {!isEditing && (
            <Button 
              variant="outline" 
              onClick={() => setIsAuditModalOpen(true)} 
              className="gap-2 rounded-xl text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              title="View full audit trail & changelog for this activity and its subtasks"
            >
              <History className="h-4 w-4 text-[#0B5FFF]" />
              <span>Audit Trail</span>
            </Button>
          )}
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsPrintModalOpen(true)} className="gap-2 rounded-xl">
              <FileText className="h-4 w-4" />
              <span>Print</span>
            </Button>
          )}
          {isEditable && canEditActivities && (
            isEditing ? (
              <Button onClick={handleSave} className="bg-[#0B5FFF] hover:bg-blue-700 text-white gap-2 rounded-xl">
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2 rounded-xl">
                <Edit3 className="h-4 w-4" />
                <span>Edit</span>
              </Button>
            )
          )}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - 2 Spans */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* General Information Card */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#0B5FFF]" />
                General Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Activity Code & ID */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Activity Code / ID
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={activity.id}
                    onChange={(e) => handleInputChange('id', e.target.value)}
                    placeholder="e.g. ACT-1179"
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent font-mono text-sm font-bold focus:outline-none focus:border-[#0B5FFF]"
                  />
                ) : (
                  <span className="inline-block font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[#0B5FFF] dark:text-blue-400 border border-slate-200 dark:border-slate-700">
                    {activity.id}
                  </span>
                )}
              </div>

              {/* Workstream Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Workstream
                </label>
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <select
                      value={activity.workstream === 'PTS_CONSTRUCTION' ? 'CONSTRUCTION' : (activity.workstream || 'CONSTRUCTION')}
                      onChange={(e) => {
                        const val = e.target.value as WorkstreamType;
                        handleInputChange('workstream', val);
                      }}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold focus:outline-none focus:border-[#0B5FFF]"
                    >
                      {Object.entries(WORKSTREAMS)
                        .filter(([key]) => key !== 'PTS_CONSTRUCTION')
                        .map(([key, config]) => (
                          <option key={key} value={key}>
                            {config.name} ({config.shortName})
                          </option>
                        ))}
                    </select>

                    {/* Custom Workstream input when CUSTOM is selected */}
                    {(activity.workstream === 'CUSTOM' || (!WORKSTREAMS[activity.workstream || ''] && activity.workstream)) && (
                      <input
                        type="text"
                        placeholder="Enter custom workstream (e.g. Mechanical Piping, Instrumentation, Water Plant...)"
                        value={activity.customWorkstream || (activity.workstream !== 'CUSTOM' ? activity.workstream : '') || ''}
                        onChange={(e) => {
                          handleInputChange('customWorkstream', e.target.value);
                        }}
                        className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:border-[#0B5FFF]"
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {(() => {
                      const wsKey = activity.workstream === 'PTS_CONSTRUCTION' ? 'CONSTRUCTION' : (activity.workstream || 'CONSTRUCTION');
                      const wsCfg = WORKSTREAMS[wsKey] || WORKSTREAMS.CONSTRUCTION;
                      const label = (activity.workstream === 'CUSTOM' && activity.customWorkstream) 
                        ? activity.customWorkstream 
                        : (activity.customWorkstream || wsCfg?.shortName || activity.workstream || 'Construction');

                      return (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${wsCfg?.badgeClass || 'bg-slate-100 text-slate-800'}`}>
                          {label}
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Activity Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={activity.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:border-[#0B5FFF]"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{activity.name}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Description</label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={activity.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:border-[#0B5FFF]"
                  />
                ) : (
                  <p className="text-sm text-slate-700 dark:text-slate-300">{activity.description || 'No description provided.'}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Work Package</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={activity.workPackage}
                    onChange={(e) => handleInputChange('workPackage', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:border-[#0B5FFF]"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{activity.workPackage}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Discipline & Category</label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Discipline"
                      value={activity.discipline}
                      onChange={(e) => handleInputChange('discipline', e.target.value)}
                      className="w-1/2 h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Category"
                      value={activity.category || ''}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-1/2 h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                    />
                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {activity.discipline} {activity.category ? `• ${activity.category}` : ''}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Assigned To (Team)</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={activity.assignedTo}
                    onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium">{activity.assignedTo}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Supervisor</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={activity.supervisor}
                    onChange={(e) => handleInputChange('supervisor', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{activity.supervisor}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subtasks & WBS Breakdown Card */}
          <SubTaskManager 
            subtasks={activity.subtasks || []} 
            onChange={handleSubtasksChange}
            readOnly={!isEditable}
            activityId={activity.id}
            activityName={activity.name}
            projectId={activity.projectId}
          />

          {/* Location & Spatial Data Card */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#0B5FFF]" />
                Spatial & Location Data
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Area / Zone</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={activity.area}
                    onChange={(e) => handleInputChange('area', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{activity.area}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Location Details</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={activity.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{activity.location || 'N/A'}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Chainage / Station</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={activity.chainage || ''}
                    onChange={(e) => handleInputChange('chainage', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{activity.chainage || 'N/A'}</p>
                )}
              </div>

              {/* GPS Coordinates Badge / Box */}
              <div className="sm:col-span-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-[#0B5FFF]">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">GPS Coordinates</span>
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                      {formatGps(activity.gpsLocation)}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={copyGpsToClipboard} className="h-8 rounded-lg gap-1.5 text-xs">
                  {copiedGps ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedGps ? 'Copied' : 'Copy GPS'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quantities & Schedule Card */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-[#0B5FFF]" />
                Quantities, Schedule & Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Progress Bar Section */}
              <div className="sm:col-span-2 bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <InteractiveProgress
                  progress={activity.progress}
                  status={activity.status}
                  isEditing={isEditing}
                  onProgressChange={(newProgress, newStatus) => {
                    handleInputChange('progress', newProgress);
                    if (newStatus !== activity.status) {
                      handleInputChange('status', newStatus);
                    }
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Target Quantity</label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={activity.targetQuantity}
                      onChange={(e) => handleInputChange('targetQuantity', Number(e.target.value))}
                      className="w-2/3 h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Unit"
                      value={activity.unit}
                      onChange={(e) => handleInputChange('unit', e.target.value)}
                      className="w-1/3 h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                    />
                  </div>
                ) : (
                  <p className="text-sm font-semibold">{activity.targetQuantity} {activity.unit}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Actual Quantity Logged</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={activity.actualQuantity}
                    onChange={(e) => handleInputChange('actualQuantity', Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                  />
                ) : (
                  <p className="text-sm font-semibold">{activity.actualQuantity} {activity.unit}</p>
                )}
              </div>

              <div className="sm:col-span-2 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Activity Dates & Timeline</label>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsCalendarModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#0B5FFF] dark:text-blue-400 text-xs font-semibold transition-colors border border-blue-200 dark:border-blue-800/50 shadow-sm"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>View Planning Calendar</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Date Created</span>
                    {isEditing ? (
                      <input
                        type="date"
                        value={activity.createdAt || activity.startDate || new Date().toISOString().split('T')[0]}
                        onChange={(e) => handleInputChange('createdAt', e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:border-[#0B5FFF]"
                      />
                    ) : (
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span>{activity.createdAt || activity.startDate || 'N/A'}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Date Started / To Start</span>
                    {isEditing ? (
                      <input
                        type="date"
                        value={activity.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:border-[#0B5FFF]"
                      />
                    ) : (
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>{activity.startDate || 'N/A'}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Target Finish Date</span>
                    {isEditing ? (
                      <input
                        type="date"
                        value={activity.finishDate}
                        onChange={(e) => handleInputChange('finishDate', e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:border-[#0B5FFF]"
                      />
                    ) : (
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span>{activity.finishDate || 'N/A'}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Date Edited</span>
                    {isEditing ? (
                      <input
                        type="date"
                        value={activity.updatedAt || new Date().toISOString().split('T')[0]}
                        onChange={(e) => handleInputChange('updatedAt', e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:border-[#0B5FFF]"
                      />
                    ) : (
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                        <span>{activity.updatedAt || 'Not edited yet'}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Planning Cycle</label>
                  {isEditing ? (
                    <select
                      value={activity.planningType || 'Project Duration'}
                      onChange={(e) => handleInputChange('planningType', e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm appearance-none"
                    >
                      <option value="Daily">Daily Target</option>
                      <option value="Weekly">Weekly Target</option>
                      <option value="Monthly">Monthly Target</option>
                      <option value="Project Duration">Overall Project Duration</option>
                    </select>
                  ) : (
                    <p className="text-sm font-semibold">{activity.planningType || 'Project Duration'}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Daily Target %</label>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={activity.dailyTargetPercentage || 0}
                        onChange={(e) => handleInputChange('dailyTargetPercentage', Number(e.target.value))}
                        className="w-24 h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                      />
                      <span className="text-xs text-slate-500">% per day</span>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold">{activity.dailyTargetPercentage || 0}% <span className="text-xs text-slate-400 font-normal">per day</span></p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Daily Target Qty</label>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={activity.dailyTargetQuantity || 0}
                        onChange={(e) => handleInputChange('dailyTargetQuantity', Number(e.target.value))}
                        className="w-24 h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                      />
                      <span className="text-xs text-slate-500">{activity.unit || 'units'}/day</span>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold">{activity.dailyTargetQuantity || 0} {activity.unit || 'units'} <span className="text-xs text-slate-400 font-normal">per day</span></p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Planned vs Actual Hours</label>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={activity.plannedHours || 0}
                      onChange={(e) => handleInputChange('plannedHours', Number(e.target.value))}
                      className="w-24 h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                    />
                    <span className="text-xs text-slate-500">hrs planned</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{activity.plannedHours || 0} hrs planned</span>
                    <span>/</span>
                    <span className="font-bold text-[#0B5FFF]">{calculatedActualHours} hrs actual</span>
                  </div>
                )}
              </div>

              {/* Planning Schedule Calendar Modal */}
              <PlanningCalendar
                isOpen={isCalendarModalOpen}
                onClose={() => setIsCalendarModalOpen(false)}
                activity={activity}
              />

            </CardContent>
          </Card>

          {/* Assigned Resources Card (Material, Labour & Equipment) */}
          <Card className="rounded-2xl border border-blue-100 dark:border-slate-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-[#0B5FFF]" />
                Assigned Task Resources
              </CardTitle>
              <Button size="sm" onClick={() => setIsAssignModalOpen(true)} className="bg-[#0B5FFF] hover:bg-blue-600 text-white text-xs gap-1.5 rounded-xl font-medium px-3">
                <Plus className="h-3.5 w-3.5" /> Assign Resources
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Materials Assigned */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-blue-500" /> Allocated Materials ({activity.assignedMaterials?.length || 0})
                </h4>
                {(!activity.assignedMaterials || activity.assignedMaterials.length === 0) ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    No materials assigned to this task. Click "Assign Resources" above to assign inventory items.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activity.assignedMaterials.map(mat => (
                      <div key={mat.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
                            <Package className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{mat.name}</p>
                            <p className="text-[11px] text-slate-500">Assigned: <span className="font-semibold text-[#0B5FFF]">{mat.quantity} {mat.unit}</span></p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveMaterialAssignment(mat.id)} className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Labour Assigned */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-emerald-500" /> Allocated Labour & Personnel ({normalizedLabour.length})
                </h4>
                {normalizedLabour.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    No specific personnel assigned yet. Click "Assign Resources" to assign crew or workers.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {normalizedLabour.map(lab => (
                      <div key={lab.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {getPersonInitials(lab.name)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{lab.name}</p>
                            <p className="text-[11px] text-slate-500">{lab.role} • <span className="font-semibold text-emerald-600 dark:text-emerald-400">{lab.hours} hrs/shift</span></p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveLabourAssignment(lab.id)} className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg" title="Remove worker from task">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Equipment Assigned */}
              <div>
                <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-amber-500" /> Allocated Equipment ({activity.assignedEquipment?.length || 0})
                  </h4>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${resourceVitality.badgeClass}`}>
                    {resourceVitality.status === 'OPTIMAL' && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                    {resourceVitality.status === 'CONFLICT' && <AlertTriangle className="h-3 w-3 text-red-600" />}
                    {resourceVitality.status === 'WARNING' && <Clock className="h-3 w-3 text-amber-600" />}
                    {resourceVitality.label}
                  </span>
                </div>

                {(!activity.assignedEquipment || activity.assignedEquipment.length === 0) ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    No heavy equipment allocated to this task. Click "Assign Resources" to assign machinery.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activity.assignedEquipment.map(eq => {
                      const matchedConflict = resourceVitality.conflicts.find(c => 
                        (c.resourceId && eq.equipmentId && c.resourceId.toLowerCase() === eq.equipmentId.toLowerCase()) ||
                        (c.resourceName && c.resourceName.toLowerCase().trim() === eq.name.toLowerCase().trim())
                      );

                      return (
                        <div 
                          key={eq.id} 
                          className={`flex flex-col justify-between p-3 rounded-xl border transition-all ${
                            matchedConflict 
                              ? 'bg-red-50/60 dark:bg-red-950/30 border-red-200 dark:border-red-800/60 shadow-xs' 
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                matchedConflict 
                                  ? 'bg-red-100 dark:bg-red-900/60 text-red-600' 
                                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'
                              }`}>
                                <Truck className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{eq.name}</p>
                                <p className="text-[11px] text-slate-500 truncate">Operator: <span className="font-semibold text-amber-600 dark:text-amber-400">{eq.operator || 'Assigned Operator'}</span></p>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => handleRemoveEquipmentAssignment(eq.id)} className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg shrink-0">
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          {matchedConflict && (
                            <div className="mt-2.5 pt-2 border-t border-red-200/80 dark:border-red-800/60 flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-red-700 dark:text-red-300 flex items-center gap-1 truncate">
                                <AlertOctagon className="h-3 w-3 shrink-0" />
                                {matchedConflict.type === 'EQUIPMENT_MAINTENANCE' ? 'Plant in Breakdown' : `Clash vs ${matchedConflict.conflictingActivityId || 'other task'}`}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSwappingConflict(matchedConflict)}
                                className="h-6 text-[10px] font-bold px-2 rounded-lg bg-white dark:bg-slate-900 text-[#0B5FFF] border-blue-200 dark:border-blue-800 hover:bg-blue-50"
                              >
                                Swap Plant
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Living Resource Vitality & Contention Radar Section */}
              <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-[#0B5FFF]" />
                    <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                      Living Resource Vitality & Site Contention Radar
                    </h4>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${resourceVitality.badgeClass}`}>
                    {resourceVitality.status === 'OPTIMAL' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                    {resourceVitality.status === 'CONFLICT' && <AlertOctagon className="h-3.5 w-3.5 text-red-600" />}
                    {resourceVitality.status === 'WARNING' && <Clock className="h-3.5 w-3.5 text-amber-600" />}
                    {resourceVitality.label}
                  </span>
                </div>

                {resourceVitality.conflicts.length > 0 ? (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold">Active Scheduling Collisions ({resourceVitality.conflicts.length})</span>
                      <span className="text-[11px] font-mono text-slate-400">Window: {activity.startDate || 'N/A'} → {activity.finishDate || activity.startDate || 'N/A'}</span>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {resourceVitality.conflicts.map(conf => (
                        <div 
                          key={conf.id} 
                          className="p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                              conf.type === 'EQUIPMENT_CLASH' || conf.type === 'EQUIPMENT_MAINTENANCE'
                                ? 'bg-red-50 dark:bg-red-950/70 text-red-600 border border-red-100 dark:border-red-900/50'
                                : 'bg-amber-50 dark:bg-amber-950/70 text-amber-600 border border-amber-100 dark:border-amber-900/50'
                            }`}>
                              {conf.type === 'EQUIPMENT_MAINTENANCE' ? (
                                <Wrench className="h-4 w-4" />
                              ) : conf.type === 'EQUIPMENT_CLASH' ? (
                                <Truck className="h-4 w-4" />
                              ) : conf.type === 'OPERATOR_CLASH' ? (
                                <Truck className="h-4 w-4" />
                              ) : (
                                <Users className="h-4 w-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                                <span>{conf.resourceName}</span>
                                {conf.conflictingActivityId && (
                                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                    vs {conf.conflictingActivityId}
                                  </span>
                                )}
                                {conf.overlapDays ? (
                                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                    ({conf.overlapDays} days overlap)
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                                {conf.message}
                              </p>
                            </div>
                          </div>

                          {(conf.type === 'EQUIPMENT_CLASH' || conf.type === 'EQUIPMENT_MAINTENANCE') && (
                            <div className="shrink-0 self-end sm:self-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSwappingConflict(conf)}
                                className="h-7 text-xs font-bold gap-1.5 rounded-lg text-[#0B5FFF] border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                              >
                                <ArrowRightLeft className="h-3 w-3" /> Swap Plant
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>0 scheduling clashes detected. All assigned plant, operators, and workforce are unencumbered on site.</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Multi-Discipline Cross-Workstream Readiness Matrix */}
          <Card className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-b from-white to-indigo-50/20 dark:from-slate-900 dark:to-indigo-950/20 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-indigo-100/60 dark:border-indigo-900/40">
              <CardTitle className="text-sm font-bold uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#0B5FFF]" />
                Multi-Discipline Readiness & Handshake Matrix
              </CardTitle>
              {crossDisciplineData.actSpan && (
                <Badge variant="outline" className="text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                  📍 {crossDisciplineData.actSpan}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Independent workstream records linked to this construction task. Updates in Surveying, QA/QC, Materials, or Safety automatically synchronize here.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Surveying & Set-out */}
                <div className="p-3 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/60 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                      <Compass className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                      Surveying & Setting-Out
                    </span>
                    {crossDisciplineData.surveyItems.some(s => s.status === 'Completed') ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        ✅ Pegged & Cleared
                      </span>
                    ) : crossDisciplineData.surveyItems.length > 0 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                        🚀 In Progress
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        ⚪ Not Started
                      </span>
                    )}
                  </div>

                  {crossDisciplineData.surveyItems.length > 0 ? (
                    <div className="space-y-1 mt-1">
                      {crossDisciplineData.surveyItems.map((s, idx) => (
                        <div key={idx} className="text-xs p-2 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-sky-100 dark:border-sky-900/40">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{s.title}</div>
                          {s.coords && <div className="text-[10px] font-mono text-slate-500">Coords: {s.coords}</div>}
                          {s.surveyor && <div className="text-[10px] text-slate-500">Surveyor: {s.surveyor}</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No survey record bound to this section yet.</p>
                  )}
                </div>

                {/* 2. QA/QC & Hold Points */}
                <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                      QA/QC Hold Points
                    </span>
                    {crossDisciplineData.qaItems.length > 0 ? (
                      crossDisciplineData.qaItems.some(q => q.status === 'Completed') ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          ✅ Signed Off
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          🛑 Hold Point Active
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        No Active Hold
                      </span>
                    )}
                  </div>

                  {crossDisciplineData.qaItems.length > 0 ? (
                    <div className="space-y-1 mt-1">
                      {crossDisciplineData.qaItems.map((q, idx) => (
                        <div key={idx} className="text-xs p-2 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-rose-100 dark:border-rose-900/40 flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{q.title}</div>
                            {q.inspector && <div className="text-[10px] text-slate-500">Inspector: {q.inspector}</div>}
                          </div>
                          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300">
                            {q.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No QA hold points pending for this section.</p>
                  )}
                </div>

                {/* 3. Materials & Supply */}
                <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      Materials & Ducts
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {crossDisciplineData.materialItems.length > 0 ? 'Batch Allocated' : 'Standard'}
                    </span>
                  </div>

                  {crossDisciplineData.materialItems.length > 0 ? (
                    <div className="space-y-1 mt-1">
                      {crossDisciplineData.materialItems.map((m, idx) => (
                        <div key={idx} className="text-xs p-2 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-amber-100 dark:border-amber-900/40">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{m.title}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No dedicated material batches linked.</p>
                  )}
                </div>

                {/* 4. Safety & HSE */}
                <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      Safety & Permits
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Permit Cleared
                    </span>
                  </div>
                  <div className="text-xs p-2 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-emerald-100 dark:border-emerald-900/40">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">Daily Trenching & Excavation Permit</div>
                    <div className="text-[10px] text-slate-500">Site Risk Assessment Active & PPE Mandated</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dependencies & Constraints */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-[#0B5FFF]" />
                Dependencies & Constraints
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Prerequisite Dependencies</label>
                {activity.dependencies && activity.dependencies.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {activity.dependencies.map((dep, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800">
                        {dep}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No dependencies linked</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Site Constraints & Blockers</label>
                {activity.constraints && activity.constraints.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {activity.constraints.map((c, idx) => (
                      <Badge key={idx} variant="danger" className="text-xs">
                        <ShieldAlert className="h-3 w-3 mr-1 inline" /> {c}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No active constraints</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Discussion / Comments */}
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#0B5FFF]" />
                Comments & Discussions
              </CardTitle>
              {activity.comments && activity.comments.length > 0 && (
                <Badge variant="outline" className="text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                  {activity.comments.length} {activity.comments.length === 1 ? 'Comment' : 'Comments'}
                </Badge>
              )}
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
              {/* Comment Thread List */}
              <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
                {activity.comments && activity.comments.length > 0 ? (
                  activity.comments.map(comment => {
                    const currentUserName = currentUserProfile?.name || 'Current User';
                    const currentUserId = currentUserProfile?.id;
                    const isAuthor = Boolean(
                      (currentUserId && comment.userId && comment.userId === currentUserId) || 
                      (comment.author && comment.author.toLowerCase() === currentUserName.toLowerCase())
                    );
                    const isAdminOrManager = userRole === 'Admin' || userRole === 'Manager' || 
                      currentUserProfile?.role === 'Admin' || currentUserProfile?.role === 'Manager';
                    const canDelete = isAuthor || isAdminOrManager;
                    const canEdit = isAuthor;
                    const isEditingThis = editingCommentId === comment.id;

                    const formattedDate = new Date(comment.timestamp).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });
                    const formattedTime = new Date(comment.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div key={comment.id} className="flex gap-3 group">
                        {comment.avatar ? (
                          <img 
                            src={comment.avatar} 
                            alt={comment.author} 
                            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 object-cover" 
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-[#0B5FFF] font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                            {comment.userInitials || comment.author.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div className="flex-1 bg-slate-50 dark:bg-slate-800/80 rounded-2xl rounded-tl-none p-3.5 border border-slate-200/80 dark:border-slate-700/80 relative transition-all">
                          <div className="flex justify-between items-start mb-1.5 gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                {comment.author}
                              </span>
                              {comment.userRole && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100/70 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300">
                                  {comment.userRole}
                                </span>
                              )}
                              {isAuthor && (
                                <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  You
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-medium text-slate-400">
                                {formattedDate} • {formattedTime}
                              </span>
                              {comment.editedAt && (
                                <span className="text-[9px] text-slate-400 italic">
                                  (edited)
                                </span>
                              )}

                              {/* Comment Actions (Edit & Delete) */}
                              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                {canEdit && !isEditingThis && (
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditComment(comment)}
                                    className="p-1 rounded text-slate-400 hover:text-[#0B5FFF] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                                    title="Edit Comment"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </button>
                                )}
                                {canDelete && !isEditingThis && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                    title={isAuthor ? "Delete Your Comment" : "Delete Comment (Manager/Admin)"}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Comment Content / Inline Edit */}
                          {isEditingThis ? (
                            <div className="flex flex-col gap-2 mt-2">
                              <textarea
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF] min-h-[60px] resize-none"
                                autoFocus
                              />
                              <div className="flex justify-end items-center gap-1.5">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingCommentId(null)}
                                  className="h-7 text-xs px-2"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleSaveEditComment(comment.id)}
                                  className="h-7 text-xs px-3 bg-[#0B5FFF] hover:bg-blue-600 text-white font-bold"
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words leading-relaxed">
                              {comment.text}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center p-6 text-sm text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center gap-1.5">
                    <MessageSquare className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                    <span>No comments yet. Start the conversation with your team!</span>
                  </div>
                )}
              </div>

              {/* Comment Input Form */}
              <div className="flex items-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 mt-1">
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment, note, or update... (Press Enter to post)"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF] focus:border-[#0B5FFF] min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handlePostComment();
                      }
                    }}
                  />
                </div>
                <Button 
                  onClick={handlePostComment}
                  disabled={!newComment.trim()}
                  className="bg-[#0B5FFF] hover:bg-blue-600 text-white font-bold rounded-xl h-[60px] px-5 flex items-center gap-1.5 shrink-0"
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs font-bold">Post</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Labour Tracking */}
          <ActivityLabourTracking activityId={activity.id} projectId={activity.projectId} activity={activity} />

          {/* Equipment & Machinery Hour Tracking */}
          <ActivityEquipmentTracking activityId={activity.id} projectId={activity.projectId} activity={activity} />

        </div>

        {/* Right Column - 1 Span (Status, QR Codes, Media & Signatures) */}
        <div className="flex flex-col gap-6">
          
          {/* Status & Priority Overview Card */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider">
                Status & Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Activity Status</label>
                {isEditing ? (
                  <select
                    value={activity.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as ActivityStatus;
                      handleInputChange('status', newStatus);
                      if (newStatus === 'Completed') handleInputChange('progress', 100);
                      else if (newStatus === 'Not Started') handleInputChange('progress', 0);
                      else if (newStatus === 'In Progress' && activity.progress === 0) handleInputChange('progress', 10);
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm font-semibold"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    {getStatusIcon(activity.status)}
                    <span className="text-sm font-extrabold">{activity.status}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Priority Level</label>
                {isEditing ? (
                  <select
                    value={activity.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value as Priority)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm font-semibold"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                ) : (
                  <div>{getPriorityBadge(activity.priority)}</div>
                )}
              </div>

              {/* Resource Tracking Summary */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase text-slate-400">Resource Hours Logged</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 flex flex-col">
                    <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      <Users className="h-3 w-3 text-emerald-600" /> Labour Hours
                    </span>
                    <span className="text-base font-black text-emerald-950 dark:text-emerald-100 mt-0.5">
                      {calculatedActualHours} <span className="text-xs font-medium text-emerald-600">hrs</span>
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex flex-col">
                    <span className="text-[10px] font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1">
                      <Truck className="h-3 w-3 text-blue-600" /> Machine Hours
                    </span>
                    <span className="text-base font-black text-blue-950 dark:text-blue-100 mt-0.5">
                      {calculatedMachineHours} <span className="text-xs font-medium text-blue-600">hrs</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* QR & Barcode Section */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Identification Tags</span>
                  <span className="text-[10px] font-semibold text-[#0B5FFF]">Click to Expand / Edit</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingQrCode(activity.qrCode || `QR-${activity.id}`);
                      setExpandedCodeTag('qr');
                    }}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/60 dark:bg-slate-800/50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 hover:border-[#0B5FFF] flex items-center gap-2 text-left transition-all group"
                    title="Click to view full QR Code and edit code name"
                  >
                    <QrCode className="h-4 w-4 text-[#0B5FFF] group-hover:scale-110 transition-transform shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-[9px] text-slate-400 block font-semibold group-hover:text-[#0B5FFF]">QR Code 🔍</span>
                      <span className="text-xs font-mono font-bold truncate block text-slate-800 dark:text-slate-200">{activity.qrCode || `QR-${activity.id}`}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingBarcode(activity.barcode || `BC-${activity.id}`);
                      setExpandedCodeTag('barcode');
                    }}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/60 dark:bg-slate-800/50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 hover:border-[#0B5FFF] flex items-center gap-2 text-left transition-all group"
                    title="Click to view full Barcode and edit code name"
                  >
                    <Barcode className="h-4 w-4 text-[#0B5FFF] group-hover:scale-110 transition-transform shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-[9px] text-slate-400 block font-semibold group-hover:text-[#0B5FFF]">Barcode 🔍</span>
                      <span className="text-xs font-mono font-bold truncate block text-slate-800 dark:text-slate-200">{activity.barcode || `BC-${activity.id}`}</span>
                    </div>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prerequisites & Work Progression Checklist Panel */}
          <ActivityChecklistPanel
            activity={activity}
            onUpdateChecklists={handleUpdateChecklists}
            readOnly={!isEditable}
          />

          {/* Media & Attachments */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-[#0B5FFF]" />
                Media & Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              
              {/* Site Photos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-slate-400" /> Site Photos ({activity.photos?.length || 0})
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsCapturing(true)} 
                      className="h-7 text-[11px] rounded-lg px-2 gap-1 bg-[#0B5FFF]/10 text-[#0B5FFF] hover:bg-[#0B5FFF]/20 border-transparent font-medium"
                    >
                      <Camera className="h-3.5 w-3.5" /> Camera
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => fileInputRef.current?.click()} 
                      className="h-7 text-[11px] rounded-lg px-2 gap-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Upload className="h-3.5 w-3.5" /> Upload
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {activity.photos && activity.photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {activity.photos.map((photo, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900">
                        <img 
                          src={photo} 
                          alt={`Site photo ${idx + 1}`} 
                          className="h-28 w-full object-cover group-hover:scale-105 transition-transform cursor-pointer" 
                          onClick={() => setPreviewPhoto(photo)}
                        />
                        
                        {/* Tagged Task Badge (Visible when not hovering) */}
                        {activity.photoTags?.[idx] && (
                          <div className="absolute top-1.5 left-1.5 right-1.5 pointer-events-none group-hover:opacity-0 transition-opacity">
                            <span className="inline-block bg-blue-600/90 backdrop-blur-sm shadow-sm text-[9px] text-white px-2 py-0.5 rounded-full font-medium truncate max-w-full border border-blue-500/30">
                              <Tag className="h-2.5 w-2.5 inline-block mr-1 -mt-0.5 opacity-80"/>
                              {activity.subtasks?.find(t => t.id === activity.photoTags![idx])?.title || 'Tagged Task'}
                            </span>
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5 pointer-events-none group-hover:pointer-events-auto">
                          
                          {/* Top: Tag Dropdown */}
                          <div className="w-full">
                            <select
                              className="w-full text-[10px] py-1 px-1.5 rounded bg-white/20 hover:bg-white/30 text-white border-0 outline-none focus:ring-1 focus:ring-white/50 backdrop-blur-sm cursor-pointer appearance-none"
                              value={activity.photoTags?.[idx] || ''}
                              onChange={(e) => handleTagPhoto(idx, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="" className="text-slate-800">Assign to Task...</option>
                              {activity.subtasks?.map(t => (
                                <option key={t.id} value={t.id} className="text-slate-800">{t.title}</option>
                              ))}
                            </select>
                          </div>

                          {/* Bottom: Action Buttons */}
                          <div className="flex justify-center gap-2 mb-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewPhoto(photo);
                              }} 
                              className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-sm transition-colors"
                              title="View Photo"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePhoto(idx);
                              }} 
                              className="p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-lg backdrop-blur-sm transition-colors"
                              title="Delete Photo"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <span className="absolute bottom-1 right-1 bg-black/60 text-[9px] text-white px-1.5 py-0.5 rounded font-mono pointer-events-none group-hover:opacity-0 transition-opacity">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center text-xs text-slate-400 gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#0B5FFF]">
                      <Camera className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">No site progress photos</p>
                      <p className="text-[11px] text-slate-400">Capture or upload photos to document progress on site</p>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Button size="sm" onClick={() => setIsCapturing(true)} className="rounded-lg gap-1.5 bg-[#0B5FFF] text-xs">
                        <Camera className="h-3.5 w-3.5" /> Take Photo
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-lg gap-1.5 text-xs">
                        <Upload className="h-3.5 w-3.5" /> Upload File
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Voice Notes */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <Mic className="h-3.5 w-3.5 text-slate-400" /> Field Voice Notes ({activity.voiceNotes?.length || 0})
                  </label>
                  <button
                    onClick={() => setIsAddVoiceNoteOpen(true)}
                    className="text-[11px] font-bold text-[#0B5FFF] hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Voice Note
                  </button>
                </div>
                {activity.voiceNotes && activity.voiceNotes.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {activity.voiceNotes.map((note, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs flex items-center justify-between gap-2 border border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Mic className="h-3.5 w-3.5 text-[#0B5FFF] shrink-0" />
                          <span className="font-mono text-[11px] truncate">{note}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-xs text-slate-400 italic">No voice notes recorded</p>
                    <button
                      onClick={() => setIsAddVoiceNoteOpen(true)}
                      className="mt-1 text-[11px] font-semibold text-[#0B5FFF] hover:underline"
                    >
                      + Record / Type Voice Note
                    </button>
                  </div>
                )}
              </div>

              {/* Digital Signature */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <PenTool className="h-3.5 w-3.5 text-slate-400" /> Digital Sign-off
                  </label>
                  {!activity.digitalSignature && (
                    <button
                      onClick={() => setIsSignOffModalOpen(true)}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <CheckCircle2 className="h-3 w-3" /> Sign Off Activity
                    </button>
                  )}
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                  {activity.digitalSignature ? (
                    <div>
                      <span className="font-serif italic text-base font-bold text-slate-800 dark:text-slate-200 block">
                        {activity.digitalSignature}
                      </span>
                      <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider block mt-1">
                        ✓ Verified Sign-off Recorded
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs text-slate-400 italic block mb-1">Pending supervisor sign-off</span>
                      <Button
                        size="sm"
                        onClick={() => setIsSignOffModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 rounded-lg gap-1"
                      >
                        <PenTool className="h-3 w-3" /> Execute Digital Signature
                      </Button>
                    </div>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Field Remarks & Executive Summary */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#0B5FFF]" />
                Field Remarks & Notes
              </CardTitle>
              <button
                onClick={() => setIsAddRemarkModalOpen(true)}
                className="flex items-center gap-1 text-xs font-bold text-[#0B5FFF] hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add Remark
              </button>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <textarea
                  rows={4}
                  value={activity.remarks || ''}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                  placeholder="Enter supervisor notes or field observations..."
                />
              ) : (
                <div className="space-y-2">
                  {activity.remarks ? (
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs whitespace-pre-wrap text-slate-700 dark:text-slate-200 leading-relaxed font-sans">
                      {activity.remarks}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                      <p className="text-xs text-slate-400 italic mb-2">No field remarks recorded for this activity.</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsAddRemarkModalOpen(true)}
                        className="text-xs h-7 rounded-lg gap-1 text-[#0B5FFF] border-[#0B5FFF]/30"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Field Observation
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked Documents Hub Card */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-[#0B5FFF]" />
                Attached Documents ({((documents || []).filter(d => d.linkedActivityId === activity.id)).length})
              </CardTitle>
              <button
                onClick={() => navigate('/documents')}
                className="flex items-center gap-1 text-xs font-bold text-[#0B5FFF] hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Hub Register
              </button>
            </CardHeader>
            <CardContent>
              {(() => {
                const linked = (documents || []).filter(d => d.linkedActivityId === activity.id);
                if (linked.length === 0) {
                  return (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                      <p className="text-xs text-slate-400 italic mb-2">No technical documents or drawings attached to this activity.</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/documents')}
                        className="text-xs h-7 rounded-lg gap-1.5 text-[#0B5FFF] border-[#0B5FFF]/30"
                      >
                        <LinkIcon className="h-3 w-3" /> Link from Documents Hub
                      </Button>
                    </div>
                  );
                }
                return (
                  <div className="space-y-2">
                    {linked.map(doc => (
                      <div
                        key={doc.id}
                        onClick={() => navigate('/documents')}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-[#0B5FFF] cursor-pointer transition-all flex items-center justify-between gap-2 group"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-[#0B5FFF] transition-colors">
                            {doc.title}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                            <span>{doc.fileName}</span>
                            <span>•</span>
                            <span className="font-bold text-slate-600 dark:text-slate-300">{doc.category}</span>
                            <span>•</span>
                            <span className="text-emerald-600 font-semibold">{doc.status}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-[#0B5FFF] shrink-0">
                          {doc.version}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Activity Process Explainer & Acts Breakdown */}
          <ActivityExplainerBreakdown
            activity={activity}
            onUpdateActivity={(updatedActivity) => {
              setActivity(updatedActivity);
              if (onSave) onSave(updatedActivity);
              else updateActivity(updatedActivity);
            }}
            readOnly={!isEditable}
          />

        </div>

      </div>

      {/* EXPANDED IDENTIFICATION TAG MODAL (QR CODE & BARCODE) */}
      {expandedCodeTag && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {expandedCodeTag === 'qr' ? <QrCode className="h-5 w-5 text-[#0B5FFF]" /> : <Barcode className="h-5 w-5 text-[#0B5FFF]" />}
                  {expandedCodeTag === 'qr' ? 'Expanded QR Code Tag' : 'Expanded Barcode Tag'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{activity.id} • {activity.name}</p>
              </div>
              <button onClick={() => setExpandedCodeTag(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCodeTag} className="p-6 space-y-5">
              {/* Graphic Preview Card */}
              <div className="p-6 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner flex flex-col items-center justify-center text-center">
                {expandedCodeTag === 'qr' ? (
                  <div className="bg-white p-4 rounded-xl border-2 border-slate-900 shadow-sm flex flex-col items-center">
                    <svg className="w-40 h-40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Top-Left Finder Square */}
                      <rect x="5" y="5" width="25" height="25" fill="#090D16" />
                      <rect x="9" y="9" width="17" height="17" fill="white" />
                      <rect x="13" y="13" width="9" height="9" fill="#090D16" />

                      {/* Top-Right Finder Square */}
                      <rect x="70" y="5" width="25" height="25" fill="#090D16" />
                      <rect x="74" y="9" width="17" height="17" fill="white" />
                      <rect x="78" y="13" width="9" height="9" fill="#090D16" />

                      {/* Bottom-Left Finder Square */}
                      <rect x="5" y="70" width="25" height="25" fill="#090D16" />
                      <rect x="9" y="74" width="17" height="17" fill="white" />
                      <rect x="13" y="78" width="9" height="9" fill="#090D16" />

                      {/* Matrix Grid Data Patterns */}
                      <rect x="35" y="5" width="5" height="5" fill="#090D16" />
                      <rect x="45" y="5" width="10" height="5" fill="#090D16" />
                      <rect x="60" y="5" width="5" height="5" fill="#090D16" />
                      <rect x="35" y="15" width="15" height="5" fill="#090D16" />
                      <rect x="55" y="15" width="10" height="5" fill="#090D16" />

                      <rect x="5" y="35" width="10" height="5" fill="#090D16" />
                      <rect x="20" y="35" width="5" height="5" fill="#090D16" />
                      <rect x="30" y="35" width="15" height="5" fill="#090D16" />
                      <rect x="50" y="35" width="10" height="5" fill="#090D16" />
                      <rect x="65" y="35" width="15" height="5" fill="#090D16" />
                      <rect x="85" y="35" width="10" height="5" fill="#090D16" />

                      <rect x="10" y="45" width="5" height="10" fill="#090D16" />
                      <rect x="25" y="45" width="10" height="5" fill="#090D16" />
                      <rect x="40" y="45" width="15" height="10" fill="#090D16" />
                      <rect x="60" y="45" width="5" height="10" fill="#090D16" />
                      <rect x="75" y="45" width="15" height="5" fill="#090D16" />

                      <rect x="35" y="60" width="10" height="10" fill="#090D16" />
                      <rect x="50" y="60" width="5" height="5" fill="#090D16" />
                      <rect x="60" y="60" width="15" height="5" fill="#090D16" />
                      <rect x="80" y="60" width="15" height="10" fill="#090D16" />

                      <rect x="35" y="75" width="5" height="15" fill="#090D16" />
                      <rect x="45" y="75" width="15" height="5" fill="#090D16" />
                      <rect x="65" y="75" width="10" height="15" fill="#090D16" />
                      <rect x="80" y="75" width="15" height="5" fill="#090D16" />

                      <rect x="45" y="85" width="10" height="10" fill="#090D16" />
                      <rect x="80" y="85" width="10" height="10" fill="#090D16" />
                    </svg>
                    <span className="font-mono text-xs font-black tracking-widest text-slate-900 mt-2 block">
                      {editingQrCode}
                    </span>
                  </div>
                ) : (
                  <div className="bg-white p-5 rounded-xl border-2 border-slate-900 shadow-sm flex flex-col items-center w-full max-w-[280px]">
                    <svg className="w-full h-20" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="5" y="5" width="4" height="50" fill="#090D16" />
                      <rect x="11" y="5" width="2" height="50" fill="#090D16" />
                      <rect x="17" y="5" width="6" height="50" fill="#090D16" />
                      <rect x="27" y="5" width="2" height="50" fill="#090D16" />
                      <rect x="33" y="5" width="8" height="50" fill="#090D16" />
                      <rect x="45" y="5" width="4" height="50" fill="#090D16" />
                      <rect x="53" y="5" width="2" height="50" fill="#090D16" />
                      <rect x="59" y="5" width="6" height="50" fill="#090D16" />
                      <rect x="69" y="5" width="4" height="50" fill="#090D16" />
                      <rect x="77" y="5" width="8" height="50" fill="#090D16" />
                      <rect x="89" y="5" width="2" height="50" fill="#090D16" />
                      <rect x="95" y="5" width="6" height="50" fill="#090D16" />
                      <rect x="105" y="5" width="4" height="50" fill="#090D16" />
                      <rect x="113" y="5" width="2" height="50" fill="#090D16" />
                      <rect x="119" y="5" width="8" height="50" fill="#090D16" />
                      <rect x="131" y="5" width="4" height="50" fill="#090D16" />
                      <rect x="139" y="5" width="6" height="50" fill="#090D16" />
                      <rect x="149" y="5" width="2" height="50" fill="#090D16" />
                      <rect x="155" y="5" width="8" height="50" fill="#090D16" />
                      <rect x="167" y="5" width="4" height="50" fill="#090D16" />
                      <rect x="175" y="5" width="2" height="50" fill="#090D16" />
                      <rect x="181" y="5" width="6" height="50" fill="#090D16" />
                      <rect x="191" y="5" width="4" height="50" fill="#090D16" />
                    </svg>
                    <span className="font-mono text-sm font-black tracking-widest text-slate-900 mt-2 block">
                      {editingBarcode}
                    </span>
                  </div>
                )}
                <span className="text-[10px] text-slate-400 mt-2 font-medium">
                  {expandedCodeTag === 'qr' ? 'Scannable Site QR Code Tag' : 'Scannable Industrial Barcode Tag'}
                </span>
              </div>

              {/* Editable Code Name Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Edit Code Name / Tag Identifier *
                </label>
                {expandedCodeTag === 'qr' ? (
                  <input
                    type="text"
                    required
                    placeholder="e.g. QR-FOUNDATION-ZONE-A"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-mono font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    value={editingQrCode}
                    onChange={e => setEditingQrCode(e.target.value)}
                  />
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="e.g. BC-FOUNDATION-ZONE-A"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-mono font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    value={editingBarcode}
                    onChange={e => setEditingBarcode(e.target.value)}
                  />
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  Change this code identifier to match your company's custom tagging convention.
                </p>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const textToCopy = expandedCodeTag === 'qr' ? editingQrCode : editingBarcode;
                      navigator.clipboard.writeText(textToCopy);
                      setCopiedCodeTag(true);
                      setTimeout(() => setCopiedCodeTag(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
                  >
                    {copiedCodeTag ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedCodeTag ? 'Copied!' : 'Copy Code'}
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print Sticker Tag
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedCodeTag(null)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#0B5FFF] hover:bg-blue-600 text-white flex items-center gap-1 shadow-sm"
                  >
                    <Save className="h-3.5 w-3.5" /> Save Code Name
                  </button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 1: ADD VOICE NOTE MODAL */}
      {isAddVoiceNoteOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Mic className="h-5 w-5 text-[#0B5FFF]" /> Record / Add Voice Note
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Transcribe site observations or audio memos</p>
              </div>
              <button onClick={() => setIsAddVoiceNoteOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddVoiceNote} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Voice Note / Audio Observation *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Rebar spacing verified by senior inspector at 14:30. Foundation ready for pour..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900"
                  value={voiceNoteInput}
                  onChange={e => setVoiceNoteInput(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddVoiceNoteOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#0B5FFF] text-white flex items-center gap-1.5"
                >
                  <Mic className="h-4 w-4" /> Save Voice Note
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 2: DIGITAL SIGN-OFF MODAL */}
      {isSignOffModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-6 border-b border-emerald-100 dark:border-emerald-900/40 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                  <PenTool className="h-5 w-5 text-emerald-600" /> Digital Supervisor Sign-off
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">Formal verification & activity completion sign-off</p>
              </div>
              <button onClick={() => setIsSignOffModalOpen(false)} className="text-emerald-400 hover:text-emerald-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSignOffSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Supervisor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Miller"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 font-bold"
                  value={signerName}
                  onChange={e => setSignerName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Role / Certification Title</label>
                <input
                  type="text"
                  placeholder="e.g. Lead Site Engineer / Quality Auditor"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900"
                  value={signerRole}
                  onChange={e => setSignerRole(e.target.value)}
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[11px] text-slate-400 block mb-1">Preview Signature Stamp</span>
                <span className="font-serif italic text-lg font-bold text-slate-900 dark:text-white block">
                  {signerName ? `${signerName} (${signerRole})` : 'Signature Preview'}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                  Verified Date: {new Date().toISOString().split('T')[0]}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSignOffModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                >
                  <PenTool className="h-4 w-4" /> Execute Sign-off
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 3: ADD FIELD REMARK MODAL */}
      {isAddRemarkModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#0B5FFF]" /> Add Field Remark / Observation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Record daily details, safety notes, or technical observations</p>
              </div>
              <button onClick={() => setIsAddRemarkModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddRemarkSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Remark / Observation Details *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Concrete slump test verified at 110mm. Weather conditions clear. Site safety inspection passed."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900"
                  value={remarkInput}
                  onChange={e => setRemarkInput(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddRemarkModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#0B5FFF] text-white flex items-center gap-1.5"
                >
                  <Save className="h-4 w-4" /> Save Remark
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Camera Capture Modal */}
      {isCapturing && (
        <CameraCapture 
          onCapture={(dataUrl) => {
            handleAttachPhoto(dataUrl);
            setIsCapturing(false);
          }}
          onCancel={() => setIsCapturing(false)}
        />
      )}

      {/* Photo Preview Lightbox Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative max-w-4xl w-full flex flex-col items-center">
            <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
              <a
                href={previewPhoto}
                download={`activity-photo-${activity.id}.jpg`}
                className="p-2 bg-black/60 text-white hover:bg-black/80 rounded-full transition-colors"
                title="Download Photo"
              >
                <Download className="h-5 w-5" />
              </a>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="p-2 bg-black/60 text-white hover:bg-black/80 rounded-full transition-colors"
                title="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <img 
              src={previewPhoto} 
              alt="Site photo full preview" 
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl border border-slate-800"
            />
            <div className="mt-3 text-center text-xs text-slate-300 font-medium">
              Activity {activity.id} • {activity.name} • Site Progress Photo
            </div>
          </div>
        </div>
      )}

      {/* Task Resource Assignment Modal (Material, Labour, Equipment) */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700/60">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-[#0B5FFF]" /> Assign Resources to Task
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activity.id} - {activity.name}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/50 px-6 pt-3 gap-2">
              <button
                type="button"
                onClick={() => setAssignTab('Material')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-colors border-t border-x ${
                  assignTab === 'Material' 
                    ? 'bg-white dark:bg-[#1E293B] text-[#0B5FFF] dark:text-blue-400 border-slate-200 dark:border-slate-700 border-b-transparent' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-transparent'
                }`}
              >
                <Package className="h-3.5 w-3.5" /> Assign Material
              </button>
              <button
                type="button"
                onClick={() => setAssignTab('Labour')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-colors border-t border-x ${
                  assignTab === 'Labour' 
                    ? 'bg-white dark:bg-[#1E293B] text-emerald-600 dark:text-emerald-400 border-slate-200 dark:border-slate-700 border-b-transparent' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-transparent'
                }`}
              >
                <Users className="h-3.5 w-3.5" /> Assign Labour
              </button>
              <button
                type="button"
                onClick={() => setAssignTab('Equipment')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-colors border-t border-x ${
                  assignTab === 'Equipment' 
                    ? 'bg-white dark:bg-[#1E293B] text-amber-600 dark:text-amber-400 border-slate-200 dark:border-slate-700 border-b-transparent' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-transparent'
                }`}
              >
                <Truck className="h-3.5 w-3.5" /> Assign Equipment
              </button>
            </div>

            {/* Tab 1: Material Form */}
            {assignTab === 'Material' && (
              <form onSubmit={handleAddMaterialAssignment} className="p-6 overflow-y-auto space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Select Material from Inventory</label>
                  <select 
                    value={selectedMaterialId} 
                    onChange={e => setSelectedMaterialId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#0B5FFF]"
                  >
                    <option value="">-- Choose Inventory Item --</option>
                    {materials.map(mat => (
                      <option key={mat.id} value={mat.id}>{mat.name} ({mat.category}) - Available: {mat.receivedQuantity - mat.usedQuantity} {mat.unit}</option>
                    ))}
                    <option value="MAT-CUSTOM">Custom Material Entry...</option>
                  </select>
                </div>

                {selectedMaterialId === 'MAT-CUSTOM' && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Custom Material Name</label>
                    <input type="text" placeholder="e.g. Ready-mix Concrete Grade 30" onChange={e => setSelectedMaterialId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assigned Quantity</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={assignMaterialQty} 
                      onChange={e => setAssignMaterialQty(Number(e.target.value))} 
                      required 
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Unit of Measure</label>
                    <input 
                      type="text" 
                      value={materials.find(m => m.id === selectedMaterialId)?.unit || 'pcs'} 
                      disabled
                      className="w-full px-3 py-2 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-500 cursor-not-allowed" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assignment Notes / Batch Ref</label>
                  <textarea 
                    rows={2}
                    placeholder="e.g. Batch 4 for foundation raft pour"
                    value={assignMaterialNotes} 
                    onChange={e => setAssignMaterialNotes(e.target.value)} 
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white" 
                  />
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700/60 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-[#0B5FFF] hover:bg-blue-600 text-white">Assign Material</Button>
                </div>
              </form>
            )}

            {/* Tab 2: Labour Form */}
            {assignTab === 'Labour' && (
              <form onSubmit={handleAddLabourAssignment} className="p-6 overflow-y-auto space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Select Employee or Crew</label>
                  <select 
                    value={selectedEmployeeId} 
                    onChange={e => setSelectedEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees.map(emp => {
                      const isAssigned = isEmployeeAlreadyAssigned(normalizedLabour, emp.id, `${emp.firstName} ${emp.lastName}`);
                      return (
                        <option key={emp.id} value={emp.id} disabled={isAssigned}>
                          {emp.firstName} {emp.lastName} ({emp.position} - {emp.department}) {isAssigned ? '✓ (Already Allocated)' : ''}
                        </option>
                      );
                    })}
                    <option value="CUSTOM">Custom Worker or Multi-Artisan List (Comma-Separated)...</option>
                  </select>
                </div>

                {(!selectedEmployeeId || selectedEmployeeId === 'CUSTOM') && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Worker Name(s)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe, Jane Smith (auto-splits multiple workers)" 
                      value={customWorkerName} 
                      onChange={e => setCustomWorkerName(e.target.value)} 
                      required={!selectedEmployeeId}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white" 
                    />
                    <p className="text-[10px] text-slate-400">
                      Tip: You can enter multiple workers separated by commas (e.g. "Dimi Maphanga, Refumuni Malungane"). The system automatically creates separate individual allocations.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Role / Designation</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Steel Fixer / Site Tech" 
                      value={assignLabourRole} 
                      onChange={e => setAssignLabourRole(e.target.value)} 
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Allocated Hours / Shift</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={assignLabourHours} 
                      onChange={e => setAssignLabourHours(Number(e.target.value))} 
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Shift Notes & Responsibilities</label>
                  <textarea 
                    rows={2} 
                    placeholder="e.g. Responsible for rebar placement on Grid Line A"
                    value={assignLabourNotes} 
                    onChange={e => setAssignLabourNotes(e.target.value)} 
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white" 
                  />
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700/60 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">Assign Personnel</Button>
                </div>
              </form>
            )}

            {/* Tab 3: Equipment Form */}
            {assignTab === 'Equipment' && (
              <form onSubmit={handleAddEquipmentAssignment} className="p-6 overflow-y-auto space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Select Machinery / Equipment Fleet</label>
                  <select 
                    value={selectedEquipmentId} 
                    onChange={e => setSelectedEquipmentId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Choose Equipment Unit --</option>
                    {equipment.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.id} - {eq.name} ({eq.type} • {eq.status})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assigned Operator</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Dave Wilson" 
                    value={assignEqOperator} 
                    onChange={e => setAssignEqOperator(e.target.value)} 
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Allocation Notes</label>
                  <textarea 
                    rows={2} 
                    placeholder="e.g. Assigned for foundation excavation shift"
                    value={assignEqNotes} 
                    onChange={e => setAssignEqNotes(e.target.value)} 
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white" 
                  />
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700/60 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white">Assign Machinery</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Upgraded Granular Subtask & Shift Progress Modal */}
      {isLogProgressModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-800/40">
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Log Daily Shift Progress
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">{activity.id}</span>
                  {activity.workPackage && (
                    <Badge variant="outline" className="text-[10px] uppercase font-bold">{activity.workPackage}</Badge>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 truncate">
                  {activity.name}
                </h2>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsLogProgressModalOpen(false)} 
                className="rounded-full h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleLogProgressSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-6">
              {/* Mode Switcher: Granular Subtasks vs Macro Activity */}
              {logProgressSubtasks && logProgressSubtasks.length > 0 && (
                <div className="flex items-center justify-between p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 gap-1">
                  <button
                    type="button"
                    onClick={() => setLogProgressIsGranularMode(true)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      logProgressIsGranularMode 
                        ? 'bg-white dark:bg-slate-700 text-[#0B5FFF] shadow-xs' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Granular Subtasks Mode ({logProgressSelectedSubtaskIds.length} Active)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogProgressIsGranularMode(false)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      !logProgressIsGranularMode 
                        ? 'bg-white dark:bg-slate-700 text-[#0B5FFF] shadow-xs' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Direct Master Activity Progress</span>
                  </button>
                </div>
              )}

              {/* GRANULAR SUBTASKS LOGGING ENGINE */}
              {logProgressIsGranularMode && logProgressSubtasks && logProgressSubtasks.length > 0 ? (
                <div className="space-y-4">
                  {/* Subtask Quick Selector Chips */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <CheckSquare className="h-4 w-4 text-[#0B5FFF]" /> Select Subtasks Worked On Today
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setLogProgressSelectedSubtaskIds(logProgressSubtasks.map(s => s.id))}
                          className="text-[11px] font-semibold text-[#0B5FFF] hover:underline"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setLogProgressSelectedSubtaskIds(logProgressSubtasks.filter(s => s.status !== 'Completed').map(s => s.id))}
                          className="text-[11px] font-semibold text-slate-500 hover:underline"
                        >
                          Incomplete Only
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {logProgressSubtasks.map((st, idx) => {
                        const isSelected = logProgressSelectedSubtaskIds.includes(st.id);
                        return (
                          <button
                            key={st.id || idx}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setLogProgressSelectedSubtaskIds(logProgressSelectedSubtaskIds.filter(id => id !== st.id));
                              } else {
                                setLogProgressSelectedSubtaskIds([...logProgressSelectedSubtaskIds, st.id]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                              isSelected
                                ? 'bg-blue-50 dark:bg-blue-950/60 border-[#0B5FFF]/40 text-[#0B5FFF] dark:text-blue-300 shadow-xs ring-1 ring-[#0B5FFF]/20'
                                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isSelected ? 'bg-[#0B5FFF] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                            }`}>
                              {idx + 1}
                            </span>
                            <span className="truncate max-w-[180px]">{st.title}</span>
                            {st.targetQuantity ? (
                              <span className="text-[10px] font-mono text-slate-400">
                                ({st.completedQuantity || 0}/{st.targetQuantity}{st.unit ? ` ${st.unit}` : ''})
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Subtask Editor Cards */}
                  {logProgressSelectedSubtaskIds.length === 0 ? (
                    <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-900/30">
                      No subtasks selected. Click on the subtask pills above to log progress for today's shift.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {logProgressSubtasks
                        .filter(st => logProgressSelectedSubtaskIds.includes(st.id))
                        .map((st, idx) => {
                          const input = logProgressSubtaskInputs[st.id] || {
                            mode: 'shift',
                            shiftOutput: 0,
                            cumulativeOutput: st.completedQuantity || 0,
                            status: st.status || 'In Progress',
                            notes: '',
                            chainageSpan: st.chainage || '',
                            holdPointApproved: st.holdPointSignOff?.approved || false,
                            holdPointSignedBy: st.holdPointSignOff?.signedBy || currentUserProfile?.name || ''
                          };

                          const metrics = calculateSubtaskDailyAverage(st);
                          const prevQty = st.completedQuantity || 0;
                          const targetQty = st.targetQuantity || 0;
                          const newCalculatedTotal = input.mode === 'shift' 
                            ? prevQty + (Number(input.shiftOutput) || 0)
                            : (Number(input.cumulativeOutput) || 0);
                          const newPct = targetQty > 0 ? Math.min(100, Math.round((newCalculatedTotal / targetQty) * 100)) : 0;

                          return (
                            <div 
                              key={st.id || idx}
                              className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col gap-3.5"
                            >
                              {/* Subtask Card Header */}
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-[#0B5FFF] font-bold text-xs font-mono">
                                    #{logProgressSubtasks.findIndex(s => s.id === st.id) + 1}
                                  </span>
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                    {st.title}
                                  </h4>
                                  <Badge variant="outline" className="text-[10px]">{st.category || 'General'}</Badge>
                                </div>

                                <div className="flex items-center gap-2">
                                  {metrics.dailyAverage > 0 && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                      <Zap className="h-3 w-3 text-emerald-500" />
                                      {metrics.formattedRate}
                                    </span>
                                  )}

                                  <select
                                    value={input.status}
                                    onChange={(e) => {
                                      const updated = { ...logProgressSubtaskInputs };
                                      updated[st.id] = { ...input, status: e.target.value as any };
                                      setLogProgressSubtaskInputs(updated);
                                    }}
                                    className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200"
                                  >
                                    <option value="Not Started">Not Started</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                  </select>
                                </div>
                              </div>

                              {/* Shift Output Mode & Quantity Inputs */}
                              <div className="p-3 bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200/90 dark:border-slate-700/80 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-semibold">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = { ...logProgressSubtaskInputs };
                                        updated[st.id] = { ...input, mode: 'shift' };
                                        setLogProgressSubtaskInputs(updated);
                                      }}
                                      className={`px-2 py-1 rounded-md transition-all ${
                                        input.mode === 'shift' 
                                          ? 'bg-white dark:bg-slate-700 text-[#0B5FFF] font-bold shadow-xs' 
                                          : 'text-slate-500 hover:text-slate-800'
                                      }`}
                                    >
                                      + Today's Shift (+Δ)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = { ...logProgressSubtaskInputs };
                                        updated[st.id] = { ...input, mode: 'cumulative' };
                                        setLogProgressSubtaskInputs(updated);
                                      }}
                                      className={`px-2 py-1 rounded-md transition-all ${
                                        input.mode === 'cumulative' 
                                          ? 'bg-white dark:bg-slate-700 text-[#0B5FFF] font-bold shadow-xs' 
                                          : 'text-slate-500 hover:text-slate-800'
                                      }`}
                                    >
                                      Set Cumulative Total
                                    </button>
                                  </div>

                                  <span className="text-xs font-bold text-[#0B5FFF]">
                                    {newCalculatedTotal} {st.unit || 'units'} {targetQty > 0 ? `(${newPct}%)` : ''}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {input.mode === 'shift' ? (
                                    <div>
                                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                                        Today's Shift Output ({st.unit || 'units'})
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        placeholder="e.g. 150"
                                        value={input.shiftOutput || ''}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          const updated = { ...logProgressSubtaskInputs };
                                          const newTot = prevQty + val;
                                          const autoStatus = (targetQty > 0 && newTot >= targetQty) ? 'Completed' : (newTot > 0 ? 'In Progress' : input.status);
                                          updated[st.id] = { ...input, shiftOutput: val, cumulativeOutput: newTot, status: autoStatus };
                                          setLogProgressSubtaskInputs(updated);
                                        }}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-[#0B5FFF] focus:outline-none focus:border-[#0B5FFF]"
                                      />
                                    </div>
                                  ) : (
                                    <div>
                                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                                        Cumulative Output to Date ({st.unit || 'units'})
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={input.cumulativeOutput}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          const updated = { ...logProgressSubtaskInputs };
                                          const autoStatus = (targetQty > 0 && val >= targetQty) ? 'Completed' : (val > 0 ? 'In Progress' : input.status);
                                          updated[st.id] = { ...input, cumulativeOutput: val, shiftOutput: Math.max(0, val - prevQty), status: autoStatus };
                                          setLogProgressSubtaskInputs(updated);
                                        }}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-[#0B5FFF] focus:outline-none focus:border-[#0B5FFF]"
                                      />
                                    </div>
                                  )}

                                  <div>
                                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                                      Chainage / Section Span (Optional)
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="e.g. CH 0+150 to CH 0+300"
                                      value={input.chainageSpan || ''}
                                      onChange={(e) => {
                                        const updated = { ...logProgressSubtaskInputs };
                                        updated[st.id] = { ...input, chainageSpan: e.target.value };
                                        setLogProgressSubtaskInputs(updated);
                                      }}
                                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                                    />
                                  </div>
                                </div>

                                {/* Visual Mini Progress Bar */}
                                {targetQty > 0 && (
                                  <div className="space-y-1 pt-1">
                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                                      <div 
                                        className="h-full bg-blue-400" 
                                        style={{ width: `${Math.min(100, Math.round((prevQty / targetQty) * 100))}%` }} 
                                        title={`Previous: ${prevQty} ${st.unit}`}
                                      />
                                      {input.mode === 'shift' && input.shiftOutput > 0 && (
                                        <div 
                                          className="h-full bg-emerald-500 animate-pulse" 
                                          style={{ width: `${Math.min(100 - Math.round((prevQty / targetQty) * 100), Math.round((input.shiftOutput / targetQty) * 100))}%` }} 
                                          title={`Today's Gain: +${input.shiftOutput} ${st.unit}`}
                                        />
                                      )}
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-400">
                                      <span>Prior: {prevQty} {st.unit}</span>
                                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                                        Target: {targetQty} {st.unit}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* QA Hold Point Inspection Box */}
                              {st.isHoldPoint && (
                                <div className="p-3 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl space-y-2 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                                      <ShieldCheck className="h-4 w-4 text-rose-600" />
                                      QA Hold Point Sign-Off
                                    </span>
                                    <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-900 dark:text-rose-200">
                                      <input
                                        type="checkbox"
                                        checked={input.holdPointApproved}
                                        onChange={(e) => {
                                          const checked = e.target.checked;
                                          const updated = { ...logProgressSubtaskInputs };
                                          updated[st.id] = { 
                                            ...input, 
                                            holdPointApproved: checked,
                                            status: checked ? 'Completed' : input.status
                                          };
                                          setLogProgressSubtaskInputs(updated);
                                        }}
                                        className="h-4 w-4 text-emerald-600 rounded"
                                      />
                                      <span>Clear & Approve Hold Point</span>
                                    </label>
                                  </div>
                                  {input.holdPointApproved && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-rose-200/50">
                                      <input
                                        type="text"
                                        placeholder="Inspector / Signee Name"
                                        value={input.holdPointSignedBy}
                                        onChange={(e) => {
                                          const updated = { ...logProgressSubtaskInputs };
                                          updated[st.id] = { ...input, holdPointSignedBy: e.target.value };
                                          setLogProgressSubtaskInputs(updated);
                                        }}
                                        className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-lg text-xs"
                                      />
                                      <span className="text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1 font-semibold">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Ready for formal QA record
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Subtask Specific Remarks */}
                              <div>
                                <input
                                  type="text"
                                  placeholder="Subtask field remarks (e.g. Pegged western boundary, soil compacted to 98% Mod AASHTO)..."
                                  value={input.notes}
                                  onChange={(e) => {
                                    const updated = { ...logProgressSubtaskInputs };
                                    updated[st.id] = { ...input, notes: e.target.value };
                                    setLogProgressSubtaskInputs(updated);
                                  }}
                                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B5FFF]"
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* Master Activity Live Rollup Indicator Banner */}
                  {(() => {
                    // Preview rollup from simulated inputs
                    const simulatedSubtasks = logProgressSubtasks.map(st => {
                      const input = logProgressSubtaskInputs[st.id];
                      const isSelected = logProgressSelectedSubtaskIds.includes(st.id);
                      if (!isSelected || !input) return st;
                      const prev = st.completedQuantity || 0;
                      const newTot = input.mode === 'shift' ? prev + (Number(input.shiftOutput) || 0) : (Number(input.cumulativeOutput) || 0);
                      return {
                        ...st,
                        completedQuantity: newTot,
                        status: input.status
                      };
                    });
                    const previewRollup = calculateActivityRollupFromSubtasks(activity, simulatedSubtasks);

                    return (
                      <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/80 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                          <Sparkles className="h-4 w-4 text-[#0B5FFF]" />
                          <span>Auto Master Activity Rollup:</span>
                          <span className="text-[#0B5FFF] font-extrabold text-sm">{previewRollup.overallProgress}% Complete</span>
                          {activity.targetQuantity ? (
                            <span className="text-slate-500 font-normal">
                              ({previewRollup.actualQuantity} / {activity.targetQuantity} {activity.unit || 'units'})
                            </span>
                          ) : null}
                        </div>
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {previewRollup.completedSubtasksCount} / {previewRollup.totalSubtasksCount} Subtasks Completed
                        </span>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* MACRO ACTIVITY PROGRESS (Direct Completion Slider) */
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-2xl space-y-3.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                        <TrendingUp className="h-4 w-4 text-[#0B5FFF]" /> Overall Activity Completion
                      </label>
                      <span className="text-xl font-black text-[#0B5FFF]">{logProgressPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={logProgressPercent}
                      onChange={(e) => {
                        const p = Number(e.target.value);
                        setLogProgressPercent(p);
                        if (p === 100) setLogProgressStatus('Completed');
                        else if (p > 0 && (logProgressStatus === 'Not Started' || logProgressStatus === 'Completed')) setLogProgressStatus('In Progress');
                      }}
                      className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#0B5FFF]"
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-blue-200/50 dark:border-blue-900/40">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Activity Status</label>
                      <select
                        value={logProgressStatus}
                        onChange={(e) => setLogProgressStatus(e.target.value as ActivityStatus)}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100 shadow-sm"
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Blocked">Blocked</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Actual Quantity Achieved
                        </label>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{activity.unit || 'units'}</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={logProgressActualQty}
                        onChange={(e) => {
                          const qty = Number(e.target.value);
                          setLogProgressActualQty(qty);
                          if (activity.targetQuantity && activity.targetQuantity > 0) {
                            const calcP = Math.min(100, Math.round((qty / activity.targetQuantity) * 100));
                            setLogProgressPercent(calcP);
                            if (calcP === 100) setLogProgressStatus('Completed');
                            else if (calcP > 0) setLogProgressStatus('In Progress');
                          }
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-[#0B5FFF]"
                      />
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Target: {activity.targetQuantity || 0} {activity.unit || 'units'}</span>
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {activity.targetQuantity ? `${Math.round((logProgressActualQty / activity.targetQuantity) * 100)}% of Target` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Actual Hours Logged</label>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">Auto Tracked</span>
                      </div>
                      <input
                        type="number"
                        readOnly
                        value={calculatedActualHours}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 cursor-not-allowed"
                      />
                      <span className="text-[10px] text-slate-400 block">Accumulated from Labour site hours</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Environmental & Site Conditions */}
              <div className="p-4 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 rounded-2xl space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  <Sun className="h-4 w-4 text-amber-500" /> Shift & Environmental Snapshot
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block mb-1">Shift Date</label>
                    <input
                      type="date"
                      value={logProgressDate}
                      onChange={(e) => setLogProgressDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block mb-1">Weather</label>
                    <select
                      value={logProgressWeather}
                      onChange={(e) => setLogProgressWeather(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200"
                    >
                      <option value="Sunny">☀️ Sunny</option>
                      <option value="Overcast">☁️ Overcast</option>
                      <option value="Light Rain">🌧️ Light Rain</option>
                      <option value="Heavy Rain">⛈️ Heavy Rain</option>
                      <option value="Windy">💨 Windy</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block mb-1">Temperature</label>
                    <input
                      type="text"
                      placeholder="e.g. 24°C"
                      value={logProgressTemp}
                      onChange={(e) => setLogProgressTemp(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block mb-1">Site / Ground Conditions</label>
                  <input
                    type="text"
                    placeholder="e.g. Dry, clear access, active working areas"
                    value={logProgressSiteConditions}
                    onChange={(e) => setLogProgressSiteConditions(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Delay & Root Cause Tagging (Optional) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-amber-500" /> Site Obstruction / Delay Tag (Optional)
                  </label>
                  {logProgressDelayReason && (
                    <button
                      type="button"
                      onClick={() => setLogProgressDelayReason('')}
                      className="text-[11px] text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'Weather (Rain/Flooding)', label: '🌧️ Weather Delay' },
                    { id: 'Equipment Breakdown', label: '🚜 Plant Breakdown' },
                    { id: 'Material Shortage', label: '📦 Material Shortage' },
                    { id: 'QA / RFI Pending', label: '🛑 QA / RFI Hold' },
                    { id: 'Access Obstruction', label: '🚧 Site Obstruction' },
                    { id: 'Safety Stand-down', label: '⚠️ Safety Stand-down' },
                  ].map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => setLogProgressDelayReason(logProgressDelayReason === tag.id ? '' : tag.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                        logProgressDelayReason === tag.id
                          ? 'bg-amber-100 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 ring-1 ring-amber-400/30'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Supervisor Field Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Supervisor Field Remarks & Overall Shift Accomplishments
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe overall work completed today, milestones reached, obstacles encountered, site observations..."
                  value={logProgressNotes}
                  onChange={(e) => setLogProgressNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#0B5FFF]"
                />
              </div>

              {/* Report Auto-Post Notice */}
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-start gap-2.5">
                <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div className="text-xs text-emerald-900 dark:text-emerald-200">
                  <span className="font-bold block">Automatic Daily Report Generation:</span>
                  Saving this progress log will instantly capture the activity state, subtask completion, resources, and site conditions, posting a comprehensive Daily Report into the <strong>Reports & PDF</strong> module.
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsLogProgressModalOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-2 rounded-xl shadow-md px-5">
                  <Save className="h-4 w-4" /> Save Progress & Post Daily Report
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activity Detailed PDF & Print Modal */}
      <ActivityDetailPdfModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        activity={activity}
        project={projects.find(p => p.id === activity.projectId)}
        currentUserProfile={currentUserProfile}
        employees={employees}
        equipment={equipment}
        materials={materials}
        labourLogs={labourLogs}
        equipmentLogs={equipmentLogs}
      />

      {isRecordActivityModalOpen && (
        <RecordActivityForTaskModal
          activity={activity}
          onClose={() => setIsRecordActivityModalOpen(false)}
          onActivityUpdated={(updated) => {
            setActivity(updated);
            if (onSave) {
              onSave(updated);
            } else {
              updateActivity(updated);
            }
          }}
        />
      )}

      {/* Activity Specific Audit Trail Modal */}
      {isAuditModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
          onClick={() => setIsAuditModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <ActivityAuditScreen
              activityId={activity.id}
              projectId={activity.projectId}
              onBack={() => setIsAuditModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Plant Swap Modal (Conflict Resolution) */}
      {swappingConflict && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
          onClick={() => setSwappingConflict(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF]">
                  <ArrowRightLeft className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Swap Plant Unit</h3>
                  <p className="text-xs text-slate-500">Resolve site contention on {activity.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSwappingConflict(null)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex flex-col gap-4">
              {/* Conflict Context Summary */}
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs">
                <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Currently Assigned: {swappingConflict.resourceName}
                </div>
                <div className="text-[11px] text-amber-800/90 dark:text-amber-300/90">
                  {swappingConflict.message}
                </div>
                <div className="mt-2 text-[10px] font-mono text-amber-700 dark:text-amber-400">
                  Required Window: {activity.startDate || 'N/A'} → {activity.finishDate || activity.startDate || 'N/A'}
                </div>
              </div>

              {/* Available Fleet Alternatives */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Available Plant in Fleet ({availableAlternatives.length})
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    ✓ Verified 0 Date Clashes
                  </span>
                </div>

                {availableAlternatives.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No alternate machinery available</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      All other fleet units in this category are currently booked or undergoing maintenance during this window. Consider shifting activity schedule dates.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {availableAlternatives.map(({ equipment: altEq, isSameCategory }) => (
                      <div 
                        key={altEq.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-[#0B5FFF] dark:hover:border-blue-500 transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#0B5FFF] flex items-center justify-center shrink-0">
                            <Truck className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {altEq.name}
                              </span>
                              {isSameCategory && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  Same Category
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>ID: {altEq.id}</span>
                              <span>•</span>
                              <span>Operator: {altEq.operator || 'Assigned Operator'}</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => handleSwapEquipment(swappingConflict.resourceId, altEq)}
                          className="h-8 px-3 rounded-xl bg-[#0B5FFF] hover:bg-blue-600 text-white text-xs font-bold shrink-0"
                        >
                          Select & Swap
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setSwappingConflict(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
