import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Badge, CustomSelect } from '../ui';
import { 
  ArrowLeft, 
  Users, 
  UserPlus, 
  Mail, 
  Phone, 
  Briefcase, 
  Search, 
  Filter, 
  MoreVertical, 
  Building, 
  LayoutGrid, 
  List as ListIcon,
  UserCheck,
  Plus,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  ShieldCheck,
  Lock,
  User,
  Crown,
  Eye,
  Activity,
  HeartHandshake,
  Clock,
  CalendarDays,
  Check,
  AlertCircle,
  TrendingUp,
  FileText,
  Home,
  Bus,
  Car,
  Navigation,
  MapPin,
  Download
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Employee, Team, EmployeeStatus, LeaveRecord, LeaveType, LeaveStatus, canUserEditSection, LabourLog } from '../../types';
import { EmployeeDetail, getStatusBadgeStyle } from '../EmployeeDetail';
import { RemindersWidget } from '../RemindersWidget';
import { DailyLaborSummaryModal } from '../DailyLaborSummaryModal';

interface EmployeesModuleProps {
  onBack?: () => void;
}

export function EmployeesModule({ onBack }: EmployeesModuleProps) {
  const navigate = useNavigate();
  const { 
    employees, 
    teams, 
    projects, 
    activities, 
    workerCheckIns, 
    labourLogs, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee, 
    addTeam, 
    updateTeam, 
    deleteTeam, 
    addLabourLog, 
    updateLabourLog, 
    deleteLabourLog, 
    addWorkerCheckIn, 
    currentUserProfile,
    accommodations,
    assignEmployeeToAccommodation,
    removeEmployeeFromAccommodation
  } = useAppContext();
  
  const canEditLabour = canUserEditSection(currentUserProfile, 'labour');

  // Selected Employee for Detail View
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Editing Logged Hours State
  const [editingLabourLog, setEditingLabourLog] = useState<LabourLog | null>(null);
  const [editingHoursForm, setEditingHoursForm] = useState<{
    date: string;
    workerName: string;
    trade: string;
    projectId: string;
    activityId: string;
    startTime: string;
    endTime: string;
    hoursWorked: number;
    notes: string;
  }>({
    date: '',
    workerName: '',
    trade: 'General Laborer',
    projectId: '',
    activityId: '',
    startTime: '08:00',
    endTime: '17:00',
    hoursWorked: 8,
    notes: ''
  });

  // Tab view: 'employees' | 'teams' | 'tracker' | 'logistics' | 'hours'
  const [activeTab, setActiveTab] = useState<'employees' | 'teams' | 'tracker' | 'logistics' | 'hours'>('employees');
  const [trackerSubTab, setTrackerSubTab] = useState<'leave' | 'attendance' | 'balances'>('leave');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOption, setSortOption] = useState<'name' | 'department' | 'role' | 'status'>('name');

  // HR Leave Modal State
  const [isApplyingLeave, setIsApplyingLeave] = useState(false);
  const [editingLeaveAllowanceEmp, setEditingLeaveAllowanceEmp] = useState<Employee | null>(null);
  const [allowanceForm, setAllowanceForm] = useState({
    annualTotal: 15,
    sickTotal: 10,
    casualTotal: 5
  });

  const [leaveForm, setLeaveForm] = useState<{
    employeeId: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
    status: LeaveStatus;
  }>({
    employeeId: '',
    leaveType: 'Annual Leave',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
    status: 'Approved'
  });

  // HR Hours Log Modal State
  const [isLoggingHoursModal, setIsLoggingHoursModal] = useState(false);
  const [isDailySummaryModalOpen, setIsDailySummaryModalOpen] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [isEmployeePickerOpen, setIsEmployeePickerOpen] = useState(false);
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');
  const [pickerDepartmentFilter, setPickerDepartmentFilter] = useState('All');

  const handleOpenLogHoursModal = () => {
    if (selectedEmployeeIds.length === 0 && employees.length > 0) {
      const activeIds = employees.filter(e => e.status === 'Active').map(e => e.id);
      setSelectedEmployeeIds(activeIds.length > 0 ? activeIds : [employees[0].id]);
    }
    setIsLoggingHoursModal(true);
  };

  const [hoursForm, setHoursForm] = useState({
    employeeId: '',
    projectId: projects[0]?.id || '',
    activityId: activities[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '17:00',
    lunchBreak: 1.0,
    hoursWorked: 8.0,
    shiftType: 'Normal Shift',
    notes: ''
  });

  // Calculate hours whenever start or end time changes
  React.useEffect(() => {
    if (hoursForm.startTime && hoursForm.endTime) {
      const [startH, startM] = hoursForm.startTime.split(':').map(Number);
      const [endH, endM] = hoursForm.endTime.split(':').map(Number);
      
      let hours = (endH + endM / 60) - (startH + startM / 60);
      if (hours < 0) hours += 24; // Handle cross-midnight shifts
      
      hours -= (hoursForm.lunchBreak || 0);
      if (hours < 0) hours = 0; // Prevent negative hours
      
      setHoursForm(prev => ({ ...prev, hoursWorked: parseFloat(hours.toFixed(2)) }));
    }
  }, [hoursForm.startTime, hoursForm.endTime, hoursForm.lunchBreak]);

  // Employee Modals State
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    status: 'Active',
    hireDate: new Date().toISOString().split('T')[0]
  });

  // Team Modals State
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);

  // Team Form State
  const [teamForm, setTeamForm] = useState({
    name: '',
    department: 'Construction',
    leaderId: '',
    memberIds: [] as string[],
    description: '',
  });

  // Search Filters
  const filteredEmployees = employees.filter(e => {
    const matchesSearch = 
      e.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || e.status === statusFilter;

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortOption === 'name') {
      return a.firstName.localeCompare(b.firstName);
    } else if (sortOption === 'department') {
      return a.department.localeCompare(b.department);
    } else if (sortOption === 'role') {
      return a.position.localeCompare(b.position);
    } else if (sortOption === 'status') {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handlers for Employees
  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.firstName || !newEmployee.lastName || !newEmployee.position || !newEmployee.department) return;

    addEmployee({
      id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      firstName: newEmployee.firstName,
      lastName: newEmployee.lastName,
      position: newEmployee.position,
      department: newEmployee.department,
      email: newEmployee.email || '',
      phone: newEmployee.phone || '',
      status: (newEmployee.status as EmployeeStatus) || 'Active',
      hireDate: newEmployee.hireDate || new Date().toISOString().split('T')[0],
      avatar: newEmployee.avatar,
      emergencyContact: newEmployee.emergencyContact?.name ? newEmployee.emergencyContact : undefined,
      notes: newEmployee.notes || undefined,
      certificates: [],
      idPhotos: [],
    });

    setIsAddingEmployee(false);
    setNewEmployee({
      status: 'Active',
      hireDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleEditEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      updateEmployee(editingEmployee);

      if (editingEmployee.hasAccommodation && editingEmployee.accommodationDetails?.campId) {
        assignEmployeeToAccommodation(
          editingEmployee.accommodationDetails.campId,
          editingEmployee.id,
          editingEmployee.accommodationDetails.roomNumber
        );
      } else if (!editingEmployee.hasAccommodation) {
        const existingAcc = accommodations.find(a => a.occupantIds.includes(editingEmployee.id));
        if (existingAcc) {
          removeEmployeeFromAccommodation(existingAcc.id, editingEmployee.id);
        }
      }

      setEditingEmployee(null);
    }
  };

  const handleDeleteEmployeeConfirm = () => {
    if (deletingEmployee) {
      deleteEmployee(deletingEmployee.id);
      setDeletingEmployee(null);
    }
  };

  // Handlers for Teams
  const handleOpenAddTeamModal = () => {
    setTeamForm({
      name: '',
      department: 'Construction',
      leaderId: employees[0]?.id || '',
      memberIds: employees.map(e => e.id),
      description: '',
    });
    setIsAddingTeam(true);
  };

  const handleOpenEditTeamModal = (team: Team) => {
    setEditingTeam(team);
    setTeamForm({
      name: team.name,
      department: team.department,
      leaderId: team.leaderId || '',
      memberIds: team.memberIds || [],
      description: team.description || '',
    });
  };

  const handleAddTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name.trim()) return;

    const leaderObj = employees.find(emp => emp.id === teamForm.leaderId);
    const leaderName = leaderObj ? `${leaderObj.firstName} ${leaderObj.lastName}` : undefined;

    const newTeam: Team = {
      id: `TEAM-${Math.floor(100 + Math.random() * 900)}`,
      name: teamForm.name.trim(),
      department: teamForm.department,
      leaderId: teamForm.leaderId || undefined,
      leaderName,
      memberIds: teamForm.memberIds,
      description: teamForm.description.trim() || undefined,
      createdAt: new Date().toISOString().split('T')[0],
    };

    addTeam(newTeam);
    setIsAddingTeam(false);
  };

  const handleEditTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam || !teamForm.name.trim()) return;

    const leaderObj = employees.find(emp => emp.id === teamForm.leaderId);
    const leaderName = leaderObj ? `${leaderObj.firstName} ${leaderObj.lastName}` : undefined;

    const updatedTeam: Team = {
      ...editingTeam,
      name: teamForm.name.trim(),
      department: teamForm.department,
      leaderId: teamForm.leaderId || undefined,
      leaderName,
      memberIds: teamForm.memberIds,
      description: teamForm.description.trim() || undefined,
    };

    updateTeam(updatedTeam);
    setEditingTeam(null);
  };

  const handleDeleteTeamConfirm = () => {
    if (deletingTeam) {
      deleteTeam(deletingTeam.id);
      setDeletingTeam(null);
    }
  };

  const handleToggleMemberSelection = (employeeId: string) => {
    setTeamForm(prev => {
      const exists = prev.memberIds.includes(employeeId);
      if (exists) {
        return { ...prev, memberIds: prev.memberIds.filter(id => id !== employeeId) };
      } else {
        return { ...prev, memberIds: [...prev.memberIds, employeeId] };
      }
    });
  };

  const handleSelectAllMembers = () => {
    setTeamForm(prev => ({ ...prev, memberIds: employees.map(emp => emp.id) }));
  };

  const handleDeselectAllMembers = () => {
    setTeamForm(prev => ({ ...prev, memberIds: [] }));
  };

  // HR LEAVE & HOURS LOGGING HANDLERS
  const allLeaveRecords: (LeaveRecord & { employeeName: string; employeeObj: Employee })[] = employees.flatMap(emp => 
    (emp.leaveRecords || []).map(lr => ({
      ...lr,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      employeeObj: emp
    }))
  );

  const pendingLeavesCount = allLeaveRecords.filter(l => l.status === 'Pending').length;

  const handleApproveLeave = (emp: Employee, leaveId: string) => {
    const updatedRecords = (emp.leaveRecords || []).map(l => 
      l.id === leaveId ? { ...l, status: 'Approved' as LeaveStatus } : l
    );
    updateEmployee({
      ...emp,
      status: 'On Leave',
      leaveRecords: updatedRecords
    });
  };

  const handleRejectLeave = (emp: Employee, leaveId: string) => {
    const updatedRecords = (emp.leaveRecords || []).map(l => 
      l.id === leaveId ? { ...l, status: 'Rejected' as LeaveStatus } : l
    );
    updateEmployee({
      ...emp,
      leaveRecords: updatedRecords
    });
  };

  const handleDeleteLeave = (emp: Employee, leaveId: string) => {
    const updatedRecords = (emp.leaveRecords || []).filter(l => l.id !== leaveId);
    updateEmployee({
      ...emp,
      leaveRecords: updatedRecords
    });
  };

  const handleApplyLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmp = employees.find(e => e.id === leaveForm.employeeId) || employees[0];
    if (!targetEmp) return;

    const start = new Date(leaveForm.startDate);
    const end = new Date(leaveForm.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newLeave: LeaveRecord = {
      id: `LV-${Math.floor(1000 + Math.random() * 9000)}`,
      employeeId: targetEmp.id,
      employeeName: `${targetEmp.firstName} ${targetEmp.lastName}`,
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      daysCount: isNaN(daysCount) || daysCount < 1 ? 1 : daysCount,
      reason: leaveForm.reason || 'Leave application',
      status: leaveForm.status,
      appliedDate: new Date().toISOString().split('T')[0],
    };

    const updatedRecords = [newLeave, ...(targetEmp.leaveRecords || [])];
    let updatedStatus = targetEmp.status;
    if (leaveForm.status === 'Approved') {
      updatedStatus = 'On Leave';
    }

    updateEmployee({
      ...targetEmp,
      status: updatedStatus,
      leaveRecords: updatedRecords
    });

    setIsApplyingLeave(false);
  };

  const handleLogHoursSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployeeIds.length === 0) {
      alert('Please select at least one employee to log hours.');
      return;
    }

    const selectedEmps = employees.filter(e => selectedEmployeeIds.includes(e.id));
    if (selectedEmps.length === 0) return;

    selectedEmps.forEach((targetEmp, idx) => {
      const uniqueSuffix = `${Date.now().toString().slice(-4)}${idx}${Math.floor(10 + Math.random() * 90)}`;
      addLabourLog({
        id: `LAB-${uniqueSuffix}`,
        projectId: hoursForm.projectId,
        activityId: hoursForm?.activityId,
        date: hoursForm.date,
        startTime: hoursForm.startTime,
        endTime: hoursForm.endTime,
        lunchBreak: hoursForm.lunchBreak,
        workerType: 'Employee',
        workerName: `${targetEmp.firstName} ${targetEmp.lastName}`,
        hours: Number(hoursForm.hoursWorked),
        workersCount: 1,
        trade: targetEmp.position,
        hoursWorked: Number(hoursForm.hoursWorked),
        supervisorName: 'HR Activity System',
        notes: hoursForm.notes || hoursForm.shiftType
      });

      addWorkerCheckIn({
        id: `CHK-${uniqueSuffix}`,
        projectId: hoursForm.projectId,
        workerName: `${targetEmp.firstName} ${targetEmp.lastName}`,
        workerId: targetEmp.id,
        timestamp: `${hoursForm.date} ${hoursForm.startTime || '07:30'}`,
        action: 'Check-In',
        location: { lat: -26.2041, lng: 28.0473 }
      });
    });

    setIsLoggingHoursModal(false);
  };

  if (selectedEmployee) {
    return (
      <EmployeeDetail
        employee={selectedEmployee}
        onSave={(updated) => {
          updateEmployee(updated);
          setSelectedEmployee(updated);
        }}
        onClose={() => setSelectedEmployee(null)}
        onDelete={(id) => {
          deleteEmployee(id);
          setSelectedEmployee(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onBack ? onBack() : (window.history.length > 1 ? navigate(-1) : navigate('/'))}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            title="Go back to previous page"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="h-6 w-6 text-[#0B5FFF]" />
              Employee & Team Directory
            </h2>
            <p className="text-sm text-slate-500">Manage company personnel, job roles, and site work teams.</p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            onClick={() => setIsApplyingLeave(true)}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl transition-colors text-xs font-semibold shadow-sm"
          >
            <HeartHandshake className="h-4 w-4" /> Request Leave
          </button>

          <button
            onClick={handleOpenLogHoursModal}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl transition-colors text-xs font-semibold shadow-sm"
          >
            <Clock className="h-4 w-4" /> Log Hours
          </button>

          <button
            onClick={() => { setActiveTab('employees'); setIsAddingEmployee(!isAddingEmployee); }}
            className="flex items-center gap-2 bg-[#0B5FFF] hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl transition-colors text-xs font-semibold shadow-sm"
          >
            <UserPlus className="h-4 w-4" /> Add Employee
          </button>

          <button
            onClick={() => { setActiveTab('teams'); handleOpenAddTeamModal(); }}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 rounded-xl transition-colors text-xs font-semibold shadow-sm"
          >
            <UserCheck className="h-4 w-4" /> Create Team
          </button>
        </div>
      </div>

      <RemindersWidget moduleName="Employees" />

      {/* Tabs & View Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'employees'
                ? 'bg-[#0B5FFF] text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Users className="h-4 w-4" /> Employees ({employees.length})
          </button>

          <button
            onClick={() => setActiveTab('teams')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'teams'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <UserCheck className="h-4 w-4" /> Teams ({teams.length})
          </button>

          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors relative ${
              activeTab === 'tracker'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Activity className="h-4 w-4" /> HR & Activity Tracker
            {pendingLeavesCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-amber-500 text-white font-extrabold rounded-full">
                {pendingLeavesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('logistics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'logistics'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Home className="h-4 w-4" /> Accommodation & Transport
          </button>

          <button
            onClick={() => setActiveTab('hours')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'hours'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Clock className="h-4 w-4" /> Log Hours
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {activeTab === 'employees' && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 hidden sm:inline">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold px-2 py-1 rounded-lg border-0 focus:ring-1 focus:ring-[#0B5FFF]"
              >
                <option value="All">All Statuses</option>
                <option value="Active">🟢 Active</option>
                <option value="Absent">🔴 Absent</option>
                <option value="On Leave">🟡 On Leave</option>
                <option value="Terminated">⚫ Terminated</option>
                <option value="Induction">🔵 Induction</option>
                <option value="Under Review">🟣 Under Review</option>
              </select>
            </div>
          )}

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'employees' ? "Search employees..." : "Search teams..."}
              className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]/20 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {activeTab === 'employees' && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => {
                  const csvContent = ["Employee ID,Name,Position,Department,Status,Email,Phone,Accommodated,Camp Name,Room #,Transport,Route,Pickup Point"]
                    .concat(filteredEmployees.map(e => `"${e.id}","${e.firstName} ${e.lastName}","${e.position}","${e.department}","${e.status}","${e.email}","${e.phone}","${e.hasAccommodation ? 'Yes' : 'No'}","${e.accommodationDetails?.campName || ''}","${e.accommodationDetails?.roomNumber || ''}","${e.hasTransport ? 'Yes' : 'No'}","${e.transportDetails?.route || ''}","${e.transportDetails?.pickupPoint || ''}"`))
                    .join("\n");
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.setAttribute("href", url);
                  link.setAttribute("download", "Complete_Employee_Directory.csv");
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all"
                title="Download Directory CSV"
              >
                <Download className="h-4 w-4 text-[#0B5FFF]" /> <span className="hidden sm:inline">Export</span>
              </button>
              <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
              
              <div className="flex items-center gap-1.5 px-2">
                <select
                  className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                >
                  <option value="name">Sort by Name</option>
                  <option value="department">Sort by Dept</option>
                  <option value="role">Sort by Role</option>
                  <option value="status">Sort by Status</option>
                </select>
              </div>

              <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-[#0B5FFF]' : 'text-slate-500'}`}
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-[#0B5FFF]' : 'text-slate-500'}`}
                title="List view"
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Employee Modal */}
      {isAddingEmployee && activeTab === 'employees' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <Card className="w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl border-slate-200 dark:border-slate-800 rounded-2xl animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
            <div className="bg-blue-50/70 dark:bg-blue-950/40 px-6 py-4 border-b border-blue-100 dark:border-blue-900/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0B5FFF] text-white flex items-center justify-center shadow-sm">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">New Employee Profile</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Enter personal details, job title, and site assignment</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddingEmployee(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Row 1: First Name & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    value={newEmployee.firstName || ''}
                    onChange={e => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Smith"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    value={newEmployee.lastName || ''}
                    onChange={e => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 2: Job Position & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">Job Position *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Site Engineer / Crane Operator"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    value={newEmployee.position || ''}
                    onChange={e => setNewEmployee({ ...newEmployee, position: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">Department *</label>
                  <CustomSelect
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm"
                    value={newEmployee.department || ''}
                    onChange={val => setNewEmployee({ ...newEmployee, department: val })}
                    options={['Management', 'Engineering', 'Construction', 'Health & Safety', 'Quality Assurance', 'Administration']}
                    placeholder="Select Department..."
                    customPlaceholder="Enter custom department..."
                  />
                </div>
              </div>

              {/* Row 3: Email Address & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    placeholder="john.smith@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    value={newEmployee.email || ''}
                    onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+27 82 123 4567"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    value={newEmployee.phone || ''}
                    onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 4: Employment Status & Hire Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">Employment Status</label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    value={newEmployee.status || 'Active'}
                    onChange={e => setNewEmployee({ ...newEmployee, status: e.target.value as EmployeeStatus })}
                  >
                    <option value="Active">🟢 Active</option>
                    <option value="Absent">🔴 Absent</option>
                    <option value="On Leave">🟡 On Leave</option>
                    <option value="Terminated">⚫ Terminated</option>
                    <option value="Induction">🔵 Induction</option>
                    <option value="Under Review">🟣 Under Review</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">Hire Date</label>
                  <input
                    type="date"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    value={newEmployee.hireDate || ''}
                    onChange={e => setNewEmployee({ ...newEmployee, hireDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">Emergency Contact (Optional)</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Contact Name"
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                    value={newEmployee.emergencyContact?.name || ''}
                    onChange={e => setNewEmployee({
                      ...newEmployee,
                      emergencyContact: {
                        name: e.target.value,
                        phone: newEmployee.emergencyContact?.phone || '',
                        relationship: newEmployee.emergencyContact?.relationship || ''
                      }
                    })}
                  />
                  <input
                    type="tel"
                    placeholder="Contact Phone"
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                    value={newEmployee.emergencyContact?.phone || ''}
                    onChange={e => setNewEmployee({
                      ...newEmployee,
                      emergencyContact: {
                        name: newEmployee.emergencyContact?.name || '',
                        phone: e.target.value,
                        relationship: newEmployee.emergencyContact?.relationship || ''
                      }
                    })}
                  />
                  <input
                    type="text"
                    placeholder="Relationship (e.g. Spouse)"
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                    value={newEmployee.emergencyContact?.relationship || ''}
                    onChange={e => setNewEmployee({
                      ...newEmployee,
                      emergencyContact: {
                        name: newEmployee.emergencyContact?.name || '',
                        phone: newEmployee.emergencyContact?.phone || '',
                        relationship: e.target.value
                      }
                    })}
                  />
                </div>
              </div>

              {/* Site Notes / Bio */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">Site Notes / Bio (Optional)</label>
                <textarea
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  placeholder="e.g. Certified heavy machine operator, safety representative..."
                  value={newEmployee.notes || ''}
                  onChange={e => setNewEmployee({ ...newEmployee, notes: e.target.value })}
                />
              </div>

              {/* Company Accommodation Logistics */}
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">Company Accommodation</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={newEmployee.hasAccommodation || false}
                      onChange={e => setNewEmployee({ ...newEmployee, hasAccommodation: e.target.checked })}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                    <span className="ml-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {newEmployee.hasAccommodation ? 'Provided' : 'Not Provided'}
                    </span>
                  </label>
                </div>

                {newEmployee.hasAccommodation && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-indigo-100/80 dark:border-indigo-900/30 animate-in fade-in">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Camp / Residence Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Camp or Facility Name"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        value={newEmployee.accommodationDetails?.campName || ''}
                        onChange={e => setNewEmployee({
                          ...newEmployee,
                          accommodationDetails: {
                            campName: e.target.value,
                            roomNumber: newEmployee.accommodationDetails?.roomNumber || '',
                            subsidyAmount: newEmployee.accommodationDetails?.subsidyAmount || 0,
                            notes: newEmployee.accommodationDetails?.notes || ''
                          }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Room / Unit #</label>
                      <input
                        type="text"
                        placeholder="e.g. Room 204"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        value={newEmployee.accommodationDetails?.roomNumber || ''}
                        onChange={e => setNewEmployee({
                          ...newEmployee,
                          accommodationDetails: {
                            campName: newEmployee.accommodationDetails?.campName || '',
                            roomNumber: e.target.value,
                            subsidyAmount: newEmployee.accommodationDetails?.subsidyAmount || 0,
                            notes: newEmployee.accommodationDetails?.notes || ''
                          }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Monthly Subsidy (R)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        value={newEmployee.accommodationDetails?.subsidyAmount || ''}
                        onChange={e => setNewEmployee({
                          ...newEmployee,
                          accommodationDetails: {
                            campName: newEmployee.accommodationDetails?.campName || '',
                            roomNumber: newEmployee.accommodationDetails?.roomNumber || '',
                            subsidyAmount: parseFloat(e.target.value) || 0,
                            notes: newEmployee.accommodationDetails?.notes || ''
                          }
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Company Transport Logistics */}
              <div className="p-4 bg-teal-50/50 dark:bg-teal-950/20 rounded-xl border border-teal-100 dark:border-teal-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bus className="h-4 w-4 text-teal-600" />
                    <span className="text-xs font-bold text-teal-950 dark:text-teal-200 uppercase tracking-wider">Company Transport</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={newEmployee.hasTransport || false}
                      onChange={e => setNewEmployee({ ...newEmployee, hasTransport: e.target.checked })}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-teal-600"></div>
                    <span className="ml-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {newEmployee.hasTransport ? 'Provided' : 'Not Provided'}
                    </span>
                  </label>
                </div>

                {newEmployee.hasTransport && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-teal-100/80 dark:border-teal-900/30 animate-in fade-in">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Route / Bus Line</label>
                      <input
                        type="text"
                        placeholder="e.g. Route 3 - East Shuttle"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        value={newEmployee.transportDetails?.route || ''}
                        onChange={e => setNewEmployee({
                          ...newEmployee,
                          transportDetails: {
                            route: e.target.value,
                            pickupPoint: newEmployee.transportDetails?.pickupPoint || ''
                          }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Pickup Location / Stop</label>
                      <input
                        type="text"
                        placeholder="e.g. North Gate Bus Stop"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        value={newEmployee.transportDetails?.pickupPoint || ''}
                        onChange={e => setNewEmployee({
                          ...newEmployee,
                          transportDetails: {
                            route: newEmployee.transportDetails?.route || '',
                            pickupPoint: e.target.value
                          }
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddingEmployee(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#0B5FFF] hover:bg-blue-700 text-white shadow-sm transition-colors"
                >
                  Save Employee Profile
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* TAB 1: EMPLOYEES DIRECTORY */}
      {activeTab === 'employees' && (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredEmployees.map(employee => (
              <Card key={employee.id} className="overflow-hidden hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <CardContent className="p-5 space-y-4 cursor-pointer" onClick={() => setSelectedEmployee(employee)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center shrink-0 overflow-hidden text-[#0B5FFF] dark:text-blue-300 font-bold text-base">
                        {employee.avatar ? (
                          <img src={employee.avatar} alt={employee.firstName} className="w-full h-full object-cover" />
                        ) : (
                          `${employee.firstName[0]}${employee.lastName[0]}`
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">{employee.firstName} {employee.lastName}</h3>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mt-0.5">
                          <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{employee.position}</span>
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{employee.department}</span>
                        </p>
                      </div>
                    </div>

                    <div onClick={e => e.stopPropagation()} className="shrink-0">
                      <select
                        value={employee.status || 'Active'}
                        onChange={(e) => updateEmployee({ ...employee, status: e.target.value as EmployeeStatus })}
                        className={`cursor-pointer font-bold text-[11px] px-2.5 py-1 rounded-full border shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]/30 ${getStatusBadgeStyle(employee.status || 'Active')}`}
                        title="Click to change status"
                      >
                        <option value="Active">Active</option>
                        <option value="Absent">Absent</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Terminated">Terminated</option>
                        <option value="Induction">Induction</option>
                        <option value="Under Review">Under Review</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <a href={`mailto:${employee.email}`} onClick={e => e.stopPropagation()} className="truncate hover:text-[#0B5FFF] transition-colors">
                        {employee.email || 'No email provided'}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <a href={`tel:${employee.phone}`} onClick={e => e.stopPropagation()} className="hover:text-[#0B5FFF] transition-colors">
                        {employee.phone || 'No phone provided'}
                      </a>
                    </div>
                  </div>
                </CardContent>

                <div className="px-5 py-2.5 bg-slate-50/70 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-medium text-slate-400">{employee.id}</span>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => setSelectedEmployee(employee)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-[#0B5FFF] hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors flex items-center gap-1 text-xs font-semibold"
                      title="View Full Profile"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </button>
                    <button 
                      onClick={() => setEditingEmployee(employee)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-[#0B5FFF] hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                      title="Edit Employee"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => setDeletingEmployee(employee)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Delete Employee"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
            {filteredEmployees.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">No employees found</h3>
                <p className="text-slate-500 max-w-sm">No employees match your search criteria. Click "Add Employee" to register personnel.</p>
              </div>
            )}
          </div>
        ) : (
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-xs font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                  {filteredEmployees.map(employee => (
                    <tr key={employee.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setSelectedEmployee(employee)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center shrink-0 overflow-hidden text-[#0B5FFF] dark:text-blue-300 font-bold text-sm">
                            {employee.avatar ? (
                              <img src={employee.avatar} alt={employee.firstName} className="w-full h-full object-cover" />
                            ) : (
                              `${employee.firstName[0]}${employee.lastName[0]}`
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white hover:text-[#0B5FFF]">{employee.firstName} {employee.lastName}</p>
                            <p className="text-xs text-slate-500">{employee.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{employee.position}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building className="h-3 w-3" /> {employee.department}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs">
                            <Mail className="h-3.5 w-3.5" />
                            <a href={`mailto:${employee.email}`} onClick={e => e.stopPropagation()} className="hover:text-[#0B5FFF] truncate max-w-[150px]">{employee.email || '-'}</a>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs">
                            <Phone className="h-3.5 w-3.5" />
                            <a href={`tel:${employee.phone}`} onClick={e => e.stopPropagation()} className="hover:text-[#0B5FFF]">{employee.phone || '-'}</a>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        <select
                          value={employee.status || 'Active'}
                          onChange={(e) => updateEmployee({ ...employee, status: e.target.value as EmployeeStatus })}
                          className={`cursor-pointer font-bold text-xs px-2.5 py-1 rounded-full border shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]/30 ${getStatusBadgeStyle(employee.status || 'Active')}`}
                          title="Click to change status"
                        >
                          <option value="Active">Active</option>
                          <option value="Absent">Absent</option>
                          <option value="On Leave">On Leave</option>
                          <option value="Terminated">Terminated</option>
                          <option value="Induction">Induction</option>
                          <option value="Under Review">Under Review</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setSelectedEmployee(employee)} className="p-1.5 text-slate-400 hover:text-[#0B5FFF]" title="View Profile">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditingEmployee(employee)} className="p-1.5 text-slate-400 hover:text-[#0B5FFF]" title="Edit Employee">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeletingEmployee(employee)} className="p-1.5 text-slate-400 hover:text-red-600" title="Delete Employee">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      )}

      {/* TAB 2: TEAMS MANAGEMENT DIRECTORY */}
      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTeams.map(team => {
            const leaderObj = employees.find(emp => emp.id === team.leaderId);
            const memberObjs = employees.filter(emp => team.memberIds?.includes(emp.id));

            return (
              <Card key={team.id} className="overflow-hidden hover:shadow-lg transition-all border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">{team.id}</span>
                        <Badge variant="outline" className="text-[9px] uppercase">{team.department}</Badge>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-purple-600" />
                        {team.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleOpenEditTeamModal(team)} 
                        className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/30"
                        title="Edit Team"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setDeletingTeam(team)} 
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        title="Delete Team"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {team.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{team.description}</p>
                  )}

                  {/* Team Leader Badge */}
                  <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                      <Crown className="h-4 w-4 text-amber-300" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400 block">Team Supervisor / Leader</span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {leaderObj ? `${leaderObj.firstName} ${leaderObj.lastName}` : (team.leaderName || 'Unassigned Leader')}
                      </p>
                    </div>
                  </div>

                  {/* Team Members List */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Members ({memberObjs.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {memberObjs.map(m => (
                        <div key={m.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          <div className="w-4 h-4 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-[9px] font-bold flex items-center justify-center">
                            {m.firstName[0]}
                          </div>
                          <span>{m.firstName} {m.lastName}</span>
                        </div>
                      ))}
                      {memberObjs.length === 0 && (
                        <span className="text-xs text-slate-400 italic">No members assigned to this team yet.</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredTeams.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-full flex items-center justify-center mb-4">
                <UserCheck className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">No teams found</h3>
              <p className="text-slate-500 max-w-sm">No work teams created yet. Click "Create Team" to group employees into work units.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HR & ACTIVITY TRACKER */}
      {activeTab === 'tracker' && (
        <div className="space-y-6 w-full">
          {/* Top HR Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4 border-slate-200 dark:border-slate-800 bg-emerald-50/40 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Active On-Site</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {employees.filter(e => e.status === 'Active').length}
                <span className="text-xs font-normal text-slate-500 ml-1">/ {employees.length} employees</span>
              </p>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-slate-800 bg-rose-50/40 dark:bg-rose-950/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Absent Today</span>
                <AlertCircle className="h-4 w-4 text-rose-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {employees.filter(e => e.status === 'Absent').length}
              </p>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-slate-800 bg-amber-50/40 dark:bg-amber-950/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">On Leave</span>
                <HeartHandshake className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {employees.filter(e => e.status === 'On Leave').length}
              </p>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-slate-800 bg-purple-50/40 dark:bg-purple-950/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">Pending Requests</span>
                <Clock className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {pendingLeavesCount}
              </p>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-slate-800 bg-blue-50/40 dark:bg-blue-950/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Hours Logged</span>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {labourLogs.reduce((sum, l) => sum + (l.hoursWorked || 0), 0)} <span className="text-xs font-normal text-slate-500">hrs</span>
              </p>
            </Card>
          </div>

          {/* Sub-Tabs Navigation for HR Tracker */}
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTrackerSubTab('leave')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    trackerSubTab === 'leave'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <HeartHandshake className="h-3.5 w-3.5" /> Leave Applications ({allLeaveRecords.length})
                </button>
                <button
                  onClick={() => setTrackerSubTab('attendance')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    trackerSubTab === 'attendance'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" /> Site Attendance & Hours ({labourLogs.length})
                </button>
                <button
                  onClick={() => setTrackerSubTab('balances')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    trackerSubTab === 'balances'
                      ? 'bg-[#0B5FFF] text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <CalendarDays className="h-3.5 w-3.5" /> Employee Leave Balances ({employees.length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsApplyingLeave(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" /> Apply Leave
                </button>
                <button
                  onClick={() => setIsLoggingHoursModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                >
                  <Clock className="h-3.5 w-3.5" /> Log Hours
                </button>
              </div>
            </div>

            <CardContent className="p-0">
              {/* SUB-TAB 1: LEAVE APPLICATIONS TABLE */}
              {trackerSubTab === 'leave' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-xs font-semibold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-4">Employee</th>
                        <th className="px-6 py-4">Leave Category</th>
                        <th className="px-6 py-4">Date Range</th>
                        <th className="px-6 py-4">Days</th>
                        <th className="px-6 py-4">Reason / HR Notes</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">HR Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                      {allLeaveRecords.map(lr => (
                        <tr key={lr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900 dark:text-white">{lr.employeeName}</p>
                            <p className="text-xs text-slate-500 font-mono">{lr.employeeId}</p>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                            {lr.leaveType}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                            {lr.startDate} → {lr.endDate}
                          </td>
                          <td className="px-6 py-4 font-bold text-xs">
                            {lr.daysCount} {lr.daysCount === 1 ? 'day' : 'days'}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 max-w-[200px] truncate">
                            {lr.reason || 'No details provided'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              lr.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' :
                              lr.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400' :
                              'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                            }`}>
                              {lr.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {lr.status === 'Pending' && (
                                <>
                                  <button
                                    onClick={() => handleApproveLeave(lr.employeeObj, lr.id)}
                                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                    title="Approve Leave"
                                  >
                                    <Check className="h-3.5 w-3.5" /> Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectLeave(lr.employeeObj, lr.id)}
                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                    title="Reject Leave"
                                  >
                                    <X className="h-3.5 w-3.5" /> Reject
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteLeave(lr.employeeObj, lr.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                                title="Delete Leave Record"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {allLeaveRecords.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                            <HeartHandshake className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                            No leave applications recorded in the system yet. Click "Apply Leave" above to log leave.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SUB-TAB 2: DAILY ATTENDANCE & HOURS LOG */}
              {trackerSubTab === 'attendance' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-xs font-semibold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-4">Employee</th>
                        <th className="px-6 py-4">Current Status</th>
                        <th className="px-6 py-4">Latest Logged Hours</th>
                        <th className="px-6 py-4">Project / Zone</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                      {employees.map(emp => {
                        const empLogs = labourLogs.filter(l => l.notes?.includes(emp.firstName) || l.trade === emp.position);
                        const totalHours = empLogs.reduce((s, l) => s + (l.hoursWorked || 0), 0);

                        return (
                          <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-900 dark:text-white">{emp.firstName} {emp.lastName}</p>
                              <p className="text-xs text-slate-500">{emp.position} • {emp.department}</p>
                            </td>
                            <td className="px-6 py-4">
                              <select
                                value={emp.status || 'Active'}
                                onChange={(e) => updateEmployee({ ...emp, status: e.target.value as EmployeeStatus })}
                                className={`cursor-pointer font-bold text-xs px-2.5 py-1 rounded-full border shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]/30 ${getStatusBadgeStyle(emp.status || 'Active')}`}
                              >
                                <option value="Active">Active</option>
                                <option value="Absent">Absent</option>
                                <option value="On Leave">On Leave</option>
                                <option value="Terminated">Terminated</option>
                                <option value="Induction">Induction</option>
                                <option value="Under Review">Under Review</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 font-bold text-xs text-slate-800 dark:text-slate-200">
                              {totalHours} hrs
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                              {empLogs[0]?.projectId || 'Site General'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => {
                                  setHoursForm({ ...hoursForm, employeeId: emp.id });
                                  setIsLoggingHoursModal(true);
                                }}
                                className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                              >
                                <Clock className="h-3.5 w-3.5" /> Log Hours
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SUB-TAB 3: EMPLOYEE LEAVE BALANCES */}
              {trackerSubTab === 'balances' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-xs font-semibold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-4">Employee</th>
                        <th className="px-6 py-4">Annual Leave Balance</th>
                        <th className="px-6 py-4">Sick Leave Balance</th>
                        <th className="px-6 py-4">Casual Leave Balance</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                      {employees.map(emp => {
                        const approved = (emp.leaveRecords || []).filter(l => l.status === 'Approved');
                        const annualTotal = emp.leaveBalance?.annualTotal ?? 15;
                        const sickTotal = emp.leaveBalance?.sickTotal ?? 10;
                        const casualTotal = emp.leaveBalance?.casualTotal ?? 5;

                        const annualUsed = approved.filter(l => l.leaveType === 'Annual Leave').reduce((s, l) => s + l.daysCount, 0);
                        const sickUsed = approved.filter(l => l.leaveType === 'Sick Leave').reduce((s, l) => s + l.daysCount, 0);
                        const casualUsed = approved.filter(l => l.leaveType === 'Personal / Casual').reduce((s, l) => s + l.daysCount, 0);

                        const annualRemaining = Math.max(0, annualTotal - annualUsed);
                        const sickRemaining = Math.max(0, sickTotal - sickUsed);
                        const casualRemaining = Math.max(0, casualTotal - casualUsed);

                        return (
                          <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-900 dark:text-white">{emp.firstName} {emp.lastName}</p>
                              <p className="text-xs text-slate-500">{emp.position}</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1 max-w-[140px]">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{annualRemaining} / {annualTotal} days left</p>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.max(0, (annualRemaining / annualTotal) * 100)}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1 max-w-[140px]">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{sickRemaining} / {sickTotal} days left</p>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${Math.max(0, (sickRemaining / sickTotal) * 100)}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1 max-w-[140px]">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{casualRemaining} / {casualTotal} days left</p>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-[#0B5FFF] h-1.5 rounded-full" style={{ width: `${Math.max(0, (casualRemaining / casualTotal) * 100)}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setAllowanceForm({
                                      annualTotal,
                                      sickTotal,
                                      casualTotal
                                    });
                                    setEditingLeaveAllowanceEmp(emp);
                                  }}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                                  title="Edit Employee Leave Standards"
                                >
                                  <Edit3 className="h-3.5 w-3.5 text-[#0B5FFF]" /> Edit Standards
                                </button>

                                <button
                                  onClick={() => {
                                    setLeaveForm({ ...leaveForm, employeeId: emp.id });
                                    setIsApplyingLeave(true);
                                  }}
                                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                                >
                                  <HeartHandshake className="h-3.5 w-3.5" /> Apply Leave
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: ACCOMMODATION & TRANSPORT LOGISTICS */}
      {activeTab === 'logistics' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Summary KPIs Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border-indigo-200 dark:border-indigo-900/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">Company Accommodated</span>
                  <div className="text-2xl font-black text-indigo-950 dark:text-indigo-100 mt-1">
                    {employees.filter(e => e.hasAccommodation).length}
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold ml-1.5">
                      ({Math.round((employees.filter(e => e.hasAccommodation).length / Math.max(1, employees.length)) * 100)}%)
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-600/80 dark:text-indigo-300/70 mt-0.5">Staff in company residence / camp</p>
                </div>
                <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-sm">
                  <Home className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 border-teal-200 dark:border-teal-900/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider block">Provided Transport</span>
                  <div className="text-2xl font-black text-teal-950 dark:text-teal-100 mt-1">
                    {employees.filter(e => e.hasTransport).length}
                    <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold ml-1.5">
                      ({Math.round((employees.filter(e => e.hasTransport).length / Math.max(1, employees.length)) * 100)}%)
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-600/80 dark:text-teal-300/70 mt-0.5">Using company shuttle / bus route</p>
                </div>
                <div className="p-3 bg-teal-500 text-white rounded-2xl shadow-sm">
                  <Bus className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border-purple-200 dark:border-purple-900/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block">Active Residence Camps</span>
                  <div className="text-2xl font-black text-purple-950 dark:text-purple-100 mt-1">
                    {new Set(employees.map(e => e.accommodationDetails?.campName).filter(Boolean)).size || 1}
                  </div>
                  <p className="text-[11px] text-purple-600/80 dark:text-purple-300/70 mt-0.5">Distinct camp facilities</p>
                </div>
                <div className="p-3 bg-purple-500 text-white rounded-2xl shadow-sm">
                  <Building className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-amber-200 dark:border-amber-900/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">Est. Housing Subsidies</span>
                  <div className="text-2xl font-black text-amber-950 dark:text-amber-100 mt-1">
                    R {employees.reduce((acc, e) => acc + (e.accommodationDetails?.subsidyAmount || 0), 0).toLocaleString()}
                  </div>
                  <p className="text-[11px] text-amber-600/80 dark:text-amber-300/70 mt-0.5">Total monthly housing allowance</p>
                </div>
                <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-sm">
                  <HeartHandshake className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Roster Table Card */}
          <Card className="w-full">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Home className="h-5 w-5 text-indigo-600" /> Employee Accommodation & Transport Roster
                </h3>
                <p className="text-xs text-slate-500">Overview of employees provided housing, camp units, and shuttle transport routes</p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/accommodation"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Home className="h-4 w-4" /> Manage Camps & Housing Hub
                </a>
                <button
                  onClick={() => {
                    const accommodated = employees.filter(e => e.hasAccommodation || e.hasTransport);
                    const csvContent = ["Employee ID,Name,Position,Department,Accommodated,Camp Name,Room #,Transport,Route,Pickup Point"]
                      .concat(accommodated.map(e => `"${e.id}","${e.firstName} ${e.lastName}","${e.position}","${e.department}","${e.hasAccommodation ? 'Yes' : 'No'}","${e.accommodationDetails?.campName || ''}","${e.accommodationDetails?.roomNumber || ''}","${e.hasTransport ? 'Yes' : 'No'}","${e.transportDetails?.route || ''}","${e.transportDetails?.pickupPoint || ''}"`))
                      .join("\n");
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.setAttribute("href", url);
                    link.setAttribute("download", "Accommodation_Transport_Report.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                >
                  <FileText className="h-4 w-4 text-indigo-500" /> Export CSV
                </button>
              </div>
            </div>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                      <th className="px-6 py-3.5">Employee Name & Role</th>
                      <th className="px-6 py-3.5">Company Housing</th>
                      <th className="px-6 py-3.5">Camp Residence & Room</th>
                      <th className="px-6 py-3.5">Company Transport</th>
                      <th className="px-6 py-3.5">Route & Pickup Point</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {employees.map(emp => {
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-extrabold flex items-center justify-center text-xs shrink-0">
                                {emp.firstName[0]}{emp.lastName[0]}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white text-sm">{emp.firstName} {emp.lastName}</p>
                                <p className="text-slate-400 text-[11px]">{emp.position} • {emp.department}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            {emp.hasAccommodation ? (
                              <Badge variant="default" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 gap-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Provided
                              </Badge>
                            ) : (
                              <span className="text-slate-400 text-xs italic">Self-Housing</span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {emp.hasAccommodation ? (
                              <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                  <Home className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                  {emp.accommodationDetails?.campName || 'Assigned Camp'}
                                </p>
                                <p className="text-slate-400 text-[11px]">
                                  Room / Unit: <strong>{emp.accommodationDetails?.roomNumber || '—'}</strong>
                                  {emp.accommodationDetails?.subsidyAmount ? ` (R${emp.accommodationDetails.subsidyAmount}/mo)` : ''}
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {emp.hasTransport ? (
                              <Badge variant="default" className="bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 gap-1">
                                <Bus className="h-3 w-3 text-teal-600" /> Company Shuttle
                              </Badge>
                            ) : (
                              <span className="text-slate-400 text-xs italic">Own Transport</span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {emp.hasTransport ? (
                              <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                  <Navigation className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                                  {emp.transportDetails?.route || 'Route 3 - Main Site Express'}
                                </p>
                                <p className="text-slate-400 text-[11px] flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-amber-500 shrink-0" />
                                  Pickup: {emp.transportDetails?.pickupPoint || 'Central Gate 1'}
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setEditingEmployee(emp)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                            >
                              <Edit3 className="h-3.5 w-3.5" /> Edit Logistics
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: LOG HOURS */}
      {activeTab === 'hours' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Logged Labor Hours</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage and track logged hours for site personnel</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Purge Duplicate Logs Button (Active when duplicates exist) */}
              {(() => {
                const seenKeys = new Set<string>();
                let dupCount = 0;
                labourLogs.forEach(l => {
                  const rawName = (l.workerName || '').trim();
                  if (rawName.includes(',') && rawName.split(',').length > 1) {
                    dupCount++;
                    return;
                  }
                  const key = `${(l.workerName || l.trade || '').trim().toLowerCase()}_${l.date}_${(l.notes || '').toLowerCase().includes('night shift') ? 'night' : (l.notes || '').toLowerCase().includes('overtime') ? 'ot' : 'normal'}`;
                  if (seenKeys.has(key)) {
                    dupCount++;
                  } else {
                    seenKeys.add(key);
                  }
                });

                if (dupCount === 0) return null;

                return (
                  <button
                    onClick={() => {
                      if (window.confirm(`Found ${dupCount} duplicate and/or combined multi-person logs. Consolidate into single daily worker records (up to 12h limit) and remove duplicates?`)) {
                        const seenMap = new Map<string, LabourLog>();
                        const logsToKeep: LabourLog[] = [];
                        const idsToDelete: string[] = [];

                        labourLogs.forEach(l => {
                          const rawName = (l.workerName || '').trim();
                          if (rawName.includes(',') && rawName.split(',').length > 1) {
                            idsToDelete.push(l.id);
                            return;
                          }
                          const isNight = (l.notes || '').toLowerCase().includes('night shift');
                          const isOt = (l.notes || '').toLowerCase().includes('overtime');
                          const shiftType = isNight ? 'night' : isOt ? 'ot' : 'normal';
                          const key = `${(l.workerName || l.trade || 'Worker').trim().toLowerCase()}_${l.date}_${shiftType}`;

                          if (seenMap.has(key)) {
                            const existing = seenMap.get(key)!;
                            const totalH = Math.min(shiftType === 'normal' ? 12 : 16, Math.max(existing.hoursWorked || existing.hours || 0, l.hoursWorked || l.hours || 0));
                            existing.hoursWorked = totalH;
                            existing.hours = totalH;
                            idsToDelete.push(l.id);
                          } else {
                            const cleanCopy = { ...l, hours: Math.min(12, l.hours || 8), hoursWorked: Math.min(12, l.hoursWorked || l.hours || 8) };
                            seenMap.set(key, cleanCopy);
                            logsToKeep.push(cleanCopy);
                          }
                        });

                        logsToKeep.forEach(l => updateLabourLog(l));
                        idsToDelete.forEach(id => deleteLabourLog(id));
                      }
                    }}
                    className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 px-3.5 py-2 rounded-xl transition-colors text-xs font-bold shadow-sm animate-pulse"
                    title="Clean duplicate entries and combined group logs"
                  >
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" /> Clean Duplicates ({dupCount})
                  </button>
                );
              })()}

              <button
                onClick={() => {
                  const getEmpName = (l: LabourLog) => l.workerName || (l.notes && l.notes.includes(':') && !l.notes.toLowerCase().startsWith('assigned') && !l.notes.toLowerCase().startsWith('allocated') ? l.notes.split(':')[0] : '') || l.trade || l.workerType || 'Site Worker';
                  const getNote = (l: LabourLog) => {
                    if (!l.notes) return '';
                    if (l.workerName && l.notes.startsWith(`${l.workerName}:`)) return l.notes.slice(l.workerName.length + 1).trim();
                    return l.notes;
                  };
                  const filtered = labourLogs.filter(l => {
                    const rName = (l.workerName || '').trim();
                    return !(rName.includes(',') && rName.split(',').length > 1);
                  });
                  const csvContent = ["ID,Date,Employee Name,Project,Task,Start Time,End Time,Lunch Break (hrs),Hours Worked,Notes"]
                    .concat(filtered.map(log => {
                      const empName = getEmpName(log);
                      const projName = projects.find(p => p.id === log.projectId)?.name || log.projectId;
                      const taskName = activities.find(a => a.id === log?.activityId)?.name || log?.activityId || 'General Labor / Maintenance';
                      const notes = getNote(log).replace(/"/g, '""');
                      return `"${log.id}","${log.date}","${empName}","${projName}","${taskName}","${log.startTime || ''}","${log.endTime || ''}","${log.lunchBreak || 0}","${log.hoursWorked || log.hours}","${notes}"`;
                    }))
                    .join("\n");
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.setAttribute("href", url);
                  link.setAttribute("download", "Logged_Labor_Hours.csv");
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl transition-colors text-xs font-bold shadow-sm"
              >
                <Download className="h-4 w-4" /> Export CSV
              </button>
              <button
                onClick={() => setIsDailySummaryModalOpen(true)}
                className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 px-4 py-2 rounded-xl transition-colors text-xs font-bold shadow-sm"
              >
                <FileText className="h-4 w-4" /> Daily Summary
              </button>
              <button
                onClick={handleOpenLogHoursModal}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-colors text-xs font-bold shadow-sm"
              >
                <Clock className="h-4 w-4" /> Log New Hours
              </button>
            </div>
          </div>

          {/* Role Permission Status Banner */}
          <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-medium shadow-sm ${
            canEditLabour 
              ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-200' 
              : 'bg-amber-50/80 border-amber-200/80 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800/60 dark:text-amber-200'
          }`}>
            <div className="flex items-center gap-2.5">
              {canEditLabour ? (
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                </div>
              ) : (
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                  <Lock className="h-4 w-4 shrink-0" />
                </div>
              )}
              <div>
                <span className="font-bold text-slate-900 dark:text-white">Active Role Permission ({currentUserProfile?.role || 'Guest'}):</span>{' '}
                {canEditLabour 
                  ? 'Full permission granted. You can log, edit, and delete hours records.' 
                  : 'Read-only access. Only Administrators and permitted roles can edit or delete entries.'}
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                canEditLabour
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-amber-500 text-white shadow-sm'
              }`}>
                {canEditLabour ? (
                  <><CheckCircle2 className="h-3.5 w-3.5" /> Edit & Delete Enabled</>
                ) : (
                  <><Lock className="h-3.5 w-3.5" /> Read-Only Mode</>
                )}
              </span>
            </div>
          </div>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-xs font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Task / Project</th>
                      <th className="px-6 py-4">Shift & Hours</th>
                      <th className="px-6 py-4">Notes</th>
                      <th className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span>Actions</span>
                          {canEditLabour ? (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                              <ShieldCheck className="h-3 w-3" /> Editable
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                              <Lock className="h-3 w-3" /> Locked
                            </span>
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                    {(() => {
                      const displayLogs = labourLogs.filter(l => {
                        const rawName = (l.workerName || '').trim();
                        return !(rawName.includes(',') && rawName.split(',').length > 1);
                      });

                      if (displayLogs.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
                              No logged hours found. Click "Log New Hours" to add one.
                            </td>
                          </tr>
                        );
                      }

                      return displayLogs.map(log => {
                        const employeeName = log.workerName 
                          || (log.notes && log.notes.includes(':') && !log.notes.toLowerCase().startsWith('assigned') && !log.notes.toLowerCase().startsWith('allocated') ? log.notes.split(':')[0] : '') 
                          || log.trade 
                          || log.workerType 
                          || 'Site Worker';
                        const project = projects.find(p => p.id === log.projectId);
                        const activity = activities.find(a => a.id === log?.activityId);
                        const noteDisplay = log.workerName && log.notes?.startsWith(`${log.workerName}:`)
                          ? log.notes.slice(log.workerName.length + 1).trim()
                          : (log.notes || '—');

                        const isNight = (log.notes || '').toLowerCase().includes('night shift');
                        const isOt = (log.notes || '').toLowerCase().includes('overtime');
                        const hoursNum = Number(log.hoursWorked || log.hours || 0);

                        return (
                          <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                              {log.date}
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-white">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {employeeName[0] || 'W'}
                                </div>
                                <span>{employeeName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {activity ? activity.name : (log.activityId ? log.activityId : 'General Task')}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {project ? project.name : (log.projectId || 'General Site')}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs">
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-slate-900 dark:text-white">{hoursNum} hrs</span>
                                  {isNight ? (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                                      🌙 Night
                                    </span>
                                  ) : isOt ? (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                                      ⏱️ OT
                                    </span>
                                  ) : hoursNum > 12 ? (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                      ⚠️ {hoursNum}h (&gt;12h)
                                    </span>
                                  ) : hoursNum > 8 ? (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                                      Extended
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                      Standard
                                    </span>
                                  )}
                                </div>
                                {log.startTime && log.endTime && (
                                  <span className="text-[10px] font-normal text-slate-500">
                                    {log.startTime} - {log.endTime}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500 max-w-[280px] truncate" title={noteDisplay}>
                              {noteDisplay}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {canEditLabour ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        const empName = log.workerName 
                                          || (log.notes && log.notes.includes(':') && !log.notes.toLowerCase().startsWith('assigned') && !log.notes.toLowerCase().startsWith('allocated') ? log.notes.split(':')[0] : '') 
                                          || log.trade 
                                          || log.workerType 
                                          || 'Site Worker';
                                        const noteText = log.workerName && log.notes?.startsWith(`${log.workerName}:`)
                                          ? log.notes.slice(log.workerName.length + 1).trim()
                                          : (log.notes || '');
                                        setEditingLabourLog(log);
                                        setEditingHoursForm({
                                          date: log.date,
                                          workerName: empName,
                                          trade: log.trade || log.workerType || 'General Laborer',
                                          projectId: log.projectId,
                                          activityId: log?.activityId || '',
                                          startTime: log.startTime || '08:00',
                                          endTime: log.endTime || '17:00',
                                          hoursWorked: Number(log.hoursWorked || log.hours || 8),
                                          notes: noteText
                                        });
                                      }}
                                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                                      title="Edit Logged Hours"
                                    >
                                      <Edit3 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Edit</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`Are you sure you want to delete this hours log for ${employeeName}?`)) {
                                          deleteLabourLog(log.id);
                                        }
                                      }}
                                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                                      title="Delete Hours Log"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Delete</span>
                                    </button>
                                  </>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-lg" title={`Role '${currentUserProfile?.role || 'Worker'}' lacks edit/delete permissions for labour logs`}>
                                    <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> Restricted ({currentUserProfile?.role || 'Worker'})
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Daily Labor Summary Modal */}
      <DailyLaborSummaryModal 
        isOpen={isDailySummaryModalOpen}
        onClose={() => setIsDailySummaryModalOpen(false)}
      />

      {/* Edit Logged Hours Modal */}
      {editingLabourLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[#0B5FFF]" /> Edit Logged Hours
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Log ID: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{editingLabourLog.id}</span>
                </p>
              </div>
              <button onClick={() => setEditingLabourLog(null)} className="text-slate-400 hover:text-slate-600 rounded-full p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!canEditLabour) {
                alert('Permission Denied: Only Administrators and permitted personnel can edit logged hours.');
                return;
              }

              let calculatedHours = Number(editingHoursForm.hoursWorked);
              if (editingHoursForm.startTime && editingHoursForm.endTime) {
                const [sh, sm] = editingHoursForm.startTime.split(':').map(Number);
                const [eh, em] = editingHoursForm.endTime.split(':').map(Number);
                let diff = (eh + em / 60) - (sh + sm / 60);
                if (diff < 0) diff += 24;
                calculatedHours = Math.round(diff * 10) / 10;
              }

              const updated: LabourLog = {
                ...editingLabourLog,
                date: editingHoursForm.date,
                workerName: editingHoursForm.workerName,
                workerType: editingHoursForm.trade,
                trade: editingHoursForm.trade,
                projectId: editingHoursForm.projectId,
                activityId: editingHoursForm?.activityId,
                startTime: editingHoursForm.startTime,
                endTime: editingHoursForm.endTime,
                hoursWorked: calculatedHours,
                hours: calculatedHours,
                notes: editingHoursForm.notes || ''
              };

              updateLabourLog(updated);
              setEditingLabourLog(null);
            }} className="p-6 space-y-4">
              
              {!canEditLabour && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>Notice: Only Admin or permitted users can submit edits to logged hours.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={editingHoursForm.date}
                    onChange={e => setEditingHoursForm({ ...editingHoursForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Employee / Worker Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Thobile Msibi"
                    value={editingHoursForm.workerName}
                    onChange={e => setEditingHoursForm({ ...editingHoursForm, workerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Trade / Role *</label>
                  <select
                    required
                    value={editingHoursForm.trade}
                    onChange={e => setEditingHoursForm({ ...editingHoursForm, trade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 font-medium"
                  >
                    {['General Laborer', 'Carpenter', 'Electrician', 'Plumber', 'Mason', 'Foreman', 'Engineer', 'Site Supervisor', 'Operator'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Project *</label>
                  <select
                    required
                    value={editingHoursForm.projectId}
                    onChange={e => setEditingHoursForm({ ...editingHoursForm, projectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 font-medium"
                  >
                    <option value="">Select Project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Task / Activity</label>
                  <select
                    value={editingHoursForm?.activityId}
                    onChange={e => setEditingHoursForm({ ...editingHoursForm, activityId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 font-medium"
                  >
                    <option value="">Select Task / Activity (Optional)</option>
                    {activities
                      .filter(a => !editingHoursForm.projectId || a.projectId === editingHoursForm.projectId)
                      .map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({a.id})</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Start Time</label>
                  <input
                    type="time"
                    value={editingHoursForm.startTime}
                    onChange={e => {
                      const newStart = e.target.value;
                      let hrs = editingHoursForm.hoursWorked;
                      if (newStart && editingHoursForm.endTime) {
                        const [sh, sm] = newStart.split(':').map(Number);
                        const [eh, em] = editingHoursForm.endTime.split(':').map(Number);
                        let diff = (eh + em / 60) - (sh + sm / 60);
                        if (diff < 0) diff += 24;
                        hrs = Math.round(diff * 10) / 10;
                      }
                      setEditingHoursForm({ ...editingHoursForm, startTime: newStart, hoursWorked: hrs });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">End Time</label>
                  <input
                    type="time"
                    value={editingHoursForm.endTime}
                    onChange={e => {
                      const newEnd = e.target.value;
                      let hrs = editingHoursForm.hoursWorked;
                      if (editingHoursForm.startTime && newEnd) {
                        const [sh, sm] = editingHoursForm.startTime.split(':').map(Number);
                        const [eh, em] = newEnd.split(':').map(Number);
                        let diff = (eh + em / 60) - (sh + sm / 60);
                        if (diff < 0) diff += 24;
                        hrs = Math.round(diff * 10) / 10;
                      }
                      setEditingHoursForm({ ...editingHoursForm, endTime: newEnd, hoursWorked: hrs });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Hours Logged *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    required
                    value={editingHoursForm.hoursWorked}
                    onChange={e => setEditingHoursForm({ ...editingHoursForm, hoursWorked: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Shift Notes / Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Normal Shift, Overtime on rebar framing..."
                    value={editingHoursForm.notes}
                    onChange={e => setEditingHoursForm({ ...editingHoursForm, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete this hours log for ${editingHoursForm.workerName || 'this employee'}?`)) {
                      deleteLabourLog(editingLabourLog.id);
                      setEditingLabourLog(null);
                    }
                  }}
                  disabled={!canEditLabour}
                  className={`px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors inline-flex items-center gap-1.5 ${
                    !canEditLabour ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title="Delete Logged Hours"
                >
                  <Trash2 className="h-4 w-4" /> Delete Log
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingLabourLog(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!canEditLabour}
                    className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 ${
                      canEditLabour ? 'bg-[#0B5FFF] hover:bg-blue-700' : 'bg-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Save Changes
                  </button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}

      {editingLeaveAllowanceEmp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-[#0B5FFF]" /> Edit Leave Allocations & Standards
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{editingLeaveAllowanceEmp.firstName} {editingLeaveAllowanceEmp.lastName} ({editingLeaveAllowanceEmp.position})</p>
              </div>
              <button onClick={() => setEditingLeaveAllowanceEmp(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const approved = (editingLeaveAllowanceEmp.leaveRecords || []).filter(l => l.status === 'Approved');
              const annualUsed = approved.filter(l => l.leaveType === 'Annual Leave').reduce((s, l) => s + l.daysCount, 0);
              const sickUsed = approved.filter(l => l.leaveType === 'Sick Leave').reduce((s, l) => s + l.daysCount, 0);
              const casualUsed = approved.filter(l => l.leaveType === 'Personal / Casual').reduce((s, l) => s + l.daysCount, 0);

              updateEmployee({
                ...editingLeaveAllowanceEmp,
                leaveBalance: {
                  annualTotal: Number(allowanceForm.annualTotal),
                  annualUsed,
                  sickTotal: Number(allowanceForm.sickTotal),
                  sickUsed,
                  casualTotal: Number(allowanceForm.casualTotal),
                  casualUsed
                }
              });
              setEditingLeaveAllowanceEmp(null);
            }} className="p-6 space-y-4">
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
                  onClick={() => setEditingLeaveAllowanceEmp(null)}
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

      {/* HR APPLY LEAVE MODAL */}
      {isApplyingLeave && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="bg-amber-50 dark:bg-amber-950/30 p-6 border-b border-amber-100 dark:border-amber-900/40 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                  <HeartHandshake className="h-5 w-5 text-amber-600" /> Log / Apply Employee Leave
                </h3>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">Register annual, sick, or casual leave for personnel</p>
              </div>
              <button onClick={() => setIsApplyingLeave(false)} className="text-amber-400 hover:text-amber-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleApplyLeaveSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Employee *</label>
                <select
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900"
                  value={leaveForm.employeeId || employees[0]?.id || ''}
                  onChange={e => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.position} - {emp.department})
                    </option>
                  ))}
                </select>
              </div>

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
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Approval Status</label>
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
                  placeholder="e.g. Annual leave or medical certificate details..."
                  value={leaveForm.reason}
                  onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsApplyingLeave(false)}
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

      {/* HR LOG HOURS MODAL */}
      {isLoggingHoursModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-6 border-b border-emerald-100 dark:border-emerald-900/40 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-emerald-600" /> Log Labor Hours & Attendance
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">Record daily work shift hours for site personnel</p>
              </div>
              <button onClick={() => setIsLoggingHoursModal(false)} className="text-emerald-400 hover:text-emerald-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleLogHoursSubmit} className="p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Select Employees * ({selectedEmployeeIds.length} of {employees.length} Selected)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedEmployeeIds(employees.map(e => e.id))}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Select All ({employees.length})
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedEmployeeIds(employees.filter(e => e.status === 'Active').map(e => e.id))}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Active Only
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedEmployeeIds([])}
                      className="text-[11px] font-bold text-slate-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEmployeePickerOpen(true)}
                  className="w-full text-left p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all flex items-center justify-between group shadow-xs"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {selectedEmployeeIds.length === 0 
                          ? 'No employees selected — Click to choose' 
                          : selectedEmployeeIds.length === employees.length 
                            ? `All Employees Selected (${employees.length} personnel)` 
                            : `${selectedEmployeeIds.length} Employee${selectedEmployeeIds.length === 1 ? '' : 's'} Selected`}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {selectedEmployeeIds.length === 0 
                          ? 'Click to open employee selection pop-up panel' 
                          : employees.filter(e => selectedEmployeeIds.includes(e.id)).map(e => `${e.firstName} ${e.lastName}`).join(', ')}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 shrink-0 ml-2 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/60">
                    Browse & Select →
                  </span>
                </button>

                {/* Quick Selected Chips with Remove button */}
                {selectedEmployeeIds.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60">
                    {employees.filter(e => selectedEmployeeIds.includes(e.id)).map(emp => (
                      <span
                        key={emp.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>{emp.firstName} {emp.lastName}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({emp.position})</span>
                        <button
                          type="button"
                          onClick={() => setSelectedEmployeeIds(prev => prev.filter(id => id !== emp.id))}
                          className="text-slate-400 hover:text-rose-500 ml-0.5"
                          title={`Remove ${emp.firstName}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Project / Site *</label>
                  <select
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900"
                    value={hoursForm.projectId}
                    onChange={e => setHoursForm({ ...hoursForm, projectId: e.target.value })}
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                    {projects.length === 0 && <option value="PRJ-DEFAULT">General Site</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Task / Activity *</label>
                  <select
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900"
                    value={hoursForm?.activityId}
                    onChange={e => setHoursForm({ ...hoursForm, activityId: e.target.value })}
                  >
                    {activities.filter(a => a.projectId === hoursForm.projectId).map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                    {activities.filter(a => a.projectId === hoursForm.projectId).length === 0 && (
                      <option value="ACT-DEFAULT">General Labor / Maintenance</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900"
                    value={hoursForm.date}
                    onChange={e => setHoursForm({ ...hoursForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Start Time *</label>
                  <input
                    type="time"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900"
                    value={hoursForm.startTime}
                    onChange={e => setHoursForm({ ...hoursForm, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">End Time *</label>
                  <input
                    type="time"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900"
                    value={hoursForm.endTime}
                    onChange={e => setHoursForm({ ...hoursForm, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Lunch Break</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900"
                    value={hoursForm.lunchBreak}
                    onChange={e => setHoursForm({ ...hoursForm, lunchBreak: parseFloat(e.target.value) })}
                  >
                    <option value="0">No Lunch</option>
                    <option value="0.5">30 Minutes</option>
                    <option value="1">1 Hour</option>
                    <option value="1.5">1.5 Hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Hours Worked</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    required
                    readOnly
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-slate-50 dark:bg-slate-800 font-bold text-slate-500"
                    value={hoursForm.hoursWorked}
                    onChange={e => setHoursForm({ ...hoursForm, hoursWorked: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Shift Type</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900"
                    value={hoursForm.shiftType}
                    onChange={e => setHoursForm({ ...hoursForm, shiftType: e.target.value })}
                  >
                    <option value="Normal Shift">Normal Shift (Standard)</option>
                    <option value="Overtime">Overtime</option>
                    <option value="Night Shift">Night Shift</option>
                    <option value="Weekend Shift">Weekend Shift</option>
                  </select>
                </div>
              </div>

              {/* Smart Shift Consolidation / Overlap Notice */}
              {(() => {
                if (!hoursForm.date || selectedEmployeeIds.length === 0) return null;
                const selectedEmps = employees.filter(e => selectedEmployeeIds.includes(e.id));
                const overlappingEmps = selectedEmps.filter(emp => {
                  const empName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
                  return labourLogs.some(l => {
                    const lName = (l.workerName || '').trim().toLowerCase();
                    const lIsSpecial = (l.notes || '').toLowerCase().includes('night shift') || (l.notes || '').toLowerCase().includes('overtime');
                    return lName === empName && l.date === hoursForm.date && (hoursForm.shiftType === 'Normal Shift' ? !lIsSpecial : true);
                  });
                });

                if (overlappingEmps.length === 0) return null;

                const isSpecial = hoursForm.shiftType === 'Overtime' || hoursForm.shiftType === 'Night Shift';

                return (
                  <div className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs shadow-2xs ${
                    isSpecial 
                      ? 'bg-purple-50/80 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800 text-purple-900 dark:text-purple-200'
                      : 'bg-blue-50/80 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                  }`}>
                    <AlertCircle className={`h-4 w-4 shrink-0 mt-0.5 ${isSpecial ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`} />
                    <div>
                      <p className="font-bold">
                        {isSpecial 
                          ? `🌙 ${hoursForm.shiftType} Mode Active`
                          : `ℹ️ Smart Daily Shift Consolidation (${overlappingEmps.length} Worker${overlappingEmps.length > 1 ? 's' : ''} Already Logged)`
                        }
                      </p>
                      <p className="text-[11px] mt-0.5 leading-relaxed opacity-90">
                        {isSpecial ? (
                          <span>
                            Logging additional {hoursForm.shiftType.toLowerCase()} hours for {overlappingEmps.length} worker{overlappingEmps.length > 1 ? 's' : ''} alongside their standard daily hours.
                          </span>
                        ) : (
                          <span>
                            <strong>{overlappingEmps.map(e => `${e.firstName} ${e.lastName}`).slice(0, 3).join(', ')}{overlappingEmps.length > 3 ? ` +${overlappingEmps.length - 3} more` : ''}</strong> already have a normal shift on {hoursForm.date}. To prevent duplicate rows, submitting will consolidate/update their single daily record (up to the 12h maximum limit).
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Work Notes / Tasks Completed</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900"
                  placeholder="e.g. Concrete slab foundation pouring..."
                  value={hoursForm.notes}
                  onChange={e => setHoursForm({ ...hoursForm, notes: e.target.value })}
                />
              </div>

              <div className="mt-6 flex items-center justify-between gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500">
                  {selectedEmployeeIds.length} personnel selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLoggingHoursModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={selectedEmployeeIds.length === 0}
                    className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-sm transition-all"
                  >
                    {selectedEmployeeIds.length > 1 
                      ? `Log Hours (${selectedEmployeeIds.length} Employees)` 
                      : 'Log Hours'}
                  </button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* EMPLOYEE PICKER POP-UP PANEL */}
      {isEmployeePickerOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl max-h-[85vh] shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
            {/* Header */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-5 border-b border-emerald-100 dark:border-emerald-900/40 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600" /> Select Personnel for Hours Logging
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Select one, multiple, or all employees to apply shift hours in one batch
                </p>
              </div>
              <button 
                onClick={() => setIsEmployeePickerOpen(false)} 
                className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-300 p-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search and Filters */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/60 dark:bg-slate-900/60 shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, position, or department..."
                    value={pickerSearchQuery}
                    onChange={e => setPickerSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {pickerSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setPickerSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                
                <select
                  value={pickerDepartmentFilter}
                  onChange={e => setPickerDepartmentFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                >
                  <option value="All">All Departments</option>
                  {Array.from(new Set(employees.map(e => e.department).filter(Boolean))).map(dep => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
              </div>

              {/* Quick Selection Actions */}
              <div className="flex flex-wrap items-center justify-between text-xs pt-1 gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Selected: <span className="text-emerald-600 dark:text-emerald-400 font-black">{selectedEmployeeIds.length}</span> of {employees.length} personnel
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const visibleIds = employees
                        .filter(e => {
                          const matchesSearch = `${e.firstName} ${e.lastName} ${e.position} ${e.department}`.toLowerCase().includes(pickerSearchQuery.toLowerCase());
                          const matchesDept = pickerDepartmentFilter === 'All' || e.department === pickerDepartmentFilter;
                          return matchesSearch && matchesDept;
                        })
                        .map(e => e.id);
                      setSelectedEmployeeIds(prev => Array.from(new Set([...prev, ...visibleIds])));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 dark:text-emerald-300 font-bold transition-colors"
                  >
                    Select Filtered
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = employees.map(e => e.id);
                      setSelectedEmployeeIds(allIds);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors"
                  >
                    Select All ({employees.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const activeIds = employees.filter(e => e.status === 'Active').map(e => e.id);
                      setSelectedEmployeeIds(activeIds);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition-colors"
                  >
                    Active Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedEmployeeIds([])}
                    className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-rose-600 font-bold transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Employee Checklist */}
            <div className="p-4 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 flex-1 max-h-96">
              {employees
                .filter(e => {
                  const matchesSearch = `${e.firstName} ${e.lastName} ${e.position} ${e.department}`.toLowerCase().includes(pickerSearchQuery.toLowerCase());
                  const matchesDept = pickerDepartmentFilter === 'All' || e.department === pickerDepartmentFilter;
                  return matchesSearch && matchesDept;
                })
                .map(emp => {
                  const isSelected = selectedEmployeeIds.includes(emp.id);
                  return (
                    <div
                      key={emp.id}
                      onClick={() => {
                        setSelectedEmployeeIds(prev => 
                          prev.includes(emp.id) ? prev.filter(id => id !== emp.id) : [...prev, emp.id]
                        );
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all my-1 ${
                        isSelected 
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-800/60' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 pointer-events-none"
                        />
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black flex items-center justify-center">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {emp.firstName} {emp.lastName}
                            {emp.status === 'Active' ? (
                              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active"></span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                {emp.status}
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {emp.position} • <span className="font-semibold">{emp.department}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {isSelected ? '✓ Selected' : 'Select'}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {selectedEmployeeIds.length} of {employees.length} personnel selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEmployeePickerOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setIsEmployeePickerOpen(false)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" /> Done ({selectedEmployeeIds.length} Selected)
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* CREATE TEAM MODAL */}
      {isAddingTeam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-xl shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-purple-600" /> Create Work Team
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Group personnel into functional project teams</p>
              </div>
              <button onClick={() => setIsAddingTeam(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddTeamSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Team Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Concrete Pouring Crew A"
                  value={teamForm.name}
                  onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Department</label>
                  <CustomSelect
                    value={teamForm.department}
                    onChange={val => setTeamForm({ ...teamForm, department: val })}
                    options={['Construction', 'Engineering', 'Management', 'Health & Safety', 'Quality Assurance', 'Administration']}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    customPlaceholder="Enter custom department..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Team Leader / Supervisor</label>
                  <select
                    value={teamForm.leaderId}
                    onChange={e => setTeamForm({ ...teamForm, leaderId: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- Select Team Leader --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.position})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Team Description & Responsibilities</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Primary team for foundation concrete works and rebar fixing"
                  value={teamForm.description}
                  onChange={e => setTeamForm({ ...teamForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Members Selection Checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Select Team Members ({teamForm.memberIds.length} of {employees.length} selected)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllMembers}
                      disabled={teamForm.memberIds.length === employees.length}
                      className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Select All
                    </button>
                    <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllMembers}
                      disabled={teamForm.memberIds.length === 0}
                      className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 p-2 bg-slate-50/50 dark:bg-slate-900/50">
                  {employees.map(emp => {
                    const isSelected = teamForm.memberIds.includes(emp.id);
                    return (
                      <label key={emp.id} className="flex items-center justify-between p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center">
                            {emp.firstName[0]}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{emp.firstName} {emp.lastName}</p>
                            <p className="text-[10px] text-slate-400">{emp.position} • {emp.department}</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleMemberSelection(emp.id)}
                          className="h-4 w-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddingTeam(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm">Save Team</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* EDIT TEAM MODAL */}
      {editingTeam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-xl shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-purple-600" /> Edit Work Team
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{editingTeam.id} - {editingTeam.name}</p>
              </div>
              <button onClick={() => setEditingTeam(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditTeamSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Team Name *</label>
                <input
                  type="text"
                  required
                  value={teamForm.name}
                  onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Department</label>
                  <CustomSelect
                    value={teamForm.department}
                    onChange={val => setTeamForm({ ...teamForm, department: val })}
                    options={['Construction', 'Engineering', 'Management', 'Health & Safety', 'Quality Assurance', 'Administration']}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    customPlaceholder="Enter custom department..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Team Leader / Supervisor</label>
                  <select
                    value={teamForm.leaderId}
                    onChange={e => setTeamForm({ ...teamForm, leaderId: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- Select Team Leader --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.position})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Team Description</label>
                <textarea
                  rows={2}
                  value={teamForm.description}
                  onChange={e => setTeamForm({ ...teamForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Members Selection Checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Assigned Team Members ({teamForm.memberIds.length} of {employees.length} selected)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllMembers}
                      disabled={teamForm.memberIds.length === employees.length}
                      className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Select All
                    </button>
                    <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllMembers}
                      disabled={teamForm.memberIds.length === 0}
                      className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 p-2 bg-slate-50/50 dark:bg-slate-900/50">
                  {employees.map(emp => {
                    const isSelected = teamForm.memberIds.includes(emp.id);
                    return (
                      <label key={emp.id} className="flex items-center justify-between p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center">
                            {emp.firstName[0]}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{emp.firstName} {emp.lastName}</p>
                            <p className="text-[10px] text-slate-400">{emp.position} • {emp.department}</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleMemberSelection(emp.id)}
                          className="h-4 w-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingTeam(null)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm">Update Team</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* DELETE TEAM CONFIRMATION MODAL */}
      {deletingTeam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="bg-rose-50 dark:bg-rose-950/30 p-6 border-b border-rose-100 dark:border-rose-900/50">
              <h3 className="text-lg font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <Trash2 className="h-5 w-5" /> Confirm Team Deletion
              </h3>
            </div>
            <div className="p-6 space-y-2">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Are you sure you want to delete team <strong className="text-slate-900 dark:text-white">"{deletingTeam.name}"</strong>?
              </p>
              <p className="text-xs text-slate-500">
                This removes the team grouping. All individual employees will remain safely stored in the database.
              </p>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2 rounded-b-xl">
              <button onClick={() => setDeletingTeam(null)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={handleDeleteTeamConfirm} className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white">Delete Team</button>
            </div>
          </Card>
        </div>
      )}

      {/* EDIT EMPLOYEE MODAL */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <Card className="w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-slate-200 dark:border-slate-800 rounded-2xl animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-[#0B5FFF]" /> Edit Employee Profile
              </h3>
              <button onClick={() => setEditingEmployee(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditEmployeeSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editingEmployee.firstName}
                    onChange={e => setEditingEmployee({ ...editingEmployee, firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={editingEmployee.lastName}
                    onChange={e => setEditingEmployee({ ...editingEmployee, lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Position *</label>
                  <input
                    type="text"
                    required
                    value={editingEmployee.position}
                    onChange={e => setEditingEmployee({ ...editingEmployee, position: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Department *</label>
                  <input
                    type="text"
                    required
                    value={editingEmployee.department}
                    onChange={e => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingEmployee.email}
                    onChange={e => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editingEmployee.phone}
                    onChange={e => setEditingEmployee({ ...editingEmployee, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Employment Status</label>
                <select
                  value={editingEmployee.status || 'Active'}
                  onChange={e => setEditingEmployee({ ...editingEmployee, status: e.target.value as EmployeeStatus })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900"
                >
                  <option value="Active">Active</option>
                  <option value="Absent">Absent</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Terminated">Terminated</option>
                  <option value="Induction">Induction</option>
                  <option value="Under Review">Under Review</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Emergency Contact</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Name"
                    value={editingEmployee.emergencyContact?.name || ''}
                    onChange={e => setEditingEmployee({
                      ...editingEmployee,
                      emergencyContact: {
                        name: e.target.value,
                        phone: editingEmployee.emergencyContact?.phone || '',
                        relationship: editingEmployee.emergencyContact?.relationship || ''
                      }
                    })}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={editingEmployee.emergencyContact?.phone || ''}
                    onChange={e => setEditingEmployee({
                      ...editingEmployee,
                      emergencyContact: {
                        name: editingEmployee.emergencyContact?.name || '',
                        phone: e.target.value,
                        relationship: editingEmployee.emergencyContact?.relationship || ''
                      }
                    })}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="Relationship"
                    value={editingEmployee.emergencyContact?.relationship || ''}
                    onChange={e => setEditingEmployee({
                      ...editingEmployee,
                      emergencyContact: {
                        name: editingEmployee.emergencyContact?.name || '',
                        phone: editingEmployee.emergencyContact?.phone || '',
                        relationship: e.target.value
                      }
                    })}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Site Notes / Bio</label>
                <textarea
                  rows={2}
                  value={editingEmployee.notes || ''}
                  onChange={e => setEditingEmployee({ ...editingEmployee, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900"
                />
              </div>

              {/* Company Accommodation Logistics */}
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">Company Accommodation</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={editingEmployee.hasAccommodation || false}
                      onChange={e => setEditingEmployee({ ...editingEmployee, hasAccommodation: e.target.checked })}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                    <span className="ml-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {editingEmployee.hasAccommodation ? 'Provided' : 'Not Provided'}
                    </span>
                  </label>
                </div>

                {editingEmployee.hasAccommodation && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-indigo-100/80 dark:border-indigo-900/30 animate-in fade-in">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Camp / Facility</label>
                      <select
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
                        value={editingEmployee.accommodationDetails?.campId || ''}
                        onChange={e => {
                          const selectedAcc = accommodations.find(a => a.id === e.target.value);
                          setEditingEmployee({
                            ...editingEmployee,
                            accommodationDetails: {
                              campId: e.target.value,
                              campName: selectedAcc ? selectedAcc.name : e.target.value,
                              roomNumber: editingEmployee.accommodationDetails?.roomNumber || '',
                              subsidyAmount: editingEmployee.accommodationDetails?.subsidyAmount || 0,
                              notes: editingEmployee.accommodationDetails?.notes || ''
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
                        value={editingEmployee.accommodationDetails?.roomNumber || ''}
                        onChange={e => setEditingEmployee({
                          ...editingEmployee,
                          accommodationDetails: {
                            campId: editingEmployee.accommodationDetails?.campId,
                            campName: editingEmployee.accommodationDetails?.campName || '',
                            roomNumber: e.target.value,
                            subsidyAmount: editingEmployee.accommodationDetails?.subsidyAmount || 0,
                            notes: editingEmployee.accommodationDetails?.notes || ''
                          }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Subsidy (R)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        value={editingEmployee.accommodationDetails?.subsidyAmount || ''}
                        onChange={e => setEditingEmployee({
                          ...editingEmployee,
                          accommodationDetails: {
                            campName: editingEmployee.accommodationDetails?.campName || '',
                            roomNumber: editingEmployee.accommodationDetails?.roomNumber || '',
                            subsidyAmount: parseFloat(e.target.value) || 0,
                            notes: editingEmployee.accommodationDetails?.notes || ''
                          }
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Company Transport Logistics */}
              <div className="p-4 bg-teal-50/50 dark:bg-teal-950/20 rounded-xl border border-teal-100 dark:border-teal-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bus className="h-4 w-4 text-teal-600" />
                    <span className="text-xs font-bold text-teal-950 dark:text-teal-200 uppercase tracking-wider">Company Transport</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={editingEmployee.hasTransport || false}
                      onChange={e => setEditingEmployee({ ...editingEmployee, hasTransport: e.target.checked })}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-teal-600"></div>
                    <span className="ml-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {editingEmployee.hasTransport ? 'Provided' : 'Not Provided'}
                    </span>
                  </label>
                </div>

                {editingEmployee.hasTransport && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-teal-100/80 dark:border-teal-900/30 animate-in fade-in">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Route / Shuttle</label>
                      <input
                        type="text"
                        placeholder="e.g. Route 3 Express"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        value={editingEmployee.transportDetails?.route || ''}
                        onChange={e => setEditingEmployee({
                          ...editingEmployee,
                          transportDetails: {
                            route: e.target.value,
                            pickupPoint: editingEmployee.transportDetails?.pickupPoint || ''
                          }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Pickup Point</label>
                      <input
                        type="text"
                        placeholder="e.g. Main Gate 1"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        value={editingEmployee.transportDetails?.pickupPoint || ''}
                        onChange={e => setEditingEmployee({
                          ...editingEmployee,
                          transportDetails: {
                            route: editingEmployee.transportDetails?.route || '',
                            pickupPoint: e.target.value
                          }
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingEmployee(null)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#0B5FFF] text-white">Save Changes</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* DELETE EMPLOYEE CONFIRMATION MODAL */}
      {deletingEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="bg-rose-50 dark:bg-rose-950/30 p-6 border-b border-rose-100 dark:border-rose-900/50">
              <h3 className="text-lg font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <Trash2 className="h-5 w-5" /> Confirm Employee Deletion
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Are you sure you want to delete employee <strong className="text-slate-900 dark:text-white">"{deletingEmployee.firstName} {deletingEmployee.lastName}"</strong>?
              </p>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2 rounded-b-xl">
              <button onClick={() => setDeletingEmployee(null)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={handleDeleteEmployeeConfirm} className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white">Delete Profile</button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
