import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Users, 
  HardHat, 
  Truck, 
  Layers, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  PlayCircle, 
  CalendarClock, 
  ArrowRight, 
  Sparkles, 
  FileText, 
  ShieldAlert, 
  CheckSquare, 
  Maximize2,
  ChevronRight,
  TrendingUp,
  Sliders,
  ChevronDown,
  Printer,
  Copy,
  Compass,
  ShieldCheck,
  Package,
  Zap,
  Building2,
  Link2
} from 'lucide-react';
import { Activity, ActivityStatus, Priority, WORKSTREAMS } from '../types';
import { normalizeLabourAssignments } from '../lib/labourUtils';
import { Badge, Button, ProgressBar } from './ui';
import { useAppContext } from '../context/AppContext';
import { printActivitiesSummary } from '../lib/pdfPrint';

interface ActivitySlideOverProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenFullDetail: (activity: Activity) => void;
  onDuplicate?: (activity: Activity) => void;
  onQuickUpdateStatus?: (activityId: string, newStatus: ActivityStatus) => void;
  onQuickUpdateProgress?: (activityId: string, newProgress: number) => void;
}

export function ActivitySlideOver({
  activity,
  isOpen,
  onClose,
  onOpenFullDetail,
  onDuplicate,
  onQuickUpdateStatus,
  onQuickUpdateProgress
}: ActivitySlideOverProps) {
  const { projects, employees, equipment, labourLogs, updateActivity } = useAppContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'photos' | 'constraints'>('overview');
  const [quickProgress, setQuickProgress] = useState<number>(activity?.progress || 0);

  if (!activity || !isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800';
      case 'In Progress': return 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800';
      case 'Blocked': return 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800';
      default: return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'In Progress': return <PlayCircle className="h-4 w-4 text-[#0B5FFF]" />;
      case 'Completed': return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'Blocked': return <AlertTriangle className="h-4 w-4 text-rose-600" />;
      default: return <CalendarClock className="h-4 w-4 text-amber-600" />;
    }
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'Critical': return <Badge variant="danger" className="text-[10px] uppercase font-bold">Critical Priority</Badge>;
      case 'High': return <Badge className="bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-[10px] uppercase font-bold">High Priority</Badge>;
      case 'Medium': return <Badge className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] uppercase font-bold">Medium</Badge>;
      default: return <Badge variant="outline" className="text-[10px] uppercase font-bold">Low</Badge>;
    }
  };

  const activityLabourLogs = labourLogs?.filter(l => l?.activityId === activity.id) || [];
  const loggedHoursTotal = activityLabourLogs.reduce((sum, l) => sum + (l.hoursWorked || l.hours || 0), 0);

  const handleStatusChange = (newStatus: ActivityStatus) => {
    if (onQuickUpdateStatus) {
      onQuickUpdateStatus(activity.id, newStatus);
    } else if (updateActivity) {
      updateActivity({ ...activity, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] });
    }
  };

  const handleProgressSave = () => {
    if (onQuickUpdateProgress) {
      onQuickUpdateProgress(activity.id, quickProgress);
    } else if (updateActivity) {
      const updatedStatus: ActivityStatus = quickProgress === 100 ? 'Completed' : quickProgress > 0 ? 'In Progress' : activity.status;
      updateActivity({ 
        ...activity, 
        progress: quickProgress, 
        status: updatedStatus,
        updatedAt: new Date().toISOString().split('T')[0] 
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-over Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div 
          id="activity-slideover-panel"
          className="w-screen max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 shrink-0">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {activity.id}
                </span>
                {activity.workstream && WORKSTREAMS[activity.workstream] && (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${WORKSTREAMS[activity.workstream].badgeClass}`}>
                    {WORKSTREAMS[activity.workstream].shortName}
                  </span>
                )}
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-[#0B5FFF] dark:text-blue-400">
                  {activity.workPackage || 'General Work'}
                </span>
                {getPriorityBadge(activity.priority)}
                {(activity.linkedPTSActivityName || activity.sectionSpan) && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    {activity.sectionSpan ? activity.sectionSpan : `Linked: ${activity.linkedPTSActivityName}`}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {onDuplicate && (
                  <button
                    onClick={() => {
                      onDuplicate(activity);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                    title="Duplicate Activity & Edit Minor Differences"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    printActivitiesSummary({
                      project: projects[0],
                      activities: [activity],
                      filterLabel: `Individual Task: ${activity.id} - ${activity.name}`,
                      totalActivitiesCount: 1
                    });
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  title="Print / Export task report as PDF"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenFullDetail(activity);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#0B5FFF] hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                  title="Open Full Screen Activity Detail & Edit"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  title="Close Slide-over"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {activity.name}
            </h2>
            {activity.description && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                {activity.description}
              </p>
            )}

            {/* Quick Status Pill with Switcher */}
            <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Status:</span>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(activity.status)}`}>
                  {getStatusIcon(activity.status)}
                  <span>{activity.status}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {(['Not Started', 'In Progress', 'Blocked', 'Completed'] as ActivityStatus[]).map((st) => (
                  st !== activity.status && (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(st)}
                      className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      Set {st}
                    </button>
                  )
                ))}
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 bg-slate-100/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 text-center shrink-0">
            <div className="p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Progress</span>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <span className="text-base font-black text-[#0B5FFF] dark:text-blue-400">{activity.progress}%</span>
              </div>
            </div>
            <div className="p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Quantity</span>
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {activity.actualQuantity} / {activity.targetQuantity} <span className="text-[10px] font-normal text-slate-500">{activity.unit}</span>
              </span>
            </div>
            <div className="p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Labour Hours</span>
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {loggedHoursTotal || activity.actualHours || 0} / {activity.plannedHours || 0} <span className="text-[10px] font-normal text-slate-500">hrs</span>
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-5 bg-white dark:bg-slate-900 shrink-0 gap-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'border-[#0B5FFF] text-[#0B5FFF]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="h-3.5 w-3.5" /> Overview & Progress
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'resources'
                  ? 'border-[#0B5FFF] text-[#0B5FFF]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Users className="h-3.5 w-3.5" /> Crew & Resources
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'photos'
                  ? 'border-[#0B5FFF] text-[#0B5FFF]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Camera className="h-3.5 w-3.5" /> Photos ({activity.photos?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('constraints')}
              className={`py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'constraints'
                  ? 'border-[#0B5FFF] text-[#0B5FFF]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" /> Notes & Specs
            </button>
          </div>

          {/* Scrollable Tab Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Progress Visual & Quick Slider */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">Completion Gauge</span>
                    <span className="text-[#0B5FFF]">{activity.progress}% Completed</span>
                  </div>
                  <ProgressBar value={activity.progress} />
                  
                  {/* Inline quick progress adjustment */}
                  <div className="pt-2 flex items-center gap-3">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={quickProgress} 
                      onChange={(e) => setQuickProgress(Number(e.target.value))}
                      className="flex-1 accent-[#0B5FFF] cursor-pointer"
                    />
                    <span className="text-xs font-bold font-mono w-10 text-right">{quickProgress}%</span>
                    <button
                      onClick={handleProgressSave}
                      disabled={quickProgress === activity.progress}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#0B5FFF] disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white transition-colors"
                    >
                      Update
                    </button>
                  </div>
                </div>

                {/* Scope & Measurement Metadata Grid */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Scope & Metrics</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Workstream</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {activity.workstream && WORKSTREAMS[activity.workstream] ? WORKSTREAMS[activity.workstream].name : 'PTS Works / Construction'}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Work Package</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{activity.workPackage || 'N/A'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Target Quantity</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{activity.targetQuantity} {activity.unit}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Actual Completed</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{activity.actualQuantity} {activity.unit}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Planning Frequency</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{activity.planningType || 'Project Duration'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Daily Target</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {activity.dailyTargetQuantity ? `${activity.dailyTargetQuantity} ${activity.unit}/day` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Location & Site Zone */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Location & Spatial Info</h4>
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-rose-500" /> Primary Area:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{activity.area || 'Main Site'}</span>
                    </div>
                    {activity.location && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400">Specific Location:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{activity.location}</span>
                      </div>
                    )}
                    {activity.chainage && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400">Chainage / Station:</span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{activity.chainage}</span>
                      </div>
                    )}
                    {activity.gpsLocation && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400">GPS Coordinates:</span>
                        <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {typeof activity.gpsLocation === 'string' ? activity.gpsLocation : `${activity.gpsLocation.lat.toFixed(4)}, ${activity.gpsLocation.lng.toFixed(4)}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subtasks checklist if present */}
                {activity.subtasks && activity.subtasks.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Subtasks & Milestones ({activity.subtasks.length})</h4>
                    <div className="space-y-1.5">
                      {activity.subtasks.map((st) => {
                        const isDone = st.status === 'Completed';
                        return (
                          <div 
                            key={st.id} 
                            className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <CheckSquare className={`h-4 w-4 ${isDone ? 'text-emerald-600' : 'text-slate-300'}`} />
                              <span className={isDone ? 'line-through text-slate-400' : 'font-medium text-slate-700 dark:text-slate-200'}>
                                {st.title}
                              </span>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isDone ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                              {st.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="space-y-4">
                {/* Supervision & Management */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Supervision & Team</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                      <User className="h-4 w-4 text-[#0B5FFF] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Supervisor</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{activity.supervisor || 'Unassigned'}</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                      <Users className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Assigned Crew</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{activity.assignedTo || 'Unassigned'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline & Schedule Dates */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Schedule & Timeline</h4>
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-blue-500" /> Start Date:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{activity.startDate || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-indigo-500" /> Target Finish Date:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{activity.finishDate || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-amber-500" /> Planned Labour:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{activity.plannedHours || 0} hours</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-emerald-500" /> Actual Logged Hours:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{loggedHoursTotal || activity.actualHours || 0} hours</span>
                    </div>
                  </div>
                </div>

                {/* Assigned Labour Allocation Breakdown */}
                {(() => {
                  const normalizedAssigned = normalizeLabourAssignments(activity.assignedLabour);
                  if (normalizedAssigned.length === 0) return null;
                  return (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Assigned Trades & Labour ({normalizedAssigned.length})</h4>
                      <div className="space-y-1.5">
                        {normalizedAssigned.map((lab, lIdx) => (
                          <div key={lab.id || lIdx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
                            <div className="flex items-center gap-2">
                              <HardHat className="h-4 w-4 text-amber-500 shrink-0" />
                              <div>
                                <div className="font-bold text-slate-800 dark:text-slate-200">{lab.name || lab.role}</div>
                                <div className="text-[10px] text-slate-400">{lab.role || 'Field Operative'}</div>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{lab.hours} hrs</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Assigned Equipment Allocation */}
                {activity.assignedEquipment && activity.assignedEquipment.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Allocated Equipment ({activity.assignedEquipment.length})</h4>
                    <div className="space-y-1.5">
                      {activity.assignedEquipment.map((eq, eIdx) => (
                        <div key={eIdx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-[#0B5FFF] shrink-0" />
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200">{eq.name || eq.equipmentId}</div>
                              <div className="text-[10px] text-slate-400">Operator: {eq.operator || 'Site Crew'}</div>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{eq.startDate || 'Allocated'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'photos' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Field Progress Photos</h4>
                  <span className="text-xs text-slate-500 font-medium">{activity.photos?.length || 0} Attached</span>
                </div>

                {(!activity.photos || activity.photos.length === 0) ? (
                  <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center gap-2">
                    <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                      <Camera className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No field photos captured yet</p>
                    <p className="text-[11px] text-slate-400 max-w-xs">Use the quick camera capture tool to attach real-time proof of work.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {activity.photos.map((photoUrl, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs aspect-4/3 bg-slate-100">
                        <img 
                          src={photoUrl} 
                          alt={`Progress Photo ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-end">
                          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                            Photo #{idx + 1}
                          </span>
                          {activity.photoTags?.[idx] && (
                            <span className="text-[9px] text-blue-200 font-medium truncate">
                              Tag: {activity.photoTags[idx]}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'constraints' && (
              <div className="space-y-4">
                {/* Method Statement & Specs */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Method Statement & Technical Notes</h4>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {activity.methodStatement || activity.remarks || 'No method statement provided. Standard operating procedures apply.'}
                  </div>
                </div>

                {/* Constraints & Blockers */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Identified Constraints & Risks</h4>
                  {(!activity.constraints || activity.constraints.length === 0) ? (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>No active blocking constraints flagged for this activity.</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activity.constraints.map((c, cIdx) => (
                        <div key={cIdx} className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dependencies */}
                {activity.dependencies && activity.dependencies.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Predecessor Dependencies</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {activity.dependencies.map((dep, dIdx) => (
                        <span key={dIdx} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300">
                          {dep}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audit Timestamps */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
                  <div>Created on: {activity.createdAt || activity.startDate || 'N/A'}</div>
                  {activity.updatedAt && <div>Last Updated: {activity.updatedAt}</div>}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-xs font-bold"
            >
              Close
            </Button>

            <div className="flex items-center gap-2">
              {onDuplicate && (
                <Button
                  variant="outline"
                  onClick={() => onDuplicate(activity)}
                  className="rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 gap-1.5"
                  title="Duplicate activity with all properties and edit minor differences"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Duplicate</span>
                </Button>
              )}

              <Button
                onClick={() => {
                  onClose();
                  onOpenFullDetail(activity);
                }}
                className="rounded-xl bg-[#0B5FFF] hover:bg-blue-700 text-white text-xs font-bold gap-1.5 shadow-sm"
              >
                <span>Open Full Activity Detail</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
