import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Sparkles, 
  Trash2, 
  Edit, 
  X, 
  Check, 
  ShieldCheck, 
  AlertTriangle, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  FileCheck, 
  Compass, 
  Truck, 
  Layers, 
  HardHat, 
  Zap, 
  Clock, 
  UserCheck, 
  CheckCircle2,
  ListChecks,
  BookmarkPlus,
  Tag,
  FolderPlus
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from './ui';
import { Activity, ActivityChecklistItem } from '../types';
import { useAppContext } from '../context/AppContext';
import { ChecklistTemplatesModal } from './ChecklistTemplatesModal';
import { 
  PrerequisiteCategoryModal, 
  getCategoryMetadata, 
  PREREQUISITE_CATEGORIES 
} from './PrerequisiteCategoryModal';

export interface ActivityChecklistPanelProps {
  activity: Activity;
  onUpdateChecklists: (updatedChecklists: ActivityChecklistItem[]) => void;
  readOnly?: boolean;
}

export function ActivityChecklistPanel({ activity, onUpdateChecklists, readOnly = false }: ActivityChecklistPanelProps) {
  const { currentUserProfile } = useAppContext();
  const checklists = useMemo(() => activity.checklists || [], [activity.checklists]);

  const [isAddingInline, setIsAddingInline] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<string>('Permit & Safety');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryItemId, setEditingCategoryItemId] = useState<string | null>(null);

  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [modalDefaultTab, setModalDefaultTab] = useState<'browse' | 'saveCurrent'>('browse');

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemText, setEditingItemText] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const totalCount = checklists.length;
  const completedCount = checklists.filter(c => c.completed).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllCompleted = totalCount > 0 && completedCount === totalCount;

  // Toggle single checklist item
  const handleToggleItem = (itemId: string) => {
    if (readOnly) return;
    const nowIso = new Date().toISOString();
    const verifierName = currentUserProfile?.name || 'Site Supervisor';

    const updated = checklists.map(item => {
      if (item.id === itemId) {
        const nextCompleted = !item.completed;
        return {
          ...item,
          completed: nextCompleted,
          completedAt: nextCompleted ? nowIso : undefined,
          completedBy: nextCompleted ? verifierName : undefined
        };
      }
      return item;
    });

    onUpdateChecklists(updated);
  };

  // Add custom single item
  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemText.trim()) return;

    const newItem: ActivityChecklistItem = {
      id: `CHK-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 3)}`,
      text: newItemText.trim(),
      category: newItemCategory,
      completed: false
    };

    onUpdateChecklists([...checklists, newItem]);
    setNewItemText('');
    setIsAddingInline(false);
  };

  // Category Selected from Pop-up Modal
  const handleSelectCategory = (catName: string) => {
    if (editingCategoryItemId) {
      const updated = checklists.map(c => 
        c.id === editingCategoryItemId ? { ...c, category: catName } : c
      );
      onUpdateChecklists(updated);
      setEditingCategoryItemId(null);
    } else {
      setNewItemCategory(catName);
    }
  };

  // Apply template items from modal
  const handleApplyTemplate = (items: ActivityChecklistItem[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      onUpdateChecklists(items);
    } else {
      onUpdateChecklists([...checklists, ...items]);
    }
  };

  // Open modal in browse mode
  const openBrowseTemplates = () => {
    setModalDefaultTab('browse');
    setIsTemplatesModalOpen(true);
  };

  // Open modal in save current mode
  const openSaveCurrentTemplate = () => {
    setModalDefaultTab('saveCurrent');
    setIsTemplatesModalOpen(true);
  };

  // Delete single item
  const handleDeleteItem = (itemId: string) => {
    if (readOnly) return;
    onUpdateChecklists(checklists.filter(c => c.id !== itemId));
  };

  // Save edited text
  const handleSaveEdit = (itemId: string) => {
    if (!editingItemText.trim()) return;
    const updated = checklists.map(c => 
      c.id === itemId ? { ...c, text: editingItemText.trim() } : c
    );
    onUpdateChecklists(updated);
    setEditingItemId(null);
    setEditingItemText('');
  };

  // Mark all completed / reset all
  const handleCheckAll = (complete: boolean) => {
    if (readOnly) return;
    const nowIso = new Date().toISOString();
    const verifierName = currentUserProfile?.name || 'Site Supervisor';

    const updated = checklists.map(c => ({
      ...c,
      completed: complete,
      completedAt: complete ? nowIso : undefined,
      completedBy: complete ? verifierName : undefined
    }));
    onUpdateChecklists(updated);
  };

  // Unique categories in current checklist for dynamic filter bar
  const availableFilterCategories = useMemo(() => {
    const set = new Set<string>();
    checklists.forEach(c => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [checklists]);

  // Filtered items
  const filteredChecklists = useMemo(() => {
    if (filterCategory === 'all') return checklists;
    return checklists.filter(c => c.category === filterCategory);
  }, [checklists, filterCategory]);

  const newCatMeta = getCategoryMetadata(newItemCategory);
  const NewCatIcon = newCatMeta.icon;

  const currentModalCategory = editingCategoryItemId 
    ? (checklists.find(c => c.id === editingCategoryItemId)?.category || 'Permit & Safety')
    : newItemCategory;

  return (
    <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Category Picker Pop-up Modal */}
      <PrerequisiteCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategoryItemId(null);
        }}
        selectedCategory={currentModalCategory}
        onSelectCategory={handleSelectCategory}
      />

      {/* Template Management Modal */}
      <ChecklistTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onApplyTemplate={handleApplyTemplate}
        currentChecklists={checklists}
        activityName={activity.name}
        defaultTab={modalDefaultTab}
      />

      {/* 1. Header with Badge & Actions (Responsive Layout) */}
      <CardHeader className="py-3 sm:py-4 px-3 sm:px-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60">
        <div className="flex items-center justify-between gap-2.5">
          {/* Left Title & Counter Badge */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#0B5FFF] shrink-0">
              <ListChecks className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CardTitle className="text-xs sm:text-sm font-bold uppercase text-slate-800 dark:text-slate-200 tracking-wider truncate">
                  Prerequisites & Progression Checklist
                </CardTitle>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/40 text-[#0B5FFF] border border-blue-200 dark:border-blue-900/60 shrink-0">
                  {completedCount}/{totalCount}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate hidden sm:block">
                Mandatory pre-start permits, survey checks, and execution prerequisites
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          {!readOnly && (
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openBrowseTemplates}
                className="h-8 w-8 p-0 flex items-center justify-center rounded-xl border-indigo-200 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 bg-indigo-50/40 dark:bg-indigo-950/30 hover:bg-indigo-100"
                title="Browse standard and custom saved checklist templates"
              >
                <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
              </Button>

              {checklists.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openSaveCurrentTemplate}
                  className="h-8 w-8 p-0 flex items-center justify-center rounded-xl border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/30 hover:bg-emerald-100"
                  title="Save current checklist items as a reusable template"
                >
                  <BookmarkPlus className="h-4 w-4 text-emerald-600 shrink-0" />
                </Button>
              )}

              <Button
                type="button"
                size="sm"
                onClick={() => setIsAddingInline(!isAddingInline)}
                className="h-8 w-8 p-0 flex items-center justify-center rounded-xl bg-[#0B5FFF] hover:bg-blue-600 text-white shadow-2xs shrink-0"
                title="Add Item"
              >
                <Plus className="h-4 w-4 shrink-0" />
              </Button>
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 ml-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title={isCollapsed ? "Expand panel" : "Collapse panel"}
              >
                {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>
            </div>
          )}
        </div>

        {/* 2. Progress Bar & Readiness Strip */}
        {totalCount > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold">
                {isAllCompleted ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> All Prerequisites Met — Cleared for Work
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> {totalCount - completedCount} Pending Prerequisites
                  </span>
                )}
              </div>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                {progressPercent}%
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  isAllCompleted ? 'bg-emerald-500' : 'bg-[#0B5FFF]'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* 2. Inline Add Item Form with Clean Category Pop-up Button */}
        {isAddingInline && !readOnly && (
          <form onSubmit={handleAddItem} className="p-3.5 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/60 space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0B5FFF]">Add New Prerequisite Requirement</span>
              <button
                type="button"
                onClick={() => setIsAddingInline(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. Underground cable scan completed & permit signed..."
                  value={newItemText}
                  onChange={e => setNewItemText(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
                />
              </div>

              {/* Clean Category Pop-up Button Trigger */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategoryItemId(null);
                    setIsCategoryModalOpen(true);
                  }}
                  className={`w-full h-9 px-2.5 rounded-xl border flex items-center justify-between gap-1.5 text-xs font-bold transition-all ${newCatMeta.bg} ${newCatMeta.text} ${newCatMeta.border} shadow-2xs hover:opacity-90`}
                  title="Click to select from 15+ construction, HSE & operational categories or add custom"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <NewCatIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{newItemCategory}</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-1.5 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingInline(false)}
                className="h-7 text-xs rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-7 text-xs font-bold rounded-lg bg-[#0B5FFF] text-white px-3"
              >
                Add Requirement
              </Button>
            </div>
          </form>
        )}

        {/* 3. Dynamic Category Filter Pills */}
        {totalCount > 3 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Filter:</span>
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                filterCategory === 'all'
                  ? 'bg-[#0B5FFF] text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All ({checklists.length})
            </button>

            {availableFilterCategories.map(cat => {
              const meta = getCategoryMetadata(cat);
              const IconComp = meta.icon;
              const isSelected = filterCategory === cat;
              const countInCat = checklists.filter(c => c.category === cat).length;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                    isSelected
                      ? 'bg-[#0B5FFF] text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <IconComp className="h-3 w-3" />
                  <span>{cat}</span>
                  <span className="opacity-70 font-normal">({countInCat})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 4. Checklist Items List */}
        {checklists.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#0B5FFF] flex items-center justify-center mx-auto">
              <CheckSquare className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No Work Prerequisites Configured
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Add mandatory pre-start permits, surveyor validations, or machinery safety checklists before starting work.
            </p>
            {!readOnly && (
              <div className="pt-2 flex items-center justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={openBrowseTemplates}
                  className="h-7 text-xs rounded-xl gap-1 border-indigo-200 text-indigo-700 dark:text-indigo-300"
                >
                  <Sparkles className="h-3 w-3" /> Use Template
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsAddingInline(true)}
                  className="h-7 text-xs font-bold rounded-xl gap-1 bg-[#0B5FFF] text-white"
                >
                  <Plus className="h-3 w-3" /> Add Custom
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-[550px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {filteredChecklists.map((item) => {
              const categoryKey = item.category || 'General';
              const style = getCategoryMetadata(categoryKey);
              const IconComp = style.icon;
              const isEditingThis = editingItemId === item.id;

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border transition-all flex flex-col gap-2 ${
                    item.completed
                      ? 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/80 dark:border-slate-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-800 shadow-2xs'
                  }`}
                >
                  {isEditingThis ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingItemText}
                        onChange={e => setEditingItemText(e.target.value)}
                        className="flex-1 h-8 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSaveEdit(item.id)}
                        className="h-8 text-xs font-bold rounded-lg bg-emerald-600 text-white px-2.5"
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingItemId(null)}
                        className="h-8 text-xs rounded-lg"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      {/* Checkbox & Text */}
                      <label className="flex items-start gap-2.5 cursor-pointer flex-1 select-none min-w-0">
                        <input
                          type="checkbox"
                          disabled={readOnly}
                          checked={item.completed}
                          onChange={() => handleToggleItem(item.id)}
                          className="mt-0.5 rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF] h-4 w-4 shrink-0 transition-all cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-semibold leading-snug ${
                            item.completed 
                              ? 'line-through text-slate-400 dark:text-slate-500' 
                              : 'text-slate-900 dark:text-slate-100'
                          }`}>
                            {item.text}
                          </p>

                          {/* Verification Meta */}
                          {item.completed && item.completedBy && (
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 inline" />
                              <span>Verified by {item.completedBy}</span>
                              {item.completedAt && (
                                <span className="text-slate-400 ml-1">
                                  • {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </label>

                      {/* Right Category Pill (Clickable to change category) & Item Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          disabled={readOnly}
                          onClick={() => {
                            if (!readOnly) {
                              setEditingCategoryItemId(item.id);
                              setIsCategoryModalOpen(true);
                            }
                          }}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 transition-transform ${readOnly ? '' : 'hover:scale-105 cursor-pointer'} ${style.bg} ${style.text} ${style.border}`}
                          title={readOnly ? categoryKey : `Click to change category: ${categoryKey}`}
                        >
                          <IconComp className="h-3 w-3" />
                          <span className="hidden sm:inline">{categoryKey}</span>
                        </button>

                        {!readOnly && (
                          <div className="flex items-center">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItemId(item.id);
                                setEditingItemText(item.text);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Edit item text"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              title="Delete item"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 5. Footer Utility Buttons */}
        {totalCount > 0 && !readOnly && (
          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 flex-wrap gap-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleCheckAll(true)}
                className="text-[11px] font-semibold text-[#0B5FFF] hover:underline"
              >
                Check All
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleCheckAll(false)}
                className="text-[11px] font-semibold text-slate-500 hover:underline"
              >
                Reset All
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={openSaveCurrentTemplate}
                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <BookmarkPlus className="h-3 w-3" />
                <span>Save as Template</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (confirm('Clear all checklist items from this activity?')) {
                  onUpdateChecklists([]);
                }
              }}
              className="text-[11px] text-rose-500 hover:underline"
            >
              Clear Checklist
            </button>
          </div>
        )}
        </CardContent>
      )}
    </Card>
  );
}
