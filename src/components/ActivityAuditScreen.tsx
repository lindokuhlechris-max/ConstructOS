import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Plus, 
  CheckCircle2, 
  ShieldAlert, 
  Download, 
  User, 
  Clock, 
  Calendar, 
  Building, 
  FileText, 
  Lock, 
  Eye, 
  X, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  ChevronRight, 
  ShieldCheck, 
  Tag, 
  Layers, 
  ArrowUpDown, 
  Printer,
  CheckSquare,
  TrendingUp,
  Target,
  ArrowRight,
  Sparkles,
  ExternalLink,
  MapPin,
  FileSpreadsheet
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, ProgressBar } from './ui';
import { useAppContext } from '../context/AppContext';
import { AuditLog, Activity } from '../types';
import { printActivityAuditSummary } from '../lib/pdfPrint';

interface ActivityAuditScreenProps {
  projectId?: string;
  activityId?: string;
  onBack?: () => void;
  onSelectActivity?: (activity: Activity) => void;
}

export function ActivityAuditScreen({ projectId, activityId, onBack, onSelectActivity }: ActivityAuditScreenProps) {
  const { auditLogs, activities, projects, userRole } = useAppContext();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || 'all');
  const [selectedActivityId, setSelectedActivityId] = useState<string>(activityId || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedLogForModal, setSelectedLogForModal] = useState<AuditLog | null>(null);

  // Filter logs specifically relevant to Activities and Subtasks (or all if general)
  const activityAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // 1. Project filter
      if (selectedProjectId !== 'all' && log.projectId !== selectedProjectId) {
        return false;
      }

      // 2. Activity filter
      if (selectedActivityId !== 'all') {
        const matchesEntityId = log.entityId === selectedActivityId;
        const matchesDetails = log.details.includes(selectedActivityId);
        const matchesActivityName = log.activityName && activities.find(a => a.id === selectedActivityId)?.name === log.activityName;
        if (!matchesEntityId && !matchesDetails && !matchesActivityName) {
          return false;
        }
      }

      // 3. Category / Event Type filter
      if (selectedCategory !== 'all') {
        const actLower = log.action.toLowerCase();
        const detLower = log.details.toLowerCase();
        const actType = log.actionType || '';

        if (selectedCategory === 'subtask_complete') {
          if (!actLower.includes('subtask') && !detLower.includes('subtask')) return false;
          if (!actLower.includes('completed') && !actLower.includes('status') && !detLower.includes('completed')) return false;
        } else if (selectedCategory === 'subtask_manage') {
          if (!actLower.includes('subtask') && !detLower.includes('subtask')) return false;
        } else if (selectedCategory === 'qa_hold_point') {
          if (!actLower.includes('qa') && !actLower.includes('hold point') && !detLower.includes('qa') && !detLower.includes('hold point')) return false;
        } else if (selectedCategory === 'progress_log') {
          if (!actLower.includes('progress') && !actLower.includes('daily report') && !detLower.includes('progress logged')) return false;
        } else if (selectedCategory === 'status_change') {
          if (actType !== 'status_change' && !actLower.includes('status') && !detLower.includes('status changed')) return false;
        } else if (selectedCategory === 'deletions') {
          if (actType !== 'delete' && !actLower.includes('delete') && !detLower.includes('deleted') && !actLower.includes('remove')) return false;
        }
      }

      // 4. Date filter
      if (dateFilter !== 'all') {
        const logTime = new Date(log.timestamp).getTime();
        const now = Date.now();
        if (dateFilter === 'today') {
          const todayStart = new Date().setHours(0, 0, 0, 0);
          if (logTime < todayStart) return false;
        } else if (dateFilter === '7days') {
          if (logTime < now - 7 * 24 * 3600 * 1000) return false;
        } else if (dateFilter === '30days') {
          if (logTime < now - 30 * 24 * 3600 * 1000) return false;
        }
      }

      // 5. Search Term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchAction = log.action.toLowerCase().includes(term);
        const matchDetails = log.details.toLowerCase().includes(term);
        const matchUser = log.userId.toLowerCase().includes(term);
        const matchId = log.id.toLowerCase().includes(term);
        const matchEntity = (log.entityId || '').toLowerCase().includes(term);
        const matchActName = (log.activityName || '').toLowerCase().includes(term);
        const matchSubtask = (log.subtaskTitle || '').toLowerCase().includes(term);

        if (!matchAction && !matchDetails && !matchUser && !matchId && !matchEntity && !matchActName && !matchSubtask) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [auditLogs, selectedProjectId, selectedActivityId, selectedCategory, dateFilter, searchTerm, sortOrder, activities]);

  // Aggregate Metrics for Activity & Subtask Audit Trail
  const metrics = useMemo(() => {
    const total = activityAuditLogs.length;
    const subtaskEvents = activityAuditLogs.filter(l => 
      l.action.toLowerCase().includes('subtask') || l.details.toLowerCase().includes('subtask')
    ).length;
    const qaApprovals = activityAuditLogs.filter(l => 
      l.action.toLowerCase().includes('qa') || l.details.toLowerCase().includes('qa hold point') || l.details.toLowerCase().includes('qa inspection')
    ).length;
    const progressLogs = activityAuditLogs.filter(l => 
      l.action.toLowerCase().includes('progress') || l.details.toLowerCase().includes('progress logged')
    ).length;
    const deletions = activityAuditLogs.filter(l => 
      l.actionType === 'delete' || l.action.toLowerCase().includes('delete') || l.action.toLowerCase().includes('remove')
    ).length;

    return { total, subtaskEvents, qaApprovals, progressLogs, deletions };
  }, [activityAuditLogs]);

  // Group Logs by Date for Timeline View
  const groupedLogsByDate = useMemo(() => {
    const groups: { [dateStr: string]: AuditLog[] } = {};
    activityAuditLogs.forEach(log => {
      const dateKey = new Date(log.timestamp).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(log);
    });
    return groups;
  }, [activityAuditLogs]);

  // Helper to get formatted action badge
  const getActionBadge = (action: string, actionType?: string, details?: string) => {
    const actLower = action.toLowerCase();
    const detLower = (details || '').toLowerCase();

    if (actLower.includes('qa') || detLower.includes('qa hold point') || detLower.includes('qa inspection')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-xs shrink-0">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          QA APPROVED
        </span>
      );
    }
    if (actLower.includes('progress') || detLower.includes('progress logged')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-[#0B5FFF] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-xs shrink-0">
          <TrendingUp className="h-3.5 w-3.5 text-[#0B5FFF]" />
          PROGRESS LOGGED
        </span>
      );
    }
    if (actLower.includes('subtask') && (actLower.includes('completed') || detLower.includes('completed'))) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-xs shrink-0">
          <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
          SUBTASK COMPLETED
        </span>
      );
    }
    if (actionType === 'delete' || actLower.includes('delete') || actLower.includes('remove')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800 shadow-xs shrink-0">
          <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
          DELETED
        </span>
      );
    }
    if (actionType === 'update' || actLower.includes('edit') || actLower.includes('update') || actLower.includes('modify')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-xs shrink-0">
          <Edit3 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          EDITED
        </span>
      );
    }
    if (actionType === 'create' || actLower.includes('add') || actLower.includes('create') || actLower.includes('duplicate')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 shadow-xs shrink-0">
          <Plus className="h-3.5 w-3.5 text-cyan-600" />
          CREATED
        </span>
      );
    }
    if (actionType === 'status_change' || actLower.includes('status')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 shrink-0">
          <CheckCircle2 className="h-3.5 w-3.5 text-amber-600" />
          STATUS CHANGE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
        <Tag className="h-3.5 w-3.5 text-slate-500" />
        LOGGED
      </span>
    );
  };

  // Export Filtered CSV
  const handleExportCSV = () => {
    if (activityAuditLogs.length === 0) return;

    const headers = ['Audit ID', 'Timestamp', 'User / Actor', 'Action', 'Activity / Entity', 'Details', 'Previous Value', 'New Value'];
    const rows = activityAuditLogs.map(log => [
      `"${log.id}"`,
      `"${new Date(log.timestamp).toLocaleString()}"`,
      `"${(log.userId || 'Current User').replace(/"/g, '""')}"`,
      `"${(log.action || '').replace(/"/g, '""')}"`,
      `"${(log.activityName || log.entityId || log.entityType || 'Activity').replace(/"/g, '""')}"`,
      `"${(log.details || '').replace(/"/g, '""')}"`,
      `"${(log.previousValue || '').replace(/"/g, '""')}"`,
      `"${(log.newValue || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `activity_subtask_audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Window with dedicated Executive PDF Print Engine
  const handlePrint = () => {
    const currentProject = projects.find(p => p.id === selectedProjectId) || projects[0];
    const currentActivity = activities.find(a => a.id === selectedActivityId);
    const filterDesc = [
      selectedActivityId !== 'all' ? `Activity: ${currentActivity?.name || selectedActivityId}` : null,
      selectedCategory !== 'all' ? `Category: ${selectedCategory.replace(/_/g, ' ')}` : null,
      selectedProjectId !== 'all' ? `Project: ${currentProject?.name || selectedProjectId}` : null,
      dateFilter !== 'all' ? `Timeframe: ${dateFilter}` : null,
      searchTerm ? `Search: "${searchTerm}"` : null
    ].filter(Boolean).join(' • ') || 'All Events';

    printActivityAuditSummary({
      project: currentProject,
      logs: activityAuditLogs,
      filterLabel: filterDesc,
      totalLogsCount: auditLogs.length,
      activityName: currentActivity?.name
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-12 animate-in fade-in duration-200 print:p-0 print:gap-3">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full print:p-3 print:border-b-2 print:border-blue-600 print:rounded-none">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors shrink-0 print:hidden"
              title="Back to Activities Tracker"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          <div className="w-13 h-13 rounded-2xl bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-[#0B5FFF] dark:text-blue-300 shrink-0 shadow-sm print:w-10 print:h-10">
            <History className="h-7 w-7 print:h-5 print:w-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="default" className="bg-[#0B5FFF] text-white text-xs font-bold print:text-[10px]">
                Activities & Subtasks
              </Badge>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#0B5FFF] border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 print:text-[10px]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Immutable Audit Trail
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight print:text-lg">
              Activity & Subtasks Audit Screen
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 print:text-[10px]">
              Comprehensive chronological changelog for activity milestones, subtask completions, QA hold point sign-offs, and daily progress entries.
            </p>
          </div>
        </div>

        {/* Top Header Action Buttons - Hidden in Print */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto print:hidden">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="rounded-xl px-3.5 text-xs font-semibold gap-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm h-9"
            title="Download CSV report of filtered audit events"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export CSV</span>
          </Button>

          <Button
            onClick={handlePrint}
            variant="outline"
            className="rounded-xl px-3.5 text-xs font-semibold gap-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm h-9 bg-blue-50/40 text-[#0B5FFF] border-blue-200"
            title="Print or Export executive clean PDF summary report"
          >
            <Printer className="h-4 w-4 text-[#0B5FFF]" />
            <span>Print Audit</span>
          </Button>
        </div>
      </div>

      {/* KPI Metrics Dashboard Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 print:grid-cols-5 print:gap-2">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs print:p-2 print:border">
          <CardContent className="p-4 flex items-center justify-between print:p-1">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider print:text-[8px]">Total Changes</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 print:text-base print:mt-0">{metrics.total}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5 print:hidden">Tracked log records</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF] print:hidden">
              <History className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs print:p-2 print:border">
          <CardContent className="p-4 flex items-center justify-between print:p-1">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider print:text-[8px]">Subtask Updates</p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 print:text-base print:mt-0">{metrics.subtaskEvents}</h3>
              <p className="text-[10px] text-emerald-600/80 font-medium mt-0.5 print:hidden">WBS status mutations</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 print:hidden">
              <CheckSquare className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs print:p-2 print:border">
          <CardContent className="p-4 flex items-center justify-between print:p-1">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider print:text-[8px]">QA Hold Points</p>
              <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 print:text-base print:mt-0">{metrics.qaApprovals}</h3>
              <p className="text-[10px] text-indigo-600/80 font-medium mt-0.5 print:hidden">Quality inspections</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 print:hidden">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs print:p-2 print:border">
          <CardContent className="p-4 flex items-center justify-between print:p-1">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider print:text-[8px]">Progress Logs</p>
              <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 print:text-base print:mt-0">{metrics.progressLogs}</h3>
              <p className="text-[10px] text-blue-500 font-medium mt-0.5 print:hidden">Daily report snapshots</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 print:hidden">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1 print:p-2 print:border">
          <CardContent className="p-4 flex items-center justify-between print:p-1">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider print:text-[8px]">Deletions</p>
              <h3 className="text-2xl font-black text-red-600 dark:text-red-400 mt-1 print:text-base print:mt-0">{metrics.deletions}</h3>
              <p className="text-[10px] text-red-500 font-medium mt-0.5 print:hidden">High accountability</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 print:hidden">
              <Trash2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Panel Card - Completely Hidden in Print */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Main Search and View Switcher Bar */}
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit trail by activity name, subtask deliverable, user, inspector, or changes (e.g. PTS08, Trench set-out, QA Approved)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* View Mode & Sort Toggle */}
            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              <button
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                title={`Sort ${sortOrder === 'desc' ? 'Oldest First' : 'Newest First'}`}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
              </button>

              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewMode === 'timeline'
                      ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" /> Timeline
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" /> Table
                </button>
              </div>
            </div>
          </div>

          {/* Granular Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            {/* Filter by Activity */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Activity</label>
              <select
                value={selectedActivityId}
                onChange={e => setSelectedActivityId(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-semibold focus:ring-2 focus:ring-[#0B5FFF]"
              >
                <option value="all">All Activities ({activities.length})</option>
                {activities.map(a => (
                  <option key={a.id} value={a.id}>{a.id} - {a.name}</option>
                ))}
              </select>
            </div>

            {/* Filter by Change Category */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Event Category</label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-semibold focus:ring-2 focus:ring-[#0B5FFF]"
              >
                <option value="all">All Events</option>
                <option value="subtask_complete">Subtask Completed (✓)</option>
                <option value="qa_hold_point">QA Hold Points & Sign-Offs (🔒)</option>
                <option value="progress_log">Progress Logs & Output Measurements (📈)</option>
                <option value="subtask_manage">All Subtask Mutations (WBS)</option>
                <option value="status_change">Activity Status Changes</option>
                <option value="deletions">Deletions & Removals</option>
              </select>
            </div>

            {/* Filter by Project */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project</label>
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-semibold focus:ring-2 focus:ring-[#0B5FFF]"
              >
                <option value="all">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Filter by Date Range */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Timeframe</label>
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-semibold focus:ring-2 focus:ring-[#0B5FFF]"
              >
                <option value="all">All Time</option>
                <option value="today">Today Only</option>
                <option value="7days">Past 7 Days</option>
                <option value="30days">Past 30 Days</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Audit Feed Area */}
      {activityAuditLogs.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
              <History className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No matching audit records found</h3>
            <p className="text-xs text-slate-500 max-w-md mt-1">
              There are no logged activity or subtask events matching your search or filter criteria. Adjust your filters or log progress on activities to generate audit history.
            </p>
            {(searchTerm || selectedActivityId !== 'all' || selectedCategory !== 'all' || selectedProjectId !== 'all' || dateFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedActivityId('all');
                  setSelectedCategory('all');
                  setSelectedProjectId('all');
                  setDateFilter('all');
                }}
                className="mt-4 rounded-xl text-xs font-semibold"
              >
                Reset All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'timeline' ? (
        /* TIMELINE VIEW */
        <div className="space-y-6">
          {Object.entries(groupedLogsByDate).map(([dateStr, logs]) => (
            <div key={dateStr} className="space-y-3">
              {/* Date Sticky Header */}
              <div className="sticky top-2 z-10 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-white dark:bg-slate-700 dark:text-slate-100 shadow-sm flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-blue-400" />
                  {dateStr}
                </span>
                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                <span className="text-[11px] font-semibold text-slate-400">
                  {logs.length} {logs.length === 1 ? 'event' : 'events'}
                </span>
              </div>

              {/* Log Cards for Date */}
              <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-slate-200 dark:border-slate-800 ml-3 sm:ml-4">
                {logs.map((log) => {
                  const targetAct = activities.find(a => a.id === log.entityId || a.name === log.activityName);
                  const isQA = log.action.toLowerCase().includes('qa') || log.details.toLowerCase().includes('qa hold point');
                  const isProgress = log.action.toLowerCase().includes('progress');

                  return (
                    <div 
                      key={log.id}
                      onClick={() => setSelectedLogForModal(log)}
                      className="group p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#0B5FFF]/50 hover:shadow-md transition-all cursor-pointer relative print:break-inside-avoid print:p-2.5 print:rounded-lg print:border-slate-300 print:shadow-none"
                    >
                      {/* Timeline Dot Indicator */}
                      <div className="absolute -left-[19px] sm:-left-[27px] top-5 w-3.5 h-3.5 rounded-full bg-white dark:bg-slate-900 border-2 border-[#0B5FFF] group-hover:scale-125 transition-transform print:hidden" />

                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-2 flex-1 min-w-0">
                          {/* Badges & Entity Row */}
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            {getActionBadge(log.action, log.actionType, log.details)}

                            {log.activityName ? (
                              <span 
                                onClick={(e) => {
                                  if (targetAct && onSelectActivity) {
                                    e.stopPropagation();
                                    onSelectActivity(targetAct);
                                  }
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-[#0B5FFF] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold hover:underline"
                                title="Click to view full activity details"
                              >
                                <Building className="h-3 w-3" />
                                {log.activityName}
                              </span>
                            ) : log.entityId && (
                              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                {log.entityId}
                              </span>
                            )}

                            {log.subtaskTitle && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11px] font-semibold">
                                <CheckSquare className="h-3 w-3 text-purple-600" />
                                {log.subtaskTitle}
                              </span>
                            )}
                          </div>

                          {/* Details Text */}
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                            {log.details}
                          </p>

                          {/* Before & After Diffs if present */}
                          {(log.previousValue || log.newValue) && (
                            <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 w-fit flex-wrap">
                              {log.previousValue && (
                                <span className="text-slate-500 line-through">
                                  {log.previousValue}
                                </span>
                              )}
                              {log.previousValue && log.newValue && (
                                <ArrowRight className="h-3 w-3 text-slate-400" />
                              )}
                              {log.newValue && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                  {log.newValue}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Inspector note callout if QA sign-off */}
                          {isQA && log.inspectorName && (
                            <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
                              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Authorized Inspector: {log.inspectorName}</span>
                                {log.metadata?.signatureNote && (
                                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                                    "{log.metadata.signatureNote}"
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right Meta Column */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 text-xs text-slate-400 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                          <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            {log.userId || 'Current User'}
                          </span>
                          <span className="flex items-center gap-1 text-[11px]">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {log.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* DETAILED TABLE VIEW */
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action Type</th>
                  <th className="px-4 py-3">Activity / Scope</th>
                  <th className="px-4 py-3">Subtask / Deliverable</th>
                  <th className="px-4 py-3">Details & Notes</th>
                  <th className="px-4 py-3">User & Actor</th>
                  <th className="px-4 py-3 text-center">Audit ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {activityAuditLogs.map((log) => (
                  <tr 
                    key={log.id}
                    onClick={() => setSelectedLogForModal(log)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors print:break-inside-avoid"
                  >
                    <td className="px-4 py-3 font-mono text-slate-500 print:py-1.5 print:text-[10px]">
                      {new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 print:py-1.5">
                      {getActionBadge(log.action, log.actionType, log.details)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white print:py-1.5 print:text-[10.5px]">
                      {log.activityName || log.entityId || 'Activity'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 print:py-1.5 print:text-[10px]">
                      {log.subtaskTitle || '-'}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-700 dark:text-slate-300 font-medium print:py-1.5 print:text-[10.5px] print:max-w-none print:whitespace-normal" title={log.details}>
                      {log.details}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium print:py-1.5 print:text-[10px]">
                      {log.userId || 'Current User'}
                    </td>
                    <td className="px-4 py-3 font-mono text-center text-slate-400 text-[11px] print:py-1.5 print:text-[9.5px]">
                      {log.id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Detailed Audit Log Modal */}
      {selectedLogForModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in print:hidden"
          onClick={() => setSelectedLogForModal(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-[#0B5FFF]">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Audit Event Details</h3>
                  <span className="font-mono text-xs text-slate-400">{selectedLogForModal.id}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLogForModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Action Classification</span>
                {getActionBadge(selectedLogForModal.action, selectedLogForModal.actionType, selectedLogForModal.details)}
              </div>

              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Description</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  {selectedLogForModal.details}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Actor / User</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedLogForModal.userId || 'Current User'}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Exact Timestamp</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{new Date(selectedLogForModal.timestamp).toLocaleString()}</p>
                </div>
              </div>

              {(selectedLogForModal.previousValue || selectedLogForModal.newValue) && (
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">State Mutation Diff</span>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-mono">
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Previous</span>
                      <span className="text-rose-600 line-through">{selectedLogForModal.previousValue || 'N/A'}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">New Value</span>
                      <span className="text-emerald-600 font-bold">{selectedLogForModal.newValue || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedLogForModal.inspectorName && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-emerald-700 dark:text-emerald-300 font-bold uppercase text-[10px] block">QA Inspector Sign-Off</span>
                  <p className="font-bold text-emerald-900 dark:text-emerald-100 mt-0.5">{selectedLogForModal.inspectorName}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLogForModal(null)}
                className="rounded-xl text-xs font-semibold px-4"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
