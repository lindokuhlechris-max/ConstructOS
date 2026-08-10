import React, { useState } from 'react';
import { SubTask, SubTaskCategory } from '../types';
import { WORKFLOW_TEMPLATES } from '../data/activityTemplates';
import { Button, Badge, ProgressBar } from './ui';
import { 
  CheckCircle2, Circle, Clock, Plus, Trash2, Edit3, 
  Layers, HardHat, Truck, Sparkles, ChevronDown, ChevronUp, AlertCircle,
  Save, X, Minus, TrendingUp, Check
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface SubTaskManagerProps {
  subtasks: SubTask[];
  onChange: (updatedSubtasks: SubTask[]) => void;
  onAutoSyncProgress?: (calcProgress: number) => void;
  readOnly?: boolean;
}

export function SubTaskManager({ subtasks = [], onChange, onAutoSyncProgress, readOnly = false }: SubTaskManagerProps) {
  const { employees, equipment } = useAppContext();
  
  const [isAdding, setIsAdding] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  
  // New subtask state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SubTaskCategory>('Excavation & Earthworks');
  const [targetQuantity, setTargetQuantity] = useState<number | ''>('');
  const [unit, setUnit] = useState('m³');
  const [assignedPerson, setAssignedPerson] = useState('');
  const [assignedEquipment, setAssignedEquipment] = useState('');
  const [notes, setNotes] = useState('');

  // Editing subtask form state
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<SubTaskCategory>('Excavation & Earthworks');
  const [editTargetQty, setEditTargetQty] = useState<number | ''>('');
  const [editCompletedQty, setEditCompletedQty] = useState<number | ''>('');
  const [editUnit, setEditUnit] = useState('m³');
  const [editAssignedPerson, setEditAssignedPerson] = useState('');
  const [editAssignedEquipment, setEditAssignedEquipment] = useState('');
  const [editStatus, setEditStatus] = useState<SubTask['status']>('Not Started');
  const [editNotes, setEditNotes] = useState('');

  const completedCount = subtasks.filter(s => s.status === 'Completed').length;
  const inProgressCount = subtasks.filter(s => s.status === 'In Progress').length;
  const totalCount = subtasks.length;

  // Calculate weighted progress percentage across subtasks
  const calculateOverallProgress = (tasks: SubTask[]) => {
    if (tasks.length === 0) return 0;
    let totalPercent = 0;
    tasks.forEach(s => {
      if (s.targetQuantity && s.targetQuantity > 0) {
        const itemPercent = Math.min(100, Math.round(((s.completedQuantity || 0) / s.targetQuantity) * 100));
        totalPercent += itemPercent;
      } else {
        totalPercent += s.status === 'Completed' ? 100 : s.status === 'In Progress' ? 50 : 0;
      }
    });
    return Math.round(totalPercent / tasks.length);
  };

  const progressPercent = calculateOverallProgress(subtasks);

  const handleSubtasksChange = (updated: SubTask[]) => {
    onChange(updated);
    if (onAutoSyncProgress) {
      onAutoSyncProgress(calculateOverallProgress(updated));
    }
  };

  const handleToggleStatus = (id: string) => {
    if (readOnly) return;
    const nextStatus: Record<string, SubTask['status']> = {
      'Not Started': 'In Progress',
      'In Progress': 'Completed',
      'Completed': 'Not Started'
    };

    const updated = subtasks.map(st => {
      if (st.id === id) {
        const newStatus = nextStatus[st.status];
        return {
          ...st,
          status: newStatus,
          completedQuantity: newStatus === 'Completed' ? (st.targetQuantity || st.completedQuantity || 0) : newStatus === 'Not Started' ? 0 : st.completedQuantity
        };
      }
      return st;
    });

    handleSubtasksChange(updated);
  };

  const handleUpdateSubtaskQuantity = (id: string, newQty: number) => {
    if (readOnly) return;
    const safeQty = Math.max(0, newQty);

    const updated = subtasks.map(st => {
      if (st.id === id) {
        let newStatus = st.status;
        if (st.targetQuantity && st.targetQuantity > 0) {
          if (safeQty >= st.targetQuantity) newStatus = 'Completed';
          else if (safeQty > 0) newStatus = 'In Progress';
          else newStatus = 'Not Started';
        } else {
          if (safeQty > 0) newStatus = 'In Progress';
        }
        return {
          ...st,
          completedQuantity: safeQty,
          status: newStatus
        };
      }
      return st;
    });

    handleSubtasksChange(updated);
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
      assignedPerson: assignedPerson || undefined,
      assignedEquipment: assignedEquipment || undefined,
      notes: notes || undefined
    };

    const updated = [...subtasks, newSub];
    handleSubtasksChange(updated);
    
    // Reset form
    setTitle('');
    setTargetQuantity('');
    setNotes('');
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
    setEditAssignedPerson(st.assignedPerson || '');
    setEditAssignedEquipment(st.assignedEquipment || '');
    setEditStatus(st.status);
    setEditNotes(st.notes || '');
  };

  const handleSaveEditSubtask = (id: string, e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!editTitle.trim()) return;

    const updated = subtasks.map(st => {
      if (st.id === id) {
        const targetQ = editTargetQty !== '' ? Number(editTargetQty) : undefined;
        const compQ = editCompletedQty !== '' ? Number(editCompletedQty) : 0;
        let stat = editStatus;
        if (targetQ && targetQ > 0) {
          if (compQ >= targetQ && stat !== 'Completed') stat = 'Completed';
          else if (compQ > 0 && stat === 'Not Started') stat = 'In Progress';
        }

        return {
          ...st,
          title: editTitle.trim(),
          category: editCategory,
          targetQuantity: targetQ,
          completedQuantity: compQ,
          unit: editUnit || 'units',
          assignedPerson: editAssignedPerson || undefined,
          assignedEquipment: editAssignedEquipment || undefined,
          status: stat,
          notes: editNotes || undefined
        };
      }
      return st;
    });

    handleSubtasksChange(updated);
    setEditingSubtaskId(null);
  };

  const handleDeleteSubTask = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (readOnly) return;
    const updated = subtasks.filter(s => s.id !== id);
    handleSubtasksChange(updated);
    if (editingSubtaskId === id) setEditingSubtaskId(null);
  };

  const handleApplyTemplate = (templateId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const tmpl = WORKFLOW_TEMPLATES.find(t => t.id === templateId);
    if (!tmpl) return;

    const generatedSubtasks: SubTask[] = tmpl.subtasks.map((st, index) => ({
      ...st,
      id: `SUB-${Math.floor(1000 + Math.random() * 9000)}-${index}`
    }));

    const updated = [...subtasks, ...generatedSubtasks];
    handleSubtasksChange(updated);
    setShowTemplates(false);
  };

  const getCategoryBadgeColor = (cat: SubTaskCategory) => {
    switch (cat) {
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
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-4 bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      {/* Header & Progress Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#0B5FFF]" />
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Work Breakdown Structure (Subtasks)
            </h3>
            {totalCount > 0 && (
              <Badge variant="outline" className="text-xs font-mono">
                {completedCount}/{totalCount} Completed ({progressPercent}%)
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Break down this activity into detailed tasks (Excavation, Cable installation, Structure, Site establishment).
          </p>
        </div>

        {!readOnly && (
          <div className="flex gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowTemplates(!showTemplates)}
              className="text-xs gap-1.5 border-blue-200 dark:border-blue-900 text-[#0B5FFF] hover:bg-blue-50 dark:hover:bg-blue-950/40"
            >
              <Sparkles className="h-3.5 w-3.5" /> Quick Templates
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setIsAdding(!isAdding);
                setEditingSubtaskId(null);
              }}
              className="text-xs gap-1.5 bg-[#0B5FFF] hover:bg-blue-600 text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Add Subtask
            </Button>
          </div>
        )}
      </div>

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

      {/* Template Quick Selection Panel */}
      {showTemplates && !readOnly && (
        <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl space-y-3 animate-in fade-in">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#0B5FFF]" /> Load Preset Workflow Template
            </h4>
            <button onClick={() => setShowTemplates(false)} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {WORKFLOW_TEMPLATES.map(tmpl => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleApplyTemplate(tmpl.id)}
                className="p-3 text-left bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#0B5FFF] dark:hover:border-[#0B5FFF] transition-all group shadow-sm"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-[#0B5FFF] transition-colors">{tmpl.name}</span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5">{tmpl.subtasks.length} tasks</Badge>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{tmpl.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add Subtask Form */}
      {isAdding && !readOnly && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 animate-in fade-in">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Create New Detailed Subtask</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-medium text-slate-500">Subtask Title</label>
              <input
                type="text"
                placeholder="e.g. Pole Installation"
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
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Assigned Worker</label>
              <select
                value={assignedPerson}
                onChange={e => setAssignedPerson(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
              >
                <option value="">Unassigned</option>
                {employees.map(emp => (
                  <option key={emp.id} value={`${emp.firstName} ${emp.lastName}`}>{emp.firstName} {emp.lastName} ({emp.position})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Assigned Machinery</label>
              <select
                value={assignedEquipment}
                onChange={e => setAssignedEquipment(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
              >
                <option value="">None</option>
                {equipment.map(eq => (
                  <option key={eq.id} value={eq.name}>{eq.name} ({eq.id})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(false)} className="text-xs h-8">Cancel</Button>
            <Button type="button" size="sm" onClick={handleAddSubTask} className="text-xs h-8 bg-[#0B5FFF] hover:bg-blue-600 text-white">Save Subtask</Button>
          </div>
        </div>
      )}

      {/* Subtasks List */}
      {subtasks.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <Layers className="h-8 w-8 text-slate-400 mx-auto mb-2 opacity-60" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No detailed subtasks added yet.</p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
            Click <strong>"Quick Templates"</strong> above to auto-generate Excavation, Cable, or Foundation tasks in 1 click!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {subtasks.map((st) => {
            const isEditingThis = editingSubtaskId === st.id;
            const itemPercent = st.targetQuantity && st.targetQuantity > 0 
              ? Math.min(100, Math.round(((st.completedQuantity || 0) / st.targetQuantity) * 100))
              : (st.status === 'Completed' ? 100 : st.status === 'In Progress' ? 50 : 0);

            if (isEditingThis && !readOnly) {
              /* EDIT SUBTASK FORM */
              return (
                <div key={st.id} className="p-4 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800 rounded-xl space-y-3 shadow-md animate-in fade-in">
                  <div className="flex justify-between items-center border-b border-blue-100 dark:border-blue-900 pb-2">
                    <h4 className="text-xs font-bold text-[#0B5FFF] uppercase tracking-wider flex items-center gap-1.5">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Assigned Worker</label>
                      <select
                        value={editAssignedPerson}
                        onChange={e => setEditAssignedPerson(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                      >
                        <option value="">Unassigned</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={`${emp.firstName} ${emp.lastName}`}>{emp.firstName} {emp.lastName} ({emp.position})</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Assigned Machinery</label>
                      <select
                        value={editAssignedEquipment}
                        onChange={e => setEditAssignedEquipment(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                      >
                        <option value="">None</option>
                        {equipment.map(eq => (
                          <option key={eq.id} value={eq.name}>{eq.name} ({eq.id})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditingSubtaskId(null)} className="text-xs h-8">Cancel</Button>
                    <Button type="button" size="sm" onClick={(e) => handleSaveEditSubtask(st.id, e)} className="text-xs h-8 bg-[#0B5FFF] hover:bg-blue-600 text-white gap-1">
                      <Save className="h-3.5 w-3.5" /> Save Changes
                    </Button>
                  </div>
                </div>
              );
            }

            /* SUBTASK CARD VIEW */
            return (
              <div
                key={st.id}
                className={`flex flex-col gap-3 p-4 rounded-xl border transition-all ${
                  st.status === 'Completed'
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/40'
                    : st.status === 'In Progress'
                    ? 'bg-blue-50/40 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/40'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(st.id)}
                      disabled={readOnly}
                      className="mt-0.5 shrink-0 transition-transform active:scale-95"
                      title="Click to toggle status (Not Started ➔ In Progress ➔ Completed)"
                    >
                      {st.status === 'Completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950/50" />
                      ) : st.status === 'In Progress' ? (
                        <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                      )}
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-bold ${st.status === 'Completed' ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {st.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getCategoryBadgeColor(st.category)}`}>
                          {st.category}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                        {st.assignedPerson ? (
                          <span className="flex items-center gap-1">
                            <HardHat className="h-3 w-3 text-amber-500" /> {st.assignedPerson}
                          </span>
                        ) : null}
                        {st.assignedEquipment ? (
                          <span className="flex items-center gap-1">
                            <Truck className="h-3 w-3 text-blue-500" /> {st.assignedEquipment}
                          </span>
                        ) : null}
                        {st.notes && (
                          <span className="italic text-slate-400">"{st.notes}"</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <select
                      value={st.status}
                      disabled={readOnly}
                      onChange={(e) => {
                        const newStat = e.target.value as SubTask['status'];
                        const updated = subtasks.map(s => s.id === st.id ? { 
                          ...s, 
                          status: newStat,
                          completedQuantity: newStat === 'Completed' ? (s.targetQuantity || s.completedQuantity || 0) : newStat === 'Not Started' ? 0 : s.completedQuantity
                        } : s);
                        handleSubtasksChange(updated);
                      }}
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
                      <option value="Completed">Completed</option>
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
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">Progress:</span>
                    {st.targetQuantity ? (
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

                    {!readOnly && st.targetQuantity && st.status !== 'Completed' && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateSubtaskQuantity(st.id, st.targetQuantity || 0)}
                        className="h-7 text-[10px] font-bold px-2 py-0 gap-1 border-emerald-300 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shrink-0"
                      >
                        <Check className="h-3 w-3 text-emerald-600" /> Complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
