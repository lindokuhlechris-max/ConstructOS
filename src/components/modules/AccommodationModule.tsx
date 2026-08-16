import React, { useState, useMemo } from 'react';
import { Card, Button, Badge } from '../ui';
import { 
  Building2, Plus, Bed, Users, Zap, Droplets, Flame, Wifi, 
  Trash2, Edit3, ArrowLeft, Download, Search, CheckCircle2, 
  Shield, Home, Fuel, UserPlus, Receipt, DollarSign,
  Briefcase, X, Sparkles, MapPin, Copy, DoorClosed, Eye, ExternalLink, Printer, CreditCard
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { 
  AccommodationUnit, AccommodationUtilityLog, AccommodationPaymentLog, AccommodationType, 
  AccommodationOwnership, AccommodationStatus, UtilityType, Employee, RentalRateType 
} from '../../types';
import { AccommodationDetail } from '../AccommodationDetail';
import { calculateAccommodationMonthlyCost, getAccommodationRateDescription, generateAllAccommodationsSummaryPDF } from '../../lib/pdfAccommodation';
import { exportAccommodationsToExcel } from '../../lib/csvExport';

interface AccommodationModuleProps {
  onBack?: () => void;
}

export function AccommodationModule({ onBack }: AccommodationModuleProps) {
  const { 
    accommodations, 
    accommodationUtilities, 
    accommodationPayments,
    employees, 
    projects,
    addAccommodation, 
    updateAccommodation, 
    deleteAccommodation,
    assignEmployeeToAccommodation,
    removeEmployeeFromAccommodation,
    addAccommodationUtility, 
    deleteAccommodationUtility,
    deleteAccommodationPayment
  } = useAppContext();

  const [selectedAccommodationId, setSelectedAccommodationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'properties' | 'utilities' | 'roster' | 'payments'>('properties');
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
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);
  const [viewingProofUrl, setViewingProofUrl] = useState<string | null>(null);

  // Unit Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<AccommodationType>('Site Camp / Modular Cabin');
  const [formOwnership, setFormOwnership] = useState<AccommodationOwnership>('Owned');
  const [formLocation, setFormLocation] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formTotalRooms, setFormTotalRooms] = useState<number | ''>('');
  const [formBedsPerRoom, setFormBedsPerRoom] = useState<number | ''>('');
  const [formCapacity, setFormCapacity] = useState<number>(1);
  const [formProjectId, setFormProjectId] = useState<string>('');
  const [formStatus, setFormStatus] = useState<AccommodationStatus>('Available');
  const [formRentalVendor, setFormRentalVendor] = useState('');
  const [formRentalAgreementNumber, setFormRentalAgreementNumber] = useState('');
  const [formRentalStartDate, setFormRentalStartDate] = useState('');
  const [formRentalEndDate, setFormRentalEndDate] = useState('');
  const [formRentalRateType, setFormRentalRateType] = useState<RentalRateType>('Fixed Monthly');
  const [formRentalRatePerUnit, setFormRentalRatePerUnit] = useState<number | ''>('');
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
  const [utilReceiptPhoto, setUtilReceiptPhoto] = useState<string>('');
  const [utilReceiptName, setUtilReceiptName] = useState<string>('');
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

  // Auto-calculate capacity when rooms or bedsPerRoom change
  const handleRoomsChange = (roomsVal: number | '') => {
    setFormTotalRooms(roomsVal);
    if (typeof roomsVal === 'number' && roomsVal > 0) {
      const beds = typeof formBedsPerRoom === 'number' && formBedsPerRoom > 0 ? formBedsPerRoom : 1;
      setFormCapacity(roomsVal * beds);
    }
  };

  const handleBedsPerRoomChange = (bedsVal: number | '') => {
    setFormBedsPerRoom(bedsVal);
    if (typeof bedsVal === 'number' && bedsVal > 0) {
      const rooms = typeof formTotalRooms === 'number' && formTotalRooms > 0 ? formTotalRooms : 1;
      setFormCapacity(rooms * bedsVal);
    }
  };

  // Helper safe employee display functions
  const getEmpDisplayName = (emp?: Employee | null): string => {
    if (!emp) return 'Staff Member';
    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
    return fullName || (emp as any).name || emp.id;
  };

  const getEmpDisplayRole = (emp?: Employee | null): string => {
    if (!emp) return 'Staff';
    return emp.position || (emp as any).role || 'Staff';
  };

  const getEmpInitials = (emp?: Employee | null): string => {
    const name = getEmpDisplayName(emp);
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

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
    const totalRooms = accommodations.reduce((sum, a) => sum + (a.totalRooms || 0), 0);
    const occupiedBeds = accommodations.reduce((sum, a) => sum + (a.occupantIds?.length || 0), 0);
    const availableBeds = Math.max(0, totalBeds - occupiedBeds);
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    // Calculate active monthly rental commitments taking per-occupant / per-room lodges into account!
    const monthlyRentalCommitment = accommodations
      .filter(a => a.ownership === 'Rented')
      .reduce((sum, a) => sum + calculateAccommodationMonthlyCost(a), 0);

    const totalUtilitiesCost = accommodationUtilities
      .reduce((sum, u) => sum + (u.amountZAR || 0), 0);

    return {
      totalUnits,
      ownedUnits,
      rentedUnits,
      totalBeds,
      totalRooms,
      occupiedBeds,
      availableBeds,
      occupancyRate,
      monthlyRentalCommitment,
      totalUtilitiesCost
    };
  }, [accommodations, accommodationUtilities]);

  // Filtered accommodations list
  const filteredAccommodations = useMemo(() => {
    return accommodations.filter(unit => {
      // Search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm.trim() || 
        unit.name.toLowerCase().includes(searchLower) ||
        unit.location.toLowerCase().includes(searchLower) ||
        (unit.address && unit.address.toLowerCase().includes(searchLower)) ||
        (unit.rentalVendor && unit.rentalVendor.toLowerCase().includes(searchLower)) ||
        (unit.contactPerson && unit.contactPerson.toLowerCase().includes(searchLower));

      // Ownership filter
      const matchesOwnership = ownershipFilter === 'All' || unit.ownership === ownershipFilter;

      // Type filter
      const matchesType = typeFilter === 'All' || unit.type === typeFilter;

      // Status filter
      const matchesStatus = statusFilter === 'All' || unit.status === statusFilter;

      return matchesSearch && matchesOwnership && matchesType && matchesStatus;
    });
  }, [accommodations, searchTerm, ownershipFilter, typeFilter, statusFilter]);

  // Open Add Modal
  const handleOpenCreate = () => {
    setEditingUnit(null);
    setFormName('');
    setFormType('Site Camp / Modular Cabin');
    setFormOwnership('Owned');
    setFormLocation('');
    setFormAddress('');
    setFormTotalRooms('');
    setFormBedsPerRoom('');
    setFormCapacity(1);
    setFormProjectId('');
    setFormStatus('Available');
    setFormRentalVendor('');
    setFormRentalAgreementNumber('');
    setFormRentalStartDate('');
    setFormRentalEndDate('');
    setFormRentalRateType('Fixed Monthly');
    setFormRentalRatePerUnit('');
    setFormRentalMonthlyCost('');
    setFormRentalDepositPaid('');
    setFormRentalBillingCycle('Monthly');
    setFormAmenities([]);
    setFormContactPerson('');
    setFormContactPhone('');
    setFormNotes('');
    setIsUnitModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (unit: AccommodationUnit) => {
    setEditingUnit(unit);
    setFormName(unit.name);
    setFormType(unit.type);
    setFormOwnership(unit.ownership);
    setFormLocation(unit.location);
    setFormAddress(unit.address || '');
    setFormTotalRooms(unit.totalRooms !== undefined ? unit.totalRooms : '');
    setFormBedsPerRoom(unit.bedsPerRoom !== undefined ? unit.bedsPerRoom : '');
    setFormCapacity(unit.totalCapacityBeds);
    setFormProjectId(unit.projectId || '');
    setFormStatus(unit.status);
    setFormRentalVendor(unit.rentalVendor || '');
    setFormRentalAgreementNumber(unit.rentalAgreementNumber || '');
    setFormRentalStartDate(unit.rentalStartDate || '');
    setFormRentalEndDate(unit.rentalEndDate || '');
    setFormRentalRateType(unit.rentalRateType || 'Fixed Monthly');
    setFormRentalRatePerUnit(unit.rentalRatePerUnit !== undefined ? unit.rentalRatePerUnit : (unit.rentalMonthlyCost || ''));
    setFormRentalMonthlyCost(unit.rentalMonthlyCost !== undefined ? unit.rentalMonthlyCost : '');
    setFormRentalDepositPaid(unit.rentalDepositPaid !== undefined ? unit.rentalDepositPaid : '');
    setFormRentalBillingCycle(unit.rentalBillingCycle || 'Monthly');
    setFormAmenities(unit.amenities || []);
    setFormContactPerson(unit.contactPerson || '');
    setFormContactPhone(unit.contactPhone || '');
    setFormNotes(unit.notes || '');
    setIsUnitModalOpen(true);
  };

  // Duplicate / Copy Accommodation Unit
  const handleDuplicateUnit = (unit: AccommodationUnit) => {
    setEditingUnit(null);
    setFormName(`${unit.name} (Copy)`);
    setFormType(unit.type);
    setFormOwnership(unit.ownership);
    setFormLocation(unit.location);
    setFormAddress(unit.address || '');
    setFormTotalRooms(unit.totalRooms !== undefined ? unit.totalRooms : '');
    setFormBedsPerRoom(unit.bedsPerRoom !== undefined ? unit.bedsPerRoom : '');
    setFormCapacity(unit.totalCapacityBeds);
    setFormProjectId(unit.projectId || '');
    setFormStatus('Available');
    setFormRentalVendor(unit.rentalVendor || '');
    setFormRentalAgreementNumber(unit.rentalAgreementNumber || '');
    setFormRentalStartDate(unit.rentalStartDate || '');
    setFormRentalEndDate(unit.rentalEndDate || '');
    setFormRentalRateType(unit.rentalRateType || 'Fixed Monthly');
    setFormRentalRatePerUnit(unit.rentalRatePerUnit !== undefined ? unit.rentalRatePerUnit : (unit.rentalMonthlyCost || ''));
    setFormRentalMonthlyCost(unit.rentalMonthlyCost !== undefined ? unit.rentalMonthlyCost : '');
    setFormRentalDepositPaid(unit.rentalDepositPaid !== undefined ? unit.rentalDepositPaid : '');
    setFormRentalBillingCycle(unit.rentalBillingCycle || 'Monthly');
    setFormAmenities(unit.amenities ? [...unit.amenities] : []);
    setFormContactPerson(unit.contactPerson || '');
    setFormContactPhone(unit.contactPhone || '');
    setFormNotes(unit.notes || '');
    setIsUnitModalOpen(true);
  };

  // Save Accommodation Unit
  const handleSaveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const rateAmount = formRentalRatePerUnit !== '' ? Number(formRentalRatePerUnit) : (formRentalMonthlyCost !== '' ? Number(formRentalMonthlyCost) : undefined);

    const unitData: AccommodationUnit = {
      id: editingUnit ? editingUnit.id : `ACC-${Math.floor(100 + Math.random() * 900)}`,
      name: formName.trim(),
      type: formType,
      ownership: formOwnership,
      location: formLocation.trim(),
      address: formAddress.trim() || undefined,
      totalRooms: formTotalRooms !== '' ? Number(formTotalRooms) : undefined,
      bedsPerRoom: formBedsPerRoom !== '' ? Number(formBedsPerRoom) : undefined,
      totalCapacityBeds: Number(formCapacity) || 1,
      occupantIds: editingUnit ? editingUnit.occupantIds : [],
      status: formStatus,
      projectId: formProjectId || undefined,
      projectName: projects.find(p => p.id === formProjectId)?.name,
      rentalVendor: formOwnership === 'Rented' ? formRentalVendor.trim() || undefined : undefined,
      rentalAgreementNumber: formOwnership === 'Rented' ? formRentalAgreementNumber.trim() || undefined : undefined,
      rentalStartDate: formOwnership === 'Rented' ? formRentalStartDate || undefined : undefined,
      rentalEndDate: formOwnership === 'Rented' ? formRentalEndDate || undefined : undefined,
      rentalRateType: formOwnership === 'Rented' ? formRentalRateType : undefined,
      rentalRatePerUnit: formOwnership === 'Rented' ? rateAmount : undefined,
      rentalMonthlyCost: formOwnership === 'Rented' ? rateAmount : undefined,
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
    setAssignRoomNumber('');
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
    setUtilReceiptPhoto('');
    setUtilReceiptName('');
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
      accommodationName: target ? target.name : '',
      utilityType: utilType,
      date: utilDate,
      amountZAR: Number(utilAmount),
      unitsConsumed: utilUnitsConsumed !== '' ? Number(utilUnitsConsumed) : undefined,
      unitLabel: utilUnitLabel,
      vendorOrProvider: utilVendor.trim() || undefined,
      invoiceOrReceiptNumber: utilInvoiceNo.trim() || undefined,
      paidStatus: utilPaidStatus,
      receiptPhotoUrl: utilReceiptPhoto || undefined,
      receiptFileName: utilReceiptName || undefined,
      loggedBy: '',
      notes: utilNotes.trim() || undefined
    };

    addAccommodationUtility(newLog);
    setIsUtilityModalOpen(false);
  };

  // Handle Receipt Image Select
  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUtilReceiptName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUtilReceiptPhoto(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
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
            `"${getEmpDisplayName(emp).replace(/"/g, '""')}"`,
            `"${getEmpDisplayRole(emp).replace(/"/g, '""')}"`,
            `"${emp.department || 'Operations'}"`,
            `"${emp.phone || ''}"`,
            acc.id,
            `"${acc.name.replace(/"/g, '""')}"`,
            acc.ownership,
            `"${emp.accommodationDetails?.roomNumber || ''}"`,
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

  // If an accommodation is selected, render the dedicated Detail Screen
  const selectedAccommodation = accommodations.find(a => a.id === selectedAccommodationId);
  if (selectedAccommodation) {
    return (
      <AccommodationDetail
        unit={selectedAccommodation}
        onClose={() => setSelectedAccommodationId(null)}
        onUpdate={(updated) => updateAccommodation(updated)}
        onDelete={(id) => {
          deleteAccommodation(id);
          setSelectedAccommodationId(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Home className="h-6 w-6 text-[#0B5FFF]" />
              Accommodation & Camp Hub
            </h2>
            <p className="text-sm text-slate-500">Manage owned site modular camps, rented staff housing, bed capacity allocations, and utility bills.</p>
          </div>
        </div>

        {/* Header Action Buttons */}
        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            onClick={() => generateAllAccommodationsSummaryPDF(accommodations, accommodationUtilities, employees)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl transition-colors text-xs font-bold shadow-sm"
            title="Download Executive Accommodations Portfolio Summary PDF"
          >
            <Printer className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Print Summary
          </button>
          <button
            onClick={() => exportAccommodationsToExcel(accommodations, employees, accommodationUtilities, accommodationPayments)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl transition-colors text-xs font-bold shadow-sm"
            title="Export Accommodations Portfolio to Excel (.xlsx)"
          >
            <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Export Excel
          </button>
          <button
            onClick={() => handleOpenLogUtility()}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl transition-colors text-xs font-semibold shadow-sm"
          >
            <Zap className="h-4 w-4" /> Log Utility Bill
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-[#0B5FFF] hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl transition-colors text-xs font-semibold shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Facility / Unit
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Units & Ownership */}
        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Facilities</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{stats.totalUnits}</span>
            <span className="text-xs text-slate-500">camps & properties</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50 font-semibold">
              <Shield className="w-3 h-3" /> {stats.ownedUnits} Owned
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50 font-semibold">
              <Home className="w-3 h-3" /> {stats.rentedUnits} Rented
            </span>
          </div>
        </Card>

        {/* Card 2: Bed Capacity & Occupancy */}
        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bed Capacity & Occupancy</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-[#0B5FFF] dark:text-blue-400 rounded-xl">
              <Bed className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{stats.occupiedBeds} <span className="text-slate-400 text-base font-normal">/ {stats.totalBeds}</span></span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">({stats.occupancyRate}% Occupied)</span>
          </div>
          {/* Visual progress bar */}
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                stats.occupancyRate >= 90 ? 'bg-amber-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'
              }`}
              style={{ width: `${Math.min(100, stats.occupancyRate)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>{stats.availableBeds} beds vacant</span>
            <span>{stats.totalRooms > 0 ? `${stats.totalRooms} rooms total` : `${stats.occupiedBeds} housed`}</span>
          </div>
        </Card>

        {/* Card 3: Monthly Rental Commitments */}
        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Lease Commitments</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{formatZARShort(stats.monthlyRentalCommitment)}</span>
            <span className="text-xs text-slate-500">/ month</span>
          </div>
          <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5 font-medium truncate">
            <Briefcase className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" /> 
            Active incurred across {stats.rentedUnits} leased facilities
          </p>
        </Card>

        {/* Card 4: Utilities Spent */}
        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Utilities & Running Costs</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">{formatZARShort(stats.totalUtilitiesCost)}</span>
            <span className="text-xs text-slate-500">total logged</span>
          </div>
          <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            <Receipt className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> {accommodationUtilities.length} utility bills & tokens
          </p>
        </Card>
      </div>

      {/* Tabs & View Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('properties')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'properties'
                ? 'bg-[#0B5FFF] text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Building2 className="h-4 w-4" /> Properties & Camps ({accommodations.length})
          </button>
          <button
            onClick={() => setActiveTab('utilities')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'utilities'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Zap className="h-4 w-4" /> Utilities & Expenses ({accommodationUtilities.length})
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'roster'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Users className="h-4 w-4" /> Staff Housing Roster ({stats.occupiedBeds})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'payments'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <CreditCard className="h-4 w-4" /> Lease Payments ({accommodationPayments?.length || 0})
          </button>
        </div>

        {/* Context Actions per Tab */}
        <div className="flex items-center gap-2">
          {activeTab === 'properties' && (
            <button
              onClick={() => exportAccommodationsToExcel(accommodations, employees, accommodationUtilities, accommodationPayments)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <Download className="h-4 w-4 text-emerald-500" /> Export Excel
            </button>
          )}
          {activeTab === 'utilities' && (
            <button
              onClick={exportUtilitiesCSV}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <Download className="h-4 w-4 text-amber-500" /> Export CSV
            </button>
          )}
          {activeTab === 'roster' && (
            <button
              onClick={exportRosterCSV}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <Download className="h-4 w-4 text-emerald-500" /> Export CSV
            </button>
          )}
          {activeTab === 'payments' && (
            <button
              onClick={() => exportAccommodationsToExcel(accommodations, employees, accommodationUtilities, accommodationPayments)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <Download className="h-4 w-4 text-purple-500" /> Export Excel
            </button>
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
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search camp, house, landlord..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]/20"
              />
            </div>

            {/* Ownership Filter */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {(['All', 'Owned', 'Rented'] as const).map((own) => (
                <button
                  key={own}
                  onClick={() => setOwnershipFilter(own)}
                  className={`flex-1 py-1 text-xs font-semibold rounded-lg transition ${
                    ownershipFilter === own 
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
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
              className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-[#0B5FFF]"
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
              className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-[#0B5FFF]"
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
            <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
              <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No accommodation units found</h3>
              <p className="text-slate-500 text-xs mt-1">Try adjusting your search criteria or register a new facility.</p>
              <button onClick={handleOpenCreate} className="mt-4 px-4 py-2 bg-[#0B5FFF] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm">
                + Add Facility
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredAccommodations.map((unit) => {
                const occupants = employees.filter(e => unit.occupantIds?.includes(e.id));
                const vacantBeds = Math.max(0, unit.totalCapacityBeds - (unit.occupantIds?.length || 0));
                const isFull = vacantBeds === 0;
                const activeLeaseCost = calculateAccommodationMonthlyCost(unit);

                return (
                  <div 
                    key={unit.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header: Title & Badges */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 cursor-pointer" onClick={() => setSelectedAccommodationId(unit.id)}>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            {unit.ownership === 'Owned' ? (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50 text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Shield className="w-3 h-3" /> Company Owned
                              </span>
                            ) : (
                              <span className="bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50 text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Home className="w-3 h-3" /> Leased / Rented
                              </span>
                            )}

                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-medium px-2 py-0.5 rounded-md">
                              {unit.type}
                            </span>

                            {unit.totalRooms !== undefined && unit.totalRooms > 0 && (
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                                <DoorClosed className="w-3 h-3 text-slate-400" />
                                {unit.totalRooms} Room{unit.totalRooms > 1 ? 's' : ''}
                              </span>
                            )}

                            {isFull ? (
                              <span className="text-xs px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50 font-bold">
                                Fully Occupied
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/50 font-bold">
                                {vacantBeds} Bed{vacantBeds > 1 ? 's' : ''} Vacant
                              </span>
                            )}
                          </div>

                          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 hover:text-[#0B5FFF] transition">
                            {unit.name}
                            <ExternalLink className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                          </h3>
                          
                          <p className="text-slate-500 text-xs flex items-center gap-1.5 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {unit.location} {unit.address ? `• ${unit.address}` : ''}
                          </p>
                        </div>

                        {/* Quick Actions (Copy / Edit / Delete) */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDuplicateUnit(unit)}
                            className="p-1.5 text-slate-400 hover:text-[#0B5FFF] dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Duplicate / Copy Unit"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(unit)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
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
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Delete Property"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Rented Details Block with Dynamic Occupancy Calculation */}
                      {unit.ownership === 'Rented' && (
                        <div className="mt-3 p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-xl space-y-1 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <span className="text-slate-500 text-[11px] block">Landlord / Vendor:</span>
                              <span className="font-bold text-slate-900 dark:text-slate-100">{unit.rentalVendor || 'Private Landlord'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 text-[11px] block">Active Monthly Rent:</span>
                              <span className="font-bold text-amber-700 dark:text-amber-400">
                                {formatZAR(activeLeaseCost)}
                              </span>
                              <span className="text-[10px] text-slate-500 block truncate max-w-[200px]" title={getAccommodationRateDescription(unit)}>
                                {getAccommodationRateDescription(unit)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 text-[11px] block">Lease Expiry:</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">{unit.rentalEndDate || 'Ongoing'}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Capacity Bar & Occupant Avatars */}
                      <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 flex-wrap">
                            <Bed className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span>Capacity: {occupants.length} / {unit.totalCapacityBeds} Beds Occupied</span>
                            {unit.totalRooms !== undefined && unit.totalRooms > 0 && (
                              <span className="text-slate-500 text-[11px] font-normal">
                                ({unit.totalRooms} Room{unit.totalRooms > 1 ? 's' : ''}{unit.bedsPerRoom ? ` • ${unit.bedsPerRoom} beds/rm` : ''})
                              </span>
                            )}
                          </span>
                          <span className="text-slate-500 font-semibold">
                            {Math.round((occupants.length / (unit.totalCapacityBeds || 1)) * 100)}% Full
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              isFull ? 'bg-rose-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                            }`}
                            style={{ width: `${Math.min(100, (occupants.length / (unit.totalCapacityBeds || 1)) * 100)}%` }}
                          />
                        </div>

                        {/* Assigned Staff List */}
                        <div>
                          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                            <span>Resident Staff</span>
                            {!isFull && (
                              <button
                                onClick={() => handleOpenAssign(unit)}
                                className="text-[#0B5FFF] hover:underline text-xs font-bold flex items-center gap-1"
                              >
                                <UserPlus className="w-3.5 h-3.5" /> + Assign Staff
                              </button>
                            )}
                          </div>

                          {occupants.length === 0 ? (
                            <p className="text-slate-400 text-xs italic">No personnel currently allocated to this unit.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {occupants.map((emp) => {
                                const displayName = getEmpDisplayName(emp);
                                return (
                                  <div
                                    key={emp.id}
                                    className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 shadow-sm"
                                  >
                                    <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 font-bold flex items-center justify-center text-[10px]">
                                      {getEmpInitials(emp)}
                                    </div>
                                    <span className="font-semibold">{displayName}</span>
                                    {emp.accommodationDetails?.roomNumber && (
                                      <span className="text-slate-500 text-[10px]">({emp.accommodationDetails.roomNumber})</span>
                                    )}
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`Remove ${displayName} from ${unit.name}?`)) {
                                          removeEmployeeFromAccommodation(unit.id, emp.id);
                                        }
                                      }}
                                      className="text-slate-400 hover:text-rose-500 ml-1 font-bold"
                                      title="Vacate Bed"
                                    >
                                      ×
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Amenities Tags */}
                      {unit.amenities && unit.amenities.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {unit.amenities.map(am => (
                            <span key={am} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-medium">
                              {am}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Footer Actions */}
                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenLogUtility(unit)}
                          className="text-xs text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 px-2.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-500/30 transition"
                        >
                          <Zap className="w-3.5 h-3.5" /> Log Bill
                        </button>
                        <button
                          onClick={() => handleOpenAssign(unit)}
                          disabled={isFull}
                          className={`text-xs font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition ${
                            isFull
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                              : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800'
                          }`}
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Allocate
                        </button>
                      </div>

                      <button
                        onClick={() => setSelectedAccommodationId(unit.id)}
                        className="text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B5FFF] hover:bg-blue-700 text-white shadow-sm transition"
                      >
                        <span>View Details</span>
                        <ExternalLink className="w-3.5 h-3.5" />
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
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Accommodation Utilities & Running Costs</h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Track Eskom prepaid tokens, municipal water deliveries, camp generator diesel, LPG gas, and WiFi expenses.
              </p>
            </div>

            <button
              onClick={() => handleOpenLogUtility()}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl transition-colors text-xs font-semibold shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Log New Utility Bill
            </button>
          </div>

          {/* Utility Ledger Table */}
          {accommodationUtilities.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
              <Zap className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No utility expenses logged yet</h3>
              <p className="text-slate-500 text-xs mt-1">Record Eskom electricity tokens, water delivery, generator fuel, or gas bills.</p>
              <button onClick={() => handleOpenLogUtility()} className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm">
                <Plus className="w-4 h-4 mr-1.5 inline" /> Log Utility Bill
              </button>
            </div>
          ) : (
            <Card className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5">Date</th>
                      <th className="px-4 py-3.5">Facility / Camp</th>
                      <th className="px-4 py-3.5">Utility Category</th>
                      <th className="px-4 py-3.5">Units / Consumed</th>
                      <th className="px-4 py-3.5">Cost (ZAR)</th>
                      <th className="px-4 py-3.5">Vendor / Receipt #</th>
                      <th className="px-4 py-3.5">Receipt Voucher</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {accommodationUtilities.map(util => (
                      <tr key={util.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {util.date}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 dark:text-white text-xs">{util.accommodationName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{util.accommodationId}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            {getUtilityIcon(util.utilityType)}
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{util.utilityType}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                          {util.unitsConsumed ? (
                            <span className="font-mono font-medium">{util.unitsConsumed} {util.unitLabel || 'Units'}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-extrabold text-xs text-amber-700 dark:text-amber-400 font-mono">
                            {formatZAR(util.amountZAR)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                          <div className="font-medium">{util.vendorOrProvider || '—'}</div>
                          {util.invoiceOrReceiptNumber && (
                            <div className="text-[10px] text-slate-400 font-mono">Ref: {util.invoiceOrReceiptNumber}</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                          {util.receiptPhotoUrl ? (
                            <button
                              onClick={() => setViewingReceiptUrl(util.receiptPhotoUrl || null)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 text-[11px] transition"
                            >
                              <Eye className="w-3 h-3" /> View Receipt
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs italic">None</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            util.paidStatus === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                              : util.paidStatus === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                          }`}>
                            {util.paidStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-right">
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete utility log "${util.utilityType} - ${formatZAR(util.amountZAR)}"?`)) {
                                deleteAccommodationUtility(util.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                            title="Delete Utility Bill"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STAFF HOUSING ROSTER                                              */}
      {/* ========================================================================= */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Staff Housing Roster & Room Assignments</h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Complete directory of all resident workers and their allocated camp or house rooms.
              </p>
            </div>
          </div>

          {stats.occupiedBeds === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No employees currently housed</h3>
              <p className="text-slate-500 text-xs mt-1">Go to the Properties tab to assign personnel to company camps or staff houses.</p>
              <button onClick={() => setActiveTab('properties')} className="mt-4 px-4 py-2 bg-[#0B5FFF] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm">
                View Properties & Camps
              </button>
            </div>
          ) : (
            <Card className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
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
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {accommodations.flatMap(acc => 
                      acc.occupantIds.map(empId => {
                        const emp = employees.find(e => e.id === empId);
                        if (!emp) return null;

                        const displayName = getEmpDisplayName(emp);
                        const displayRole = getEmpDisplayRole(emp);

                        return (
                          <tr key={`${acc.id}-${emp.id}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                            <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                                {getEmpInitials(emp)}
                              </div>
                              <div>
                                <div className="font-semibold">{displayName}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{emp.id}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 text-xs">
                              <div className="font-semibold text-slate-800 dark:text-slate-200">{displayRole}</div>
                              <div className="text-slate-400">{emp.department || 'Operations'}</div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-xs text-indigo-700 dark:text-indigo-300">{acc.name}</div>
                              <div className="text-[10px] text-slate-500">{acc.ownership} • {acc.location}</div>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-cyan-300">
                                {emp.accommodationDetails?.roomNumber || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400 text-xs">
                              {emp.accommodationDetails?.checkInDate || acc.createdAt || '—'}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                              {emp.phone || '—'}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-right">
                              <button
                                onClick={() => {
                                  if (window.confirm(`Check out ${displayName} from ${acc.name}?`)) {
                                    removeEmployeeFromAccommodation(acc.id, emp.id);
                                  }
                                }}
                                className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-500/20 transition"
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
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: LEASE PAYMENTS & DISBURSEMENTS                                     */}
      {/* ========================================================================= */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Top Payment KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Lease Settled</span>
                <div className="p-2 bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 rounded-xl">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                {formatZARShort((accommodationPayments || []).reduce((sum, p) => sum + (p.amountPaidZAR || 0), 0))}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {(accommodationPayments || []).length} payment disbursements recorded
              </p>
            </Card>

            <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Settlements</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                {(accommodationPayments || []).filter(p => p.status === 'Paid').length}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Settled in full with vendor POPs
              </p>
            </Card>

            <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending / Partial</span>
                <div className="p-2 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 rounded-xl">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                {(accommodationPayments || []).filter(p => p.status !== 'Paid').length}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Awaiting clearance or partial release
              </p>
            </Card>
          </div>

          {/* Payment Table */}
          {(!accommodationPayments || accommodationPayments.length === 0) ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <CreditCard className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Lease Payments Recorded Yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Open any leased facility to log monthly lease disbursements, upload POP slips, and track landlord vouchers.
              </p>
            </div>
          ) : (
            <Card className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5">Payment Date</th>
                      <th className="px-4 py-3.5">Facility Name</th>
                      <th className="px-4 py-3.5">Billing Month</th>
                      <th className="px-4 py-3.5">Staff Housed</th>
                      <th className="px-4 py-3.5">Lease Incurred</th>
                      <th className="px-4 py-3.5">Amount Paid</th>
                      <th className="px-4 py-3.5">Method & Ref #</th>
                      <th className="px-4 py-3.5">Paid To (Vendor)</th>
                      <th className="px-4 py-3.5">Proof of Payment</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {accommodationPayments.map(pay => (
                      <tr key={pay.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {pay.paymentDate}
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => setSelectedAccommodationId(pay.accommodationId)}
                            className="font-bold text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 text-left"
                          >
                            <span>{pay.accommodationName}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                          </button>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs font-bold text-purple-700 dark:text-purple-300 font-mono">
                          {pay.billingPeriod}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs font-medium text-slate-700 dark:text-slate-300">
                          {pay.occupantCount} workers
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs font-mono text-slate-600 dark:text-slate-400">
                          {formatZAR(pay.amountDueZAR)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-extrabold text-xs text-purple-700 dark:text-purple-400 font-mono">
                            {formatZAR(pay.amountPaidZAR)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                          <div className="font-medium">{pay.paymentMethod}</div>
                          {pay.referenceNumber && (
                            <div className="text-[10px] text-slate-400 font-mono">Ref: {pay.referenceNumber}</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300">
                          {pay.paidToVendor || 'Landlord'}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                          {pay.proofOfPaymentUrl ? (
                            <button
                              onClick={() => setViewingProofUrl(pay.proofOfPaymentUrl || null)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800 text-[11px] transition"
                            >
                              <Eye className="w-3.5 h-3.5" /> View POP
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs italic">No attachment</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            pay.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                              : pay.status === 'Partial'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
                              : pay.status === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                          }`}>
                            {pay.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-right">
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete payment record for "${pay.accommodationName} (${pay.billingPeriod})"?`)) {
                                deleteAccommodationPayment(pay.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                            title="Delete Payment Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT / DUPLICATE ACCOMMODATION UNIT                        */}
      {/* ========================================================================= */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <Card className="w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-2xl animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingUnit 
                      ? 'Edit Accommodation Unit' 
                      : formName.includes('(Copy)') 
                      ? 'Duplicate Accommodation Facility' 
                      : 'Register New Accommodation Facility'}
                  </h3>
                  <p className="text-slate-500 text-xs">Configure site camps, modular units, or rented staff houses.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsUnitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="p-6 space-y-4 overflow-y-auto flex-1 text-slate-900 dark:text-slate-100">
              {/* Ownership Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Ownership Model *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormOwnership('Owned')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      formOwnership === 'Owned'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Shield className="w-4 h-4" /> Company Owned
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormOwnership('Rented')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      formOwnership === 'Rented'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Home className="w-4 h-4" /> Leased / Rented
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Facility / Camp Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Central Site Camp (Block A)"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Property Structure Type *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as AccommodationType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Location Area / Zone *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zone 1 - Main Construction Yard"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Physical Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Plot 4, Site Village, N1 North"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Linked Project
                  </label>
                  <select
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  >
                    <option value="">-- General Site Accommodation --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Property Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as AccommodationStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  >
                    <option value="Available">Available</option>
                    <option value="Partially Occupied">Partially Occupied</option>
                    <option value="Full">Full</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                  </select>
                </div>
              </div>

              {/* Room & Bed Capacity Configuration */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <Bed className="w-4 h-4" /> Room & Bed Capacity Configuration
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Rooms Available / Rented
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 5"
                      value={formTotalRooms}
                      onChange={(e) => handleRoomsChange(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Beds per Room
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 2"
                      value={formBedsPerRoom}
                      onChange={(e) => handleBedsPerRoomChange(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Total Bed Capacity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      required
                      value={formCapacity}
                      onChange={(e) => setFormCapacity(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                    />
                  </div>
                </div>

                {formTotalRooms !== '' && formBedsPerRoom !== '' && Number(formTotalRooms) > 0 && Number(formBedsPerRoom) > 0 && (
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1.5 pt-0.5">
                    ✨ Auto-calculated: {formTotalRooms} room{Number(formTotalRooms) > 1 ? 's' : ''} × {formBedsPerRoom} bed{Number(formBedsPerRoom) > 1 ? 's' : ''}/room = <strong>{formCapacity} total beds</strong>
                  </p>
                )}
              </div>

              {/* Rented Lease Details Section (Only if Rented) */}
              {formOwnership === 'Rented' && (
                <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-3">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <Home className="w-4 h-4" /> Lease & Rental Agreement Terms
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Landlord / Leasing Agency</label>
                      <input
                        type="text"
                        placeholder="e.g. Limpopo Property Rentals Ltd"
                        value={formRentalVendor}
                        onChange={(e) => setFormRentalVendor(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Lease Agreement #</label>
                      <input
                        type="text"
                        placeholder="e.g. PO-2026-ACC-88"
                        value={formRentalAgreementNumber}
                        onChange={(e) => setFormRentalAgreementNumber(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  {/* Pricing Model Selector */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Rental Pricing Calculation Model *
                      </label>
                      <select
                        value={formRentalRateType}
                        onChange={(e) => setFormRentalRateType(e.target.value as RentalRateType)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                      >
                        <option value="Fixed Monthly">Fixed Monthly Lease (Flat Rate)</option>
                        <option value="Per Occupant / Bed (Monthly)">Per Occupant / Bed (Monthly Rate)</option>
                        <option value="Per Room (Monthly)">Per Room (Monthly Rate)</option>
                        <option value="Daily / Per Night per Person">Daily / Per Night per Person</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        {formRentalRateType === 'Fixed Monthly'
                          ? 'Fixed Monthly Rent (ZAR) *'
                          : formRentalRateType === 'Per Occupant / Bed (Monthly)'
                          ? 'Rate per Occupant / Month (ZAR) *'
                          : formRentalRateType === 'Per Room (Monthly)'
                          ? 'Rate per Room / Month (ZAR) *'
                          : 'Rate per Person / Night (ZAR) *'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 3500"
                        value={formRentalRatePerUnit !== '' ? formRentalRatePerUnit : (formRentalMonthlyCost !== '' ? formRentalMonthlyCost : '')}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Number(e.target.value);
                          setFormRentalRatePerUnit(val);
                          setFormRentalMonthlyCost(val);
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Lease Start Date</label>
                      <input
                        type="date"
                        value={formRentalStartDate}
                        onChange={(e) => setFormRentalStartDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Lease End Date</label>
                      <input
                        type="date"
                        value={formRentalEndDate}
                        onChange={(e) => setFormRentalEndDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Amenities Multi-Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
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
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 font-semibold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span>{amenity}</span>
                        {selected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contact Person & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Camp Manager / Landlord Contact
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sipho Zulu (+27 82 455 1920)"
                    value={formContactPerson}
                    onChange={(e) => setFormContactPerson(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Notes & Access Info
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Gate code #4491, backup generator connected"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#0B5FFF] hover:bg-blue-700 text-white shadow-sm"
                >
                  {editingUnit ? 'Save Changes' : formName.includes('(Copy)') ? 'Create Duplicate' : 'Register Facility'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ASSIGN EMPLOYEE TO ACCOMMODATION                                 */}
      {/* ========================================================================= */}
      {isAssignModalOpen && assignTargetUnit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <Card className="w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-2xl animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Assign Staff to {assignTargetUnit.name}</h3>
                  <p className="text-slate-500 text-xs">
                    {assignTargetUnit.totalCapacityBeds - (assignTargetUnit.occupantIds?.length || 0)} vacant beds available.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssign} className="p-6 space-y-4 overflow-y-auto flex-1 text-slate-900 dark:text-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Select Employee *
                </label>
                <select
                  required
                  value={assignEmployeeId}
                  onChange={(e) => setAssignEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                >
                  <option value="">-- Choose Employee to Allocate --</option>
                  {employees.map(emp => {
                    const isAlreadyAssigned = emp.hasAccommodation;
                    return (
                      <option key={emp.id} value={emp.id}>
                        {getEmpDisplayName(emp)} ({getEmpDisplayRole(emp)}) {isAlreadyAssigned ? `[Currently: ${emp.accommodationDetails?.campName || 'Housed'}]` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Room / Cabin / Bed Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cabin 4B, Room 2"
                  value={assignRoomNumber}
                  onChange={(e) => setAssignRoomNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#0B5FFF] hover:bg-blue-700 text-white shadow-sm"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: LOG UTILITY BILL / EXPENSE                                      */}
      {/* ========================================================================= */}
      {isUtilityModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <Card className="w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-2xl animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 rounded-xl">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Log Accommodation Utility Expense</h3>
                  <p className="text-slate-500 text-xs">Record Eskom electricity tokens, municipal water, generator fuel, or WiFi bills.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsUtilityModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUtility} className="p-6 space-y-4 overflow-y-auto flex-1 text-slate-900 dark:text-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Target Facility / Camp *
                </label>
                <select
                  required
                  value={utilAccId}
                  onChange={(e) => setUtilAccId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
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
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
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
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Date of Expense *
                  </label>
                  <input
                    type="date"
                    required
                    value={utilDate}
                    onChange={(e) => setUtilDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Units Consumed ({utilUnitLabel})
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 1500"
                      value={utilUnitsConsumed}
                      onChange={(e) => setUtilUnitsConsumed(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                    <span className="inline-flex items-center px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold">
                      {utilUnitLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Vendor / Provider
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Eskom Prepaid, Engen, Telkom"
                    value={utilVendor}
                    onChange={(e) => setUtilVendor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Invoice / Receipt #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ESK-9041284"
                    value={utilInvoiceNo}
                    onChange={(e) => setUtilInvoiceNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>

              {/* Receipt File Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Attach Receipt Voucher / Slip
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleReceiptFileChange}
                  className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 dark:file:bg-amber-950/60 dark:file:text-amber-300 hover:file:bg-amber-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Notes & Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly bulk token refill for camp AC and refrigeration"
                  value={utilNotes}
                  onChange={(e) => setUtilNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => setIsUtilityModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                >
                  Save Utility Bill
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: RECEIPT PHOTO VIEWER                                            */}
      {/* ========================================================================= */}
      {viewingReceiptUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-4 relative flex flex-col items-center">
            <button
              onClick={() => setViewingReceiptUrl(null)}
              className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2 self-start">
              <Receipt className="w-4 h-4 text-amber-400" /> Utility Receipt / Invoice Voucher
            </h3>
            <div className="max-h-[75vh] overflow-auto rounded-xl border border-slate-800 w-full flex justify-center bg-black/40">
              <img
                src={viewingReceiptUrl}
                alt="Utility Receipt"
                className="max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: PROOF OF PAYMENT PHOTO VIEWER                                    */}
      {/* ========================================================================= */}
      {viewingProofUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-4 relative flex flex-col items-center">
            <button
              onClick={() => setViewingProofUrl(null)}
              className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2 self-start">
              <CreditCard className="w-4 h-4 text-purple-400" /> Proof of Payment Voucher / Slip
            </h3>
            <div className="max-h-[75vh] overflow-auto rounded-xl border border-slate-800 w-full flex justify-center bg-black/40">
              <img
                src={viewingProofUrl}
                alt="Proof of Payment"
                className="max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
