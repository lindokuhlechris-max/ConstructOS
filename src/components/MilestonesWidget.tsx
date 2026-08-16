import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, ProgressBar } from './ui';
import { Target, CheckCircle2, Clock, Calendar, Flag } from 'lucide-react';
import { Activity } from '../types';

interface MilestonesWidgetProps {
  activities: Activity[];
  onSelectActivity?: (activity: Activity) => void;
}

export function MilestonesWidget({ activities, onSelectActivity }: MilestonesWidgetProps) {
  const milestones = activities.filter(a => a.isMilestone || a.subtasks?.some(s => s.isMilestone));
  
  if (milestones.length === 0) return null;

  return (
    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900 mt-5">
      <CardHeader className="bg-slate-50/70 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Flag className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100">
              Project Milestones & Key Checkpoints
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Key project delivery markers, stage gates, and milestone subtask checkpoints
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-5">
          {milestones.map(milestone => {
            const isCompleted = milestone.status === 'Completed';
            const isDelayed = milestone.status === 'Blocked';
            const isInProgress = milestone.status === 'In Progress';
            const subtaskMilestones = milestone.subtasks?.filter(s => s.isMilestone) || [];
            const completedSubMilestones = subtaskMilestones.filter(s => s.status === 'Completed').length;
            
            return (
              <div 
                key={milestone.id} 
                className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                  isCompleted 
                    ? 'bg-emerald-50/30 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800 hover:border-emerald-400' 
                    : isDelayed
                    ? 'bg-rose-50/30 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800 hover:border-rose-400'
                    : 'bg-white border-slate-200 dark:bg-slate-950/40 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500'
                }`}
                onClick={() => onSelectActivity?.(milestone)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2 rounded-lg ${
                    isCompleted ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' :
                    isDelayed ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400' :
                    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : 
                     isDelayed ? <Clock className="h-4 w-4" /> : 
                     <Target className="h-4 w-4" />}
                  </div>
                  <Badge variant={
                    isCompleted ? 'success' : 
                    isDelayed ? 'danger' : 
                    isInProgress ? 'warning' : 'outline'
                  } className="text-[10px] uppercase">
                    {milestone.status}
                  </Badge>
                </div>
                
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 mb-1" title={milestone.name}>
                  {milestone.name}
                </h4>

                {subtaskMilestones.length > 0 && (
                  <div className="mb-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                      <Flag className="h-2.5 w-2.5" /> {completedSubMilestones}/{subtaskMilestones.length} Checkpoints Reached
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Due: {milestone.finishDate}</span>
                </div>
                
                <div className="space-y-1.5 mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                    <span>Progress</span>
                    <span className={isCompleted ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'}>{milestone.progress}%</span>
                  </div>
                  <ProgressBar 
                    value={milestone.progress} 
                    className="h-1.5" 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
