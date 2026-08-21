import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Activity, ActivityStatus, Priority } from '../types';
import { 
  PlayCircle, 
  CheckCircle, 
  AlertCircle, 
  CalendarClock, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Layers,
  Clock,
  CheckSquare,
  Sparkles,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Target,
  ArrowRight,
  Filter,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { Badge } from './ui';

interface ActivityTimelineProps {
  activities: Activity[];
  onSelectActivity: (id: string) => void;
}

type TimelineViewMode = 'gantt' | 'calendar';
type ZoomLevel = 'day' | 'week' | 'compact';

export function ActivityTimeline({ activities, onSelectActivity }: ActivityTimelineProps) {
  const [viewMode, setViewMode] = useState<TimelineViewMode>('gantt');
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('day');
  const [hoveredActivityId, setHoveredActivityId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Calendar month state
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut (Escape to exit fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Lock body scroll when fullscreen is active
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Filter activities by status if selected
  const filteredActivities = useMemo(() => {
    if (filterStatus === 'all') return activities;
    return activities.filter(a => a.status === filterStatus);
  }, [activities, filterStatus]);

  // Compute bounding date range for Gantt
  const { minDate, maxDate, totalDays, dates, monthGroups, todayIndex } = useMemo(() => {
    if (activities.length === 0) {
      const now = new Date();
      return { 
        minDate: now.getTime(), 
        maxDate: now.getTime(), 
        totalDays: 1, 
        dates: [now], 
        monthGroups: [], 
        todayIndex: -1 
      };
    }

    let min = Infinity;
    let max = -Infinity;

    activities.forEach(a => {
      if (a.startDate) {
        const start = new Date(a.startDate).getTime();
        if (!isNaN(start)) {
          if (start < min) min = start;
        }
      }
      const endDateStr = a.finishDate || a.endDate || a.startDate;
      if (endDateStr) {
        const end = new Date(endDateStr).getTime();
        if (!isNaN(end)) {
          if (end > max) max = end;
        }
      }
    });

    const nowTime = new Date().getTime();
    // Ensure today is included in the span if reasonable
    if (min === Infinity || max === -Infinity) {
      min = nowTime;
      max = nowTime + 14 * 24 * 60 * 60 * 1000;
    }

    // Pad by 3 days before and after for breathing room
    const paddedMin = new Date(min - 3 * 24 * 60 * 60 * 1000);
    paddedMin.setHours(0, 0, 0, 0);

    const paddedMax = new Date(max + 4 * 24 * 60 * 60 * 1000);
    paddedMax.setHours(23, 59, 59, 999);

    const durationDays = Math.max(
      Math.ceil((paddedMax.getTime() - paddedMin.getTime()) / (24 * 60 * 60 * 1000)),
      14
    );

    const generatedDates: Date[] = [];
    const todayStr = new Date().toISOString().split('T')[0];
    let foundTodayIdx = -1;

    for (let i = 0; i < durationDays; i++) {
      const d = new Date(paddedMin.getTime() + i * 24 * 60 * 60 * 1000);
      generatedDates.push(d);
      if (d.toISOString().split('T')[0] === todayStr) {
        foundTodayIdx = i;
      }
    }

    // Group dates by Month & Year for top-tier header
    const groups: { monthLabel: string; count: number; startIndex: number }[] = [];
    let currentMonth = '';
    let currentCount = 0;
    let currentStart = 0;

    generatedDates.forEach((d, idx) => {
      const monthStr = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (monthStr !== currentMonth) {
        if (currentMonth) {
          groups.push({ monthLabel: currentMonth, count: currentCount, startIndex: currentStart });
        }
        currentMonth = monthStr;
        currentCount = 1;
        currentStart = idx;
      } else {
        currentCount++;
      }
    });
    if (currentMonth) {
      groups.push({ monthLabel: currentMonth, count: currentCount, startIndex: currentStart });
    }

    return { 
      minDate: paddedMin.getTime(), 
      maxDate: paddedMax.getTime(), 
      totalDays: durationDays, 
      dates: generatedDates, 
      monthGroups: groups,
      todayIndex: foundTodayIdx
    };
  }, [activities]);

  // Column width based on zoom level
  const dayColWidth = useMemo(() => {
    switch (zoomLevel) {
      case 'compact': return 22;
      case 'week': return 34;
      default: return 48;
    }
  }, [zoomLevel]);

  const timelineContentWidth = totalDays * dayColWidth;

  // Scroll to Today handler
  const handleScrollToToday = () => {
    if (scrollContainerRef.current && todayIndex >= 0) {
      const scrollPos = todayIndex * dayColWidth - 150;
      scrollContainerRef.current.scrollTo({ left: Math.max(0, scrollPos), behavior: 'smooth' });
    }
  };

  // Scroll to Project Start handler
  const handleScrollToStart = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  // Auto-scroll to today on initial mount
  useEffect(() => {
    if (todayIndex >= 0 && scrollContainerRef.current) {
      const scrollPos = todayIndex * dayColWidth - 150;
      scrollContainerRef.current.scrollTo({ left: Math.max(0, scrollPos), behavior: 'instant' });
    }
  }, [todayIndex, dayColWidth]);

  // Helpers for Status Styling
  const getStatusBadge = (status: ActivityStatus) => {
    switch(status) {
      case 'In Progress': return 'bg-[#0B5FFF] text-white';
      case 'Completed': return 'bg-[#2E7D32] text-white';
      case 'Blocked': return 'bg-[#D32F2F] text-white';
      default: return 'bg-[#F9A825] text-white';
    }
  };

  const getStatusFillColor = (status: ActivityStatus) => {
    switch(status) {
      case 'In Progress': return 'from-blue-600 to-[#0B5FFF] border-blue-500';
      case 'Completed': return 'from-emerald-600 to-green-600 border-emerald-500';
      case 'Blocked': return 'from-rose-600 to-red-600 border-rose-500';
      default: return 'from-amber-500 to-yellow-500 border-amber-400';
    }
  };

  const getStatusIcon = (status: ActivityStatus) => {
    switch(status) {
      case 'In Progress': return <PlayCircle className="h-3 w-3 shrink-0" />;
      case 'Completed': return <CheckCircle className="h-3 w-3 shrink-0" />;
      case 'Blocked': return <AlertCircle className="h-3 w-3 shrink-0" />;
      default: return <CalendarClock className="h-3 w-3 shrink-0" />;
    }
  };

  // --- MONTH CALENDAR MATRIX COMPUTATION ---
  const calendarMonthData = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Monday-first indexing (0 = Mon, 6 = Sun)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const calendarGridDays: { dateStr: string; dayNumber: number; isCurrentMonth: boolean; isToday: boolean; isWeekend: boolean }[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    // Leading days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthLastDay - i);
      const dateStr = prevDate.toISOString().split('T')[0];
      const dayOfWeek = prevDate.getDay();
      calendarGridDays.push({
        dateStr,
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      });
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const currDate = new Date(year, month, day);
      const dateStr = currDate.toISOString().split('T')[0];
      const dayOfWeek = currDate.getDay();
      calendarGridDays.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      });
    }

    // Trailing days to fill 35 or 42 grid slots
    const totalSlots = calendarGridDays.length > 35 ? 42 : 35;
    const remainingSlots = totalSlots - calendarGridDays.length;
    for (let day = 1; day <= remainingSlots; day++) {
      const nextDate = new Date(year, month + 1, day);
      const dateStr = nextDate.toISOString().split('T')[0];
      const dayOfWeek = nextDate.getDay();
      calendarGridDays.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      });
    }

    return calendarGridDays;
  }, [calendarDate]);

  // Map activities to dates for calendar
  const activitiesByDate = useMemo(() => {
    const map = new Map<string, Activity[]>();

    filteredActivities.forEach(act => {
      if (!act.startDate) return;
      const start = new Date(act.startDate);
      const end = new Date(act.finishDate || act.endDate || act.startDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

      const cur = new Date(start);
      cur.setHours(0, 0, 0, 0);
      const endLimit = new Date(end);
      endLimit.setHours(0, 0, 0, 0);

      // Max 60 days loop protection
      let loopCount = 0;
      while (cur <= endLimit && loopCount < 60) {
        const dateStr = cur.toISOString().split('T')[0];
        const list = map.get(dateStr) || [];
        list.push(act);
        map.set(dateStr, list);

        cur.setDate(cur.getDate() + 1);
        loopCount++;
      }
    });

    return map;
  }, [filteredActivities]);

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-3.5 bg-blue-50 dark:bg-blue-950/60 rounded-2xl text-[#0B5FFF] mb-3">
          <CalendarClock className="h-8 w-8" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">No Activities Scheduled</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          There are no scheduled activities matching the selected scope or timeframe to plot on the timeline.
        </p>
      </div>
    );
  }

  return (
    <div className={`transition-all duration-200 flex flex-col bg-white dark:bg-slate-900 ${
      isFullscreen 
        ? 'fixed inset-0 z-[100] w-screen h-screen rounded-none shadow-2xl overflow-hidden' 
        : 'border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm'
    }`}>
      
      {/* Top Toolbar */}
      <div className="p-3 sm:px-5 bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
        
        {/* Left: View Switcher & Quick Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-200/80 dark:bg-slate-700/80 p-0.5 rounded-xl flex items-center gap-0.5 text-xs font-bold">
            <button
              onClick={() => setViewMode('gantt')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'gantt'
                  ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Gantt Schedule</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>Month Calendar</span>
            </button>
          </div>

          {/* Quick Jump Buttons (Gantt only) */}
          {viewMode === 'gantt' && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleScrollToToday}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 text-[#0B5FFF] dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 transition-colors flex items-center gap-1"
                title="Scroll timeline to current date"
              >
                <Target className="h-3 w-3" />
                <span>Today</span>
              </button>
              <button
                onClick={handleScrollToStart}
                className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                title="Scroll timeline to project beginning"
              >
                Fit Project
              </button>
            </div>
          )}

          {/* Month Navigation (Calendar only) */}
          {viewMode === 'calendar' && (
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-slate-900 dark:text-white px-2">
                {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCalendarDate(new Date())}
                className="ml-1 text-xs font-semibold px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100 dark:text-slate-300"
              >
                Current
              </button>
            </div>
          )}
        </div>

        {/* Right: Zoom Level (Gantt), Status Filters & Fullscreen Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {viewMode === 'gantt' && (
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-700/80 p-0.5 rounded-xl text-[11px] font-bold">
              <button
                onClick={() => setZoomLevel('day')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  zoomLevel === 'day' ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-2xs' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setZoomLevel('week')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  zoomLevel === 'week' ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-2xs' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setZoomLevel('compact')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  zoomLevel === 'compact' ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-2xs' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Compact
              </button>
            </div>
          )}

          {/* Status Filter Legend Chips */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                filterStatus === 'all'
                  ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              All ({activities.length})
            </button>
            <button
              onClick={() => setFilterStatus(filterStatus === 'In Progress' ? 'all' : 'In Progress')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                filterStatus === 'In Progress'
                  ? 'bg-[#0B5FFF] text-white'
                  : 'bg-blue-50 text-[#0B5FFF] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilterStatus(filterStatus === 'Completed' ? 'all' : 'Completed')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                filterStatus === 'Completed'
                  ? 'bg-[#2E7D32] text-white'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              Completed
            </button>
          </div>

          {/* Fullscreen Expand / Collapse Button */}
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5 hidden sm:block" />

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
              isFullscreen
                ? 'bg-[#0B5FFF] text-white border-[#0B5FFF] shadow-xs ring-2 ring-blue-300 dark:ring-blue-800'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 hover:text-slate-900 shadow-2xs'
            }`}
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Expand to Fullscreen"}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Expand to Fullscreen"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Fullscreen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: GANTT TIMELINE SCHEDULE VIEW                                      */}
      {/* ========================================================================= */}
      {viewMode === 'gantt' && (
        <div className={`flex flex-col ${isFullscreen ? 'flex-1 h-[calc(100vh-120px)]' : 'h-[650px]'}`}>
          <div 
            ref={scrollContainerRef}
            className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar relative"
          >
            <div 
              style={{ minWidth: `${timelineContentWidth + 280}px` }} 
              className="flex flex-col relative"
            >
              
              {/* Header Container (Sticky top) */}
              <div className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 shadow-2xs">
                
                {/* Top Tier: Month Group Ribbon */}
                <div className="flex border-b border-slate-200 dark:border-slate-700">
                  <div className="w-[280px] shrink-0 p-2.5 font-bold text-xs text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800 sticky left-0 z-40">
                    Activity & Scope Package
                  </div>
                  <div className="flex-1 flex">
                    {monthGroups.map((g, idx) => (
                      <div 
                        key={idx}
                        style={{ width: `${g.count * dayColWidth}px` }}
                        className="py-1.5 px-3 border-r border-slate-200 dark:border-slate-700 text-center font-extrabold text-[11px] uppercase tracking-wider text-slate-800 dark:text-slate-200 bg-slate-100/50 dark:bg-slate-800/60 truncate"
                      >
                        {g.monthLabel}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Tier: Day Columns */}
                <div className="flex">
                  <div className="w-[280px] shrink-0 p-2 font-semibold text-[10px] uppercase tracking-wider text-slate-400 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 sticky left-0 z-40 flex items-center justify-between">
                    <span>Task Name</span>
                    <span className="pr-2">Progress</span>
                  </div>

                  <div className="flex-1 flex relative">
                    {dates.map((date, i) => {
                      const dayOfWeek = date.getDay();
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                      const isToday = i === todayIndex;

                      return (
                        <div 
                          key={i}
                          style={{ width: `${dayColWidth}px` }}
                          className={`shrink-0 flex flex-col items-center justify-center py-1.5 border-r border-slate-200/70 dark:border-slate-700/60 text-center transition-colors ${
                            isToday 
                              ? 'bg-blue-100/80 dark:bg-blue-950/80' 
                              : isWeekend 
                              ? 'bg-slate-100/60 dark:bg-slate-800/40' 
                              : ''
                          }`}
                        >
                          <span className={`text-[9px] uppercase font-bold tracking-tight ${
                            isToday ? 'text-[#0B5FFF] font-extrabold' : isWeekend ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            {date.toLocaleDateString('en-US', { weekday: 'narrow' })}
                          </span>
                          <span className={`text-xs font-black leading-tight ${
                            isToday 
                              ? 'text-white bg-[#0B5FFF] px-1.5 py-0.5 rounded-full text-[10px]' 
                              : 'text-slate-800 dark:text-slate-200'
                          }`}>
                            {date.getDate()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Activity Rows */}
              <div className="flex-1 flex flex-col relative divide-y divide-slate-100 dark:divide-slate-800/80">
                
                {/* Vertical Today Line through the entire body */}
                {todayIndex >= 0 && (
                  <div 
                    style={{ 
                      left: `${280 + todayIndex * dayColWidth + dayColWidth / 2}px`,
                      width: '2px'
                    }}
                    className="absolute top-0 bottom-0 bg-[#0B5FFF] z-10 pointer-events-none opacity-80"
                  >
                    <div className="sticky top-20 -ml-5 px-1.5 py-0.5 rounded bg-[#0B5FFF] text-white text-[8px] font-black uppercase tracking-wider shadow-sm">
                      Today
                    </div>
                  </div>
                )}

                {filteredActivities.map(activity => {
                  const start = new Date(activity.startDate).getTime();
                  const end = new Date(activity.finishDate || activity.endDate || activity.startDate).getTime();

                  // Calculate start offset in days from minDate
                  const startOffsetDays = Math.max(0, (start - minDate) / (24 * 60 * 60 * 1000));
                  const durationDays = Math.max(1, ((end - start) / (24 * 60 * 60 * 1000)) + 1);

                  const barLeftPx = startOffsetDays * dayColWidth;
                  const barWidthPx = Math.max(durationDays * dayColWidth - 4, dayColWidth - 4);

                  const isHovered = hoveredActivityId === activity.id;
                  const subtasks = activity.subtasks || [];
                  const completedSubtasks = subtasks.filter(s => s.status === 'Completed').length;

                  return (
                    <div 
                      key={activity.id}
                      onMouseEnter={() => setHoveredActivityId(activity.id)}
                      onMouseLeave={() => setHoveredActivityId(null)}
                      className={`flex transition-colors relative group ${
                        isHovered ? 'bg-blue-50/50 dark:bg-slate-800/60' : 'hover:bg-slate-50/40 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      {/* Fixed Left Column */}
                      <div 
                        className="w-[280px] shrink-0 p-3 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 group-hover:bg-slate-50/90 dark:group-hover:bg-slate-800/80 sticky left-0 z-20 cursor-pointer shadow-[2px_0_4px_rgba(0,0,0,0.02)]"
                        onClick={() => onSelectActivity(activity.id)}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="px-1.5 py-0.5 rounded font-mono text-[9px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 shrink-0">
                              {activity.id}
                            </span>
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate" title={activity.name}>
                              {activity.name}
                            </p>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 shrink-0">
                            {activity.progress || 0}%
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                          <span className="truncate">{activity.workPackage || 'Standard'}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {activity.discipline || 'General'}
                          </span>
                        </div>
                      </div>

                      {/* Timeline Day Grid Background & Activity Schedule Bar */}
                      <div className="flex-1 relative h-14 flex items-center">
                        
                        {/* Background column guides */}
                        <div className="absolute inset-0 flex pointer-events-none">
                          {dates.map((d, idx) => {
                            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                            return (
                              <div 
                                key={idx}
                                style={{ width: `${dayColWidth}px` }}
                                className={`shrink-0 border-r border-slate-100 dark:border-slate-800/50 h-full ${
                                  isWeekend ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''
                                }`}
                              />
                            );
                          })}
                        </div>

                        {/* Interactive Activity Schedule Bar */}
                        <div 
                          onClick={() => onSelectActivity(activity.id)}
                          style={{
                            left: `${barLeftPx + 2}px`,
                            width: `${barWidthPx}px`
                          }}
                          className={`absolute h-8 rounded-xl cursor-pointer shadow-sm border text-white overflow-hidden transition-all bg-linear-to-r ${getStatusFillColor(activity.status)} ${
                            isHovered ? 'ring-2 ring-blue-400 scale-[1.01] z-20 shadow-md' : 'z-10'
                          }`}
                          title={`${activity.name} (${activity.startDate} → ${activity.finishDate || activity.startDate})`}
                        >
                          {/* Inner Progress Fill Bar */}
                          <div 
                            className="absolute inset-y-0 left-0 bg-white/20 dark:bg-black/20"
                            style={{ width: `${activity.progress || 0}%` }}
                          />

                          {/* Bar Content */}
                          <div className="relative z-10 px-2.5 h-full flex items-center justify-between text-xs font-bold gap-2 min-w-0">
                            <div className="flex items-center gap-1.5 truncate">
                              {getStatusIcon(activity.status)}
                              <span className="truncate text-[11px] font-semibold drop-shadow-xs">
                                {activity.name}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1 shrink-0 text-[10px] font-mono font-black opacity-95">
                              {subtasks.length > 0 && (
                                <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-black/20 text-[9px] font-sans font-medium">
                                  {completedSubtasks}/{subtasks.length} subtasks
                                </span>
                              )}
                              <span>{activity.progress || 0}%</span>
                            </div>
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
      )}

      {/* ========================================================================= */}
      {/* MODE 2: MONTH CALENDAR GRID VIEW                                         */}
      {/* ========================================================================= */}
      {viewMode === 'calendar' && (
        <div className={`p-4 sm:p-6 overflow-y-auto ${isFullscreen ? 'flex-1 h-[calc(100vh-120px)]' : ''}`}>
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span className="text-blue-500">Sat</span>
            <span className="text-blue-500">Sun</span>
          </div>

          {/* 7x5 Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarMonthData.map((cell, idx) => {
              const dayActivities = activitiesByDate.get(cell.dateStr) || [];
              const hasActivities = dayActivities.length > 0;

              return (
                <div 
                  key={idx}
                  className={`min-h-[110px] p-2 rounded-xl border flex flex-col justify-between transition-all ${
                    cell.isToday
                      ? 'border-[#0B5FFF] bg-blue-50/40 dark:bg-blue-950/30 shadow-xs'
                      : cell.isCurrentMonth
                      ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 opacity-50'
                  }`}
                >
                  {/* Day Header Row */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${
                      cell.isToday
                        ? 'bg-[#0B5FFF] text-white px-2 py-0.5 rounded-full text-[11px]'
                        : cell.isCurrentMonth
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-400'
                    }`}>
                      {cell.dayNumber}
                    </span>

                    {hasActivities && (
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        {dayActivities.length} {dayActivities.length === 1 ? 'task' : 'tasks'}
                      </span>
                    )}
                  </div>

                  {/* Activity Pills in Cell */}
                  <div className="space-y-1 my-1 overflow-y-auto max-h-[75px] custom-scrollbar">
                    {dayActivities.slice(0, 3).map(act => (
                      <div 
                        key={act.id}
                        onClick={() => onSelectActivity(act.id)}
                        className={`px-1.5 py-1 rounded-md text-[10px] font-bold truncate cursor-pointer transition-transform hover:scale-[1.02] shadow-2xs flex items-center justify-between gap-1 ${
                          act.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          act.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                          act.status === 'Blocked' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                        title={`${act.id}: ${act.name} (${act.progress || 0}%)`}
                      >
                        <span className="truncate">{act.name}</span>
                        <span className="font-mono text-[9px] shrink-0">{act.progress || 0}%</span>
                      </div>
                    ))}
                    {dayActivities.length > 3 && (
                      <div className="text-[9px] font-bold text-slate-400 text-center">
                        +{dayActivities.length - 3} more
                      </div>
                    )}
                  </div>

                  <div />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Summary Bar */}
      <div className="p-3 px-5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            Showing {filteredActivities.length} of {activities.length} activities
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
          <span className="hidden sm:inline">
            Active Scope Span: {dates[0]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → {dates[dates.length - 1]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">
            Click any task bar to view complete deliverables, labour & QA gates
          </span>
        </div>
      </div>
    </div>
  );
}
