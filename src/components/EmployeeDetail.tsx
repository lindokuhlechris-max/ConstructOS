import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, CustomSelect } from './ui';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Briefcase, 
  Building, 
  Calendar, 
  ShieldCheck, 
  Lock,
  Award, 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  Edit3, 
  Plus, 
  UserCheck, 
  Activity as ActivityIcon, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Printer, 
  X, 
  Eye, 
  Camera, 
  User, 
  PhoneCall, 
  HeartHandshake,
  Crown,
  Layers,
  MapPin,
  CheckSquare,
  CalendarDays,
  Check,
  X as XIcon,
  Home,
  Bus,
  Navigation
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Employee, EmployeeCertificate, Activity, EmployeeStatus, LeaveRecord, LeaveType, LeaveStatus, LabourLog, WorkerCheckIn, canUserEditSection } from '../types';

export const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'Active':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50';
    case 'Absent':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50';
    case 'On Leave':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50';
    case 'Terminated':
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    case 'Induction':
      return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/50';
    case 'Under Review':
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/50';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400';
  }
};

interface EmployeeDetailProps {
  employee: Employee;
  onSave: (updatedEmployee: Employee) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export function EmployeeDetail({ employee, onSave, onClose, onDelete }: EmployeeDetailProps) {
  const { 
    activities, 
    teams, 
    workerCheckIns, 
    labourLogs, 
    projects, 
    addLabourLog, 
    deleteLabourLog, 
    addWorkerCheckIn, 
    deleteWorkerCheckIn, 
    updateActivity, 
    currentUserProfile,
    accommodations,
    assignEmployeeToAccommodation,
    removeEmployeeFromAccommodation
  } = useAppContext();
  const canEditLabour = canUserEditSection(currentUserProfile, 'labour');

  // Active Tab: 'overview' | 'certificates' | 'tasks' | 'attendance' | 'leave'
  const [activeTab, setActiveTab] = useState<'overview' | 'certificates' | 'tasks' | 'attendance' | 'leave'>('overview');

  // Leave Request Modal State
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState<{
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
    status: LeaveStatus;
  }>({
    leaveType: 'Annual Leave',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
    status: 'Approved'
  });

  // Logistics Modal State
  const [isEditingLogistics, setIsEditingLogistics] = useState(false);
  const [logisticsData, setLogisticsData] = useState<{
    hasAccommodation: boolean;
    accommodationDetails: {
      campId?: string;
      campName?: string;
      roomNumber?: string;
      checkInDate?: string;
      subsidyAmount?: number;
      notes?: string;
    };
    hasTransport: boolean;
    transportDetails: { route?: string; pickupPoint?: string };
  }>({
    hasAccommodation: false,
    accommodationDetails: { campId: '', campName: '', roomNumber: '', subsidyAmount: 0, notes: '' },
    hasTransport: false,
    transportDetails: { route: '', pickupPoint: '' }
  });

  // Leave Allowance Edit Modal State
  const [showEditAllowanceModal, setShowEditAllowanceModal] = useState(false);
  const [allowanceForm, setAllowanceForm] = useState({
    annualTotal: employee.leaveBalance?.annualTotal ?? 15,
    sickTotal: employee.leaveBalance?.sickTotal ?? 10,
    casualTotal: employee.leaveBalance?.casualTotal ?? 5,
  });

  // Certificate Modal State
  const [showCertModal, setShowCertModal] = useState(false);
  const [editingCert, setEditingCert] = useState<EmployeeCertificate | null>(null);
  const [certForm, setCertForm] = useState<Partial<EmployeeCertificate>>({
    type: 'White Card',
    status: 'Valid',
    uploadDate: new Date().toISOString().split('T')[0],
  });

  // Log Hours Modal State
  const [showLogHoursModal, setShowLogHoursModal] = useState(false);
  const [hoursForm, setHoursForm] = useState({
    projectId: projects[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    hoursWorked: 8.0,
    shiftType: 'Normal Shift',
    activityId: '',
    trade: employee.position || 'Site Operator',
    location: 'Zone A',
    notes: 'Site work logged',
  });

  // Assign to Task / Team Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState('');

  // Full Profile Edit Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState<Employee>({ ...employee });

  // Photo Lightbox State
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Teams this employee belongs to
  const employeeTeams = teams.filter(t => t.memberIds?.includes(employee.id) || t.leaderId === employee.id);

  // Activities assigned to this employee or their teams
  const employeeActivities = activities.filter(a => 
    employee.assignedActivities?.includes(a.id) || 
    employeeTeams.some(t => t.name.toLowerCase() === (a.assignedTo || '').toLowerCase())
  );

  // Attendance & Check-in history
  const attendanceHistory = workerCheckIns.filter(c => c.workerName?.toLowerCase().includes(employee.firstName.toLowerCase()));

  // Open Add Certificate Modal
  const handleOpenAddCert = () => {
    setEditingCert(null);
    setCertForm({
      title: '',
      type: 'White Card',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      status: 'Valid',
      uploadDate: new Date().toISOString().split('T')[0],
    });
    setShowCertModal(true);
  };

  // Open Edit Certificate Modal
  const handleOpenEditCert = (cert: EmployeeCertificate) => {
    setEditingCert(cert);
    setCertForm({ ...cert });
    setShowCertModal(true);
  };

  // Submit Certificate Add / Edit
  const handleSaveCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certForm.title) return;

    let updatedCerts: EmployeeCertificate[] = [];
    if (editingCert) {
      updatedCerts = (employee.certificates || []).map(c => 
        c.id === editingCert.id 
          ? {
              ...c,
              title: certForm.title!,
              type: certForm.type as any || 'White Card',
              issueDate: certForm.issueDate,
              expiryDate: certForm.expiryDate,
              status: certForm.status as any || 'Valid',
              fileUrl: certForm.fileUrl || c.fileUrl
            }
          : c
      );
    } else {
      const newCert: EmployeeCertificate = {
        id: `CERT-${Math.floor(1000 + Math.random() * 9000)}`,
        title: certForm.title,
        type: certForm.type as any || 'White Card',
        issueDate: certForm.issueDate || new Date().toISOString().split('T')[0],
        expiryDate: certForm.expiryDate,
        status: certForm.status as any || 'Valid',
        uploadDate: new Date().toISOString().split('T')[0],
        fileUrl: certForm.fileUrl || ''
      };
      updatedCerts = [...(employee.certificates || []), newCert];
    }

    onSave({ ...employee, certificates: updatedCerts });
    setShowCertModal(false);
  };

  // Delete Certificate
  const handleDeleteCertificate = (certId: string) => {
    const updatedCerts = (employee.certificates || []).filter(c => c.id !== certId);
    onSave({ ...employee, certificates: updatedCerts });
  };

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Url = reader.result as string;
        const updatedPhotos = [...(employee.idPhotos || []), base64Url];
        onSave({ ...employee, idPhotos: updatedPhotos });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Log Hours Submission
  const handleLogHoursSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hoursForm.hoursWorked || hoursForm.hoursWorked <= 0) return;

    // Add Labour Log
    const newLabourLog: LabourLog = {
      id: `LL-${Math.floor(1000 + Math.random() * 9000)}`,
      projectId: hoursForm.projectId || projects[0]?.id || 'PRJ-001',
      activityId: selectedActivityId || '',
      workerType: 'Employee',
      workerName: `${employee.firstName} ${employee.lastName}`,
      date: hoursForm.date,
      trade: hoursForm.trade,
      hours: Number(hoursForm.hoursWorked),
      hoursWorked: Number(hoursForm.hoursWorked),
      notes: `${employee.firstName} ${employee.lastName} - ${hoursForm.shiftType}: ${hoursForm.notes}`,
    };
    addLabourLog(newLabourLog);

    // Add Check-In Record
    const newCheckIn: WorkerCheckIn = {
      id: `CHK-${Math.floor(1000 + Math.random() * 9000)}`,
      projectId: hoursForm.projectId || projects[0]?.id || 'PRJ-001',
      workerName: `${employee.firstName} ${employee.lastName}`,
      workerId: employee.id,
      timestamp: new Date().toISOString(),
      action: 'Check-In',
      location: { lat: -26.2041, lng: 28.0473 }
    };
    addWorkerCheckIn(newCheckIn);

    setShowLogHoursModal(false);
  };

  // Handle Assign to Task
  const handleAssignTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivityId) return;

    const existingAssigned = employee.assignedActivities || [];
    if (!existingAssigned.includes(selectedActivityId)) {
      const updated = {
        ...employee,
        assignedActivities: [...existingAssigned, selectedActivityId]
      };
      onSave(updated);
    }

    setShowAssignModal(false);
  };

  // Handle Full Profile Edit Save
  const handleSaveProfileModal = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(profileForm);
    setShowProfileModal(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(leaveForm.startDate);
    const end = new Date(leaveForm.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newLeave: LeaveRecord = {
      id: `LV-${Math.floor(1000 + Math.random() * 9000)}`,
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      daysCount: isNaN(daysCount) || daysCount < 1 ? 1 : daysCount,
      reason: leaveForm.reason || 'Leave requested',
      status: leaveForm.status,
      appliedDate: new Date().toISOString().split('T')[0],
    };

    const updatedRecords = [newLeave, ...(employee.leaveRecords || [])];
    let updatedStatus = employee.status;
    if (leaveForm.status === 'Approved') {
      updatedStatus = 'On Leave';
    }

    onSave({
      ...employee,
      status: updatedStatus,
      leaveRecords: updatedRecords
    });

    setShowLeaveModal(false);
  };

  const handleSaveAllowanceForm = (e: React.FormEvent) => {
    e.preventDefault();
    const approvedLeaves = (employee.leaveRecords || []).filter(l => l.status === 'Approved');
    const annualUsed = approvedLeaves.filter(l => l.leaveType === 'Annual Leave').reduce((s, l) => s + l.daysCount, 0);
    const sickUsed = approvedLeaves.filter(l => l.leaveType === 'Sick Leave').reduce((s, l) => s + l.daysCount, 0);
    const casualUsed = approvedLeaves.filter(l => l.leaveType === 'Personal / Casual').reduce((s, l) => s + l.daysCount, 0);

    onSave({
      ...employee,
      leaveBalance: {
        annualTotal: Number(allowanceForm.annualTotal),
        annualUsed,
        sickTotal: Number(allowanceForm.sickTotal),
        sickUsed,
        casualTotal: Number(allowanceForm.casualTotal),
        casualUsed,
      }
    });

    setShowEditAllowanceModal(false);
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* Top App Header Action Bar (Full Width) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#0B5FFF]/10 dark:bg-blue-900/30 border-2 border-[#0B5FFF]/30 flex items-center justify-center text-[#0B5FFF] dark:text-blue-300 font-bold text-2xl shrink-0 overflow-hidden shadow-sm">
              {employee.avatar ? (
                <img src={employee.avatar} alt={employee.firstName} className="w-full h-full object-cover" />
              ) : (
                `${employee.firstName[0]}${employee.lastName[0]}`
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {employee.firstName} {employee.lastName}
                </h1>
                <Badge variant="outline" className="text-xs font-mono">{employee.id}</Badge>
                <Badge variant="default" className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 text-xs">
                  {employee.department}
                </Badge>
                {/* Interactive Quick Status Selector */}
                <div className="relative inline-block">
                  <select
                    value={employee.status || 'Active'}
                    onChange={(e) => onSave({ ...employee, status: e.target.value as EmployeeStatus })}
                    className={`cursor-pointer font-bold text-xs px-3 py-1 rounded-full border shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]/30 ${getStatusBadgeStyle(employee.status || 'Active')}`}
                    title="Click to change employee status"
                  >
                    <option value="Active">🟢 Active</option>
                    <option value="Absent">🔴 Absent</option>
                    <option value="On Leave">🟡 On Leave</option>
                    <option value="Terminated">⚫ Terminated</option>
                    <option value="Induction">🔵 Induction</option>
                    <option value="Under Review">🟣 Under Review</option>
                  </select>
                </div>
              </div>
              <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                <Briefcase className="h-4 w-4 text-slate-400" />
                {employee.position}
              </p>
            </div>
          </div>
        </div>

        {/* Top Header Actions (Request Leave, Log Hours, Assign Task, Edit, Print, Delete) */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            onClick={() => setShowLeaveModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <HeartHandshake className="h-4 w-4" /> Request Leave
          </button>

          <button
            onClick={() => setShowLogHoursModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <Clock className="h-4 w-4" /> Log Hours
          </button>

          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <UserCheck className="h-4 w-4" /> Assign Task
          </button>

          <button
            onClick={() => { setProfileForm({ ...employee }); setShowProfileModal(true); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <Edit3 className="h-4 w-4 text-[#0B5FFF]" /> Edit Profile
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <Printer className="h-4 w-4 text-slate-500" /> Print
          </button>

          {onDelete && (
            <button
              onClick={() => onDelete(employee.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation Bar (Full Width) */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 w-full overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-[#0B5FFF] text-[#0B5FFF]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <User className="h-4 w-4" /> Overview & Bio
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'certificates'
              ? 'border-[#0B5FFF] text-[#0B5FFF]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="h-4 w-4" /> Certifications & Licenses ({employee.certificates?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'tasks'
              ? 'border-[#0B5FFF] text-[#0B5FFF]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ActivityIcon className="h-4 w-4" /> Assigned Tasks ({employeeActivities.length})
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'attendance'
              ? 'border-[#0B5FFF] text-[#0B5FFF]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="h-4 w-4" /> Attendance & Hours ({attendanceHistory.length})
        </button>

        <button
          onClick={() => setActiveTab('leave')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'leave'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <HeartHandshake className="h-4 w-4 text-amber-500" /> HR Leave & Balances ({(employee.leaveRecords || []).length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & BIO */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* Main Info Columns */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="w-full">
              <CardHeader className="flex justify-between items-center">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <User className="h-5 w-5 text-[#0B5FFF]" /> Contact & Employment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Full Legal Name</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{employee.firstName} {employee.lastName}</p>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Position / Job Title</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-slate-400" />
                      {employee.position}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Department</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Building className="h-4 w-4 text-slate-400" />
                      {employee.department}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Date of Hire</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {employee.hireDate || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Email Address</span>
                    <a href={`mailto:${employee.email}`} className="text-sm font-bold text-[#0B5FFF] hover:underline flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-slate-400" />
                      {employee.email || 'No email registered'}
                    </a>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Contact Phone</span>
                    <a href={`tel:${employee.phone}`} className="text-sm font-bold text-[#0B5FFF] hover:underline flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-slate-400" />
                      {employee.phone || 'No phone registered'}
                    </a>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Assigned Work Teams</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {employeeTeams.map(t => (
                        <Badge key={t.id} variant="default" className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 text-xs">
                          {t.leaderId === employee.id && <Crown className="h-3 w-3 text-amber-500 mr-1" />}
                          {t.name}
                        </Badge>
                      ))}
                      {employeeTeams.length === 0 && (
                        <span className="text-xs text-slate-400 italic">Not assigned to any team</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Employment Status</span>
                    <Badge variant="outline" className="text-xs">{employee.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact & Notes Card */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <HeartHandshake className="h-5 w-5 text-rose-500" /> Emergency Contact & Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">Emergency Contact Person</h4>
                  {employee.emergencyContact && employee.emergencyContact.name ? (
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {employee.emergencyContact.name}
                      </p>
                      {employee.emergencyContact.phone && (
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <PhoneCall className="h-3.5 w-3.5 text-slate-400" />
                          {employee.emergencyContact.phone}
                        </p>
                      )}
                      {employee.emergencyContact.relationship && (
                        <p className="text-xs text-slate-500">
                          Relationship: {employee.emergencyContact.relationship}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 py-1">
                      <p className="text-xs text-slate-400 italic">No emergency contact provided.</p>
                      <button
                        onClick={() => { setProfileForm({ ...employee }); setShowProfileModal(true); }}
                        className="text-xs font-bold text-[#0B5FFF] hover:underline flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add Emergency Contact
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Site Notes / Bio</h4>
                  {employee.notes ? (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      {employee.notes}
                    </p>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                      <p className="text-xs text-slate-400 italic">No site notes or bio added yet.</p>
                      <button
                        onClick={() => { setProfileForm({ ...employee }); setShowProfileModal(true); }}
                        className="text-xs font-bold text-[#0B5FFF] hover:underline flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add Site Notes
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Accommodation & Transport Card */}
            <Card className="w-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Home className="h-5 w-5 text-indigo-600" /> Company Accommodation & Transport Logistics
                </CardTitle>
                <button
                  onClick={() => {
                    setLogisticsData({
                      hasAccommodation: employee.hasAccommodation || false,
                      accommodationDetails: {
                        campId: employee.accommodationDetails?.campId || '',
                        campName: employee.accommodationDetails?.campName || '',
                        roomNumber: employee.accommodationDetails?.roomNumber || '',
                        subsidyAmount: employee.accommodationDetails?.subsidyAmount || 0,
                        notes: employee.accommodationDetails?.notes || ''
                      },
                      hasTransport: employee.hasTransport || false,
                      transportDetails: {
                        route: employee.transportDetails?.route || '',
                        pickupPoint: employee.transportDetails?.pickupPoint || ''
                      }
                    });
                    setIsEditingLogistics(true);
                  }}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit Logistics
                </button>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Accommodation Box */}
                <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                      <Home className="h-4 w-4 text-indigo-600" /> Accommodation
                    </span>
                    <div className="flex items-center gap-1.5">
                      {employee.hasAccommodation && (() => {
                        const matchedUnit = accommodations.find(a => a.id === employee.accommodationDetails?.campId || a.name === employee.accommodationDetails?.campName);
                        if (matchedUnit) {
                          return (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              matchedUnit.ownership === 'Owned'
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            }`}>
                              {matchedUnit.ownership}
                            </span>
                          );
                        }
                        return null;
                      })()}
                      <Badge variant="default" className={employee.hasAccommodation ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}>
                        {employee.hasAccommodation ? 'Provided' : 'Self Housing'}
                      </Badge>
                    </div>
                  </div>
                  {employee.hasAccommodation ? (
                    <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300 pt-1">
                      <p className="font-bold text-indigo-950 dark:text-indigo-200">{employee.accommodationDetails?.campName || 'Central Site Camp'}</p>
                      <p className="text-slate-500">Room / Unit: <strong className="text-slate-700 dark:text-slate-300 font-mono">{employee.accommodationDetails?.roomNumber || 'Room 1'}</strong></p>
                      {employee.accommodationDetails?.checkInDate && (
                        <p className="text-slate-500 text-[11px]">Check-in Date: {employee.accommodationDetails.checkInDate}</p>
                      )}
                      {employee.accommodationDetails?.subsidyAmount ? (
                        <p className="text-slate-500">Monthly Subsidy: R {employee.accommodationDetails.subsidyAmount.toLocaleString()}</p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic pt-1">No company accommodation assigned.</p>
                  )}
                </div>

                {/* Transport Box */}
                <div className="p-4 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
                      <Bus className="h-4 w-4 text-teal-600" /> Transport
                    </span>
                    <Badge variant="default" className={employee.hasTransport ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-600"}>
                      {employee.hasTransport ? 'Shuttle Bus' : 'Own Transport'}
                    </Badge>
                  </div>
                  {employee.hasTransport ? (
                    <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300 pt-1">
                      <p className="font-bold">{employee.transportDetails?.route || 'Route 1 - Site Express'}</p>
                      <p className="text-slate-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-amber-500" /> Pickup: {employee.transportDetails?.pickupPoint || 'Central Stop'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic pt-1">No company transport assigned.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            <Card className="w-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Camera className="h-5 w-5 text-[#0B5FFF]" /> License Scans & Photos
                </CardTitle>
                <label className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0B5FFF] text-white text-xs font-semibold cursor-pointer hover:bg-blue-700 transition-colors shadow-sm">
                  <Upload className="h-3.5 w-3.5" /> Upload Photo
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </CardHeader>
              <CardContent className="p-6">
                {employee.idPhotos && employee.idPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {employee.idPhotos.map((url, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedPhoto(url)}
                        className="group relative h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer bg-slate-100 dark:bg-slate-800"
                      >
                        <img src={url} alt={`ID Photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye className="h-5 w-5" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                    <Camera className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-500">No photos or license scans uploaded</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click "Upload Photo" above to attach documents.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dynamic Compliance & Safety Summary Card */}
            {(() => {
              const whiteCard = employee.certificates?.find(c => c.type === 'White Card');
              const highRisk = employee.certificates?.find(c => c.type === 'High Risk License');
              const firstAid = employee.certificates?.find(c => c.type === 'First Aid');

              return (
                <Card className="p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-slate-900 dark:to-slate-800/80 border-blue-100 dark:border-slate-800 w-full">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Compliance & Safety Summary</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">White Card Status</span>
                      {whiteCard ? (
                        <Badge variant={whiteCard.status === 'Valid' ? 'success' : whiteCard.status === 'Expiring Soon' ? 'warning' : 'danger'} className="text-[10px]">
                          {whiteCard.status.toUpperCase()}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-slate-400">NOT RECORDED</Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">High Risk Ticket</span>
                      {highRisk ? (
                        <Badge variant={highRisk.status === 'Valid' ? 'default' : 'outline'} className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 text-[10px]">
                          {highRisk.title || highRisk.status.toUpperCase()}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-slate-400">NOT RECORDED</Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">First Aid Certified</span>
                      {firstAid ? (
                        <Badge variant={firstAid.status === 'Valid' ? 'success' : 'danger'} className="text-[10px]">
                          {firstAid.expiryDate ? `VALID UNTIL ${firstAid.expiryDate.split('-')[0]}` : firstAid.status.toUpperCase()}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-slate-400">NOT RECORDED</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 2: CERTIFICATIONS & LICENSES */}
      {activeTab === 'certificates' && (
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#0B5FFF]" /> Safety Certifications & High-Risk Tickets
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Manage white cards, machinery operator tickets, first aid, and site safety inductions.</p>
            </div>
            <button
              onClick={handleOpenAddCert}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B5FFF] hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" /> Add Certificate
            </button>
          </CardHeader>
          <CardContent className="p-6">
            {(employee.certificates && employee.certificates.length > 0) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employee.certificates.map(cert => (
                <div key={cert.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-3 hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant="outline" className="text-[10px] font-bold uppercase">{cert.type}</Badge>
                      <div className="flex items-center gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          cert.status === 'Valid' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400' :
                          cert.status === 'Expiring Soon' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400' :
                          'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400'
                        }`}>
                          {cert.status}
                        </span>
                        <button 
                          onClick={() => handleOpenEditCert(cert)} 
                          className="p-1 text-slate-400 hover:text-[#0B5FFF] rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit Certificate"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{cert.title}</h4>

                    <div className="space-y-1 mt-3 text-xs text-slate-500">
                      {cert.issueDate && <p>Issued: <span className="font-semibold text-slate-700 dark:text-slate-300">{cert.issueDate}</span></p>}
                      {cert.expiryDate && <p>Expires: <span className="font-semibold text-slate-700 dark:text-slate-300">{cert.expiryDate}</span></p>}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    {cert.fileUrl ? (
                      <a 
                        href={cert.fileUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs font-bold text-[#0B5FFF] hover:underline flex items-center gap-1"
                      >
                        <Download className="h-3.5 w-3.5" /> View / Download
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No document attached</span>
                    )}

                    <button 
                      onClick={() => handleDeleteCertificate(cert.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Delete Certificate"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
              <ShieldCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Certificates Recorded</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                No safety inductions, white cards, or licenses have been registered for {employee.firstName} yet.
              </p>
              <button
                onClick={handleOpenAddCert}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B5FFF] hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
              >
                <Plus className="h-4 w-4" /> Add Certificate
              </button>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* TAB 3: ASSIGNED TASKS */}
      {activeTab === 'tasks' && (
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ActivityIcon className="h-5 w-5 text-[#0B5FFF]" /> Assigned Construction Tasks & Activities
            </CardTitle>
            <button
              onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <UserCheck className="h-4 w-4" /> Assign New Task
            </button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-xs font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Task ID</th>
                    <th className="px-4 py-3">Activity Name</th>
                    <th className="px-4 py-3">Discipline</th>
                    <th className="px-4 py-3">Assigned Team</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {employeeActivities.map(act => (
                    <tr key={act.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-[#0B5FFF]">{act.id}</td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{act.name}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px]">{act.discipline}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{act.assignedTo || 'Direct Assignment'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          act.status === 'Completed' ? 'bg-green-50 text-green-700' :
                          act.status === 'In Progress' ? 'bg-blue-50 text-blue-700' :
                          act.status === 'Blocked' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {act.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold">{act.progress}%</td>
                    </tr>
                  ))}

                  {employeeActivities.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                        No active construction tasks directly allocated to this employee yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: ATTENDANCE & HOURS LOG */}
      {activeTab === 'attendance' && (
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#0B5FFF]" /> Site Attendance & Logged Hours History
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Chronological record of daily site check-ins and logged labor hours for {employee.firstName} {employee.lastName}.</p>
            </div>
            <button
              onClick={() => setShowLogHoursModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <Clock className="h-4 w-4" /> Log Hours
            </button>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Role Permission Status Badge */}
            <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium ${
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
                  <strong>Role Access Level ({currentUserProfile?.role || 'Guest'}):</strong>{' '}
                  {canEditLabour 
                    ? 'Full permission granted to log, edit, or delete records.' 
                    : 'Read-only mode. Editing or deleting logged hours requires Administrator or permitted role.'}
                </span>
              </div>
              <Badge variant={canEditLabour ? 'success' : 'warning'} className="shrink-0 text-[10px] font-bold">
                {canEditLabour ? 'Editable & Removable' : 'Read-Only Mode'}
              </Badge>
            </div>

            {/* Logged Labor Hours Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" /> Logged Labor Hours
                </span>
                {canEditLabour ? (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Edit/Delete Allowed
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Restricted
                  </span>
                )}
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-xs font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3">Log ID</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Project / Activity</th>
                      <th className="px-4 py-3">Hours Worked</th>
                      <th className="px-4 py-3">Notes</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {labourLogs
                      .filter(log => 
                        (log.workerName && log.workerName.toLowerCase().includes(employee.firstName.toLowerCase())) ||
                        (log.notes && log.notes.toLowerCase().includes(employee.firstName.toLowerCase()))
                      )
                      .map(log => {
                        const projName = projects.find(p => p.id === log.projectId)?.name || log.projectId;
                        const actName = activities.find(a => a.id === log?.activityId)?.name || log?.activityId || 'General Labor';
                        return (
                          <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500">{log.id}</td>
                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{log.date}</td>
                            <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                              <div className="font-medium text-slate-900 dark:text-white">{projName}</div>
                              <div className="text-[10px] text-slate-500">{actName}</div>
                            </td>
                            <td className="px-4 py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              {log.hoursWorked || log.hours || 0} hrs
                              {log.startTime && log.endTime && (
                                <span className="block text-[10px] font-normal text-slate-500">{log.startTime} - {log.endTime}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px] truncate">
                              {log.notes || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {canEditLabour ? (
                                <button
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this logged hours record?')) {
                                      deleteLabourLog(log.id);
                                    }
                                  }}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                                  title="Delete Hours Record"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md" title="Role restricted">
                                  <Lock className="h-3 w-3 text-amber-600" /> Restricted
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                    {labourLogs.filter(log => 
                      (log.workerName && log.workerName.toLowerCase().includes(employee.firstName.toLowerCase())) ||
                      (log.notes && log.notes.toLowerCase().includes(employee.firstName.toLowerCase()))
                    ).length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500 text-xs">
                          No logged labor hours recorded for {employee.firstName}. Click "Log Hours" above to add one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Check-ins Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-blue-600" /> Site Check-In Logs
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-xs font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3">Record ID</th>
                      <th className="px-4 py-3">Date & Time</th>
                      <th className="px-4 py-3">Project / Site</th>
                      <th className="px-4 py-3">Trade / Role</th>
                      <th className="px-4 py-3 text-right">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {attendanceHistory.map(chk => (
                      <tr key={chk.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500">{chk.id}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{chk.timestamp ? new Date(chk.timestamp).toLocaleString() : 'N/A'}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{chk.projectId}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{chk.action || 'Check-In'}</td>
                        <td className="px-4 py-3 text-right">
                          <Badge variant="success" className="text-[10px]">{chk.action || 'Checked In'}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canEditLabour ? (
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this check-in record?')) {
                                  deleteWorkerCheckIn(chk.id);
                                }
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                              title="Delete Check-In Record"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Restricted</span>
                          )}
                        </td>
                      </tr>
                    ))}

                    {attendanceHistory.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500 text-xs">
                          No recent site check-in logs recorded for this personnel.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 5: HR LEAVE & BALANCES */}
      {activeTab === 'leave' && (
        <div className="space-y-6 w-full">
          {/* Header Action to Edit Custom Standards */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-amber-600" /> Employee Leave Standards & Entitlements
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Customize company-specific or contract-based leave allocations for {employee.firstName}.</p>
            </div>
            <button
              onClick={() => {
                setAllowanceForm({
                  annualTotal: employee.leaveBalance?.annualTotal ?? 15,
                  sickTotal: employee.leaveBalance?.sickTotal ?? 10,
                  casualTotal: employee.leaveBalance?.casualTotal ?? 5,
                });
                setShowEditAllowanceModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
            >
              <Edit3 className="h-3.5 w-3.5 text-[#0B5FFF]" /> Edit Leave Allocations
            </button>
          </div>

          {/* Leave Balances Header Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-amber-700 dark:text-amber-400">Annual Leave</span>
                <CalendarDays className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {Math.max(0, (employee.leaveBalance?.annualTotal ?? 15) - ((employee.leaveRecords || []).filter(l => l.status === 'Approved' && l.leaveType === 'Annual Leave').reduce((s, l) => s + l.daysCount, 0)))} <span className="text-xs font-normal text-slate-500">/ {employee.leaveBalance?.annualTotal ?? 15} days left</span>
              </p>
              <div className="w-full bg-amber-200/50 dark:bg-amber-900/40 rounded-full h-1.5 mt-3 overflow-hidden">
                <div 
                  className="bg-amber-500 h-1.5 rounded-full" 
                  style={{ width: `${Math.min(100, Math.max(0, ((Math.max(0, (employee.leaveBalance?.annualTotal ?? 15) - ((employee.leaveRecords || []).filter(l => l.status === 'Approved' && l.leaveType === 'Annual Leave').reduce((s, l) => s + l.daysCount, 0)))) / (employee.leaveBalance?.annualTotal ?? 15)) * 100))}%` }} 
                />
              </div>
            </div>

            <div className="p-5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-rose-700 dark:text-rose-400">Sick & Medical Leave</span>
                <HeartHandshake className="h-4 w-4 text-rose-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {Math.max(0, (employee.leaveBalance?.sickTotal ?? 10) - ((employee.leaveRecords || []).filter(l => l.status === 'Approved' && l.leaveType === 'Sick Leave').reduce((s, l) => s + l.daysCount, 0)))} <span className="text-xs font-normal text-slate-500">/ {employee.leaveBalance?.sickTotal ?? 10} days left</span>
              </p>
              <div className="w-full bg-rose-200/50 dark:bg-rose-900/40 rounded-full h-1.5 mt-3 overflow-hidden">
                <div 
                  className="bg-rose-500 h-1.5 rounded-full" 
                  style={{ width: `${Math.min(100, Math.max(0, ((Math.max(0, (employee.leaveBalance?.sickTotal ?? 10) - ((employee.leaveRecords || []).filter(l => l.status === 'Approved' && l.leaveType === 'Sick Leave').reduce((s, l) => s + l.daysCount, 0)))) / (employee.leaveBalance?.sickTotal ?? 10)) * 100))}%` }} 
                />
              </div>
            </div>

            <div className="p-5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-blue-700 dark:text-blue-400">Personal / Casual</span>
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {Math.max(0, (employee.leaveBalance?.casualTotal ?? 5) - ((employee.leaveRecords || []).filter(l => l.status === 'Approved' && l.leaveType === 'Personal / Casual').reduce((s, l) => s + l.daysCount, 0)))} <span className="text-xs font-normal text-slate-500">/ {employee.leaveBalance?.casualTotal ?? 5} days left</span>
              </p>
              <div className="w-full bg-blue-200/50 dark:bg-blue-900/40 rounded-full h-1.5 mt-3 overflow-hidden">
                <div 
                  className="bg-[#0B5FFF] h-1.5 rounded-full" 
                  style={{ width: `${Math.min(100, Math.max(0, ((Math.max(0, (employee.leaveBalance?.casualTotal ?? 5) - ((employee.leaveRecords || []).filter(l => l.status === 'Approved' && l.leaveType === 'Personal / Casual').reduce((s, l) => s + l.daysCount, 0)))) / (employee.leaveBalance?.casualTotal ?? 5)) * 100))}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Leave History Card */}
          <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <HeartHandshake className="h-5 w-5 text-amber-600" /> Leave Applications & Request History
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Approved, pending, and historical leave requests recorded for {employee.firstName}.</p>
              </div>
              <button
                onClick={() => setShowLeaveModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" /> Request Leave
              </button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-xs font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3">Leave ID</th>
                      <th className="px-4 py-3">Leave Category</th>
                      <th className="px-4 py-3">Dates</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {(employee.leaveRecords || []).map(lr => (
                      <tr key={lr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500">{lr.id}</td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{lr.leaveType}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                          {lr.startDate} → {lr.endDate}
                        </td>
                        <td className="px-4 py-3 font-semibold text-xs text-slate-700 dark:text-slate-300">
                          {lr.daysCount} {lr.daysCount === 1 ? 'day' : 'days'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate">
                          {lr.reason || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            lr.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' :
                            lr.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400' :
                            'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                          }`}>
                            {lr.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {(!employee.leaveRecords || employee.leaveRecords.length === 0) && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                          No leave applications recorded for this employee yet. Click "Request Leave" above to log leave.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL 4: EDIT LEAVE ENTITLEMENTS MODAL */}
      {showEditAllowanceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-[#0B5FFF]" /> Edit Leave Allocations
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{employee.firstName} {employee.lastName} ({employee.position})</p>
              </div>
              <button onClick={() => setShowEditAllowanceModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveAllowanceForm} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Annual Leave Total Days Entitlement</label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 font-bold"
                  value={allowanceForm.annualTotal}
                  onChange={e => setAllowanceForm({ ...allowanceForm, annualTotal: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sick & Medical Leave Total Days Entitlement</label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 font-bold"
                  value={allowanceForm.sickTotal}
                  onChange={e => setAllowanceForm({ ...allowanceForm, sickTotal: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Personal / Casual Leave Total Days Entitlement</label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 font-bold"
                  value={allowanceForm.casualTotal}
                  onChange={e => setAllowanceForm({ ...allowanceForm, casualTotal: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditAllowanceModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#0B5FFF] text-white"
                >
                  Save Entitlements
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 3: REQUEST LEAVE MODAL */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="bg-amber-50 dark:bg-amber-950/30 p-6 border-b border-amber-100 dark:border-amber-900/40 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                  <HeartHandshake className="h-5 w-5 text-amber-600" /> Log Employee Leave Request
                </h3>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">{employee.firstName} {employee.lastName} ({employee.position})</p>
              </div>
              <button onClick={() => setShowLeaveModal(false)} className="text-amber-400 hover:text-amber-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveLeaveRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Leave Category *</label>
                <select
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900"
                  value={leaveForm.leaveType}
                  onChange={e => setLeaveForm({ ...leaveForm, leaveType: e.target.value as LeaveType })}
                >
                  <option value="Annual Leave">Annual Leave</option>
                  <option value="Sick Leave">Sick / Medical Leave</option>
                  <option value="Maternity / Paternity">Maternity / Paternity Leave</option>
                  <option value="Personal / Casual">Personal / Casual Leave</option>
                  <option value="Study / Training">Study / Training Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Start Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900"
                    value={leaveForm.startDate}
                    onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">End Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900"
                    value={leaveForm.endDate}
                    onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Leave Status</label>
                <select
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900"
                  value={leaveForm.status}
                  onChange={e => setLeaveForm({ ...leaveForm, status: e.target.value as LeaveStatus })}
                >
                  <option value="Approved">Approved (Immediate)</option>
                  <option value="Pending">Pending Review</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Reason / HR Notes</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900"
                  placeholder="e.g. Annual leave approval or medical certificate details..."
                  value={leaveForm.reason}
                  onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Save Leave Application
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 1: LOG HOURS MODAL */}
      {showLogHoursModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl border-slate-200 dark:border-slate-800">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" /> Log Labor Hours & Check-In
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{employee.firstName} {employee.lastName} ({employee.position})</p>
              </div>
              <button onClick={() => setShowLogHoursModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleLogHoursSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Project</label>
                  <select
                    value={hoursForm.projectId}
                    onChange={e => setHoursForm({ ...hoursForm, projectId: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Date *</label>
                  <input
                    type="date"
                    required
                    value={hoursForm.date}
                    onChange={e => setHoursForm({ ...hoursForm, date: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Hours Worked *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={hoursForm.hoursWorked}
                    onChange={e => setHoursForm({ ...hoursForm, hoursWorked: parseFloat(e.target.value) || 0 })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Shift Type</label>
                  <select
                    value={hoursForm.shiftType}
                    onChange={e => setHoursForm({ ...hoursForm, shiftType: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Normal Shift">Normal Day Shift</option>
                    <option value="Overtime">Overtime</option>
                    <option value="Night Shift">Night Shift</option>
                    <option value="Weekend">Weekend Shift</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Location / Trench Zone</label>
                <input
                  type="text"
                  value={hoursForm.location}
                  onChange={e => setHoursForm({ ...hoursForm, location: e.target.value })}
                  placeholder="e.g. Trench 4, Substructure Area C"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Work Performed & Notes</label>
                <textarea
                  rows={2}
                  value={hoursForm.notes}
                  onChange={e => setHoursForm({ ...hoursForm, notes: e.target.value })}
                  placeholder="e.g. Concrete pouring inspection and rebar installation check"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setShowLogHoursModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold bg-green-600 hover:bg-green-700 text-white shadow-sm">Save Hours Log</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT CERTIFICATE MODAL */}
      {showCertModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl border-slate-200 dark:border-slate-800">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#0B5FFF]" />
                {editingCert ? 'Edit Safety Certificate' : 'Upload Safety Certificate'}
              </h3>
              <button onClick={() => setShowCertModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCertificate} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Certificate Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. General Construction White Card"
                  value={certForm.title || ''}
                  onChange={e => setCertForm({ ...certForm, title: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Document Type</label>
                  <select
                    value={certForm.type || 'White Card'}
                    onChange={e => setCertForm({ ...certForm, type: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  >
                    <option value="White Card">White Card</option>
                    <option value="High Risk License">High Risk License</option>
                    <option value="First Aid">First Aid</option>
                    <option value="Driver License">Driver License</option>
                    <option value="Machinery Ticket">Machinery Ticket</option>
                    <option value="Safety Induction">Safety Induction</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</label>
                  <select
                    value={certForm.status || 'Valid'}
                    onChange={e => setCertForm({ ...certForm, status: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  >
                    <option value="Valid">Valid</option>
                    <option value="Expiring Soon">Expiring Soon</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Issue Date</label>
                  <input
                    type="date"
                    value={certForm.issueDate || ''}
                    onChange={e => setCertForm({ ...certForm, issueDate: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Expiry Date</label>
                  <input
                    type="date"
                    value={certForm.expiryDate || ''}
                    onChange={e => setCertForm({ ...certForm, expiryDate: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setShowCertModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#0B5FFF] text-white">Save Certificate</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 3: ASSIGN TO TASK MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl border-slate-200 dark:border-slate-800">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-purple-600" /> Assign Personnel to Construction Task
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{employee.firstName} {employee.lastName} ({employee.position})</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAssignTaskSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Select Construction Task / Activity *</label>
                <select
                  required
                  value={selectedActivityId}
                  onChange={e => setSelectedActivityId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- Select Active Task --</option>
                  {activities.map(act => (
                    <option key={act.id} value={act.id}>[{act.id}] {act.name} ({act.discipline} • {act.status})</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm">Assign Task</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 4: FULL PROFILE EDIT MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-xl shadow-2xl border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-[#0B5FFF]" /> Edit Full Profile & Emergency Info
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{profileForm.id} - {profileForm.firstName} {profileForm.lastName}</p>
              </div>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfileModal} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">First Name *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.firstName}
                    onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.lastName}
                    onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Job Title / Position *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.position}
                    onChange={e => setProfileForm({ ...profileForm, position: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Department *</label>
                  <CustomSelect
                    value={profileForm.department}
                    onChange={val => setProfileForm({ ...profileForm, department: val })}
                    options={['Management', 'Engineering', 'Construction', 'Health & Safety', 'Quality Assurance', 'Administration']}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    customPlaceholder="Enter custom department..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone Number</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Employment Status</label>
                <select
                  value={profileForm.status || 'Active'}
                  onChange={e => setProfileForm({ ...profileForm, status: e.target.value as EmployeeStatus })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                >
                  <option value="Active">Active</option>
                  <option value="Absent">Absent</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Terminated">Terminated</option>
                  <option value="Induction">Induction</option>
                  <option value="Under Review">Under Review</option>
                </select>
              </div>

              <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl space-y-3">
                <h4 className="text-xs font-bold uppercase text-rose-700 dark:text-rose-300">Emergency Contact Details</h4>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={profileForm.emergencyContact?.name || ''}
                    onChange={e => setProfileForm({ ...profileForm, emergencyContact: { ...profileForm.emergencyContact, name: e.target.value, phone: profileForm.emergencyContact?.phone || '', relationship: profileForm.emergencyContact?.relationship || '' } })}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                  <input
                    type="tel"
                    placeholder="Contact Phone"
                    value={profileForm.emergencyContact?.phone || ''}
                    onChange={e => setProfileForm({ ...profileForm, emergencyContact: { ...profileForm.emergencyContact, phone: e.target.value, name: profileForm.emergencyContact?.name || '', relationship: profileForm.emergencyContact?.relationship || '' } })}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Relationship"
                    value={profileForm.emergencyContact?.relationship || ''}
                    onChange={e => setProfileForm({ ...profileForm, emergencyContact: { ...profileForm.emergencyContact, relationship: e.target.value, name: profileForm.emergencyContact?.name || '', phone: profileForm.emergencyContact?.phone || '' } })}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Site Notes / Bio</label>
                <textarea
                  rows={2}
                  value={profileForm.notes || ''}
                  onChange={e => setProfileForm({ ...profileForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setShowProfileModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#0B5FFF] text-white">Save Profile</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* LOGISTICS EDIT MODAL */}
      {isEditingLogistics && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Home className="h-5 w-5 text-indigo-600" /> Manage Accommodation & Transport
              </h3>
              <button onClick={() => setIsEditingLogistics(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const updated: Employee = {
                  ...employee,
                  hasAccommodation: logisticsData.hasAccommodation,
                  accommodationDetails: logisticsData.hasAccommodation ? logisticsData.accommodationDetails : undefined,
                  hasTransport: logisticsData.hasTransport,
                  transportDetails: logisticsData.transportDetails
                };
                onSave(updated);

                if (logisticsData.hasAccommodation && logisticsData.accommodationDetails?.campId) {
                  assignEmployeeToAccommodation(
                    logisticsData.accommodationDetails.campId,
                    employee.id,
                    logisticsData.accommodationDetails.roomNumber
                  );
                } else if (!logisticsData.hasAccommodation) {
                  const existingAcc = accommodations.find(a => a.occupantIds.includes(employee.id));
                  if (existingAcc) {
                    removeEmployeeFromAccommodation(existingAcc.id, employee.id);
                  }
                }

                setIsEditingLogistics(false);
              }}
              className="p-6 space-y-5"
            >
              {/* Accommodation Section */}
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">Company Accommodation</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={logisticsData.hasAccommodation}
                      onChange={e => setLogisticsData({ ...logisticsData, hasAccommodation: e.target.checked })}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                    <span className="ml-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {logisticsData.hasAccommodation ? 'Provided' : 'Not Provided'}
                    </span>
                  </label>
                </div>

                {logisticsData.hasAccommodation && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-indigo-100/80 dark:border-indigo-900/30">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Camp / Facility</label>
                      <select
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
                        value={logisticsData.accommodationDetails.campId || ''}
                        onChange={e => {
                          const selectedAcc = accommodations.find(a => a.id === e.target.value);
                          setLogisticsData({
                            ...logisticsData,
                            accommodationDetails: {
                              ...logisticsData.accommodationDetails,
                              campId: e.target.value,
                              campName: selectedAcc ? selectedAcc.name : e.target.value,
                              roomNumber: logisticsData.accommodationDetails.roomNumber || 'Room 1'
                            }
                          });
                        }}
                      >
                        <option value="">-- Select Registered Facility --</option>
                        {accommodations.map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} ({acc.ownership} • {acc.occupantIds?.length || 0}/{acc.totalCapacityBeds} beds)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Room / Unit #</label>
                      <input
                        type="text"
                        placeholder="e.g. Room 12B"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        value={logisticsData.accommodationDetails.roomNumber}
                        onChange={e => setLogisticsData({
                          ...logisticsData,
                          accommodationDetails: { ...logisticsData.accommodationDetails, roomNumber: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Monthly Subsidy (R)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        value={logisticsData.accommodationDetails.subsidyAmount || ''}
                        onChange={e => setLogisticsData({
                          ...logisticsData,
                          accommodationDetails: { ...logisticsData.accommodationDetails, subsidyAmount: parseFloat(e.target.value) || 0 }
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Transport Section */}
              <div className="p-4 bg-teal-50/50 dark:bg-teal-950/20 rounded-2xl border border-teal-100 dark:border-teal-900/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bus className="h-4 w-4 text-teal-600" />
                    <span className="text-xs font-bold text-teal-950 dark:text-teal-200 uppercase tracking-wider">Company Transport</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={logisticsData.hasTransport}
                      onChange={e => setLogisticsData({ ...logisticsData, hasTransport: e.target.checked })}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-teal-600"></div>
                    <span className="ml-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {logisticsData.hasTransport ? 'Provided' : 'Not Provided'}
                    </span>
                  </label>
                </div>

                {logisticsData.hasTransport && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-teal-100/80 dark:border-teal-900/30">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Shuttle Route / Bus Line</label>
                      <input
                        type="text"
                        placeholder="e.g. Route 3 Express"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        value={logisticsData.transportDetails.route}
                        onChange={e => setLogisticsData({
                          ...logisticsData,
                          transportDetails: { ...logisticsData.transportDetails, route: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Pickup Stop / Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Main Gate 1"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        value={logisticsData.transportDetails.pickupPoint}
                        onChange={e => setLogisticsData({
                          ...logisticsData,
                          transportDetails: { ...logisticsData.transportDetails, pickupPoint: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setIsEditingLogistics(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#0B5FFF] text-white">Save Logistics</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* PHOTO LIGHTBOX */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-4xl w-full bg-black rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedPhoto(null)} className="absolute top-4 right-4 text-white bg-slate-800/80 p-2 rounded-full hover:bg-slate-700">
              <X className="h-5 w-5" />
            </button>
            <img src={selectedPhoto} alt="Enlarged Scan" className="w-full max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
