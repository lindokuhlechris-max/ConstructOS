import React, { useState, useMemo } from 'react';
import { Card, Button, Badge, CustomSelect } from '../ui';
import { 
  Building2, Plus, Bed, Users, Zap, Droplets, Flame, Wifi, 
  Trash2, Edit3, ArrowLeft, Download, Search, CheckCircle2, 
  AlertCircle, Shield, Home, Clock, Sparkles, Fuel, UserPlus, 
  ExternalLink, Calendar, MapPin, Phone, Receipt, DollarSign,
  Briefcase
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { 
  AccommodationUnit, AccommodationUtilityLog, AccommodationType, 
  AccommodationOwnership, AccommodationStatus, UtilityType, Employee 
} from '../../types';

interface AccommodationModuleProps {
  onBack?: () => void;
}

export function AccommodationModule({ onBack }: AccommodationModuleProps) {
  const { 
    accommodations, 
    accommodationUtilities, 
    employees, 
    projects,
    addAccommodation, 
    updateAccommodation, 
    deleteAccommodation,
    assignEmployeeToAccommodation,
    removeEmployeeFromAccommodation,
    addAccommodationUtility, 
    deleteAccommodationUtility,
    currency
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<'properties' | 'utilities' | 'roster'>('properties');
  const [searchTerm, setSearchTerm] = useState('');
  const [ownershipFilter, setOwnershipFilter] = useState<'All' | 'Owned' | 'Rented'>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modals
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<AccommodationUnit | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTargetUnit, setAssignTargetUnit] = useState<AccommodationUnit | null>(null);
  const [isUtilityModalOpen, setIsUtilityModalOpen] = useState(false);
  const [utilityTargetUnit, setUtilityTargetUnit] = useState<AccommodationUnit | null>(null);
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);

  // Unit Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<AccommodationType>('Site Camp / Modular Cabin');
  const [formOwnership, setFormOwnership] = useState<AccommodationOwnership>('Owned');
  const [formLocation, setFormLocation] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCapacity, setFormCapacity] = useState<number>(4);
  const [formProjectId, setFormProjectId] = useState<string>('');
  const [formStatus, setFormStatus] = useState<AccommodationStatus>('Available');
  const [formRentalVendor, setFormRentalVendor] = useState('');
  const [formRentalAgreementNumber, setFormRentalAgreementNumber] = useState('');
  const [formRentalStartDate, setFormRentalStartDate] = useState('');
  const [formRentalEndDate, setFormRentalEndDate] = useState('');
  const [formRentalMonthlyCost, setFormRentalMonthlyCost] = useState<number | ''>('');
  const [formRentalDepositPaid, setFormRentalDepositPaid] = useState<number | ''>('');
  const [formRentalBillingCycle, setFormRentalBillingCycle] = useState<'Monthly' | 'Weekly' | 'Daily'>('Monthly');
  const [formAmenities, setFormAmenities] = useState<string[]>([]);
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formContactPhone, setFormContactPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Assign Form state
  const [assignEmployeeId, setAssignEmployeeId] = useState('');
  const [assignRoomNumber, setAssignRoomNumber] = useState('');

  // Utility Form state
  const [utilAccId, setUtilAccId] = useState('');
  const [utilType, setUtilType] = useState<UtilityType>('Electricity / Eskom Tokens');
  const [utilDate, setUtilDate] = useState(new Date().toISOString().split('T')[0]);
  const [utilAmount, setUtilAmount] = useState<number | ''>('');
  const [utilUnitsConsumed, setUtilUnitsConsumed] = useState<number | ''>('');
  const [utilUnitLabel, setUtilUnitLabel] = useState('kWh');
  const [utilVendor, setUtilVendor] = useState('');
  const [utilInvoiceNo, setUtilInvoiceNo] = useState('');
  const [utilPaidStatus, setUtilPaidStatus] = useState<'Paid' | 'Pending' | 'Overdue'>('Paid');
  const [utilNotes, setUtilNotes] = useState('');

  // Predefined amenities list
  const AVAILABLE_AMENITIES = [
    'WiFi & Internet',
    'Aircon / Heating',
    'Generator Backup',
    'Water Tank / Borehole',
    'Kitchenette / Dining',
    'En-suite Bathroom',
    'Laundry Facility',
    '24/7 Security Guard',
    'CCTV Monitoring',
    'Parking Bay'
  ];

  // Helper formatting in ZAR
  const formatZAR = (amount: number) => {
    return `R ${Number(amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatZARShort = (amount: number) => {
    if (amount >= 1_000_000) return `R ${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `R ${(amount / 1_000).toFixed(1)}k`;
    return `R ${Math.round(amount)}`;
  };

  // KPIs Calculations
  const stats = useMemo(() => {
    const totalUnits = accommodations.length;
    const ownedUnits = accommodations.filter(a => a.ownership === 'Owned').length;
    const rentedUnits = accommodations.filter(a => a.ownership === 'Rented').length;
    
    const totalBeds = accommodations.reduce((sum, a) => sum + (a.totalCapacityBeds || 0), 0);
    const occupiedBeds = accommodations.reduce((sum, a) => sum + (a.occupantIds?.length || 0), 0);
    const availableBeds = Math.max(0, totalBeds - occupiedBeds);
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    const monthlyRentalCommitment = accommodations
      .filter(a => a.ownership === 'Rented')
      .reduce((sum, a) => sum + (a.rentalMonthlyCost || 0), 0);

    const totalUtilitiesCost = accommodationUtilities.reduce((sum, u) => sum + (u.amountZAR || 0), 0);

    return {
      totalUnits,
      ownedUnits,
      rentedUnits,
      totalBeds,
      occupiedBeds,
      availableBeds,
      occupancyRate,
      monthlyRentalCommitment,
      totalUtilitiesCost
    };
  }, [accommodations, accommodationUtilities]);

  // Filtered Accommodations
  const filteredAccommodations = useMemo(() => {
    return accommodations.filter(unit => {
      const matchesSearch = 
        unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (unit.rentalVendor && unit.rentalVendor.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesOwnership = ownershipFilter === 'All' || unit.ownership === ownershipFilter;
      const matchesType = typeFilter === 'All' || unit.type === typeFilter;
      const matchesStatus = statusFilter === 'All' || unit.status === statusFilter;

      return matchesSearch && matchesOwnership && matchesType && matchesStatus;
    });
  }, [accommodations, searchTerm, ownershipFilter, typeFilter, statusFilter]);

  // Open Edit Unit Modal
  const handleOpenEdit = (unit: AccommodationUnit) => {
    setEditingUnit(unit);
    setFormName(unit.name);
    setFormType(unit.type);
    setFormOwnership(unit.ownership);
    setFormLocation(unit.location);
    setFormAddress(unit.address || '');
    setFormCapacity(unit.totalCapacityBeds);
    setFormProjectId(unit.projectId || '');
    setFormStatus(unit.status);
    setFormRentalVendor(unit.rentalVendor || '');
    setFormRentalAgreementNumber(unit.rentalAgreementNumber || '');
    setFormRentalStartDate(unit.rentalStartDate || '');
    setFormRentalEndDate(unit.rentalEndDate || '');
    setFormRentalMonthlyCost(unit.rentalMonthlyCost || '');
    setFormRentalDepositPaid(unit.rentalDepositPaid || '');
    setFormRentalBillingCycle(unit.rentalBillingCycle || 'Monthly');
    setFormAmenities(unit.amenities || []);
    setFormContactPerson(unit.contactPerson || '');
    setFormContactPhone(unit.contactPhone || '');
    setFormNotes(unit.notes || '');
    setIsUnitModalOpen(true);
  };

  // Open Create Unit Modal
  const handleOpenCreate = () => {
    setEditingUnit(null);
    setFormName('');
    setFormType('Site Camp / Modular Cabin');
    setFormOwnership('Owned');
    setFormLocation('Main Site Village');
    setFormAddress('');
    setFormCapacity(4);
    setFormProjectId(projects[0]?.id || '');
    setFormStatus('Available');
    setFormRentalVendor('');
    setFormRentalAgreementNumber('');
    setFormRentalStartDate('');
    setFormRentalEndDate('');
    setFormRentalMonthlyCost('');
    setFormRentalDepositPaid('');
    setFormRentalBillingCycle('Monthly');
    setFormAmenities(['WiFi & Internet', 'Generator Backup', 'Water Tank / Borehole']);
    setFormContactPerson('');
    setFormContactPhone('');
    setFormNotes('');
    setIsUnitModalOpen(true);
  };

  // Save Accommodation Unit
  const handleSaveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const unitData: AccommodationUnit = {
      id: editingUnit ? editingUnit.id : `ACC-${Math.floor(100 + Math.random() * 900)}`,
      name: formName.trim(),
      type: formType,
      ownership: formOwnership,
      location: formLocation.trim() || 'Site Area',
      address: formAddress.trim() || undefined,
      totalCapacityBeds: Number(formCapacity) || 1,
      occupantIds: editingUnit ? editingUnit.occupantIds : [],
      status: formStatus,
      projectId: formProjectId || undefined,
      projectName: projects.find(p => p.id === formProjectId)?.name,
      rentalVendor: formOwnership === 'Rented' ? formRentalVendor.trim() || undefined : undefined,
      rentalAgreementNumber: formOwnership === 'Rented' ? formRentalAgreementNumber.trim() || undefined : undefined,
      rentalStartDate: formOwnership === 'Rented' ? formRentalStartDate || undefined : undefined,
      rentalEndDate: formOwnership === 'Rented' ? formRentalEndDate || undefined : undefined,
      rentalMonthlyCost: formOwnership === 'Rented' && formRentalMonthlyCost !== '' ? Number(formRentalMonthlyCost) : undefined,
      rentalDepositPaid: formOwnership === 'Rented' && formRentalDepositPaid !== '' ? Number(formRentalDepositPaid) : undefined,
      rentalBillingCycle: formOwnership === 'Rented' ? formRentalBillingCycle : undefined,
      amenities: formAmenities,
      contactPerson: formContactPerson.trim() || undefined,
      contactPhone: formContactPhone.trim() || undefined,
      notes: formNotes.trim() || undefined,
      createdAt: editingUnit?.createdAt || new Date().toISOString().split('T')[0]
    };

    if (editingUnit) {
      updateAccommodation(unitData);
    } else {
      addAccommodation(unitData);
    }

    setIsUnitModalOpen(false);
  };

  // Open Assign Modal
  const handleOpenAssign = (unit: AccommodationUnit) => {
    setAssignTargetUnit(unit);
    setAssignEmployeeId('');
    setAssignRoomNumber(`Room ${(unit.occupantIds.length || 0) + 1}`);
    setIsAssignModalOpen(true);
  };

  // Save Assign Employee
  const handleSaveAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTargetUnit || !assignEmployeeId) return;

    assignEmployeeToAccommodation(assignTargetUnit.id, assignEmployeeId, assignRoomNumber);
    setIsAssignModalOpen(false);
  };

  // Open Log Utility Modal
  const handleOpenLogUtility = (unit?: AccommodationUnit) => {
    setUtilityTargetUnit(unit || null);
    setUtilAccId(unit ? unit.id : (accommodations[0]?.id || ''));
    setUtilType('Electricity / Eskom Tokens');
    setUtilDate(new Date().toISOString().split('T')[0]);
    setUtilAmount('');
    setUtilUnitsConsumed('');
    setUtilUnitLabel('kWh');
    setUtilVendor('');
    setUtilInvoiceNo('');
    setUtilPaidStatus('Paid');
    setUtilNotes('');
    setIsUtilityModalOpen(true);
  };

  // Save Utility Log
  const handleSaveUtility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!utilAccId || utilAmount === '' || Number(utilAmount) <= 0) return;

    const target = accommodations.find(a => a.id === utilAccId);
    const newLog: AccommodationUtilityLog = {
      id: `ACC-UTL-${Math.floor(1000 + Math.random() * 9000)}`,
      accommodationId: utilAccId,
      accommodationName: target ? target.name : 'Site Camp',
      utilityType: utilType,
      date: utilDate,
      amountZAR: Number(utilAmount),
      unitsConsumed: utilUnitsConsumed !== '' ? Number(utilUnitsConsumed) : undefined,
      unitLabel: utilUnitLabel,
      vendorOrProvider: utilVendor.trim() || undefined,
      invoiceOrReceiptNumber: utilInvoiceNo.trim() || undefined,
      paidStatus: utilPaidStatus,
      loggedBy: 'Site Supervisor',
      notes: utilNotes.trim() || undefined
    };

    addAccommodationUtility(newLog);
    setIsUtilityModalOpen(false);
  };

  // CSV Export for Utilities
  const exportUtilitiesCSV = () => {
    const headers = ['ID', 'Date', 'Facility', 'Utility Category', 'Amount (ZAR)', 'Units Consumed', 'Unit Label', 'Vendor / Provider', 'Invoice / Token #', 'Status', 'Logged By', 'Notes'];
    const rows = accommodationUtilities.map(u => [
      u.id,
      u.date,
      `"${u.accommodationName.replace(/"/g, '""')}"`,
      `"${u.utilityType}"`,
      u.amountZAR,
      u.unitsConsumed || '',
      u.unitLabel || '',
      `"${(u.vendorOrProvider || '').replace(/"/g, '""')}"`,
      `"${(u.invoiceOrReceiptNumber || '').replace(/"/g, '""')}"`,
      u.paidStatus,
      `"${u.loggedBy}"`,
      `"${(u.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Constructfield_Accommodation_Utilities_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Export for Staff Housing Roster
  const exportRosterCSV = () => {
    const headers = ['Employee ID', 'Name', 'Role', 'Department', 'Phone', 'Facility ID', 'Facility Name', 'Ownership', 'Room Number', 'Check-in Date'];
    const rows: string[][] = [];

    accommodations.forEach(acc => {
      acc.occupantIds.forEach(empId => {
        const emp = employees.find(e => e.id === empId);
        if (emp) {
          rows.push([
            emp.id,
            `"${emp.name.replace(/"/g, '""')}"`,
            `"${emp.role.replace(/"/g, '""')}"`,
            `"${emp.department || ''}"`,
            `"${emp.phone || ''}"`,
            acc.id,
            `"${acc.name.replace(/"/g, '""')}"`,
            acc.ownership,
            `"${emp.accommodationDetails?.roomNumber || 'Room 1'}"`,
            `"${emp.accommodationDetails?.checkInDate || acc.createdAt || ''}"`
          ]);
        }
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Constructfield_Staff_Housing_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Utility category badge icon
  const getUtilityIcon = (type: UtilityType) => {
    switch (type) {
      case 'Electricity / Eskom Tokens': return <Zap className="w-4 h-4 text-amber-500" />;
      case 'Water & Sanitation': return <Droplets className="w-4 h-4 text-cyan-500" />;
      case 'Camp Generator Diesel': return <Fuel className="w-4 h-4 text-orange-500" />;
      case 'LPG Gas / Cooking': return <Flame className="w-4 h-4 text-rose-500" />;
      case 'WiFi & Internet': return <Wifi className="w-4 h-4 text-indigo-500" />;
      case 'Cleaning & Laundry': return <Sparkles className="w-4 h-4 text-emerald-500" />;
      default: return <Receipt className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner / Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                <Home className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Accommodation & Camp Hub</h1>
              <Badge variant="outline" className="border-indigo-400/40 text-indigo-300 bg-indigo-500/10 text-xs px-2.5 py-0.5">
                Constructfield Facilities
              </Badge>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Manage owned site modular camps, rented staff housing, bed capacity allocations, and running utility costs.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={() => handleOpenLogUtility()}
            className="border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-sm gap-2"
          >
            <Zap className="w-4 h-4" />
            Log Utility Bill
          </Button>
          <Button
            variant="primary"
            onClick={handleOpenCreate}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm gap-2 shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            Add Facility / Unit
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Units & Ownership */}
        <Card className="p-5 bg-slate-900/70 border-slate-800 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Facilities</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{stats.totalUnits}</span>
            <span className="text-xs text-slate-400">camps & properties</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Shield className="w-3 h-3" /> {stats.ownedUnits} Owned
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Home className="w-3 h-3" /> {stats.rentedUnits} Rented
            </span>
          </div>
        </Card>

        {/* Card 2: Bed Capacity & Occupancy */}
        <Card className="p-5 bg-slate-900/70 border-slate-800 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bed Capacity & Occupancy</span>
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
              <Bed className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{stats.occupiedBeds} <span className="text-slate-400 text-lg font-normal">/ {stats.totalBeds}</span></span>
            <span className="text-xs text-cyan-400 font-medium">({stats.occupancyRate}% Occupied)</span>
          </div>
          {/* Visual progress bar */}
          <div className="mt-3 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                stats.occupancyRate >= 90 ? 'bg-amber-500' : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
              }`}
              style={{ width: `${Math.min(100, stats.occupancyRate)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-400">
            <span>{stats.availableBeds} beds available</span>
            <span>{stats.occupiedBeds} staff housed</span>
          </div>
        </Card>

        {/* Card 3: Monthly Rental Commitments */}
        <Card className="p-5 bg-slate-900/70 border-slate-800 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Lease Commitments</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-white">{formatZARShort(stats.monthlyRentalCommitment)}</span>
            <span className="text-xs text-slate-400">/ month</span>
          </div>
          <p className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-purple-400" /> Across {stats.rentedUnits} leased property contracts
          </p>
        </Card>

        {/* Card 4: Utilities Spent */}
        <Card className="p-5 bg-slate-900/70 border-slate-800 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Utilities & Running Costs</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-amber-400">{formatZARShort(stats.totalUtilitiesCost)}</span>
            <span className="text-xs text-slate-400">total logged</span>
          </div>
          <p className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-amber-400" /> {accommodationUtilities.length} utility bills & Eskom tokens
          </p>
        </Card>
      </div>

      {/* Main Tabbed Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('properties')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'properties'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Properties & Camps ({accommodations.length})
            </button>
            <button
              onClick={() => setActiveTab('utilities')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'utilities'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Zap className="w-4 h-4" />
              Utilities & Expenses ({accommodationUtilities.length})
            </button>
            <button
              onClick={() => setActiveTab('roster')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'roster'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Staff Housing Roster ({stats.occupiedBeds})
            </button>
          </div>

          {/* Context Action Button per Tab */}
          <div className="flex items-center gap-3">
            {activeTab === 'utilities' && (
              <Button
                variant="outline"
                onClick={exportUtilitiesCSV}
                className="border-slate-700 hover:bg-slate-800 text-slate-300 text-sm gap-2"
              >
                <Download className="w-4 h-4" />
                Export Utilities CSV
              </Button>
            )}
            {activeTab === 'roster' && (
              <Button
                variant="outline"
                onClick={exportRosterCSV}
                className="border-slate-700 hover:bg-slate-800 text-slate-300 text-sm gap-2"
              >
                <Download className="w-4 h-4" />
                Export Roster CSV
              </Button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: PROPERTIES & CAMPS                                                 */}
        {/* ========================================================================= */}
        {activeTab === 'properties' && (
          <div className="space-y-6">
            {/* Search and Filters Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search camp, house, landlord..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Ownership Filter */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                {(['All', 'Owned', 'Rented'] as const).map((own) => (
                  <button
                    key={own}
                    onClick={() => setOwnershipFilter(own)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${
                      ownershipFilter === own 
                        ? 'bg-slate-800 text-white font-semibold shadow' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {own}
                  </button>
                ))}
              </div>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Property Types</option>
                <option value="Site Camp / Modular Cabin">Site Camp / Modular Cabin</option>
                <option value="Container Home / Unit">Container Home / Unit</option>
                <option value="Shared House / Flat">Shared House / Flat</option>
                <option value="Single Room / Lodge">Single Room / Lodge</option>
                <option value="Dormitory / Barracks">Dormitory / Barracks</option>
                <option value="Guest House">Guest House</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Partially Occupied">Partially Occupied</option>
                <option value="Full">Full</option>
                <option value="Under Maintenance">Under Maintenance</option>
              </select>
            </div>

            {/* Properties Grid */}
            {filteredAccommodations.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-300">No accommodation units found</h3>
                <p className="text-slate-500 text-sm mt-1">Try adjusting your search criteria or register a new facility.</p>
                <Button onClick={handleOpenCreate} className="mt-4 bg-indigo-600 text-white text-sm">
                  <Plus className="w-4 h-4 mr-2" /> Add Facility
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredAccommodations.map((unit) => {
                  const occupants = employees.filter(e => unit.occupantIds?.includes(e.id));
                  const vacantBeds = Math.max(0, unit.totalCapacityBeds - (unit.occupantIds?.length || 0));
                  const isFull = vacantBeds === 0;

                  return (
                    <div 
                      key={unit.id}
                      className="bg-slate-950 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-5 transition-all shadow-lg hover:shadow-indigo-500/5 flex flex-col justify-between"
                    >
                      <div>
                        {/* Card Header: Title & Badges */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              {unit.ownership === 'Owned' ? (
                                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-2 py-0.5 flex items-center gap-1">
                                  <Shield className="w-3 h-3" /> Company Owned
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs px-2 py-0.5 flex items-center gap-1">
                                  <Home className="w-3 h-3" /> Leased / Rented
                                </Badge>
                              )}

                              <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs">
                                {unit.type}
                              </Badge>

                              {isFull ? (
                                <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                                  Fully Occupied
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                                  {vacantBeds} Bed{vacantBeds > 1 ? 's' : ''} Vacant
                                </span>
                              )}
                            </div>

                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                              {unit.name}
                            </h3>
                            
                            <p className="text-slate-400 text-xs flex items-center gap-1.5 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-500" />
                              {unit.location} {unit.address ? `• ${unit.address}` : ''}
                            </p>
                          </div>

                          {/* Quick Actions (Edit / Delete) */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(unit)}
                              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition"
                              title="Edit Property"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to remove accommodation facility "${unit.name}"? Any housed employees will be unassigned.`)) {
                                  deleteAccommodation(unit.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                              title="Delete Property"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Rental Lease Info Banner (if Rented) */}
                        {unit.ownership === 'Rented' && (
                          <div className="mt-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-300">
                            <div>
                              <span className="text-slate-500 block">Landlord / Vendor:</span>
                              <span className="font-semibold text-amber-300">{unit.rentalVendor || 'Private Landlord'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Monthly Rent:</span>
                              <span className="font-bold text-white">{formatZAR(unit.rentalMonthlyCost || 0)}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Lease Expiry:</span>
                              <span className="font-medium text-slate-200">
                                {unit.rentalEndDate ? `${unit.rentalEndDate}` : 'Month-to-Month'}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Capacity Bar & Occupant Avatars */}
                        <div className="mt-4 p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                              <Bed className="w-4 h-4 text-indigo-400" /> Capacity: {occupants.length} / {unit.totalCapacityBeds} Beds Occupied
                            </span>
                            <span className="text-slate-400">
                              {Math.round((occupants.length / (unit.totalCapacityBeds || 1)) * 100)}% Full
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                isFull ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                              }`}
                              style={{ width: `${Math.min(100, (occupants.length / (unit.totalCapacityBeds || 1)) * 100)}%` }}
                            />
                          </div>

                          {/* Assigned Staff List */}
                          <div>
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                              <span>Resident Staff</span>
                              {!isFull && (
                                <button
                                  onClick={() => handleOpenAssign(unit)}
                                  className="text-indigo-400 hover:text-indigo-300 text-xs font-normal flex items-center gap-1"
                                >
                                  <UserPlus className="w-3.5 h-3.5" /> + Assign Staff
                                </button>
                              )}
                            </div>

                            {occupants.length === 0 ? (
                              <p className="text-slate-500 text-xs italic">No personnel currently allocated to this unit.</p>
                            ) : (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {occupants.map((emp) => (
                                  <div
                                    key={emp.id}
                                    className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                                  >
                                    <div className="w-5 h-5 rounded-full bg-indigo-600/40 text-indigo-300 font-bold flex items-center justify-center text-[10px]">
                                      {emp.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="font-medium text-white">{emp.name}</span>
                                    <span className="text-slate-400 text-[10px]">({emp.accommodationDetails?.roomNumber || 'Room 1'})</span>
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`Remove ${emp.name} from ${unit.name}?`)) {
                                          removeEmployeeFromAccommodation(unit.id, emp.id);
                                        }
                                      }}
                                      className="text-slate-500 hover:text-rose-400 ml-1"
                                      title="Vacate Bed"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Amenities Tags */}
                        {unit.amenities && unit.amenities.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {unit.amenities.map(am => (
                              <span key={am} className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                                {am}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                        <button
                          onClick={() => handleOpenLogUtility(unit)}
                          className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/20 transition"
                        >
                          <Zap className="w-3.5 h-3.5" /> Log Electricity/Water
                        </button>

                        <button
                          onClick={() => handleOpenAssign(unit)}
                          disabled={isFull}
                          className={`text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                            isFull
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                          }`}
                        >
                          <UserPlus className="w-3.5 h-3.5" /> {isFull ? 'Camp Full' : 'Assign Employee'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: UTILITIES & EXPENSES LEDGER                                        */}
        {/* ========================================================================= */}
        {activeTab === 'utilities' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Accommodation Utilities & Running Costs</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Track Eskom prepaid tokens, municipal water deliveries, camp generator diesel, LPG gas, and WiFi expenses.
                </p>
              </div>

              <Button
                variant="primary"
                onClick={() => handleOpenLogUtility()}
                className="bg-amber-600 hover:bg-amber-500 text-white text-sm gap-2 shadow-lg shadow-amber-600/20 self-start"
              >
                <Plus className="w-4 h-4" /> Log New Utility Bill
              </Button>
            </div>

            {/* Utility Ledger Table */}
            {accommodationUtilities.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                <Zap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-300">No utility expenses logged yet</h3>
                <p className="text-slate-500 text-sm mt-1">Record Eskom electricity tokens, water delivery, generator fuel, or gas bills.</p>
                <Button onClick={() => handleOpenLogUtility()} className="mt-4 bg-amber-600 text-white text-sm">
                  <Plus className="w-4 h-4 mr-2" /> Log Utility Bill
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5">Date</th>
                      <th className="px-4 py-3.5">Facility / Unit</th>
                      <th className="px-4 py-3.5">Utility Type</th>
                      <th className="px-4 py-3.5">Consumption</th>
                      <th className="px-4 py-3.5">Amount (ZAR)</th>
                      <th className="px-4 py-3.5">Vendor / Receipt #</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                    {accommodationUtilities.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-400 font-medium">
                          {log.date}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-white">
                          {log.accommodationName}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200">
                            {getUtilityIcon(log.utilityType)}
                            {log.utilityType}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-300 text-xs">
                          {log.unitsConsumed ? `${log.unitsConsumed.toLocaleString()} ${log.unitLabel || ''}` : '—'}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-bold text-amber-400">
                          {formatZAR(log.amountZAR)}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-400">
                          <div>{log.vendorOrProvider || '—'}</div>
                          {log.invoiceOrReceiptNumber && (
                            <div className="text-[10px] text-slate-500 font-mono">Ref: {log.invoiceOrReceiptNumber}</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <Badge 
                            variant="outline"
                            className={
                              log.paidStatus === 'Paid'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs'
                                : log.paidStatus === 'Pending'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30 text-xs'
                            }
                          >
                            {log.paidStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-right">
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete utility log for ${log.utilityType} (R ${log.amountZAR})?`)) {
                                deleteAccommodationUtility(log.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                            title="Delete Log"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: STAFF HOUSING ROSTER                                              */}
        {/* ========================================================================= */}
        {activeTab === 'roster' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Staff Housing Roster & Room Assignments</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Complete directory of all resident workers and their allocated camp or house rooms.
                </p>
              </div>
            </div>

            {stats.occupiedBeds === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-300">No employees currently housed</h3>
                <p className="text-slate-500 text-sm mt-1">Go to the Properties tab to assign personnel to company camps or staff houses.</p>
                <Button onClick={() => setActiveTab('properties')} className="mt-4 bg-indigo-600 text-white text-sm">
                  View Properties & Camps
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5">Employee</th>
                      <th className="px-4 py-3.5">Role / Dept</th>
                      <th className="px-4 py-3.5">Facility / Camp</th>
                      <th className="px-4 py-3.5">Room #</th>
                      <th className="px-4 py-3.5">Check-In Date</th>
                      <th className="px-4 py-3.5">Contact</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                    {accommodations.flatMap(acc => 
                      acc.occupantIds.map(empId => {
                        const emp = employees.find(e => e.id === empId);
                        if (!emp) return null;

                        return (
                          <tr key={`${acc.id}-${emp.id}`} className="hover:bg-slate-800/40 transition">
                            <td className="px-4 py-3.5 font-bold text-white flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-indigo-600/40 text-indigo-300 font-bold flex items-center justify-center text-xs">
                                {emp.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div>{emp.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{emp.id}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-slate-300 text-xs">
                              <div className="font-medium text-slate-200">{emp.role}</div>
                              <div className="text-slate-500">{emp.department || 'Operations'}</div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-indigo-300">{acc.name}</div>
                              <div className="text-[10px] text-slate-500">{acc.ownership} • {acc.location}</div>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300">
                                {emp.accommodationDetails?.roomNumber || 'Room 1'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-slate-400 text-xs">
                              {emp.accommodationDetails?.checkInDate || acc.createdAt || '2026-01-01'}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-slate-400">
                              {emp.phone || '—'}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-right">
                              <button
                                onClick={() => {
                                  if (window.confirm(`Check out ${emp.name} from ${acc.name}?`)) {
                                    removeEmployeeFromAccommodation(acc.id, emp.id);
                                  }
                                }}
                                className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg border border-rose-500/20 transition"
                              >
                                Vacate Bed
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ).filter(Boolean)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT ACCOMMODATION UNIT                                    */}
      {/* ========================================================================= */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingUnit ? 'Edit Accommodation Unit' : 'Register New Accommodation Facility'}
                  </h3>
                  <p className="text-slate-400 text-xs">Configure site camps, container cabins, or rented staff houses.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsUnitModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Ownership Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Ownership Model *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormOwnership('Owned')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition ${
                      formOwnership === 'Owned'
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Shield className="w-4 h-4" /> Company Owned
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormOwnership('Rented')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition ${
                      formOwnership === 'Rented'
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Home className="w-4 h-4" /> Leased / Rented Property
                  </button>
                </div>
              </div>

              {/* Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Facility / Property Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Central Camp Modular Block A, Polokwane House #2"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Structure Type *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as AccommodationType)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Site Camp / Modular Cabin">Site Camp / Modular Cabin</option>
                    <option value="Container Home / Unit">Container Home / Unit</option>
                    <option value="Shared House / Flat">Shared House / Flat</option>
                    <option value="Single Room / Lodge">Single Room / Lodge</option>
                    <option value="Dormitory / Barracks">Dormitory / Barracks</option>
                    <option value="Guest House">Guest House</option>
                  </select>
                </div>
              </div>

              {/* Location & Bed Capacity */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Location / Camp Zone *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Site Village, Polokwane Central"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Bed Capacity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Rented Lease Details Section (Only if Rented) */}
              {formOwnership === 'Rented' && (
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-4">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
                    <Home className="w-4 h-4" /> Lease & Rental Agreement Terms
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Landlord / Leasing Agency</label>
                      <input
                        type="text"
                        placeholder="e.g. Limpopo Property Rentals Ltd"
                        value={formRentalVendor}
                        onChange={(e) => setFormRentalVendor(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Lease / PO Agreement #</label>
                      <input
                        type="text"
                        placeholder="e.g. PO-2026-ACC-88"
                        value={formRentalAgreementNumber}
                        onChange={(e) => setFormRentalAgreementNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Monthly Rent (ZAR) *</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 18500"
                        value={formRentalMonthlyCost}
                        onChange={(e) => setFormRentalMonthlyCost(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Lease Start Date</label>
                      <input
                        type="date"
                        value={formRentalStartDate}
                        onChange={(e) => setFormRentalStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Lease End Date</label>
                      <input
                        type="date"
                        value={formRentalEndDate}
                        onChange={(e) => setFormRentalEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Amenities Multi-Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Facilities & Amenities
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVAILABLE_AMENITIES.map(amenity => {
                    const selected = formAmenities.includes(amenity);
                    return (
                      <button
                        type="button"
                        key={amenity}
                        onClick={() => {
                          if (selected) {
                            setFormAmenities(formAmenities.filter(a => a !== amenity));
                          } else {
                            setFormAmenities([...formAmenities, amenity]);
                          }
                        }}
                        className={`text-xs px-3 py-2 rounded-xl border text-left flex items-center justify-between transition ${
                          selected
                            ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-medium'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{amenity}</span>
                        {selected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contact Person & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Camp Manager / Landlord Contact
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sipho Zulu (+27 82 455 1920)"
                    value={formContactPerson}
                    onChange={(e) => setFormContactPerson(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Notes & Access Info
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Gate code #4491, backup generator connected"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="border-slate-800 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  {editingUnit ? 'Save Changes' : 'Register Facility'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ASSIGN EMPLOYEE TO ACCOMMODATION                                 */}
      {/* ========================================================================= */}
      {isAssignModalOpen && assignTargetUnit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Assign Staff to {assignTargetUnit.name}</h3>
                  <p className="text-slate-400 text-xs">
                    {assignTargetUnit.totalCapacityBeds - (assignTargetUnit.occupantIds?.length || 0)} vacant beds available.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAssign} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Employee *
                </label>
                <select
                  required
                  value={assignEmployeeId}
                  onChange={(e) => setAssignEmployeeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose Employee to Allocate --</option>
                  {employees.map(emp => {
                    const isAlreadyAssigned = emp.hasAccommodation;
                    return (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role}) {isAlreadyAssigned ? `[Currently: ${emp.accommodationDetails?.campName || 'Housed'}]` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Room / Cabin / Bed Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cabin 4B, Room 2"
                  value={assignRoomNumber}
                  onChange={(e) => setAssignRoomNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="border-slate-800 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Confirm Allocation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: LOG UTILITY BILL / EXPENSE                                      */}
      {/* ========================================================================= */}
      {isUtilityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Log Accommodation Utility Expense</h3>
                  <p className="text-slate-400 text-xs">Record Eskom electricity tokens, municipal water, generator fuel, or WiFi bills.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsUtilityModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUtility} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Target Facility / Camp *
                </label>
                <select
                  required
                  value={utilAccId}
                  onChange={(e) => setUtilAccId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  {accommodations.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.ownership} • {acc.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Utility Category *
                  </label>
                  <select
                    value={utilType}
                    onChange={(e) => {
                      const val = e.target.value as UtilityType;
                      setUtilType(val);
                      if (val === 'Electricity / Eskom Tokens') setUtilUnitLabel('kWh');
                      else if (val === 'Water & Sanitation') setUtilUnitLabel('Litres');
                      else if (val === 'Camp Generator Diesel') setUtilUnitLabel('Litres');
                      else if (val === 'LPG Gas / Cooking') setUtilUnitLabel('Cylinders');
                      else setUtilUnitLabel('Units');
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Electricity / Eskom Tokens">Electricity / Eskom Tokens</option>
                    <option value="Water & Sanitation">Water & Sanitation</option>
                    <option value="Camp Generator Diesel">Camp Generator Diesel</option>
                    <option value="LPG Gas / Cooking">LPG Gas / Cooking</option>
                    <option value="WiFi & Internet">WiFi & Internet</option>
                    <option value="Cleaning & Laundry">Cleaning & Laundry</option>
                    <option value="Waste & Septic Pump-out">Waste & Septic Pump-out</option>
                    <option value="Repairs & Maintenance">Repairs & Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Date of Expense *
                  </label>
                  <input
                    type="date"
                    required
                    value={utilDate}
                    onChange={(e) => setUtilDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Total Amount (ZAR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="e.g. 4500"
                    value={utilAmount}
                    onChange={(e) => setUtilAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Consumption / Units ({utilUnitLabel})
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 1500"
                      value={utilUnitsConsumed}
                      onChange={(e) => setUtilUnitsConsumed(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                    <span className="inline-flex items-center px-3 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-mono">
                      {utilUnitLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Vendor / Provider
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Eskom Prepaid, Engen, Telkom"
                    value={utilVendor}
                    onChange={(e) => setUtilVendor(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Invoice / Token Receipt #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ESK-9041284"
                    value={utilInvoiceNo}
                    onChange={(e) => setUtilInvoiceNo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Notes & Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly bulk token refill for camp AC and refrigeration"
                  value={utilNotes}
                  onChange={(e) => setUtilNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsUtilityModalOpen(false)}
                  className="border-slate-800 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-white"
                >
                  Save Utility Bill
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
