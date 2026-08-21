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
  Building2
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { exportActivitiesToExcel } from '../lib/excelExport';
import { printActivitiesSummary } from '../lib/pdfPrint';
import { WORKSTREAMS, WorkstreamType } from '../types';
import { ActivityKanbanBoard } from '../components/ActivityKanbanBoard';
import { ActivityDataTable } from '../components/ActivityDataTable';
import { PTSCrossDisciplineMatrix } from '../components/PTSCrossDisciplineMatrix';
import { DisciplineTrackerView } from '../components/DisciplineTrackerView';
import { DailyLogsTrackerView } from '../components/DailyLogsTrackerView';
import { ActivityNotesTrackerView } from '../components/ActivityNotesTrackerView';
import { ActivitiesPdfModal } from '../components/ActivitiesPdfModal';

export function Activities() {
  const { activities, projects, updateActivity, addActivity, deleteActivity, addReport, addAuditLog, userRole, currentUserProfile, hasPermission, notes } = useAppContext();
  const canEditActivities = hasPermission('activities');
  const [mainScreen, setMainScreen] = useState<'activities' | 'disciplines' | 'daily_logs' | 'notes'>('activities');
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

  // Quick Log Progress Modal State
  const [loggingProgressActivity, setLoggingProgressActivity] = useState<Activity | null>(null);
  const [logProgressActualQty, setLogProgressActualQty] = useState<number>(0);
  const [logProgressPercent, setLogProgressPercent] = useState<number>(0);
  const [logProgressStatus, setLogProgressStatus] = useState<ActivityStatus>('Not Started');
  const [logProgressNotes, setLogProgressNotes] = useState('');
  const [logProgressDate, setLogProgressDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [logProgressWeather, setLogProgressWeather] = useState<string>('Sunny');
  const [logProgressTemp, setLogProgressTemp] = useState<string>('24°C');
  const [logProgressSiteConditions, setLogProgressSiteConditions] = useState<string>('Site dry and fully accessible');
  const [logProgressSubtasks, setLogProgressSubtasks] = useState<SubTask[]>([]);

  const handleOpenLogProgress = (act: Activity) => {
    setLoggingProgressActivity(act);
    setLogProgressActualQty(act.actualQuantity || 0);
    setLogProgressPercent(act.progress || 0);
    setLogProgressStatus(act.status || 'Not Started');
    setLogProgressNotes('');
    setLogProgressDate(new Date().toISOString().split('T')[0]);
    setLogProgressWeather('Sunny');
    setLogProgressTemp('24°C');
    setLogProgressSiteConditions('Site dry and fully accessible');
    setLogProgressSubtasks(act.subtasks ? JSON.parse(JSON.stringify(act.subtasks)) : []);
  };

  const handleToggleLogSubtask = (stId: string) => {
    setLogProgressSubtasks(prev => prev.map(st => {
      if (st.id === stId) {
        const nextStatus = st.status === 'Completed' ? 'In Progress' : 'Completed';
        const nextCompleted = nextStatus === 'Completed';
        const completedQty = nextCompleted ? (st.targetQuantity || 1) : 0;
        return {
          ...st,
          status: nextStatus,
          completed: nextCompleted,
          completedQuantity: completedQty
        };
      }
      return st;
    }));
  };

  const handleQuickLogProgressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggingProgressActivity) return;

    const totalLabourHours = (loggingProgressActivity.assignedLabour || []).reduce((sum, l) => sum + (l.hours || 0), 0);
    const workersCount = (loggingProgressActivity.assignedLabour || []).length;
    const equipmentCount = (loggingProgressActivity.assignedEquipment || []).length;

    // Structured subtasks summary
    const subtaskSummary = logProgressSubtasks.length > 0 
      ? logProgressSubtasks.map((st, idx) => 
          `[${st.status === 'Completed' ? 'x' : ' '}] #${idx + 1} ${st.title} (${st.category || 'General'}) - ${st.completedQuantity || 0}/${st.targetQuantity || 0} ${st.unit || 'units'} [${st.status}]`
        ).join('\n')
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
Discipline / Package: ${loggingProgressActivity.workPackage} | ${loggingProgressActivity.discipline}
Overall Activity Progress: ${logProgressPercent}% | Output: ${logProgressActualQty} / ${loggingProgressActivity.targetQuantity || 0} ${loggingProgressActivity.unit || ''}
Priority: ${loggingProgressActivity.priority || 'Normal'} | Shift Hours: ${totalLabourHours} hrs

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
    const newDailyReport: DailyReport = {
      id: reportId,
      date: logProgressDate,
      projectId: loggingProgressActivity.projectId || projects[0]?.id || 'PROJ-001',
      weather: logProgressWeather,
      temperature: logProgressTemp,
      siteConditions: logProgressSiteConditions,
      significantEvents: `Progress logged on ${loggingProgressActivity.name}: advanced to ${logProgressPercent}% (${logProgressActualQty} / ${loggingProgressActivity.targetQuantity || 0} ${loggingProgressActivity.unit || ''}). ${logProgressNotes ? logProgressNotes.slice(0, 100) : ''}`,
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

    if (addReport) {
      addReport(newDailyReport);
    }

    const updatedActivity: Activity = {
      ...loggingProgressActivity,
      progress: logProgressPercent,
      actualQuantity: logProgressActualQty,
      status: logProgressStatus,
      subtasks: logProgressSubtasks,
      updatedAt: new Date().toISOString().split('T')[0],
      remarks: logProgressNotes.trim()
        ? `[${logProgressDate} Progress Log (${logProgressPercent}%)]: ${logProgressNotes.trim()}\n${loggingProgressActivity.remarks || ''}`
        : loggingProgressActivity.remarks
    };

    if (updateActivity) {
      updateActivity(updatedActivity);
    }

    if (addAuditLog) {
      addAuditLog({
        id: `AL-${Math.random().toString(36).substr(2, 9)}`,
        projectId: loggingProgressActivity.projectId || projects[0]?.id || 'PROJ-001',
        userId: userRole === 'Manager' ? 'Current User' : 'Current User',
        action: 'Progress Logged & Report Posted',
        details: `Logged progress on "${loggingProgressActivity.name}" (${logProgressPercent}%, ${logProgressActualQty} ${loggingProgressActivity.unit || ''}) and posted Daily Report #${reportId}.`,
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

    // 2. Timeframe Filter
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

  const handleSaveActivity = (updated: Activity) => {
    if (updateActivity) {
      updateActivity(updated);
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
      <div className="p-4 md:p-8">
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
    <div className="flex flex-col gap-6 p-4 md:p-8">
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
            <ActivityTimeline activities={filtered} onSelectActivity={(id) => setExpandedActivityId(expandedActivityId === id ? null : id)} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white dark:from-slate-800/80 dark:via-slate-800/40 dark:to-slate-900 flex-shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Log Progress & Daily Report
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {loggingProgressActivity.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
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
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">{loggingProgressActivity.discipline}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setLoggingProgressActivity(null)}
                className="p-2.5 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleQuickLogProgressSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                
                {/* 2-Column Responsive Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Progress Metrics, Sliders & Site Data (7 Cols) */}
                  <div className="lg:col-span-7 space-y-5">
                    
                    {/* Primary Progress Metrics Card */}
                    <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        
                        {/* Completion Percentage */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Progress Completion
                          </label>
                          <div className="relative">
                            <input 
                              type="number"
                              min="0"
                              max="100"
                              required
                              value={logProgressPercent}
                              onChange={(e) => setLogProgressPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                              className="w-full h-11 px-3.5 pr-8 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-base text-[#0B5FFF] focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none transition-shadow"
                            />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                          </div>
                        </div>

                        {/* Actual Output */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Actual Output ({loggingProgressActivity.unit || 'units'})
                          </label>
                          <input 
                            type="number"
                            min="0"
                            value={logProgressActualQty}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setLogProgressActualQty(val);
                              if (loggingProgressActivity.targetQuantity && loggingProgressActivity.targetQuantity > 0) {
                                const calculatedPct = Math.min(100, Math.round((val / loggingProgressActivity.targetQuantity) * 100));
                                setLogProgressPercent(calculatedPct);
                              }
                            }}
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none transition-shadow"
                            placeholder={`Target: ${loggingProgressActivity.targetQuantity || 0}`}
                          />
                        </div>

                        {/* Activity Status */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Activity Status
                          </label>
                          <select 
                            value={logProgressStatus}
                            onChange={(e) => setLogProgressStatus(e.target.value as ActivityStatus)}
                            className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none transition-shadow"
                          >
                            <option value="Not Started">⚪ Not Started</option>
                            <option value="In Progress">🔵 In Progress</option>
                            <option value="Completed">🟢 Completed</option>
                            <option value="Blocked">🔴 Blocked</option>
                          </select>
                        </div>
                      </div>

                      {/* Progress Slider & Quick Jump Markers */}
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/50 space-y-2.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-600 dark:text-slate-300">Quick Adjust Slider</span>
                          <span className="font-mono font-black text-sm text-[#0B5FFF]">{logProgressPercent}%</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="100"
                          value={logProgressPercent}
                          onChange={(e) => {
                            const pct = parseInt(e.target.value);
                            setLogProgressPercent(pct);
                            if (loggingProgressActivity.targetQuantity && loggingProgressActivity.targetQuantity > 0) {
                              setLogProgressActualQty(Math.round((pct / 100) * loggingProgressActivity.targetQuantity));
                            }
                            if (pct === 100) setLogProgressStatus('Completed');
                            else if (pct > 0) setLogProgressStatus('In Progress');
                          }}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#0B5FFF]"
                        />
                        {/* Quick Presets */}
                        <div className="flex items-center justify-between gap-1.5 pt-1">
                          {[0, 25, 50, 75, 100].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                setLogProgressPercent(preset);
                                if (loggingProgressActivity.targetQuantity && loggingProgressActivity.targetQuantity > 0) {
                                  setLogProgressActualQty(Math.round((preset / 100) * loggingProgressActivity.targetQuantity));
                                }
                                if (preset === 100) setLogProgressStatus('Completed');
                                else if (preset > 0) setLogProgressStatus('In Progress');
                                else if (preset === 0) setLogProgressStatus('Not Started');
                              }}
                              className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all border ${
                                logProgressPercent === preset
                                  ? 'bg-[#0B5FFF] text-white border-[#0B5FFF] shadow-sm'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                              }`}
                            >
                              {preset}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Weather, Date & Conditions */}
                    <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-3.5">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Shift & Site Conditions
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Report Date</label>
                          <input 
                            type="date"
                            required
                            value={logProgressDate}
                            onChange={(e) => setLogProgressDate(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Weather</label>
                          <select 
                            value={logProgressWeather}
                            onChange={(e) => setLogProgressWeather(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none"
                          >
                            <option value="Sunny">☀️ Sunny / Clear</option>
                            <option value="Partly Cloudy">⛅ Partly Cloudy</option>
                            <option value="Overcast">☁️ Overcast</option>
                            <option value="Rain">🌧️ Rain / Wet</option>
                            <option value="Stormy">⛈️ Stormy / Suspended</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Temperature</label>
                          <input 
                            type="text"
                            value={logProgressTemp}
                            onChange={(e) => setLogProgressTemp(e.target.value)}
                            placeholder="e.g. 24°C"
                            className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Supervisor Remarks */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Supervisor Field Remarks
                      </label>
                      <textarea 
                        rows={3}
                        value={logProgressNotes}
                        onChange={(e) => setLogProgressNotes(e.target.value)}
                        placeholder="Record shift production summary, weather impacts, inspection approvals, or contractor handover notes..."
                        className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none transition-shadow"
                      />
                    </div>
                  </div>

                  {/* Right Column: Active Subtasks & Quality Hold Points (5 Cols) */}
                  <div className="lg:col-span-5 flex flex-col space-y-4">
                    {logProgressSubtasks.length > 0 ? (
                      <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex flex-col flex-1">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-slate-700/60 flex-shrink-0">
                          <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                              <CheckSquare className="h-4 w-4 text-[#0B5FFF]" />
                              Active Subtasks
                            </label>
                            <span className="text-[11px] font-semibold text-[#0B5FFF]">
                              {logProgressSubtasks.filter(s => s.status === 'Completed').length} of {logProgressSubtasks.length} Completed
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setLogProgressSubtasks(prev => prev.map(st => ({
                                  ...st,
                                  status: 'Completed',
                                  completed: true,
                                  completedQuantity: st.targetQuantity || 1
                                })));
                              }}
                              className="text-[10px] font-bold px-2 py-1 rounded bg-blue-100 dark:bg-blue-950/60 text-[#0B5FFF] hover:bg-blue-200 transition-colors"
                            >
                              All
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setLogProgressSubtasks(prev => prev.map(st => ({
                                  ...st,
                                  status: 'Not Started',
                                  completed: false,
                                  completedQuantity: 0
                                })));
                              }}
                              className="text-[10px] font-bold px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition-colors"
                            >
                              Reset
                            </button>
                          </div>
                        </div>

                        {/* Scrollable Subtasks Container */}
                        <div className="mt-3 overflow-y-auto max-h-[380px] pr-1 space-y-2 flex-1 custom-scrollbar">
                          {logProgressSubtasks.map((st) => {
                            const isCompleted = st.status === 'Completed';
                            return (
                              <div 
                                key={st.id}
                                onClick={() => handleToggleLogSubtask(st.id)}
                                className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start justify-between gap-3 text-xs ${
                                  isCompleted 
                                    ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50' 
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 shadow-sm'
                                }`}
                              >
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <div className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                                    isCompleted ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                                  }`}>
                                    {isCompleted && <Check className="h-3 w-3 stroke-[3]" />}
                                  </div>
                                  <div className="min-w-0">
                                    <span className={`font-semibold block truncate ${isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                                      {st.title}
                                    </span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                      {st.category || 'General'} • {st.completedQuantity || 0}/{st.targetQuantity || 1} {st.unit || 'units'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                                  {st.isMilestone && (
                                    <span className="text-[9px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-1.5 py-0.5 rounded">
                                      🎯 Milestone
                                    </span>
                                  )}
                                  {st.isHoldPoint && (
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                      st.holdPointSignOff?.approved 
                                        ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60'
                                        : 'text-rose-700 bg-rose-100 dark:bg-rose-950/60'
                                    }`}>
                                      🔒 {st.holdPointSignOff?.approved ? 'QA Approved' : 'Hold Point'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 flex-1">
                        <CheckSquare className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        <p className="text-xs font-bold text-slate-500">No subtasks configured</p>
                        <p className="text-[11px] text-slate-400 max-w-[200px]">Use the activity detail view to configure step-by-step method subtasks and hold points.</p>
                      </div>
                    )}

                    {/* Automatic Report Notice */}
                    <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900/60 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
                      <FileText className="h-4 w-4 text-[#0B5FFF] shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-relaxed">
                        Saving this progress log will automatically generate and publish a verified <strong>Executive Daily Site Report</strong> with complete subtask status, workforce hours, and plant allocations.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Actions Footer */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/60 flex-shrink-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setLoggingProgressActivity(null)}
                  className="rounded-xl px-5 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="rounded-xl px-6 text-xs font-bold bg-[#0B5FFF] hover:bg-blue-700 text-white gap-2 shadow-sm"
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

