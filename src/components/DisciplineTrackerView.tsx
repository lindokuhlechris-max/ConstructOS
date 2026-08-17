import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  ActivityStatus, 
  SubTask, 
  WORKSTREAMS, 
  WorkstreamType, 
  SubTaskCategory,
  SubTaskMeasurementType 
} from '../types';
import { Badge, ProgressBar, Button } from './ui';
import { PTSCrossDisciplineMatrix } from './PTSCrossDisciplineMatrix';
import { SurveyTrackerView } from './SurveyTrackerView';
import { useAppContext } from '../context/AppContext';
import { 
  Compass, 
  ShieldCheck, 
  Package, 
  ShieldAlert, 
  Zap, 
  Building2, 
  Sparkles, 
  Plus, 
  Search, 
  Link2, 
  Unlink, 
  CheckCircle2, 
  PlayCircle, 
  AlertTriangle, 
  CalendarClock, 
  Users, 
  Truck, 
  Kanban, 
  Table as TableIcon, 
  LayoutGrid, 
  ChevronRight, 
  Edit3, 
  ExternalLink,
  Calendar,
  X,
  CheckSquare,
  Flag,
  FileText
} from 'lucide-react';

interface DisciplineTrackerViewProps {
  activities: Activity[];
  onSelectActivity: (activity: Activity) => void;
  onOpenSlideOver: (activity: Activity) => void;
  onOpenLogProgress: (activity: Activity) => void;
  onAddNewDisciplineItem: (workstream: WorkstreamType) => void;
  onUpdateStatus: (activityId: string, newStatus: ActivityStatus) => void;
}

type DisciplineTab = WorkstreamType | 'MATRIX' | 'SURVEY_SPANS';

export interface DisciplineWorkItem {
  id: string; // unique item id (subtask id or activity id)
  subtaskId?: string;
  isSubtask: boolean;
  title: string;
  discipline: WorkstreamType;
  category: string;
  status: ActivityStatus;
  progress: number;
  completedQuantity?: number;
  targetQuantity?: number;
  unit?: string;
  startDate?: string;
  endDate?: string;
  assignedWorkers?: string[];
  assignedTeams?: string[];
  assignedEquipmentList?: string[];
  isHoldPoint?: boolean;
  isMilestone?: boolean;
  notes?: string;
  measurementType?: SubTaskMeasurementType;
  
  // Relational Activity Linking
  parentActivityId: string;
  parentActivityName: string;
  parentActivityWorkPackage?: string;
  sectionSpan?: string;
  isLinked: boolean;
  linkedActivityId?: string;
  linkedActivityName?: string;
  
  // Raw references for direct mutation
  activityRef: Activity;
  subtaskRef?: SubTask;
}

// Deterministic mapping of SubTask Category & Title to Project Discipline
export function detectSubtaskDiscipline(subtask: SubTask, activity: Activity): WorkstreamType {
  const cat = (subtask.category || '').toLowerCase();
  const title = (subtask.title || '').toLowerCase();

  if (activity.workstream && activity.workstream !== 'PTS_CONSTRUCTION') {
    return activity.workstream;
  }

  // 1. Surveying & Set-out
  if (
    cat.includes('survey') || 
    cat.includes('set-out') || 
    title.includes('survey') || 
    title.includes('set-out') || 
    title.includes('pegging') || 
    title.includes('benchmark') ||
    title.includes('chainage')
  ) {
    return 'SURVEYING';
  }

  // 2. QA/QC & Inspections
  if (
    subtask.isHoldPoint || 
    cat.includes('quality') || 
    cat.includes('inspection') || 
    title.includes('inspection') || 
    title.includes('qa') || 
    title.includes('qc') || 
    title.includes('hold point') || 
    title.includes('compaction') || 
    title.includes('test') ||
    title.includes('sign-off')
  ) {
    return 'QA_QC';
  }

  // 3. Materials & Supply Chain
  if (
    (subtask.assignments && subtask.assignments.length > 0) || 
    cat.includes('material') || 
    title.includes('material') || 
    title.includes('delivery') || 
    title.includes('batch') || 
    title.includes('supply') ||
    title.includes('duct') ||
    title.includes('cable deliver')
  ) {
    return 'MATERIALS';
  }

  // 4. Safety & HSE Compliance
  if (
    cat.includes('safety') || 
    cat.includes('hse') || 
    title.includes('safety') || 
    title.includes('permit') || 
    title.includes('risk assessment') || 
    title.includes('toolbox') || 
    title.includes('ppe') ||
    title.includes('trench permit')
  ) {
    return 'SAFETY';
  }

  // 5. Electrical & Commissioning
  if (
    cat.includes('electrical') || 
    title.includes('commissioning') || 
    title.includes('jointing') || 
    title.includes('termination') || 
    title.includes('energiz') || 
    title.includes('pressure test') || 
    title.includes('megger') ||
    title.includes('continuity')
  ) {
    return 'COMMISSIONING';
  }

  return 'PTS_CONSTRUCTION';
}

export function DisciplineTrackerView({
  activities,
  onSelectActivity,
  onOpenSlideOver,
  onOpenLogProgress,
  onAddNewDisciplineItem,
  onUpdateStatus
}: DisciplineTrackerViewProps) {
  const { updateActivity, addAuditLog, userRole } = useAppContext();
  const [activeTab, setActiveTab] = useState<DisciplineTab>('SURVEYING');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'board' | 'table' | 'grid'>('board');
  const [editingItem, setEditingItem] = useState<DisciplineWorkItem | null>(null);

  // Extract all discipline work items from Activities and their Subtasks
  const allDisciplineItems: DisciplineWorkItem[] = useMemo(() => {
    const items: DisciplineWorkItem[] = [];

    activities.forEach(activity => {
      // 1. Process Subtasks within this Activity
      const subtasks = activity.subtasks || [];
      subtasks.forEach(st => {
        const disc = detectSubtaskDiscipline(st, activity);
        
        let progressPct = 0;
        if (st.status === 'Completed') progressPct = 100;
        else if (st.targetQuantity && st.targetQuantity > 0 && st.completedQuantity) {
          progressPct = Math.min(100, Math.round((st.completedQuantity / st.targetQuantity) * 100));
        } else if (st.status === 'In Progress') {
          progressPct = 50;
        }

        const isLinkedToParent = !st.linkedActivityId || st.linkedActivityId === activity.id;
        const linkedAct = st.linkedActivityId ? activities.find(a => a.id === st.linkedActivityId) : activity;

        items.push({
          id: `${activity.id}__st__${st.id}`,
          subtaskId: st.id,
          isSubtask: true,
          title: st.title,
          discipline: disc,
          category: st.category,
          status: st.status as ActivityStatus,
          progress: progressPct,
          completedQuantity: st.completedQuantity,
          targetQuantity: st.targetQuantity,
          unit: st.unit,
          startDate: st.startDate || activity.startDate,
          endDate: st.endDate || activity.finishDate,
          assignedWorkers: st.assignedWorkers,
          assignedTeams: st.assignedTeams,
          assignedEquipmentList: st.assignedEquipmentList,
          isHoldPoint: st.isHoldPoint,
          isMilestone: st.isMilestone,
          notes: st.notes,
          measurementType: st.measurementType,
          parentActivityId: activity.id,
          parentActivityName: activity.name,
          parentActivityWorkPackage: activity.workPackage,
          sectionSpan: activity.sectionSpan,
          isLinked: Boolean(st.linkedActivityId || activity.id),
          linkedActivityId: st.linkedActivityId || activity.id,
          linkedActivityName: linkedAct ? linkedAct.name : activity.name,
          activityRef: activity,
          subtaskRef: st
        });
      });

      // 2. Standalone Discipline Activities (if configured with workstream)
      if (activity.workstream && activity.workstream !== 'PTS_CONSTRUCTION' && (!subtasks || subtasks.length === 0)) {
        items.push({
          id: activity.id,
          isSubtask: false,
          title: activity.name,
          discipline: activity.workstream,
          category: activity.discipline || activity.workPackage || 'General',
          status: activity.status,
          progress: activity.progress || 0,
          completedQuantity: activity.actualQuantity,
          targetQuantity: activity.targetQuantity,
          unit: activity.unit,
          startDate: activity.startDate,
          endDate: activity.finishDate,
          assignedWorkers: activity.assignedLabour?.map(l => l.employeeName) || [],
          isHoldPoint: false,
          isMilestone: activity.isMilestone,
          notes: activity.description,
          parentActivityId: activity.id,
          parentActivityName: activity.name,
          parentActivityWorkPackage: activity.workPackage,
          sectionSpan: activity.sectionSpan,
          isLinked: Boolean(activity.linkedPTSActivityId),
          linkedActivityId: activity.linkedPTSActivityId,
          linkedActivityName: activity.linkedPTSActivityName,
          activityRef: activity
        });
      }
    });

    return items;
  }, [activities]);

  // Discipline Counts
  const counts = useMemo(() => {
    return {
      SURVEYING: allDisciplineItems.filter(i => i.discipline === 'SURVEYING').length,
      QA_QC: allDisciplineItems.filter(i => i.discipline === 'QA_QC').length,
      MATERIALS: allDisciplineItems.filter(i => i.discipline === 'MATERIALS').length,
      SAFETY: allDisciplineItems.filter(i => i.discipline === 'SAFETY').length,
      COMMISSIONING: allDisciplineItems.filter(i => i.discipline === 'COMMISSIONING').length,
    };
  }, [allDisciplineItems]);

  // Filtered items for active tab
  const activeDisciplineItems = useMemo(() => {
    if (activeTab === 'MATRIX' || activeTab === 'SURVEY_SPANS') return [];
    return allDisciplineItems.filter(i => {
      if (i.discipline !== activeTab) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        i.title.toLowerCase().includes(term) ||
        i.parentActivityName.toLowerCase().includes(term) ||
        (i.sectionSpan && i.sectionSpan.toLowerCase().includes(term)) ||
        (i.category && i.category.toLowerCase().includes(term))
      );
    });
  }, [allDisciplineItems, activeTab, searchTerm]);

  // Save changes to edited discipline item (bi-directional update to parent Activity / SubTask)
  const handleSaveDisciplineItem = (updatedItem: DisciplineWorkItem) => {
    const parentAct = activities.find(a => a.id === updatedItem.parentActivityId);
    if (!parentAct) return;

    if (updatedItem.isSubtask && updatedItem.subtaskId) {
      const currentSubtasks = parentAct.subtasks || [];
      const updatedSubtasks = currentSubtasks.map(st => {
        if (st.id === updatedItem.subtaskId) {
          return {
            ...st,
            title: updatedItem.title,
            category: updatedItem.category as SubTaskCategory,
            status: updatedItem.status as ('Not Started' | 'In Progress' | 'Completed'),
            completedQuantity: updatedItem.completedQuantity,
            targetQuantity: updatedItem.targetQuantity,
            unit: updatedItem.unit,
            startDate: updatedItem.startDate,
            endDate: updatedItem.endDate,
            assignedWorkers: updatedItem.assignedWorkers,
            assignedEquipmentList: updatedItem.assignedEquipmentList,
            isHoldPoint: updatedItem.isHoldPoint,
            isMilestone: updatedItem.isMilestone,
            notes: updatedItem.notes,
            linkedActivityId: updatedItem.linkedActivityId || undefined,
            linkedActivityName: updatedItem.linkedActivityName || undefined
          };
        }
        return st;
      });

      // Recalculate parent activity progress
      const totalSt = updatedSubtasks.length;
      const completedSt = updatedSubtasks.filter(s => s.status === 'Completed').length;
      const newProgress = totalSt > 0 ? Math.round((completedSt / totalSt) * 100) : parentAct.progress;

      updateActivity({
        ...parentAct,
        subtasks: updatedSubtasks,
        progress: newProgress,
        updatedAt: new Date().toISOString().split('T')[0]
      });

      addAuditLog({
        id: `AL-${Math.random().toString(36).substr(2, 9)}`,
        projectId: parentAct.projectId,
        userId: userRole || 'Engineer',
        action: 'Discipline Work Item Updated',
        details: `Updated ${updatedItem.discipline} subtask "${updatedItem.title}" on Activity "${parentAct.name}"`,
        timestamp: new Date().toISOString()
      });
    } else {
      // Standalone Activity Update
      updateActivity({
        ...parentAct,
        name: updatedItem.title,
        status: updatedItem.status,
        actualQuantity: updatedItem.completedQuantity || 0,
        targetQuantity: updatedItem.targetQuantity || 0,
        unit: updatedItem.unit || 'units',
        startDate: updatedItem.startDate || parentAct.startDate,
        finishDate: updatedItem.endDate || parentAct.finishDate,
        linkedPTSActivityId: updatedItem.linkedActivityId || undefined,
        linkedPTSActivityName: updatedItem.linkedActivityName || undefined,
        updatedAt: new Date().toISOString().split('T')[0]
      });
    }

    setEditingItem(null);
  };

  // Instant 1-click unlink handler
  const handleToggleUnlink = (item: DisciplineWorkItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const parentAct = activities.find(a => a.id === item.parentActivityId);
    if (!parentAct) return;

    if (item.isSubtask && item.subtaskId) {
      const currentSubtasks = parentAct.subtasks || [];
      const isCurrentlyLinked = Boolean(item.linkedActivityId);
      
      const updatedSubtasks = currentSubtasks.map(st => {
        if (st.id === item.subtaskId) {
          return {
            ...st,
            linkedActivityId: isCurrentlyLinked ? '' : parentAct.id,
            linkedActivityName: isCurrentlyLinked ? '' : parentAct.name
          };
        }
        return st;
      });

      updateActivity({
        ...parentAct,
        subtasks: updatedSubtasks,
        updatedAt: new Date().toISOString().split('T')[0]
      });

      addAuditLog({
        id: `AL-${Math.random().toString(36).substr(2, 9)}`,
        projectId: parentAct.projectId,
        userId: userRole || 'Engineer',
        action: isCurrentlyLinked ? 'Discipline Subtask Unlinked' : 'Discipline Subtask Linked',
        details: `${isCurrentlyLinked ? 'Unlinked' : 'Linked'} subtask "${item.title}" on "${parentAct.name}"`,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Quick 1-click status advancement
  const handleQuickStatusChange = (item: DisciplineWorkItem, newStatus: ActivityStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    const parentAct = activities.find(a => a.id === item.parentActivityId);
    if (!parentAct) return;

    if (item.isSubtask && item.subtaskId) {
      const currentSubtasks = parentAct.subtasks || [];
      const updatedSubtasks = currentSubtasks.map(st => {
        if (st.id === item.subtaskId) {
          let newCompletedQty = st.completedQuantity;
          if (newStatus === 'Completed' && st.targetQuantity) {
            newCompletedQty = st.targetQuantity;
          } else if (newStatus === 'Not Started') {
            newCompletedQty = 0;
          }
          return {
            ...st,
            status: newStatus as ('Not Started' | 'In Progress' | 'Completed'),
            completedQuantity: newCompletedQty
          };
        }
        return st;
      });

      const totalSt = updatedSubtasks.length;
      const completedSt = updatedSubtasks.filter(s => s.status === 'Completed').length;
      const newProgress = totalSt > 0 ? Math.round((completedSt / totalSt) * 100) : parentAct.progress;

      updateActivity({
        ...parentAct,
        subtasks: updatedSubtasks,
        progress: newProgress,
        updatedAt: new Date().toISOString().split('T')[0]
      });
    } else {
      onUpdateStatus(parentAct.id, newStatus);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Top Discipline Switcher Tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap pb-1 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {/* 1. Master Matrix */}
          <button
            type="button"
            onClick={() => setActiveTab('MATRIX')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all ${
              activeTab === 'MATRIX'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Cross-Discipline PTS Matrix</span>
          </button>

          {/* 2. Survey Spans Hub */}
          <button
            type="button"
            onClick={() => setActiveTab('SURVEY_SPANS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all ${
              activeTab === 'SURVEY_SPANS'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Survey Spans Hub</span>
          </button>

          {/* 3. Surveying */}
          <button
            type="button"
            onClick={() => setActiveTab('SURVEYING')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all ${
              activeTab === 'SURVEYING'
                ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 ring-2 ring-sky-500/40 shadow-xs font-black'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <Compass className="h-4 w-4 text-sky-600" />
            <span>Surveying ({counts.SURVEYING})</span>
          </button>

          {/* 4. QA/QC */}
          <button
            type="button"
            onClick={() => setActiveTab('QA_QC')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all ${
              activeTab === 'QA_QC'
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 ring-2 ring-rose-500/40 shadow-xs font-black'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-rose-600" />
            <span>QA/QC ({counts.QA_QC})</span>
          </button>

          {/* 5. Materials */}
          <button
            type="button"
            onClick={() => setActiveTab('MATERIALS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all ${
              activeTab === 'MATERIALS'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 ring-2 ring-amber-500/40 shadow-xs font-black'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <Package className="h-4 w-4 text-amber-600" />
            <span>Materials ({counts.MATERIALS})</span>
          </button>

          {/* 6. Safety */}
          <button
            type="button"
            onClick={() => setActiveTab('SAFETY')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all ${
              activeTab === 'SAFETY'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 ring-2 ring-emerald-500/40 shadow-xs font-black'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <ShieldAlert className="h-4 w-4 text-emerald-600" />
            <span>Safety / HSE ({counts.SAFETY})</span>
          </button>

          {/* 7. Commissioning */}
          <button
            type="button"
            onClick={() => setActiveTab('COMMISSIONING')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all ${
              activeTab === 'COMMISSIONING'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 ring-2 ring-purple-500/40 shadow-xs font-black'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <Zap className="h-4 w-4 text-purple-600" />
            <span>Commissioning ({counts.COMMISSIONING})</span>
          </button>
        </div>

        {/* Action Button */}
        {activeTab !== 'MATRIX' && activeTab !== 'SURVEY_SPANS' && (
          <Button
            onClick={() => onAddNewDisciplineItem(activeTab as WorkstreamType)}
            className="gap-1.5 rounded-xl bg-[#0B5FFF] text-white font-bold h-9 text-xs shrink-0 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add {WORKSTREAMS[activeTab as WorkstreamType]?.shortName || 'Item'}</span>
          </Button>
        )}
      </div>

      {/* Render Selected View */}
      {activeTab === 'MATRIX' ? (
        <PTSCrossDisciplineMatrix
          activities={activities}
          onSelectActivity={onSelectActivity}
          onOpenSlideOver={onOpenSlideOver}
        />
      ) : activeTab === 'SURVEY_SPANS' ? (
        <SurveyTrackerView
          onOpenActivity={(actId) => {
            const found = activities.find(a => a.id === actId);
            if (found) onSelectActivity(found);
          }}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Discipline Subheader & View Controls */}
          <div className="flex items-center justify-between gap-3 flex-wrap bg-slate-50/70 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {WORKSTREAMS[activeTab as WorkstreamType]?.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  {activeDisciplineItems.length} active subtasks & scope items
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Aggregated live from all created activities. Edit subtasks directly or re-link to civil construction spans.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative w-48 sm:w-60">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter discipline subtasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8.5 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                />
              </div>

              {/* View Switcher */}
              <div className="flex items-center bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode('board')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    viewMode === 'board' ? 'bg-slate-100 dark:bg-slate-800 text-[#0B5FFF]' : 'text-slate-500'
                  }`}
                  title="Kanban Board View"
                >
                  <Kanban className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Board</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    viewMode === 'table' ? 'bg-slate-100 dark:bg-slate-800 text-[#0B5FFF]' : 'text-slate-500'
                  }`}
                  title="Spreadsheet Table View"
                >
                  <TableIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-800 text-[#0B5FFF]' : 'text-slate-500'
                  }`}
                  title="Grid Cards View"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Discipline Work Items Board View */}
          {viewMode === 'board' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
              {(['Not Started', 'In Progress', 'Blocked', 'Completed'] as ActivityStatus[]).map(statusCol => {
                const colItems = activeDisciplineItems.filter(i => {
                  if (statusCol === 'Blocked') return i.status === 'Blocked' || (i.isHoldPoint && i.status !== 'Completed');
                  return i.status === statusCol;
                });

                const colBg = 
                  statusCol === 'Completed' ? 'border-emerald-200/80 bg-emerald-50/20 dark:bg-emerald-950/10' :
                  statusCol === 'In Progress' ? 'border-blue-200/80 bg-blue-50/20 dark:bg-blue-950/10' :
                  statusCol === 'Blocked' ? 'border-rose-200/80 bg-rose-50/20 dark:bg-rose-950/10' :
                  'border-slate-200/80 bg-slate-50/40 dark:bg-slate-900/30';

                return (
                  <div 
                    key={statusCol} 
                    className={`flex flex-col gap-3 p-3 rounded-2xl border ${colBg} min-h-[380px]`}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${
                          statusCol === 'Completed' ? 'bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950' :
                          statusCol === 'In Progress' ? 'bg-[#0B5FFF] ring-4 ring-blue-100 dark:ring-blue-950' :
                          statusCol === 'Blocked' ? 'bg-rose-500 ring-4 ring-rose-100 dark:ring-rose-950' :
                          'bg-slate-400 ring-4 ring-slate-100 dark:ring-slate-800'
                        }`} />
                        <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          {statusCol === 'Blocked' ? 'Hold Point / Blocked' : statusCol}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-2xs">
                        {colItems.length}
                      </span>
                    </div>

                    {/* Cards */}
                    <div className="flex flex-col gap-2.5 flex-1">
                      {colItems.map(item => (
                        <DisciplineCard
                          key={item.id}
                          item={item}
                          onEdit={() => setEditingItem(item)}
                          onOpenParent={() => onSelectActivity(item.activityRef)}
                          onToggleUnlink={(e) => handleToggleUnlink(item, e)}
                          onQuickStatusChange={(newSt, e) => handleQuickStatusChange(item, newSt, e)}
                        />
                      ))}

                      {colItems.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                          <p className="text-xs font-medium">No items in this stage</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : viewMode === 'table' ? (
            /* Table View */
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    <th className="py-3 px-4">Subtask / Discipline Item</th>
                    <th className="py-3 px-4">Parent Activity & Span</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Progress / Qty</th>
                    <th className="py-3 px-4">Assigned Crew</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {activeDisciplineItems.map(item => (
                    <tr 
                      key={item.id}
                      onClick={() => setEditingItem(item)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {item.isHoldPoint && <span className="text-rose-500 font-bold text-[10px] px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-200">HOLD</span>}
                          {item.title}
                        </div>
                        {item.notes && <div className="text-[10px] text-slate-400 truncate max-w-xs">{item.notes}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-indigo-700 dark:text-indigo-300 font-semibold">
                          <Link2 className="h-3 w-3 text-indigo-500" />
                          <span>{item.parentActivityName}</span>
                        </div>
                        {item.sectionSpan && (
                          <span className="text-[10px] text-slate-500 font-mono">Span: {item.sectionSpan}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {item.category || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {item.targetQuantity ? (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {item.completedQuantity || 0} / {item.targetQuantity} {item.unit || ''}
                            </span>
                            <span className="text-[10px] text-slate-400">({item.progress}%)</span>
                          </div>
                        ) : (
                          <span className="font-bold">{item.progress}%</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {item.assignedWorkers && item.assignedWorkers.length > 0 ? (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Users className="h-3 w-3 text-slate-400" />
                            {item.assignedWorkers[0]} {item.assignedWorkers.length > 1 && `+${item.assignedWorkers.length - 1}`}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          item.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                          item.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                          item.status === 'Blocked' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingItem(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0B5FFF] hover:bg-blue-50 dark:hover:bg-blue-950/40"
                            title="Edit Discipline Subtask"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectActivity(item.activityRef)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                            title="View Parent Activity"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
              {activeDisciplineItems.map(item => (
                <DisciplineCard
                  key={item.id}
                  item={item}
                  onEdit={() => setEditingItem(item)}
                  onOpenParent={() => onSelectActivity(item.activityRef)}
                  onToggleUnlink={(e) => handleToggleUnlink(item, e)}
                  onQuickStatusChange={(newSt, e) => handleQuickStatusChange(item, newSt, e)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Interactive Modal: Edit Discipline Subtask / Work Item */}
      {editingItem && (
        <EditDisciplineItemModal
          item={editingItem}
          activities={activities}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveDisciplineItem}
          onOpenFullActivity={() => {
            const targetAct = editingItem.activityRef;
            setEditingItem(null);
            onSelectActivity(targetAct);
          }}
        />
      )}
    </div>
  );
}

// Sub-component: Individual Discipline Card
function DisciplineCard({
  item,
  onEdit,
  onOpenParent,
  onToggleUnlink,
  onQuickStatusChange
}: {
  item: DisciplineWorkItem;
  onEdit: () => void;
  onOpenParent: () => void;
  onToggleUnlink: (e: React.MouseEvent) => void;
  onQuickStatusChange: (newStatus: ActivityStatus, e: React.MouseEvent) => void;
}) {
  return (
    <div 
      onClick={onEdit}
      className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-[#0B5FFF]/40 hover:shadow-md transition-all cursor-pointer flex flex-col gap-2.5 group"
    >
      {/* Header & Badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {item.category || WORKSTREAMS[item.discipline]?.shortName}
          </span>
          {item.isHoldPoint && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              🛑 Hold Point
            </span>
          )}
          {item.isMilestone && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              🚩 Milestone
            </span>
          )}
        </div>

        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
          item.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
          item.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
          item.status === 'Blocked' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' :
          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
        }`}>
          {item.status}
        </span>
      </div>

      {/* Subtask Title */}
      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#0B5FFF] transition-colors leading-tight">
        {item.title}
      </h3>

      {/* Linked Activity Badge & Unlink Action */}
      <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs">
        <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 truncate">
          <Link2 className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
          <span className="truncate font-semibold" title={item.parentActivityName}>
            {item.parentActivityName}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onToggleUnlink}
            className="text-[10px] font-bold text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 px-1.5 py-0.5 rounded hover:bg-white dark:hover:bg-slate-800 transition-colors"
            title="Unlink this subtask from parent activity"
          >
            Unlink
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenParent();
            }}
            className="p-1 rounded text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 transition-colors"
            title="Jump to parent construction activity"
          >
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Progress Bar & Measurements */}
      {item.targetQuantity ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            <span>Qty: {item.completedQuantity || 0} / {item.targetQuantity} {item.unit || ''}</span>
            <span className="font-bold text-slate-900 dark:text-white">{item.progress}%</span>
          </div>
          <ProgressBar progress={item.progress} size="sm" />
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            <span>Completion</span>
            <span className="font-bold text-slate-900 dark:text-white">{item.progress}%</span>
          </div>
          <ProgressBar progress={item.progress} size="sm" />
        </div>
      )}

      {/* Crew & Dates */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
        {item.assignedWorkers && item.assignedWorkers.length > 0 ? (
          <span className="flex items-center gap-1 font-medium truncate max-w-[150px]">
            <Users className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="truncate">{item.assignedWorkers[0]}</span>
            {item.assignedWorkers.length > 1 && <span className="text-[10px]">+{item.assignedWorkers.length - 1}</span>}
          </span>
        ) : (
          <span className="text-slate-400 italic">Unassigned crew</span>
        )}

        {item.startDate && (
          <span className="flex items-center gap-1 font-mono text-[10px]">
            <Calendar className="h-3 w-3 text-slate-400" />
            {item.startDate}
          </span>
        )}
      </div>

      {/* 1-Click Status Controls */}
      <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-bold text-[#0B5FFF] hover:underline flex items-center gap-1"
        >
          <Edit3 className="h-3 w-3" />
          <span>Edit Subtask</span>
        </button>

        <div className="flex items-center gap-1">
          {item.status !== 'In Progress' && (
            <button
              type="button"
              onClick={(e) => onQuickStatusChange('In Progress', e)}
              className="px-2 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 transition-colors"
            >
              Start
            </button>
          )}
          {item.status !== 'Completed' && (
            <button
              type="button"
              onClick={(e) => onQuickStatusChange('Completed', e)}
              className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
            >
              Complete ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-component: Edit Discipline Subtask / Work Item Modal
function EditDisciplineItemModal({
  item,
  activities,
  onClose,
  onSave,
  onOpenFullActivity
}: {
  item: DisciplineWorkItem;
  activities: Activity[];
  onClose: () => void;
  onSave: (updatedItem: DisciplineWorkItem) => void;
  onOpenFullActivity: () => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [category, setCategory] = useState(item.category);
  const [status, setStatus] = useState<ActivityStatus>(item.status);
  const [completedQty, setCompletedQty] = useState(item.completedQuantity || 0);
  const [targetQty, setTargetQty] = useState(item.targetQuantity || 0);
  const [unit, setUnit] = useState(item.unit || 'm');
  const [startDate, setStartDate] = useState(item.startDate || '');
  const [endDate, setEndDate] = useState(item.endDate || '');
  const [notes, setNotes] = useState(item.notes || '');
  const [linkedActivityId, setLinkedActivityId] = useState(item.linkedActivityId || '');
  const [isHoldPoint, setIsHoldPoint] = useState(item.isHoldPoint || false);
  const [isMilestone, setIsMilestone] = useState(item.isMilestone || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const linkedAct = activities.find(a => a.id === linkedActivityId);

    let progressPct = 0;
    if (status === 'Completed') progressPct = 100;
    else if (targetQty > 0) {
      progressPct = Math.min(100, Math.round((completedQty / targetQty) * 100));
    } else if (status === 'In Progress') {
      progressPct = 50;
    }

    onSave({
      ...item,
      title,
      category,
      status,
      completedQuantity: completedQty,
      targetQuantity: targetQty,
      unit,
      startDate,
      endDate,
      notes,
      isHoldPoint,
      isMilestone,
      progress: progressPct,
      linkedActivityId: linkedActivityId || undefined,
      linkedActivityName: linkedAct ? linkedAct.name : undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/80 sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${WORKSTREAMS[item.discipline]?.badgeClass}`}>
                {WORKSTREAMS[item.discipline]?.name}
              </span>
              <span className="text-xs text-slate-400">
                {item.isSubtask ? 'Activity Subtask' : 'Discipline Activity'}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">
              Edit Discipline Work Item
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 flex-1">
          {/* Subtask Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Work Item / Subtask Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-[#0B5FFF] outline-none"
            />
          </div>

          {/* Cross-Activity Link Selector */}
          <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <Link2 className="h-4 w-4 text-indigo-600" />
                <span>Link Subtask to Construction Activity</span>
              </label>
              {linkedActivityId && (
                <button
                  type="button"
                  onClick={() => setLinkedActivityId('')}
                  className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1"
                >
                  <Unlink className="h-3 w-3" /> Unlink
                </button>
              )}
            </div>

            <select
              value={linkedActivityId}
              onChange={e => setLinkedActivityId(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">None (Independent Discipline Item)</option>
              {activities.map(act => (
                <option key={act.id} value={act.id}>
                  {act.name} {act.sectionSpan ? `[Span: ${act.sectionSpan}]` : ''} ({act.status})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-indigo-700 dark:text-indigo-300">
              When linked, progress recorded on this discipline item updates the civil activity handshake in real time.
            </p>
          </div>

          {/* Quantities & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Completed Qty</label>
              <input
                type="number"
                value={completedQty}
                onChange={e => setCompletedQty(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Target Qty</label>
              <input
                type="number"
                value={targetQty}
                onChange={e => setTargetQty(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
          </div>

          {/* Status & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ActivityStatus)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Blocked">Blocked / Hold Point</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Category</label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
          </div>

          {/* Hold Point / Milestone Toggles */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isHoldPoint}
                onChange={e => setIsHoldPoint(e.target.checked)}
                className="rounded border-rose-300 text-rose-600 h-4 w-4"
              />
              <span className="text-xs font-bold text-rose-800 dark:text-rose-200 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-rose-600" />
                Designate as QA Quality Hold Point (Must be signed off)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isMilestone}
                onChange={e => setIsMilestone(e.target.checked)}
                className="rounded border-purple-300 text-purple-600 h-4 w-4"
              />
              <span className="text-xs font-bold text-purple-800 dark:text-purple-200 flex items-center gap-1">
                <Flag className="h-3.5 w-3.5 text-purple-600" />
                Key Milestone Checkpoint
              </span>
            </label>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Notes & Specifications</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Scope details, benchmark references, or inspection notes..."
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onOpenFullActivity}
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Parent Activity
            </button>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl h-9 text-xs">
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl bg-[#0B5FFF] text-white font-bold h-9 text-xs">
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
