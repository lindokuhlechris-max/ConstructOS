import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Pin, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Lock, 
  FileText, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  HardHat, 
  Truck, 
  Save, 
  Trash2, 
  X, 
  Check, 
  Minus, 
  Layers, 
  Building2, 
  Compass, 
  Flag, 
  ListChecks, 
  Mic, 
  Sun, 
  CloudRain, 
  Cloud, 
  Wind, 
  Thermometer, 
  TrendingUp, 
  UserCheck, 
  BadgeCheck, 
  RotateCcw,
  CheckSquare,
  FileSpreadsheet,
  FileCheck,
  Eye,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Target,
  SlidersHorizontal,
  CornerDownRight,
  ListTodo
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from './ui';
import { Activity, SubTask, Project, DailyReport, ActivityStatus, TaskLabourAssignment, TaskEquipmentAssignment } from '../types';
import { useAppContext } from '../context/AppContext';
import { getSubtaskProgressionNumber, getPersonInitials, normalizeLabourAssignments, isEmployeeAlreadyAssigned, getLoggedHoursForWorker } from '../lib/labourUtils';
import { saveOrShareFile } from '../lib/fileExportService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ActivitiesPdfModal } from './ActivitiesPdfModal';

export interface DailyLogsTrackerViewProps {
  onOpenActivityDetail?: (activity: Activity) => void;
}

export function DailyLogsTrackerView({ onOpenActivityDetail }: DailyLogsTrackerViewProps) {
  const { 
    activities = [], 
    projects = [], 
    updateActivity, 
    addReport, 
    addAuditLog, 
    employees = [], 
    equipment = [], 
    labourLogs = [], 
    equipmentLogs = [],
    currentUserProfile, 
    userRole,
    addLabourLog
  } = useAppContext();

  // -------------------------------------------------------------
  // 1. Date Navigation State
  // -------------------------------------------------------------
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const formattedDateHeader = useMemo(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    return d.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, [selectedDate]);

  const isToday = useMemo(() => {
    return selectedDate === new Date().toISOString().split('T')[0];
  }, [selectedDate]);

  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleGoToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // -------------------------------------------------------------
  // 2. Granular Pinned Items Storage (Per-Date Memory)
  // Mapping: activityId -> 'all' (all subtasks) | string[] (selected subtask IDs)
  // -------------------------------------------------------------
  const subtaskMapStorageKey = `constructos_pinned_subtask_map_${selectedDate}`;
  const legacyActivityStorageKey = `constructos_pinned_daily_logs_${selectedDate}`;

  const [pinnedSubtaskMap, setPinnedSubtaskMap] = useState<Record<string, 'all' | string[]>>(() => {
    try {
      const savedMap = localStorage.getItem(subtaskMapStorageKey);
      if (savedMap) return JSON.parse(savedMap);

      const legacySaved = localStorage.getItem(legacyActivityStorageKey);
      if (legacySaved) {
        const actIds: string[] = JSON.parse(legacySaved);
        const map: Record<string, 'all' | string[]> = {};
        actIds.forEach(id => { map[id] = 'all'; });
        return map;
      }
    } catch (e) {}

    // Default fallback: activities active today or first 3 activities
    const activeToday = activities.filter(a => {
      if (a.startDate && a.finishDate) {
        return selectedDate >= a.startDate && selectedDate <= a.finishDate;
      }
      return a.status === 'In Progress';
    }).map(a => a.id);

    const initialList = activeToday.length > 0 ? activeToday : activities.slice(0, 3).map(a => a.id);
    const map: Record<string, 'all' | string[]> = {};
    initialList.forEach(id => { map[id] = 'all'; });
    return map;
  });

  // Save pinned items on change
  useEffect(() => {
    try {
      localStorage.setItem(subtaskMapStorageKey, JSON.stringify(pinnedSubtaskMap));
      localStorage.setItem(legacyActivityStorageKey, JSON.stringify(Object.keys(pinnedSubtaskMap)));
    } catch (e) {}
  }, [pinnedSubtaskMap, subtaskMapStorageKey, legacyActivityStorageKey]);

  // Load pinned items when date changes
  useEffect(() => {
    try {
      const savedMap = localStorage.getItem(subtaskMapStorageKey);
      if (savedMap) {
        setPinnedSubtaskMap(JSON.parse(savedMap));
      } else {
        const legacySaved = localStorage.getItem(legacyActivityStorageKey);
        if (legacySaved) {
          const actIds: string[] = JSON.parse(legacySaved);
          const map: Record<string, 'all' | string[]> = {};
          actIds.forEach(id => { map[id] = 'all'; });
          setPinnedSubtaskMap(map);
        } else {
          // Auto discover active tasks for this date
          const activeForDate = activities.filter(a => {
            if (a.startDate && a.finishDate) {
              return selectedDate >= a.startDate && selectedDate <= a.finishDate;
            }
            return a.status === 'In Progress';
          }).map(a => a.id);

          const initialList = activeForDate.length > 0 ? activeForDate : activities.slice(0, 3).map(a => a.id);
          const map: Record<string, 'all' | string[]> = {};
          initialList.forEach(id => { map[id] = 'all'; });
          setPinnedSubtaskMap(map);
        }
      }
    } catch (e) {}
  }, [selectedDate, activities]);

  // -------------------------------------------------------------
  // 3. Selection Helpers & Derived Focus Lists
  // -------------------------------------------------------------
  const isActivityPinned = (actId: string): boolean => {
    const sel = pinnedSubtaskMap[actId];
    if (!sel) return false;
    if (sel === 'all') return true;
    return Array.isArray(sel) && sel.length > 0;
  };

  const getActivitySelectionState = (act: Activity): 'all' | 'partial' | 'none' => {
    const sel = pinnedSubtaskMap[act.id];
    if (!sel) return 'none';
    const subtasks = act.subtasks || [];
    if (subtasks.length === 0) return 'all';
    if (sel === 'all') return 'all';
    if (Array.isArray(sel)) {
      if (sel.length === 0) return 'none';
      if (sel.length >= subtasks.length && subtasks.every(st => sel.includes(st.id))) return 'all';
      return 'partial';
    }
    return 'none';
  };

  const getFocusedSubtasks = (act: Activity): SubTask[] => {
    const allSubtasks = act.subtasks || [];
    if (allSubtasks.length === 0) return [];
    const sel = pinnedSubtaskMap[act.id];
    if (!sel || sel === 'all') return allSubtasks;
    if (Array.isArray(sel)) {
      return allSubtasks.filter(st => sel.includes(st.id));
    }
    return allSubtasks;
  };

  const isSubtaskPinned = (actId: string, subtaskId: string): boolean => {
    const sel = pinnedSubtaskMap[actId];
    if (!sel) return false;
    if (sel === 'all') return true;
    return Array.isArray(sel) && sel.includes(subtaskId);
  };

  // Pinned Activities on this shift
  const pinnedActivities = useMemo(() => {
    return activities.filter(a => isActivityPinned(a.id));
  }, [activities, pinnedSubtaskMap]);

  // All active focused subtasks across all pinned activities
  const allPinnedSubtasks = useMemo(() => {
    const list: { activity: Activity; subtask: SubTask; index: number; originalIndex: number }[] = [];
    pinnedActivities.forEach(act => {
      const allSt = act.subtasks || [];
      const focused = getFocusedSubtasks(act);
      focused.forEach((st, idx) => {
        const origIdx = allSt.findIndex(s => s.id === st.id);
        list.push({
          activity: act,
          subtask: st,
          index: idx,
          originalIndex: origIdx >= 0 ? origIdx : idx
        });
      });
    });
    return list;
  }, [pinnedActivities, pinnedSubtaskMap]);

  // Unique disciplines in activities
  const uniqueDisciplines = useMemo(() => {
    const set = new Set<string>();
    activities.forEach(a => {
      if (a.discipline) set.add(a.discipline);
    });
    return Array.from(set);
  }, [activities]);

  // -------------------------------------------------------------
  // 4. Card Accordion & Inline Subtask Drawer States
  // -------------------------------------------------------------
  const [collapsedActivityIds, setCollapsedActivityIds] = useState<string[]>([]);
  const [editingFocusActivityId, setEditingFocusActivityId] = useState<string | null>(null);
  const [showAllSubtasksActivityIds, setShowAllSubtasksActivityIds] = useState<string[]>([]);

  const handleToggleCollapseActivity = (activityId: string) => {
    setCollapsedActivityIds(prev => 
      prev.includes(activityId) ? prev.filter(id => id !== activityId) : [...prev, activityId]
    );
  };

  const handleToggleCollapseAll = () => {
    if (collapsedActivityIds.length === pinnedActivities.length) {
      setCollapsedActivityIds([]);
    } else {
      setCollapsedActivityIds(pinnedActivities.map(a => a.id));
    }
  };

  const handleToggleShowAllSubtasks = (activityId: string) => {
    setShowAllSubtasksActivityIds(prev =>
      prev.includes(activityId) ? prev.filter(id => id !== activityId) : [...prev, activityId]
    );
  };

  // -------------------------------------------------------------
  // 5. Shift Site Conditions & Sign-Off State
  // -------------------------------------------------------------
  const [weatherCondition, setWeatherCondition] = useState<'Sunny' | 'Cloudy' | 'Rainy' | 'Windy'>('Sunny');
  const [temperature, setTemperature] = useState<string>('24°C');
  const [siteConditions, setSiteConditions] = useState<string>('Dry, clear access across all working zones');
  const [shiftRemarks, setShiftRemarks] = useState<string>('');
  const [voiceRemarks, setVoiceRemarks] = useState<string[]>([]);
  const [newVoiceNoteText, setNewVoiceNoteText] = useState<string>('');
  const [supervisorSigner, setSupervisorSigner] = useState<string>(
    currentUserProfile?.name 
      ? `${currentUserProfile.name} (${currentUserProfile.role || 'Site Supervisor'})`
      : 'Site Supervisor / Shift Engineer'
  );
  const [isSignedOffToday, setIsSignedOffToday] = useState<boolean>(false);
  const [signedOffTimestamp, setSignedOffTimestamp] = useState<string>('');

  // -------------------------------------------------------------
  // 6. Pin Selection Modal State
  // -------------------------------------------------------------
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinModalSearch, setPinModalSearch] = useState('');
  const [pinModalDiscipline, setPinModalDiscipline] = useState('all');
  const [pinModalFilterTab, setPinModalFilterTab] = useState<'all' | 'focused' | 'partial' | 'scheduled'>('all');
  const [expandedModalActivityIds, setExpandedModalActivityIds] = useState<string[]>([]);

  const handleToggleModalActivityExpand = (activityId: string) => {
    setExpandedModalActivityIds(prev =>
      prev.includes(activityId) ? prev.filter(id => id !== activityId) : [...prev, activityId]
    );
  };

  // Auto-expand activities that match subtask searches in the modal
  useEffect(() => {
    if (pinModalSearch.trim()) {
      const q = pinModalSearch.toLowerCase();
      const matchIds = activities
        .filter(a => (a.subtasks || []).some(s => s.title.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)))
        .map(a => a.id);
      if (matchIds.length > 0) {
        setExpandedModalActivityIds(prev => Array.from(new Set([...prev, ...matchIds])));
      }
    }
  }, [pinModalSearch, activities]);

  // -------------------------------------------------------------
  // 7. QA Hold Point Sign-Off Modal State
  // -------------------------------------------------------------
  const [signingOffSubtask, setSigningOffSubtask] = useState<{ activityId: string; subtask: SubTask } | null>(null);
  const [qaInspectorName, setQaInspectorName] = useState<string>(currentUserProfile?.name || 'QA/QC Engineer');
  const [qaNotes, setQaNotes] = useState<string>('');

  // -------------------------------------------------------------
  // 8. Aggregate Shift Metrics
  // -------------------------------------------------------------
  const totalPinnedCount = pinnedActivities.length;
  const completedPinnedCount = pinnedActivities.filter(a => a.status === 'Completed').length;
  const inProgressPinnedCount = pinnedActivities.filter(a => a.status === 'In Progress').length;
  
  const completedSubtasksToday = allPinnedSubtasks.filter(item => item.subtask.status === 'Completed').length;
  const holdPointsToday = allPinnedSubtasks.filter(item => item.subtask.isHoldPoint);
  const verifiedHoldPointsToday = holdPointsToday.filter(item => item.subtask.holdPointSignOff?.approved).length;

  const totalShiftLabourHours = useMemo(() => {
    let total = 0;
    pinnedActivities.forEach(act => {
      const norm = normalizeLabourAssignments(act.assignedLabour, employees);
      total += norm.reduce((acc, l) => acc + (Number(l.hours) || 8), 0);
    });
    return total;
  }, [pinnedActivities, employees]);

  const totalShiftPlantCount = useMemo(() => {
    let count = 0;
    pinnedActivities.forEach(act => {
      count += (act.assignedEquipment || []).length;
    });
    return count;
  }, [pinnedActivities]);

  // -------------------------------------------------------------
  // 9. Interactive Pinning Handlers (Activity & Subtask Level)
  // -------------------------------------------------------------
  // Toggle Whole Activity
  const handleToggleActivity = (actId: string) => {
    setPinnedSubtaskMap(prev => {
      const copy = { ...prev };
      if (copy[actId]) {
        delete copy[actId];
      } else {
        copy[actId] = 'all';
      }
      return copy;
    });
  };

  // Select all subtasks for an activity
  const handleSelectAllSubtasksForActivity = (actId: string) => {
    setPinnedSubtaskMap(prev => ({
      ...prev,
      [actId]: 'all'
    }));
  };

  // Clear focus for an activity
  const handleClearActivitySelection = (actId: string) => {
    setPinnedSubtaskMap(prev => {
      const copy = { ...prev };
      delete copy[actId];
      return copy;
    });
  };

  // Granular Subtask Toggle
  const handleToggleSubtaskSelection = (actId: string, subtaskId: string) => {
    const act = activities.find(a => a.id === actId);
    if (!act) return;
    const allSubtasks = act.subtasks || [];

    setPinnedSubtaskMap(prev => {
      const current = prev[actId];
      const copy = { ...prev };

      if (!current) {
        // Activity was not pinned -> pin with only this single subtask
        copy[actId] = [subtaskId];
        return copy;
      }

      if (current === 'all') {
        // Was 'all', now unchecking one leaves the others selected
        const remaining = allSubtasks.filter(s => s.id !== subtaskId).map(s => s.id);
        if (remaining.length === 0) {
          delete copy[actId];
        } else {
          copy[actId] = remaining;
        }
        return copy;
      }

      if (Array.isArray(current)) {
        if (current.includes(subtaskId)) {
          const remaining = current.filter(id => id !== subtaskId);
          if (remaining.length === 0) {
            delete copy[actId];
          } else {
            copy[actId] = remaining;
          }
        } else {
          const updated = [...current, subtaskId];
          if (allSubtasks.length > 0 && updated.length >= allSubtasks.length && allSubtasks.every(s => updated.includes(s.id))) {
            copy[actId] = 'all';
          } else {
            copy[actId] = updated;
          }
        }
        return copy;
      }

      return copy;
    });
  };

  // Auto-Pin Scheduled
  const handleAutoPinScheduled = () => {
    const activeItems = activities.filter(a => {
      if (a.startDate && a.finishDate) {
        return selectedDate >= a.startDate && selectedDate <= a.finishDate;
      }
      return a.status === 'In Progress' || a.status === 'Ready';
    });

    if (activeItems.length === 0) {
      const inProg = activities.filter(a => a.status === 'In Progress');
      const newMap: Record<string, 'all' | string[]> = {};
      inProg.forEach(a => { newMap[a.id] = 'all'; });
      setPinnedSubtaskMap(newMap);
      alert('No activities with scheduled dates found for this date. Pinned all in-progress activities.');
    } else {
      const newMap: Record<string, 'all' | string[]> = {};
      activeItems.forEach(a => { newMap[a.id] = 'all'; });
      setPinnedSubtaskMap(newMap);
    }
  };

  const handleClearAllPins = () => {
    setPinnedSubtaskMap({});
  };

  // Inline Subtask Quantity Updater
  const handleUpdateSubtaskQuantity = (activityId: string, subtaskId: string, newQty: number) => {
    const act = activities.find(a => a.id === activityId);
    if (!act) return;

    const subtasks = act.subtasks || [];
    const updatedSubtasks = subtasks.map(s => {
      if (s.id === subtaskId) {
        const clampedQty = Math.max(0, s.targetQuantity ? Math.min(s.targetQuantity, newQty) : newQty);
        const isComplete = s.targetQuantity ? clampedQty >= s.targetQuantity : s.status === 'Completed';
        return {
          ...s,
          completedQuantity: clampedQty,
          status: (isComplete ? 'Completed' : clampedQty > 0 ? 'In Progress' : 'Not Started') as SubTask['status']
        };
      }
      return s;
    });

    const completed = updatedSubtasks.filter(s => s.status === 'Completed').length;
    const calcProgress = updatedSubtasks.length > 0 ? Math.round((completed / updatedSubtasks.length) * 100) : act.progress;
    const calcStatus: ActivityStatus = calcProgress === 100 ? 'Completed' : calcProgress > 0 ? 'In Progress' : act.status;

    const updatedAct: Activity = {
      ...act,
      subtasks: updatedSubtasks,
      progress: calcProgress,
      status: calcStatus,
      updatedAt: selectedDate
    };

    updateActivity(updatedAct);
  };

  // Inline Subtask Status Toggle
  const handleToggleSubtaskStatus = (activityId: string, subtaskId: string) => {
    const act = activities.find(a => a.id === activityId);
    if (!act) return;

    const subtasks = act.subtasks || [];
    const target = subtasks.find(s => s.id === subtaskId);
    if (!target) return;

    // Check if QA Hold point needs sign-off first
    if (target.isHoldPoint && !target.holdPointSignOff?.approved && target.status !== 'Completed') {
      setSigningOffSubtask({ activityId, subtask: target });
      return;
    }

    const nextStatus: SubTask['status'] = 
      target.status === 'Completed' ? 'In Progress' : 'Completed';

    const updatedSubtasks = subtasks.map(s => {
      if (s.id === subtaskId) {
        return {
          ...s,
          status: nextStatus,
          completedQuantity: nextStatus === 'Completed' ? (s.targetQuantity || s.completedQuantity || 1) : s.completedQuantity
        };
      }
      return s;
    });

    const completed = updatedSubtasks.filter(s => s.status === 'Completed').length;
    const calcProgress = updatedSubtasks.length > 0 ? Math.round((completed / updatedSubtasks.length) * 100) : act.progress;
    const calcStatus: ActivityStatus = calcProgress === 100 ? 'Completed' : calcProgress > 0 ? 'In Progress' : act.status;

    const updatedAct: Activity = {
      ...act,
      subtasks: updatedSubtasks,
      progress: calcProgress,
      status: calcStatus,
      updatedAt: selectedDate
    };

    updateActivity(updatedAct);
  };

  // QA Hold Point Formal Sign-off
  const handleConfirmQaSignOff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signingOffSubtask) return;

    const { activityId, subtask } = signingOffSubtask;
    const act = activities.find(a => a.id === activityId);
    if (!act) return;

    const updatedSubtasks = (act.subtasks || []).map(s => {
      if (s.id === subtask.id) {
        return {
          ...s,
          status: 'Completed' as SubTask['status'],
          completedQuantity: s.targetQuantity || s.completedQuantity || 1,
          holdPointSignOff: {
            signedBy: qaInspectorName.trim() || 'QA/QC Engineer',
            signedAt: new Date().toISOString(),
            approved: true,
            signatureNote: qaNotes.trim() || 'Passed QA Hold Point Inspection for Daily Shift'
          }
        };
      }
      return s;
    });

    const completed = updatedSubtasks.filter(s => s.status === 'Completed').length;
    const calcProgress = updatedSubtasks.length > 0 ? Math.round((completed / updatedSubtasks.length) * 100) : act.progress;

    const updatedAct: Activity = {
      ...act,
      subtasks: updatedSubtasks,
      progress: calcProgress,
      status: calcProgress === 100 ? 'Completed' : 'In Progress',
      updatedAt: selectedDate
    };

    updateActivity(updatedAct);

    addAuditLog({
      id: `AL-QA-${Date.now()}`,
      projectId: act.projectId,
      userId: qaInspectorName.trim(),
      action: 'QA Hold Point Cleared',
      details: `QA Inspector "${qaInspectorName}" approved hold point on Subtask "${subtask.title}" (${act.name})`,
      timestamp: new Date().toISOString()
    });

    setSigningOffSubtask(null);
    setQaNotes('');
  };

  // Add Quick Voice Memo / Remark
  const handleAddVoiceRemark = () => {
    if (!newVoiceNoteText.trim()) return;
    const entry = `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ${newVoiceNoteText.trim()}`;
    setVoiceRemarks(prev => [...prev, entry]);
    setNewVoiceNoteText('');
  };

  // Digital Shift Sign-off & Lock Daily Report
  const handleSignOffShift = () => {
    if (!supervisorSigner.trim()) {
      alert('Please enter the supervisor or engineer name for digital sign-off.');
      return;
    }

    const reportId = `DREP-SHIFT-${selectedDate}-${Date.now().toString().slice(-4)}`;
    const timestamp = new Date().toISOString();

    const focusedActivitiesSummary = pinnedActivities.map(a => {
      const focused = getFocusedSubtasks(a);
      const isPartial = getActivitySelectionState(a) === 'partial';
      return `${a.name} (${a.id})${isPartial ? ` [${focused.length}/${(a.subtasks || []).length} subtasks focused]` : ''}`;
    });

    // Prepare Daily Report payload
    const dailyReportData: DailyReport = {
      id: reportId,
      projectId: pinnedActivities[0]?.projectId || projects[0]?.id || 'PROJ-01',
      date: selectedDate,
      submittedBy: supervisorSigner.trim(),
      weather: weatherCondition,
      temperature: temperature,
      siteConditions: siteConditions,
      activitiesWorked: pinnedActivities.map(a => a.id),
      activitiesLogged: focusedActivitiesSummary,
      subtasksCompleted: allPinnedSubtasks.filter(item => item.subtask.status === 'Completed').map(item => item.subtask.id),
      delaysOrIssues: shiftRemarks ? [shiftRemarks] : [],
      generalNotes: `Verified ${pinnedActivities.length} activities with ${allPinnedSubtasks.length} active focused subtasks (${completedSubtasksToday} completed today, ${verifiedHoldPointsToday}/${holdPointsToday.length} QA quality gates cleared).`,
      labourLogged: pinnedActivities.flatMap(a => 
        (a.assignedLabour || []).map(l => ({
          name: l.name,
          role: l.role || 'Site Worker',
          hours: l.hours || 8
        }))
      ),
      equipmentLogged: pinnedActivities.flatMap(a => 
        (a.assignedEquipment || []).map(e => ({
          equipmentId: e.equipmentId,
          hours: e.hours || 8,
          status: 'Operating'
        }))
      ),
      createdAt: timestamp,
      status: 'Approved'
    };

    if (addReport) {
      addReport(dailyReportData);
    }

    addAuditLog({
      id: `AL-SHIFT-${Date.now()}`,
      projectId: dailyReportData.projectId,
      userId: supervisorSigner.trim(),
      action: 'Daily Shift Log Verified & Locked',
      details: `Supervisor "${supervisorSigner}" verified and signed off Daily Shift Log for ${selectedDate} with ${pinnedActivities.length} activities (${allPinnedSubtasks.length} subtasks in focus).`,
      timestamp: timestamp
    });

    setIsSignedOffToday(true);
    setSignedOffTimestamp(timestamp);
    alert(`✓ Daily Shift Log for ${formattedDateHeader} has been verified, digitally signed, and posted as Official Daily Report #${reportId}!`);
  };

  // -------------------------------------------------------------
  // 10. Vector PDF Daily Shift Report Generator
  // -------------------------------------------------------------
  const handleExportPdf = async () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 36;
      const contentWidth = pageWidth - margin * 2;

      const brandBlue: [number, number, number] = [11, 95, 255];     // #0B5FFF
      const darkNavy: [number, number, number] = [15, 23, 42];       // slate-900
      const slateMuted: [number, number, number] = [100, 116, 139];   // slate-500
      const cardBg: [number, number, number] = [248, 250, 252];       // slate-50
      const borderColor: [number, number, number] = [226, 232, 240]; // slate-200
      const emeraldColor: [number, number, number] = [5, 150, 105];  // emerald-600
      const roseColor: [number, number, number] = [225, 29, 72];     // rose-600

      // Corporate Header Banner
      doc.setFillColor(brandBlue[0], brandBlue[1], brandBlue[2]);
      doc.rect(0, 0, pageWidth, 54, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('SCEDIH ENTERPRISE', margin, 24);

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Daily Operations Shift Log & Progress Verification Report', margin, 41);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text('OFFICIAL SITE DIARY', pageWidth - margin - 150, 24);
      doc.setFont('helvetica', 'normal');
      doc.text(`Shift Date: ${selectedDate}`, pageWidth - margin - 150, 41);

      let currentY = 74;

      // Project & Shift Banner
      doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(`Daily Shift Verification Record — ${formattedDateHeader}`, margin, currentY);

      currentY += 16;
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      doc.text(
        `Weather: ${weatherCondition} (${temperature})   |   Site Status: ${siteConditions}   |   Supervisor: ${supervisorSigner}`,
        margin,
        currentY
      );

      currentY += 16;
      // 4 Key Metric Badges
      const cardW = (contentWidth - 24) / 4;
      const kpis = [
        { label: 'PINNED ACTIVITIES', val: `${totalPinnedCount}`, color: brandBlue },
        { label: 'FOCUSED SUBTASKS', val: `${completedSubtasksToday} / ${allPinnedSubtasks.length}`, color: emeraldColor },
        { label: 'QA GATES VERIFIED', val: `${verifiedHoldPointsToday} / ${holdPointsToday.length}`, color: roseColor },
        { label: 'SHIFT LABOUR HOURS', val: `${totalShiftLabourHours} hrs`, color: [14, 116, 144] as [number, number, number] }
      ];

      kpis.forEach((kpi, idx) => {
        const x = margin + idx * (cardW + 8);
        doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.roundedRect(x, currentY, cardW, 36, 4, 4, 'FD');

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
        doc.text(kpi.label, x + 6, currentY + 11);

        doc.setFontSize(11);
        doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        doc.text(kpi.val, x + 6, currentY + 26);
      });

      currentY += 48;

      // Pinned Activities & Subtasks Table
      const tableHeaders = [
        ['Activity / Subtask Seq', 'Discipline & Scope', 'Target / Qty Logged', 'Hold Point', 'Assigned Personnel', 'Shift Progress']
      ];

      const tableData: string[][] = [];

      pinnedActivities.forEach(act => {
        const allSt = act.subtasks || [];
        const focused = getFocusedSubtasks(act);
        const isPartial = getActivitySelectionState(act) === 'partial';

        tableData.push([
          `▶ [${act.id}] ${act.name}${isPartial ? ` (Focus: ${focused.length}/${allSt.length} subtasks)` : ''}`,
          `${act.discipline || 'General'} | Span: ${act.sectionSpan || 'Full Span'}`,
          `${act.actualQuantity ?? 0} / ${act.targetQuantity ?? 0} ${act.unit || 'units'}`,
          '—',
          (act.assignedLabour || []).map(l => l.name).join(', ') || 'Unassigned',
          `${act.progress || 0}%  (${act.status})`
        ]);

        focused.forEach((st) => {
          const origIdx = allSt.findIndex(s => s.id === st.id);
          const progNum = getSubtaskProgressionNumber(allSt, origIdx >= 0 ? origIdx : 0);
          const holdText = st.isHoldPoint
            ? st.holdPointSignOff?.approved ? `✓ QA Approved (${st.holdPointSignOff.signedBy})` : '🔒 QA Gate'
            : '—';

          tableData.push([
            `    ${progNum}  ${st.title}`,
            st.category,
            st.targetQuantity ? `${st.completedQuantity || 0}/${st.targetQuantity} ${st.unit}` : st.status,
            holdText,
            (st.assignedWorkers && st.assignedWorkers.length > 0) ? st.assignedWorkers.join(', ') : st.assignedPerson || '—',
            st.status === 'Completed' ? '100% (Done)' : st.status === 'In Progress' ? 'In Progress' : 'Pending'
          ]);
        });
      });

      autoTable(doc, {
        startY: currentY,
        head: tableHeaders,
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: brandBlue,
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          cellPadding: 5
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59],
          cellPadding: 4
        },
        columnStyles: {
          0: { cellWidth: 160, fontStyle: 'bold' },
          1: { cellWidth: 100 },
          2: { cellWidth: 75, halign: 'center' },
          3: { cellWidth: 80, fontSize: 7 },
          4: { cellWidth: 95 },
          5: { cellWidth: 70, fontStyle: 'bold', halign: 'center' }
        },
        margin: { left: margin, right: margin },
        didParseCell: (data) => {
          if (data.section === 'body') {
            const firstCell = String(data.row.cells[0]?.raw || '');
            if (firstCell.startsWith('▶')) {
              data.cell.styles.fillColor = [238, 242, 255]; // Light indigo header row for activity
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 16;

      // Site Remarks & Sign-off Block
      if (currentY > doc.internal.pageSize.getHeight() - 100) {
        doc.addPage();
        currentY = 40;
      }

      // Authorization Signature Box
      const signBoxWidth = contentWidth;
      doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.roundedRect(margin, currentY, signBoxWidth, 58, 4, 4, 'FD');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      doc.text('SHIFT VERIFICATION & DIGITAL SUPERVISOR AUTHORIZATION', margin + 8, currentY + 12);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
      doc.text(`Authorized Site Supervisor: ${supervisorSigner}`, margin + 8, currentY + 25);
      doc.text(`Status: ${isSignedOffToday ? 'DIGITALLY VERIFIED & LOCKED' : 'RECORDED ON SHIFT'}   |   Timestamp: ${signedOffTimestamp || new Date().toLocaleString()}`, margin + 8, currentY + 37);
      doc.text(`Site Notes: ${shiftRemarks || siteConditions}`, margin + 8, currentY + 49);

      // Page Footers
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
        doc.text(
          `Scedih Enterprise Site Diary  |  Shift Date: ${selectedDate}  |  Generated ${new Date().toLocaleDateString()}`,
          margin,
          doc.internal.pageSize.getHeight() - 15
        );
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 40, doc.internal.pageSize.getHeight() - 15);
      }

      const blob = doc.output('blob');
      await saveOrShareFile({
        filename: `daily_shift_log_${selectedDate}.pdf`,
        blob,
        title: `Daily Shift Log - ${selectedDate}`,
        text: `Scedih Daily Shift Log for ${selectedDate}`
      });
    } catch (err) {
      console.error('Failed to export daily shift PDF:', err);
      alert('Error generating Daily Shift PDF document.');
    }
  };

  // -------------------------------------------------------------
  // Render
  // -------------------------------------------------------------
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1. Date Navigation & Global Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900/90 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Date Selector Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all"
              title="Previous Day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1">
              <Calendar className="h-4 w-4 text-[#0B5FFF]" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-transparent font-bold text-xs sm:text-sm text-slate-900 dark:text-white outline-none cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={handleNextDay}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all"
              title="Next Day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {!isToday && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGoToToday}
              className="rounded-xl text-xs h-9 gap-1 text-[#0B5FFF] border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Today
            </Button>
          )}

          <Badge variant="outline" className="text-xs font-semibold hidden md:inline-flex">
            {formattedDateHeader}
          </Badge>
        </div>

        {/* Pinning & Export Actions */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutoPinScheduled}
            className="rounded-xl text-xs h-9 gap-1.5 border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
            title="Automatically pin activities scheduled for today"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Auto-Pin Scheduled</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setIsPinModalOpen(true)}
            className="rounded-xl text-xs h-9 gap-1.5 bg-[#0B5FFF] hover:bg-blue-600 text-white shadow-xs font-bold"
          >
            <Pin className="h-3.5 w-3.5" />
            <span>Pin Tasks ({pinnedActivities.length})</span>
            {allPinnedSubtasks.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                {allPinnedSubtasks.length} subtasks
              </span>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPdfModalOpen(true)}
            className="rounded-xl text-xs h-9 gap-1.5 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 font-semibold shadow-2xs"
            title="Open Interactive Shift PDF Report Builder & Print Engine"
          >
            <Printer className="h-3.5 w-3.5 text-[#0B5FFF]" />
            <span className="hidden sm:inline">Shift PDF / Print</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Shift KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pinned Activities</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{totalPinnedCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{completedPinnedCount} completed</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Subtasks Active</p>
          <p className="text-xl font-black text-[#0B5FFF] mt-1">{allPinnedSubtasks.length}</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">{completedSubtasksToday} done today</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">QA Hold Points</p>
          <p className="text-xl font-black text-rose-600 mt-1">{verifiedHoldPointsToday}/{holdPointsToday.length}</p>
          <p className="text-[10px] text-rose-500 font-bold mt-0.5">
            {holdPointsToday.length - verifiedHoldPointsToday > 0 ? `${holdPointsToday.length - verifiedHoldPointsToday} pending gate` : 'All cleared'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Workforce Hours</p>
          <p className="text-xl font-black text-amber-600 mt-1">{totalShiftLabourHours}h</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Assigned to pinned</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Plant Allocated</p>
          <p className="text-xl font-black text-blue-600 mt-1">{totalShiftPlantCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Machines operating</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Weather & Site</p>
          <div className="flex items-center gap-1.5 mt-1">
            {weatherCondition === 'Sunny' ? <Sun className="h-4 w-4 text-amber-500" /> :
             weatherCondition === 'Cloudy' ? <Cloud className="h-4 w-4 text-slate-400" /> :
             weatherCondition === 'Rainy' ? <CloudRain className="h-4 w-4 text-blue-500" /> :
             <Wind className="h-4 w-4 text-cyan-500" />}
            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{temperature}</span>
            <span className="text-[10px] text-slate-500">({weatherCondition})</span>
          </div>
          <p className="text-[9px] text-emerald-600 font-bold truncate mt-0.5">{siteConditions}</p>
        </div>
      </div>

      {/* 3. Pinned Tasks Daily Verification Ledger */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Pin className="h-4 w-4 text-[#0B5FFF]" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Today's Pinned Focus & Deliverable Verification
            </h3>
            <Badge variant="outline" className="text-xs font-mono">
              {pinnedActivities.length} Activities
            </Badge>
            {allPinnedSubtasks.length > 0 && (
              <Badge variant="outline" className="text-xs font-mono bg-blue-50/50 text-[#0B5FFF] border-blue-200 dark:border-blue-900">
                {allPinnedSubtasks.length} Subtasks Active
              </Badge>
            )}
          </div>

          {pinnedActivities.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleToggleCollapseAll}
                className="text-xs rounded-xl h-8 px-2.5 gap-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {collapsedActivityIds.length === pinnedActivities.length ? (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" /> Expand All
                  </>
                ) : (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" /> Collapse All
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={handleClearAllPins}
                className="text-xs text-slate-400 hover:text-rose-500 transition-colors ml-1"
              >
                Clear All Pinned
              </button>
            </div>
          )}
        </div>

        {pinnedActivities.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900/60 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#0B5FFF] flex items-center justify-center mx-auto">
              <Pin className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Activities or Subtasks Pinned for this Shift</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Pick entire activities or specific individual subtasks scheduled for today's work to record precise progress deltas, verify QA hold points, and log labour.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button
                type="button"
                onClick={handleAutoPinScheduled}
                variant="outline"
                className="text-xs rounded-xl gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Auto-Pin Scheduled Tasks
              </Button>
              <Button
                type="button"
                onClick={() => setIsPinModalOpen(true)}
                className="text-xs rounded-xl bg-[#0B5FFF] hover:bg-blue-600 text-white gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Select Activities & Subtasks
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {pinnedActivities.map(act => {
              const allSubtasks = act.subtasks || [];
              const focusedSubtasks = getFocusedSubtasks(act);
              const selectionState = getActivitySelectionState(act);
              const isPartial = selectionState === 'partial';
              const isEditingFocus = editingFocusActivityId === act.id;
              const isShowingAll = showAllSubtasksActivityIds.includes(act.id);
              
              const displayedSubtasks = isShowingAll ? allSubtasks : focusedSubtasks;

              const actLabour = normalizeLabourAssignments(act.assignedLabour, employees);
              const actEquipment = act.assignedEquipment || [];
              const isCollapsed = collapsedActivityIds.includes(act.id);
              
              const completedCountInFocus = focusedSubtasks.filter(s => s.status === 'Completed').length;
              const pendingHoldPointsInFocus = focusedSubtasks.filter(s => s.isHoldPoint && !s.holdPointSignOff?.approved).length;

              return (
                <div 
                  key={act.id}
                  className={`bg-white dark:bg-slate-900 rounded-3xl border shadow-sm overflow-hidden transition-all ${
                    isPartial 
                      ? 'border-indigo-200 dark:border-indigo-900/60' 
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Activity Top Header Strip - Clickable to Collapse */}
                  <div 
                    onClick={() => handleToggleCollapseActivity(act.id)}
                    className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/80 transition-colors select-none"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActivity(act.id);
                        }}
                        className="mt-1 p-1 rounded-lg text-[#0B5FFF] hover:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                        title="Unpin this activity from shift"
                      >
                        <Pin className="h-4 w-4 fill-blue-500" />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black text-[#0B5FFF]">
                            {act.id}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {act.discipline || 'General'}
                          </span>
                          {act.sectionSpan && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                              Span: {act.sectionSpan}
                            </span>
                          )}

                          {/* Granular Focus Badge */}
                          {isPartial ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                              <Target className="h-3 w-3 text-amber-600" />
                              Targeted Focus: {focusedSubtasks.length} of {allSubtasks.length} Subtasks
                            </span>
                          ) : allSubtasks.length > 0 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF] border border-blue-200 dark:border-blue-800">
                              All Subtasks ({allSubtasks.length})
                            </span>
                          ) : null}

                          {isCollapsed && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                              {completedCountInFocus} / {focusedSubtasks.length} Focused Done
                            </span>
                          )}

                          {isCollapsed && pendingHoldPointsInFocus > 0 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
                              🔒 {pendingHoldPointsInFocus} QA Gate Pending
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mt-1 truncate">
                          {act.name}
                        </h4>
                      </div>
                    </div>

                    {/* Progress Percentage, Subtask Focus Button & Collapse Chevron */}
                    <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                      {/* Inline Subtask Focus Quick Editor Trigger */}
                      {allSubtasks.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFocusActivityId(isEditingFocus ? null : act.id);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                            isEditingFocus 
                              ? 'bg-blue-600 text-white shadow-xs' 
                              : isPartial 
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 hover:bg-amber-200 border border-amber-300 dark:border-amber-800'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                          title="Select specific subtasks to track for this shift"
                        >
                          <SlidersHorizontal className="h-3 w-3" />
                          <span className="hidden md:inline">Focus Subtasks</span>
                          <span className="md:hidden">Focus</span>
                        </button>
                      )}

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">Overall Activity</span>
                        <span className="text-xs font-black text-[#0B5FFF]">{act.progress || 0}%</span>
                      </div>

                      <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden hidden sm:block">
                        <div 
                          className="h-full bg-[#0B5FFF] rounded-full transition-all duration-300"
                          style={{ width: `${act.progress || 0}%` }}
                        />
                      </div>

                      {onOpenActivityDetail && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenActivityDetail(act);
                          }}
                          className="h-8 text-xs rounded-xl gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        >
                          <Eye className="h-3.5 w-3.5" /> <span className="hidden md:inline">Full Detail</span>
                        </Button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCollapseActivity(act.id);
                        }}
                        className="p-1.5 rounded-xl hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-transform"
                        title={isCollapsed ? "Expand Activity Subtasks" : "Collapse Activity Subtasks"}
                      >
                        {isCollapsed ? (
                          <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        ) : (
                          <ChevronUp className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Inline Subtask Focus Quick Editor Drawer (Visible when editing focus) */}
                  {isEditingFocus && (
                    <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/60 animate-in fade-in space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-indigo-600" />
                          <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                            Select active subtasks for this shift ({focusedSubtasks.length}/{allSubtasks.length} active)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSelectAllSubtasksForActivity(act.id)}
                            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingFocusActivityId(null)}
                            className="text-[11px] font-bold text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded bg-indigo-200/60 dark:bg-indigo-900/60 hover:bg-indigo-300"
                          >
                            Done
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {allSubtasks.map((st, sIdx) => {
                          const isPinned = isSubtaskPinned(act.id, st.id);
                          const progNum = getSubtaskProgressionNumber(allSubtasks, sIdx);
                          return (
                            <label
                              key={st.id}
                              className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all select-none ${
                                isPinned
                                  ? 'bg-white dark:bg-slate-900 border-indigo-400 shadow-2xs font-bold text-indigo-950 dark:text-indigo-100'
                                  : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isPinned}
                                onChange={() => handleToggleSubtaskSelection(act.id, st.id)}
                                className="rounded text-[#0B5FFF] focus:ring-[#0B5FFF] h-3.5 w-3.5"
                              />
                              <span className="font-mono text-[10px] text-slate-400">{progNum}</span>
                              <span className="truncate flex-1">{st.title}</span>
                              {st.isHoldPoint && <span className="text-[10px]" title="QA Hold Point">🔒</span>}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Subtasks Progression & Verification List (Visible when not collapsed) */}
                  {!isCollapsed && (
                    <div className="p-4 sm:p-5 space-y-3 animate-in fade-in duration-150">
                      {/* Subtasks header bar with Filter Toggle */}
                      {allSubtasks.length > 0 && (
                        <div className="flex items-center justify-between text-xs text-slate-500 pb-1 flex-wrap gap-2">
                          <div className="flex items-center gap-1.5">
                            <ListTodo className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {isShowingAll 
                                ? `Showing all ${allSubtasks.length} subtasks (${focusedSubtasks.length} active in today's shift)` 
                                : isPartial 
                                ? `Showing ${focusedSubtasks.length} targeted subtasks for today's shift`
                                : `All ${allSubtasks.length} subtasks active for today's shift`}
                            </span>
                          </div>

                          {isPartial && (
                            <button
                              type="button"
                              onClick={() => handleToggleShowAllSubtasks(act.id)}
                              className="text-[11px] font-bold text-[#0B5FFF] hover:underline"
                            >
                              {isShowingAll ? 'Show focused only' : `Show all (${allSubtasks.length})`}
                            </button>
                          )}
                        </div>
                      )}

                      {displayedSubtasks.length === 0 ? (
                        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between flex-wrap gap-2">
                          <span>No subtasks currently selected for today's focus on this activity.</span>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSelectAllSubtasksForActivity(act.id)}
                            className="h-7 text-[11px] rounded-lg bg-[#0B5FFF] text-white"
                          >
                            Focus All Subtasks
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {displayedSubtasks.map((st) => {
                            const origIdx = allSubtasks.findIndex(s => s.id === st.id);
                            const progNum = getSubtaskProgressionNumber(allSubtasks, origIdx >= 0 ? origIdx : 0);
                            const isHoldPointPending = !!st.isHoldPoint && !st.holdPointSignOff?.approved;
                            const isFocusedOnShift = isSubtaskPinned(act.id, st.id);

                            let itemPercent = 0;
                            if (st.targetQuantity && st.targetQuantity > 0) {
                              itemPercent = Math.min(100, Math.round(((st.completedQuantity || 0) / st.targetQuantity) * 100));
                            } else {
                              itemPercent = st.status === 'Completed' ? 100 : st.status === 'In Progress' ? 50 : 0;
                            }

                            return (
                              <div
                                key={st.id}
                                className={`flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                                  !isFocusedOnShift
                                    ? 'bg-slate-50/40 dark:bg-slate-900/30 border-dashed border-slate-300 dark:border-slate-800 opacity-60'
                                    : st.status === 'Completed'
                                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40'
                                    : st.status === 'In Progress'
                                    ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/40'
                                    : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800'
                                } ${st.isHoldPoint ? 'border-l-4 border-l-rose-500' : ''}`}
                              >
                                {/* Left: Progression Number, Status Toggle, Title & Badges */}
                                <div className="flex items-center gap-2.5 min-w-0 flex-1 flex-wrap sm:flex-nowrap">
                                  <div 
                                    className={`h-6 min-w-[2.4rem] px-1.5 rounded-lg font-mono font-black text-[11px] flex items-center justify-center shrink-0 shadow-2xs ${
                                      st.status === 'Completed'
                                        ? 'bg-emerald-600 text-white'
                                        : st.status === 'In Progress'
                                        ? 'bg-[#0B5FFF] text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                    }`}
                                    title={`Progression Step ${progNum}`}
                                  >
                                    {progNum}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleSubtaskStatus(act.id, st.id)}
                                    className="shrink-0 transition-transform active:scale-95"
                                    title="Toggle Status / Sign Off"
                                  >
                                    {st.status === 'Completed' ? (
                                      <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-100 dark:fill-emerald-950/50" />
                                    ) : st.status === 'In Progress' ? (
                                      <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
                                    ) : isHoldPointPending ? (
                                      <Lock className="h-4 w-4 text-rose-500" />
                                    ) : (
                                      <div className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                                    )}
                                  </button>

                                  <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                                    <span className={`text-xs font-bold truncate max-w-[260px] sm:max-w-[340px] md:max-w-none ${st.status === 'Completed' ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                                      {st.title}
                                    </span>

                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
                                      {st.category}
                                    </span>

                                    {!isFocusedOnShift && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 shrink-0">
                                        Not in today's focus
                                      </span>
                                    )}

                                    {st.isHoldPoint && (
                                      st.holdPointSignOff?.approved ? (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 shrink-0">
                                          <ShieldCheck className="h-2.5 w-2.5 text-emerald-600" /> QA Approved: {st.holdPointSignOff.signedBy}
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => setSigningOffSubtask({ activityId: act.id, subtask: st })}
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 shrink-0 cursor-pointer"
                                        >
                                          <Lock className="h-2.5 w-2.5 text-rose-600" /> 🔒 Sign Off QA Gate
                                        </button>
                                      )
                                    )}
                                  </div>
                                </div>

                                {/* Right: Quantity Stepper & Direct Verification */}
                                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center flex-wrap sm:flex-nowrap">
                                  {st.targetQuantity ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateSubtaskQuantity(act.id, st.id, (st.completedQuantity || 0) - 1)}
                                        className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-[10px]"
                                        title="Decrease"
                                      >
                                        <Minus className="h-2.5 w-2.5" />
                                      </button>
                                      <input
                                        type="number"
                                        min="0"
                                        max={st.targetQuantity}
                                        value={st.completedQuantity || 0}
                                        onChange={(e) => handleUpdateSubtaskQuantity(act.id, st.id, Number(e.target.value))}
                                        className="w-12 h-6 text-center font-bold text-[11px] border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-[#0B5FFF]"
                                      />
                                      <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                                        / {st.targetQuantity} {st.unit}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateSubtaskQuantity(act.id, st.id, (st.completedQuantity || 0) + 1)}
                                        className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-900/60 hover:bg-blue-200 text-[#0B5FFF] flex items-center justify-center font-bold text-[10px]"
                                        title="Increase"
                                      >
                                        <Plus className="h-2.5 w-2.5" />
                                      </button>
                                    </div>
                                  ) : st.measurementType === 'Checklist' && st.checklist ? (
                                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                                      <ListChecks className="h-3 w-3 text-emerald-600" />
                                      {st.checklist.filter(c => c.completed).length}/{st.checklist.length} Steps Checked
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-medium">{st.status}</span>
                                  )}

                                  <div className="w-14 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shrink-0 hidden sm:block">
                                    <div 
                                      className={`h-full rounded-full transition-all ${itemPercent === 100 ? 'bg-emerald-500' : 'bg-[#0B5FFF]'}`}
                                      style={{ width: `${itemPercent}%` }} 
                                    />
                                  </div>
                                  <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 w-8 text-right shrink-0">
                                    {itemPercent}%
                                  </span>

                                  {/* Quick Pin/Unpin on unselected subtasks */}
                                  {!isFocusedOnShift && (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSubtaskSelection(act.id, st.id)}
                                      className="px-2 py-0.5 rounded bg-[#0B5FFF] hover:bg-blue-600 text-white text-[10px] font-bold flex items-center gap-1"
                                      title="Add to today's shift focus"
                                    >
                                      <Plus className="h-2.5 w-2.5" /> Add Focus
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Assigned Personnel & Machinery Strip */}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                            <HardHat className="h-3 w-3 text-amber-600" /> Workforce on Shift:
                          </span>
                          {actLabour.length > 0 ? (
                            actLabour.map((l, lIdx) => (
                              <span 
                                key={lIdx} 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold"
                                title={`${l.name} - ${l.role} (${l.hours || 8}h)`}
                              >
                                <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 text-[8px] flex items-center justify-center font-black">
                                  {getPersonInitials(l.name)}
                                </span>
                                {l.name} ({l.hours || 8}h)
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No workers assigned</span>
                          )}
                        </div>

                        {actEquipment.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                              <Truck className="h-3 w-3 text-blue-600" /> Machinery:
                            </span>
                            {actEquipment.map((e, eIdx) => (
                              <span key={eIdx} className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold">
                                {e.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Shift Site Conditions, Voice Notes & Remarks Box */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weather & Site Conditions Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            Environmental & Site Access Conditions
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Weather Condition</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['Sunny', 'Cloudy', 'Rainy', 'Windy'] as const).map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWeatherCondition(w)}
                    className={`py-1 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                      weatherCondition === w 
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-[#0B5FFF] text-[#0B5FFF]' 
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Temperature</label>
              <input
                type="text"
                value={temperature}
                onChange={e => setTemperature(e.target.value)}
                placeholder="e.g. 24°C"
                className="w-full h-8 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Ground & Site Accessibility Notes</label>
            <input
              type="text"
              value={siteConditions}
              onChange={e => setSiteConditions(e.target.value)}
              placeholder="e.g. Dry, clear access across all zones"
              className="w-full h-8 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
            />
          </div>
        </div>

        {/* Voice Memos & Field Remarks Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Mic className="h-3.5 w-3.5 text-[#0B5FFF]" />
            Site Observations, Delays & Audio Log
          </h4>

          <div className="flex gap-2">
            <input
              type="text"
              value={newVoiceNoteText}
              onChange={e => setNewVoiceNoteText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddVoiceRemark(); }}
              placeholder="Type or dictate a shift remark / delay note..."
              className="flex-1 h-8 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleAddVoiceRemark}
              className="h-8 text-xs rounded-xl bg-[#0B5FFF] text-white px-3"
            >
              Add Note
            </Button>
          </div>

          {voiceRemarks.length > 0 && (
            <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
              {voiceRemarks.map((note, idx) => (
                <div key={idx} className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700/60">
                  {note}
                </div>
              ))}
            </div>
          )}

          <div>
            <textarea
              rows={2}
              value={shiftRemarks}
              onChange={e => setShiftRemarks(e.target.value)}
              placeholder="Overall Shift Summary (Safety incidents, delays, material deliveries, general shift handover notes)..."
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
            />
          </div>
        </div>
      </div>

      {/* 5. Formal Shift Sign-Off & Verification Action Box */}
      <div className="p-6 bg-gradient-to-r from-blue-900 to-indigo-950 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-emerald-400" />
            <h4 className="font-bold text-base">End-of-Shift Digital Verification & Authorization</h4>
          </div>
          <p className="text-xs text-blue-200 max-w-xl leading-relaxed">
            Certify today's progress deltas, verified QA hold points, and labour hours for the {pinnedActivities.length} active activities and {allPinnedSubtasks.length} focused subtasks.
          </p>
          <div className="pt-1 flex items-center gap-2">
            <span className="text-xs text-blue-300">Supervisor:</span>
            <input
              type="text"
              value={supervisorSigner}
              onChange={e => setSupervisorSigner(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 text-xs font-bold text-white outline-none focus:border-white w-64"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportPdf}
            className="rounded-xl text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 gap-1.5 h-10 px-4"
          >
            <Download className="h-4 w-4" /> Export PDF
          </Button>

          <Button
            type="button"
            onClick={handleSignOffShift}
            className="rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 gap-2 h-10 px-5 shadow-lg"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Sign & Post Daily Report</span>
          </Button>
        </div>
      </div>

      {/* 6. Modal: Granular Pin Activities & Subtasks Selector */}
      {isPinModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsPinModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-[#0B5FFF] flex items-center justify-center shadow-2xs">
                  <Pin className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    Pin Activities & Specific Subtasks for Shift
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Select entire activities or check specific subtasks scheduled for {formattedDateHeader}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPinModalOpen(false)}
                className="h-8 w-8 p-0 rounded-lg text-slate-400"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Filter Search Bar & Discipline */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shrink-0">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by activity name, code, span, or subtask title..."
                    value={pinModalSearch}
                    onChange={e => setPinModalSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
                  />
                  {pinModalSearch && (
                    <button
                      type="button"
                      onClick={() => setPinModalSearch('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={pinModalDiscipline}
                  onChange={e => setPinModalDiscipline(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                >
                  <option value="all">All Disciplines</option>
                  {uniqueDisciplines.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Filter Tabs & Quick Action Buttons */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'all', label: `All (${activities.length})` },
                    { id: 'focused', label: `Focused (${pinnedActivities.length})` },
                    { id: 'partial', label: `Granular (${activities.filter(a => getActivitySelectionState(a) === 'partial').length})` },
                    { 
                      id: 'scheduled', 
                      label: `Scheduled Today (${activities.filter(a => a.startDate && a.finishDate && selectedDate >= a.startDate && selectedDate <= a.finishDate).length})` 
                    }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPinModalFilterTab(tab.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        pinModalFilterTab === tab.id
                          ? 'bg-[#0B5FFF] text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoPinScheduled}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3" /> Auto-Pin Scheduled
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleClearAllPins}
                    className="text-[11px] font-bold text-rose-500 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>

            {/* Activities & Subtasks Checklist Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activities
                .filter(a => {
                  if (pinModalDiscipline !== 'all' && (a.discipline || 'General') !== pinModalDiscipline) return false;
                  
                  if (pinModalFilterTab === 'focused' && !isActivityPinned(a.id)) return false;
                  if (pinModalFilterTab === 'partial' && getActivitySelectionState(a) !== 'partial') return false;
                  if (pinModalFilterTab === 'scheduled') {
                    if (!a.startDate || !a.finishDate || selectedDate < a.startDate || selectedDate > a.finishDate) return false;
                  }

                  if (pinModalSearch) {
                    const q = pinModalSearch.toLowerCase();
                    const matchAct = a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || (a.sectionSpan && a.sectionSpan.toLowerCase().includes(q));
                    const matchSubtask = (a.subtasks || []).some(s => s.title.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
                    return matchAct || matchSubtask;
                  }
                  return true;
                })
                .map(act => {
                  const subtasks = act.subtasks || [];
                  const selState = getActivitySelectionState(act);
                  const isFullySelected = selState === 'all';
                  const isPartiallySelected = selState === 'partial';
                  const isNoneSelected = selState === 'none';
                  const isExpanded = expandedModalActivityIds.includes(act.id);
                  const selectedSubtasksCount = isFullySelected ? subtasks.length : isPartiallySelected && Array.isArray(pinnedSubtaskMap[act.id]) ? (pinnedSubtaskMap[act.id] as string[]).length : 0;

                  return (
                    <div
                      key={act.id}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        isFullySelected
                          ? 'bg-blue-50/70 dark:bg-blue-950/30 border-[#0B5FFF] shadow-xs'
                          : isPartiallySelected
                          ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-400 dark:border-amber-700 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      {/* Activity Row Header */}
                      <div className="p-3 sm:p-3.5 flex items-start gap-3 justify-between">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {/* Master Activity Checkbox */}
                          <button
                            type="button"
                            onClick={() => handleToggleActivity(act.id)}
                            className="mt-0.5 shrink-0 transition-transform active:scale-95"
                            title={isFullySelected ? "Unpin Activity" : "Pin Entire Activity"}
                          >
                            {isFullySelected ? (
                              <div className="w-4 h-4 rounded bg-[#0B5FFF] flex items-center justify-center text-white">
                                <Check className="h-3 w-3 stroke-[3]" />
                              </div>
                            ) : isPartiallySelected ? (
                              <div className="w-4 h-4 rounded bg-amber-500 flex items-center justify-center text-white">
                                <Minus className="h-3 w-3 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-xs text-[#0B5FFF]">{act.id}</span>
                              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">{act.name}</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600">
                                {act.discipline || 'General'}
                              </span>
                              {act.sectionSpan && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                                  Span: {act.sectionSpan}
                                </span>
                              )}
                            </div>

                            {/* Status & Subtask Counts Summary */}
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                              <span>Progress: <strong className="text-slate-700 dark:text-slate-200">{act.progress || 0}%</strong></span>
                              <span>•</span>
                              {subtasks.length > 0 ? (
                                isFullySelected ? (
                                  <span className="text-[#0B5FFF] font-bold">
                                    All {subtasks.length} Subtasks Selected
                                  </span>
                                ) : isPartiallySelected ? (
                                  <span className="text-amber-700 dark:text-amber-400 font-bold">
                                    {selectedSubtasksCount} of {subtasks.length} Subtasks Selected
                                  </span>
                                ) : (
                                  <span>{subtasks.length} Subtasks available</span>
                                )
                              ) : (
                                <span>Standard Activity (No subtasks)</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Expand Chevron & Quick Subtask Selectors */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {subtasks.length > 0 && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSelectAllSubtasksForActivity(act.id)}
                                className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100/70 hover:bg-blue-200 text-[#0B5FFF] transition-colors"
                              >
                                All
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => handleClearActivitySelection(act.id)}
                                className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                              >
                                Clear
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleModalActivityExpand(act.id)}
                                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors flex items-center gap-0.5 text-xs font-semibold"
                                title={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
                              >
                                <span className="text-[10px]">{subtasks.length}</span>
                                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Expandable Subtask Selection Matrix */}
                      {isExpanded && subtasks.length > 0 && (
                        <div className="p-3 bg-white/80 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 space-y-1.5 animate-in fade-in">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 pb-1">
                            Individual Subtasks Selection:
                          </div>
                          <div className="space-y-1.5">
                            {subtasks.map((st, sIdx) => {
                              const isSubPinned = isSubtaskPinned(act.id, st.id);
                              const progNum = getSubtaskProgressionNumber(subtasks, sIdx);
                              const isSearchMatch = pinModalSearch && (st.title.toLowerCase().includes(pinModalSearch.toLowerCase()) || st.category.toLowerCase().includes(pinModalSearch.toLowerCase()));

                              return (
                                <label
                                  key={st.id}
                                  className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                    isSubPinned
                                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 font-bold text-blue-950 dark:text-blue-100 shadow-2xs'
                                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                                  } ${isSearchMatch ? 'ring-1 ring-amber-400 bg-amber-50/50 dark:bg-amber-950/40' : ''}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSubPinned}
                                    onChange={() => handleToggleSubtaskSelection(act.id, st.id)}
                                    className="rounded text-[#0B5FFF] focus:ring-[#0B5FFF] h-3.5 w-3.5"
                                  />
                                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                                    {progNum}
                                  </span>
                                  <span className="truncate flex-1">{st.title}</span>
                                  <span className="text-[10px] font-medium text-slate-400 shrink-0">
                                    {st.targetQuantity ? `${st.targetQuantity} ${st.unit}` : st.category}
                                  </span>
                                  {st.isHoldPoint && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 shrink-0">
                                      🔒 QA Hold
                                    </span>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex justify-between items-center shrink-0">
              <div className="text-xs text-slate-500 font-medium">
                <strong>{pinnedActivities.length}</strong> activities • <strong>{allPinnedSubtasks.length}</strong> active subtasks selected
              </div>
              <Button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="rounded-xl text-xs bg-[#0B5FFF] hover:bg-blue-600 text-white px-5 font-bold"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal: QA Hold Point Sign-Off */}
      {signingOffSubtask && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSigningOffSubtask(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">QA Quality Gate Verification</h3>
                <p className="text-xs text-slate-500">Sign off mandatory hold point to clear subsequent tasks</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs space-y-1">
              <p className="font-bold text-rose-900 dark:text-rose-200">Subtask: {signingOffSubtask.subtask.title}</p>
              <p className="text-rose-700 dark:text-rose-300 text-[11px]">
                {signingOffSubtask.subtask.milestoneCriteria || 'Formal inspection and testing clearance required.'}
              </p>
            </div>

            <form onSubmit={handleConfirmQaSignOff} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Inspector / Quality Engineer Name *</label>
                <input
                  type="text"
                  required
                  value={qaInspectorName}
                  onChange={e => setQaInspectorName(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Inspection Findings / Compliance Remarks</label>
                <textarea
                  rows={3}
                  value={qaNotes}
                  onChange={e => setQaNotes(e.target.value)}
                  placeholder="e.g. Bedding depth checked, compaction > 98%, approved to proceed with backfill."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSigningOffSubtask(null)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white gap-1.5"
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Approve & Clear Gate
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Shift PDF Report Builder & Print Engine Modal */}
      {isPdfModalOpen && (
        <ActivitiesPdfModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          activities={activities}
          projects={projects}
          currentUserProfile={currentUserProfile}
          initialTemplate="daily_shift"
          initialDate={selectedDate}
          pinnedSubtaskMap={pinnedSubtaskMap}
          defaultFilterLabel={`Daily Shift: ${formattedDateHeader}`}
        />
      )}
    </div>
  );
}
