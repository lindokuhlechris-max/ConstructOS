import React, { useState } from 'react';
import { Card, Button, Badge, CustomSelect } from '../ui';
import { Truck, Plus, Wrench, Fuel, Clock, CheckCircle2, ArrowLeft, Edit3, Trash2, ClipboardList, X, Building2, Handshake, CircleDollarSign } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Equipment as EquipmentType, EquipmentLog, EquipmentStatus, EquipmentLogType, EquipmentOwnership } from '../../types';
import { RemindersWidget } from '../RemindersWidget';
import { formatRand, formatRandShort, calculateEquipmentCosts } from '../../pages/Equipment';

interface EquipmentModuleProps {
  onBack: () => void;
}

export function EquipmentModule({ onBack }: EquipmentModuleProps) {
  const { equipment, equipmentLogs, addEquipment, updateEquipment, deleteEquipment, addEquipmentLog } = useAppContext();

  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<string>('All');
  const [ownershipFilter, setOwnershipFilter] = useState<'All' | 'Owned' | 'Rented'>('All');
  const [editingEq, setEditingEq] = useState<EquipmentType | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [logModalEq, setLogModalEq] = useState<EquipmentType | null>(null);
  const [logTab, setLogTab] = useState<EquipmentLogType>('Hours');

  // Form states
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Earthmoving');
  const [newOperator, setNewOperator] = useState('');
  const [newLocation, setNewLocation] = useState('Zone A');
  const [newStatus, setNewStatus] = useState<EquipmentStatus>('Operating');
  const [newVinSerial, setNewVinSerial] = useState('');
  const [newAccessories, setNewAccessories] = useState('');
  const [newOwnership, setNewOwnership] = useState<EquipmentOwnership>('Owned');
  const [newRentalVendor, setNewRentalVendor] = useState('');
  const [newTrackOperationalCost, setNewTrackOperationalCost] = useState<boolean>(false);
  const [newHourlyRate, setNewHourlyRate] = useState<number | ''>('');

  // Log states
  const [logHours, setLogHours] = useState(8);
  const [logStartTime, setLogStartTime] = useState('07:00');
  const [logEndTime, setLogEndTime] = useState('15:00');
  const [logHourlyRateApplied, setLogHourlyRateApplied] = useState<number | ''>('');
  const [logFuelLitres, setLogFuelLitres] = useState(100);
  const [logFuelLevel, setLogFuelLevel] = useState(100);
  const [logMaintType, setLogMaintType] = useState('Routine Service');
  const [logCost, setLogCost] = useState<number | ''>('');
  const [logNotes, setLogNotes] = useState('');
  const [logUser, setLogUser] = useState('');

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
    const calc = calculateHoursFromTimes(time, logEndTime);
    setLogHours(calc);
  };

  const handleEndTimeChange = (time: string) => {
    setLogEndTime(time);
    const calc = calculateHoursFromTimes(logStartTime, time);
    setLogHours(calc);
  };

  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const newItem: EquipmentType = {
      id: `EQ-${Math.floor(100 + Math.random() * 900)}`,
      name: newName,
      type: newCategory,
      category: newCategory,
      operator: newOperator || 'Unassigned',
      status: newStatus,
      engineHours: 0,
      fuelLevel: 100,
      location: newLocation || 'Zone A',
      lastService: new Date().toISOString().split('T')[0],
      vinSerial: newVinSerial,
      accessories: newAccessories,
      ownership: newOwnership,
      rentalVendor: newOwnership === 'Rented' ? newRentalVendor : undefined,
      trackOperationalCost: newTrackOperationalCost,
      hourlyRate: newTrackOperationalCost && newHourlyRate !== '' ? Number(newHourlyRate) : 0,
    };

    addEquipment(newItem);
    setIsAdding(false);
    setNewName('');
    setNewOperator('');
    setNewVinSerial('');
    setNewAccessories('');
    setNewOwnership('Owned');
    setNewRentalVendor('');
    setNewTrackOperationalCost(false);
    setNewHourlyRate('');
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEq || !newName) return;

    updateEquipment({
      ...editingEq,
      name: newName,
      type: newCategory,
      category: newCategory,
      operator: newOperator || 'Unassigned',
      location: newLocation,
      status: newStatus,
      vinSerial: newVinSerial,
      accessories: newAccessories,
      ownership: newOwnership,
      rentalVendor: newOwnership === 'Rented' ? newRentalVendor : undefined,
      trackOperationalCost: newTrackOperationalCost,
      hourlyRate: newTrackOperationalCost && newHourlyRate !== '' ? Number(newHourlyRate) : 0,
    });

    setEditingEq(null);
  };

  const openEdit = (item: EquipmentType) => {
    setEditingEq(item);
    setNewName(item.name);
    setNewCategory(item.type || 'Earthmoving');
    setNewOperator(item.operator);
    setNewLocation(item.location);
    setNewStatus(item.status);
    setNewVinSerial(item.vinSerial || item.serialNumber || '');
    setNewAccessories(item.accessories || '');
    setNewOwnership(item.ownership || 'Owned');
    setNewRentalVendor(item.rentalVendor || '');
    const hasRate = (item.hourlyRate !== undefined && item.hourlyRate > 0) || item.trackOperationalCost === true;
    setNewTrackOperationalCost(item.trackOperationalCost !== undefined ? item.trackOperationalCost : hasRate);
    setNewHourlyRate(item.hourlyRate !== undefined && item.hourlyRate > 0 ? item.hourlyRate : (item.hourlyRate === 0 ? 0 : ''));
  };

  const openLog = (item: EquipmentType) => {
    setLogModalEq(item);
    setLogTab('Hours');
    setLogStartTime('07:00');
    setLogEndTime('15:00');
    setLogHours(8);
    const rateToApply = (item.trackOperationalCost !== false && item.hourlyRate && item.hourlyRate > 0) ? item.hourlyRate : '';
    setLogHourlyRateApplied(rateToApply);
    setLogFuelLitres(100);
    setLogFuelLevel(item.fuelLevel ?? 100);
    setLogMaintType('Routine Service');
    setLogCost('');
    setLogNotes('');
    setLogUser(item.operator !== 'Unassigned' ? item.operator : 'Operator');
  };

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logModalEq) return;

    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`;
    const appliedRate = logHourlyRateApplied !== '' ? Number(logHourlyRateApplied) : ((logModalEq.trackOperationalCost !== false && logModalEq.hourlyRate) ? logModalEq.hourlyRate : 0);

    const newLog: EquipmentLog = {
      id: `EQL-${Math.floor(1000 + Math.random() * 9000)}`,
      equipmentId: logModalEq.id,
      type: logTab,
      date: formattedDate,
      loggedBy: logUser || 'Operator',
      notes: logNotes,
      hourlyRateApplied: appliedRate,
    };

    if (logTab === 'Hours') {
      newLog.hoursAdded = logHours;
      newLog.calculatedOperatingCost = logHours * appliedRate;
    } else if (logTab === 'Refuel') {
      newLog.fuelLitres = logFuelLitres;
      newLog.fuelLevelAfter = logFuelLevel;
      const fuelTotal = logCost !== '' ? Number(logCost) : logFuelLitres * 23.50;
      newLog.fuelCost = fuelTotal;
      newLog.cost = fuelTotal;
    } else if (logTab === 'Maintenance') {
      newLog.maintenanceType = logMaintType;
      if (logCost !== '') newLog.cost = Number(logCost);
    }

    addEquipmentLog(newLog);
    setLogModalEq(null);
  };

  const filtered = equipment.filter(item => {
    const matchesStatus = filter === 'All' || item.status === filter;
    const matchesOwnership = 
      ownershipFilter === 'All' ||
      (ownershipFilter === 'Owned' && (item.ownership === 'Owned' || !item.ownership)) ||
      (ownershipFilter === 'Rented' && item.ownership === 'Rented');
    return matchesStatus && matchesOwnership;
  });

  const getStatusBadge = (status: EquipmentStatus) => {
    switch (status) {
      case 'Operating':
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200">Operating</Badge>;
      case 'Idle':
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200">Idle</Badge>;
      case 'Maintenance':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200">Maintenance</Badge>;
      case 'Out of Service':
        return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200">Out of Service</Badge>;
    }
  };

  const totalFleetCost = equipment.reduce((sum, eq) => sum + calculateEquipmentCosts(eq, equipmentLogs).totalCost, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={onBack} className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Equipment Tracking</h1>
            <p className="text-slate-500 text-sm">Monitor fleet availability, rented machinery, rates (ZAR), and running costs.</p>
          </div>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} className="gap-2 bg-[#0B5FFF] rounded-xl">
          <Plus className="h-4 w-4" /> Add Equipment
        </Button>
      </div>

      {isAdding && (
        <Card className="p-4 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
          <form onSubmit={handleAddEquipment} className="flex flex-col gap-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Register New Fleet Equipment</h3>
            
            {/* Ownership Switcher */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setNewOwnership('Owned')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  newOwnership === 'Owned' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Building2 className="h-4 w-4" /> Company Owned
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewOwnership('Rented');
                  setNewTrackOperationalCost(true);
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  newOwnership === 'Rented' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Handshake className="h-4 w-4" /> Hired / Rented
              </button>
            </div>

            {/* Toggle Operational Cost Tracking */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CircleDollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Track Operational Costs</p>
                  <p className="text-[11px] text-slate-500">Enable hourly rate & shift cost calculation</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={newTrackOperationalCost}
                onClick={() => setNewTrackOperationalCost(!newTrackOperationalCost)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  newTrackOperationalCost ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  newTrackOperationalCost ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Equipment Name / Model (e.g., CAT 320 Excavator)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
              />
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
              >
                <option value="Earthmoving">Earthmoving</option>
                <option value="Concrete">Concrete</option>
                <option value="Lifting">Lifting</option>
                <option value="Compaction">Compaction</option>
                <option value="Generator/Power">Generator/Power</option>
              </select>

              {newTrackOperationalCost && (
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Hourly Rate (Rands/hr)"
                    value={newHourlyRate}
                    onChange={e => setNewHourlyRate(e.target.value ? Number(e.target.value) : '')}
                    className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold text-emerald-600 dark:text-emerald-400 flex-1"
                  />
                </div>
              )}

              {newOwnership === 'Rented' ? (
                <input
                  type="text"
                  placeholder="Rental Supplier (e.g. Barloworld / Coastal Hire)"
                  value={newRentalVendor}
                  onChange={e => setNewRentalVendor(e.target.value)}
                  required
                  className="h-10 px-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              ) : (
                <input
                  type="text"
                  placeholder="Assigned Operator Name"
                  value={newOperator}
                  onChange={e => setNewOperator(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                />
              )}

              <input
                type="text"
                placeholder="Current Site Location (e.g., Zone C)"
                value={newLocation}
                onChange={e => setNewLocation(e.target.value)}
                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
              />
              <input
                type="text"
                placeholder="VIN / Serial Number"
                value={newVinSerial}
                onChange={e => setNewVinSerial(e.target.value)}
                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
              />
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <Button type="button" variant="outline" onClick={() => setIsAdding(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button type="submit" className="bg-[#0B5FFF] rounded-xl text-xs font-semibold px-4">
                Save Equipment
              </Button>
            </div>
          </form>
        </Card>
      )}

      <RemindersWidget moduleName="Equipment" />

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{equipment.length}</div>
              <div className="text-xs text-slate-500">Total Units</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{equipment.filter(e => e.status === 'Operating').length}</div>
              <div className="text-xs text-slate-500">Active Units</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30">
              <Handshake className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{equipment.filter(e => e.ownership === 'Rented').length}</div>
              <div className="text-xs text-slate-500">Hired / Rented</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30">
              <CircleDollarSign className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-black truncate">{formatRandShort(totalFleetCost)}</div>
              <div className="text-xs text-slate-500">Fleet Cost (ZAR)</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/30">
              <Fuel className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {equipment.length > 0 ? Math.round(equipment.reduce((acc, e) => acc + (e.fuelLevel ?? 50), 0) / equipment.length) : 0}%
              </div>
              <div className="text-xs text-slate-500">Avg Fuel Level</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {['All', 'Operating', 'Idle', 'Maintenance'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                filter === status
                  ? 'bg-[#0B5FFF] text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] mr-1">Ownership:</span>
          {(['All', 'Owned', 'Rented'] as const).map(own => (
            <button
              key={own}
              onClick={() => setOwnershipFilter(own)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                ownershipFilter === own
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {own}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(item => {
          const costs = calculateEquipmentCosts(item, equipmentLogs);

          return (
            <Card key={item.id} className="p-4 flex flex-col justify-between gap-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono text-slate-400">{item.id}</span>
                    {item.ownership === 'Rented' ? (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold border border-amber-500/30">
                        🤝 Hired: {item.rentalVendor || 'Supplier'}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[10px] font-semibold border border-blue-500/20">
                        🏢 Owned
                      </span>
                    )}
                    <Badge variant="outline" className="text-[10px]">{item.type || item.category}</Badge>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{item.name}</h3>
                </div>
                {getStatusBadge(item.status)}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px]">Operator</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{item.operator}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Location</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{item.location}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Engine Hours</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{item.engineHours} hrs</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">
                    {costs.isCostTrackingEnabled && costs.hourlyRate > 0 ? 'Operating Rate' : 'Cost Tracking'}
                  </span>
                  <span className={`font-bold ${costs.isCostTrackingEnabled && costs.hourlyRate > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                    {costs.isCostTrackingEnabled && costs.hourlyRate > 0 ? `${formatRandShort(costs.hourlyRate)}/hr` : 'Off'}
                  </span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-slate-400 text-[10px]">Total Logged Cost</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">{formatRand(costs.totalCost)}</span>
                </div>
              </div>

              {/* Fuel Bar */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1"><Fuel className="h-3 w-3" /> Fuel Tank</span>
                  <span>{item.fuelLevel}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      item.fuelLevel < 25 ? 'bg-red-500' : item.fuelLevel < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${item.fuelLevel}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <Button size="sm" variant="outline" onClick={() => openLog(item)} className="h-7 text-xs text-blue-600 dark:text-blue-400 rounded-lg gap-1">
                  <ClipboardList className="h-3 w-3" /> Log Activity
                </Button>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(item)} className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100">
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeletingId(item.id)} className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingEq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Edit Equipment ({editingEq.id})</h3>
            <form onSubmit={handleEditSave} className="space-y-3">
              <div>
                <label className="text-xs text-slate-500">Equipment Name</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} required className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">Category</label>
                  <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full h-9 px-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent">
                    <option value="Earthmoving">Earthmoving</option>
                    <option value="Concrete">Concrete</option>
                    <option value="Lifting">Lifting</option>
                    <option value="Compaction">Compaction</option>
                    <option value="Generator/Power">Generator/Power</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Ownership</label>
                  <select value={newOwnership} onChange={e => setNewOwnership(e.target.value as EquipmentOwnership)} className="w-full h-9 px-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent">
                    <option value="Owned">Company Owned</option>
                    <option value="Rented">Hired / Rented</option>
                  </select>
                </div>
              </div>

              {/* Toggle Operational Cost Tracking */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Track Operational Costs</p>
                    <p className="text-[10px] text-slate-500">Hourly rate & cost tracking</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={newTrackOperationalCost}
                  onClick={() => setNewTrackOperationalCost(!newTrackOperationalCost)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    newTrackOperationalCost ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    newTrackOperationalCost ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {newTrackOperationalCost && (
                <div>
                  <label className="text-xs text-slate-500">Hourly Rate (R/hr)</label>
                  <input type="number" placeholder="0" value={newHourlyRate} onChange={e => setNewHourlyRate(e.target.value !== '' ? Number(e.target.value) : '')} className="w-full h-9 px-2 text-sm font-bold text-emerald-600 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent" />
                </div>
              )}

              {newOwnership === 'Rented' && (
                <div>
                  <label className="text-xs text-slate-500">Rental Vendor</label>
                  <input type="text" value={newRentalVendor} onChange={e => setNewRentalVendor(e.target.value)} placeholder="Supplier name" className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">Operator</label>
                  <input type="text" value={newOperator} onChange={e => setNewOperator(e.target.value)} className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Location</label>
                  <input type="text" value={newLocation} onChange={e => setNewLocation(e.target.value)} className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingEq(null)}>Cancel</Button>
                <Button type="submit" className="bg-[#0B5FFF]">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Delete Equipment</h3>
            <p className="text-xs text-slate-500">Are you sure you want to delete equipment {deletingId}? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
              <Button onClick={() => { deleteEquipment(deletingId); setDeletingId(null); }} className="bg-rose-600 text-white">Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* Log Modal */}
      {logModalEq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Log Activity ({logModalEq.id})</h3>
              <Button variant="ghost" size="icon" onClick={() => setLogModalEq(null)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold gap-2">
              <button onClick={() => setLogTab('Hours')} className={`pb-2 px-2 border-b-2 ${logTab === 'Hours' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400'}`}>Hours & Cost</button>
              <button onClick={() => setLogTab('Refuel')} className={`pb-2 px-2 border-b-2 ${logTab === 'Refuel' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400'}`}>Refueling</button>
              <button onClick={() => setLogTab('Maintenance')} className={`pb-2 px-2 border-b-2 ${logTab === 'Maintenance' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400'}`}>Maintenance & Wash</button>
            </div>
            <form onSubmit={handleLogSubmit} className="space-y-3 text-xs">
              {logTab === 'Hours' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-500 font-semibold block mb-1">Start Time</label>
                      <input 
                        type="time" 
                        value={logStartTime} 
                        onChange={e => handleStartTimeChange(e.target.value)} 
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm" 
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 font-semibold block mb-1">End Time</label>
                      <input 
                        type="time" 
                        value={logEndTime} 
                        onChange={e => handleEndTimeChange(e.target.value)} 
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-500 font-semibold block mb-1">Hours Worked Today</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        value={logHours} 
                        onChange={e => setLogHours(Number(e.target.value))} 
                        required 
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm font-bold text-[#0B5FFF]" 
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 font-semibold block mb-1">Rate (Rands/hr)</label>
                      <input 
                        type="number" 
                        placeholder="0"
                        value={logHourlyRateApplied} 
                        onChange={e => setLogHourlyRateApplied(e.target.value ? Number(e.target.value) : '')} 
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm font-bold text-emerald-600" 
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-bold flex justify-between">
                    <span>Shift Operating Cost:</span>
                    <span>{formatRand(Number(logHours || 0) * (logHourlyRateApplied !== '' ? Number(logHourlyRateApplied) : 0))}</span>
                  </div>
                </div>
              )}
              {logTab === 'Refuel' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500">Litres Added</label>
                    <input type="number" value={logFuelLitres} onChange={e => setLogFuelLitres(Number(e.target.value))} required className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm" />
                  </div>
                  <div>
                    <label className="text-slate-500">New Fuel Level %</label>
                    <input type="number" min="0" max="100" value={logFuelLevel} onChange={e => setLogFuelLevel(Number(e.target.value))} required className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm" />
                  </div>
                </div>
              )}
              {logTab === 'Maintenance' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 font-semibold block mb-1">Service Type</label>
                    <CustomSelect 
                      value={logMaintType} 
                      onChange={val => setLogMaintType(val)} 
                      options={[
                        'Wash / Jet Cleaning',
                        'Routine Service',
                        'Oil & Filter Change',
                        'Hydraulic System Repair',
                        'Tire / Track Maintenance',
                        'Engine Overhaul',
                        'Safety Inspection',
                        'Battery & Electrical Check',
                        'Greasing & Lubrication'
                      ]}
                      className="w-full h-9 bg-transparent rounded-lg border border-slate-200 dark:border-slate-800 text-sm" 
                      customPlaceholder="Enter custom service type..."
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 font-semibold block mb-1">Cost (Rands - ZAR)</label>
                    <input type="number" value={logCost} onChange={e => setLogCost(e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 3500" className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm font-bold text-emerald-600" />
                  </div>
                </div>
              )}
              <div>
                <label className="text-slate-500">Logged By</label>
                <input type="text" value={logUser} onChange={e => setLogUser(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm" />
              </div>
              <div>
                <label className="text-slate-500">Notes</label>
                <textarea rows={2} value={logNotes} onChange={e => setLogNotes(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setLogModalEq(null)}>Cancel</Button>
                <Button type="submit" className="bg-[#0B5FFF]">Save Log</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
