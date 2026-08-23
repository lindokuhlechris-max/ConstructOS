import React, { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { SubTask, SubTaskCategory, SubTaskMeasurementType, SubTaskChecklistItem, SurveySectionRecord, SubTaskHoldPointSignOff, ActivityMeasurementPresets } from '../types';
import { WORKFLOW_TEMPLATES } from '../data/activityTemplates';
import { Button, Badge } from './ui';
import { 
  CheckCircle2, Circle, Clock, Plus, Trash2, Edit3, GripVertical, 
  Layers, HardHat, Truck, Sparkles, ChevronDown, ChevronUp, AlertCircle,
  Save, X, Minus, Check, Calendar, Flag, AlertTriangle, Lock, ShieldCheck,
  CornerDownRight, CheckSquare, Sparkle, Info, Search, Users, UserCheck,
  Compass, Link2, Unlink, ExternalLink, Scale, Ruler, Square, Box, Hash,
  Percent, ToggleLeft, ToggleRight, ListChecks, ListTodo,
  LayoutGrid, ListOrdered, List, SlidersHorizontal, Zap
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getPersonInitials, getSubtaskProgressionNumber, inferSubtaskMeasurementType } from '../lib/labourUtils';
import { calculateSubtaskDailyAverage } from '../lib/subtaskProgressUtils';
import { MeasurementPresetsModal } from './MeasurementPresetsModal';
import { WorkflowTemplatesModal } from './WorkflowTemplatesModal';

export const MEASUREMENT_TYPES: {
  type: SubTaskMeasurementType;
  label: string;
  emoji: string;
  defaultUnit: string;
  presetUnits: string[];
  placeholder: string;
  description: string;
  defaultTarget?: number;
  defaultStep: number;
}[] = [
  {
    type: 'Quantity',
    label: 'Quantity',
    emoji: '📊',
    defaultUnit: 'units',
    presetUnits: ['units', 'items', 'batches', 'sets', 'loads'],
    placeholder: 'e.g. 100',
    description: 'General quantified or numerical deliverables',
    defaultTarget: 100,
    defaultStep: 1
  },
  {
    type: 'Length',
    label: 'Length',
    emoji: '📏',
    defaultUnit: 'm',
    presetUnits: ['m', 'km', 'cm', 'mm', 'ft', 'yd', 'lin.m'],
    placeholder: 'e.g. 433',
    description: 'Linear trenching, conduit, piping, or corridor distance',
    defaultTarget: 433,
    defaultStep: 10
  },
  {
    type: 'Area',
    label: 'Area',
    emoji: '📐',
    defaultUnit: 'm²',
    presetUnits: ['m²', 'ha', 'sq ft', 'sq yd', 'acres'],
    placeholder: 'e.g. 250',
    description: 'Surface paving, clearing, excavation footprint or painting',
    defaultTarget: 250,
    defaultStep: 25
  },
  {
    type: 'Volume',
    label: 'Volume',
    emoji: '🧊',
    defaultUnit: 'm³',
    presetUnits: ['m³', 'L', 'cu yd', 'cu ft', 'gallons'],
    placeholder: 'e.g. 500',
    description: 'Bedding sand, concrete pour, aggregate, or bulk earthworks',
    defaultTarget: 100,
    defaultStep: 5
  },
  {
    type: 'Weight',
    label: 'Weight',
    emoji: '⚖️',
    defaultUnit: 'tons',
    presetUnits: ['tons', 't', 'kg', 'lbs'],
    placeholder: 'e.g. 25',
    description: 'Steel rebar, asphalt, gravel, or structural tonnage',
    defaultTarget: 25,
    defaultStep: 1
  },
  {
    type: 'Count',
    label: 'Count',
    emoji: '🔢',
    defaultUnit: 'items',
    presetUnits: ['poles', 'panels', 'fixtures', 'joints', 'pipes', 'items', 'units'],
    placeholder: 'e.g. 16',
    description: 'Number of individual component installations',
    defaultTarget: 10,
    defaultStep: 1
  },
  {
    type: 'Percentage',
    label: 'Percentage',
    emoji: '📈',
    defaultUnit: '%',
    presetUnits: ['%'],
    placeholder: '0 - 100%',
    description: 'Track progress as an overall percentage from 0% to 100%',
    defaultTarget: 100,
    defaultStep: 5
  },
  {
    type: 'Checklist',
    label: 'Checklist',
    emoji: '☑️',
    defaultUnit: 'items',
    presetUnits: ['items'],
    placeholder: 'Add steps...',
    description: 'Break down subtask into interactive multi-step quality items',
    defaultTarget: 5,
    defaultStep: 1
  },
  {
    type: 'Sign-off',
    label: 'Sign-off',
    emoji: '✍️',
    defaultUnit: 'sign-off',
    presetUnits: ['sign-off'],
    placeholder: 'QA Gate',
    description: 'Mandatory QA Inspection Hold Point requiring formal authorization',
    defaultTarget: 1,
    defaultStep: 1
  },
  {
    type: 'Milestone',
    label: 'Milestone',
    emoji: '🚩',
    defaultUnit: 'checkpoint',
    presetUnits: ['checkpoint'],
    placeholder: 'Target date',
    description: 'Key contractual delivery milestone or stage gate date',
    defaultTarget: 1,
    defaultStep: 1
  },
  {
    type: 'Yes/No',
    label: 'Yes/No',
    emoji: '🔘',
    defaultUnit: 'done',
    presetUnits: ['done'],
    placeholder: 'Completed / Pending',
    description: 'Fast binary Done or Pending state',
    defaultTarget: 1,
    defaultStep: 1
  },
];

interface ChecklistItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  initials?: string;
}

interface MultiSelectModalSelectorProps {
  label: string;
  placeholder?: string;
  icon: React.ReactNode;
  items: ChecklistItem[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  accentColor?: 'blue' | 'purple' | 'amber' | 'emerald' | 'orange';
  emptyMessage?: string;
  modalTitle?: string;
  modalSubtitle?: string;
}

function MultiSelectModalSelector({
  label,
  placeholder = 'Select options...',
  icon,
  items,
  selectedIds,
  onChange,
  accentColor = 'blue',
  emptyMessage = 'No items available.',
  modalTitle,
  modalSubtitle
}: MultiSelectModalSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedIds);

  // Sync selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempSelectedIds(selectedIds);
      setSearch('');
    }
  }, [isOpen, selectedIds]);

  const filteredItems = items.filter(it => 
    it.title.toLowerCase().includes(search.toLowerCase()) || 
    (it.subtitle && it.subtitle.toLowerCase().includes(search.toLowerCase())) ||
    (it.badge && it.badge.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleItem = (id: string) => {
    if (tempSelectedIds.includes(id)) {
      setTempSelectedIds(tempSelectedIds.filter(s => s !== id));
    } else {
      setTempSelectedIds([...tempSelectedIds, id]);
    }
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredItems.map(f => f.id);
    const newSelected = Array.from(new Set([...tempSelectedIds, ...allFilteredIds]));
    setTempSelectedIds(newSelected);
  };

  const handleClearAll = () => {
    setTempSelectedIds([]);
  };

  const handleApply = () => {
    onChange(tempSelectedIds);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempSelectedIds(selectedIds);
    setIsOpen(false);
  };

  const removeSelectedInsideModal = (id: string) => {
    setTempSelectedIds(tempSelectedIds.filter(s => s !== id));
  };

  const getAccentStyles = () => {
    switch (accentColor) {
      case 'amber':
        return {
          badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
          iconBg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300',
          ring: 'focus:ring-amber-500',
          activeCard: 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700',
          checkbox: 'bg-amber-500 border-amber-500 text-white',
          highlightText: 'text-amber-800 dark:text-amber-300'
        };
      case 'purple':
        return {
          badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800',
          iconBg: 'bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300',
          ring: 'focus:ring-purple-500',
          activeCard: 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700',
          checkbox: 'bg-purple-600 border-purple-600 text-white',
          highlightText: 'text-purple-800 dark:text-purple-300'
        };
      case 'emerald':
        return {
          badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          iconBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300',
          ring: 'focus:ring-emerald-500',
          activeCard: 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700',
          checkbox: 'bg-emerald-600 border-emerald-600 text-white',
          highlightText: 'text-emerald-800 dark:text-emerald-300'
        };
      case 'orange':
        return {
          badge: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300 dark:border-orange-800',
          iconBg: 'bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-300',
          ring: 'focus:ring-orange-500',
          activeCard: 'bg-orange-50/90 dark:bg-orange-950/40 border-orange-300 dark:border-orange-700',
          checkbox: 'bg-orange-500 border-orange-500 text-white',
          highlightText: 'text-orange-800 dark:text-orange-300'
        };
      default:
        return {
          badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800',
          iconBg: 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300',
          ring: 'focus:ring-blue-500',
          activeCard: 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700',
          checkbox: 'bg-[#0B5FFF] border-[#0B5FFF] text-white',
          highlightText: 'text-[#0B5FFF] dark:text-blue-400'
        };
    }
  };

  const styles = getAccentStyles();
  const selectedCount = selectedIds.length;
  const tempCount = tempSelectedIds.length;

  const displayTitle = modalTitle || `Select ${label}`;
  const displaySubtitle = modalSubtitle || `Choose and assign ${label.toLowerCase()} for this subtask.`;

  return (
    <div className="space-y-1">
      {/* Label & Selected Badge */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          {icon}
          {label}
        </label>
        {selectedCount > 0 && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-2xs ${styles.badge}`}>
            {selectedCount} Selected
          </span>
        )}
      </div>

      {/* Clean Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-left flex items-center justify-between hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all shadow-2xs group cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
          {selectedCount === 0 ? (
            <span className="text-slate-400 font-normal truncate">{placeholder}</span>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {items.find(i => i.id === selectedIds[0])?.title || selectedIds[0]}
              </span>
              {selectedCount > 1 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0 border ${styles.badge}`}>
                  +{selectedCount - 1} more
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200">
          <span className="text-[10px] font-medium hidden sm:inline-block">Assign</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </div>
      </button>

      {/* POP-UP MODAL DIALOG */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCancel();
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-slate-50/50 to-white dark:from-slate-800/40 dark:to-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${styles.iconBg}`}>
                  {icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {displayTitle}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles.badge}`}>
                      {tempCount} Selected
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {displaySubtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Selected Items Quick Removal Bar (Inside Modal) */}
            {tempCount > 0 && (
              <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <span>Currently Selected ({tempCount}):</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-rose-600 dark:text-rose-400 hover:underline text-[10px] font-bold"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {tempSelectedIds.map(id => {
                    const itemObj = items.find(i => i.id === id);
                    const title = itemObj?.title || id;
                    return (
                      <span
                        key={id}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold border shadow-2xs transition-colors ${styles.badge}`}
                      >
                        <span className="truncate max-w-[150px]">{title}</span>
                        <button
                          type="button"
                          onClick={() => removeSelectedInsideModal(id)}
                          className="hover:opacity-70 p-0.5 rounded-full"
                          title={`Remove ${title}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Search & Action Bar */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  autoFocus
                  placeholder={`Search ${label.toLowerCase()}...`}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#0B5FFF] dark:focus:ring-blue-500 outline-none transition-all"
                />
                <div className="absolute left-3 top-2.5 text-slate-400">
                  <Search className="h-4 w-4" />
                </div>
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {filteredItems.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleSelectAllFiltered}
                  className="h-9 text-xs font-bold shrink-0 text-[#0B5FFF] dark:text-blue-400 border-blue-200 dark:border-blue-800"
                >
                  Select All ({filteredItems.length})
                </Button>
              )}
            </div>

            {/* Scrollable Items List */}
            <div className="p-3 overflow-y-auto flex-1 space-y-1.5 max-h-[380px]">
              {filteredItems.length === 0 ? (
                <div className="text-center py-10 text-slate-400 flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                    <Search className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium">{search ? `No matches found for "${search}"` : emptyMessage}</span>
                </div>
              ) : (
                filteredItems.map(item => {
                  const isSelected = tempSelectedIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                        isSelected 
                          ? `${styles.activeCard} shadow-xs` 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`w-4.5 h-4.5 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                          isSelected 
                            ? styles.checkbox 
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}>
                          {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>

                        {item.initials && (
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300 shrink-0">
                            {item.initials}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-xs font-bold leading-tight truncate ${isSelected ? styles.highlightText : 'text-slate-800 dark:text-slate-200'}`}>
                              {item.title}
                            </span>
                            {item.badge && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${item.badgeColor || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.subtitle && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
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

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {tempCount} {label.toLowerCase()} selected
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="text-xs h-8 px-3 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApply}
                  className="text-xs h-8 px-4 bg-[#0B5FFF] hover:bg-blue-600 text-white rounded-lg gap-1.5 font-bold shadow-xs"
                >
                  <Check className="h-3.5 w-3.5" /> Apply & Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Backwards compatibility alias
const MultiSelectPopoverChecklist = MultiSelectModalSelector;

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
  const { activities = [], updateActivity, employees = [], equipment = [], teams = [], addAuditLog, userRole } = useAppContext();
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [isWorkflowTemplatesModalOpen, setIsWorkflowTemplatesModalOpen] = useState(false);
  const [workflowModalTab, setWorkflowModalTab] = useState<'browse' | 'saveCurrent'>('browse');

  const handleApplyWorkflowTemplate = (newSubtasks: SubTask[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      handleSubtasksChange(newSubtasks);
    } else {
      handleSubtasksChange([...subtasks, ...newSubtasks]);
    }
  };

  // Retrieve current active activity and its measurement presets
  const currentActivity = React.useMemo(() => {
    return (activities || []).find(a => a.id === activityId);
  }, [activities, activityId]);

  const activityPresets: ActivityMeasurementPresets = React.useMemo(() => {
    return currentActivity?.measurementPresets || {};
  }, [currentActivity]);

  // Save presets handler with smart, type-aware bulk propagation
  const handleSavePresets = (newPresets: ActivityMeasurementPresets, propagateToExisting: boolean) => {
    if (currentActivity) {
      updateActivity({
        ...currentActivity,
        measurementPresets: newPresets
      });
    }

    if (propagateToExisting && subtasks.length > 0) {
      const updated: SubTask[] = subtasks.map(st => {
        const mType: SubTaskMeasurementType = inferSubtaskMeasurementType(st);
        const preset = newPresets[mType];

        if (mType === 'Sign-off') {
          return {
            ...st,
            measurementType: 'Sign-off',
            isHoldPoint: true,
            unit: 'sign-off',
            targetQuantity: 1,
            stepIncrement: 1
          };
        }

        if (mType === 'Milestone') {
          return {
            ...st,
            measurementType: 'Milestone',
            isMilestone: true,
            unit: 'checkpoint',
            targetQuantity: 1,
            stepIncrement: 1
          };
        }

        if (mType === 'Percentage') {
          return {
            ...st,
            measurementType: 'Percentage',
            unit: '%',
            targetQuantity: 100,
            stepIncrement: preset?.stepIncrement || 5
          };
        }

        if (mType === 'Yes/No') {
          return {
            ...st,
            measurementType: 'Yes/No',
            unit: 'done',
            targetQuantity: 1,
            stepIncrement: 1
          };
        }

        if (mType === 'Checklist') {
          const stepCount = st.checklist?.length || preset?.targetQuantity || 5;
          return {
            ...st,
            measurementType: 'Checklist',
            unit: 'items',
            targetQuantity: stepCount,
            stepIncrement: 1
          };
        }

        // For Length, Area, Volume, Weight, Count, Quantity:
        if (preset && preset.targetQuantity !== undefined && preset.targetQuantity > 0) {
          const newTarget = preset.targetQuantity;
          const defaultFallbackUnit = mType === 'Length' ? 'm' : mType === 'Area' ? 'm²' : mType === 'Volume' ? 'm³' : mType === 'Weight' ? 'tons' : mType === 'Count' ? 'items' : 'units';
          const newUnit = preset.unit || defaultFallbackUnit;
          const newStep = preset.stepIncrement || (mType === 'Length' ? 10 : mType === 'Area' ? 50 : mType === 'Volume' ? 5 : 1);
          
          let compQ = st.completedQuantity ?? 0;
          let newStatus = st.status;

          if (st.status === 'Completed') {
            // Keep completed and align completedQuantity to the new target
            compQ = newTarget;
          } else if (compQ >= newTarget) {
            newStatus = 'Completed';
          } else if (compQ > 0) {
            newStatus = 'In Progress';
          }

          return {
            ...st,
            measurementType: mType,
            targetQuantity: newTarget,
            completedQuantity: compQ,
            unit: newUnit,
            stepIncrement: newStep,
            status: newStatus
          };
        }

        return {
          ...st,
          measurementType: mType
        };
      });

      handleSubtasksChange(updated);
    }
  };
  
  // Cross-Activity Linking Memos: group other activities by discipline/workPackage/category
  const otherActivities = React.useMemo(() => {
    return (activities || []).filter(a => a.id !== activityId);
  }, [activities, activityId]);

  const groupedActivities = React.useMemo(() => {
    const groups: Record<string, typeof activities> = {};
    otherActivities.forEach(act => {
      const groupKey = act.discipline || act.workPackage || 'General';
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(act);
    });
    return groups;
  }, [otherActivities]);

  // Validation alert banner state
  const [validationAlert, setValidationAlert] = useState<{
    type: 'warning' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);

  // New subtask state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SubTaskCategory>('Excavation & Earthworks');
  const [measurementType, setMeasurementType] = useState<SubTaskMeasurementType>('Quantity');
  const [checklist, setChecklist] = useState<SubTaskChecklistItem[]>([]);
  const [newChecklistItemText, setNewChecklistItemText] = useState('');
  const [targetQuantity, setTargetQuantity] = useState<number | ''>('');
  const [unit, setUnit] = useState('units');
  const [stepIncrement, setStepIncrement] = useState<number | undefined>(undefined);
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
  const [linkedActivityId, setLinkedActivityId] = useState<string>('');

  // Editing subtask form state
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<SubTaskCategory>('Excavation & Earthworks');
  const [editMeasurementType, setEditMeasurementType] = useState<SubTaskMeasurementType>('Quantity');
  const [editChecklist, setEditChecklist] = useState<SubTaskChecklistItem[]>([]);
  const [editNewChecklistItemText, setEditNewChecklistItemText] = useState('');
  const [editTargetQty, setEditTargetQty] = useState<number | ''>('');
  const [editCompletedQty, setEditCompletedQty] = useState<number | ''>('');
  const [editUnit, setEditUnit] = useState('units');
  const [editStepIncrement, setEditStepIncrement] = useState<number | undefined>(undefined);
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
  const [editLinkedActivityId, setEditLinkedActivityId] = useState<string>('');

  // Measurement Type change helper with Smart Preset Auto-fill
  const handleMeasurementTypeChange = (newType: SubTaskMeasurementType, isEdit = false) => {
    const config = MEASUREMENT_TYPES.find(m => m.type === newType);
    if (!config) return;

    const preset = activityPresets[newType];
    const defaultQty = preset?.targetQuantity ?? (
      newType === 'Percentage' ? 100 :
      (newType === 'Yes/No' || newType === 'Sign-off' || newType === 'Milestone') ? 1 :
      config.defaultTarget ?? ''
    );
    const defaultU = preset?.unit ?? (
      newType === 'Percentage' ? '%' :
      newType === 'Checklist' ? 'items' :
      newType === 'Sign-off' ? 'sign-off' :
      newType === 'Milestone' ? 'checkpoint' :
      newType === 'Yes/No' ? 'done' :
      config.defaultUnit
    );
    const defaultS = preset?.stepIncrement ?? config.defaultStep ?? 1;

    if (isEdit) {
      setEditMeasurementType(newType);
      setEditUnit(defaultU);
      setEditTargetQty(defaultQty);
      setEditStepIncrement(defaultS);
      if (newType === 'Sign-off') {
        setEditIsHoldPoint(true);
      } else if (newType === 'Milestone') {
        setEditIsMilestone(true);
      }
    } else {
      setMeasurementType(newType);
      setUnit(defaultU);
      setTargetQuantity(defaultQty);
      setStepIncrement(defaultS);
      if (newType === 'Sign-off') {
        setIsHoldPoint(true);
      } else if (newType === 'Milestone') {
        setIsMilestone(true);
      }
    }
  };

  // Checklist item management helpers
  const handleAddChecklistItem = (text: string, isEdit = false) => {
    if (!text.trim()) return;
    const newItem: SubTaskChecklistItem = {
      id: `CHK-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
      text: text.trim(),
      completed: false
    };

    if (isEdit) {
      const updated = [...editChecklist, newItem];
      setEditChecklist(updated);
      setEditNewChecklistItemText('');
      setEditTargetQty(updated.length);
      setEditCompletedQty(updated.filter(c => c.completed).length);
    } else {
      const updated = [...checklist, newItem];
      setChecklist(updated);
      setNewChecklistItemText('');
      setTargetQuantity(updated.length);
    }
  };

  const handleRemoveChecklistItem = (id: string, isEdit = false) => {
    if (isEdit) {
      const updated = editChecklist.filter(c => c.id !== id);
      setEditChecklist(updated);
      setEditTargetQty(updated.length);
      setEditCompletedQty(updated.filter(c => c.completed).length);
    } else {
      const updated = checklist.filter(c => c.id !== id);
      setChecklist(updated);
      setTargetQuantity(updated.length);
    }
  };

  const handleToggleEditChecklistItem = (id: string) => {
    const updated = editChecklist.map(c => c.id === id ? { ...c, completed: !c.completed } : c);
    setEditChecklist(updated);
    const done = updated.filter(c => c.completed).length;
    setEditCompletedQty(done);
    setEditTargetQty(updated.length);
    if (done === updated.length && updated.length > 0) {
      setEditStatus('Completed');
    } else if (done > 0) {
      setEditStatus('In Progress');
    } else {
      setEditStatus('Not Started');
    }
  };

  const handleToggleSubtaskChecklistItem = (subtaskId: string, itemId: string) => {
    if (readOnly) return;
    const target = subtasks.find(s => s.id === subtaskId);
    if (!target || !target.checklist) return;

    const updatedChecklist = target.checklist.map(c => 
      c.id === itemId ? { ...c, completed: !c.completed } : c
    );
    const doneCount = updatedChecklist.filter(c => c.completed).length;
    const totalCount = updatedChecklist.length;
    const newStatus: SubTask['status'] = doneCount === totalCount ? 'Completed' : doneCount > 0 ? 'In Progress' : 'Not Started';

    const updatedSubtask: SubTask = {
      ...target,
      checklist: updatedChecklist,
      targetQuantity: totalCount,
      completedQuantity: doneCount,
      status: newStatus
    };

    if (updatedSubtask.linkedActivityId) {
      syncSubtaskToLinkedActivity(updatedSubtask, 'update');
    }

    const updated = subtasks.map(st => st.id === subtaskId ? updatedSubtask : st);
    handleSubtasksChange(updated);
  };

  // QA Hold Point Sign-Off Modal State
  const [signOffSubtask, setSignOffSubtask] = useState<SubTask | null>(null);
  const [signOffInspectorName, setSignOffInspectorName] = useState('Site QA/QC Engineer');
  const [signOffNotes, setSignOffNotes] = useState('');
  const [signOffPhotoUrl, setSignOffPhotoUrl] = useState('');

  // Bi-directional Cross-Activity Subtask Sync Helper
  const syncSubtaskToLinkedActivity = (
    subtask: SubTask, 
    action: 'update' | 'delete', 
    previousLinkedActId?: string
  ) => {
    if (!updateActivity || !activities) return;

    // Handle Unlinking or re-linking to a different activity
    if (previousLinkedActId && previousLinkedActId !== subtask.linkedActivityId) {
      const oldAct = activities.find(a => a.id === previousLinkedActId);
      if (oldAct && oldAct.subtasks) {
        const cleanedSubs = oldAct.subtasks.filter(
          s => s.linkedSubtaskId !== subtask.id && s.id !== `ST-SYNC-${subtask.id}`
        );
        const doneCount = cleanedSubs.filter(s => s.status === 'Completed').length;
        const newProg = cleanedSubs.length > 0 ? Math.round((doneCount / cleanedSubs.length) * 100) : oldAct.progress;
        updateActivity({
          ...oldAct,
          subtasks: cleanedSubs,
          progress: newProg,
          updatedAt: new Date().toISOString().split('T')[0]
        });
      }
    }

    if (!subtask.linkedActivityId) return;
    const targetAct = activities.find(a => a.id === subtask.linkedActivityId);
    if (!targetAct) return;

    const currentTargetSubs = targetAct.subtasks || [];
    let updatedTargetSubs: SubTask[];

    if (action === 'delete') {
      updatedTargetSubs = currentTargetSubs.filter(
        s => s.linkedSubtaskId !== subtask.id && s.id !== `ST-SYNC-${subtask.id}`
      );
    } else {
      const existingIdx = currentTargetSubs.findIndex(
        s => s.linkedSubtaskId === subtask.id || s.id === `ST-SYNC-${subtask.id}` || (subtask.linkedSubtaskId && s.id === subtask.linkedSubtaskId)
      );

      const counterpartData: SubTask = {
        id: existingIdx >= 0 ? currentTargetSubs[existingIdx].id : `ST-SYNC-${subtask.id}`,
        title: `${subtask.title} [From: ${activityName || activityId || 'Activity'}]`,
        category: subtask.category,
        status: subtask.status,
        completedQuantity: subtask.completedQuantity,
        targetQuantity: subtask.targetQuantity,
        unit: subtask.unit || 'units',
        assignedWorkers: subtask.assignedWorkers,
        assignedPerson: subtask.assignedPerson,
        assignedEquipmentList: subtask.assignedEquipmentList,
        assignedEquipment: subtask.assignedEquipment,
        assignedTeams: subtask.assignedTeams,
        assignedTeam: subtask.assignedTeam,
        startDate: subtask.startDate,
        endDate: subtask.endDate,
        notes: subtask.notes,
        isMilestone: subtask.isMilestone,
        milestoneCriteria: subtask.milestoneCriteria,
        isHoldPoint: subtask.isHoldPoint,
        isLinkedDiscipline: true,
        linkedActivityId: activityId,
        linkedActivityName: activityName,
        linkedSubtaskId: subtask.id,
        sourceActivityId: activityId,
        sourceActivityName: activityName
      };

      if (existingIdx >= 0) {
        updatedTargetSubs = [...currentTargetSubs];
        updatedTargetSubs[existingIdx] = {
          ...currentTargetSubs[existingIdx],
          ...counterpartData,
          id: currentTargetSubs[existingIdx].id
        };
      } else {
        updatedTargetSubs = [...currentTargetSubs, counterpartData];
      }
    }

    const doneCount = updatedTargetSubs.filter(s => s.status === 'Completed').length;
    const newProg = updatedTargetSubs.length > 0 ? Math.round((doneCount / updatedTargetSubs.length) * 100) : targetAct.progress;

    updateActivity({
      ...targetAct,
      subtasks: updatedTargetSubs,
      progress: newProg,
      updatedAt: new Date().toISOString().split('T')[0]
    });
  };

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
      } else if (s.measurementType === 'Checklist' && s.checklist && s.checklist.length > 0) {
        const doneCount = s.checklist.filter(c => c.completed).length;
        totalPercent += Math.round((doneCount / s.checklist.length) * 100);
      } else if (s.measurementType === 'Percentage') {
        totalPercent += Math.min(100, Math.max(0, s.completedQuantity ?? (s.status === 'Completed' ? 100 : 0)));
      } else if (s.measurementType === 'Yes/No' || s.measurementType === 'Milestone' || s.measurementType === 'Sign-off') {
        totalPercent += s.status === 'Completed' ? 100 : s.status === 'In Progress' ? 50 : 0;
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
        const updatedItem: SubTask = {
          ...st,
          status: nextStatus,
          completedQuantity: nextStatus === 'Completed' 
            ? (st.targetQuantity || st.completedQuantity || 0) 
            : nextStatus === 'Not Started' ? 0 : st.completedQuantity
        };
        if (updatedItem.linkedActivityId) {
          syncSubtaskToLinkedActivity(updatedItem, 'update');
        }
        return updatedItem;
      }
      return st;
    });

    // Upward Cascade: If a child is moved away from 'Completed', any completed parent MUST revert to 'In Progress'
    if (nextStatus !== 'Completed' && target.parentId) {
      revertParentIfCompleted(updated, target.parentId);
    }

    handleSubtasksChange(updated);

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
        const updatedItem: SubTask = {
          ...st,
          status: newStatus,
          completedQuantity: newStatus === 'Completed' 
            ? (st.targetQuantity || st.completedQuantity || 0) 
            : newStatus === 'Not Started' ? 0 : st.completedQuantity
        };
        if (updatedItem.linkedActivityId) {
          syncSubtaskToLinkedActivity(updatedItem, 'update');
        }
        return updatedItem;
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
        const updatedItem: SubTask = {
          ...st,
          completedQuantity: safeQty,
          status: newStatus
        };
        if (updatedItem.linkedActivityId) {
          syncSubtaskToLinkedActivity(updatedItem, 'update');
        }
        return updatedItem;
      }
      return st;
    });

    if (newStatus !== 'Completed' && target.parentId) {
      revertParentIfCompleted(updated, target.parentId);
    }

    handleSubtasksChange(updated);
  };

  // Quick complete helper
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
      showValidationWarning('Quick Complete Blocked', val.reason!);
      return;
    }

    const updated = subtasks.map(s => {
      if (s.id === st.id) {
        const updatedItem: SubTask = {
          ...s,
          status: 'Completed',
          completedQuantity: s.targetQuantity || (s.measurementType === 'Percentage' ? 100 : 1)
        };
        if (updatedItem.linkedActivityId) {
          syncSubtaskToLinkedActivity(updatedItem, 'update');
        }
        return updatedItem;
      }
      return s;
    });

    handleSubtasksChange(updated);
  };

  // QA Hold Point Formal Sign-Off Confirmation
  const handleConfirmHoldPointSignOff = () => {
    if (!signOffSubtask) return;

    const signOffRecord: SubTaskHoldPointSignOff = {
      signedBy: signOffInspectorName.trim() || 'Site QA/QC Engineer',
      signedAt: new Date().toISOString(),
      signatureNote: signOffNotes.trim() || 'Verified compliant with project technical specs.',
      photoUrl: signOffPhotoUrl.trim() || undefined,
      approved: true
    };

    const updated = subtasks.map(st => {
      if (st.id === signOffSubtask.id) {
        const updatedItem: SubTask = {
          ...st,
          status: 'Completed',
          completedQuantity: st.targetQuantity || 1,
          holdPointSignOff: signOffRecord
        };
        if (updatedItem.linkedActivityId) {
          syncSubtaskToLinkedActivity(updatedItem, 'update');
        }
        return updatedItem;
      }
      return st;
    });

    handleSubtasksChange(updated);

    if (addAuditLog) {
      addAuditLog({
        id: `AL-${Math.random().toString(36).substr(2, 9)}`,
        projectId: projectId || 'PROJ-001',
        userId: signOffInspectorName || 'QA Inspector',
        action: 'QA Hold Point Sign-Off Approved',
        details: `QA Hold Point "${signOffSubtask.title}" signed off and approved by ${signOffRecord.signedBy}`,
        entityType: 'Activity',
        entityId: activityId,
        actionType: 'sign_off',
        subtaskId: signOffSubtask.id,
        subtaskTitle: signOffSubtask.title,
        activityName: activityName,
        timestamp: new Date().toISOString()
      });
    }

    setSignOffSubtask(null);
  };

  // Revoke QA Hold Point Sign-Off
  const handleRevokeHoldPointSignOff = (subtaskId: string) => {
    const targetSub = subtasks.find(s => s.id === subtaskId);
    if (!targetSub) return;

    const updated = subtasks.map(st => {
      if (st.id === subtaskId) {
        const updatedItem: SubTask = {
          ...st,
          status: 'In Progress',
          holdPointSignOff: undefined
        };
        if (updatedItem.linkedActivityId) {
          syncSubtaskToLinkedActivity(updatedItem, 'update');
        }
        return updatedItem;
      }
      return st;
    });

    handleSubtasksChange(updated);

    if (addAuditLog) {
      addAuditLog({
        id: `AL-${Math.random().toString(36).substr(2, 9)}`,
        projectId: projectId || 'PROJ-001',
        userId: 'QA Inspector',
        action: 'QA Hold Point Sign-Off Revoked',
        details: `QA Hold Point sign-off revoked for "${targetSub.title}"`,
        entityType: 'Activity',
        entityId: activityId,
        actionType: 'sign_off_revoked',
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

    const targetActivity = activities.find(a => a.id === linkedActivityId);

    const targetQ = measurementType === 'Checklist' 
      ? checklist.length 
      : measurementType === 'Percentage' 
      ? 100 
      : (measurementType === 'Yes/No' || measurementType === 'Sign-off' || measurementType === 'Milestone')
      ? 1
      : targetQuantity ? Number(targetQuantity) : undefined;

    const newSub: SubTask = {
      id: `SUB-${Math.floor(1000 + Math.random() * 9000)}`,
      title: title.trim(),
      category,
      measurementType,
      checklist: measurementType === 'Checklist' ? checklist : undefined,
      status: 'Not Started',
      targetQuantity: targetQ,
      completedQuantity: 0,
      unit: measurementType === 'Percentage' ? '%' : (unit || 'units'),
      stepIncrement: stepIncrement || (activityPresets[measurementType]?.stepIncrement) || undefined,
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
      isMilestone: measurementType === 'Milestone' ? true : (isMilestone || undefined),
      milestoneCriteria: (measurementType === 'Milestone' || isMilestone) ? (milestoneCriteria.trim() || undefined) : undefined,
      isHoldPoint: measurementType === 'Sign-off' ? true : (isHoldPoint || undefined),
      predecessorId: predecessorId || undefined,
      requiresPhotoEvidence: requiresPhotoEvidence || undefined,
      requiresSupervisorSignOff: requiresSupervisorSignOff || undefined,
      linkedActivityId: linkedActivityId || undefined,
      linkedActivityName: targetActivity ? targetActivity.name : undefined,
      isLinkedDiscipline: Boolean(linkedActivityId)
    };

    if (newSub.linkedActivityId) {
      syncSubtaskToLinkedActivity(newSub, 'update');
    }

    const updated = [...subtasks, newSub];
    handleSubtasksChange(updated);

    if (addAuditLog) {
      addAuditLog({
        id: `AL-${Math.random().toString(36).substr(2, 9)}`,
        projectId: projectId || 'PROJ-001',
        userId: 'Current User',
        action: 'Subtask Created',
        details: `Subtask "${newSub.title}" (${newSub.category} - ${newSub.measurementType || 'Quantity'}) added to Activity "${activityName || activityId || 'Activity'}"${newSub.linkedActivityName ? ` (Linked to ${newSub.linkedActivityName})` : ''}`,
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
    setCategory('Excavation & Earthworks');
    setMeasurementType('Quantity');
    setChecklist([]);
    setNewChecklistItemText('');
    setTargetQuantity('');
    setUnit('units');
    setStepIncrement(undefined);
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
    setLinkedActivityId('');
    setIsAdding(false);
  };

  const handleStartEditSubtask = (st: SubTask, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingSubtaskId(st.id);
    setEditTitle(st.title);
    setEditCategory(st.category);
    
    const parsedMeasurementType: SubTaskMeasurementType = inferSubtaskMeasurementType(st);
    setEditMeasurementType(parsedMeasurementType);
    setEditChecklist(st.checklist ? [...st.checklist] : []);
    setEditNewChecklistItemText('');
    setEditTargetQty(st.targetQuantity ?? '');
    setEditCompletedQty(st.completedQuantity ?? 0);
    setEditUnit(st.unit || (parsedMeasurementType === 'Length' ? 'm' : parsedMeasurementType === 'Area' ? 'm²' : parsedMeasurementType === 'Volume' ? 'm³' : parsedMeasurementType === 'Weight' ? 'tons' : parsedMeasurementType === 'Count' ? 'items' : parsedMeasurementType === 'Percentage' ? '%' : parsedMeasurementType === 'Sign-off' ? 'sign-off' : parsedMeasurementType === 'Milestone' ? 'checkpoint' : 'units'));
    setEditStepIncrement(st.stepIncrement ?? activityPresets[parsedMeasurementType]?.stepIncrement);
    
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
    setEditLinkedActivityId(st.linkedActivityId || '');
  };

  const handleSaveEditSubtask = (id: string, e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!editTitle.trim()) return;

    let targetQ = editTargetQty !== '' ? Number(editTargetQty) : undefined;
    let compQ = editCompletedQty !== '' ? Number(editCompletedQty) : 0;
    let stat = editStatus;

    if (editMeasurementType === 'Checklist') {
      targetQ = editChecklist.length;
      compQ = editChecklist.filter(c => c.completed).length;
      stat = targetQ > 0 && compQ === targetQ ? 'Completed' : compQ > 0 ? 'In Progress' : 'Not Started';
    } else if (editMeasurementType === 'Percentage') {
      targetQ = 100;
      stat = compQ >= 100 ? 'Completed' : compQ > 0 ? 'In Progress' : 'Not Started';
    } else if (editMeasurementType === 'Yes/No') {
      targetQ = 1;
      compQ = stat === 'Completed' ? 1 : 0;
    } else if (editMeasurementType === 'Sign-off') {
      targetQ = 1;
      compQ = editIsHoldPoint && stat === 'Completed' ? 1 : 0;
    } else if (editMeasurementType === 'Milestone') {
      targetQ = 1;
      compQ = stat === 'Completed' ? 1 : 0;
    } else {
      if (targetQ && targetQ > 0) {
        if (compQ >= targetQ && stat !== 'Completed') {
          stat = 'Completed';
        } else if (compQ > 0 && stat === 'Not Started') {
          stat = 'In Progress';
        }
      }
    }

    const currentSub = subtasks.find(s => s.id === id);
    if (currentSub && stat === 'Completed') {
      const val = validateSubtaskCompletion(
        { 
          ...currentSub, 
          isMilestone: editMeasurementType === 'Milestone' ? true : editIsMilestone, 
          parentId: editParentId || undefined,
          isHoldPoint: editMeasurementType === 'Sign-off' ? true : editIsHoldPoint || undefined,
          predecessorId: editPredecessorId || undefined
        },
        compQ
      );
      if (!val.allowed) {
        showValidationWarning('Edit Saved but Completion Blocked', val.reason!);
        stat = 'In Progress';
      }
    }

    const prevLinkedActId = currentSub?.linkedActivityId;
    const targetActivity = activities.find(a => a.id === editLinkedActivityId);

    const updatedSubtask: SubTask = {
      ...currentSub,
      id,
      title: editTitle.trim(),
      category: editCategory,
      measurementType: editMeasurementType,
      checklist: editMeasurementType === 'Checklist' ? editChecklist : undefined,
      targetQuantity: targetQ,
      completedQuantity: compQ,
      unit: editMeasurementType === 'Percentage' ? '%' : (editUnit || 'units'),
      stepIncrement: editStepIncrement !== undefined ? editStepIncrement : currentSub?.stepIncrement,
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
      isMilestone: editMeasurementType === 'Milestone' ? true : (editIsMilestone || undefined),
      milestoneCriteria: (editMeasurementType === 'Milestone' || editIsMilestone) ? (editMilestoneCriteria.trim() || undefined) : undefined,
      isHoldPoint: editMeasurementType === 'Sign-off' ? true : (editIsHoldPoint || undefined),
      predecessorId: editPredecessorId || undefined,
      requiresPhotoEvidence: editRequiresPhotoEvidence || undefined,
      requiresSupervisorSignOff: editRequiresSupervisorSignOff || undefined,
      linkedActivityId: editLinkedActivityId || undefined,
      linkedActivityName: targetActivity ? targetActivity.name : undefined,
      isLinkedDiscipline: Boolean(editLinkedActivityId)
    };

    syncSubtaskToLinkedActivity(updatedSubtask, 'update', prevLinkedActId);

    const updated = subtasks.map(st => st.id === id ? updatedSubtask : st);

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
        details: `Subtask "${editTitle.trim()}" in Activity "${activityName || activityId || 'Activity'}" parameters updated (${editMeasurementType})${updatedSubtask.linkedActivityName ? ` (Linked to ${updatedSubtask.linkedActivityName})` : ''}`,
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
    if (target && target.linkedActivityId) {
      syncSubtaskToLinkedActivity(target, 'delete');
    }

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
      {/* WBS Workflow Templates Modal */}
      <WorkflowTemplatesModal
        isOpen={isWorkflowTemplatesModalOpen}
        onClose={() => setIsWorkflowTemplatesModalOpen(false)}
        onApplyTemplate={handleApplyWorkflowTemplate}
        currentSubtasks={subtasks}
        activityName={currentActivity?.name || ''}
        defaultTab={workflowModalTab}
      />
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
          {/* View Mode Toggle: Clean Progression List vs Cards View (Icons Only) */}
          {totalCount > 0 && (
            <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Progression List View"
                aria-label="Progression List View"
              >
                <ListOrdered className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Card View"
                aria-label="Card View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          )}

          {!readOnly && (
            <button
              type="button"
              onClick={() => {
                setWorkflowModalTab('browse');
                setIsWorkflowTemplatesModalOpen(true);
              }}
              className="p-2 rounded-xl text-xs font-bold flex items-center justify-center transition-all border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-400 shadow-2xs"
              title="WBS Workflow Templates (Apply or Save)"
              aria-label="WBS Workflow Templates"
            >
              <Sparkles className="h-4 w-4 text-indigo-600" />
            </button>
          )}

          {!readOnly && (
            <button
              type="button"
              onClick={() => setIsPresetsModalOpen(true)}
              className="p-2 rounded-xl text-xs font-bold flex items-center justify-center transition-all border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-[#0B5FFF] hover:border-[#0B5FFF]/40 shadow-2xs"
              title="Subtask Measurement Presets"
              aria-label="Subtask Measurement Presets"
            >
              <SlidersHorizontal className="h-4 w-4 text-[#0B5FFF]" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 shadow-sm"
            title={isExpanded ? 'Collapse WBS' : 'Expand WBS'}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {!readOnly && (
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
          )}
        </div>
      </div>

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
                  <Plus className="h-3.5 w-3.5 text-[#0B5FFF]" /> Add Task / Subtask
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
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Task Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Installation of Bedding Sand"
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
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Task Category</label>
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
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-[#0B5FFF]" />
                    Measurement Type
                  </label>
                  <select
                    value={measurementType}
                    onChange={e => handleMeasurementTypeChange(e.target.value as SubTaskMeasurementType, false)}
                    className="w-full h-9 px-3 rounded-lg border-2 border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-900 text-xs font-bold text-[#0B5FFF] dark:text-blue-400 focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                  >
                    {MEASUREMENT_TYPES.map(m => (
                      <option key={m.type} value={m.type}>
                        {m.emoji} {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Measurement Configuration Area */}
              {(() => {
                const config = MEASUREMENT_TYPES.find(m => m.type === measurementType);
                if (['Quantity', 'Length', 'Area', 'Volume', 'Weight', 'Count'].includes(measurementType)) {
                  return (
                    <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                          <span>{config?.emoji}</span> {config?.label} Measurement Settings
                        </span>
                        <span className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                          {config?.description}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            Target {config?.label}
                          </label>
                          <input
                            type="number"
                            placeholder={config?.placeholder || 'e.g. 100'}
                            value={targetQuantity}
                            onChange={e => setTargetQuantity(e.target.value ? Number(e.target.value) : '')}
                            className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none font-semibold text-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Unit</label>
                          <input
                            type="text"
                            placeholder={config?.defaultUnit || 'units'}
                            value={unit}
                            onChange={e => setUnit(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none font-semibold text-[#0B5FFF]"
                          />
                          {config?.presetUnits && config.presetUnits.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                              <span className="text-[10px] text-slate-400">Presets:</span>
                              {config.presetUnits.map(preset => (
                                <button
                                  type="button"
                                  key={preset}
                                  onClick={() => setUnit(preset)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                    unit === preset 
                                      ? 'bg-[#0B5FFF] text-white shadow-xs' 
                                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#0B5FFF]'
                                  }`}
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (measurementType === 'Percentage') {
                  return (
                    <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                          <Percent className="h-4 w-4 text-indigo-600" /> Percentage Scale Delivery
                        </span>
                        <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
                          0% to 100% Progress Tracking
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        📈 Task delivery is tracked on a percentage scale from 0% to 100%. Target is set to 100%.
                      </p>
                    </div>
                  );
                }

                if (measurementType === 'Checklist') {
                  return (
                    <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                          <ListChecks className="h-4 w-4 text-emerald-600" /> Interactive Checklist ({checklist.length} Steps Defined)
                        </span>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                          Progress updates automatically as steps are completed
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add step (e.g. Place 100mm sand bedding, Check laser grade, Compaction test)..."
                          value={newChecklistItemText}
                          onChange={e => setNewChecklistItemText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddChecklistItem(newChecklistItemText, false);
                            }
                          }}
                          className="flex-1 h-9 px-3 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleAddChecklistItem(newChecklistItemText, false)}
                          className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Step
                        </Button>
                      </div>

                      {/* Quick checklist presets */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400">Quick Suggestions:</span>
                        {[
                          'Check trench bottom level & grade',
                          'Place 100mm bedding sand cushion',
                          'Verify compaction & density',
                          'Record photographic evidence'
                        ].map(suggestion => (
                          <button
                            type="button"
                            key={suggestion}
                            onClick={() => handleAddChecklistItem(suggestion, false)}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100/70 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-300 transition-colors"
                          >
                            + {suggestion}
                          </button>
                        ))}
                      </div>

                      {checklist.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {checklist.map((item, idx) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 text-xs text-slate-800 dark:text-slate-200"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                  Step {idx + 1}:
                                </span>
                                <span className="truncate font-medium">{item.text}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveChecklistItem(item.id, false)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Remove Step"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                if (measurementType === 'Sign-off') {
                  return (
                    <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-rose-600" /> Mandatory QA Hold Point & Inspection Sign-off
                        </span>
                        <span className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">
                          Quality Gate / Inspection Required
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed">
                        🔒 Quality Gate: Marking complete requires formal QA inspector sign-off and approval before proceeding.
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
                          ✍️ Require Supervisor QC Stamp & Certificate
                        </label>
                      </div>
                    </div>
                  );
                }

                if (measurementType === 'Milestone') {
                  return (
                    <div className="p-3.5 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                          <Flag className="h-4 w-4 text-purple-600" /> Key Milestone Checkpoint
                        </span>
                        <span className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                          Stage Gate Checkpoint
                        </span>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-purple-800 dark:text-purple-300 block">
                          Milestone Sign-Off / Verification Criteria
                        </label>
                        <input 
                          type="text"
                          placeholder="e.g. Bedding sand inspection passed, density > 98%, laser depth certified"
                          value={milestoneCriteria}
                          onChange={e => setMilestoneCriteria(e.target.value)}
                          className="w-full h-8 px-3 rounded-lg border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                      </div>
                    </div>
                  );
                }

                if (measurementType === 'Yes/No') {
                  return (
                    <div className="p-3.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <ToggleLeft className="h-4 w-4 text-blue-500" /> Binary State (Done / Pending)
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          Simple Yes/No toggle
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Fast binary toggle between 0% (Pending) and 100% (Done) for one-off tasks.
                      </p>
                    </div>
                  );
                }

                return null;
              })()}

              {/* Assignment Checklist Popovers: Workers, Machinery, Teams */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <MultiSelectModalSelector
                  label="Assigned Worker(s)"
                  placeholder="Assign workers..."
                  icon={<HardHat className="h-3.5 w-3.5 text-amber-500" />}
                  items={workerItems}
                  selectedIds={assignedWorkers}
                  onChange={setAssignedWorkers}
                  accentColor="amber"
                  emptyMessage="No employees found in directory."
                  modalTitle="Assign Site Workers & Personnel"
                  modalSubtitle="Search and select workforce employees allocated to this subtask."
                />
                <MultiSelectModalSelector
                  label="Assigned Machinery"
                  placeholder="Assign equipment..."
                  icon={<Truck className="h-3.5 w-3.5 text-blue-500" />}
                  items={machineryItems}
                  selectedIds={assignedEquipmentList}
                  onChange={setAssignedEquipmentList}
                  accentColor="blue"
                  emptyMessage="No machinery registered."
                  modalTitle="Assign Machinery & Heavy Plant"
                  modalSubtitle="Search and select construction vehicles and equipment allocated to this subtask."
                />
                <MultiSelectModalSelector
                  label="Assigned Team(s)"
                  placeholder="Assign teams..."
                  icon={<Users className="h-3.5 w-3.5 text-purple-500" />}
                  items={teamItems}
                  selectedIds={assignedTeams}
                  onChange={setAssignedTeams}
                  accentColor="purple"
                  emptyMessage="No teams created yet."
                  modalTitle="Assign Teams & Work Crews"
                  modalSubtitle="Search and select specialized crews and subcontractor teams."
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

              {/* Predecessor Dependency & Cross-Activity Linking */}
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
                  <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5 text-indigo-500" />
                    Link Subtask to Activity (Cross-Activity Sync)
                  </label>
                  <select
                    value={linkedActivityId}
                    onChange={e => setLinkedActivityId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">None (Standalone Subtask)</option>
                    {Object.entries(groupedActivities).map(([groupCategory, acts]) => (
                      <optgroup key={groupCategory} label={`📁 ${groupCategory}`}>
                        {acts.map(act => (
                          <option key={act.id} value={act.id}>
                            {act.name} {act.workPackage ? `[${act.workPackage}]` : ''} ({act.status || 'Active'})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              {linkedActivityId && (
                <div className="p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                  <Link2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                  <span>
                    🔗 This subtask will automatically share status and progress with <strong>"{activities.find(a => a.id === linkedActivityId)?.name || linkedActivityId}"</strong>.
                  </span>
                </div>
              )}

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

              {/* Milestone Checkpoint Option */}
              <div className="p-3 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={isMilestone || measurementType === 'Milestone'}
                    onChange={e => setIsMilestone(e.target.checked)}
                    className="rounded border-purple-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                  />
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <Flag className="h-3.5 w-3.5 text-purple-600" />
                    Designate as Key Milestone Checkpoint
                  </span>
                </label>
                {(isMilestone || measurementType === 'Milestone') && (
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
                    checked={isHoldPoint || measurementType === 'Sign-off'}
                    onChange={e => setIsHoldPoint(e.target.checked)}
                    className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                  />
                  <span className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-rose-600" />
                    Designate as QA Inspection Hold Point (Quality Gate)
                  </span>
                </label>
                {(isHoldPoint || measurementType === 'Sign-off') && (
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
            <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <Layers className="h-8 w-8 text-slate-400 mx-auto opacity-60" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No detailed subtasks added yet.</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Break down this activity into detailed subtasks, milestones, and deliverables.
              </p>
              {!readOnly && (
                <div className="pt-2 flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setWorkflowModalTab('browse');
                      setIsWorkflowTemplatesModalOpen(true);
                    }}
                    className="h-7 text-xs rounded-xl gap-1 border-indigo-200 text-indigo-700 dark:text-indigo-300"
                  >
                    <Sparkles className="h-3 w-3 text-indigo-600" /> Use Workflow Template
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsAdding(true)}
                    className="h-7 text-xs font-bold rounded-xl gap-1 bg-[#0B5FFF] text-white"
                  >
                    <Plus className="h-3 w-3" /> Add Custom
                  </Button>
                </div>
              )}
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
                      } else if (st.measurementType === 'Checklist' && st.checklist && st.checklist.length > 0) {
                        const doneCount = st.checklist.filter(c => c.completed).length;
                        itemPercent = Math.round((doneCount / st.checklist.length) * 100);
                      } else if (st.measurementType === 'Percentage') {
                        itemPercent = Math.min(100, Math.max(0, st.completedQuantity ?? (st.status === 'Completed' ? 100 : 0)));
                      } else if (st.measurementType === 'Yes/No' || st.measurementType === 'Milestone' || st.measurementType === 'Sign-off') {
                        itemPercent = st.status === 'Completed' ? 100 : st.status === 'In Progress' ? 50 : 0;
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
                                    <div className="space-y-1">
                                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Subtask Title *</label>
                                      <input
                                        type="text"
                                        value={editTitle}
                                        onChange={e => setEditTitle(e.target.value)}
                                        required
                                        className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none font-medium"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Category</label>
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
                                    <div className="space-y-1">
                                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                        <Sparkles className="h-3.5 w-3.5 text-[#0B5FFF]" />
                                        Measurement Type
                                      </label>
                                      <select
                                        value={editMeasurementType}
                                        onChange={e => handleMeasurementTypeChange(e.target.value as SubTaskMeasurementType, true)}
                                        className="w-full h-9 px-3 rounded-lg border-2 border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-900 text-xs font-bold text-[#0B5FFF] dark:text-blue-400 focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                                      >
                                        {MEASUREMENT_TYPES.map(m => (
                                          <option key={m.type} value={m.type}>
                                            {m.emoji} {m.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  {/* Dynamic Measurement Configuration Area for Edit Mode */}
                                  {(() => {
                                    const config = MEASUREMENT_TYPES.find(m => m.type === editMeasurementType);
                                    if (['Quantity', 'Length', 'Area', 'Volume', 'Weight', 'Count'].includes(editMeasurementType)) {
                                      return (
                                        <div className="p-3 bg-white/70 dark:bg-slate-900/60 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-2.5">
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                                              <span>{config?.emoji}</span> {config?.label} Progress & Targets
                                            </span>
                                            <span className="text-[11px] text-slate-500 font-medium">
                                              {config?.description}
                                            </span>
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
                                                className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none font-semibold text-[#0B5FFF]"
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Status</label>
                                              <select
                                                value={editStatus}
                                                onChange={e => setEditStatus(e.target.value as SubTask['status'])}
                                                className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none font-semibold"
                                              >
                                                <option value="Not Started">Not Started</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Completed">Completed</option>
                                              </select>
                                            </div>
                                          </div>
                                          {config?.presetUnits && (
                                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                              <span className="text-[10px] text-slate-400">Unit Presets:</span>
                                              {config.presetUnits.map(preset => (
                                                <button
                                                  type="button"
                                                  key={preset}
                                                  onClick={() => setEditUnit(preset)}
                                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                                    editUnit === preset 
                                                      ? 'bg-[#0B5FFF] text-white shadow-xs' 
                                                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#0B5FFF]'
                                                  }`}
                                                >
                                                  {preset}
                                                </button>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }

                                    if (editMeasurementType === 'Percentage') {
                                      const currentPct = typeof editCompletedQty === 'number' ? editCompletedQty : 0;
                                      return (
                                        <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 rounded-xl space-y-3">
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                                              <Percent className="h-4 w-4 text-indigo-600" /> Percentage Progress Tracker
                                            </span>
                                            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                              {currentPct}%
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <input 
                                              type="range"
                                              min="0"
                                              max="100"
                                              value={currentPct}
                                              onChange={e => {
                                                const val = Number(e.target.value);
                                                setEditCompletedQty(val);
                                                setEditTargetQty(100);
                                                setEditStatus(val >= 100 ? 'Completed' : val > 0 ? 'In Progress' : 'Not Started');
                                              }}
                                              className="flex-1 accent-[#0B5FFF] cursor-pointer"
                                            />
                                            <div className="flex items-center gap-1">
                                              <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={currentPct}
                                                onChange={e => {
                                                  const val = Math.min(100, Math.max(0, Number(e.target.value)));
                                                  setEditCompletedQty(val);
                                                  setEditTargetQty(100);
                                                  setEditStatus(val >= 100 ? 'Completed' : val > 0 ? 'In Progress' : 'Not Started');
                                                }}
                                                className="w-16 h-8 text-center font-bold text-xs border border-indigo-300 dark:border-indigo-700 rounded-lg bg-white dark:bg-slate-900 text-indigo-600"
                                              />
                                              <span className="text-xs font-bold text-slate-500">%</span>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[10px] text-slate-400">Quick Jump:</span>
                                            {[0, 25, 50, 75, 100].map(val => (
                                              <button
                                                type="button"
                                                key={val}
                                                onClick={() => {
                                                  setEditCompletedQty(val);
                                                  setEditTargetQty(100);
                                                  setEditStatus(val >= 100 ? 'Completed' : val > 0 ? 'In Progress' : 'Not Started');
                                                }}
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                  currentPct === val 
                                                    ? 'bg-indigo-600 text-white' 
                                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-indigo-200 dark:border-indigo-800'
                                                }`}
                                              >
                                                {val}%
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    }

                                    if (editMeasurementType === 'Checklist') {
                                      const checkedCount = editChecklist.filter(c => c.completed).length;
                                      const totalCount = editChecklist.length;
                                      const pct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
                                      return (
                                        <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl space-y-3">
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                                              <ListChecks className="h-4 w-4 text-emerald-600" /> Interactive Checklist ({checkedCount}/{totalCount} Completed - {pct}%)
                                            </span>
                                            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                                              Status: {editStatus}
                                            </span>
                                          </div>
                                          <div className="flex gap-2">
                                            <input
                                              type="text"
                                              placeholder="Add new step..."
                                              value={editNewChecklistItemText}
                                              onChange={e => setEditNewChecklistItemText(e.target.value)}
                                              onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                  e.preventDefault();
                                                  handleAddChecklistItem(editNewChecklistItemText, true);
                                                }
                                              }}
                                              className="flex-1 h-9 px-3 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                            />
                                            <Button
                                              type="button"
                                              size="sm"
                                              onClick={() => handleAddChecklistItem(editNewChecklistItemText, true)}
                                              className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                                            >
                                              <Plus className="h-3.5 w-3.5" /> Add Step
                                            </Button>
                                          </div>
                                          {editChecklist.length > 0 && (
                                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                              {editChecklist.map((item, idx) => (
                                                <div
                                                  key={item.id}
                                                  className={`flex items-center justify-between gap-2 p-2 rounded-lg border text-xs transition-colors ${
                                                    item.completed 
                                                      ? 'bg-emerald-100/50 dark:bg-emerald-950/40 border-emerald-300 text-slate-500' 
                                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                                                  }`}
                                                >
                                                  <label className="flex items-center gap-2 min-w-0 cursor-pointer flex-1">
                                                    <input 
                                                      type="checkbox"
                                                      checked={item.completed}
                                                      onChange={() => handleToggleEditChecklistItem(item.id)}
                                                      className="rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                                    />
                                                    <span className={`text-xs font-medium truncate ${item.completed ? 'line-through text-slate-400' : ''}`}>
                                                      Step #{idx + 1}: {item.text}
                                                    </span>
                                                  </label>
                                                  <button
                                                    type="button"
                                                    onClick={() => handleRemoveChecklistItem(item.id, true)}
                                                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                                    title="Remove Step"
                                                  >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                  </button>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }

                                    if (editMeasurementType === 'Sign-off') {
                                      return (
                                        <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl space-y-2.5">
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                                              <ShieldCheck className="h-4 w-4 text-rose-600" /> Mandatory QA Hold Point Quality Gate
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                              st.holdPointSignOff?.approved 
                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                                                : 'bg-rose-100 text-rose-800 border-rose-300'
                                            }`}>
                                              {st.holdPointSignOff?.approved ? 'QA Approved' : 'Pending QA Inspection'}
                                            </span>
                                          </div>
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
                                      );
                                    }

                                    if (editMeasurementType === 'Milestone') {
                                      return (
                                        <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-xl space-y-2">
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                                              <Flag className="h-4 w-4 text-purple-600" /> Milestone Checkpoint Settings
                                            </span>
                                            <select
                                              value={editStatus}
                                              onChange={e => setEditStatus(e.target.value as SubTask['status'])}
                                              className="h-7 px-2 rounded border border-purple-300 bg-white dark:bg-slate-900 text-[11px] font-bold text-purple-900 dark:text-purple-200"
                                            >
                                              <option value="Not Started">Pending Checkpoint</option>
                                              <option value="In Progress">In Verification</option>
                                              <option value="Completed">Milestone Reached (100%)</option>
                                            </select>
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[11px] font-medium text-purple-800 dark:text-purple-300 block">
                                              Milestone Verification Criteria
                                            </label>
                                            <input 
                                              type="text"
                                              value={editMilestoneCriteria}
                                              onChange={e => setEditMilestoneCriteria(e.target.value)}
                                              className="w-full h-8 px-3 rounded-lg border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                                            />
                                          </div>
                                        </div>
                                      );
                                    }

                                    if (editMeasurementType === 'Yes/No') {
                                      return (
                                        <div className="p-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                              <ToggleLeft className="h-4 w-4 text-blue-500" /> Binary State (Done / Pending)
                                            </span>
                                            <div className="flex gap-2">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setEditStatus('Not Started');
                                                  setEditCompletedQty(0);
                                                }}
                                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                                  editStatus !== 'Completed'
                                                    ? 'bg-slate-700 text-white'
                                                    : 'bg-white dark:bg-slate-900 text-slate-600 border border-slate-300'
                                                }`}
                                              >
                                                ✕ Pending (0%)
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setEditStatus('Completed');
                                                  setEditCompletedQty(1);
                                                }}
                                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                                  editStatus === 'Completed'
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-white dark:bg-slate-900 text-slate-600 border border-slate-300'
                                                }`}
                                              >
                                                ✓ Yes (Done - 100%)
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    }

                                    return null;
                                  })()}

                                  {/* Edit Form Assignment Checklists: Workers, Machinery, Teams */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <MultiSelectModalSelector
                                      label="Assigned Worker(s)"
                                      placeholder="Assign workers..."
                                      icon={<HardHat className="h-3.5 w-3.5 text-amber-500" />}
                                      items={workerItems}
                                      selectedIds={editAssignedWorkers}
                                      onChange={setEditAssignedWorkers}
                                      accentColor="amber"
                                      emptyMessage="No employees found."
                                      modalTitle="Assign Site Workers & Personnel"
                                      modalSubtitle="Search and select workforce employees allocated to this subtask."
                                    />
                                    <MultiSelectModalSelector
                                      label="Assigned Machinery"
                                      placeholder="Assign equipment..."
                                      icon={<Truck className="h-3.5 w-3.5 text-blue-500" />}
                                      items={machineryItems}
                                      selectedIds={editAssignedEquipmentList}
                                      onChange={setEditAssignedEquipmentList}
                                      accentColor="blue"
                                      emptyMessage="No machinery registered."
                                      modalTitle="Assign Machinery & Heavy Plant"
                                      modalSubtitle="Search and select construction vehicles and equipment allocated to this subtask."
                                    />
                                    <MultiSelectModalSelector
                                      label="Assigned Team(s)"
                                      placeholder="Assign teams..."
                                      icon={<Users className="h-3.5 w-3.5 text-purple-500" />}
                                      items={teamItems}
                                      selectedIds={editAssignedTeams}
                                      onChange={setEditAssignedTeams}
                                      accentColor="purple"
                                      emptyMessage="No teams created."
                                      modalTitle="Assign Teams & Work Crews"
                                      modalSubtitle="Search and select specialized crews and subcontractor teams."
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
                                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                        <Link2 className="h-3.5 w-3.5 text-indigo-500" />
                                        Link Subtask to Activity (Cross-Activity Sync)
                                      </label>
                                      <select
                                        value={editLinkedActivityId}
                                        onChange={e => setEditLinkedActivityId(e.target.value)}
                                        className="w-full h-9 px-3 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                      >
                                        <option value="">None (Standalone Subtask)</option>
                                        {Object.entries(groupedActivities).map(([groupCategory, acts]) => (
                                          <optgroup key={groupCategory} label={`📁 ${groupCategory}`}>
                                            {acts.map(act => (
                                              <option key={act.id} value={act.id}>
                                                {act.name} {act.workPackage ? `[${act.workPackage}]` : ''} ({act.status || 'Active'})
                                              </option>
                                            ))}
                                          </optgroup>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  {editLinkedActivityId && (
                                    <div className="p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                                      <Link2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                                      <span>
                                        🔗 This subtask is linked to <strong>"{activities.find(a => a.id === editLinkedActivityId)?.name || editLinkedActivityId}"</strong>. Progress & completion sync automatically across both activities.
                                      </span>
                                    </div>
                                  )}

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

                                  {/* Milestone Toggle for Edit Form */}
                                  <div className="p-3 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-xl space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input 
                                        type="checkbox"
                                        checked={editIsMilestone || editMeasurementType === 'Milestone'}
                                        onChange={e => setEditIsMilestone(e.target.checked)}
                                        className="rounded border-purple-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                                      />
                                      <span className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                                        <Flag className="h-3.5 w-3.5 text-purple-600" />
                                        Designate as Key Milestone Checkpoint
                                      </span>
                                    </label>
                                    {(editIsMilestone || editMeasurementType === 'Milestone') && (
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
                                        checked={editIsHoldPoint || editMeasurementType === 'Sign-off'}
                                        onChange={e => setEditIsHoldPoint(e.target.checked)}
                                        className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                                      />
                                      <span className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                                        <ShieldCheck className="h-3.5 w-3.5 text-rose-600" />
                                        Designate as QA Inspection Hold Point (Quality Gate)
                                      </span>
                                    </label>
                                    {(editIsHoldPoint || editMeasurementType === 'Sign-off') && (
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
                                /* SUBTASK ITEM (LIST OR CARD VIEW) */
                                  (() => {
                                    // Predecessor calculations
                                    const predTask = st.predecessorId ? subtasks.find(p => p.id === st.predecessorId) : null;
                                    const predIndex = st.predecessorId ? subtasks.findIndex(p => p.id === st.predecessorId) : -1;
                                    const isPredBlocked = predTask ? predTask.status !== 'Completed' : false;

                                    // Hold point calculations
                                    const isHoldPointPending = !!st.isHoldPoint && !st.holdPointSignOff?.approved;
                                    const isAnyBlocked = isBlockedByChildren || isPredBlocked;

                                    // Progression numbering sequence (e.g. 1.0, 2.0, 2.1)
                                    const progressionNumber = getSubtaskProgressionNumber(subtasks, index);

                                    // Normalized worker names array
                                    const rawWorkers = (st.assignedWorkers && st.assignedWorkers.length > 0)
                                      ? st.assignedWorkers
                                      : st.assignedPerson
                                      ? [st.assignedPerson]
                                      : [];
                                    const splitWorkers = rawWorkers.flatMap(w => w.includes(',') ? w.split(',').map(s => s.trim()).filter(Boolean) : [w.trim()]);

                                    if (viewMode === 'list') {
                                      /* ==================== CLEAN PROGRESSION LIST VIEW ==================== */
                                      return (
                                        <div
                                          className={`group flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-3.5 py-3 rounded-xl border transition-all ${
                                            st.status === 'Completed'
                                              ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40 hover:border-emerald-300'
                                              : st.status === 'In Progress'
                                              ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/40 hover:border-blue-300'
                                              : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                          } ${st.isMilestone ? 'ring-1 ring-purple-300 dark:ring-purple-800/60' : ''} ${st.isHoldPoint ? 'border-l-4 border-l-rose-500' : ''}`}
                                        >
                                          {/* Left: Drag Handle, Progression Number, Status Icon, Title & Badges */}
                                          <div className="flex items-center gap-2.5 min-w-0 flex-1 flex-wrap sm:flex-nowrap">
                                            <div {...provided.dragHandleProps} className="cursor-grab opacity-40 group-hover:opacity-100 flex items-center justify-center shrink-0">
                                              <GripVertical className="h-4 w-4 text-slate-400" />
                                            </div>

                                            {/* Progression Sequence Index Pill */}
                                            <div 
                                              className={`h-6 min-w-[2.4rem] px-1.5 rounded-lg font-mono font-black text-[11px] flex items-center justify-center shrink-0 shadow-2xs ${
                                                st.status === 'Completed'
                                                  ? 'bg-emerald-600 text-white'
                                                  : st.status === 'In Progress'
                                                  ? 'bg-[#0B5FFF] text-white'
                                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                              }`}
                                              title={`WBS Progression Step ${progressionNumber}`}
                                            >
                                              {progressionNumber}
                                            </div>

                                            {/* Quick Status Toggle Icon */}
                                            <button
                                              type="button"
                                              onClick={() => handleToggleStatus(st.id)}
                                              disabled={readOnly}
                                              className="shrink-0 transition-transform active:scale-95"
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
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-100 dark:fill-emerald-950/50" />
                                              ) : st.status === 'In Progress' ? (
                                                <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
                                              ) : isBlockedByChildren || isPredBlocked ? (
                                                <Lock className="h-4 w-4 text-amber-500 opacity-80" />
                                              ) : isHoldPointPending ? (
                                                <Lock className="h-4 w-4 text-rose-500" />
                                              ) : (
                                                <Circle className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                                              )}
                                            </button>

                                            {/* Subtask Title & Metadata Chips */}
                                            <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                                              <span className={`text-xs font-bold truncate max-w-[240px] sm:max-w-[320px] lg:max-w-none ${st.status === 'Completed' ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                                                {st.title}
                                              </span>

                                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getCategoryBadgeColor(st.category)} shrink-0`}>
                                                {st.category}
                                              </span>

                                              {/* Linked Activity Badge */}
                                              {st.linkedActivityId && (
                                                <span 
                                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 shrink-0"
                                                  title={`Linked Activity: ${st.linkedActivityName || st.linkedActivityId}`}
                                                >
                                                  <Link2 className="h-2.5 w-2.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                                  <span className="truncate max-w-[120px]">Linked: {st.linkedActivityName || st.linkedActivityId}</span>
                                                </span>
                                              )}

                                              {/* QA Hold Point Status Button */}
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
                                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 shrink-0 hover:bg-emerald-200 transition-colors"
                                                    title={`QA Approved by ${st.holdPointSignOff.signedBy}`}
                                                  >
                                                    <ShieldCheck className="h-2.5 w-2.5 text-emerald-600 shrink-0" /> QA Approved
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
                                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 shrink-0 transition-colors"
                                                    title="Quality Hold Point Gate"
                                                  >
                                                    <Lock className="h-2.5 w-2.5 text-rose-600 shrink-0" /> 🔒 QA Gate
                                                  </button>
                                                )
                                              )}

                                              {/* Milestone Badge */}
                                              {st.isMilestone && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 shrink-0">
                                                  <Flag className="h-2.5 w-2.5 text-purple-600 shrink-0" /> Milestone
                                                </span>
                                              )}

                                              {/* Daily Average & Run-Rate Badge */}
                                              {(() => {
                                                const metrics = calculateSubtaskDailyAverage(st);
                                                if (metrics.dailyAverage <= 0) return null;
                                                return (
                                                  <span 
                                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0"
                                                    title={`Calculated Daily Output Average: ${metrics.formattedRate}${metrics.projectedDaysLeft !== undefined ? ` • Est. ${metrics.projectedDaysLeft} shift(s) left` : ''}`}
                                                  >
                                                    <Zap className="h-2.5 w-2.5 text-emerald-500" />
                                                    {metrics.formattedRate}
                                                  </span>
                                                );
                                              })()}

                                              {/* Assigned Personnel Chips */}
                                              {splitWorkers.length > 0 && (
                                                <div className="flex items-center gap-1 shrink-0">
                                                  {splitWorkers.slice(0, 2).map((wName, wIdx) => (
                                                    <div 
                                                      key={wIdx} 
                                                      className="h-5 px-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[9px] flex items-center border border-amber-200 dark:border-amber-800 gap-1 shrink-0"
                                                      title={`Assigned: ${wName}`}
                                                    >
                                                      <HardHat className="h-2.5 w-2.5 text-amber-600 shrink-0" />
                                                      <span className="truncate max-w-[85px]">{wName}</span>
                                                    </div>
                                                  ))}
                                                  {splitWorkers.length > 2 && (
                                                    <span className="text-[9px] font-bold text-slate-400">+{splitWorkers.length - 2}</span>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          {/* Right: Stepper / Quantity Controls + Progress Bar + Quick Complete + Actions */}
                                          <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-center flex-wrap sm:flex-nowrap">
                                            {/* Stepper / Deliverable Controls */}
                                            <div className="flex items-center gap-1.5">
                                              {(() => {
                                                const mType = inferSubtaskMeasurementType(st);
                                                
                                                if (mType === 'Sign-off' || st.isHoldPoint) {
                                                  return st.holdPointSignOff?.approved ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
                                                      <ShieldCheck className="h-3 w-3 text-emerald-600" /> Signed Off
                                                    </span>
                                                  ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200">
                                                      <Lock className="h-2.5 w-2.5 text-rose-500" /> QA Hold Gate
                                                    </span>
                                                  );
                                                }

                                                if (mType === 'Percentage') {
                                                  const step = st.stepIncrement || 5;
                                                  return (
                                                    <div className="flex items-center gap-1">
                                                      {!readOnly && (
                                                        <button
                                                          type="button"
                                                          onClick={() => handleUpdateSubtaskQuantity(st.id, Math.max(0, (st.completedQuantity || 0) - step))}
                                                          className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-[10px]"
                                                          title={`Decrease (-${step}%)`}
                                                        >
                                                          <Minus className="h-2.5 w-2.5" />
                                                        </button>
                                                      )}
                                                      <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        disabled={readOnly}
                                                        value={st.completedQuantity ?? (st.status === 'Completed' ? 100 : 0)}
                                                        onChange={(e) => handleUpdateSubtaskQuantity(st.id, Number(e.target.value))}
                                                        className="w-12 h-6 text-center font-bold text-[11px] border border-indigo-200 dark:border-indigo-800 rounded bg-white dark:bg-slate-900 text-indigo-600"
                                                      />
                                                      <span className="text-[10px] text-indigo-600 font-bold">%</span>
                                                      {!readOnly && (
                                                        <button
                                                          type="button"
                                                          onClick={() => handleUpdateSubtaskQuantity(st.id, Math.min(100, (st.completedQuantity || 0) + step))}
                                                          className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950 hover:bg-indigo-200 text-indigo-600 flex items-center justify-center font-bold text-[10px]"
                                                          title={`Increase (+${step}%)`}
                                                        >
                                                          <Plus className="h-2.5 w-2.5" />
                                                        </button>
                                                      )}
                                                    </div>
                                                  );
                                                }

                                                if (mType === 'Yes/No') {
                                                  return (
                                                    <button
                                                      type="button"
                                                      disabled={readOnly}
                                                      onClick={() => handleToggleStatus(st.id)}
                                                      className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                                                        st.status === 'Completed'
                                                          ? 'bg-emerald-600 text-white shadow-xs'
                                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                                      }`}
                                                    >
                                                      {st.status === 'Completed' ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                                                      {st.status === 'Completed' ? 'Done' : 'Pending'}
                                                    </button>
                                                  );
                                                }

                                                if (mType === 'Checklist' && st.checklist && st.checklist.length > 0) {
                                                  return (
                                                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                                                      <ListChecks className="h-3 w-3 text-emerald-600" />
                                                      {st.checklist.filter(c => c.completed).length}/{st.checklist.length} Steps
                                                    </span>
                                                  );
                                                }

                                                if (mType === 'Milestone' || st.isMilestone) {
                                                  return (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200">
                                                      <Flag className="h-2.5 w-2.5 text-purple-600" /> Checkpoint
                                                    </span>
                                                  );
                                                }

                                                // Quantified / Length / Area / Volume / Weight / Count / Quantity:
                                                if (st.targetQuantity) {
                                                  const step = st.stepIncrement || (mType === 'Length' ? 10 : mType === 'Area' ? 50 : mType === 'Volume' ? 5 : 1);
                                                  return (
                                                    <div className="flex items-center gap-1">
                                                      {!readOnly && (
                                                        <button
                                                          type="button"
                                                          onClick={() => handleUpdateSubtaskQuantity(st.id, (st.completedQuantity || 0) - step)}
                                                          className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-[10px]"
                                                          title={`Decrease Quantity (-${step} ${st.unit || ''})`}
                                                        >
                                                          <Minus className="h-2.5 w-2.5" />
                                                        </button>
                                                      )}
                                                      <input
                                                        type="number"
                                                        min="0"
                                                        max={st.targetQuantity}
                                                        disabled={readOnly}
                                                        value={st.completedQuantity || 0}
                                                        onChange={(e) => handleUpdateSubtaskQuantity(st.id, Number(e.target.value))}
                                                        className="w-12 h-6 text-center font-bold text-[11px] border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-[#0B5FFF]"
                                                      />
                                                      <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                                                        / {st.targetQuantity} {st.unit}
                                                      </span>
                                                      {!readOnly && (
                                                        <button
                                                          type="button"
                                                          onClick={() => handleUpdateSubtaskQuantity(st.id, (st.completedQuantity || 0) + step)}
                                                          className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-900/60 hover:bg-blue-200 text-[#0B5FFF] flex items-center justify-center font-bold text-[10px]"
                                                          title={`Increase Quantity (+${step} ${st.unit || ''})`}
                                                        >
                                                          <Plus className="h-2.5 w-2.5" />
                                                        </button>
                                                      )}
                                                    </div>
                                                  );
                                                }

                                                return <span className="text-[10px] text-slate-400 font-medium">{st.status}</span>;
                                              })()}

                                              {/* Mini Progress Bar */}
                                              <div className="w-14 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shrink-0 hidden sm:block">
                                                <div 
                                                  className={`h-full transition-all duration-300 rounded-full ${itemPercent === 100 ? 'bg-emerald-500' : 'bg-[#0B5FFF]'}`}
                                                  style={{ width: `${itemPercent}%` }} 
                                                />
                                              </div>
                                              <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 w-8 text-right shrink-0">
                                                {itemPercent}%
                                              </span>
                                            </div>

                                            {/* Quick Complete / QA Sign-Off Button */}
                                            {!readOnly && st.status !== 'Completed' && (
                                              <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleQuickComplete(st)}
                                                disabled={isAnyBlocked}
                                                className={`h-6 text-[9px] font-bold px-2 py-0 gap-1 shrink-0 ${
                                                  isAnyBlocked
                                                    ? 'border-amber-300 text-amber-700 dark:text-amber-300 bg-amber-50/50 cursor-not-allowed opacity-75'
                                                    : isHoldPointPending
                                                    ? 'border-rose-300 text-rose-700 hover:bg-rose-50'
                                                    : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                                                }`}
                                              >
                                                {isAnyBlocked ? (
                                                  <>
                                                    <Lock className="h-2.5 w-2.5 text-amber-600" />
                                                    Blocked
                                                  </>
                                                ) : isHoldPointPending ? (
                                                  <>
                                                    <ShieldCheck className="h-2.5 w-2.5 text-rose-600" />
                                                    Sign-Off
                                                  </>
                                                ) : (
                                                  <>
                                                    <Check className="h-2.5 w-2.5 text-emerald-600" />
                                                    Done
                                                  </>
                                                )}
                                              </Button>
                                            )}

                                            {/* Compact Status Dropdown */}
                                            <select
                                              value={st.status}
                                              disabled={readOnly}
                                              onChange={(e) => handleSelectStatus(st.id, e.target.value as SubTask['status'])}
                                              className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border cursor-pointer shrink-0 ${
                                                st.status === 'Completed'
                                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300'
                                                  : st.status === 'In Progress'
                                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300'
                                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-300'
                                              }`}
                                            >
                                              <option value="Not Started">Not Started</option>
                                              <option value="In Progress">In Progress</option>
                                              <option value="Completed" disabled={isAnyBlocked}>
                                                {isBlockedByChildren ? 'Completed (Blocked)' : isPredBlocked ? 'Completed (Blocked)' : 'Completed'}
                                              </option>
                                            </select>

                                            {/* Edit & Delete Action Buttons */}
                                            <div className="flex items-center gap-1 shrink-0">
                                              {!readOnly && (
                                                <button
                                                  type="button"
                                                  onClick={(e) => handleStartEditSubtask(st, e)}
                                                  className="p-1 text-slate-400 hover:text-blue-600 transition-colors rounded"
                                                  title="Edit Subtask"
                                                >
                                                  <Edit3 className="h-3.5 w-3.5" />
                                                </button>
                                              )}
                                              {!readOnly && (
                                                <button
                                                  type="button"
                                                  onClick={(e) => handleDeleteSubTask(st.id, e)}
                                                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors rounded"
                                                  title="Delete Subtask"
                                                >
                                                  <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    }

                                    /* ==================== DETAILED CARD VIEW ==================== */
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

                                            {/* Progression Sequence Index Pill */}
                                            <div 
                                              className={`mt-0.5 h-6 min-w-[2.4rem] px-1.5 rounded-lg font-mono font-black text-[11px] flex items-center justify-center shrink-0 shadow-2xs ${
                                                st.status === 'Completed'
                                                  ? 'bg-emerald-600 text-white'
                                                  : st.status === 'In Progress'
                                                  ? 'bg-[#0B5FFF] text-white'
                                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                              }`}
                                              title={`WBS Progression Step ${progressionNumber}`}
                                            >
                                              {progressionNumber}
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

                                            <div className="min-w-0 flex-1 space-y-1.5">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className={`text-sm font-bold ${st.status === 'Completed' ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                                                  {st.title}
                                                </h4>

                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shadow-xs ${getCategoryBadgeColor(st.category)}`}>
                                                  {st.category}
                                                </span>

                                                {/* Cross-Activity Link Badge */}
                                                {st.linkedActivityId && (
                                                  <span 
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 shadow-xs"
                                                    title={`Linked to Target Activity: ${st.linkedActivityName || activities.find(a => a.id === st.linkedActivityId)?.name || st.linkedActivityId}`}
                                                  >
                                                    <Link2 className="h-3 w-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                                    Linked: {st.linkedActivityName || activities.find(a => a.id === st.linkedActivityId)?.name || st.linkedActivityId}
                                                  </span>
                                                )}

                                                {/* Cross-Activity Source Badge */}
                                                {st.sourceActivityId && !st.linkedActivityId && (
                                                  <span 
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF] dark:text-blue-300 border-blue-200 dark:border-blue-800 shadow-xs"
                                                    title={`Synced from Source Activity: ${st.sourceActivityName || activities.find(a => a.id === st.sourceActivityId)?.name || st.sourceActivityId}`}
                                                  >
                                                    <Link2 className="h-3 w-3 text-[#0B5FFF] shrink-0" />
                                                    Source: {st.sourceActivityName || activities.find(a => a.id === st.sourceActivityId)?.name || st.sourceActivityId}
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

                                                {/* Daily Average & Run-Rate Badge */}
                                                {(() => {
                                                  const metrics = calculateSubtaskDailyAverage(st);
                                                  if (metrics.dailyAverage <= 0) return null;
                                                  return (
                                                    <span 
                                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-xs shrink-0"
                                                      title={`Calculated Daily Output Average: ${metrics.formattedRate}${metrics.projectedDaysLeft !== undefined ? ` • Est. ${metrics.projectedDaysLeft} shift(s) left` : ''}`}
                                                    >
                                                      <Zap className="h-3 w-3 text-emerald-500" />
                                                      {metrics.formattedRate}
                                                    </span>
                                                  );
                                                })()}
                                              </div>

                                              {/* Milestone & Hold Point Info */}
                                              {st.isMilestone && st.milestoneCriteria && (
                                                <p className="text-[11px] font-medium text-purple-700 dark:text-purple-300 italic flex items-center gap-1">
                                                  <Info className="h-3 w-3 shrink-0" /> Milestone Requirement: {st.milestoneCriteria}
                                                </p>
                                              )}
                                              {st.isHoldPoint && st.holdPointSignOff?.approved && (
                                                <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 italic flex items-center gap-1">
                                                  <ShieldCheck className="h-3 w-3 shrink-0" /> QA Verification ({new Date(st.holdPointSignOff.signedAt).toLocaleDateString()}): "{st.holdPointSignOff.signatureNote}"
                                                </p>
                                              )}

                                              {/* Checklist Viewer */}
                                              {st.measurementType === 'Checklist' && st.checklist && st.checklist.length > 0 && (
                                                <div className="space-y-1.5 p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 mt-1">
                                                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900 dark:text-emerald-200">
                                                    <span className="flex items-center gap-1">
                                                      <ListChecks className="h-3.5 w-3.5 text-emerald-600" />
                                                      Checklist Steps ({st.checklist.filter(c => c.completed).length}/{st.checklist.length} Complete):
                                                    </span>
                                                  </div>
                                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                                                    {st.checklist.map((item, idx) => (
                                                      <label 
                                                        key={item.id} 
                                                        className={`flex items-center gap-2 p-1.5 rounded-md border text-xs cursor-pointer transition-all ${
                                                          item.completed 
                                                            ? 'bg-emerald-100/70 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-slate-500 dark:text-slate-400' 
                                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-400'
                                                        }`}
                                                      >
                                                        <input 
                                                          type="checkbox"
                                                          disabled={readOnly}
                                                          checked={item.completed}
                                                          onChange={() => handleToggleSubtaskChecklistItem(st.id, item.id)}
                                                          className="rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                                                        />
                                                        <span className={`text-[11px] font-medium truncate ${item.completed ? 'line-through text-slate-400' : ''}`}>
                                                          #{idx + 1}: {item.text}
                                                        </span>
                                                      </label>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}

                                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                                {/* Assigned Workers */}
                                                {splitWorkers.length > 0 && (
                                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium">
                                                    <HardHat className="h-3 w-3 text-amber-600 shrink-0" />
                                                    <span>{splitWorkers.join(', ')}</span>
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
                                          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                                              Progress:
                                            </span>
                                            {(() => {
                                              const mType = inferSubtaskMeasurementType(st);

                                              if (hasChildren) {
                                                return (
                                                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    {completedChildrenCount} / {childTasks.length} child tasks completed
                                                  </span>
                                                );
                                              }

                                              if (mType === 'Sign-off' || st.isHoldPoint) {
                                                return st.holdPointSignOff?.approved ? (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
                                                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> QA Approved
                                                  </span>
                                                ) : (
                                                  <button
                                                    type="button"
                                                    disabled={readOnly}
                                                    onClick={() => {
                                                      setSignOffSubtask(st);
                                                      setSignOffInspectorName('Site QA/QC Engineer');
                                                      setSignOffNotes('');
                                                      setSignOffPhotoUrl('');
                                                    }}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 hover:bg-rose-100 transition-colors"
                                                  >
                                                    <Lock className="h-3.5 w-3.5 text-rose-600" /> Sign-Off QA Gate
                                                  </button>
                                                );
                                              }

                                              if (mType === 'Checklist' && st.checklist) {
                                                return (
                                                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                                                    <ListChecks className="h-3.5 w-3.5 text-emerald-600" />
                                                    {st.checklist.filter(c => c.completed).length} / {st.checklist.length} steps checked
                                                  </span>
                                                );
                                              }

                                              if (mType === 'Percentage') {
                                                const step = st.stepIncrement || 5;
                                                return (
                                                  <div className="flex items-center gap-1.5">
                                                    {!readOnly && (
                                                      <button
                                                        type="button"
                                                        onClick={() => handleUpdateSubtaskQuantity(st.id, Math.max(0, (st.completedQuantity || 0) - step))}
                                                        className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold hover:bg-slate-300 text-xs"
                                                        title={`Decrease (-${step}%)`}
                                                      >
                                                        <Minus className="h-3 w-3" />
                                                      </button>
                                                    )}
                                                    <input
                                                      type="number"
                                                      min="0"
                                                      max="100"
                                                      disabled={readOnly}
                                                      value={st.completedQuantity ?? (st.status === 'Completed' ? 100 : 0)}
                                                      onChange={(e) => handleUpdateSubtaskQuantity(st.id, Number(e.target.value))}
                                                      className="w-14 h-7 text-center font-bold text-xs border border-indigo-300 dark:border-indigo-700 rounded bg-white dark:bg-slate-900 text-indigo-600"
                                                    />
                                                    <span className="text-xs font-bold text-indigo-600">%</span>
                                                    {!readOnly && (
                                                      <button
                                                        type="button"
                                                        onClick={() => handleUpdateSubtaskQuantity(st.id, Math.min(100, (st.completedQuantity || 0) + step))}
                                                        className="w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-950 hover:bg-indigo-200 text-indigo-600 flex items-center justify-center font-bold text-xs"
                                                        title={`Increase (+${step}%)`}
                                                      >
                                                        <Plus className="h-3 w-3" />
                                                      </button>
                                                    )}
                                                  </div>
                                                );
                                              }

                                              if (mType === 'Yes/No') {
                                                return (
                                                  <button
                                                    type="button"
                                                    disabled={readOnly}
                                                    onClick={() => handleToggleStatus(st.id)}
                                                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                                                      st.status === 'Completed'
                                                        ? 'bg-emerald-600 text-white shadow-xs'
                                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
                                                    }`}
                                                  >
                                                    {st.status === 'Completed' ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                                    {st.status === 'Completed' ? 'Yes (Done)' : 'No (Pending)'}
                                                  </button>
                                                );
                                              }

                                              if (mType === 'Milestone' || st.isMilestone) {
                                                return (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200">
                                                    <Flag className="h-3 w-3 text-purple-600" /> Milestone Checkpoint
                                                  </span>
                                                );
                                              }

                                              if (st.targetQuantity) {
                                                const step = st.stepIncrement || (mType === 'Length' ? 10 : mType === 'Area' ? 50 : mType === 'Volume' ? 5 : 1);
                                                return (
                                                  <div className="flex items-center gap-1">
                                                    {!readOnly && (
                                                      <button
                                                        type="button"
                                                        onClick={() => handleUpdateSubtaskQuantity(st.id, (st.completedQuantity || 0) - step)}
                                                        className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold hover:bg-slate-300 text-xs"
                                                        title={`Decrease Completed Quantity (-${step} ${st.unit || ''})`}
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
                                                        onClick={() => handleUpdateSubtaskQuantity(st.id, (st.completedQuantity || 0) + step)}
                                                        className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/60 hover:bg-blue-200 text-[#0B5FFF] flex items-center justify-center font-bold text-xs"
                                                        title={`Increase Completed Quantity (+${step} ${st.unit || ''})`}
                                                      >
                                                        <Plus className="h-3 w-3" />
                                                      </button>
                                                    )}
                                                  </div>
                                                );
                                              }

                                              return <span className="text-xs text-slate-500 font-medium">{st.status}</span>;
                                            })()}
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

      {/* Measurement Presets Configuration Modal */}
      <MeasurementPresetsModal
        isOpen={isPresetsModalOpen}
        onClose={() => setIsPresetsModalOpen(false)}
        activityId={activityId}
        activityName={activityName || currentActivity?.name}
        activityTargetQuantity={currentActivity?.targetQuantity}
        activityUnit={currentActivity?.unit}
        currentPresets={activityPresets}
        onSavePresets={handleSavePresets}
      />
    </div>
  );
}
