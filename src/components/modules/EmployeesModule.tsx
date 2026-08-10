import React, { useState } from 'react';
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
  FileText
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Employee, Team, EmployeeStatus, LeaveRecord, LeaveType, LeaveStatus } from '../../types';
import { EmployeeDetail, getStatusBadgeStyle } from '../EmployeeDetail';
import { RemindersWidget } from '../RemindersWidget';

interface EmployeesModuleProps {
  onBack?: () => void;
}

export function EmployeesModule({ onBack }: EmployeesModuleProps) {
  const { employees, teams, projects, workerCheckIns, labourLogs, addEmployee, updateEmployee, deleteEmployee, addTeam, updateTeam, deleteTeam, addLabourLog, addWorkerCheckIn } = useAppContext();
  
  // Selected Employee for Detail View
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Tab view: 'employees' | 'teams' | 'tracker'
  const [activeTab, setActiveTab] = useState<'employees' | 'teams' | 'tracker'>('employees');
  const [trackerSubTab, setTrackerSubTab] = useState<'leave' | 'attendance' | 'balances'>('leave');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
  const [hoursForm, setHoursForm] = useState({
    employeeId: '',
    projectId: projects[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    hoursWorked: 8.0,
    shiftType: 'Normal Shift',
    notes: ''
  });

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
    const targetEmp = employees.find(e => e.id === hoursForm.employeeId) || employees[0];
    if (!targetEmp) return;

    addLabourLog({
      id: `LAB-${Math.floor(1000 + Math.random() * 9000)}`,
      projectId: hoursForm.projectId,
      date: hoursForm.date,
      workersCount: 1,
      trade: targetEmp.position,
      hoursWorked: Number(hoursForm.hoursWorked),
      supervisorName: 'HR Activity System',
      notes: `${targetEmp.firstName} ${targetEmp.lastName}: ${hoursForm.notes || hoursForm.shiftType}`
    });

    addWorkerCheckIn({
      id: `CHK-${Math.floor(1000 + Math.random() * 9000)}`,
      projectId: hoursForm.projectId,
      workerName: `${targetEmp.firstName} ${targetEmp.lastName}`,
      workerId: targetEmp.id,
      timestamp: `${hoursForm.date} 07:30`,
      action: 'Check-In',
      location: { lat: -26.2041, lng: 28.0473 }
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
    <div className="flex flex-col gap-6 w-full h-full">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
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
            onClick={() => setIsLoggingHoursModal(true)}
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
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
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

      {/* Add Employee Inline Card */}
      {isAddingEmployee && activeTab === 'employees' && (
        <Card className="border-blue-100 dark:border-blue-900/30 overflow-hidden shadow-sm">
          <div className="bg-blue-50/50 dark:bg-blue-900/10 px-6 py-4 border-b border-blue-100 dark:border-blue-900/30 flex items-center justify-between">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> New Employee Profile
            </h3>
            <button onClick={() => setIsAddingEmployee(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleAddEmployee} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">First Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                      value={newEmployee.firstName || ''}
                      onChange={e => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Last Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                      value={newEmployee.lastName || ''}
                      onChange={e => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    value={newEmployee.email || ''}
                    onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    value={newEmployee.phone || ''}
                    onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                  />
                </div>
                {/* Emergency Contact */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Emergency Contact (Optional)</span>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Name"
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
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
                      placeholder="Phone"
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
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
                      placeholder="Relationship"
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
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
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Job Position *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    value={newEmployee.position || ''}
                    onChange={e => setNewEmployee({ ...newEmployee, position: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Department *</label>
                  <CustomSelect
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    value={newEmployee.department || ''}
                    onChange={val => setNewEmployee({ ...newEmployee, department: val })}
                    options={['Management', 'Engineering', 'Construction', 'Health & Safety', 'Quality Assurance', 'Administration']}
                    placeholder="Select Department..."
                    customPlaceholder="Enter custom department..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Employment Status</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                      value={newEmployee.status || 'Active'}
                      onChange={e => setNewEmployee({ ...newEmployee, status: e.target.value as EmployeeStatus })}
                    >
                      <option value="Active">Active</option>
                      <option value="Absent">Absent</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Terminated">Terminated</option>
                      <option value="Induction">Induction</option>
                      <option value="Under Review">Under Review</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Hire Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                      value={newEmployee.hireDate || ''}
                      onChange={e => setNewEmployee({ ...newEmployee, hireDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Site Notes / Bio (Optional)</label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    placeholder="e.g. Trained site operator..."
                    value={newEmployee.notes || ''}
                    onChange={e => setNewEmployee({ ...newEmployee, notes: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddingEmployee(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#0B5FFF] text-white transition-colors"
              >
                Create Profile
              </button>
            </div>
          </form>
        </Card>
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

      {/* EDIT LEAVE ALLOCATIONS MODAL */}
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
          <Card className="w-full max-w-lg shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
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
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Employee *</label>
                <select
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900"
                  value={hoursForm.employeeId || employees[0]?.id || ''}
                  onChange={e => setHoursForm({ ...hoursForm, employeeId: e.target.value })}
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.position} - {emp.department})
                    </option>
                  ))}
                </select>
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
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900"
                    value={hoursForm.date}
                    onChange={e => setHoursForm({ ...hoursForm, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Hours Worked *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 font-bold"
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

              <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLoggingHoursModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Log Hours
                </button>
              </div>
            </form>
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
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Select Team Members ({teamForm.memberIds.length} selected)</span>
                </label>
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
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Assigned Team Members ({teamForm.memberIds.length} selected)</span>
                </label>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-[#0B5FFF]" /> Edit Employee Profile
              </h3>
              <button onClick={() => setEditingEmployee(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditEmployeeSubmit} className="p-6 space-y-4">
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
