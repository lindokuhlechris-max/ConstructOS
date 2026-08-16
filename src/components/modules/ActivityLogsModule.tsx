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
  Info,
  Check,
  ChevronRight,
  ShieldCheck,
  Tag,
  Layers,
  ArrowUpDown,
  Printer
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, cn } from '../ui';
import { useAppContext } from '../../context/AppContext';
import { AuditLog } from '../../types';
import { ConsolidatedActivityLogsPdfModal } from '../ConsolidatedActivityLogsPdfModal';

interface ActivityLogsModuleProps {
  projectId?: string;
  onBack?: () => void;
}

export function ActivityLogsModule({ projectId, onBack }: ActivityLogsModuleProps) {
  const { auditLogs, projects, currentUserProfile, userRole } = useAppContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || 'all');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [selectedUserRole, setSelectedUserRole] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [selectedLogForModal, setSelectedLogForModal] = useState<AuditLog | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Multi-Selection State for Consolidated PDF Report Generation
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set());
  const [isConsolidatedPdfModalOpen, setIsConsolidatedPdfModalOpen] = useState(false);
  const [pdfReportDate, setPdfReportDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Filtered Audit Logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // Project filter
      if (selectedProjectId !== 'all' && log.projectId !== selectedProjectId) {
        return false;
      }

      // Entity type filter
      if (selectedEntityType !== 'all') {
        const entity = log.entityType || '';
        if (selectedEntityType === 'Labour' && !entity.includes('Labour') && !log.action.toLowerCase().includes('labour')) return false;
        if (selectedEntityType === 'Activity' && !entity.includes('Activity') && !log.action.toLowerCase().includes('activity')) return false;
        if (selectedEntityType === 'Equipment' && !entity.includes('Equipment') && !log.action.toLowerCase().includes('equipment')) return false;
        if (selectedEntityType === 'Material' && !entity.includes('Material') && !log.action.toLowerCase().includes('material')) return false;
        if (selectedEntityType === 'Safety' && !entity.includes('Safety') && !log.action.toLowerCase().includes('safety')) return false;
        if (selectedEntityType === 'Report' && !entity.includes('Report') && !log.action.toLowerCase().includes('report')) return false;
        if (selectedEntityType === 'Profile' && !entity.includes('Profile') && !log.action.toLowerCase().includes('role') && !log.action.toLowerCase().includes('profile')) return false;
      }

      // Action type filter
      if (selectedActionType !== 'all') {
        const actionLower = log.action.toLowerCase();
        const actionType = log.actionType || '';
        if (selectedActionType === 'delete' && actionType !== 'delete' && !actionLower.includes('delete') && !actionLower.includes('remove')) return false;
        if (selectedActionType === 'update' && actionType !== 'update' && !actionLower.includes('edit') && !actionLower.includes('update') && !actionLower.includes('modify')) return false;
        if (selectedActionType === 'create' && actionType !== 'create' && !actionLower.includes('add') && !actionLower.includes('create') && !actionLower.includes('record')) return false;
        if (selectedActionType === 'status' && actionType !== 'status_change' && !actionLower.includes('status')) return false;
      }

      // User Role filter
      if (selectedUserRole !== 'all') {
        const roleStr = (log.userRole || log.userId || '').toLowerCase();
        if (!roleStr.includes(selectedUserRole.toLowerCase())) return false;
      }

      // Date Range filter
      if (dateFilter !== 'all') {
        const logDate = new Date(log.timestamp).getTime();
        const now = Date.now();
        if (dateFilter === 'today') {
          const todayStart = new Date().setHours(0, 0, 0, 0);
          if (logDate < todayStart) return false;
        } else if (dateFilter === '7days') {
          if (logDate < now - 7 * 24 * 3600 * 1000) return false;
        } else if (dateFilter === '30days') {
          if (logDate < now - 30 * 24 * 3600 * 1000) return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchAction = log.action.toLowerCase().includes(term);
        const matchDetails = log.details.toLowerCase().includes(term);
        const matchUser = log.userId.toLowerCase().includes(term);
        const matchId = log.id.toLowerCase().includes(term);
        const matchEntityId = (log.entityId || '').toLowerCase().includes(term);
        if (!matchAction && !matchDetails && !matchUser && !matchId && !matchEntityId) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [auditLogs, selectedProjectId, selectedEntityType, selectedActionType, selectedUserRole, dateFilter, searchTerm, sortOrder]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = auditLogs.length;
    const deletions = auditLogs.filter(l => (l.actionType === 'delete' || l.action.toLowerCase().includes('delete') || l.action.toLowerCase().includes('remove'))).length;
    const updates = auditLogs.filter(l => (l.actionType === 'update' || l.action.toLowerCase().includes('edit') || l.action.toLowerCase().includes('update'))).length;
    const uniqueUsers = new Set(auditLogs.map(l => l.userId)).size;

    return { total, deletions, updates, uniqueUsers };
  }, [auditLogs]);

  const getActionBadge = (action: string, actionType?: string) => {
    const lower = action.toLowerCase();
    if (actionType === 'delete' || lower.includes('delete') || lower.includes('remove')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900/60 shrink-0">
          <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" /> DELETED
        </span>
      );
    }
    if (actionType === 'update' || lower.includes('edit') || lower.includes('update') || lower.includes('modify')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 shrink-0">
          <Edit3 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> EDITED
        </span>
      );
    }
    if (actionType === 'create' || lower.includes('add') || lower.includes('create') || lower.includes('record')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 shrink-0">
          <Plus className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> CREATED
        </span>
      );
    }
    if (actionType === 'status_change' || lower.includes('status')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 shrink-0">
          <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> STATUS
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-900/60 shrink-0">
        <Tag className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /> LOGGED
      </span>
    );
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['Audit ID', 'Timestamp', 'User & Role', 'Action', 'Entity Type', 'Entity ID', 'Details', 'Previous Value', 'New Value'];
    const rows = filteredLogs.map(log => [
      `"${log.id}"`,
      `"${new Date(log.timestamp).toLocaleString()}"`,
      `"${log.userId.replace(/"/g, '""')}"`,
      `"${log.action.replace(/"/g, '""')}"`,
      `"${log.entityType || 'General'}"`,
      `"${log.entityId || 'N/A'}"`,
      `"${log.details.replace(/"/g, '""')}"`,
      `"${(log.previousValue || '').replace(/"/g, '""')}"`,
      `"${(log.newValue || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `constructfield_audit_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelectLog = (id: string) => {
    setSelectedLogIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (selectedLogIds.size === filteredLogs.length && filteredLogs.length > 0) {
      setSelectedLogIds(new Set());
    } else {
      setSelectedLogIds(new Set(filteredLogs.map(l => l.id)));
    }
  };

  const handleSelectToday = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = auditLogs.filter(l => {
      const logDate = new Date(l.timestamp).toISOString().split('T')[0];
      return logDate === todayStr;
    });
    setSelectedLogIds(new Set(todayLogs.map(l => l.id)));
    setPdfReportDate(todayStr);
  };

  const handleOpenConsolidatedPdfModal = (customDate?: string) => {
    const targetDate = customDate || new Date().toISOString().split('T')[0];
    setPdfReportDate(targetDate);
    setIsConsolidatedPdfModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors mr-1"
                title="Back to previous page"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-xl text-[#0B5FFF]">
              <History className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Project Activity & Audit Trail
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold">
                  Immutable Governance
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time accountability tracking for sensitive data edits, deletions, and site state mutations.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <Button
            onClick={() => handleOpenConsolidatedPdfModal()}
            className="bg-[#0B5FFF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm h-9"
            title="Generate consolidated PDF summary report for current day"
          >
            <FileText className="h-4 w-4" /> Daily Consolidated PDF Report
          </Button>
          <button
            onClick={() => handleOpenConsolidatedPdfModal()}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-xs h-9"
            title="Print activity audit trail using browser print"
          >
            <Printer className="h-4 w-4 text-slate-600 dark:text-slate-300" /> Print
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-xs h-9"
          >
            <Download className="h-4 w-4 text-[#0B5FFF]" /> Export (CSV)
          </button>
        </div>
      </div>

      {/* Metrics Counter Dashboard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Audit Events</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{metrics.total}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Tracked in project ledger</p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF]">
              <History className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sensitive Deletions</p>
              <h3 className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{metrics.deletions}</h3>
              <p className="text-[10px] text-red-500 font-semibold mt-0.5">High accountability records</p>
            </div>
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
              <Trash2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Modifications / Edits</p>
              <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{metrics.updates}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Field updates & diffs</p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Edit3 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Logged Users</p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{metrics.uniqueUsers}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Active change contributors</p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar Card */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4 md:p-5 space-y-4">
          {/* Main Search Input */}
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit trail by keyword, user name, action, or record ID (e.g., Labour, DELETED, ACT-101)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0 self-end md:self-auto">
              <button
                onClick={() => setViewMode('timeline')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                  viewMode === 'timeline'
                    ? "bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                <Layers className="h-3.5 w-3.5" /> Timeline View
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                  viewMode === 'table'
                    ? "bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                <FileText className="h-3.5 w-3.5" /> Detailed Table
              </button>
            </div>
          </div>

          {/* Granular Filters Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {/* Project Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project</label>
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium focus:ring-2 focus:ring-[#0B5FFF]"
              >
                <option value="all">All Construction Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Entity Module Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Module / Entity</label>
              <select
                value={selectedEntityType}
                onChange={e => setSelectedEntityType(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium focus:ring-2 focus:ring-[#0B5FFF]"
              >
                <option value="all">All Entity Modules</option>
                <option value="Labour">Labour & Attendance</option>
                <option value="Activity">Tasks & Activities</option>
                <option value="Equipment">Equipment & Machinery</option>
                <option value="Material">Materials & Stock</option>
                <option value="Safety">Safety & Incidents</option>
                <option value="Report">Daily Site Reports</option>
                <option value="Profile">Roles & Profiles</option>
              </select>
            </div>

            {/* Action Type Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Action Type</label>
              <select
                value={selectedActionType}
                onChange={e => setSelectedActionType(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium focus:ring-2 focus:ring-[#0B5FFF]"
              >
                <option value="all">All Action Types</option>
                <option value="delete">Deletions Only (High Risk)</option>
                <option value="update">Edits & Modifications</option>
                <option value="create">New Records Created</option>
                <option value="status">Status Changes</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Timeframe</label>
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium focus:ring-2 focus:ring-[#0B5FFF]"
              >
                <option value="all">All Time</option>
                <option value="today">Today Only</option>
                <option value="7days">Past 7 Days</option>
                <option value="30days">Past 30 Days</option>
              </select>
            </div>

            {/* Sort Order Toggle */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sort Chronology</label>
              <button
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
                <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Audit Logs Display */}
      {filteredLogs.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400 mb-3">
              <History className="h-10 w-10" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No matching audit log entries found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Try adjusting your search criteria or filter options to inspect other activity records.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearchTerm('');
                setSelectedProjectId('all');
                setSelectedEntityType('all');
                setSelectedActionType('all');
                setDateFilter('all');
              }}
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'timeline' ? (
        /* Timeline View */
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardHeader className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#0B5FFF]" />
                Audit Trail Timeline ({filteredLogs.length} Records)
              </CardTitle>
              {selectedLogIds.size > 0 && (
                <Badge className="bg-blue-100 text-[#0B5FFF] border-blue-200 dark:bg-blue-950/60 dark:text-blue-300">
                  {selectedLogIds.size} Selected for Report
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectToday}
                className="text-xs h-8 font-bold gap-1.5"
              >
                <Calendar className="h-3.5 w-3.5 text-[#0B5FFF]" /> Select Today's Logs
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAllFiltered}
                className="text-xs h-8 font-bold"
              >
                {selectedLogIds.size === filteredLogs.length && filteredLogs.length > 0
                  ? 'Deselect All'
                  : 'Select All Filtered'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-6">
              {filteredLogs.map(log => {
                const isDeletion = log.actionType === 'delete' || log.action.toLowerCase().includes('delete') || log.action.toLowerCase().includes('remove');
                const isSelected = selectedLogIds.has(log.id);

                return (
                  <div key={log.id} className="relative group">
                    {/* Circle marker on timeline */}
                    <div className={cn(
                      "absolute -left-[35px] top-1 h-6 w-6 rounded-full border-2 flex items-center justify-center bg-white dark:bg-slate-900 transition-transform group-hover:scale-110",
                      isSelected
                        ? "border-[#0B5FFF] bg-[#0B5FFF] text-white ring-4 ring-blue-100 dark:ring-blue-950/60"
                        : isDeletion 
                          ? "border-red-500 text-red-500" 
                          : "border-blue-500 text-blue-500"
                    )}>
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
                      ) : (
                        <div className={cn("h-2 w-2 rounded-full", isDeletion ? "bg-red-500" : "bg-blue-500")} />
                      )}
                    </div>

                    <div className={cn(
                      "p-4 rounded-2xl border transition-all space-y-2.5",
                      isSelected
                        ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-xs"
                        : "bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60"
                    )}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectLog(log.id)}
                            className="h-4 w-4 rounded text-[#0B5FFF] focus:ring-[#0B5FFF] cursor-pointer"
                            title="Select log for PDF consolidation"
                          />
                          {getActionBadge(log.action, log.actionType)}
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {log.action}
                          </h4>
                          {log.entityType && (
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {log.entityType}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {new Date(log.timestamp).toLocaleString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Log details content */}
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                        {log.details}
                      </p>

                      {/* Previous vs New Diff Preview if present */}
                      {(log.previousValue || log.newValue) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[11px]">
                          {log.previousValue && (
                            <div className="p-2 rounded-xl bg-red-50/60 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900/40 text-red-900 dark:text-red-300">
                              <span className="font-bold text-[10px] uppercase block text-red-600 dark:text-red-400 mb-0.5">Previous State:</span>
                              <span className="font-mono">{log.previousValue}</span>
                            </div>
                          )}
                          {log.newValue && (
                            <div className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300">
                              <span className="font-bold text-[10px] uppercase block text-emerald-600 dark:text-emerald-400 mb-0.5">Updated State:</span>
                              <span className="font-mono">{log.newValue}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Metadata Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/50 text-[11px] text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                            <User className="h-3 w-3 text-[#0B5FFF]" />
                            {log.userId}
                          </span>
                          <span className="font-mono text-slate-400">ID: {log.id}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleSelectLog(log.id)}
                            className={cn(
                              "text-[11px] font-bold transition-colors",
                              isSelected ? "text-blue-600 hover:underline" : "text-slate-500 hover:text-slate-800"
                            )}
                          >
                            {isSelected ? '✓ Included in Report' : '+ Select for PDF'}
                          </button>
                          <button
                            onClick={() => setSelectedLogForModal(log)}
                            className="text-[11px] font-bold text-[#0B5FFF] hover:underline flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" /> Inspect Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Detailed Table View */
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
              <span>{filteredLogs.length} Records displayed</span>
              {selectedLogIds.size > 0 && (
                <Badge className="bg-blue-100 text-[#0B5FFF] border-blue-200 dark:bg-blue-950/60 dark:text-blue-300">
                  {selectedLogIds.size} Selected for PDF Summary
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectToday}
                className="text-xs h-7 font-bold gap-1"
              >
                <Calendar className="h-3 w-3 text-[#0B5FFF]" /> Select Today's Logs
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAllFiltered}
                className="text-xs h-7 font-bold"
              >
                {selectedLogIds.size === filteredLogs.length && filteredLogs.length > 0
                  ? 'Deselect All'
                  : 'Select All Filtered'}
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedLogIds.size === filteredLogs.length && filteredLogs.length > 0}
                      onChange={toggleSelectAllFiltered}
                      className="h-4 w-4 rounded text-[#0B5FFF] focus:ring-[#0B5FFF] cursor-pointer"
                      title="Select all filtered logs"
                    />
                  </th>
                  <th className="py-3 px-4">Action Badge</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User & Role</th>
                  <th className="py-3 px-4">Entity & ID</th>
                  <th className="py-3 px-4">Audit Action</th>
                  <th className="py-3 px-4">Action Details</th>
                  <th className="py-3 px-4 text-right pr-6">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {filteredLogs.map(log => {
                  const isSelected = selectedLogIds.has(log.id);

                  return (
                    <tr 
                      key={log.id} 
                      className={cn(
                        "transition-colors",
                        isSelected 
                          ? "bg-blue-50/70 dark:bg-blue-950/30" 
                          : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                      )}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectLog(log.id)}
                          className="h-4 w-4 rounded text-[#0B5FFF] focus:ring-[#0B5FFF] cursor-pointer"
                          title="Select log for PDF consolidation"
                        />
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {getActionBadge(log.action, log.actionType)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {new Date(log.timestamp).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {log.userId}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">
                          {log.entityType || 'General'} {log.entityId ? `#${log.entityId}` : ''}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-600 dark:text-slate-400">
                        {log.details}
                      </td>
                      <td className="py-3 px-4 text-right pr-6">
                        <button
                          onClick={() => setSelectedLogForModal(log)}
                          className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#0B5FFF] hover:bg-blue-100 dark:hover:bg-blue-900/80 transition-colors font-bold text-[11px] inline-flex items-center gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* STICKY FLOATING SELECTION ACTION BAR */}
      {selectedLogIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-3xl bg-slate-900 text-white rounded-2xl p-3 md:p-4 shadow-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0B5FFF] rounded-xl text-white">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-2">
                <span>{selectedLogIds.size} Activity Logs Selected</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Ready to generate consolidated daily summary PDF report
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedLogIds(new Set())}
              className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 transition-colors"
            >
              Clear
            </button>
            <Button
              size="sm"
              onClick={() => handleOpenConsolidatedPdfModal()}
              className="bg-[#0B5FFF] hover:bg-blue-600 text-white font-bold text-xs gap-2 rounded-xl px-4 shadow-md"
            >
              <FileText className="h-4 w-4" />
              Generate Daily PDF Report ({selectedLogIds.size})
            </Button>
          </div>
        </div>
      )}

      {/* CONSOLIDATED ACTIVITY LOGS PDF SUMMARY REPORT MODAL */}
      <ConsolidatedActivityLogsPdfModal
        isOpen={isConsolidatedPdfModalOpen}
        onClose={() => setIsConsolidatedPdfModalOpen(false)}
        logs={
          selectedLogIds.size > 0 
            ? auditLogs.filter(l => selectedLogIds.has(l.id))
            : auditLogs
        }
        projects={projects}
        currentUserProfile={currentUserProfile}
        defaultDate={pdfReportDate}
        defaultProjectId={selectedProjectId}
      />

      {/* INSPECT AUDIT LOG MODAL */}
      {selectedLogForModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 text-[#0B5FFF] rounded-2xl">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Audit Record Certificate
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Record Hash ID: {selectedLogForModal.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLogForModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700 dark:text-slate-300">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                  <span className="text-slate-400 font-semibold">Action Category:</span>
                  <div>{getActionBadge(selectedLogForModal.action, selectedLogForModal.actionType)}</div>
                </div>

                <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                  <span className="text-slate-400 font-semibold">Logged User:</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-[#0B5FFF]" />
                    {selectedLogForModal.userId}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                  <span className="text-slate-400 font-semibold">Exact Timestamp:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {new Date(selectedLogForModal.timestamp).toISOString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">Affected Entity:</span>
                  <span className="font-mono bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200">
                    {selectedLogForModal.entityType || 'General'} {selectedLogForModal.entityId ? `#${selectedLogForModal.entityId}` : ''}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1 uppercase tracking-wider text-[10px]">
                  Full Change Log Details
                </h4>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                  {selectedLogForModal.details}
                </div>
              </div>

              {(selectedLogForModal.previousValue || selectedLogForModal.newValue) && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                    State Diff Analysis
                  </h4>
                  {selectedLogForModal.previousValue && (
                    <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-900 dark:text-red-300">
                      <span className="font-bold text-[10px] uppercase block text-red-600 dark:text-red-400 mb-1">
                        Previous State:
                      </span>
                      <pre className="text-xs font-mono whitespace-pre-wrap">{selectedLogForModal.previousValue}</pre>
                    </div>
                  )}
                  {selectedLogForModal.newValue && (
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-300">
                      <span className="font-bold text-[10px] uppercase block text-emerald-600 dark:text-emerald-400 mb-1">
                        New / Updated State:
                      </span>
                      <pre className="text-xs font-mono whitespace-pre-wrap">{selectedLogForModal.newValue}</pre>
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 text-blue-900 dark:text-blue-300 text-[11px] flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#0B5FFF] shrink-0" />
                <span>
                  <strong>Data Integrity Guarantee:</strong> This audit log entry is cryptographically appended to the local & cloud Firestore synchronisation store and cannot be altered or purged by non-administrator accounts.
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
              <Button onClick={() => setSelectedLogForModal(null)} className="bg-[#0B5FFF] hover:bg-blue-600 text-white font-bold text-xs">
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
