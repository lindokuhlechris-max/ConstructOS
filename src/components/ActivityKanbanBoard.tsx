import React from 'react';
import { Activity, ActivityStatus, WORKSTREAMS, WorkstreamType } from '../types';
import { ProgressBar } from './ui';
import { 
  PlayCircle, 
  CheckCircle2, 
  AlertTriangle, 
  CalendarClock, 
  Users, 
  CheckSquare, 
  Link2, 
  ArrowRight, 
  ShieldCheck, 
  Image as ImageIcon,
  Compass,
  Building2,
  Package,
  ShieldAlert,
  Share2,
  Zap
} from 'lucide-react';

interface ActivityKanbanBoardProps {
  activities: Activity[];
  onSelectActivity: (activity: Activity) => void;
  onOpenSlideOver: (activity: Activity) => void;
  onOpenLogProgress: (activity: Activity) => void;
  onDispatchShiftTicket?: (activity: Activity) => void;
  onUpdateStatus: (activityId: string, newStatus: ActivityStatus) => void;
  onAddNewInStatus?: (status: ActivityStatus) => void;
}

const COLUMNS: { id: ActivityStatus; label: string; icon: any; color: string; bgLight: string; borderLight: string; accentColor: string }[] = [
  {
    id: 'Not Started',
    label: 'Not Started / Planning',
    icon: CalendarClock,
    color: 'text-slate-700 dark:text-slate-300',
    bgLight: 'bg-slate-50/70 dark:bg-slate-900/60',
    borderLight: 'border-slate-200 dark:border-slate-800',
    accentColor: '#64748B'
  },
  {
    id: 'In Progress',
    label: 'In Progress / Active',
    icon: PlayCircle,
    color: 'text-blue-700 dark:text-blue-300',
    bgLight: 'bg-blue-50/40 dark:bg-blue-950/20',
    borderLight: 'border-blue-200 dark:border-blue-800',
    accentColor: '#0B5FFF'
  },
  {
    id: 'Blocked',
    label: 'Hold Point / Blocked',
    icon: AlertTriangle,
    color: 'text-rose-700 dark:text-rose-300',
    bgLight: 'bg-rose-50/40 dark:bg-rose-950/20',
    borderLight: 'border-rose-200 dark:border-rose-800',
    accentColor: '#E11D48'
  },
  {
    id: 'Completed',
    label: 'Completed / Signed-Off',
    icon: CheckCircle2,
    color: 'text-emerald-700 dark:text-emerald-300',
    bgLight: 'bg-emerald-50/40 dark:bg-emerald-950/20',
    borderLight: 'border-emerald-200 dark:border-emerald-800',
    accentColor: '#10B981'
  }
];

export function ActivityKanbanBoard({
  activities,
  onSelectActivity,
  onOpenSlideOver,
  onOpenLogProgress,
  onDispatchShiftTicket,
  onUpdateStatus
}: ActivityKanbanBoardProps) {

  const getWorkstreamIcon = (ws?: WorkstreamType) => {
    switch (ws) {
      case 'SURVEYING': return <Compass className="h-3 w-3 text-sky-600 dark:text-sky-400" />;
      case 'QA_QC': return <ShieldCheck className="h-3 w-3 text-rose-600 dark:text-rose-400" />;
      case 'MATERIALS': return <Package className="h-3 w-3 text-amber-600 dark:text-amber-400" />;
      case 'SAFETY': return <ShieldAlert className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />;
      case 'COMMISSIONING': return <Zap className="h-3 w-3 text-purple-600 dark:text-purple-400" />;
      default: return <Building2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start min-h-[600px] overflow-x-auto pb-4">
      {COLUMNS.map(col => {
        const columnActivities = activities.filter(a => (a.status || 'Not Started') === col.id);
        const IconComponent = col.icon;

        return (
          <div 
            key={col.id}
            className={`flex flex-col rounded-2xl border ${col.borderLight} ${col.bgLight} p-3.5 min-h-[500px] shadow-xs`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                  style={{ backgroundColor: col.accentColor }} 
                />
                <IconComponent className="h-4 w-4 shrink-0 text-slate-500" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {col.label}
                </h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-2xs">
                {columnActivities.length}
              </span>
            </div>

            {/* Activities List in Column */}
            <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[75vh] pr-0.5">
              {columnActivities.length > 0 ? (
                columnActivities.map(activity => {
                  const subtasks = activity.subtasks || [];
                  const subtasksCount = subtasks.length;
                  const completedSubtasksCount = subtasks.filter(s => s.status === 'Completed').length;
                  const wsConfig = WORKSTREAMS[activity.workstream || 'CONSTRUCTION'] || WORKSTREAMS.CONSTRUCTION;
                  const holdPointsCount = subtasks.filter(s => s.isHoldPoint).length;

                  return (
                    <div
                      key={activity.id}
                      onClick={() => onSelectActivity(activity)}
                      className="bg-white dark:bg-slate-800/95 rounded-xl p-3.5 border border-slate-200/90 dark:border-slate-700/80 hover:border-[#0B5FFF]/60 dark:hover:border-blue-500/60 hover:shadow-md transition-all cursor-pointer group relative flex flex-col gap-2.5"
                    >
                      {/* Workstream & ID Bar */}
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${wsConfig.badgeClass}`}>
                            {getWorkstreamIcon(activity.workstream)}
                            {activity.workstream === 'CUSTOM' && activity.customWorkstream ? activity.customWorkstream : wsConfig.shortName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">
                            {activity.id}
                          </span>
                        </div>

                        {activity.priority === 'Critical' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                            Critical
                          </span>
                        )}
                        {activity.priority === 'High' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                            High
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0B5FFF] transition-colors leading-snug line-clamp-2">
                        {activity.name}
                      </h4>

                      {/* Linked Activity Handshake Pill */}
                      {(activity.linkedPTSActivityName || activity.linkedPTSActivityId || activity.sectionSpan) && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[10px] text-indigo-700 dark:text-indigo-300 font-semibold truncate">
                          <Link2 className="h-3 w-3 text-indigo-600 shrink-0" />
                          <span className="truncate">
                            {activity.sectionSpan ? `Span: ${activity.sectionSpan}` : `Linked: ${activity.linkedPTSActivityName || activity.linkedPTSActivityId}`}
                          </span>
                        </div>
                      )}

                      {/* Progress Bar & Percentage */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-500 font-medium">Progress</span>
                          <span className="font-bold text-[#0B5FFF]">{activity.progress || 0}%</span>
                        </div>
                        <ProgressBar progress={activity.progress || 0} className="h-1.5 rounded-full" />
                      </div>

                      {/* Badges Strip (Subtasks, Hold Points, Team, Photos) */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-1 border-t border-slate-100 dark:border-slate-800 flex-wrap gap-1">
                        <div className="flex items-center gap-2">
                          {subtasksCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 font-bold" title="Subtasks completed">
                              <CheckSquare className="h-3 w-3 text-[#0B5FFF]" />
                              {completedSubtasksCount}/{subtasksCount}
                            </span>
                          )}

                          {holdPointsCount > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-bold text-[9px]" title="Hold points">
                              <ShieldCheck className="h-3 w-3" /> {holdPointsCount}
                            </span>
                          )}

                          {activity.photos && activity.photos.length > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-slate-400" title="Photos attached">
                              <ImageIcon className="h-3 w-3 text-slate-400" /> {activity.photos.length}
                            </span>
                          )}
                        </div>

                        {activity.assignedTo && (
                          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 truncate max-w-[100px]" title={`Assigned: ${activity.assignedTo}`}>
                            <Users className="h-3 w-3 text-purple-500" />
                            <span className="truncate">{activity.assignedTo}</span>
                          </span>
                        )}
                      </div>

                      {/* Card Action Controls & Quick Status Shift */}
                      <div 
                        className="flex items-center justify-between gap-1 pt-1.5 mt-0.5 border-t border-dashed border-slate-200 dark:border-slate-700/60"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenSlideOver(activity)}
                            className="px-2 py-1 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Open Preview Drawer"
                          >
                            Inspect
                          </button>
                          {onDispatchShiftTicket && (
                            <button
                              type="button"
                              onClick={() => onDispatchShiftTicket(activity)}
                              className="px-2 py-1 rounded text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 transition-colors flex items-center gap-1"
                              title="Dispatch Shift Ticket (WhatsApp / PDF / Offline HTML)"
                            >
                              <Share2 className="h-3 w-3" />
                              <span>Dispatch</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onOpenLogProgress(activity)}
                            className="px-2 py-1 rounded text-[10px] font-bold text-[#0B5FFF] bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 transition-colors"
                            title="Log Progress"
                          >
                            Log
                          </button>
                        </div>

                        {/* Quick Move Button */}
                        <div className="flex items-center gap-1">
                          {col.id === 'Not Started' && (
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(activity.id, 'In Progress')}
                              className="px-2 py-1 rounded text-[10px] font-bold text-white bg-[#0B5FFF] hover:bg-blue-600 transition-colors flex items-center gap-0.5 shadow-2xs"
                              title="Move to In Progress"
                            >
                              Start <ArrowRight className="h-2.5 w-2.5" />
                            </button>
                          )}
                          {col.id === 'In Progress' && (
                            <>
                              <button
                                type="button"
                                onClick={() => onUpdateStatus(activity.id, 'Blocked')}
                                className="px-1.5 py-1 rounded text-[9px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 transition-colors"
                                title="Set Hold / Blocked"
                              >
                                Hold
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateStatus(activity.id, 'Completed')}
                                className="px-2 py-1 rounded text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-0.5 shadow-2xs"
                                title="Mark Completed"
                              >
                                Complete <CheckCircle2 className="h-2.5 w-2.5" />
                              </button>
                            </>
                          )}
                          {col.id === 'Blocked' && (
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(activity.id, 'In Progress')}
                              className="px-2 py-1 rounded text-[10px] font-bold text-white bg-[#0B5FFF] hover:bg-blue-600 transition-colors flex items-center gap-0.5"
                              title="Resume Work"
                            >
                              Resume <PlayCircle className="h-2.5 w-2.5" />
                            </button>
                          )}
                          {col.id === 'Completed' && (
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(activity.id, 'In Progress')}
                              className="px-2 py-1 rounded text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                              title="Reopen Activity"
                            >
                              Reopen
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white/40 dark:bg-slate-900/30 min-h-[140px]">
                  <IconComponent className="h-6 w-6 text-slate-300 dark:text-slate-600 mb-1.5" />
                  <p className="text-xs font-semibold">No activities here</p>
                  <p className="text-[10px] text-slate-400">Items in this status will appear here</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
