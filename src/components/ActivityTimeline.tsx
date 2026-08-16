import React, { useMemo } from 'react';
import { Activity } from '../types';
import { PlayCircle, CheckCircle, AlertCircle, CalendarClock } from 'lucide-react';

interface ActivityTimelineProps {
  activities: Activity[];
  onSelectActivity: (id: string) => void;
}

export function ActivityTimeline({ activities, onSelectActivity }: ActivityTimelineProps) {
  const { minDate, maxDate, days, dates } = useMemo(() => {
    if (activities.length === 0) return { minDate: Date.now(), maxDate: Date.now(), days: 0, dates: [] };

    let min = new Date(activities[0].startDate).getTime();
    let max = new Date(activities[0].finishDate || activities[0].startDate).getTime();

    activities.forEach(a => {
      const start = new Date(a.startDate).getTime();
      const end = new Date(a.finishDate || a.startDate).getTime();
      if (start < min) min = start;
      if (end > max) max = end;
    });

    // Pad by a couple of days on each side
    min -= 2 * 24 * 60 * 60 * 1000;
    max += 2 * 24 * 60 * 60 * 1000;

    if (min === max) {
      max = min + 7 * 24 * 60 * 60 * 1000;
    }

    const durationDays = Math.ceil((max - min) / (24 * 60 * 60 * 1000));
    
    // Generate dates for the header
    const generatedDates = [];
    for (let i = 0; i <= durationDays; i++) {
      generatedDates.push(new Date(min + i * 24 * 60 * 60 * 1000));
    }

    return { minDate: min, maxDate: max, days: durationDays, dates: generatedDates };
  }, [activities]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'In Progress': return 'bg-[#0B5FFF] border-[#0B5FFF]';
      case 'Completed': return 'bg-[#2E7D32] border-[#2E7D32]';
      case 'Blocked': return 'bg-[#D32F2F] border-[#D32F2F]';
      default: return 'bg-[#F9A825] border-[#F9A825]';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'In Progress': return <PlayCircle className="h-3 w-3 text-white" />;
      case 'Completed': return <CheckCircle className="h-3 w-3 text-white" />;
      case 'Blocked': return <AlertCircle className="h-3 w-3 text-white" />;
      default: return <CalendarClock className="h-3 w-3 text-white" />;
    }
  };

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <CalendarClock className="h-10 w-10 text-slate-400 mb-3" />
        <p className="text-slate-500 dark:text-slate-400">No activities found in the selected timeframe to map on the timeline.</p>
      </div>
    );
  }

  // To prevent the timeline from being too cramped, set a minimum width per day (e.g., 40px)
  const minDayWidth = 40;
  const timelineWidth = Math.max(days * minDayWidth, 800); 

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[600px]">
      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <div style={{ minWidth: `${timelineWidth + 250}px` }} className="flex flex-col">
          {/* Header row */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-slate-50 dark:bg-slate-800/80 z-10">
            <div className="w-[250px] shrink-0 p-4 font-bold text-sm text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
              Activity Name
            </div>
            <div className="flex-1 flex">
              {dates.map((date, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-center py-2 border-r border-slate-100 dark:border-slate-700/50 min-w-[40px]">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {date.getDate()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity rows */}
          <div className="flex-1 overflow-y-auto">
            {activities.map(activity => {
              const start = new Date(activity.startDate).getTime();
              const end = new Date(activity.finishDate || activity.startDate).getTime();
              
              const leftPercent = ((start - minDate) / (maxDate - minDate)) * 100;
              const widthPercent = Math.max(((end - start) / (maxDate - minDate)) * 100, 1); // min width 1%

              return (
                <div key={activity.id} className="flex border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  {/* Fixed left column */}
                  <div 
                    className="w-[250px] shrink-0 p-3 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 sticky left-0 z-10 cursor-pointer"
                    onClick={() => onSelectActivity(activity.id)}
                  >
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate" title={activity.name}>{activity.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{activity.workPackage}</p>
                  </div>
                  
                  {/* Timeline bar area */}
                  <div className="flex-1 relative py-3" style={{ backgroundSize: `${100 / days}% 100%`, backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px)' }}>
                    <div 
                      onClick={() => onSelectActivity(activity.id)}
                      className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-md flex items-center px-2 cursor-pointer shadow-sm text-white overflow-hidden ${getStatusColor(activity.status)}`}
                      style={{ 
                        left: `${leftPercent}%`, 
                        width: `${widthPercent}%`,
                        minWidth: '24px' // Ensure it's clickable even if 0 duration
                      }}
                      title={`${activity.name} (${activity.startDate} to ${activity.finishDate})`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {getStatusIcon(activity.status)}
                        <span className="text-[10px] font-bold truncate opacity-90">{activity.progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
