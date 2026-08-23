import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, ProgressBar, Badge, Button } from '../components/ui';
import { KPIGrid, KPIMetric } from '../components/KPIGrid';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  HardHat, 
  TrendingUp, 
  Truck, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft,
  PanelRight,
  PanelRightClose,
  PanelRightOpen, 
  Layers, 
  MapPin, 
  User, 
  Users, 
  Camera, 
  ExternalLink, 
  Filter, 
  ArrowUpDown, 
  Calendar,
  Sparkles,
  Search,
  Eye,
  Maximize2,
  Minimize2,
  Expand,
  X,
  Printer,
  FileSpreadsheet,
  SlidersHorizontal
} from 'lucide-react';
import { printActivitiesSummary } from '../lib/pdfPrint';
import { exportActivitiesToCSV } from '../lib/csvExport';
import { useAppContext } from '../context/AppContext';
import { DashboardAnalytics } from '../components/DashboardAnalytics';
import { QuickAccessPanel } from '../components/QuickAccessPanel';
import { CalendarWidget } from '../components/CalendarWidget';

import { SiteCheckIn } from '../components/SiteCheckIn';
import { Activity as ActivityType, canManage } from '../types';
import { ActivityDetail } from '../components/ActivityDetail';
import { KPIDetailScreen } from '../components/KPIDetailScreen';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { ActivitySlideOver } from '../components/ActivitySlideOver';

export function Dashboard() {
  const { 
    projects, 
    activities, 
    reports, 
    equipment, 
    workerCheckIns, 
    labourLogs, 
    employees, 
    userRole, 
    updateActivity, 
    deleteActivity,
    materials,
    materialReceipts,
    materialUsages
  } = useAppContext();

  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);
  const [slideOverActivity, setSlideOverActivity] = useState<ActivityType | null>(null);
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());
  const [isTableMaximized, setIsTableMaximized] = useState<boolean>(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('constructos_dashboard_right_panel_open');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleRightPanel = () => {
    setIsRightPanelOpen(prev => {
      const next = !prev;
      localStorage.setItem('constructos_dashboard_right_panel_open', String(next));
      return next;
    });
  };
  const [selectedKpi, setSelectedKpi] = useState<KPIMetric | null>(null);
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'progress' | 'updated'>('id');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');
  
  const currentProject = projects[0];
  const activeActivities = activities.filter(a => a.status === 'In Progress');
  const delayedActivities = activities.filter(a => a.status === 'Blocked');
  const completedActivitiesCount = activities.filter(a => a.status === 'Completed').length;
  
  const filteredAndSortedActivities = useMemo(() => {
    let list = [...activities];
    if (statusFilter !== 'all') {
      list = list.filter(a => a.status === statusFilter);
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      list = list.filter(a => 
        a.name.toLowerCase().includes(q) || 
        a.id.toLowerCase().includes(q) || 
        (a.discipline && a.discipline.toLowerCase().includes(q)) ||
        (a.workPackage && a.workPackage.toLowerCase().includes(q)) ||
        (a.area && a.area.toLowerCase().includes(q)) ||
        (a.supervisor && a.supervisor.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'id') {
        comparison = a.id.localeCompare(b.id, undefined, { numeric: true });
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'progress') {
        comparison = (a.progress || 0) - (b.progress || 0);
      } else if (sortBy === 'updated') {
        const dA = a.updatedAt || a.createdAt || a.startDate || '';
        const dB = b.updatedAt || b.createdAt || b.startDate || '';
        comparison = dA.localeCompare(dB);
      }
      return sortAsc ? comparison : -comparison;
    });
    return list;
  }, [activities, statusFilter, searchFilter, sortBy, sortAsc]);

  const toggleRowExpansion = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleExpandAll = () => {
    if (expandedRowIds.size === filteredAndSortedActivities.length) {
      setExpandedRowIds(new Set());
    } else {
      setExpandedRowIds(new Set(filteredAndSortedActivities.map(a => a.id)));
    }
  };
  
  // Calculate dynamic metrics
  const overallProgressVal = currentProject?.progress !== undefined 
    ? currentProject.progress 
    : (activities.length > 0 ? Math.round(activities.reduce((acc, a) => acc + (a.progress || 0), 0) / activities.length) : 0);

  const activeEmployeesCount = employees ? employees.filter(e => e.status === 'Active').length : 0;
  
  const activeWorkersCount = activeEmployeesCount;
  
  const yesterdayWorkersCount = reports[1]?.workersOnSite || 0;
  const workerDiff = activeWorkersCount - yesterdayWorkersCount;
  const workerSubtext = workerDiff > 0 ? `+${workerDiff} vs yesterday` : workerDiff < 0 ? `${workerDiff} vs yesterday` : `0 vs yesterday`;

  const totalEquip = equipment ? equipment.length : 0;
  const operatingEquip = equipment ? equipment.filter(e => e.status === 'Operating').length : 0;
  const runningEquipCount = operatingEquip;
  const utilRate = totalEquip > 0 ? Math.round((operatingEquip / totalEquip) * 100) : 0;

  const criticalDelayedCount = delayedActivities.filter(a => a.priority === 'Critical' || a.priority === 'High').length;

  const kpiMetrics: KPIMetric[] = [
    {
      id: 'overall-progress',
      label: 'Overall Progress',
      value: `${overallProgressVal}%`,
      icon: TrendingUp,
      iconColor: 'text-[#0B5FFF]',
      iconBgColor: 'bg-blue-50 dark:bg-blue-900/30',
      trend: {
        value: currentProject?.finishDate ? `Target: ${currentProject.finishDate}` : 'Tracked Live',
        color: 'text-[#0B5FFF]',
      },
    },
    {
      id: 'activities-complete',
      label: 'Activities Complete',
      value: completedActivitiesCount,
      subtext: `${activities.length} Total Tasks`,
      subtextColor: 'text-[#2E7D32] font-semibold',
      icon: CheckCircle2,
      iconColor: 'text-[#2E7D32]',
      iconBgColor: 'bg-green-50 dark:bg-green-900/30',
    },
    {
      id: 'workers-on-site',
      label: 'Workers on Site',
      value: activeWorkersCount,
      subtext: workerSubtext,
      subtextColor: 'text-[#2E7D32] font-semibold',
      icon: HardHat,
      iconColor: 'text-[#F9A825]',
      iconBgColor: 'bg-amber-50 dark:bg-amber-900/30',
    },
    {
      id: 'equipment-running',
      label: 'Equipment Running',
      value: `${runningEquipCount} units`,
      subtext: `${utilRate}% Utilization`,
      subtextColor: 'text-[#0B5FFF] font-semibold',
      icon: Truck,
      iconColor: 'text-[#0B5FFF]',
      iconBgColor: 'bg-blue-50 dark:bg-blue-900/30',
    },
    {
      id: 'activities-delayed',
      label: 'Activities Delayed',
      value: delayedActivities.length,
      subtext: `${criticalDelayedCount} Critical Path`,
      subtextColor: 'text-[#D32F2F] font-semibold',
      icon: AlertTriangle,
      iconColor: 'text-[#D32F2F]',
      iconBgColor: 'bg-red-50 dark:bg-red-900/30',
    },
  ];

  const handleDeleteActivity = (id: string) => {
    setDeletingActivityId(id);
  };

  const handleConfirmDelete = () => {
    if (deletingActivityId && deleteActivity) {
      deleteActivity(deletingActivityId);
    }
    if (selectedActivity && selectedActivity.id === deletingActivityId) {
      setSelectedActivity(null);
    }
    setDeletingActivityId(null);
  };

  const handleSaveActivity = (updated: ActivityType, oldId?: string) => {
    if (updateActivity) {
      updateActivity(updated, oldId);
    }
    setSelectedActivity(updated);
  };

  if (selectedActivity) {
    return (
      <div className="p-4 h-full overflow-y-auto">
        <ActivityDetail
          activity={selectedActivity}
          onSave={handleSaveActivity}
          onClose={() => setSelectedActivity(null)}
          onDelete={canManage(userRole) ? handleDeleteActivity : undefined}
        />
        <ConfirmDeleteModal
          isOpen={Boolean(deletingActivityId)}
          title="Delete Construction Activity"
          itemName={activities.find(a => a.id === deletingActivityId)?.name || deletingActivityId || ''}
          message="Are you sure you want to delete this activity? This will remove all associated subtasks, photos, and resource allocations."
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingActivityId(null)}
          confirmLabel="Delete Activity"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5 p-4 sm:p-6 w-full min-h-0 relative">
      {selectedKpi && (
        <KPIDetailScreen 
          metric={selectedKpi} 
          onClose={() => setSelectedKpi(null)} 
          onSelectActivity={(act) => setSelectedActivity(act)}
        />
      )}
      {/* Left Column: Dashboards & Activities */}
      <div className={`flex flex-col gap-5 min-w-0 transition-all duration-300 ease-in-out ${isRightPanelOpen ? 'flex-1 lg:flex-[3]' : 'w-full flex-1'}`}>
        {/* KPI Row */}
        <KPIGrid metrics={kpiMetrics} onMetricClick={(metric) => setSelectedKpi(metric)} />

        {/* Recharts Powered Data Visualization Component */}
        <DashboardAnalytics 
          project={currentProject}
          activities={activities}
          materials={materials}
          materialUsages={materialUsages}
          materialReceipts={materialReceipts}
          onSelectActivity={(act) => setSelectedActivity(act)}
        />

        {/* Activity Tracker Table Section */}
        {isTableMaximized && (
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 transition-opacity animate-in fade-in" 
            onClick={() => setIsTableMaximized(false)} 
          />
        )}

        <Card className={`flex flex-col transition-all duration-200 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl bg-white dark:bg-slate-900 ${
          isTableMaximized 
            ? 'fixed inset-2 sm:inset-4 md:inset-6 z-50 shadow-2xl rounded-2xl border-slate-300 dark:border-slate-700 animate-in fade-in zoom-in-95' 
            : 'w-full min-h-[400px]'
        }`}>
          {/* Maximized Quick Metrics Bar */}
          {isTableMaximized && (
            <div className="bg-slate-50 dark:bg-slate-950/80 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expanded Activity View</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF] border border-blue-200 dark:border-blue-800">
                    Total: {activities.length}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    In Progress: {activeActivities.length}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    Completed: {completedActivitiesCount}
                  </span>
                  {delayedActivities.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                      Blocked / Delayed: {delayedActivities.length}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsTableMaximized(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Exit expanded table view (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="p-3.5 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#0B5FFF]" />
                <h2 className="font-bold text-gray-800 dark:text-slate-100 text-sm md:text-base">Current Construction Activities</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF] border border-blue-200 dark:border-blue-800">
                {filteredAndSortedActivities.length} Tasks
              </span>
            </div>

            {/* Icon Toolbar with Hover-Expansion */}
            <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
              {/* Search Filter - Compact, expanding input */}
              <div className="relative group flex items-center">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-[#0B5FFF] pointer-events-none transition-colors" />
                <input
                  type="text"
                  placeholder="Filter tasks..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="h-8 pl-8 pr-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0B5FFF] focus:border-[#0B5FFF] w-28 focus:w-44 transition-all duration-300 text-slate-800 dark:text-slate-200"
                  title="Search & filter tasks"
                />
              </div>

              {/* Status Filter Icon Button - Expands on hover */}
              <div className="relative group">
                <div className={`h-8 px-2.5 rounded-lg border transition-all duration-300 flex items-center gap-1.5 cursor-pointer overflow-hidden ${
                  statusFilter !== 'all'
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-[#0B5FFF] dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}>
                  <Filter className="h-3.5 w-3.5 shrink-0" />
                  <span className="max-w-0 opacity-0 group-hover:max-w-[110px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-semibold overflow-hidden">
                    {statusFilter === 'all' ? 'Status' : statusFilter}
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  title="Filter by status"
                >
                  <option value="all">All Statuses</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Not Started">Not Started</option>
                </select>
              </div>

              {/* Sort Criterion Icon Button - Expands on hover */}
              <div className="relative group">
                <div className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-all duration-300 flex items-center gap-1.5 cursor-pointer overflow-hidden text-slate-700 dark:text-slate-200">
                  <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400 group-hover:text-[#0B5FFF]" />
                  <span className="max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-semibold overflow-hidden">
                    Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  title="Sort tasks by"
                >
                  <option value="id">Sort by ID</option>
                  <option value="name">Sort by Name</option>
                  <option value="progress">Sort by Progress</option>
                  <option value="updated">Sort by Updated</option>
                </select>
              </div>

              {/* Sort Direction Toggle - Expands on hover */}
              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="group h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 transition-all duration-300 overflow-hidden"
                title={sortAsc ? "Sort Ascending" : "Sort Descending"}
              >
                <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400 group-hover:text-[#0B5FFF]" />
                <span className="max-w-0 opacity-0 group-hover:max-w-[90px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-semibold overflow-hidden text-slate-700 dark:text-slate-200">
                  {sortAsc ? 'Ascending' : 'Descending'}
                </span>
              </button>

              {/* Print / PDF Export Button - Expands on hover */}
              <button
                onClick={() => {
                  printActivitiesSummary({
                    project: currentProject,
                    activities: filteredAndSortedActivities,
                    filterLabel: statusFilter !== 'all' ? `Filtered by status: ${statusFilter}` : 'All Construction Activities',
                    totalActivitiesCount: activities.length
                  });
                }}
                className="group h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:border-blue-200 dark:hover:border-blue-800 text-slate-700 dark:text-slate-200 transition-all duration-300 flex items-center gap-1.5 overflow-hidden shadow-2xs"
                title="Print or Export current activities summary as a clean PDF"
              >
                <Printer className="h-3.5 w-3.5 shrink-0 text-slate-600 dark:text-slate-300 group-hover:text-[#0B5FFF]" />
                <span className="max-w-0 opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-semibold overflow-hidden text-slate-700 dark:text-slate-200">
                  Print / PDF
                </span>
              </button>

              {/* Expand Table Pull-Up Button - Expands on hover */}
              <button
                onClick={() => setIsTableMaximized(!isTableMaximized)}
                className={`group h-8 px-2.5 rounded-lg border text-xs font-bold transition-all duration-300 flex items-center gap-1.5 overflow-hidden shadow-2xs ${
                  isTableMaximized
                    ? 'bg-[#0B5FFF] text-white border-[#0B5FFF] hover:bg-blue-600'
                    : 'bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#0B5FFF] dark:text-blue-300 border-blue-200 dark:border-blue-800'
                }`}
                title={isTableMaximized ? "Minimize table view" : "Expand activities table to full view"}
              >
                {isTableMaximized ? (
                  <>
                    <Minimize2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="max-w-0 opacity-0 group-hover:max-w-[80px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap text-xs overflow-hidden">
                      Minimize
                    </span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="max-w-0 opacity-0 group-hover:max-w-[80px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap text-xs overflow-hidden">
                      Expand
                    </span>
                  </>
                )}
              </button>

              {/* Slide Side Panels Toggle Button - Expands on hover */}
              <button
                onClick={toggleRightPanel}
                className={`group h-8 px-2.5 rounded-lg border text-xs font-bold transition-all duration-300 flex items-center gap-1.5 overflow-hidden shadow-2xs ${
                  !isRightPanelOpen
                    ? 'bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#0B5FFF] dark:text-blue-300 border-blue-200 dark:border-blue-800'
                    : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
                title={isRightPanelOpen ? "Slide panels away to the right (Hide side panels)" : "Expand side panels (Show side panels)"}
              >
                {isRightPanelOpen ? (
                  <>
                    <PanelRightClose className="h-3.5 w-3.5 shrink-0 text-slate-600 dark:text-slate-300 group-hover:text-[#0B5FFF]" />
                    <span className="max-w-0 opacity-0 group-hover:max-w-[90px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap text-xs overflow-hidden">
                      Hide Panels
                    </span>
                  </>
                ) : (
                  <>
                    <PanelRightOpen className="h-3.5 w-3.5 shrink-0 text-[#0B5FFF]" />
                    <span className="max-w-0 opacity-0 group-hover:max-w-[90px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap text-xs overflow-hidden">
                      Show Panels
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[850px]">
              <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                <tr className="text-[11px] uppercase text-slate-500 dark:text-slate-400 font-bold tracking-wider">
                  <th className="px-3 py-3 w-10 text-center"></th>
                  <th className="px-3 py-3 w-28">ID</th>
                  <th className="px-4 py-3">Activity Name</th>
                  <th className="px-3 py-3">Discipline</th>
                  <th className="px-3 py-3">Qty / Target</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Created</th>
                  <th className="px-3 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Progress</th>
                  <th className="px-3 py-3 w-20 text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredAndSortedActivities.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                      <Layers className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
                      <p className="font-semibold text-sm">No construction activities found</p>
                      <p className="text-xs text-slate-400 mt-0.5">Try resetting search filters or add a new activity.</p>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedActivities.map(activity => {
                    const isExpanded = expandedRowIds.has(activity.id);
                    const isSelected = slideOverActivity?.id === activity.id;

                    const getStatusColor = (status: string) => {
                      if (status === 'Completed') return 'text-emerald-700 dark:text-emerald-400';
                      if (status === 'In Progress') return 'text-[#0B5FFF] dark:text-blue-400';
                      if (status === 'Blocked') return 'text-rose-600 dark:text-rose-400';
                      return 'text-amber-600 dark:text-amber-400';
                    };
                    const getStatusBgColor = (status: string) => {
                      if (status === 'Completed') return 'bg-emerald-500';
                      if (status === 'In Progress') return 'bg-[#0B5FFF]';
                      if (status === 'Blocked') return 'bg-rose-500';
                      return 'bg-amber-500';
                    };

                    const activityLabourLogs = labourLogs?.filter(l => l?.activityId === activity.id) || [];
                    const loggedHoursTotal = activityLabourLogs.reduce((sum, l) => sum + (l.hoursWorked || l.hours || 0), 0);
                    
                    return (
                      <React.Fragment key={activity.id}>
                        <tr 
                          id={`activity-row-${activity.id}`}
                          className={`transition-colors cursor-pointer select-none group ${
                            isSelected 
                              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-l-[#0B5FFF]' 
                              : isExpanded 
                                ? 'bg-slate-50/80 dark:bg-slate-800/40' 
                                : 'hover:bg-blue-50/40 dark:hover:bg-slate-800/50'
                          }`}
                          onClick={() => setSlideOverActivity(activity)}
                        >
                          {/* Row Expansion Toggle Chevron */}
                          <td className="px-2 py-3 text-center">
                            <button
                              type="button"
                              onClick={(e) => toggleRowExpansion(activity.id, e)}
                              className="p-1 rounded-md text-slate-400 hover:text-[#0B5FFF] hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                              title={isExpanded ? "Collapse inline details" : "Expand inline details"}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-[#0B5FFF]" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          </td>

                          {/* ID */}
                          <td className="px-3 py-3 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                            {activity.id}
                          </td>

                          {/* Activity Name */}
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#0B5FFF] transition-colors">
                              {activity.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-medium">Area: {activity.area || 'Site'}</span>
                              {activity.priority === 'Critical' && (
                                <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                                  Critical
                                </span>
                              )}
                              {activity.photos && activity.photos.length > 0 && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/50 text-[#0B5FFF] dark:text-blue-300 flex items-center gap-0.5">
                                  <Camera className="h-2.5 w-2.5" /> {activity.photos.length}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Discipline */}
                          <td className="px-3 py-3">
                            <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                              {activity.discipline || 'Civil'}
                            </span>
                          </td>

                          {/* Quantity / Unit */}
                          <td className="px-3 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {activity.actualQuantity} / {activity.targetQuantity} <span className="text-[10px] font-normal text-slate-400">{activity.unit}</span>
                          </td>

                          {/* Status */}
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center gap-1.5 font-bold text-xs ${getStatusColor(activity.status)}`}>
                              <div className={`w-2 h-2 rounded-full ${getStatusBgColor(activity.status)}`}></div>
                              {activity.status}
                            </span>
                          </td>

                          {/* Created */}
                          <td className="px-3 py-3 text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {activity.createdAt || activity.startDate || 'N/A'}
                          </td>

                          {/* Updated */}
                          <td className="px-3 py-3 text-xs font-mono text-purple-700 dark:text-purple-300 font-medium whitespace-nowrap">
                            {activity.updatedAt || activity.createdAt || activity.startDate || 'N/A'}
                          </td>

                          {/* Progress */}
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex flex-col items-end gap-1">
                              <span className="font-bold text-xs text-slate-900 dark:text-white">{activity.progress}%</span>
                              <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    activity.progress === 100 ? 'bg-emerald-500' : 'bg-[#0B5FFF]'
                                  }`} 
                                  style={{ width: `${Math.min(activity.progress, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Quick Inspect Slide-Over Button */}
                          <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setSlideOverActivity(activity)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#0B5FFF] hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors"
                                title="Open Slide-over Metadata Panel"
                              >
                                <PanelRightOpen className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setSelectedActivity(activity)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Open Full Detail Screen"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Inline Expanded Row Metadata Accordion */}
                        {isExpanded && (
                          <tr className="bg-slate-50/90 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                            <td colSpan={10} className="p-4 pl-12">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs bg-white dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
                                {/* Column 1: Scope & Work Package */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-1.5 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                                    <Layers className="h-3 w-3 text-[#0B5FFF]" />
                                    <span>Scope & Location</span>
                                  </div>
                                  <div className="space-y-1 text-slate-700 dark:text-slate-300">
                                    <div><span className="text-slate-400">Package:</span> <span className="font-semibold">{activity.workPackage || 'N/A'}</span></div>
                                    <div><span className="text-slate-400">Area:</span> <span className="font-semibold">{activity.area || 'Site Area'}</span></div>
                                    {activity.location && <div><span className="text-slate-400">Location:</span> <span className="font-semibold">{activity.location}</span></div>}
                                    {activity.chainage && <div><span className="text-slate-400">Chainage:</span> <span className="font-mono font-semibold">{activity.chainage}</span></div>}
                                  </div>
                                </div>

                                {/* Column 2: Crew & Supervision */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-1.5 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                                    <Users className="h-3 w-3 text-emerald-500" />
                                    <span>Crew & Oversight</span>
                                  </div>
                                  <div className="space-y-1 text-slate-700 dark:text-slate-300">
                                    <div><span className="text-slate-400">Supervisor:</span> <span className="font-semibold text-slate-900 dark:text-slate-100">{activity.supervisor || 'Unassigned'}</span></div>
                                    <div><span className="text-slate-400">Assigned Team:</span> <span className="font-semibold">{activity.assignedTo || 'General Crew'}</span></div>
                                    <div><span className="text-slate-400">Logged Labour:</span> <span className="font-bold text-emerald-600 dark:text-emerald-400">{loggedHoursTotal || activity.actualHours || 0} / {activity.plannedHours || 0} hrs</span></div>
                                  </div>
                                </div>

                                {/* Column 3: Schedule & Timeline */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-1.5 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                                    <Calendar className="h-3 w-3 text-amber-500" />
                                    <span>Schedule & Dates</span>
                                  </div>
                                  <div className="space-y-1 text-slate-700 dark:text-slate-300">
                                    <div><span className="text-slate-400">Start Date:</span> <span className="font-semibold">{activity.startDate || 'N/A'}</span></div>
                                    <div><span className="text-slate-400">Finish Date:</span> <span className="font-semibold">{activity.finishDate || 'N/A'}</span></div>
                                    <div><span className="text-slate-400">Daily Target:</span> <span className="font-semibold">{activity.dailyTargetQuantity ? `${activity.dailyTargetQuantity} ${activity.unit}/day` : 'N/A'}</span></div>
                                  </div>
                                </div>

                                {/* Column 4: Field Photos & Quick Actions */}
                                <div className="space-y-2 flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-center justify-between text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-1">
                                      <span className="flex items-center gap-1"><Camera className="h-3 w-3 text-blue-500" /> Photos ({activity.photos?.length || 0})</span>
                                    </div>
                                    {activity.photos && activity.photos.length > 0 ? (
                                      <div className="flex items-center gap-1.5">
                                        {activity.photos.slice(0, 3).map((img, pIdx) => (
                                          <img 
                                            key={pIdx} 
                                            src={img} 
                                            alt="Site thumbnail" 
                                            className="w-10 h-10 rounded-md object-cover border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer hover:opacity-90"
                                            onClick={() => setSlideOverActivity(activity)}
                                          />
                                        ))}
                                        {activity.photos.length > 3 && (
                                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-2.5 rounded-md">
                                            +{activity.photos.length - 3}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-[11px] text-slate-400 italic">No field photos attached</span>
                                    )}
                                  </div>

                                  {/* Quick Action Buttons */}
                                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                                    <button
                                      onClick={() => setSlideOverActivity(activity)}
                                      className="flex-1 py-1 px-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-[#0B5FFF] dark:text-blue-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                                    >
                                      <PanelRightOpen className="h-3.5 w-3.5" /> Slide-over
                                    </button>
                                    <button
                                      onClick={() => setSelectedActivity(activity)}
                                      className="flex-1 py-1 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" /> Full Edit
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Right Column: Quick Access & Calendar Panels (Slide Expand / Collapse) */}
      <div 
        className={`transition-all duration-300 ease-in-out flex flex-col gap-4 min-h-0 ${
          isRightPanelOpen
            ? 'w-full lg:w-80 xl:w-96 2xl:w-[380px] shrink-0 opacity-100 translate-x-0'
            : 'hidden lg:flex lg:w-0 lg:opacity-0 lg:pointer-events-none lg:overflow-hidden lg:translate-x-12 lg:p-0 lg:m-0'
        }`}
      >
        {/* Slide-Collapse Action Header */}
        <div className="flex items-center justify-between px-1 py-0.5 shrink-0">
          <div className="flex items-center gap-2">
            <PanelRight className="h-4 w-4 text-[#0B5FFF]" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Side Panels</span>
          </div>
          <button
            onClick={toggleRightPanel}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 py-1 rounded-lg transition-all group cursor-pointer"
            title="Slide away to the right (Hide panels)"
          >
            <span>Hide</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {userRole === 'Worker' && (
          <SiteCheckIn />
        )}

        {/* Calendar Widget */}
        <CalendarWidget />

        {/* Quick Access Panel */}
        <QuickAccessPanel />
      </div>

      {/* Floating Edge Trigger when panels are hidden (Slide Open) */}
      {!isRightPanelOpen && (
        <button
          onClick={toggleRightPanel}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 pl-3 pr-2.5 py-3.5 rounded-l-2xl border-l border-y border-slate-200 dark:border-slate-800 shadow-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-[#0B5FFF] dark:hover:text-blue-400 hover:border-[#0B5FFF]/40 transition-all duration-300 group cursor-pointer animate-in slide-in-from-right-4"
          title="Expand Quick Access & Calendar (Slide open)"
        >
          <div className="flex flex-col items-center gap-2">
            <ChevronLeft className="h-4 w-4 text-[#0B5FFF] transition-transform duration-300 group-hover:-translate-x-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider [writing-mode:vertical-rl] rotate-180 text-slate-500 group-hover:text-[#0B5FFF]">
              Quick Access
            </span>
          </div>
        </button>
      )}

      {/* Slide-over Metadata Panel Drawer */}
      <ActivitySlideOver
        activity={slideOverActivity}
        isOpen={Boolean(slideOverActivity)}
        onClose={() => setSlideOverActivity(null)}
        onOpenFullDetail={(act) => {
          setSlideOverActivity(null);
          setSelectedActivity(act);
        }}
      />
    </div>
  );
}
