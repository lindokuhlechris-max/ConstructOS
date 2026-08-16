import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Target, Clock, Flag } from 'lucide-react';
import { Activity } from '../types';
import { Button } from './ui';

interface PlanningCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity;
}

export function PlanningCalendarModal({ isOpen, onClose, activity }: PlanningCalendarModalProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    return activity.startDate ? new Date(activity.startDate) : new Date();
  });

  // Reset to activity's start date when opened or activity changes
  useEffect(() => {
    if (isOpen && activity.startDate) {
      setCurrentDate(new Date(activity.startDate));
    }
  }, [isOpen, activity.startDate]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  
  const start = activity.startDate ? new Date(activity.startDate).getTime() : 0;
  const finish = activity.finishDate ? new Date(activity.finishDate).getTime() : 0;

  const renderCells = () => {
    const cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push(
        <div key={`empty-${i}`} className="min-h-[72px] sm:min-h-[80px] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/60 rounded-xl"></div>
      );
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      const dateTime = date.getTime();
      
      const sDate = new Date(start);
      sDate.setHours(0, 0, 0, 0);
      const fDate = new Date(finish);
      fDate.setHours(0, 0, 0, 0);

      const isActive = start > 0 && finish > 0 && dateTime >= sDate.getTime() && dateTime <= fDate.getTime();
      const isStart = start > 0 && dateTime === sDate.getTime();
      const isEnd = finish > 0 && dateTime === fDate.getTime();

      cells.push(
        <div 
          key={day} 
          className={`min-h-[72px] sm:min-h-[80px] p-2 border rounded-xl flex flex-col transition-colors ${
            isActive 
              ? 'border-blue-300 dark:border-blue-700/80 bg-blue-50/80 dark:bg-blue-900/25 shadow-sm' 
              : 'border-slate-200 dark:border-slate-700/70 bg-white dark:bg-slate-900/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <div 
              className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                isStart || isEnd 
                  ? 'bg-[#0B5FFF] text-white shadow-sm ring-2 ring-blue-200 dark:ring-blue-900' 
                  : isActive 
                    ? 'text-blue-700 dark:text-blue-300 font-extrabold bg-blue-100/60 dark:bg-blue-800/40' 
                    : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {day}
            </div>
            {isStart && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-900/60 px-1 rounded">
                Start
              </span>
            )}
            {isEnd && !isStart && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-900/60 px-1 rounded">
                Finish
              </span>
            )}
          </div>

          {isActive && activity.planningType === 'Daily' && (
            <div className="mt-auto pt-1 space-y-0.5">
              {(activity.dailyTargetQuantity ?? 0) > 0 && (
                <div className="text-[10px] font-bold text-blue-700 dark:text-blue-300 leading-tight truncate bg-blue-100/70 dark:bg-blue-800/50 px-1.5 py-0.5 rounded">
                  {activity.dailyTargetQuantity} {activity.unit || 'units'}
                </div>
              )}
              {(activity.dailyTargetPercentage ?? 0) > 0 && (
                <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 leading-tight bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 px-1.5 py-0.5 rounded">
                  {activity.dailyTargetPercentage}% /day
                </div>
              )}
            </div>
          )}

          {isActive && activity.planningType !== 'Daily' && (
            <div className="mt-auto pt-1">
              <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 leading-tight">
                ● Planned Active
              </span>
            </div>
          )}
        </div>
      );
    }
    return cells;
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-[#0B5FFF] dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800/60">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Planning Schedule Calendar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activity.name} ({activity.id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Planning Metadata Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 py-3 bg-blue-50/40 dark:bg-blue-950/20 border-b border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <CalendarIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span className="truncate"><strong>Start:</strong> {activity.startDate || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Flag className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="truncate"><strong>Finish:</strong> {activity.finishDate || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <span className="truncate"><strong>Cycle:</strong> {activity.planningType || 'Project Duration'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Target className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">
              <strong>Target:</strong> {activity.dailyTargetQuantity ? `${activity.dailyTargetQuantity} ${activity.unit || 'units'}/day` : activity.dailyTargetPercentage ? `${activity.dailyTargetPercentage}%/day` : 'Standard'}
            </span>
          </div>
        </div>

        {/* Calendar Navigation & Month Selector */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
            {monthNames[month]} {year}
          </span>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={prevMonth} 
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                if (activity.startDate) setCurrentDate(new Date(activity.startDate));
                else setCurrentDate(new Date());
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              Activity Start
            </button>
            <button 
              onClick={nextMonth} 
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[55vh]">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {renderCells()}
          </div>
        </div>

        {/* Footer & Legend */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#0B5FFF]"></span>
              <span>Milestone (Start/Finish)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-blue-100 dark:bg-blue-900/60 border border-blue-300 dark:border-blue-700"></span>
              <span>Active Duration</span>
            </div>
            {activity.planningType === 'Daily' && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800"></span>
                <span>Daily Targets</span>
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl px-4 text-xs font-semibold"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// Backward-compatible export
export const PlanningCalendar = PlanningCalendarModal;
