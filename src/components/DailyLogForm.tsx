import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, CustomSelect, Badge } from './ui';
import { DailyReport, Activity, SubTask } from '../types';
import { 
  CloudRain, 
  Cloud, 
  Sun, 
  Wind, 
  CloudLightning, 
  Save, 
  X, 
  HardHat, 
  Truck, 
  ShieldAlert, 
  AlertTriangle, 
  FileText, 
  ClipboardList, 
  RotateCcw, 
  Check, 
  Pin, 
  Plus, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight, 
  CheckSquare, 
  Sparkles, 
  Users, 
  Layers, 
  Trash2, 
  Target, 
  ShieldCheck, 
  Clock, 
  Compass, 
  Building2 
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { normalizeLabourAssignments } from '../lib/labourUtils';

interface DailyLogFormProps {
  onSubmit: (report: Partial<DailyReport>) => void;
  onCancel: () => void;
  initialData?: Partial<DailyReport>;
}

const REPORT_TEMPLATES = {
  standard: {
    name: 'Standard Production Day',
    data: {
      weather: 'Sunny',
      siteConditions: 'Normal operations, clear access',
      significantEvents: 'Standard production activities continued as planned. No major delays.',
    }
  },
  weather_delay: {
    name: 'Weather Impact / Rain Delay',
    data: {
      weather: 'Heavy Rain',
      siteConditions: 'Muddy, flooded access routes. Operations paused.',
      significantEvents: 'Site operations suspended due to heavy rain and unsafe ground conditions.',
    }
  },
  safety_stand_down: {
    name: 'Safety Stand-down',
    data: {
      weather: 'Sunny',
      siteConditions: 'Operations halted for safety review.',
      significantEvents: 'Full site safety stand-down conducted. Toolbox talk completed.',
      incidents: 1,
    }
  },
  concrete_pour: {
    name: 'Major Concrete Pour',
    data: {
      weather: 'Sunny',
      siteConditions: 'Clear, designated staging areas prepped.',
      significantEvents: 'Major concrete pour. All testing and QA/QC procedures followed.',
    }
  }
};

export function DailyLogForm({ onSubmit, onCancel, initialData }: DailyLogFormProps) {
  const { activities = [], projects = [], employees = [], equipment = [] } = useAppContext();

  // --------------------------------------------------------------------------
  // Form State
  // --------------------------------------------------------------------------
  const [formData, setFormData] = useState<Partial<DailyReport>>(() => {
    if (initialData) return initialData;
    const savedDraft = localStorage.getItem('dailyReportDraft');
    if (savedDraft) {
      try {
        return JSON.parse(savedDraft);
      } catch (e) {
        console.error('Failed to parse daily report draft', e);
      }
    }
    return {
      date: new Date().toISOString().split('T')[0],
      projectId: projects[0]?.id || 'PRJ-001',
      weather: 'Sunny',
      temperature: '24°C',
      siteConditions: 'Normal operations, clear access',
      significantEvents: '',
      workersOnSite: 12,
      equipmentRunning: 3,
      incidents: 0,
      ncr: 0,
    };
  });

  const [hasRestoredDraft, setHasRestoredDraft] = useState<boolean>(() => {
    return !initialData && !!localStorage.getItem('dailyReportDraft');
  });

  // --------------------------------------------------------------------------
  // Pinned Activities & Subtasks State
  // Mapping: activityId -> 'all' | string[] (subtask IDs)
  // --------------------------------------------------------------------------
  const [pinnedSubtaskMap, setPinnedSubtaskMap] = useState<Record<string, 'all' | string[]>>(() => {
    if (initialData?.pinnedSubtaskMap) return initialData.pinnedSubtaskMap;
    const savedDraft = localStorage.getItem('dailyReportPinnedMap');
    if (savedDraft) {
      try {
        return JSON.parse(savedDraft);
      } catch (e) {}
    }
    // Default fallback: initial active activities for current date/project
    const targetProject = initialData?.projectId || projects[0]?.id || 'PRJ-001';
    const active = activities.filter(a => a.projectId === targetProject && (a.status === 'In Progress' || a.status === 'Not Started'));
    const map: Record<string, 'all' | string[]> = {};
    active.slice(0, 3).forEach(a => {
      map[a.id] = 'all';
    });
    return map;
  });

  // Track progress, quantities, and notes per pinned activity
  const [activityProgress, setActivityProgress] = useState<Record<string, { dailyQuantity?: number; unit?: string; notes?: string; completedSubtasks?: string[] }>>(() => {
    if (initialData?.activityProgress) return initialData.activityProgress;
    const savedDraft = localStorage.getItem('dailyReportActivityProgress');
    if (savedDraft) {
      try {
        return JSON.parse(savedDraft);
      } catch (e) {}
    }
    return {};
  });

  // --------------------------------------------------------------------------
  // Pin Selection Modal State
  // --------------------------------------------------------------------------
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinModalSearch, setPinModalSearch] = useState('');
  const [pinModalDiscipline, setPinModalDiscipline] = useState('all');
  const [pinModalFilterStatus, setPinModalFilterStatus] = useState<'all' | 'in_progress' | 'active_today'>('all');
  const [expandedModalActivityIds, setExpandedModalActivityIds] = useState<string[]>([]);

  // Auto-save form and pinned maps to localStorage
  useEffect(() => {
    if (!initialData) {
      localStorage.setItem('dailyReportDraft', JSON.stringify(formData));
      localStorage.setItem('dailyReportPinnedMap', JSON.stringify(pinnedSubtaskMap));
      localStorage.setItem('dailyReportActivityProgress', JSON.stringify(activityProgress));
    }
  }, [formData, pinnedSubtaskMap, activityProgress, initialData]);

  const clearDraft = () => {
    localStorage.removeItem('dailyReportDraft');
    localStorage.removeItem('dailyReportPinnedMap');
    localStorage.removeItem('dailyReportActivityProgress');
    setHasRestoredDraft(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      projectId: projects[0]?.id || 'PRJ-001',
      weather: 'Sunny',
      temperature: '24°C',
      siteConditions: 'Normal operations, clear access',
      significantEvents: '',
      workersOnSite: 12,
      equipmentRunning: 3,
      incidents: 0,
      ncr: 0,
    });
    setPinnedSubtaskMap({});
    setActivityProgress({});
  };

  const [errors, setErrors] = useState<Partial<Record<keyof DailyReport, string>>>({});

  // --------------------------------------------------------------------------
  // Helpers for Pinned Selection
  // --------------------------------------------------------------------------
  const isActivityPinned = (actId: string): boolean => {
    const sel = pinnedSubtaskMap[actId];
    if (!sel) return false;
    if (sel === 'all') return true;
    return Array.isArray(sel) && sel.length > 0;
  };

  const getActivitySelectionState = (act: Activity): 'all' | 'partial' | 'none' => {
    const sel = pinnedSubtaskMap[act.id];
    if (!sel) return 'none';
    const subtasks = act.subtasks || [];
    if (subtasks.length === 0) return 'all';
    if (sel === 'all') return 'all';
    if (Array.isArray(sel)) {
      if (sel.length === 0) return 'none';
      if (sel.length >= subtasks.length && subtasks.every(st => sel.includes(st.id))) return 'all';
      return 'partial';
    }
    return 'none';
  };

  const getFocusedSubtasks = (act: Activity): SubTask[] => {
    const allSubtasks = act.subtasks || [];
    if (allSubtasks.length === 0) return [];
    const sel = pinnedSubtaskMap[act.id];
    if (!sel || sel === 'all') return allSubtasks;
    if (Array.isArray(sel)) {
      return allSubtasks.filter(st => sel.includes(st.id));
    }
    return allSubtasks;
  };

  const isSubtaskPinned = (actId: string, subtaskId: string): boolean => {
    const sel = pinnedSubtaskMap[actId];
    if (!sel) return false;
    if (sel === 'all') return true;
    return Array.isArray(sel) && sel.includes(subtaskId);
  };

  // Filter activities relevant to the selected project
  const currentProjectActivities = useMemo(() => {
    const pId = formData.projectId || projects[0]?.id;
    return activities.filter(a => !pId || a.projectId === pId);
  }, [activities, formData.projectId, projects]);

  // List of pinned activity objects
  const pinnedActivitiesList = useMemo(() => {
    return currentProjectActivities.filter(a => isActivityPinned(a.id));
  }, [currentProjectActivities, pinnedSubtaskMap]);

  // Unique disciplines for filter
  const uniqueDisciplines = useMemo(() => {
    const set = new Set<string>();
    currentProjectActivities.forEach(a => {
      if (a.discipline) set.add(a.discipline);
    });
    return Array.from(set);
  }, [currentProjectActivities]);

  // Filtered activities in Pin Selection Modal
  const modalFilteredActivities = useMemo(() => {
    return currentProjectActivities.filter(a => {
      if (pinModalDiscipline !== 'all' && a.discipline !== pinModalDiscipline) {
        return false;
      }
      if (pinModalFilterStatus === 'in_progress' && a.status !== 'In Progress') {
        return false;
      }
      if (pinModalFilterStatus === 'active_today') {
        const d = formData.date || new Date().toISOString().split('T')[0];
        if (a.startDate && a.finishDate && !(d >= a.startDate && d <= a.finishDate)) {
          return false;
        }
      }
      if (pinModalSearch.trim()) {
        const q = pinModalSearch.toLowerCase();
        const matchesName = a.name.toLowerCase().includes(q);
        const matchesCode = (a.code || a.id).toLowerCase().includes(q);
        const matchesSubtask = (a.subtasks || []).some(s => s.title.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
        return matchesName || matchesCode || matchesSubtask;
      }
      return true;
    });
  }, [currentProjectActivities, pinModalDiscipline, pinModalFilterStatus, pinModalSearch, formData.date]);

  // --------------------------------------------------------------------------
  // Pinning Handlers
  // --------------------------------------------------------------------------
  const handleToggleActivity = (actId: string) => {
    setPinnedSubtaskMap(prev => {
      const copy = { ...prev };
      if (copy[actId]) {
        delete copy[actId];
      } else {
        copy[actId] = 'all';
      }
      return copy;
    });
  };

  const handleSelectAllFilteredActivities = () => {
    setPinnedSubtaskMap(prev => {
      const copy = { ...prev };
      modalFilteredActivities.forEach(a => {
        copy[a.id] = 'all';
      });
      return copy;
    });
  };

  const handleClearAllActivities = () => {
    setPinnedSubtaskMap({});
  };

  const handleToggleSubtaskSelection = (actId: string, subtaskId: string) => {
    const act = activities.find(a => a.id === actId);
    if (!act) return;
    const allSubtasks = act.subtasks || [];

    setPinnedSubtaskMap(prev => {
      const current = prev[actId];
      const copy = { ...prev };

      if (!current) {
        copy[actId] = [subtaskId];
        return copy;
      }

      if (current === 'all') {
        const remaining = allSubtasks.filter(s => s.id !== subtaskId).map(s => s.id);
        if (remaining.length === 0) {
          delete copy[actId];
        } else {
          copy[actId] = remaining;
        }
        return copy;
      }

      if (Array.isArray(current)) {
        if (current.includes(subtaskId)) {
          const remaining = current.filter(id => id !== subtaskId);
          if (remaining.length === 0) {
            delete copy[actId];
          } else {
            copy[actId] = remaining;
          }
        } else {
          const updated = [...current, subtaskId];
          if (allSubtasks.length > 0 && updated.length >= allSubtasks.length && allSubtasks.every(s => updated.includes(s.id))) {
            copy[actId] = 'all';
          } else {
            copy[actId] = updated;
          }
        }
        return copy;
      }

      return copy;
    });
  };

  const handleSelectAllSubtasksForActivity = (actId: string) => {
    setPinnedSubtaskMap(prev => ({
      ...prev,
      [actId]: 'all'
    }));
  };

  const handleToggleSubtaskCompletion = (actId: string, subtaskId: string) => {
    setActivityProgress(prev => {
      const current = prev[actId] || {};
      const completed = current.completedSubtasks || [];
      const updated = completed.includes(subtaskId)
        ? completed.filter(id => id !== subtaskId)
        : [...completed, subtaskId];

      return {
        ...prev,
        [actId]: {
          ...current,
          completedSubtasks: updated
        }
      };
    });
  };

  const handleDailyQuantityChange = (actId: string, qty: number, unit?: string) => {
    setActivityProgress(prev => ({
      ...prev,
      [actId]: {
        ...(prev[actId] || {}),
        dailyQuantity: qty,
        unit: unit || prev[actId]?.unit
      }
    }));
  };

  const handleActivityNoteChange = (actId: string, note: string) => {
    setActivityProgress(prev => ({
      ...prev,
      [actId]: {
        ...(prev[actId] || {}),
        notes: note
      }
    }));
  };

  // --------------------------------------------------------------------------
  // Auto-Summary & Resource Calculation Magic Handlers
  // --------------------------------------------------------------------------
  const handleAutoGenerateSummary = () => {
    if (pinnedActivitiesList.length === 0) {
      alert('Please pin at least one activity first.');
      return;
    }

    const lines: string[] = [];
    lines.push(`Daily Site Diary & Execution Summary (${formData.date}):`);
    
    pinnedActivitiesList.forEach((act, idx) => {
      const prog = activityProgress[act.id] || {};
      const focusedSt = getFocusedSubtasks(act);
      const completedSt = (prog.completedSubtasks || []).map(id => focusedSt.find(s => s.id === id)?.title).filter(Boolean);
      
      let line = `${idx + 1}. [${act.code || act.id}] ${act.name}`;
      if (prog.dailyQuantity !== undefined && prog.dailyQuantity > 0) {
        line += ` - Executed Output: ${prog.dailyQuantity} ${prog.unit || act.unit || 'units'}`;
      }
      if (completedSt.length > 0) {
        line += ` | Completed: ${completedSt.join(', ')}`;
      }
      if (prog.notes?.trim()) {
        line += ` (${prog.notes.trim()})`;
      }
      lines.push(line);
    });

    const generated = lines.join('\n');
    setFormData(prev => ({
      ...prev,
      significantEvents: prev.significantEvents ? `${prev.significantEvents}\n\n${generated}` : generated
    }));
  };

  const handleAutoCalculateResources = () => {
    let totalLabour = 0;
    let totalEquip = 0;

    pinnedActivitiesList.forEach(act => {
      const norm = normalizeLabourAssignments(act.assignedLabour, employees);
      totalLabour += norm.length;
      totalEquip += (act.assignedEquipment || []).length;
    });

    setFormData(prev => ({
      ...prev,
      workersOnSite: totalLabour > 0 ? totalLabour : (prev.workersOnSite || 12),
      equipmentRunning: totalEquip > 0 ? totalEquip : (prev.equipmentRunning || 3)
    }));
  };

  // --------------------------------------------------------------------------
  // Form Validation & Submit
  // --------------------------------------------------------------------------
  const applyTemplate = (templateKey: keyof typeof REPORT_TEMPLATES | '') => {
    if (!templateKey) return;
    const templateData = REPORT_TEMPLATES[templateKey].data;
    setFormData(prev => ({
      ...prev,
      ...templateData,
    }));
  };

  const handleChange = (field: keyof DailyReport, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof DailyReport, string>> = {};
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.weather) newErrors.weather = 'Weather is required';
    if (!formData.temperature?.trim()) newErrors.temperature = 'Temperature is required';
    if (!formData.siteConditions?.trim()) newErrors.siteConditions = 'Site conditions are required';
    
    if (formData.workersOnSite === undefined || isNaN(formData.workersOnSite) || formData.workersOnSite < 0) {
      newErrors.workersOnSite = 'Must be a valid positive number';
    }
    if (formData.equipmentRunning === undefined || isNaN(formData.equipmentRunning) || formData.equipmentRunning < 0) {
      newErrors.equipmentRunning = 'Must be a valid positive number';
    }
    if (formData.incidents === undefined || isNaN(formData.incidents) || formData.incidents < 0) {
      newErrors.incidents = 'Cannot be negative';
    }
    if (formData.ncr === undefined || isNaN(formData.ncr) || formData.ncr < 0) {
      newErrors.ncr = 'Cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      localStorage.removeItem('dailyReportDraft');
      localStorage.removeItem('dailyReportPinnedMap');
      localStorage.removeItem('dailyReportActivityProgress');

      // Compile worked activities and completed subtasks lists
      const activitiesWorked = pinnedActivitiesList.map(a => a.name);
      const activitiesLogged = pinnedActivitiesList.map(a => a.id);
      const subtasksCompleted: string[] = [];

      pinnedActivitiesList.forEach(act => {
        const prog = activityProgress[act.id];
        if (prog?.completedSubtasks) {
          const focused = getFocusedSubtasks(act);
          prog.completedSubtasks.forEach(stId => {
            const match = focused.find(s => s.id === stId);
            if (match) subtasksCompleted.push(`[${act.code || act.id}] ${match.title}`);
          });
        }
      });

      const reportPayload: Partial<DailyReport> = {
        ...formData,
        activitiesWorked,
        activitiesLogged,
        subtasksCompleted,
        pinnedSubtaskMap,
        activityProgress,
        workSummary: formData.significantEvents
      };

      onSubmit(reportPayload);
    }
  };

  const getInputClass = (field: keyof DailyReport) => `
    w-full h-11 px-3 rounded-xl border bg-transparent text-sm focus:outline-none focus:ring-1 
    ${errors[field] 
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
      : 'border-slate-300 dark:border-slate-700 focus:border-[#0B5FFF] focus:ring-[#0B5FFF]'
    }
  `;

  // Total count of subtasks pinned
  const totalSubtasksPinnedCount = useMemo(() => {
    let count = 0;
    pinnedActivitiesList.forEach(act => {
      count += getFocusedSubtasks(act).length;
    });
    return count;
  }, [pinnedActivitiesList, pinnedSubtaskMap]);

  return (
    <Card className="w-full h-full mx-auto rounded-3xl shadow-xl border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
      
      {/* Header Bar */}
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-3xl px-6 py-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-[#0B5FFF] rounded-2xl">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-50">Daily Site Diary & Log Entry</CardTitle>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Record environmental conditions, manpower, equipment, and pin specific shift activities & subtasks
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="p-6 md:p-8 space-y-8">
        
        {/* Auto-Save Draft Banner */}
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span>
              <strong>Auto-save active:</strong> Your daily log entries, pinned activities, and output quantities are preserved in local storage.
            </span>
          </div>
          {hasRestoredDraft && (
            <button
              type="button"
              onClick={clearDraft}
              className="px-3 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-200 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Draft
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          
          {/* Quick Fill Preset Ribbon */}
          <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-100">Quick Fill Templates</h4>
                <p className="text-xs text-indigo-600/80 dark:text-indigo-300/80">Fast-track site diary entries with standard environmental profiles.</p>
              </div>
            </div>
            <select
              onChange={(e) => applyTemplate(e.target.value as any)}
              className="w-full sm:w-64 h-10 px-3 rounded-xl border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              defaultValue=""
            >
              <option value="" disabled>Select a standard day template...</option>
              {Object.entries(REPORT_TEMPLATES).map(([key, template]) => (
                <option key={key} value={key}>{template.name}</option>
              ))}
            </select>
          </div>

          {/* Section 1: Project & Environmental Conditions */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-500" />
              <span>1. Project & Environmental Conditions</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Assigned Project *</label>
                <select
                  value={formData.projectId || projects[0]?.id}
                  onChange={e => handleChange('projectId', e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Log Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className={getInputClass('date')}
                />
                {errors.date && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.date}</span>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Weather *</label>
                <CustomSelect
                  value={formData.weather || 'Sunny'}
                  onChange={(val) => handleChange('weather', val)}
                  options={['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Heavy Rain', 'Windy', 'Storm']}
                  className={`${getInputClass('weather')} appearance-none`}
                  customPlaceholder="Enter custom weather..."
                />
                {errors.weather && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.weather}</span>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Temperature *</label>
                <input
                  type="text"
                  value={formData.temperature}
                  onChange={(e) => handleChange('temperature', e.target.value)}
                  placeholder="e.g. 24°C"
                  className={getInputClass('temperature')}
                />
                {errors.temperature && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.temperature}</span>}
              </div>
            </div>

            <div className="pt-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Site Ground Conditions *</label>
              <input
                type="text"
                value={formData.siteConditions}
                onChange={(e) => handleChange('siteConditions', e.target.value)}
                placeholder="e.g. Dry, clear access across working zones, high wind in afternoon..."
                className={getInputClass('siteConditions')}
              />
              {errors.siteConditions && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.siteConditions}</span>}
            </div>
          </div>

          {/* Section 2: Site Resources & Safety */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <HardHat className="h-4 w-4 text-[#0B5FFF]" />
                <span>2. Site Resources & Safety Incidents</span>
              </h4>

              {pinnedActivitiesList.length > 0 && (
                <button
                  type="button"
                  onClick={handleAutoCalculateResources}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                >
                  <Users className="h-3.5 w-3.5" />
                  Auto-Calculate from Pinned Tasks
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                  <HardHat className="w-3.5 h-3.5 text-blue-600"/> Workers on Site *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.workersOnSite}
                  onChange={(e) => handleChange('workersOnSite', parseInt(e.target.value) || 0)}
                  className={getInputClass('workersOnSite')}
                />
                {errors.workersOnSite && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.workersOnSite}</span>}
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-amber-600"/> Equipment Running *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.equipmentRunning}
                  onChange={(e) => handleChange('equipmentRunning', parseInt(e.target.value) || 0)}
                  className={getInputClass('equipmentRunning')}
                />
                {errors.equipmentRunning && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.equipmentRunning}</span>}
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600"/> Safety Incidents
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.incidents}
                  onChange={(e) => handleChange('incidents', parseInt(e.target.value) || 0)}
                  className={getInputClass('incidents')}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600"/> Non-Conformance (NCR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.ncr}
                  onChange={(e) => handleChange('ncr', parseInt(e.target.value) || 0)}
                  className={getInputClass('ncr')}
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* Section 3: Pinned Activities & Subtasks Engine (Interactive Selection)   */}
          {/* ========================================================================= */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Pin className="h-4 w-4 text-[#0B5FFF]" />
                  <span>3. Pinned Activities & Subtasks for this Shift</span>
                  <span className="ml-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-[#0B5FFF]">
                    {pinnedActivitiesList.length} Activities ({totalSubtasksPinnedCount} Subtasks)
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Select and pin all or specific activities & subtasks to report daily output progress, checklist completions, and shift observations.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  onClick={() => setIsPinModalOpen(true)}
                  className="gap-1.5 bg-[#0B5FFF] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold h-9 shadow-sm"
                >
                  <Pin className="h-3.5 w-3.5" />
                  Select & Pin Activities
                </Button>

                {pinnedActivitiesList.length > 0 && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAutoGenerateSummary}
                      className="gap-1.5 text-xs font-semibold h-9 rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
                      title="Auto-compile notes into Significant Events"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                      Auto-Summarize
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClearAllActivities}
                      className="text-xs text-rose-600 hover:text-rose-700 h-9 rounded-xl border-rose-200 dark:border-rose-800"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Pinned Activities List or Empty State */}
            {pinnedActivitiesList.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#0B5FFF] flex items-center justify-center mx-auto">
                  <Pin className="h-5 w-5" />
                </div>
                <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Activities Pinned to this Daily Log</h5>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Click the button below to pick specific site activities and subtasks being executed on this date to log daily physical progress.
                </p>
                <Button
                  type="button"
                  onClick={() => setIsPinModalOpen(true)}
                  className="gap-2 bg-blue-50 hover:bg-blue-100 text-[#0B5FFF] dark:bg-blue-950/60 dark:hover:bg-blue-900/80 rounded-xl text-xs font-bold h-9 border border-blue-200 dark:border-blue-800"
                >
                  <Plus className="h-4 w-4" /> Pin Activities & Subtasks
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {pinnedActivitiesList.map((act, index) => {
                  const focusedSubtasks = getFocusedSubtasks(act);
                  const prog = activityProgress[act.id] || {};
                  const completedStIds = prog.completedSubtasks || [];

                  return (
                    <div 
                      key={act.id}
                      className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 space-y-4 transition-all"
                    >
                      {/* Activity Title Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-bold text-[#0B5FFF] bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-md">
                            {act.code || `ACT-${index + 1}`}
                          </span>
                          <div>
                            <h5 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              {act.name}
                            </h5>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                              <span>Discipline: <strong>{act.discipline || 'General'}</strong></span>
                              <span>•</span>
                              <span>Target: <strong>{act.plannedQuantity || 100} {act.unit || 'units'}</strong></span>
                              <span>•</span>
                              <span className={`font-semibold ${act.status === 'In Progress' ? 'text-blue-600' : 'text-slate-500'}`}>
                                {act.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActivity(act.id)}
                            className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                            title="Unpin activity"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Unpin
                          </Button>
                        </div>
                      </div>

                      {/* Focused Subtask Checklist for this Activity */}
                      {focusedSubtasks.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                            Subtask Progression Checklist ({completedStIds.length}/{focusedSubtasks.length} Completed):
                          </span>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {focusedSubtasks.map(st => {
                              const isCompleted = completedStIds.includes(st.id);
                              return (
                                <label 
                                  key={st.id}
                                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-colors cursor-pointer select-none ${
                                    isCompleted 
                                      ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200' 
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200'
                                  }`}
                                >
                                  <input 
                                    type="checkbox"
                                    checked={isCompleted}
                                    onChange={() => handleToggleSubtaskCompletion(act.id, st.id)}
                                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`text-xs font-semibold ${isCompleted ? 'line-through opacity-80' : ''}`}>
                                        {st.title}
                                      </span>
                                      {st.isHoldPoint && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                                          <ShieldCheck className="h-2.5 w-2.5" /> Hold Point
                                        </span>
                                      )}
                                      {st.isMilestone && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300">
                                          🎯 Milestone
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 block">{st.category || 'Standard Task'}</span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Daily Output Quantity & Notes Row */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                            Daily Output Executed ({act.unit || 'units'})
                          </label>
                          <input 
                            type="number"
                            step="any"
                            min="0"
                            placeholder="e.g. 12.5"
                            value={prog.dailyQuantity || ''}
                            onChange={(e) => handleDailyQuantityChange(act.id, parseFloat(e.target.value) || 0, act.unit)}
                            className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                            Activity Notes / Delays / Observations
                          </label>
                          <input 
                            type="text"
                            placeholder="e.g. Completed initial 45m; awaiting compaction test results..."
                            value={prog.notes || ''}
                            onChange={(e) => handleActivityNoteChange(act.id, e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 4: Narrative & Significant Events */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                <span>4. Significant Events & Comprehensive Site Diary</span>
              </h4>

              {pinnedActivitiesList.length > 0 && (
                <button
                  type="button"
                  onClick={handleAutoGenerateSummary}
                  className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Auto-Format from Pinned Tasks
                </button>
              )}
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Details & Observations *</label>
              <textarea
                rows={5}
                value={formData.significantEvents}
                onChange={(e) => handleChange('significantEvents', e.target.value)}
                placeholder="Log major milestones, delays, deliveries, VIP visits, and site operations..."
                className="w-full p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:border-[#0B5FFF] focus:ring-1 focus:ring-[#0B5FFF]"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Summarize the day's key production activities, milestones, and site notes.
              </span>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={onCancel} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" className="gap-2 bg-[#0B5FFF] hover:bg-blue-700 text-white rounded-xl font-semibold px-6 shadow-sm">
              <Save className="h-4 w-4" /> Save Daily Site Log
            </Button>
          </div>

        </form>
      </CardContent>

      {/* ========================================================================= */}
      {/* Interactive Selection & Pinning Modal (Full Discipline & Subtasks Picker) */}
      {/* ========================================================================= */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-[#0B5FFF] flex items-center justify-center shrink-0">
                  <Pin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Select & Pin Activities & Subtasks
                  </h3>
                  <p className="text-xs text-slate-400">
                    Choose which activities and specific subtasks are active for this daily log
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Filter Toolbar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search activities or subtasks by name or code..."
                  value={pinModalSearch}
                  onChange={e => setPinModalSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={pinModalDiscipline}
                  onChange={e => setPinModalDiscipline(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <option value="all">All Disciplines</option>
                  {uniqueDisciplines.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  value={pinModalFilterStatus}
                  onChange={e => setPinModalFilterStatus(e.target.value as any)}
                  className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <option value="all">All Statuses</option>
                  <option value="in_progress">In Progress Only</option>
                  <option value="active_today">Active on {formData.date}</option>
                </select>
              </div>
            </div>

            {/* Quick Multi-Action Buttons */}
            <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {modalFilteredActivities.length} Activities Displayed
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllFilteredActivities}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Select All Filtered
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleClearAllActivities}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Activities List */}
            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {modalFilteredActivities.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No matching activities found for active filters.
                </div>
              ) : (
                modalFilteredActivities.map(act => {
                  const state = getActivitySelectionState(act);
                  const isChecked = state === 'all';
                  const isPartial = state === 'partial';
                  const allSubtasks = act.subtasks || [];
                  const isExpanded = expandedModalActivityIds.includes(act.id);
                  const selectedSubtasks = getFocusedSubtasks(act);

                  return (
                    <div 
                      key={act.id}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        state !== 'none'
                          ? 'border-blue-300 dark:border-blue-800 bg-blue-50/20 dark:bg-blue-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                      }`}
                    >
                      {/* Activity Row */}
                      <div className="p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            ref={el => { if (el) el.indeterminate = isPartial; }}
                            onChange={() => handleToggleActivity(act.id)}
                            className="rounded text-[#0B5FFF] focus:ring-blue-500 h-4 w-4 shrink-0"
                          />

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-[11px] font-bold text-slate-500">{act.code || act.id}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {act.discipline || 'General'}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                act.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300' :
                                act.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {act.status}
                              </span>
                            </div>

                            <h5 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5 truncate">
                              {act.name}
                            </h5>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {allSubtasks.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedModalActivityIds(prev =>
                                  prev.includes(act.id) ? prev.filter(id => id !== act.id) : [...prev, act.id]
                                );
                              }}
                              className="px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                            >
                              <span className="text-[11px] text-slate-400">
                                {state === 'all' ? `${allSubtasks.length}/${allSubtasks.length} Subtasks` :
                                 state === 'partial' ? `${selectedSubtasks.length}/${allSubtasks.length} Subtasks` :
                                 `${allSubtasks.length} Subtasks`}
                              </span>
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded Subtasks List */}
                      {isExpanded && allSubtasks.length > 0 && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1">
                            <span>Check specific subtasks to pin:</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleSelectAllSubtasksForActivity(act.id)}
                                className="text-blue-600 font-semibold hover:underline"
                              >
                                Select All Subtasks
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {allSubtasks.map(st => {
                              const isSubPinned = isSubtaskPinned(act.id, st.id);
                              return (
                                <label
                                  key={st.id}
                                  className={`flex items-start gap-2 p-2 rounded-xl border text-xs cursor-pointer select-none transition-colors ${
                                    isSubPinned 
                                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-200 font-semibold' 
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  <input 
                                    type="checkbox"
                                    checked={isSubPinned}
                                    onChange={() => handleToggleSubtaskSelection(act.id, st.id)}
                                    className="rounded text-[#0B5FFF] focus:ring-blue-500 h-3.5 w-3.5 mt-0.5"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span>{st.title}</span>
                                      {st.isHoldPoint && (
                                        <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                          Hold Point
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 block">{st.category}</span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {pinnedActivitiesList.length} Activities Pinned ({totalSubtasksPinnedCount} Subtasks)
              </span>

              <Button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="bg-[#0B5FFF] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold px-6 shadow-sm"
              >
                Done Pinning
              </Button>
            </div>

          </div>
        </div>
      )}

    </Card>
  );
}
