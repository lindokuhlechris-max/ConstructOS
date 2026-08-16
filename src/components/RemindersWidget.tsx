import React from 'react';
import { Bell, Clock, User, Truck, ClipboardList } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function RemindersWidget({ moduleName }: { moduleName: string }) {
  const { reminders, employees, equipment, activities } = useAppContext();
  
  const activeReminders = reminders.filter(r => 
    r.status !== 'Completed' && r.linkedModules.includes(moduleName)
  );

  if (activeReminders.length === 0) return null;

  return (
    <div className="mb-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300">Active Reminders for {moduleName}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {activeReminders.map(reminder => {
          const linkedEmp = employees.find(e => e.id === reminder.linkedEmployeeId);
          const linkedEq = equipment.find(eq => eq.id === reminder.linkedEquipmentId);
          const linkedAct = activities.find(a => a.id === reminder.linkedActivityId);

          return (
            <div key={reminder.id} className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-blue-100 dark:border-blue-900 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm text-slate-900 dark:text-slate-100">{reminder.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    reminder.priority === 'Critical' || reminder.priority === 'High' ? 'bg-red-100 text-red-700' :
                    reminder.priority === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {reminder.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mb-2">{reminder.description}</p>
                
                {/* Linked Specific Entity Tags */}
                {(linkedEmp || linkedEq || linkedAct) && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {linkedEmp && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded font-medium">
                        <User className="h-2.5 w-2.5" /> {linkedEmp.firstName} {linkedEmp.lastName}
                      </span>
                    )}
                    {linkedEq && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded font-medium">
                        <Truck className="h-2.5 w-2.5" /> {linkedEq.name}
                      </span>
                    )}
                    {linkedAct && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded font-medium">
                        <ClipboardList className="h-2.5 w-2.5" /> {linkedAct.name}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Due {new Date(reminder.dueDate).toLocaleDateString()} {reminder.dueTime ? `at ${reminder.dueTime}` : ''}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
