import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from './ui';
import { LabourLog, Activity, canUserEditSection } from '../types';
import { useAppContext } from '../context/AppContext';
import { Users, Clock, Plus, Edit3, Trash2, ShieldCheck, CheckCircle2, Lock, X } from 'lucide-react';

interface LabourTrackingProps {
  projectId: string;
}

export function LabourTracking({ projectId }: LabourTrackingProps) {
  const { activities, labourLogs, addLabourLog, updateLabourLog, deleteLabourLog, currentUserProfile, employees } = useAppContext();
  
  const canEditLabour = canUserEditSection(currentUserProfile, 'labour');

  const projectActivities = useMemo(() => 
    activities.filter(a => a.projectId === projectId),
  [activities, projectId]);

  const projectLogs = useMemo(() => 
    labourLogs.filter(l => l.projectId === projectId),
  [labourLogs, projectId]);

  const [isAdding, setIsAdding] = useState(false);
  const [editingLog, setEditingLog] = useState<LabourLog | null>(null);

  const [formData, setFormData] = useState<Partial<LabourLog>>({
    date: new Date().toISOString().split('T')[0],
    activityId: projectActivities[0]?.id || '',
    workerType: 'General Laborer',
    workerName: '',
    startTime: '08:00',
    endTime: '16:00',
    hours: 8,
  });

  const workerTypes = Array.from(new Set([
    'General Laborer', 'Carpenter', 'Electrician', 'Plumber', 'Mason', 'Foreman', 'Engineer',
    ...employees.map(e => e.position).filter(Boolean)
  ]));

  const calculateHours = (start: string, end: string) => {
    if (!start || !end) return 0;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let diff = (endH + endM / 60) - (startH + startM / 60);
    if (diff < 0) diff += 24;
    return Math.round(diff * 10) / 10;
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (newData.startTime && newData.endTime) {
        newData.hours = calculateHours(newData.startTime, newData.endTime);
      }
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData?.activityId || !formData.date || !formData.workerType || formData.hours === undefined) return;

    if (editingLog) {
      if (!canEditLabour) {
        alert('Permission Denied: Only Admin and permitted users can edit logged hours.');
        return;
      }
      updateLabourLog({
        ...editingLog,
        date: formData.date || editingLog.date,
        activityId: formData?.activityId || editingLog?.activityId,
        workerType: formData.workerType || editingLog.workerType,
        workerName: formData.workerName,
        startTime: formData.startTime,
        endTime: formData.endTime,
        hours: Number(formData.hours),
        hoursWorked: Number(formData.hours)
      });
      setEditingLog(null);
    } else {
      addLabourLog({
        id: `LAB-${Date.now()}`,
        projectId,
        activityId: formData?.activityId,
        date: formData.date || new Date().toISOString().split('T')[0],
        workerType: formData.workerType || 'General Laborer',
        workerName: formData.workerName,
        startTime: formData.startTime,
        endTime: formData.endTime,
        hours: Number(formData.hours),
        hoursWorked: Number(formData.hours)
      });
    }

    setIsAdding(false);
    setFormData(prev => ({ ...prev, workerName: '' }));
  };

  const groupedByDate = useMemo(() => {
    const grouped = projectLogs.reduce((acc, log) => {
      if (!acc[log.date]) acc[log.date] = [];
      acc[log.date].push(log);
      return acc;
    }, {} as Record<string, LabourLog[]>);

    return Object.entries(grouped)
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [projectLogs]);

  return (
    <Card className="flex flex-col h-full border border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#0B5FFF]" />
            Labour Tracking
          </CardTitle>
          <p className="text-xs text-slate-500 mt-1">Assign and track labour hours per activity</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm" className="gap-2 bg-[#0B5FFF]">
            <Plus className="h-4 w-4" /> Log Hours
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="flex flex-col gap-4">
        {isAdding && (
          <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 mb-4 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF] focus:border-[#0B5FFF]"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Activity</label>
                <select
                  value={formData?.activityId}
                  onChange={(e) => setFormData({ ...formData, activityId: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF] focus:border-[#0B5FFF]"
                  required
                >
                  <option value="">Select Activity</option>
                  {projectActivities.map(a => (
                    <option key={a.id} value={a.id}>{a.id} - {a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Worker Name (Optional)</label>
                <select
                  value={formData.workerName || ''}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    const employee = employees.find(emp => `${emp.firstName} ${emp.lastName}` === selectedName);
                    
                    setFormData({ 
                      ...formData, 
                      workerName: selectedName,
                      workerType: employee?.position || formData.workerType
                    });
                  }}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF] focus:border-[#0B5FFF]"
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
                <label className="text-xs font-semibold text-slate-500 block mb-1">Trade / Role</label>
                <select
                  value={formData.workerType}
                  onChange={(e) => setFormData({ ...formData, workerType: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF] focus:border-[#0B5FFF]"
                  required
                >
                  {workerTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleTimeChange('startTime', e.target.value)}
                    className="w-full h-9 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleTimeChange('endTime', e.target.value)}
                    className="w-full h-9 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                    required
                  />
                </div>
                <div className="w-24">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: Number(e.target.value) })}
                    className="w-full h-9 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
              {editingLog ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this logged hours record?')) {
                      deleteLabourLog(editingLog.id);
                      setEditingLog(null);
                      setIsAdding(false);
                    }
                  }}
                  disabled={!canEditLabour}
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Log
                </Button>
              ) : <div />}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingLog(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-[#0B5FFF]">
                  {editingLog ? 'Save Changes' : 'Save Log'}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Role Permission Status Banner */}
        <div className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs font-medium ${
          canEditLabour 
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800/60 dark:text-emerald-300' 
            : 'bg-amber-50/70 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800/60 dark:text-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            {canEditLabour ? (
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <span>
              <strong>Role Permission ({currentUserProfile?.role || 'Guest'}):</strong>{' '}
              {canEditLabour ? 'Edit and Delete enabled' : 'Read-only access'}
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            canEditLabour ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
          }`}>
            {canEditLabour ? 'Editable' : 'Locked'}
          </span>
        </div>

        <div className="overflow-x-auto">
          {groupedByDate.length > 0 ? (
            <div className="flex flex-col gap-6">
              {groupedByDate.map(([date, logs]) => {
                const totalHours = logs.reduce((sum, l) => sum + l.hours, 0);
                
                return (
                  <div key={date} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                      <span className="font-semibold text-sm">{new Date(date).toLocaleDateString()}</span>
                      <span className="text-xs font-medium bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {totalHours} Total Hrs
                      </span>
                    </div>
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="text-xs text-slate-500 border-b border-slate-200 dark:border-slate-800">
                          <th className="py-2 font-medium">Activity</th>
                          <th className="py-2 font-medium">Worker Type</th>
                          <th className="py-2 font-medium text-right">Hours</th>
                          <th className="py-2 font-medium text-right pr-2">
                            <span className="flex items-center justify-end gap-1">
                              Actions
                              {canEditLabour ? (
                                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Lock className="h-3 w-3 text-amber-500" />
                              )}
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map(log => {
                          const activity = projectActivities.find(a => a.id === log?.activityId);
                          return (
                            <tr key={log.id} className="border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="py-2">
                                <div className="font-medium text-slate-900 dark:text-slate-100">{activity?.name || log?.activityId}</div>
                                <div className="text-[10px] text-slate-500">{log?.activityId}</div>
                              </td>
                              <td className="py-2 text-slate-700 dark:text-slate-300">
                                <div className="font-medium">{log.workerName || 'Team Member'}</div>
                                <div className="text-[10px] text-slate-500">{log.workerType}</div>
                              </td>
                              <td className="py-2 text-right">
                                <div className="font-medium">{log.hours}</div>
                                {log.startTime && log.endTime && (
                                  <div className="text-[10px] text-slate-500">{log.startTime} - {log.endTime}</div>
                                )}
                              </td>
                              <td className="py-2 text-right pr-2">
                                {canEditLabour ? (
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => {
                                        setEditingLog(log);
                                        setFormData({
                                          date: log.date,
                                          activityId: log?.activityId,
                                          workerType: log.workerType || log.trade || 'General Laborer',
                                          workerName: log.workerName || '',
                                          startTime: log.startTime || '08:00',
                                          endTime: log.endTime || '16:00',
                                          hours: log.hours || log.hoursWorked || 8
                                        });
                                        setIsAdding(true);
                                      }}
                                      className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors"
                                      title="Edit Hours"
                                    >
                                      <Edit3 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this logged hours record?')) {
                                          deleteLabourLog(log.id);
                                        }
                                      }}
                                      className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                                      title="Delete Hours"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md" title="Role restricted">
                                    <Lock className="h-3 w-3 text-amber-600" /> Locked
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-8 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-sm">
              No labour hours logged for this project yet.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
