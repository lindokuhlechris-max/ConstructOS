import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, ProgressBar, CustomSelect } from '../components/ui';
import { 
  Truck, Plus, Wrench, ArrowLeft, Fuel, CheckCircle2, LayoutGrid, List, Search, 
  MapPin, Calendar, Clock, AlertCircle, FileText, X, Edit3, Trash2, 
  ClipboardList, Activity as ActivityIcon, ShieldAlert
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Equipment as EquipmentType, EquipmentLog, EquipmentStatus, EquipmentLogType } from '../types';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

export function Equipment() {
  const { equipment, equipmentLogs, addEquipment, updateEquipment, deleteEquipment, addEquipmentLog } = useAppContext();

  const [filter, setFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedEqId, setSelectedEqId] = useState<string | null>(null);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEq, setEditingEq] = useState<EquipmentType | null>(null);
  const [deletingEqId, setDeletingEqId] = useState<string | null>(null);
  const [logModalEq, setLogModalEq] = useState<EquipmentType | null>(null);
  const [logTab, setLogTab] = useState<EquipmentLogType>('Hours');

  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Form State
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('Earthmoving');
  const [formOperator, setFormOperator] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formEngineHours, setFormEngineHours] = useState(0);
  const [formStatus, setFormStatus] = useState<EquipmentStatus>('Operating');
  const [formFuelLevel, setFormFuelLevel] = useState(100);
  const [formLastService, setFormLastService] = useState(new Date().toISOString().split('T')[0]);

  // Log Form State
  const [logStartTime, setLogStartTime] = useState('07:00');
  const [logEndTime, setLogEndTime] = useState('15:00');
  const [logHoursAdded, setLogHoursAdded] = useState(8);
  const [logFuelLitres, setLogFuelLitres] = useState(100);
  const [logFuelLevelAfter, setLogFuelLevelAfter] = useState(100);
  const [logMaintenanceType, setLogMaintenanceType] = useState('Routine Service');
  const [logCost, setLogCost] = useState<number | ''>('');
  const [logLoggedBy, setLogLoggedBy] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [logSetStatus, setLogSetStatus] = useState<EquipmentStatus | ''>('');
  const [isManualHoursOverride, setIsManualHoursOverride] = useState(false);

  const calculateHoursFromTimes = (start: string, end: string) => {
    if (!start || !end) return 0;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let diff = (endH + endM / 60) - (startH + startM / 60);
    if (diff < 0) diff += 24;
    return Math.round(diff * 10) / 10;
  };

  const handleStartTimeChange = (time: string) => {
    setLogStartTime(time);
    if (!isManualHoursOverride) {
      const calc = calculateHoursFromTimes(time, logEndTime);
      setLogHoursAdded(calc);
    }
  };

  const handleEndTimeChange = (time: string) => {
    setLogEndTime(time);
    if (!isManualHoursOverride) {
      const calc = calculateHoursFromTimes(logStartTime, time);
      setLogHoursAdded(calc);
    }
  };

  const currentEq = equipment.find(e => e.id === selectedEqId) || null;

  const filteredEquipment = equipment.filter(eq => {
    const matchesFilter = filter === 'All' || eq.status === filter;
    const matchesSearch = 
      eq.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      eq.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const openAddModal = () => {
    const nextIdNum = Math.max(...equipment.map(e => parseInt(e.id.replace(/\D/g, '')) || 100), 100) + 1;
    setFormId(`EQ-${nextIdNum}`);
    setFormName('');
    setFormType('Earthmoving');
    setFormOperator('');
    setFormLocation('Zone A');
    setFormEngineHours(0);
    setFormStatus('Operating');
    setFormFuelLevel(100);
    setFormLastService(new Date().toISOString().split('T')[0]);
    setIsAddModalOpen(true);
  };

  const openEditModal = (eq: EquipmentType, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingEq(eq);
    setFormId(eq.id);
    setFormName(eq.name);
    setFormType(eq.type || 'Earthmoving');
    setFormOperator(eq.operator || '');
    setFormLocation(eq.location || '');
    setFormEngineHours(typeof eq.engineHours === 'number' ? eq.engineHours : parseInt(String(eq.engineHours)) || 0);
    setFormStatus(eq.status);
    setFormFuelLevel(eq.fuelLevel ?? 100);
    setFormLastService(eq.lastService || new Date().toISOString().split('T')[0]);
  };

  const openLogModal = (eq: EquipmentType, defaultTab: EquipmentLogType = 'Hours', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLogModalEq(eq);
    setLogTab(defaultTab);
    setLogStartTime('07:00');
    setLogEndTime('15:00');
    setLogHoursAdded(8);
    setLogFuelLitres(150);
    setLogFuelLevelAfter(Math.min(100, (eq.fuelLevel || 50) + 30));
    setLogMaintenanceType('Routine Service');
    setLogCost('');
    setLogLoggedBy(eq.operator !== 'Unassigned' ? eq.operator : 'Site Tech');
    setLogNotes('');
    setLogSetStatus(eq.status);
    setIsManualHoursOverride(false);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    const newEq: EquipmentType = {
      id: formId || `EQ-${Math.floor(100 + Math.random() * 900)}`,
      name: formName,
      type: formType,
      category: formType,
      operator: formOperator || 'Unassigned',
      location: formLocation || 'Site Yard',
      engineHours: Number(formEngineHours) || 0,
      status: formStatus,
      fuelLevel: Number(formFuelLevel),
      fuelColor: formFuelLevel < 25 ? 'bg-red-500' : formFuelLevel < 50 ? 'bg-amber-500' : 'bg-emerald-500',
      lastService: formLastService,
    };

    addEquipment(newEq);
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEq || !formName) return;

    const updatedEq: EquipmentType = {
      ...editingEq,
      name: formName,
      type: formType,
      category: formType,
      operator: formOperator || 'Unassigned',
      location: formLocation || 'Site Yard',
      engineHours: Number(formEngineHours) || 0,
      status: formStatus,
      fuelLevel: Number(formFuelLevel),
      fuelColor: formFuelLevel < 25 ? 'bg-red-500' : formFuelLevel < 50 ? 'bg-amber-500' : 'bg-emerald-500',
      lastService: formLastService,
    };

    updateEquipment(updatedEq);
    setEditingEq(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingEqId) return;
    deleteEquipment(deletingEqId);
    if (selectedEqId === deletingEqId) {
      setSelectedEqId(null);
    }
    setDeletingEqId(null);
  };

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logModalEq) return;

    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`;

    const newLog: EquipmentLog = {
      id: `EQL-${Math.floor(1000 + Math.random() * 9000)}`,
      equipmentId: logModalEq.id,
      type: logTab,
      date: formattedDate,
      loggedBy: logLoggedBy || 'Site Operator',
      notes: logNotes,
    };

    if (logTab === 'Hours') {
      newLog.hoursAdded = Number(logHoursAdded);
      newLog.totalHours = (typeof logModalEq.engineHours === 'number' ? logModalEq.engineHours : parseInt(String(logModalEq.engineHours)) || 0) + Number(logHoursAdded);
      if (!newLog.notes) newLog.notes = `Logged ${logHoursAdded} operating hours (${logStartTime} - ${logEndTime})`;
    } else if (logTab === 'Refuel') {
      newLog.fuelLitres = Number(logFuelLitres);
      newLog.fuelLevelAfter = Number(logFuelLevelAfter);
      if (logCost) newLog.cost = Number(logCost);
      if (!newLog.notes) newLog.notes = `Refueled ${logFuelLitres}L (Fuel level now ${logFuelLevelAfter}%)`;
    } else if (logTab === 'Maintenance') {
      newLog.maintenanceType = logMaintenanceType;
      newLog.setStatus = (logSetStatus as EquipmentStatus) || logModalEq.status;
      if (logCost) newLog.cost = Number(logCost);
      if (!newLog.notes) newLog.notes = `${logMaintenanceType} completed`;
    }

    addEquipmentLog(newLog);
    setLogModalEq(null);
  };

  const activeUnitsCount = equipment.filter(e => e.status === 'Operating').length;
  const maintenanceCount = equipment.filter(e => e.status === 'Maintenance').length;
  const idleCount = equipment.filter(e => e.status === 'Idle').length;
  const avgFuel = equipment.length > 0 ? Math.round(equipment.reduce((acc, e) => acc + (e.fuelLevel ?? 50), 0) / equipment.length) : 0;

  const handleQuickStatusChange = (eq: EquipmentType, newStatus: EquipmentStatus, e?: React.ChangeEvent<HTMLSelectElement> | React.MouseEvent) => {
    if (e) e.stopPropagation();
    updateEquipment({
      ...eq,
      status: newStatus
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full space-y-8 bg-slate-50 dark:bg-[#0F172A] min-h-full text-slate-900 dark:text-slate-200 relative transition-colors">
      {/* RENDER EQUIPMENT DETAILS OR OVERVIEW GRID */}
      {currentEq ? (
        /* DETAIL VIEW */
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setSelectedEqId(null)} className="rounded-xl h-10 w-10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-800">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm font-mono text-slate-500 dark:text-slate-400">{currentEq.id}</span>
                  <select
                    value={currentEq.status}
                    onChange={(e) => handleQuickStatusChange(currentEq, e.target.value as EquipmentStatus, e)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer border focus:outline-none transition-all shadow-sm ${
                      currentEq.status === 'Operating' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' :
                      currentEq.status === 'Maintenance' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30 hover:bg-orange-500/20' :
                      currentEq.status === 'Idle' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20' :
                      'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                    }`}
                  >
                    <option value="Operating" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Operating</option>
                    <option value="Idle" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Idle</option>
                    <option value="Maintenance" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Maintenance</option>
                    <option value="Out of Service" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Out of Service</option>
                  </select>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{currentEq.name}</h1>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={(e) => openLogModal(currentEq, 'Hours', e)} className="bg-[#0B5FFF] hover:bg-blue-600 text-white gap-2 rounded-xl shadow-sm border-0 font-medium px-4">
                <ClipboardList className="h-4 w-4" /> Log Activity
              </Button>
              <Button onClick={(e) => openLogModal(currentEq, 'Maintenance', e)} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-400 gap-2 rounded-xl border border-slate-200 dark:border-slate-700 font-medium px-3">
                <Wrench className="h-4 w-4" /> Service / Repair
              </Button>
              <Button onClick={(e) => openEditModal(currentEq, e)} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 gap-2 rounded-xl border border-slate-200 dark:border-slate-700 font-medium px-3">
                <Edit3 className="h-4 w-4 text-blue-500" /> Edit
              </Button>
              <Button onClick={() => setDeletingEqId(currentEq.id)} className="bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 gap-2 rounded-xl border border-rose-200 dark:border-rose-800/40 font-medium px-3">
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#1E293B]/40 p-6 flex flex-col gap-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-500" /> Equipment Specification & Telematics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-8">
                  <div>
                    <p className="text-xs text-slate-500 mb-1 font-medium">Type / Category</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{currentEq.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1 font-medium">Current Operator</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-800 dark:text-white shrink-0">
                        {currentEq.operator ? currentEq.operator.split(' ').map(n => n[0]).join('') : 'U'}
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">{currentEq.operator}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1 font-medium">Site Location</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">{currentEq.location}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1 font-medium">Engine Hours</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{currentEq.engineHours} hrs</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1 font-medium">Last Service Date</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{currentEq.lastService}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1 font-medium">Status</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <select
                        value={currentEq.status}
                        onChange={(e) => handleQuickStatusChange(currentEq, e.target.value as EquipmentStatus, e)}
                        className="text-sm font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-900 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="Operating">Operating</option>
                        <option value="Idle">Idle</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Out of Service">Out of Service</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity Timeline */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#1E293B]/40 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" /> Recent Activity Logs
                  </h3>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={(e) => openLogModal(currentEq, 'Hours', e)} className="bg-blue-50 dark:bg-blue-600/20 hover:bg-blue-100 text-blue-600 dark:text-blue-400 text-xs gap-1 rounded-lg border border-blue-200 dark:border-blue-500/30">
                      <Clock className="h-3.5 w-3.5" /> Log Hours
                    </Button>
                    <Button size="sm" onClick={(e) => openLogModal(currentEq, 'Refuel', e)} className="bg-emerald-50 dark:bg-emerald-600/20 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 text-xs gap-1 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
                      <Fuel className="h-3.5 w-3.5" /> Refuel
                    </Button>
                    <Button size="sm" onClick={(e) => openLogModal(currentEq, 'Maintenance', e)} className="bg-amber-50 dark:bg-amber-600/20 hover:bg-amber-100 text-amber-600 dark:text-amber-400 text-xs gap-1 rounded-lg border border-amber-200 dark:border-amber-500/30">
                      <Wrench className="h-3.5 w-3.5" /> Maintenance
                    </Button>
                  </div>
                </div>
                {equipmentLogs.filter(l => l.equipmentId === currentEq.id).length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No activity logs recorded for this unit yet. Click one of the buttons above to log hours, refueling, or maintenance.</p>
                ) : (
                  <div className="space-y-4">
                    {equipmentLogs.filter(l => l.equipmentId === currentEq.id).map((log) => (
                      <div key={log.id} className="flex gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 transition-colors">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          log.type === 'Refuel' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                          log.type === 'Maintenance' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                          'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        }`}>
                          {log.type === 'Refuel' && <Fuel className="h-5 w-5" />}
                          {log.type === 'Maintenance' && <Wrench className="h-5 w-5" />}
                          {log.type === 'Hours' && <Clock className="h-5 w-5" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-200">
                              {log.type === 'Refuel' && `Refueled ${log.fuelLitres ? `${log.fuelLitres}L` : ''}`}
                              {log.type === 'Hours' && `Engine Hours Logged (+${log.hoursAdded} hrs)`}
                              {log.type === 'Maintenance' && `${log.maintenanceType || 'Maintenance Servicing'}`}
                            </p>
                            <span className="text-xs font-mono text-slate-500">{log.date}</span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{log.notes}</p>
                          <div className="flex gap-4 text-[11px] text-slate-500 mt-2 font-medium">
                            <span>Logged by: {log.loggedBy}</span>
                            {log.cost ? <span className="text-emerald-600 dark:text-emerald-400">Cost: ${log.cost}</span> : null}
                            {log.totalHours ? <span>Total Hours: {log.totalHours} hrs</span> : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#1E293B]/40 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                  <Fuel className="h-5 w-5 text-blue-500" /> Fuel & Battery Gauges
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Fuel Level</span>
                      <span className="text-slate-900 dark:text-slate-200 font-bold">{currentEq.fuelLevel}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${currentEq.fuelColor || 'bg-emerald-500'}`} style={{ width: `${currentEq.fuelLevel}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Battery Health</span>
                      <span className="text-slate-900 dark:text-slate-200 font-bold">95%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: '95%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Engine Load / Diagnostics</span>
                      <span className="text-slate-900 dark:text-slate-200 font-bold">Normal</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: '70%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#1E293B]/40 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                  <AlertCircle className="h-5 w-5 text-amber-500" /> Active Status Alert
                </h3>
                {currentEq.status === 'Maintenance' ? (
                  <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-sm font-medium text-orange-600 dark:text-orange-400">
                    Equipment marked in Maintenance. Service team notified.
                  </div>
                ) : currentEq.fuelLevel < 25 ? (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm font-medium text-rose-600 dark:text-rose-400">
                    Low Fuel Warning! Fuel level is under 25%.
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No active alerts for this equipment.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MAIN LIST / GRID VIEW */
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Equipment Tracking</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monitor fleet availability, engine hours, fuel levels, and maintenance status.</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={openAddModal} className="bg-[#0B5FFF] hover:bg-blue-600 text-white gap-2 rounded-xl shadow-sm border-0 font-medium px-4">
                <Plus className="h-4 w-4" /> Add Equipment
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-[#1E293B]/50 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-500 shrink-0">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-none mb-1">{equipment.length}</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Units</p>
              </div>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-[#1E293B]/50 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-500 shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-none mb-1">{activeUnitsCount}</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active / Operating</p>
              </div>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-[#1E293B]/50 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-500 shrink-0">
                <Wrench className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-none mb-1">{maintenanceCount}</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">In Maintenance</p>
              </div>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-[#1E293B]/50 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-500 shrink-0">
                <Fuel className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-none mb-1">{avgFuel}%</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Avg Fuel Level</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2 items-center flex-wrap">
              {['All', 'Operating', 'Idle', 'Maintenance', 'Out of Service'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filter === f 
                      ? 'bg-[#0B5FFF] text-white' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search equipment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1E293B]/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-[#0B5FFF]/50 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>
              <div className="flex items-center bg-white dark:bg-[#1E293B]/50 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shrink-0">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredEquipment.map(eq => (
                <div 
                  key={eq.id} 
                  onClick={() => setSelectedEqId(eq.id)}
                  className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#1E293B]/40 p-5 flex flex-col justify-between gap-5 relative cursor-pointer hover:border-blue-500 dark:hover:border-slate-700 transition-all group shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-slate-400">{eq.id}</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700">{eq.type}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#0B5FFF] transition-colors leading-snug">{eq.name}</h3>
                    </div>
                    <select
                      value={eq.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleQuickStatusChange(eq, e.target.value as EquipmentStatus, e)}
                      className={`px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider cursor-pointer focus:outline-none transition-all ${
                        eq.status === 'Operating' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' :
                        eq.status === 'Maintenance' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30 hover:bg-orange-500/20' :
                        eq.status === 'Idle' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20' :
                        'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                      }`}
                    >
                      <option value="Operating" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Operating</option>
                      <option value="Idle" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Idle</option>
                      <option value="Maintenance" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Maintenance</option>
                      <option value="Out of Service" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Out of Service</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/60">
                    <div>
                      <p className="text-[11px] text-slate-500 mb-0.5 font-medium">Operator</p>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{eq.operator}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 mb-0.5 font-medium">Location</p>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{eq.location}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 mb-0.5 font-medium">Engine Hours</p>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{eq.engineHours} hrs</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 mb-0.5 font-medium">Last Service</p>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{eq.lastService}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Fuel className="h-3.5 w-3.5" />
                        <span>Fuel Level</span>
                      </div>
                      <span className="text-slate-800 dark:text-slate-300 font-bold">{eq.fuelLevel}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${eq.fuelColor || 'bg-emerald-500'}`} style={{ width: `${eq.fuelLevel}%` }} />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" onClick={(e) => openLogModal(eq, 'Hours', e)} className="h-8 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 px-2 gap-1 rounded-lg">
                      <ClipboardList className="h-3.5 w-3.5" /> Log
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={(e) => openEditModal(eq, e)} className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeletingEqId(eq.id)} className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#1E293B]/40 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 font-medium">
                    <tr>
                      <th className="px-6 py-4 whitespace-nowrap">Asset ID & Name</th>
                      <th className="px-6 py-4 whitespace-nowrap">Status</th>
                      <th className="px-6 py-4 whitespace-nowrap">Operator</th>
                      <th className="px-6 py-4 whitespace-nowrap">Location</th>
                      <th className="px-6 py-4 whitespace-nowrap">Engine Hours</th>
                      <th className="px-6 py-4 whitespace-nowrap">Fuel Level</th>
                      <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                    {filteredEquipment.map(eq => (
                      <tr key={eq.id} onClick={() => setSelectedEqId(eq.id)} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">{eq.name}</span>
                            <span className="text-slate-500 text-xs mt-0.5">{eq.id} • {eq.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={eq.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleQuickStatusChange(eq, e.target.value as EquipmentStatus, e)}
                            className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider cursor-pointer border focus:outline-none transition-all ${
                              eq.status === 'Operating' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' :
                              eq.status === 'Maintenance' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30' :
                              eq.status === 'Idle' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' :
                              'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                            }`}
                          >
                            <option value="Operating" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Operating</option>
                            <option value="Idle" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Idle</option>
                            <option value="Maintenance" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Maintenance</option>
                            <option value="Out of Service" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Out of Service</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">{eq.operator}</td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">{eq.location}</td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">{eq.engineHours} hrs</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 w-24">
                            <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${eq.fuelColor || 'bg-emerald-500'}`} style={{ width: `${eq.fuelLevel}%` }} />
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{eq.fuelLevel}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={(e) => openLogModal(eq, 'Hours', e)} className="h-8 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg px-2 gap-1">
                              <ClipboardList className="h-3.5 w-3.5" /> Log
                            </Button>
                            <Button variant="ghost" size="icon" onClick={(e) => openEditModal(eq, e)} className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeletingEqId(eq.id)} className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GLOBAL MODALS (AVAILABLE IN BOTH DETAIL AND OVERVIEW VIEWS) */}

      {/* Add New Equipment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add New Fleet Equipment</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Asset ID</label>
                  <input type="text" value={formId} onChange={e => setFormId(e.target.value)} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Type / Category</label>
                  <CustomSelect
                    value={formType}
                    onChange={val => setFormType(val)}
                    options={['Earthmoving', 'Concrete', 'Lifting', 'Compaction', 'Generator/Power', 'Transport']}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    customPlaceholder="Enter custom equipment category..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Equipment Name / Model</label>
                <input type="text" placeholder="e.g. CAT 330 Hydraulic Excavator" value={formName} onChange={e => setFormName(e.target.value)} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Location</label>
                  <input type="text" placeholder="e.g. Zone A" value={formLocation} onChange={e => setFormLocation(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assigned Operator</label>
                  <input type="text" placeholder="Leave blank if unassigned" value={formOperator} onChange={e => setFormOperator(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</label>
                  <select value={formStatus} onChange={e => setFormStatus(e.target.value as EquipmentStatus)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500">
                    <option value="Operating">Operating</option>
                    <option value="Idle">Idle</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Out of Service">Out of Service</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Engine Hours</label>
                  <input type="number" value={formEngineHours} onChange={e => setFormEngineHours(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Fuel Level (%)</label>
                  <input type="number" min="0" max="100" value={formFuelLevel} onChange={e => setFormFuelLevel(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">Cancel</Button>
                <Button type="submit" className="bg-[#0B5FFF] hover:bg-blue-600 text-white">Save Equipment</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Equipment Modal */}
      {editingEq && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-blue-500" /> Edit Equipment ({editingEq.id})
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setEditingEq(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Asset ID</label>
                  <input type="text" value={formId} disabled className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-400 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Type / Category</label>
                  <CustomSelect
                    value={formType}
                    onChange={val => setFormType(val)}
                    options={['Earthmoving', 'Concrete', 'Lifting', 'Compaction', 'Generator/Power', 'Transport']}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    customPlaceholder="Enter custom equipment category..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Equipment Name / Model</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Location</label>
                  <input type="text" value={formLocation} onChange={e => setFormLocation(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assigned Operator</label>
                  <input type="text" value={formOperator} onChange={e => setFormOperator(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</label>
                  <select value={formStatus} onChange={e => setFormStatus(e.target.value as EquipmentStatus)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500">
                    <option value="Operating">Operating</option>
                    <option value="Idle">Idle</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Out of Service">Out of Service</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Engine Hours</label>
                  <input type="number" value={formEngineHours} onChange={e => setFormEngineHours(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Fuel Level (%)</label>
                  <input type="number" min="0" max="100" value={formFuelLevel} onChange={e => setFormFuelLevel(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Last Service Date</label>
                <input type="date" value={formLastService} onChange={e => setFormLastService(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setEditingEq(null)} className="text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">Cancel</Button>
                <Button type="submit" className="bg-[#0B5FFF] hover:bg-blue-600 text-white">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingEqId)}
        title="Delete Equipment"
        itemName={equipment.find(e => e.id === deletingEqId)?.name || deletingEqId || ''}
        message="Are you sure you want to delete this equipment? This action will remove it from fleet tracking and cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingEqId(null)}
        confirmLabel="Delete Equipment"
      />

      {/* Equipment Activity Logging Modal (Hours, Refuel, Maintenance) */}
      {logModalEq && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-500" /> Log Equipment Activity
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{logModalEq.id} - {logModalEq.name}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setLogModalEq(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Log Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/50 px-6 pt-3 gap-2">
              <button
                type="button"
                onClick={() => setLogTab('Hours')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-colors border-t border-x ${
                  logTab === 'Hours' 
                    ? 'bg-white dark:bg-[#1E293B] text-blue-600 dark:text-blue-400 border-slate-200 dark:border-slate-700 border-b-transparent' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-transparent'
                }`}
              >
                <Clock className="h-3.5 w-3.5" /> Engine Hours
              </button>
              <button
                type="button"
                onClick={() => setLogTab('Refuel')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-colors border-t border-x ${
                  logTab === 'Refuel' 
                    ? 'bg-white dark:bg-[#1E293B] text-emerald-600 dark:text-emerald-400 border-slate-200 dark:border-slate-700 border-b-transparent' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-transparent'
                }`}
              >
                <Fuel className="h-3.5 w-3.5" /> Refueling
              </button>
              <button
                type="button"
                onClick={() => setLogTab('Maintenance')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-colors border-t border-x ${
                  logTab === 'Maintenance' 
                    ? 'bg-white dark:bg-[#1E293B] text-amber-600 dark:text-amber-400 border-slate-200 dark:border-slate-700 border-b-transparent' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-transparent'
                }`}
              >
                <Wrench className="h-3.5 w-3.5" /> Maintenance
              </button>
            </div>

            <form onSubmit={handleLogSubmit} className="p-6 overflow-y-auto space-y-4">
              {logTab === 'Hours' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Start Time</label>
                      <input 
                        type="time" 
                        value={logStartTime} 
                        onChange={e => handleStartTimeChange(e.target.value)} 
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">End Time</label>
                      <input 
                        type="time" 
                        value={logEndTime} 
                        onChange={e => handleEndTimeChange(e.target.value)} 
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Hours Worked Today (Auto/Manual)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        min="0.1"
                        value={logHoursAdded} 
                        onChange={e => {
                          setLogHoursAdded(Number(e.target.value));
                          setIsManualHoursOverride(true);
                        }} 
                        required
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-blue-600 dark:text-blue-400 font-bold focus:outline-none focus:border-blue-500" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Operator / Tech</label>
                      <input 
                        type="text" 
                        value={logLoggedBy} 
                        onChange={e => setLogLoggedBy(e.target.value)} 
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" 
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl text-xs text-blue-700 dark:text-blue-300">
                    Current Engine Hours: <strong>{logModalEq.engineHours} hrs</strong> ➔ New Total: <strong>{(typeof logModalEq.engineHours === 'number' ? logModalEq.engineHours : parseInt(String(logModalEq.engineHours)) || 0) + Number(logHoursAdded)} hrs</strong>
                  </div>
                </>
              )}

              {logTab === 'Refuel' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Fuel Added (Litres)</label>
                      <input 
                        type="number" 
                        value={logFuelLitres} 
                        onChange={e => setLogFuelLitres(Number(e.target.value))} 
                        required
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">New Fuel Level (%)</label>
                      <input 
                        type="number" 
                        min="0" 
                        max="100"
                        value={logFuelLevelAfter} 
                        onChange={e => setLogFuelLevelAfter(Number(e.target.value))} 
                        required
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cost ($ Optional)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 250"
                        value={logCost} 
                        onChange={e => setLogCost(e.target.value ? Number(e.target.value) : '')} 
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Logged By</label>
                      <input 
                        type="text" 
                        value={logLoggedBy} 
                        onChange={e => setLogLoggedBy(e.target.value)} 
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500" 
                      />
                    </div>
                  </div>
                </>
              )}

              {logTab === 'Maintenance' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Service Type</label>
                      <select 
                        value={logMaintenanceType} 
                        onChange={e => setLogMaintenanceType(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="Routine Service">Routine Service</option>
                        <option value="Oil & Filter Change">Oil & Filter Change</option>
                        <option value="Hydraulic System Repair">Hydraulic System Repair</option>
                        <option value="Tire / Track Maintenance">Tire / Track Maintenance</option>
                        <option value="Engine Overhaul">Engine Overhaul</option>
                        <option value="Safety Inspection">Safety Inspection</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Service Cost ($)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 450"
                        value={logCost} 
                        onChange={e => setLogCost(e.target.value ? Number(e.target.value) : '')} 
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Update Fleet Status</label>
                      <select 
                        value={logSetStatus} 
                        onChange={e => setLogSetStatus(e.target.value as EquipmentStatus)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="Operating">Operating</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Idle">Idle</option>
                        <option value="Out of Service">Out of Service</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Technician / Inspector</label>
                      <input 
                        type="text" 
                        value={logLoggedBy} 
                        onChange={e => setLogLoggedBy(e.target.value)} 
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500" 
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Notes & Comments</label>
                <textarea 
                  rows={3} 
                  placeholder="Enter details, work package, or issues resolved..."
                  value={logNotes} 
                  onChange={e => setLogNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setLogModalEq(null)} className="text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">Cancel</Button>
                <Button type="submit" className="bg-[#0B5FFF] hover:bg-blue-600 text-white">Save {logTab} Log</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
