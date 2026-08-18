import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Search, 
  BookmarkPlus, 
  Check, 
  Plus, 
  Trash2, 
  Layers, 
  ShieldCheck, 
  HardHat, 
  Truck, 
  FileCheck, 
  RotateCcw, 
  CheckCircle2, 
  ChevronRight, 
  ChevronDown,
  Info,
  Star,
  Flag,
  Lock,
  ListOrdered
} from 'lucide-react';
import { Button, Badge } from './ui';
import { SubTask, SubTaskCategory } from '../types';
import { ActivityTemplate } from '../data/activityTemplates';
import { 
  getWorkflowTemplates, 
  saveWorkflowTemplate, 
  deleteWorkflowTemplate 
} from '../lib/workflowTemplateService';
import { inferSubtaskMeasurementType } from '../lib/labourUtils';

export interface WorkflowTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (subtasks: SubTask[], mode: 'append' | 'replace') => void;
  currentSubtasks?: SubTask[];
  activityName?: string;
  defaultTab?: 'browse' | 'saveCurrent';
}

export function WorkflowTemplatesModal({
  isOpen,
  onClose,
  onApplyTemplate,
  currentSubtasks = [],
  activityName = '',
  defaultTab = 'browse'
}: WorkflowTemplatesModalProps) {
  const [templates, setTemplates] = useState<ActivityTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'custom' | 'standard' | 'saveCurrent'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisciplineFilter, setSelectedDisciplineFilter] = useState<string>('all');
  const [expandedTemplateIds, setExpandedTemplateIds] = useState<Record<string, boolean>>({});

  // Save current form state
  const [saveName, setSaveName] = useState('');
  const [saveDiscipline, setSaveDiscipline] = useState('Civil');
  const [saveCategory, setSaveCategory] = useState<SubTaskCategory>('Excavation & Earthworks');
  const [saveDescription, setSaveDescription] = useState('');
  const [selectedSubtaskIndexes, setSelectedSubtaskIndexes] = useState<Record<number, boolean>>({});

  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const loaded = getWorkflowTemplates();
      setTemplates(loaded);

      if (defaultTab === 'saveCurrent' && currentSubtasks.length > 0) {
        setActiveTab('saveCurrent');
      } else {
        setActiveTab('all');
      }

      setSaveName(activityName ? `${activityName} WBS Workflow` : 'Custom Subtask Progression Workflow');
      setSaveDescription(`Standard task progression breakdown for ${activityName || 'activity'}.`);

      const allSelected: Record<number, boolean> = {};
      currentSubtasks.forEach((_, idx) => {
        allSelected[idx] = true;
      });
      setSelectedSubtaskIndexes(allSelected);
      setFeedbackToast(null);
    }
  }, [isOpen, defaultTab, activityName, currentSubtasks]);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const customTemplates = useMemo(() => templates.filter(t => t.id.startsWith('wbs-tmpl-custom')), [templates]);
  const standardTemplates = useMemo(() => templates.filter(t => !t.id.startsWith('wbs-tmpl-custom')), [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const isCustom = t.id.startsWith('wbs-tmpl-custom');
      if (activeTab === 'custom' && !isCustom) return false;
      if (activeTab === 'standard' && isCustom) return false;

      if (selectedDisciplineFilter !== 'all' && !t.discipline.toLowerCase().includes(selectedDisciplineFilter.toLowerCase())) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = t.name.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        const matchesTasks = t.subtasks.some(st => st.title.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesTasks) return false;
      }

      return true;
    });
  }, [templates, activeTab, selectedDisciplineFilter, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedTemplateIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleApply = (template: ActivityTemplate, mode: 'append' | 'replace') => {
    const formattedSubtasks: SubTask[] = template.subtasks.map((st, idx) => ({
      ...st,
      id: `SUB-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 4)}-${idx}`,
      status: 'Not Started',
      completedQuantity: 0,
      measurementType: inferSubtaskMeasurementType(st as SubTask)
    }));

    onApplyTemplate(formattedSubtasks, mode);
    onClose();
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this custom WBS template?')) {
      deleteWorkflowTemplate(id);
      setTemplates(getWorkflowTemplates());
      showToast('Custom WBS template deleted.', 'info');
    }
  };

  const handleSaveCurrentAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName.trim()) return;

    const subtasksToSave = currentSubtasks
      .filter((_, idx) => selectedSubtaskIndexes[idx])
      .map(st => {
        const { id, completedQuantity, assignedWorkers, assignedEquipmentList, ...rest } = st;
        return {
          ...rest,
          status: 'Not Started' as const
        };
      });

    if (subtasksToSave.length === 0) {
      alert('Please select at least one subtask to include in the template.');
      return;
    }

    const saved = saveWorkflowTemplate({
      name: saveName.trim(),
      discipline: saveDiscipline.trim() || 'General',
      category: saveCategory,
      description: saveDescription.trim(),
      subtasks: subtasksToSave
    });

    setTemplates(getWorkflowTemplates());
    showToast(`WBS Template "${saved.name}" saved to library!`);
    setActiveTab('custom');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-[#0B5FFF] flex items-center justify-center shrink-0 shadow-2xs">
              <Layers className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                Subtask WBS Workflow Templates
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Choose standardized subtask progressions or save your custom activity workflows
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackToast && (
          <div className={`px-5 py-2.5 flex items-center justify-between text-xs font-bold ${
            feedbackToast.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-b border-emerald-200' 
              : 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-b border-blue-200'
          }`}>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {feedbackToast.message}
            </span>
            <button type="button" onClick={() => setFeedbackToast(null)} className="hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'all'
                  ? 'bg-[#0B5FFF] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span>All Workflows</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/60 dark:bg-slate-700">
                {templates.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'custom'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800/60'
              }`}
            >
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span>My Saved Workflows</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 dark:bg-amber-800">
                {customTemplates.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('standard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'standard'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800/60'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Standard Civil/Electrical</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-200 dark:bg-indigo-800">
                {standardTemplates.length}
              </span>
            </button>
          </div>

          {currentSubtasks.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('saveCurrent')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                activeTab === 'saveCurrent'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              <BookmarkPlus className="h-3.5 w-3.5" />
              <span>Save Current Subtasks as Template</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">

          {/* 1. SAVE CURRENT SUBTASKS AS TEMPLATE */}
          {activeTab === 'saveCurrent' && (
            <form onSubmit={handleSaveCurrentAsTemplate} className="space-y-4 max-w-2xl mx-auto p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 animate-in fade-in">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <BookmarkPlus className="h-5 w-5 text-emerald-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Save Current Activity Subtasks as Reusable Workflow
                  </h4>
                  <p className="text-xs text-slate-500">
                    Save these {currentSubtasks.length} subtasks (with their targets, measurement types, milestones, and QA hold points) into a template.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Workflow Template Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={saveName}
                    onChange={e => setSaveName(e.target.value)}
                    placeholder="e.g. Trench Excavation & Cable Laying Workflow"
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Discipline
                  </label>
                  <input
                    type="text"
                    value={saveDiscipline}
                    onChange={e => setSaveDiscipline(e.target.value)}
                    placeholder="e.g. Civil, Electrical, Structural"
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={saveDescription}
                    onChange={e => setSaveDescription(e.target.value)}
                    placeholder="Short description of this workflow"
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Subtasks Selection List */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Included Subtasks ({Object.values(selectedSubtaskIndexes).filter(Boolean).length} of {currentSubtasks.length} selected):</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const all: Record<number, boolean> = {};
                        currentSubtasks.forEach((_, idx) => { all[idx] = true; });
                        setSelectedSubtaskIndexes(all);
                      }}
                      className="text-[#0B5FFF] hover:underline text-[11px]"
                    >
                      Select All
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedSubtaskIndexes({})}
                      className="text-slate-400 hover:underline text-[11px]"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1.5 p-2 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  {currentSubtasks.map((st, idx) => (
                    <label 
                      key={st.id || idx}
                      className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                        selectedSubtaskIndexes[idx]
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-slate-800 dark:text-slate-200'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 line-through'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!selectedSubtaskIndexes[idx]}
                        onChange={e => setSelectedSubtaskIndexes(prev => ({ ...prev, [idx]: e.target.checked }))}
                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold">{st.title}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span>{st.category}</span>
                          {st.targetQuantity ? <span>• {st.targetQuantity} {st.unit}</span> : null}
                          {st.isHoldPoint && <span className="text-rose-500 font-bold">• QA Gate</span>}
                          {st.isMilestone && <span className="text-purple-500 font-bold">• Milestone</span>}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('all')}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  <BookmarkPlus className="h-4 w-4" /> Save WBS Template
                </Button>
              </div>
            </form>
          )}

          {/* 2. BROWSE TEMPLATES VIEW */}
          {(activeTab === 'all' || activeTab === 'custom' || activeTab === 'standard') && (
            <>
              {/* Search & Discipline Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search workflows by title, task names, or discipline..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs shrink-0">
                  {['all', 'Civil', 'Electrical', 'Structural', 'General'].map(disc => (
                    <button
                      key={disc}
                      type="button"
                      onClick={() => setSelectedDisciplineFilter(disc)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                        selectedDisciplineFilter === disc
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {disc === 'all' ? 'All Disciplines' : disc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Workflow Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredTemplates.map(template => {
                  const isCustom = template.id.startsWith('wbs-tmpl-custom');
                  const isExpanded = !!expandedTemplateIds[template.id];

                  return (
                    <div
                      key={template.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between gap-3 shadow-xs"
                    >
                      <div>
                        {/* Header & Badges */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-[#0B5FFF] border border-blue-200">
                              {template.discipline}
                            </span>
                            {isCustom ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                <Star className="h-2.5 w-2.5 fill-amber-500" /> Custom
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                Standard
                              </span>
                            )}
                          </div>

                          {isCustom && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteTemplate(template.id, e)}
                              className="text-slate-400 hover:text-rose-500 p-1"
                              title="Delete custom template"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                          {template.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {template.description}
                        </p>

                        {/* Expandable subtasks preview */}
                        <div className="mt-2.5">
                          <button
                            type="button"
                            onClick={() => toggleExpand(template.id)}
                            className="text-[11px] font-bold text-[#0B5FFF] hover:underline flex items-center gap-1"
                          >
                            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            <span>{isExpanded ? 'Hide' : 'Preview'} {template.subtasks.length} Subtasks</span>
                          </button>

                          {isExpanded && (
                            <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 max-h-48 overflow-y-auto animate-in fade-in">
                              {template.subtasks.map((st, i) => (
                                <div key={i} className="flex items-center justify-between gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="font-mono text-slate-400 shrink-0">{i + 1}.0</span>
                                    <span className="truncate">{st.title}</span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0 text-[10px]">
                                    {st.targetQuantity ? <span className="font-mono text-slate-500">{st.targetQuantity} {st.unit}</span> : null}
                                    {st.isMilestone && <span className="text-purple-600 font-bold">🏁 Milestone</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Apply Actions */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold font-mono text-slate-400">
                          {template.subtasks.length} subtasks
                        </span>

                        <div className="flex items-center gap-1.5">
                          {currentSubtasks.length > 0 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleApply(template, 'replace')}
                              className="h-7 text-[11px] font-bold rounded-lg text-slate-600 hover:text-slate-900 border-slate-200"
                              title="Replace activity subtasks with this workflow"
                            >
                              Replace
                            </Button>
                          )}

                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleApply(template, 'append')}
                            className="h-7 text-[11px] font-bold rounded-lg bg-[#0B5FFF] hover:bg-blue-600 text-white gap-1 shadow-2xs"
                            title="Add subtasks to this activity"
                          >
                            <Plus className="h-3 w-3" />
                            <span>{currentSubtasks.length > 0 ? 'Append (+)' : 'Apply Workflow'}</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>WBS Workflow templates are stored persistently and available across all project activities.</span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs font-bold"
          >
            Close
          </Button>
        </div>

      </div>
    </div>
  );
}
