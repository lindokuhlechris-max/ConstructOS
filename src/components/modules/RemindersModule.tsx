import React, { useState, useRef, useMemo } from 'react';
import { 
  Bell, 
  Plus, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  X, 
  Tag, 
  User, 
  Truck, 
  ClipboardList, 
  Paperclip, 
  FileText, 
  StickyNote, 
  Layers, 
  CheckSquare, 
  ExternalLink,
  Sparkles,
  Search,
  Filter,
  CalendarDays,
  Flame,
  ArrowRight,
  Pin
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui';
import { Reminder, Priority } from '../../types';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  triggerTestNotification 
} from '../../lib/reminderNotificationService';
import { NotesSubScreen } from '../notes/NotesSubScreen';

export default function RemindersModule() {
  const { 
    reminders = [], 
    notes = [],
    addReminder, 
    updateReminder, 
    deleteReminder, 
    currentUserProfile,
    employees = [],
    equipment = [],
    activities = [],
    projects = []
  } = useAppContext();
  
  // Sub-tab navigation
  const [activeTab, setActiveTab] = useState<'reminders' | 'notes' | 'calendar'>('reminders');
  
  // Reminder creation & filters
  const [isCreating, setIsCreating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected calendar date
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Service Worker Notification State
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>(getNotificationPermission());
  
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '09:00',
    priority: 'Medium',
    linkedModules: [],
    linkedEmployeeId: '',
    linkedEquipmentId: '',
    linkedActivityId: '',
    attachments: []
  });

  const availableModules = ['Materials', 'Equipment', 'Employees', 'Activities', 'Projects', 'Safety', 'QC/QA', 'Notes'];

  // Counts for tabs & summary
  const pendingRemindersCount = useMemo(() => reminders.filter(r => r.status !== 'Completed').length, [reminders]);
  const overdueCount = useMemo(() => reminders.filter(r => r.status === 'Overdue' || (r.status === 'Pending' && r.dueDate < new Date().toISOString().split('T')[0])).length, [reminders]);
  const completedCount = useMemo(() => reminders.filter(r => r.status === 'Completed').length, [reminders]);
  const activeNotesCount = useMemo(() => notes.filter(n => !n.isArchived).length, [notes]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setNewReminder(prev => ({
            ...prev,
            attachments: [...(prev.attachments || []), result]
          }));
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setNewReminder(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index)
    }));
  };

  const handleCreate = () => {
    if (!newReminder.title) return;
    
    const modules = new Set(newReminder.linkedModules || []);
    if (newReminder.linkedEmployeeId) modules.add('Employees');
    if (newReminder.linkedEquipmentId) modules.add('Equipment');
    if (newReminder.linkedActivityId) modules.add('Activities');

    const reminder: Reminder = {
      id: `REM-${Math.floor(1000 + Math.random() * 9000)}`,
      title: newReminder.title || '',
      description: newReminder.description || '',
      dueDate: newReminder.dueDate || '',
      dueTime: newReminder.dueTime || undefined,
      status: 'Pending',
      priority: (newReminder.priority as any) || 'Medium',
      linkedModules: Array.from(modules) as string[],
      linkedEmployeeId: newReminder.linkedEmployeeId || undefined,
      linkedEquipmentId: newReminder.linkedEquipmentId || undefined,
      linkedActivityId: newReminder.linkedActivityId || undefined,
      attachments: newReminder.attachments || [],
      createdBy: currentUserProfile?.name || 'Administrator',
      createdAt: new Date().toISOString(),
    };
    
    addReminder(reminder);
    setIsCreating(false);
    setNewReminder({
      title: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '09:00',
      priority: 'Medium',
      linkedModules: [],
      linkedEmployeeId: '',
      linkedEquipmentId: '',
      linkedActivityId: '',
      attachments: []
    });
  };

  const toggleStatus = (reminder: Reminder) => {
    updateReminder({
      ...reminder,
      status: reminder.status === 'Completed' ? 'Pending' : 'Completed'
    });
  };

  const filteredReminders = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return reminders.filter(r => {
      // Filter status
      if (filterStatus === 'Pending' && r.status === 'Completed') return false;
      if (filterStatus === 'Completed' && r.status !== 'Completed') return false;
      if (filterStatus === 'Overdue') {
        const isOverdue = r.status === 'Overdue' || (r.status === 'Pending' && r.dueDate < today);
        if (!isOverdue) return false;
      }
      if (filterStatus === 'Critical' && r.priority !== 'Critical' && r.priority !== 'High') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesDesc = r.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });
  }, [reminders, filterStatus, searchQuery]);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critical':
      case 'High': 
        return 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300';
      case 'Medium': 
        return 'text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-900/60 dark:text-orange-300';
      case 'Low': 
        return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300';
      default: 
        return 'text-slate-700 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  // Relative Date Calculator
  const getRelativeDateText = (dateStr: string, isCompleted: boolean) => {
    if (isCompleted) return { text: 'Completed', color: 'text-slate-400', isOverdue: false };
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) {
      return { text: 'Due Today', color: 'text-amber-600 font-bold', isOverdue: false };
    }
    if (dateStr < today) {
      const diffDays = Math.ceil((new Date(today).getTime() - new Date(dateStr).getTime()) / (1000 * 3600 * 24));
      return { text: `Overdue by ${diffDays}d`, color: 'text-rose-600 font-bold', isOverdue: true };
    }
    const diffDays = Math.ceil((new Date(dateStr).getTime() - new Date(today).getTime()) / (1000 * 3600 * 24));
    return { text: `Due in ${diffDays}d`, color: 'text-[#0B5FFF] font-semibold', isOverdue: false };
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      
      {/* Top Header Bar */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Title & Badge */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#0B5FFF] to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Reminders & Field Notes</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-[#0B5FFF] border border-blue-200 dark:bg-blue-950/60 dark:border-blue-900">
                  {pendingRemindersCount} Active
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized action alerts, engineering memos, site diaries & scheduled notifications
              </p>
            </div>
          </div>

          {/* Sub-Tabs Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 self-stretch sm:self-auto overflow-x-auto">
            
            <button
              type="button"
              onClick={() => setActiveTab('reminders')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'reminders'
                  ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bell className="h-4 w-4" />
              <span>Reminders</span>
              {pendingRemindersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-orange-500 text-white font-mono">
                  {pendingRemindersCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'notes'
                  ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <StickyNote className="h-4 w-4" />
              <span>Field Notes & Memos</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/60 text-[#0B5FFF] dark:text-blue-300 font-mono">
                {activeNotesCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              <span>Unified Timeline</span>
            </button>

          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 flex-1">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* ================================================================ */}
          {/* TAB 1: REMINDERS SUB-SCREEN                                      */}
          {/* ================================================================ */}
          {activeTab === 'reminders' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Stat Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Pending Alerts
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                      {pendingRemindersCount}
                    </span>
                    <div className="p-2 rounded-xl bg-blue-50 text-[#0B5FFF] dark:bg-blue-950/60">
                      <Bell className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500 block mb-1">
                    Overdue
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                      {overdueCount}
                    </span>
                    <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                    Completed
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {completedCount}
                    </span>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                    Field Notes
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                      {activeNotesCount}
                    </span>
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60">
                      <StickyNote className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Toolbar & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search reminders by title or description..."
                    className="w-full h-10 pl-10 pr-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {['All', 'Pending', 'Overdue', 'Completed', 'Critical'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFilterStatus(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        filterStatus === st
                          ? 'bg-[#0B5FFF] text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* New Reminder Button */}
                <Button
                  onClick={() => setIsCreating(true)}
                  className="h-10 px-4 rounded-2xl bg-[#0B5FFF] hover:bg-blue-600 text-white font-bold text-xs gap-1.5 shadow-sm shrink-0"
                >
                  <Plus className="h-4 w-4" /> New Reminder
                </Button>
              </div>

              {/* Reminders Cards List */}
              <div className="space-y-3">
                {filteredReminders.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                    <Bell className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto" />
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        No reminders found
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        You are all caught up! Create a new reminder or convert any field note into an actionable alert.
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsCreating(true)}
                      className="rounded-2xl text-xs font-bold bg-[#0B5FFF] hover:bg-blue-600 text-white gap-1.5 shadow-sm"
                    >
                      <Plus className="h-4 w-4" /> Create Reminder
                    </Button>
                  </div>
                ) : (
                  filteredReminders.map(reminder => {
                    const isCompleted = reminder.status === 'Completed';
                    const relative = getRelativeDateText(reminder.dueDate, isCompleted);
                    const linkedEmployee = employees.find(e => e.id === reminder.linkedEmployeeId);
                    const linkedEquip = equipment.find(eq => eq.id === reminder.linkedEquipmentId);
                    const linkedAct = activities.find(a => a.id === reminder.linkedActivityId);
                    const linkedNote = notes.find(n => n.id === reminder.linkedNoteId);

                    return (
                      <div
                        key={reminder.id}
                        className={`p-4 sm:p-5 rounded-3xl border transition-all flex items-start gap-3.5 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-sm ${
                          isCompleted
                            ? 'opacity-65 border-slate-200 dark:border-slate-800'
                            : relative.isOverdue
                              ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20'
                              : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800'
                        }`}
                      >
                        {/* Status Checkbox */}
                        <button
                          type="button"
                          onClick={() => toggleStatus(reminder)}
                          className={`mt-0.5 h-6 w-6 rounded-xl border-2 flex items-center justify-center transition-all shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-300 dark:border-slate-600 hover:border-[#0B5FFF] text-transparent'
                          }`}
                          title={isCompleted ? 'Mark Pending' : 'Mark Completed'}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          
                          {/* Header Line */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className={`font-bold text-sm sm:text-base ${
                                isCompleted 
                                  ? 'line-through text-slate-400 dark:text-slate-500' 
                                  : 'text-slate-900 dark:text-white'
                              }`}>
                                {reminder.title}
                              </h3>

                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${getPriorityBadge(reminder.priority)}`}>
                                {reminder.priority}
                              </span>

                              <span className={`text-xs ${relative.color}`}>
                                • {relative.text}
                              </span>
                            </div>

                            <span className="text-[11px] text-slate-400 font-mono">
                              Due: {reminder.dueDate} {reminder.dueTime ? `@ ${reminder.dueTime}` : ''}
                            </span>
                          </div>

                          {/* Description */}
                          {reminder.description && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line font-normal leading-relaxed mt-1">
                              {reminder.description}
                            </p>
                          )}

                          {/* Entity Badges & Linked Notes */}
                          {(linkedEmployee || linkedEquip || linkedAct || linkedNote) && (
                            <div className="flex items-center gap-1.5 flex-wrap mt-2.5 text-[11px]">
                              {linkedNote && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveTab('notes');
                                  }}
                                  className="px-2.5 py-1 rounded-xl font-semibold bg-blue-50 text-[#0B5FFF] border border-blue-200 dark:bg-blue-950/50 dark:border-blue-900 flex items-center gap-1 hover:underline"
                                  title="View source field note"
                                >
                                  <StickyNote className="h-3 w-3" /> Note: {linkedNote.title}
                                  <ArrowRight className="h-2.5 w-2.5" />
                                </button>
                              )}

                              {linkedAct && (
                                <span className="px-2 py-0.5 rounded-lg font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:border-indigo-900 dark:text-indigo-300 flex items-center gap-1">
                                  <ClipboardList className="h-3 w-3" /> Task: {linkedAct.name}
                                </span>
                              )}

                              {linkedEmployee && (
                                <span className="px-2 py-0.5 rounded-lg font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/50 dark:border-purple-900 dark:text-purple-300 flex items-center gap-1">
                                  <User className="h-3 w-3" /> {linkedEmployee.firstName} {linkedEmployee.lastName}
                                </span>
                              )}

                              {linkedEquip && (
                                <span className="px-2 py-0.5 rounded-lg font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:border-amber-900 dark:text-amber-300 flex items-center gap-1">
                                  <Truck className="h-3 w-3" /> {linkedEquip.name}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Attachments Preview */}
                          {reminder.attachments && reminder.attachments.length > 0 && (
                            <div className="flex items-center gap-2 overflow-x-auto pt-2">
                              {reminder.attachments.map((att, idx) => (
                                <div key={idx} className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                                  {att.startsWith('data:image/') || att.startsWith('http') ? (
                                    <img src={att} alt="attachment" className="h-10 w-10 object-cover" />
                                  ) : (
                                    <div className="h-10 px-2 bg-slate-100 dark:bg-slate-800 flex items-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                      File #{idx + 1}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => deleteReminder(reminder.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                          title="Delete reminder"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2: FIELD NOTES & MEMOS SUB-SCREEN                            */}
          {/* ================================================================ */}
          {activeTab === 'notes' && (
            <NotesSubScreen />
          )}

          {/* ================================================================ */}
          {/* TAB 3: UNIFIED TIMELINE & CALENDAR                               */}
          {/* ================================================================ */}
          {activeTab === 'calendar' && (
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm animate-in fade-in duration-200">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-[#0B5FFF]" />
                    <span>Unified Action Timeline & Calendar</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Schedule tracking for all active reminders and dated engineering field notes
                  </p>
                </div>

                <input
                  type="date"
                  value={selectedCalendarDate}
                  onChange={e => setSelectedCalendarDate(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
                />
              </div>

              {/* Day Items */}
              {(() => {
                const dayReminders = reminders.filter(r => r.dueDate === selectedCalendarDate);
                const dayNotes = notes.filter(n => n.createdAt?.startsWith(selectedCalendarDate));

                return (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Events for {new Date(selectedCalendarDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </h4>

                    {dayReminders.length === 0 && dayNotes.length === 0 ? (
                      <div className="text-center py-10 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                        No reminders or field notes recorded for this date.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {dayReminders.map(rem => (
                          <div key={rem.id} className="p-3.5 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <Bell className="h-4 w-4 text-[#0B5FFF] shrink-0" />
                              <div className="min-w-0">
                                <span className="font-bold text-xs text-slate-900 dark:text-white truncate block">
                                  {rem.title}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  Reminder • {rem.dueTime || 'All Day'} • {rem.priority}
                                </span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
                              {rem.status}
                            </span>
                          </div>
                        ))}

                        {dayNotes.map(note => (
                          <div key={note.id} className="p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30 flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <StickyNote className="h-4 w-4 text-amber-600 shrink-0" />
                              <div className="min-w-0">
                                <span className="font-bold text-xs text-slate-900 dark:text-white truncate block">
                                  {note.title}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  Field Note • {note.category}
                                </span>
                              </div>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setActiveTab('notes')}
                              className="h-7 text-[10px] rounded-lg border-amber-300 text-amber-800"
                            >
                              View Note
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>
          )}

        </div>
      </div>

      {/* Create Reminder Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col">
            
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-[#0B5FFF] flex items-center justify-center shrink-0 shadow-2xs">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Create New Reminder</h2>
                  <p className="text-xs text-slate-500">Set scheduled alert, assignee, and entity links</p>
                </div>
              </div>

              <button 
                onClick={() => setIsCreating(false)} 
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Title *</label>
                <input 
                  type="text" 
                  value={newReminder.title} 
                  onChange={e => setNewReminder({...newReminder, title: e.target.value})}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 focus:outline-none focus:border-[#0B5FFF] text-xs sm:text-sm font-semibold"
                  placeholder="e.g. Inspect trench depth & check soil compaction"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Description / Notes</label>
                <textarea 
                  value={newReminder.description} 
                  onChange={e => setNewReminder({...newReminder, description: e.target.value})}
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:border-[#0B5FFF] text-xs font-normal"
                  placeholder="Additional details and instructions..."
                />
              </div>

              {/* Date, Time & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Due Date</label>
                  <input 
                    type="date" 
                    value={newReminder.dueDate} 
                    onChange={e => setNewReminder({...newReminder, dueDate: e.target.value})}
                    className="w-full h-9 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Due Time</label>
                  <input 
                    type="time" 
                    value={newReminder.dueTime || ''} 
                    onChange={e => setNewReminder({...newReminder, dueTime: e.target.value})}
                    className="w-full h-9 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Priority</label>
                  <select 
                    value={newReminder.priority}
                    onChange={e => setNewReminder({...newReminder, priority: e.target.value as any})}
                    className="w-full h-9 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>
              </div>

              {/* Entity Linking */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Link Specific Entities</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                      <User className="h-3.5 w-3.5 text-purple-600" /> Assignee
                    </label>
                    <select
                      value={newReminder.linkedEmployeeId || ''}
                      onChange={e => setNewReminder({...newReminder, linkedEmployeeId: e.target.value})}
                      className="w-full h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 text-xs"
                    >
                      <option value="">-- Unassigned --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                      <Truck className="h-3.5 w-3.5 text-amber-600" /> Machinery
                    </label>
                    <select
                      value={newReminder.linkedEquipmentId || ''}
                      onChange={e => setNewReminder({...newReminder, linkedEquipmentId: e.target.value})}
                      className="w-full h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 text-xs"
                    >
                      <option value="">-- None --</option>
                      {equipment.map(eq => (
                        <option key={eq.id} value={eq.id}>{eq.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                      <ClipboardList className="h-3.5 w-3.5 text-indigo-600" /> Activity Task
                    </label>
                    <select
                      value={newReminder.linkedActivityId || ''}
                      onChange={e => setNewReminder({...newReminder, linkedActivityId: e.target.value})}
                      className="w-full h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 text-xs"
                    >
                      <option value="">-- None --</option>
                      {activities.map(act => (
                        <option key={act.id} value={act.id}>{act.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Attachments */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Attachments (Images, Documents)
                </label>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  multiple 
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden" 
                />

                <div className="flex flex-wrap gap-2 items-center">
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                  >
                    <Paperclip className="h-3.5 w-3.5 text-[#0B5FFF]" /> Add Files
                  </button>

                  {(newReminder.attachments || []).map((att, idx) => (
                    <div key={idx} className="relative flex items-center gap-1 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-1 text-xs">
                      {att.startsWith('data:image/') ? (
                        <img src={att} alt="Attachment" className="h-8 w-8 object-cover rounded-lg" />
                      ) : (
                        <div className="px-2 text-[10px] font-bold">Doc #{idx + 1}</div>
                      )}
                      <button 
                        type="button" 
                        onClick={() => removeAttachment(idx)}
                        className="text-slate-400 hover:text-rose-500 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreating(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleCreate}
                className="rounded-xl text-xs font-bold bg-[#0B5FFF] hover:bg-blue-600 text-white gap-1 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" /> Save Reminder
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
