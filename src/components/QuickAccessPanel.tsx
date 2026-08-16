import React, { useState } from 'react';
import { Card, CardContent } from './ui';
import { Users, Truck, CheckSquare, Calendar, Plus, Trash2, Edit2, X, Check, Square } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Reminder } from '../types';

export function QuickAccessPanel() {
  const { employees = [], equipment = [], reminders = [], addReminder, updateReminder, deleteReminder } = useAppContext();
  const [activeTab, setActiveTab] = useState<'employees' | 'equipment' | 'reminders'>('employees');
  
  // To-Do state
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingTodoTitle, setEditingTodoTitle] = useState('');
  const [selectedTodos, setSelectedTodos] = useState<Set<string>>(new Set());

  const allTodos = reminders
    .filter(r => r.status === 'Pending' || r.status === 'Completed')
    .sort((a, b) => {
      if (a.status === 'Completed' && b.status !== 'Completed') return 1;
      if (a.status !== 'Completed' && b.status === 'Completed') return -1;
      return 0;
    });

  const pendingReminders = allTodos.filter(r => r.status === 'Pending');
  const completedTodos = allTodos.filter(r => r.status === 'Completed');
  const activeEmployees = employees.filter(e => e.status === 'Active');
  const activeEquipment = equipment.filter(e => e.status === 'Operating');

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;
    
    const newReminder: Reminder = {
      id: `REM-${Math.floor(Math.random() * 10000)}`,
      title: newTodoTitle.trim(),
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      priority: 'Medium',
      linkedModules: [],
      createdBy: 'Current User',
      createdAt: new Date().toISOString()
    };
    
    addReminder(newReminder);
    setNewTodoTitle('');
    setIsAddingTodo(false);
  };

  const toggleComplete = (reminder: Reminder) => {
    updateReminder({ ...reminder, status: reminder.status === 'Completed' ? 'Pending' : 'Completed' });
  };

  const handleSaveEdit = (reminder: Reminder) => {
    if (!editingTodoTitle.trim()) return;
    updateReminder({ ...reminder, title: editingTodoTitle.trim() });
    setEditingTodoId(null);
  };

  const handleBulkDelete = () => {
    selectedTodos.forEach(id => deleteReminder(id));
    setSelectedTodos(new Set());
  };

  const handleBulkComplete = () => {
    allTodos.forEach(rem => {
      if (selectedTodos.has(rem.id) && rem.status === 'Pending') {
        updateReminder({ ...rem, status: 'Completed' });
      }
    });
    setSelectedTodos(new Set());
  };

  const handleClearCompleted = () => {
    completedTodos.forEach(rem => deleteReminder(rem.id));
    setSelectedTodos(new Set());
  };

  return (
    <Card className="flex flex-col h-[655px] shrink-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900">
      {/* Header & Tabs */}
      <div className="flex flex-col border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="px-4 py-3 pb-0 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Quick Access</h3>
        </div>
        <div className="flex px-4 pt-3 gap-4 overflow-x-auto no-scrollbar relative">
          <button 
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-2 pb-2.5 text-xs font-bold transition-all whitespace-nowrap border-b-2 ${
              activeTab === 'employees' 
                ? 'border-[#0B5FFF] text-[#0B5FFF] dark:text-blue-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Team ({activeEmployees.length})
          </button>
          <button 
            onClick={() => setActiveTab('equipment')}
            className={`flex items-center gap-2 pb-2.5 text-xs font-bold transition-all whitespace-nowrap border-b-2 ${
              activeTab === 'equipment' 
                ? 'border-amber-500 text-amber-600 dark:text-amber-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Truck className="w-3.5 h-3.5" /> Equipment ({activeEquipment.length})
          </button>
          <button 
            onClick={() => setActiveTab('reminders')}
            className={`flex items-center gap-2 pb-2.5 text-xs font-bold transition-all whitespace-nowrap border-b-2 ${
              activeTab === 'reminders' 
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" /> To-Do ({pendingReminders.length})
          </button>
        </div>
      </div>

      <CardContent className="flex-1 p-0 overflow-y-auto no-scrollbar relative flex flex-col">
        {activeTab === 'employees' && (
          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/50">
            {activeEmployees.length > 0 ? activeEmployees.map((emp, index) => (
              <div key={emp.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-400 w-4 text-right shrink-0">{index + 1}.</span>
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-500 shrink-0">
                    {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{emp.firstName} {emp.lastName}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wide truncate">{emp.position}</div>
                  </div>
                </div>
                <div className="w-2 h-2 shrink-0 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-900/50"></div>
              </div>
            )) : (
              <div className="p-6 text-center text-slate-500 text-xs flex flex-col items-center gap-2 mt-4">
                <Users className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                <span>No active team members</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/50">
            {activeEquipment.length > 0 ? activeEquipment.map((eq, index) => (
              <div key={eq.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-400 w-4 text-right shrink-0">{index + 1}.</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{eq.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{eq.location || 'Site'}</div>
                  </div>
                </div>
                <div className="text-[10px] shrink-0 font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded truncate max-w-[80px]">
                  {eq.type}
                </div>
              </div>
            )) : (
              <div className="p-6 text-center text-slate-500 text-xs flex flex-col items-center gap-2 mt-4">
                <Truck className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                <span>No active equipment</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reminders' && (
          <div className="flex flex-col h-full relative">
            {/* Bulk Actions Bar */}
            <div className="flex items-center justify-between p-2 px-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={allTodos.length > 0 && selectedTodos.size === allTodos.length}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedTodos(new Set(allTodos.map(r => r.id)));
                    else setSelectedTodos(new Set());
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {selectedTodos.size > 0 ? `${selectedTodos.size} selected` : 'Select All'}
                </span>
              </div>
              
              {selectedTodos.size > 0 ? (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleBulkComplete}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 px-2 py-1 rounded transition-colors"
                  >
                    Complete
                  </button>
                  <button 
                    onClick={handleBulkDelete}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-900/30 dark:hover:bg-red-900/50 px-2 py-1 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ) : (
                completedTodos.length > 0 && (
                  <button
                    onClick={handleClearCompleted}
                    className="text-xs font-semibold text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    Clear Completed
                  </button>
                )
              )}
            </div>

            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/50 pb-16">
              {allTodos.length > 0 ? allTodos.map((rem, index) => (
                <div key={rem.id} className={`p-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${rem.status === 'Completed' ? 'opacity-75' : ''}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedTodos.has(rem.id)}
                    onChange={(e) => {
                      const newSet = new Set(selectedTodos);
                      if (e.target.checked) newSet.add(rem.id);
                      else newSet.delete(rem.id);
                      setSelectedTodos(newSet);
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                  />
                  
                  <button 
                    onClick={() => toggleComplete(rem)}
                    className={`mt-0.5 shrink-0 transition-colors ${rem.status === 'Completed' ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600 hover:text-emerald-500'}`}
                    title={rem.status === 'Completed' ? "Mark as pending" : "Mark as completed"}
                  >
                    {rem.status === 'Completed' ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    {editingTodoId === rem.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          value={editingTodoTitle}
                          onChange={(e) => setEditingTodoTitle(e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-900 border border-emerald-500 rounded px-2 py-1 text-sm text-slate-800 dark:text-slate-200 focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(rem)}
                        />
                        <button onClick={() => handleSaveEdit(rem)} className="text-emerald-600 hover:text-emerald-700 p-1">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingTodoId(null)} className="text-slate-400 hover:text-slate-600 p-1">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className={`text-sm font-medium truncate pr-2 ${rem.status === 'Completed' ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                          {rem.title}
                        </div>
                        {rem.dueDate && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(rem.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {editingTodoId !== rem.id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button 
                        onClick={() => {
                          setEditingTodoId(rem.id);
                          setEditingTodoTitle(rem.title);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => deleteReminder(rem.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )) : (
                <div className="p-6 text-center text-slate-500 text-xs flex flex-col items-center gap-2 mt-4">
                  <CheckSquare className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                  <span>No to-dos found</span>
                </div>
              )}
            </div>
            
            {/* Floating Add Button / Form for To-Do */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-t border-slate-100 dark:border-slate-800">
              {isAddingTodo ? (
                <form onSubmit={handleAddTodo} className="flex gap-2">
                  <input 
                    type="text" 
                    value={newTodoTitle}
                    onChange={(e) => setNewTodoTitle(e.target.value)}
                    placeholder="New task..."
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500"
                    autoFocus
                  />
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-lg transition-colors shrink-0 flex items-center justify-center w-8">
                    <Check className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => setIsAddingTodo(false)} className="bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1.5 rounded-lg transition-colors shrink-0 flex items-center justify-center w-8">
                    <X className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <button 
                  onClick={() => setIsAddingTodo(true)}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 py-2 rounded-lg text-xs font-bold transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add To-Do
                </button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
