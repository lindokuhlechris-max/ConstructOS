import React, { useState } from 'react';
import { Activity, ActivityExplainerItem, SubTask } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from './ui';
import { 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Edit3, 
  Wrench, 
  X, 
  Check, 
  Calendar, 
  PlayCircle,
  Tag,
  Layers,
  Sparkles,
  Link as LinkIcon,
  CheckSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ActivityExplainerBreakdownProps {
  activity: Activity;
  onUpdateActivity: (updatedActivity: Activity) => void;
  readOnly?: boolean;
}

export function ActivityExplainerBreakdown({ activity, onUpdateActivity, readOnly = false }: ActivityExplainerBreakdownProps) {
  // Ensure we have a valid list of subtask explainer items. Seed with subtasks or initial activity description
  const getInitialItems = (): ActivityExplainerItem[] => {
    if (activity.explainerItems && activity.explainerItems.length > 0) {
      return activity.explainerItems;
    }
    // If activity has subtasks, seed from subtasks
    if (activity.subtasks && activity.subtasks.length > 0) {
      return activity.subtasks.map((st, idx) => ({
        id: `EXP-${st.id || idx + 1}`,
        subtaskId: st.id,
        title: st.title,
        discipline: st.category || activity.discipline || 'General',
        scopeDescription: st.notes || `Execution scope for subtask: ${st.title}`,
        methodSpecs: activity.methodStatement || 'Complete execution according to engineering specifications and approved site drawings.',
        status: (st.status === 'Completed' ? 'Completed' : st.status === 'In Progress' ? 'In Progress' : 'Not Started') as any,
        targetDate: st.dueDate || st.endDate || activity.finishDate
      }));
    }
    // Fallback single initial item if activity has description or methodStatement
    if (activity.description || activity.methodStatement) {
      return [
        {
          id: `EXP-1`,
          title: activity.name || 'Primary Subtask Scope & Method',
          discipline: activity.discipline || 'General',
          scopeDescription: activity.description || 'Primary scope of subtask work to be executed on site.',
          methodSpecs: activity.methodStatement || 'Complete execution according to engineering specifications and approved site drawings.',
          status: (activity.status === 'Completed' ? 'Completed' : activity.status === 'In Progress' ? 'In Progress' : 'Not Started') as any,
          targetDate: activity.finishDate
        }
      ];
    }
    return [];
  };

  const explainerItems = getInitialItems();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Form State for Add / Edit Subtask Explainer Item
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string>('');
  const [formTitle, setFormTitle] = useState('');
  const [formDiscipline, setFormDiscipline] = useState('Excavation & Earthworks');
  const [formScope, setFormScope] = useState('');
  const [formMethodSpecs, setFormMethodSpecs] = useState('');
  const [formStatus, setFormStatus] = useState<'Not Started' | 'In Progress' | 'Completed'>('Not Started');
  const [formTargetDate, setFormTargetDate] = useState(new Date().toISOString().split('T')[0]);

  const handleOpenAddForm = () => {
    setSelectedSubtaskId('');
    setFormTitle('');
    setFormDiscipline(activity.discipline || 'Excavation & Earthworks');
    setFormScope('');
    setFormMethodSpecs('Complete execution according to engineering specifications and approved site drawings.');
    setFormStatus('Not Started');
    setFormTargetDate(activity.finishDate || new Date().toISOString().split('T')[0]);
    setIsAddingItem(true);
    setEditingItemId(null);
  };

  const handleOpenEditForm = (item: ActivityExplainerItem) => {
    setSelectedSubtaskId(item.subtaskId || '');
    setFormTitle(item.title);
    setFormDiscipline(item.discipline || 'Civil');
    setFormScope(item.scopeDescription);
    setFormMethodSpecs(item.methodSpecs || '');
    setFormStatus(item.status);
    setFormTargetDate(item.targetDate || activity.finishDate || new Date().toISOString().split('T')[0]);
    setEditingItemId(item.id);
    setIsAddingItem(false);
  };

  const handleSelectSubtaskPreset = (subtaskId: string) => {
    setSelectedSubtaskId(subtaskId);
    if (!subtaskId) return;
    const matched = (activity.subtasks || []).find(s => s.id === subtaskId);
    if (matched) {
      setFormTitle(matched.title);
      setFormDiscipline(matched.category || 'General');
      if (matched.notes && !formScope) {
        setFormScope(matched.notes);
      }
      if (matched.dueDate || matched.endDate) {
        setFormTargetDate(matched.dueDate || matched.endDate || formTargetDate);
      }
      setFormStatus(matched.status === 'Completed' ? 'Completed' : matched.status === 'In Progress' ? 'In Progress' : 'Not Started');
    }
  };

  const handleSyncFromSubtasks = () => {
    if (!activity.subtasks || activity.subtasks.length === 0) return;
    const existingTitles = new Set(explainerItems.map(i => i.title.toLowerCase()));
    const newItems: ActivityExplainerItem[] = [];

    activity.subtasks.forEach((st, idx) => {
      if (!existingTitles.has(st.title.toLowerCase())) {
        newItems.push({
          id: `EXP-${st.id || Date.now() + idx}`,
          subtaskId: st.id,
          title: st.title,
          discipline: st.category || 'General',
          scopeDescription: st.notes || `Detailed execution scope for: ${st.title}`,
          methodSpecs: activity.methodStatement || 'Complete execution according to engineering specifications and approved site drawings.',
          status: (st.status === 'Completed' ? 'Completed' : st.status === 'In Progress' ? 'In Progress' : 'Not Started') as any,
          targetDate: st.dueDate || st.endDate || activity.finishDate
        });
      }
    });

    if (newItems.length > 0) {
      onUpdateActivity({
        ...activity,
        explainerItems: [...explainerItems, ...newItems]
      });
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    let updatedList: ActivityExplainerItem[] = [];

    if (editingItemId) {
      // Edit existing item
      updatedList = explainerItems.map(item => {
        if (item.id === editingItemId) {
          return {
            ...item,
            subtaskId: selectedSubtaskId || undefined,
            title: formTitle.trim(),
            discipline: formDiscipline,
            scopeDescription: formScope.trim(),
            methodSpecs: formMethodSpecs.trim(),
            status: formStatus,
            targetDate: formTargetDate,
          };
        }
        return item;
      });
    } else {
      // Add new item
      const newItem: ActivityExplainerItem = {
        id: `EXP-${Date.now()}`,
        subtaskId: selectedSubtaskId || undefined,
        title: formTitle.trim(),
        discipline: formDiscipline,
        scopeDescription: formScope.trim(),
        methodSpecs: formMethodSpecs.trim(),
        status: formStatus,
        targetDate: formTargetDate,
      };
      updatedList = [newItem, ...explainerItems];
    }

    onUpdateActivity({
      ...activity,
      explainerItems: updatedList,
    });

    setIsAddingItem(false);
    setEditingItemId(null);
  };

  const handleDeleteItem = (id: string) => {
    if (readOnly) return;
    const updatedList = explainerItems.filter(item => item.id !== id);
    onUpdateActivity({
      ...activity,
      explainerItems: updatedList,
    });
  };

  const handleToggleItemStatus = (id: string) => {
    if (readOnly) return;
    const nextStatusMap: Record<string, 'Not Started' | 'In Progress' | 'Completed'> = {
      'Not Started': 'In Progress',
      'In Progress': 'Completed',
      'Completed': 'Not Started'
    };

    const updatedList = explainerItems.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: nextStatusMap[item.status]
        };
      }
      return item;
    });

    onUpdateActivity({
      ...activity,
      explainerItems: updatedList,
    });
  };

  const getDisciplineColor = (disc?: string) => {
    switch (disc) {
      case 'Excavation & Earthworks':
      case 'Civil':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Cable & Underground Installation':
      case 'Electrical':
      case 'Electrical & MEP':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Structure & Foundations':
      case 'Structural':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Quality & Inspection':
      case 'Quality Assurance':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Site Establishment':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
      case 'Paving & Surfacing':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const completedCount = explainerItems.filter(i => i.status === 'Completed').length;
  const subtasksCount = (activity.subtasks || []).length;

  return (
    <div className="space-y-6 w-full mt-6">
      {/* HEADER CARD FOR SUBTASK EXPLAINER BREAKDOWN */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-3 sm:p-4 text-white">
          <div className="flex items-center justify-between gap-2.5">
            {/* Clickable Title Area */}
            <div 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 cursor-pointer group select-none"
              title={isCollapsed ? "Click to expand Subtask Explainers" : "Click to collapse Subtask Explainers"}
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 group-hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-blue-300 border border-white/20 shrink-0 transition-colors">
                <Layers className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-400/30 whitespace-nowrap flex items-center gap-1">
                    <BookOpen className="h-2.5 w-2.5" />
                    Subtask Explainer
                  </span>
                  <span className="text-[10px] text-slate-300 shrink-0">• {explainerItems.length}</span>
                </div>
                <h3 className="text-xs sm:text-sm md:text-base font-bold text-white leading-tight break-normal truncate group-hover:text-blue-200 transition-colors">
                  Subtask Execution ({completedCount}/{explainerItems.length} Done)
                </h3>
              </div>
            </div>

            {/* Action Buttons & Collapse Trigger */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {!readOnly && (
                <>
                  {subtasksCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCollapsed) setIsCollapsed(false);
                        handleSyncFromSubtasks();
                      }}
                      className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-all border border-white/15 shrink-0"
                      title="Sync and populate from Activity Subtasks"
                    >
                      <Sparkles className="h-3 w-3 text-amber-300 shrink-0" /> 
                      <span className="hidden xs:inline sm:inline">Sync</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isCollapsed) setIsCollapsed(false);
                      handleOpenAddForm();
                    }}
                    className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#0B5FFF] hover:bg-blue-600 active:scale-95 text-white text-[11px] font-bold transition-all shadow-sm shrink-0"
                    title="Add new Subtask Explainer"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" /> 
                    <span>Add</span>
                  </button>
                </>
              )}

              {/* Collapse / Expand Toggle */}
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-all border border-white/15 shrink-0"
                title={isCollapsed ? "Expand Subtask Explainers" : "Collapse Subtask Explainers"}
                aria-label={isCollapsed ? "Expand Subtask Explainers" : "Collapse Subtask Explainers"}
              >
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4 text-blue-200" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-slate-300" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* COLLAPSIBLE CARD CONTENT */}
        {!isCollapsed && (
          <CardContent className="p-3 sm:p-5 bg-white dark:bg-slate-900 space-y-3 sm:space-y-4 animate-in fade-in-50 duration-200">
            {/* ADD / EDIT SUBTASK EXPLAINER FORM */}
            {(isAddingItem || editingItemId) && (
              <div className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-[#0B5FFF]" />
                    {editingItemId ? 'Edit Explainer' : 'Add Explainer'}
                  </h4>
                  <button 
                    onClick={() => { setIsAddingItem(false); setEditingItemId(null); }} 
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <form onSubmit={handleSaveForm} className="space-y-3">
                  {/* Optional WBS Subtask Link Selector */}
                  {activity.subtasks && activity.subtasks.length > 0 && (
                    <div className="p-2 sm:p-2.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg space-y-1">
                      <label className="text-[10px] sm:text-[11px] font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1">
                        <LinkIcon className="h-3 w-3 text-[#0B5FFF]" />
                        Link to Activity Subtask (Autofill)
                      </label>
                      <select
                        value={selectedSubtaskId}
                        onChange={e => handleSelectSubtaskPreset(e.target.value)}
                        className="w-full h-7.5 px-2 text-xs rounded-md border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 font-medium text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-[#0B5FFF] outline-none"
                      >
                        <option value="">-- Choose Subtask to Autofill --</option>
                        {activity.subtasks.map(st => (
                          <option key={st.id} value={st.id}>
                            {st.title} ({st.category || 'General'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Subtask Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Trench Excavation, Cable Laying"
                        className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100"
                        value={formTitle}
                        onChange={e => setFormTitle(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                      <select
                        className="w-full h-8 px-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100"
                        value={formDiscipline}
                        onChange={e => setFormDiscipline(e.target.value)}
                      >
                        <option value="Site Establishment">Site Establishment</option>
                        <option value="Excavation & Earthworks">Excavation & Earthworks</option>
                        <option value="Cable & Underground Installation">Cable & Underground</option>
                        <option value="Structure & Foundations">Structure & Foundations</option>
                        <option value="Electrical & MEP">Electrical & MEP</option>
                        <option value="Paving & Surfacing">Paving & Surfacing</option>
                        <option value="Quality & Inspection">Quality & QA</option>
                        <option value="Civil">Civil</option>
                        <option value="General">General</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                      <select
                        className="w-full h-8 px-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100"
                        value={formStatus}
                        onChange={e => setFormStatus(e.target.value as any)}
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Target Date</label>
                      <input
                        type="date"
                        className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100"
                        value={formTargetDate}
                        onChange={e => setFormTargetDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Scope & Objectives *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Detail the scope of work and tasks..."
                      className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      value={formScope}
                      onChange={e => setFormScope(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Method & QA Specs</label>
                    <textarea
                      rows={2}
                      placeholder="Method statement, engineering specs & standards..."
                      className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      value={formMethodSpecs}
                      onChange={e => setFormMethodSpecs(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => { setIsAddingItem(false); setEditingItemId(null); }}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 text-xs font-semibold bg-[#0B5FFF] hover:bg-blue-600 text-white rounded-md flex items-center gap-1"
                    >
                      <Check className="h-3.5 w-3.5" /> Save
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* LIST OF ALL SUBTASK EXPLAINERS */}
            <div className="space-y-2.5 sm:space-y-3">
              {explainerItems.map((item, index) => (
                <div 
                  key={item.id}
                  className={`p-3 sm:p-4 rounded-xl border transition-all ${
                    item.status === 'Completed'
                      ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                      : item.status === 'In Progress'
                      ? 'bg-blue-50/30 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40'
                      : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80'
                  }`}
                >
                  {/* Subtask Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
                    <div className="flex items-start gap-2 min-w-0">
                      <button
                        onClick={() => handleToggleItemStatus(item.id)}
                        disabled={readOnly}
                        className={`shrink-0 transition-transform active:scale-95 mt-0.5 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                        title="Click to toggle status (Not Started → In Progress → Completed)"
                      >
                        {item.status === 'Completed' ? (
                          <div className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        ) : item.status === 'In Progress' ? (
                          <div className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full bg-[#0B5FFF] text-white flex items-center justify-center shadow-xs animate-pulse">
                            <PlayCircle className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <div className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            {index + 1}
                          </div>
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                          <span className="text-[9px] font-black font-mono text-slate-500 dark:text-slate-400">#{index + 1}</span>
                          {item.discipline && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap max-w-[140px] truncate ${getDisciplineColor(item.discipline)}`}>
                              {item.discipline}
                            </span>
                          )}
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold border whitespace-nowrap ${
                            item.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' :
                            item.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400' :
                            'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5 break-normal">
                          {item.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/60 shrink-0">
                      {item.targetDate && (
                        <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400 shrink-0" /> {item.targetDate}
                        </span>
                      )}

                      {!readOnly && (
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => handleOpenEditForm(item)}
                            className="p-1 text-slate-400 hover:text-[#0B5FFF] hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Subtask Explainer Body (Scope & Method Statement Grid) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    <div className="p-2 sm:p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <FileText className="h-3 w-3 text-[#0B5FFF] shrink-0" /> Scope & Deliverables
                      </span>
                      <p className="text-[11px] text-slate-700 dark:text-slate-200 leading-relaxed font-normal break-normal">
                        {item.scopeDescription}
                      </p>
                    </div>

                    <div className="p-2 sm:p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Wrench className="h-3 w-3 text-indigo-500 shrink-0" /> Method & Specifications
                      </span>
                      <p className="text-[11px] text-slate-700 dark:text-slate-200 leading-relaxed font-normal break-normal">
                        {item.methodSpecs || 'Execution according to engineering specifications and approved drawings.'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {explainerItems.length === 0 && (
                <div className="p-5 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/40">
                  <Layers className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5">No Explainers Listed</h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto mb-2.5">
                    Document method statements, specifications, and scope for each subtask.
                  </p>
                  {!readOnly && (
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {subtasksCount > 0 && (
                        <Button size="sm" onClick={handleSyncFromSubtasks} variant="outline" className="text-[11px] h-7 px-2.5 rounded-lg gap-1">
                          <Sparkles className="h-3 w-3 text-amber-500" /> Sync Subtasks
                        </Button>
                      )}
                      <Button size="sm" onClick={handleOpenAddForm} className="bg-[#0B5FFF] text-white text-[11px] h-7 px-2.5 rounded-lg gap-1">
                        <Plus className="h-3 w-3" /> Add Explainer
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
