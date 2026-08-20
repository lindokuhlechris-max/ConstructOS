import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, CustomSelect } from './ui';
import { Activity, ActivityStatus, Priority, SubTask, WorkstreamType, WORKSTREAMS } from '../types';
import { Save, X, RotateCcw, Copy, Link2, Compass, ShieldCheck, Package, ShieldAlert, Zap, Building2 } from 'lucide-react';
import { SubTaskManager } from './SubTaskManager';
import { useAppContext } from '../context/AppContext';

interface ActivityFormProps {
  onClose: () => void;
  onSubmit: (activity: Activity) => void;
  initialValues?: Partial<Activity>;
  isDuplicate?: boolean;
}

export function ActivityForm({ onClose, onSubmit, initialValues, isDuplicate }: ActivityFormProps) {
  const { activities, projects, customFieldDefinitions } = useAppContext();
  
  const [formData, setFormData] = useState<Partial<Activity>>(() => {
    if (initialValues) {
      return {
        projectId: projects[0]?.id || '',
        name: '',
        description: '',
        workPackage: 'General',
        area: '',
        priority: 'Medium',
        discipline: 'Civil',
        assignedTo: '',
        supervisor: '',
        targetQuantity: 0,
        actualQuantity: 0,
        unit: 'm²',
        status: 'Not Started',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        startDate: new Date().toISOString().split('T')[0],
        finishDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        plannedHours: 0,
        actualHours: 0,
        progress: 0,
        planningType: 'Project Duration',
        dailyTargetQuantity: 0,
        dailyTargetPercentage: 0,
        isMilestone: false,
        ...initialValues
      };
    }
    const savedDraft = localStorage.getItem('activityDraft');
    if (savedDraft) {
      try {
        return JSON.parse(savedDraft);
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    }
    return {
      projectId: projects[0]?.id || '',
      name: '',
      description: '',
      workPackage: 'General',
      area: '',
      priority: 'Medium',
      discipline: 'Civil',
      assignedTo: '',
      supervisor: '',
      targetQuantity: 0,
      actualQuantity: 0,
      unit: 'm²',
      status: 'Not Started',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      finishDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      plannedHours: 0,
      actualHours: 0,
      progress: 0,
      planningType: 'Project Duration',
      dailyTargetQuantity: 0,
      dailyTargetPercentage: 0,
      isMilestone: false,
    };
  });

  const [hasRestoredDraft, setHasRestoredDraft] = useState<boolean>(() => {
    return !initialValues && !!localStorage.getItem('activityDraft');
  });

  React.useEffect(() => {
    if (!initialValues) {
      localStorage.setItem('activityDraft', JSON.stringify(formData));
    }
  }, [formData, initialValues]);

  const clearDraft = () => {
    localStorage.removeItem('activityDraft');
    setHasRestoredDraft(false);
    setFormData({
      projectId: projects[0]?.id || '',
      name: '',
      description: '',
      workPackage: 'General',
      area: '',
      priority: 'Medium',
      discipline: 'Civil',
      assignedTo: '',
      supervisor: '',
      targetQuantity: 0,
      actualQuantity: 0,
      unit: 'm²',
      status: 'Not Started',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      finishDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      plannedHours: 0,
      actualHours: 0,
      progress: 0,
      planningType: 'Project Duration',
      dailyTargetQuantity: 0,
      dailyTargetPercentage: 0,
      isMilestone: false,
    });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Activity, string>>>({});

  const handleChange = (field: keyof Activity, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof Activity, string>> = {};
    if (!formData.projectId) newErrors.projectId = 'Project is required';
    if (!formData.name?.trim()) newErrors.name = 'Activity name is required';
    if (!formData.discipline) newErrors.discipline = 'Discipline is required';
    if (!formData.priority) newErrors.priority = 'Priority is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.finishDate) newErrors.finishDate = 'Finish date is required';
    
    if (formData.startDate && formData.finishDate) {
      if (new Date(formData.finishDate) < new Date(formData.startDate)) {
        newErrors.finishDate = 'Finish date cannot be earlier than start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCustomFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      customFields: {
        ...(prev.customFields || {}),
        [fieldId]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (validate()) {
      setIsSubmitting(true);
      const activityId = formData.id || `ACT-${Math.floor(1000 + Math.random() * 9000)}`;
      const today = new Date().toISOString().split('T')[0];

      let assignedLabour = [...(formData.assignedLabour || [])];
      let assignedEquipment = [...(formData.assignedEquipment || [])];

      (formData.subtasks || []).forEach(s => {
        const workersSet = new Set<string>();
        (s.assignedWorkers || []).forEach(w => { if (w && w.trim()) workersSet.add(w.trim()); });
        if (s.assignedPerson) {
          s.assignedPerson.split(',').map(p => p.trim()).filter(Boolean).forEach(p => workersSet.add(p));
        }
        const workers = Array.from(workersSet);

        workers.forEach(wName => {
          if (!wName || wName.trim() === '' || wName.includes(',')) return;
          if (!assignedLabour.some(l => l.name.toLowerCase() === wName.toLowerCase())) {
            assignedLabour.push({
              id: `TLA-SUB-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              name: wName,
              role: 'Site Worker',
              hours: 8,
              startDate: s.startDate || formData.startDate || today,
              notes: `Assigned via subtask "${s.title}"`
            });
          }
        });

        const eqList = [...(s.assignedEquipmentList || []), ...(s.assignedEquipment ? [s.assignedEquipment] : [])];
        eqList.forEach(eqName => {
          if (!eqName || eqName.trim() === '') return;
          if (!assignedEquipment.some(e => e.name.toLowerCase() === eqName.toLowerCase())) {
            assignedEquipment.push({
              id: `TEA-SUB-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              equipmentId: `EQ-${Date.now()}`,
              name: eqName,
              operator: 'Assigned Operator',
              startDate: s.startDate || formData.startDate || today,
              notes: `Allocated via subtask "${s.title}"`
            });
          }
        });
      });

      const newActivity: Activity = {
        ...formData as Activity,
        id: activityId,
        assignedLabour,
        assignedEquipment,
        createdAt: formData.createdAt || today,
        updatedAt: today
      };
      onSubmit(newActivity);
      localStorage.removeItem('activityDraft');
    }
  };

  const getInputClass = (field: keyof Activity | string) => `
    w-full h-11 px-3 rounded-xl border bg-transparent text-sm focus:outline-none focus:ring-1 
    ${errors[field as keyof Activity] 
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
      : 'border-slate-300 dark:border-slate-700 focus:border-[#0B5FFF] focus:ring-[#0B5FFF]'
    }
  `;

  return (
    <Card className="w-full h-full mx-auto rounded-2xl shadow-md border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-t-2xl px-6 py-4">
        <div>
          <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            {isDuplicate && <Copy className="h-5 w-5 text-[#0B5FFF]" />}
            {isDuplicate ? 'Duplicate & Edit Activity' : 'New Activity'}
          </CardTitle>
          <p className="text-xs font-medium text-slate-500">
            {isDuplicate 
              ? 'Make minor differences (area, dates, resources, name) and create a new activity' 
              : 'Create a new construction activity'}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        {/* Duplicate Notification Banner or Auto-Save Draft Banner */}
        {isDuplicate ? (
          <div className="mb-6 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs text-blue-800 dark:text-blue-200">
            <div className="flex items-center gap-2">
              <Copy className="h-4 w-4 text-[#0B5FFF] shrink-0" />
              <span>
                <strong>Activity Cloned:</strong> Pre-filled with source activity parameters and resource breakdown. Modify any fields for minor differences and submit.
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>
                <strong>Auto-save active:</strong> Your activity form inputs are saved in browser draft state.
              </span>
            </div>
            {hasRestoredDraft && (
              <button
                type="button"
                onClick={clearDraft}
                className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-200 font-semibold flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Draft
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Workstream & Project Row */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-[#0B5FFF]" />
                Select Independent Workstream
              </label>
              <span className="text-[10px] text-slate-400">
                Determines the operational domain and cross-discipline linking rules
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
              {(Object.keys(WORKSTREAMS) as string[])
                .filter(key => key !== 'PTS_CONSTRUCTION')
                .map(wsKey => {
                  const ws = WORKSTREAMS[wsKey];
                  const currentWs = formData.workstream === 'PTS_CONSTRUCTION' ? 'CONSTRUCTION' : (formData.workstream || 'CONSTRUCTION');
                  const isSelected = currentWs === wsKey;
                  return (
                    <button
                      key={wsKey}
                      type="button"
                      onClick={() => {
                        handleChange('workstream', wsKey);
                        if (wsKey === 'SURVEYING' && !formData.discipline) handleChange('discipline', 'Surveying');
                        if (wsKey === 'QA_QC' && !formData.discipline) handleChange('discipline', 'Quality');
                        if (wsKey === 'SAFETY' && !formData.discipline) handleChange('discipline', 'Safety');
                      }}
                      className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                        isSelected 
                          ? 'border-[#0B5FFF] bg-blue-50/80 dark:bg-blue-950/60 ring-2 ring-[#0B5FFF]/30 shadow-xs' 
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {ws.shortName}
                      </span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                        {ws.description}
                      </span>
                    </button>
                  );
                })}
            </div>

            {/* Custom Workstream input if Custom is selected */}
            {(formData.workstream === 'CUSTOM' || (!WORKSTREAMS[formData.workstream || ''] && formData.workstream)) && (
              <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Custom Workstream Name
                </label>
                <input
                  type="text"
                  placeholder="Enter custom workstream (e.g. Mechanical Piping, Process Engineering, Water Treatment...)"
                  value={formData.customWorkstream || ''}
                  onChange={(e) => handleChange('customWorkstream', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:border-[#0B5FFF]"
                />
              </div>
            )}

            {/* Optional Target Activity Linking (for non-construction workstreams) */}
            {formData.workstream && formData.workstream !== 'CONSTRUCTION' && formData.workstream !== 'PTS_CONSTRUCTION' && (
              <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-indigo-600 shrink-0" />
                  <div>
                    <div className="font-bold text-indigo-900 dark:text-indigo-200">
                      Link Work Item to Target Construction / Main Execution Activity
                    </div>
                    <div className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                      Progress and sign-offs in this {WORKSTREAMS[formData.workstream]?.shortName || formData.customWorkstream || 'item'} will automatically correlate with the target main activity.
                    </div>
                  </div>
                </div>

                <select
                  value={formData.linkedPTSActivityId || ''}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const foundAct = activities.find(a => a.id === selectedId);
                    handleChange('linkedPTSActivityId', selectedId);
                    handleChange('linkedPTSActivityName', foundAct?.name || '');
                    if (foundAct?.sectionSpan) handleChange('sectionSpan', foundAct.sectionSpan);
                  }}
                  className="h-9 px-3 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-72 shrink-0"
                >
                  <option value="">None (Independent Scope)</option>
                  {activities
                    .filter(a => a.workstream === 'CONSTRUCTION' || a.workstream === 'PTS_CONSTRUCTION' || !a.workstream)
                    .map(act => (
                      <option key={act.id} value={act.id}>
                        {act.name} {act.sectionSpan ? `[${act.sectionSpan}]` : ''}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Project *</label>
              <select
                value={formData.projectId}
                onChange={(e) => handleChange('projectId', e.target.value)}
                className={`${getInputClass('projectId')} appearance-none`}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
                ))}
              </select>
              {errors.projectId && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.projectId}</span>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Activity Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={getInputClass('name')}
                placeholder="e.g. Concrete Pouring Foundation"
              />
              {errors.name && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.name}</span>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Discipline *</label>
              <CustomSelect
                value={formData.discipline || 'Civil'}
                onChange={(val) => handleChange('discipline', val)}
                options={['Civil', 'Surveying', 'Quality', 'Safety', 'MEP', 'Structural', 'Electrical', 'Instrumentation', 'Geotechnical']}
                className={`${getInputClass('discipline')} appearance-none`}
                customPlaceholder="Enter custom discipline..."
              />
              {errors.discipline && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.discipline}</span>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Priority *</label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value as Priority)}
                className={`${getInputClass('priority')} appearance-none`}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
              {errors.priority && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.priority}</span>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Milestone Tracker</label>
              <button
                type="button"
                onClick={() => handleChange('isMilestone', !formData.isMilestone)}
                className={`w-full h-11 px-3 rounded-xl border flex items-center justify-between transition-colors ${
                  formData.isMilestone
                    ? 'border-[#0B5FFF] bg-blue-50/50 dark:bg-blue-900/20 text-[#0B5FFF]'
                    : 'border-slate-300 dark:border-slate-700 bg-transparent text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="text-sm font-medium">{formData.isMilestone ? 'Marked as Milestone' : 'Standard Activity'}</span>
                <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${formData.isMilestone ? 'bg-[#0B5FFF]' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${formData.isMilestone ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </button>
            </div>
          </div>
          
          {/* Timeline & Planning Phase Section */}
          <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-slate-800/50 border border-blue-100 dark:border-slate-700/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-4 flex items-center gap-2">
              Timeline & Planning Phase
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Date Created</label>
                <input
                  type="date"
                  value={formData.createdAt || new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleChange('createdAt', e.target.value)}
                  className={getInputClass('createdAt')}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Date Started / To Start *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className={getInputClass('startDate')}
                />
                {errors.startDate && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.startDate}</span>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Target Finish Date *</label>
                <input
                  type="date"
                  value={formData.finishDate}
                  onChange={(e) => handleChange('finishDate', e.target.value)}
                  className={getInputClass('finishDate')}
                />
                {errors.finishDate && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.finishDate}</span>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Date Edited / Modified</label>
                <input
                  type="date"
                  value={formData.updatedAt || new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleChange('updatedAt', e.target.value)}
                  className={getInputClass('updatedAt')}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Target Quantity</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.targetQuantity || ''}
                    onChange={(e) => handleChange('targetQuantity', Number(e.target.value))}
                    className={`${getInputClass('targetQuantity')} w-2/3`}
                    placeholder="0"
                  />
                  <input
                    type="text"
                    value={formData.unit || ''}
                    onChange={(e) => handleChange('unit', e.target.value)}
                    className={`${getInputClass('unit')} w-1/3`}
                    placeholder="Unit"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Planned Hours</label>
                <input
                  type="number"
                  value={formData.plannedHours || ''}
                  onChange={(e) => handleChange('plannedHours', Number(e.target.value))}
                  className={getInputClass('plannedHours')}
                  placeholder="e.g. 40"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Planning Cycle Type</label>
                <select
                  value={formData.planningType || 'Project Duration'}
                  onChange={(e) => handleChange('planningType', e.target.value)}
                  className={`${getInputClass('planningType')} appearance-none`}
                >
                  <option value="Daily">Daily Target</option>
                  <option value="Weekly">Weekly Target</option>
                  <option value="Monthly">Monthly Target</option>
                  <option value="Project Duration">Overall Project Duration</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Daily Target %</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.dailyTargetPercentage || ''}
                    onChange={(e) => handleChange('dailyTargetPercentage', Number(e.target.value))}
                    className={getInputClass('dailyTargetPercentage')}
                    placeholder="e.g. 5"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    %
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Daily Target Qty</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.dailyTargetQuantity || ''}
                    onChange={(e) => handleChange('dailyTargetQuantity', Number(e.target.value))}
                    className={getInputClass('dailyTargetQuantity')}
                    placeholder="e.g. 100"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 text-xs">
                    {formData.unit || 'units'}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Custom Fields Rendered Here */}
            {customFieldDefinitions.filter(cf => cf.active).map(cf => (
              <div key={cf.id}>
                <label className="text-xs font-semibold text-slate-500 block mb-1">
                  {cf.name} {cf.required && '*'}
                </label>
                {cf.type === 'select' ? (
                  <select
                    value={formData.customFields?.[cf.id] || ''}
                    onChange={(e) => handleCustomFieldChange(cf.id, e.target.value)}
                    className={`${getInputClass(cf.id)} appearance-none`}
                    required={cf.required}
                  >
                    <option value="">Select...</option>
                    {cf.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : cf.type === 'boolean' ? (
                  <div className="flex items-center h-11">
                    <input
                      type="checkbox"
                      checked={formData.customFields?.[cf.id] || false}
                      onChange={(e) => handleCustomFieldChange(cf.id, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF]"
                    />
                  </div>
                ) : (
                  <input
                    type={cf.type === 'number' ? 'number' : cf.type === 'date' ? 'date' : 'text'}
                    value={formData.customFields?.[cf.id] || ''}
                    onChange={(e) => handleCustomFieldChange(cf.id, e.target.value)}
                    className={getInputClass(cf.id)}
                    required={cf.required}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:border-[#0B5FFF] focus:ring-1 focus:ring-[#0B5FFF]"
              placeholder="Brief description of the work scope..."
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Optional.</span>
          </div>

          {/* Subtask Breakdown Builder */}
          <SubTaskManager
            subtasks={formData.subtasks || []}
            onChange={(updatedSubtasks) => handleChange('subtasks', updatedSubtasks)}
            onAutoSyncProgress={(calcProgress) => {
              handleChange('progress', calcProgress);
              const subs = formData.subtasks || [];
              const allDone = subs.length > 0 ? subs.every(s => s.status === 'Completed') : true;
              if (calcProgress === 100 && allDone) handleChange('status', 'Completed');
              else if (calcProgress > 0) handleChange('status', 'In Progress');
            }}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="gap-2 rounded-xl bg-[#0B5FFF]">
              <Save className="h-4 w-4" /> Save Activity
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
