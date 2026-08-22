import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, ProgressBar } from './ui';
import { Target, CheckCircle2, Clock, Calendar, Flag, Sparkles, Filter, ChevronRight } from 'lucide-react';
import { Activity } from '../types';

interface MilestonesWidgetProps {
  activities: Activity[];
  onSelectActivity?: (activity: Activity) => void;
}

export function MilestonesWidget({ activities, onSelectActivity }: MilestonesWidgetProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'in-progress' | 'pending'>('all');

  const milestones = activities.filter(a => a.isMilestone || a.subtasks?.some(s => s.isMilestone));
  
  if (milestones.length === 0) return null;

  const completedCount = milestones.filter(m => m.status === 'Completed').length;
  const inProgressCount = milestones.filter(m => m.status === 'In Progress').length;
  const pendingCount = milestones.length - completedCount - inProgressCount;

  const filteredMilestones = milestones.filter(m => {
    if (filterStatus === 'completed') return m.status === 'Completed';
    if (filterStatus === 'in-progress') return m.status === 'In Progress';
    if (filterStatus === 'pending') return m.status !== 'Completed' && m.status !== 'In Progress';
    return true;
  });

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50/70 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-2xs">
            <Flag className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Project Milestones & Key Checkpoints</span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                {completedCount}/{milestones.length} Completed
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Key project delivery markers, stage gates, and milestone subtask checkpoints
            </p>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'completed', label: `Done (${completedCount})` },
            { id: 'in-progress', label: `Active (${inProgressCount})` },
            { id: 'pending', label: `Pending (${pendingCount})` }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterStatus(f.id as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filterStatus === f.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Milestones Grid */}
      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMilestones.map(milestone => {
            const isCompleted = milestone.status === 'Completed';
            const isDelayed = milestone.status === 'Blocked';
            const isInProgress = milestone.status === 'In Progress';
            const subtaskMilestones = milestone.subtasks?.filter(s => s.isMilestone) || [];
            const completedSubMilestones = subtaskMilestones.filter(s => s.status === 'Completed').length;
            
            return (
              <div 
                key={milestone.id} 
                className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md flex flex-col justify-between group select-none ${
                  isCompleted 
                    ? 'bg-emerald-50/30 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/80 hover:border-emerald-400' 
                    : isDelayed
                    ? 'bg-rose-50/30 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800/80 hover:border-rose-400'
                    : 'bg-white border-slate-200 dark:bg-slate-950/40 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500'
                }`}
                onClick={() => onSelectActivity?.(milestone)}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className={`p-2.5 rounded-xl ${
                      isCompleted ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' :
                      isDelayed ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400' :
                      'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : 
                       isDelayed ? <Clock className="h-4 w-4" /> : 
                       <Target className="h-4 w-4" />}
                    </div>
                    <Badge variant={
                      isCompleted ? 'success' : 
                      isDelayed ? 'danger' : 
                      isInProgress ? 'warning' : 'outline'
                    } className="text-[10px] uppercase font-bold">
                      {milestone.status}
                    </Badge>
                  </div>
                  
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 mb-1.5 group-hover:text-purple-600 transition-colors" title={milestone.name}>
                    {milestone.name}
                  </h4>

                  {subtaskMilestones.length > 0 && (
                    <div className="mb-2.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                        <Flag className="h-2.5 w-2.5" /> {completedSubMilestones}/{subtaskMilestones.length} Checkpoints Reached
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Due: {milestone.finishDate || 'Not set'}</span>
                  </div>
                </div>
                
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                    <span>Progress</span>
                    <span className={`font-mono ${isCompleted ? 'text-emerald-600 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>{milestone.progress || 0}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-emerald-500' : isDelayed ? 'bg-rose-500' : 'bg-purple-600'
                      }`}
                      style={{ width: `${milestone.progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {filteredMilestones.length === 0 && (
            <div className="col-span-full py-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              No milestones found matching the selected filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MilestonesWidget;
