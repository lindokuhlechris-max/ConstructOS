import React, { useState, useEffect } from 'react';
import { 
  X, Save, RefreshCw, Sparkles, Ruler, Square, Box, 
  Scale, Hash, Percent, CheckSquare, ShieldCheck, Flag, 
  ToggleLeft, Info, Check, SlidersHorizontal, ArrowRight
} from 'lucide-react';
import { Button } from './ui';
import { SubTaskMeasurementType, ActivityMeasurementPresets, MeasurementPresetConfig } from '../types';

interface MeasurementPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityId?: string;
  activityName?: string;
  activityTargetQuantity?: number;
  activityUnit?: string;
  currentPresets?: ActivityMeasurementPresets;
  onSavePresets: (newPresets: ActivityMeasurementPresets, propagateToExisting: boolean) => void;
}

const PRESET_CATEGORIES: {
  type: SubTaskMeasurementType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  defaultUnit: string;
  unitOptions: string[];
  defaultTarget?: number;
  stepOptions: number[];
  defaultStep: number;
  description: string;
}[] = [
  {
    type: 'Length',
    label: 'Length',
    icon: Ruler,
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
    defaultUnit: 'm',
    unitOptions: ['m', 'km', 'cm', 'mm', 'ft', 'yd', 'lin.m'],
    defaultTarget: 433,
    stepOptions: [1, 5, 10, 25, 50, 100],
    defaultStep: 10,
    description: 'Linear trenching, pipeline, conduit laying, cable routing'
  },
  {
    type: 'Area',
    label: 'Area',
    icon: Square,
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
    defaultUnit: 'm²',
    unitOptions: ['m²', 'ha', 'sq ft', 'sq yd', 'acres'],
    defaultTarget: 1000,
    stepOptions: [1, 10, 25, 50, 100, 250],
    defaultStep: 50,
    description: 'Paving, asphalt surfacing, plastering, painting, site clearing'
  },
  {
    type: 'Volume',
    label: 'Volume',
    icon: Box,
    color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800',
    defaultUnit: 'm³',
    unitOptions: ['m³', 'L', 'cu yd', 'cu ft', 'gallons'],
    defaultTarget: 100,
    stepOptions: [1, 2, 5, 10, 25, 50],
    defaultStep: 5,
    description: 'Bedding sand, concrete pouring, bulk excavation, aggregate'
  },
  {
    type: 'Weight',
    label: 'Weight',
    icon: Scale,
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
    defaultUnit: 'tons',
    unitOptions: ['tons', 't', 'kg', 'lbs'],
    defaultTarget: 25,
    stepOptions: [1, 2, 5, 10, 20],
    defaultStep: 1,
    description: 'Rebar steel, structural steel tonnage, asphalt, gravel'
  },
  {
    type: 'Count',
    label: 'Count / Units',
    icon: Hash,
    color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800',
    defaultUnit: 'items',
    unitOptions: ['items', 'units', 'poles', 'panels', 'fixtures', 'joints', 'pipes'],
    defaultTarget: 10,
    stepOptions: [1, 2, 5, 10],
    defaultStep: 1,
    description: 'Individual component installations, utility poles, manholes'
  },
  {
    type: 'Quantity',
    label: 'General Quantity',
    icon: Hash,
    color: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    defaultUnit: 'units',
    unitOptions: ['units', 'items', 'batches', 'sets', 'loads'],
    defaultTarget: 100,
    stepOptions: [1, 5, 10, 25, 50],
    defaultStep: 1,
    description: 'General deliverables and standard quantified tasks'
  },
  {
    type: 'Sign-off',
    label: 'Sign-off / QA Gate',
    icon: ShieldCheck,
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800',
    defaultUnit: 'sign-off',
    unitOptions: ['sign-off'],
    defaultTarget: 1,
    stepOptions: [1],
    defaultStep: 1,
    description: 'Mandatory QA Inspection Hold Point requiring formal authorization'
  },
  {
    type: 'Milestone',
    label: 'Milestone Checkpoint',
    icon: Flag,
    color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800',
    defaultUnit: 'checkpoint',
    unitOptions: ['checkpoint'],
    defaultTarget: 1,
    stepOptions: [1],
    defaultStep: 1,
    description: 'Key contractual delivery milestone or stage gate date'
  },
  {
    type: 'Yes/No',
    label: 'Yes / No Binary',
    icon: ToggleLeft,
    color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800',
    defaultUnit: 'done',
    unitOptions: ['done'],
    defaultTarget: 1,
    stepOptions: [1],
    defaultStep: 1,
    description: 'Fast binary Done or Pending state'
  },
  {
    type: 'Percentage',
    label: 'Percentage',
    icon: Percent,
    color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800',
    defaultUnit: '%',
    unitOptions: ['%'],
    defaultTarget: 100,
    stepOptions: [5, 10, 20, 25],
    defaultStep: 5,
    description: 'Progress tracking as an overall percentage from 0% to 100%'
  },
  {
    type: 'Checklist',
    label: 'Checklist',
    icon: CheckSquare,
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
    defaultUnit: 'items',
    unitOptions: ['items'],
    defaultTarget: 5,
    stepOptions: [1],
    defaultStep: 1,
    description: 'Break down subtask into interactive multi-step quality items'
  }
];

export function MeasurementPresetsModal({
  isOpen,
  onClose,
  activityId,
  activityName,
  activityTargetQuantity,
  activityUnit,
  currentPresets,
  onSavePresets
}: MeasurementPresetsModalProps) {
  const [presets, setPresets] = useState<ActivityMeasurementPresets>({});
  const [propagateToExisting, setPropagateToExisting] = useState(true);
  const [activeTypeTab, setActiveTypeTab] = useState<SubTaskMeasurementType>('Length');

  // Initialize presets when opening
  useEffect(() => {
    if (isOpen) {
      const initial: ActivityMeasurementPresets = {};
      PRESET_CATEGORIES.forEach(cat => {
        const existing = currentPresets?.[cat.type];
        initial[cat.type] = {
          targetQuantity: existing?.targetQuantity ?? cat.defaultTarget,
          unit: existing?.unit ?? cat.defaultUnit,
          stepIncrement: existing?.stepIncrement ?? cat.defaultStep
        };
      });

      // If activity has an existing target quantity & unit, sync it to Length/Quantity if untouched
      if (activityTargetQuantity && activityTargetQuantity > 0) {
        const u = (activityUnit || '').toLowerCase();
        if (u.includes('m') && !u.includes('m2') && !u.includes('m3') && !u.includes('sq') && !u.includes('cu')) {
          if (!currentPresets?.['Length']?.targetQuantity) {
            initial['Length'] = {
              ...initial['Length'],
              targetQuantity: activityTargetQuantity,
              unit: activityUnit || 'm'
            };
          }
        } else if (u.includes('m2') || u.includes('sq')) {
          if (!currentPresets?.['Area']?.targetQuantity) {
            initial['Area'] = {
              ...initial['Area'],
              targetQuantity: activityTargetQuantity,
              unit: activityUnit || 'm²'
            };
          }
        } else if (u.includes('m3') || u.includes('cu')) {
          if (!currentPresets?.['Volume']?.targetQuantity) {
            initial['Volume'] = {
              ...initial['Volume'],
              targetQuantity: activityTargetQuantity,
              unit: activityUnit || 'm³'
            };
          }
        }
      }

      setPresets(initial);
    }
  }, [isOpen, currentPresets, activityTargetQuantity, activityUnit]);

  if (!isOpen) return null;

  const handleUpdateConfig = (type: SubTaskMeasurementType, field: keyof MeasurementPresetConfig, value: any) => {
    setPresets(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  const handleSyncFromActivity = () => {
    if (!activityTargetQuantity) return;
    const targetQ = Number(activityTargetQuantity);
    const unitQ = activityUnit || 'm';
    const u = unitQ.toLowerCase();

    let targetType: SubTaskMeasurementType = 'Length';
    if (u.includes('m2') || u.includes('sq')) targetType = 'Area';
    else if (u.includes('m3') || u.includes('cu') || u.includes('l')) targetType = 'Volume';
    else if (u.includes('ton') || u.includes('kg')) targetType = 'Weight';
    else if (u.includes('item') || u.includes('pole') || u.includes('fixture') || u.includes('joint')) targetType = 'Count';
    else if (u.includes('unit') || u.includes('qty')) targetType = 'Quantity';

    setPresets(prev => ({
      ...prev,
      [targetType]: {
        ...prev[targetType],
        targetQuantity: targetQ,
        unit: unitQ
      }
    }));

    setActiveTypeTab(targetType);
  };

  const handleSave = () => {
    onSavePresets(presets, propagateToExisting);
    onClose();
  };

  const activeCategory = PRESET_CATEGORIES.find(c => c.type === activeTypeTab) || PRESET_CATEGORIES[0];
  const activePreset = presets[activeTypeTab] || {
    targetQuantity: activeCategory.defaultTarget,
    unit: activeCategory.defaultUnit,
    stepIncrement: activeCategory.defaultStep
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#0B5FFF]/10 dark:bg-[#0B5FFF]/20 text-[#0B5FFF] rounded-xl">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Subtask Measurement Defaults & Presets
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activityName ? `Activity: "${activityName}"` : 'Configure baseline targets and units for this activity'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body with Left Tabs & Right Form */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
          
          {/* Left Navigation: Type Selector List */}
          <div className="w-full md:w-56 shrink-0 space-y-1.5 overflow-y-auto max-h-64 md:max-h-[380px] pr-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1">
              Measurement Types
            </div>
            {PRESET_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isSelected = activeTypeTab === cat.type;
              const configured = presets[cat.type];
              return (
                <button
                  key={cat.type}
                  type="button"
                  onClick={() => setActiveTypeTab(cat.type)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#0B5FFF] text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                    <span className="truncate">{cat.label}</span>
                  </div>
                  {configured?.targetQuantity && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {configured.targetQuantity}{configured.unit ? ` ${configured.unit}` : ''}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Configuration Card */}
          <div className="flex-1 space-y-5">
            
            {/* Active Type Header Banner */}
            <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${activeCategory.color}`}>
              <activeCategory.icon className="h-6 w-6 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {activeCategory.label} Preset Defaults
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {activeCategory.description}
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Target Baseline Quantity */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Default Target Quantity</span>
                  <span className="text-[10px] font-normal text-slate-400">Baseline value</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={activePreset.targetQuantity ?? ''}
                  onChange={e => handleUpdateConfig(activeTypeTab, 'targetQuantity', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={`e.g. ${activeCategory.defaultTarget || 100}`}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-[#0B5FFF] focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                />
              </div>

              {/* Default Unit */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Default Unit of Measure
                </label>
                <div className="flex gap-2">
                  <select
                    value={activePreset.unit || activeCategory.defaultUnit}
                    onChange={e => handleUpdateConfig(activeTypeTab, 'unit', e.target.value)}
                    className="flex-1 h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                  >
                    {activeCategory.unitOptions.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Custom unit"
                    value={activePreset.unit || ''}
                    onChange={e => handleUpdateConfig(activeTypeTab, 'unit', e.target.value)}
                    className="w-24 h-10 px-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                  />
                </div>
              </div>

              {/* Step Increment */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Field Stepper Step Size (+ / - buttons)</span>
                  <span className="text-[10px] text-slate-400">Increment amount per click</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {activeCategory.stepOptions.map(step => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => handleUpdateConfig(activeTypeTab, 'stepIncrement', step)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        (activePreset.stepIncrement || activeCategory.defaultStep) === step
                          ? 'bg-[#0B5FFF] text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      +{step} {activePreset.unit || activeCategory.defaultUnit}
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-[11px] text-slate-400">Custom:</span>
                    <input
                      type="number"
                      min="1"
                      value={activePreset.stepIncrement || ''}
                      onChange={e => handleUpdateConfig(activeTypeTab, 'stepIncrement', Number(e.target.value))}
                      placeholder="Step"
                      className="w-16 h-8 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-center focus:ring-2 focus:ring-[#0B5FFF] outline-none"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Preview Box */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1 text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#0B5FFF]" /> Live Preview for {activeCategory.label} Subtasks:
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Creating a subtask with <strong className="text-slate-700 dark:text-slate-200">{activeCategory.label}</strong> will auto-fill target as <strong className="text-[#0B5FFF]">{activePreset.targetQuantity || '0'} {activePreset.unit || activeCategory.defaultUnit}</strong> and adjust progress in steps of <strong className="text-slate-700 dark:text-slate-200">+{activePreset.stepIncrement || activeCategory.defaultStep}</strong>.
              </p>
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          
          {/* Left: Sync from Activity & Propagation Options */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            {activityTargetQuantity ? (
              <button
                type="button"
                onClick={handleSyncFromActivity}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B5FFF] hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                title={`Sync from Activity Target: ${activityTargetQuantity} ${activityUnit || 'units'}`}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Sync from Activity Scope ({activityTargetQuantity} {activityUnit || 'm'})</span>
              </button>
            ) : null}

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={propagateToExisting}
                onChange={e => setPropagateToExisting(e.target.checked)}
                className="rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF] h-4 w-4"
              />
              <span>Apply defaults to existing matching subtasks</span>
            </label>
          </div>

          {/* Right: Save & Cancel Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs h-9 px-4 rounded-xl border-slate-200 dark:border-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="text-xs h-9 px-5 rounded-xl bg-[#0B5FFF] hover:bg-blue-600 text-white font-bold gap-1.5 shadow-sm"
            >
              <Save className="h-4 w-4" /> Save Presets
            </Button>
          </div>

        </div>

      </div>
    </div>
  );
}
