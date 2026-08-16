import React, { useState } from 'react';
import { Card } from './ui';
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, X, Calendar as CalendarIcon, AlignLeft } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { useAppContext } from '../context/AppContext';
import { Reminder } from '../types';

export function CalendarWidget() {
  const { reminders, addReminder, updateReminder, deleteReminder, currentUserProfile } = useAppContext();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Modal State
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventStart, setEventStart] = useState('');
  const [eventEnd, setEventEnd] = useState('');

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const getEventsForDate = (date: Date) => {
    return reminders.filter(r => r.dueDate === format(date, 'yyyy-MM-dd'));
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !eventTitle.trim()) return;

    addReminder({
      id: crypto.randomUUID(),
      title: eventTitle,
      description: eventDesc,
      dueDate: format(selectedDate, 'yyyy-MM-dd'),
      startTime: eventStart,
      endTime: eventEnd,
      location: eventLocation,
      status: 'Pending',
      priority: 'Medium',
      linkedModules: [],
      createdBy: currentUserProfile?.name || 'User',
      createdAt: new Date().toISOString()
    } as any);

    setEventTitle('');
    setEventDesc('');
    setEventLocation('');
    setEventStart('');
    setEventEnd('');
    setIsAddingEvent(false);
  };

  return (
    <>
      <Card className="p-4 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl relative">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={handlePrevMonth} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={handleNextMonth} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {weekDays.map(day => (
            <div key={day} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {days.map((day, i) => {
            const isSelectedMonth = isSameMonth(day, monthStart);
            const isTodayDate = isToday(day);
            const dayEvents = getEventsForDate(day);
            
            return (
              <div 
                key={i} 
                onClick={() => setSelectedDate(day)}
                className={`
                  flex flex-col items-center justify-start text-xs rounded-lg h-10 pt-1 relative
                  ${!isSelectedMonth ? 'text-slate-300 dark:text-slate-600 font-medium' : 'text-slate-700 dark:text-slate-300 font-semibold'}
                  ${isTodayDate ? 'bg-[#0B5FFF] text-white font-bold shadow-md shadow-blue-500/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors'}
                `}
              >
                <span>{format(day, 'd')}</span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    {dayEvents.slice(0, 3).map((_, idx) => (
                      <div key={idx} className={`w-1 h-1 rounded-full ${isTodayDate ? 'bg-white' : 'bg-[#0B5FFF]'}`} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Date Details & Add Event Modal */}
      {selectedDate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#0B5FFF]" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100">
                  {format(selectedDate, 'EEEE, MMMM do')}
                </h3>
              </div>
              <button onClick={() => { setSelectedDate(null); setIsAddingEvent(false); }} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {isAddingEvent ? (
                <form onSubmit={handleSaveEvent} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Event Title</label>
                    <input 
                      type="text" 
                      required
                      value={eventTitle}
                      onChange={e => setEventTitle(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0B5FFF] focus:ring-1 focus:ring-[#0B5FFF]"
                      placeholder="e.g. Site Inspection"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Time</label>
                      <input 
                        type="time" 
                        value={eventStart}
                        onChange={e => setEventStart(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0B5FFF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Time</label>
                      <input 
                        type="time" 
                        value={eventEnd}
                        onChange={e => setEventEnd(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0B5FFF]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        value={eventLocation}
                        onChange={e => setEventLocation(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#0B5FFF]"
                        placeholder="Block A, Level 3"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                    <div className="relative">
                      <AlignLeft className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <textarea 
                        value={eventDesc}
                        onChange={e => setEventDesc(e.target.value)}
                        rows={3}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#0B5FFF] resize-none"
                        placeholder="Additional details..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setIsAddingEvent(false)} className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-colors">
                      Cancel
                    </button>
                    <button type="submit" className="flex-1 px-4 py-2.5 bg-[#0B5FFF] hover:bg-blue-600 text-white font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-colors">
                      Save Event
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  {getEventsForDate(selectedDate).length > 0 ? (
                    getEventsForDate(selectedDate).map(event => (
                      <div key={event.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{event.title}</h4>
                          <button 
                            onClick={() => deleteReminder(event.id)}
                            className="text-xs text-red-500 hover:text-red-700 p-1"
                          >
                            Delete
                          </button>
                        </div>
                        
                        <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                          {(event.startTime || event.endTime) && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              <span>{event.startTime || '?'} - {event.endTime || '?'}</span>
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          {event.description && (
                            <div className="flex items-start gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                              <AlignLeft className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <p className="line-clamp-2">{event.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      No events scheduled for this day.
                    </div>
                  )}

                  <button 
                    onClick={() => setIsAddingEvent(true)}
                    className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl font-bold transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" /> Add Event
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
