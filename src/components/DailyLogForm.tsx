import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, CustomSelect } from './ui';
import { DailyReport } from '../types';
import { CloudRain, Cloud, Sun, Wind, CloudLightning, Save, X, HardHat, Truck, ShieldAlert, AlertTriangle, FileText, ClipboardList, RotateCcw, Check } from 'lucide-react';

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
      weather: 'Sunny',
      temperature: '',
      siteConditions: '',
      significantEvents: '',
      workersOnSite: 0,
      equipmentRunning: 0,
      incidents: 0,
      ncr: 0,
    };
  });

  const [hasRestoredDraft, setHasRestoredDraft] = useState<boolean>(() => {
    return !initialData && !!localStorage.getItem('dailyReportDraft');
  });

  useEffect(() => {
    if (!initialData) {
      localStorage.setItem('dailyReportDraft', JSON.stringify(formData));
    }
  }, [formData, initialData]);

  const clearDraft = () => {
    localStorage.removeItem('dailyReportDraft');
    setHasRestoredDraft(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      weather: 'Sunny',
      temperature: '',
      siteConditions: '',
      significantEvents: '',
      workersOnSite: 0,
      equipmentRunning: 0,
      incidents: 0,
      ncr: 0,
    });
  };

  const [errors, setErrors] = useState<Partial<Record<keyof DailyReport, string>>>({});

  const applyTemplate = (templateKey: keyof typeof REPORT_TEMPLATES | '') => {
    if (!templateKey) return;
    const templateData = REPORT_TEMPLATES[templateKey].data;
    setFormData(prev => ({
      ...prev,
      ...templateData,
    }));
  };


  const handleChange = (field: keyof DailyReport, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for the field being edited
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
      onSubmit(formData);
    }
  };

  const getInputClass = (field: keyof DailyReport) => `
    w-full h-11 px-3 rounded-xl border bg-transparent text-sm focus:outline-none focus:ring-1 
    ${errors[field] 
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
      : 'border-slate-300 dark:border-slate-700 focus:border-[#0B5FFF] focus:ring-[#0B5FFF]'
    }
  `;

  return (
    <Card className="w-full h-full mx-auto rounded-2xl shadow-md border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-t-2xl px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
            <FileText className="h-5 w-5 text-[#0B5FFF]" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-50">Daily Log Entry</CardTitle>
            <p className="text-xs font-medium text-slate-500">Record site conditions and events</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Auto-Save Draft Banner */}
        <div className="mb-6 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>
              <strong>Auto-save active:</strong> Your form entries are continuously saved to local storage so no data is lost.
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          
          {/* Template Selector */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-100">Quick Fill Templates</h4>
                <p className="text-xs text-indigo-600/80 dark:text-indigo-300/80">Save time by pre-filling standard reports.</p>
              </div>
            </div>
            <select
              onChange={(e) => applyTemplate(e.target.value as any)}
              className="w-64 h-10 px-3 rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              defaultValue=""
            >
              <option value="" disabled>Select a template...</option>
              {Object.entries(REPORT_TEMPLATES).map(([key, template]) => (
                <option key={key} value={key}>{template.name}</option>
              ))}
            </select>
          </div>

          {/* Section 1: Date & Weather */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">1. Environmental Conditions</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className={getInputClass('date')}
                />
                {errors.date && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.date}</span>}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Weather *</label>
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
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Temperature *</label>
                <input
                  type="text"
                  value={formData.temperature}
                  onChange={(e) => handleChange('temperature', e.target.value)}
                  placeholder="e.g. 24°C"
                  className={getInputClass('temperature')}
                />
                {errors.temperature ? (
                  <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.temperature}</span>
                ) : (
                  <span className="text-[10px] text-slate-400 mt-1 block">Include units (e.g. °C or °F)</span>
                )}
              </div>
            </div>

            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Site Conditions *</label>
              <input
                type="text"
                value={formData.siteConditions}
                onChange={(e) => handleChange('siteConditions', e.target.value)}
                placeholder="e.g. Dry, Muddy, Flooded access routes..."
                className={getInputClass('siteConditions')}
              />
              {errors.siteConditions && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.siteConditions}</span>}
            </div>
          </div>

          {/* Section 2: Resources */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">2. Site Resources</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1.5"><HardHat className="w-3.5 h-3.5"/> Workers on Site *</label>
                <input
                  type="number"
                  min="0"
                  value={formData.workersOnSite}
                  onChange={(e) => handleChange('workersOnSite', parseInt(e.target.value))}
                  className={getInputClass('workersOnSite')}
                />
                {errors.workersOnSite && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.workersOnSite}</span>}
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1.5"><Truck className="w-3.5 h-3.5"/> Equipment Running *</label>
                <input
                  type="number"
                  min="0"
                  value={formData.equipmentRunning}
                  onChange={(e) => handleChange('equipmentRunning', parseInt(e.target.value))}
                  className={getInputClass('equipmentRunning')}
                />
                {errors.equipmentRunning && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.equipmentRunning}</span>}
              </div>
            </div>
          </div>

          {/* Section 3: Safety & Quality */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">3. Safety & Quality</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5"/> Safety Incidents</label>
                <input
                  type="number"
                  min="0"
                  value={formData.incidents}
                  onChange={(e) => handleChange('incidents', parseInt(e.target.value))}
                  className={getInputClass('incidents')}
                />
                {errors.incidents && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.incidents}</span>}
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5"/> Non-Conformance Reports (NCR)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.ncr}
                  onChange={(e) => handleChange('ncr', parseInt(e.target.value))}
                  className={getInputClass('ncr')}
                />
                {errors.ncr && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.ncr}</span>}
              </div>
            </div>
          </div>

          {/* Section 4: Narrative */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">4. Significant Events</h4>
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Details & Observations</label>
              <textarea
                rows={4}
                value={formData.significantEvents}
                onChange={(e) => handleChange('significantEvents', e.target.value)}
                placeholder="Log major milestones, delays, deliveries, or visits..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:border-[#0B5FFF] focus:ring-1 focus:ring-[#0B5FFF]"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Optional. Summarize key activities for the day.</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button type="submit" className="gap-2 rounded-xl">
              <Save className="h-4 w-4" /> Save Daily Log
            </Button>
          </div>

        </form>
      </CardContent>
    </Card>
  );
}
