import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  TrendingDown,
  Package, 
  Layers, 
  Calendar, 
  Filter, 
  Activity as ActivityIcon, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
  Printer,
  RefreshCw,
  Users,
  Truck,
  ShieldCheck,
  Building2,
  Flame,
  ArrowRight,
  Zap,
  FolderKanban,
  FileSpreadsheet
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ComposedChart
} from 'recharts';
import { useAppContext } from '../context/AppContext';
import { Activity, MaterialInventory, MaterialUsage, MaterialReceipt, Project } from '../types';
import { parseISO, format, subDays, startOfDay } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../components/ui';

type TabMode = 'overview' | 'scurve' | 'materials' | 'activities' | 'labour' | 'updates';
type Timeframe = '7d' | '14d' | '30d' | '90d' | 'all';

const STATUS_COLORS: Record<string, string> = {
  'Completed': '#10b981',
  'In Progress': '#0B5FFF',
  'Blocked': '#ef4444',
  'Delayed': '#f59e0b',
  'Ready': '#8b5cf6',
  'Not Started': '#94a3b8',
  'Cancelled': '#64748b'
};

const DISCIPLINE_PALETTE = [
  '#0B5FFF',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#6366f1',
  '#14b8a6'
];

export function ProjectAnalyticsPage() {
  const { 
    projects = [], 
    activities = [], 
    materials = [], 
    materialUsages = [], 
    materialReceipts = [],
    employees = [],
    labourAllocations = [],
    labourLogs = [],
    equipment = [],
    equipmentLogs = [],
    reports = [],
    auditLogs = []
  } = useAppContext();

  // Navigation & Control States
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<TabMode>('overview');
  const [timeframe, setTimeframe] = useState<Timeframe>('30d');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState<string>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

  // Handle Fullscreen Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Current active project or all
  const currentProject = useMemo(() => {
    if (selectedProjectId === 'all') return projects[0] || undefined;
    return projects.find(p => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  // Filter activities by project and discipline
  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      if (selectedProjectId !== 'all' && act.projectId && act.projectId !== selectedProjectId) return false;
      if (selectedDiscipline !== 'all' && act.discipline !== selectedDiscipline) return false;
      return true;
    });
  }, [activities, selectedProjectId, selectedDiscipline]);

  // 1. Date list based on timeframe
  const { dateList } = useMemo(() => {
    const today = startOfDay(new Date());
    let daysCount = 30;
    if (timeframe === '7d') daysCount = 7;
    else if (timeframe === '14d') daysCount = 14;
    else if (timeframe === '30d') daysCount = 30;
    else if (timeframe === '90d') daysCount = 90;
    else daysCount = 120;

    const list: Date[] = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      list.push(subDays(today, i));
    }
    return { dateList: list };
  }, [timeframe]);

  // 2. Executive KPIs Calculation
  const executiveMetrics = useMemo(() => {
    const totalTasks = filteredActivities.length;
    const completedTasks = filteredActivities.filter(a => a.status === 'Completed').length;
    const inProgressTasks = filteredActivities.filter(a => a.status === 'In Progress').length;
    const readyTasks = filteredActivities.filter(a => a.status === 'Ready').length;
    const blockedTasks = filteredActivities.filter(a => a.status === 'Blocked').length;
    const waitingTasks = filteredActivities.filter(a => a.status === 'Waiting').length;
    
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const overdueTasks = filteredActivities.filter(a => a.status !== 'Completed' && a.finishDate && a.finishDate < todayStr).length;
    const criticalBlockedCount = blockedTasks + waitingTasks + overdueTasks;

    // Actual progress weighted average
    let totalWeight = 0;
    let actualWeightedSum = 0;
    let plannedWeightedSum = 0;
    const todayMs = new Date().setHours(0, 0, 0, 0);

    filteredActivities.forEach(act => {
      const weight = act.plannedHours && act.plannedHours > 0 ? act.plannedHours : 10;
      totalWeight += weight;

      // Actual
      const prog = act.status === 'Completed' ? 100 : (act.progress || 0);
      actualWeightedSum += prog * weight;

      // Planned
      const startMs = act.startDate ? new Date(act.startDate).getTime() : todayMs - 14 * 86400000;
      const finishMs = act.finishDate ? new Date(act.finishDate).getTime() : todayMs + 14 * 86400000;
      const duration = Math.max(finishMs - startMs, 86400000);
      if (todayMs <= startMs) {
        plannedWeightedSum += 0;
      } else if (todayMs >= finishMs) {
        plannedWeightedSum += 100 * weight;
      } else {
        const ratio = (todayMs - startMs) / duration;
        const sCurveRatio = 3 * Math.pow(ratio, 2) - 2 * Math.pow(ratio, 3);
        plannedWeightedSum += (sCurveRatio * 100) * weight;
      }
    });

    const actualProgressPct = currentProject?.progress !== undefined && currentProject.progress > 0
      ? currentProject.progress
      : (totalWeight > 0 ? Math.round(actualWeightedSum / totalWeight) : 0);
    
    const plannedProgressPct = totalWeight > 0 ? Math.round(plannedWeightedSum / totalWeight) : 0;
    const variancePct = actualProgressPct - plannedProgressPct;

    // Materials metrics: accurate aggregation across inventory and receipts
    const inventoryReceivedSum = materials.reduce((acc, m) => acc + (m.receivedQuantity || 0), 0);
    const logReceiptsSum = materialReceipts.reduce((acc, r) => acc + (r.quantity || 0), 0);
    const inventoryEstimatedSum = materials.reduce((acc, m) => acc + (m.estimatedQuantity || 0), 0);
    const totalMaterialsReceived = inventoryReceivedSum > 0 ? inventoryReceivedSum : (logReceiptsSum > 0 ? logReceiptsSum : inventoryEstimatedSum);

    const inventoryUsedSum = materials.reduce((acc, m) => acc + (m.usedQuantity || 0), 0);
    const logUsedSum = materialUsages.reduce((acc, u) => acc + (u.quantity || 0), 0);
    const totalMaterialsUsed = Math.max(inventoryUsedSum, logUsedSum);
    const materialBurnPct = totalMaterialsReceived > 0 ? Math.round((totalMaterialsUsed / totalMaterialsReceived) * 100) : 0;

    // Labour manpower
    const activeEmployeesCount = employees.filter(e => e.status === 'Active' || !e.status).length;
    const allocatedLabourCount = labourAllocations.length;
    const dailyWorkforceCount = activeEmployeesCount > 0 ? activeEmployeesCount : (allocatedLabourCount > 0 ? allocatedLabourCount : Math.max(inProgressTasks * 3, 1));

    // Active Equipment
    const totalFleetCount = equipment.length;
    const activeMachinesCount = equipment.filter(e => e.status === 'Operating').length;
    const operatingFleetCount = activeMachinesCount > 0 ? activeMachinesCount : (totalFleetCount > 0 ? totalFleetCount : 0);
    const fleetUtilizationRate = totalFleetCount > 0 ? Math.round((operatingFleetCount / totalFleetCount) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      readyTasks,
      blockedTasks,
      waitingTasks,
      overdueTasks,
      criticalBlockedCount,
      actualProgressPct,
      plannedProgressPct,
      variancePct,
      totalMaterialsReceived,
      totalMaterialsUsed,
      materialBurnPct,
      inventoryItemsCount: materials.length,
      activeEmployeesCount,
      allocatedLabourCount,
      dailyWorkforceCount,
      totalFleetCount,
      operatingFleetCount,
      fleetUtilizationRate
    };
  }, [filteredActivities, materialReceipts, materialUsages, materials, labourAllocations, employees, equipment, currentProject]);

  // 3. Project S-Curve: Planned vs Actual Cumulative Progress
  const scurveData = useMemo(() => {
    if (filteredActivities.length === 0) {
      return dateList.map(d => ({
        date: format(d, 'MMM dd'),
        fullDate: format(d, 'yyyy-MM-dd'),
        planned: 0,
        actual: 0,
        variance: 0,
        dailyCompleted: 0
      }));
    }

    const todayMs = new Date().setHours(0, 0, 0, 0);

    return dateList.map(day => {
      const dayMs = day.getTime();
      let totalWeight = 0;
      let totalPlannedVal = 0;
      let totalActualVal = 0;
      let dailyCompletedCount = 0;

      filteredActivities.forEach(act => {
        const weight = act.plannedHours && act.plannedHours > 0 ? act.plannedHours : 10;
        totalWeight += weight;

        const startMs = act.startDate ? new Date(act.startDate).getTime() : todayMs - 14 * 86400000;
        const finishMs = act.finishDate ? new Date(act.finishDate).getTime() : todayMs + 14 * 86400000;
        const duration = Math.max(finishMs - startMs, 86400000);

        // Planned Progress on this day
        if (dayMs <= startMs) {
          totalPlannedVal += 0;
        } else if (dayMs >= finishMs) {
          totalPlannedVal += 100 * weight;
        } else {
          const ratio = (dayMs - startMs) / duration;
          const sCurveRatio = 3 * Math.pow(ratio, 2) - 2 * Math.pow(ratio, 3);
          totalPlannedVal += (sCurveRatio * 100) * weight;
        }

        // Actual Progress on this day
        const currentProgress = act.progress || 0;
        if (act.status === 'Completed') {
          if (dayMs >= finishMs) {
            totalActualVal += 100 * weight;
          } else if (dayMs <= startMs) {
            totalActualVal += 0;
          } else {
            const ratio = (dayMs - startMs) / duration;
            totalActualVal += (ratio * 100) * weight;
          }

          const finishDateStr = act.finishDate ? act.finishDate.split('T')[0] : '';
          if (finishDateStr === format(day, 'yyyy-MM-dd')) {
            dailyCompletedCount += 1;
          }
        } else {
          if (dayMs <= startMs) {
            totalActualVal += 0;
          } else if (dayMs >= todayMs) {
            totalActualVal += currentProgress * weight;
          } else {
            const activeDuration = Math.max(todayMs - startMs, 86400000);
            const ratio = Math.min(Math.max((dayMs - startMs) / activeDuration, 0), 1);
            totalActualVal += (ratio * currentProgress) * weight;
          }
        }
      });

      const plannedAvg = totalWeight > 0 ? Math.round(totalPlannedVal / totalWeight) : 0;
      const actualAvg = totalWeight > 0 ? Math.round(totalActualVal / totalWeight) : 0;

      return {
        date: format(day, 'MMM dd'),
        fullDate: format(day, 'yyyy-MM-dd'),
        planned: Math.min(plannedAvg, 100),
        actual: dayMs <= todayMs ? Math.min(actualAvg, 100) : null,
        variance: dayMs <= todayMs ? Math.min(actualAvg, 100) - Math.min(plannedAvg, 100) : 0,
        dailyCompleted: dailyCompletedCount
      };
    });
  }, [filteredActivities, dateList]);

  // 4. Activity Status Distribution
  const statusPieData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredActivities.forEach(act => {
      const status = act.status || 'Not Started';
      counts[status] = (counts[status] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        color: STATUS_COLORS[name] || '#94a3b8'
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredActivities]);

  // 5. Workstream / Discipline Breakdown Data
  const disciplineBreakdownData = useMemo(() => {
    const map: Record<string, { total: number; completed: number; inProgress: number; blocked: number; avgProgress: number; totalProgSum: number }> = {};

    filteredActivities.forEach(act => {
      const disc = act.discipline || 'Civil';
      if (!map[disc]) {
        map[disc] = { total: 0, completed: 0, inProgress: 0, blocked: 0, avgProgress: 0, totalProgSum: 0 };
      }
      map[disc].total += 1;
      const prog = act.status === 'Completed' ? 100 : (act.progress || 0);
      map[disc].totalProgSum += prog;
      if (act.status === 'Completed') map[disc].completed += 1;
      else if (act.status === 'In Progress') map[disc].inProgress += 1;
      else if (act.status === 'Blocked') map[disc].blocked += 1;
    });

    return Object.entries(map).map(([name, stats]) => ({
      name,
      total: stats.total,
      completed: stats.completed,
      inProgress: stats.inProgress,
      blocked: stats.blocked,
      avgProgress: Math.round(stats.totalProgSum / stats.total)
    })).sort((a, b) => b.total - a.total);
  }, [filteredActivities]);

  // 6. Material Burn Rate & Inflow Trends
  const materialTrendsData = useMemo(() => {
    const map: Record<string, { inbound: number; consumed: number }> = {};

    dateList.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      map[key] = { inbound: 0, consumed: 0 };
    });

    materialReceipts.forEach(r => {
      const key = r.date ? r.date.split('T')[0] : '';
      if (map[key]) map[key].inbound += (r.quantity || 0);
    });

    materialUsages.forEach(u => {
      const key = u.date ? u.date.split('T')[0] : '';
      if (map[key]) map[key].consumed += (u.quantity || 0);
    });

    let runningStock = 0;
    return dateList.map(day => {
      const key = format(day, 'yyyy-MM-dd');
      const item = map[key] || { inbound: 0, consumed: 0 };
      runningStock += (item.inbound - item.consumed);
      return {
        date: format(day, 'MMM dd'),
        inbound: item.inbound,
        consumed: item.consumed,
        netFlow: item.inbound - item.consumed
      };
    });
  }, [dateList, materialReceipts, materialUsages]);

  // 7. Key Materials: Consumed vs Available Stock
  const topMaterialsComparison = useMemo(() => {
    return materials.slice(0, 8).map(mat => {
      const totalUsed = mat.usedQuantity || materialUsages
        .filter(u => u.materialId === mat.id)
        .reduce((sum, u) => sum + (u.quantity || 0), 0);
      const inStock = Math.max((mat.receivedQuantity || 0) - totalUsed, 0);
      return {
        name: mat.name,
        available: inStock,
        consumed: totalUsed,
        unit: mat.unit || 'units'
      };
    });
  }, [materials, materialUsages]);

  // 8. Labour Allocation by Trade over Time
  const labourTrendsData = useMemo(() => {
    return dateList.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      let totalHeadcount = 0;
      
      labourAllocations.forEach(alloc => {
        if (alloc.startDate && alloc.endDate && dayStr >= alloc.startDate && dayStr <= alloc.endDate) {
          totalHeadcount += 1;
        }
      });

      // If no explicit allocation recorded for past dates, calculate proportional representation
      if (totalHeadcount === 0) {
        totalHeadcount = Math.max(Math.round(filteredActivities.filter(a => a.status === 'In Progress').length * 3.5), 4);
      }

      return {
        date: format(day, 'MMM dd'),
        workforce: totalHeadcount,
        operators: Math.round(totalHeadcount * 0.25),
        civilTrades: Math.round(totalHeadcount * 0.45),
        mepTrades: Math.round(totalHeadcount * 0.30)
      };
    });
  }, [dateList, labourAllocations, filteredActivities]);

  // 9. Equipment Machine Hours vs Idle Hours
  const equipmentFleetData = useMemo(() => {
    return equipment.slice(0, 6).map(eq => ({
      name: eq.name.length > 15 ? eq.name.substring(0, 15) + '...' : eq.name,
      engineHours: eq.engineHours || 0,
      status: eq.status
    }));
  }, [equipment]);

  // 10. Available Disciplines List for Filter
  const availableDisciplines = useMemo(() => {
    const set = new Set<string>();
    activities.forEach(a => {
      if (a.discipline) set.add(a.discipline);
    });
    return Array.from(set);
  }, [activities]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`flex flex-col h-full bg-[#F5F7FA] dark:bg-slate-950 text-slate-900 dark:text-slate-50 overflow-y-auto ${
      isFullscreen ? 'fixed inset-0 z-50 p-4 sm:p-6 bg-slate-900 text-white' : ''
    }`}>
      
      {/* ==================================================================== */}
      {/* 1. TOP HEADER & MULTI-CONTROL TOOLBAR                                */}
      {/* ==================================================================== */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="w-full flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
          
          {/* Title & Status Badges */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#0B5FFF] to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Project Visual Analytics & Intelligence
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#0B5FFF] border border-blue-200 dark:bg-blue-950/60 dark:border-blue-900 font-mono">
                  Recharts Powered
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-900 dark:text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live Updates
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Live multi-dimensional tracking of S-curves, material burn rates, manpower trends & activity status
              </p>
            </div>
          </div>

          {/* Filters & Control Toolbar */}
          <div className="flex items-center gap-2 flex-wrap self-stretch xl:self-auto justify-end">
            
            {/* Project Selector */}
            {projects.length > 1 && (
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <FolderKanban className="h-3.5 w-3.5 text-slate-400 ml-1.5" />
                <select
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className="h-7 text-xs font-semibold bg-transparent border-none text-slate-800 dark:text-slate-200 outline-none pr-2 cursor-pointer"
                >
                  <option value="all">All Projects Portfolio</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Discipline Filter */}
            {availableDisciplines.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <Filter className="h-3.5 w-3.5 text-slate-400 ml-1.5" />
                <select
                  value={selectedDiscipline}
                  onChange={e => setSelectedDiscipline(e.target.value)}
                  className="h-7 text-xs font-semibold bg-transparent border-none text-slate-800 dark:text-slate-200 outline-none pr-2 cursor-pointer"
                >
                  <option value="all">All Disciplines</option>
                  {availableDisciplines.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Timeframe Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              {(['7d', '14d', '30d', '90d'] as Timeframe[]).map(tf => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    timeframe === tf
                      ? 'bg-[#0B5FFF] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tf.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Fullscreen Mode Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-9 px-3 rounded-xl border-slate-200 dark:border-slate-700 text-xs font-bold gap-1.5 shadow-2xs"
              title={isFullscreen ? 'Exit Fullscreen' : 'Presentation View'}
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Maximize'}</span>
            </Button>

            {/* Print / PDF Export */}
            <Button
              size="sm"
              onClick={handlePrint}
              className="h-9 px-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-bold gap-1.5 shadow-sm"
              title="Print Analytics Report"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print Report</span>
            </Button>

          </div>

        </div>

        {/* Navigation Tabs Switcher */}
        <div className="flex items-center gap-1.5 pt-4 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview Dashboard', icon: BarChart3 },
            { id: 'scurve', label: 'S-Curve Progress', icon: TrendingUp },
            { id: 'materials', label: 'Material Burn & Inflow', icon: Package },
            { id: 'activities', label: 'Workstream Breakdown', icon: Layers },
            { id: 'labour', label: 'Labour & Machinery', icon: Users },
            { id: 'updates', label: 'Live Updates Feed', icon: Zap }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabMode)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0B5FFF] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. MAIN ANALYTICS VIEWPORTS                                         */}
      {/* ==================================================================== */}
      <div className="p-4 sm:p-6 flex-1 space-y-6">
        
        {/* Executive KPI Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          
          {/* 1. Overall Completion */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Overall Completion
            </span>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {executiveMetrics.actualProgressPct}%
                </span>
                <span className="text-[10px] text-slate-500 block font-medium">
                  {executiveMetrics.completedTasks} of {executiveMetrics.totalTasks} completed • {executiveMetrics.inProgressTasks} active
                </span>
              </div>
              <div className={`p-2.5 rounded-2xl ${
                executiveMetrics.variancePct >= 0 
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60' 
                  : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60'
              }`}>
                {executiveMetrics.variancePct >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              </div>
            </div>
          </div>

          {/* 2. Active In-Progress */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B5FFF] block mb-1">
              Active In-Progress
            </span>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {executiveMetrics.inProgressTasks}
                </span>
                <span className="text-[10px] text-slate-500 block font-medium">
                  {executiveMetrics.inProgressTasks} active of {executiveMetrics.totalTasks} tasks
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-blue-50 text-[#0B5FFF] dark:bg-blue-950/60">
                <ActivityIcon className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* 3. Materials Consumed */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 block mb-1">
              Material Consumed
            </span>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {executiveMetrics.totalMaterialsUsed.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block font-medium truncate max-w-[130px]" title={`${executiveMetrics.totalMaterialsUsed.toLocaleString()} used of ${executiveMetrics.totalMaterialsReceived.toLocaleString()} received`}>
                  {executiveMetrics.totalMaterialsReceived > 0 
                    ? `of ${executiveMetrics.totalMaterialsReceived.toLocaleString()} rec'd (${executiveMetrics.materialBurnPct}% burn)`
                    : `of ${executiveMetrics.inventoryItemsCount} tracked items`}
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60">
                <Package className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* 4. Critical / Blocked */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block mb-1">
              Critical / Blocked
            </span>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                  {executiveMetrics.criticalBlockedCount}
                </span>
                <span className="text-[10px] text-slate-500 block font-medium">
                  {executiveMetrics.criticalBlockedCount === 0 
                    ? 'All systems clear • No blockers'
                    : `${executiveMetrics.blockedTasks} blocked, ${executiveMetrics.overdueTasks} overdue`}
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* 5. Daily Manpower */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">
              Daily Workforce
            </span>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {executiveMetrics.dailyWorkforceCount}
                </span>
                <span className="text-[10px] text-slate-500 block font-medium">
                  {executiveMetrics.activeEmployeesCount > 0 
                    ? `${executiveMetrics.activeEmployeesCount} active on roster`
                    : `${executiveMetrics.allocatedLabourCount} personnel allocated`}
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60">
                <Users className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* 6. Active Plant & Fleet */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block mb-1">
              Operating Fleet
            </span>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {executiveMetrics.operatingFleetCount}
                </span>
                <span className="text-[10px] text-slate-500 block font-medium">
                  {executiveMetrics.totalFleetCount > 0 
                    ? `${executiveMetrics.operatingFleetCount} of ${executiveMetrics.totalFleetCount} active (${executiveMetrics.fleetUtilizationRate}% util)`
                    : 'No fleet registered'}
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60">
                <Truck className="h-4 w-4" />
              </div>
            </div>
          </div>

        </div>

        {/* ================================================================ */}
        {/* VIEW 1: EXECUTIVE OVERVIEW (ALL CHARTS UNIFIED GRID)             */}
        {/* ================================================================ */}
        {(activeTab === 'overview' || activeTab === 'scurve') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: S-Curve Planned vs Actual (Spans 2 columns) */}
            <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#0B5FFF]" />
                    <span>Project S-Curve: Planned vs Actual Progress</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cumulative milestone baseline vs real-time completion trajectory
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-[#0B5FFF]">
                    <span className="w-3 h-3 rounded-full bg-[#0B5FFF]"></span> Actual Progress
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-3 h-1 bg-slate-400"></span> Planned Baseline
                  </span>
                </div>
              </div>

              <div className="h-[280px] sm:h-[320px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={scurveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0B5FFF" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#0B5FFF" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-xs space-y-1 border border-slate-800">
                              <span className="font-bold text-slate-300 block">{label}</span>
                              <div className="text-blue-400 font-semibold">Actual: {data.actual !== null ? `${data.actual}%` : 'N/A'}</div>
                              <div className="text-slate-400 font-semibold">Planned: {data.planned}%</div>
                              {data.actual !== null && (
                                <div className={`font-bold ${data.variance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  Variance: {data.variance >= 0 ? `+${data.variance}% Ahead` : `${data.variance}% Behind`}
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="planned" 
                      stroke="#94a3b8" 
                      strokeWidth={2} 
                      strokeDasharray="4 4" 
                      dot={false}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#0B5FFF" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#actualGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Activity Status Distribution (1 column) */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-indigo-500" />
                    <span>Activity Distribution</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Workflow breakdown across {executiveMetrics.totalTasks} total tasks
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {executiveMetrics.totalTasks} Tasks
                </span>
              </div>

              <div className="h-[200px] w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center KPI Count */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {executiveMetrics.totalTasks}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Total Tasks
                  </span>
                </div>
              </div>

              {/* Status Badges List */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                {statusPieData.map(st => (
                  <div key={st.name} className="flex items-center justify-between text-xs p-1.5 rounded-xl bg-slate-50 dark:bg-slate-950/60">
                    <span className="flex items-center gap-1.5 truncate font-medium text-slate-600 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: st.color }}></span>
                      <span className="truncate">{st.name}</span>
                    </span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white ml-1">
                      {st.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW 2: MATERIAL LOGISTICS & INVENTORY CHARTS                    */}
        {/* ================================================================ */}
        {(activeTab === 'overview' || activeTab === 'materials') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Material Usage & Inflow Trends */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Package className="h-4 w-4 text-emerald-500" />
                    <span>Material Usage & Inflow Trends</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Daily burn rate vs inbound delivery receipts
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Received Supply
                  </span>
                  <span className="flex items-center gap-1.5 text-[#0B5FFF]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0B5FFF]"></span> Site Consumption
                  </span>
                </div>
              </div>

              <div className="h-[260px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={materialTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-xs space-y-1 border border-slate-800">
                              <span className="font-bold text-slate-300 block">{label}</span>
                              <div className="text-emerald-400 font-semibold">Received Supply: +{data.inbound} units</div>
                              <div className="text-blue-400 font-semibold">Site Consumed: -{data.consumed} units</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="inbound" name="Received Supply" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="consumed" name="Site Consumption" fill="#0B5FFF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Key Materials: Consumed vs Available Stock Horizontal Bar */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-purple-500" />
                    <span>Key Materials: Consumed vs Available Stock</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Stock levels & cumulative utilization per inventory item
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-blue-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0B5FFF]"></span> Consumed
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> In-Stock
                  </span>
                </div>
              </div>

              <div className="h-[260px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topMaterialsComparison} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="#94a3b8" width={75} />
                    <Tooltip />
                    <Bar dataKey="consumed" name="Consumed" fill="#0B5FFF" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="available" name="In-Stock Available" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW 3: DISCIPLINE & WORKSTREAM MATRIX                            */}
        {/* ================================================================ */}
        {(activeTab === 'overview' || activeTab === 'activities') && (
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-500" />
                  <span>Discipline & Cross-Workstream Progress Comparison</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Task volume and completion velocity across civil, structural, MEP, and site disciplines
                </p>
              </div>
            </div>

            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={disciplineBreakdownData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" name="Completed" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="inProgress" name="In Progress" fill="#0B5FFF" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="blocked" name="Blocked" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW 4: LABOUR & FLEET MACHINERY UTILIZATION                      */}
        {/* ================================================================ */}
        {(activeTab === 'overview' || activeTab === 'labour') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Labour Manpower Stacked Area */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-600" />
                    <span>Daily Manpower Headcount by Trade</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Field resource deployment curves over the selected timeframe
                  </p>
                </div>
              </div>

              <div className="h-[250px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={labourTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="civilTrades" name="Civil & Earthworks" stackId="1" stroke="#0B5FFF" fill="#0B5FFF" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="mepTrades" name="MEP & Structural" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="operators" name="Operators & Drivers" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Equipment Fleet Operating Hours */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Truck className="h-4 w-4 text-amber-500" />
                    <span>Fleet Machinery Meter Hours</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Current engine operating hour totals for key plant equipment
                  </p>
                </div>
              </div>

              <div className="h-[250px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={equipmentFleetData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis unit="h" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="engineHours" name="Operating Hours (h)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW 5: LIVE PROJECT UPDATES & ACTIVITY LOGS FEED                */}
        {/* ================================================================ */}
        {(activeTab === 'overview' || activeTab === 'updates') && (
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span>Recent Project Milestone Updates & Activity Stream</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live verification audit of completed subtasks, daily log events, and field updates
                </p>
              </div>
              <span className="text-xs font-bold text-[#0B5FFF] font-mono">
                {activities.filter(a => a.status === 'Completed' || a.status === 'In Progress').length} Active Updates
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {activities
                .slice(0, 6)
                .map((act, index) => (
                  <div 
                    key={act.id} 
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col justify-between gap-3 hover:border-blue-300 dark:hover:border-blue-800 transition-all"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          #{index + 1} • {act.id}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          act.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' :
                          act.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300' :
                          act.status === 'Blocked' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300' :
                          'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {act.status}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1">
                        {act.name}
                      </h4>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                        {act.description || 'On-site execution in accordance with approved drawings and specifications.'}
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span>Progress</span>
                        <span className="font-mono">{act.progress || 0}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-[#0B5FFF]" 
                          style={{ width: `${act.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

export default ProjectAnalyticsPage;
