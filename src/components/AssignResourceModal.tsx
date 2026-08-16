import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  User, 
  Truck, 
  Calendar, 
  Clock, 
  Building, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Layers, 
  Wrench, 
  ShieldAlert,
  ChevronRight,
  Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from './ui';
import { useAppContext } from '../context/AppContext';
import { Activity, Employee, Equipment, LabourAllocation, ResourceAllocation, TaskLabourAssignment, TaskEquipmentAssignment } from '../types';

export interface AssignResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'employee' | 'equipment';
  initialProjectId?: string;
  initialActivityId?: string;
  initialSubtaskId?: string;
  editingAllocation?: {
    type: 'employee' | 'equipment';
    data: LabourAllocation | ResourceAllocation;
  } | null;
}

export function AssignResourceModal({
  isOpen,
  onClose,
  initialType = 'employee',
  initialProjectId,
  initialActivityId,
  initialSubtaskId,
  editingAllocation
}: AssignResourceModalProps) {
  const { 
    projects, 
    activities, 
    employees, 
    equipment, 
    labourAllocations, 
    allocations, 
    addLabourAllocation, 
    updateLabourAllocation, 
    addAllocation, 
    updateAllocation, 
    updateActivity, 
    addAuditLog,
    currentUserProfile,
    userRole
  } = useAppContext();

  const [resourceType, setResourceType] = useState<'employee' | 'equipment'>(
    editingAllocation?.type || initialType
  );

  // Common Fields
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    editingAllocation?.data?.projectId || initialProjectId || projects[0]?.id || ''
  );
  const [selectedActivityId, setSelectedActivityId] = useState<string>(
    (editingAllocation?.type === 'employee' 
      ? (editingAllocation.data as LabourAllocation)?.activityId 
      : (editingAllocation?.data as ResourceAllocation)?.activityId) || 
    initialActivityId || 
    ''
  );
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string>(
    editingAllocation?.data?.subtaskId || initialSubtaskId || ''
  );

  // Employee Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [workerName, setWorkerName] = useState<string>('');
  const [workerRole, setWorkerRole] = useState<string>('');
  const [plannedHours, setPlannedHours] = useState<number>(8);
  const [employeeStartDate, setEmployeeStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [employeeEndDate, setEmployeeEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [employeeStatus, setEmployeeStatus] = useState<'Scheduled' | 'Active' | 'Completed' | 'Cancelled'>('Active');
  const [employeeNotes, setEmployeeNotes] = useState<string>('');

  // Equipment Form State
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [equipmentName, setEquipmentName] = useState<string>('');
  const [equipmentQuantity, setEquipmentQuantity] = useState<number>(1);
  const [operatorId, setOperatorId] = useState<string>('');
  const [operatorName, setOperatorName] = useState<string>('');
  const [equipmentPlannedHours, setEquipmentPlannedHours] = useState<number>(8);
  const [equipmentStartDate, setEquipmentStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [equipmentReturnDate, setEquipmentReturnDate] = useState<string>('');
  const [equipmentStatus, setEquipmentStatus] = useState<'Allocated' | 'In Use' | 'Completed' | 'Returned'>('In Use');
  const [equipmentNotes, setEquipmentNotes] = useState<string>('');

  // Activities for selected project
  const projectActivities = useMemo(() => {
    return activities.filter(a => a?.projectId === selectedProjectId);
  }, [activities, selectedProjectId]);

  // Selected Activity Object
  const currentActivity = useMemo(() => {
    return activities.find(a => a?.id === selectedActivityId);
  }, [activities, selectedActivityId]);

  // Sync default activity when project changes if not set
  useEffect(() => {
    if (projectActivities.length > 0 && (!selectedActivityId || !projectActivities.some(a => a?.id === selectedActivityId))) {
      setSelectedActivityId(projectActivities[0].id);
    }
  }, [selectedProjectId, projectActivities, selectedActivityId]);

  // Sync date defaults from selected activity
  useEffect(() => {
    if (currentActivity && !editingAllocation) {
      if (currentActivity.startDate) {
        setEmployeeStartDate(currentActivity.startDate);
        setEquipmentStartDate(currentActivity.startDate);
      }
      if (currentActivity.finishDate) {
        setEmployeeEndDate(currentActivity.finishDate);
        setEquipmentReturnDate(currentActivity.finishDate);
      }
    }
  }, [currentActivity, editingAllocation]);

  // Initialize or populate from editingAllocation
  useEffect(() => {
    if (editingAllocation) {
      setResourceType(editingAllocation.type);
      setSelectedProjectId(editingAllocation.data?.projectId);
      
      if (editingAllocation.type === 'employee') {
        const data = editingAllocation.data as LabourAllocation;
        setSelectedActivityId(data?.activityId || '');
        setSelectedSubtaskId(data.subtaskId || '');
        setSelectedEmployeeId(data.employeeId || '');
        setWorkerName(data.workerName || '');
        setWorkerRole(data.workerRole || '');
        setPlannedHours(data.hours || 8);
        setEmployeeStartDate(data.startDate || new Date().toISOString().split('T')[0]);
        setEmployeeEndDate(data.endDate || new Date().toISOString().split('T')[0]);
        setEmployeeStatus(data.status || 'Active');
        setEmployeeNotes(data.notes || '');
      } else {
        const data = editingAllocation.data as ResourceAllocation;
        setSelectedActivityId(data?.activityId || '');
        setSelectedSubtaskId(data.subtaskId || '');
        setSelectedEquipmentId(data.equipmentId || data.resourceId || '');
        setEquipmentName(data.name || '');
        setEquipmentQuantity(data.quantity || 1);
        setOperatorId(data.operatorEmployeeId || '');
        setOperatorName(data.assignedTo || '');
        setEquipmentPlannedHours(data.plannedHours || 8);
        setEquipmentStartDate(data.assignedDate || new Date().toISOString().split('T')[0]);
        setEquipmentReturnDate(data.expectedReturnDate || '');
        setEquipmentStatus(data.status as any || 'In Use');
        setEquipmentNotes(data.notes || '');
      }
    } else {
      setResourceType(initialType);
      if (initialProjectId) setSelectedProjectId(initialProjectId);
      if (initialActivityId) setSelectedActivityId(initialActivityId);
      if (initialSubtaskId) setSelectedSubtaskId(initialSubtaskId);
    }
  }, [editingAllocation, initialType, initialProjectId, initialActivityId, initialSubtaskId]);

  // Handle Employee Selection
  const handleEmployeeSelect = (empId: string) => {
    setSelectedEmployeeId(empId);
    const found = employees.find(e => e?.id === empId);
    if (found) {
      setWorkerName(`${found.firstName} ${found.lastName}`);
      setWorkerRole(found.position || 'Site Worker');
    }
  };

  // Handle Equipment Selection
  const handleEquipmentSelect = (eqId: string) => {
    setSelectedEquipmentId(eqId);
    const found = equipment.find(e => e?.id === eqId);
    if (found) {
      setEquipmentName(found.name);
      if (found.operator && !operatorName) {
        setOperatorName(found.operator);
      }
    }
  };

  // Handle Operator Select
  const handleOperatorSelect = (empId: string) => {
    setOperatorId(empId);
    const found = employees.find(e => e?.id === empId);
    if (found) {
      setOperatorName(`${found.firstName} ${found.lastName} (${found.position})`);
    }
  };

  // Real-time Conflict Checking for Employee
  const employeeConflicts = useMemo(() => {
    if (!workerName && !selectedEmployeeId) return [];
    
    return labourAllocations.filter(a => {
      // Exclude the record currently being edited
      if (editingAllocation && editingAllocation.type === 'employee' && a?.id === editingAllocation.data.id) {
        return false;
      }
      if (a.status === 'Cancelled' || a.status === 'Completed') return false;

      const isSameEmployee = (selectedEmployeeId && a.employeeId === selectedEmployeeId) || 
                             (workerName && a.workerName.toLowerCase() === workerName.toLowerCase());
      if (!isSameEmployee) return false;

      // Check date overlaps
      const allocStart = new Date(a.startDate).getTime();
      const allocEnd = new Date(a.endDate).getTime();
      const reqStart = new Date(employeeStartDate).getTime();
      const reqEnd = new Date(employeeEndDate).getTime();

      return reqStart <= allocEnd && reqEnd >= allocStart;
    });
  }, [workerName, selectedEmployeeId, employeeStartDate, employeeEndDate, labourAllocations, editingAllocation]);

  // Real-time Conflict Checking for Equipment
  const equipmentConflicts = useMemo(() => {
    if (!equipmentName && !selectedEquipmentId) return [];

    return allocations.filter(a => {
      if (editingAllocation && editingAllocation.type === 'equipment' && a?.id === editingAllocation.data.id) {
        return false;
      }
      if (a.status === 'Returned' || a.status === 'Depleted' || a.status === 'Completed') return false;
      if (a.resourceType !== 'Equipment') return false;

      const isSameEq = (selectedEquipmentId && (a.equipmentId === selectedEquipmentId || a.resourceId === selectedEquipmentId)) ||
                       (equipmentName && a.name.toLowerCase() === equipmentName.toLowerCase());
      if (!isSameEq) return false;

      const allocStart = new Date(a.assignedDate).getTime();
      const allocEnd = a.expectedReturnDate ? new Date(a.expectedReturnDate).getTime() : new Date('2099-12-31').getTime();
      const reqStart = new Date(equipmentStartDate).getTime();
      const reqEnd = equipmentReturnDate ? new Date(equipmentReturnDate).getTime() : reqStart;

      return reqStart <= allocEnd && reqEnd >= allocStart;
    });
  }, [equipmentName, selectedEquipmentId, equipmentStartDate, equipmentReturnDate, allocations, editingAllocation]);

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !selectedActivityId) return;

    const targetActivity = activities.find(a => a?.id === selectedActivityId);
    const activityName = targetActivity?.name || selectedActivityId;
    const currentUserName = currentUserProfile?.name ? `${currentUserProfile.name} (${currentUserProfile.role || userRole || 'User'})` : 'Operations Supervisor';

    if (resourceType === 'employee') {
      if (!workerName) return;

      const allocationId = editingAllocation && editingAllocation.type === 'employee' 
        ? editingAllocation.data.id 
        : `LA-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      const newLabourAlloc: LabourAllocation = {
        id: allocationId,
        projectId: selectedProjectId,
        activityId: selectedActivityId,
        subtaskId: selectedSubtaskId || undefined,
        employeeId: selectedEmployeeId || undefined,
        workerName,
        workerRole: workerRole || 'Site Worker',
        hours: Number(plannedHours) || 8,
        startDate: employeeStartDate,
        endDate: employeeEndDate,
        status: employeeStatus,
        notes: employeeNotes
      };

      if (editingAllocation && editingAllocation.type === 'employee') {
        updateLabourAllocation(newLabourAlloc);
      } else {
        addLabourAllocation(newLabourAlloc);
      }

      // Synchronize with target activity's assignedLabour array
      if (targetActivity) {
        const existingLabour = targetActivity.assignedLabour || [];
        const taskAssignment: TaskLabourAssignment = {
          id: `TLA-${allocationId}`,
          employeeId: selectedEmployeeId || undefined,
          name: workerName,
          role: workerRole || 'Site Worker',
          hours: Number(plannedHours) || 8,
          startDate: employeeStartDate,
          endDate: employeeEndDate,
          notes: employeeNotes
        };

        const updatedLabour = existingLabour.some(l => l.name === workerName || (selectedEmployeeId && l.employeeId === selectedEmployeeId))
          ? existingLabour.map(l => (l.name === workerName || (selectedEmployeeId && l.employeeId === selectedEmployeeId)) ? taskAssignment : l)
          : [taskAssignment, ...existingLabour];

        updateActivity({
          ...targetActivity,
          assignedLabour: updatedLabour
        });
      }

      // Add Audit Log
      addAuditLog({
        id: `AL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        projectId: selectedProjectId,
        userId: currentUserName,
        action: editingAllocation ? 'Updated Employee Task Allocation' : 'Assigned Employee to Task',
        details: `${editingAllocation ? 'Updated assignment for' : 'Assigned'} employee ${workerName} (${workerRole}) to task "${activityName}" (${selectedActivityId}) for ${plannedHours} hrs/shift from ${employeeStartDate} to ${employeeEndDate}.`,
        timestamp: new Date().toISOString(),
        entityType: 'LabourLog',
        entityId: allocationId,
        actionType: editingAllocation ? 'update' : 'create'
      });

    } else {
      // Equipment Allocation
      if (!equipmentName) return;

      const allocationId = editingAllocation && editingAllocation.type === 'equipment'
        ? editingAllocation.data.id
        : `RES-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      const newResourceAlloc: ResourceAllocation = {
        id: allocationId,
        projectId: selectedProjectId,
        activityId: selectedActivityId,
        subtaskId: selectedSubtaskId || undefined,
        resourceId: selectedEquipmentId || undefined,
        equipmentId: selectedEquipmentId || undefined,
        resourceType: 'Equipment',
        name: equipmentName,
        quantity: Number(equipmentQuantity) || 1,
        unit: 'Unit',
        status: equipmentStatus,
        assignedDate: equipmentStartDate,
        expectedReturnDate: equipmentReturnDate || undefined,
        assignedTo: operatorName || undefined,
        operatorEmployeeId: operatorId || undefined,
        plannedHours: Number(equipmentPlannedHours) || 8,
        notes: equipmentNotes
      };

      if (editingAllocation && editingAllocation.type === 'equipment') {
        updateAllocation(newResourceAlloc);
      } else {
        addAllocation(newResourceAlloc);
      }

      // Synchronize with target activity's assignedEquipment array
      if (targetActivity) {
        const existingEq = targetActivity.assignedEquipment || [];
        const taskEqAssignment: TaskEquipmentAssignment = {
          id: `TEA-${allocationId}`,
          equipmentId: selectedEquipmentId || `EQ-${Date.now()}`,
          name: equipmentName,
          operator: operatorName || 'Assigned Operator',
          startDate: equipmentStartDate,
          endDate: equipmentReturnDate || undefined,
          notes: equipmentNotes
        };

        const updatedEq = existingEq.some(e => e.name === equipmentName || (selectedEquipmentId && e.equipmentId === selectedEquipmentId))
          ? existingEq.map(e => (e.name === equipmentName || (selectedEquipmentId && e.equipmentId === selectedEquipmentId)) ? taskEqAssignment : e)
          : [taskEqAssignment, ...existingEq];

        updateActivity({
          ...targetActivity,
          assignedEquipment: updatedEq
        });
      }

      // Add Audit Log
      addAuditLog({
        id: `AL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        projectId: selectedProjectId,
        userId: currentUserName,
        action: editingAllocation ? 'Updated Equipment Task Allocation' : 'Allocated Equipment to Task',
        details: `${editingAllocation ? 'Updated allocation of' : 'Allocated'} equipment ${equipmentName} (Operator: ${operatorName || 'None specified'}) to task "${activityName}" (${selectedActivityId}) starting ${equipmentStartDate}${equipmentReturnDate ? ` through ${equipmentReturnDate}` : ''}.`,
        timestamp: new Date().toISOString(),
        entityType: 'Equipment',
        entityId: allocationId,
        actionType: editingAllocation ? 'update' : 'create'
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* HEADER */}
        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              resourceType === 'employee'
                ? 'bg-blue-100 dark:bg-blue-900/50 text-[#0B5FFF]'
                : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'
            }`}>
              {resourceType === 'employee' ? <User className="h-6 w-6" /> : <Truck className="h-6 w-6" />}
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {editingAllocation 
                  ? `Edit ${resourceType === 'employee' ? 'Employee' : 'Equipment'} Allocation` 
                  : 'Assign Resource to Task'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Allocate site personnel, operators, and heavy equipment to specific project work packages and tasks.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* TYPE SWITCHER TABS (if not editing) */}
        {!editingAllocation && (
          <div className="px-4 md:px-6 pt-4 pb-1 bg-white dark:bg-slate-900 shrink-0">
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setResourceType('employee')}
                className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  resourceType === 'employee'
                    ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <User className="h-4 w-4" />
                Assign Employee / Crew
              </button>
              <button
                type="button"
                onClick={() => setResourceType('equipment')}
                className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  resourceType === 'equipment'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Truck className="h-4 w-4" />
                Assign Equipment / Machinery
              </button>
            </div>
          </div>
        )}

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          
          {/* SECTION 1: TARGET PROJECT & TASK */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-3.5">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
              <Building className="h-3.5 w-3.5 text-[#0B5FFF]" />
              Target Project & Task Assignment
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">
                  Project *
                </label>
                <select
                  required
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">
                  Target Task / Activity *
                </label>
                <select
                  required
                  value={selectedActivityId}
                  onChange={e => setSelectedActivityId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none"
                >
                  <option value="">-- Select Project Task --</option>
                  {projectActivities.map(act => (
                    <option key={act.id} value={act.id}>
                      {act.name} [{act.workPackage || act.discipline || 'General'}]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional Subtask Selection */}
            {currentActivity && currentActivity.subtasks && currentActivity.subtasks.length > 0 && (
              <div className="space-y-1 pt-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>Optional Subtask / Milestone</span>
                  <span className="text-[10px] text-slate-400">({currentActivity.subtasks.length} subtasks available)</span>
                </label>
                <select
                  value={selectedSubtaskId}
                  onChange={e => setSelectedSubtaskId(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none"
                >
                  <option value="">Entire Task (General Scope)</option>
                  {currentActivity.subtasks.map(st => (
                    <option key={st.id} value={st.id}>
                      ↳ Subtask: {st.title} [{st.category}] - {st.status}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {currentActivity && (
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span>Discipline: <strong className="text-slate-800 dark:text-slate-200">{currentActivity.discipline}</strong></span>
                <span>•</span>
                <span>Scheduled: <strong className="text-slate-800 dark:text-slate-200">{currentActivity.startDate} to {currentActivity.finishDate}</strong></span>
                <span>•</span>
                <span>Status: <strong className="text-[#0B5FFF]">{currentActivity.status}</strong></span>
              </div>
            )}
          </div>

          {/* SECTION 2A: EMPLOYEE ALLOCATION FIELDS */}
          {resourceType === 'employee' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Select Employee from Roster</span>
                    <span className="text-[10px] text-[#0B5FFF] font-bold">Fast Auto-Fill</span>
                  </label>
                  <select
                    value={selectedEmployeeId}
                    onChange={e => handleEmployeeSelect(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-semibold focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none"
                  >
                    <option value="">-- Choose Employee (or enter below) --</option>
                    {employees.filter(e => e.status !== 'Terminated').map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} — {emp.position} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Worker / Crew Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={workerName}
                    onChange={e => setWorkerName(e.target.value)}
                    placeholder="e.g. David Miller or Steel-Fixer Crew #1"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Trade / Allocation Role *
                  </label>
                  <input
                    required
                    type="text"
                    value={workerRole}
                    onChange={e => setWorkerRole(e.target.value)}
                    placeholder="e.g. Electrician, Carpenter, Operator"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Planned Hours / Shift
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="24"
                      step="0.5"
                      value={plannedHours}
                      onChange={e => setPlannedHours(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 font-bold text-[11px]">hrs/day</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Allocation Status
                  </label>
                  <select
                    value={employeeStatus}
                    onChange={e => setEmployeeStatus(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none"
                  >
                    <option value="Active">Active (On Site)</option>
                    <option value="Scheduled">Scheduled (Upcoming)</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Assignment Start Date *
                  </label>
                  <input
                    required
                    type="date"
                    value={employeeStartDate}
                    onChange={e => setEmployeeStartDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Assignment End Date *
                  </label>
                  <input
                    required
                    type="date"
                    value={employeeEndDate}
                    onChange={e => setEmployeeEndDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Real-time Employee Conflict Warning */}
              {employeeConflicts.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 flex items-start gap-3 animate-in fade-in duration-200">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-xs">
                      Schedule Conflict Detected ({employeeConflicts.length} overlapping task{employeeConflicts.length > 1 ? 's' : ''})
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                      <strong>{workerName}</strong> is already allocated to{' '}
                      {employeeConflicts.map((c, i) => {
                        const conflictingAct = activities.find(a => a?.id === c?.activityId);
                        return (
                          <span key={c.id}>
                            {i > 0 ? ', ' : ''}
                            <strong>"{conflictingAct?.name || c?.activityId}"</strong> ({c.startDate} to {c.endDate})
                          </span>
                        );
                      })}. You may still proceed if partial shift sharing is intended.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Specific Work Instructions / Shift Notes
                </label>
                <textarea
                  rows={2}
                  value={employeeNotes}
                  onChange={e => setEmployeeNotes(e.target.value)}
                  placeholder="e.g. Assigned to rebar fixing on grid A-4; report to foreman on site."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* SECTION 2B: EQUIPMENT ALLOCATION FIELDS */}
          {resourceType === 'equipment' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Select from Equipment Fleet</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Fleet Registry</span>
                  </label>
                  <select
                    value={selectedEquipmentId}
                    onChange={e => handleEquipmentSelect(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="">-- Choose Equipment Unit (or enter below) --</option>
                    {equipment.map(eq => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name} — {eq.type} ({eq.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Equipment Name / Model *
                  </label>
                  <input
                    required
                    type="text"
                    value={equipmentName}
                    onChange={e => setEquipmentName(e.target.value)}
                    placeholder="e.g. CAT 320 Hydraulic Excavator"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Designated Certified Operator</span>
                    <span className="text-[10px] text-slate-400">Choose from staff</span>
                  </label>
                  <select
                    value={operatorId}
                    onChange={e => handleOperatorSelect(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="">-- Select Operator (Optional) --</option>
                    {employees.filter(e => e.status !== 'Terminated').map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} [{emp.position}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Operator Name (Custom / External)
                  </label>
                  <input
                    type="text"
                    value={operatorName}
                    onChange={e => setOperatorName(e.target.value)}
                    placeholder="e.g. Mike Ross (Certified Heavy Machinery Ticket)"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Quantity / Units
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={equipmentQuantity}
                    onChange={e => setEquipmentQuantity(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Planned Operating Hours
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={equipmentPlannedHours}
                      onChange={e => setEquipmentPlannedHours(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 font-bold text-[11px]">hrs/day</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Allocation Status
                  </label>
                  <select
                    value={equipmentStatus}
                    onChange={e => setEquipmentStatus(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="In Use">In Use (Active on Task)</option>
                    <option value="Allocated">Allocated (Reserved)</option>
                    <option value="Completed">Completed / Ready to Return</option>
                    <option value="Returned">Returned to Yard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Deployment Start Date *
                  </label>
                  <input
                    required
                    type="date"
                    value={equipmentStartDate}
                    onChange={e => setEquipmentStartDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Expected Return / Release Date
                  </label>
                  <input
                    type="date"
                    value={equipmentReturnDate}
                    onChange={e => setEquipmentReturnDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Real-time Equipment Conflict Warning */}
              {equipmentConflicts.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 flex items-start gap-3 animate-in fade-in duration-200">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-xs">
                      Fleet Over-Allocation Warning ({equipmentConflicts.length} concurrent assignment{equipmentConflicts.length > 1 ? 's' : ''})
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                      <strong>{equipmentName}</strong> is already allocated to{' '}
                      {equipmentConflicts.map((c, i) => {
                        const conflictingAct = activities.find(a => a?.id === c?.activityId);
                        return (
                          <span key={c.id}>
                            {i > 0 ? ', ' : ''}
                            <strong>"{conflictingAct?.name || c?.activityId || 'Other Task'}"</strong> (Since {c.assignedDate})
                          </span>
                        );
                      })}. Ensure machine availability or adjust deployment dates.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Mobilization & Operational Notes
                </label>
                <textarea
                  rows={2}
                  value={equipmentNotes}
                  onChange={e => setEquipmentNotes(e.target.value)}
                  placeholder="e.g. Fuel tank topped up to 100%; keys with site foreman; pre-start checklist required before shift."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* MODAL FOOTER BUTTONS */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs font-bold rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedProjectId || !selectedActivityId || (resourceType === 'employee' ? !workerName : !equipmentName)}
              className={`text-xs font-bold gap-2 rounded-xl px-6 shadow-sm text-white ${
                resourceType === 'employee'
                  ? 'bg-[#0B5FFF] hover:bg-blue-600'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              {editingAllocation 
                ? 'Save Changes' 
                : resourceType === 'employee' ? 'Assign Employee to Task' : 'Assign Equipment to Task'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
