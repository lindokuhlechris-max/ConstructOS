import React, { useState } from 'react';
import { Activity, ActivityStatus, WORKSTREAMS, WorkstreamType } from '../types';
import { Badge, ProgressBar, Button } from './ui';
import { 
  PlayCircle, 
  CheckCircle2, 
  AlertTriangle, 
  CalendarClock, 
  Users, 
  CheckSquare, 
  Link2, 
  ArrowUpDown, 
  MoreVertical, 
  Eye, 
  Edit3, 
  Sliders, 
  Download, 
  Printer, 
  Trash2, 
  Compass, 
  Building2, 
  Package, 
  ShieldAlert, 
  ShieldCheck, 
  Zap, 
  Tag,
  Share2,
  Image as ImageIcon 
} from 'lucide-react';

interface ActivityDataTableProps {
  activities: Activity[];
  onSelectActivity: (activity: Activity) => void;
  onOpenSlideOver: (activity: Activity) => void;
  onOpenLogProgress: (activity: Activity) => void;
  onDispatchShiftTicket?: (activity: Activity) => void;
  onUpdateStatus: (activityId: string, newStatus: ActivityStatus) => void;
  onBulkStatusChange?: (activityIds: string[], newStatus: ActivityStatus) => void;
  onExportSelected?: (selectedActivities: Activity[]) => void;
}

type SortField = 'id' | 'name' | 'workstream' | 'status' | 'progress' | 'startDate' | 'finishDate';

export function ActivityDataTable({
  activities,
  onSelectActivity,
  onOpenSlideOver,
  onOpenLogProgress,
  onDispatchShiftTicket,
  onUpdateStatus,
  onBulkStatusChange,
  onExportSelected
}: ActivityDataTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>(() => {
    return (localStorage.getItem('activitySortField') as SortField) || 'id';
  });
  const [sortAsc, setSortAsc] = useState(() => {
    const saved = localStorage.getItem('activitySortAsc');
    return saved !== null ? saved === 'true' : true;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(activities.map(a => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      const newAsc = !sortAsc;
      setSortAsc(newAsc);
      localStorage.setItem('activitySortAsc', String(newAsc));
    } else {
      setSortField(field);
      setSortAsc(true);
      localStorage.setItem('activitySortField', field);
      localStorage.setItem('activitySortAsc', 'true');
    }
  };

  const sortedActivities = [...activities].sort((a, b) => {
    let aVal: any = a[sortField] || '';
    let bVal: any = b[sortField] || '';
    if (sortField === 'progress') {
      aVal = a.progress || 0;
      bVal = b.progress || 0;
    }
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  const getWorkstreamIcon = (ws?: WorkstreamType) => {
    switch (ws) {
      case 'SURVEYING': return <Compass className="h-3 w-3 text-sky-600 dark:text-sky-400" />;
      case 'QA_QC': return <ShieldCheck className="h-3 w-3 text-rose-600 dark:text-rose-400" />;
      case 'MATERIALS': return <Package className="h-3 w-3 text-amber-600 dark:text-amber-400" />;
      case 'SAFETY': return <ShieldAlert className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />;
      case 'COMMISSIONING': return <Zap className="h-3 w-3 text-purple-600 dark:text-purple-400" />;
      case 'CUSTOM': return <Tag className="h-3 w-3 text-slate-600 dark:text-slate-400" />;
      default: return <Building2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getStatusBadge = (status: ActivityStatus) => {
    switch (status) {
      case 'Completed':
        return <Badge variant="success" className="text-[10px] gap-1"><CheckCircle2 className="h-3 w-3 inline" /> Completed</Badge>;
      case 'In Progress':
        return <Badge variant="default" className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 gap-1"><PlayCircle className="h-3 w-3 inline text-[#0B5FFF]" /> In Progress</Badge>;
      case 'Blocked':
        return <Badge variant="danger" className="text-[10px] gap-1"><AlertTriangle className="h-3 w-3 inline" /> Blocked / Hold</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] text-slate-600 dark:text-slate-400 gap-1"><CalendarClock className="h-3 w-3 inline" /> Not Started</Badge>;
    }
  };

  const selectedActivitiesList = activities.filter(a => selectedIds.includes(a.id));

  return (
    <div className="flex flex-col gap-3">
      {/* Batch Action Toolbar when items are selected */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold">
            <span className="px-2 py-0.5 rounded-full bg-[#0B5FFF] text-white text-[11px]">
              {selectedIds.length}
            </span>
            <span>items selected</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onBulkStatusChange && (
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onBulkStatusChange(selectedIds, 'In Progress')}
                  className="h-7 text-xs bg-white dark:bg-slate-900 font-medium"
                >
                  Set In Progress
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onBulkStatusChange(selectedIds, 'Completed')}
                  className="h-7 text-xs bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 font-medium"
                >
                  Set Completed
                </Button>
              </>
            )}
            {onExportSelected && (
              <Button
                size="sm"
                onClick={() => onExportSelected(selectedActivitiesList)}
                className="h-7 text-xs bg-[#0B5FFF] hover:bg-blue-600 text-white font-bold gap-1"
              >
                <Download className="h-3.5 w-3.5" /> Export ({selectedIds.length})
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds([])}
              className="h-7 text-xs text-slate-500 hover:text-slate-800"
            >
              Deselect All
            </Button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="p-3 w-10 text-center">
                <input 
                  type="checkbox"
                  checked={activities.length > 0 && selectedIds.length === activities.length}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF]"
                />
              </th>
              <th className="p-3 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200" onClick={() => handleSort('id')}>
                <div className="flex items-center gap-1">
                  Code & Activity
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-3 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200" onClick={() => handleSort('workstream')}>
                <div className="flex items-center gap-1">
                  Workstream
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-3">Section / Area</th>
              <th className="p-3">Linked Activity</th>
              <th className="p-3 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1">
                  Status
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-3 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200" onClick={() => handleSort('progress')}>
                <div className="flex items-center gap-1">
                  Progress
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-3">Subtasks / Hold Points</th>
              <th className="p-3">Assigned Crew</th>
              <th className="p-3 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200" onClick={() => handleSort('finishDate')}>
                <div className="flex items-center gap-1">
                  Timeline
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sortedActivities.length > 0 ? (
              sortedActivities.map(activity => {
                const subtasks = activity.subtasks || [];
                const subtasksCount = subtasks.length;
                const completedSubtasksCount = subtasks.filter(s => s.status === 'Completed').length;
                const holdPointsCount = subtasks.filter(s => s.isHoldPoint).length;
                const wsKey = activity.workstream === 'PTS_CONSTRUCTION' ? 'CONSTRUCTION' : (activity.workstream || 'CONSTRUCTION');
                const wsConfig = WORKSTREAMS[wsKey] || WORKSTREAMS.CONSTRUCTION;
                const workstreamLabel = (activity.workstream === 'CUSTOM' && activity.customWorkstream) 
                  ? activity.customWorkstream 
                  : (activity.customWorkstream || wsConfig?.shortName || activity.workstream || 'Construction');
                const isSelected = selectedIds.includes(activity.id);

                return (
                  <tr 
                    key={activity.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                      isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(activity.id)}
                        className="rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF]"
                      />
                    </td>

                    {/* Code & Name */}
                    <td className="p-3 max-w-xs">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] font-bold text-slate-400">
                            {activity.id}
                          </span>
                          {activity.priority === 'Critical' && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                              Critical
                            </span>
                          )}
                          {activity.priority === 'High' && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                              High
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectActivity(activity)}
                          className="font-bold text-slate-900 dark:text-slate-100 hover:text-[#0B5FFF] dark:hover:text-blue-400 transition-colors text-left truncate"
                          title={activity.name}
                        >
                          {activity.name}
                        </button>
                      </div>
                    </td>

                    {/* Workstream */}
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold ${wsConfig.badgeClass}`}>
                        {getWorkstreamIcon(activity.workstream)}
                        {workstreamLabel}
                      </span>
                    </td>

                    {/* Section / Span */}
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {activity.sectionSpan ? (
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {activity.sectionSpan}
                        </span>
                      ) : activity.area ? (
                        <span>{activity.area}</span>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>

                    {/* Linked Activity / Parent */}
                    <td className="p-3">
                      {activity.linkedPTSActivityName || activity.linkedPTSActivityId ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold text-[10px] max-w-[150px] truncate" title={`Linked to: ${activity.linkedPTSActivityName || activity.linkedPTSActivityId}`}>
                          <Link2 className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">{activity.linkedPTSActivityName || activity.linkedPTSActivityId}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px] italic">Standalone</span>
                      )}
                    </td>

                    {/* Status with Quick Select */}
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={activity.status}
                        onChange={(e) => onUpdateStatus(activity.id, e.target.value as ActivityStatus)}
                        className="text-[10px] font-bold rounded-lg px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                      >
                        <option value="Not Started">⏳ Not Started</option>
                        <option value="In Progress">🚀 In Progress</option>
                        <option value="Blocked">🛑 Blocked / Hold</option>
                        <option value="Completed">✅ Completed</option>
                      </select>
                    </td>

                    {/* Progress */}
                    <td className="p-3 w-28">
                      <div className="flex items-center gap-2">
                        <ProgressBar progress={activity.progress || 0} className="h-1.5 flex-1 rounded-full" />
                        <span className="font-bold text-[10px] text-slate-700 dark:text-slate-300 shrink-0">
                          {activity.progress || 0}%
                        </span>
                      </div>
                    </td>

                    {/* Subtasks / Hold points */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        {subtasksCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            <CheckSquare className="h-3 w-3 text-[#0B5FFF]" />
                            {completedSubtasksCount}/{subtasksCount}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">—</span>
                        )}

                        {holdPointsCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800" title="Hold Point">
                            <ShieldCheck className="h-2.5 w-2.5" /> {holdPointsCount}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Crew */}
                    <td className="p-3 text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                      {activity.assignedTo ? (
                        <div className="flex items-center gap-1 truncate font-medium">
                          <Users className="h-3 w-3 text-purple-500 shrink-0" />
                          <span className="truncate">{activity.assignedTo}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Timeline */}
                    <td className="p-3 text-[10px] text-slate-500 whitespace-nowrap">
                      <div>{activity.startDate}</div>
                      <div className="text-slate-400">to {activity.finishDate}</div>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenSlideOver(activity)}
                          className="p-1 rounded text-slate-500 hover:text-[#0B5FFF] hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                          title="Preview Drawer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {onDispatchShiftTicket && (
                          <button
                            type="button"
                            onClick={() => onDispatchShiftTicket(activity)}
                            className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                            title="Dispatch Shift Ticket (WhatsApp / PDF / Offline HTML)"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onOpenLogProgress(activity)}
                          className="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                          title="Quick Log Progress"
                        >
                          <Sliders className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectActivity(activity)}
                          className="p-1 rounded text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors"
                          title="Full Details"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={11} className="p-8 text-center text-slate-400">
                  No activities found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
