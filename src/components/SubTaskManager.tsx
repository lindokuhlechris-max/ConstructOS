import React, { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { SubTask, SubTaskCategory, SurveySectionRecord } from '../types';
import { WORKFLOW_TEMPLATES } from '../data/activityTemplates';
import { Button, Badge } from './ui';
import { 
  CheckCircle2, Circle, Clock, Plus, Trash2, Edit3, GripVertical, 
  Layers, HardHat, Truck, Sparkles, ChevronDown, ChevronUp, AlertCircle,
  Save, X, Minus, Check, Calendar, Flag, AlertTriangle, Lock, ShieldCheck,
  CornerDownRight, CheckSquare, Sparkle, Info, Search, Users, UserCheck,
  Compass, Link2, Unlink, ExternalLink
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface ChecklistItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  initials?: string;
}

interface MultiSelectPopoverChecklistProps {
  label: string;
  placeholder?: string;
  icon: React.ReactNode;
  items: ChecklistItem[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  accentColor?: 'blue' | 'purple' | 'amber' | 'emerald' | 'orange';
  emptyMessage?: string;
}

function MultiSelectPopoverChecklist({
  label,
  placeholder = 'Select options...',
  icon,
  items,
  selectedIds,
  onChange,
  accentColor = 'blue',
  emptyMessage = 'No items available.'
}: MultiSelectPopoverChecklistProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredItems = items.filter(it => 
    it.title.toLowerCase().includes(search.toLowerCase()) || 
    (it.subtitle && it.subtitle.toLowerCase().includes(search.toLowerCase())) ||
    (it.badge && it.badge.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(s => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredItems.map(f => f.id);
    const newSelected = Array.from(new Set([...selectedIds, ...allFilteredIds]));
    onChange(newSelected);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const removeTag = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter(s => s !== id));
  };

  const getAccentBg = () => {
    switch (accentColor) {
      case 'orange': return 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'purple': return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'amber': return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'emerald': return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      default: return 'bg-blue-50 dark:bg-blue-950/40 text-[#0B5FFF] dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
  };

  const selectedCount = selectedIds.length;

  return (
    <div className="space-y-1 relative" ref={popoverRef}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          {icon}
          {label}
        </label>
        {selectedCount > 0 && (
          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getAccentBg()}`}>
            {selectedCount} Selected
          </span>
        )}
      </div>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-9 px-3 rounded-lg border text-xs text-left flex items-center justify-between transition-all bg-white dark:bg-slate-900 ${
          isOpen ? 'ring-2 ring-[#0B5FFF] border-[#0B5FFF]' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
        }`}
      >
        <span className="truncate pr-2 font-medium text-slate-700 dark:text-slate-200">
          {selectedCount === 0 ? (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          ) : selectedCount === 1 ? (
            items.find(i => i.id === selectedIds[0])?.title || selectedIds[0]
          ) : (
            `${items.find(i => i.id === selectedIds[0])?.title || selectedIds[0]} (+${selectedCount - 1} more)`
          )}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Selected tags chip bar */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap gap-1 pt-1 max-h-16 overflow-y-auto">
          {selectedIds.map(id => {
            const itemObj = items.find(i => i.id === id);
            const title = itemObj?.title || id;
            return (
              <span 
                key={id} 
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${getAccentBg()}`}
              >
                <span className="truncate max-w-[120px]">{title}</span>
                <button
                  type="button"
                  onClick={(e) => removeTag(id, e)}
                  className="hover:opacity-75 p-0.5 rounded"
                  title={`Remove ${title}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Floating Popover Checklist Modal */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-2">
          {/* Popover Header & Search */}
          <div className="relative">
            <input
              type="text"
              autoFocus
              placeholder={`Search ${label.toLowerCase()}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-1 focus:ring-[#0B5FFF] outline-none"
            />
            <div className="absolute left-2.5 top-2 text-slate-400">
              <Search className="h-3.5 w-3.5" />
            </div>
            {search && (
              <button 
                type="button" 
                onClick={() => setSearch('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 border-b border-slate-100 dark:border-slate-800 pb-1.5">
            <span className="font-semibold">{filteredItems.length} available</span>
            <div className="flex gap-2">
              {filteredItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-[#0B5FFF] hover:underline font-bold"
                >
                  Select All
                </button>
              )}
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-rose-600 hover:underline font-semibold"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Checklist */}
          <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5">
            {filteredItems.length === 0 ? (
              <div className="text-center py-5 text-slate-400 text-xs font-medium">
                {emptyMessage}
              </div>
            ) : (
              filteredItems.map(item => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${
                      isSelected 
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                        isSelected 
                          ? 'bg-[#0B5FFF] border-[#0B5FFF] text-white' 
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}>
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>

                      {item.initials && (
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300 shrink-0">
                          {item.initials}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-semibold leading-tight truncate ${isSelected ? 'text-[#0B5FFF] dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                            {item.title}
                          </span>
                          {item.badge && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${item.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.subtitle && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-medium">
              {selectedCount} selected
            </span>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-[11px] h-7 px-3 bg-[#0B5FFF] hover:bg-blue-600 text-white rounded-lg"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface SubTaskManagerProps {
  subtasks: SubTask[];
  onChange: (updatedSubtasks: SubTask[]) => void;
  onAutoSyncProgress?: (calcProgress: number) => void;
  readOnly?: boolean;
  activityId?: string;
  activityName?: string;
  projectId?: string;
}

export function SubTaskManager({ 
  subtasks = [], 
  onChange, 
  onAutoSyncProgress, 
  readOnly = false,
  activityId,
  activityName,
  projectId
}: SubTaskManagerProps) {
  const { employees = [], equipment = [], teams = [], addAuditLog, userRole, surveyRecords = [], linkSurveyRecordToActivity, unlinkSurveyRecordFromActivity, updateSurveyRecord } = useAppContext();
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [isImportSurveyModalOpen, setIsImportSurveyModalOpen] = useState(false);
  const [selectedSurveyToImportId, setSelectedSurveyToImportId] = useState('');
  
  // Auto-detect if this activity matches an advance surveyed section (e.g. PTS 1 - PTS 2)
  const unlinkedMatchingSurvey = React.useMemo(() => {
    if (!activityName && !activityId) return null;
    const actNameLower = (activityName || '').toLowerCase();
    const existingLinkedSurveyIds = new Set((subtasks || []).map(s => s.surveyRecordId).filter(Boolean));
    return surveyRecords.find(r => {
      if (r.linkedActivityId && r.linkedActivityId === activityId) return false;
      if (existingLinkedSurveyIds.has(r.id)) return false;
      const spanLower = r.spanName.toLowerCase();
      return (actNameLower.includes(spanLower) || spanLower.includes(actNameLower)) && !r.linkedActivityId;
    }) || null;
  }, [surveyRecords, activityName, activityId, subtasks]);

  // Validation alert banner state
  const [validationAlert, setValidationAlert] = useState<{
    type: 'warning' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);

  // New subtask state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SubTaskCategory>('Excavation & Earthworks');
  const [targetQuantity, setTargetQuantity] = useState<number | ''>('');
  const [unit, setUnit] = useState('m³');
  const [assignedWorkers, setAssignedWorkers] = useState<string[]>([]);
  const [assignedEquipmentList, setAssignedEquipmentList] = useState<string[]>([]);
  const [assignedTeams, setAssignedTeams] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [parentId, setParentId] = useState<string | ''>('');
  const [isMilestone, setIsMilestone] = useState(false);
  const [milestoneCriteria, setMilestoneCriteria] = useState('');
  const [isHoldPoint, setIsHoldPoint] = useState(false);
  const [predecessorId, setPredecessorId] = useState<string | ''>('');
  const [requiresPhotoEvidence, setRequiresPhotoEvidence] = useState(false);
  const [requiresSupervisorSignOff, setRequiresSupervisorSignOff] = useState(false);

  // Editing subtask form state
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<SubTaskCategory>('Excavation & Earthworks');
  const [editTargetQty, setEditTargetQty] = useState<number | ''>('');
  const [editCompletedQty, setEditCompletedQty] = useState<number | ''>('');
  const [editUnit, setEditUnit] = useState('m³');
  const [editAssignedWorkers, setEditAssignedWorkers] = useState<string[]>([]);
  const [editAssignedEquipmentList, setEditAssignedEquipmentList] = useState<string[]>([]);
  const [editAssignedTeams, setEditAssignedTeams] = useState<string[]>([]);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editStatus, setEditStatus] = useState<SubTask['status']>('Not Started');
  const [editNotes, setEditNotes] = useState('');
  const [editParentId, setEditParentId] = useState<string | ''>('');
  const [editIsMilestone, setEditIsMilestone] = useState(false);
  const [editMilestoneCriteria, setEditMilestoneCriteria] = useState('');
  const [editIsHoldPoint, setEditIsHoldPoint] = useState(false);
  const [editPredecessorId, setEditPredecessorId] = useState<string | ''>('');
  const [editRequiresPhotoEvidence, setEditRequiresPhotoEvidence] = useState(false);
  const [editRequiresSupervisorSignOff, setEditRequiresSupervisorSignOff] = useState(false);

  // QA Hold Point Sign-Off Modal State
  const [signOffSubtask, setSignOffSubtask] = useState<SubTask | null>(null);
  const [signOffInspectorName, setSignOffInspectorName] = useState('Site QA/QC Engineer');
  const [signOffNotes, setSignOffNotes] = useState('');
  const [signOffPhotoUrl, setSignOffPhotoUrl] = useState('');

  // Checklist catalog items
  const workerItems: ChecklistItem[] = (employees || []).map(emp => ({
    id: `${emp.firstName} ${emp.lastName}`.trim(),
    title: `${emp.firstName} ${emp.lastName}`,
    subtitle: emp.position || emp.department || 'Site Worker',
    badge: emp.status || undefined,
    badgeColor: emp.status === 'Active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-100 text-slate-700',
    initials: `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase() || 'W'
  }));

  const machineryItems: ChecklistItem[] = (equipment || []).map(eq => ({
    id: eq.name ? `${eq.name} (${eq.id})` : eq.id,
    title: eq.name || eq.id,
    subtitle: `${eq.id} • ${eq.category || 'Machinery'}`,
    badge: eq.status,
    badgeColor: eq.status === 'Operating' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : eq.status === 'Maintenance' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-slate-100 text-slate-700',
    initials: eq.name?.substring(0, 2).toUpperCase() || 'EQ'
  }));

  const teamItems: ChecklistItem[] = (teams || []).map(t => ({
    id: t.name,
    title: t.name,
    subtitle: `${t.department || 'Operations'}${t.leaderName ? ` • Leader: ${t.leaderName}` : ''}`,
    badge: `${t.memberIds?.length || 0} members`,
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
    initials: t.name?.substring(0, 2).toUpperCase() || 'TM'
  }));

  const showValidationWarning = (title: string, message: string) => {
    setValidationAlert({ type: 'warning', title, message });
    setTimeout(() => {
      setValidationAlert(prev => prev?.message === message ? null : prev);
    }, 7000);
  };

  // Helper functions for parent-child hierarchy
  const getChildSubtasks = (pid: string, list = subtasks) => {
    return list.filter(s => s.parentId === pid);
  };

  const getIncompleteChildSubtasks = (pid: string, list = subtasks) => {
    return list.filter(s => s.parentId === pid && s.status !== 'Completed');
  };

  // Check if a subtask can be marked as 'Completed'
  const validateSubtaskCompletion = (
    st: SubTask, 
    newCompletedQty?: number,
    list = subtasks
  ): { allowed: boolean; reason?: string; isHoldPointBlocked?: boolean } => {
    // 1. Parent-Child Enforcement: Parent CANNOT be completed while ANY child is incomplete
    const incompleteChildren = getIncompleteChildSubtasks(st.id, list);
    if (incompleteChildren.length > 0) {
      const names = incompleteChildren.map(c => `"${c.title}"`).join(', ');
      return {
        allowed: false,
        reason: `Cannot complete parent task "${st.title}" because ${incompleteChildren.length} child subtask(s) (${names}) are still incomplete. Complete all child subtasks first.`
      };
    }

    // 2. Predecessor Dependency Enforcement: Preceding subtask must be Completed first
    if (st.predecessorId) {
      const predTask = list.find(p => p.id === st.predecessorId);
      if (predTask && predTask.status !== 'Completed') {
        const predIdx = list.findIndex(p => p.id === st.predecessorId);
        return {
          allowed: false,
          reason: `🔒 Predecessor Dependency Blocked: Preceding Subtask #${predIdx + 1} "${predTask.title}" must be Completed first before "${st.title}" can proceed.`
        };
      }
    }

    // 3. QA Hold Point Gating: Hold point requires formal sign-off before completion
    if (st.isHoldPoint && !st.holdPointSignOff?.approved) {
      return {
        allowed: false,
        isHoldPointBlocked: true,
        reason: `🔒 QA Hold Point Verification Required: Subtask "${st.title}" is designated as a mandatory Quality Hold Point requiring formal inspection sign-off before completion.`
      };
    }

    // 4. Milestone Enforcement: Milestone stage gate requires 100% target progress
    if (st.isMilestone) {
      const currentQty = newCompletedQty !== undefined ? newCompletedQty : (st.completedQuantity || 0);
      if (st.targetQuantity && st.targetQuantity > 0 && currentQty < st.targetQuantity) {
        return {
          allowed: false,
          reason: `Milestone Checkpoint "${st.title}" requires full target fulfillment (${currentQty}/${st.targetQuantity} ${st.unit || 'units'})${st.milestoneCriteria ? ` and verification of: "${st.milestoneCriteria}"` : ''}. Log full progress before completing this milestone.`
        };
      }
    }

    return { allowed: true };
  };

  // Calculate weighted progress percentage across subtasks
  const calculateOverallProgress = (tasks: SubTask[]) => {
    if (tasks.length === 0) return 0;
    let totalPercent = 0;
    tasks.forEach(s => {
      const children = tasks.filter(c => c.parentId === s.id);
      if (children.length > 0) {
        // If parent has children, calculate average of its children
        const childDone = children.filter(c => c.status === 'Completed').length;
        totalPercent += Math.round((childDone / children.length) * 100);
      } else if (s.targetQuantity && s.targetQuantity > 0) {
        const itemPercent = Math.min(100, Math.round(((s.completedQuantity || 0) / s.targetQuantity) * 100));
        totalPercent += itemPercent;
      } else {
        totalPercent += s.status === 'Completed' ? 100 : s.status === 'In Progress' ? 50 : 0;
      }
    });
    return Math.round(totalPercent / tasks.length);
  };

  const completedCount = subtasks.filter(s => s.status === 'Completed').length;
  const inProgressCount = subtasks.filter(s => s.status === 'In Progress').length;
  const totalCount = subtasks.length;
  const milestoneCount = subtasks.filter(s => s.isMilestone).length;
  const completedMilestoneCount = subtasks.filter(s => s.isMilestone && s.status === 'Completed').length;
  const holdPointCount = subtasks.filter(s => s.isHoldPoint).length;
  const signedOffHoldPointCount = subtasks.filter(s => s.isHoldPoint && s.holdPointSignOff?.approved).length;
  const progressPercent = calculateOverallProgress(subtasks);

  const handleSubtasksChange = (updated: SubTask[]) => {
    onChange(updated);
    if (onAutoSyncProgress) {
      onAutoSyncProgress(calculateOverallProgress(updated));
    }
  };

  // Status toggle handler with parent-child cascade, predecessor, & QA hold point check
  const handleToggleStatus = (id: string) => {
    if (readOnly) return;
    const target = subtasks.find(s => s.id === id);
    if (!target) return;

    let nextStatus: SubTask['status'] = 'In Progress';
    if (target.status === 'Not Started') {
      nextStatus = 'In Progress';
    } else if (target.status === 'In Progress') {
      nextStatus = 'Completed';
    } else {
      nextStatus = 'Not Started';
    }

    // If attempting to complete, validate
    if (nextStatus === 'Completed') {
      const val = validateSubtaskCompletion(target);
      if (!val.allowed) {
        if (val.isHoldPointBlocked) {
          setSignOffSubtask(target);
          setSignOffInspectorName('Site QA/QC Engineer');
          setSignOffNotes('');
          setSignOffPhotoUrl('');
          return;
        }
        showValidationWarning('Completion Blocked', val.reason!);
        return;
      }
    }

    // Status change with cascading rules
    const updated = subtasks.map(st => {
      if (st.id === id) {
        return {
          ...st,
          status: nextStatus,
          completedQuantity: nextStatus === 'Completed' 
            ? (st.targetQuantity || st.completedQuantity || 0) 
            : nextStatus === 'Not Started' ? 0 : st.completedQuantity
        };
      }
      return st;
    });

    // Upward Cascade: If a child is moved away from 'Completed', any completed parent MUST revert to 'In Progress'
    if (nextStatus !== 'Completed' && target.parentId) {
      revertParentIfCompleted(updated, target.parentId);
    }

    handleSubtasksChange(updated);

    // Two-way sync: If this subtask is linked to a Survey Section in the Survey Hub, update the Survey Hub record
    if (target.surveyRecordId) {
      const matchSurvey = surveyRecords.find(r => r.id === target.surveyRecordId);
      if (matchSurvey) {
        updateSurveyRecord({
          ...matchSurvey,
          status: nextStatus,
          completedMeters: nextStatus === 'Completed' ? matchSurvey.distanceMeters : nextStatus === 'Not Started' ? 0 : Math.round(matchSurvey.distanceMeters * 0.5),
          updatedAt: new Date().toISOString().split('T')[0]
        });
      }
    }

    if (addAuditLog) {
      addAuditLog({
        id: `AL-${Math.random().toString(36).substr(2, 9)}`,
        projectId: projectId || 'PROJ-001',
        userId: userRole === 'Manager' ? 'Site Manager' : 'Current User',
        action: 'Subtask Status Change',
        details: `Subtask "${target.title}" in Activity "${activityName || activityId || 'Activity'}" status updated to ${nextStatus}`,
        entityType: 'Activity',
        entityId: activityId,
        actionType: 'status_change',
        subtaskId: target.id,
        subtaskTitle: target.title,
        activityName: activityName,
        previousValue: target.status,
        newValue: nextStatus,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Direct status select change with validation
  const handleSelectStatus = (id: string, newStatus: SubTask['status']) => {
    if (readOnly) return;
    const target = subtasks.find(s => s.id === id);
    if (!target) return;

    if (newStatus === 'Completed') {
      const val = validateSubtaskCompletion(target);
      if (!val.allowed) {
        if (val.isHoldPointBlocked) {
          setSignOffSubtask(target);
          setSignOffInspectorName('Site QA/QC Engineer');
          setSignOffNotes('');
          setSignOffPhotoUrl('');
          return;
        }
        showValidationWarning('Completion Blocked', val.reason!);
        return;
      }
    }

    const updated = subtasks.map(st => {
      if (st.id === id) {
        return {
          ...st,
          status: newStatus,
          completedQuantity: newStatus === 'Completed' 
            ? (st.targetQuantity || st.completedQuantity || 0) 
            : newStatus === 'Not Started' ? 0 : st.completedQuantity
        };
      }
      return st;
    });

    // Revert parent if child is not completed
    if (newStatus !== 'Completed' && target.parentId) {
      revertParentIfCompleted(updated, target.parentId);
    }

    handleSubtasksChange(updated);

    if (addAuditLog) {
      addAuditLog({
        id: `AL-${Math.random().toString(36).substr(2, 9)}`,
        projectId: projectId || 'PROJ-001',
        userId: userRole === 'Manager' ? 'Site Manager' : 'Current User',
        action: 'Subtask Status Change',
        details: `Subtask "${target.title}" in Activity "${activityName || activityId || 'Activity'}" set to ${newStatus}`,
        entityType: 'Activity',
        entityId: activityId,
        actionType: 'status_change',
        subtaskId: target.id,
        subtaskTitle: target.title,
        activityName: activityName,
        previousValue: target.status,
        newValue: newStatus,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Helper to revert parent status from Completed to In Progress when a child is opened
  const revertParentIfCompleted = (list: SubTask[], parentId: string) => {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === parentId && list[i].status === 'Completed') {
        list[i] = {
          ...list[i],
          status: 'In Progress'
        };
        // Cascade further up if parent has its own parent
        if (list[i].parentId) {
          revertParentIfCompleted(list, list[i].parentId!);
        }
      }
    }
  };

  // Quantity updates with validation
  const handleUpdateSubtaskQuantity = (id: string, newQty: number) => {
    if (readOnly) return;
    const target = subtasks.find(s => s.id === id);
    if (!target) return;

    const safeQty = Math.max(0, newQty);
    let newStatus = target.status;

    if (target.targetQuantity && target.targetQuantity > 0) {
      if (safeQty >= target.targetQuantity) {
        // Test if completion is allowed
        const val = validateSubtaskCompletion(target, safeQty);
        if (val.allowed) {
          newStatus = 'Completed';
        } else {
          // If blocked by children, predecessor, or hold point, cap status as 'In Progress'
          newStatus = 'In Progress';
          showValidationWarning('Completion Blocked by Quality/Dependency Rules', val.reason!);
        }
      } else if (safeQty > 0) {
        newStatus = 'In Progress';
      } else {
        newStatus = 'Not Started';
      }
    } else {
      if (safeQty > 0 && target.status === 'Not Started') newStatus = 'In Progress';
    }

    const updated = subtasks.map(st => {
      if (st.id === id) {
        return {
          ...st,
          completedQuantity: safeQty,
          status: newStatus
        };
      }
      return st;
    });

    if (newStatus !== 'Completed' && target.parentId) {
      revertParentIfCompleted(updated, target.parentId);
    }

    handleSubtasksChange(updated);
  };

  // Quick complete button handler
  const handleQuickComplete = (st: SubTask) => {
    if (readOnly) return;
    const val = validateSubtaskCompletion(st, st.targetQuantity || 1);
    if (!val.allowed) {
      if (val.isHoldPointBlocked) {
        setSignOffSubtask(st);
        setSignOffInspectorName('Site QA/QC Engineer');
        setSignOffNotes('');
        setSignOffPhotoUrl('');
        return;
      }
      showValidationWarning('Completion Blocked', val.reason!);
      return;
    }

    const targetQty = st.targetQuantity || st.completedQuantity || 1;
    const updated = subtasks.map(s => {
      if (s.id === st.id) {
        return {
          ...s,
          status: 'Completed' as const,
          completedQuantity: targetQty
        };
      }
      return s;
    });

    handleSubtasksChange(updated);

    if (addAuditLog) {
      addAuditLog({
        id: `AL-${Math.random().toString(36).substr(2, 9)}`,
        projectId: projectId || 'PROJ-001',
        userId: 'Current User',
        action: 'Subtask Completed',
        details: `Subtask "${st.title}" in Activity "${activityName || activityId || 'Activity'}" completed (${targetQty} ${st.unit || 'units'})`,
        entityType: 'Activity',
        entityId: activityId,
        actionType: 'status_change',
        subtaskId: st.id,
        subtaskTitle: st.title,
        activityName: activityName,
        previousValue: st.status,
        newValue: 'Completed',
        timestamp: new Date().toISOString()
      });
    }
  };

  // QA Hold Point Sign-Off Handlers
  const handleConfirmHoldPointSignOff = () => {
    if (!signOffSubtask) return;
    if (!signOffInspectorName.trim()) {
      alert('Please enter the authorized inspector / supervisor name.');
      return;
    }

    const targetQty = signOffSubtask.targetQuantity || signOffSubtask.completedQuantity || 1;
    const updated = subtasks.map(st => {
      if (st.id === signOffSubtask.id) {
        return {
          ...st,
          status: 'Completed' as const,
          completedQuantity: targetQty,
          holdPointSignOff: {
            signedBy: signOffInspectorName.trim(),
            signedAt: new Date().toISOString(),
            signatureNote: signOffNotes.trim() || 'QA Inspection verified and passed in full compliance.',
            photoUrl: signOffPhotoUrl.trim() || undefined,
            approved: true
          }
        };
      }
      return st;
    });

    handleSubtasksChange(updated);

    if (addAuditLog) {
      addAuditLog({
        id: `AL-${Math.random().toString(36).substr(2, 9)}`,
        projectId: projectId || 'PROJ-001',
        userId: signOffInspectorName.trim(),
        action: 'QA Hold Point Approved',
        details: `QA Hold Point for subtask "${signOffSubtask.title}" in Activity "${activityName || activityId || 'Activity'}" was inspected and approved by ${signOffInspectorName.trim()}. Notes: "${signOffNotes.trim() || 'Passed in full compliance.'}"`,
        entityType: 'Activity',
        entityId: activityId,
        actionType: 'update',
        subtaskId: signOffSubtask.id,
        subtaskTitle: signOffSubtask.title,
        activityName: activityName,
        inspectorName: signOffInspectorName.trim(),
        photoUrl: signOffPhotoUrl.trim() || undefined,
        metadata: { signatureNote: signOffNotes.trim() },
        timestamp: new Date().toISOString()
      });
    }

    setSignOffSubtask(null);
  };

  const handleRevokeHoldPointSignOff = (id: string) => {
    const targetSub = subtasks.find(s => s.id === id);
    const updated = subtasks.map(st => {
      if (st.id === id) {
        return {
          ...st,
          status: 'In Progress' as const,
          holdPointSignOff: undefined
        };
      }
      return st;
    });

    handleSubtasksChange(updated);

    if (addAuditLog && targetSub) {
      addAuditLog({
        id: `AL-${Math.random().toString(36).substr(2, 9)}`,
        projectId: projectId || 'PROJ-001',
        userId: 'Current User',
        action: 'QA Hold Point Revoked',
        details: `QA Sign-off revoked for subtask "${targetSub.title}" in Activity "${activityName || activityId || 'Activity'}"`,
        entityType: 'Activity',
        entityId: activityId,
        actionType: 'update',
        subtaskId: targetSub.id,
        subtaskTitle: targetSub.title,
        activityName: activityName,
        timestamp: new Date().toISOString()
      });
    }

    setSignOffSubtask(null);
  };

  const handleAddSubTask = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!title.trim()) return;

    const newSub: SubTask = {
      id: `SUB-${Math.floor(1000 + Math.random() * 9000)}`,
      title: title.trim(),
      category,
      status: 'Not Started',
      targetQuantity: targetQuantity ? Number(targetQuantity) : undefined,
      completedQuantity: 0,
      unit: unit || 'units',
      assignedWorkers: assignedWorkers.length > 0 ? assignedWorkers : undefined,
      assignedPerson: assignedWorkers.length > 0 ? assignedWorkers.join(', ') : undefined,
      assignedEquipmentList: assignedEquipmentList.length > 0 ? assignedEquipmentList : undefined,
      assignedEquipment: assignedEquipmentList.length > 0 ? assignedEquipmentList.join(', ') : undefined,
      assignedTeams: assignedTeams.length > 0 ? assignedTeams : undefined,
      assignedTeam: assignedTeams.length > 0 ? assignedTeams.join(', ') : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      notes: notes || undefined,
      parentId: parentId || undefined,
      isMilestone: isMilestone || undefined,
      milestoneCriteria: isMilestone ? (milestoneCriteria.trim() || undefined) : undefined,
      isHoldPoint: isHoldPoint || undefined,
      predecessorId: predecessorId || undefined,
      requiresPhotoEvidence: requiresPhotoEvidence || undefined,
      requiresSupervisorSignOff: requiresSupervisorSignOff || undefined
    };

    const updated = [...subtasks, newSub];
    handleSubtasksChange(updated);

    if (addAuditLog) {
      addAuditLog({
        id: `AL-${Math.random().toString(36).substr(2, 9)}`,
        projectId: projectId || 'PROJ-001',
        userId: 'Current User',
        action: 'Subtask Created',
        details: `Subtask "${newSub.title}" (${newSub.category}) added to Activity "${activityName || activityId || 'Activity'}"`,
        entityType: 'Activity',
        entityId: activityId,
        actionType: 'create',
        subtaskId: newSub.id,
        subtaskTitle: newSub.title,
        activityName: activityName,
        timestamp: new Date().toISOString()
      });
    }
    
    // Reset form
    setTitle('');
    setTargetQuantity('');
    setAssignedWorkers([]);
    setAssignedEquipmentList([]);
    setAssignedTeams([]);
    setStartDate('');
    setEndDate('');
    setNotes('');
    setParentId('');
    setIsMilestone(false);
    setMilestoneCriteria('');
    setIsHoldPoint(false);
    setPredecessorId('');
    setRequiresPhotoEvidence(false);
    setRequiresSupervisorSignOff(false);
    setIsAdding(false);
  };

  const handleStartEditSubtask = (st: SubTask, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingSubtaskId(st.id);
    setEditTitle(st.title);
    setEditCategory(st.category);
    setEditTargetQty(st.targetQuantity ?? '');
    setEditCompletedQty(st.completedQuantity ?? 0);
    setEditUnit(st.unit || 'units');
    
    const parsedWorkers = st.assignedWorkers || (st.assignedPerson ? st.assignedPerson.split(',').map(s => s.trim()).filter(Boolean) : []);
    const parsedEquipment = st.assignedEquipmentList || (st.assignedEquipment ? st.assignedEquipment.split(',').map(s => s.trim()).filter(Boolean) : []);
    const parsedTeams = st.assignedTeams || (st.assignedTeam ? st.assignedTeam.split(',').map(s => s.trim()).filter(Boolean) : []);

    setEditAssignedWorkers(parsedWorkers);
    setEditAssignedEquipmentList(parsedEquipment);
    setEditAssignedTeams(parsedTeams);
    setEditStartDate(st.startDate || '');
    setEditEndDate(st.endDate || '');
    setEditStatus(st.status);
    setEditNotes(st.notes || '');
    setEditParentId(st.parentId || '');
    setEditIsMilestone(!!st.isMilestone);
    setEditMilestoneCriteria(st.milestoneCriteria || '');
    setEditIsHoldPoint(!!st.isHoldPoint);
    setEditPredecessorId(st.predecessorId || '');
    setEditRequiresPhotoEvidence(!!st.requiresPhotoEvidence);
    setEditRequiresSupervisorSignOff(!!st.requiresSupervisorSignOff);
  };

  const handleSaveEditSubtask = (id: string, e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!editTitle.trim()) return;

    const targetQ = editTargetQty !== '' ? Number(editTargetQty) : undefined;
    const compQ = editCompletedQty !== '' ? Number(editCompletedQty) : 0;
    let stat = editStatus;

    if (targetQ && targetQ > 0) {
      if (compQ >= targetQ && stat !== 'Completed') {
        stat = 'Completed';
      } else if (compQ > 0 && stat === 'Not Started') {
        stat = 'In Progress';
      }
    }

    const currentSub = subtasks.find(s => s.id === id);
    if (currentSub && stat === 'Completed') {
      const val = validateSubtaskCompletion(
        { 
          ...currentSub, 
          isMilestone: editIsMilestone, 
          parentId: editParentId || undefined,
          isHoldPoint: editIsHoldPoint || undefined,
          predecessorId: editPredecessorId || undefined
        },
        compQ
      );
      if (!val.allowed) {
        showValidationWarning('Edit Saved but Completion Blocked', val.reason!);
        stat = 'In Progress';
      }
    }

    const updated = subtasks.map(st => {
      if (st.id === id) {
        return {
          ...st,
          title: editTitle.trim(),
          category: editCategory,
          targetQuantity: targetQ,
          completedQuantity: compQ,
          unit: editUnit || 'units',
          assignedWorkers: editAssignedWorkers.length > 0 ? editAssignedWorkers : undefined,
          assignedPerson: editAssignedWorkers.length > 0 ? editAssignedWorkers.join(', ') : undefined,
          assignedEquipmentList: editAssignedEquipmentList.length > 0 ? editAssignedEquipmentList : undefined,
          assignedEquipment: editAssignedEquipmentList.length > 0 ? editAssignedEquipmentList.join(', ') : undefined,
          assignedTeams: editAssignedTeams.length > 0 ? editAssignedTeams : undefined,
          assignedTeam: editAssignedTeams.length > 0 ? editAssignedTeams.join(', ') : undefined,
          startDate: editStartDate || undefined,
          endDate: editEndDate || undefined,
          status: stat,
          notes: editNotes || undefined,
          parentId: editParentId || undefined,
          isMilestone: editIsMilestone || undefined,
          milestoneCriteria: editIsMilestone ? (editMilestoneCriteria.trim() || undefined) : undefined,
          isHoldPoint: editIsHoldPoint || undefined,
          predecessorId: editPredecessorId || undefined,
          requiresPhotoEvidence: editRequiresPhotoEvidence || undefined,
          requiresSupervisorSignOff: editRequiresSupervisorSignOff || undefined
        };
      }
      return st;
    });

    if (stat !== 'Completed' && editParentId) {
      revertParentIfCompleted(updated, editParentId);
    }

    handleSubtasksChange(updated);

    if (addAuditLog) {
      addAuditLog({
        id: `AL-${Math.random().toString(36).substr(2, 9)}`,
        projectId: projectId || 'PROJ-001',
        userId: 'Current User',
        action: 'Subtask Updated',
        details: `Subtask "${editTitle.trim()}" in Activity "${activityName || activityId || 'Activity'}" parameters updated`,
        entityType: 'Activity',
        entityId: activityId,
        actionType: 'update',
        subtaskId: id,
        subtaskTitle: editTitle.trim(),
        activityName: activityName,
        previousValue: `Target: ${targetQ || 'N/A'}, Status: ${stat}`,
        newValue: `Target: ${targetQ || 'N/A'}, Status: ${stat}`,
        timestamp: new Date().toISOString()
      });
    }

    setEditingSubtaskId(null);
  };

  const handleDeleteSubTask = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (readOnly) return;

    const target = subtasks.find(s => s.id === id);

    // Also remove parentId references pointing to this task
    const updated = subtasks
      .filter(s => s.id !== id)
      .map(s => s.parentId === id ? { ...s, parentId: undefined } : s);

    handleSubtasksChange(updated);

    if (addAuditLog && target) {
      addAuditLog({
        id: `AL-${Math.random().toString(36).substr(2, 9)}`,
        projectId: projectId || 'PROJ-001',
        userId: 'Current User',
        action: 'Subtask Deleted',
        details: `Subtask "${target.title}" was removed from Activity "${activityName || activityId || 'Activity'}"`,
        entityType: 'Activity',
        entityId: activityId,
        actionType: 'delete',
        subtaskId: target.id,
        subtaskTitle: target.title,
        activityName: activityName,
        previousValue: target.title,
        newValue: 'DELETED',
        timestamp: new Date().toISOString()
      });
    }

    if (editingSubtaskId === id) setEditingSubtaskId(null);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (readOnly) return;
    
    const items = Array.from(subtasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    handleSubtasksChange(items);
  };

  const handleImportSurveySection = (surveyRec: SurveySectionRecord) => {
    const newSubtask: SubTask = {
      id: `ST-SURV-${Date.now().toString(36)}`,
      title: `Trench set-out (${surveyRec.spanName})`,
      category: 'Surveying & Set-out',
      status: surveyRec.status,
      targetQuantity: surveyRec.distanceMeters,
      completedQuantity: surveyRec.completedMeters,
      unit: 'm',
      assignedWorkers: surveyRec.surveyors || [],
      isMilestone: true,
      milestoneCriteria: 'Centerline benchmarks & trench pegging verified by land surveyor',
      isLinkedDiscipline: true,
      linkedActivityId: activityId,
      surveyRecordId: surveyRec.id,
      sectionSpan: surveyRec.spanName,
      chainage: surveyRec.chainageStart && surveyRec.chainageEnd ? `${surveyRec.chainageStart} - ${surveyRec.chainageEnd}` : undefined,
      surveyData: {
        peggingNotes: surveyRec.peggingNotes,
        coordinates: surveyRec.coordinates,
        benchMarkRef: surveyRec.benchmarkRef,
        surveyorName: (surveyRec.surveyors || []).join(', '),
        surveyDate: surveyRec.surveyDate,
        elevation: surveyRec.elevation
      }
    };

    handleSubtasksChange([newSubtask, ...subtasks]);
    linkSurveyRecordToActivity(surveyRec.id, activityId || 'ACT-DEFAULT', newSubtask.id);
    setIsImportSurveyModalOpen(false);
    setSelectedSurveyToImportId('');
  };

  const getCategoryBadgeColor = (cat: SubTaskCategory) => {
    switch (cat) {
      case 'Surveying & Set-out':
      case 'Surveying':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'Site Establishment':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Excavation & Earthworks':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Cable & Underground Installation':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Structure & Foundations':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Paving & Surfacing':
        return 'bg-[#0B5FFF]/10 text-[#0B5FFF] border-blue-200 dark:border-blue-800';
      case 'Quality & Inspection':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-4 bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      {/* Header & Progress Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Layers className="h-5 w-5 text-[#0B5FFF]" />
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Work Breakdown Structure (Subtasks)
            </h3>
            {totalCount > 0 && (
              <Badge variant="outline" className="text-xs font-mono">
                {completedCount}/{totalCount} Completed ({progressPercent}%)
              </Badge>
            )}
            {milestoneCount > 0 && (
              <Badge className="bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-bold flex items-center gap-1">
                <Flag className="h-3 w-3 text-purple-600" />
                {completedMilestoneCount}/{milestoneCount} Milestones Reached
              </Badge>
            )}
            {holdPointCount > 0 && (
              <Badge className="bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-bold flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-rose-600" />
                {signedOffHoldPointCount}/{holdPointCount} QA Hold Points Signed Off
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Break down this activity into detailed tasks, subtasks, predecessor dependencies, and QA quality gates.
          </p>
        </div>
        <div className="flex gap-2 shrink-0 items-center flex-wrap">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 shadow-sm"
            title={isExpanded ? 'Collapse WBS' : 'Expand WBS'}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {!readOnly && (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsImportSurveyModalOpen(true)}
                className="text-xs gap-1.5 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              >
                <Compass className="h-3.5 w-3.5 text-indigo-500" /> Link Survey Hub
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setIsAdding(!isAdding);
                  setEditingSubtaskId(null);
                  if (!isExpanded) setIsExpanded(true);
                }}
                className="text-xs gap-1.5 bg-[#0B5FFF] hover:bg-blue-600 text-white shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" /> Add Subtask
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Advance Survey Banner (Auto-detect matching corridor section like PTS 1 - PTS 2) */}
      {unlinkedMatchingSurvey && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50/90 via-blue-50/80 to-white dark:from-indigo-950/40 dark:via-blue-950/30 dark:to-slate-900/50 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm animate-in fade-in">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 sm:mt-0">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 dark:text-white">
                  Advance Survey Set-Out Available ({unlinkedMatchingSurvey.spanName})
                </span>
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold">
                  {unlinkedMatchingSurvey.distanceMeters}m • {unlinkedMatchingSurvey.status}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                Surveyed by {(unlinkedMatchingSurvey.surveyors || []).join(', ') || 'Survey Team'} {unlinkedMatchingSurvey.surveyDate ? `on ${unlinkedMatchingSurvey.surveyDate}` : ''}. Benchmark: {unlinkedMatchingSurvey.benchmarkRef || 'Ref set'}.
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => handleImportSurveySection(unlinkedMatchingSurvey)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shrink-0 gap-1.5 rounded-xl shadow-sm w-full sm:w-auto"
          >
            <Link2 className="h-3.5 w-3.5" /> Bind Survey to WBS
          </Button>
        </div>
      )}

      {/* Validation Alert Notification Banner */}
      {validationAlert && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 flex items-start justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-1 shadow-sm">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950 dark:text-amber-100">{validationAlert.title}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-amber-900 dark:text-amber-300">
                {validationAlert.message}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setValidationAlert(null)}
            className="p-1 text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-100 rounded-lg shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {isExpanded && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Progress Bar */}
          {totalCount > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span>Overall Subtask Completion</span>
                <span className="font-bold text-[#0B5FFF]">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#0B5FFF] to-emerald-500 transition-all duration-300 rounded-full" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
            </div>
          )}

          {/* Add Subtask Form */}
          {isAdding && !readOnly && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-[#0B5FFF]" /> Create New Subtask / Milestone
                </h4>
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)} 
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-medium text-slate-500">Subtask Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Pole Installation, Trenching, Cable Pulling"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddSubTask(e);
                      }
                    }}
                    required
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as SubTaskCategory)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                  >
                    <option value="Surveying & Set-out">Surveying & Set-out</option>
                    <option value="Site Establishment">Site Establishment</option>
                    <option value="Excavation & Earthworks">Excavation & Earthworks</option>
                    <option value="Cable & Underground Installation">Cable & Underground Installation</option>
                    <option value="Structure & Foundations">Structure & Foundations</option>
                    <option value="Electrical & MEP">Electrical & MEP</option>
                    <option value="Paving & Surfacing">Paving & Surfacing</option>
                    <option value="Quality & Inspection">Quality & Inspection</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Target Qty (Optional)</label>
                  <input
                    type="number"
                    placeholder="e.g. 4"
                    value={targetQuantity}
                    onChange={e => setTargetQuantity(e.target.value ? Number(e.target.value) : '')}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Unit</label>
                  <input
                    type="text"
                    placeholder="Poles, m³, m, units"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                  />
                </div>
              </div>

              {/* Assignment Checklist Popovers: Workers, Machinery, Teams */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <MultiSelectPopoverChecklist
                  label="Assigned Worker(s)"
                  placeholder="Assign workers..."
                  icon={<HardHat className="h-3.5 w-3.5 text-amber-500" />}
                  items={workerItems}
                  selectedIds={assignedWorkers}
                  onChange={setAssignedWorkers}
                  accentColor="amber"
                  emptyMessage="No employees found in directory."
                />
                <MultiSelectPopoverChecklist
                  label="Assigned Machinery"
                  placeholder="Assign equipment..."
                  icon={<Truck className="h-3.5 w-3.5 text-blue-500" />}
                  items={machineryItems}
                  selectedIds={assignedEquipmentList}
                  onChange={setAssignedEquipmentList}
                  accentColor="blue"
                  emptyMessage="No machinery registered."
                />
                <MultiSelectPopoverChecklist
                  label="Assigned Team(s)"
                  placeholder="Assign teams..."
                  icon={<Users className="h-3.5 w-3.5 text-purple-500" />}
                  items={teamItems}
                  selectedIds={assignedTeams}
                  onChange={setAssignedTeams}
                  accentColor="purple"
                  emptyMessage="No teams created yet."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Parent Task (Hierarchy)</label>
                  <select
                    value={parentId}
                    onChange={e => setParentId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                  >
                    <option value="">None (Top-Level Task)</option>
                    {subtasks.filter(s => !s.parentId).map(st => (
                      <option key={st.id} value={st.id}>Parent: {st.title}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                  />
                </div>
              </div>

              {/* Predecessor Dependency Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <Lock className="h-3 w-3 text-amber-500" />
                    Predecessor Task (Gating Dependency)
                  </label>
                  <select
                    value={predecessorId}
                    onChange={e => setPredecessorId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                  >
                    <option value="">None (Can start independently)</option>
                    {subtasks.map((st, idx) => (
                      <option key={st.id} value={st.id}>
                        #{idx + 1}: {st.title} ({st.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Notes / Scope Description</label>
                  <input
                    type="text"
                    placeholder="Optional notes or reference specifications..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                  />
                </div>
              </div>

              {/* Milestone Checkpoint Option */}
              <div className="p-3 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={isMilestone}
                    onChange={e => setIsMilestone(e.target.checked)}
                    className="rounded border-purple-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                  />
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <Flag className="h-3.5 w-3.5 text-purple-600" />
                    Designate as Key Milestone Checkpoint
                  </span>
                </label>
                {isMilestone && (
                  <div className="pl-6 animate-in fade-in">
                    <label className="text-[11px] font-medium text-purple-800 dark:text-purple-300 block mb-1">
                      Milestone Sign-Off / Verification Criteria
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Geotechnical approval certificate, density test > 98%, QA sign-off"
                      value={milestoneCriteria}
                      onChange={e => setMilestoneCriteria(e.target.value)}
                      className="w-full h-8 px-3 rounded-lg border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                )}
              </div>

              {/* QA Inspection Hold Point (Stage Gating) Option */}
              <div className="p-3 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={isHoldPoint}
                    onChange={e => setIsHoldPoint(e.target.checked)}
                    className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                  />
                  <span className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-rose-600" />
                    Designate as QA Inspection Hold Point (Quality Gate)
                  </span>
                </label>
                {isHoldPoint && (
                  <div className="pl-6 pt-1 space-y-2 text-xs text-rose-800 dark:text-rose-300 animate-in fade-in">
                    <p className="text-[11px] text-rose-700 dark:text-rose-400">
                      🔒 Marking this deliverable complete will require formal QA inspector sign-off and approval before proceeding.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-rose-900 dark:text-rose-200">
                        <input 
                          type="checkbox"
                          checked={requiresPhotoEvidence}
                          onChange={e => setRequiresPhotoEvidence(e.target.checked)}
                          className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 h-3.5 w-3.5"
                        />
                        📸 Require Inspection Photo Evidence
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-rose-900 dark:text-rose-200">
                        <input 
                          type="checkbox"
                          checked={requiresSupervisorSignOff}
                          onChange={e => setRequiresSupervisorSignOff(e.target.checked)}
                          className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 h-3.5 w-3.5"
                        />
                        ✍️ Require Supervisor QC Stamp
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(false)} className="text-xs h-8">
                  Cancel
                </Button>
                <Button type="button" size="sm" onClick={handleAddSubTask} className="text-xs h-8 bg-[#0B5FFF] hover:bg-blue-600 text-white">
                  Save Subtask
                </Button>
              </div>
            </div>
          )}

          {/* Subtasks List */}
          {subtasks.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <Layers className="h-8 w-8 text-slate-400 mx-auto mb-2 opacity-60" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No detailed subtasks added yet.</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                Break down this activity into detailed subtasks, milestones, and deliverables.
              </p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="subtasks" isDropDisabled={readOnly}>
                {(provided) => (
                  <div 
                    className="space-y-3"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {subtasks.map((st, index) => {
                      const isEditingThis = editingSubtaskId === st.id;
                      
                      // Calculate child stats for this subtask if it's a parent
                      const childTasks = getChildSubtasks(st.id);
                      const hasChildren = childTasks.length > 0;
                      const incompleteChildren = getIncompleteChildSubtasks(st.id);
                      const completedChildrenCount = childTasks.filter(c => c.status === 'Completed').length;
                      const isBlockedByChildren = incompleteChildren.length > 0;

                      // Parent subtask progress
                      let itemPercent = 0;
                      if (hasChildren) {
                        itemPercent = Math.round((completedChildrenCount / childTasks.length) * 100);
                      } else if (st.targetQuantity && st.targetQuantity > 0) {
                        itemPercent = Math.min(100, Math.round(((st.completedQuantity || 0) / st.targetQuantity) * 100));
                      } else {
                        itemPercent = st.status === 'Completed' ? 100 : st.status === 'In Progress' ? 50 : 0;
                      }

                      const parentTaskObj = st.parentId ? subtasks.find(p => p.id === st.parentId) : null;

                      return (
                        <Draggable key={st.id} draggableId={st.id} index={index} isDragDisabled={readOnly}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={st.parentId ? 'ml-6 sm:ml-8 relative before:content-[""] before:absolute before:-left-4 before:top-6 before:w-3 before:h-px before:bg-slate-300 dark:before:bg-slate-700 before:border-l before:border-slate-300 dark:before:border-slate-700 before:h-[calc(100%+0.75rem)] before:-mt-6' : ''}
                            >
                              {isEditingThis && !readOnly ? (
                                /* EDIT SUBTASK FORM */
                                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800 rounded-xl space-y-3 shadow-md animate-in fade-in">
                                  <div className="flex justify-between items-center border-b border-blue-100 dark:border-blue-900 pb-2">
                                    <h4 className="text-xs font-bold text-[#0B5FFF] uppercase tracking-wider flex items-center gap-1.5" {...provided.dragHandleProps}>
                                      <GripVertical className="h-4 w-4 cursor-grab opacity-50 hover:opacity-100" />
                                      <Edit3 className="h-3.5 w-3.5" /> Edit Subtask: {st.title}
                                    </h4>
                                    <Button variant="ghost" size="sm" onClick={() => setEditingSubtaskId(null)} className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600">
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="md:col-span-2 space-y-1">
                                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Subtask Title</label>
                                      <input
                                        type="text"
                                        value={editTitle}
                                        onChange={e => setEditTitle(e.target.value)}
                                        required
                                        className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Category</label>
                                      <select
                                        value={editCategory}
                                        onChange={e => setEditCategory(e.target.value as SubTaskCategory)}
                                        className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                                      >
                                        <option value="Surveying & Set-out">Surveying & Set-out</option>
                                        <option value="Site Establishment">Site Establishment</option>
                                        <option value="Excavation & Earthworks">Excavation & Earthworks</option>
                                        <option value="Cable & Underground Installation">Cable & Underground Installation</option>
                                        <option value="Structure & Foundations">Structure & Foundations</option>
                                        <option value="Electrical & MEP">Electrical & MEP</option>
                                        <option value="Paving & Surfacing">Paving & Surfacing</option>
                                        <option value="Quality & Inspection">Quality & Inspection</option>
                                        <option value="Custom">Custom</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Completed Qty</label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={editCompletedQty}
                                        onChange={e => setEditCompletedQty(e.target.value ? Number(e.target.value) : '')}
                                        className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-[#0B5FFF] focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Target Qty</label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={editTargetQty}
                                        onChange={e => setEditTargetQty(e.target.value ? Number(e.target.value) : '')}
                                        className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Unit</label>
                                      <input
                                        type="text"
                                        value={editUnit}
                                        onChange={e => setEditUnit(e.target.value)}
                                        className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Status</label>
                                      <select
                                        value={editStatus}
                                        onChange={e => setEditStatus(e.target.value as SubTask['status'])}
                                        className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                                      >
                                        <option value="Not Started">Not Started</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                      </select>
                                    </div>
                                  </div>

                                  {/* Edit Form Assignment Checklists: Workers, Machinery, Teams */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <MultiSelectPopoverChecklist
                                      label="Assigned Worker(s)"
                                      placeholder="Assign workers..."
                                      icon={<HardHat className="h-3.5 w-3.5 text-amber-500" />}
                                      items={workerItems}
                                      selectedIds={editAssignedWorkers}
                                      onChange={setEditAssignedWorkers}
                                      accentColor="amber"
                                      emptyMessage="No employees found."
                                    />
                                    <MultiSelectPopoverChecklist
                                      label="Assigned Machinery"
                                      placeholder="Assign equipment..."
                                      icon={<Truck className="h-3.5 w-3.5 text-blue-500" />}
                                      items={machineryItems}
                                      selectedIds={editAssignedEquipmentList}
                                      onChange={setEditAssignedEquipmentList}
                                      accentColor="blue"
                                      emptyMessage="No machinery registered."
                                    />
                                    <MultiSelectPopoverChecklist
                                      label="Assigned Team(s)"
                                      placeholder="Assign teams..."
                                      icon={<Users className="h-3.5 w-3.5 text-purple-500" />}
                                      items={teamItems}
                                      selectedIds={editAssignedTeams}
                                      onChange={setEditAssignedTeams}
                                      accentColor="purple"
                                      emptyMessage="No teams created."
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Parent Task (Hierarchy)</label>
                                      <select
                                        value={editParentId}
                                        onChange={e => setEditParentId(e.target.value)}
                                        className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                                      >
                                        <option value="">None (Top Level)</option>
                                        {subtasks.filter(s => !s.parentId && s.id !== st.id).map(s => (
                                          <option key={s.id} value={s.id}>{s.title}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Start Date</label>
                                      <input
                                        type="date"
                                        value={editStartDate}
                                        onChange={e => setEditStartDate(e.target.value)}
                                        className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">End Date</label>
                                      <input
                                        type="date"
                                        value={editEndDate}
                                        onChange={e => setEditEndDate(e.target.value)}
                                        className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                                      />
                                    </div>
                                  </div>

                                  {/* Predecessor Dependency Selection for Edit Form */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                        <Lock className="h-3 w-3 text-amber-500" />
                                        Predecessor Task (Gating Dependency)
                                      </label>
                                      <select
                                        value={editPredecessorId}
                                        onChange={e => setEditPredecessorId(e.target.value)}
                                        className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                                      >
                                        <option value="">None (Can start independently)</option>
                                        {subtasks.filter(s => s.id !== st.id).map((s, idx) => (
                                          <option key={s.id} value={s.id}>
                                            #{idx + 1}: {s.title} ({s.status})
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Notes / Scope Description</label>
                                      <input
                                        type="text"
                                        value={editNotes}
                                        onChange={e => setEditNotes(e.target.value)}
                                        placeholder="Optional notes..."
                                        className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                                      />
                                    </div>
                                  </div>

                                  {/* Milestone Toggle for Edit Form */}
                                  <div className="p-3 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-xl space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input 
                                        type="checkbox"
                                        checked={editIsMilestone}
                                        onChange={e => setEditIsMilestone(e.target.checked)}
                                        className="rounded border-purple-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                                      />
                                      <span className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                                        <Flag className="h-3.5 w-3.5 text-purple-600" />
                                        Designate as Key Milestone Checkpoint
                                      </span>
                                    </label>
                                    {editIsMilestone && (
                                      <div className="pl-6">
                                        <label className="text-[11px] font-medium text-purple-800 dark:text-purple-300 block mb-1">
                                          Milestone Criteria / Sign-off Requirement
                                        </label>
                                        <input 
                                          type="text"
                                          value={editMilestoneCriteria}
                                          onChange={e => setEditMilestoneCriteria(e.target.value)}
                                          className="w-full h-8 px-3 rounded-lg border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {/* QA Hold Point Option for Edit Form */}
                                  <div className="p-3 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input 
                                        type="checkbox"
                                        checked={editIsHoldPoint}
                                        onChange={e => setEditIsHoldPoint(e.target.checked)}
                                        className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                                      />
                                      <span className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                                        <ShieldCheck className="h-3.5 w-3.5 text-rose-600" />
                                        Designate as QA Inspection Hold Point (Quality Gate)
                                      </span>
                                    </label>
                                    {editIsHoldPoint && (
                                      <div className="pl-6 pt-1 space-y-2 text-xs text-rose-800 dark:text-rose-300">
                                        <p className="text-[11px] text-rose-700 dark:text-rose-400">
                                          🔒 Quality Gate: Requires formal QA supervisor inspection sign-off before completion.
                                        </p>
                                        <div className="flex flex-wrap gap-4 pt-1">
                                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-rose-900 dark:text-rose-200">
                                            <input 
                                              type="checkbox"
                                              checked={editRequiresPhotoEvidence}
                                              onChange={e => setEditRequiresPhotoEvidence(e.target.checked)}
                                              className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 h-3.5 w-3.5"
                                            />
                                            📸 Require Inspection Photo Evidence
                                          </label>
                                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-rose-900 dark:text-rose-200">
                                            <input 
                                              type="checkbox"
                                              checked={editRequiresSupervisorSignOff}
                                              onChange={e => setEditRequiresSupervisorSignOff(e.target.checked)}
                                              className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 h-3.5 w-3.5"
                                            />
                                            ✍️ Require Supervisor QC Stamp
                                          </label>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setEditingSubtaskId(null)} className="text-xs h-8">
                                      Cancel
                                    </Button>
                                    <Button type="button" size="sm" onClick={(e) => handleSaveEditSubtask(st.id, e)} className="text-xs h-8 bg-[#0B5FFF] hover:bg-blue-600 text-white gap-1">
                                      <Save className="h-3.5 w-3.5" /> Save Changes
                                    </Button>
                                  </div>
                                </div>
                              ) : (

                                /* SUBTASK CARD VIEW */
                                (() => {
                                  // Predecessor calculations
                                  const predTask = st.predecessorId ? subtasks.find(p => p.id === st.predecessorId) : null;
                                  const predIndex = st.predecessorId ? subtasks.findIndex(p => p.id === st.predecessorId) : -1;
                                  const isPredBlocked = predTask ? predTask.status !== 'Completed' : false;

                                  // Hold point calculations
                                  const isHoldPointPending = !!st.isHoldPoint && !st.holdPointSignOff?.approved;
                                  const isAnyBlocked = isBlockedByChildren || isPredBlocked;

                                  return (
                                    <div
                                      className={`flex flex-col gap-3 p-4 rounded-xl border transition-all ${
                                        st.status === 'Completed'
                                          ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/40'
                                          : st.status === 'In Progress'
                                          ? 'bg-blue-50/40 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/40'
                                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                                      } ${st.isMilestone ? 'ring-1 ring-purple-300 dark:ring-purple-800/60' : ''} ${st.isHoldPoint ? 'border-l-4 border-l-rose-500' : ''}`}
                                    >
                                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                          <div {...provided.dragHandleProps} className="mt-1 cursor-grab opacity-50 hover:opacity-100 flex items-center justify-center shrink-0">
                                            <GripVertical className="h-4 w-4 text-slate-400" />
                                          </div>

                                          {/* Status Toggle Icon Button */}
                                          <button
                                            type="button"
                                            onClick={() => handleToggleStatus(st.id)}
                                            disabled={readOnly}
                                            className="mt-0.5 shrink-0 transition-transform active:scale-95"
                                            title={
                                              isBlockedByChildren 
                                                ? `Cannot complete: ${incompleteChildren.length} child subtasks pending` 
                                                : isPredBlocked
                                                ? `Cannot complete: waiting on predecessor #${predIndex + 1} "${predTask?.title}"`
                                                : isHoldPointPending
                                                ? 'QA Hold Point: Click to conduct inspection and sign off'
                                                : 'Click to toggle status (Not Started ➔ In Progress ➔ Completed)'
                                            }
                                          >
                                            {st.status === 'Completed' ? (
                                              <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950/50" />
                                            ) : st.status === 'In Progress' ? (
                                              <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
                                            ) : isBlockedByChildren || isPredBlocked ? (
                                              <Lock className="h-5 w-5 text-amber-500 opacity-80" />
                                            ) : isHoldPointPending ? (
                                              <Lock className="h-5 w-5 text-rose-500" />
                                            ) : (
                                              <Circle className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                            )}
                                          </button>

                                          <div className="space-y-1 min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              {/* Title */}
                                              <span className={`text-sm font-bold ${st.status === 'Completed' ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                                                {st.title}
                                              </span>

                                              {/* Category Badge */}
                                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getCategoryBadgeColor(st.category)}`}>
                                                {st.category}
                                              </span>

                                              {/* Linked Survey Section Badge */}
                                              {(st.isLinkedDiscipline || st.surveyRecordId || st.category === 'Surveying & Set-out') && (
                                                <span 
                                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 shadow-xs"
                                                  title={st.surveyData ? `Surveyor: ${st.surveyData.surveyorName || 'Survey Team'} | Pegs: ${st.surveyData.peggingNotes || 'N/A'} | BM: ${st.surveyData.benchMarkRef || 'N/A'}` : 'Linked to Master Survey Corridor Hub'}
                                                >
                                                  <Compass className="h-3 w-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                                  {st.sectionSpan ? `Survey Section: ${st.sectionSpan}` : 'Survey Hub Linked'}
                                                </span>
                                              )}

                                              {/* Milestone Checkpoint Badge */}
                                              {st.isMilestone && (
                                                <span 
                                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border shadow-xs ${
                                                    st.status === 'Completed'
                                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                                      : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                                                  }`}
                                                  title={st.milestoneCriteria ? `Criteria: ${st.milestoneCriteria}` : 'Key delivery milestone checkpoint'}
                                                >
                                                  <Flag className="h-3 w-3 text-purple-600 dark:text-purple-400 shrink-0" />
                                                  Milestone Checkpoint
                                                </span>
                                              )}

                                              {/* QA Hold Point Badge & Sign-Off Trigger */}
                                              {st.isHoldPoint && (
                                                st.holdPointSignOff?.approved ? (
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      setSignOffSubtask(st);
                                                      setSignOffInspectorName(st.holdPointSignOff?.signedBy || 'Site QA/QC Engineer');
                                                      setSignOffNotes(st.holdPointSignOff?.signatureNote || '');
                                                      setSignOffPhotoUrl(st.holdPointSignOff?.photoUrl || '');
                                                    }}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-xs hover:bg-emerald-200 transition-colors"
                                                    title={`QA Approved by ${st.holdPointSignOff.signedBy}. Click to view verification certificate.`}
                                                  >
                                                    <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                                                    QA Approved: {st.holdPointSignOff.signedBy}
                                                  </button>
                                                ) : (
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setSignOffSubtask(st);
                                                      setSignOffInspectorName('Site QA/QC Engineer');
                                                      setSignOffNotes('');
                                                      setSignOffPhotoUrl('');
                                                    }}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 shadow-xs transition-colors cursor-pointer"
                                                    title="Mandatory Quality Gate. Click to inspect & sign off hold point."
                                                  >
                                                    <Lock className="h-3 w-3 text-rose-600 shrink-0" />
                                                    🔒 QA Hold Point: Sign Off
                                                  </button>
                                                )
                                              )}

                                              {/* Predecessor Dependency Badge */}
                                              {predTask && (
                                                <span 
                                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border shadow-xs ${
                                                    !isPredBlocked 
                                                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                                      : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                                  }`}
                                                  title={!isPredBlocked ? `Predecessor #${predIndex + 1} "${predTask.title}" is completed` : `Blocked until predecessor #${predIndex + 1} "${predTask.title}" is completed`}
                                                >
                                                  {!isPredBlocked ? (
                                                    <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                                                  ) : (
                                                    <Lock className="h-3 w-3 text-amber-600 shrink-0" />
                                                  )}
                                                  {!isPredBlocked ? `After #${predIndex + 1}: ${predTask.title}` : `Waiting on #${predIndex + 1}: ${predTask.title}`}
                                                </span>
                                              )}

                                              {/* Parent Hierarchy Child Tag */}
                                              {parentTaskObj && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                  <CornerDownRight className="h-2.5 w-2.5" />
                                                  Subtask of: {parentTaskObj.title}
                                                </span>
                                              )}

                                              {/* Parent Summary Tag if this task has children */}
                                              {hasChildren && (
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                                  isBlockedByChildren
                                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200'
                                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200'
                                                }`}>
                                                  {isBlockedByChildren ? <AlertTriangle className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                                                  {completedChildrenCount}/{childTasks.length} Child Tasks Complete
                                                </span>
                                              )}
                                            </div>

                                            {/* Milestone criteria display */}
                                            {st.isMilestone && st.milestoneCriteria && (
                                              <p className="text-[11px] font-medium text-purple-700 dark:text-purple-300 italic flex items-center gap-1">
                                                <Info className="h-3 w-3 shrink-0" /> Milestone Requirement: {st.milestoneCriteria}
                                              </p>
                                            )}

                                            {/* QA Hold Point Notes display */}
                                            {st.isHoldPoint && st.holdPointSignOff?.approved && (
                                              <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 italic flex items-center gap-1">
                                                <ShieldCheck className="h-3 w-3 shrink-0" /> QA Verification ({new Date(st.holdPointSignOff.signedAt).toLocaleDateString()}): "{st.holdPointSignOff.signatureNote}"
                                              </p>
                                            )}

                                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                              {/* Assigned Workers */}
                                              {((st.assignedWorkers && st.assignedWorkers.length > 0) || st.assignedPerson) && (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium">
                                                  <HardHat className="h-3 w-3 text-amber-600 shrink-0" />
                                                  <span>{st.assignedWorkers?.length ? st.assignedWorkers.join(', ') : st.assignedPerson}</span>
                                                </span>
                                              )}

                                              {/* Assigned Machinery */}
                                              {((st.assignedEquipmentList && st.assignedEquipmentList.length > 0) || st.assignedEquipment) && (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium">
                                                  <Truck className="h-3 w-3 text-blue-600 shrink-0" />
                                                  <span>{st.assignedEquipmentList?.length ? st.assignedEquipmentList.join(', ') : st.assignedEquipment}</span>
                                                </span>
                                              )}

                                              {/* Assigned Team */}
                                              {((st.assignedTeams && st.assignedTeams.length > 0) || st.assignedTeam) && (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-medium">
                                                  <Users className="h-3 w-3 text-purple-600 shrink-0" />
                                                  <span>{st.assignedTeams?.length ? st.assignedTeams.join(', ') : st.assignedTeam}</span>
                                                </span>
                                              )}

                                              {(st.startDate || st.endDate) && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                  <Calendar className="h-3 w-3 text-emerald-500" />
                                                  {st.startDate ? new Date(st.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '...'} - {st.endDate ? new Date(st.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '...'}
                                                </span>
                                              )}
                                              {st.notes && (
                                                <span className="italic text-slate-400">"{st.notes}"</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Action dropdown and controls */}
                                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                          <select
                                            value={st.status}
                                            disabled={readOnly}
                                            onChange={(e) => handleSelectStatus(st.id, e.target.value as SubTask['status'])}
                                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border cursor-pointer ${
                                              st.status === 'Completed'
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300'
                                                : st.status === 'In Progress'
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300'
                                                : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-300'
                                            }`}
                                          >
                                            <option value="Not Started">Not Started</option>
                                            <option value="In Progress">In Progress</option>
                                            <option 
                                              value="Completed"
                                              disabled={isAnyBlocked}
                                            >
                                              {isBlockedByChildren ? 'Completed (Blocked by children)' : isPredBlocked ? 'Completed (Blocked by predecessor)' : 'Completed'}
                                            </option>
                                          </select>

                                          {!readOnly && (
                                            <button
                                              type="button"
                                              onClick={(e) => handleStartEditSubtask(st, e)}
                                              className="p-1 text-slate-400 hover:text-blue-600 transition-colors rounded-md"
                                              title="Edit Subtask Details"
                                            >
                                              <Edit3 className="h-4 w-4" />
                                            </button>
                                          )}
                                          {!readOnly && (
                                            <button
                                              type="button"
                                              onClick={(e) => handleDeleteSubTask(st.id, e)}
                                              className="p-1 text-slate-400 hover:text-rose-500 transition-colors rounded-md"
                                              title="Delete Subtask"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      {/* Progress & Quantity Logging Bar */}
                                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/40 p-2.5 rounded-lg">
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                                            Progress:
                                          </span>
                                          {hasChildren ? (
                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                              {completedChildrenCount} / {childTasks.length} child tasks completed
                                            </span>
                                          ) : st.targetQuantity ? (
                                            <div className="flex items-center gap-1">
                                              {!readOnly && (
                                                <button
                                                  type="button"
                                                  onClick={() => handleUpdateSubtaskQuantity(st.id, (st.completedQuantity || 0) - 1)}
                                                  className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold hover:bg-slate-300 text-xs"
                                                  title="Decrease Completed Quantity"
                                                >
                                                  <Minus className="h-3 w-3" />
                                                </button>
                                              )}
                                              <input
                                                type="number"
                                                min="0"
                                                max={st.targetQuantity}
                                                disabled={readOnly}
                                                value={st.completedQuantity || 0}
                                                onChange={(e) => handleUpdateSubtaskQuantity(st.id, Number(e.target.value))}
                                                className="w-14 h-7 text-center font-bold text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-[#0B5FFF]"
                                              />
                                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                / {st.targetQuantity} {st.unit}
                                              </span>
                                              {!readOnly && (
                                                <button
                                                  type="button"
                                                  onClick={() => handleUpdateSubtaskQuantity(st.id, (st.completedQuantity || 0) + 1)}
                                                  className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/60 text-[#0B5FFF] dark:text-blue-300 flex items-center justify-center font-bold hover:bg-blue-200 text-xs"
                                                  title="Increase Completed Quantity"
                                                >
                                                  <Plus className="h-3 w-3" />
                                                </button>
                                              )}
                                            </div>
                                          ) : (
                                            <span className="text-xs text-slate-500 font-medium">{st.status}</span>
                                          )}
                                        </div>

                                        {/* Mini Progress Visual Bar & Quick Complete */}
                                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                          <div className="flex items-center gap-2 flex-1 sm:w-36">
                                            <div className="h-2 flex-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                              <div 
                                                className={`h-full transition-all duration-300 rounded-full ${itemPercent === 100 ? 'bg-emerald-500' : 'bg-[#0B5FFF]'}`}
                                                style={{ width: `${itemPercent}%` }} 
                                              />
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 w-9 text-right">
                                              {itemPercent}%
                                            </span>
                                          </div>

                                          {!readOnly && st.status !== 'Completed' && (
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleQuickComplete(st)}
                                              disabled={isAnyBlocked}
                                              className={`h-7 text-[10px] font-bold px-2 py-0 gap-1 shrink-0 ${
                                                isAnyBlocked
                                                  ? 'border-amber-300 text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20 cursor-not-allowed opacity-75'
                                                  : isHoldPointPending
                                                  ? 'border-rose-300 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                                  : 'border-emerald-300 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                              }`}
                                              title={
                                                isBlockedByChildren 
                                                  ? `Blocked: ${incompleteChildren.length} child tasks incomplete` 
                                                  : isPredBlocked
                                                  ? `Blocked: Predecessor #${predIndex + 1} incomplete`
                                                  : isHoldPointPending
                                                  ? 'Requires QA Inspection Sign-Off'
                                                  : 'Mark this subtask 100% completed'
                                              }
                                            >
                                              {isAnyBlocked ? (
                                                <>
                                                  <Lock className="h-3 w-3 text-amber-600" />
                                                  Blocked
                                                </>
                                              ) : isHoldPointPending ? (
                                                <>
                                                  <ShieldCheck className="h-3 w-3 text-rose-600" />
                                                  QA Sign-Off
                                                </>
                                              ) : (
                                                <>
                                                  <Check className="h-3 w-3 text-emerald-600" />
                                                  Complete
                                                </>
                                              )}
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()
                              )}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      )}

      {/* QA Inspection & Hold Point Sign-Off Modal */}
      {signOffSubtask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-rose-50/60 via-purple-50/40 to-blue-50/40 dark:from-rose-950/30 dark:to-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-100 dark:bg-rose-950/80 rounded-xl text-rose-600 dark:text-rose-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    QA Inspection & Hold Point Verification
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {signOffSubtask.title} • {signOffSubtask.category}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSignOffSubtask(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form Content */}
            <div className="p-5 space-y-4 text-xs">
              {/* Criteria Banner */}
              <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl text-amber-900 dark:text-amber-200">
                <p className="font-bold flex items-center gap-1.5 text-xs">
                  <Lock className="h-3.5 w-3.5 text-amber-600" />
                  Mandatory Quality Gate Verification
                </p>
                <p className="text-[11px] mt-1 leading-relaxed text-amber-800 dark:text-amber-300">
                  {signOffSubtask.milestoneCriteria || signOffSubtask.notes || 'This deliverable requires physical quality inspection compliance and authorized supervisor sign-off before downstream execution can continue.'}
                </p>
              </div>

              {/* Inspector Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                  Authorized Inspector / QC Supervisor Name *
                </label>
                <input 
                  type="text"
                  required
                  value={signOffInspectorName}
                  onChange={e => setSignOffInspectorName(e.target.value)}
                  placeholder="e.g. John Doe (Site QA/QC Engineer)"
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                />
              </div>

              {/* Findings / Verification notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                  Inspection Observations & Quality Verification Notes *
                </label>
                <textarea 
                  rows={3}
                  required
                  value={signOffNotes}
                  onChange={e => setSignOffNotes(e.target.value)}
                  placeholder="Record physical inspection observations, specification compliance, density/compaction test results, bedding sand inspection findings..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                />
              </div>

              {/* Photo Evidence URL / attachment */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                  Photo Evidence / Certificate Reference Link (Optional)
                </label>
                <input 
                  type="text"
                  value={signOffPhotoUrl}
                  onChange={e => setSignOffPhotoUrl(e.target.value)}
                  placeholder="Paste photo link, inspection certificate number, or file reference"
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/40">
              {signOffSubtask.holdPointSignOff?.approved ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRevokeHoldPointSignOff(signOffSubtask.id)}
                  className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900 rounded-xl"
                >
                  Revoke Sign-Off
                </Button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSignOffSubtask(null)} 
                  className="text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={handleConfirmHoldPointSignOff}
                  className="text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-sm"
                >
                  <ShieldCheck className="h-4 w-4" /> Approve & Sign Off QA Hold Point
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Link / Import Section from Survey Hub */}
      {isImportSurveyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="h-5 w-5 text-indigo-600" /> Link Survey Corridor Section
              </h3>
              <button type="button" onClick={() => setIsImportSurveyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select an advance surveyed corridor section (e.g. from PTS 1 to PTS 20) to bind as a subtask in this activity with verified coordinates and pegging benchmarks.
            </p>

            <div className="space-y-3 text-xs">
              <label className="text-slate-600 dark:text-slate-300 font-semibold block">Available Survey Sections</label>
              <select
                value={selectedSurveyToImportId}
                onChange={e => setSelectedSurveyToImportId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm font-medium"
              >
                <option value="">-- Choose a survey section --</option>
                {surveyRecords.map(rec => (
                  <option key={rec.id} value={rec.id}>
                    {rec.spanName} ({rec.distanceMeters}m - {rec.status}) {rec.linkedActivityId ? `[Linked: ${rec.linkedActivityName || rec.linkedActivityId}]` : '[Available]'}
                  </option>
                ))}
              </select>
            </div>

            {selectedSurveyToImportId && (() => {
              const previewRec = surveyRecords.find(r => r.id === selectedSurveyToImportId);
              if (!previewRec) return null;
              return (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800/40 text-xs space-y-1">
                  <div className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <Compass className="h-3.5 w-3.5 text-indigo-600" /> {previewRec.spanName} ({previewRec.distanceMeters}m)
                  </div>
                  <div className="text-[11px] text-indigo-700 dark:text-indigo-300">
                    Chainage: {previewRec.chainageStart || 'CH 0+000'} to {previewRec.chainageEnd || '+433m'}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    Crew: {(previewRec.surveyors || []).join(', ') || 'Survey Team'} | Benchmark: {previewRec.benchmarkRef || 'BM Ref'}
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsImportSurveyModalOpen(false)}>Cancel</Button>
              <Button 
                type="button" 
                disabled={!selectedSurveyToImportId} 
                onClick={() => {
                  const targetRec = surveyRecords.find(r => r.id === selectedSurveyToImportId);
                  if (targetRec) handleImportSurveySection(targetRec);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Bind to WBS
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
