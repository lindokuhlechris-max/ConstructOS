import React, { useState } from 'react';
import { Activity, ActivityExplainerItem } from '../types';
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
  Tag
} from 'lucide-react';

interface ActivityExplainerBreakdownProps {
  activity: Activity;
  onUpdateActivity: (updatedActivity: Activity) => void;
  readOnly?: boolean;
}

export function ActivityExplainerBreakdown({ activity, onUpdateActivity, readOnly = false }: ActivityExplainerBreakdownProps) {
  // Ensure we have a valid list of explainer items. Seed with initial description/method if list is empty!
  const getInitialItems = (): ActivityExplainerItem[] => {
    if (activity.explainerItems && activity.explainerItems.length > 0) {
      return activity.explainerItems;
    }
    // Fallback/Seed single initial item if activity has description or methodStatement
    if (activity.description || activity.methodStatement) {
      return [
        {
          id: `EXP-1`,
          title: activity.name || 'Primary Work Scope & Method',
          discipline: activity.discipline || 'General',
          scopeDescription: activity.description || 'Primary scope of work to be executed on site.',
          methodSpecs: activity.methodStatement || 'Complete execution according to engineering specifications and approved site drawings.',
          status: (activity.status === 'Completed' ? 'Completed' : activity.status === 'In Progress' ? 'In Progress' : 'Not Started') as any,
          targetDate: activity.finishDate
        }
      ];
    }
    return [];
  };

  const explainerItems = getInitialItems();

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Form State for Add / Edit Act Explainer Item
  const [formTitle, setFormTitle] = useState('');
  const [formDiscipline, setFormDiscipline] = useState('Civil');
  const [formScope, setFormScope] = useState('');
  const [formMethodSpecs, setFormMethodSpecs] = useState('');
  const [formStatus, setFormStatus] = useState<'Not Started' | 'In Progress' | 'Completed'>('Not Started');
  const [formTargetDate, setFormTargetDate] = useState(new Date().toISOString().split('T')[0]);

  const handleOpenAddForm = () => {
    setFormTitle('');
    setFormDiscipline(activity.discipline || 'Civil');
    setFormScope('');
    setFormMethodSpecs('Complete execution according to engineering specifications and approved site drawings.');
    setFormStatus('Not Started');
    setFormTargetDate(activity.finishDate || new Date().toISOString().split('T')[0]);
    setIsAddingItem(true);
    setEditingItemId(null);
  };

  const handleOpenEditForm = (item: ActivityExplainerItem) => {
    setFormTitle(item.title);
    setFormDiscipline(item.discipline || 'Civil');
    setFormScope(item.scopeDescription);
    setFormMethodSpecs(item.methodSpecs || '');
    setFormStatus(item.status);
    setFormTargetDate(item.targetDate || activity.finishDate || new Date().toISOString().split('T')[0]);
    setEditingItemId(item.id);
    setIsAddingItem(false);
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

  const completedCount = explainerItems.filter(i => i.status === 'Completed').length;

  return (
    <div className="space-y-6 w-full mt-6">
      {/* HEADER CARD FOR ACTIVITIES & ACTS EXPLAINER BREAKDOWN */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-blue-300 border border-white/20 shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-400/30">
                  Activities & Acts Breakdown Explainer
                </span>
                <span className="text-xs text-slate-300">• {explainerItems.length} {explainerItems.length === 1 ? 'Act / Task' : 'Acts / Tasks'}</span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">Detailed Execution Breakdown ({completedCount} of {explainerItems.length} Done)</h3>
            </div>
          </div>

          {!readOnly && (
            <button
              onClick={handleOpenAddForm}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B5FFF] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md shrink-0"
            >
              <Plus className="h-4 w-4" /> Add Act / Activity Explainer
            </button>
          )}
        </div>

        <CardContent className="p-6 bg-white dark:bg-slate-900 space-y-4">
          {/* ADD / EDIT ACT EXPLAINER MODAL */}
          {(isAddingItem || editingItemId) && (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#0B5FFF]" />
                  {editingItemId ? 'Edit Act / Activity Explainer' : 'Add New Act / Activity Explainer'}
                </h4>
                <button 
                  onClick={() => { setIsAddingItem(false); setEditingItemId(null); }} 
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Act / Task Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Concrete Plinth Pouring & Foundation Curing"
                      className="w-full h-9 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Discipline / Category</label>
                    <select
                      className="w-full h-9 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      value={formDiscipline}
                      onChange={e => setFormDiscipline(e.target.value)}
                    >
                      <option value="General">General</option>
                      <option value="Civil">Civil</option>
                      <option value="Structural">Structural</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Piping">Piping</option>
                      <option value="Quality Assurance">Quality Assurance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                    <select
                      className="w-full h-9 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      value={formStatus}
                      onChange={e => setFormStatus(e.target.value as any)}
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Target Completion Date</label>
                    <input
                      type="date"
                      className="w-full h-9 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      value={formTargetDate}
                      onChange={e => setFormTargetDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Objective & Work Scope Explainer *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Detail the exact tasks, objectives, and work scope to be executed for this act..."
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    value={formScope}
                    onChange={e => setFormScope(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Construction Method Statement & Specs</label>
                  <textarea
                    rows={3}
                    placeholder="Detail engineering method statement, quality standards, mix specs, or drawing references..."
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    value={formMethodSpecs}
                    onChange={e => setFormMethodSpecs(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => { setIsAddingItem(false); setEditingItemId(null); }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold bg-[#0B5FFF] text-white rounded-lg flex items-center gap-1"
                  >
                    <Check className="h-4 w-4" /> Save Act Explainer
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* LIST OF ALL ACTS & ACTIVITIES EXPLAINERS */}
          <div className="space-y-4">
            {explainerItems.map((item, index) => (
              <div 
                key={item.id}
                className={`p-5 rounded-2xl border transition-all ${
                  item.status === 'Completed'
                    ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                    : item.status === 'In Progress'
                    ? 'bg-blue-50/30 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40'
                    : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80'
                }`}
              >
                {/* Act Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleItemStatus(item.id)}
                      disabled={readOnly}
                      className={`shrink-0 transition-transform active:scale-95 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                      title="Click to toggle status (Not Started → In Progress → Completed)"
                    >
                      {item.status === 'Completed' ? (
                        <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                          <Check className="h-4 w-4" />
                        </div>
                      ) : item.status === 'In Progress' ? (
                        <div className="w-7 h-7 rounded-full bg-[#0B5FFF] text-white flex items-center justify-center shadow-sm animate-pulse">
                          <PlayCircle className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs font-bold text-slate-500">
                          {index + 1}
                        </div>
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black font-mono text-slate-400">ACT #{index + 1}</span>
                        {item.discipline && (
                          <span className="text-[10px] font-bold text-[#0B5FFF] bg-blue-100/60 dark:bg-blue-950/60 px-2 py-0.5 rounded-md uppercase">
                            {item.discipline}
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' :
                          item.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400' :
                          'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {item.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    {item.targetDate && (
                      <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" /> {item.targetDate}
                      </span>
                    )}

                    {!readOnly && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditForm(item)}
                          className="p-1.5 text-slate-400 hover:text-[#0B5FFF] rounded-lg transition-colors"
                          title="Edit Act Explainer"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                          title="Delete Act Explainer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Act Explainer Body (Scope & Method Statement Grid) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                      <FileText className="h-3 w-3 text-[#0B5FFF]" /> Objective & Work Scope Explainer
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                      {item.scopeDescription}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                      <Wrench className="h-3 w-3 text-indigo-500" /> Construction Method Statement & Specs
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                      {item.methodSpecs || 'Complete execution according to engineering specifications and approved site drawings.'}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {explainerItems.length === 0 && (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40">
                <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">No Acts or Activities Listed Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-3">
                  Click "Add Act / Activity Explainer" to list out all individual acts, tasks, and engineering specifications to be performed.
                </p>
                {!readOnly && (
                  <Button size="sm" onClick={handleOpenAddForm} className="bg-[#0B5FFF] text-white text-xs rounded-xl gap-1 mx-auto">
                    <Plus className="h-3.5 w-3.5" /> Add First Act Explainer
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
