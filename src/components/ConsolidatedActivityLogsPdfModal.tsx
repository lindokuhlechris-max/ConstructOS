import React, { useState, useMemo } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  FileText, 
  Calendar, 
  User, 
  Building, 
  Layers, 
  ShieldCheck, 
  Trash2, 
  Edit3, 
  Plus, 
  CheckCircle2, 
  Filter, 
  Info,
  Clock,
  Sparkles,
  Tag
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from './ui';
import { AuditLog, Project } from '../types';
import { exportConsolidatedActivityLogsPDF } from '../lib/pdfReportExport';

interface ConsolidatedActivityLogsPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLog[];
  projects: Project[];
  currentUserProfile?: { name?: string; role?: string; email?: string } | null;
  defaultDate?: string;
  defaultProjectId?: string;
}

export function ConsolidatedActivityLogsPdfModal({
  isOpen,
  onClose,
  logs,
  projects,
  currentUserProfile,
  defaultDate,
  defaultProjectId = 'all'
}: ConsolidatedActivityLogsPdfModalProps) {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Form State
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate || todayStr);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjectId);
  const [reportTitle, setReportTitle] = useState<string>(
    `Consolidated Daily Activity Logs Summary - ${defaultDate || todayStr}`
  );
  const [preparedBy, setPreparedBy] = useState<string>(
    currentUserProfile?.name 
      ? `${currentUserProfile.name} (${currentUserProfile.role || 'Site Manager'})`
      : 'Site Supervisor / Operations Manager'
  );
  const [supervisorNotes, setSupervisorNotes] = useState<string>(
    'Summary of daily site operations, task status progressions, crew allocations, and system audit events verified for the shift.'
  );
  const [includeDiffs, setIncludeDiffs] = useState<boolean>(true);
  const [includeSignoff, setIncludeSignoff] = useState<boolean>(true);

  // Selected Log IDs inside the modal (defaults to all logs matching selected date)
  const [activeTab, setActiveTab] = useState<'preview' | 'configure' | 'logs'>('preview');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filter logs for selected date & project
  const availableLogsForDate = useMemo(() => {
    return logs.filter(log => {
      // Date matching
      const logDateStr = new Date(log.timestamp).toISOString().split('T')[0];
      if (selectedDate && logDateStr !== selectedDate) {
        return false;
      }
      // Project matching
      if (selectedProjectId !== 'all' && log.projectId !== selectedProjectId) {
        return false;
      }
      return true;
    });
  }, [logs, selectedDate, selectedProjectId]);

  // If initial logs are passed in and match current selection, use them, or default to all date-matching logs
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(() => {
    return new Set(availableLogsForDate.map(l => l.id));
  });

  // Keep selectedLogIds in sync if date changes and selection becomes empty
  React.useEffect(() => {
    setSelectedLogIds(new Set(availableLogsForDate.map(l => l.id)));
    setReportTitle(`Consolidated Daily Activity Logs Summary - ${selectedDate}`);
  }, [selectedDate, selectedProjectId, availableLogsForDate]);

  const finalSelectedLogs = useMemo(() => {
    return availableLogsForDate.filter(l => selectedLogIds.has(l.id));
  }, [availableLogsForDate, selectedLogIds]);

  // Project display name
  const currentProjectName = useMemo(() => {
    if (selectedProjectId === 'all') return 'All Active Site Projects';
    const found = projects.find(p => p.id === selectedProjectId);
    return found ? `${found.name} (${found.id})` : selectedProjectId;
  }, [projects, selectedProjectId]);

  // KPI Calculations
  const metrics = useMemo(() => {
    const total = finalSelectedLogs.length;
    const creates = finalSelectedLogs.filter(l => l.actionType === 'create' || l.action.toLowerCase().includes('create') || l.action.toLowerCase().includes('add')).length;
    const updates = finalSelectedLogs.filter(l => l.actionType === 'update' || l.action.toLowerCase().includes('update') || l.action.toLowerCase().includes('edit')).length;
    const deletes = finalSelectedLogs.filter(l => l.actionType === 'delete' || l.action.toLowerCase().includes('delete') || l.action.toLowerCase().includes('remove')).length;
    const statusChanges = finalSelectedLogs.filter(l => l.actionType === 'status_change' || l.action.toLowerCase().includes('status')).length;
    const uniqueUsers = new Set(finalSelectedLogs.map(l => l.userId)).size;

    return { total, creates, updates, deletes, statusChanges, uniqueUsers };
  }, [finalSelectedLogs]);

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

  const toggleSelectAll = () => {
    if (selectedLogIds.size === availableLogsForDate.length) {
      setSelectedLogIds(new Set());
    } else {
      setSelectedLogIds(new Set(availableLogsForDate.map(l => l.id)));
    }
  };

  const handleDownloadPDF = () => {
    if (finalSelectedLogs.length === 0) return;
    setIsExporting(true);
    try {
      exportConsolidatedActivityLogsPDF({
        logs: finalSelectedLogs,
        projects,
        reportDate: selectedDate,
        reportTitle,
        projectName: currentProjectName,
        preparedBy,
        supervisorNotes,
        includeDiffs,
        includeSignoff
      });
    } catch (err) {
      console.error('Error exporting consolidated PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyMarkdown = () => {
    const lines = [
      `# ${reportTitle}`,
      `**Target Date:** ${selectedDate} | **Scope:** ${currentProjectName}`,
      `**Prepared By:** ${preparedBy}`,
      `**Total Logs:** ${finalSelectedLogs.length} (Created: ${metrics.creates}, Updated: ${metrics.updates}, Deleted: ${metrics.deletes})`,
      '',
      '## Daily Activity Log Records',
      '| Time | User | Entity | Action | Details |',
      '| --- | --- | --- | --- | --- |',
      ...finalSelectedLogs.map(l => 
        `| ${new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | ${l.userId} | ${l.entityType || 'General'} | ${l.action} | ${l.details.replace(/\|/g, '-')} |`
      ),
      '',
      `## Notes:`,
      supervisorNotes
    ];

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    });
  };

  const handlePrint = () => {
    handleDownloadPDF();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4 overflow-y-auto">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[94vh] overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* MODAL HEADER */}
        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 text-[#0B5FFF] rounded-2xl">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Consolidated Daily Activity Logs Report
                </h2>
                <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold">
                  PDF Generator
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Consolidate multiple activity logs, audit records, and field updates into an executive daily PDF summary report.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-700/60 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'preview' ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'}`}
              >
                Report Preview
              </button>
              <button
                onClick={() => setActiveTab('configure')}
                className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'configure' ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'}`}
              >
                Configure Settings
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'logs' ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'}`}
              >
                Select Logs ({finalSelectedLogs.length})
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* CONTROLS STRIP */}
        <div className="px-4 md:px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <Calendar className="h-3.5 w-3.5 text-[#0B5FFF]" />
              <span className="font-semibold text-slate-500">Report Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              />
              {selectedDate !== todayStr && (
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className="ml-1 text-[10px] font-bold text-[#0B5FFF] hover:underline bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded"
                >
                  Today
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <Building className="h-3.5 w-3.5 text-[#0B5FFF]" />
              <span className="font-semibold text-slate-500">Project:</span>
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer max-w-[150px] md:max-w-[220px] truncate"
              >
                <option value="all">All Site Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Metrics Tag */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">
              <strong className="text-slate-900 dark:text-white font-bold">{finalSelectedLogs.length}</strong> of {availableLogsForDate.length} logs included
            </span>
            <button
              onClick={toggleSelectAll}
              className="text-[11px] font-bold text-[#0B5FFF] hover:underline"
            >
              {selectedLogIds.size === availableLogsForDate.length ? 'Deselect All' : 'Select All Today'}
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: REPORT PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              {/* Executive Summary Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                <div className="p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Logs Selected</span>
                  <div className="text-xl font-black text-blue-950 dark:text-blue-100 mt-0.5">{metrics.total}</div>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Created</span>
                  <div className="text-xl font-black text-emerald-950 dark:text-emerald-100 mt-0.5">{metrics.creates}</div>
                </div>
                <div className="p-3 rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50">
                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider block">Edits / Updates</span>
                  <div className="text-xl font-black text-sky-950 dark:text-sky-100 mt-0.5">{metrics.updates}</div>
                </div>
                <div className="p-3 rounded-2xl bg-red-50/80 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50">
                  <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block">Deletions</span>
                  <div className="text-xl font-black text-red-950 dark:text-red-100 mt-0.5">{metrics.deletes}</div>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Status Shifts</span>
                  <div className="text-xl font-black text-amber-950 dark:text-amber-100 mt-0.5">{metrics.statusChanges}</div>
                </div>
                <div className="p-3 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50">
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">Active Users</span>
                  <div className="text-xl font-black text-purple-950 dark:text-purple-100 mt-0.5">{metrics.uniqueUsers}</div>
                </div>
              </div>

              {/* Styled Document Sheet Preview */}
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md overflow-hidden text-slate-800 dark:text-slate-200">
                {/* Simulated Document Banner */}
                <div className="bg-[#0B5FFF] text-white p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black tracking-tight">
                      CONSTRUCTOS | ACTIVITY LOGS SUMMARY REPORT
                    </h3>
                    <p className="text-xs text-blue-100 mt-0.5">
                      Official Site Daily Log & Audit Verification  •  Target Date: {selectedDate}
                    </p>
                  </div>
                  <div className="text-right text-xs font-mono text-blue-100">
                    <div>Ref: CAL-{selectedDate.replace(/-/g, '')}-{finalSelectedLogs.length}</div>
                    <div className="text-[10px] text-blue-200">Generated: {new Date().toLocaleTimeString()}</div>
                  </div>
                </div>

                {/* Simulated Metadata Box */}
                <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[10px] block">Report Title & Scope</span>
                    <div className="font-black text-sm text-slate-900 dark:text-white mt-0.5">{reportTitle}</div>
                    <div className="text-slate-600 dark:text-slate-400 mt-0.5">Project: <strong>{currentProjectName}</strong></div>
                  </div>
                  <div className="md:text-right">
                    <span className="font-bold text-slate-400 uppercase text-[10px] block">Verification Authority</span>
                    <div className="font-semibold text-slate-900 dark:text-white mt-0.5">Prepared By: {preparedBy}</div>
                    <div className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 flex md:justify-end items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> Immutable Audit Ledger Verified
                    </div>
                  </div>
                </div>

                {/* Simulated Activity Logs Table */}
                <div className="p-4 md:p-5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#0B5FFF]" />
                    Chronological Activity Log Breakdown ({finalSelectedLogs.length} Records)
                  </h4>

                  {finalSelectedLogs.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      <FileText className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-xs">No activity logs selected for {selectedDate}.</p>
                      <p className="text-[11px] text-slate-500 mt-1">Switch to the "Select Logs" tab or pick another date above.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-slate-100/80 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-bold">
                          <tr>
                            <th className="py-2.5 px-3 rounded-l-lg">Time</th>
                            <th className="py-2.5 px-3">User</th>
                            <th className="py-2.5 px-3">Module</th>
                            <th className="py-2.5 px-3">Action</th>
                            <th className="py-2.5 px-3 rounded-r-lg">Details & Recorded Mutation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                          {finalSelectedLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                              <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                                {log.userId}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px]">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                                  {log.entityType || 'General'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-bold text-[#0B5FFF]">
                                {log.action}
                              </td>
                              <td className="py-2.5 px-3 text-[11px] max-w-md truncate">
                                {log.details}
                                {includeDiffs && (log.previousValue || log.newValue) && (
                                  <span className="text-slate-400 ml-1 font-mono text-[10px]">
                                    {log.previousValue ? `[Prev: ${log.previousValue.slice(0, 20)}...]` : ''} ➔ {log.newValue ? `[New: ${log.newValue.slice(0, 20)}...]` : ''}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Field Notes Section */}
                {supervisorNotes && (
                  <div className="p-4 md:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 text-xs">
                    <h5 className="font-bold text-slate-900 dark:text-white mb-1 uppercase tracking-wider text-[10px]">
                      Supervisor Field Observations & Log Remarks
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      {supervisorNotes}
                    </p>
                  </div>
                )}

                {/* Sign-off Block */}
                {includeSignoff && (
                  <div className="p-4 md:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                    <div className="text-[11px] text-slate-500">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">Management Seal & Verification Certificate</p>
                      <p>Certified accurate according to on-site shift records and immutable audit entries.</p>
                    </div>
                    <div className="flex items-center gap-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl text-[11px]">
                      <div>
                        <span className="text-slate-400 font-bold block text-[9px] uppercase">Authorized Signature</span>
                        <span className="font-serif italic font-bold text-slate-800 dark:text-slate-200">Verified by {preparedBy.split(' ')[0]}</span>
                      </div>
                      <div className="border-l border-slate-200 dark:border-slate-700 pl-4">
                        <span className="text-slate-400 font-bold block text-[9px] uppercase">Date Sealed</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedDate}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CONFIGURE SETTINGS */}
          {activeTab === 'configure' && (
            <div className="space-y-4 max-w-2xl mx-auto text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Official Report Title
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={e => setReportTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-semibold focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    Report Target Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-semibold focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    Prepared By Authority
                  </label>
                  <input
                    type="text"
                    value={preparedBy}
                    onChange={e => setPreparedBy(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-semibold focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Daily Field Observations & Supervisor Remarks
                </label>
                <textarea
                  rows={4}
                  value={supervisorNotes}
                  onChange={e => setSupervisorNotes(e.target.value)}
                  placeholder="Enter overall summary comments, site weather impact notes, progress milestones, or handover instructions..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none leading-relaxed"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                  Report Inclusion Toggles
                </h4>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDiffs}
                    onChange={e => setIncludeDiffs(e.target.checked)}
                    className="h-4 w-4 rounded text-[#0B5FFF] focus:ring-[#0B5FFF]"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Include Detailed State Diffs (Previous vs. New Modified Values)
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSignoff}
                    onChange={e => setIncludeSignoff(e.target.checked)}
                    className="h-4 w-4 rounded text-[#0B5FFF] focus:ring-[#0B5FFF]"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Include Authorized Sign-Off & Verification Certificate Block
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: LOGS SELECTION LIST */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    Select Activity Logs to Include in PDF Report
                  </h4>
                  <p className="text-slate-500">
                    Toggle individual logs or include all matching entries for {selectedDate}.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={toggleSelectAll}
                    className="text-xs h-8 font-bold"
                  >
                    {selectedLogIds.size === availableLogsForDate.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </div>

              {availableLogsForDate.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                  No activity log entries found on date <strong>{selectedDate}</strong>.
                </div>
              ) : (
                <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                  {availableLogsForDate.map(log => {
                    const isChecked = selectedLogIds.has(log.id);
                    return (
                      <div
                        key={log.id}
                        onClick={() => toggleSelectLog(log.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 text-xs ${
                          isChecked 
                            ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' 
                            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="h-4 w-4 mt-0.5 rounded text-[#0B5FFF] focus:ring-[#0B5FFF] cursor-pointer"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {log.action}
                              </span>
                              <Badge variant="outline" className="text-[10px] font-mono">
                                {log.entityType || 'General'}
                              </Badge>
                            </div>
                            <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                              <Clock className="h-3 w-3 text-slate-400" />
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 font-medium">
                            {log.details}
                          </p>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-0.5">
                            <span>User: <strong>{log.userId}</strong></span>
                            <span>•</span>
                            <span className="font-mono">ID: {log.id}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 md:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyMarkdown}
              className="gap-1.5 text-xs font-bold rounded-xl"
            >
              {copiedSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied Summary!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" /> Copy Markdown
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs font-bold rounded-xl"
            >
              <Printer className="h-3.5 w-3.5 text-slate-500" /> Print
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-bold rounded-xl"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadPDF}
              disabled={finalSelectedLogs.length === 0 || isExporting}
              className="bg-[#0B5FFF] hover:bg-blue-600 text-white font-bold text-xs gap-2 rounded-xl px-5 shadow-sm"
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Generating PDF...' : `Generate Consolidated PDF (${finalSelectedLogs.length})`}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
