import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  User,
  Truck,
  ClipboardList
} from 'lucide-react';
import { Button } from '../ui';
import { ActivityNote, Priority } from '../../types';
import { useAppContext } from '../../context/AppContext';

export interface ConvertToReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: ActivityNote | null;
  onConverted?: () => void;
}

export function ConvertToReminderModal({
  isOpen,
  onClose,
  note,
  onConverted
}: ConvertToReminderModalProps) {
  const { convertNoteToReminder, employees = [], equipment = [], activities = [] } = useAppContext();

  const [dueDate, setDueDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [dueTime, setDueTime] = useState<string>('09:00');
  const [priority, setPriority] = useState<Priority>('Medium');

  if (!isOpen || !note) return null;

  const handleConvert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueDate) {
      alert('Please specify a due date for the reminder.');
      return;
    }

    convertNoteToReminder(note, dueDate, dueTime, priority);
    if (onConverted) onConverted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Bell className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                Convert Note to Actionable Reminder
              </h3>
              <p className="text-xs text-slate-500 truncate">
                Schedule alert and push notification for this note
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConvert} className="p-4 sm:p-5 space-y-4">
          
          {/* Note Source Preview */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Source Note
            </span>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {note.title}
            </h4>
            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
              {note.content}
            </p>
          </div>

          {/* Schedule Due Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-[#0B5FFF]" /> Due Date *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-500" /> Due Time
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Reminder Priority
            </label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as Priority)}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
            >
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority</option>
              <option value="Critical">Critical Priority</option>
            </select>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#0B5FFF] shrink-0 mt-0.5" />
            <span>
              This will create a new alert on the <strong>Reminders</strong> board, schedule device notifications, and maintain a link back to this note.
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              size="sm"
              className="rounded-xl text-xs font-bold bg-[#0B5FFF] hover:bg-blue-600 text-white gap-1.5 shadow-xs"
            >
              <span>Create Reminder</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
}
