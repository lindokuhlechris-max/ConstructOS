import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from './ui';
import { LabourAllocation, canManage } from '../types';
import { useAppContext } from '../context/AppContext';
import { Calendar, Plus, User, Briefcase, CalendarDays, Edit, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export function LabourAllocationView({ projectId }: { projectId: string }) {
  const { labourAllocations, activities, employees, addLabourAllocation, updateLabourAllocation, deleteLabourAllocation, userRole, updateActivity, hasPermission } = useAppContext();
  const canEditLabour = hasPermission('labour');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const projectAllocations = labourAllocations.filter(a => a?.projectId === projectId);
  const projectActivities = activities.filter(a => a?.projectId === projectId);

  const [formData, setFormData] = useState<Partial<LabourAllocation>>({
    workerName: '',
    workerRole: '',
    activityId: '',
    hours: 8,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: 'Scheduled',
    notes: ''
  });

  const handleEdit = (allocation: LabourAllocation) => {
    setFormData(allocation);
    setEditingId(allocation.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this allocation?')) {
      deleteLabourAllocation(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedEmployee = employees.find(emp => `${emp.firstName} ${emp.lastName}` === formData.workerName);
    const employeeId = matchedEmployee?.id || formData.employeeId;

    if (editingId) {
      const updated = {
        ...formData,
        employeeId
      } as LabourAllocation;
      updateLabourAllocation(updated);
    } else {
      const newLabour: LabourAllocation = {
        ...formData,
        id: `LA-${Math.random().toString(36).substr(2, 9)}`,
        projectId,
        employeeId,
        hours: formData.hours || 8
      } as LabourAllocation;

      addLabourAllocation(newLabour);

      // Sync to activity if selected
      if (formData?.activityId) {
        const targetAct = activities.find(a => a?.id === formData?.activityId);
        if (targetAct) {
          const updatedLabour = [
            {
              id: `TLA-${newLabour.id}`,
              employeeId: employeeId || `EMP-${Date.now()}`,
              name: formData.workerName || 'Worker',
              role: formData.workerRole || 'Personnel',
              hours: formData.hours || 8,
              startDate: formData.startDate || new Date().toISOString().split('T')[0],
              endDate: formData.endDate,
              notes: formData.notes
            },
            ...(targetAct.assignedLabour || [])
          ];
          updateActivity({ ...targetAct, assignedLabour: updatedLabour });
        }
      }
    }
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      workerName: '',
      workerRole: '',
      activityId: '',
      hours: 8,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      status: 'Scheduled',
      notes: ''
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
            <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <CardTitle>Labour Allocation</CardTitle>
            <p className="text-sm text-slate-500">Assign workers to specific tasks</p>
          </div>
        </div>
        {canEditLabour && !isAdding && (
          <Button onClick={() => setIsAdding(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Assign Worker
          </Button>
        )}
      </CardHeader>
      
      <CardContent>
        {isAdding ? (
          <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4 mb-6">
            <h4 className="font-semibold">{editingId ? 'Edit Assignment' : 'New Assignment'}</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Worker Name *</label>
                <select
                  required
                  value={formData.workerName}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    const employee = employees.find(emp => `${emp.firstName} ${emp.lastName}` === selectedName);
                    
                    setFormData({ 
                      ...formData, 
                      workerName: selectedName,
                      workerRole: employee?.position || formData.workerRole
                    });
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="">Select an employee...</option>
                  {employees.filter(emp => emp.status !== 'Terminated').map(emp => (
                    <option key={emp.id} value={`${emp.firstName} ${emp.lastName}`}>
                      {emp.firstName} {emp.lastName} {emp.position ? `- ${emp.position}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Role / Trade *</label>
                <input
                  required
                  type="text"
                  value={formData.workerRole}
                  onChange={(e) => setFormData({ ...formData, workerRole: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  placeholder="e.g. Electrician"
                />
              </div>
              
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Assign to Task *</label>
                <select
                  required
                  value={formData?.activityId}
                  onChange={(e) => setFormData({ ...formData, activityId: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="">Select Activity</option>
                  {projectActivities.map(act => (
                    <option key={act.id} value={act.id}>{act.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Start Date *</label>
                <input
                  required
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">End Date *</label>
                <input
                  required
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Hours / Shift</label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={formData.hours || 8}
                  onChange={(e) => setFormData({ ...formData, hours: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  placeholder="8"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-500 block mb-1">Notes (Optional)</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  rows={2}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                {editingId ? 'Update Assignment' : 'Assign Worker'}
              </Button>
            </div>
          </form>
        ) : null}

        <div className="space-y-4">
          {projectAllocations.length === 0 && !isAdding ? (
            <div className="text-center py-8 text-slate-500">
              <User className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No workers assigned yet.</p>
            </div>
          ) : (
            projectAllocations.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(allocation => {
              const activity = activities.find(a => a?.id === allocation?.activityId);
              
              return (
                <div key={allocation.id} className="flex flex-col md:flex-row justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 gap-4">
                  <div className="flex gap-4 items-start">
                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-1">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {allocation.workerName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-50">{allocation.workerName}</h4>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                        <Briefcase className="h-3 w-3" /> {allocation.workerRole}
                      </p>
                      {activity && (
                        <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                          Task: {activity.name}
                        </p>
                      )}
                      {allocation.notes && (
                        <p className="text-xs text-slate-500 mt-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
                          {allocation.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:items-end justify-between gap-3">
                    <Badge className={
                      allocation.status === 'Active' ? 'bg-green-100 text-green-700' :
                      allocation.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                      allocation.status === 'Completed' ? 'bg-slate-100 text-slate-700' :
                      'bg-red-100 text-red-700'
                    }>
                      {allocation.status}
                    </Badge>
                    
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {format(parseISO(allocation.startDate), 'MMM d')} - {format(parseISO(allocation.endDate), 'MMM d, yyyy')}
                    </div>
                    
                    {canEditLabour && (
                      <div className="flex items-center gap-2 mt-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(allocation)} className="h-8 text-slate-500 hover:text-indigo-600">
                          <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(allocation.id)} className="h-8 text-slate-500 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
