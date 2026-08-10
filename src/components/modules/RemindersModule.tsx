import React, { useState, useRef } from 'react';
import { Bell, Plus, Calendar, AlertCircle, CheckCircle2, Clock, Trash2, X, Tag, User, Truck, ClipboardList, Paperclip, FileText, Image as ImageIcon } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui';
import { Reminder } from '../../types';

export default function RemindersModule() {
  const { 
    reminders, 
    addReminder, 
    updateReminder, 
    deleteReminder, 
    currentUserProfile,
    employees,
    equipment,
    activities
  } = useAppContext();
  
  const [isCreating, setIsCreating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const availableModules = ['Materials', 'Equipment', 'Employees', 'Activities', 'Projects', 'Safety', 'QC/QA'];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    (Array.from(files) as File[]).forEach(file => {
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

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setNewReminder(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index)
    }));
  };

  const handleCreate = () => {
    if (!newReminder.title) return;
    
    // Auto-ensure linked departments match selected specific entities
    const modules = new Set(newReminder.linkedModules || []);
    if (newReminder.linkedEmployeeId) modules.add('Employees');
    if (newReminder.linkedEquipmentId) modules.add('Equipment');
    if (newReminder.linkedActivityId) modules.add('Activities');

    const reminder: Reminder = {
      id: `REM-${Math.floor(Math.random() * 10000)}`,
      title: newReminder.title || '',
      description: newReminder.description || '',
      dueDate: newReminder.dueDate || '',
      dueTime: newReminder.dueTime || undefined,
      status: 'Pending',
      priority: newReminder.priority as any || 'Medium',
      linkedModules: Array.from(modules) as string[],
      linkedEmployeeId: newReminder.linkedEmployeeId || undefined,
      linkedEquipmentId: newReminder.linkedEquipmentId || undefined,
      linkedActivityId: newReminder.linkedActivityId || undefined,
      attachments: newReminder.attachments || [],
      createdBy: currentUserProfile.name,
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

  const toggleModuleSelection = (module: string) => {
    const current = newReminder.linkedModules || [];
    if (current.includes(module)) {
      setNewReminder({ ...newReminder, linkedModules: current.filter(m => m !== module) });
    } else {
      setNewReminder({ ...newReminder, linkedModules: [...current, module] });
    }
  };

  const toggleStatus = (reminder: Reminder) => {
    updateReminder({
      ...reminder,
      status: reminder.status === 'Completed' ? 'Pending' : 'Completed'
    });
  };

  const filteredReminders = reminders.filter(r => {
    if (filterStatus === 'All') return true;
    return r.status === filterStatus;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
      case 'Critical': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'Medium': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
      case 'Low': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      default: return 'text-slate-600 bg-slate-100 dark:bg-slate-800';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="flex-none p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#0B5FFF]/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-[#0B5FFF]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Reminders</h1>
              <p className="text-sm text-slate-500">Cross-departmental & entity-specific alerts</p>
            </div>
          </div>
          <Button onClick={() => setIsCreating(true)} className="bg-[#0B5FFF] hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30">
            <Plus className="h-4 w-4 mr-2" /> New Reminder
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Filters */}
          <div className="flex gap-2">
            {['All', 'Pending', 'Completed', 'Overdue'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status 
                    ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="space-y-4">
            {filteredReminders.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No reminders found</h3>
                <p className="text-slate-500">You're all caught up!</p>
              </div>
            ) : (
              filteredReminders.map(reminder => {
                const linkedEmployee = employees.find(e => e.id === reminder.linkedEmployeeId);
                const linkedEquip = equipment.find(eq => eq.id === reminder.linkedEquipmentId);
                const linkedAct = activities.find(a => a.id === reminder.linkedActivityId);

                return (
                  <div key={reminder.id} className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-start gap-4 transition-all hover:shadow-md ${reminder.status === 'Completed' ? 'opacity-60' : ''}`}>
                    <button 
                      onClick={() => toggleStatus(reminder)}
                      className={`mt-1 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        reminder.status === 'Completed' 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-slate-300 hover:border-[#0B5FFF] text-transparent hover:text-[#0B5FFF]/20'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-semibold text-lg ${reminder.status === 'Completed' ? 'line-through text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
                          {reminder.title}
                        </h3>
                        <div className="flex gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 border ${
                            reminder.status === 'Completed' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                            reminder.status === 'Overdue' ? 'bg-red-50 text-red-600 border-red-200' :
                            'bg-blue-50 text-blue-600 border-blue-200'
                          }`}>
                            <Clock className="h-3 w-3" /> {reminder.status}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent ${getPriorityColor(reminder.priority)}`}>
                            {reminder.priority}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
                        {reminder.description}
                      </p>

                      {/* Specific Entity Badges */}
                      {(linkedEmployee || linkedEquip || linkedAct) && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {linkedEmployee && (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-lg border border-purple-200 dark:border-purple-800">
                              <User className="h-3 w-3" /> Person: {linkedEmployee.name}
                            </span>
                          )}
                          {linkedEquip && (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800">
                              <Truck className="h-3 w-3" /> Machinery: {linkedEquip.name}
                            </span>
                          )}
                          {linkedAct && (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-800">
                              <ClipboardList className="h-3 w-3" /> Task: {linkedAct.name}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Attachments Preview */}
                      {reminder.attachments && reminder.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {reminder.attachments.map((att, idx) => (
                            <div key={idx} className="relative group">
                              {att.startsWith('data:image/') ? (
                                <img src={att} alt="Attachment" className="h-14 w-14 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                              ) : (
                                <div className="h-14 px-3 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200">
                                  <FileText className="h-4 w-4 text-[#0B5FFF]" /> Attachment #{idx + 1}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <Calendar className="h-3.5 w-3.5" /> 
                            Due: {new Date(reminder.dueDate).toLocaleDateString()} {reminder.dueTime ? `at ${reminder.dueTime}` : ''}
                          </span>
                          {reminder.linkedModules.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Tag className="h-3.5 w-3.5 text-slate-400" />
                              <div className="flex gap-1.5">
                                {reminder.linkedModules.map(mod => (
                                  <span key={mod} className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-600">
                                    {mod}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <button onClick={() => deleteReminder(reminder.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 flex-none">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Create Detailed Reminder</h2>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Title *</label>
                <input 
                  type="text" 
                  value={newReminder.title} 
                  onChange={e => setNewReminder({...newReminder, title: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]/50 text-sm"
                  placeholder="e.g. Get PPE for new workers, Refuel Excavator"
                />
              </div>
              
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Description</label>
                <textarea 
                  value={newReminder.description} 
                  onChange={e => setNewReminder({...newReminder, description: e.target.value})}
                  className="w-full min-h-[70px] bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]/50 text-sm"
                  placeholder="Additional details..."
                />
              </div>

              {/* Date, Time & Priority in 3 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Due Date</label>
                  <input 
                    type="date" 
                    value={newReminder.dueDate} 
                    onChange={e => setNewReminder({...newReminder, dueDate: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]/50 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Due Time</label>
                  <input 
                    type="time" 
                    value={newReminder.dueTime || ''} 
                    onChange={e => setNewReminder({...newReminder, dueTime: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]/50 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Priority</label>
                  <select 
                    value={newReminder.priority}
                    onChange={e => setNewReminder({...newReminder, priority: e.target.value as any})}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]/50 text-sm"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>
              </div>

              {/* Attachments Upload */}
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Attachments <span className="text-slate-400 font-normal">(Images, Specs, Documents)</span>
                </label>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  multiple 
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden" 
                />

                <div className="flex flex-wrap gap-3 items-center">
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-600"
                  >
                    <Paperclip className="h-4 w-4 text-[#0B5FFF]" /> Add Documents / Images
                  </button>

                  {(newReminder.attachments || []).map((att, idx) => (
                    <div key={idx} className="relative group flex items-center gap-1 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-1.5">
                      {att.startsWith('data:image/') ? (
                        <img src={att} alt="Attachment" className="h-10 w-10 object-cover rounded-lg" />
                      ) : (
                        <div className="flex items-center gap-1.5 px-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                          <FileText className="h-4 w-4 text-[#0B5FFF]" /> Document #{idx + 1}
                        </div>
                      )}
                      <button 
                        type="button" 
                        onClick={() => removeAttachment(idx)}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Granular Entity Selectors in 3 Columns */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Link Specific Entities (Optional)</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Employee Selector */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                      <User className="h-3.5 w-3.5 text-purple-600" /> Assign Employee
                    </label>
                    <select
                      value={newReminder.linkedEmployeeId || ''}
                      onChange={e => setNewReminder({...newReminder, linkedEmployeeId: e.target.value})}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">-- Unassigned --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                      ))}
                    </select>
                  </div>

                  {/* Equipment Selector */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                      <Truck className="h-3.5 w-3.5 text-amber-600" /> Link Machinery
                    </label>
                    <select
                      value={newReminder.linkedEquipmentId || ''}
                      onChange={e => setNewReminder({...newReminder, linkedEquipmentId: e.target.value})}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">-- No Machinery --</option>
                      {equipment.map(eq => (
                        <option key={eq.id} value={eq.id}>{eq.name} ({eq.type || eq.category})</option>
                      ))}
                    </select>
                  </div>

                  {/* Activity Selector */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                      <ClipboardList className="h-3.5 w-3.5 text-indigo-600" /> Link Task
                    </label>
                    <select
                      value={newReminder.linkedActivityId || ''}
                      onChange={e => setNewReminder({...newReminder, linkedActivityId: e.target.value})}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">-- No Activity --</option>
                      {activities.map(act => (
                        <option key={act.id} value={act.id}>{act.name} ({act.status})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Link to General Departments <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableModules.map(mod => (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => toggleModuleSelection(mod)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        (newReminder.linkedModules || []).includes(mod)
                          ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {mod}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 flex-none">
              <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button onClick={handleCreate} className="bg-[#0B5FFF] hover:bg-blue-700 text-white" disabled={!newReminder.title}>
                Create Reminder
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
