import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, CustomSelect } from '../ui';
import { 
  Sparkles, 
  Calendar, 
  TrendingUp, 
  HardHat, 
  ShieldAlert, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  X, 
  Layers, 
  FileBarChart,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { UniversalReportItem, WeeklyProgressReportData, WeeklyActivitySnapshot } from '../../types';

interface ProgressReportCompilerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (report: UniversalReportItem<WeeklyProgressReportData>) => void;
}

export function ProgressReportCompilerModal({ isOpen, onClose, onSave }: ProgressReportCompilerModalProps) {
  const { projects, compileWeeklyProgressReport, currentUserProfile } = useAppContext();

  // Date range state
  const [projectId, setProjectId] = useState(projects[0]?.id || 'PRJ-001');
  const [reportCycle, setReportCycle] = useState<'Weekly' | 'Monthly'>('Weekly');
  
  // Default to current week (last 7 days)
  const today = new Date();
  const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 3600 * 1000);
  const [startDate, setStartDate] = useState(sevenDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  // Compiled Report State
  const [compiledReport, setCompiledReport] = useState<UniversalReportItem<WeeklyProgressReportData>>(() => 
    compileWeeklyProgressReport(projects[0]?.id || 'PRJ-001', sevenDaysAgo.toISOString().split('T')[0], today.toISOString().split('T')[0])
  );

  const [isCompiled, setIsCompiled] = useState(false);

  if (!isOpen) return null;

  const handleRunCompilation = () => {
    const report = compileWeeklyProgressReport(projectId, startDate, endDate);
    setCompiledReport(report);
    setIsCompiled(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(compiledReport);
    onClose();
  };

  const setPresetWeek = (offsetWeeks: number = 0) => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff - (offsetWeeks * 7)));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const sStr = monday.toISOString().split('T')[0];
    const eStr = sunday.toISOString().split('T')[0];
    setStartDate(sStr);
    setEndDate(eStr);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[#0B5FFF] flex items-center justify-center">
              <FileBarChart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Compile Progress Report (WPR / MPR)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated multi-source aggregation from daily logs, activities, timesheets, and QA clearances
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Compilation Criteria Card */}
          <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 space-y-4">
            <div className="flex items-center justify-between border-b border-blue-200/80 dark:border-blue-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#0B5FFF]" />
                <span>1. Select Aggregation Period & Target Project</span>
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPresetWeek(0)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                >
                  This Week
                </button>
                <button
                  type="button"
                  onClick={() => setPresetWeek(1)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                >
                  Last Week
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Project</label>
                <select 
                  value={projectId} 
                  onChange={e => setProjectId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Report Frequency</label>
                <select 
                  value={reportCycle} 
                  onChange={e => setReportCycle(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold text-[#0B5FFF]"
                >
                  <option value="Weekly">Weekly Progress Report (WPR)</option>
                  <option value="Monthly">Monthly Progress Report (MPR)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Start Date</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">End Date</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                onClick={handleRunCompilation}
                className="gap-2 bg-[#0B5FFF] hover:bg-blue-700 text-white rounded-xl text-xs font-bold px-5 h-10 shadow-md"
              >
                <Sparkles className="h-4 w-4" /> Auto-Compile Data From Site Logs
              </Button>
            </div>
          </div>

          {/* Compiled Output Preview & Customization */}
          <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span>2. Key Performance Indicators & S-Curve Metrics</span>
              </h3>
              <Badge variant="outline" className="font-mono text-[10px] text-[#0B5FFF]">
                {compiledReport.documentNumber}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Weekly Physical Progress</span>
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-xl font-bold text-emerald-600">{compiledReport.data.actualWeeklyProgressPct}%</span>
                  <span className="text-xs text-slate-400">Plan: {compiledReport.data.plannedWeeklyProgressPct}%</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Cumulative Progress</span>
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-xl font-bold text-[#0B5FFF]">{compiledReport.data.cumulativeActualProgressPct}%</span>
                  <span className="text-xs text-slate-400">Plan: {compiledReport.data.cumulativePlannedProgressPct}%</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Safe Man-Hours Worked</span>
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">{compiledReport.data.safeManHoursThisWeek.toLocaleString()} hrs</span>
                  <span className="text-xs text-slate-400">Peak: {compiledReport.data.workersPeakCount} pax</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">HSE & QA Clearances</span>
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-xl font-bold text-emerald-600">{compiledReport.data.inspectionsConducted} QA Approved</span>
                  <span className="text-xs text-rose-500">{compiledReport.data.incidentsCount} Incidents</span>
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Executive Weekly Summary & Highlights
              </label>
              <textarea
                rows={3}
                value={compiledReport.data.executiveSummary}
                onChange={e => setCompiledReport({
                  ...compiledReport,
                  data: { ...compiledReport.data, executiveSummary: e.target.value }
                })}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white font-sans"
              />
            </div>
          </div>

          {/* Activities Breakdown Table */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-[#0B5FFF]" />
              <span>3. Activity Work Package Progress Snapshot ({compiledReport.data.activities.length} Packages)</span>
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                    <th className="p-2.5">Activity ID</th>
                    <th className="p-2.5">Activity Description</th>
                    <th className="p-2.5">Work Package</th>
                    <th className="p-2.5 text-right">Planned (Week)</th>
                    <th className="p-2.5 text-right">Actual (Week)</th>
                    <th className="p-2.5 text-right">Cumulative %</th>
                    <th className="p-2.5 text-center">Variance</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {compiledReport.data.activities.map(act => (
                    <tr key={act.activityId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-white">{act.activityId}</td>
                      <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">{act.activityName}</td>
                      <td className="p-2.5 text-slate-500">{act.workPackage}</td>
                      <td className="p-2.5 text-right font-mono">{act.plannedThisWeek} {act.unit}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-600">{act.actualThisWeek} {act.unit}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-[#0B5FFF]">{act.cumulativeProgressPct}%</td>
                      <td className={`p-2.5 text-center font-mono font-bold ${act.variancePct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {act.variancePct >= 0 ? `+${act.variancePct}%` : `${act.variancePct}%`}
                      </td>
                      <td className="p-2.5">
                        <Badge variant="outline" className="text-[10px] bg-slate-100 dark:bg-slate-800">
                          {act.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl font-semibold">
              Cancel
            </Button>
            <Button type="submit" className="bg-[#0B5FFF] hover:bg-blue-700 text-white rounded-xl font-semibold px-6 shadow-md">
              Publish Progress Report
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
