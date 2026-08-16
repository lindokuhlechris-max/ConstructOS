import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, ProgressBar, CustomSelect } from '../components/ui';
import { 
  Truck, Plus, Wrench, ArrowLeft, Fuel, CheckCircle2, LayoutGrid, List, Search, 
  MapPin, Calendar, Clock, AlertCircle, FileText, X, Edit3, Trash2, 
  ClipboardList, Activity as ActivityIcon, ShieldAlert, Gauge, Zap, Boxes, Car,
  Sliders, Shield, Navigation, HardHat
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Equipment as EquipmentType, EquipmentLog, EquipmentStatus, EquipmentLogType, EquipmentCategory, PrimaryUsageMetric } from '../types';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

export function Equipment() {
  const { equipment, equipmentLogs, addEquipment, updateEquipment, deleteEquipment, addEquipmentLog, deleteEquipmentLog } = useAppContext();

  const [filter, setFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
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
  const [formType, setFormType] = useState('Excavator');
  const [formCategory, setFormCategory] = useState<EquipmentCategory>('Heavy Machinery');
  const [formPrimaryMetric, setFormPrimaryMetric] = useState<PrimaryUsageMetric>('Engine Hours');
  const [formOperator, setFormOperator] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formEngineHours, setFormEngineHours] = useState(0);
  const [formMileage, setFormMileage] = useState(0);
  const [formTotalLoads, setFormTotalLoads] = useState(0);
  const [formTotalPowerKWh, setFormTotalPowerKWh] = useState(0);
  const [formLicensePlate, setFormLicensePlate] = useState('');
  const [formFuelCapacityLitres, setFormFuelCapacityLitres] = useState(200);
  const [formFuelConsumptionRate, setFormFuelConsumptionRate] = useState<number | ''>('');
  const [formServiceIntervalHours, setFormServiceIntervalHours] = useState<number | ''>(250);
  const [formServiceIntervalKm, setFormServiceIntervalKm] = useState<number | ''>(10000);
  const [formModel, setFormModel] = useState('');
  const [formVinSerial, setFormVinSerial] = useState('');
  const [formAccessories, setFormAccessories] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<EquipmentStatus>('Operating');
  const [formFuelLevel, setFormFuelLevel] = useState(100);
  const [formLastService, setFormLastService] = useState(new Date().toISOString().split('T')[0]);

  // Log Form State
  const [logStartTime, setLogStartTime] = useState('07:00');
  const [logEndTime, setLogEndTime] = useState('15:00');
  const [logHoursAdded, setLogHoursAdded] = useState(8);
  const [logMileageAdded, setLogMileageAdded] = useState(100);
  const [logOdometerReading, setLogOdometerReading] = useState(0);
  const [logTripRoute, setLogTripRoute] = useState('');
  const [logDriverOperator, setLogDriverOperator] = useState('');
  const [logLoadsAdded, setLogLoadsAdded] = useState(10);
  const [logMaterialHauled, setLogMaterialHauled] = useState('');
  const [logLoadWeightTonnes, setLogLoadWeightTonnes] = useState<number | ''>('');
  const [logPowerKWhAdded, setLogPowerKWhAdded] = useState(250);
  const [logGeneratorLoadPercent, setLogGeneratorLoadPercent] = useState(75);
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
    const matchesStatus = filter === 'All' || eq.status === filter;
    const matchesCategory = categoryFilter === 'All' || eq.category === categoryFilter;
    const matchesSearch = 
      eq.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      eq.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (eq.operator && eq.operator.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (eq.location && eq.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (eq.type && eq.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (eq.licensePlate && eq.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const openAddModal = () => {
    const nextIdNum = Math.max(...equipment.map(e => parseInt(e.id.replace(/\D/g, '')) || 100), 100) + 1;
    setFormId(`EQ-${nextIdNum}`);
    setFormName('');
    setFormType('Light Vehicle / Bakkie');
    setFormCategory('Cars & Light Vehicles');
    setFormPrimaryMetric('Mileage / Odometer');
    setFormOperator('');
    setFormLocation('Main Compound');
    setFormEngineHours(0);
    setFormMileage(0);
    setFormTotalLoads(0);
    setFormTotalPowerKWh(0);
    setFormLicensePlate('');
    setFormFuelCapacityLitres(80);
    setFormFuelConsumptionRate(8.5);
    setFormServiceIntervalHours(250);
    setFormServiceIntervalKm(10000);
    setFormModel('');
    setFormVinSerial('');
    setFormAccessories('');
    setFormNotes('');
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
    setFormType(eq.type || 'Equipment');
    setFormCategory((eq.category as EquipmentCategory) || 'Heavy Machinery');
    setFormPrimaryMetric(eq.primaryMetric || 'Engine Hours');
    setFormOperator(eq.operator || '');
    setFormLocation(eq.location || '');
    setFormEngineHours(typeof eq.engineHours === 'number' ? eq.engineHours : parseInt(String(eq.engineHours)) || 0);
    setFormMileage(eq.mileage || 0);
    setFormTotalLoads(eq.totalLoads || 0);
    setFormTotalPowerKWh(eq.totalPowerKWh || 0);
    setFormLicensePlate(eq.licensePlate || '');
    setFormFuelCapacityLitres(eq.fuelCapacityLitres || 100);
    setFormFuelConsumptionRate(eq.fuelConsumptionRate || '');
    setFormServiceIntervalHours(eq.serviceIntervalHours || '');
    setFormServiceIntervalKm(eq.serviceIntervalKm || '');
    setFormModel(eq.model || '');
    setFormVinSerial(eq.vinSerial || '');
    setFormAccessories(eq.accessories || '');
    setFormNotes(eq.notes || '');
    setFormStatus(eq.status);
    setFormFuelLevel(eq.fuelLevel ?? 100);
    setFormLastService(eq.lastService || new Date().toISOString().split('T')[0]);
  };

  const openLogModal = (eq: EquipmentType, defaultTab: EquipmentLogType = 'Hours', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLogModalEq(eq);
    
    // Auto switch to primary metric log tab if defaultTab is generic
    if (defaultTab === 'Hours' && eq.primaryMetric) {
      if (eq.primaryMetric === 'Mileage / Odometer') setLogTab('Mileage');
      else if (eq.primaryMetric === 'Loads & Trips') setLogTab('Loads & Trips');
      else if (eq.primaryMetric === 'Power Output (kWh)') setLogTab('Power Output');
      else setLogTab('Hours');
    } else {
      setLogTab(defaultTab);
    }

    setLogStartTime('07:00');
    setLogEndTime('15:00');
    setLogHoursAdded(8);
    setLogMileageAdded(50);
    setLogOdometerReading((eq.mileage || 0) + 50);
    setLogTripRoute('Site Compound -> Quarry -> Main Compound');
    setLogDriverOperator(eq.operator !== 'Unassigned' ? eq.operator : 'Site Operator');
    setLogLoadsAdded(10);
    setLogMaterialHauled('G2 Basecourse Subgrade');
    setLogLoadWeightTonnes(150);
    setLogPowerKWhAdded(200);
    setLogGeneratorLoadPercent(75);
    setLogFuelLitres(100);
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
      category: formCategory,
      primaryMetric: formPrimaryMetric,
      operator: formOperator || 'Unassigned',
      location: formLocation || 'Main Compound',
      engineHours: Number(formEngineHours) || 0,
      mileage: Number(formMileage) || 0,
      totalLoads: Number(formTotalLoads) || 0,
      totalPowerKWh: Number(formTotalPowerKWh) || 0,
      licensePlate: formLicensePlate,
      fuelCapacityLitres: Number(formFuelCapacityLitres) || 100,
      fuelConsumptionRate: formFuelConsumptionRate ? Number(formFuelConsumptionRate) : undefined,
      serviceIntervalHours: formServiceIntervalHours ? Number(formServiceIntervalHours) : undefined,
      serviceIntervalKm: formServiceIntervalKm ? Number(formServiceIntervalKm) : undefined,
      model: formModel,
      vinSerial: formVinSerial,
      accessories: formAccessories,
      notes: formNotes,
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
      category: formCategory,
      primaryMetric: formPrimaryMetric,
      operator: formOperator || 'Unassigned',
      location: formLocation || 'Main Compound',
      engineHours: Number(formEngineHours) || 0,
      mileage: Number(formMileage) || 0,
      totalLoads: Number(formTotalLoads) || 0,
      totalPowerKWh: Number(formTotalPowerKWh) || 0,
      licensePlate: formLicensePlate,
      fuelCapacityLitres: Number(formFuelCapacityLitres) || 100,
      fuelConsumptionRate: formFuelConsumptionRate ? Number(formFuelConsumptionRate) : undefined,
      serviceIntervalHours: formServiceIntervalHours ? Number(formServiceIntervalHours) : undefined,
      serviceIntervalKm: formServiceIntervalKm ? Number(formServiceIntervalKm) : undefined,
      model: formModel,
      vinSerial: formVinSerial,
      accessories: formAccessories,
      notes: formNotes,
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
    } else if (logTab === 'Mileage') {
      newLog.mileageAdded = Number(logMileageAdded);
      newLog.odometerReading = logOdometerReading ? Number(logOdometerReading) : (logModalEq.mileage || 0) + Number(logMileageAdded);
      newLog.tripRoute = logTripRoute;
      newLog.driverOperator = logDriverOperator;
      if (!newLog.notes) newLog.notes = `Logged +${logMileageAdded} km trip. Odometer reading now ${newLog.odometerReading} km.`;
    } else if (logTab === 'Loads & Trips') {
      newLog.loadsAdded = Number(logLoadsAdded);
      newLog.materialHauled = logMaterialHauled;
      if (logLoadWeightTonnes) newLog.loadWeightTonnes = Number(logLoadWeightTonnes);
      if (logMileageAdded) newLog.mileageAdded = Number(logMileageAdded);
      if (!newLog.notes) newLog.notes = `Delivered ${logLoadsAdded} loads ${logMaterialHauled ? `of ${logMaterialHauled}` : ''}${logLoadWeightTonnes ? ` (${logLoadWeightTonnes} tonnes)` : ''}`;
    } else if (logTab === 'Power Output') {
      newLog.powerKWhAdded = Number(logPowerKWhAdded);
      newLog.generatorLoadPercent = Number(logGeneratorLoadPercent);
      if (logHoursAdded) newLog.hoursAdded = Number(logHoursAdded);
      if (!newLog.notes) newLog.notes = `Generated ${logPowerKWhAdded} kWh at ${logGeneratorLoadPercent}% generator load capacity.`;
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
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-mono text-slate-500 dark:text-slate-400">{currentEq.id}</span>
                  {currentEq.licensePlate && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-yellow-400 dark:bg-yellow-400 dark:text-slate-950 text-xs font-mono font-extrabold border border-yellow-500/30">
                      {currentEq.licensePlate}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-500/20">
                    {currentEq.category || currentEq.type}
                  </span>
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
              <Button onClick={(e) => openLogModal(currentEq, 'Maintenance', e)} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-rose-700 dark:text-rose-400 gap-2 rounded-xl border border-slate-200 dark:border-slate-700 font-medium px-3">
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
                  <Truck className="h-5 w-5 text-blue-500" /> Equipment Specification & Key Usage Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-8">
                  <div>
                    <p className="text-xs text-slate-500 mb-1 font-medium">Category & Type</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">{currentEq.type} ({currentEq.category || 'Machinery'})</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1 font-medium">Current Driver / Operator</p>
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

                  {/* Primary & Secondary Metrics */}
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <p className="text-xs text-purple-600 dark:text-purple-400 mb-0.5 font-bold flex items-center gap-1">
                      <Car className="h-3.5 w-3.5" /> Total Mileage (Odometer)
                    </p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{(currentEq.mileage || 0).toLocaleString()} km</p>
                  </div>

                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-0.5 font-bold flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Engine Hours
                    </p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{(currentEq.engineHours || 0).toLocaleString()} hrs</p>
                  </div>

                  {currentEq.totalLoads !== undefined && (
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-0.5 font-bold flex items-center gap-1">
                        <Boxes className="h-3.5 w-3.5" /> Total Loads Delivered
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{(currentEq.totalLoads || 0).toLocaleString()} loads</p>
                    </div>
                  )}

                  {currentEq.totalPowerKWh !== undefined && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <p className="text-xs text-amber-600 dark:text-amber-400 mb-0.5 font-bold flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5" /> Power Generated
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{(currentEq.totalPowerKWh || 0).toLocaleString()} kWh</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-slate-500 mb-1 font-medium">Last Service Date</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{currentEq.lastService}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 mb-1 font-medium">Primary Usage Metric</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{currentEq.primaryMetric || 'Engine Hours'}</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity Timeline */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#1E293B]/40 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" /> Recent Activity Logs
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" onClick={(e) => openLogModal(currentEq, 'Mileage', e)} className="bg-purple-50 dark:bg-purple-600/20 hover:bg-purple-100 text-purple-600 dark:text-purple-400 text-xs gap-1 rounded-lg border border-purple-200 dark:border-purple-500/30">
                      <Car className="h-3.5 w-3.5" /> Mileage
                    </Button>
                    <Button size="sm" onClick={(e) => openLogModal(currentEq, 'Hours', e)} className="bg-blue-50 dark:bg-blue-600/20 hover:bg-blue-100 text-blue-600 dark:text-blue-400 text-xs gap-1 rounded-lg border border-blue-200 dark:border-blue-500/30">
                      <Clock className="h-3.5 w-3.5" /> Hours
                    </Button>
                    <Button size="sm" onClick={(e) => openLogModal(currentEq, 'Loads & Trips', e)} className="bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-xs gap-1 rounded-lg border border-indigo-200 dark:border-indigo-500/30">
                      <Boxes className="h-3.5 w-3.5" /> Loads
                    </Button>
                    <Button size="sm" onClick={(e) => openLogModal(currentEq, 'Refuel', e)} className="bg-emerald-50 dark:bg-emerald-600/20 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 text-xs gap-1 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
                      <Fuel className="h-3.5 w-3.5" /> Refuel
                    </Button>
                  </div>
                </div>
                {equipmentLogs.filter(l => l.equipmentId === currentEq.id).length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No activity logs recorded for this unit yet. Click one of the buttons above to log trips, hours, refueling, or maintenance.</p>
                ) : (
                  <div className="space-y-4">
                    {equipmentLogs.filter(l => l.equipmentId === currentEq.id).map((log) => (
                      <div key={log.id} className="flex gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 transition-colors">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          log.type === 'Refuel' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                          log.type === 'Maintenance' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' :
                          log.type === 'Mileage' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' :
                          log.type === 'Loads & Trips' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' :
                          log.type === 'Power Output' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                          'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        }`}>
                          {log.type === 'Refuel' && <Fuel className="h-5 w-5" />}
                          {log.type === 'Maintenance' && <Wrench className="h-5 w-5" />}
                          {log.type === 'Mileage' && <Car className="h-5 w-5" />}
                          {log.type === 'Loads & Trips' && <Boxes className="h-5 w-5" />}
                          {log.type === 'Power Output' && <Zap className="h-5 w-5" />}
                          {log.type === 'Hours' && <Clock className="h-5 w-5" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-200">
                              {log.type === 'Refuel' && `Refueled ${log.fuelLitres ? `${log.fuelLitres}L` : ''}`}
                              {log.type === 'Mileage' && `Trip Logged (+${log.mileageAdded} km)`}
                              {log.type === 'Loads & Trips' && `Loads Delivered (+${log.loadsAdded} loads)`}
                              {log.type === 'Power Output' && `Power Generated (+${log.powerKWhAdded} kWh)`}
                              {log.type === 'Hours' && `Engine Hours Logged (+${log.hoursAdded} hrs)`}
                              {log.type === 'Maintenance' && `${log.maintenanceType || 'Maintenance Servicing'}`}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-slate-500">{log.date}</span>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete this ${log.type} log?`)) {
                                    deleteEquipmentLog(log.id);
                                  }
                                }}
                                className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="Delete Log Entry"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{log.notes}</p>
                          <div className="flex gap-4 text-[11px] text-slate-500 mt-2 font-medium flex-wrap">
                            <span>Logged by: {log.loggedBy}</span>
                            {log.cost ? <span className="text-emerald-600 dark:text-emerald-400">Cost: ${log.cost}</span> : null}
                            {log.odometerReading ? <span>Odometer: {log.odometerReading} km</span> : null}
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
                  <Fuel className="h-5 w-5 text-blue-500" /> Fuel Tank & Battery Health
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Fuel Level</span>
                      <span className="text-slate-900 dark:text-slate-200 font-bold">{currentEq.fuelLevel}% ({currentEq.fuelCapacityLitres ? Math.round((currentEq.fuelLevel / 100) * currentEq.fuelCapacityLitres) : ''}L)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${currentEq.fuelColor || 'bg-emerald-500'}`} style={{ width: `${currentEq.fuelLevel}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Battery & System Health</span>
                      <span className="text-slate-900 dark:text-slate-200 font-bold">98% Optimal</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: '98%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#1E293B]/40 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                  <AlertCircle className="h-5 w-5 text-amber-500" /> Maintenance Diagnostics
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
                  <p className="text-sm text-slate-500">All telematic diagnostics reporting normal parameters.</p>
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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Fleet & Equipment Management</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track light vehicles, heavy machinery, dump trucks, generators, and site equipment metrics.</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={openAddModal} className="bg-[#0B5FFF] hover:bg-blue-600 text-white gap-2 rounded-xl shadow-sm border-0 font-medium px-4">
                <Plus className="h-4 w-4" /> Add Asset / Vehicle
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
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Fleet Assets</p>
              </div>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-[#1E293B]/50 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-500 shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-none mb-1">{activeUnitsCount}</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Operating Units</p>
              </div>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-[#1E293B]/50 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-500 shrink-0">
                <Car className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-none mb-1">
                  {equipment.filter(e => e.category === 'Cars & Light Vehicles').length}
                </h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Vehicles & Cars</p>
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

          {/* Filter Bar */}
          <div className="space-y-3">
            <div className="flex gap-2 items-center overflow-x-auto pb-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-2 shrink-0">Category:</span>
              {['All', 'Cars & Light Vehicles', 'Heavy Machinery', 'Haulage & Dump Trucks', 'Stationary & Generators', 'Lifting & Cranes'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                    categoryFilter === cat 
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' 
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-2 items-center flex-wrap">
                {['All', 'Operating', 'Idle', 'Maintenance', 'Out of Service'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
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
                    placeholder="Search name, ID, plate, operator..."
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
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredEquipment.map(eq => (
                <div 
                  key={eq.id} 
                  onClick={() => setSelectedEqId(eq.id)}
                  className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#1E293B]/40 p-5 flex flex-col justify-between gap-4 relative cursor-pointer hover:border-blue-500 dark:hover:border-slate-700 transition-all group shadow-sm"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-mono font-bold text-slate-400">{eq.id}</span>
                        {eq.licensePlate && (
                          <span className="px-1.5 py-0.5 rounded bg-yellow-400 text-slate-950 text-[10px] font-mono font-extrabold uppercase">
                            {eq.licensePlate}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700 truncate max-w-[130px]">
                          {eq.type}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#0B5FFF] transition-colors leading-tight truncate">{eq.name}</h3>
                    </div>
                    <select
                      value={eq.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleQuickStatusChange(eq, e.target.value as EquipmentStatus, e)}
                      className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider cursor-pointer focus:outline-none transition-all shrink-0 ${
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
                  </div>

                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/60">
                    <div>
                      <p className="text-[10px] text-slate-500 mb-0.5 font-medium">Driver / Operator</p>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{eq.operator}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-0.5 font-medium">Location</p>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{eq.location}</p>
                    </div>

                    {/* Metric Display based on Category */}
                    <div>
                      <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mb-0.5">Odometer / Mileage</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{(eq.mileage || 0).toLocaleString()} km</p>
                    </div>

                    <div>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mb-0.5">Engine Hours</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{(eq.engineHours || 0).toLocaleString()} hrs</p>
                    </div>

                    {eq.totalLoads ? (
                      <div className="col-span-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Total Loads Delivered</p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{eq.totalLoads} loads</p>
                      </div>
                    ) : eq.totalPowerKWh ? (
                      <div className="col-span-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Cumulative Power Output</p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{eq.totalPowerKWh.toLocaleString()} kWh</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px]">
                        <Fuel className="h-3 w-3" />
                        <span>Fuel Level</span>
                      </div>
                      <span className="text-slate-800 dark:text-slate-300 font-bold text-xs">{eq.fuelLevel}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${eq.fuelColor || 'bg-emerald-500'}`} style={{ width: `${eq.fuelLevel}%` }} />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" onClick={(e) => openLogModal(eq, 'Hours', e)} className="h-8 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 px-2 gap-1 rounded-lg">
                      <ClipboardList className="h-3.5 w-3.5" /> Log Activity
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
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add New Fleet Equipment / Vehicle</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Equipment Category</label>
                  <select 
                    value={formCategory} 
                    onChange={e => {
                      const cat = e.target.value as EquipmentCategory;
                      setFormCategory(cat);
                      if (cat === 'Cars & Light Vehicles') {
                        setFormPrimaryMetric('Mileage / Odometer');
                        setFormType('Light Vehicle / Bakkie');
                      } else if (cat === 'Haulage & Dump Trucks') {
                        setFormPrimaryMetric('Loads & Trips');
                        setFormType('Dump Truck');
                      } else if (cat === 'Stationary & Generators') {
                        setFormPrimaryMetric('Power Output (kWh)');
                        setFormType('Diesel Generator');
                      } else {
                        setFormPrimaryMetric('Engine Hours');
                        setFormType('Excavator');
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Cars & Light Vehicles">Cars & Light Vehicles (Bakkies/LDVs, Vans, SUVs)</option>
                    <option value="Heavy Machinery">Heavy Machinery (Excavators, Dozers, Graders)</option>
                    <option value="Haulage & Dump Trucks">Haulage & Dump Trucks (Tipper, Water Tanker)</option>
                    <option value="Stationary & Generators">Stationary & Generators (Power Gensets, Lighting Towers)</option>
                    <option value="Lifting & Cranes">Lifting & Cranes (Mobile Crane, Telehandler)</option>
                    <option value="Concrete & Paving">Concrete & Paving (Mixer Trucks, Pavers)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Primary Usage Metric</label>
                  <select 
                    value={formPrimaryMetric} 
                    onChange={e => setFormPrimaryMetric(e.target.value as PrimaryUsageMetric)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Mileage / Odometer">Mileage / Odometer (km)</option>
                    <option value="Engine Hours">Engine Hours (hrs)</option>
                    <option value="Loads & Trips">Loads & Trips (Count)</option>
                    <option value="Power Output (kWh)">Power Output (kWh)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Asset ID</label>
                  <input type="text" value={formId} onChange={e => setFormId(e.target.value)} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Type Name</label>
                  <CustomSelect
                    value={formType}
                    onChange={val => setFormType(val)}
                    options={['Light Vehicle / Bakkie', 'Dump Truck', 'Excavator', 'Bulldozer', 'Motor Grader', 'Diesel Generator', 'Mobile Crane', 'Concrete Mixer', 'Site Van']}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    customPlaceholder="Enter custom equipment type..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Asset Name / Title</label>
                  <input type="text" placeholder="e.g. Toyota Hilux 2.8 GD-6 / CAT 330" value={formName} onChange={e => setFormName(e.target.value)} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Registration / License Plate (For Vehicles)</label>
                  <input type="text" placeholder="e.g. CA 829-104" value={formLicensePlate} onChange={e => setFormLicensePlate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Location / Station</label>
                  <input type="text" placeholder="e.g. Main Site Compound" value={formLocation} onChange={e => setFormLocation(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assigned Driver / Operator</label>
                  <input type="text" placeholder="Leave blank if unassigned" value={formOperator} onChange={e => setFormOperator(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Current Metrics & Status</span>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Odometer (km)</label>
                    <input type="number" value={formMileage} onChange={e => setFormMileage(Number(e.target.value))} className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Engine Hours</label>
                    <input type="number" value={formEngineHours} onChange={e => setFormEngineHours(Number(e.target.value))} className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Total Loads</label>
                    <input type="number" value={formTotalLoads} onChange={e => setFormTotalLoads(Number(e.target.value))} className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Power (kWh)</label>
                    <input type="number" value={formTotalPowerKWh} onChange={e => setFormTotalPowerKWh(Number(e.target.value))} className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Status</label>
                    <select value={formStatus} onChange={e => setFormStatus(e.target.value as EquipmentStatus)} className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white">
                      <option value="Operating">Operating</option>
                      <option value="Idle">Idle</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Out of Service">Out of Service</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Fuel Level (%)</label>
                    <input type="number" min="0" max="100" value={formFuelLevel} onChange={e => setFormFuelLevel(Number(e.target.value))} className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Fuel Tank Capacity (L)</label>
                    <input type="number" value={formFuelCapacityLitres} onChange={e => setFormFuelCapacityLitres(Number(e.target.value))} className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white" />
                  </div>
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
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-blue-500" /> Edit Equipment ({editingEq.id})
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setEditingEq(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
                  <select 
                    value={formCategory} 
                    onChange={e => setFormCategory(e.target.value as EquipmentCategory)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Cars & Light Vehicles">Cars & Light Vehicles</option>
                    <option value="Heavy Machinery">Heavy Machinery</option>
                    <option value="Haulage & Dump Trucks">Haulage & Dump Trucks</option>
                    <option value="Stationary & Generators">Stationary & Generators</option>
                    <option value="Lifting & Cranes">Lifting & Cranes</option>
                    <option value="Concrete & Paving">Concrete & Paving</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Equipment Type</label>
                  <CustomSelect
                    value={formType}
                    onChange={val => setFormType(val)}
                    options={['Light Vehicle / Bakkie', 'Dump Truck', 'Excavator', 'Bulldozer', 'Motor Grader', 'Diesel Generator', 'Mobile Crane', 'Concrete Mixer', 'Site Van']}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    customPlaceholder="Enter custom equipment type..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Primary Metric</label>
                  <select 
                    value={formPrimaryMetric} 
                    onChange={e => setFormPrimaryMetric(e.target.value as PrimaryUsageMetric)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Mileage / Odometer">Mileage / Odometer (km)</option>
                    <option value="Engine Hours">Engine Hours (hrs)</option>
                    <option value="Loads & Trips">Loads & Trips (Count)</option>
                    <option value="Power Output (kWh)">Power Output (kWh)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Equipment Name / Title</label>
                  <input type="text" value={formName} onChange={e => setFormName(e.target.value)} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Registration / License Plate</label>
                  <input type="text" value={formLicensePlate} onChange={e => setFormLicensePlate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Location</label>
                  <input type="text" value={formLocation} onChange={e => setFormLocation(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assigned Driver / Operator</label>
                  <input type="text" value={formOperator} onChange={e => setFormOperator(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Metrics Update</span>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Odometer (km)</label>
                    <input type="number" value={formMileage} onChange={e => setFormMileage(Number(e.target.value))} className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Engine Hours</label>
                    <input type="number" value={formEngineHours} onChange={e => setFormEngineHours(Number(e.target.value))} className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Total Loads</label>
                    <input type="number" value={formTotalLoads} onChange={e => setFormTotalLoads(Number(e.target.value))} className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Power (kWh)</label>
                    <input type="number" value={formTotalPowerKWh} onChange={e => setFormTotalPowerKWh(Number(e.target.value))} className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Status</label>
                    <select value={formStatus} onChange={e => setFormStatus(e.target.value as EquipmentStatus)} className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white">
                      <option value="Operating">Operating</option>
                      <option value="Idle">Idle</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Out of Service">Out of Service</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Fuel Level (%)</label>
                    <input type="number" min="0" max="100" value={formFuelLevel} onChange={e => setFormFuelLevel(Number(e.target.value))} className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Last Service Date</label>
                    <input type="date" value={formLastService} onChange={e => setFormLastService(e.target.value)} className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white" />
                  </div>
                </div>
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

      {/* Equipment Activity Logging Modal (Hours, Mileage, Loads, Power, Refuel, Maintenance) */}
      {logModalEq && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-500" /> Log Equipment Activity
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{logModalEq.id} - {logModalEq.name} {logModalEq.licensePlate ? `(${logModalEq.licensePlate})` : ''}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setLogModalEq(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Log Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/50 px-4 pt-3 gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setLogTab('Mileage')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition-colors border-t border-x whitespace-nowrap ${
                  logTab === 'Mileage' 
                    ? 'bg-white dark:bg-[#1E293B] text-purple-600 dark:text-purple-400 border-slate-200 dark:border-slate-700 border-b-transparent' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-transparent'
                }`}
              >
                <Car className="h-3.5 w-3.5" /> Mileage (km)
              </button>

              <button
                type="button"
                onClick={() => setLogTab('Hours')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition-colors border-t border-x whitespace-nowrap ${
                  logTab === 'Hours' 
                    ? 'bg-white dark:bg-[#1E293B] text-blue-600 dark:text-blue-400 border-slate-200 dark:border-slate-700 border-b-transparent' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-transparent'
                }`}
              >
                <Clock className="h-3.5 w-3.5" /> Engine Hours
              </button>

              <button
                type="button"
                onClick={() => setLogTab('Loads & Trips')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition-colors border-t border-x whitespace-nowrap ${
                  logTab === 'Loads & Trips' 
                    ? 'bg-white dark:bg-[#1E293B] text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 border-b-transparent' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-transparent'
                }`}
              >
                <Boxes className="h-3.5 w-3.5" /> Loads & Trips
              </button>

              <button
                type="button"
                onClick={() => setLogTab('Power Output')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition-colors border-t border-x whitespace-nowrap ${
                  logTab === 'Power Output' 
                    ? 'bg-white dark:bg-[#1E293B] text-amber-600 dark:text-amber-400 border-slate-200 dark:border-slate-700 border-b-transparent' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-transparent'
                }`}
              >
                <Zap className="h-3.5 w-3.5" /> Power (kWh)
              </button>

              <button
                type="button"
                onClick={() => setLogTab('Refuel')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition-colors border-t border-x whitespace-nowrap ${
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
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition-colors border-t border-x whitespace-nowrap ${
                  logTab === 'Maintenance' 
                    ? 'bg-white dark:bg-[#1E293B] text-rose-600 dark:text-rose-400 border-slate-200 dark:border-slate-700 border-b-transparent' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-transparent'
                }`}
              >
                <Wrench className="h-3.5 w-3.5" /> Maintenance
              </button>
            </div>

            <form onSubmit={handleLogSubmit} className="p-6 overflow-y-auto space-y-4">
              {logTab === 'Mileage' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Distance Travelled Today (km)</label>
                      <input 
                        type="number" 
                        value={logMileageAdded} 
                        onChange={e => {
                          const dist = Number(e.target.value);
                          setLogMileageAdded(dist);
                          setLogOdometerReading((logModalEq.mileage || 0) + dist);
                        }} 
                        required
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-purple-600 dark:text-purple-400 font-bold focus:outline-none focus:border-purple-500" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">New Odometer Reading (km)</label>
                      <input 
                        type="number" 
                        value={logOdometerReading} 
                        onChange={e => setLogOdometerReading(Number(e.target.value))} 
                        required
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-500" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Trip / Route Description</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Quarry to Site Section B"
                        value={logTripRoute} 
                        onChange={e => setLogTripRoute(e.target.value)} 
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-500" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Driver / Operator Name</label>
                      <input 
                        type="text" 
                        value={logDriverOperator} 
                        onChange={e => setLogDriverOperator(e.target.value)} 
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-500" 
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-xl text-xs text-purple-700 dark:text-purple-300">
                    Previous Mileage: <strong>{(logModalEq.mileage || 0).toLocaleString()} km</strong> ➔ Updated Mileage: <strong>{((logModalEq.mileage || 0) + Number(logMileageAdded)).toLocaleString()} km</strong>
                  </div>
                </>
              )}

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
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Hours Worked Today</label>
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

              {logTab === 'Loads & Trips' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Number of Loads / Trips</label>
                      <input 
                        type="number" 
                        value={logLoadsAdded} 
                        onChange={e => setLogLoadsAdded(Number(e.target.value))} 
                        required
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-indigo-600 dark:text-indigo-400 font-bold focus:outline-none focus:border-indigo-500" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Material Hauled</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Sub-base G2 Crushed Stone / Soil"
                        value={logMaterialHauled} 
                        onChange={e => setLogMaterialHauled(e.target.value)} 
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Total Weight Hauled (Tonnes - Optional)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 180"
                        value={logLoadWeightTonnes} 
                        onChange={e => setLogLoadWeightTonnes(e.target.value ? Number(e.target.value) : '')} 
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Trip Distance (km - Optional)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 45"
                        value={logMileageAdded} 
                        onChange={e => setLogMileageAdded(Number(e.target.value))} 
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl text-xs text-indigo-700 dark:text-indigo-300">
                    Previous Total Loads: <strong>{(logModalEq.totalLoads || 0).toLocaleString()}</strong> ➔ Updated Loads: <strong>{((logModalEq.totalLoads || 0) + Number(logLoadsAdded)).toLocaleString()}</strong>
                  </div>
                </>
              )}

              {logTab === 'Power Output' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Power Generated (kWh)</label>
                      <input 
                        type="number" 
                        value={logPowerKWhAdded} 
                        onChange={e => setLogPowerKWhAdded(Number(e.target.value))} 
                        required
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-amber-600 dark:text-amber-400 font-bold focus:outline-none focus:border-amber-500" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Generator Load (%)</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        value={logGeneratorLoadPercent} 
                        onChange={e => setLogGeneratorLoadPercent(Number(e.target.value))} 
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Runtime Hours</label>
                      <input 
                        type="number" 
                        step="0.5"
                        value={logHoursAdded} 
                        onChange={e => setLogHoursAdded(Number(e.target.value))} 
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Operator / Site Tech</label>
                      <input 
                        type="text" 
                        value={logLoggedBy} 
                        onChange={e => setLogLoggedBy(e.target.value)} 
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500" 
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-300">
                    Cumulative Power Generated: <strong>{(logModalEq.totalPowerKWh || 0).toLocaleString()} kWh</strong> ➔ Updated: <strong>{((logModalEq.totalPowerKWh || 0) + Number(logPowerKWhAdded)).toLocaleString()} kWh</strong>
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
