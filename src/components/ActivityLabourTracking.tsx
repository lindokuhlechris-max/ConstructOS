import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from './ui';
import { LabourLog } from '../types';
import { useAppContext } from '../context/AppContext';
import { Users, Clock, Plus, Trash2, User } from 'lucide-react';

interface ActivityLabourTrackingProps {
  activityId: string;
  projectId: string;
}

export function ActivityLabourTracking({ activityId, projectId }: ActivityLabourTrackingProps) {
  const { labourLogs, addLabourLog } = useAppContext();
  
  const activityLogs = useMemo(() => 
    labourLogs.filter(l => l.activityId === activityId),
  [labourLogs, activityId]);

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<LabourLog>>({
    date: new Date().toISOString().split('T')[0],
    workerType: 'General Laborer',
    workerName: '',
    startTime: '08:00',
    endTime: '16:00',
    hours: 8,
  });

  const workerTypes = ['General Laborer', 'Carpenter', 'Electrician', 'Plumber', 'Mason', 'Foreman', 'Engineer'];

  const calculateHours = (start: string, end: string) => {
    if (!start || !end) return 0;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let diff = (endH + endM / 60) - (startH + startM / 60);
    // basic lunch deduction logic could be added here, but keep it simple
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
    if (!formData.date || !formData.workerType || formData.hours === undefined) return;

    addLabourLog({
      id: `LAB-${Date.now()}`,
      projectId,
      activityId,
      date: formData.date,
      workerType: formData.workerType,
      workerName: formData.workerName,
      startTime: formData.startTime,
      endTime: formData.endTime,
      hours: formData.hours,
    });

    setIsAdding(false);
    setFormData(prev => ({ ...prev, workerName: '' })); // reset mostly just the name for consecutive adds
  };

  const totalHours = activityLogs.reduce((sum, log) => sum + log.hours, 0);

  return (
    <Card className="rounded-2xl border border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
          <Users className="h-4 w-4 text-[#0B5FFF]" />
          Team & Labour Tracking
        </CardTitle>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm" className="h-8 text-xs gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg">
            <Plus className="h-3.5 w-3.5" /> Log Time
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="flex flex-col gap-4">
        {isAdding && (
          <form onSubmit={handleSubmit} className="bg-blue-50/50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/40 mb-2 flex flex-col gap-4">
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
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={formData.workerName}
                  onChange={(e) => setFormData({ ...formData, workerName: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                />
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
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button type="submit" size="sm" className="bg-[#0B5FFF]">Save Log</Button>
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
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-[#0B5FFF]">{log.hours} hrs</span>
                  </div>
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
