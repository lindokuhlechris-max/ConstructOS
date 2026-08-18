import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Truck, 
  Package,
  Layers, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Building, 
  RefreshCw, 
  CalendarDays, 
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Wrench,
  Sparkles,
  Info,
  Check,
  Boxes,
  Tag
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../ui';
import { useAppContext } from '../../context/AppContext';
import { LabourAllocation, ResourceAllocation, Activity, Employee, Equipment, MaterialInventory, canManage } from '../../types';
import { AssignResourceModal } from '../AssignResourceModal';
import { PrintPreview } from '../PrintPreview';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveOrShareFile } from '../../lib/fileExportService';

export interface ResourceAllocationModuleProps {
  projectId?: string;
  onBack?: () => void;
  onSelectActivity?: (activityId: string) => void;
}

export function ResourceAllocationModule({
  projectId: propProjectId,
  onBack,
  onSelectActivity
}: ResourceAllocationModuleProps) {
  const { 
    projects, 
    activities, 
    employees, 
    equipment, 
    materials,
    labourAllocations, 
    allocations, 
    deleteLabourAllocation, 
    deleteAllocation,
    updateLabourAllocation,
    updateAllocation,
    updateActivity,
    addAuditLog,
    userRole,
    currentUserProfile
  } = useAppContext();

  // Active View Tab: 'tasks' | 'employees' | 'equipment' | 'materials' | 'timeline'
  const [activeTab, setActiveTab] = useState<'tasks' | 'employees' | 'equipment' | 'materials' | 'timeline'>('tasks');

  // Filters State
  const [selectedProjectId, setSelectedProjectId] = useState<string>(propProjectId || 'ALL');
  const [selectedActivityFilter, setSelectedActivityFilter] = useState<string>('ALL');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<'ALL' | 'Employee' | 'Equipment' | 'Material'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showConflictsOnly, setShowConflictsOnly] = useState<boolean>(false);

  // Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<'employee' | 'equipment' | 'material'>('employee');
  const [modalInitialProjectId, setModalInitialProjectId] = useState<string | undefined>(undefined);
  const [modalInitialActivityId, setModalInitialActivityId] = useState<string | undefined>(undefined);
  const [editingAllocation, setEditingAllocation] = useState<{
    type: 'employee' | 'equipment' | 'material';
    data: LabourAllocation | ResourceAllocation;
  } | null>(null);

  // Expanded Tasks in Task-Centric view
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      if (selectedProjectId !== 'ALL' && act?.projectId !== selectedProjectId) return false;
      if (selectedActivityFilter !== 'ALL' && act.id !== selectedActivityFilter) return false;
      return true;
    });
  }, [activities, selectedProjectId, selectedActivityFilter]);

  // Compute Conflicts: Employees double-booked on same date
  const employeeConflictsMap = useMemo(() => {
    const conflicts: Record<string, { count: number; allocations: LabourAllocation[] }> = {};

    labourAllocations.forEach(alloc => {
      if (alloc.status === 'Cancelled' || alloc.status === 'Completed') return;

      const overlapping = labourAllocations.filter(other => {
        if (other?.id === alloc.id) return false;
        if (other.status === 'Cancelled' || other.status === 'Completed') return false;
        
        const samePerson = (alloc.employeeId && alloc.employeeId === other.employeeId) ||
                           (alloc.workerName?.toLowerCase() === other.workerName?.toLowerCase());
        if (!samePerson) return false;

        const startA = new Date(alloc.startDate).getTime();
        const endA = new Date(alloc.endDate).getTime();
        const startB = new Date(other.startDate).getTime();
        const endB = new Date(other.endDate).getTime();

        return startA <= endB && endA >= startB;
      });

      if (overlapping.length > 0) {
        const key = alloc.employeeId || alloc.workerName?.toLowerCase();
        conflicts[key] = {
          count: overlapping.length + 1,
          allocations: [alloc, ...overlapping]
        };
      }
    });

    return conflicts;
  }, [labourAllocations]);

  // Compute Conflicts: Equipment double-booked
  const equipmentConflictsMap = useMemo(() => {
    const conflicts: Record<string, { count: number; allocations: ResourceAllocation[] }> = {};

    const activeEquipmentAllocations = allocations.filter(a => 
      a?.resourceType === 'Equipment' && 
      a.status !== 'Returned' && 
      a.status !== 'Depleted' && 
      a.status !== 'Completed'
    );

    activeEquipmentAllocations.forEach(alloc => {
      const overlapping = activeEquipmentAllocations.filter(other => {
        if (other?.id === alloc.id) return false;

        const sameEq = (alloc.equipmentId && alloc.equipmentId === other.equipmentId) ||
                       (alloc.resourceId && alloc.resourceId === other.resourceId) ||
                       (alloc.name?.toLowerCase() === other.name?.toLowerCase());
        if (!sameEq) return false;

        const startA = new Date(alloc.assignedDate).getTime();
        const endA = alloc.expectedReturnDate ? new Date(alloc.expectedReturnDate).getTime() : new Date('2099-12-31').getTime();
        const startB = new Date(other.assignedDate).getTime();
        const endB = other.expectedReturnDate ? new Date(other.expectedReturnDate).getTime() : new Date('2099-12-31').getTime();

        return startA <= endB && endA >= startB;
      });

      if (overlapping.length > 0) {
        const key = alloc.equipmentId || alloc.resourceId || alloc.name?.toLowerCase();
        conflicts[key] = {
          count: overlapping.length + 1,
          allocations: [alloc, ...overlapping]
        };
      }
    });

    return conflicts;
  }, [allocations]);

  const totalConflictsCount = useMemo(() => {
    return Object.keys(employeeConflictsMap).length + Object.keys(equipmentConflictsMap).length;
  }, [employeeConflictsMap, equipmentConflictsMap]);

  // Filtered Labour Allocations
  const filteredLabourAllocations = useMemo(() => {
    return labourAllocations.filter(alloc => {
      if (selectedProjectId !== 'ALL' && alloc?.projectId !== selectedProjectId) return false;
      if (selectedActivityFilter !== 'ALL' && alloc?.activityId !== selectedActivityFilter) return false;
      if (resourceTypeFilter === 'Equipment' || resourceTypeFilter === 'Material') return false;
      if (statusFilter !== 'ALL' && alloc.status !== statusFilter) return false;

      if (showConflictsOnly) {
        const key = alloc.employeeId || alloc.workerName?.toLowerCase();
        if (!employeeConflictsMap[key]) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const act = activities.find(a => a?.id === alloc?.activityId);
        const matchName = alloc.workerName?.toLowerCase()?.includes(q);
        const matchRole = alloc.workerRole?.toLowerCase()?.includes(q);
        const matchNotes = alloc.notes?.toLowerCase()?.includes(q);
        const matchTask = act?.name?.toLowerCase()?.includes(q) || alloc?.activityId?.toLowerCase()?.includes(q);
        if (!matchName && !matchRole && !matchNotes && !matchTask) return false;
      }

      return true;
    });
  }, [labourAllocations, selectedProjectId, selectedActivityFilter, resourceTypeFilter, statusFilter, showConflictsOnly, searchQuery, activities, employeeConflictsMap]);

  // Filtered Equipment Allocations
  const filteredEquipmentAllocations = useMemo(() => {
    return allocations.filter(alloc => {
      if (alloc.resourceType !== 'Equipment') return false;
      if (selectedProjectId !== 'ALL' && alloc?.projectId !== selectedProjectId) return false;
      if (selectedActivityFilter !== 'ALL' && alloc?.activityId !== selectedActivityFilter) return false;
      if (resourceTypeFilter === 'Employee' || resourceTypeFilter === 'Material') return false;
      if (statusFilter !== 'ALL' && alloc.status !== statusFilter) return false;

      if (showConflictsOnly) {
        const key = alloc.equipmentId || alloc.resourceId || alloc.name?.toLowerCase();
        if (!equipmentConflictsMap[key]) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const act = activities.find(a => a?.id === alloc?.activityId);
        const matchName = alloc.name?.toLowerCase()?.includes(q);
        const matchOperator = alloc.assignedTo?.toLowerCase()?.includes(q);
        const matchNotes = alloc.notes?.toLowerCase()?.includes(q);
        const matchTask = act?.name?.toLowerCase()?.includes(q) || alloc?.activityId?.toLowerCase()?.includes(q);
        if (!matchName && !matchOperator && !matchNotes && !matchTask) return false;
      }

      return true;
    });
  }, [allocations, selectedProjectId, selectedActivityFilter, resourceTypeFilter, statusFilter, showConflictsOnly, searchQuery, activities, equipmentConflictsMap]);

  // Filtered Material Allocations
  const filteredMaterialAllocations = useMemo(() => {
    return allocations.filter(alloc => {
      if (alloc.resourceType !== 'Material') return false;
      if (selectedProjectId !== 'ALL' && alloc?.projectId !== selectedProjectId) return false;
      if (selectedActivityFilter !== 'ALL' && alloc?.activityId !== selectedActivityFilter) return false;
      if (resourceTypeFilter === 'Employee' || resourceTypeFilter === 'Equipment') return false;
      if (statusFilter !== 'ALL' && alloc.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const act = activities.find(a => a?.id === alloc?.activityId);
        const mat = materials.find(m => m.id === alloc?.materialId || m.id === alloc?.resourceId);
        const matchName = alloc.name?.toLowerCase()?.includes(q);
        const matchCategory = mat?.category?.toLowerCase()?.includes(q);
        const matchNotes = alloc.notes?.toLowerCase()?.includes(q);
        const matchTask = act?.name?.toLowerCase()?.includes(q) || alloc?.activityId?.toLowerCase()?.includes(q);
        if (!matchName && !matchCategory && !matchNotes && !matchTask) return false;
      }

      return true;
    });
  }, [allocations, selectedProjectId, selectedActivityFilter, resourceTypeFilter, statusFilter, searchQuery, activities, materials]);

  // KPIs Calculations
  const stats = useMemo(() => {
    const activeWorkers = new Set(
      labourAllocations
        .filter(a => a.status === 'Active' || a.status === 'Scheduled')
        .map(a => a.employeeId || a.workerName)
    ).size;

    const activeEquipmentCount = allocations.filter(a => 
      a?.resourceType === 'Equipment' && 
      (a.status === 'In Use' || a.status === 'Allocated')
    ).length;

    const activeMaterialsCount = allocations.filter(a => 
      a?.resourceType === 'Material' && 
      (a.status === 'Allocated' || a.status === 'In Use')
    ).length;

    const totalScheduledLabourHours = labourAllocations
      .filter(a => a.status === 'Active' || a.status === 'Scheduled')
      .reduce((acc, a) => acc + (a.hours || 8), 0);

    const totalScheduledEqHours = allocations
      .filter(a => a?.resourceType === 'Equipment' && (a.status === 'In Use' || a.status === 'Allocated'))
      .reduce((acc, a) => acc + (a.plannedHours || 8), 0);

    const tasksWithAllocations = new Set([
      ...labourAllocations.map(a => a?.activityId),
      ...allocations.filter(a => a?.activityId).map(a => a?.activityId!)
    ]).size;

    const totalTasks = activities.length;
    const taskCoveragePct = totalTasks > 0 ? Math.round((tasksWithAllocations / totalTasks) * 100) : 0;

    return {
      activeWorkers,
      activeEquipmentCount,
      activeMaterialsCount,
      totalScheduledLabourHours,
      totalScheduledEqHours,
      conflictsCount: totalConflictsCount,
      taskCoveragePct,
      tasksWithAllocations,
      totalTasks
    };
  }, [labourAllocations, allocations, activities, totalConflictsCount]);

  // Handlers
  const handleOpenAssignModal = (
    type: 'employee' | 'equipment' | 'material', 
    projectId?: string, 
    activityId?: string
  ) => {
    setModalInitialType(type);
    setModalInitialProjectId(projectId || (selectedProjectId !== 'ALL' ? selectedProjectId : projects[0]?.id));
    setModalInitialActivityId(activityId || (selectedActivityFilter !== 'ALL' ? selectedActivityFilter : undefined));
    setEditingAllocation(null);
    setIsAssignModalOpen(true);
  };

  const handleEditLabour = (alloc: LabourAllocation) => {
    setEditingAllocation({
      type: 'employee',
      data: alloc
    });
    setIsAssignModalOpen(true);
  };

  const handleEditEquipment = (alloc: ResourceAllocation) => {
    setEditingAllocation({
      type: 'equipment',
      data: alloc
    });
    setIsAssignModalOpen(true);
  };

  const handleEditMaterial = (alloc: ResourceAllocation) => {
    setEditingAllocation({
      type: 'material',
      data: alloc
    });
    setIsAssignModalOpen(true);
  };

  const handleDeleteLabour = (alloc: LabourAllocation) => {
    if (window.confirm(`Remove employee ${alloc.workerName} from task assignment?`)) {
      deleteLabourAllocation(alloc.id);

      // Also clean up from target activity assignedLabour if present
      const targetAct = activities.find(a => a?.id === alloc?.activityId);
      if (targetAct && targetAct.assignedLabour) {
        updateActivity({
          ...targetAct,
          assignedLabour: targetAct.assignedLabour.filter(l => l.name !== alloc.workerName && l.employeeId !== alloc.employeeId)
        });
      }

      addAuditLog({
        id: `AL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        projectId: alloc?.projectId,
        userId: currentUserProfile?.name || 'Current User',
        action: 'Removed Employee Task Allocation',
        details: `Removed allocation for ${alloc.workerName} on task ${alloc?.activityId}.`,
        timestamp: new Date().toISOString(),
        entityType: 'LabourLog',
        entityId: alloc.id,
        actionType: 'delete'
      });
    }
  };

  const handleDeleteEquipment = (alloc: ResourceAllocation) => {
    if (window.confirm(`Remove equipment ${alloc.name} from task assignment?`)) {
      deleteAllocation(alloc.id);

      const targetAct = activities.find(a => a?.id === alloc?.activityId);
      if (targetAct && targetAct.assignedEquipment) {
        updateActivity({
          ...targetAct,
          assignedEquipment: targetAct.assignedEquipment.filter(e => e.name !== alloc.name && e.equipmentId !== alloc.equipmentId && e.equipmentId !== alloc.resourceId)
        });
      }

      addAuditLog({
        id: `AL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        projectId: alloc?.projectId,
        userId: currentUserProfile?.name || 'Current User',
        action: 'Removed Equipment Task Allocation',
        details: `Removed allocation for ${alloc.name} from task ${alloc?.activityId || 'Unspecified'}.`,
        timestamp: new Date().toISOString(),
        entityType: 'Equipment',
        entityId: alloc.id,
        actionType: 'delete'
      });
    }
  };

  const handleDeleteMaterial = (alloc: ResourceAllocation) => {
    if (window.confirm(`Remove material ${alloc.name} from task assignment?`)) {
      deleteAllocation(alloc.id);

      const targetAct = activities.find(a => a?.id === alloc?.activityId);
      if (targetAct && targetAct.assignedMaterials) {
        updateActivity({
          ...targetAct,
          assignedMaterials: targetAct.assignedMaterials.filter(m => m.name !== alloc.name && m.materialId !== alloc.materialId && m.materialId !== alloc.resourceId)
        });
      }

      addAuditLog({
        id: `AL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        projectId: alloc?.projectId,
        userId: currentUserProfile?.name || 'Current User',
        action: 'Removed Material Task Allocation',
        details: `Removed allocation for ${alloc.quantity} ${alloc.unit || ''} of material ${alloc.name} from task ${alloc?.activityId || 'Unspecified'}.`,
        timestamp: new Date().toISOString(),
        entityType: 'Material',
        entityId: alloc.id,
        actionType: 'delete'
      });
    }
  };

  const handleQuickReturnEquipment = (alloc: ResourceAllocation) => {
    const updated: ResourceAllocation = {
      ...alloc,
      status: 'Returned',
      expectedReturnDate: new Date().toISOString().split('T')[0]
    };
    updateAllocation(updated);

    addAuditLog({
      id: `AL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: alloc?.projectId,
      userId: currentUserProfile?.name || 'Current User',
      action: 'Equipment Returned to Fleet',
      details: `Marked equipment ${alloc.name} as Returned from task ${alloc?.activityId || 'Site'}.`,
      timestamp: new Date().toISOString(),
      entityType: 'Equipment',
      entityId: alloc.id,
      actionType: 'update'
    });
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Type',
      'Resource Name',
      'Role / Operator / Qty',
      'Project Name',
      'Project ID',
      'Task Name',
      'Task ID',
      'Start / Dispatch Date',
      'End / Return Date',
      'Planned Hours / Quantity',
      'Status',
      'Notes'
    ];

    const rows: string[][] = [];

    // Labour Rows
    filteredLabourAllocations.forEach(l => {
      const prj = projects.find(p => p?.id === l?.projectId);
      const act = activities.find(a => a?.id === l?.activityId);
      rows.push([
        'Employee / Labour',
        `"${l.workerName}"`,
        `"${l.workerRole}"`,
        `"${prj?.name || l?.projectId}"`,
        l?.projectId,
        `"${act?.name || l?.activityId}"`,
        l?.activityId,
        l.startDate,
        l.endDate,
        `${l.hours || 8} hrs/day`,
        l.status,
        `"${(l.notes || '').replace(/"/g, '""')}"`
      ]);
    });

    // Equipment Rows
    filteredEquipmentAllocations.forEach(e => {
      const prj = projects.find(p => p?.id === e?.projectId);
      const act = activities.find(a => a?.id === e?.activityId);
      rows.push([
        'Equipment / Machinery',
        `"${e.name}"`,
        `"${e.assignedTo || 'Unassigned'}"`,
        `"${prj?.name || e?.projectId}"`,
        e?.projectId,
        `"${act?.name || e?.activityId || 'Site Fleet'}"`,
        e?.activityId || 'N/A',
        e.assignedDate,
        e.expectedReturnDate || 'Ongoing',
        `${e.plannedHours || 8} hrs/day`,
        e.status,
        `"${(e.notes || '').replace(/"/g, '""')}"`
      ]);
    });

    // Material Rows
    filteredMaterialAllocations.forEach(m => {
      const prj = projects.find(p => p?.id === m?.projectId);
      const act = activities.find(a => a?.id === m?.activityId);
      rows.push([
        'Material / Inventory',
        `"${m.name}"`,
        `"${m.quantity} ${m.unit || 'units'}"`,
        `"${prj?.name || m?.projectId}"`,
        m?.projectId,
        `"${act?.name || m?.activityId || 'Site Storage'}"`,
        m?.activityId || 'N/A',
        m.assignedDate,
        m.expectedReturnDate || 'N/A',
        `${m.quantity} ${m.unit || 'units'}`,
        m.status,
        `"${(m.notes || '').replace(/"/g, '""')}"`
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `constructfield_resource_allocations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Dispatch Sheet
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF('l', 'pt', 'a4');
      
      // Header
      doc.setFontSize(18);
      doc.setTextColor(11, 95, 255); // #0B5FFF
      doc.text('Constructfield Resource Allocation Dispatch Manifest', 40, 40);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 40, 55);
      
      const headers = [['Type', 'Resource Name', 'Role / Operator / Qty', 'Project', 'Activity', 'Start / Dispatch', 'End / Return', 'Planned Metric']];
      const rows: string[][] = [];
      
      filteredLabourAllocations.forEach(l => {
        const prj = projects.find(p => p.id === l?.projectId);
        const act = activities.find(a => a?.id === l?.activityId);
        rows.push([
          'Labour',
          l.workerName,
          l.workerRole,
          prj?.name || l?.projectId || 'N/A',
          act?.name || l?.activityId || 'General',
          l.startDate,
          l.endDate,
          `${l.hours || 8}h/day`
        ]);
      });

      filteredEquipmentAllocations.forEach(e => {
        const prj = projects.find(p => p.id === e?.projectId);
        const act = activities.find(a => a?.id === e?.activityId);
        rows.push([
          'Equipment',
          e.name,
          e.assignedTo || 'Unassigned',
          prj?.name || e?.projectId || 'N/A',
          act?.name || e?.activityId || 'General',
          e.assignedDate,
          e.expectedReturnDate || 'Ongoing',
          `${e.plannedHours || 8}h/day`
        ]);
      });

      filteredMaterialAllocations.forEach(m => {
        const prj = projects.find(p => p.id === m?.projectId);
        const act = activities.find(a => a?.id === m?.activityId);
        rows.push([
          'Material',
          m.name,
          `${m.quantity} ${m.unit || 'units'}`,
          prj?.name || m?.projectId || 'N/A',
          act?.name || m?.activityId || 'General',
          m.assignedDate,
          m.expectedReturnDate || 'Ongoing',
          `${m.quantity} ${m.unit || 'units'}`
        ]);
      });

      autoTable(doc, {
        startY: 70,
        head: headers,
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [11, 95, 255], textColor: [255, 255, 255] },
        styles: { fontSize: 8, cellPadding: 4 },
      });

      const filename = `Constructfield_Dispatch_Manifest_${new Date().toISOString().split('T')[0]}.pdf`;
      const blob = doc.output('blob');
      saveOrShareFile({
        filename,
        blob,
        title: 'Dispatch Manifest',
        text: `Constructfield Dispatch Manifest`
      });
    } catch (err) {
      console.error('Failed to generate PDF manifest:', err);
    }
  };

  return (
    <div className="w-full space-y-6 pb-20 animate-in fade-in duration-150">
      
      {/* 1. TOP HEADER & HERO SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-600/10 dark:bg-blue-500/20 text-[#0B5FFF] rounded-2xl">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Resource Allocation Tracking
                </h1>
                <Badge variant="outline" className="text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF] border-blue-200">
                  Live Dispatch Matrix
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Assign workforce crews, heavy equipment, and material inventory directly to project work packages.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canManage(userRole) && (
            <>
              <Button
                onClick={() => handleOpenAssignModal('employee')}
                className="h-9 text-xs font-bold gap-1.5 bg-[#0B5FFF] hover:bg-blue-600 text-white rounded-xl shadow-xs"
              >
                <Users className="h-3.5 w-3.5" />
                + Assign Employee
              </Button>
              <Button
                onClick={() => handleOpenAssignModal('equipment')}
                className="h-9 text-xs font-bold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs"
              >
                <Truck className="h-3.5 w-3.5" />
                + Assign Equipment
              </Button>
              <Button
                onClick={() => handleOpenAssignModal('material')}
                className="h-9 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
              >
                <Package className="h-3.5 w-3.5" />
                + Assign Material
              </Button>
            </>
          )}

          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="h-9 text-xs font-bold gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
            title="Export CSV schedule"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsPrintModalOpen(true)}
            className="h-9 text-xs font-bold gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
            title="Print dispatch manifest"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
        </div>
      </div>

      {/* 2. SUMMARY KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
        
        {/* Active Workforce */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Crew</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.activeWorkers}
            </h3>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 inline" /> {filteredLabourAllocations.length} assignments
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#0B5FFF]">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Equipment Deployed */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Equipment Active</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.activeEquipmentCount}
            </h3>
            <p className="text-[10px] text-amber-600 font-semibold mt-0.5 flex items-center gap-1">
              <Truck className="h-3 w-3 inline" /> {filteredEquipmentAllocations.length} deployments
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
            <Truck className="h-5 w-5" />
          </div>
        </div>

        {/* Materials Allocated */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Materials Allocated</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.activeMaterialsCount}
            </h3>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
              <Package className="h-3 w-3 inline" /> {filteredMaterialAllocations.length} items linked
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
            <Package className="h-5 w-5" />
          </div>
        </div>

        {/* Scheduled Hours */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Daily Man-Hours</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.totalScheduledLabourHours} <span className="text-xs font-semibold text-slate-400">hrs</span>
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
              + {stats.totalScheduledEqHours} hrs fleet
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* Task Resource Coverage */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Task Coverage</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.taskCoveragePct}%
            </h3>
            <p className="text-[10px] text-blue-600 font-semibold mt-0.5">
              {stats.tasksWithAllocations} of {stats.totalTasks} tasks
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        {/* Double-Booking Conflicts */}
        <div className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between ${
          stats.conflictsCount > 0
            ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-100'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Conflicts</p>
            <h3 className={`text-2xl font-black mt-1 ${stats.conflictsCount > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
              {stats.conflictsCount}
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
              {stats.conflictsCount > 0 ? 'Over-allocation alert' : 'Optimal schedule'}
            </p>
          </div>
          <div className={`p-3 rounded-2xl ${
            stats.conflictsCount > 0 ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* 3. CONFLICT BANNER (if any exist) */}
      {stats.conflictsCount > 0 && (
        <div className="p-4 rounded-3xl bg-rose-500/10 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500 text-white rounded-xl">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                {stats.conflictsCount} Concurrent Over-Allocation{stats.conflictsCount > 1 ? 's' : ''} Detected
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                One or more employees or equipment units are assigned to overlapping tasks on the same calendar dates.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowConflictsOnly(!showConflictsOnly)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
              showConflictsOnly 
                ? 'bg-rose-600 text-white' 
                : 'bg-white dark:bg-slate-900 text-rose-600 border border-rose-300 dark:border-rose-800'
            }`}
          >
            {showConflictsOnly ? 'Show All Allocations' : 'Filter Conflicts Only'}
          </button>
        </div>
      )}

      {/* 4. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by worker, equipment, material, role, or task..."
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-medium focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none"
            />
          </div>

          {/* Project Filter */}
          <div>
            <select
              value={selectedProjectId}
              onChange={e => {
                setSelectedProjectId(e.target.value);
                setSelectedActivityFilter('ALL');
              }}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-semibold focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none"
            >
              <option value="ALL">All Projects ({projects.length})</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Resource Type Filter */}
          <div>
            <select
              value={resourceTypeFilter}
              onChange={e => setResourceTypeFilter(e.target.value as any)}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-semibold focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none"
            >
              <option value="ALL">All Resource Types</option>
              <option value="Employee">Employees & Crew Only</option>
              <option value="Equipment">Equipment & Machinery Only</option>
              <option value="Material">Materials & Supplies Only</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-semibold focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active (On Duty / On Site)</option>
              <option value="In Use">In Use (Equipment / Material)</option>
              <option value="Scheduled">Scheduled (Upcoming)</option>
              <option value="Allocated">Allocated</option>
              <option value="Completed">Completed</option>
              <option value="Returned">Returned</option>
            </select>
          </div>

        </div>

        {/* VIEW SELECTOR TABS */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'tasks'
                  ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Task-Centric View
            </button>

            <button
              onClick={() => setActiveTab('employees')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'employees'
                  ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Personnel Matrix ({filteredLabourAllocations.length})
            </button>

            <button
              onClick={() => setActiveTab('equipment')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'equipment'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Truck className="h-3.5 w-3.5" />
              Equipment Fleet ({filteredEquipmentAllocations.length})
            </button>

            <button
              onClick={() => setActiveTab('materials')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'materials'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              Material Matrix ({filteredMaterialAllocations.length})
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Timeline & Schedule
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>
              <strong>{filteredLabourAllocations.length}</strong> personnel • <strong>{filteredEquipmentAllocations.length}</strong> machines • <strong>{filteredMaterialAllocations.length}</strong> materials
            </span>
            {(searchQuery || selectedProjectId !== 'ALL' || selectedActivityFilter !== 'ALL' || resourceTypeFilter !== 'ALL' || statusFilter !== 'ALL' || showConflictsOnly) && (
              <button
                onClick={() => {
                  setSelectedProjectId('ALL');
                  setSelectedActivityFilter('ALL');
                  setResourceTypeFilter('ALL');
                  setStatusFilter('ALL');
                  setSearchQuery('');
                  setShowConflictsOnly(false);
                }}
                className="text-[11px] text-rose-500 hover:underline font-bold"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. MAIN CONTENT TAB VIEWS */}

      {/* TAB 1: TASK-CENTRIC ALLOCATION BREAKDOWN */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {filteredActivities.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <Layers className="h-10 w-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 dark:text-slate-300">No project tasks found matching your filters</h3>
              <p className="text-xs text-slate-400">Try adjusting your project filter or clearing the search query.</p>
            </div>
          ) : (
            filteredActivities.map(activity => {
              const taskLabour = labourAllocations.filter(a => a?.activityId === activity.id);
              const taskEquipment = allocations.filter(a => a?.resourceType === 'Equipment' && a?.activityId === activity.id);
              const taskMaterials = allocations.filter(a => a?.resourceType === 'Material' && a?.activityId === activity.id);
              const isExpanded = expandedTasks[activity.id] !== false; // default expanded

              const projectObj = projects.find(p => p?.id === activity?.projectId);

              return (
                <div 
                  key={activity.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden transition-all"
                >
                  {/* Task Header */}
                  <div className="p-4 md:p-5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleTaskExpansion(activity.id)}
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 mt-0.5"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 
                            onClick={() => onSelectActivity && onSelectActivity(activity.id)}
                            className="text-base font-black text-slate-900 dark:text-white hover:text-[#0B5FFF] cursor-pointer transition-colors"
                          >
                            {activity.name}
                          </h3>
                          <Badge variant="outline" className="text-[10px] font-bold bg-white dark:bg-slate-950">
                            {activity.discipline || 'General'}
                          </Badge>
                          <Badge 
                            variant={
                              activity.status === 'Completed' ? 'success' :
                              activity.status === 'In Progress' ? 'default' :
                              activity.status === 'Blocked' ? 'danger' : 'outline'
                            }
                            className="text-[10px]"
                          >
                            {activity.status}
                          </Badge>
                          {projectObj && (
                            <span className="text-[11px] text-slate-400 font-medium">
                              • {projectObj.name}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                          <span>Dates: <strong className="text-slate-700 dark:text-slate-300">{activity.startDate} to {activity.finishDate}</strong></span>
                          <span>•</span>
                          <span>Progress: <strong className="text-[#0B5FFF]">{activity.progress}%</strong></span>
                          <span>•</span>
                          <span>Work Package: <strong>{activity.workPackage || 'WP-01'}</strong></span>
                        </p>
                      </div>
                    </div>

                    {/* Quick Add Resource to this Task */}
                    {canManage(userRole) && (
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenAssignModal('employee', activity?.projectId, activity.id)}
                          className="h-8 text-[11px] font-bold gap-1 rounded-xl bg-white dark:bg-slate-900 border-blue-200 text-[#0B5FFF] hover:bg-blue-50"
                        >
                          <Plus className="h-3 w-3" /> + Worker
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenAssignModal('equipment', activity?.projectId, activity.id)}
                          className="h-8 text-[11px] font-bold gap-1 rounded-xl bg-white dark:bg-slate-900 border-amber-200 text-amber-600 hover:bg-amber-50"
                        >
                          <Plus className="h-3 w-3" /> + Equipment
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenAssignModal('material', activity?.projectId, activity.id)}
                          className="h-8 text-[11px] font-bold gap-1 rounded-xl bg-white dark:bg-slate-900 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        >
                          <Plus className="h-3 w-3" /> + Material
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Task Allocations 3-Column Grid */}
                  {isExpanded && (
                    <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      
                      {/* Column 1: Assigned Personnel & Crew */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <Users className="h-4 w-4 text-[#0B5FFF]" />
                            Assigned Workforce ({taskLabour.length})
                          </h4>
                          <span className="text-[11px] text-slate-400 font-semibold">
                            Total {taskLabour.reduce((s, l) => s + (l.hours || 8), 0)} hrs/shift
                          </span>
                        </div>

                        {taskLabour.length === 0 ? (
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700/60 text-center space-y-1">
                            <p className="text-xs text-slate-400 italic">No workers currently assigned to this task.</p>
                            {canManage(userRole) && (
                              <button
                                onClick={() => handleOpenAssignModal('employee', activity?.projectId, activity.id)}
                                className="text-[11px] text-[#0B5FFF] font-bold hover:underline"
                              >
                                + Assign Personnel
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {taskLabour.map(labour => {
                              const key = labour.employeeId || labour.workerName?.toLowerCase();
                              const hasConflict = employeeConflictsMap[key];

                              return (
                                <div 
                                  key={labour.id}
                                  className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                                    hasConflict 
                                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                                      : 'bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-800'
                                  }`}
                                >
                                  <div className="flex items-start gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#0B5FFF] flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                                      {labour.workerName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="text-xs font-black text-slate-900 dark:text-white">
                                          {labour.workerName}
                                        </p>
                                        <Badge 
                                          variant={labour.status === 'Active' ? 'success' : labour.status === 'Scheduled' ? 'outline' : 'default'}
                                          className="text-[9px] py-0 px-1.5"
                                        >
                                          {labour.status}
                                        </Badge>
                                      </div>
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        Role: <strong className="text-slate-700 dark:text-slate-200">{labour.workerRole}</strong> • 
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 ml-1">{labour.hours || 8} hrs/day</span>
                                      </p>
                                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                        <Calendar className="h-3 w-3 inline" /> {labour.startDate} → {labour.endDate}
                                      </p>
                                      {labour.notes && (
                                        <p className="text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 mt-1 italic">
                                          "{labour.notes}"
                                        </p>
                                      )}
                                      {hasConflict && (
                                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                          <AlertTriangle className="h-3 w-3" /> Scheduled on {hasConflict.count} tasks concurrently
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  {canManage(userRole) && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditLabour(labour)}
                                        className="h-7 w-7 p-0 text-slate-400 hover:text-[#0B5FFF] hover:bg-blue-50 rounded-lg"
                                        title="Edit assignment"
                                      >
                                        <Edit3 className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteLabour(labour)}
                                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                                        title="Remove assignment"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Column 2: Allocated Equipment & Machines */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <Truck className="h-4 w-4 text-amber-500" />
                            Allocated Equipment ({taskEquipment.length})
                          </h4>
                          <span className="text-[11px] text-slate-400 font-semibold">
                            Total {taskEquipment.reduce((s, e) => s + (e.plannedHours || 8), 0)} hrs deployment
                          </span>
                        </div>

                        {taskEquipment.length === 0 ? (
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700/60 text-center space-y-1">
                            <p className="text-xs text-slate-400 italic">No equipment currently allocated to this task.</p>
                            {canManage(userRole) && (
                              <button
                                onClick={() => handleOpenAssignModal('equipment', activity?.projectId, activity.id)}
                                className="text-[11px] text-amber-600 font-bold hover:underline"
                              >
                                + Allocate Equipment
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {taskEquipment.map(eqAlloc => {
                              const key = eqAlloc.equipmentId || eqAlloc.resourceId || eqAlloc.name?.toLowerCase();
                              const hasConflict = equipmentConflictsMap[key];

                              return (
                                <div 
                                  key={eqAlloc.id}
                                  className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                                    hasConflict
                                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                                      : 'bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-800'
                                  }`}
                                >
                                  <div className="flex items-start gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                                      <Truck className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="text-xs font-black text-slate-900 dark:text-white">
                                          {eqAlloc.name}
                                        </p>
                                        <Badge 
                                          variant={eqAlloc.status === 'In Use' ? 'success' : eqAlloc.status === 'Returned' ? 'outline' : 'default'}
                                          className="text-[9px] py-0 px-1.5"
                                        >
                                          {eqAlloc.status}
                                        </Badge>
                                      </div>
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        Operator: <strong className="text-amber-600 dark:text-amber-400">{eqAlloc.assignedTo || 'Assigned Operator'}</strong> • 
                                        <span className="font-semibold text-slate-700 dark:text-slate-300 ml-1">{eqAlloc.plannedHours || 8} hrs/day</span>
                                      </p>
                                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                        <Calendar className="h-3 w-3 inline" /> Deployed: {eqAlloc.assignedDate} {eqAlloc.expectedReturnDate ? `→ Return: ${eqAlloc.expectedReturnDate}` : '(Ongoing)'}
                                      </p>
                                      {eqAlloc.notes && (
                                        <p className="text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 mt-1 italic">
                                          "{eqAlloc.notes}"
                                        </p>
                                      )}
                                      {hasConflict && (
                                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                          <AlertTriangle className="h-3 w-3" /> Concurrent allocation across {hasConflict.count} tasks
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  {canManage(userRole) && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      {eqAlloc.status !== 'Returned' && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleQuickReturnEquipment(eqAlloc)}
                                          className="h-7 px-2 text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                          title="Mark Returned to yard"
                                        >
                                          Return
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditEquipment(eqAlloc)}
                                        className="h-7 w-7 p-0 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                                        title="Edit allocation"
                                      >
                                        <Edit3 className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteEquipment(eqAlloc)}
                                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                                        title="Remove allocation"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Column 3: Allocated Materials & Supplies */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <Package className="h-4 w-4 text-emerald-500" />
                            Allocated Materials ({taskMaterials.length})
                          </h4>
                          <span className="text-[11px] text-slate-400 font-semibold">
                            Total {taskMaterials.reduce((s, m) => s + (m.quantity || 0), 0)} units/items
                          </span>
                        </div>

                        {taskMaterials.length === 0 ? (
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700/60 text-center space-y-1">
                            <p className="text-xs text-slate-400 italic">No materials or inventory items currently assigned to this task.</p>
                            {canManage(userRole) && (
                              <button
                                onClick={() => handleOpenAssignModal('material', activity?.projectId, activity.id)}
                                className="text-[11px] text-emerald-600 font-bold hover:underline"
                              >
                                + Allocate Material
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {taskMaterials.map(matAlloc => {
                              const matObj = materials.find(m => m.id === matAlloc.materialId || m.id === matAlloc.resourceId || m.name.toLowerCase() === matAlloc.name.toLowerCase());
                              const balance = matObj ? (matObj.receivedQuantity || 0) - (matObj.usedQuantity || 0) : null;

                              return (
                                <div 
                                  key={matAlloc.id}
                                  className="p-3 rounded-2xl border bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-800 transition-all flex items-start justify-between gap-3"
                                >
                                  <div className="flex items-start gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                      <Package className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="text-xs font-black text-slate-900 dark:text-white">
                                          {matAlloc.name}
                                        </p>
                                        <Badge 
                                          variant={matAlloc.status === 'In Use' ? 'success' : matAlloc.status === 'Completed' ? 'default' : 'outline'}
                                          className="text-[9px] py-0 px-1.5"
                                        >
                                          {matAlloc.status}
                                        </Badge>
                                      </div>
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        Allocated: <strong className="text-emerald-600 dark:text-emerald-400">{matAlloc.quantity} {matAlloc.unit || 'units'}</strong>
                                        {balance !== null && (
                                          <span className="text-slate-400 ml-1.5">• Stock: <strong>{balance} {matObj?.unit}</strong></span>
                                        )}
                                      </p>
                                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                        <Calendar className="h-3 w-3 inline" /> Dispatched: {matAlloc.assignedDate} {matAlloc.expectedReturnDate ? `→ Return: ${matAlloc.expectedReturnDate}` : ''}
                                      </p>
                                      {matAlloc.notes && (
                                        <p className="text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 mt-1 italic">
                                          "{matAlloc.notes}"
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  {canManage(userRole) && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditMaterial(matAlloc)}
                                        className="h-7 w-7 p-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                        title="Edit allocation"
                                      >
                                        <Edit3 className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteMaterial(matAlloc)}
                                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                                        title="Remove allocation"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: PERSONNEL ALLOCATION MATRIX */}
      {activeTab === 'employees' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                Personnel & Labour Allocation Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Individual employee task assignment logs, planned shift hours, and active work package deployment.
              </p>
            </div>
            {canManage(userRole) && (
              <Button
                size="sm"
                onClick={() => handleOpenAssignModal('employee')}
                className="h-8 text-xs font-bold gap-1.5 bg-[#0B5FFF] text-white rounded-xl"
              >
                <Plus className="h-3.5 w-3.5" /> Assign Employee
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200/80 dark:border-slate-800 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Employee / Worker</th>
                  <th className="py-3 px-4">Role / Trade</th>
                  <th className="py-3 px-4">Assigned Task & Project</th>
                  <th className="py-3 px-4">Schedule Period</th>
                  <th className="py-3 px-4">Planned Hours</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredLabourAllocations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                      No labour allocations found. Click "+ Assign Employee" to allocate workers to tasks.
                    </td>
                  </tr>
                ) : (
                  filteredLabourAllocations.map(alloc => {
                    const prj = projects.find(p => p?.id === alloc?.projectId);
                    const act = activities.find(a => a?.id === alloc?.activityId);
                    const key = alloc.employeeId || alloc.workerName?.toLowerCase();
                    const hasConflict = employeeConflictsMap[key];

                    return (
                      <tr 
                        key={alloc.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          hasConflict ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 text-[#0B5FFF] flex items-center justify-center font-bold text-xs shrink-0">
                              {alloc.workerName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                {alloc.workerName}
                                {hasConflict && (
                                  <span title="Overlapping assignment on another task" className="text-amber-500">
                                    <AlertTriangle className="h-3.5 w-3.5 inline" />
                                  </span>
                                )}
                              </p>
                              {alloc.notes && <p className="text-[10px] text-slate-400 truncate max-w-xs">{alloc.notes}</p>}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-bold">
                          {alloc.workerRole}
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {act?.name || alloc?.activityId}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {prj?.name || alloc?.projectId} • {act?.workPackage || 'WP'}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          <span className="font-semibold">{alloc.startDate}</span> → <span className="font-semibold">{alloc.endDate}</span>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                          {alloc.hours || 8} hrs/shift
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge 
                            variant={alloc.status === 'Active' ? 'success' : alloc.status === 'Scheduled' ? 'outline' : 'default'}
                            className="text-[10px]"
                          >
                            {alloc.status}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {canManage(userRole) && (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditLabour(alloc)}
                                className="h-7 w-7 p-0 text-slate-400 hover:text-[#0B5FFF] rounded-lg"
                                title="Edit assignment"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteLabour(alloc)}
                                className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 rounded-lg"
                                title="Delete assignment"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EQUIPMENT ALLOCATION MATRIX */}
      {activeTab === 'equipment' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                Equipment & Fleet Task Allocations
              </h3>
              <p className="text-xs text-slate-500">
                Machinery deployments, designated operators, operating shifts, and scheduled return dates.
              </p>
            </div>
            {canManage(userRole) && (
              <Button
                size="sm"
                onClick={() => handleOpenAssignModal('equipment')}
                className="h-8 text-xs font-bold gap-1.5 bg-amber-600 text-white rounded-xl"
              >
                <Plus className="h-3.5 w-3.5" /> Assign Equipment
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200/80 dark:border-slate-800 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Equipment Unit</th>
                  <th className="py-3 px-4">Designated Operator</th>
                  <th className="py-3 px-4">Assigned Task & Project</th>
                  <th className="py-3 px-4">Deployment Dates</th>
                  <th className="py-3 px-4">Planned Usage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredEquipmentAllocations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                      No equipment allocations found. Click "+ Assign Equipment" to deploy machines to project tasks.
                    </td>
                  </tr>
                ) : (
                  filteredEquipmentAllocations.map(alloc => {
                    const prj = projects.find(p => p?.id === alloc?.projectId);
                    const act = activities.find(a => a?.id === alloc?.activityId);
                    const key = alloc.equipmentId || alloc.resourceId || alloc.name?.toLowerCase();
                    const hasConflict = equipmentConflictsMap[key];

                    return (
                      <tr 
                        key={alloc.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          hasConflict ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900 text-amber-600 flex items-center justify-center shrink-0">
                              <Truck className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                {alloc.name}
                                {hasConflict && (
                                  <span title="Overlapping assignment on another task" className="text-amber-500">
                                    <AlertTriangle className="h-3.5 w-3.5 inline" />
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-400">Qty: {alloc.quantity} {alloc.unit || 'Unit'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-amber-600 dark:text-amber-400 font-bold">
                          {alloc.assignedTo || 'Unassigned / Site Pool'}
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {act?.name || alloc?.activityId || 'General Project Scope'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {prj?.name || alloc?.projectId}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          <span className="font-semibold">{alloc.assignedDate}</span> →{' '}
                          <span className="font-semibold">{alloc.expectedReturnDate || 'Ongoing'}</span>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                          {alloc.plannedHours || 8} hrs/day
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge 
                            variant={alloc.status === 'In Use' ? 'success' : alloc.status === 'Returned' ? 'outline' : 'default'}
                            className="text-[10px]"
                          >
                            {alloc.status}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {canManage(userRole) && (
                            <div className="flex items-center justify-end gap-1">
                              {alloc.status !== 'Returned' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleQuickReturnEquipment(alloc)}
                                  className="h-7 px-2 text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                  title="Return equipment"
                                >
                                  Return
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditEquipment(alloc)}
                                className="h-7 w-7 p-0 text-slate-400 hover:text-amber-600 rounded-lg"
                                title="Edit allocation"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteEquipment(alloc)}
                                className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 rounded-lg"
                                title="Delete allocation"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MATERIAL ALLOCATION MATRIX */}
      {activeTab === 'materials' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                Material & Inventory Task Allocations
              </h3>
              <p className="text-xs text-slate-500">
                Supplies and raw materials allocated to work packages, tracking dispatch batches and current warehouse stock balance.
              </p>
            </div>
            {canManage(userRole) && (
              <Button
                size="sm"
                onClick={() => handleOpenAssignModal('material')}
                className="h-8 text-xs font-bold gap-1.5 bg-emerald-600 text-white rounded-xl"
              >
                <Plus className="h-3.5 w-3.5" /> Assign Material
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200/80 dark:border-slate-800 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Material Item</th>
                  <th className="py-3 px-4">Allocated Quantity</th>
                  <th className="py-3 px-4">Current Warehouse Stock</th>
                  <th className="py-3 px-4">Assigned Task & Project</th>
                  <th className="py-3 px-4">Dispatch Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredMaterialAllocations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                      No material allocations found. Click "+ Assign Material" to assign stock supplies to project tasks.
                    </td>
                  </tr>
                ) : (
                  filteredMaterialAllocations.map(alloc => {
                    const prj = projects.find(p => p?.id === alloc?.projectId);
                    const act = activities.find(a => a?.id === alloc?.activityId);
                    const matObj = materials.find(m => m.id === alloc.materialId || m.id === alloc.resourceId || m.name.toLowerCase() === alloc.name.toLowerCase());
                    const balance = matObj ? (matObj.receivedQuantity || 0) - (matObj.usedQuantity || 0) : null;

                    return (
                      <tr 
                        key={alloc.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-600 flex items-center justify-center shrink-0">
                              <Package className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {alloc.name}
                              </p>
                              {matObj && (
                                <p className="text-[10px] text-slate-400">
                                  Category: {matObj.category} {matObj.sku ? `• SKU: ${matObj.sku}` : ''}
                                </p>
                              )}
                              {alloc.notes && <p className="text-[10px] text-slate-500 italic truncate max-w-xs">{alloc.notes}</p>}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                          {alloc.quantity} {alloc.unit || 'units'}
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          {balance !== null ? (
                            <span className={`font-bold ${balance <= 0 ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
                              {balance} {matObj?.unit}
                            </span>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {act?.name || alloc?.activityId || 'General Project Scope'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {prj?.name || alloc?.projectId}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          <span className="font-semibold">{alloc.assignedDate}</span>
                          {alloc.expectedReturnDate && (
                            <span className="text-slate-400"> → {alloc.expectedReturnDate}</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge 
                            variant={alloc.status === 'In Use' ? 'success' : alloc.status === 'Completed' ? 'default' : 'outline'}
                            className="text-[10px]"
                          >
                            {alloc.status}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {canManage(userRole) && (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditMaterial(alloc)}
                                className="h-7 w-7 p-0 text-slate-400 hover:text-emerald-600 rounded-lg"
                                title="Edit allocation"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteMaterial(alloc)}
                                className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 rounded-lg"
                                title="Delete allocation"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: TIMELINE & SCHEDULE CALENDAR VIEW */}
      {activeTab === 'timeline' && (
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#0B5FFF]" />
              Resource Allocation Timeline & Dispatch Schedule
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Visual roadmap of personnel, machinery, and material deployments across project operating dates.
            </p>
          </div>

          {/* Timeline items list grouped by Resource Pillars */}
          <div className="space-y-4">
            {filteredLabourAllocations.length === 0 && filteredEquipmentAllocations.length === 0 && filteredMaterialAllocations.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-8">No scheduled allocations found for timeline display.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Labour Schedule Column */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#0B5FFF]" />
                    Workforce Schedules ({filteredLabourAllocations.length})
                  </h4>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {filteredLabourAllocations.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-3 text-center">No labour assignments.</p>
                    ) : (
                      filteredLabourAllocations.map(l => {
                        const act = activities.find(a => a?.id === l?.activityId);
                        return (
                          <div key={l.id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-2xs flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900 dark:text-white">{l.workerName}</span>
                                <span className="text-[10px] text-slate-400">({l.workerRole})</span>
                              </div>
                              <p className="text-[11px] text-[#0B5FFF] font-semibold mt-0.5">
                                Task: {act?.name || l?.activityId}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                📅 {l.startDate} → {l.endDate} ({l.hours || 8} hrs/day)
                              </p>
                            </div>
                            <Badge variant={l.status === 'Active' ? 'success' : 'outline'} className="text-[9px]">
                              {l.status}
                            </Badge>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Equipment Schedule Column */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-amber-500" />
                    Equipment Deployments ({filteredEquipmentAllocations.length})
                  </h4>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {filteredEquipmentAllocations.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-3 text-center">No equipment deployments.</p>
                    ) : (
                      filteredEquipmentAllocations.map(e => {
                        const act = activities.find(a => a?.id === e?.activityId);
                        return (
                          <div key={e.id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-2xs flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900 dark:text-white">{e.name}</span>
                                <span className="text-[10px] text-amber-600 dark:text-amber-400">({e.assignedTo || 'No operator'})</span>
                              </div>
                              <p className="text-[11px] text-[#0B5FFF] font-semibold mt-0.5">
                                Task: {act?.name || e?.activityId || 'Site Fleet'}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                📅 {e.assignedDate} → {e.expectedReturnDate || 'Ongoing'} ({e.plannedHours || 8} hrs/day)
                              </p>
                            </div>
                            <Badge variant={e.status === 'In Use' ? 'success' : 'outline'} className="text-[9px]">
                              {e.status}
                            </Badge>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Material Deployments Column */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Package className="h-4 w-4 text-emerald-500" />
                    Material Deployments ({filteredMaterialAllocations.length})
                  </h4>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {filteredMaterialAllocations.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-3 text-center">No material allocations.</p>
                    ) : (
                      filteredMaterialAllocations.map(m => {
                        const act = activities.find(a => a?.id === m?.activityId);
                        return (
                          <div key={m.id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-2xs flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900 dark:text-white">{m.name}</span>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">({m.quantity} {m.unit || 'units'})</span>
                              </div>
                              <p className="text-[11px] text-[#0B5FFF] font-semibold mt-0.5">
                                Task: {act?.name || m?.activityId || 'Site Supply'}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                📅 Dispatched: {m.assignedDate}
                              </p>
                            </div>
                            <Badge variant={m.status === 'In Use' ? 'success' : 'outline'} className="text-[9px]">
                              {m.status}
                            </Badge>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* PRINT DISPATCH MANIFEST MODAL */}
      <PrintPreview
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Constructfield Resource Allocation Dispatch Manifest"
        onDownloadPdf={handleDownloadPDF}
      >
        <div className="p-8 font-sans">
          <div className="border-b-2 border-[#0B5FFF] pb-6 mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-black text-slate-900 mb-2">Constructfield Dispatch Manifest</h1>
              <p className="text-sm text-slate-500 font-medium">Resource Allocations & Assignments</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Generated</p>
              <p className="text-sm font-bold text-slate-800">{new Date().toLocaleDateString()}</p>
              <p className="text-sm text-slate-500">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          <div className="mb-10">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#0B5FFF] mb-4">Labour Personnel</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="py-2 text-xs font-semibold text-slate-500">Name</th>
                  <th className="py-2 text-xs font-semibold text-slate-500">Role</th>
                  <th className="py-2 text-xs font-semibold text-slate-500">Project</th>
                  <th className="py-2 text-xs font-semibold text-slate-500">Activity</th>
                  <th className="py-2 text-xs font-semibold text-slate-500 text-right">Hours</th>
                </tr>
              </thead>
              <tbody>
                {filteredLabourAllocations.map((l, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2 text-sm font-medium text-slate-800">{l.workerName}</td>
                    <td className="py-2 text-sm text-slate-600">{l.workerRole}</td>
                    <td className="py-2 text-sm text-slate-600">{projects.find(p => p.id === l.projectId)?.name || l.projectId}</td>
                    <td className="py-2 text-sm text-slate-600">{activities.find(a => a.id === l.activityId)?.name || "General"}</td>
                    <td className="py-2 text-sm text-slate-600 text-right font-semibold">{l.hours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mb-10">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-600 mb-4">Equipment & Machinery</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="py-2 text-xs font-semibold text-slate-500">Equipment</th>
                  <th className="py-2 text-xs font-semibold text-slate-500">Operator</th>
                  <th className="py-2 text-xs font-semibold text-slate-500">Project</th>
                  <th className="py-2 text-xs font-semibold text-slate-500">Activity</th>
                  <th className="py-2 text-xs font-semibold text-slate-500 text-right">Hours</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipmentAllocations.map((e, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2 text-sm font-medium text-slate-800">{e.name}</td>
                    <td className="py-2 text-sm text-slate-600">{e.assignedTo || "Unassigned"}</td>
                    <td className="py-2 text-sm text-slate-600">{projects.find(p => p.id === e.projectId)?.name || e.projectId}</td>
                    <td className="py-2 text-sm text-slate-600">{activities.find(a => a.id === e.activityId)?.name || "General"}</td>
                    <td className="py-2 text-sm text-slate-600 text-right font-semibold">{e.plannedHours || 8}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mb-10">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 mb-4">Materials & Supplies</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="py-2 text-xs font-semibold text-slate-500">Material</th>
                  <th className="py-2 text-xs font-semibold text-slate-500">Quantity</th>
                  <th className="py-2 text-xs font-semibold text-slate-500">Project</th>
                  <th className="py-2 text-xs font-semibold text-slate-500">Activity</th>
                  <th className="py-2 text-xs font-semibold text-slate-500 text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterialAllocations.map((m, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2 text-sm font-medium text-slate-800">{m.name}</td>
                    <td className="py-2 text-sm text-slate-600 font-semibold">{m.quantity} {m.unit || 'units'}</td>
                    <td className="py-2 text-sm text-slate-600">{projects.find(p => p.id === m.projectId)?.name || m.projectId}</td>
                    <td className="py-2 text-sm text-slate-600">{activities.find(a => a.id === m.activityId)?.name || "General"}</td>
                    <td className="py-2 text-sm text-slate-600 text-right font-semibold">{m.assignedDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PrintPreview>

      {/* ASSIGN RESOURCE MODAL */}
      <AssignResourceModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        initialType={modalInitialType}
        initialProjectId={modalInitialProjectId}
        initialActivityId={modalInitialActivityId}
        editingAllocation={editingAllocation}
      />

    </div>
  );
}
