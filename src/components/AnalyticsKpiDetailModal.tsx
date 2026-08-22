import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Activity as ActivityIcon, 
  Package, 
  AlertTriangle, 
  Users, 
  Truck, 
  ChevronRight, 
  Search, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  Layers,
  HardHat,
  Calendar,
  Filter,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  FileSpreadsheet
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Activity, MaterialInventory, Employee, Equipment } from '../types';
import { Button, Badge, Card } from './ui';
import { format } from 'date-fns';

export type AnalyticsKpiType = 'overall' | 'in-progress' | 'materials' | 'critical' | 'workforce' | 'fleet';

interface AnalyticsKpiDetailModalProps {
  type: AnalyticsKpiType | null;
  onClose: () => void;
  onSelectActivity?: (activity: Activity) => void;
}

export function AnalyticsKpiDetailModal({ type, onClose, onSelectActivity }: AnalyticsKpiDetailModalProps) {
  const navigate = useNavigate();
  const { 
    activities = [], 
    materials = [], 
    materialReceipts = [],
    materialUsages = [],
    employees = [], 
    equipment = [],
    labourAllocations = []
  } = useAppContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  // Handle activity selection
  const handleActivityClick = (act: Activity) => {
    onClose();
    if (onSelectActivity) {
      onSelectActivity(act);
    } else {
      navigate('/activities');
    }
  };

  // --- Content Renderers ---

  // 1. Overall Progress Details
  const renderOverallProgress = () => {
    const totalTasks = activities.length;
    const completedTasks = activities.filter(a => a.status === 'Completed').length;
    const inProgressTasks = activities.filter(a => a.status === 'In Progress').length;
    const avgProgress = totalTasks > 0 ? Math.round(activities.reduce((s, a) => s + (a.progress || 0), 0) / totalTasks) : 0;

    const disciplineMap: Record<string, { total: number; sum: number; completed: number }> = {};
    activities.forEach(a => {
      const disc = a.discipline || 'Civil';
      if (!disciplineMap[disc]) disciplineMap[disc] = { total: 0, sum: 0, completed: 0 };
      disciplineMap[disc].total += 1;
      disciplineMap[disc].sum += (a.status === 'Completed' ? 100 : (a.progress || 0));
      if (a.status === 'Completed') disciplineMap[disc].completed += 1;
    });

    const disciplineStats = Object.entries(disciplineMap).map(([name, stats]) => ({
      name,
      avg: Math.round(stats.sum / stats.total),
      total: stats.total,
      completed: stats.completed
    })).sort((a, b) => b.total - a.total);

    return (
      <div className="space-y-6">
        {/* Quick KPI Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Average Progress</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-[#0B5FFF] font-mono">{avgProgress}%</span>
              <TrendingUp className="h-5 w-5 text-[#0B5FFF]" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Completed Tasks</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{completedTasks}</span>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">In-Progress Work</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">{inProgressTasks}</span>
              <ActivityIcon className="h-5 w-5 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Discipline Breakdown */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-[#0B5FFF]" />
            <span>Progress by Workstream Discipline</span>
          </h4>
          <div className="space-y-2.5">
            {disciplineStats.map(d => (
              <div key={d.name} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-900 dark:text-white">{d.name}</span>
                  <span className="text-[#0B5FFF] font-mono">{d.avg}% • {d.completed}/{d.total} Done</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full rounded-full bg-[#0B5FFF] transition-all duration-500" style={{ width: `${d.avg}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button onClick={() => { onClose(); navigate('/activities'); }} className="bg-[#0B5FFF] text-white text-xs font-bold gap-1 rounded-xl">
            <span>Manage All Activities</span> <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // 2. Active In-Progress Tasks
  const renderInProgressTasks = () => {
    const inProgress = activities.filter(a => a.status === 'In Progress');
    const filtered = inProgress.filter(a => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || (a.discipline && a.discipline.toLowerCase().includes(q));
    });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search active work fronts by name, ID or discipline..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-[#0B5FFF]"
            />
          </div>
          <span className="text-xs font-bold text-slate-500 font-mono shrink-0">
            {filtered.length} Active Sites
          </span>
        </div>

        <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
          {filtered.map(act => (
            <div
              key={act.id}
              onClick={() => handleActivityClick(act)}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#0B5FFF] hover:shadow-md cursor-pointer transition-all flex flex-col gap-2.5 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{act.id}</span>
                    {act.discipline && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-[#0B5FFF] border border-blue-200 dark:bg-blue-950/60 dark:border-blue-900">
                        {act.discipline}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5 group-hover:text-[#0B5FFF] transition-colors line-clamp-1">
                    {act.name}
                  </h4>
                </div>
                <Badge variant="default" className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 shrink-0">
                  In Progress
                </Badge>
              </div>

              {/* Progress Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <span>Current Completion</span>
                  <span className="font-mono text-[#0B5FFF]">{act.progress || 0}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-[#0B5FFF]" style={{ width: `${act.progress || 0}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Target: {act.finishDate || 'Ongoing'}
                </span>
                <span className="text-[#0B5FFF] font-semibold flex items-center gap-0.5 group-hover:underline">
                  Open Activity <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400">
              No matching active in-progress tasks found.
            </div>
          )}
        </div>
      </div>
    );
  };

  // 3. Materials Inventory & Burn Details
  const renderMaterialDetails = () => {
    const totalReceived = materials.reduce((sum, m) => sum + (m.receivedQuantity || m.estimatedQuantity || 0), 0);
    const totalUsed = materials.reduce((sum, m) => sum + (m.usedQuantity || 0), 0);
    const inStockTotal = Math.max(totalReceived - totalUsed, 0);

    const filtered = materials.filter(m => {
      if (filterCategory !== 'all' && m.category !== filterCategory) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return m.name.toLowerCase().includes(q) || (m.category && m.category.toLowerCase().includes(q));
      }
      return true;
    });

    const categories = Array.from(new Set(materials.map(m => m.category).filter(Boolean)));

    return (
      <div className="space-y-5">
        {/* Metric Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Consumed</span>
            <span className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono">{totalUsed.toLocaleString()} units</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Inbound Rec'd</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{totalReceived.toLocaleString()} units</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">In-Stock Balance</span>
            <span className="text-xl font-black text-[#0B5FFF] font-mono">{inStockTotal.toLocaleString()} units</span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search materials inventory..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-[#0B5FFF]"
            />
          </div>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="h-9 px-3 text-xs font-semibold bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Material Items Table / Cards */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {filtered.map(mat => {
            const used = mat.usedQuantity || 0;
            const rec = mat.receivedQuantity || mat.estimatedQuantity || 0;
            const avail = Math.max(rec - used, 0);
            const burnPct = rec > 0 ? Math.round((used / rec) * 100) : 0;

            return (
              <div key={mat.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{mat.name}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {mat.category || 'General'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 font-mono">
                    <span>Used: <strong className="text-purple-600">{used}</strong> {mat.unit}</span>
                    <span>Rec'd: <strong className="text-emerald-600">{rec}</strong> {mat.unit}</span>
                    <span>Stock: <strong className="text-blue-600">{avail}</strong> {mat.unit}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-black font-mono text-slate-900 dark:text-white block">{burnPct}%</span>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Burn Rate</span>
                  </div>
                  <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full rounded-full bg-purple-600" style={{ width: `${Math.min(burnPct, 100)}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button onClick={() => { onClose(); navigate('/materials'); }} className="bg-[#0B5FFF] text-white text-xs font-bold gap-1 rounded-xl">
            <span>Open Material Management</span> <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // 4. Critical & Blocked Tasks Details
  const renderCriticalBlocked = () => {
    const blocked = activities.filter(a => a.status === 'Blocked');
    const overdue = activities.filter(a => a.status !== 'Completed' && a.finishDate && a.finishDate < todayStr);
    const waiting = activities.filter(a => a.status === 'Waiting');

    return (
      <div className="space-y-5">
        {blocked.length === 0 && overdue.length === 0 && waiting.length === 0 ? (
          <div className="p-8 text-center bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">All Systems Clear!</h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 max-w-sm mx-auto">
              There are no blocked, delayed, or overdue activities currently on the critical path.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            {/* Blocked Tasks */}
            {blocked.map(act => (
              <div
                key={act.id}
                onClick={() => handleActivityClick(act)}
                className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 space-y-2 cursor-pointer hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-rose-500">BLOCKED TASK • {act.id}</span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
                      {act.name}
                    </h4>
                  </div>
                  <Badge variant="danger" className="text-[10px] font-bold uppercase bg-rose-600 text-white">
                    Blocked
                  </Badge>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-rose-600">Active Constraint:</span> {act.constraints?.[0] || 'Awaiting site clearance or predecessor task completion.'}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Discipline: {act.discipline || 'General'}</span>
                  <span className="text-rose-600 font-semibold flex items-center gap-1 group-hover:underline">
                    Inspect & Resolve <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ))}

            {/* Overdue Tasks */}
            {overdue.map(act => (
              <div
                key={act.id}
                onClick={() => handleActivityClick(act)}
                className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 space-y-2 cursor-pointer hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-600">SCHEDULE OVERDUE • {act.id}</span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                      {act.name}
                    </h4>
                  </div>
                  <Badge variant="warning" className="text-[10px] font-bold uppercase bg-amber-500 text-white">
                    Overdue
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Target Finish: <strong className="text-rose-600">{act.finishDate}</strong></span>
                  <span>Progress: <strong>{act.progress || 0}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button onClick={() => { onClose(); navigate('/activities'); }} className="bg-[#0B5FFF] text-white text-xs font-bold gap-1 rounded-xl">
            <span>View All Activities</span> <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // 5. Daily Workforce & Personnel Details
  const renderWorkforceDetails = () => {
    const activeStaff = employees.filter(e => e.status === 'Active' || !e.status);
    const filtered = activeStaff.filter(e => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) || (e.position && e.position.toLowerCase().includes(q)) || (e.department && e.department.toLowerCase().includes(q));
    });

    const tradeCounts: Record<string, number> = {};
    activeStaff.forEach(e => {
      const pos = e.position || 'Site Personnel';
      tradeCounts[pos] = (tradeCounts[pos] || 0) + 1;
    });

    return (
      <div className="space-y-5">
        {/* Trade Distribution Pill Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {Object.entries(tradeCounts).slice(0, 6).map(([trade, count]) => (
            <span key={trade} className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
              {trade}: <strong className="text-[#0B5FFF]">{count}</strong>
            </span>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search active personnel by name, role or department..."
            className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-[#0B5FFF]"
          />
        </div>

        {/* Personnel Roster List */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {filtered.map(emp => (
            <div key={emp.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0 text-xs font-mono">
                  {emp.firstName?.[0]}{emp.lastName?.[0]}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {emp.firstName} {emp.lastName}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    {emp.position || 'Site Worker'} • {emp.department || 'Civil Ops'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Active On-Site
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button onClick={() => { onClose(); navigate('/employees'); }} className="bg-[#0B5FFF] text-white text-xs font-bold gap-1 rounded-xl">
            <span>Manage Employee Directory</span> <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // 6. Operating Fleet & Heavy Machinery Details
  const renderFleetDetails = () => {
    const operating = equipment.filter(e => e.status === 'Operating');
    const totalCount = equipment.length;

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Operating Units</span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">{operating.length} machines</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Fleet Size</span>
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono">{totalCount} units</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Fleet Utilization</span>
            <span className="text-xl font-black text-[#0B5FFF] font-mono">{totalCount > 0 ? Math.round((operating.length / totalCount) * 100) : 0}%</span>
          </div>
        </div>

        {/* Equipment List */}
        <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
          {equipment.map(eq => (
            <div key={eq.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                  <Truck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">{eq.name}</h4>
                  <p className="text-[11px] text-slate-500">
                    {eq.type || eq.category || 'Heavy Machinery'} • Operator: {eq.operator || 'Assigned Driver'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white block">{eq.engineHours || 0} hrs</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Hour Meter</span>
                </div>
                <Badge variant={eq.status === 'Operating' ? 'default' : 'outline'} className={eq.status === 'Operating' ? 'bg-amber-500 text-white' : ''}>
                  {eq.status || 'Active'}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button onClick={() => { onClose(); navigate('/equipment'); }} className="bg-[#0B5FFF] text-white text-xs font-bold gap-1 rounded-xl">
            <span>Manage Equipment Fleet</span> <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (!type) return null;

  const getModalHeader = () => {
    switch (type) {
      case 'overall':
        return { title: 'Overall Project Completion Breakdown', subtitle: 'Discipline completion curves and baseline milestone alignment', icon: TrendingUp, iconColor: 'text-[#0B5FFF]', iconBg: 'bg-blue-100 dark:bg-blue-950/60' };
      case 'in-progress':
        return { title: 'Active In-Progress Work Fronts', subtitle: 'Live execution tracking across active site activities', icon: ActivityIcon, iconColor: 'text-[#0B5FFF]', iconBg: 'bg-blue-100 dark:bg-blue-950/60' };
      case 'materials':
        return { title: 'Materials Inflow & Consumption Intelligence', subtitle: 'Cumulative burn rate, warehouse receipts and inventory stock', icon: Package, iconColor: 'text-purple-600', iconBg: 'bg-purple-100 dark:bg-purple-950/60' };
      case 'critical':
        return { title: 'Critical Path & Blocked Activity Log', subtitle: 'Active constraints, overdue timelines, and schedule bottlenecks', icon: AlertTriangle, iconColor: 'text-rose-600', iconBg: 'bg-rose-100 dark:bg-rose-950/60' };
      case 'workforce':
        return { title: 'Daily Site Workforce & Trade Allocations', subtitle: 'Active personnel roster, trade distribution, and crew assignments', icon: Users, iconColor: 'text-indigo-600', iconBg: 'bg-indigo-100 dark:bg-indigo-950/60' };
      case 'fleet':
        return { title: 'Heavy Machinery & Fleet Plant Utilization', subtitle: 'Active machine hour meter tracking and fleet readiness', icon: Truck, iconColor: 'text-amber-600', iconBg: 'bg-amber-100 dark:bg-amber-950/60' };
    }
  };

  const header = getModalHeader();
  const HeaderIcon = header.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col animate-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl ${header.iconBg} ${header.iconColor} flex items-center justify-center shrink-0 shadow-2xs`}>
              <HeaderIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {header.title}
              </h3>
              <p className="text-xs text-slate-500 truncate">
                {header.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {type === 'overall' && renderOverallProgress()}
          {type === 'in-progress' && renderInProgressTasks()}
          {type === 'materials' && renderMaterialDetails()}
          {type === 'critical' && renderCriticalBlocked()}
          {type === 'workforce' && renderWorkforceDetails()}
          {type === 'fleet' && renderFleetDetails()}
        </div>

      </div>
    </div>
  );
}

export default AnalyticsKpiDetailModal;
