import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from './ui';
import { LabourLog, canUserEditSection, Activity } from '../types';
import { useAppContext } from '../context/AppContext';
import { Users, Clock, Plus, Trash2, Edit3, User, ShieldCheck, Lock, CheckCircle2, HardHat } from 'lucide-react';

interface ActivityLabourTrackingProps {
  activityId: string;
  projectId: string;
  activity?: Activity;
}

export function ActivityLabourTracking({ activityId, projectId, activity }: ActivityLabourTrackingProps) {
  const { labourLogs, addLabourLog, updateLabourLog, deleteLabourLog, currentUserProfile, employees } = useAppContext();
  
  const canEditLabour = canUserEditSection(currentUserProfile, 'labour');

  const activityLogs = useMemo(() => 
    labourLogs.filter(l => l?.activityId === activityId),
  [labourLogs, activityId]);

  const [isAdding, setIsAdding] = useState(false);
  const [editingLog, setEditingLog] = useState<LabourLog | null>(null);

  const [formData, setFormData] = useState<Partial<LabourLog>>({
    date: new Date().toISOString().split('T')[0],
    workerType: 'General Laborer',
    workerName: '',
    startTime: '08:00',
    endTime: '16:00',
    hours: 8,
  });

  const workerTypes = ['General Laborer', 'Carpenter', 'Electrician', 'Plumber', 'Mason', 'Foreman', 'Engineer', 'Surveyor', 'Construction Manager', 'Operator', 'Safety Officer'];

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

  const handleQuickLogAssignedLabour = (assignedPerson: { name: string; role?: string; hours?: number }) => {
    const defaultHours = assignedPerson.hours || 8;
    addLabourLog({
      id: `LAB-${Date.now()}`,
      projectId,
      activityId,
      date: new Date().toISOString().split('T')[0],
      workerType: assignedPerson.role || 'General Laborer',
      workerName: assignedPerson.name,
      startTime: '08:00',
      endTime: '16:00',
      hours: defaultHours,
      hoursWorked: defaultHours,
      notes: `Standard shift log (${defaultHours}h) for ${assignedPerson.name}`
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.workerType || formData.hours === undefined) return;

    if (editingLog) {
      if (!canEditLabour) {
        alert('Permission Denied: Only Admin and permitted personnel can edit logged hours.');
        return;
      }
      updateLabourLog({
        ...editingLog,
        date: formData.date || editingLog.date,
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
        activityId,
        date: formData.date,
        workerType: formData.workerType,
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

  const totalHours = activityLogs.reduce((sum, log) => sum + log.hours, 0);

  return (
    <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
          <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Team & Labour Tracking
        </CardTitle>
        {!isAdding && (
          <Button 
            onClick={() => {
              setFormData({
                date: new Date().toISOString().split('T')[0],
                workerType: activity?.assignedLabour?.[0]?.role || 'General Laborer',
                workerName: activity?.assignedLabour?.[0]?.name || '',
                startTime: '08:00',
                endTime: '16:00',
                hours: activity?.assignedLabour?.[0]?.hours || 8,
              });
              setEditingLog(null);
              setIsAdding(true);
            }} 
            size="sm" 
            className="h-8 text-xs gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-300 rounded-lg font-semibold"
          >
            <Plus className="h-3.5 w-3.5" /> Log Time
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="flex flex-col gap-4">
        {/* Allocated Personnel Quick-Log Strip */}
        {activity?.assignedLabour && activity.assignedLabour.length > 0 && !isAdding && (
          <div className="p-3 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <HardHat className="h-3.5 w-3.5 text-emerald-600" />
              Allocated Personnel Quick-Log:
            </span>
            <div className="flex flex-wrap gap-2">
              {activity.assignedLabour.map(labAssigned => {
                const isLoggedToday = activityLogs.some(l => 
                  l.workerName?.toLowerCase() === labAssigned.name.toLowerCase() && 
                  l.date === new Date().toISOString().split('T')[0]
                );

                return (
                  <div 
                    key={labAssigned.id} 
                    className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 shadow-2xs text-xs"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {labAssigned.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                        {labAssigned.name}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate">
                        {labAssigned.role} ({labAssigned.hours || 8}h/shift)
                      </span>
                    </div>

                    {isLoggedToday ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="h-3 w-3" /> Logged Today
                      </span>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickLogAssignedLabour(labAssigned)}
                        className="h-7 text-[10px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md gap-1"
                      >
                        <Plus className="h-3 w-3" /> Log {labAssigned.hours || 8}h
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isAdding && (
          <form onSubmit={handleSubmit} className="bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/40 mb-2 flex flex-col gap-4 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                  required
                />
              </div>
              
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Worker Name (Optional)</label>
                <select
                  value={formData.workerName || ''}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    const employee = employees.find(emp => `${emp.firstName} ${emp.lastName}` === selectedName);
                    const assignedLabourItem = activity?.assignedLabour?.find(l => l.name === selectedName);
                    
                    setFormData({ 
                      ...formData, 
                      workerName: selectedName,
                      workerType: assignedLabourItem?.role || employee?.position || formData.workerType,
                      hours: assignedLabourItem?.hours || formData.hours || 8
                    });
                  }}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                >
                  <option value="">Select an employee...</option>
                  {activity?.assignedLabour && activity.assignedLabour.length > 0 && (
                    <optgroup label="Allocated to This Task">
                      {activity.assignedLabour.map(lab => (
                        <option key={`assigned-lab-${lab.id}`} value={lab.name}>
                          ⭐ {lab.name} - {lab.role} ({lab.hours || 8} hrs/shift)
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="All Site Employees">
                    {employees.filter(emp => emp.status !== 'Terminated').map(emp => (
                      <option key={emp.id} value={`${emp.firstName} ${emp.lastName}`}>
                        {emp.firstName} {emp.lastName} {emp.position ? `- ${emp.position}` : ''}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Trade / Role</label>
                <select
                  value={formData.workerType}
                  onChange={(e) => setFormData({ ...formData, workerType: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                  required
                >
                  {workerTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleTimeChange('startTime', e.target.value)}
                    className="w-full h-9 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleTimeChange('endTime', e.target.value)}
                    className="w-full h-9 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                    required
                  />
                </div>
                <div className="w-16">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: Number(e.target.value) })}
                    className="w-full h-9 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2">
              {editingLog ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this hours log?')) {
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

        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-xs font-bold text-slate-500">Log History</span>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px] bg-slate-50 dark:bg-slate-800">
              <Clock className="w-3 h-3 mr-1 inline" /> {totalHours} Total Hours
            </Badge>
          </div>
        </div>

        {/* Role Permission Status Banner */}
        <div className={`p-2.5 mb-3 rounded-lg border flex items-center justify-between gap-2 text-xs font-medium ${
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
              {canEditLabour ? 'Full edit & delete permissions' : 'Read-only mode'}
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            canEditLabour ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
          }`}>
            {canEditLabour ? 'Editable' : 'Locked'}
          </span>
        </div>

        {activityLogs.length > 0 ? (
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
            {activityLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
              <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-[#0B5FFF] shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {log.workerName || 'Unknown Team Member'} <span className="text-xs font-normal text-slate-500 ml-1">({log.workerType})</span>
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 font-medium">
                      <span>{new Date(log.date).toLocaleDateString()}</span>
                      {log.startTime && log.endTime && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                          <span>{log.startTime} - {log.endTime}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-[#0B5FFF]">{log.hours} hrs</span>
                  </div>
                  {canEditLabour ? (
                    <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
                      <button
                        onClick={() => {
                          setEditingLog(log);
                          setFormData({
                            date: log.date,
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
                          if (window.confirm('Are you sure you want to delete this hours log?')) {
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
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-6 text-sm text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            No labour hours logged for this activity yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
