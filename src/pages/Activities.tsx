import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, Badge, ProgressBar, Button } from '../components/ui';
import { Activity, ActivityStatus, SubTask, DailyReport, canManage } from '../types';
import { ActivityDetail } from '../components/ActivityDetail';
import { ActivityForm } from '../components/ActivityForm';
import { CameraCapture } from '../components/CameraCapture';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { RecordActivityModal } from '../components/RecordActivityModal';
import { ActivitySlideOver } from '../components/ActivitySlideOver';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { ActivityAuditScreen } from '../components/ActivityAuditScreen';
import { 
  Search, 
  Filter, 
  History, 
  CalendarClock, 
  AlertCircle, 
  PlayCircle, 
  CheckCircle, 
  Plus, 
  Camera, 
  Image as ImageIcon, 
  LayoutGrid, 
  List as ListIcon, 
  Trash2, 
  MoreVertical, 
  Layers, 
  ChevronLeft,
  ChevronRight,
  ChevronDown, 
  FileSpreadsheet, 
  Mic, 
  PanelRightOpen, 
  Printer, 
  Copy, 
  CalendarDays,
  Users,
  CheckSquare,
  TrendingUp,
  MapPin,
  Sparkles,
  Save,
  X,
  Sun,
  CloudRain,
  Cloud,
  Thermometer,
  Wind,
  Check,
  Target,
  FileText,
  Eye,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Compass,
  Kanban,
  Table,
  Zap,
  Package,
  ShieldAlert,
  Building2,
  AlertOctagon,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { exportActivitiesToExcel } from '../lib/excelExport';
import { printActivitiesSummary } from '../lib/pdfPrint';
import { findActivityResourceConflicts, ActivityResourceVitality } from '../lib/resourceConflictUtils';
import { calculateSubtaskDailyAverage, recordSubtaskProgress, calculateActivityRollupFromSubtasks } from '../lib/subtaskProgressUtils';
import { WORKSTREAMS, WorkstreamType } from '../types';
import { ActivityKanbanBoard } from '../components/ActivityKanbanBoard';
import { ActivityDataTable } from '../components/ActivityDataTable';
import { PTSCrossDisciplineMatrix } from '../components/PTSCrossDisciplineMatrix';
import { DisciplineTrackerView } from '../components/DisciplineTrackerView';
import { DailyLogsTrackerView } from '../components/DailyLogsTrackerView';
import { ActivityNotesTrackerView } from '../components/ActivityNotesTrackerView';
import { ActivitiesPdfModal } from '../components/ActivitiesPdfModal';

export function Activities() {
  const { activities, projects, updateActivity, addActivity, deleteActivity, addReport, addAuditLog, userRole, currentUserProfile, hasPermission, notes, equipment, employees } = useAppContext();
  const canEditActivities = hasPermission('activities');
  const [mainScreen, setMainScreen] = useState<'activities' | 'disciplines' | 'daily_logs' | 'notes'>('activities');
  const [filterConflictOnly, setFilterConflictOnly] = useState(false);

  // Deterministic Living Resource Conflict Map across all activities
  const activityConflictsMap = React.useMemo(() => {
    const map = new Map<string, ActivityResourceVitality>();
    (activities || []).forEach(act => {
      map.set(act.id, findActivityResourceConflicts(act, activities, equipment || [], employees || []));
    });
    return map;
  }, [activities, equipment, employees]);

  const totalConflictActivities = React.useMemo(() => {
    let count = 0;
    activityConflictsMap.forEach(v => {
      if (v.status === 'CONFLICT' || v.status === 'WARNING') count++;
    });
    return count;
  }, [activityConflictsMap]);

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [slideOverActivity, setSlideOverActivity] = useState<Activity | null>(null);
  const [capturingActivityId, setCapturingActivityId] = useState<string | null>(null);
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isAuditView, setIsAuditView] = useState(false);
  const [duplicateInitialValues, setDuplicateInitialValues] = useState<Partial<Activity> | null>(null);
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'board' | 'grid' | 'list' | 'table' | 'timeline'>(() => {
    return (localStorage.getItem('activityViewMode') as any) || 'table';
  });
  const [timeframe, setTimeframe] = useState<'all' | 'day' | 'week' | 'month'>('all');
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);
  const timeframeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSearchExpanded) {
      searchInputRef.current?.focus();
    }
  }, [isSearchExpanded]);

  useEffect(() => {
    function handleSearchClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        if (!searchTerm) {
          setIsSearchExpanded(false);
        }
      }
    }
    if (isSearchExpanded) {
      document.addEventListener('mousedown', handleSearchClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleSearchClickOutside);
    };
  }, [isSearchExpanded, searchTerm]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (timeframeDropdownRef.current && !timeframeDropdownRef.current.contains(event.target as Node)) {
        setIsTimeframeOpen(false);
      }
    }
    if (isTimeframeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTimeframeOpen]);

  useEffect(() => {
    localStorage.setItem('activityViewMode', viewMode);
  }, [viewMode]);

  // Quick Log Progress Modal State & Granular Subtask Engine
  const [loggingProgressActivity, setLoggingProgressActivity] = useState<Activity | null>(null);
  const [logProgressIsGranularMode, setLogProgressIsGranularMode] = useState<boolean>(true);
  const [logProgressActiveSubtaskId, setLogProgressActiveSubtaskId] = useState<string>('');
  const [isSubtaskDropdownOpen, setIsSubtaskDropdownOpen] = useState<boolean>(false);
  const [subtaskDropdownSearch, setSubtaskDropdownSearch] = useState<string>('');
  const [subtaskDropdownFilter, setSubtaskDropdownFilter] = useState<'all' | 'incomplete' | 'staged' | 'holdPoint'>('all');
  const subtaskDropdownRef = useRef<HTMLDivElement>(null);
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
  const [logProgressActualQty, setLogProgressActualQty] = useState<number>(0);
  const [logProgressPercent, setLogProgressPercent] = useState<number>(0);
  const [logProgressStatus, setLogProgressStatus] = useState<ActivityStatus>('Not Started');
  const [logProgressNotes, setLogProgressNotes] = useState('');
  const [logProgressDate, setLogProgressDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [logProgressWeather, setLogProgressWeather] = useState<string>('Sunny');
  const [logProgressTemp, setLogProgressTemp] = useState<string>('24°C');
  const [logProgressSiteConditions, setLogProgressSiteConditions] = useState<string>('Site dry and fully accessible');
  const [logProgressSubtasks, setLogProgressSubtasks] = useState<SubTask[]>([]);
  const [logProgressPostReport, setLogProgressPostReport] = useState<boolean>(true);
  const [logProgressDelayReason, setLogProgressDelayReason] = useState<string>('');

  // Click outside listener for subtask select popout
  useEffect(() => {
    function handleClickOutsideSubtaskDropdown(event: MouseEvent) {
      if (subtaskDropdownRef.current && !subtaskDropdownRef.current.contains(event.target as Node)) {
        setIsSubtaskDropdownOpen(false);
      }
    }
    if (isSubtaskDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutsideSubtaskDropdown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideSubtaskDropdown);
    };
  }, [isSubtaskDropdownOpen]);

  const handleOpenLogProgress = (act: Activity) => {
    const subtasks = act.subtasks ? JSON.parse(JSON.stringify(act.subtasks)) : [];
    setLoggingProgressActivity(act);
    setLogProgressActualQty(act.actualQuantity || 0);
    setLogProgressPercent(act.progress || 0);
    setLogProgressStatus(act.status || 'Not Started');
    setLogProgressNotes('');
    setLogProgressDate(new Date().toISOString().split('T')[0]);
    setLogProgressWeather('Sunny');
    setLogProgressTemp('24°C');
    setLogProgressSiteConditions('Site dry and fully accessible');
    setLogProgressSubtasks(subtasks);
    setLogProgressPostReport(true);
    setLogProgressDelayReason('');

    // Granular Subtask Inputs Initialization
    const initialInputs: Record<string, any> = {};
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
    });

    const firstIncomplete = subtasks.find((st: SubTask) => st.status !== 'Completed');
    const initialActiveId = firstIncomplete ? firstIncomplete.id : (subtasks[0]?.id || '');

    setLogProgressSubtaskInputs(initialInputs);
    setLogProgressActiveSubtaskId(initialActiveId);
    setIsSubtaskDropdownOpen(false);
    setSubtaskDropdownSearch('');
    setSubtaskDropdownFilter('all');
    setLogProgressIsGranularMode(subtasks.length > 0);
  };

  const handleQuickLogProgressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggingProgressActivity) return;
    const todayStr = logProgressDate || new Date().toISOString().split('T')[0];

    let finalStatus = logProgressStatus;
    let finalProgress = Number(logProgressPercent) || 0;
    let finalActualQty = Number(logProgressActualQty) || 0;

    let subtasksToSave: SubTask[] = logProgressSubtasks && logProgressSubtasks.length > 0
      ? logProgressSubtasks
      : (loggingProgressActivity.subtasks || []);

    // 1. Process Granular Subtasks if in Granular Mode
    if (logProgressIsGranularMode && subtasksToSave.length > 0) {
      subtasksToSave = subtasksToSave.map(st => {
        const input = logProgressSubtaskInputs[st.id];
        if (!input) return st;

        const hasShiftChange = input.mode === 'shift' && Number(input.shiftOutput) > 0;
        const hasCumulativeChange = input.mode === 'cumulative' && Number(input.cumulativeOutput) !== (st.completedQuantity || 0);
        const hasStatusChange = Boolean(input.status && input.status !== (st.status || 'Not Started'));
        const hasNotes = Boolean(input.notes && input.notes.trim());
        const hasHoldApproval = Boolean(input.holdPointApproved && !st.holdPointSignOff?.approved);

        if (!hasShiftChange && !hasCumulativeChange && !hasStatusChange && !hasNotes && !hasHoldApproval) {
          return st;
        }

        let updatedSt = { ...st };

        // QA Hold Point Sign-Off Handling
        if (st.isHoldPoint && input.holdPointApproved) {
          updatedSt.holdPointSignOff = {
            signedBy: input.holdPointSignedBy || currentUserProfile?.name || 'Site Supervisor',
            signedAt: todayStr,
            signatureNote: input.notes || 'Inspection cleared and approved on site.',
            approved: true
          };
          updatedSt.status = 'Completed';
        } else if (input.status) {
          updatedSt.status = input.status;
        }

        // Apply Shift Output or Cumulative change
        if (hasShiftChange || hasCumulativeChange || hasNotes) {
          updatedSt = recordSubtaskProgress(updatedSt, {
            date: todayStr,
            shiftOutput: input.mode === 'shift' ? Number(input.shiftOutput) : Number(input.cumulativeOutput),
            mode: input.mode,
            status: input.status,
            notes: input.notes ? input.notes.trim() : '',
            loggedBy: currentUserProfile?.name || 'Site Supervisor',
            weather: logProgressWeather,
            chainageSpan: input.chainageSpan
          });
        }

        return updatedSt;
      });

      // Automatically calculate master activity rollup
      const rollup = calculateActivityRollupFromSubtasks(loggingProgressActivity, subtasksToSave);
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
      ? `${loggingProgressActivity.remarks ? loggingProgressActivity.remarks + '\n' : ''}[Progress Log ${todayStr}${logProgressDelayReason ? ` • Blocker: ${logProgressDelayReason}` : ''}]: ${logProgressNotes.trim()}`
      : loggingProgressActivity.remarks;

    const totalLabourHours = (loggingProgressActivity.assignedLabour || []).reduce((sum, l) => sum + (l.hours || 0), 0);
    const workersCount = (loggingProgressActivity.assignedLabour || []).length;
    const equipmentCount = (loggingProgressActivity.assignedEquipment || []).length;

    // Structured subtasks summary
    const subtaskSummary = subtasksToSave.length > 0 
      ? subtasksToSave.map((s, idx) => {
          const input = logProgressSubtaskInputs[s.id];
          const wasLoggedToday = input && (
            (input.mode === 'shift' && Number(input.shiftOutput) > 0) ||
            (input.mode === 'cumulative' && Number(input.cumulativeOutput) !== (s.completedQuantity || 0)) ||
            (input.status !== s.status) ||
            Boolean(input.notes?.trim()) ||
            Boolean(input.holdPointApproved)
          );
          const metrics = calculateSubtaskDailyAverage(s);
          const shiftGain = wasLoggedToday && input?.mode === 'shift' && input.shiftOutput > 0 ? ` (+${input.shiftOutput} ${s.unit || 'units'} today)` : '';
          const runRateStr = metrics.dailyAverage > 0 ? ` [Avg: ${metrics.formattedRate}]` : '';
          const holdStr = s.isHoldPoint ? (s.holdPointSignOff?.approved ? ` [🔒 QA Cleared: ${s.holdPointSignOff.signedBy}]` : ' [🔒 QA Hold Point Pending]') : '';
          const noteStr = input?.notes?.trim() ? `\n      Remarks: "${input.notes.trim()}"` : '';

          return `  ${s.status === 'Completed' ? '[✓]' : s.status === 'In Progress' ? '[►]' : '[ ]'} #${idx + 1} ${s.title} (${s.category || 'General'}) - ${s.status}${shiftGain} [Total: ${s.completedQuantity || 0}/${s.targetQuantity || 0} ${s.unit || ''}]${runRateStr}${s.isMilestone ? ' 🎯 Milestone' : ''}${holdStr}${noteStr}`;
        }).join('\n')
      : 'No subtasks configured.';

    // Structured resource allocations
    const crewSummary = (loggingProgressActivity.assignedLabour || []).length > 0
      ? (loggingProgressActivity.assignedLabour || []).map(l => `• ${l.role || 'Worker'}: ${l.name || 'Worker'} (${l.hours || 0} hrs)`).join('\n')
      : 'No dedicated crew allocated.';

    const machinerySummary = (loggingProgressActivity.assignedEquipment || []).length > 0
      ? (loggingProgressActivity.assignedEquipment || []).map(e => `• ${e.name || e.equipmentId} (Operator: ${e.operator || 'Assigned'})`).join('\n')
      : 'No heavy machinery allocated.';

    const materialSummary = (loggingProgressActivity.assignedMaterials || []).length > 0
      ? (loggingProgressActivity.assignedMaterials || []).map(m => `• ${m.name}: ${m.quantity} ${m.unit}`).join('\n')
      : 'Standard material stock.';

    const fullSupervisorNotes = `=== DAILY PROGRESS LOG: ${loggingProgressActivity.name} (${loggingProgressActivity.id}) ===
Discipline / Package: ${loggingProgressActivity.workPackage || 'N/A'} | ${loggingProgressActivity.discipline || 'General'}
Overall Activity Progress: ${finalProgress}% | Output: ${finalActualQty} / ${loggingProgressActivity.targetQuantity || 0} ${loggingProgressActivity.unit || ''}
Priority: ${loggingProgressActivity.priority || 'Normal'} | Shift Hours: ${totalLabourHours} hrs
${logProgressDelayReason ? `Identified Blocker / Delay Cause: ${logProgressDelayReason}\n` : ''}
--- SUBTASK & METHOD EXECUTION STATUS ---
${subtaskSummary}

--- RESOURCE ALLOCATIONS ON SHIFT ---
Crew Workforce (${workersCount} personnel):
${crewSummary}

Plant & Machinery (${equipmentCount} active units):
${machinerySummary}

Materials Allocated:
${materialSummary}

--- FIELD REMARKS & OBSERVATIONS ---
${logProgressNotes.trim() ? logProgressNotes.trim() : 'Daily production targets executed in accordance with method statement and QA/QC specifications.'}`;

    const reportId = `RPT-${Math.floor(10000 + Math.random() * 90000)}`;
    if (logProgressPostReport && addReport) {
      const newDailyReport: DailyReport = {
        id: reportId,
        date: todayStr,
        projectId: loggingProgressActivity.projectId || projects[0]?.id || 'PROJ-001',
        weather: logProgressWeather,
        temperature: logProgressTemp,
        siteConditions: logProgressSiteConditions,
        significantEvents: `Progress logged on ${loggingProgressActivity.name}: advanced to ${finalProgress}% (${finalActualQty} / ${loggingProgressActivity.targetQuantity || 0} ${loggingProgressActivity.unit || ''}). ${logProgressDelayReason ? `[Blocker: ${logProgressDelayReason}] ` : ''}${logProgressNotes ? logProgressNotes.slice(0, 100) : ''}`,
        workersOnSite: workersCount || 1,
        equipmentRunning: equipmentCount || 0,
        incidents: 0,
        ncr: 0,
        activitiesLogged: [loggingProgressActivity.id],
        manpowerBreakdown: (loggingProgressActivity.assignedLabour || []).map(l => ({
          trade: l.role || 'General Worker',
          count: 1,
          hours: l.hours || 8
        })),
        equipmentLogged: (loggingProgressActivity.assignedEquipment || []).map(e => ({
          equipmentId: e.equipmentId,
          hours: 8,
          status: 'Operating'
        })),
        photos: loggingProgressActivity.photos ? [...loggingProgressActivity.photos] : [],
        supervisorNotes: fullSupervisorNotes
      };
      addReport(newDailyReport);
    }

    const updatedActivity: Activity = {
      ...loggingProgressActivity,
      progress: finalProgress,
      actualQuantity: finalActualQty,
      status: finalStatus,
      subtasks: subtasksToSave,
      updatedAt: todayStr,
      remarks: updatedRemarks
    };

    if (updateActivity) {
      updateActivity(updatedActivity);
    }

    if (addAuditLog) {
      addAuditLog({
        id: `AL-${Math.random().toString(36).substr(2, 9)}`,
        projectId: loggingProgressActivity.projectId || projects[0]?.id || 'PROJ-001',
        userId: currentUserProfile?.name || 'Current User',
        action: 'Progress Logged & Report Posted',
        details: `Logged progress on "${loggingProgressActivity.name}" (${finalProgress}%, ${finalActualQty} ${loggingProgressActivity.unit || ''})${logProgressPostReport ? ` and posted Daily Report #${reportId}` : ''}.`,
        timestamp: new Date().toISOString()
      });
    }

    setLoggingProgressActivity(null);
  };

  // Direct Subtask Status Toggle from Grid Cards
  const handleToggleSubtask = (activity: Activity, subtaskId: string) => {
    const subtasks = activity.subtasks || [];
    const targetSubtask = subtasks.find(s => s.id === subtaskId);
    if (!targetSubtask) return;

    // If hold point and not approved yet, open full detail screen to sign off
    if (targetSubtask.isHoldPoint && !targetSubtask.holdPointSignOff?.approved && targetSubtask.status !== 'Completed') {
      setSelectedActivity(activity);
      return;
    }

    const nextStatus: 'Not Started' | 'In Progress' | 'Completed' = 
      targetSubtask.status === 'Completed' ? 'In Progress' : 'Completed';
    
    const updatedSubtasks = subtasks.map(s => {
      if (s.id === subtaskId) {
        return {
          ...s,
          status: nextStatus,
          completedQuantity: nextStatus === 'Completed' ? (s.targetQuantity || s.completedQuantity) : s.completedQuantity
        };
      }
      return s;
    });

    const total = updatedSubtasks.length;
    const completed = updatedSubtasks.filter(s => s.status === 'Completed').length;
    const newProgress = total > 0 ? Math.round((completed / total) * 100) : activity.progress;
    const newActivityStatus: ActivityStatus = newProgress === 100 ? 'Completed' : newProgress > 0 ? 'In Progress' : activity.status;

    if (updateActivity) {
      updateActivity({
        ...activity,
        subtasks: updatedSubtasks,
        progress: newProgress,
        status: newActivityStatus,
        updatedAt: new Date().toISOString().split('T')[0]
      });
    }
  };

  const handleQuickUpdateStatus = (activityId: string, newStatus: ActivityStatus) => {
    const act = activities.find(a => a.id === activityId);
    if (!act) return;

    let newProgress = act.progress;
    if (newStatus === 'Completed') newProgress = 100;
    else if (newStatus === 'Not Started') newProgress = 0;
    else if (newStatus === 'In Progress' && (newProgress === 0 || !newProgress)) newProgress = 10;

    const updated: Activity = {
      ...act,
      status: newStatus,
      progress: newProgress,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    updateActivity(updated);
    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: act.projectId,
      userId: userRole || 'User',
      action: 'Status Updated',
      details: `Changed status of "${act.name}" (${act.id}) to ${newStatus}`,
      timestamp: new Date().toISOString()
    });
  };

  const handleBulkStatusChange = (activityIds: string[], newStatus: ActivityStatus) => {
    activityIds.forEach(id => handleQuickUpdateStatus(id, newStatus));
  };

  const filtered = activities.filter(a => {
    // 1. Search Filter
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (a.workPackage && a.workPackage.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (a.sectionSpan && a.sectionSpan.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (a.linkedPTSActivityName && a.linkedPTSActivityName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;

    // 2. Resource Conflict Filter
    if (filterConflictOnly) {
      const vitality = activityConflictsMap.get(a.id);
      if (!vitality || (vitality.status !== 'CONFLICT' && vitality.status !== 'WARNING')) {
        return false;
      }
    }

    // 3. Timeframe Filter
    if (timeframe === 'all') return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const start = new Date(a.startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = a.finishDate ? new Date(a.finishDate) : new Date(a.startDate);
    end.setHours(23, 59, 59, 999);

    if (timeframe === 'day') {
      return start <= today && end >= today;
    } 
    
    if (timeframe === 'week') {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      return start <= weekEnd && end >= weekStart;
    } 
    
    if (timeframe === 'month') {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      
      return start <= monthEnd && end >= monthStart;
    }
    
    return true;
  });

  const handleDeleteActivity = (id: string) => {
    setDeletingActivityId(id);
  };

  const handleConfirmDelete = () => {
    if (deletingActivityId && deleteActivity) {
      deleteActivity(deletingActivityId);
    }
    if (selectedActivity && selectedActivity.id === deletingActivityId) {
      setSelectedActivity(null);
    }
    setDeletingActivityId(null);
  };

  const handleSaveActivity = (updated: Activity, oldId?: string) => {
    if (updateActivity) {
      updateActivity(updated, oldId);
    }
    setSelectedActivity(updated);
  };

  const handleAddActivity = (newActivity: Activity) => {
    addActivity(newActivity);
    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: newActivity.projectId || projects[0]?.id || 'PROJ-001',
      userId: userRole === 'Manager' ? 'Current User' : 'Current User',
      action: duplicateInitialValues ? 'Activity Duplicated' : 'Activity Created',
      details: duplicateInitialValues 
        ? `Created duplicate activity "${newActivity.name}" (${newActivity.id})`
        : `Created activity "${newActivity.name}" (${newActivity.id})`,
      timestamp: new Date().toISOString()
    });
    setIsAdding(false);
    setDuplicateInitialValues(null);
  };

  const handleDuplicateActivity = (sourceActivity: Activity) => {
    const nextId = `ACT-${Math.floor(1000 + Math.random() * 9000)}`;
    const clonedValues: Partial<Activity> = {
      ...sourceActivity,
      id: nextId,
      name: `${sourceActivity.name} (Copy)`,
      status: 'Not Started',
      progress: 0,
      actualQuantity: 0,
      actualHours: 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      startDate: sourceActivity.startDate || new Date().toISOString().split('T')[0],
      finishDate: sourceActivity.finishDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      photos: [],
      voiceNotes: [],
      digitalSignature: undefined,
      remarks: sourceActivity.remarks ? `Copied from ${sourceActivity.name} (${sourceActivity.id})\n${sourceActivity.remarks}` : `Copied from ${sourceActivity.name} (${sourceActivity.id})`,
      subtasks: sourceActivity.subtasks?.map(st => ({
        ...st,
        id: `ST-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        completed: false
      })) || [],
      assignedMaterials: sourceActivity.assignedMaterials ? [...sourceActivity.assignedMaterials] : [],
      assignedLabour: sourceActivity.assignedLabour ? [...sourceActivity.assignedLabour] : [],
      assignedEquipment: sourceActivity.assignedEquipment ? [...sourceActivity.assignedEquipment] : []
    };

    setDuplicateInitialValues(clonedValues);
    setIsAdding(true);
  };

  const handleQuickCapturePhoto = (targetActivity: Activity, photoDataUrl: string) => {
    const updatedPhotos = [photoDataUrl, ...(targetActivity.photos || [])];
    const updated = { ...targetActivity, photos: updatedPhotos };
    if (updateActivity) {
      updateActivity(updated);
    }
    if (selectedActivity && selectedActivity.id === targetActivity.id) {
      setSelectedActivity(updated);
    }
    setCapturingActivityId(null);
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'In Progress': return <PlayCircle className="h-4 w-4 text-[#0B5FFF]" />;
      case 'Completed': return <CheckCircle className="h-4 w-4 text-[#2E7D32]" />;
      case 'Blocked': return <AlertCircle className="h-4 w-4 text-[#D32F2F]" />;
      default: return <CalendarClock className="h-4 w-4 text-[#F9A825]" />;
    }
  };

  if (isAdding) {
    return (
      <div className="p-4 md:p-8">
        <ActivityForm 
          onClose={() => {
            setIsAdding(false);
            setDuplicateInitialValues(null);
          }} 
          onSubmit={handleAddActivity}
          initialValues={duplicateInitialValues || undefined}
          isDuplicate={Boolean(duplicateInitialValues)}
        />
      </div>
    );
  }

  if (isAuditView) {
    return (
      <div className="p-4 md:p-8">
        <ActivityAuditScreen 
          onBack={() => setIsAuditView(false)}
          onSelectActivity={(act) => {
            setIsAuditView(false);
            setSelectedActivity(act);
          }}
        />
      </div>
    );
  }

  if (selectedActivity) {
    return (
      <div className="p-4 md:p-8 pb-28 md:pb-36">
        <ActivityDetail
          activity={selectedActivity}
          onSave={canEditActivities ? handleSaveActivity : undefined}
          onClose={() => setSelectedActivity(null)}
          onDelete={canEditActivities ? handleDeleteActivity : undefined}
          onDuplicate={canEditActivities ? handleDuplicateActivity : undefined}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-28 md:pb-36">
      {/* Top Level Screen Switcher: Activity Tracker | Discipline Tracker */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 flex-wrap gap-3">
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <button
            type="button"
            onClick={() => setMainScreen('activities')}
            className={`px-5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              mainScreen === 'activities'
                ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="h-4 w-4 text-[#0B5FFF]" />
            <span>Activity Tracker</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF] font-bold">
              {activities.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMainScreen('disciplines')}
            className={`px-5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              mainScreen === 'disciplines'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Compass className="h-4 w-4 text-indigo-600" />
            <span>Discipline Tracker</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold">
              Scope of Work
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMainScreen('daily_logs')}
            className={`px-5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              mainScreen === 'daily_logs'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckSquare className="h-4 w-4 text-emerald-600" />
            <span>Daily Logs</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
              Site Diary
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMainScreen('notes')}
            className={`px-5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              mainScreen === 'notes'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="h-4 w-4 text-amber-600" />
            <span>Notes</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold">
              {notes.length}
            </span>
          </button>
        </div>

        {/* Global Audit & Export Actions */}
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setIsAuditView(true)} 
            variant="outline" 
            className="gap-2 rounded-xl border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 text-[#0B5FFF] dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/50 font-semibold h-9 text-xs"
            title="Open Activity & Subtask Audit Screen"
          >
            <History className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Audit Trail</span>
          </Button>

          <Button 
            onClick={() => exportActivitiesToExcel(filtered, projects)} 
            variant="outline" 
            className="gap-2 rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 h-9 text-xs"
            title="Export comprehensive multi-tab Excel spreadsheet report (.xlsx)"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Export Excel</span>
          </Button>

          <Button 
            onClick={() => setIsPdfModalOpen(true)} 
            variant="outline" 
            className="gap-2 rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 h-9 text-xs"
            title="Open Interactive Print Preview & PDF Report Builder"
          >
            <Printer className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
            <span className="hidden sm:inline">Print / PDF</span>
          </Button>
        </div>
      </div>

      {/* Screen 4: Dedicated Field & Engineering Notes */}
      {mainScreen === 'notes' ? (
        <ActivityNotesTrackerView
          onOpenActivityDetail={setSelectedActivity}
        />
      ) : mainScreen === 'daily_logs' ? (
        <DailyLogsTrackerView
          onOpenActivityDetail={setSelectedActivity}
        />
      ) : mainScreen === 'disciplines' ? (
        <DisciplineTrackerView
          activities={activities}
          onSelectActivity={setSelectedActivity}
          onOpenSlideOver={setSlideOverActivity}
          onOpenLogProgress={handleOpenLogProgress}
          onAddNewDisciplineItem={(ws) => {
            setDuplicateInitialValues({ workstream: ws });
            setIsAdding(true);
          }}
          onUpdateStatus={handleQuickUpdateStatus}
        />
      ) : (
        /* Screen 1: Master Activity Tracker (Free of Discipline Constraints) */
        <div className="flex flex-col gap-6">
          {/* Header & Main Controls */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex justify-between items-center w-full md:w-auto">
              <div>
                <h1 className="text-xl font-bold tracking-tight">Activity Tracker</h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                  Track and manage all project activities and progress across the entire site.
                </p>
              </div>
              {canEditActivities && (
                <Button onClick={() => setIsAdding(true)} className="md:hidden gap-2 rounded-xl bg-[#0B5FFF]">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {canEditActivities && (
                <Button onClick={() => setIsAdding(true)} className="hidden md:flex gap-2 rounded-xl bg-[#0B5FFF] h-10">
                  <Plus className="h-4 w-4" /> Add Activity
                </Button>
              )}

              {/* Expandable Search Button / Input */}
              <div className="relative flex items-center" ref={searchContainerRef}>
                <div
                  className={`flex items-center transition-all duration-300 ease-in-out overflow-hidden rounded-xl border ${
                    isSearchExpanded || searchTerm
                      ? 'w-48 sm:w-60 bg-white dark:bg-slate-900 border-[#0B5FFF]/50 shadow-xs ring-1 ring-[#0B5FFF]/30'
                      : 'w-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchExpanded(true);
                      searchInputRef.current?.focus();
                    }}
                    className="h-10 w-10 flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-400 hover:text-[#0B5FFF] transition-colors"
                    title="Search activities, codes..."
                    aria-label="Search activities"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                  <input 
                    ref={searchInputRef}
                    type="text" 
                    placeholder="Search activities, codes..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`h-10 w-full bg-transparent pr-7 text-xs sm:text-sm focus:outline-none dark:text-white transition-opacity duration-200 ${
                      isSearchExpanded || searchTerm ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  />
                  {(isSearchExpanded || searchTerm) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        setIsSearchExpanded(false);
                      }}
                      className="absolute right-2 h-5 w-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Clear & close search"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsible Timeframe Filter */}
              <div className="relative" ref={timeframeDropdownRef}>
                <button
                  onClick={() => setIsTimeframeOpen(!isTimeframeOpen)}
                  className={`h-10 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                    timeframe !== 'all'
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-[#0B5FFF]/40 text-[#0B5FFF] dark:text-blue-400 font-bold'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  title="Filter activities by timeframe"
                >
                  <CalendarClock className={`h-3.5 w-3.5 ${timeframe !== 'all' ? 'text-[#0B5FFF]' : 'text-slate-400'}`} />
                  <span>
                    {timeframe === 'all' ? 'Time: All' : timeframe === 'day' ? 'Today' : timeframe === 'week' ? 'This Week' : 'This Month'}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isTimeframeOpen ? 'rotate-180 text-[#0B5FFF]' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isTimeframeOpen && (
                  <div className="absolute right-0 sm:left-0 sm:right-auto top-12 w-48 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-40 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Select Timeframe
                    </div>
                    {[
                      { key: 'all', label: 'All Activities', desc: 'Full project timeline' },
                      { key: 'day', label: 'Today', desc: 'Active shift today' },
                      { key: 'week', label: 'This Week', desc: 'Current 7-day schedule' },
                      { key: 'month', label: 'This Month', desc: 'Current monthly window' },
                    ].map(item => (
                      <button
                        key={item.key}
                        onClick={() => {
                          setTimeframe(item.key as any);
                          setIsTimeframeOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                          timeframe === item.key
                            ? 'bg-blue-50 dark:bg-blue-900/40 text-[#0B5FFF] font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="leading-tight">{item.label}</span>
                          <span className="text-[10px] text-slate-400 font-normal leading-tight">{item.desc}</span>
                        </div>
                        {timeframe === item.key && <Check className="h-3.5 w-3.5 text-[#0B5FFF]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Conflict Radar Quick Filter Pill */}
              <button
                type="button"
                onClick={() => setFilterConflictOnly(!filterConflictOnly)}
                className={`h-10 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                  filterConflictOnly
                    ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 ring-2 ring-red-500/30'
                    : totalConflictActivities > 0
                    ? 'bg-white dark:bg-slate-900 border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50/50'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50'
                }`}
                title="Filter activities with active equipment or resource scheduling clashes"
              >
                <AlertOctagon className={`h-3.5 w-3.5 ${filterConflictOnly || totalConflictActivities > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`} />
                <span>Conflicts</span>
                {totalConflictActivities > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${filterConflictOnly ? 'bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-100' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'}`}>
                    {totalConflictActivities}
                  </span>
                )}
              </button>

              {/* View Mode Switcher Toolbar (Icon Only) */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-0.5 border border-slate-200/80 dark:border-slate-700/80">
                <button
                  onClick={() => setViewMode('board')}
                  className={`p-2 rounded-lg transition-all flex items-center justify-center text-xs font-bold ${viewMode === 'board' ? 'bg-white dark:bg-slate-700 text-[#0B5FFF] shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  title="Kanban Board View"
                  aria-label="Kanban Board View"
                >
                  <Kanban className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg transition-all flex items-center justify-center text-xs font-bold ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-[#0B5FFF] shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  title="Spreadsheet / Data Table View"
                  aria-label="Spreadsheet / Data Table View"
                >
                  <Table className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all flex items-center justify-center ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-[#0B5FFF] shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  title="Grid Card View"
                  aria-label="Grid Card View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all flex items-center justify-center ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-[#0B5FFF] shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  title="List View"
                  aria-label="List View"
                >
                  <ListIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`p-2 rounded-lg transition-all flex items-center justify-center ${viewMode === 'timeline' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  title="Timeline Schedule"
                  aria-label="Timeline Schedule"
                >
                  <CalendarDays className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Timeframe Progress Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Activities</div>
              <div className="text-xl font-black text-slate-900 dark:text-white">{filtered.length}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">In Progress</div>
              <div className="text-xl font-black text-[#0B5FFF]">{filtered.filter(a => a.status === 'In Progress').length}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Completed</div>
              <div className="text-xl font-black text-[#2E7D32]">{filtered.filter(a => a.status === 'Completed').length}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Blocked / Hold Points</div>
              <div className="text-xl font-black text-[#D32F2F]">{filtered.filter(a => a.status === 'Blocked').length}</div>
            </div>
          </div>

          {/* Render Active View Mode */}
          {viewMode === 'board' ? (
            <ActivityKanbanBoard 
              activities={filtered} 
              onSelectActivity={setSelectedActivity} 
              onOpenSlideOver={setSlideOverActivity} 
              onOpenLogProgress={handleOpenLogProgress} 
              onUpdateStatus={handleQuickUpdateStatus} 
            />
          ) : viewMode === 'table' ? (
            <ActivityDataTable 
              activities={filtered} 
              onSelectActivity={setSelectedActivity} 
              onOpenSlideOver={setSlideOverActivity} 
              onOpenLogProgress={handleOpenLogProgress} 
              onUpdateStatus={handleQuickUpdateStatus} 
              onBulkStatusChange={handleBulkStatusChange} 
              onExportSelected={(selected) => exportActivitiesToExcel(selected, projects, 'selected')} 
            />
          ) : viewMode === 'timeline' ? (
            <ActivityTimeline 
              activities={filtered} 
              allActivities={activities}
              onSelectActivity={(id) => {
                const act = activities.find(a => a.id === id);
                if (act) setSlideOverActivity(act);
              }} 
              onUpdateActivity={updateActivity}
            />
          ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start" : "flex flex-col gap-4"}>
          {filtered.map((activity) => {
            const subtasks = activity.subtasks || [];
            const subtasksCount = subtasks.length;
            const completedSubtasksCount = subtasks.filter(s => s.status === 'Completed').length;
            const subtasksPct = subtasksCount > 0 ? Math.round((completedSubtasksCount / subtasksCount) * 100) : 0;
            const milestonesCount = subtasks.filter(s => s.isMilestone).length;

            return (
              <Card 
                key={activity.id} 
                onClick={() => setExpandedActivityId(expandedActivityId === activity.id ? null : activity.id)}
                className="hover:border-[#0B5FFF]/40 dark:hover:border-blue-500/40 hover:shadow-md transition-all cursor-pointer overflow-hidden group relative flex flex-col"
              >

                <div className={`flex ${viewMode === 'grid' ? 'flex-col' : 'flex-col md:flex-row'}`}>
                  {/* Status Color Bar */}
                  <div className={`${viewMode === 'grid' ? 'h-1 w-full' : 'w-1 h-auto md:w-1'} ${
                    activity.status === 'In Progress' ? 'bg-[#0B5FFF]' :
                    activity.status === 'Blocked' ? 'bg-[#D32F2F]' :
                    activity.status === 'Completed' ? 'bg-[#2E7D32]' : 'bg-[#F9A825]'
                  }`} />
                  
                  <CardContent className={`flex-1 p-4 flex ${viewMode === 'grid' ? 'flex-col gap-3' : 'flex-col md:flex-row md:items-center justify-between gap-4'}`}>
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold tracking-wider text-slate-500">{activity.id}</span>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold">{activity.workPackage}</Badge>
                        {activity.priority === 'Critical' && <Badge variant="danger" className="text-[10px] uppercase font-bold">Critical</Badge>}
                        {activity.priority === 'High' && <Badge variant="outline" className="text-[10px] uppercase font-bold text-amber-600 border-amber-300">High</Badge>}
                        
                        {/* Subtask Mini-Progress Pill */}
                        {subtasksCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0B5FFF] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <CheckSquare className="h-3 w-3 text-[#0B5FFF]" />
                            {completedSubtasksCount}/{subtasksCount} Subtasks ({subtasksPct}%)
                          </span>
                        )}
                        
                        {/* Milestone Badge */}
                        {milestonesCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            🎯 {milestonesCount} {milestonesCount === 1 ? 'Milestone' : 'Milestones'}
                          </span>
                        )}

                        {/* QA Hold Point Badge */}
                        {subtasks.filter(s => s.isHoldPoint).length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <ShieldCheck className="h-3 w-3 text-rose-600" />
                            {subtasks.filter(s => s.isHoldPoint && s.holdPointSignOff?.approved).length}/{subtasks.filter(s => s.isHoldPoint).length} Hold Points
                          </span>
                        )}

                        {/* Living Resource Vitality Pill */}
                        {(() => {
                          const vitality = activityConflictsMap.get(activity.id);
                          if (!vitality) return null;
                          if (vitality.status === 'CONFLICT') {
                            return (
                              <span 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedActivity(activity);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                title="Click to view and resolve active plant collisions"
                              >
                                <AlertTriangle className="h-3 w-3 text-red-600 animate-pulse" />
                                {vitality.label}
                              </span>
                            );
                          }
                          if (vitality.status === 'WARNING') {
                            return (
                              <span 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedActivity(activity);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors"
                              >
                                <Clock className="h-3 w-3 text-amber-600" />
                                {vitality.label}
                              </span>
                            );
                          }
                          if (vitality.equipmentCount > 0) {
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                {vitality.label}
                              </span>
                            );
                          }
                          return null;
                        })()}

                        {activity.photos && activity.photos.length > 0 && (
                          <Badge variant="default" className="text-[10px] bg-blue-50 text-[#0B5FFF] border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 font-bold gap-1">
                            <ImageIcon className="h-3 w-3" /> {activity.photos.length} {activity.photos.length === 1 ? 'Photo' : 'Photos'}
                          </Badge>
                        )}
                      </div>
                      
                      <h3 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedActivity(activity);
                        }}
                        className="text-base font-bold text-slate-900 dark:text-slate-100 hover:text-[#0B5FFF] transition-colors cursor-pointer"
                        title="Click to view full activity details"
                      >
                        {activity.name}
                      </h3>
                      
                      {/* Clean Metadata & Team Chips */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500 font-medium mt-0.5">
                        <span className="flex items-center gap-1" title="Start Date">
                          <CalendarClock className="h-3.5 w-3.5 text-emerald-500" /> Start: {activity.startDate}
                        </span>
                        <span className="text-slate-400">Created: {activity.createdAt || activity.startDate}</span>
                        {activity.updatedAt && <span className="text-purple-600 dark:text-purple-400">Edited: {activity.updatedAt}</span>}
                        
                        {activity.area && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium">
                            <MapPin className="h-3 w-3 text-slate-400" /> Area: {activity.area}
                          </span>
                        )}
                        
                        {activity.assignedTo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-semibold text-[10px]">
                            <Users className="h-3 w-3" /> Team: {activity.assignedTo}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 text-[10px]">
                            <Users className="h-3 w-3" /> Unassigned Team
                          </span>
                        )}
                      </div>

                      {/* Thumbnail Preview strip if photos exist */}
                      {activity.photos && activity.photos.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1">
                          {activity.photos.slice(0, 4).map((photo, pIdx) => (
                            <img 
                              key={pIdx} 
                              src={photo} 
                              alt="Thumbnail" 
                              className="w-9 h-9 rounded-md object-cover border border-slate-200 dark:border-slate-700 shadow-sm" 
                            />
                          ))}
                          {activity.photos.length > 4 && (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-2 rounded-md">
                              +{activity.photos.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Grid View Scrollable Subtasks Container */}
                      {viewMode === 'grid' && (
                        <div className="mt-2 flex flex-col gap-1.5 flex-1 min-h-[130px]">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 px-0.5">
                            <span className="flex items-center gap-1.5">
                              <CheckSquare className="h-3.5 w-3.5 text-[#0B5FFF]" />
                              Subtasks ({completedSubtasksCount}/{subtasksCount})
                            </span>
                            {subtasksCount > 0 && (
                              <span className="text-[10px] font-mono text-[#0B5FFF] font-bold bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                {subtasksPct}%
                              </span>
                            )}
                          </div>

                          {subtasksCount > 0 ? (
                            <div 
                              className="max-h-36 overflow-y-auto space-y-1.5 pr-1 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 p-2 text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {subtasks.map((st, sIdx) => {
                                const isDone = st.status === 'Completed';
                                const isInProg = st.status === 'In Progress';
                                return (
                                  <div 
                                    key={st.id || sIdx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleSubtask(activity, st.id);
                                    }}
                                    className={`flex items-center justify-between gap-2 p-1.5 rounded-lg border text-[11px] transition-all cursor-pointer select-none ${
                                      isDone 
                                        ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-300' 
                                        : isInProg 
                                        ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-900/50 text-blue-900 dark:text-blue-300' 
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                                    }`}
                                    title={
                                      st.isHoldPoint && !st.holdPointSignOff?.approved
                                        ? '🔒 QA Hold Point: Click to open inspection details'
                                        : `Click to toggle: ${st.status}`
                                    }
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border transition-colors ${
                                        isDone 
                                          ? 'bg-emerald-600 border-emerald-600 text-white' 
                                          : isInProg 
                                          ? 'bg-blue-600 border-blue-600 text-white' 
                                          : 'border-slate-300 dark:border-slate-600'
                                      }`}>
                                        {isDone && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                                        {isInProg && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                      </div>
                                      <span className={`font-medium truncate ${isDone ? 'line-through opacity-70 text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                        #{sIdx + 1} {st.title}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      {st.completedQuantity !== undefined && (
                                        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                          {st.completedQuantity}/{st.targetQuantity || 0} {st.unit || ''}
                                        </span>
                                      )}
                                      {st.isMilestone && (
                                        <span className="text-[10px]" title="Milestone">🎯</span>
                                      )}
                                      {st.isHoldPoint && (
                                        <span 
                                          className={`text-[10px] px-1 py-0.5 rounded font-bold ${
                                            st.holdPointSignOff?.approved 
                                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950' 
                                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950'
                                          }`} 
                                          title={st.holdPointSignOff?.approved ? `QA Approved by ${st.holdPointSignOff.signedBy}` : 'QA Hold Point'}
                                        >
                                          🔒
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedActivity(activity);
                              }}
                              className="flex-1 min-h-[90px] flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-center hover:bg-blue-50/40 hover:border-blue-200 transition-colors group/sub cursor-pointer"
                            >
                              <CheckSquare className="h-5 w-5 text-slate-300 dark:text-slate-600 group-hover/sub:text-[#0B5FFF] transition-colors mb-1" />
                              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 group-hover/sub:text-[#0B5FFF]">
                                No subtasks defined
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                Click Details to configure WBS
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className={`flex ${viewMode === 'grid' ? 'flex-row items-center justify-between mt-auto pt-3' : 'flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 w-full md:w-64 pt-3 md:pt-0'} border-t md:border-t-0 border-slate-100 dark:border-slate-800`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 mr-1">
                          {getStatusIcon(activity.status)}
                          <span className="text-xs font-bold whitespace-nowrap">{activity.status}</span>
                        </div>

                        {/* Direct "Details" Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedActivity(activity);
                          }}
                          className="h-8 rounded-xl px-2.5 gap-1.5 text-xs text-[#0B5FFF] bg-blue-50 hover:bg-blue-100 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800 font-semibold shadow-sm"
                          title="View Full Activity Details, Resources & WBS"
                        >
                          <Eye className="h-3.5 w-3.5 text-[#0B5FFF] dark:text-blue-300" />
                          <span className="font-semibold">Details</span>
                        </Button>

                        {/* Direct "Log Progress" Quick Action Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenLogProgress(activity);
                          }}
                          className="h-8 rounded-xl px-2.5 gap-1.5 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 font-semibold shadow-sm"
                          title="Log Daily Progress & Post Report"
                        >
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="font-semibold">Log</span>
                        </Button>

                        {/* Quick Camera Capture Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCapturingActivityId(activity.id);
                          }}
                          className="h-8 rounded-xl px-2 gap-1 text-xs text-[#0B5FFF] border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 dark:border-blue-900"
                          title="Capture Site Progress Photo"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline font-semibold">Photo</span>
                        </Button>

                        {/* Quick Copy / Duplicate Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateActivity(activity);
                          }}
                          className="h-8 rounded-xl px-2 gap-1 text-xs text-indigo-600 dark:text-indigo-400 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 dark:border-indigo-900"
                          title="Duplicate activity with prefilled resources & edit minor differences"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline font-semibold">Copy</span>
                        </Button>
                      </div>
                      
                      <div className={`flex flex-col gap-1 ${viewMode === 'grid' ? 'w-24' : 'w-1/2 md:w-full'}`}>
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase text-gray-500">
                          <span>Progress</span>
                          <span className="text-[#1A1C1E] dark:text-slate-50 font-mono">{activity.progress}%</span>
                        </div>
                        <ProgressBar value={activity.progress} />
                      </div>
                    </div>
                  </CardContent>
                </div>

                {expandedActivityId === activity.id && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs mt-3">
                      <div>
                        <span className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">Date Created</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{activity.createdAt || activity.startDate || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">Start Date</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{activity.startDate}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">Finish Date</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{activity.finishDate}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">Date Edited</span>
                        <span className="font-semibold text-purple-600 dark:text-purple-400">{activity.updatedAt || 'Not edited'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">Supervisor</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{activity.supervisor}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">Assigned</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{activity.assignedTo}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2 flex-wrap">
                      {canManage(userRole) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteActivity(activity.id);
                          }}
                          className="gap-2 rounded-xl text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/30 dark:border-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Activity
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateActivity(activity);
                        }}
                        className="gap-2 rounded-xl text-indigo-600 dark:text-indigo-400 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 dark:border-indigo-900"
                        title="Duplicate activity to create multiple items with minor differences"
                      >
                        <Copy className="h-4 w-4" />
                        Duplicate Activity
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSlideOverActivity(activity);
                        }}
                        className="gap-2 rounded-xl text-[#0B5FFF] border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 dark:border-blue-900"
                      >
                        <PanelRightOpen className="h-4 w-4" />
                        Slide-over Panel
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedActivity(activity);
                        }}
                        className="gap-2 rounded-xl text-[#0B5FFF] border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 dark:border-blue-900"
                      >
                        View Full Details
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      </div>
      )}
      {/* Direct Camera Capture Overlay for list view */}
      {capturingActivityId && (
        <CameraCapture
          onCapture={(dataUrl) => {
            const targetAct = activities.find(a => a.id === capturingActivityId);
            if (targetAct) {
              handleQuickCapturePhoto(targetAct, dataUrl);
            }
          }}
          onCancel={() => setCapturingActivityId(null)}
        />
      )}

      {/* Slide-over Metadata Panel Drawer */}
      <ActivitySlideOver
        activity={slideOverActivity}
        isOpen={Boolean(slideOverActivity)}
        onClose={() => setSlideOverActivity(null)}
        onOpenFullDetail={(act) => {
          setSlideOverActivity(null);
          setSelectedActivity(act);
        }}
        onDuplicate={(act) => {
          setSlideOverActivity(null);
          handleDuplicateActivity(act);
        }}
      />

      {/* Record Activity Modal */}
      {isRecordingModalOpen && (
        <RecordActivityModal
          projectId={projects[0]?.id || 'PROJ-001'}
          onClose={() => setIsRecordingModalOpen(false)}
          onReportGenerated={(newReport) => {
            if (addReport) {
              addReport(newReport);
            }
          }}
        />
      )}

      {/* Quick Log Progress & Daily Report Modal (from List View) */}
      {loggingProgressActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-4xl max-h-[94vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs shrink-0">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
                      Quick Log Progress & Daily Report
                    </h3>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {loggingProgressActivity.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap truncate">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{loggingProgressActivity.name}</span>
                    {loggingProgressActivity.workPackage && (
                      <>
                        <span>•</span>
                        <span>{loggingProgressActivity.workPackage}</span>
                      </>
                    )}
                    {loggingProgressActivity.discipline && (
                      <>
                        <span>•</span>
                        <span className="text-[#0B5FFF] font-medium">{loggingProgressActivity.discipline}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setLoggingProgressActivity(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleQuickLogProgressSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                
                {/* Granular vs Direct Mode Switcher */}
                {logProgressSubtasks.length > 0 && (
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                    <button
                      type="button"
                      onClick={() => setLogProgressIsGranularMode(true)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        logProgressIsGranularMode 
                          ? 'bg-white dark:bg-slate-700 text-[#0B5FFF] shadow-xs' 
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <CheckSquare className="h-3.5 w-3.5" />
                      <span>Granular Subtasks & Shift Output</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950 text-[#0B5FFF]">
                        {logProgressSubtasks.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogProgressIsGranularMode(false)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
                    {(() => {
                      const activeSubtaskIndex = Math.max(0, logProgressSubtasks.findIndex(s => s.id === logProgressActiveSubtaskId));
                      const currentActiveSubtask = logProgressSubtasks[activeSubtaskIndex] || logProgressSubtasks[0];

                      // Identify all subtasks with staged/remembered modifications in current session
                      const stagedSubtasks = logProgressSubtasks.filter(st => {
                        const input = logProgressSubtaskInputs[st.id];
                        if (!input) return false;
                        const hasShiftChange = input.mode === 'shift' && Number(input.shiftOutput) > 0;
                        const hasCumulativeChange = input.mode === 'cumulative' && Number(input.cumulativeOutput) !== (st.completedQuantity || 0);
                        const hasStatusChange = Boolean(input.status && input.status !== (st.status || 'Not Started'));
                        const hasNotes = Boolean(input.notes && input.notes.trim());
                        const hasHoldApproval = Boolean(input.holdPointApproved && !st.holdPointSignOff?.approved);
                        return hasShiftChange || hasCumulativeChange || hasStatusChange || hasNotes || hasHoldApproval;
                      }).map(st => {
                        const input = logProgressSubtaskInputs[st.id];
                        let label = '';
                        if (input.mode === 'shift' && Number(input.shiftOutput) > 0) {
                          label = `+${input.shiftOutput} ${st.unit || 'units'}`.trim();
                        } else if (input.mode === 'cumulative' && Number(input.cumulativeOutput) !== (st.completedQuantity || 0)) {
                          label = `Total: ${input.cumulativeOutput} ${st.unit || ''}`.trim();
                        } else if (input.status && input.status !== st.status) {
                          label = input.status;
                        } else if (input.holdPointApproved) {
                          label = 'QA Cleared';
                        } else {
                          label = 'Notes Staged';
                        }
                        return { subtask: st, input, changeLabel: label };
                      });

                      // Live auto-rollup calculation across all staged subtasks
                      const simulatedSubtasks = logProgressSubtasks.map(st => {
                        const input = logProgressSubtaskInputs[st.id];
                        if (!input) return st;
                        const hasShiftChange = input.mode === 'shift' && Number(input.shiftOutput) > 0;
                        const hasCumulativeChange = input.mode === 'cumulative' && Number(input.cumulativeOutput) !== (st.completedQuantity || 0);
                        const hasStatusChange = Boolean(input.status && input.status !== st.status);
                        const hasNotes = Boolean(input.notes && input.notes.trim());
                        const hasHoldApproval = Boolean(input.holdPointApproved && !st.holdPointSignOff?.approved);

                        if (hasShiftChange || hasCumulativeChange || hasStatusChange || hasNotes || hasHoldApproval) {
                          const prev = st.completedQuantity || 0;
                          const newTot = input.mode === 'shift' ? prev + (Number(input.shiftOutput) || 0) : (Number(input.cumulativeOutput) || 0);
                          let newStatus = input.status || st.status;
                          if (st.isHoldPoint && input.holdPointApproved) newStatus = 'Completed';
                          else if (st.targetQuantity && newTot >= st.targetQuantity && newStatus !== 'Completed') newStatus = 'Completed';

                          return {
                            ...st,
                            completedQuantity: newTot,
                            status: newStatus
                          };
                        }
                        return st;
                      });
                      const previewRollup = calculateActivityRollupFromSubtasks(loggingProgressActivity, simulatedSubtasks);

                      return (
                        <div className="space-y-4">
                          {/* Subtask Select Popout Bar */}
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                              <label className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                <CheckSquare className="h-4 w-4 text-[#0B5FFF]" /> Select & Update Subtask
                              </label>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                                  Subtask {activeSubtaskIndex + 1} of {logProgressSubtasks.length}
                                </span>
                                {stagedSubtasks.length > 0 && (
                                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                    <Check className="h-3 w-3" /> {stagedSubtasks.length} Remembered for Today
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Popout Selector Bar with Prev / Next Navigation */}
                            <div className="flex items-center gap-2 relative" ref={subtaskDropdownRef}>
                              {/* Prev Subtask Button */}
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                disabled={activeSubtaskIndex <= 0}
                                onClick={() => {
                                  if (activeSubtaskIndex > 0) {
                                    setLogProgressActiveSubtaskId(logProgressSubtasks[activeSubtaskIndex - 1].id);
                                  }
                                }}
                                className="h-12 w-12 rounded-2xl shrink-0 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 cursor-pointer shadow-xs"
                                title="Previous Subtask"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>

                              {/* Main Dropdown Popout Trigger Button */}
                              <button
                                type="button"
                                onClick={() => setIsSubtaskDropdownOpen(!isSubtaskDropdownOpen)}
                                className="flex-1 min-h-[48px] px-4 py-2 rounded-2xl bg-white dark:bg-slate-800/90 border-2 border-slate-200 dark:border-slate-700 hover:border-[#0B5FFF]/60 focus:border-[#0B5FFF] flex items-center justify-between gap-3 text-left shadow-xs transition-all cursor-pointer"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                    currentActiveSubtask?.status === 'Completed'
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-blue-100 dark:bg-blue-950 text-[#0B5FFF]'
                                  }`}>
                                    {activeSubtaskIndex + 1}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                                        {currentActiveSubtask?.title || 'Select Subtask'}
                                      </span>
                                      {currentActiveSubtask?.category && (
                                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-1.5 py-0.2 bg-slate-100 dark:bg-slate-700 rounded-md">
                                          {currentActiveSubtask.category}
                                        </span>
                                      )}
                                      {currentActiveSubtask?.targetQuantity ? (
                                        <span className="text-[11px] font-mono text-slate-400">
                                          ({currentActiveSubtask.completedQuantity || 0}/{currentActiveSubtask.targetQuantity}{currentActiveSubtask.unit ? ` ${currentActiveSubtask.unit}` : ''})
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {(() => {
                                    const stagedEntry = stagedSubtasks.find(s => s.subtask.id === currentActiveSubtask?.id);
                                    if (stagedEntry) {
                                      return (
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 shrink-0 flex items-center gap-1 shadow-xs">
                                          <Zap className="h-2.5 w-2.5 text-emerald-600" />
                                          {stagedEntry.changeLabel}
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isSubtaskDropdownOpen ? 'rotate-180 text-[#0B5FFF]' : ''}`} />
                                </div>
                              </button>

                              {/* Next Subtask Button */}
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                disabled={activeSubtaskIndex >= logProgressSubtasks.length - 1}
                                onClick={() => {
                                  if (activeSubtaskIndex < logProgressSubtasks.length - 1) {
                                    setLogProgressActiveSubtaskId(logProgressSubtasks[activeSubtaskIndex + 1].id);
                                  }
                                }}
                                className="h-12 w-12 rounded-2xl shrink-0 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 cursor-pointer shadow-xs"
                                title="Next Subtask"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>

                              {/* The Floating Popout Menu Panel */}
                              {isSubtaskDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[380px]">
                                  {/* Search & Category Tabs */}
                                  <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 space-y-2">
                                    <div className="relative">
                                      <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                                      <input
                                        type="text"
                                        placeholder="Filter subtasks by title, number, or category..."
                                        value={subtaskDropdownSearch}
                                        onChange={(e) => setSubtaskDropdownSearch(e.target.value)}
                                        className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0B5FFF]"
                                        autoFocus
                                      />
                                    </div>
                                    
                                    {/* Filter Buttons */}
                                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                                      <button
                                        type="button"
                                        onClick={() => setSubtaskDropdownFilter('all')}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                                          subtaskDropdownFilter === 'all'
                                            ? 'bg-[#0B5FFF] text-white shadow-xs'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                                        }`}
                                      >
                                        All ({logProgressSubtasks.length})
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setSubtaskDropdownFilter('incomplete')}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                                          subtaskDropdownFilter === 'incomplete'
                                            ? 'bg-[#0B5FFF] text-white shadow-xs'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                                        }`}
                                      >
                                        Incomplete ({logProgressSubtasks.filter(s => s.status !== 'Completed').length})
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setSubtaskDropdownFilter('staged')}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                                          subtaskDropdownFilter === 'staged'
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
                                        }`}
                                      >
                                        Staged for Shift ({stagedSubtasks.length})
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setSubtaskDropdownFilter('holdPoint')}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                                          subtaskDropdownFilter === 'holdPoint'
                                            ? 'bg-rose-600 text-white shadow-xs'
                                            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-800'
                                        }`}
                                      >
                                        QA Hold Points ({logProgressSubtasks.filter(s => s.isHoldPoint).length})
                                      </button>
                                    </div>
                                  </div>

                                  {/* Subtasks Scroll List */}
                                  <div className="overflow-y-auto p-1.5 divide-y divide-slate-100 dark:divide-slate-800/60">
                                    {(() => {
                                      const filtered = logProgressSubtasks.filter((st, idx) => {
                                        if (subtaskDropdownSearch.trim()) {
                                          const q = subtaskDropdownSearch.toLowerCase();
                                          const matchTitle = st.title.toLowerCase().includes(q);
                                          const matchCat = (st.category || '').toLowerCase().includes(q);
                                          const matchIdx = (idx + 1).toString().includes(q);
                                          if (!matchTitle && !matchCat && !matchIdx) return false;
                                        }
                                        if (subtaskDropdownFilter === 'incomplete') return st.status !== 'Completed';
                                        if (subtaskDropdownFilter === 'staged') return stagedSubtasks.some(s => s.subtask.id === st.id);
                                        if (subtaskDropdownFilter === 'holdPoint') return st.isHoldPoint;
                                        return true;
                                      });

                                      if (filtered.length === 0) {
                                        return (
                                          <div className="p-6 text-center text-xs text-slate-400">
                                            No subtasks match the search/filter criteria.
                                          </div>
                                        );
                                      }

                                      return filtered.map((st) => {
                                        const idx = logProgressSubtasks.findIndex(s => s.id === st.id);
                                        const isActive = st.id === currentActiveSubtask?.id;
                                        const stagedEntry = stagedSubtasks.find(s => s.subtask.id === st.id);

                                        return (
                                          <button
                                            key={st.id || idx}
                                            type="button"
                                            onClick={() => {
                                              setLogProgressActiveSubtaskId(st.id);
                                              setIsSubtaskDropdownOpen(false);
                                            }}
                                            className={`w-full p-2.5 rounded-xl flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${
                                              isActive 
                                                ? 'bg-blue-50/90 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800/80 shadow-xs' 
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                            }`}
                                          >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                                st.status === 'Completed' 
                                                  ? 'bg-emerald-500 text-white' 
                                                  : isActive 
                                                    ? 'bg-[#0B5FFF] text-white' 
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                              }`}>
                                                {idx + 1}
                                              </span>
                                              <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <span className={`text-xs font-bold truncate ${isActive ? 'text-[#0B5FFF] dark:text-blue-300' : 'text-slate-900 dark:text-white'}`}>
                                                    {st.title}
                                                  </span>
                                                  {st.isHoldPoint && (
                                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200">
                                                      🔒 QA Gate
                                                    </span>
                                                  )}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium mt-0.5">
                                                  <span>{st.category || 'General'}</span>
                                                  <span>•</span>
                                                  <span>{st.completedQuantity || 0}/{st.targetQuantity || 0} {st.unit || ''}</span>
                                                  <span>•</span>
                                                  <span className={`${st.status === 'Completed' ? 'text-emerald-600' : st.status === 'In Progress' ? 'text-blue-600' : 'text-slate-400'}`}>
                                                    {st.status || 'Not Started'}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>

                                            <div className="shrink-0 flex items-center gap-1.5">
                                              {stagedEntry && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1">
                                                  <Check className="h-3 w-3 text-emerald-600" /> {stagedEntry.changeLabel}
                                                </span>
                                              )}
                                              {isActive && <Check className="h-4 w-4 text-[#0B5FFF]" />}
                                            </div>
                                          </button>
                                        );
                                      });
                                    })()}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Staged Subtasks Quick Ribbon (Remembered Tasks Summary) */}
                            {stagedSubtasks.length > 0 && (
                              <div className="p-2.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 flex flex-col gap-1.5">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Staged For Today ({stagedSubtasks.length} Subtasks Remembered)
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const resetInputs: Record<string, any> = {};
                                      logProgressSubtasks.forEach(st => {
                                        resetInputs[st.id] = {
                                          mode: 'shift',
                                          shiftOutput: 0,
                                          cumulativeOutput: st.completedQuantity || 0,
                                          status: st.status || 'Not Started',
                                          notes: '',
                                          chainageSpan: st.chainage || '',
                                          holdPointApproved: st.holdPointSignOff?.approved || false,
                                          holdPointSignedBy: st.holdPointSignOff?.signedBy || currentUserProfile?.name || ''
                                        };
                                      });
                                      setLogProgressSubtaskInputs(resetInputs);
                                    }}
                                    className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                                  >
                                    Clear All Staged
                                  </button>
                                </div>

                                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                                  {stagedSubtasks.map(({ subtask: st, changeLabel }) => {
                                    const idx = logProgressSubtasks.findIndex(s => s.id === st.id);
                                    const isCurrentlyActive = st.id === currentActiveSubtask?.id;
                                    return (
                                      <div
                                        key={st.id}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
                                          isCurrentlyActive
                                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                            : 'bg-white dark:bg-slate-800 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100/50'
                                        }`}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => setLogProgressActiveSubtaskId(st.id)}
                                          className="flex items-center gap-1 text-left cursor-pointer"
                                        >
                                          <span className="font-mono font-bold">#{idx + 1}</span>
                                          <span className="truncate max-w-[140px]">{st.title}</span>
                                          <span className="opacity-90 font-mono text-[10px]">({changeLabel})</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const updated = { ...logProgressSubtaskInputs };
                                            updated[st.id] = {
                                              mode: 'shift',
                                              shiftOutput: 0,
                                              cumulativeOutput: st.completedQuantity || 0,
                                              status: st.status || 'Not Started',
                                              notes: '',
                                              chainageSpan: st.chainage || '',
                                              holdPointApproved: st.holdPointSignOff?.approved || false,
                                              holdPointSignedBy: st.holdPointSignOff?.signedBy || currentUserProfile?.name || ''
                                            };
                                            setLogProgressSubtaskInputs(updated);
                                          }}
                                          className="hover:opacity-70 p-0.5 rounded ml-0.5 cursor-pointer"
                                          title="Clear this subtask from today's shift"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Single Active Subtask Editor Card */}
                          {currentActiveSubtask && (() => {
                            const st = currentActiveSubtask;
                            const idx = activeSubtaskIndex;
                            const input = logProgressSubtaskInputs[st.id] || {
                              mode: 'shift',
                              shiftOutput: 0,
                              cumulativeOutput: st.completedQuantity || 0,
                              status: st.status || 'Not Started',
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
                              <div className="p-4 sm:p-5 rounded-3xl bg-slate-50/90 dark:bg-slate-800/70 border-2 border-slate-200/90 dark:border-slate-700/80 shadow-sm flex flex-col gap-4">
                                {/* Card Header */}
                                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="px-2.5 py-1 rounded-xl bg-[#0B5FFF] text-white font-extrabold text-xs font-mono shrink-0 shadow-xs">
                                      #{idx + 1}
                                    </span>
                                    <div className="min-w-0">
                                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                                        {st.title}
                                      </h4>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <Badge variant="outline" className="text-[10px]">{st.category || 'General'}</Badge>
                                        {st.isMilestone && (
                                          <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 px-1.5 py-0.2 rounded border border-purple-200">
                                            🎯 Milestone
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {metrics.dailyAverage > 0 && (
                                      <span 
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800"
                                        title={`Average Daily Output: ${metrics.formattedRate}${metrics.projectedDaysLeft !== undefined ? ` • Est. ${metrics.projectedDaysLeft} shift(s) remaining` : ''}`}
                                      >
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
                                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs focus:outline-none focus:border-[#0B5FFF]"
                                    >
                                      <option value="Not Started">Not Started</option>
                                      <option value="In Progress">In Progress</option>
                                      <option value="Completed">Completed</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Shift Output Mode & Quantity Inputs */}
                                <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 shadow-xs">
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = { ...logProgressSubtaskInputs };
                                          updated[st.id] = { ...input, mode: 'shift' };
                                          setLogProgressSubtaskInputs(updated);
                                        }}
                                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
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
                                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                          input.mode === 'cumulative' 
                                            ? 'bg-white dark:bg-slate-700 text-[#0B5FFF] font-bold shadow-xs' 
                                            : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                      >
                                        Set Cumulative Total
                                      </button>
                                    </div>

                                    <span className="text-xs font-extrabold text-[#0B5FFF] bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                                      New Total: {newCalculatedTotal} {st.unit || 'units'} {targetQty > 0 ? `(${newPct}%)` : ''}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {input.mode === 'shift' ? (
                                      <div>
                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                                          Today's Shift Output ({st.unit || 'units'})
                                        </label>
                                        <div className="relative">
                                          <span className="absolute left-3 top-2.5 font-bold text-emerald-600">+</span>
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
                                            className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-[#0B5FFF] focus:outline-none focus:border-[#0B5FFF]"
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      <div>
                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
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
                                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
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
                                    <div className="space-y-1.5 pt-1">
                                      <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                                        <div 
                                          className="h-full bg-blue-500" 
                                          style={{ width: `${Math.min(100, Math.round((prevQty / targetQty) * 100))}%` }} 
                                          title={`Previous Completed: ${prevQty} ${st.unit}`}
                                        />
                                        {input.mode === 'shift' && input.shiftOutput > 0 && (
                                          <div 
                                            className="h-full bg-emerald-500 animate-pulse" 
                                            style={{ width: `${Math.min(100 - Math.round((prevQty / targetQty) * 100), Math.round((input.shiftOutput / targetQty) * 100))}%` }} 
                                            title={`Today's Shift Gain: +${input.shiftOutput} ${st.unit}`}
                                          />
                                        )}
                                      </div>
                                      <div className="flex justify-between text-[11px] text-slate-500">
                                        <span>Prior Logged: {prevQty} {st.unit}</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">
                                          Target: {targetQty} {st.unit} ({newPct}% Total)
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* QA Hold Point Inspection Box */}
                                {st.isHoldPoint && (
                                  <div className="p-3.5 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-2xl space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                                        <ShieldCheck className="h-4 w-4 text-rose-600" />
                                        QA Hold Point Quality Gate
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
                                          className="h-4 w-4 text-emerald-600 rounded cursor-pointer"
                                        />
                                        <span>Clear & Approve Hold Point</span>
                                      </label>
                                    </div>
                                    {input.holdPointApproved && (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-rose-200/60">
                                        <input
                                          type="text"
                                          placeholder="Inspector / Signee Name"
                                          value={input.holdPointSignedBy}
                                          onChange={(e) => {
                                            const updated = { ...logProgressSubtaskInputs };
                                            updated[st.id] = { ...input, holdPointSignedBy: e.target.value };
                                            setLogProgressSubtaskInputs(updated);
                                          }}
                                          className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-xl text-xs text-slate-900 dark:text-white"
                                        />
                                        <span className="text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1 font-semibold">
                                          <CheckCircle2 className="h-3.5 w-3.5" /> Cleared for today's daily record
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Subtask Specific Remarks */}
                                <div>
                                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                                    Subtask Field Remarks & Observations
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Trench marked out along pegs 12-18, soil density tested..."
                                    value={input.notes}
                                    onChange={(e) => {
                                      const updated = { ...logProgressSubtaskInputs };
                                      updated[st.id] = { ...input, notes: e.target.value };
                                      setLogProgressSubtaskInputs(updated);
                                    }}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B5FFF]"
                                  />
                                </div>

                                {/* Bottom Card Subtask Stepper Actions */}
                                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-700/80 gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={activeSubtaskIndex <= 0}
                                    onClick={() => {
                                      if (activeSubtaskIndex > 0) {
                                        setLogProgressActiveSubtaskId(logProgressSubtasks[activeSubtaskIndex - 1].id);
                                      }
                                    }}
                                    className="text-xs text-slate-600 dark:text-slate-300 gap-1 rounded-xl cursor-pointer disabled:opacity-40"
                                  >
                                    <ChevronLeft className="h-3.5 w-3.5" /> Previous Subtask
                                  </Button>

                                  <div className="text-[11px] font-semibold text-slate-400 text-center">
                                    {stagedSubtasks.some(s => s.subtask.id === st.id) ? (
                                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                                        <Check className="h-3.5 w-3.5" /> Staged & Remembered
                                      </span>
                                    ) : (
                                      <span>Not modified yet</span>
                                    )}
                                  </div>

                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => {
                                      if (activeSubtaskIndex < logProgressSubtasks.length - 1) {
                                        setLogProgressActiveSubtaskId(logProgressSubtasks[activeSubtaskIndex + 1].id);
                                      }
                                    }}
                                    disabled={activeSubtaskIndex >= logProgressSubtasks.length - 1}
                                    className="text-xs bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 gap-1 rounded-xl font-bold cursor-pointer disabled:opacity-40"
                                  >
                                    <span>Next Subtask</span>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Master Activity Live Rollup Indicator Banner */}
                          <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/80 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-xs">
                            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                              <Sparkles className="h-4 w-4 text-[#0B5FFF]" />
                              <span>Auto Master Activity Rollup:</span>
                              <span className="text-[#0B5FFF] font-extrabold text-sm">{previewRollup.overallProgress}% Complete</span>
                              {loggingProgressActivity.targetQuantity ? (
                                <span className="text-slate-500 font-normal">
                                  ({previewRollup.actualQuantity} / {loggingProgressActivity.targetQuantity} {loggingProgressActivity.unit || 'units'})
                                </span>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-2 font-semibold text-slate-600 dark:text-slate-300">
                              <span>{previewRollup.completedSubtasksCount} / {previewRollup.totalSubtasksCount} Subtasks Completed</span>
                              {stagedSubtasks.length > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                                  {stagedSubtasks.length} Staged for Report
                                </span>
                              )}
                            </div>
                          </div>
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
                          <TrendingUp className="h-4 w-4 text-[#0B5FFF]" /> Master Activity Output
                        </label>
                        <span className="text-sm font-black text-[#0B5FFF]">{logProgressPercent}%</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                            Actual Quantity Completed ({loggingProgressActivity.unit || 'units'})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={logProgressActualQty}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setLogProgressActualQty(val);
                              if (loggingProgressActivity.targetQuantity && loggingProgressActivity.targetQuantity > 0) {
                                const calculated = Math.min(100, Math.round((val / loggingProgressActivity.targetQuantity) * 100));
                                setLogProgressPercent(calculated);
                                if (calculated === 100) setLogProgressStatus('Completed');
                                else if (calculated > 0) setLogProgressStatus('In Progress');
                              }
                            }}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#0B5FFF]"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                            Activity Master Status
                          </label>
                          <select
                            value={logProgressStatus}
                            onChange={(e) => setLogProgressStatus(e.target.value as any)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#0B5FFF]"
                          >
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Blocked">Blocked</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={logProgressPercent}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setLogProgressPercent(val);
                            if (loggingProgressActivity.targetQuantity && loggingProgressActivity.targetQuantity > 0) {
                              setLogProgressActualQty(Math.round((val / 100) * loggingProgressActivity.targetQuantity));
                            }
                            if (val === 100) setLogProgressStatus('Completed');
                            else if (val > 0) setLogProgressStatus('In Progress');
                            else setLogProgressStatus('Not Started');
                          }}
                          className="w-full accent-[#0B5FFF] cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Shift & Site Environmental Conditions */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 text-[#0B5FFF]" /> Shift & Site Environmental Context
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">Auto-populates to Daily Reports</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Shift Date</label>
                      <input
                        type="date"
                        value={logProgressDate}
                        onChange={(e) => setLogProgressDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Weather Conditions</label>
                      <select
                        value={logProgressWeather}
                        onChange={(e) => setLogProgressWeather(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                      >
                        <option value="Sunny">☀️ Sunny / Clear</option>
                        <option value="Partly Cloudy">⛅ Partly Cloudy</option>
                        <option value="Overcast">☁️ Overcast</option>
                        <option value="Rain">🌧️ Rain / Wet</option>
                        <option value="Windy">💨 High Winds</option>
                        <option value="Extreme Heat">🔥 Extreme Heat</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Ambient Temperature</label>
                      <input
                        type="text"
                        placeholder="e.g. 24°C"
                        value={logProgressTemp}
                        onChange={(e) => setLogProgressTemp(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      Site & Access Conditions
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ground firm, crane pad stable, access haul road open"
                      value={logProgressSiteConditions}
                      onChange={(e) => setLogProgressSiteConditions(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Delay & Blocker Capture */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Blockers or Delay Causes (Optional)
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {['🌧️ Rain / Weather', '🚜 Plant Breakdown', '📦 Material Delivery Delay', '🛑 QA Hold / Re-work', '🚧 Site Access Obstruction'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setLogProgressDelayReason(logProgressDelayReason === tag ? '' : tag)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                          logProgressDelayReason === tag 
                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs font-bold' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  {logProgressDelayReason && (
                    <input
                      type="text"
                      placeholder="Specific blocker note (e.g. Ready-mix truck delayed by 2 hours due to highway congestion)..."
                      value={logProgressDelayReason}
                      onChange={(e) => setLogProgressDelayReason(e.target.value)}
                      className="w-full px-3 py-2 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                    />
                  )}
                </div>

                {/* Supervisor Field Remarks */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-[#0B5FFF]" />
                    Supervisor Production Summary & Remarks
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter overall shift summary, surveyor sign-offs, contractor handover notes, or key milestone achievements..."
                    value={logProgressNotes}
                    onChange={(e) => setLogProgressNotes(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0B5FFF] shadow-xs"
                  />
                </div>

                {/* Auto Daily Report Notice & Checkbox */}
                <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="h-5 w-5 text-[#0B5FFF] shrink-0" />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        Auto-Post to Executive Daily Site Reports
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Compiles itemized shift output, daily run-rates, QA certifications, plant & labour records into official project logs.
                      </span>
                    </div>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-[#0B5FFF] shrink-0">
                    <input
                      type="checkbox"
                      checked={logProgressPostReport}
                      onChange={(e) => setLogProgressPostReport(e.target.checked)}
                      className="h-4 w-4 text-[#0B5FFF] rounded cursor-pointer"
                    />
                    <span>Post Report</span>
                  </label>
                </div>

              </div>

              {/* Modal Actions Footer */}
              <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-900/60 flex-shrink-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setLoggingProgressActivity(null)}
                  className="rounded-xl px-5 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="rounded-xl px-6 text-xs font-bold bg-[#0B5FFF] hover:bg-blue-600 text-white gap-2 shadow-sm cursor-pointer"
                >
                  <Save className="h-4 w-4" /> Save Progress & Post Report
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Camera Capture Overlay for list view */}
      {capturingActivityId && (
        <CameraCapture
          onCapture={(dataUrl) => {
            const targetAct = activities.find(a => a.id === capturingActivityId);
            if (targetAct) {
              handleQuickCapturePhoto(targetAct, dataUrl);
            }
          }}
          onCancel={() => setCapturingActivityId(null)}
        />
      )}

      {/* Slide-over Metadata Panel Drawer */}
      <ActivitySlideOver
        activity={slideOverActivity}
        isOpen={Boolean(slideOverActivity)}
        onClose={() => setSlideOverActivity(null)}
        onOpenFullDetail={(act) => {
          setSlideOverActivity(null);
          setSelectedActivity(act);
        }}
        onDuplicate={(act) => {
          setSlideOverActivity(null);
          handleDuplicateActivity(act);
        }}
      />

      {/* Record Activity Modal */}
      {isRecordingModalOpen && (
        <RecordActivityModal
          projectId={projects[0]?.id || 'PROJ-001'}
          onClose={() => setIsRecordingModalOpen(false)}
          onReportGenerated={(newReport) => {
            if (addReport) {
              addReport(newReport);
            }
          }}
        />
      )}

      {/* Delete Activity Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingActivityId)}
        title="Delete Construction Activity"
        itemName={activities.find(a => a.id === deletingActivityId)?.name || deletingActivityId || ''}
        message="Are you sure you want to delete this activity? This will remove all associated subtasks, photos, and resource allocations."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingActivityId(null)}
        confirmLabel="Delete Activity"
      />

      {/* Interactive Activities Print Preview & PDF Report Modal */}
      {isPdfModalOpen && (
        <ActivitiesPdfModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          activities={filtered}
          projects={projects}
          currentUserProfile={currentUserProfile}
          defaultProjectId={projects[0]?.id || 'all'}
          defaultFilterLabel={searchTerm ? `Search query: "${searchTerm}"` : timeframe !== 'all' ? `Timeframe: ${timeframe}` : 'All Filtered Activities'}
          initialTemplate={mainScreen === 'daily_logs' ? 'daily_shift' : 'executive'}
        />
      )}
    </div>
  );
}

