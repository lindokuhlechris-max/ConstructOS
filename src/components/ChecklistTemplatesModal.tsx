import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Search, 
  BookmarkPlus, 
  Check, 
  Plus, 
  Trash2, 
  Edit2, 
  Layers, 
  ShieldCheck, 
  HardHat, 
  Compass, 
  Truck, 
  FileCheck, 
  Zap, 
  FolderPlus, 
  RotateCcw, 
  CheckCircle2, 
  ChevronRight, 
  ChevronDown,
  Info,
  Star,
  Download,
  Upload
} from 'lucide-react';
import { Button, Badge } from './ui';
import { ActivityChecklistItem, ChecklistTemplate } from '../types';
import { 
  getChecklistTemplates, 
  saveChecklistTemplate, 
  deleteChecklistTemplate, 
  resetDefaultChecklistTemplates 
} from '../lib/checklistTemplateService';
import { useAppContext } from '../context/AppContext';

export interface ChecklistTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (items: ActivityChecklistItem[], mode: 'append' | 'replace') => void;
  currentChecklists?: ActivityChecklistItem[];
  activityName?: string;
  defaultTab?: 'browse' | 'saveCurrent';
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  'Permit & Safety': { 
    bg: 'bg-red-50 dark:bg-red-950/40', 
    text: 'text-red-700 dark:text-red-300', 
    border: 'border-red-200 dark:border-red-800',
    icon: HardHat
  },
  'Survey & Location': { 
    bg: 'bg-sky-50 dark:bg-sky-950/40', 
    text: 'text-sky-700 dark:text-sky-300', 
    border: 'border-sky-200 dark:border-sky-800',
    icon: Compass
  },
  'Materials & Plant': { 
    bg: 'bg-amber-50 dark:bg-amber-950/40', 
    text: 'text-amber-700 dark:text-amber-300', 
    border: 'border-amber-200 dark:border-amber-800',
    icon: Truck
  },
  'QA & Method Statement': { 
    bg: 'bg-purple-50 dark:bg-purple-950/40', 
    text: 'text-purple-700 dark:text-purple-300', 
    border: 'border-purple-200 dark:border-purple-800',
    icon: ShieldCheck
  },
  'General': { 
    bg: 'bg-slate-50 dark:bg-slate-800/60', 
    text: 'text-slate-700 dark:text-slate-300', 
    border: 'border-slate-200 dark:border-slate-700',
    icon: FileCheck
  }
};

export function ChecklistTemplatesModal({
  isOpen,
  onClose,
  onApplyTemplate,
  currentChecklists = [],
  activityName = '',
  defaultTab = 'browse'
}: ChecklistTemplatesModalProps) {
  const { currentUserProfile } = useAppContext();
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'custom' | 'standard' | 'saveCurrent' | 'createNew'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [expandedTemplateIds, setExpandedTemplateIds] = useState<Record<string, boolean>>({});

  // Form state for saving current checklist as template
  const [saveTitle, setSaveTitle] = useState('');
  const [saveCategory, setSaveCategory] = useState<ChecklistTemplate['category']>('Permit & Safety');
  const [saveDiscipline, setSaveDiscipline] = useState('Civil / General');
  const [saveDescription, setSaveDescription] = useState('');
  const [selectedItemIndexes, setSelectedItemIndexes] = useState<Record<number, boolean>>({});

  // Form state for creating custom template from scratch
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ChecklistTemplate['category']>('Permit & Safety');
  const [newDiscipline, setNewDiscipline] = useState('General');
  const [newDescription, setNewDescription] = useState('');
  const [newItemsList, setNewItemsList] = useState<string[]>(['']);
  
  // Feedback banner state
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Load templates on open
  useEffect(() => {
    if (isOpen) {
      const loaded = getChecklistTemplates();
      setTemplates(loaded);

      // Pre-fill save current form if requested
      if (defaultTab === 'saveCurrent' && currentChecklists.length > 0) {
        setActiveTab('saveCurrent');
      } else {
        setActiveTab('all');
      }

      setSaveTitle(activityName ? `${activityName} Prerequisites Checklist` : 'Custom Prerequisites Checklist');
      setSaveDescription(`Standard pre-start verification checklist for ${activityName || 'activity'}.`);
      
      const allSelected: Record<number, boolean> = {};
      currentChecklists.forEach((_, idx) => {
        allSelected[idx] = true;
      });
      setSelectedItemIndexes(allSelected);
      setFeedbackToast(null);
    }
  }, [isOpen, defaultTab, activityName, currentChecklists]);

  // Flash feedback toast helper
  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4000);
  };

  // Filter templates
  const customCount = useMemo(() => templates.filter(t => t.isCustom).length, [templates]);
  const standardCount = useMemo(() => templates.filter(t => !t.isCustom).length, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      // Tab filter
      if (activeTab === 'custom' && !t.isCustom) return false;
      if (activeTab === 'standard' && t.isCustom) return false;

      // Category filter
      if (selectedCategoryFilter !== 'all' && t.category !== selectedCategoryFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDiscipline = t.discipline?.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        const matchesItems = t.items.some(item => item.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDiscipline && !matchesDesc && !matchesItems) {
          return false;
        }
      }

      return true;
    });
  }, [templates, activeTab, selectedCategoryFilter, searchQuery]);

  // Toggle item expansion
  const toggleExpand = (id: string) => {
    setExpandedTemplateIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Apply template handler
  const handleApply = (template: ChecklistTemplate, mode: 'append' | 'replace') => {
    const formattedItems: ActivityChecklistItem[] = template.items.map(text => ({
      id: `CHK-${Date.now().toString().slice(-5)}-${Math.random().toString(36).substr(2, 4)}`,
      text,
      category: template.category,
      completed: false
    }));

    onApplyTemplate(formattedItems, mode);
    onClose();
  };

  // Delete custom template
  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this custom template?')) {
      deleteChecklistTemplate(id);
      const updated = getChecklistTemplates();
      setTemplates(updated);
      showToast('Custom template deleted successfully.', 'info');
    }
  };

  // Save current checklist as template
  const handleSaveCurrentAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTitle.trim()) return;

    const itemsToSave = currentChecklists
      .filter((_, idx) => selectedItemIndexes[idx])
      .map(item => item.text);

    if (itemsToSave.length === 0) {
      alert('Please select at least one checklist item to include in the template.');
      return;
    }

    const saved = saveChecklistTemplate({
      title: saveTitle.trim(),
      category: saveCategory,
      discipline: saveDiscipline.trim() || 'General',
      description: saveDescription.trim(),
      items: itemsToSave,
      authorName: currentUserProfile?.name || 'Site User'
    });

    const updated = getChecklistTemplates();
    setTemplates(updated);
    showToast(`Template "${saved.title}" saved to library!`);
    setActiveTab('custom');
  };

  // Create new template from scratch
  const handleCreateNewTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const validItems = newItemsList.map(s => s.trim()).filter(Boolean);
    if (validItems.length === 0) {
      alert('Please add at least one prerequisite requirement item.');
      return;
    }

    const saved = saveChecklistTemplate({
      title: newTitle.trim(),
      category: newCategory,
      discipline: newDiscipline.trim() || 'General',
      description: newDescription.trim(),
      items: validItems,
      authorName: currentUserProfile?.name || 'Site User'
    });

    const updated = getChecklistTemplates();
    setTemplates(updated);
    showToast(`New template "${saved.title}" created successfully!`);
    setNewTitle('');
    setNewDescription('');
    setNewItemsList(['']);
    setActiveTab('custom');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                Prerequisites & Checklist Template Library
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Apply pre-built standard bundles or save your custom verification templates across activities
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
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-b border-emerald-200 dark:border-emerald-800' 
              : 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-b border-blue-200 dark:border-blue-800'
          }`}>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {feedbackToast.message}
            </span>
            <button 
              type="button" 
              onClick={() => setFeedbackToast(null)}
              className="text-emerald-700 dark:text-emerald-300 hover:underline"
            >
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
              <span>All Templates</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
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
              <span>My Saved Templates</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'custom' ? 'bg-white/20 text-white' : 'bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-200'}`}>
                {customCount}
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
              <span>Standard Bundles</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'standard' ? 'bg-white/20 text-white' : 'bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-200'}`}>
                {standardCount}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {currentChecklists.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('saveCurrent')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'saveCurrent'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
                }`}
                title="Save current activity prerequisites as a reusable template"
              >
                <BookmarkPlus className="h-3.5 w-3.5" />
                <span>Save Current as Template</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('createNew')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'createNew'
                  ? 'bg-[#0B5FFF] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Create Template</span>
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">

          {/* 1. SAVE CURRENT CHECKLIST VIEW */}
          {activeTab === 'saveCurrent' && (
            <form onSubmit={handleSaveCurrentAsTemplate} className="space-y-4 max-w-2xl mx-auto p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 animate-in fade-in">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <BookmarkPlus className="h-5 w-5 text-emerald-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Save Current Activity Checklist as Reusable Template
                  </h4>
                  <p className="text-xs text-slate-500">
                    Save these {currentChecklists.length} items to your company template library so you can apply them instantly to other activities.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={saveTitle}
                    onChange={e => setSaveTitle(e.target.value)}
                    placeholder="e.g. Trenching Pre-Start Safety & Quality Checklist"
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Category *
                  </label>
                  <select
                    value={saveCategory}
                    onChange={e => setSaveCategory(e.target.value as any)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
                  >
                    <option value="Permit & Safety">Permit & Safety</option>
                    <option value="Survey & Location">Survey & Location</option>
                    <option value="Materials & Plant">Materials & Plant</option>
                    <option value="QA & Method Statement">QA & Method Statement</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Discipline / Scope
                  </label>
                  <input
                    type="text"
                    value={saveDiscipline}
                    onChange={e => setSaveDiscipline(e.target.value)}
                    placeholder="e.g. Civil / Earthworks, Electrical, General"
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={saveDescription}
                    onChange={e => setSaveDescription(e.target.value)}
                    placeholder="Short description of when to use this template"
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Items Selection List */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Included Items ({Object.values(selectedItemIndexes).filter(Boolean).length} of {currentChecklists.length} selected):</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const all: Record<number, boolean> = {};
                        currentChecklists.forEach((_, idx) => { all[idx] = true; });
                        setSelectedItemIndexes(all);
                      }}
                      className="text-[#0B5FFF] hover:underline text-[11px]"
                    >
                      Select All
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedItemIndexes({})}
                      className="text-slate-400 hover:underline text-[11px]"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1.5 p-2 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  {currentChecklists.map((item, idx) => (
                    <label 
                      key={item.id || idx}
                      className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                        selectedItemIndexes[idx]
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-slate-800 dark:text-slate-200'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 line-through'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!selectedItemIndexes[idx]}
                        onChange={e => setSelectedItemIndexes(prev => ({ ...prev, [idx]: e.target.checked }))}
                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 shrink-0"
                      />
                      <span className="font-medium">{item.text}</span>
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
                  <BookmarkPlus className="h-4 w-4" /> Save to Template Library
                </Button>
              </div>
            </form>
          )}

          {/* 2. CREATE NEW TEMPLATE VIEW */}
          {activeTab === 'createNew' && (
            <form onSubmit={handleCreateNewTemplate} className="space-y-4 max-w-2xl mx-auto p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 animate-in fade-in">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <FolderPlus className="h-5 w-5 text-[#0B5FFF]" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Create New Prerequisites Template
                  </h4>
                  <p className="text-xs text-slate-500">
                    Build a custom template from scratch and save it for all activities.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Electrical Substations Pre-Commissioning Checklist"
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#0B5FFF]"
                  >
                    <option value="Permit & Safety">Permit & Safety</option>
                    <option value="Survey & Location">Survey & Location</option>
                    <option value="Materials & Plant">Materials & Plant</option>
                    <option value="QA & Method Statement">QA & Method Statement</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Discipline
                  </label>
                  <input
                    type="text"
                    value={newDiscipline}
                    onChange={e => setNewDiscipline(e.target.value)}
                    placeholder="e.g. Electrical, Civil, Structural"
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    placeholder="Short description of this template"
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
                  />
                </div>
              </div>

              {/* Dynamic Items Builder */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Prerequisite Items ({newItemsList.filter(s => s.trim()).length}):</span>
                  <button
                    type="button"
                    onClick={() => setNewItemsList([...newItemsList, ''])}
                    className="text-[#0B5FFF] hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <Plus className="h-3 w-3" /> Add Item
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {newItemsList.map((itemStr, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-slate-400 w-5 text-right">{idx + 1}.</span>
                      <input
                        type="text"
                        required={idx === 0}
                        placeholder={`Prerequisite requirement #${idx + 1}...`}
                        value={itemStr}
                        onChange={e => {
                          const updated = [...newItemsList];
                          updated[idx] = e.target.value;
                          setNewItemsList(updated);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            setNewItemsList([...newItemsList, '']);
                          }
                        }}
                        className="flex-1 h-8 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
                      />
                      {newItemsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNewItemsList(newItemsList.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded-lg"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
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
                  className="rounded-xl text-xs font-bold bg-[#0B5FFF] text-white gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Create & Save Template
                </Button>
              </div>
            </form>
          )}

          {/* 3. BROWSE TEMPLATES VIEW */}
          {(activeTab === 'all' || activeTab === 'custom' || activeTab === 'standard') && (
            <>
              {/* Search & Category Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search templates by title, requirements, or discipline..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs shrink-0">
                  {['all', 'Permit & Safety', 'Survey & Location', 'Materials & Plant', 'QA & Method Statement'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                        selectedCategoryFilter === cat
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {cat === 'all' ? 'All Categories' : cat.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Cards Grid */}
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                  <Sparkles className="h-8 w-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    No matching templates found
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {searchQuery ? 'Try adjusting your search terms or category filters.' : 'Save your first custom template from an activity or create one from scratch.'}
                  </p>
                  {activeTab === 'custom' && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setActiveTab('createNew')}
                      className="mt-2 text-xs font-bold rounded-xl bg-amber-600 text-white gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Create Custom Template
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredTemplates.map(template => {
                    const style = CATEGORY_STYLES[template.category] || CATEGORY_STYLES['General'];
                    const IconComp = style.icon;
                    const isExpanded = !!expandedTemplateIds[template.id];

                    return (
                      <div
                        key={template.id}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/80 transition-all flex flex-col justify-between gap-3 shadow-xs"
                      >
                        <div>
                          {/* Card Header & Badges */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${style.bg} ${style.text} ${style.border}`}>
                                <IconComp className="h-3 w-3" />
                                <span>{template.category}</span>
                              </span>

                              {template.discipline && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  {template.discipline}
                                </span>
                              )}

                              {template.isCustom ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 flex items-center gap-1">
                                  <Star className="h-2.5 w-2.5 fill-amber-500" /> Custom
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200">
                                  Standard
                                </span>
                              )}
                            </div>

                            {template.isCustom && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteTemplate(template.id, e)}
                                className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="Delete custom template"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Title & Description */}
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                            {template.title}
                          </h4>
                          {template.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                              {template.description}
                            </p>
                          )}

                          {/* Items Preview Toggle */}
                          <div className="mt-2.5">
                            <button
                              type="button"
                              onClick={() => toggleExpand(template.id)}
                              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                            >
                              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                              <span>{isExpanded ? 'Hide' : 'Preview'} {template.items.length} Prerequisite Requirements</span>
                            </button>

                            {isExpanded && (
                              <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5 max-h-48 overflow-y-auto animate-in fade-in">
                                {template.items.map((it, i) => (
                                  <div key={i} className="flex items-start gap-2 text-[11px] text-slate-700 dark:text-slate-300 leading-tight">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>{it}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Apply Actions */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold font-mono text-slate-400">
                            {template.items.length} items
                          </span>

                          <div className="flex items-center gap-1.5">
                            {currentChecklists.length > 0 && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleApply(template, 'replace')}
                                className="h-7 text-[11px] font-bold rounded-lg text-slate-600 hover:text-slate-900 border-slate-200"
                                title="Replace current activity checklist with this template"
                              >
                                Replace
                              </Button>
                            )}

                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleApply(template, 'append')}
                              className="h-7 text-[11px] font-bold rounded-lg bg-[#0B5FFF] hover:bg-blue-600 text-white gap-1 shadow-2xs"
                              title="Add template items to this activity"
                            >
                              <Plus className="h-3 w-3" />
                              <span>{currentChecklists.length > 0 ? 'Append (+)' : 'Apply Template'}</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Saved templates are stored in persistent memory and available across all project activities.</span>
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
