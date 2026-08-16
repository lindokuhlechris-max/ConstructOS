import React, { useState, useMemo } from 'react';
import { Card, Button, Badge } from './ui';
import { 
  Building2, Bed, Users, Zap, Droplets, Flame, Wifi, 
  Trash2, Edit3, ArrowLeft, Download, Search, CheckCircle2, 
  Shield, Home, Fuel, UserPlus, Receipt, DollarSign,
  Briefcase, X, Sparkles, MapPin, Copy, DoorClosed, Printer,
  FileText, Calendar, Phone, Lock, Image as ImageIcon, Eye, Plus,
  CreditCard, Clock, CheckCircle, AlertTriangle
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { 
  AccommodationUnit, AccommodationUtilityLog, AccommodationPaymentLog, AccommodationType, 
  AccommodationOwnership, AccommodationStatus, UtilityType, Employee, RentalRateType 
} from '../types';
import { 
  calculateAccommodationMonthlyCost, 
  getAccommodationRateDescription, 
  generateAccommodationMonthlyPDF 
} from '../lib/pdfAccommodation';
import { exportSingleAccommodationToExcel } from '../lib/csvExport';

interface AccommodationDetailProps {
  unit: AccommodationUnit;
  onClose: () => void;
  onUpdate: (updated: AccommodationUnit) => void;
  onDelete: (id: string) => void;
}

export function AccommodationDetail({ unit, onClose, onUpdate, onDelete }: AccommodationDetailProps) {
  const { 
    accommodationUtilities, 
    accommodationPayments,
    employees, 
    projects,
    assignEmployeeToAccommodation,
    removeEmployeeFromAccommodation,
    addAccommodationUtility, 
    deleteAccommodationUtility,
    addAccommodationPayment,
    updateAccommodationPayment,
    deleteAccommodationPayment
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<'roster' | 'utilities' | 'lease' | 'specs'>('roster');
  
  // Filter payments for this accommodation
  const facilityPayments = useMemo(() => {
    return (accommodationPayments || []).filter(p => p.accommodationId === unit.id);
  }, [accommodationPayments, unit.id]);

  // Modals inside Detail view
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isUtilityModalOpen, setIsUtilityModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);
  const [viewingProofUrl, setViewingProofUrl] = useState<string | null>(null);

  // Payment Form state
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [payBillingPeriod, setPayBillingPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payOccupantCount, setPayOccupantCount] = useState<number>(unit.occupantIds?.length || 0);
  const [payAmountDue, setPayAmountDue] = useState<number | ''>(calculateAccommodationMonthlyCost(unit));
  const [payAmountPaid, setPayAmountPaid] = useState<number | ''>(calculateAccommodationMonthlyCost(unit));
  const [payMethod, setPayMethod] = useState<'EFT / Bank Transfer' | 'Direct Debit' | 'Company Cheque' | 'Credit Card' | 'Cash'>('EFT / Bank Transfer');
  const [payReference, setPayReference] = useState('');
  const [payVendor, setPayVendor] = useState(unit.rentalVendor || '');
  const [payStatus, setPayStatus] = useState<'Paid' | 'Partial' | 'Pending' | 'Overdue'>('Paid');
  const [payProofUrl, setPayProofUrl] = useState<string | null>(null);
  const [payProofFileName, setPayProofFileName] = useState<string | null>(null);
  const [payNotes, setPayNotes] = useState('');

  // Assign Form state
  const [assignEmployeeId, setAssignEmployeeId] = useState('');
  const [assignRoomNumber, setAssignRoomNumber] = useState('');

  // Utility Form state
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

  // Edit Facility Form state
  const [editName, setEditName] = useState(unit.name);
  const [editType, setEditType] = useState<AccommodationType>(unit.type);
  const [editOwnership, setEditOwnership] = useState<AccommodationOwnership>(unit.ownership);
  const [editLocation, setEditLocation] = useState(unit.location);
  const [editAddress, setEditAddress] = useState(unit.address || '');
  const [editTotalRooms, setEditTotalRooms] = useState<number | ''>(unit.totalRooms !== undefined ? unit.totalRooms : '');
  const [editBedsPerRoom, setEditBedsPerRoom] = useState<number | ''>(unit.bedsPerRoom !== undefined ? unit.bedsPerRoom : '');
  const [editCapacity, setEditCapacity] = useState<number>(unit.totalCapacityBeds);
  const [editProjectId, setEditProjectId] = useState<string>(unit.projectId || '');
  const [editStatus, setEditStatus] = useState<AccommodationStatus>(unit.status);
  const [editRentalVendor, setEditRentalVendor] = useState(unit.rentalVendor || '');
  const [editRentalAgreementNumber, setEditRentalAgreementNumber] = useState(unit.rentalAgreementNumber || '');
  const [editRentalStartDate, setEditRentalStartDate] = useState(unit.rentalStartDate || '');
  const [editRentalEndDate, setEditRentalEndDate] = useState(unit.rentalEndDate || '');
  const [editRentalRateType, setEditRentalRateType] = useState<RentalRateType>(unit.rentalRateType || 'Fixed Monthly');
  const [editRentalRatePerUnit, setEditRentalRatePerUnit] = useState<number | ''>(unit.rentalRatePerUnit !== undefined ? unit.rentalRatePerUnit : '');
  const [editRentalMonthlyCost, setEditRentalMonthlyCost] = useState<number | ''>(unit.rentalMonthlyCost !== undefined ? unit.rentalMonthlyCost : '');
  const [editRentalDepositPaid, setEditRentalDepositPaid] = useState<number | ''>(unit.rentalDepositPaid !== undefined ? unit.rentalDepositPaid : '');
  const [editRentalBillingCycle, setEditRentalBillingCycle] = useState<'Monthly' | 'Weekly' | 'Daily'>(unit.rentalBillingCycle || 'Monthly');
  const [editAmenities, setEditAmenities] = useState<string[]>(unit.amenities || []);
  const [editContactPerson, setEditContactPerson] = useState(unit.contactPerson || '');
  const [editContactPhone, setEditContactPhone] = useState(unit.contactPhone || '');
  const [editNotes, setEditNotes] = useState(unit.notes || '');

  // Available amenities
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

  // Filter utilities for this specific accommodation
  const unitUtilities = useMemo(() => {
    return accommodationUtilities.filter(u => u.accommodationId === unit.id);
  }, [accommodationUtilities, unit.id]);

  // Occupants allocated to this unit
  const occupants = useMemo(() => {
    return employees.filter(e => unit.occupantIds?.includes(e.id));
  }, [employees, unit.occupantIds]);

  // Financial & Occupancy calculations
  const stats = useMemo(() => {
    const totalBeds = unit.totalCapacityBeds || 1;
    const occupiedBeds = occupants.length;
    const vacantBeds = Math.max(0, totalBeds - occupiedBeds);
    const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100);

    const activeMonthlyLease = calculateAccommodationMonthlyCost(unit);
    const totalUtilitiesCost = unitUtilities.reduce((sum, u) => sum + (u.amountZAR || 0), 0);
    const totalFacilityCost = activeMonthlyLease + totalUtilitiesCost;
    const costPerOccupant = occupiedBeds > 0 ? totalFacilityCost / occupiedBeds : 0;

    return {
      totalBeds,
      occupiedBeds,
      vacantBeds,
      occupancyRate,
      activeMonthlyLease,
      totalUtilitiesCost,
      totalFacilityCost,
      costPerOccupant
    };
  }, [unit, occupants, unitUtilities]);

  // Handle Room changes in edit modal
  const handleEditRoomsChange = (roomsVal: number | '') => {
    setEditTotalRooms(roomsVal);
    if (typeof roomsVal === 'number' && roomsVal > 0) {
      const beds = typeof editBedsPerRoom === 'number' && editBedsPerRoom > 0 ? editBedsPerRoom : 1;
      setEditCapacity(roomsVal * beds);
    }
  };

  const handleEditBedsPerRoomChange = (bedsVal: number | '') => {
    setEditBedsPerRoom(bedsVal);
    if (typeof bedsVal === 'number' && bedsVal > 0) {
      const rooms = typeof editTotalRooms === 'number' && editTotalRooms > 0 ? editTotalRooms : 1;
      setEditCapacity(rooms * bedsVal);
    }
  };

  // Open Edit Modal with refreshed values
  const handleOpenEditModal = () => {
    setEditName(unit.name);
    setEditType(unit.type);
    setEditOwnership(unit.ownership);
    setEditLocation(unit.location);
    setEditAddress(unit.address || '');
    setEditTotalRooms(unit.totalRooms !== undefined ? unit.totalRooms : '');
    setEditBedsPerRoom(unit.bedsPerRoom !== undefined ? unit.bedsPerRoom : '');
    setEditCapacity(unit.totalCapacityBeds);
    setEditProjectId(unit.projectId || '');
    setEditStatus(unit.status);
    setEditRentalVendor(unit.rentalVendor || '');
    setEditRentalAgreementNumber(unit.rentalAgreementNumber || '');
    setEditRentalStartDate(unit.rentalStartDate || '');
    setEditRentalEndDate(unit.rentalEndDate || '');
    setEditRentalRateType(unit.rentalRateType || 'Fixed Monthly');
    setEditRentalRatePerUnit(unit.rentalRatePerUnit !== undefined ? unit.rentalRatePerUnit : '');
    setEditRentalMonthlyCost(unit.rentalMonthlyCost !== undefined ? unit.rentalMonthlyCost : '');
    setEditRentalDepositPaid(unit.rentalDepositPaid !== undefined ? unit.rentalDepositPaid : '');
    setEditRentalBillingCycle(unit.rentalBillingCycle || 'Monthly');
    setEditAmenities(unit.amenities || []);
    setEditContactPerson(unit.contactPerson || '');
    setEditContactPhone(unit.contactPhone || '');
    setEditNotes(unit.notes || '');
    setIsEditModalOpen(true);
  };

  // Save Edit Facility Form
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    const updatedUnit: AccommodationUnit = {
      ...unit,
      name: editName.trim(),
      type: editType,
      ownership: editOwnership,
      location: editLocation.trim(),
      address: editAddress.trim() || undefined,
      totalRooms: editTotalRooms !== '' ? Number(editTotalRooms) : undefined,
      bedsPerRoom: editBedsPerRoom !== '' ? Number(editBedsPerRoom) : undefined,
      totalCapacityBeds: Number(editCapacity) || 1,
      status: editStatus,
      projectId: editProjectId || undefined,
      projectName: projects.find(p => p.id === editProjectId)?.name,
      rentalVendor: editOwnership === 'Rented' ? editRentalVendor.trim() || undefined : undefined,
      rentalAgreementNumber: editOwnership === 'Rented' ? editRentalAgreementNumber.trim() || undefined : undefined,
      rentalStartDate: editOwnership === 'Rented' ? editRentalStartDate || undefined : undefined,
      rentalEndDate: editOwnership === 'Rented' ? editRentalEndDate || undefined : undefined,
      rentalRateType: editOwnership === 'Rented' ? editRentalRateType : undefined,
      rentalRatePerUnit: editOwnership === 'Rented' && editRentalRatePerUnit !== '' ? Number(editRentalRatePerUnit) : undefined,
      rentalMonthlyCost: editOwnership === 'Rented' && editRentalMonthlyCost !== '' ? Number(editRentalMonthlyCost) : undefined,
      rentalDepositPaid: editOwnership === 'Rented' && editRentalDepositPaid !== '' ? Number(editRentalDepositPaid) : undefined,
      rentalBillingCycle: editOwnership === 'Rented' ? editRentalBillingCycle : undefined,
      amenities: editAmenities,
      contactPerson: editContactPerson.trim() || undefined,
      contactPhone: editContactPhone.trim() || undefined,
      notes: editNotes.trim() || undefined,
    };

    onUpdate(updatedUnit);
    setIsEditModalOpen(false);
  };

  // Save Staff Assignment
  const handleSaveAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignEmployeeId) return;

    assignEmployeeToAccommodation(unit.id, assignEmployeeId, assignRoomNumber);
    setIsAssignModalOpen(false);
    setAssignEmployeeId('');
    setAssignRoomNumber('');
  };

  // Save Utility Log
  const handleSaveUtility = (e: React.FormEvent) => {
    e.preventDefault();
    if (utilAmount === '' || Number(utilAmount) <= 0) return;

    const newLog: AccommodationUtilityLog = {
      id: `ACC-UTL-${Math.floor(1000 + Math.random() * 9000)}`,
      accommodationId: unit.id,
      accommodationName: unit.name,
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
    setUtilAmount('');
    setUtilUnitsConsumed('');
    setUtilVendor('');
    setUtilInvoiceNo('');
    setUtilReceiptPhoto('');
    setUtilReceiptName('');
    setUtilNotes('');
  };

  // Handle receipt image file select
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

  // Open Log Payment Modal
  const handleOpenLogPayment = (paymentToEdit?: AccommodationPaymentLog) => {
    if (paymentToEdit) {
      setEditingPaymentId(paymentToEdit.id);
      setPayBillingPeriod(paymentToEdit.billingPeriod);
      setPayDate(paymentToEdit.paymentDate);
      setPayOccupantCount(paymentToEdit.occupantCount);
      setPayAmountDue(paymentToEdit.amountDueZAR);
      setPayAmountPaid(paymentToEdit.amountPaidZAR);
      setPayMethod(paymentToEdit.paymentMethod);
      setPayReference(paymentToEdit.referenceNumber || '');
      setPayVendor(paymentToEdit.paidToVendor || unit.rentalVendor || '');
      setPayStatus(paymentToEdit.status);
      setPayProofUrl(paymentToEdit.proofOfPaymentUrl || null);
      setPayProofFileName(paymentToEdit.proofOfPaymentFileName || null);
      setPayNotes(paymentToEdit.notes || '');
    } else {
      const calculatedLease = calculateAccommodationMonthlyCost(unit);
      setEditingPaymentId(null);
      const now = new Date();
      setPayBillingPeriod(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
      setPayDate(now.toISOString().split('T')[0]);
      setPayOccupantCount(unit.occupantIds?.length || 0);
      setPayAmountDue(calculatedLease);
      setPayAmountPaid(calculatedLease);
      setPayMethod('EFT / Bank Transfer');
      setPayReference(`EFT-${unit.id}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`);
      setPayVendor(unit.rentalVendor || '');
      setPayStatus('Paid');
      setPayProofUrl(null);
      setPayProofFileName(null);
      setPayNotes('');
    }
    setIsPaymentModalOpen(true);
  };

  // Save Payment Log
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const due = payAmountDue === '' ? 0 : Number(payAmountDue);
    const paid = payAmountPaid === '' ? 0 : Number(payAmountPaid);

    const paymentObj: AccommodationPaymentLog = {
      id: editingPaymentId || `ACC-PAY-${Date.now()}`,
      accommodationId: unit.id,
      accommodationName: unit.name,
      billingPeriod: payBillingPeriod,
      paymentDate: payDate,
      occupantCount: payOccupantCount,
      amountDueZAR: due,
      amountPaidZAR: paid,
      paymentMethod: payMethod,
      referenceNumber: payReference.trim() || undefined,
      paidToVendor: payVendor.trim() || unit.rentalVendor || undefined,
      status: payStatus,
      proofOfPaymentUrl: payProofUrl || undefined,
      proofOfPaymentFileName: payProofFileName || undefined,
      loggedBy: 'Current User',
      notes: payNotes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    if (editingPaymentId) {
      updateAccommodationPayment(paymentObj);
    } else {
      addAccommodationPayment(paymentObj);
    }
    setIsPaymentModalOpen(false);
  };

  // Handle proof of payment file upload
  const handlePaymentProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPayProofFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPayProofUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
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
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start sm:items-center gap-4">
          <button
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Back to Accommodation Hub"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-400">Accommodations</span>
              <span className="text-xs text-slate-400">/</span>
              {unit.ownership === 'Owned' ? (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Company Owned
                </span>
              ) : (
                <span className="bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Home className="w-3 h-3" /> Leased / Rented
                </span>
              )}
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-md">
                {unit.type}
              </span>
              {unit.totalRooms !== undefined && unit.totalRooms > 0 && (
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                  <DoorClosed className="w-3 h-3 text-slate-400" /> {unit.totalRooms} Rooms
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              {unit.name}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {unit.location} {unit.address ? `• ${unit.address}` : ''}
              {unit.projectName ? ` • Linked: ${unit.projectName}` : ''}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            onClick={() => generateAccommodationMonthlyPDF(unit, unitUtilities, employees, facilityPayments)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-sm"
            title="Download Monthly PDF Statement"
          >
            <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Print Monthly Report
          </button>

          <button
            onClick={() => exportSingleAccommodationToExcel(unit, employees, unitUtilities, facilityPayments)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-sm"
            title="Export Clean Multi-Sheet Excel (.xlsx)"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Export Excel
          </button>

          {unit.ownership === 'Rented' && (
            <button
              onClick={() => handleOpenLogPayment()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition shadow-sm"
              title="Log Monthly Lease Payment"
            >
              <CreditCard className="w-4 h-4" /> Log Payment
            </button>
          )}

          <button
            onClick={() => setIsUtilityModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition shadow-sm"
          >
            <Zap className="w-4 h-4" /> Post Utility Bill
          </button>

          <button
            onClick={() => setIsAssignModalOpen(true)}
            disabled={stats.vacantBeds === 0}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
              stats.vacantBeds === 0
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-[#0B5FFF] hover:bg-blue-700 text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" /> Allocate Staff
          </button>

          <button
            onClick={handleOpenEditModal}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition"
            title="Edit Facility Configuration"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Bed Capacity & Occupancy Rate */}
        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bed Capacity & Occupancy</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-[#0B5FFF] dark:text-blue-400 rounded-xl">
              <Bed className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.occupiedBeds} <span className="text-slate-400 text-base font-normal">/ {stats.totalBeds}</span>
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">({stats.occupancyRate}% Full)</span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                stats.occupancyRate >= 90 ? 'bg-amber-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'
              }`}
              style={{ width: `${Math.min(100, stats.occupancyRate)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>{stats.vacantBeds} beds vacant</span>
            <span>{unit.totalRooms ? `${unit.totalRooms} rooms` : `${stats.occupiedBeds} housed`}</span>
          </div>
        </Card>

        {/* Card 2: Active Monthly Lease Incurred */}
        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Monthly Lease</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {formatZAR(stats.activeMonthlyLease)}
            </span>
            <span className="text-xs text-slate-500">/ mo</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 truncate" title={getAccommodationRateDescription(unit)}>
            {getAccommodationRateDescription(unit)}
          </p>
        </Card>

        {/* Card 3: Utility Bills Logged */}
        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Utilities & Running Bills</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {formatZAR(stats.totalUtilitiesCost)}
            </span>
            <span className="text-xs text-slate-500">total</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {unitUtilities.length} utility receipt{unitUtilities.length !== 1 ? 's' : ''} recorded
          </p>
        </Card>

        {/* Card 4: Total Operational Cost */}
        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Monthly Facility Cost</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {formatZAR(stats.totalFacilityCost)}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Avg: {formatZAR(stats.costPerOccupant)} / worker / mo
          </p>
        </Card>
      </div>

      {/* Tab Navigation Controls */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap">
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'roster'
              ? 'bg-[#0B5FFF] text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Users className="h-4 w-4" /> Resident Personnel ({occupants.length})
        </button>
        <button
          onClick={() => setActiveTab('utilities')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'utilities'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Zap className="h-4 w-4" /> Utilities & Receipts ({unitUtilities.length})
        </button>
        {(unit.ownership === 'Rented' || facilityPayments.length > 0) && (
          <button
            onClick={() => setActiveTab('lease')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'lease'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <CreditCard className="h-4 w-4" /> Lease & Payments Tracking ({facilityPayments.length})
          </button>
        )}
        <button
          onClick={() => setActiveTab('specs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'specs'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Building2 className="h-4 w-4" /> Amenities & Access Notes
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: RESIDENT PERSONNEL & ROOM ALLOCATIONS                              */}
      {/* ========================================================================= */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Resident Workers & Room Allocations</h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Manage room numbers, track employee check-in dates, and allocate beds.
              </p>
            </div>

            <button
              onClick={() => setIsAssignModalOpen(true)}
              disabled={stats.vacantBeds === 0}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm self-start sm:self-auto ${
                stats.vacantBeds === 0
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-[#0B5FFF] hover:bg-blue-700 text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" /> + Allocate Worker
            </button>
          </div>

          {occupants.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No personnel currently allocated</h3>
              <p className="text-slate-500 text-xs mt-1">{stats.vacantBeds} beds available across {unit.totalRooms || 1} rooms.</p>
              <button 
                onClick={() => setIsAssignModalOpen(true)} 
                className="mt-4 px-4 py-2 bg-[#0B5FFF] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                + Allocate Employee
              </button>
            </div>
          ) : (
            <Card className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5">Worker</th>
                      <th className="px-4 py-3.5">Position / Role</th>
                      <th className="px-4 py-3.5">Department</th>
                      <th className="px-4 py-3.5">Room / Bed #</th>
                      <th className="px-4 py-3.5">Check-In Date</th>
                      <th className="px-4 py-3.5">Phone Number</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {occupants.map(emp => {
                      const displayName = getEmpDisplayName(emp);
                      const displayRole = getEmpDisplayRole(emp);

                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                          <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                              {getEmpInitials(emp)}
                            </div>
                            <div>
                              <div className="font-semibold">{displayName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{emp.id}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-800 dark:text-slate-200 font-semibold">
                            {displayRole}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                            {emp.department || 'Operations'}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-cyan-300">
                              {emp.accommodationDetails?.roomNumber || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400 text-xs">
                            {emp.accommodationDetails?.checkInDate || unit.createdAt || '—'}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                            {emp.phone || '—'}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-right">
                            <button
                              onClick={() => {
                                if (window.confirm(`Vacate bed and check out ${displayName} from ${unit.name}?`)) {
                                  removeEmployeeFromAccommodation(unit.id, emp.id);
                                }
                              }}
                              className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-500/20 transition"
                            >
                              Vacate Bed
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: UTILITIES & RECEIPTS LEDGER                                       */}
      {/* ========================================================================= */}
      {activeTab === 'utilities' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Utilities & Running Expenses for {unit.name}</h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Record Eskom prepaid tokens, municipal water tankers, diesel receipts, gas refills, and WiFi bills.
              </p>
            </div>

            <button
              onClick={() => setIsUtilityModalOpen(true)}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl transition-colors text-xs font-semibold shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Post Utility Bill / Receipt
            </button>
          </div>

          {unitUtilities.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
              <Zap className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No utilities logged for this facility</h3>
              <p className="text-slate-500 text-xs mt-1">Record electricity tokens, water delivery, generator fuel, or gas bills.</p>
              <button 
                onClick={() => setIsUtilityModalOpen(true)} 
                className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                + Post Utility Bill
              </button>
            </div>
          ) : (
            <Card className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5">Date</th>
                      <th className="px-4 py-3.5">Category</th>
                      <th className="px-4 py-3.5">Units / Consumed</th>
                      <th className="px-4 py-3.5">Cost (ZAR)</th>
                      <th className="px-4 py-3.5">Vendor / Receipt #</th>
                      <th className="px-4 py-3.5">Receipt Attachment</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {unitUtilities.map(util => (
                      <tr key={util.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {util.date}
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
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 text-[11px] transition"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Receipt
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs italic">No attachment</span>
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
      {/* TAB 3: LEASE TERMS & PAYMENT TRACKING                                     */}
      {/* ========================================================================= */}
      {activeTab === 'lease' && (
        <div className="space-y-6">
          {/* Top Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Home className="w-5 h-5 text-amber-500" />
                Landlord & Rental Agreement
              </h3>

              <div className="space-y-3 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Landlord / Leasing Agency:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{unit.rentalVendor || 'Private Landlord'}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Lease Agreement / PO Number:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{unit.rentalAgreementNumber || 'N/A'}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Pricing Model:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{unit.rentalRateType || 'Fixed Monthly'}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Unit Rate / Base Amount:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {formatZAR(unit.rentalRatePerUnit || unit.rentalMonthlyCost || 0)}
                  </span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Active Monthly Lease Cost:</span>
                  <span className="font-mono font-extrabold text-purple-600 dark:text-purple-400 text-sm">
                    {formatZAR(stats.activeMonthlyLease)}
                  </span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Deposit Paid:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {unit.rentalDepositPaid ? formatZAR(unit.rentalDepositPaid) : 'R 0.00'}
                  </span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Billing Cycle:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{unit.rentalBillingCycle || 'Monthly'}</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                Lease Duration & Validity
              </h3>

              <div className="space-y-3 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Lease Commencement Date:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{unit.rentalStartDate || 'Ongoing'}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Lease Expiry Date:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{unit.rentalEndDate || 'Ongoing'}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Facility Manager / Contact:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{unit.contactPerson || 'N/A'}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Manager Contact Phone:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{unit.contactPhone || 'N/A'}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Total Payments Recorded:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{facilityPayments.length} payment records</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Total Lease Amount Disbursed:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatZAR(facilityPayments.reduce((sum, p) => sum + (p.amountPaidZAR || 0), 0))}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Payment Tracking & History Ledger */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Monthly Lease Payment Tracking Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Track monthly lease distributions calculated against active resident worker occupancies.
                </p>
              </div>

              <button
                onClick={() => handleOpenLogPayment()}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm self-start sm:self-auto"
              >
                <CreditCard className="w-4 h-4" /> Log Lease Payment
              </button>
            </div>

            {facilityPayments.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <CreditCard className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Lease Payments Logged Yet</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Log your first monthly lease payout for resident employee housing. Keep proof of payment slips and invoice vouchers organized.
                </p>
                <button 
                  onClick={() => handleOpenLogPayment()} 
                  className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  + Log First Lease Payment
                </button>
              </div>
            ) : (
              <Card className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3.5">Payment Date</th>
                        <th className="px-4 py-3.5">Billing Month</th>
                        <th className="px-4 py-3.5">Resident Staff</th>
                        <th className="px-4 py-3.5">Lease Incurred</th>
                        <th className="px-4 py-3.5">Amount Paid</th>
                        <th className="px-4 py-3.5">Method / Ref #</th>
                        <th className="px-4 py-3.5">Vendor / Landlord</th>
                        <th className="px-4 py-3.5">Proof of Payment</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {facilityPayments.map(pay => (
                        <tr key={pay.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                          <td className="px-4 py-3.5 whitespace-nowrap text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {pay.paymentDate}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                            {pay.billingPeriod}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{pay.occupantCount} staff</span>
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
                          <td className="px-4 py-3.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                            {pay.paidToVendor || unit.rentalVendor || 'Landlord'}
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
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenLogPayment(pay)}
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                                title="Edit Payment Log"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete payment log "${pay.billingPeriod} - ${formatZAR(pay.amountPaidZAR)}"?`)) {
                                    deleteAccommodationPayment(pay.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 transition"
                                title="Delete Payment Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AMENITIES & ACCESS NOTES                                          */}
      {/* ========================================================================= */}
      {activeTab === 'specs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Active Amenities & Facilities
            </h3>

            {unit.amenities && unit.amenities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {unit.amenities.map(am => (
                  <div key={am} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>{am}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-xs italic">No specific amenities logged for this facility.</p>
            )}
          </Card>

          <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-500" />
              Site Notes & Gate Access Information
            </h3>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {unit.notes || 'No security notes or access instructions recorded.'}
            </div>

            <div className="pt-2 text-xs text-slate-500">
              <span>Facility registered on: <strong>{unit.createdAt || 'N/A'}</strong></span>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: POST UTILITY BILL & RECEIPT ATTACHMENT                           */}
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
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Post Utility Bill / Receipt for {unit.name}</h3>
                  <p className="text-slate-500 text-xs">Record Eskom electricity tokens, municipal water, fuel, or gas receipts.</p>
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

              {/* Receipt Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Attach Receipt / Token Voucher Image
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleReceiptFileChange}
                    className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950/60 dark:file:text-indigo-300 hover:file:bg-indigo-100"
                  />
                  {utilReceiptPhoto && (
                    <button
                      type="button"
                      onClick={() => setViewingReceiptUrl(utilReceiptPhoto)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-bold underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview Upload
                    </button>
                  )}
                </div>
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
      {/* MODAL 2: ALLOCATE STAFF MEMBER                                            */}
      {/* ========================================================================= */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <Card className="w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-2xl animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Assign Staff to {unit.name}</h3>
                  <p className="text-slate-500 text-xs">{stats.vacantBeds} vacant beds available.</p>
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
      {/* MODAL 3: EDIT FACILITY CONFIGURATION                                      */}
      {/* ========================================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <Card className="w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-2xl animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Facility: {unit.name}</h3>
                  <p className="text-slate-500 text-xs">Update pricing rates, room counts, and lease agreement specs.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto flex-1 text-slate-900 dark:text-slate-100">
              {/* Ownership Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Ownership Model *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditOwnership('Owned')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      editOwnership === 'Owned'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Shield className="w-4 h-4" /> Company Owned
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditOwnership('Rented')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      editOwnership === 'Rented'
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
                    Facility Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Property Structure Type *
                  </label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as AccommodationType)}
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
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Physical Address
                  </label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
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
                      value={editTotalRooms}
                      onChange={(e) => handleEditRoomsChange(e.target.value === '' ? '' : Number(e.target.value))}
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
                      value={editBedsPerRoom}
                      onChange={(e) => handleEditBedsPerRoomChange(e.target.value === '' ? '' : Number(e.target.value))}
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
                      value={editCapacity}
                      onChange={(e) => setEditCapacity(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                    />
                  </div>
                </div>

                {editTotalRooms !== '' && editBedsPerRoom !== '' && Number(editTotalRooms) > 0 && Number(editBedsPerRoom) > 0 && (
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1.5 pt-0.5">
                    ✨ Auto-calculated: {editTotalRooms} room{Number(editTotalRooms) > 1 ? 's' : ''} × {editBedsPerRoom} bed{Number(editBedsPerRoom) > 1 ? 's' : ''}/room = <strong>{editCapacity} total beds</strong>
                  </p>
                )}
              </div>

              {/* Rented Lease Details Section (Only if Rented) */}
              {editOwnership === 'Rented' && (
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
                        value={editRentalVendor}
                        onChange={(e) => setEditRentalVendor(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Lease Agreement #</label>
                      <input
                        type="text"
                        placeholder="e.g. PO-2026-ACC-88"
                        value={editRentalAgreementNumber}
                        onChange={(e) => setEditRentalAgreementNumber(e.target.value)}
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
                        value={editRentalRateType}
                        onChange={(e) => setEditRentalRateType(e.target.value as RentalRateType)}
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
                        {editRentalRateType === 'Fixed Monthly'
                          ? 'Fixed Monthly Rent (ZAR) *'
                          : editRentalRateType === 'Per Occupant / Bed (Monthly)'
                          ? 'Rate per Occupant / Month (ZAR) *'
                          : editRentalRateType === 'Per Room (Monthly)'
                          ? 'Rate per Room / Month (ZAR) *'
                          : 'Rate per Person / Night (ZAR) *'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 3500"
                        value={editRentalRatePerUnit !== '' ? editRentalRatePerUnit : (editRentalMonthlyCost !== '' ? editRentalMonthlyCost : '')}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Number(e.target.value);
                          setEditRentalRatePerUnit(val);
                          setEditRentalMonthlyCost(val);
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
                        value={editRentalStartDate}
                        onChange={(e) => setEditRentalStartDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Lease End Date</label>
                      <input
                        type="date"
                        value={editRentalEndDate}
                        onChange={(e) => setEditRentalEndDate(e.target.value)}
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
                    const selected = editAmenities.includes(amenity);
                    return (
                      <button
                        type="button"
                        key={amenity}
                        onClick={() => {
                          if (selected) {
                            setEditAmenities(editAmenities.filter(a => a !== amenity));
                          } else {
                            setEditAmenities([...editAmenities, amenity]);
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
                    value={editContactPerson}
                    onChange={(e) => setEditContactPerson(e.target.value)}
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
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#0B5FFF] hover:bg-blue-700 text-white shadow-sm"
                >
                  Save Changes
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
      {/* MODAL 5: LOG LEASE PAYMENT                                                */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <Card className="w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-2xl animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingPaymentId ? 'Edit Lease Payment' : 'Log Monthly Lease Payment'}
                  </h3>
                  <p className="text-slate-500 text-xs">
                    {unit.name} • Record monthly lease distribution for resident employees.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-6 space-y-4 overflow-y-auto flex-1 text-slate-900 dark:text-slate-100">
              {/* Dynamic Rent Breakdown Banner */}
              <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-purple-900 dark:text-purple-200">
                  <span className="flex items-center gap-1.5"><Home className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Active Pricing Model:</span>
                  <span>{unit.rentalRateType || 'Fixed Monthly'}</span>
                </div>
                <div className="text-purple-700 dark:text-purple-300 text-[11px]">
                  {getAccommodationRateDescription(unit)}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Billing Period Month *
                  </label>
                  <input
                    type="month"
                    required
                    value={payBillingPeriod}
                    onChange={(e) => setPayBillingPeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Resident Staff Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={payOccupantCount}
                    onChange={(e) => setPayOccupantCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Lease Due (ZAR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={payAmountDue}
                    onChange={(e) => setPayAmountDue(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Amount Paid (ZAR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={payAmountPaid}
                    onChange={(e) => setPayAmountPaid(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-purple-400 dark:border-purple-600 bg-white dark:bg-slate-900 text-xs font-mono font-extrabold text-purple-700 dark:text-purple-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                  >
                    <option value="EFT / Bank Transfer">EFT / Bank Transfer</option>
                    <option value="Direct Debit">Direct Debit</option>
                    <option value="Company Cheque">Company Cheque</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Payment Status *
                  </label>
                  <select
                    value={payStatus}
                    onChange={(e) => setPayStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                  >
                    <option value="Paid">Paid (Full Settlement)</option>
                    <option value="Partial">Partial Payment</option>
                    <option value="Pending">Pending Approval / Release</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    EFT / Transaction Reference #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EFT-2026-AUG-88"
                    value={payReference}
                    onChange={(e) => setPayReference(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Paid to Landlord / Vendor
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Standerton Property Rentals"
                    value={payVendor}
                    onChange={(e) => setPayVendor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>

              {/* Proof of Payment Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Attach Proof of Payment (POP Slip / Bank Receipt / PDF)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handlePaymentProofChange}
                    className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 dark:file:bg-purple-950/60 dark:file:text-purple-300 hover:file:bg-purple-100"
                  />
                  {payProofUrl && (
                    <button
                      type="button"
                      onClick={() => setViewingProofUrl(payProofUrl)}
                      className="text-xs text-purple-600 dark:text-purple-400 font-bold underline flex items-center gap-1 shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview POP
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Notes & Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. August rent settled via FNB Corporate banking, authorized by Project Director"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                >
                  {editingPaymentId ? 'Update Payment' : 'Log Payment'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: PROOF OF PAYMENT PHOTO VIEWER                                    */}
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
