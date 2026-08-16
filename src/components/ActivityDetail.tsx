import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ActivityStatus, Priority, TaskMaterialAssignment, TaskLabourAssignment, TaskEquipmentAssignment, SubTask, DailyReport, canUserEditSection } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Badge, ProgressBar, Button } from './ui';
import { InteractiveProgress } from './InteractiveProgress';
import { CameraCapture } from './CameraCapture';
import { ActivityLabourTracking } from './ActivityLabourTracking';
import { ActivityEquipmentTracking } from './ActivityEquipmentTracking';
import { SubTaskManager } from './SubTaskManager';
import { ActivityExplainerBreakdown } from './ActivityExplainerBreakdown';
import { RecordActivityForTaskModal } from './RecordActivityForTaskModal';
import { PlanningCalendar } from './PlanningCalendar';
import { PrintPreview } from './PrintPreview';
import { ActivityAuditScreen } from './ActivityAuditScreen';
import { useAppContext } from '../context/AppContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  MapPin,
  QrCode,
  Barcode,
  FileText,
  Calendar,
  Clock,
  User,
  History,
  ShieldAlert,
  Paperclip,
  Image as ImageIcon,
  Mic,
  PenTool,
  CheckCircle2,
  Printer,
  AlertTriangle,
  PlayCircle,
  XCircle,
  BarChart2,
  GitBranch,
  Building2,
  Save,
  ArrowLeft,
  Copy,
  Check,
  Edit3,
  Camera,
  MessageSquare,
  Send,
  Upload,
  Eye,
  Trash2,
  Download,
  X,
  UserCheck,
  Package,
  Truck,
  Users,
  Plus,
  TrendingUp,
  Tag,
  FileBarChart,
  FolderOpen,
  FileSpreadsheet,
  Link as LinkIcon,
  Sun,
  Cloud,
  CloudRain,
  Wind,
  Thermometer,
  CheckSquare,
  Layers,
  Sparkles,
  CheckCircle
} from 'lucide-react';

interface ActivityDetailProps {
  activity: Activity;
  onSave?: (updatedActivity: Activity) => void;
  onClose?: () => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (activity: Activity) => void;
  isEditable?: boolean;
}

export function ActivityDetail({ activity: initialActivity, onSave, onClose, onDelete, onDuplicate, isEditable = true }: ActivityDetailProps) {
  const navigate = useNavigate();
  const { 
    projects, materials, employees, equipment, documents, updateActivity, addReport, addAuditLog, addAllocation, 
    userRole, currentUserProfile, labourLogs, addLabourLog, deleteLabourLog, equipmentLogs, addEquipmentLog, deleteEquipmentLog 
  } = useAppContext();
  const canEditActivities = canUserEditSection(currentUserProfile, 'activities');
  const [activity, setActivity] = useState<Activity>(initialActivity);
  const [isEditing, setIsEditing] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [copiedGps, setCopiedGps] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const calculatedActualHours = React.useMemo(() => {
    if (!labourLogs) return activity.actualHours || 0;
    return labourLogs
      .filter(log => log?.activityId === activity.id)
      .reduce((sum, log) => sum + (log.hours || 0), 0);
  }, [labourLogs, activity.id, activity.actualHours]);

  const calculatedMachineHours = React.useMemo(() => {
    if (!equipmentLogs) return 0;
    return equipmentLogs
      .filter(log => log?.activityId === activity.id && log?.type === 'Hours')
      .reduce((sum, log) => sum + (log.hoursAdded || log.hours || 0), 0);
  }, [equipmentLogs, activity.id]);
  const [newComment, setNewComment] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Task Resource Assign Modal States
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTab, setAssignTab] = useState<'Material' | 'Labour' | 'Equipment'>('Material');

  // Assign Material State
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [assignMaterialQty, setAssignMaterialQty] = useState(10);
  const [assignMaterialNotes, setAssignMaterialNotes] = useState('');

  // Assign Labour State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [customWorkerName, setCustomWorkerName] = useState('');
  const [assignLabourRole, setAssignLabourRole] = useState('Technician / Worker');
  const [assignLabourHours, setAssignLabourHours] = useState(8);
  const [assignLabourNotes, setAssignLabourNotes] = useState('');

  // Assign Equipment State
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [assignEqOperator, setAssignEqOperator] = useState('');
  const [assignEqNotes, setAssignEqNotes] = useState('');

  // Log Progress Modal State
  const [isLogProgressModalOpen, setIsLogProgressModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isRecordActivityModalOpen, setIsRecordActivityModalOpen] = useState(false);
  const [logProgressActualQty, setLogProgressActualQty] = useState<number>(initialActivity.actualQuantity || 0);
  const [logProgressActualHours, setLogProgressActualHours] = useState<number>(initialActivity.actualHours || 0);
  const [logProgressPercent, setLogProgressPercent] = useState<number>(initialActivity.progress || 0);
  const [logProgressStatus, setLogProgressStatus] = useState<ActivityStatus>(initialActivity.status || 'Not Started');
  const [logProgressNotes, setLogProgressNotes] = useState('');
  const [logProgressDate, setLogProgressDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [logProgressWeather, setLogProgressWeather] = useState<string>('Sunny');
  const [logProgressTemp, setLogProgressTemp] = useState<string>('24°C');
  const [logProgressSiteConditions, setLogProgressSiteConditions] = useState<string>('Site dry and fully accessible');
  const [logProgressSubtasks, setLogProgressSubtasks] = useState<SubTask[]>([]);
  const [logProgressPostReport, setLogProgressPostReport] = useState<boolean>(true);

  // Voice Notes, Sign-Off, and Field Remarks State
  const [isAddVoiceNoteOpen, setIsAddVoiceNoteOpen] = useState(false);
  const [voiceNoteInput, setVoiceNoteInput] = useState('');

  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerRole, setSignerRole] = useState('Site Supervisor / Engineer');

  const [isAddRemarkModalOpen, setIsAddRemarkModalOpen] = useState(false);
  const [remarkInput, setRemarkInput] = useState('');

  // Expanded QR Code & Barcode Modal State
  const [expandedCodeTag, setExpandedCodeTag] = useState<'qr' | 'barcode' | null>(null);
  const [editingQrCode, setEditingQrCode] = useState(activity.qrCode || `QR-${activity.id}`);
  const [editingBarcode, setEditingBarcode] = useState(activity.barcode || `BC-${activity.id}`);
  const [copiedCodeTag, setCopiedCodeTag] = useState(false);

  const handleSaveCodeTag = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...activity,
      qrCode: editingQrCode.trim(),
      barcode: editingBarcode.trim()
    };
    setActivity(updated);
    if (onSave) onSave(updated);
    else updateActivity(updated);

    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: activity.projectId,
      userId: 'Current User',
      action: 'Identification Tags Updated',
      details: `Updated QR (${editingQrCode}) and Barcode (${editingBarcode}) for Activity "${activity.name}"`,
      timestamp: new Date().toISOString()
    });

    setExpandedCodeTag(null);
  };

  const handleAddVoiceNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceNoteInput.trim()) return;
    const newNote = `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ${voiceNoteInput.trim()}`;
    const updatedNotes = [...(activity.voiceNotes || []), newNote];
    const updated = { ...activity, voiceNotes: updatedNotes };
    setActivity(updated);
    if (onSave) onSave(updated);
    else updateActivity(updated);

    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: activity.projectId,
      userId: 'Current User',
      action: 'Voice Note Added',
      details: `Added voice note to Activity "${activity.name}" (${activity.id})`,
      timestamp: new Date().toISOString()
    });

    setVoiceNoteInput('');
    setIsAddVoiceNoteOpen(false);
  };

  const handleSignOffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim()) return;
    const signatureStr = `${signerName.trim()} (${signerRole || 'Site Supervisor'}) - Signed ${new Date().toISOString().split('T')[0]}`;
    const updated = { ...activity, digitalSignature: signatureStr, status: 'Completed' as ActivityStatus, progress: 100 };
    setActivity(updated);
    if (onSave) onSave(updated);
    else updateActivity(updated);

    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: activity.projectId,
      userId: 'Current User',
      action: 'Digital Sign-Off Recorded',
      details: `Supervisor "${signerName.trim()}" digitally signed off Activity "${activity.name}" (${activity.id})`,
      timestamp: new Date().toISOString()
    });

    setIsSignOffModalOpen(false);
  };

  const handleAddRemarkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarkInput.trim()) return;
    const timestamp = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedEntry = `[${timestamp}]: ${remarkInput.trim()}`;
    const updatedRemarks = activity.remarks ? `${activity.remarks}\n${formattedEntry}` : formattedEntry;
    const updated = { ...activity, remarks: updatedRemarks };
    setActivity(updated);
    if (onSave) onSave(updated);
    else updateActivity(updated);

    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: activity.projectId,
      userId: 'Current User',
      action: 'Field Remark Added',
      details: `Added field remark to Activity "${activity.name}" (${activity.id})`,
      timestamp: new Date().toISOString()
    });

    setRemarkInput('');
    setIsAddRemarkModalOpen(false);
  };

  const handleLogProgressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = logProgressDate || new Date().toISOString().split('T')[0];
    const updatedRemarks = logProgressNotes.trim() 
      ? `${activity.remarks ? activity.remarks + '\n' : ''}[Progress Log ${todayStr}]: ${logProgressNotes.trim()}`
      : activity.remarks;

    let finalStatus = logProgressStatus;
    let finalProgress = Number(logProgressPercent) || 0;
    const finalActualQty = Number(logProgressActualQty) || 0;

    const subtasksToSave = logProgressSubtasks && logProgressSubtasks.length > 0
      ? logProgressSubtasks
      : (activity.subtasks || []);

    // Strict validation: Parent activity cannot be Completed if any subtask or milestone is incomplete
    if (subtasksToSave.length > 0) {
      const incomplete = subtasksToSave.filter(s => s.status !== 'Completed');
      if (incomplete.length > 0 && (finalStatus === 'Completed' || finalProgress >= 100)) {
        finalStatus = 'In Progress';
        finalProgress = Math.min(99, finalProgress);
        alert(`Note: Activity status is set to "In Progress" (${finalProgress}%) because ${incomplete.length} subtask(s) (${incomplete.map(i => `"${i.title}"`).join(', ')}) are still incomplete.`);
      }
    }

    const updatedActivity: Activity = {
      ...activity,
      actualQuantity: finalActualQty,
      actualHours: calculatedActualHours,
      progress: finalProgress,
      status: finalStatus,
      remarks: updatedRemarks,
      subtasks: subtasksToSave
    };

    setActivity(updatedActivity);
    if (onSave) onSave(updatedActivity);
    else updateActivity(updatedActivity);

    // Smart & Detailed Daily Report Generation
    if (logProgressPostReport) {
      const projectName = projects.find(p => p.id === updatedActivity.projectId)?.name || updatedActivity.projectId;
      const assignedLabour = updatedActivity.assignedLabour || [];
      const assignedEquipment = updatedActivity.assignedEquipment || [];
      const assignedMaterials = updatedActivity.assignedMaterials || [];

      const labourSummary = assignedLabour.length > 0
        ? assignedLabour.map(l => `${l.name} (${l.role || 'Worker'}, ${l.hours || 8}h)`).join(', ')
        : 'General site personnel deployed.';

      const equipmentSummary = assignedEquipment.length > 0
        ? assignedEquipment.map(eq => `${eq.name}${eq.operator ? ` [Operator: ${eq.operator}]` : ''}`).join(', ')
        : 'Standard tools & equipment utilized.';

      const materialsSummary = assignedMaterials.length > 0
        ? assignedMaterials.map(m => `${m.name}: ${m.quantity} ${m.unit}`).join(', ')
        : 'Standard site consumables.';

      const subtasksCompletedCount = subtasksToSave.filter(s => s.status === 'Completed').length;
      const subtaskSummaryLines = subtasksToSave.length > 0
        ? subtasksToSave.map((s, idx) => `  ${s.status === 'Completed' ? '[✓]' : s.status === 'In Progress' ? '[►]' : '[ ]'} #${idx + 1} ${s.title} (${s.category || 'General'}) - ${s.status}${s.completedQuantity !== undefined ? ` [Qty: ${s.completedQuantity}/${s.targetQuantity || 0} ${s.unit || ''}]` : ''}${s.isMilestone ? ' 🎯 Milestone' : ''}${s.isHoldPoint ? (s.holdPointSignOff?.approved ? ` [🔒 QA Approved: ${s.holdPointSignOff.signedBy}]` : ' [🔒 QA Hold Point Pending]') : ''}`).join('\n')
        : '  No WBS subtasks listed for this activity.';

      const detailedSupervisorNotes = `DAILY ACTIVITY PROGRESS SNAPSHOT: ${updatedActivity.name} (${updatedActivity.id})
================================================================================
Project: ${projectName}
Discipline / Package: ${updatedActivity.discipline || 'General'} • ${updatedActivity.workPackage || 'N/A'}
Date Logged: ${todayStr}

1. OVERALL PROGRESS & QUANTITIES:
• Current Status: ${finalStatus} (${finalProgress}% Complete)
• Output Measured: ${finalActualQty} / ${updatedActivity.targetQuantity || 0} ${updatedActivity.unit || 'units'}
• Actual Hours Logged: ${calculatedActualHours} hrs
• Priority Level: ${updatedActivity.priority || 'Medium'}

2. FIELD REMARKS & OBSERVATIONS:
${logProgressNotes.trim() || 'Daily site progress logged and verified on site.'}

3. SUBTASK & EXECUTION BREAKDOWN (${subtasksCompletedCount}/${subtasksToSave.length} Completed):
${subtaskSummaryLines}

4. CREW & MACHINERY ALLOCATED ON TASK:
• Assigned Personnel (${assignedLabour.length || 1}): ${labourSummary}
• Assigned Machinery (${assignedEquipment.length}): ${equipmentSummary}
• Allocated Materials: ${materialsSummary}

5. ENVIRONMENTAL & SITE CONDITIONS:
• Weather: ${logProgressWeather} (${logProgressTemp})
• Site Condition: ${logProgressSiteConditions}`;

      const manpowerBreakdown = assignedLabour.length > 0
        ? assignedLabour.map(l => ({ trade: l.role || 'Labour', count: 1, hours: l.hours || 8 }))
        : [{ trade: updatedActivity.discipline || 'General Labour', count: 1, hours: calculatedActualHours || 8 }];

      const equipmentLogged = assignedEquipment.map(eq => ({
        equipmentId: eq.equipmentId || eq.id || 'EQ-01',
        hours: 8,
        status: 'Operating'
      }));

      const newDailyReport: DailyReport = {
        id: `RPT-${Date.now()}`,
        date: todayStr,
        projectId: updatedActivity.projectId,
        weather: logProgressWeather,
        temperature: logProgressTemp,
        siteConditions: logProgressSiteConditions,
        significantEvents: logProgressNotes.trim() 
          ? `Progress logged on ${updatedActivity.name}: ${finalProgress}% (${finalStatus})`
          : `Daily progress record for ${updatedActivity.name}`,
        workersOnSite: assignedLabour.length || 1,
        equipmentRunning: assignedEquipment.length || (assignedEquipment.length === 0 ? 0 : 1),
        incidents: 0,
        ncr: 0,
        activitiesLogged: [
          `${updatedActivity.name} (${updatedActivity.id}) - ${finalProgress}% - ${finalActualQty} ${updatedActivity.unit || 'units'}`
        ],
        manpowerBreakdown,
        equipmentLogged,
        photos: updatedActivity.photos || [],
        supervisorNotes: detailedSupervisorNotes,
      };

      addReport(newDailyReport);
    }

    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: activity.projectId,
      userId: userRole === 'Manager' ? 'Current User' : 'Current User',
      action: 'Progress & Daily Report Logged',
      details: `Logged progress for Activity "${activity.name}" (${activity.id}): ${finalProgress}%, ${finalActualQty} ${activity.unit || 'units'} completed, ${calculatedActualHours} hrs logged. Daily report posted to Reports.`,
      timestamp: new Date().toISOString()
    });

    setIsLogProgressModalOpen(false);
    setLogProgressNotes('');
  };

  const handleAddMaterialAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const matObj = materials.find(m => m.id === selectedMaterialId);
    const matName = matObj ? matObj.name : (selectedMaterialId || 'Site Material');
    const matUnit = matObj ? matObj.unit : 'pcs';

    const newAssignment: TaskMaterialAssignment = {
      id: `TMA-${Date.now()}`,
      materialId: selectedMaterialId || `MAT-${Date.now()}`,
      name: matName,
      quantity: Number(assignMaterialQty) || 1,
      unit: matUnit,
      assignedDate: new Date().toISOString().split('T')[0],
      notes: assignMaterialNotes,
    };

    const updatedMaterials = [newAssignment, ...(activity.assignedMaterials || [])];
    const updatedActivity = { ...activity, assignedMaterials: updatedMaterials };
    setActivity(updatedActivity);
    if (onSave) onSave(updatedActivity);
    else updateActivity(updatedActivity);

    if (addAllocation) {
      addAllocation({
        id: `RES-${newAssignment.id}`,
        projectId: activity.projectId,
        activityId: activity.id,
        materialId: newAssignment.materialId,
        resourceType: 'Material',
        name: matName,
        quantity: newAssignment.quantity,
        unit: matUnit,
        status: 'Allocated',
        assignedDate: newAssignment.assignedDate,
        notes: assignMaterialNotes
      });
    }

    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: activity.projectId,
      userId: userRole === 'Manager' ? 'Current User' : 'Current User',
      action: 'Material Assigned to Task',
      details: `Assigned ${assignMaterialQty} ${matUnit} of ${matName} to Task "${activity.name}" (${activity.id})`,
      timestamp: new Date().toISOString()
    });

    setIsAssignModalOpen(false);
    setAssignMaterialNotes('');
  };

  const handleAddLabourAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const empObj = employees.find(emp => emp.id === selectedEmployeeId);
    const workerName = empObj ? `${empObj.firstName} ${empObj.lastName}` : (customWorkerName || 'Site Worker');
    const workerRole = empObj ? empObj.position : assignLabourRole;
    const assignedHours = Number(assignLabourHours) || 8;
    const autoLabourLogId = `LAB-AUTO-${Date.now()}`;

    const newAssignment: TaskLabourAssignment = {
      id: `TLA-${Date.now()}`,
      employeeId: selectedEmployeeId,
      name: workerName,
      role: workerRole,
      hours: assignedHours,
      startDate: new Date().toISOString().split('T')[0],
      notes: assignLabourNotes,
      labourLogId: autoLabourLogId
    };

    // Automatically register onto Labour Tracking Panel
    addLabourLog({
      id: autoLabourLogId,
      projectId: activity.projectId,
      activityId: activity.id,
      date: newAssignment.startDate,
      workerType: workerRole,
      workerName: workerName,
      startTime: '08:00',
      endTime: '16:00',
      hours: assignedHours,
      hoursWorked: assignedHours,
      notes: `Allocated to task "${activity.name}" (${assignedHours}h/shift)`
    });

    const updatedLabour = [newAssignment, ...(activity.assignedLabour || [])];
    const updatedActivity = { ...activity, assignedLabour: updatedLabour };
    setActivity(updatedActivity);
    if (onSave) onSave(updatedActivity);
    else updateActivity(updatedActivity);

    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: activity.projectId,
      userId: userRole === 'Manager' ? 'Current User' : 'Current User',
      action: 'Labour Assigned to Task',
      details: `Assigned ${workerName} (${workerRole}) to Task "${activity.name}" (${activity.id}) and registered on Labour Tracking`,
      timestamp: new Date().toISOString()
    });

    setIsAssignModalOpen(false);
    setCustomWorkerName('');
    setAssignLabourNotes('');
  };

  const handleAddEquipmentAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const eqObj = equipment.find(eq => eq.id === selectedEquipmentId);
    const eqName = eqObj ? eqObj.name : 'Site Equipment';
    const assignedOperator = assignEqOperator || eqObj?.operator || 'Assigned Operator';
    const autoEqLogId = `EQL-AUTO-${Date.now()}`;

    const newAssignment: TaskEquipmentAssignment = {
      id: `TEA-${Date.now()}`,
      equipmentId: selectedEquipmentId || `EQ-${Date.now()}`,
      name: eqName,
      operator: assignedOperator,
      startDate: new Date().toISOString().split('T')[0],
      notes: assignEqNotes,
      equipmentLogId: autoEqLogId
    };

    // Automatically register onto Equipment Hour Tracking Panel
    addEquipmentLog({
      id: autoEqLogId,
      equipmentId: newAssignment.equipmentId,
      activityId: activity.id,
      activityName: activity.name,
      projectId: activity.projectId,
      type: 'Hours',
      date: newAssignment.startDate,
      loggedBy: currentUserProfile?.name || 'Site Supervisor',
      hoursAdded: 8,
      hours: 8,
      startTime: '08:00',
      endTime: '16:00',
      driverOperator: assignedOperator,
      operator: assignedOperator,
      status: 'Operating',
      setStatus: 'Operating',
      notes: `Allocated to task "${activity.name}" (8 hrs shift)`
    });

    const updatedEquipment = [newAssignment, ...(activity.assignedEquipment || [])];
    const updatedActivity = { ...activity, assignedEquipment: updatedEquipment };
    setActivity(updatedActivity);
    if (onSave) onSave(updatedActivity);
    else updateActivity(updatedActivity);

    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: activity.projectId,
      userId: userRole === 'Manager' ? 'Current User' : 'Current User',
      action: 'Equipment Assigned to Task',
      details: `Assigned equipment ${eqName} to Task "${activity.name}" (${activity.id}) and registered on Equipment Hour Tracking`,
      timestamp: new Date().toISOString()
    });

    setIsAssignModalOpen(false);
    setAssignEqOperator('');
    setAssignEqNotes('');
  };

  const handleRemoveMaterialAssignment = (assignmentId: string) => {
    const updated = (activity.assignedMaterials || []).filter(m => m.id !== assignmentId);
    const updatedActivity = { ...activity, assignedMaterials: updated };
    setActivity(updatedActivity);
    if (onSave) onSave(updatedActivity);
    else updateActivity(updatedActivity);
  };

  const handleRemoveLabourAssignment = (assignmentId: string) => {
    const targetLabour = (activity.assignedLabour || []).find(l => l.id === assignmentId);
    if (targetLabour?.labourLogId) {
      deleteLabourLog(targetLabour.labourLogId);
    }
    const updated = (activity.assignedLabour || []).filter(l => l.id !== assignmentId);
    const updatedActivity = { ...activity, assignedLabour: updated };
    setActivity(updatedActivity);
    if (onSave) onSave(updatedActivity);
    else updateActivity(updatedActivity);
  };

  const handleRemoveEquipmentAssignment = (assignmentId: string) => {
    const targetEquipment = (activity.assignedEquipment || []).find(e => e.id === assignmentId);
    if (targetEquipment?.equipmentLogId) {
      deleteEquipmentLog(targetEquipment.equipmentLogId);
    }
    const updated = (activity.assignedEquipment || []).filter(e => e.id !== assignmentId);
    const updatedActivity = { ...activity, assignedEquipment: updated };
    setActivity(updatedActivity);
    if (onSave) onSave(updatedActivity);
    else updateActivity(updatedActivity);
  };

  const handleAttachPhoto = (dataUrl: string) => {
    const updatedPhotos = [dataUrl, ...(activity.photos || [])];
    const updatedActivity = { ...activity, photos: updatedPhotos };
    setActivity(updatedActivity);
    
    // Automatically persist photo update
    if (onSave) {
      onSave(updatedActivity);
    }

    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: activity.projectId,
      userId: userRole === 'Manager' ? 'Current User' : 'Current User',
      action: 'Photo Attached',
      details: `Site progress photo captured and attached to Activity "${activity.name}" (${activity.id})`,
      timestamp: new Date().toISOString()
    });
  };

  const handleTagPhoto = (photoIndex: number, subtaskId: string) => {
    const updatedTags = { ...(activity.photoTags || {}) };
    if (subtaskId) {
      updatedTags[photoIndex] = subtaskId;
    } else {
      delete updatedTags[photoIndex];
    }
    const updatedActivity = { ...activity, photoTags: updatedTags };
    setActivity(updatedActivity);
    if (onSave) {
      onSave(updatedActivity);
    }
  };

  const handleDeletePhoto = (photoIndex: number) => {
    const updatedPhotos = [...(activity.photos || [])];
    updatedPhotos.splice(photoIndex, 1);
    
    // Shift photo tags
    const updatedPhotoTags: Record<number, string> = {};
    if (activity.photoTags) {
      Object.entries(activity.photoTags).forEach(([idxStr, taskId]) => {
        const idx = parseInt(idxStr, 10);
        if (idx < photoIndex) {
          updatedPhotoTags[idx] = taskId as string;
        } else if (idx > photoIndex) {
          updatedPhotoTags[idx - 1] = taskId as string;
        }
      });
    }

    const updatedActivity = { ...activity, photos: updatedPhotos, photoTags: updatedPhotoTags };
    setActivity(updatedActivity);
    if (previewPhoto === activity.photos?.[photoIndex]) {
      setPreviewPhoto(null);
    }
    if (onSave) {
      onSave(updatedActivity);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleAttachPhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostComment = () => {
    if (!newComment.trim()) return;

    const comment = {
      id: `CMT-${Date.now()}`,
      author: 'Current User',
      text: newComment.trim(),
      timestamp: new Date().toISOString(),
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CurrentUser'
    };

    const updatedComments = [...(activity.comments || []), comment];
    const updatedActivity = { ...activity, comments: updatedComments };
    
    setActivity(updatedActivity);
    setNewComment('');
    
    if (onSave) {
      onSave(updatedActivity);
    }
  };

  const handleInputChange = (field: keyof Activity, value: any) => {
    setActivity(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubtasksChange = (updatedSubtasks: SubTask[]) => {
    let calculatedProgress = activity.progress;
    let newStatus = activity.status;

    if (updatedSubtasks.length > 0) {
      let totalPercent = 0;
      updatedSubtasks.forEach(s => {
        const children = updatedSubtasks.filter(c => c.parentId === s.id);
        if (children.length > 0) {
          const childDone = children.filter(c => c.status === 'Completed').length;
          totalPercent += Math.round((childDone / children.length) * 100);
        } else if (s.targetQuantity && s.targetQuantity > 0) {
          totalPercent += Math.min(100, Math.round(((s.completedQuantity || 0) / s.targetQuantity) * 100));
        } else {
          totalPercent += s.status === 'Completed' ? 100 : s.status === 'In Progress' ? 50 : 0;
        }
      });
      calculatedProgress = Math.round(totalPercent / updatedSubtasks.length);
      
      const allSubtasksDone = updatedSubtasks.every(s => s.status === 'Completed');
      const allMilestonesDone = updatedSubtasks.filter(s => s.isMilestone).every(s => s.status === 'Completed');

      if (allSubtasksDone && allMilestonesDone && calculatedProgress === 100) {
        newStatus = 'Completed';
      } else if (calculatedProgress > 0) {
        newStatus = 'In Progress';
      } else {
        newStatus = 'Not Started';
      }
    }

    // Auto-sync workers and equipment from subtasks into activity resources & tracking panels
    let updatedAssignedLabour = [...(activity.assignedLabour || [])];
    let updatedAssignedEquipment = [...(activity.assignedEquipment || [])];

    updatedSubtasks.forEach(s => {
      const workers = [...(s.assignedWorkers || []), ...(s.assignedPerson ? [s.assignedPerson] : [])];
      workers.forEach(wName => {
        if (!wName || wName.trim() === '') return;
        const exists = updatedAssignedLabour.some(l => l.name.toLowerCase() === wName.toLowerCase());
        if (!exists) {
          const emp = employees.find(e => `${e.firstName} ${e.lastName}`.toLowerCase() === wName.toLowerCase());
          const autoLabId = `LAB-AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
          const newLab: TaskLabourAssignment = {
            id: `TLA-SUB-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            employeeId: emp?.id,
            name: wName,
            role: emp?.position || 'Site Worker',
            hours: 8,
            startDate: s.startDate || activity.startDate || new Date().toISOString().split('T')[0],
            notes: `Assigned via subtask "${s.title}"`,
            labourLogId: autoLabId
          };
          updatedAssignedLabour.push(newLab);

          // Register in Labour Tracking
          addLabourLog({
            id: autoLabId,
            projectId: activity.projectId,
            activityId: activity.id,
            date: newLab.startDate,
            workerType: newLab.role,
            workerName: wName,
            startTime: '08:00',
            endTime: '16:00',
            hours: 8,
            hoursWorked: 8,
            notes: `Assigned via subtask "${s.title}" on task "${activity.name}"`
          });
        }
      });

      const eqList = [...(s.assignedEquipmentList || []), ...(s.assignedEquipment ? [s.assignedEquipment] : [])];
      eqList.forEach(eqIdentifier => {
        if (!eqIdentifier || eqIdentifier.trim() === '') return;
        const exists = updatedAssignedEquipment.some(e => e.name.toLowerCase() === eqIdentifier.toLowerCase() || e.equipmentId === eqIdentifier);
        if (!exists) {
          const eqObj = equipment.find(e => e.name.toLowerCase() === eqIdentifier.toLowerCase() || e.id === eqIdentifier);
          const eqName = eqObj ? eqObj.name : eqIdentifier;
          const autoEqId = `EQL-AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
          const newEq: TaskEquipmentAssignment = {
            id: `TEA-SUB-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            equipmentId: eqObj?.id || `EQ-${Date.now()}`,
            name: eqName,
            operator: eqObj?.operator || 'Assigned Operator',
            startDate: s.startDate || activity.startDate || new Date().toISOString().split('T')[0],
            notes: `Allocated via subtask "${s.title}"`,
            equipmentLogId: autoEqId
          };
          updatedAssignedEquipment.push(newEq);

          // Register in Equipment Tracking
          addEquipmentLog({
            id: autoEqId,
            equipmentId: newEq.equipmentId,
            activityId: activity.id,
            activityName: activity.name,
            projectId: activity.projectId,
            type: 'Hours',
            date: newEq.startDate,
            loggedBy: currentUserProfile?.name || 'Site Supervisor',
            hoursAdded: 8,
            hours: 8,
            startTime: '08:00',
            endTime: '16:00',
            driverOperator: newEq.operator,
            operator: newEq.operator,
            status: 'Operating',
            setStatus: 'Operating',
            notes: `Allocated via subtask "${s.title}" on task "${activity.name}"`
          });
        }
      });
    });

    const updated = { 
      ...activity, 
      subtasks: updatedSubtasks,
      assignedLabour: updatedAssignedLabour,
      assignedEquipment: updatedAssignedEquipment,
      progress: calculatedProgress,
      status: newStatus
    };
    
    setActivity(updated);
    if (onSave) {
      onSave(updated);
    }
  };

  const handleSave = () => {
    const today = new Date().toISOString().split('T')[0];
    const updated = {
      ...activity,
      updatedAt: today,
      createdAt: activity.createdAt || activity.startDate || today
    };
    setActivity(updated);
    if (onSave) {
      onSave(updated);
    }
    setIsEditing(false);
  };

  const getStatusIcon = (status: ActivityStatus) => {
    switch (status) {
      case 'In Progress': return <PlayCircle className="h-4 w-4 text-[#0B5FFF]" />;
      case 'Completed': return <CheckCircle2 className="h-4 w-4 text-[#2E7D32]" />;
      case 'Blocked': return <AlertTriangle className="h-4 w-4 text-[#D32F2F]" />;
      case 'Not Started': return <XCircle className="h-4 w-4 text-[#F9A825]" />;
      default: return <Clock className="h-4 w-4 text-slate-500" />;
    }
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'Critical': return <Badge variant="danger" className="uppercase font-bold text-[10px]">Critical</Badge>;
      case 'High': return <Badge variant="warning" className="uppercase font-bold text-[10px]">High</Badge>;
      case 'Medium': return <Badge variant="default" className="uppercase font-bold text-[10px]">Medium</Badge>;
      case 'Low': return <Badge variant="outline" className="uppercase font-bold text-[10px]">Low</Badge>;
    }
  };

  const formatGps = (gps?: { lat: number; lng: number } | string) => {
    if (!gps) return 'Not recorded';
    if (typeof gps === 'string') return gps;
    return `${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)}`;
  };

  const copyGpsToClipboard = () => {
    const text = formatGps(activity.gpsLocation);
    navigator.clipboard.writeText(text);
    setCopiedGps(true);
    setTimeout(() => setCopiedGps(false), 2000);
  };

  const handleDownloadPDF = () => {
    try {
      const project = projects.find(p => p.id === activity.projectId);
      const doc = new jsPDF("p", "pt", "a4");
      doc.setFontSize(20);
      doc.setTextColor(11, 95, 255);
      doc.text(activity.name || "Activity Detail", 40, 40);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 40, 60);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Project: ${projects.find(p => p.id === activity.projectId)?.name || activity.projectId}`, 40, 90);
      doc.text(`Status: ${activity.status || "Not Started"}`, 40, 110);
      doc.text(`Priority: ${activity.priority || "Medium"}`, 40, 130);
      doc.text(`Assigned To: ${activity.assignedTo || "Unassigned"}`, 40, 150);
      doc.text(`Location: ${activity.location || "N/A"}`, 40, 170);
      doc.text(`Start Date: ${activity.startDate || "N/A"}`, 300, 90);
      doc.text(`End Date: ${activity.finishDate || "N/A"}`, 300, 110);
      doc.text(`Progress: ${activity.progress || 0}%`, 300, 130);
      doc.text("Description:", 40, 200);
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      const splitDesc = doc.splitTextToSize(activity.description || "No description provided.", 500);
      doc.text(splitDesc, 40, 220);
      doc.save(`Activity_${activity.name?.replace(/\s+/g, "_")}_Detail.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full p-4 sm:p-6 md:p-8">
      {/* Top Header Bar (MD3 Top App Bar style) */}
      <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold tracking-widest text-[#0B5FFF] dark:text-blue-400 uppercase">
                {activity.id}
              </span>
              <Badge variant="outline" className="text-[10px] font-bold uppercase">{activity.workPackage}</Badge>
              {getPriorityBadge(activity.priority)}
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-0.5">{activity.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && canEditActivities && (
            <Button 
              onClick={() => {
                setLogProgressActualQty(activity.actualQuantity || 0);
                setLogProgressActualHours(activity.actualHours || 0);
                setLogProgressPercent(activity.progress || 0);
                setLogProgressStatus(activity.status || 'Not Started');
                setLogProgressNotes('');
                setLogProgressDate(new Date().toISOString().split('T')[0]);
                setLogProgressWeather('Sunny');
                setLogProgressTemp('24°C');
                setLogProgressSiteConditions('Site dry and fully accessible');
                setLogProgressSubtasks(activity.subtasks ? JSON.parse(JSON.stringify(activity.subtasks)) : []);
                setLogProgressPostReport(true);
                setIsLogProgressModalOpen(true);
              }} 
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 rounded-xl shadow-sm font-medium px-4"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Log Progress</span>
            </Button>
          )}
          {!isEditing && canEditActivities && (
            <Button onClick={() => setIsAssignModalOpen(true)} className="bg-[#0B5FFF] hover:bg-blue-600 text-white gap-2 rounded-xl shadow-sm font-medium px-4">
              <UserCheck className="h-4 w-4" />
              <span>Assign</span>
            </Button>
          )}
          {!isEditing && canEditActivities && onDuplicate && (
            <Button 
              variant="outline" 
              onClick={() => onDuplicate(activity)} 
              className="gap-2 rounded-xl text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
              title="Duplicate activity with resources and edit minor differences"
            >
              <Copy className="h-4 w-4" />
              <span>Duplicate</span>
            </Button>
          )}
          {!isEditing && canEditActivities && onDelete && (
            <Button variant="outline" onClick={() => onDelete(activity.id)} className="gap-2 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50">
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          )}
          {!isEditing && (
            <Button 
              variant="outline" 
              onClick={() => setIsAuditModalOpen(true)} 
              className="gap-2 rounded-xl text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              title="View full audit trail & changelog for this activity and its subtasks"
            >
              <History className="h-4 w-4 text-[#0B5FFF]" />
              <span>Audit Trail</span>
            </Button>
          )}
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsPrintModalOpen(true)} className="gap-2 rounded-xl">
              <FileText className="h-4 w-4" />
              <span>Print</span>
            </Button>
          )}
          {isEditable && canEditActivities && (
            isEditing ? (
              <Button onClick={handleSave} className="bg-[#0B5FFF] hover:bg-blue-700 text-white gap-2 rounded-xl">
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2 rounded-xl">
                <Edit3 className="h-4 w-4" />
                <span>Edit</span>
              </Button>
            )
          )}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - 2 Spans */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* General Information Card */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#0B5FFF]" />
                General Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Activity Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={activity.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:border-[#0B5FFF]"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{activity.name}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Description</label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={activity.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:border-[#0B5FFF]"
                  />
                ) : (
                  <p className="text-sm text-slate-700 dark:text-slate-300">{activity.description || 'No description provided.'}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Work Package</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={activity.workPackage}
                    onChange={(e) => handleInputChange('workPackage', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:border-[#0B5FFF]"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{activity.workPackage}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Discipline & Category</label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Discipline"
                      value={activity.discipline}
                      onChange={(e) => handleInputChange('discipline', e.target.value)}
                      className="w-1/2 h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Category"
                      value={activity.category || ''}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-1/2 h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                    />
                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {activity.discipline} {activity.category ? `• ${activity.category}` : ''}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Assigned To (Team)</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={activity.assignedTo}
                    onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium">{activity.assignedTo}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Supervisor</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={activity.supervisor}
                    onChange={(e) => handleInputChange('supervisor', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{activity.supervisor}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subtasks & WBS Breakdown Card */}
          <SubTaskManager 
            subtasks={activity.subtasks || []} 
            onChange={handleSubtasksChange}
            readOnly={!isEditable}
            activityId={activity.id}
            activityName={activity.name}
            projectId={activity.projectId}
          />

          {/* Location & Spatial Data Card */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#0B5FFF]" />
                Spatial & Location Data
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Area / Zone</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={activity.area}
                    onChange={(e) => handleInputChange('area', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{activity.area}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Location Details</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={activity.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{activity.location || 'N/A'}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Chainage / Station</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={activity.chainage || ''}
                    onChange={(e) => handleInputChange('chainage', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{activity.chainage || 'N/A'}</p>
                )}
              </div>

              {/* GPS Coordinates Badge / Box */}
              <div className="sm:col-span-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-[#0B5FFF]">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">GPS Coordinates</span>
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                      {formatGps(activity.gpsLocation)}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={copyGpsToClipboard} className="h-8 rounded-lg gap-1.5 text-xs">
                  {copiedGps ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedGps ? 'Copied' : 'Copy GPS'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quantities & Schedule Card */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-[#0B5FFF]" />
                Quantities, Schedule & Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Progress Bar Section */}
              <div className="sm:col-span-2 bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <InteractiveProgress
                  progress={activity.progress}
                  status={activity.status}
                  isEditing={isEditing}
                  onProgressChange={(newProgress, newStatus) => {
                    handleInputChange('progress', newProgress);
                    if (newStatus !== activity.status) {
                      handleInputChange('status', newStatus);
                    }
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Target Quantity</label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={activity.targetQuantity}
                      onChange={(e) => handleInputChange('targetQuantity', Number(e.target.value))}
                      className="w-2/3 h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Unit"
                      value={activity.unit}
                      onChange={(e) => handleInputChange('unit', e.target.value)}
                      className="w-1/3 h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                    />
                  </div>
                ) : (
                  <p className="text-sm font-semibold">{activity.targetQuantity} {activity.unit}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Actual Quantity Logged</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={activity.actualQuantity}
                    onChange={(e) => handleInputChange('actualQuantity', Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                  />
                ) : (
                  <p className="text-sm font-semibold">{activity.actualQuantity} {activity.unit}</p>
                )}
              </div>

              <div className="sm:col-span-2 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Activity Dates & Timeline</label>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsCalendarModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#0B5FFF] dark:text-blue-400 text-xs font-semibold transition-colors border border-blue-200 dark:border-blue-800/50 shadow-sm"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>View Planning Calendar</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Date Created</span>
                    {isEditing ? (
                      <input
                        type="date"
                        value={activity.createdAt || activity.startDate || new Date().toISOString().split('T')[0]}
                        onChange={(e) => handleInputChange('createdAt', e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:border-[#0B5FFF]"
                      />
                    ) : (
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span>{activity.createdAt || activity.startDate || 'N/A'}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Date Started / To Start</span>
                    {isEditing ? (
                      <input
                        type="date"
                        value={activity.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:border-[#0B5FFF]"
                      />
                    ) : (
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>{activity.startDate || 'N/A'}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Target Finish Date</span>
                    {isEditing ? (
                      <input
                        type="date"
                        value={activity.finishDate}
                        onChange={(e) => handleInputChange('finishDate', e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:border-[#0B5FFF]"
                      />
                    ) : (
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span>{activity.finishDate || 'N/A'}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Date Edited</span>
                    {isEditing ? (
                      <input
                        type="date"
                        value={activity.updatedAt || new Date().toISOString().split('T')[0]}
                        onChange={(e) => handleInputChange('updatedAt', e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:border-[#0B5FFF]"
                      />
                    ) : (
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                        <span>{activity.updatedAt || 'Not edited yet'}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Planning Cycle</label>
                  {isEditing ? (
                    <select
                      value={activity.planningType || 'Project Duration'}
                      onChange={(e) => handleInputChange('planningType', e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm appearance-none"
                    >
                      <option value="Daily">Daily Target</option>
                      <option value="Weekly">Weekly Target</option>
                      <option value="Monthly">Monthly Target</option>
                      <option value="Project Duration">Overall Project Duration</option>
                    </select>
                  ) : (
                    <p className="text-sm font-semibold">{activity.planningType || 'Project Duration'}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Daily Target %</label>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={activity.dailyTargetPercentage || 0}
                        onChange={(e) => handleInputChange('dailyTargetPercentage', Number(e.target.value))}
                        className="w-24 h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                      />
                      <span className="text-xs text-slate-500">% per day</span>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold">{activity.dailyTargetPercentage || 0}% <span className="text-xs text-slate-400 font-normal">per day</span></p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Daily Target Qty</label>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={activity.dailyTargetQuantity || 0}
                        onChange={(e) => handleInputChange('dailyTargetQuantity', Number(e.target.value))}
                        className="w-24 h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                      />
                      <span className="text-xs text-slate-500">{activity.unit || 'units'}/day</span>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold">{activity.dailyTargetQuantity || 0} {activity.unit || 'units'} <span className="text-xs text-slate-400 font-normal">per day</span></p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Planned vs Actual Hours</label>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={activity.plannedHours || 0}
                      onChange={(e) => handleInputChange('plannedHours', Number(e.target.value))}
                      className="w-24 h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                    />
                    <span className="text-xs text-slate-500">hrs planned</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{activity.plannedHours || 0} hrs planned</span>
                    <span>/</span>
                    <span className="font-bold text-[#0B5FFF]">{calculatedActualHours} hrs actual</span>
                  </div>
                )}
              </div>

              {/* Planning Schedule Calendar Modal */}
              <PlanningCalendar
                isOpen={isCalendarModalOpen}
                onClose={() => setIsCalendarModalOpen(false)}
                activity={activity}
              />

            </CardContent>
          </Card>

          {/* Assigned Resources Card (Material, Labour & Equipment) */}
          <Card className="rounded-2xl border border-blue-100 dark:border-slate-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-[#0B5FFF]" />
                Assigned Task Resources
              </CardTitle>
              <Button size="sm" onClick={() => setIsAssignModalOpen(true)} className="bg-[#0B5FFF] hover:bg-blue-600 text-white text-xs gap-1.5 rounded-xl font-medium px-3">
                <Plus className="h-3.5 w-3.5" /> Assign Resources
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Materials Assigned */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-blue-500" /> Allocated Materials ({activity.assignedMaterials?.length || 0})
                </h4>
                {(!activity.assignedMaterials || activity.assignedMaterials.length === 0) ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    No materials assigned to this task. Click "Assign Resources" above to assign inventory items.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activity.assignedMaterials.map(mat => (
                      <div key={mat.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
                            <Package className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{mat.name}</p>
                            <p className="text-[11px] text-slate-500">Assigned: <span className="font-semibold text-[#0B5FFF]">{mat.quantity} {mat.unit}</span></p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveMaterialAssignment(mat.id)} className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Labour Assigned */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-emerald-500" /> Allocated Labour & Personnel ({activity.assignedLabour?.length || 0})
                </h4>
                {(!activity.assignedLabour || activity.assignedLabour.length === 0) ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    No specific personnel assigned yet. Click "Assign Resources" to assign crew or workers.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activity.assignedLabour.map(lab => (
                      <div key={lab.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {lab.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{lab.name}</p>
                            <p className="text-[11px] text-slate-500">{lab.role} • <span className="font-semibold text-emerald-600 dark:text-emerald-400">{lab.hours} hrs/shift</span></p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveLabourAssignment(lab.id)} className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Equipment Assigned */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-amber-500" /> Allocated Equipment ({activity.assignedEquipment?.length || 0})
                </h4>
                {(!activity.assignedEquipment || activity.assignedEquipment.length === 0) ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    No heavy equipment allocated to this task. Click "Assign Resources" to assign machinery.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activity.assignedEquipment.map(eq => (
                      <div key={eq.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                            <Truck className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{eq.name}</p>
                            <p className="text-[11px] text-slate-500">Operator: <span className="font-semibold text-amber-600 dark:text-amber-400">{eq.operator || 'Assigned Operator'}</span></p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveEquipmentAssignment(eq.id)} className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dependencies & Constraints */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-[#0B5FFF]" />
                Dependencies & Constraints
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Prerequisite Dependencies</label>
                {activity.dependencies && activity.dependencies.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {activity.dependencies.map((dep, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800">
                        {dep}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No dependencies linked</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Site Constraints & Blockers</label>
                {activity.constraints && activity.constraints.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {activity.constraints.map((c, idx) => (
                      <Badge key={idx} variant="danger" className="text-xs">
                        <ShieldAlert className="h-3 w-3 mr-1 inline" /> {c}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No active constraints</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Discussion / Comments */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#0B5FFF]" />
                Team Discussion
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
                {activity.comments && activity.comments.length > 0 ? (
                  activity.comments.map(comment => (
                    <div key={comment.id} className="flex gap-3">
                      <img src={comment.avatar} alt={comment.author} className="w-8 h-8 rounded-full bg-slate-100" />
                      <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-2xl rounded-tl-none p-3 border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold">{comment.author}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(comment.timestamp).toLocaleDateString()} {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{comment.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-6 text-sm text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No comments yet. Start the discussion!
                  </div>
                )}
              </div>
              <div className="flex items-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment or update..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF] focus:border-[#0B5FFF] min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handlePostComment();
                      }
                    }}
                  />
                </div>
                <Button 
                  onClick={handlePostComment}
                  disabled={!newComment.trim()}
                  className="bg-[#0B5FFF] rounded-xl h-[60px] px-6"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Labour Tracking */}
          <ActivityLabourTracking activityId={activity.id} projectId={activity.projectId} activity={activity} />

          {/* Equipment & Machinery Hour Tracking */}
          <ActivityEquipmentTracking activityId={activity.id} projectId={activity.projectId} activity={activity} />

        </div>

        {/* Right Column - 1 Span (Status, QR Codes, Media & Signatures) */}
        <div className="flex flex-col gap-6">
          
          {/* Status & Priority Overview Card */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider">
                Status & Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Activity Status</label>
                {isEditing ? (
                  <select
                    value={activity.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as ActivityStatus;
                      handleInputChange('status', newStatus);
                      if (newStatus === 'Completed') handleInputChange('progress', 100);
                      else if (newStatus === 'Not Started') handleInputChange('progress', 0);
                      else if (newStatus === 'In Progress' && activity.progress === 0) handleInputChange('progress', 10);
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm font-semibold"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    {getStatusIcon(activity.status)}
                    <span className="text-sm font-extrabold">{activity.status}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Priority Level</label>
                {isEditing ? (
                  <select
                    value={activity.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value as Priority)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm font-semibold"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                ) : (
                  <div>{getPriorityBadge(activity.priority)}</div>
                )}
              </div>

              {/* Resource Tracking Summary */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase text-slate-400">Resource Hours Logged</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 flex flex-col">
                    <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      <Users className="h-3 w-3 text-emerald-600" /> Labour Hours
                    </span>
                    <span className="text-base font-black text-emerald-950 dark:text-emerald-100 mt-0.5">
                      {calculatedActualHours} <span className="text-xs font-medium text-emerald-600">hrs</span>
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex flex-col">
                    <span className="text-[10px] font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1">
                      <Truck className="h-3 w-3 text-blue-600" /> Machine Hours
                    </span>
                    <span className="text-base font-black text-blue-950 dark:text-blue-100 mt-0.5">
                      {calculatedMachineHours} <span className="text-xs font-medium text-blue-600">hrs</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* QR & Barcode Section */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Identification Tags</span>
                  <span className="text-[10px] font-semibold text-[#0B5FFF]">Click to Expand / Edit</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingQrCode(activity.qrCode || `QR-${activity.id}`);
                      setExpandedCodeTag('qr');
                    }}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/60 dark:bg-slate-800/50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 hover:border-[#0B5FFF] flex items-center gap-2 text-left transition-all group"
                    title="Click to view full QR Code and edit code name"
                  >
                    <QrCode className="h-4 w-4 text-[#0B5FFF] group-hover:scale-110 transition-transform shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-[9px] text-slate-400 block font-semibold group-hover:text-[#0B5FFF]">QR Code 🔍</span>
                      <span className="text-xs font-mono font-bold truncate block text-slate-800 dark:text-slate-200">{activity.qrCode || `QR-${activity.id}`}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingBarcode(activity.barcode || `BC-${activity.id}`);
                      setExpandedCodeTag('barcode');
                    }}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/60 dark:bg-slate-800/50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 hover:border-[#0B5FFF] flex items-center gap-2 text-left transition-all group"
                    title="Click to view full Barcode and edit code name"
                  >
                    <Barcode className="h-4 w-4 text-[#0B5FFF] group-hover:scale-110 transition-transform shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-[9px] text-slate-400 block font-semibold group-hover:text-[#0B5FFF]">Barcode 🔍</span>
                      <span className="text-xs font-mono font-bold truncate block text-slate-800 dark:text-slate-200">{activity.barcode || `BC-${activity.id}`}</span>
                    </div>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media & Attachments */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-[#0B5FFF]" />
                Media & Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              
              {/* Site Photos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-slate-400" /> Site Photos ({activity.photos?.length || 0})
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsCapturing(true)} 
                      className="h-7 text-[11px] rounded-lg px-2 gap-1 bg-[#0B5FFF]/10 text-[#0B5FFF] hover:bg-[#0B5FFF]/20 border-transparent font-medium"
                    >
                      <Camera className="h-3.5 w-3.5" /> Camera
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => fileInputRef.current?.click()} 
                      className="h-7 text-[11px] rounded-lg px-2 gap-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Upload className="h-3.5 w-3.5" /> Upload
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {activity.photos && activity.photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {activity.photos.map((photo, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900">
                        <img 
                          src={photo} 
                          alt={`Site photo ${idx + 1}`} 
                          className="h-28 w-full object-cover group-hover:scale-105 transition-transform cursor-pointer" 
                          onClick={() => setPreviewPhoto(photo)}
                        />
                        
                        {/* Tagged Task Badge (Visible when not hovering) */}
                        {activity.photoTags?.[idx] && (
                          <div className="absolute top-1.5 left-1.5 right-1.5 pointer-events-none group-hover:opacity-0 transition-opacity">
                            <span className="inline-block bg-blue-600/90 backdrop-blur-sm shadow-sm text-[9px] text-white px-2 py-0.5 rounded-full font-medium truncate max-w-full border border-blue-500/30">
                              <Tag className="h-2.5 w-2.5 inline-block mr-1 -mt-0.5 opacity-80"/>
                              {activity.subtasks?.find(t => t.id === activity.photoTags![idx])?.title || 'Tagged Task'}
                            </span>
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5 pointer-events-none group-hover:pointer-events-auto">
                          
                          {/* Top: Tag Dropdown */}
                          <div className="w-full">
                            <select
                              className="w-full text-[10px] py-1 px-1.5 rounded bg-white/20 hover:bg-white/30 text-white border-0 outline-none focus:ring-1 focus:ring-white/50 backdrop-blur-sm cursor-pointer appearance-none"
                              value={activity.photoTags?.[idx] || ''}
                              onChange={(e) => handleTagPhoto(idx, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="" className="text-slate-800">Assign to Task...</option>
                              {activity.subtasks?.map(t => (
                                <option key={t.id} value={t.id} className="text-slate-800">{t.title}</option>
                              ))}
                            </select>
                          </div>

                          {/* Bottom: Action Buttons */}
                          <div className="flex justify-center gap-2 mb-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewPhoto(photo);
                              }} 
                              className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-sm transition-colors"
                              title="View Photo"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePhoto(idx);
                              }} 
                              className="p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-lg backdrop-blur-sm transition-colors"
                              title="Delete Photo"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <span className="absolute bottom-1 right-1 bg-black/60 text-[9px] text-white px-1.5 py-0.5 rounded font-mono pointer-events-none group-hover:opacity-0 transition-opacity">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center text-xs text-slate-400 gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#0B5FFF]">
                      <Camera className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">No site progress photos</p>
                      <p className="text-[11px] text-slate-400">Capture or upload photos to document progress on site</p>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Button size="sm" onClick={() => setIsCapturing(true)} className="rounded-lg gap-1.5 bg-[#0B5FFF] text-xs">
                        <Camera className="h-3.5 w-3.5" /> Take Photo
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-lg gap-1.5 text-xs">
                        <Upload className="h-3.5 w-3.5" /> Upload File
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Voice Notes */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <Mic className="h-3.5 w-3.5 text-slate-400" /> Field Voice Notes ({activity.voiceNotes?.length || 0})
                  </label>
                  <button
                    onClick={() => setIsAddVoiceNoteOpen(true)}
                    className="text-[11px] font-bold text-[#0B5FFF] hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Voice Note
                  </button>
                </div>
                {activity.voiceNotes && activity.voiceNotes.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {activity.voiceNotes.map((note, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs flex items-center justify-between gap-2 border border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Mic className="h-3.5 w-3.5 text-[#0B5FFF] shrink-0" />
                          <span className="font-mono text-[11px] truncate">{note}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-xs text-slate-400 italic">No voice notes recorded</p>
                    <button
                      onClick={() => setIsAddVoiceNoteOpen(true)}
                      className="mt-1 text-[11px] font-semibold text-[#0B5FFF] hover:underline"
                    >
                      + Record / Type Voice Note
                    </button>
                  </div>
                )}
              </div>

              {/* Digital Signature */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <PenTool className="h-3.5 w-3.5 text-slate-400" /> Digital Sign-off
                  </label>
                  {!activity.digitalSignature && (
                    <button
                      onClick={() => setIsSignOffModalOpen(true)}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <CheckCircle2 className="h-3 w-3" /> Sign Off Activity
                    </button>
                  )}
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                  {activity.digitalSignature ? (
                    <div>
                      <span className="font-serif italic text-base font-bold text-slate-800 dark:text-slate-200 block">
                        {activity.digitalSignature}
                      </span>
                      <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider block mt-1">
                        ✓ Verified Sign-off Recorded
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs text-slate-400 italic block mb-1">Pending supervisor sign-off</span>
                      <Button
                        size="sm"
                        onClick={() => setIsSignOffModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 rounded-lg gap-1"
                      >
                        <PenTool className="h-3 w-3" /> Execute Digital Signature
                      </Button>
                    </div>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Field Remarks & Executive Summary */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#0B5FFF]" />
                Field Remarks & Notes
              </CardTitle>
              <button
                onClick={() => setIsAddRemarkModalOpen(true)}
                className="flex items-center gap-1 text-xs font-bold text-[#0B5FFF] hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add Remark
              </button>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <textarea
                  rows={4}
                  value={activity.remarks || ''}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                  placeholder="Enter supervisor notes or field observations..."
                />
              ) : (
                <div className="space-y-2">
                  {activity.remarks ? (
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs whitespace-pre-wrap text-slate-700 dark:text-slate-200 leading-relaxed font-sans">
                      {activity.remarks}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                      <p className="text-xs text-slate-400 italic mb-2">No field remarks recorded for this activity.</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsAddRemarkModalOpen(true)}
                        className="text-xs h-7 rounded-lg gap-1 text-[#0B5FFF] border-[#0B5FFF]/30"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Field Observation
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked Documents Hub Card */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-[#0B5FFF]" />
                Attached Documents ({((documents || []).filter(d => d.linkedActivityId === activity.id)).length})
              </CardTitle>
              <button
                onClick={() => navigate('/documents')}
                className="flex items-center gap-1 text-xs font-bold text-[#0B5FFF] hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Hub Register
              </button>
            </CardHeader>
            <CardContent>
              {(() => {
                const linked = (documents || []).filter(d => d.linkedActivityId === activity.id);
                if (linked.length === 0) {
                  return (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                      <p className="text-xs text-slate-400 italic mb-2">No technical documents or drawings attached to this activity.</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/documents')}
                        className="text-xs h-7 rounded-lg gap-1.5 text-[#0B5FFF] border-[#0B5FFF]/30"
                      >
                        <LinkIcon className="h-3 w-3" /> Link from Documents Hub
                      </Button>
                    </div>
                  );
                }
                return (
                  <div className="space-y-2">
                    {linked.map(doc => (
                      <div
                        key={doc.id}
                        onClick={() => navigate('/documents')}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-[#0B5FFF] cursor-pointer transition-all flex items-center justify-between gap-2 group"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-[#0B5FFF] transition-colors">
                            {doc.title}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                            <span>{doc.fileName}</span>
                            <span>•</span>
                            <span className="font-bold text-slate-600 dark:text-slate-300">{doc.category}</span>
                            <span>•</span>
                            <span className="text-emerald-600 font-semibold">{doc.status}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-[#0B5FFF] shrink-0">
                          {doc.version}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Activity Process Explainer & Acts Breakdown */}
          <ActivityExplainerBreakdown
            activity={activity}
            onUpdateActivity={(updatedActivity) => {
              setActivity(updatedActivity);
              if (onSave) onSave(updatedActivity);
              else updateActivity(updatedActivity);
            }}
            readOnly={!isEditable}
          />

        </div>

      </div>

      {/* EXPANDED IDENTIFICATION TAG MODAL (QR CODE & BARCODE) */}
      {expandedCodeTag && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {expandedCodeTag === 'qr' ? <QrCode className="h-5 w-5 text-[#0B5FFF]" /> : <Barcode className="h-5 w-5 text-[#0B5FFF]" />}
                  {expandedCodeTag === 'qr' ? 'Expanded QR Code Tag' : 'Expanded Barcode Tag'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{activity.id} • {activity.name}</p>
              </div>
              <button onClick={() => setExpandedCodeTag(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCodeTag} className="p-6 space-y-5">
              {/* Graphic Preview Card */}
              <div className="p-6 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner flex flex-col items-center justify-center text-center">
                {expandedCodeTag === 'qr' ? (
                  <div className="bg-white p-4 rounded-xl border-2 border-slate-900 shadow-sm flex flex-col items-center">
                    <svg className="w-40 h-40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Top-Left Finder Square */}
                      <rect x="5" y="5" width="25" height="25" fill="#090D16" />
                      <rect x="9" y="9" width="17" height="17" fill="white" />
                      <rect x="13" y="13" width="9" height="9" fill="#090D16" />

                      {/* Top-Right Finder Square */}
                      <rect x="70" y="5" width="25" height="25" fill="#090D16" />
                      <rect x="74" y="9" width="17" height="17" fill="white" />
                      <rect x="78" y="13" width="9" height="9" fill="#090D16" />

                      {/* Bottom-Left Finder Square */}
                      <rect x="5" y="70" width="25" height="25" fill="#090D16" />
                      <rect x="9" y="74" width="17" height="17" fill="white" />
                      <rect x="13" y="78" width="9" height="9" fill="#090D16" />

                      {/* Matrix Grid Data Patterns */}
                      <rect x="35" y="5" width="5" height="5" fill="#090D16" />
                      <rect x="45" y="5" width="10" height="5" fill="#090D16" />
                      <rect x="60" y="5" width="5" height="5" fill="#090D16" />
                      <rect x="35" y="15" width="15" height="5" fill="#090D16" />
                      <rect x="55" y="15" width="10" height="5" fill="#090D16" />

                      <rect x="5" y="35" width="10" height="5" fill="#090D16" />
                      <rect x="20" y="35" width="5" height="5" fill="#090D16" />
                      <rect x="30" y="35" width="15" height="5" fill="#090D16" />
                      <rect x="50" y="35" width="10" height="5" fill="#090D16" />
                      <rect x="65" y="35" width="15" height="5" fill="#090D16" />
                      <rect x="85" y="35" width="10" height="5" fill="#090D16" />

                      <rect x="10" y="45" width="5" height="10" fill="#090D16" />
                      <rect x="25" y="45" width="10" height="5" fill="#090D16" />
                      <rect x="40" y="45" width="15" height="10" fill="#090D16" />
                      <rect x="60" y="45" width="5" height="10" fill="#090D16" />
                      <rect x="75" y="45" width="15" height="5" fill="#090D16" />

                      <rect x="35" y="60" width="10" height="10" fill="#090D16" />
                      <rect x="50" y="60" width="5" height="5" fill="#090D16" />
                      <rect x="60" y="60" width="15" height="5" fill="#090D16" />
                      <rect x="80" y="60" width="15" height="10" fill="#090D16" />

                      <rect x="35" y="75" width="5" height="15" fill="#090D16" />
                      <rect x="45" y="75" width="15" height="5" fill="#090D16" />
                      <rect x="65" y="75" width="10" height="15" fill="#090D16" />
                      <rect x="80" y="75" width="15" height="5" fill="#090D16" />

                      <rect x="45" y="85" width="10" height="10" fill="#090D16" />
                      <rect x="80" y="85" width="10" height="10" fill="#090D16" />
                    </svg>
                    <span className="font-mono text-xs font-black tracking-widest text-slate-900 mt-2 block">
                      {editingQrCode}
                    </span>
                  </div>
                ) : (
                  <div className="bg-white p-5 rounded-xl border-2 border-slate-900 shadow-sm flex flex-col items-center w-full max-w-[280px]">
                    <svg className="w-full h-20" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="5" y="5" width="4" height="50" fill="#090D16" />
                      <rect x="11" y="5" width="2" height="50" fill="#090D16" />
                      <rect x="17" y="5" width="6" height="50" fill="#090D16" />
                      <rect x="27" y="5" width="2" height="50" fill="#090D16" />
                      <rect x="33" y="5" width="8" height="50" fill="#090D16" />
                      <rect x="45" y="5" width="4" height="50" fill="#090D16" />
                      <rect x="53" y="5" width="2" height="50" fill="#090D16" />
                      <rect x="59" y="5" width="6" height="50" fill="#090D16" />
                      <rect x="69" y="5" width="4" height="50" fill="#090D16" />
                      <rect x="77" y="5" width="8" height="50" fill="#090D16" />
                      <rect x="89" y="5" width="2" height="50" fill="#090D16" />
                      <rect x="95" y="5" width="6" height="50" fill="#090D16" />
                      <rect x="105" y="5" width="4" height="50" fill="#090D16" />
                      <rect x="113" y="5" width="2" height="50" fill="#090D16" />
                      <rect x="119" y="5" width="8" height="50" fill="#090D16" />
                      <rect x="131" y="5" width="4" height="50" fill="#090D16" />
                      <rect x="139" y="5" width="6" height="50" fill="#090D16" />
                      <rect x="149" y="5" width="2" height="50" fill="#090D16" />
                      <rect x="155" y="5" width="8" height="50" fill="#090D16" />
                      <rect x="167" y="5" width="4" height="50" fill="#090D16" />
                      <rect x="175" y="5" width="2" height="50" fill="#090D16" />
                      <rect x="181" y="5" width="6" height="50" fill="#090D16" />
                      <rect x="191" y="5" width="4" height="50" fill="#090D16" />
                    </svg>
                    <span className="font-mono text-sm font-black tracking-widest text-slate-900 mt-2 block">
                      {editingBarcode}
                    </span>
                  </div>
                )}
                <span className="text-[10px] text-slate-400 mt-2 font-medium">
                  {expandedCodeTag === 'qr' ? 'Scannable Site QR Code Tag' : 'Scannable Industrial Barcode Tag'}
                </span>
              </div>

              {/* Editable Code Name Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Edit Code Name / Tag Identifier *
                </label>
                {expandedCodeTag === 'qr' ? (
                  <input
                    type="text"
                    required
                    placeholder="e.g. QR-FOUNDATION-ZONE-A"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-mono font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    value={editingQrCode}
                    onChange={e => setEditingQrCode(e.target.value)}
                  />
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="e.g. BC-FOUNDATION-ZONE-A"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-mono font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    value={editingBarcode}
                    onChange={e => setEditingBarcode(e.target.value)}
                  />
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  Change this code identifier to match your company's custom tagging convention.
                </p>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const textToCopy = expandedCodeTag === 'qr' ? editingQrCode : editingBarcode;
                      navigator.clipboard.writeText(textToCopy);
                      setCopiedCodeTag(true);
                      setTimeout(() => setCopiedCodeTag(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
                  >
                    {copiedCodeTag ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedCodeTag ? 'Copied!' : 'Copy Code'}
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print Sticker Tag
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedCodeTag(null)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#0B5FFF] hover:bg-blue-600 text-white flex items-center gap-1 shadow-sm"
                  >
                    <Save className="h-3.5 w-3.5" /> Save Code Name
                  </button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 1: ADD VOICE NOTE MODAL */}
      {isAddVoiceNoteOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Mic className="h-5 w-5 text-[#0B5FFF]" /> Record / Add Voice Note
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Transcribe site observations or audio memos</p>
              </div>
              <button onClick={() => setIsAddVoiceNoteOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddVoiceNote} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Voice Note / Audio Observation *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Rebar spacing verified by senior inspector at 14:30. Foundation ready for pour..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900"
                  value={voiceNoteInput}
                  onChange={e => setVoiceNoteInput(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddVoiceNoteOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#0B5FFF] text-white flex items-center gap-1.5"
                >
                  <Mic className="h-4 w-4" /> Save Voice Note
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 2: DIGITAL SIGN-OFF MODAL */}
      {isSignOffModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-6 border-b border-emerald-100 dark:border-emerald-900/40 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                  <PenTool className="h-5 w-5 text-emerald-600" /> Digital Supervisor Sign-off
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">Formal verification & activity completion sign-off</p>
              </div>
              <button onClick={() => setIsSignOffModalOpen(false)} className="text-emerald-400 hover:text-emerald-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSignOffSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Supervisor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Miller"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 font-bold"
                  value={signerName}
                  onChange={e => setSignerName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Role / Certification Title</label>
                <input
                  type="text"
                  placeholder="e.g. Lead Site Engineer / Quality Auditor"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900"
                  value={signerRole}
                  onChange={e => setSignerRole(e.target.value)}
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[11px] text-slate-400 block mb-1">Preview Signature Stamp</span>
                <span className="font-serif italic text-lg font-bold text-slate-900 dark:text-white block">
                  {signerName ? `${signerName} (${signerRole})` : 'Signature Preview'}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                  Verified Date: {new Date().toISOString().split('T')[0]}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSignOffModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                >
                  <PenTool className="h-4 w-4" /> Execute Sign-off
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 3: ADD FIELD REMARK MODAL */}
      {isAddRemarkModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#0B5FFF]" /> Add Field Remark / Observation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Record daily details, safety notes, or technical observations</p>
              </div>
              <button onClick={() => setIsAddRemarkModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddRemarkSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Remark / Observation Details *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Concrete slump test verified at 110mm. Weather conditions clear. Site safety inspection passed."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900"
                  value={remarkInput}
                  onChange={e => setRemarkInput(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddRemarkModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#0B5FFF] text-white flex items-center gap-1.5"
                >
                  <Save className="h-4 w-4" /> Save Remark
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Camera Capture Modal */}
      {isCapturing && (
        <CameraCapture 
          onCapture={(dataUrl) => {
            handleAttachPhoto(dataUrl);
            setIsCapturing(false);
          }}
          onCancel={() => setIsCapturing(false)}
        />
      )}

      {/* Photo Preview Lightbox Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative max-w-4xl w-full flex flex-col items-center">
            <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
              <a
                href={previewPhoto}
                download={`activity-photo-${activity.id}.jpg`}
                className="p-2 bg-black/60 text-white hover:bg-black/80 rounded-full transition-colors"
                title="Download Photo"
              >
                <Download className="h-5 w-5" />
              </a>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="p-2 bg-black/60 text-white hover:bg-black/80 rounded-full transition-colors"
                title="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <img 
              src={previewPhoto} 
              alt="Site photo full preview" 
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl border border-slate-800"
            />
            <div className="mt-3 text-center text-xs text-slate-300 font-medium">
              Activity {activity.id} • {activity.name} • Site Progress Photo
            </div>
          </div>
        </div>
      )}

      {/* Task Resource Assignment Modal (Material, Labour, Equipment) */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700/60">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-[#0B5FFF]" /> Assign Resources to Task
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activity.id} - {activity.name}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/50 px-6 pt-3 gap-2">
              <button
                type="button"
                onClick={() => setAssignTab('Material')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-colors border-t border-x ${
                  assignTab === 'Material' 
                    ? 'bg-white dark:bg-[#1E293B] text-[#0B5FFF] dark:text-blue-400 border-slate-200 dark:border-slate-700 border-b-transparent' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-transparent'
                }`}
              >
                <Package className="h-3.5 w-3.5" /> Assign Material
              </button>
              <button
                type="button"
                onClick={() => setAssignTab('Labour')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-colors border-t border-x ${
                  assignTab === 'Labour' 
                    ? 'bg-white dark:bg-[#1E293B] text-emerald-600 dark:text-emerald-400 border-slate-200 dark:border-slate-700 border-b-transparent' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-transparent'
                }`}
              >
                <Users className="h-3.5 w-3.5" /> Assign Labour
              </button>
              <button
                type="button"
                onClick={() => setAssignTab('Equipment')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-colors border-t border-x ${
                  assignTab === 'Equipment' 
                    ? 'bg-white dark:bg-[#1E293B] text-amber-600 dark:text-amber-400 border-slate-200 dark:border-slate-700 border-b-transparent' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-transparent'
                }`}
              >
                <Truck className="h-3.5 w-3.5" /> Assign Equipment
              </button>
            </div>

            {/* Tab 1: Material Form */}
            {assignTab === 'Material' && (
              <form onSubmit={handleAddMaterialAssignment} className="p-6 overflow-y-auto space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Select Material from Inventory</label>
                  <select 
                    value={selectedMaterialId} 
                    onChange={e => setSelectedMaterialId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#0B5FFF]"
                  >
                    <option value="">-- Choose Inventory Item --</option>
                    {materials.map(mat => (
                      <option key={mat.id} value={mat.id}>{mat.name} ({mat.category}) - Available: {mat.receivedQuantity - mat.usedQuantity} {mat.unit}</option>
                    ))}
                    <option value="MAT-CUSTOM">Custom Material Entry...</option>
                  </select>
                </div>

                {selectedMaterialId === 'MAT-CUSTOM' && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Custom Material Name</label>
                    <input type="text" placeholder="e.g. Ready-mix Concrete Grade 30" onChange={e => setSelectedMaterialId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assigned Quantity</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={assignMaterialQty} 
                      onChange={e => setAssignMaterialQty(Number(e.target.value))} 
                      required 
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Unit of Measure</label>
                    <input 
                      type="text" 
                      value={materials.find(m => m.id === selectedMaterialId)?.unit || 'pcs'} 
                      disabled
                      className="w-full px-3 py-2 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-500 cursor-not-allowed" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assignment Notes / Batch Ref</label>
                  <textarea 
                    rows={2}
                    placeholder="e.g. Batch 4 for foundation raft pour"
                    value={assignMaterialNotes} 
                    onChange={e => setAssignMaterialNotes(e.target.value)} 
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white" 
                  />
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700/60 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-[#0B5FFF] hover:bg-blue-600 text-white">Assign Material</Button>
                </div>
              </form>
            )}

            {/* Tab 2: Labour Form */}
            {assignTab === 'Labour' && (
              <form onSubmit={handleAddLabourAssignment} className="p-6 overflow-y-auto space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Select Employee or Crew</label>
                  <select 
                    value={selectedEmployeeId} 
                    onChange={e => setSelectedEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Choose Employee / Team --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.position} - {emp.department})</option>
                    ))}
                    <option value="CUSTOM">Custom Worker / External Team Entry...</option>
                  </select>
                </div>

                {(!selectedEmployeeId || selectedEmployeeId === 'CUSTOM') && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Worker / Team Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Concrete Crew A or John Smith" 
                      value={customWorkerName} 
                      onChange={e => setCustomWorkerName(e.target.value)} 
                      required={!selectedEmployeeId}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white" 
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Role / Designation</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Steel Fixer / Site Tech" 
                      value={assignLabourRole} 
                      onChange={e => setAssignLabourRole(e.target.value)} 
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Allocated Hours / Shift</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={assignLabourHours} 
                      onChange={e => setAssignLabourHours(Number(e.target.value))} 
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Shift Notes & Responsibilities</label>
                  <textarea 
                    rows={2} 
                    placeholder="e.g. Responsible for rebar placement on Grid Line A"
                    value={assignLabourNotes} 
                    onChange={e => setAssignLabourNotes(e.target.value)} 
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white" 
                  />
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700/60 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">Assign Personnel</Button>
                </div>
              </form>
            )}

            {/* Tab 3: Equipment Form */}
            {assignTab === 'Equipment' && (
              <form onSubmit={handleAddEquipmentAssignment} className="p-6 overflow-y-auto space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Select Machinery / Equipment Fleet</label>
                  <select 
                    value={selectedEquipmentId} 
                    onChange={e => setSelectedEquipmentId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Choose Equipment Unit --</option>
                    {equipment.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.id} - {eq.name} ({eq.type} • {eq.status})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assigned Operator</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Dave Wilson" 
                    value={assignEqOperator} 
                    onChange={e => setAssignEqOperator(e.target.value)} 
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Allocation Notes</label>
                  <textarea 
                    rows={2} 
                    placeholder="e.g. Assigned for foundation excavation shift"
                    value={assignEqNotes} 
                    onChange={e => setAssignEqNotes(e.target.value)} 
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white" 
                  />
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700/60 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white">Assign Machinery</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Log Progress Modal */}
      {isLogProgressModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Log Progress & Daily Report
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-mono font-bold text-slate-500">{activity.id}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {activity.name}
                </h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsLogProgressModalOpen(false)} className="rounded-full h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleLogProgressSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-6">
              {/* Section 1: Progress & Status */}
              <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-3.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-[#0B5FFF]" /> Overall Activity Completion
                  </label>
                  <span className="text-xl font-black text-[#0B5FFF]">{logProgressPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={logProgressPercent}
                  onChange={(e) => {
                    const p = Number(e.target.value);
                    setLogProgressPercent(p);
                    if (p === 100) setLogProgressStatus('Completed');
                    else if (p > 0 && (logProgressStatus === 'Not Started' || logProgressStatus === 'Completed')) setLogProgressStatus('In Progress');
                  }}
                  className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#0B5FFF]"
                />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-blue-200/50 dark:border-blue-900/40">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Activity Status</label>
                  <select
                    value={logProgressStatus}
                    onChange={(e) => setLogProgressStatus(e.target.value as ActivityStatus)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100 shadow-sm"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Section 2: Quantities & Cumulative Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Actual Quantity Achieved
                    </label>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{activity.unit || 'units'}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={logProgressActualQty}
                    onChange={(e) => {
                      const qty = Number(e.target.value);
                      setLogProgressActualQty(qty);
                      if (activity.targetQuantity && activity.targetQuantity > 0) {
                        const calcP = Math.min(100, Math.round((qty / activity.targetQuantity) * 100));
                        setLogProgressPercent(calcP);
                        if (calcP === 100) setLogProgressStatus('Completed');
                        else if (calcP > 0) setLogProgressStatus('In Progress');
                      }
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-[#0B5FFF]"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Target: {activity.targetQuantity || 0} {activity.unit || 'units'}</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {activity.targetQuantity ? `${Math.round((logProgressActualQty / activity.targetQuantity) * 100)}% of Target` : ''}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Actual Hours Logged</label>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">Auto Tracked</span>
                  </div>
                  <input
                    type="number"
                    readOnly
                    value={calculatedActualHours}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400 block">Accumulated from Labour site hours</span>
                </div>
              </div>

              {/* Section 3: Environmental & Site Conditions */}
              <div className="p-4 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  <Sun className="h-4 w-4 text-amber-500" /> Site & Environmental Snapshot
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block mb-1">Report Date</label>
                    <input
                      type="date"
                      value={logProgressDate}
                      onChange={(e) => setLogProgressDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block mb-1">Weather</label>
                    <select
                      value={logProgressWeather}
                      onChange={(e) => setLogProgressWeather(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200"
                    >
                      <option value="Sunny">☀️ Sunny</option>
                      <option value="Overcast">☁️ Overcast</option>
                      <option value="Light Rain">🌧️ Light Rain</option>
                      <option value="Heavy Rain">⛈️ Heavy Rain</option>
                      <option value="Windy">💨 Windy</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block mb-1">Temperature</label>
                    <input
                      type="text"
                      placeholder="e.g. 24°C"
                      value={logProgressTemp}
                      onChange={(e) => setLogProgressTemp(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block mb-1">Site / Ground Conditions</label>
                  <input
                    type="text"
                    placeholder="e.g. Dry, clear access, working areas active"
                    value={logProgressSiteConditions}
                    onChange={(e) => setLogProgressSiteConditions(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Section 4: Subtasks Snapshot (Interactive Check-off) */}
              {logProgressSubtasks && logProgressSubtasks.length > 0 && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <CheckSquare className="h-4 w-4 text-emerald-600" /> Subtask Checklist ({logProgressSubtasks.filter(s => s.status === 'Completed').length}/{logProgressSubtasks.length} Completed)
                    </label>
                    <span className="text-[10px] text-slate-400">Click to update status</span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {logProgressSubtasks.map((subtask, idx) => (
                      <div
                        key={subtask.id || idx}
                        className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...logProgressSubtasks];
                              const nextStatus = subtask.status === 'Completed' ? 'Not Started' : subtask.status === 'Not Started' ? 'In Progress' : 'Completed';
                              updated[idx] = { ...subtask, status: nextStatus };
                              setLogProgressSubtasks(updated);
                            }}
                            className={`h-5 w-5 rounded flex items-center justify-center transition-colors ${
                              subtask.status === 'Completed'
                                ? 'bg-emerald-600 text-white'
                                : subtask.status === 'In Progress'
                                ? 'bg-blue-600 text-white'
                                : 'border border-slate-300 dark:border-slate-600 text-transparent'
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <div className="truncate">
                            <span className={`font-semibold ${subtask.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                              #{idx + 1} {subtask.title}
                            </span>
                            {subtask.isMilestone && (
                              <span className="ml-1.5 text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded font-bold">
                                Milestone
                              </span>
                            )}
                          </div>
                        </div>

                        <select
                          value={subtask.status}
                          onChange={(e) => {
                            const updated = [...logProgressSubtasks];
                            updated[idx] = { ...subtask, status: e.target.value as any };
                            setLogProgressSubtasks(updated);
                          }}
                          className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-medium text-slate-700 dark:text-slate-300"
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 5: Allocated Resources Summary */}
              <div className="p-3 bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-700/80 rounded-xl">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Allocated Task Resources</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-900/50 font-medium">
                    <Users className="h-3.5 w-3.5" /> {(activity.assignedLabour || []).length} Workers Assigned
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-900/50 font-medium">
                    <Truck className="h-3.5 w-3.5" /> {(activity.assignedEquipment || []).length} Machinery Assigned
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 rounded-lg border border-purple-200 dark:border-purple-900/50 font-medium">
                    <Package className="h-3.5 w-3.5" /> {(activity.assignedMaterials || []).length} Materials Assigned
                  </span>
                </div>
              </div>

              {/* Section 6: Daily Field Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Supervisor Field Remarks & Accomplishments
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe work completed today, milestones reached, obstacles encountered, site observations..."
                  value={logProgressNotes}
                  onChange={(e) => setLogProgressNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#0B5FFF]"
                />
              </div>

              {/* Report Auto-Post Notice */}
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-start gap-2.5">
                <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div className="text-xs text-emerald-900 dark:text-emerald-200">
                  <span className="font-bold block">Automatic Daily Report Generation:</span>
                  Saving this progress log will instantly capture the activity state, subtask completion, resources, and site conditions, posting a comprehensive Daily Report into the <strong>Reports & PDF</strong> module.
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsLogProgressModalOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-2 rounded-xl shadow-md px-5">
                  <Save className="h-4 w-4" /> Save Progress & Post Daily Report
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Activity Modal */}
      <PrintPreview
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title={activity.name || "Activity Detail"}
        onDownloadPdf={handleDownloadPDF}
      >
        <div className="p-8 font-sans">
          <div className="border-b-2 border-[#0B5FFF] pb-6 mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-black text-slate-900 mb-2">{activity.name}</h1>
              <p className="text-sm text-slate-500 font-medium">Activity Report / Task Allocation Summary</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Generated</p>
              <p className="text-sm font-bold text-slate-800">{new Date().toLocaleDateString()}</p>
              <p className="text-sm text-slate-500">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Project & Status</h3>
              <div className="space-y-2">
                <p className="text-sm"><span className="text-slate-500 w-24 inline-block">Project:</span> <span className="font-semibold text-slate-900">{projects.find(p => p.id === activity.projectId)?.name || activity.projectId}</span></p>
                <p className="text-sm"><span className="text-slate-500 w-24 inline-block">Status:</span> <span className="font-semibold text-slate-900">{activity.status || "Not Started"}</span></p>
                <p className="text-sm"><span className="text-slate-500 w-24 inline-block">Priority:</span> <span className="font-semibold text-slate-900">{activity.priority || "Medium"}</span></p>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Schedule & Location</h3>
              <div className="space-y-2">
                <p className="text-sm"><span className="text-slate-500 w-24 inline-block">Start Date:</span> <span className="font-semibold text-slate-900">{activity.startDate || "N/A"}</span></p>
                <p className="text-sm"><span className="text-slate-500 w-24 inline-block">End Date:</span> <span className="font-semibold text-slate-900">{activity.finishDate || "N/A"}</span></p>
                <p className="text-sm"><span className="text-slate-500 w-24 inline-block">Location:</span> <span className="font-semibold text-slate-900">{activity.location || "N/A"}</span></p>
              </div>
            </div>
          </div>

          <div className="mb-10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-100 pb-2">Description / Scope of Work</h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {activity.description || "No description provided."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-100 pb-2">Assigned Personnel</h3>
              {activity.assignedLabour && activity.assignedLabour.length > 0 ? (
                <ul className="space-y-2">
                  {activity.assignedLabour.map((l, i) => (
                    <li key={i} className="text-sm flex justify-between items-center py-1 border-b border-slate-50 border-dashed">
                      <span className="font-medium text-slate-800">{l.name}</span>
                      <span className="text-xs text-slate-500">{l.role}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400 italic">No personnel assigned.</p>
              )}
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-100 pb-2">Assigned Equipment</h3>
              {activity.assignedEquipment && activity.assignedEquipment.length > 0 ? (
                <ul className="space-y-2">
                  {activity.assignedEquipment.map((e, i) => (
                    <li key={i} className="text-sm flex justify-between items-center py-1 border-b border-slate-50 border-dashed">
                      <span className="font-medium text-slate-800">{e.name}</span>
                      <span className="text-xs text-slate-500">{e.operator || "Unassigned"}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400 italic">No equipment assigned.</p>
              )}
            </div>
          </div>

          <div className="mt-12 bg-slate-50 rounded-xl p-6 border border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Task Completion</h3>
              <span className="text-lg font-black text-[#0B5FFF]">{activity.progress || 0}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-[#0B5FFF] h-2 rounded-full" style={{ width: `${activity.progress || 0}%` }}></div>
            </div>
          </div>
        </div>
      </PrintPreview>

      {isRecordActivityModalOpen && (
        <RecordActivityForTaskModal
          activity={activity}
          onClose={() => setIsRecordActivityModalOpen(false)}
          onActivityUpdated={(updated) => {
            setActivity(updated);
            if (onSave) {
              onSave(updated);
            } else {
              updateActivity(updated);
            }
          }}
        />
      )}

      {/* Activity Specific Audit Trail Modal */}
      {isAuditModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
          onClick={() => setIsAuditModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <ActivityAuditScreen
              activityId={activity.id}
              projectId={activity.projectId}
              onBack={() => setIsAuditModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
