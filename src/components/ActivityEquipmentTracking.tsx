import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from './ui';
import { EquipmentLog, Equipment, EquipmentStatus, canUserEditSection, Activity } from '../types';
import { useAppContext } from '../context/AppContext';
import { Truck, Clock, Plus, Trash2, Edit3, ShieldCheck, Lock, CheckCircle2, Wrench, Fuel, User, Gauge } from 'lucide-react';

interface ActivityEquipmentTrackingProps {
  activityId: string;
  projectId: string;
  activity?: Activity;
}

export function ActivityEquipmentTracking({ activityId, projectId, activity }: ActivityEquipmentTrackingProps) {
  const { 
    equipmentLogs, 
    addEquipmentLog, 
    updateEquipmentLog, 
    deleteEquipmentLog, 
    equipment, 
    currentUserProfile,
    employees,
    currency
  } = useAppContext();

  const canEditEquipment = canUserEditSection(currentUserProfile, 'equipment');

  // Filter equipment logs for this activity
  const activityLogs = useMemo(() => 
    equipmentLogs.filter(l => l?.activityId === activityId && l?.type === 'Hours'),
  [equipmentLogs, activityId]);

  const [isAdding, setIsAdding] = useState(false);
  const [editingLog, setEditingLog] = useState<EquipmentLog | null>(null);

  const [formData, setFormData] = useState<{
    equipmentId: string;
    date: string;
    operator: string;
    startTime: string;
    endTime: string;
    hoursAdded: number;
    status: EquipmentStatus;
    fuelLevelAfter?: number;
    notes?: string;
  }>({
    equipmentId: activity?.assignedEquipment?.[0]?.equipmentId || '',
    date: new Date().toISOString().split('T')[0],
    operator: activity?.assignedEquipment?.[0]?.operator || '',
    startTime: '08:00',
    endTime: '16:00',
    hoursAdded: 8,
    status: 'Operating',
    notes: ''
  });

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
        newData.hoursAdded = calculateHours(newData.startTime, newData.endTime);
      }
      return newData;
    });
  };

  const handleSelectEquipment = (eqId: string) => {
    const eqObj = equipment.find(e => e.id === eqId);
    const assignedEq = activity?.assignedEquipment?.find(a => a.equipmentId === eqId);
    setFormData(prev => ({
      ...prev,
      equipmentId: eqId,
      operator: assignedEq?.operator || eqObj?.operator || prev.operator
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.equipmentId || !formData.date || formData.hoursAdded === undefined) return;

    const selectedEq = equipment.find(e => e.id === formData.equipmentId);
    const eqName = selectedEq ? selectedEq.name : (activity?.assignedEquipment?.find(a => a.equipmentId === formData.equipmentId)?.name || 'Equipment');

    if (editingLog) {
      if (!canEditEquipment) {
        alert('Permission Denied: Only Admin and permitted personnel can edit logged machine hours.');
        return;
      }
      updateEquipmentLog({
        ...editingLog,
        equipmentId: formData.equipmentId,
        date: formData.date,
        loggedBy: currentUserProfile?.name || 'Site Supervisor',
        hoursAdded: Number(formData.hoursAdded),
        hours: Number(formData.hoursAdded),
        startTime: formData.startTime,
        endTime: formData.endTime,
        driverOperator: formData.operator,
        operator: formData.operator,
        status: formData.status,
        setStatus: formData.status,
        fuelLevelAfter: formData.fuelLevelAfter,
        notes: formData.notes || `Hours logged for activity "${activity?.name || activityId}"`
      });
      setEditingLog(null);
    } else {
      addEquipmentLog({
        id: `EQL-${Date.now()}`,
        equipmentId: formData.equipmentId,
        activityId,
        activityName: activity?.name || 'Activity',
        projectId,
        type: 'Hours',
        date: formData.date,
        loggedBy: currentUserProfile?.name || 'Site Supervisor',
        hoursAdded: Number(formData.hoursAdded),
        hours: Number(formData.hoursAdded),
        startTime: formData.startTime,
        endTime: formData.endTime,
        driverOperator: formData.operator,
        operator: formData.operator,
        status: formData.status,
        setStatus: formData.status,
        fuelLevelAfter: formData.fuelLevelAfter,
        notes: formData.notes || `Operating hours for ${eqName} on task "${activity?.name || activityId}"`
      });
    }

    setIsAdding(false);
  };

  const handleQuickLogAssignedEquipment = (assignedEq: { equipmentId: string; name: string; operator?: string }) => {
    const defaultHours = 8;
    addEquipmentLog({
      id: `EQL-${Date.now()}`,
      equipmentId: assignedEq.equipmentId,
      activityId,
      activityName: activity?.name || 'Activity',
      projectId,
      type: 'Hours',
      date: new Date().toISOString().split('T')[0],
      loggedBy: currentUserProfile?.name || 'Site Supervisor',
      hoursAdded: defaultHours,
      hours: defaultHours,
      startTime: '08:00',
      endTime: '16:00',
      driverOperator: assignedEq.operator || 'Assigned Operator',
      operator: assignedEq.operator || 'Assigned Operator',
      status: 'Operating',
      setStatus: 'Operating',
      notes: `Standard shift log (8 hrs) for ${assignedEq.name}`
    });
  };

  const totalHours = activityLogs.reduce((sum, log) => sum + (log.hoursAdded || log.hours || 0), 0);
  const totalOperatingCost = activityLogs.reduce((sum, log) => sum + (log.calculatedOperatingCost || 0), 0);

  return (
    <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
          <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          Equipment & Machinery Hours Tracking
        </CardTitle>
        {!isAdding && (
          <Button 
            onClick={() => {
              setFormData({
                equipmentId: activity?.assignedEquipment?.[0]?.equipmentId || equipment[0]?.id || '',
                date: new Date().toISOString().split('T')[0],
                operator: activity?.assignedEquipment?.[0]?.operator || equipment[0]?.operator || '',
                startTime: '08:00',
                endTime: '16:00',
                hoursAdded: 8,
                status: 'Operating',
                notes: ''
              });
              setEditingLog(null);
              setIsAdding(true);
            }} 
            size="sm" 
            className="h-8 text-xs gap-1.5 bg-blue-50 hover:bg-blue-100 text-[#0B5FFF] dark:bg-blue-950/50 dark:hover:bg-blue-900/60 dark:text-blue-300 rounded-lg font-semibold"
          >
            <Plus className="h-3.5 w-3.5" /> Log Machine Hours
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Quick Log for Assigned Equipment */}
        {activity?.assignedEquipment && activity.assignedEquipment.length > 0 && !isAdding && (
          <div className="p-3 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-[#0B5FFF]" />
              Allocated Machinery Quick-Log:
            </span>
            <div className="flex flex-wrap gap-2">
              {activity.assignedEquipment.map(eqAssigned => {
                const isLoggedToday = activityLogs.some(l => 
                  l.equipmentId === eqAssigned.equipmentId && 
                  l.date === new Date().toISOString().split('T')[0]
                );

                return (
                  <div 
                    key={eqAssigned.id} 
                    className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 shadow-2xs text-xs"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                        {eqAssigned.name}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate">
                        {eqAssigned.operator || 'No Operator'}
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
                        onClick={() => handleQuickLogAssignedEquipment(eqAssigned)}
                        className="h-7 text-[10px] px-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md gap-1"
                      >
                        <Plus className="h-3 w-3" /> Log 8h
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add/Edit Log Form */}
        {isAdding && (
          <form onSubmit={handleSubmit} className="bg-blue-50/50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/40 mb-2 flex flex-col gap-4 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Equipment / Machinery</label>
                <select
                  value={formData.equipmentId}
                  onChange={(e) => handleSelectEquipment(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                  required
                >
                  <option value="">Select equipment...</option>
                  {activity?.assignedEquipment && activity.assignedEquipment.length > 0 && (
                    <optgroup label="Allocated to This Task">
                      {activity.assignedEquipment.map(a => (
                        <option key={`assigned-${a.id}`} value={a.equipmentId}>
                          ⭐ {a.name} ({a.operator || 'Assigned'})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="All Fleet Equipment">
                    {equipment.map(eq => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name} - {eq.category || eq.type} ({eq.status})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

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
                <label className="text-xs font-semibold text-slate-500 block mb-1">Operator / Driver</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe (or select employee)"
                  value={formData.operator}
                  onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                  list="employee-operator-list"
                />
                <datalist id="employee-operator-list">
                  {employees.map(emp => (
                    <option key={emp.id} value={`${emp.firstName} ${emp.lastName}`} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Machine Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as EquipmentStatus })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                >
                  <option value="Operating">Operating (Active Shift)</option>
                  <option value="Idle">Idle (Standby)</option>
                  <option value="Maintenance">Maintenance / Breakdown</option>
                  <option value="Out of Service">Out of Service</option>
                </select>
              </div>

              <div className="flex gap-2 sm:col-span-2">
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
                <div className="w-24">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={formData.hoursAdded}
                    onChange={(e) => setFormData({ ...formData, hoursAdded: Number(e.target.value) })}
                    className="w-full h-9 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-[#0B5FFF] focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-500 block mb-1">Notes / Operating Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Trenching line along chainage 0+200"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              {editingLog ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this equipment hours log?')) {
                      deleteEquipmentLog(editingLog.id);
                      setEditingLog(null);
                      setIsAdding(false);
                    }
                  }}
                  disabled={!canEditEquipment}
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
                <Button type="submit" size="sm" className="bg-[#0B5FFF] hover:bg-blue-600 text-white font-bold">
                  {editingLog ? 'Save Changes' : 'Save Machine Log'}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* History Header & Total Stats */}
        <div className="flex items-center justify-between px-1 mb-2 flex-wrap gap-2">
          <span className="text-xs font-bold text-slate-500">Machine Log History</span>
          <div className="flex items-center gap-2">
            {totalOperatingCost > 0 && (
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200">
                {currency || 'R'} {totalOperatingCost.toLocaleString()} Operating Cost
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] bg-slate-50 dark:bg-slate-800">
              <Clock className="w-3 h-3 mr-1 inline text-blue-600" /> {totalHours} Machine Hours
            </Badge>
          </div>
        </div>

        {/* Role Permission Status Banner */}
        <div className={`p-2.5 mb-2 rounded-lg border flex items-center justify-between gap-2 text-xs font-medium ${
          canEditEquipment 
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800/60 dark:text-emerald-300' 
            : 'bg-amber-50/70 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800/60 dark:text-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            {canEditEquipment ? (
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <span>
              <strong>Role Permission ({currentUserProfile?.role || 'Guest'}):</strong>{' '}
              {canEditEquipment ? 'Full edit & delete permissions' : 'Read-only mode'}
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            canEditEquipment ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
          }`}>
            {canEditEquipment ? 'Editable' : 'Locked'}
          </span>
        </div>

        {/* Equipment Log History List */}
        {activityLogs.length > 0 ? (
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
            {activityLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => {
              const eqObj = equipment.find(e => e.id === log.equipmentId);
              const eqName = eqObj ? eqObj.name : (activity?.assignedEquipment?.find(a => a.equipmentId === log.equipmentId)?.name || 'Equipment');

              return (
                <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-[#0B5FFF] flex items-center justify-center shrink-0">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {eqName}
                        </span>
                        {log.status && (
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            log.status === 'Operating' 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {log.status}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 font-medium">
                        <span>{new Date(log.date).toLocaleDateString()}</span>
                        {log.driverOperator || log.operator ? (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                            <span className="flex items-center gap-1">
                              <User className="h-2.5 w-2.5" />
                              {log.driverOperator || log.operator}
                            </span>
                          </>
                        ) : null}
                        {log.startTime && log.endTime && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                            <span>{log.startTime} - {log.endTime}</span>
                          </>
                        )}
                      </div>
                      {log.notes && (
                        <span className="text-[10px] text-slate-400 italic truncate max-w-xs mt-0.5">
                          "{log.notes}"
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-[#0B5FFF]">
                        {log.hoursAdded || log.hours || 0} hrs
                      </span>
                      {log.calculatedOperatingCost ? (
                        <span className="text-[10px] text-slate-500 font-medium">
                          {currency || 'R'} {log.calculatedOperatingCost.toLocaleString()}
                        </span>
                      ) : null}
                    </div>

                    {canEditEquipment ? (
                      <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
                        <button
                          onClick={() => {
                            setEditingLog(log);
                            setFormData({
                              equipmentId: log.equipmentId,
                              date: log.date,
                              operator: log.driverOperator || log.operator || '',
                              startTime: log.startTime || '08:00',
                              endTime: log.endTime || '16:00',
                              hoursAdded: log.hoursAdded || log.hours || 8,
                              status: log.status || 'Operating',
                              fuelLevelAfter: log.fuelLevelAfter,
                              notes: log.notes || ''
                            });
                            setIsAdding(true);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors"
                          title="Edit Equipment Hours"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this equipment hours log?')) {
                              deleteEquipmentLog(log.id);
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
              );
            })}
          </div>
        ) : (
          <div className="text-center p-6 text-sm text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            No equipment hours logged for this activity yet. Click "+ Log Machine Hours" or use the quick-log buttons above.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
